#!/usr/bin/env node
// Generates changes for OpenClaw's validated config CLI; does not edit openclaw.json.
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function buildBatch(config, directory) {
  if (config.tools?.media?.models?.length) {
    throw new Error('Es gibt bereits konfigurierte Medienmodelle. Vor dem Ersetzen gezielt prüfen.');
  }
  const voice = config.tts?.providers?.elevenlabs?.speakerVoiceId;
  if (config.tts?.provider !== 'elevenlabs' || typeof voice !== 'string' || !voice.trim()) {
    throw new Error('Die vorhandene ElevenLabs-Stimme ist nicht wie erwartet konfiguriert.');
  }
  return [
    { path: 'tools.media.models', value: [{
      type: 'cli', capabilities: ['audio'],
      command: path.join(directory, 'venv/bin/python'),
      args: [path.join(directory, 'transcribe-local.py'), '--model-dir',
        path.join(directory, 'model'), '--threads', '2', '{{AttachmentPath}}'],
      timeoutSeconds: 300,
    }] },
    { path: 'tools.media.audio.enabled', value: true },
    { path: 'tools.media.audio.echoTranscript', value: false },
    { path: 'tools.media.concurrency', value: 1 },
    { path: 'tts.auto', value: 'inbound' },
    { path: 'tts.mode', value: 'final' },
    { path: 'tts.provider', value: 'elevenlabs' },
    { path: 'tts.providers.elevenlabs.modelId', value: 'eleven_multilingual_v2' },
    { path: 'tts.providers.elevenlabs.speakerVoiceId', value: voice },
    { path: 'tts.providers.elevenlabs.languageCode', value: 'de' },
  ];
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const directory = path.join(os.homedir(), '.local/share/jarvis-stt');
    for (const relative of ['venv/bin/python', 'transcribe-local.py',
      'model/model.bin', 'model/config.json', 'model/tokenizer.json']) {
      await fs.access(path.join(directory, relative));
    }
    const config = JSON.parse(await fs.readFile(path.join(os.homedir(), '.openclaw/openclaw.json'), 'utf8'));
    const batch = buildBatch(config, directory);
    await fs.writeFile(path.join(directory, 'voice-settings.batch.json'),
      JSON.stringify(batch, null, 2) + '\n', { mode: 0o600 });
    console.log('Sprach-Konfigurationsdatei erstellt. OpenClaw noch nicht verändert.');
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Sprach-Konfigurationsdatei konnte nicht erstellt werden.');
    process.exitCode = 1;
  }
}
