# Täglicher Outlook- und E-Mail-Anruf

Stand: 05.10.2026. Auf dem Ubuntu-Server per autorisiertem SSH eingerichtet.

## Ablauf

- Täglich exakt 18:00 Uhr, Zeitzone `Europe/Berlin`, automatische Sommerzeit.
- Outlook-Termine ab Ausführungszeit für die nächsten 72 Stunden, einschließlich
  Serieninstanzen und ganztägiger Termine, kurz auf Deutsch vorlesen.
- Ungelesene E-Mails im Posteingang prüfen und nur ihre Absender nennen.
  Gleiche Absender zusammenfassen; keine Betreffzeilen oder Inhalte vorlesen.
- Keine Termine oder Mails verändern, keine Mails als gelesen markieren.
- Bei vielen Einträgen kurze Zusammenfassung mit Anzahl, nächsten Terminen
  und höchstens zehn Absendern; weitere Einträge ausdrücklich kenntlich machen.
- Bei Abruffehlern sagen, welcher Teil nicht verfügbar ist, statt fälschlich
  „keine Termine“ oder „keine E-Mails“ zu melden.
- Anrufnachricht maximal 1800 Zeichen, bestehende ElevenLabs-Stimme.
- Keine zusätzliche Audio- oder Textzustellung nach dem geplanten Anruf.

Job-ID: `c67e5c8b-837c-424a-87a7-861e44f64c50`.

Name: `daily-outlook-mail-whatsapp-call-1800-berlin`.

Cron: `0 18 * * *`, exakt ohne Stagger. Agent `main`, Sitzung `isolated`,
Fallback-Zustellung `none`. Aktiviert. Erste reguläre Ausführung:
06.10.2026, 18:00 Uhr Berlin.

## Lösung für den fehlenden WhatsApp-Kontext

Das vorhandene Plugin bietet die bisherigen Kontakt-Tools nur bei
`messageChannel === "whatsapp"` und `senderIsOwner === true` an. Diese Bedingungen
fehlen einem Hintergrundlauf. Sie wurden für die bestehenden Tools beibehalten.

Eine eigene Funktion `whatsapp_call_daily_briefing` wurde im Kontakt-Plugin
ergänzt. Sie ist ausschließlich für Agent `main` mit dem Sitzungsschlüssel
`agent:main:cron:<freigegebene Job-ID>` oder dessen exakt abgegrenzter
`:run:<UUID>`-Sitzung verfügbar. Die Konfiguration bindet sie an die obige
Job-ID. Normale Chats, andere Agenten und andere Automationen erhalten dieses
Tool nicht. Der Zielkontakt ist fest Leons bestehende `authorizedCaller`-Nummer;
das Modell kann weder Telefonnummer noch Kontakt auswählen.

Nur die folgenden drei Tools sind in diesem Job freigegeben:

```text
whatsapp_call_daily_briefing
outlook__get-calendar-view
outlook__list-mail-folder-messages
```

Die Funktion erzeugt ElevenLabs-Audio und nutzt den vorhandenen MeowCaller
sowie den vorhandenen WhatsApp-Anrufspeicher. Es wurde keine zweite WhatsApp-
Anmeldung oder separate STT/TTS-Installation eingerichtet.

Konfiguration unter `plugins.entries.whatsapp-call-contact.config.dailyBriefing`:

```json
{
  "automationId": "c67e5c8b-837c-424a-87a7-861e44f64c50",
  "dryRun": false
}
```

## Prüfung

TypeScript-Build und `openclaw plugins validate` bestanden. Positive und negative
Tests der Sitzungsbindung: eigener Cron-Job zulässig; normaler Chat, falscher
Agent, andere Job-ID und angehängte falsche ID unzulässig.
Zusätzlich die tatsächlichen registrierten Tool-Factories geprüft: normaler
Owner-Chat und fremde Jobs erhalten kein tägliches Anruf-Tool, das Eingabeschema
enthält nur `message`, Vorschau benötigt keinen Netzwerkaufruf, das bestehende
Kontakt-Tool bleibt ohne WhatsApp-/Owner-Kontext gesperrt. Alle Prüfungen bestanden.

