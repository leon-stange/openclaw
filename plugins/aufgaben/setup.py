"""Run on the authorized Ubuntu server after plugin validation. No private IDs logged."""
import json
import os
import shutil
import subprocess
from datetime import datetime, timezone
from pathlib import Path

os.umask(0o077)
ROOT = Path.home() / '.local/share/jarvis-aufgaben'
CLI = str(Path.home() / '.npm-global/bin/openclaw')
CONFIG = Path.home() / '.openclaw/openclaw.json'
KEY = 'jarvis:task-call-reminders'


def run(args):
    return subprocess.run([CLI, *args], capture_output=True, text=True, check=True).stdout


def data(args):
    value = run(args)
    return json.loads(value[value.index('{'):])


if __name__ == '__main__':
    # Preserve environment-only secrets during CLI config validation.
    pid = subprocess.check_output(['systemctl', '--user', 'show', 'openclaw-gateway.service', '-p', 'MainPID', '--value'], text=True).strip()
    if pid.isdigit() and pid != '0':
        for item in Path('/proc/' + pid + '/environ').read_bytes().split(b'\0'):
            if item.startswith((b'ELEVENLABS_API_KEY=', b'XI_API_KEY=')):
                k, v = item.split(b'=', 1)
                os.environ[k.decode()] = v.decode()
    cfg = json.loads(CONFIG.read_text())
    jobs = data(['automations', 'list', '--json'])['jobs']
    if any(j.get('declarationKey') == KEY for j in jobs):
        raise SystemExit('Aufgabenautomation bereits vorhanden; nicht ueberschrieben.')
    if any(j.get('state', {}).get('runningAtMs') for j in jobs):
        raise SystemExit('Automation gerade aktiv; Einrichtung spaeter wiederholen.')
    call = cfg['plugins']['entries']['whatsapp-call-contact']['config']
    annkas = [c for c in call['contacts'] if c['name'].lower() == 'annka']
    if len(annkas) != 1:
        raise SystemExit('Annka nicht eindeutig als Kontakt konfiguriert.')
    users = [('leon', 'Leon', call['authorizedCaller']), ('annka', 'Annka', annkas[0]['phone'])]
    members = []
    for ident, name, phone in users:
        digits = phone.lstrip('+')
        ids = {phone, digits, digits + '@s.whatsapp.net', 'whatsapp:' + phone}
        mappings = list((Path.home() / '.openclaw/credentials').rglob('lid-mapping-' + digits + '.json'))
        if len(mappings) != 1:
            raise SystemExit('Vertrauenswuerdige LID-Zuordnung nicht eindeutig; keine Einrichtung.')
        lid = json.loads(mappings[0].read_text())
        if not isinstance(lid, str) or not lid.removesuffix('@lid').isdigit():
            raise SystemExit('Unerwartete LID-Zuordnung.')
        ids.update([lid, lid.removesuffix('@lid'), lid.removesuffix('@lid') + '@lid'])
        members.append({'id': ident, 'name': name, 'phone': phone, 'senderIds': sorted(ids)})
    if set(members[0]['senderIds']) & set(members[1]['senderIds']):
        raise SystemExit('Identitaeten ueberschneiden sich; keine Einrichtung.')
    # Reject configured identity links that would merge these two people's histories.
    for values in cfg.get('session', {}).get('identityLinks', {}).values():
        if any(x in values for x in members[0]['senderIds']) and any(x in values for x in members[1]['senderIds']):
            raise SystemExit('Identitaetsverknuepfung verbindet beide Personen; vor Einrichtung trennen.')
    backup = Path.home() / '.local/share/jarvis-repairs' / ('tasks-setup-' + datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%SZ'))
    backup.mkdir(mode=0o700)
    for name, value in [('openclaw.json', cfg), ('automations.json', jobs)]:
        (backup / name).write_text(json.dumps(value))
        (backup / name).chmod(0o600)
    created = data(['automations', 'add', '--name', 'task-call-reminders', '--display-name', 'Aufgaben: faellige Anruf-Erinnerungen',
        '--declaration-key', KEY, '--agent', 'main', '--session', 'isolated', '--cron', '* * * * *', '--tz', 'Europe/Berlin',
        '--exact', '--disabled', '--no-deliver', '--script', str(ROOT / 'dispatch.js'),
        '--script-timeout-seconds', '240', '--script-tool-budget', '1', '--tools', 'aufgaben_erinnerungen_pruefen', '--json'])
    job_id = created.get('id') or created.get('job', {}).get('id')
    if not job_id:
        raise SystemExit('Neue Automation ohne bekannte ID; bleibt deaktiviert.')
    paths = cfg.get('plugins', {}).get('load', {}).get('paths', [])
    allow = cfg.get('plugins', {}).get('allow', [])
    if not isinstance(paths, list) or not isinstance(allow, list):
        raise SystemExit('Unerwartete Pluginlisten; keine Konfigurationsaenderung.')
    plugin_config = {'stateDir': str(ROOT / 'state'), 'callModule': str(Path.home() / 'openclaw-whatsapp-call-contact-v0.1.2-ubuntu/dist/index.js'),
                     'automationId': job_id, 'members': members, 'dryRun': True}
    changes = [
        {'path': 'plugins.load.paths', 'value': paths if str(ROOT) in paths else paths + [str(ROOT)]},
        {'path': 'plugins.allow', 'value': allow if 'aufgaben' in allow else allow + ['aufgaben']},
        {'path': 'plugins.entries.aufgaben', 'value': {'enabled': True, 'config': plugin_config}},
        {'path': 'session.dmScope', 'value': 'per-channel-peer'},
    ]
    # A channel override would otherwise defeat the global personal-task separation.
    if cfg.get('channels', {}).get('whatsapp', {}).get('dmScope') is not None:
        changes.append({'path': 'channels.whatsapp.dmScope', 'value': 'per-channel-peer'})
    args = ['config', 'set', '--batch-json', json.dumps(changes)]
    run(args + ['--dry-run'])
    run(args)
    run(['config', 'validate'])
    workspace = Path(cfg.get('agents', {}).get('defaults', {}).get('workspace', str(Path.home() / '.openclaw/workspace')))
    agents = workspace / 'AGENTS.md'
    original = agents.read_text()
    instructions = (ROOT / 'instructions.md').read_text()
    if instructions.splitlines()[0] not in original:
        saved = backup / 'AGENTS.md'
        saved.write_bytes(agents.read_bytes())
        saved.chmod(0o600)
        temp = agents.with_name('AGENTS.md.tasks-new')
        temp.write_text(original.rstrip() + '\n\n' + instructions)
        temp.replace(agents)
    print(json.dumps({'jobId': job_id, 'enabled': False, 'dryRun': True, 'backup': str(backup), 'members': [m['id'] for m in members]}))
