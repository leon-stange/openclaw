#!/usr/bin/env python3
"""Run interactively on the OpenClaw server; never puts the password in argv."""
import datetime
import getpass
import json
import os
from pathlib import Path
import shutil
import subprocess

os.umask(0o077)
root = Path.home() / '.local/share/jarvis-einkaufsplaner'
if not (root / 'openclaw.plugin.json').is_file():
    raise SystemExit('Plugin-Dateien fehlen.')
password_file = root / 'password'
password = getpass.getpass('Passwort des Einkaufs-App-Kontos Jarvis: ')
if not password or '\n' in password or '\r' in password:
    raise SystemExit('Passwort fehlt oder enthält einen Zeilenumbruch.')
password_file.write_text(password, encoding='utf8')
password_file.chmod(0o600)
del password

# The probe logs in and only reads the default list, before any config change.
subprocess.run(['node', str(root / 'probe.mjs')], cwd=root, check=True)
config_file = Path.home() / '.openclaw/openclaw.json'
config = json.loads(config_file.read_text())
paths = config.get('plugins', {}).get('load', {}).get('paths', [])
if not isinstance(paths, list) or not all(isinstance(x, str) for x in paths):
    raise SystemExit('Unerwartete Plugin-Pfade; Konfiguration nicht geändert.')
if str(root) not in paths:
    paths = paths + [str(root)]
entry = config.get('plugins', {}).get('entries', {}).get('einkaufsplaner', {})
entry = {**entry, 'enabled': True, 'config': {
    **entry.get('config', {}),
    'passwordFile': str(password_file), 'stateDir': str(root / 'state'),
}}
batch = [
    {'path': 'plugins.load.paths', 'value': paths},
    {'path': 'plugins.entries.einkaufsplaner', 'value': entry},
]
stamp = datetime.datetime.now(datetime.UTC).strftime('%Y%m%dT%H%M%SZ')
backup = config_file.with_name('openclaw.json.vor-einkaufsplaner-' + stamp)
shutil.copy2(config_file, backup)
backup.chmod(0o600)
env = os.environ.copy()
# Preserve the existing secret environment references during config validation.
pid = subprocess.check_output(['systemctl', '--user', 'show', 'openclaw-gateway.service', '-p', 'MainPID', '--value'], text=True).strip()
if pid.isdigit() and pid != '0':
    for item in Path('/proc/' + pid + '/environ').read_bytes().split(b'\0'):
        if item.startswith((b'ELEVENLABS_API_KEY=', b'XI_API_KEY=')):
            key, value = item.split(b'=', 1)
            env[key.decode()] = value.decode()
cli = str(Path.home() / '.npm-global/bin/openclaw')
args = [cli, 'config', 'set', '--batch-json', json.dumps(batch)]
subprocess.run(args + ['--dry-run'], env=env, check=True)
subprocess.run(args, env=env, check=True)
subprocess.run([cli, 'config', 'validate'], env=env, check=True)
subprocess.run(['systemctl', '--user', 'restart', 'openclaw-gateway.service'], check=True)
subprocess.run(['systemctl', '--user', 'is-active', 'openclaw-gateway.service'], check=True)
print('Plugin aktiviert. Vor dem WhatsApp-Test Gateway-Bereitschaft abwarten.')
print('Sicherung:', backup)
