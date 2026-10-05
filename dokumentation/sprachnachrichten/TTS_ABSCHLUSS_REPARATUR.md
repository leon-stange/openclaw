# TTS-Abschlussantwort: lokale Korrektur

Stand: 05.10.2026. Direkt auf dem Ubuntu-Server per autorisiertem SSH umgesetzt.

## Belegter Fehler

Zwei normale WhatsApp-Läufe wurden als `incomplete turn` verworfen:

- 19:55:02 Uhr Berlin, Run `96cb4202-15f6-4b30-9580-b16fec07a206`:
  Outlook-Termin erfolgreich erstellt, anschließend reine TTS-Bestätigung.
- 20:06:07 Uhr Berlin, Run `320990fb-07bf-4e6d-a457-9039888051e8`:
  „Schicke mir mal eine Sprachnachricht“, keine Tool-Aufrufe, reine TTS-Antwort.

Beide finalen Nachrichten: `stopReason: stop`, normaler Textblock leer,
`openclawDelivery.tts.text` vollständig und nicht leer. Kein gespeicherter
Assistant-Fehler. Dies grenzt den Fehler auf die Abschlussprüfung ein; es
belegt keinen ElevenLabs-API-Fehler. Die Heartbeat-Reparatur bleibt separat.

## Eingespielte Änderung

Lokale Ergänzung von `resolveIncompleteTurnPayloadText` im installierten
OpenClaw-Paket: Existiert beim aktuellen Assistant ein nicht leerer TTS-Text,
ist sein Stop-Grund `stop`, und ist der Lauf weder abgebrochen noch
zeitüberschritten, liefert diese Prüfung keinen Fehler wegen einer
unvollständigen Antwort. Die spätere TTS-Erzeugung und Zustellung bleiben
für deren eigene Fehlerprüfung verantwortlich.

Marker im Programmcode: `jarvis-tts-terminal-fix-v1`.

Betroffene Dateien unter `/home/leon/.npm-global/lib/node_modules/openclaw/dist/`:

- `builtin-openclaw-DEib7rq9.mjs`
- `package-update-activation-recovery.mjs`
- `worker/sqlite-store.worker.mjs`
- `worker/worker.mjs`

Sicherung der Originaldateien mit relativer Ordnerstruktur und einem Manifest
mit SHA-256 vor/nach der Änderung:

```text
/home/leon/.local/share/jarvis-repairs/tts-terminal-20261005T180845Z/
```

Dies ist eine lokale Paketkorrektur, kein offizielles OpenClaw-Update. Ein
Update oder eine Neuinstallation kann sie überschreiben. Danach zuerst
prüfen, ob die neue Version den Fehler bereits behebt; die Änderung nicht
blind auf andere Versionen übertragen.

## Prüfung und Rückmeldung zum Praxistest

Vor dem Schreiben: positive Prüfung für vollständige TTS-Antwort und negative
Prüfungen für fehlende/leere/ungültige TTS-Inhalte, Stop-Gründe `error`,
`toolUse`, `length`, Abbruch sowie Zeitüberschreitung. Alle bestanden.
Syntaxprüfung aller vier geänderten Module mit `node --check` bestanden.
Gateway anschließend mit `systemctl --user restart openclaw-gateway.service`
sauber neu gestartet; `is-active` meldet `active`.

Leon meldet nach der Änderung am 05.10.2026: „Scheinbar geht es jetzt“.
Damit liegt eine positive Rückmeldung zum praktischen Verhalten vor. Der
genaue Testlauf und seine Audiozustellung wurden noch nicht unabhängig anhand
des Journals geprüft; Langzeitstabilität ist noch offen. Kein erneutes Anlegen
des bereits erfolgreich erstellten Outlook-Termins erforderlich.

## Rücknahme bei Bedarf

Die vier Originaldateien aus der Sicherung anhand von `manifest.json` an ihre
ursprünglichen Pfade zurückkopieren, dabei aktuelle Paketversion und Dateien
prüfen, anschließend Gateway neu starten. Bei zwischenzeitlichem Paketupdate
die damaligen Originaldateien nicht ungeprüft über die neue Version kopieren.