Erfolgreicher Probelauf am 05.10.2026 um 20:24 Uhr Berlin, ca. 27 Sekunden:
Kalenderansicht für 72 Stunden und ungelesene Inbox-Mails abgerufen, jeweils
`fetchAllPages: true`. Mail-Abfrage: `filter: "isRead eq false"`,
`select: "from,isRead"`. Plugin im `dryRun`-Modus lieferte die Vorschau ohne
ElevenLabs-Aufruf oder Telefonanruf. Status `ok`, keine Chat-Zustellung.
Anschließend `dryRun: false` gesetzt und Job aktiviert; Konfiguration gültig.
Gateway hat ElevenLabs-Key, ausführbaren MeowCaller und vorhandenen VoIP-Speicher.

Auf Leons ausdrücklichen Wunsch danach ein echter manueller Test:
05.10.2026, 20:33:58–20:35:16 Uhr Berlin, rund 77 Sekunden. Scheduler-Ergebnis
`status: ok`, `completionStatus: succeeded`; Zusammenfassung meldet erfolgreichen
Kalender-/Mail-Abruf und erfolgreichen Briefing-Anruf. Run-ID:
`manual:c67e5c8b-837c-424a-87a7-861e44f64c50:1791225238837:1`.
Tagesnachweis für 05.10.2026 wurde angelegt. Die tatsächliche Annahme und
hörbare Audioausgabe müssen noch durch Leon bestätigt werden. Keine weitere
manuelle Ausführung vorgenommen; nächste reguläre Ausführung bleibt
06.10.2026 um 18:00 Uhr Berlin.

## Betrieb und Wiederholungen

Vor dem tatsächlichen MeowCaller-Aufruf wird ein exklusiver Tagesnachweis unter
`~/.openclaw/state/daily-briefing-calls/<Job-ID>-<Berlin-Datum>.json` angelegt.
Weitere Versuche am selben Tag werden abgewehrt. Auch nach einem fehlgeschlagenen
oder unklaren Anruf bleibt dieser Nachweis erhalten, um doppelte Anrufe zu
verhindern. Deshalb kein automatischer zweiter Anruf bei Nichtannahme.

Status und Verlauf:

```bash
openclaw automations show c67e5c8b-837c-424a-87a7-861e44f64c50
openclaw automations runs c67e5c8b-837c-424a-87a7-861e44f64c50 --limit 5 --json
```

Deaktivieren bei Bedarf:

```bash
openclaw automations disable c67e5c8b-837c-424a-87a7-861e44f64c50
```

Nicht ungefragt manuell `run` ausführen: Mit `dryRun: false` würde ein echter
Anruf erfolgen, sofern es heute noch keinen Versuch gab. Für anruffreie Tests
erst `dailyBriefing.dryRun` aktivieren, danach wieder deaktivieren.

## Dateien und Sicherungen

Server-Plugin: `/home/leon/openclaw-whatsapp-call-contact-v0.1.2-ubuntu`.
Lokale gepflegte Kopie: `plugins/whatsapp-call-contact/` (Quellcode, Build,
Plugin-Manifest, Paket- und TypeScript-Konfiguration; keine Zugangsdaten).
Die ursprüngliche ZIP-Datei enthält diese Erweiterung noch nicht.

Originale Plugin-Dateien:

```text
/home/leon/.local/share/jarvis-repairs/daily-briefing-plugin-original/
```

OpenClaw-Konfiguration vor der Erweiterung:

```text
/home/leon/.openclaw/openclaw.json.vor-daily-briefing-20261005T182258Z
```

Nach der endgültigen Freischaltung wurde der Gateway erneut gestartet, damit
auch die vom Plugin bei Registrierung erfasste Konfiguration sicher den echten
Anrufmodus verwendet. Nach Änderungen dieser Plugin-Konfiguration vorsichtshalber
neu starten. Änderungen am Plugin-Programmcode benötigen Build, Validierung und Gateway-Neustart.
Ein Reinstallieren des ursprünglichen Kontakt-Plugins würde die Erweiterung
entfernen; dafür die gepflegte lokale Kopie verwenden.

OpenClaw-Dokumentation: [Automationen](https://docs.openclaw.ai/cli/cron).
