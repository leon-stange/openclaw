# Stündliche Warnung bei vielen ungelesenen E-Mails

Stand: 06.10.2026. Ergänzung zum bestehenden täglichen Briefing.

## Gewünschter Ablauf

- Jede Stunde zur fünften Minute, `Europe/Berlin`: Outlook-Posteingang lesen.
  Der Abstand zur vollen Stunde vermeidet einen gleichzeitigen Start mit dem
  täglichen Anruf um 18 Uhr.
- Bei mehr als sieben ungelesenen E-Mails einmal Leon anrufen. Die Ansage nennt
  die Gesamtzahl sowie Absender und Betreff der zwei neuesten ungelesenen Mails.
- Bei Nichtannahme nach 45 Sekunden dieselbe Audio als WhatsApp-Sprachnachricht
  senden, ohne zusätzliche Textmeldung oder zweiten Anruf.
- Solange die Zahl hoch bleibt, keine weitere Warnung. Erst eine erfolgreiche
  spätere Prüfung mit **weniger als sieben** gibt die Warnung wieder frei.
  Genau sieben setzt die Sperre nicht zurück.
- Beispiel: `8 → 10 → 7 → 8 → 6 → 8` ergibt Warnungen beim ersten und letzten
  Wert; die Zwischenwerte lösen keinen weiteren Anruf aus.
- Die Automation liest nur und markiert keine Mail als gelesen.

Job-ID: `19bcc650-d420-44e6-91ff-8cbc43bec279`.
Name: `hourly-unread-mail-threshold-call-leon`.
Cron: `5 * * * *`, ohne Stagger. Agent `main`, isolierte Sitzung,
keine zusätzliche Scheduler-Zustellung. Aktiviert, Vorschaumodus ausgeschaltet.
Erste reguläre Prüfung: **06.10.2026 um 18:05 Uhr Berlin**, danach stündlich.
Gateway und WhatsApp-Bereitschaft nach dem letzten Neustart geprüft.

## Technische Umsetzung

Das vorhandene Kontakt-Plugin bietet zusätzlich
`whatsapp_check_unread_mail_alert`. Es ist nur für diesen ausdrücklich
gebundenen Cron-Job verfügbar, nicht für normale Chats oder andere Jobs.
Zielkontakt Leon ist fest hinterlegt; das Modell liefert keine Telefonnummer.
Bestehende Kontakt-Tools und tägliches Briefing bleiben erhalten.

Die Automation darf nur zwei Werkzeuge nutzen:

```text
outlook__list-mail-folder-messages
whatsapp_check_unread_mail_alert
```

Outlook-Abfrage: `mailFolderId: inbox`, `filter: isRead eq false`,
`select: id,from,subject,receivedDateTime,isRead`, `fetchAllPages: true`.
Alle Seiten zählen, nach `receivedDateTime` absteigend sortieren und die
zwei neuesten ungelesenen Mails auswählen. Bei unvollständigem oder
fehlgeschlagenem Abruf keine erfundene Null an das Warnwerkzeug übergeben.

Der kleine JSON-Warnzustand liegt im privaten Scratch der Automation:
`version`, `armed`, `lastCount`, `checkedAt` und für eine Warnung
`alertId`, `attemptedAt`. Zugriff über die vorhandene OpenClaw-CLI, mit
fest gebundener Job-ID und `--expected-revision` beim Schreiben. Das SDK
`api.runtime.gateway.request` ist offiziellen/vertrauten Plugins vorbehalten
und wird deshalb nicht verwendet. Keine Vertrauenskennzeichnung oder
Sicherheitsprüfung wurde dafür geändert.

Vor dem Anruf wird `armed: false` atomar gespeichert. Scheitert die Speicherung
oder kommt es zu einem Revisionskonflikt, kein Anruf. Bei einem fehlgeschlagenen
oder unklaren Warnversuch bleibt die Sperre bestehen; kein blindes Wiederholen.
Die nächste erfolgreiche Prüfung unter sieben kann wieder freigeben. Ein
Neustart verliert die Sperre nicht. Zwischen zwei stündlichen Prüfungen kann
ein kurzfristiger Rückgang unter sieben nicht erkannt werden.

Der Ersatzversand nutzt denselben TTS-Inhalt, ffmpeg für Opus und
`sendDurableMessageBatch` mit stabilem Intent pro Warnung. Das ist die bereits
praktisch getestete Nichtannahme-Logik. Technische Verbindungsfehler oder
unterbrochene Wiedergabe gelten nicht automatisch als Nichtannahme.

## Sicherung und Tests

Vor Installation:
`~/.local/share/jarvis-repairs/inbox-alert-before-20261006T151838Z/`.
Enthält vorherigen Plugin-Quellcode, Build, Manifest und Konfiguration.

Tests auf Ubuntu:

```bash
npm run build
node --test test/daily-fallback.test.mjs test/inbox-alert.test.mjs
openclaw plugins validate --entry ./dist/index.js
```

