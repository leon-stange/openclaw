# Heartbeat: eigenen Kontext und reine Textantworten verwenden

**Stand 05.10.2026: Reparatur erfolgreich laut Leon und Dashboard-Screenshot.**
Nach Anwendung der beschriebenen Änderung bestätigt Leon „geht jetzt“.
Das Dashboard zeigt für `Heartbeat (main)` einen grünen Haken bei der letzten
Ausführung („gerade eben“). Der Zeitplan bleibt alle 30 Minuten; die nächste
Ausführung wird im Screenshot in fünf Minuten angezeigt.

Damit ist ein erfolgreicher Lauf nach der Reparatur bestätigt. Ein neues
Transkript und die vollständige CLI-Ausgabe dieses Laufs wurden nicht geteilt;
deshalb sind dessen genauer Antwortinhalt, Run-ID und aktive Konfigurationswerte
nicht separat nachgewiesen. Das Problem gilt für die weitere Arbeit als behoben.
Die folgenden Befehle dokumentieren die Reparatur; kein erneutes Ausführen
allein zur Dokumentation nötig.

## Befund und Ziel

Am 05.10.2026 führte der Heartbeat um 19:07 und 19:18 Uhr Europe/Berlin die
vorherige Unterhaltung über Pizza und Spaghetti fort. Die erzeugten Antworten
standen ausschließlich in `openclawDelivery.tts.text`; das normale Textfeld war
leer. Beide Läufe wurden als `incomplete turn detected` beziehungsweise
`heartbeat failed: agent-runner-failure` gemeldet. Ein früherer erfolgreicher
Heartbeat hatte `NO_REPLY` zurückgegeben.

Die Reparatur trennt periodische Heartbeats vom Gesprächsverlauf und von den
normalen WhatsApp-Sprachantwortregeln:

- `isolatedSession: true`: frische Sitzung pro Heartbeat ohne alte Unterhaltung.
- `lightContext: true`: normale Workspace-Bootstrapdateien werden nicht geladen.
- Eigener Prompt: nur mitgelieferte Heartbeat-Aufträge bearbeiten, keine alten
  Chats fortsetzen, kein TTS; bei nichts Neuem genau `NO_REPLY` zurückgeben.

Zeitplan, Modell und Zustellungsziel werden nicht geändert. Die aktuelle lokale
Konfigurationskopie zeigt bereits `heartbeat.target: none`; diese Einstellung
wird erhalten. Damit lässt sich die Reparatur anhand des Laufstatus prüfen,
ohne zunächst externe Heartbeat-Meldungen wieder einzuschalten. Auch Outlook,
die normalen ElevenLabs-Antworten und beide Owner bleiben unverändert.

Dies korrigiert den belegten Heartbeat-Kontextfehler. Die genaue interne
Vollständigkeitsprüfung wurde nicht im installierten Code nachgewiesen;
gelegentliche Fehler bei normalen Audioantworten sind damit nicht automatisch
behoben.

Lokal geprüft: Der eingebettete Python-Block läuft mit der aktuellen
Konfigurationskopie und mit beiden berücksichtigten Formen eines `main`-
Overrides. Er erzeugt genau drei Änderungen an den vorgesehenen Pfaden;
Owner-, Kanal-, Outlook-/MCP-, TTS-, Medien- und Plugin-Konfigurationen bleiben
erhalten. Die eingelesene Datei wird vom Vorbereitungsblock nicht geschrieben.
Die Prüfung ersetzt nicht den OpenClaw-Dry-Run und den tatsächlichen Lauf auf
dem Server.

## 1. Auf dem Ubuntu-Server anwenden

Den ganzen folgenden Block als `leon` ins Ubuntu-Terminal kopieren. Keine neue
Datei muss zuvor hochgeladen werden. Python bereitet nur drei gezielte
Konfigurationsänderungen vor; OpenClaw prüft und speichert sie. Falls `main`
bereits eine eigene Heartbeat-Konfiguration hat, werden die drei Felder dort
gesetzt, damit sie nicht durch diesen Override überlagert werden.

