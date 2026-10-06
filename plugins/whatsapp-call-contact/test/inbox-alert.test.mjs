import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';

// Intercept only the outbound SDK boundary; no real message or network request.
registerHooks({ resolve(spec, ctx, next) {
  if (spec === 'openclaw/plugin-sdk/channel-outbound') return {
    url: 'data:text/javascript,export const sendDurableMessageBatch=(p)=>globalThis.inboxTestSend(p)', shortCircuit: true,
  };
  return next(spec, ctx);
} });
const { default: entry, decideInboxAlert } = await import('../dist/index.js');

test('threshold cycle: one alert above seven, rearm strictly below seven', () => {
  let state = { version: 1, armed: true };
  const alerts = [];
  for (const count of [6, 7, 8, 9, 7, 8, 6, 7, 8, 15]) {
    const next = decideInboxAlert(state, count);
    state = next.state;
    alerts.push(next.alert);
  }
  assert.deepEqual(alerts, [false, false, true, false, false, false, false, false, true, false]);
  assert.equal(JSON.parse(JSON.stringify(state)).armed, false);
});

test('invalid counter or persisted state does not silently rearm', () => {
  for (const count of [-1, NaN, 1.5]) assert.throws(() => decideInboxAlert({ version: 1, armed: false }, count));
  assert.throws(() => decideInboxAlert({ version: 2, armed: true }, 8));
  assert.throws(() => decideInboxAlert({ version: 1 }, 8));
});

test('registered tool: persistent gate, missed-call audio, CAS and dry-run', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'inbox-alert-test-'));
  const savedHome = process.env.HOME, savedKey = process.env.ELEVENLABS_API_KEY, savedFetch = globalThis.fetch, savedPath = process.env.PATH;
  process.env.HOME = root; process.env.ELEVENLABS_API_KEY = 'fixture'; process.env.PATH = root + path.delimiter + savedPath;
  try {
    await mkdir(path.join(root, '.openclaw/credentials/whatsapp-calls/default'), { recursive: true });
    await writeFile(path.join(root, '.openclaw/credentials/whatsapp-calls/default/wa-voip.db'), '');
    const caller = path.join(root, 'caller');
    const callsPath = path.join(root, 'calls');
    await writeFile(caller, `#!/bin/sh\nprintf x >> '${callsPath}'\nprintf '%s\\n' 'recipient did not answer within 45s' >&2\nexit 1\n`, { mode: 0o700 });
    const mp3 = path.join(root, 'sample.mp3');
    execFileSync('ffmpeg', ['-nostdin', '-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=0.1', '-c:a', 'libmp3lame', mp3]);
    const scratchPath = path.join(root, 'scratch.json');
    const fakeCli = `#!${process.execPath}\n` + `
      const fs = require('node:fs'), root = process.env.HOME, args = process.argv.slice(2);
      if (args[0] !== 'automations' || args[1] !== 'scratch' || args[2] !== '19bcc650-d420-44e6-91ff-8cbc43bec279') process.exit(2);
      if (fs.existsSync(root + '/fail-read')) process.exit(1);
      const file = root + '/scratch.json'; let state = fs.existsSync(file) ? JSON.parse(fs.readFileSync(file)) : { currentRevision: 0 };
      if (args.includes('--set')) {
        if (fs.existsSync(root + '/conflict') || Number(args[args.indexOf('--expected-revision')+1]) !== state.currentRevision) process.exit(1);
        state = { currentRevision: state.currentRevision+1, scratch: { content: args[args.indexOf('--set')+1] }, ok: true };
        fs.writeFileSync(file, JSON.stringify(state));
      }
      console.log('OpenClaw fixture'); console.log(JSON.stringify(state));
    `;
    await writeFile(path.join(root, 'openclaw'), fakeCli, { mode: 0o700 });
    const bytes = await readFile(mp3); let tts = 0, sends = 0;
    globalThis.fetch = async () => { tts++; return { ok: true, arrayBuffer: async () => bytes }; };
    globalThis.inboxTestSend = async p => {
      sends++;
      assert.equal(p.to, '+491234567890');
      assert.equal(p.payloads[0].audioAsVoice, true);
      assert.equal(p.payloads[0].text, undefined);
      assert.equal((await readFile(p.payloads[0].mediaUrl)).toString('ascii', 0, 4), 'OggS');
      assert.match(p.deliveryIntentId, /^inbox-alert-voice:/);
      return { status: 'sent', receipt: { primaryPlatformMessageId: `fixture-${sends}` } };
    };
    const id = '19bcc650-d420-44e6-91ff-8cbc43bec279';
    const factories = [];
    const api = { config: {}, pluginConfig: {
      authorizedCaller: '+491234567890', contacts: [{ name: 'Leon', phone: '+491234567890' }],
      voiceId: 'fixture', meowcallerPath: caller, inboxAlert: { automationId: id },
    }, registerTool: f => factories.push(f) };
    entry.register(api);
    const context = { agentId: 'main', sessionKey: `agent:main:cron:${id}`, assertInvocationCurrent() {} };
    const get = ctx => factories.flatMap(f => f(ctx) ?? []).find(t => t.name === 'whatsapp_check_unread_mail_alert');
    assert.equal(get({ agentId: 'main', sessionKey: 'agent:main:main', senderIsOwner: true, messageChannel: 'whatsapp' }), undefined);
    assert.equal(get({ ...context, agentId: 'other' }), undefined);
    assert.equal(get({ ...context, sessionKey: context.sessionKey + '-wrong' }), undefined);
    const latest = [{ from: 'A', subject: 'One' }, { from: 'B', subject: 'Two' }];
    let tool = get(context);
    for (const n of [8, 9, 7, 8, 6, 8]) await tool.execute('fixture', { unreadCount: n, latest });
    assert.equal(tts, 2); assert.equal(sends, 2); assert.equal(await readFile(callsPath, 'utf8'), 'xx');
    // A new factory (like after restart) reads the same scratch: still suppressed.
    await get(context).execute('after-restart', { unreadCount: 10, latest });
    assert.equal(sends, 2);
    await tool.execute('rearm', { unreadCount: 0, latest: [] });
    await writeFile(path.join(root, 'conflict'), '');
    await assert.rejects(tool.execute('conflict', { unreadCount: 8, latest }), /Scratch/);
    assert.equal(sends, 2); await rm(path.join(root, 'conflict'));
    await writeFile(path.join(root, 'fail-read'), '');
    await assert.rejects(tool.execute('failed-read', { unreadCount: 8, latest }), /Scratch/);
    assert.equal(sends, 2); await rm(path.join(root, 'fail-read'));
    api.pluginConfig.inboxAlert.dryRun = true;
    const before = await readFile(scratchPath, 'utf8');
    const preview = await get(context).execute('preview', { unreadCount: 8, latest });
    assert.equal(preview.details.wouldAlert, true);
    assert.equal(await readFile(scratchPath, 'utf8'), before); assert.equal(sends, 2);
  } finally {
    if (savedHome === undefined) delete process.env.HOME; else process.env.HOME = savedHome;
    if (savedKey === undefined) delete process.env.ELEVENLABS_API_KEY; else process.env.ELEVENLABS_API_KEY = savedKey;
    globalThis.fetch = savedFetch;
    process.env.PATH = savedPath;
    await rm(root, { recursive: true, force: true });
  }
});