Geprüft werden Schwellenzyklen, genau sieben, erneute Freigabe, dauerhafter
Zustand nach einer neuen Tool-Factory, ungültige Daten, Scratch-Lesefehler,
Revisionskonflikte, Vorschau ohne Zustandsänderung und der Audio-Ersatzversand.
Externe Dienste und Anrufe sind in den automatisierten Tests simuliert.

TypeScript-Build, generierte Plugin-Metadaten und Plugin-Validierung bestanden;
alle elf Tests bestanden, einschließlich der bisherigen täglichen
Nichtannahme-Tests. Erfolgreicher realer Vorschaulauf am 06.10.2026 um
17:22:54–17:23:20 Berlin: null ungelesene E-Mails, kein Anruf und keine
Sprachnachricht, Scratch nur gelesen. Run-ID:
`manual:19bcc650-d420-44e6-91ff-8cbc43bec279:1791300174745:1`.
Anschließend leeren Scratch mit `version: 1, armed: true` initialisiert und
Vorschaumodus beendet. Nutzer-Mails wurden für Tests nicht verändert.

### Erster echter Warnversuch und Reparatur am 06.10.2026

Manueller Lauf um 17:26:16 Berlin erkannte neun ungelesene Mails und rief das
Warn-Tool einmal auf. MeowCaller konnte sich jedoch nicht verbinden:
`Client outdated (405) connect failure (client version: 2.3000.1040847988)`,
anschließend `timed out waiting for WhatsApp connection`. Der Abbruch lag
vor `client.Call`; es wurde kein Anruf gewählt. Die Nichtannahme-Fallback-Regel
greift hier nicht, weil kein klingelnder Anruf vorausging. Der Scheduler
meldete trotzdem `ok`, da der Agent den Tool-Fehler abschließend zusammenfasste.
Run-ID: `manual:19bcc650-d420-44e6-91ff-8cbc43bec279:1791300376846:1`.

MeowCaller fragt jetzt vor jeder Verbindung mit maximal 15 Sekunden Wartezeit
die aktuelle WhatsApp-Web-Version ab und setzt sie über `store.SetWAVersion`.
Das nutzt die bereits installierte Bibliotheksfunktion
[`GetLatestVersion`](https://github.com/tulir/whatsmeow/blob/main/update.go);
keine Änderung der Bibliotheksabhängigkeiten oder OpenClaw-Version.
Schlägt die Versionsabfrage fehl, bricht der Client vor dem Verbinden ab.
Reproduzierbarer Patch: [refresh-whatsapp-version.patch](../meowcaller-patches/refresh-whatsapp-version.patch).
Er gilt für MeowCaller-Quellstand `7520504` und wird vor einem Neubau im
Quellverzeichnis mit `git apply --check` und anschließend `git apply` angewandt.

Go-Tests für `./cmd/meowcaller` und Neubau bestanden. Ein gesonderter echter
Verbindungstest um 17:33:57 Berlin authentifizierte das bestehende Gerät mit
Version `2.3000.1049440263`; dabei wurde kein Anruf ausgeführt. Danach wurde
`~/.local/bin/meowcaller` atomar ersetzt. Das betrifft auch Kontakt-Anrufe und
das tägliche Briefing; ein Gateway-Neustart war dafür nicht nötig.
Backup von ursprünglichem Quellcode und Binary:
`~/.local/share/jarvis-repairs/meowcaller-version-20261006T153314Z/`.

Der Warnzustand war nach dem fehlgeschlagenen Versuch vorsorglich gesperrt.
Wegen des nachgewiesenen Abbruchs vor dem Wählen wurde er einmalig mit
Revisionsprüfung wieder freigegeben (Revision 2 auf 3). Vorheriger Scratch
liegt im Backup als `inbox-scratch-before-rearm.json`. Kein zusätzlicher
manueller Automationslauf wurde gestartet. Bei weiterhin mindestens acht
ungelesenen Mails kann der nächste reguläre Lauf um 18:05 wieder warnen.
Leon hat anschließend den erfolgreichen Warnanruf der regulären stündlichen
Prüfung mit den aktuellen neun ungelesenen E-Mails bestätigt. Damit ist der
echte Warnanruf nach der Reparatur praktisch bestätigt. Die Nichtannahme wurde
bei diesem Lauf nicht separat berichtet; der bereits bestätigte tägliche
Fallback und die simulierten Tests sind davon getrennte Nachweise.

## Betrieb

```bash
openclaw automations show 19bcc650-d420-44e6-91ff-8cbc43bec279
openclaw automations scratch 19bcc650-d420-44e6-91ff-8cbc43bec279 --json
openclaw automations runs 19bcc650-d420-44e6-91ff-8cbc43bec279 --limit 5 --json
```

Scratch nicht ungefragt löschen oder auf `armed: true` setzen: Das kann eine
erneute Warnung trotz weiterhin hoher Zahl auslösen. Für Tests gibt es
`plugins.entries.whatsapp-call-contact.config.inboxAlert.dryRun`; dieser Modus
liest den Zustand, verändert ihn aber nicht und löst keine Audio/Anrufe aus.
Nach Plugin-/Konfigurationsänderungen Gateway kontrolliert neu starten und
WhatsApp-Bereitschaft prüfen.
