# WhatsApp: ElevenLabs für Erkennung und Antwortstimme

Stand: 05.10.2026, vorbereitet für OpenClaw `2026.9.8`.
**Umstellung auf dem Server bestätigt:** Dry-run und Anwendung aller zwölf
Änderungen erfolgreich, Konfiguration gültig, Gateway nach Neustart `active`.
Whisper wurde ohne zugehörigen laufenden Prozess nach
`/home/leon/.local/share/jarvis-stt.deaktiviert-20261005-162853-656795`
inaktiv archiviert. ElevenLabs ist laut Provider-Inventur verfügbar und
konfiguriert. **Umstellung abgeschlossen und Sprachtest laut Leon erfolgreich;
Schritte 1 und 2 nicht wiederholen.**
Der erste Sprachtest nach Umstellung scheiterte um 18:30 mit
„OpenClaw couldn't produce or deliver a reply“, Fehlerreferenz `849b1f2b…`.
Ein erneuter Test um 18:32 war laut Leon erfolgreich: zweisekündige Aufnahme,
viersekündige Audioantwort und passende Textbestätigung innerhalb derselben
angezeigten Minute. Die genaue Antwortdauer wurde nicht gemessen. Der Ablauf
funktioniert im praktischen Test; Provider-Requests wurden nicht separat per
Log geprüft. Keine weitere Änderung erforderlich. Whisper bleibt deaktiviert;
Logs erst bei erneutem Fehler prüfen. Der frühere Fehler bleibt ungeklärt.

**Akzeptierter Stand nach neuer Sitzung um 18:45:** normale Textantworten,
reine Audioantworten und Textbestätigungen nach Anrufen funktionieren laut Leon.
Auch beim Rückruf an Leon ist eine kurze Textbestätigung jetzt akzeptiert.
**So lassen, keine weitere Änderung erforderlich.** Details und bestätigte Tests:
[WHATSAPP_ANTWORTREGELN.md](WHATSAPP_ANTWORTREGELN.md). Der zuvor vorbereitete
Wechsel von `inbound` zu `tagged` wurde nicht separat per CLI-Ausgabe bestätigt;
die lokale Batch erzeugt inzwischen `tagged`. Der nachfolgende Installationsverlauf
dokumentiert den vorher bestätigten Stand mit `inbound` und ist nicht erneut auszuführen.

Der letzte WhatsApp-Test des lokalen
Ansatzes scheiterte: vier Sekunden Aufnahme um 18:05, Fehlerantwort um 18:09.
Die Fehlerursache ist noch nicht durch Logs geklärt.

Der neue Ablauf: WhatsApp-Aufnahme → ElevenLabs Scribe v2 → Jarvis →
ElevenLabs mit der bestehenden Stimme → WhatsApp-Sprachnachricht.
Die eingehende Aufnahme wird damit an ElevenLabs übertragen. Leon hat diesen
Wechsel ausdrücklich gewünscht. Outlook und das Kontakt-Anruf-Plugin bleiben
von den Konfigurationsänderungen unberührt. Automationen folgen erst danach.

## 1. Key erstellen und Helfer übertragen

Im bisherigen ElevenLabs-Konto einen neuen Key erstellen:

- **Text to Speech: Access**
- **Speech to Text: Access**
- **Speech to Speech: No Access** — für diesen Ablauf nicht erforderlich.

Die bekannte Stimme muss weiterhin im Konto verfügbar sein.
Den Key ausschließlich im SSH-Terminal unsichtbar eingeben, nicht hier posten.
Der alte Key kann bis zum erfolgreichen Test bestehen bleiben.

Auf **Ubuntu**, als `leon`:

```bash
mkdir -p "$HOME/.local/share/jarvis-elevenlabs"
chmod 700 "$HOME/.local/share/jarvis-elevenlabs"
```

Die Helfer [prepare-elevenlabs.mjs](../../sprachnachrichten/prepare-elevenlabs.mjs)
und [elevenlabs-setup.py](../../sprachnachrichten/elevenlabs-setup.py) aus dem
Skriptordner `sprachnachrichten/` im Workspace-Hauptordner in diesen Server-Ordner kopieren.
Falls dein SSH-Zugang unter `stangeserv` funktioniert, in **Windows-PowerShell**:

```powershell
scp "C:\Users\leon-\Desktop\OPENCLAW\sprachnachrichten\prepare-elevenlabs.mjs" "C:\Users\leon-\Desktop\OPENCLAW\sprachnachrichten\elevenlabs-setup.py" leon@stangeserv:/home/leon/.local/share/jarvis-elevenlabs/
```

Anschließend auf **Ubuntu**:

```bash
python3 "$HOME/.local/share/jarvis-elevenlabs/elevenlabs-setup.py" key
```

An der Abfrage den neuen Key einfügen und Enter drücken. Die Eingabe wird
nicht angezeigt. Der Helfer sichert die bestehende `~/.openclaw/elevenlabs.env`
privat, ersetzt darin den Key und erhält andere Variablen. Ein eigener
systemd-Drop-in lädt diese Datei beim Gateway-Start. Bestehende Service-Dateien
werden nicht überschrieben. Dieser Schritt startet den Gateway noch nicht neu.

## 2. Wechsel prüfen, anwenden und Whisper deaktivieren

