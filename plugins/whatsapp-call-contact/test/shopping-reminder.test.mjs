import test from 'node:test';
import assert from 'node:assert/strict';
import { registerHooks } from 'node:module';
import { mkdtemp, mkdir, writeFile, readFile, rm } from 'node:fs/promises';
import { execFileSync } from 'node:child_process';
import os from 'node:os';
import path from 'node:path';
registerHooks({ resolve(spec, ctx, next) {
  if (spec === 'openclaw/plugin-sdk/channel-outbound') return {
    url: 'data:text/javascript,export const sendDurableMessageBatch=(p)=>globalThis.shoppingTestSend(p)', shortCircuit: true,
  };
  return next(spec, ctx);
} });
const { default: entry, shoppingReminderMessage, shoppingReminderPeriod } = await import('../dist/index.js');
const id = '6e6d41db-2988-4b6c-9bff-b5322527cbd2';
test('personal greetings and Thursday cycle including Berlin date boundary', () => {
  assert.match(shoppingReminderMessage('Leon', 9), /^Hallo Leon, Jarvis hier\./);
  assert.match(shoppingReminderMessage('Annka', 9), /^Hallo Annka, JARVIS hier\./);
  assert.equal(shoppingReminderPeriod(new Date('2026-10-08T14:00:00Z')), '2026-10-08');
  assert.equal(shoppingReminderPeriod(new Date('2026-10-07T22:05:00Z')), '2026-10-08');
  assert.equal(shoppingReminderPeriod(new Date('2026-10-07T10:00:00Z')), '2026-10-01');
  assert.equal(shoppingReminderPeriod(new Date('2026-10-15T14:00:00Z')), '2026-10-15');
  assert.equal(shoppingReminderPeriod(new Date('2026-10-29T15:00:00Z')), '2026-10-29');
});
test('threshold, separate failed-call audio, weekly deduplication, CAS and preview', async () => {
  const root = await mkdtemp(path.join(os.tmpdir(), 'shopping-reminder-test-'));
  const saved = { home: process.env.HOME, key: process.env.ELEVENLABS_API_KEY, fetch: globalThis.fetch, path: process.env.PATH };
  process.env.HOME = root; process.env.ELEVENLABS_API_KEY = 'fixture'; process.env.PATH = root + path.delimiter + saved.path;
  try {
    await mkdir(path.join(root, '.openclaw/credentials/whatsapp-calls/default'), { recursive: true });
    await writeFile(path.join(root, '.openclaw/credentials/whatsapp-calls/default/wa-voip.db'), '');
    const caller = path.join(root, 'caller');
    await writeFile(caller, "#!/bin/sh\nprintf '%s\\n' 'Client outdated (405)' >&2\nexit 1\n", { mode: 0o700 });
    const sample = path.join(root, 'sample.mp3');
    execFileSync('ffmpeg', ['-nostdin', '-hide_banner', '-loglevel', 'error', '-f', 'lavfi', '-i', 'sine=frequency=440:duration=0.1', '-c:a', 'libmp3lame', sample]);
    await writeFile(path.join(root, 'openclaw'), `#!${process.execPath}\n` + `
      const fs=require('node:fs'), a=process.argv.slice(2), file=process.env.HOME+'/scratch.json';
      if(a[2]!=='${id}') process.exit(2);
      let s=fs.existsSync(file)?JSON.parse(fs.readFileSync(file)):{currentRevision:0};
      if(a.includes('--set')) {
        if(fs.existsSync(process.env.HOME+'/conflict') || Number(a[a.indexOf('--expected-revision')+1])!==s.currentRevision) process.exit(1);
        s={ok:true,currentRevision:s.currentRevision+1,scratch:{content:a[a.indexOf('--set')+1]}}; fs.writeFileSync(file,JSON.stringify(s));
      }
      console.log(JSON.stringify(s));
    `, { mode: 0o700 });
    const bytes = await readFile(sample), texts = [], sends = [];
    globalThis.fetch = async (_, opts) => { texts.push(JSON.parse(opts.body).text); return { ok: true, arrayBuffer: async () => bytes }; };
    globalThis.shoppingTestSend = async p => {
      sends.push(p); assert.equal(p.payloads[0].audioAsVoice, true);
      assert.match(p.deliveryIntentId, /^shopping-reminder-voice:/);
      assert.equal((await readFile(p.payloads[0].mediaUrl)).toString('ascii',0,4), 'OggS');
      return { status: 'sent', receipt: { primaryPlatformMessageId: 'test-'+sends.length } };
    };
    const factories = [], cfg = { authorizedCaller: '+491234567890', contacts: [{ name: 'Annka', phone: '+491234567891' }], voiceId: 'fixture', meowcallerPath: caller, shoppingReminder: { automationId: id } };
    entry.register({ config: {}, pluginConfig: cfg, registerTool: f => factories.push(f) });
    const ctx = { agentId: 'main', sessionKey: `agent:main:cron:${id}`, assertInvocationCurrent() {} };
    const get = c => factories.flatMap(f => f(c) ?? []).find(t => t.name === 'whatsapp_weekly_shopping_reminder');
    assert.equal(get({ ...ctx, sessionKey: ctx.sessionKey+'-wrong' }), undefined);
    assert.equal(get({ ...ctx, agentId: 'other' }), undefined);
    await get(ctx).execute('ten', { openCount: 10 }); assert.equal(sends.length,0);
    await get(ctx).execute('nine', { openCount: 9 });
    assert.equal(sends.length,2); assert.deepEqual(sends.map(x=>x.to), ['+491234567890','+491234567891']);
    assert.notEqual(texts[0],texts[1]); assert.match(texts[0],/^Hallo Leon/); assert.match(texts[1],/^Hallo Annka/);
    await get(ctx).execute('again', { openCount: 0 }); assert.equal(sends.length,2);
    const file=path.join(root,'scratch.json'), scratch=JSON.parse(await readFile(file,'utf8'));
    const state=JSON.parse(scratch.scratch.content); state.attemptedPeriod='previous-week'; scratch.scratch.content=JSON.stringify(state);
    await writeFile(file,JSON.stringify(scratch)); cfg.shoppingReminder.dryRun=true;
    assert.equal((await get(ctx).execute('preview',{openCount:0})).details.wouldAlert,true); assert.equal(sends.length,2);
    cfg.shoppingReminder.dryRun=false; await writeFile(path.join(root,'conflict'),'');
    await assert.rejects(get(ctx).execute('conflict',{openCount:0}), /Scratch/); assert.equal(sends.length,2);
    await rm(path.join(root,'conflict')); await get(ctx).execute('next-week',{openCount:0}); assert.equal(sends.length,4);
  } finally {
    if(saved.home===undefined) delete process.env.HOME; else process.env.HOME=saved.home;
    if(saved.key===undefined) delete process.env.ELEVENLABS_API_KEY; else process.env.ELEVENLABS_API_KEY=saved.key;
    process.env.PATH=saved.path; globalThis.fetch=saved.fetch; await rm(root,{recursive:true,force:true});
  }
});
