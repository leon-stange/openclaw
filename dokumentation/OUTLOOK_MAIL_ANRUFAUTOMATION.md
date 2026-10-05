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
- Bei angenommenem Anruf keine zusätzliche Audio- oder Textzustellung.
- Wenn nach 45 Sekunden niemand abhebt, dieselbe bereits erzeugte Audio
  genau einmal als WhatsApp-Sprachnachricht an Leon senden. Kein zweiter Anruf,
  keine zusätzliche Textnachricht und keine erneute ElevenLabs-Synthese.

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

Seit der Erweiterung vom 05.10.2026 sendet das Plugin bei MeowCallers ausdrücklicher
Meldung `recipient did not answer within 45s` die vorbereitete MP3 nach
Opus-Konvertierung als WhatsApp-Sprachnachricht. Der Inhalt und die Stimme stammen
aus derselben TTS-Ausgabe wie für den Anruf; ffmpeg ändert nur das Audioformat.
Versand über OpenClaws öffentliche SDK-Funktion `sendDurableMessageBatch`,
fester Zielkontakt Leon, `audioAsVoice: true`, dauerhafte Zustellungswarteschlange
und stabiler Intent pro Job und Berliner Datum. Erfolg nur bei bestätigtem
Send-Ergebnis mit Plattform-Nachrichten-ID; kein Beleg für Anhören oder Lesen.

Bei technischen Verbindungsfehlern, unbekanntem Ende vor Wiedergabe,
unterbrochener Wiedergabe oder Abbruch des Laufs wird nicht pauschal eine
Sprachnachricht gesendet. Diese Fälle beweisen keine Nichtannahme. Schlägt der
Ersatzversand fehl, bleibt der Tagesnachweis erhalten und der Fehler wird
gemeldet; das Plugin wiederholt weder Anruf noch Versand selbst.

Build und Plugin-Validierung bestanden. Acht simulierte CLI-Tests bestanden:
Annahme, Nichtannahme, Verbindungs-/Wiedergabefehler, fehlgeschlagener Ersatzversand
und Abbruch. Zusätzlich registrierte Tool-Factory mit künstlichem MP3 geprüft:
einmalige Synthese, echte Opus-Konvertierung, Audio-Payload ohne Zusatztext,
festes Ziel, stabiler Zustellungs-Intent und Tages-Dublettensperre. Alle externen
Dienste und Anrufergebnisse dabei simuliert; kein echter Testanruf ausgelöst.

Vor Installation gesichert unter
`~/.local/share/jarvis-repairs/briefing-fallback-before-20261005T190747Z/`
(Plugin-Quellcode, Build, Manifest und bisheriger Automationseintrag).
Nur der Auftragstext des bestehenden Jobs angepasst; Zeitplan, Tool-Freigaben
und normale Chat-Zustellung bleiben erhalten. Gateway danach kontrolliert
neu gestartet.

Echter Test mit absichtlicher Nichtannahme auf Leons ausdrücklichen Wunsch:
05.10.2026, 21:10:10–21:11:34 Uhr Berlin, rund 83 Sekunden. Den Tagesnachweis
des vorherigen manuellen Tests zuvor in `manual-test-archives/` gesichert,
danach genau einmal ausgeführt. Scheduler: `status: ok`,
`completionStatus: succeeded`; Zusammenfassung meldet Nichtannahme und einmaligen
Ersatzversand. WhatsApp-Log bestätigt um 21:11:29 den Medienversand mit
Plattform-Nachrichten-ID `3EB08712C5879E35B93145`. Kein weiterer Anruf aktiv.
Run-ID: `manual:c67e5c8b-837c-424a-87a7-861e44f64c50:1791227410829:1`.
Leon hat anschließend bestätigt, dass der Test funktioniert hat und die
Ersatz-Sprachnachricht angekommen und abspielbar ist. Die tägliche Sperre ist
durch den neuen Versuch wieder aktiv;
nächste reguläre Ausführung bleibt 06.10.2026 um 18:00 Uhr Berlin.
`deliveryStatus: not-requested` betrifft nur die ausgeschaltete zusätzliche
Scheduler-Chat-Zustellung, nicht den vom Plugin bestätigten Audio-Versand.

Die CLI-Tests auf Ubuntu ausführen:

```bash
npm run build
node --test test/daily-fallback.test.mjs
```

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
