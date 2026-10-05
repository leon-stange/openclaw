import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { callWithAudioFallback, runMeowCaller } from '../dist/index.js';

// Fake CLI processes only: no WhatsApp, ElevenLabs or calendar access.
async function fakeCall(stderr, exitCode, run) {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'briefing-fallback-test-'));
  const executable = path.join(dir, 'caller');
  await writeFile(executable, `#!/bin/sh\nprintf '%s\\n' '${stderr}' >&2\nexit ${exitCode}\n`, { mode: 0o700 });
  const audioPath = path.join(dir, 'original.mp3');
  try {
    await run(() => runMeowCaller({ executable, storePath: '/unused', target: 'unused', audioPath }), audioPath);
  } finally {
    await rm(dir, { recursive: true, force: true });
  }
}

test('answered call does not send fallback', async () => {
  await fakeCall('', 0, async (call) => {
    const result = await callWithAudioFallback({ call, sendAudio: () => { assert.fail('unexpected send'); } });
    assert.deepEqual(result, { called: true });
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