Den folgenden Block vollständig im **Ubuntu-SSH-Terminal** ausführen.
Die Klammern und `set -e` verhindern, dass nach einem Fehler die weiteren
Änderungen ausgeführt werden. Bei Fehlern die Ausgabe ohne Key hier teilen.

```bash
(
  set -euo pipefail
  umask 077

  set -a
  . "$HOME/.openclaw/elevenlabs.env"
  set +a

  cp -- "$HOME/.openclaw/openclaw.json" \
    "$HOME/.openclaw/openclaw.json.vor-elevenlabs-stt-$(date +%Y%m%d-%H%M%S)"

  node "$HOME/.local/share/jarvis-elevenlabs/prepare-elevenlabs.mjs"
  openclaw config set \
    --batch-file "$HOME/.local/share/jarvis-elevenlabs/voice-settings.batch.json" \
    --dry-run
  openclaw config set \
    --batch-file "$HOME/.local/share/jarvis-elevenlabs/voice-settings.batch.json"
  openclaw config validate

  systemctl --user daemon-reload
  systemctl --user restart openclaw-gateway.service
  systemctl --user is-active openclaw-gateway.service

  python3 "$HOME/.local/share/jarvis-elevenlabs/elevenlabs-setup.py" disable-local
  openclaw capability audio providers
)
```

Der Helfer liest die **aktuelle Server-Konfiguration**. Er ersetzt unseren
Whisper-Audioeintrag durch genau einen ElevenLabs-Eintrag mit `scribe_v2` und
60 Sekunden Transkriptions-Timeout. Es gibt kein konfiguriertes lokales
Audio-Ersatzmodell. Andere explizit deklarierte Medienfähigkeiten bleiben
erhalten; unbekannte Audioeinträge führen zum Abbruch vor der Anwendung.
Die bekannte Stimme wird übernommen, TTS bleibt `inbound` und `final` mit
`eleven_multilingual_v2`. Der neue Key wird über die Gateway-Umgebung verwendet.
Das mitgelieferte ElevenLabs-Plugin wird aktiviert; eine bestehende Plugin-
Allowlist wird bei Bedarf ergänzt. Ein Plugin-Verbot wird nicht still entfernt.
Die CLI-Dry-run-Prüfung auf dem Server ist die verbindliche Schema-Prüfung.

Die lokale Deaktivierung erfolgt nach dem Gateway-Neustart: Der Helfer prüft
die neue Konfiguration und dass kein eigener Whisper-Prozess mehr läuft.
Anschließend verschiebt er **nur** den dedizierten Ordner
`~/.local/share/jarvis-stt` nach `jarvis-stt.deaktiviert-<Zeitstempel>`.
Damit sind venv, Helfer und Modellgewichte inaktiv archiviert, nicht gelöscht.
Whisper wird weder geladen noch als Ersatz gestartet. Die inaktiven Dateien
belegen weiterhin Festplattenplatz. Die Archivierung erlaubt eine spätere
gezielte Wiederherstellung; alte Konfiguration nicht blind komplett zurückspielen.

Es gab bisher keine lokale TTS-Engine in unserem Aufbau. Lokal war STT
(Erkennung); TTS (Antwortstimme) kam bereits von ElevenLabs.
**`ffmpeg` bleibt installiert**, weil WhatsApp das Audio für Sprachnachrichten
gegebenenfalls nach Ogg/Opus umwandeln muss. System-Python bleibt ebenfalls.

## 3. Funktion prüfen

Zuerst eine **Textnachricht** an Jarvis senden:

> Antworte bitte nur mit: Texttest erfolgreich.

Erwartet: eine normale Textantwort. Danach eine kurze Sprachnachricht:

> Hallo Jarvis, antworte bitte: Sprachtest erfolgreich.

Erwartet: Inhalt korrekt erkannt, bekannte ElevenLabs-Stimme als Audioantwort.
Die Zeit vom Senden bis zur Antwort notieren. Erst danach den Kalender per
Sprachnachricht abfragen. So wird die Sprachnachrichtenfunktion unabhängig
von Kalenderwerkzeugen getestet.

Falls die Sitzung TTS überschreibt, dort `/tts status` prüfen und bei Bedarf
`/tts inbound` setzen. Auf Ubuntu zusätzlich:

```bash
systemctl --user is-active openclaw-gateway.service
openclaw capability audio providers
openclaw mcp doctor outlook --probe
```

Die Provider-Inventur allein beweist noch keinen erfolgreichen API-Aufruf.
Falls schon der Texttest denselben Agentenfehler zeigt, liegt zusätzlich ein
Problem bei Jarvis' Verarbeitung vor. Der Wechsel der Spracherkennung ist
dann kein Nachweis, dass dieser Agentenfehler behoben wurde.

## Quellen

- [OpenClaw: ElevenLabs, Scribe v2 und API-Key](https://docs.openclaw.ai/providers/elevenlabs)
- [OpenClaw: explizite Audiomodelle und automatische Auswahl](https://docs.openclaw.ai/nodes/audio)
- [OpenClaw: TTS-Felder](https://docs.openclaw.ai/tools/tts/field-reference)
- [OpenClaw: WhatsApp-Audioausgabe](https://docs.openclaw.ai/tools/tts/output)
- [ElevenLabs: API-Key und Endpoint-Berechtigungen](https://elevenlabs.io/docs/api-reference/authentication)
