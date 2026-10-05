# Annka als zusätzlichen WhatsApp-Owner eintragen

Am 05.10.2026 ausdrücklich von Leon freigegeben. Die Umsetzung auf dem Server
ist durch Leons Terminalausgabe bestätigt: Dry-Run erfolgreich, Owner-Liste
aktualisiert, Konfiguration gültig und Dienst `active`. Das Journal bestätigt
die Übernahme um 19:07:33 Uhr Europe/Berlin und den anschließenden Neustart;
WhatsApp ist ab 19:08:16 wieder empfangsbereit. Ein erfolgreicher `/new`-Test
von Annka nach dieser Änderung steht noch aus. Den Einrichtungsblock nicht
allein zum Test erneut ausführen. Owner-Rechte gelten auch für
weitere Owner-Befehle und entsprechend geschützte Aktionen, nicht nur `/new`.

Der folgende Block wird im Ubuntu-Terminal als Benutzer `leon` ausgeführt.
Er verwendet die aktive Server-Konfiguration, erhält alle bisherigen expliziten
Owner und ergänzt Annkas bereits zugelassene Nummer mit der bekannten Endung
`1170`. Bei fehlender oder mehrdeutiger Zuordnung bricht er ab. Er ändert nur
`commands.ownerAllowFrom`; Sprach-, Outlook- und Sitzungseinstellungen bleiben
unverändert. Die vollständigen Telefonnummern und Zugangsdaten werden hier
nicht gespeichert.

```bash
(
  set -euo pipefail
  umask 077

  if [ -f "$HOME/.openclaw/elevenlabs.env" ]; then
    set -a
    . "$HOME/.openclaw/elevenlabs.env"
    set +a
  fi

  jarvis_owners="$(python3 - <<'PY'
import json
from pathlib import Path

cfg = json.loads((Path.home() / '.openclaw/openclaw.json').read_text())
owners = cfg.get('commands', {}).get('ownerAllowFrom')
if not isinstance(owners, list) or not owners or not all(isinstance(x, str) for x in owners):
    raise SystemExit('Abbruch: Bestehende Owner-Liste fehlt oder ist unerwartet.')
allowed = cfg.get('channels', {}).get('whatsapp', {}).get('allowFrom', [])
numbers = {x.removeprefix('whatsapp:') for x in allowed if isinstance(x, str)}
annka = [x for x in numbers if x.startswith('+') and x[1:].isdigit() and x.endswith('1170')]
if len(annka) != 1:
    raise SystemExit('Abbruch: Annkas zugelassene Nummer ist nicht eindeutig.')
entry = 'whatsapp:' + annka[0]
print(json.dumps(owners if entry in owners else owners + [entry]))
PY
)"

  cp -- "$HOME/.openclaw/openclaw.json" \
    "$HOME/.openclaw/openclaw.json.vor-annka-owner-$(date +%Y%m%d-%H%M%S)"

  openclaw config set commands.ownerAllowFrom "$jarvis_owners" --strict-json --dry-run
  openclaw config set commands.ownerAllowFrom "$jarvis_owners" --strict-json
  openclaw config validate
  systemctl --user restart openclaw-gateway.service
  systemctl --user is-active openclaw-gateway.service
)
```

Bei erfolgreichem Abschluss soll Annka genau `/new` als Text senden und danach
eine normale Textnachricht und eine kurze Sprachnachricht testen. Ein Neustart
kann laufende Gespräche kurz unterbrechen; deshalb zwischen Tests ausführen.
Ein erfolgreicher Konfigurationslauf allein beweist noch keinen behobenen Reset.

Referenzen:

- [OpenClaw: Owner- und Befehlsberechtigungen](https://docs.openclaw.ai/gateway/config-channels/commands)
- [OpenClaw: Config CLI](https://docs.openclaw.ai/cli/config)
