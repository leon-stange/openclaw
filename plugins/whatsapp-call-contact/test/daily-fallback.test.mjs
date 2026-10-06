import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, readFile, readdir, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { callWithAudioFallback, runMeowCaller } from '../dist/index.js';

// Fake CLI processes only: no WhatsApp, ElevenLabs or calendar access.
async function fakeCall(stderr, exitCode, run) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'briefing-fallback-test-'));
  const executable = path.join(dir, 'caller');
  await writeFile(executable, `#!/bin/sh\nprintf '%s\\n' '${stderr}' >&2\nexit ${exitCode}\n`, { mode: 0o700 });
  const audioPath = path.join(dir, 'original.mp3');
  const savedHome = process.env.HOME;
  process.env.HOME = dir;
  try {
    await run(() => runMeowCaller({ executable, storePath: '/unused', target: 'unused', audioPath }), audioPath, dir);
  } finally {
    if (savedHome === undefined) delete process.env.HOME; else process.env.HOME = savedHome;
    await rm(dir, { recursive: true, force: true });
  }
}

test('answered call does not send fallback', async () => {
  await fakeCall('', 0, async (call) => {
    const result = await callWithAudioFallback({ call, sendAudio: () => { assert.fail('unexpected send'); } });
    assert.deepEqual(result, { called: true });
  });
});

test('diagnostic retains phases and failure reason even after successful fallback', async () => {
  const stderr = '{"jarvis_call_event":"connected","time":"2026-10-06T17:00:00Z","token":"must-not-be-saved"}\n' +
    '{"jarvis_call_event":"call_placed","time":"2026-10-06T17:00:01Z"}\ncall ended before playback: remote';
  await fakeCall(stderr, 1, async (call, _, dir) => {
    await callWithAudioFallback({ call, fallbackOnCallError: true, sendAudio: async () => 'test-message' });
    const root = path.join(dir, '.openclaw/state/call-diagnostics');
    const names = await readdir(root); assert.equal(names.length, 1);
    const raw = await readFile(path.join(root, names[0]), 'utf8');
    const d = JSON.parse(raw);
    assert.equal(d.reason, 'call ended before playback: remote');
    assert.deepEqual(d.phases.map(x=>x.phase), ['connected','call_placed']);
    assert.equal(d.exitCode,1); assert.equal(raw.includes('must-not-be-saved'),false);
    assert.equal(raw.includes('/unused'),false); assert.equal(raw.includes('"target":'),false);
  });
});

test('45-second no-answer result sends exactly one fallback', async () => {
  await fakeCall('recipient did not answer within 45s', 1, async (call) => {
    let sends = 0;
    const result = await callWithAudioFallback({ call, sendAudio: async () => { sends++; return 'platform-id'; } });
    assert.equal(sends, 1);
    assert.deepEqual(result, { called: false, fallbackMessageId: 'platform-id' });
  });
});

for (const error of ['timed out waiting for WhatsApp connection', 'call ended during playback: remote', 'audio playback failed: decoder', 'call ended before playback: unknown']) {
  test(`does not misclassify: ${error}`, async () => {
    await fakeCall(error, 1, async (call) => {
      await assert.rejects(callWithAudioFallback({ call, sendAudio: () => { assert.fail('unexpected send'); } }));
    });
  });
}

test('failed fallback is reported without retrying the call or send', async () => {
  await fakeCall('recipient did not answer within 45s', 1, async (call) => {
    let calls = 0, sends = 0;
    await assert.rejects(callWithAudioFallback({
      call: async () => { calls++; await call(); },
      sendAudio: async () => { sends++; throw new Error('send failed'); },
    }), /send failed/);
    assert.equal(calls, 1);
    assert.equal(sends, 1);
  });
});

test('cancelled turn sends no fallback', async () => {
  await fakeCall('recipient did not answer within 45s', 1, async (call) => {
    const controller = new AbortController();
    controller.abort();
    await assert.rejects(callWithAudioFallback({ call, signal: controller.signal, sendAudio: () => { assert.fail('unexpected send'); } }));
  });
});