```bash
(
  set -euo pipefail
  umask 077

  if [ -f "$HOME/.openclaw/elevenlabs.env" ]; then
    set -a
    . "$HOME/.openclaw/elevenlabs.env"
    set +a
  fi

  jarvis_heartbeat_batch="$(python3 - <<'PY'
import json
from pathlib import Path

cfg = json.loads((Path.home() / '.openclaw/openclaw.json').read_text())
base = 'agents.defaults.heartbeat'
entries = cfg.get('agents', {}).get('entries')
if isinstance(entries, dict):
    main = entries.get('main', {})
    if isinstance(main, dict) and isinstance(main.get('heartbeat'), dict):
        base = 'agents.entries.main.heartbeat'
elif isinstance(entries, list):
    matches = [(i, x) for i, x in enumerate(entries)
               if isinstance(x, dict) and x.get('id') == 'main']
    if len(matches) > 1:
        raise SystemExit('Abbruch: Agent main ist mehrfach eingetragen.')
    if matches and isinstance(matches[0][1].get('heartbeat'), dict):
        base = f'agents.entries.{matches[0][0]}.heartbeat'
elif entries is not None:
    raise SystemExit('Abbruch: Unerwartete Agentenkonfiguration.')

prompt = (
    'Dies ist ein interner Heartbeat, keine neue WhatsApp-Nachricht. '
    'Bearbeite nur die ausdrücklich mitgelieferten Heartbeat-Aufträge, '
    'Monitor-Scratch und Systemereignisse. Leite keine Aufgaben oder Antworten '
    'aus früheren Unterhaltungen ab und setze keinen alten Chat fort. '
    'Verwende keine TTS-Tags und erzeuge keine Sprachnachricht. '
    'Wenn nichts Neues Aufmerksamkeit erfordert, antworte exakt NO_REPLY. '
    'Wenn ein mitgelieferter Auftrag eine neue relevante Meldung ergibt, '
    'antworte ausschließlich mit einer kurzen Textmeldung.'
)
values = {'isolatedSession': True, 'lightContext': True, 'prompt': prompt}
print(json.dumps([{'path': f'{base}.{k}', 'value': v}
                  for k, v in values.items()], ensure_ascii=False))
PY
)"

  cp -- "$HOME/.openclaw/openclaw.json" \
    "$HOME/.openclaw/openclaw.json.vor-heartbeat-reparatur-$(date +%Y%m%d-%H%M%S)"

  openclaw config set --batch-json "$jarvis_heartbeat_batch" --dry-run
  openclaw config set --batch-json "$jarvis_heartbeat_batch"
  openclaw config validate
)
```

Erwartet: Dry-Run erfolgreich, drei Pfade aktualisiert und `Config valid`.
Die CLI zeigt an, ob die Änderung automatisch übernommen wird. Nur falls sie
ausdrücklich `Restart the gateway to apply.` meldet, anschließend zwischen
Gesprächen ausführen:

```bash
systemctl --user restart openclaw-gateway.service
systemctl --user is-active openclaw-gateway.service
```

## 2. Einen einzelnen Heartbeat testen

Wenn gerade keine Unterhaltung oder kein Anruf läuft:

```bash
openclaw automations run 690288ff-5a82-4d81-ad5c-fedd86514197 \
  --wait --wait-timeout 2m

openclaw automations runs 690288ff-5a82-4d81-ad5c-fedd86514197 \
  --limit 3 --json
```

Den ersten Befehl genau einmal ausführen. `enqueued: true` allein bedeutet
noch keinen erfolgreichen Abschluss. Den zugehörigen Run-ID-Eintrag prüfen:
erwartet wird ein erfolgreich abgeschlossener Heartbeat, ohne Fortsetzung des
Essensgesprächs oder TTS-Antwort. Im Transkript ist bei nichts Neuem `NO_REPLY`
eine gültige stille Antwort; ein strukturiert stiller Heartbeat-Abschluss ist
ebenfalls gültig. `requests-in-flight` bedeutet übersprungen, weil noch Arbeit
läuft; das ist kein bestandener Reparaturtest.

**Ergebnis:** Leon hat die erfolgreiche Reparatur inzwischen bestätigt; der
Dashboard-Screenshot belegt eine erfolgreiche letzte Heartbeat-Ausführung.
Bei einem späteren erneuten Fehler die neue Run-ID und das zugehörige
Transkript auswerten; keine Sitzung
löschen, Sprachkonfiguration ändern oder einen Modellwechsel auf Verdacht
durchführen.

## Quellen

- [Heartbeat: Isolation, leichter Kontext und Prompt](https://docs.openclaw.ai/gateway/heartbeat)
- [Config CLI: Batchänderungen und Dry-Run](https://docs.openclaw.ai/cli/config)
- [Automationen: einmaliger Lauf mit Abschlussprüfung](https://docs.openclaw.ai/cli/cron)
