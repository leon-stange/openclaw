#!/usr/bin/env node
// Prepares a validated OpenClaw batch; never writes the live config itself.
import { promises as fs } from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export function buildBatch(config, home) {
  const voice = config.tts?.providers?.elevenlabs?.speakerVoiceId;
  if (typeof voice !== 'string' || !voice.trim()) {
    throw new Error('Die vorhandene ElevenLabs-Stimme fehlt. Erst die aktive Konfiguration prüfen.');
  }
  const models = config.tools?.media?.models ?? [];
  if (!Array.isArray(models)) throw new Error('Unerwartete Medienkonfiguration.');
  const localDirectory = path.posix.join(home, '.local/share/jarvis-stt');
  const preserved = [];
  for (const model of models) {
    // An entry without capabilities could also apply to audio. Do not silently replace it.
    if (!Array.isArray(model.capabilities)) {
      throw new Error('Medienmodell ohne eindeutige Fähigkeiten: erst gezielt prüfen.');
    }
    if (!model.capabilities.includes('audio')) { preserved.push(model); continue; }
    const ourWhisper = model.type === 'cli' &&
      model.command === path.posix.join(localDirectory, 'venv/bin/python') &&
      model.args?.[0] === path.posix.join(localDirectory, 'transcribe-local.py');
    const ourCloud = model.provider === 'elevenlabs' && model.model === 'scribe_v2';
    if ((!ourWhisper && !ourCloud) || model.capabilities.length !== 1) {
      throw new Error('Unbekanntes Audio-Modell vorhanden: vor dem Ersetzen prüfen.');
    }
  }
  if (config.plugins?.enabled === false || config.plugins?.deny?.includes('elevenlabs')) {
    throw new Error('Plugin-Policy blockiert ElevenLabs. Vor der Umstellung prüfen.');
  }
  const batch = [
    { path: 'tools.media.models', value: [...preserved, {
      provider: 'elevenlabs', model: 'scribe_v2', capabilities: ['audio'], timeoutSeconds: 60,
    }] },
    { path: 'tools.media.audio.enabled', value: true },
    { path: 'tools.media.audio.echoTranscript', value: false },
    { path: 'tools.media.concurrency', value: 1 },
    { path: 'tts.auto', value: 'tagged' },
    { path: 'tts.mode', value: 'final' },
    { path: 'tts.provider', value: 'elevenlabs' },
    { path: 'tts.providers.elevenlabs.apiKey', value: '${ELEVENLABS_API_KEY}' },
    { path: 'tts.providers.elevenlabs.modelId', value: 'eleven_multilingual_v2' },
    { path: 'tts.providers.elevenlabs.speakerVoiceId', value: voice },
    { path: 'tts.providers.elevenlabs.languageCode', value: 'de' },
    { path: 'plugins.entries.elevenlabs.enabled', value: true },
  ];
  if (Array.isArray(config.plugins?.allow) && !config.plugins.allow.includes('elevenlabs')) {
    batch.push({ path: 'plugins.allow', value: [...config.plugins.allow, 'elevenlabs'] });
  }
  return batch;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    const home = os.homedir();
    const config = JSON.parse(await fs.readFile(path.join(home, '.openclaw/openclaw.json'), 'utf8'));
    const target = path.join(home, '.local/share/jarvis-elevenlabs/voice-settings.batch.json');
    await fs.mkdir(path.dirname(target), { recursive: true, mode: 0o700 });
    await fs.writeFile(target, JSON.stringify(buildBatch(config, home), null, 2) + '\n', { mode: 0o600 });
    await fs.chmod(target, 0o600);
    console.log('ElevenLabs-Batch vorbereitet. OpenClaw noch nicht verändert.');
  } catch {
    console.error('Vorbereitung fehlgeschlagen. Aktive JSON-Konfiguration, Stimme und Medien-/Plugin-Policy prüfen.');
    process.exitCode = 1;
  }
}
