# WhatsApp-Sprachnachrichten: lokale Transkription und ElevenLabs-Antwort

**Dieser lokale Ansatz wird abgelöst.** Der WhatsApp-Test am 05.10.2026
lieferte nach ungefähr vier Minuten eine Agenten-Fehlerantwort. Leon möchte
jetzt ElevenLabs für STT und TTS verwenden und Whisper vollständig deaktivieren.
Die neue Anleitung ist [ELEVENLABS_UMSTELLUNG.md](ELEVENLABS_UMSTELLUNG.md).
Die Cloud-Umstellung wurde inzwischen auf dem Server angewendet; ein erneuter
WhatsApp-Sprachtest um 18:32 war laut Leon erfolgreich. Whisper bleibt deaktiviert.
Die nachfolgenden Installationsschritte dienen nur noch als historische
Dokumentation und sollen für die Umstellung nicht erneut ausgeführt werden.

Stand: 05.10.2026. Für OpenClaw `2026.9.8` vorbereitet. Leon hat die erfolgreiche
Installation von `faster-whisper 1.2.1` samt Abhängigkeiten per Terminal-Screenshot
bestätigt. Ein weiterer Screenshot bestätigt den abgeschlossenen Modelldownload
(486 MB) und `ffmpeg 6.1.1-3ubuntu5+esm13`. Installation und Download müssen
nicht wiederholt werden. Leons anschließende Terminalausgabe bestätigt das
Offline-Laden des Modells auf der CPU, die erfolgreiche Prüfung/Anwendung aller
zehn Konfigurationsänderungen, `Config valid` und den Gateway-Dienst `active`.
Der echte WhatsApp-Funktionstest ist fehlgeschlagen; die Ursache ist noch
nicht durch Logs geklärt. Statt Schritt 4 die neue Umstellungsanleitung verwenden.
Server laut Leon: 4 CPU-Kerne, 7,8 GiB RAM, 5,5 GiB verfügbar, Python 3.12.3.
`ffmpeg` ist nach dem angeleiteten Installationsschritt jetzt vorhanden.

## Gewünschter Ablauf

WhatsApp-Audio → lokales `faster-whisper small` auf der CPU → Transkript an
Jarvis → Antworttext → vorhandene ElevenLabs-Stimme → WhatsApp-Sprachnachricht.

Nur die Spracherkennung erfolgt lokal. Jarvis nutzt weiterhin sein eingerichtetes
Sprachmodell für den Text; für die Antwort erhält ElevenLabs den Antworttext.
Die eingehende Aufnahme wird von der vorbereiteten Transkription nicht an einen
Cloud-Dienst geschickt. Modellgewichte werden einmal bei der Einrichtung geladen.

OpenClaw unterstützt einen expliziten lokalen CLI-Eintrag unter
`tools.media.models`. Hier wird ausschließlich dieser Audio-Eintrag gesetzt,
ohne Cloud-Transkriptionsmodell als Ersatz. Die mitgelieferte Python-Anbindung
lädt nur vorhandene lokale Gewichte (`local_files_only=True`, Offline-Modus).
Bei fehlenden Gewichten oder einem Fehler schlägt die Transkription fehl.

`tts.auto: "inbound"` aktiviert Audio-Antworten nach eingehenden Sprachnachrichten;
Textnachrichten erhalten weiterhin Text. `tts.mode: "final"` beschränkt die
Sprachausgabe auf die abschließende Antwort. Die bestehende ElevenLabs-Stimme
wird aus der aktiven Server-Konfiguration übernommen.

## 1. Auf Ubuntu installieren

Im SSH-Terminal des neuen Servers, als `leon`:

```bash
sudo apt update
sudo apt install -y python3-venv ffmpeg

mkdir -p "$HOME/.local/share/jarvis-stt"
python3 -m venv "$HOME/.local/share/jarvis-stt/venv"
"$HOME/.local/share/jarvis-stt/venv/bin/python" -m pip install \
  "faster-whisper==1.2.1"
```

Das Modell mehrsprachig laden, damit Deutsch unterstützt wird:

```bash
"$HOME/.local/share/jarvis-stt/venv/bin/python" <<'PY'
from pathlib import Path
from huggingface_hub import snapshot_download
snapshot_download(
    repo_id="Systran/faster-whisper-small",
    local_dir=str(Path.home() / ".local/share/jarvis-stt/model"),
    allow_patterns=["model.bin", "config.json", "tokenizer.json",
                    "vocabulary.*", "preprocessor_config.json"],
)
print("Lokales Whisper-Modell heruntergeladen.")
PY
```

Der Download benötigt mehrere hundert MB Speicher und Internetzugang.
Er verwendet keine Sprachnachricht. Die späteren Transkriptionen verwenden
genau dieses lokale Modellverzeichnis.

Nach dem Download das Modell offline auf der CPU laden, ohne eine Aufnahme
zu transkribieren oder einen externen Dienst aufzurufen:

```bash
HF_HUB_OFFLINE=1 "$HOME/.local/share/jarvis-stt/venv/bin/python" <<'PY'
from pathlib import Path
from faster_whisper import WhisperModel
WhisperModel(
    str(Path.home() / ".local/share/jarvis-stt/model"),
    device="cpu", compute_type="int8", cpu_threads=2, local_files_only=True,
)
print("OK: Lokales Modell offline auf der CPU geladen.")
PY
```

Nur wenn dieser Modelltest erfolgreich ist, die Konfiguration aktivieren.

## 2. Die beiden Dateien auf den Server übertragen

Übertrage [transcribe-local.py](../../sprachnachrichten/transcribe-local.py) und
[prepare-config.mjs](../../sprachnachrichten/prepare-config.mjs) aus dem
Skriptordner `sprachnachrichten/` im Workspace-Hauptordner nach:

```text
/home/leon/.local/share/jarvis-stt/transcribe-local.py
/home/leon/.local/share/jarvis-stt/prepare-config.mjs
```

Wenn dein SSH-Zugang vom Windows-Rechner über den Namen `stangeserv` funktioniert,
in **Windows-PowerShell**:

```powershell
scp "C:\Users\leon-\Desktop\OPENCLAW\sprachnachrichten\transcribe-local.py" "C:\Users\leon-\Desktop\OPENCLAW\sprachnachrichten\prepare-config.mjs" leon@stangeserv:/home/leon/.local/share/jarvis-stt/
```

Alternativ dieselben beiden Dateien mit deinem bisherigen Übertragungsweg kopieren.
Anschließend auf Ubuntu:

```bash
chmod 600 "$HOME/.local/share/jarvis-stt/transcribe-local.py" \
  "$HOME/.local/share/jarvis-stt/prepare-config.mjs"
node "$HOME/.local/share/jarvis-stt/prepare-config.mjs"
```

Dieser Befehl prüft die Dateien und erzeugt nur die geplanten Änderungen.
Er ändert OpenClaw noch nicht. Bereits konfigurierte Medienmodelle werden
nicht ungeprüft ersetzt; in diesem Fall bricht die Vorbereitung ab.

## 3. Konfiguration prüfen und aktivieren

Zuerst die aktuelle Server-Konfiguration privat sichern:

```bash
umask 077
cp -- "$HOME/.openclaw/openclaw.json" \
  "$HOME/.openclaw/openclaw.json.vor-sprachnachrichten-$(date +%Y%m%d-%H%M%S)"

openclaw config set \
  --batch-file "$HOME/.local/share/jarvis-stt/voice-settings.batch.json" \
  --dry-run
```

Nur wenn die Prüfung erfolgreich ist, anwenden:

```bash
openclaw config set \
  --batch-file "$HOME/.local/share/jarvis-stt/voice-settings.batch.json"

openclaw config validate
```

Die Änderungen betreffen ausschließlich die lokale Audiotranskription und
die TTS-Einstellungen. Der funktionierende Outlook-MCP-Eintrag bleibt bestehen.
Bei ElevenLabs wird `modelId` auf `eleven_multilingual_v2` gesetzt; das bisherige
Feld `model` ist laut Feldreferenz für diesen Provider wirkungslos.
Der vorhandene Schlüssel wird weiterhin über die Gateway-Umgebung verwendet.
In der kopierten `.openclaw/elevenlabs.env` ist `ELEVENLABS_API_KEY` definiert.
Diese Datei allein beweist jedoch nicht, dass der laufende Dienst sie geladen hat.

Sofern dein Gateway als bisheriger systemd-User-Dienst läuft:

```bash
systemctl --user restart openclaw-gateway.service
systemctl --user is-active openclaw-gateway.service
```

## 4. Funktionstest

Zuerst eine kurze echte WhatsApp-Sprachnachricht senden, beispielsweise:

> Hallo Jarvis, welche Termine habe ich in den nächsten drei Tagen?

Erwartet: Jarvis versteht den gesprochenen Auftrag, ruft den Kalender auf und
sendet seine kurze Antwort als WhatsApp-Sprachnachricht mit der bekannten Stimme.
Anschließend eine normale Textnachricht senden und prüfen, dass die Antwort
weiterhin als Text kommt. Die Antwort inhaltlich auf Erkennungsfehler prüfen.

Die erste Live-Prüfung muss lokale Transkription, Verarbeitung durch Jarvis,
ElevenLabs-Spracherzeugung und WhatsApp-Versand zusammen bestätigen.
Die drei lokalen Tests hier verwenden einen simulierten ASR-Prozess; sie sind
kein Nachweis für tatsächliche Erkennungsqualität oder Verarbeitungsgeschwindigkeit.

Der Helfer verarbeitet zunächst Sprachnachrichten bis drei Minuten und 20 MB,
mit zwei CPU-Threads und maximal einem parallelen Medienlauf. CLI-Timeout:
300 Sekunden. Lange Nachrichten werden ausdrücklich abgelehnt und nicht gekürzt.
Falls später längere Aufnahmen gewünscht sind, Dauergrenze und Timeout gemeinsam
anpassen und auf dem Server messen.

## Falls etwas scheitert

- Fehlende lokale Gewichte: Modelldownload prüfen. Die Transkription wechselt
  nicht zu einem Cloud-Transkriptionsmodell.
- Keine Stimme trotz Textantwort: Jarvis im WhatsApp-Chat `/tts status` schicken.
  Eine bestehende Sitzungseinstellung kann den globalen TTS-Modus überschreiben;
  `/tts inbound` setzt den gewünschten Modus für die Unterhaltung.
- Audio-Versand: `ffmpeg -version` prüfen. OpenClaw/WhatsApp benötigen ein
  kompatibles Ogg/Opus-Format für eine native Sprachnachricht.
- ElevenLabs-Fehler: Gateway muss den bereits vorhandenen API-Key erhalten.
  Schlüssel und vollständige Dienst-Umgebungsvariablen nicht im Chat posten.
- Bei Stille oder unverständlicher Aufnahme meldet der Helfer einen Fehler
  anstelle eines erfundenen Transkripts.

## Quellen

- [OpenClaw: Audiotranskription über lokale CLI](https://docs.openclaw.ai/nodes/audio)
- [OpenClaw: TTS-Modi und ElevenLabs-Felder](https://docs.openclaw.ai/tools/tts/field-reference)
- [OpenClaw: WhatsApp-Audioformat und Versand](https://docs.openclaw.ai/tools/tts/output)
- [faster-whisper: CPU-Transkription](https://github.com/SYSTRAN/faster-whisper)
