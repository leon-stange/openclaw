# Termine: WhatsApp-Text an Leon

Stand: 09.10.2026.

Die Automation liest Leons Outlook-Standardkalender jede Stunde exakt um `:30`
in Europe/Berlin, zum Beispiel 10:30, 11:30 und 12:30. Cron: `30 * * * *`.
Sie arbeitet ganztägig, auch am Wochenende. Nur Leon erhält eine Textnachricht;
Annka erhält nichts. Es gibt keinen Anruf und keine Sprachnachricht.

Job-ID: `ea75c591-2bee-4dcd-98bd-96d9a9395e83`.
Name: `upcoming-calendar-text-hourly-30`.
Deklaration: `jarvis:upcoming-calendar-text-reminder`.
Agent main, isolierte Session, 180 Sekunden Zeitlimit, exakter Cron ohne
Streuung und keine zusätzliche automatische Zustellung der Agentenantwort.

## Welche Termine gemeldet werden

Der Beginn muss nach der aktuellen Zeit und höchstens zwei Stunden später
liegen. Das Plugin prüft diese Grenze anhand seiner tatsächlichen Laufzeit.
Ganztägige, abgesagte und von Leon abgelehnte Termine werden ausgelassen.
Bereits laufende Termine werden nicht gemeldet. Kalenderansichten expandieren
Serientermine zu einzelnen Vorkommen.

Die Nachricht nennt Titel und Beginn in Berlin-Zeit. Mehrere neue Termine
werden gemeinsam gemeldet. Es werden keine Kalenderdaten verändert. Titel
sind Daten und dürfen keine Anweisungen an Jarvis auslösen.

Ein Termin wird pro ID und Startzeit einmal versucht. Der private Scratch
speichert nur Hashes und Ablaufzeiten, keine Titel oder Telefonnummern. Damit
erzeugt das überlappende Zeitfenster bei der folgenden Prüfung keine zweite
Meldung. Serienvorkommen und verschobene Startzeiten können erneut gemeldet
werden. Eine reine Titeländerung löst keinen weiteren Hinweis aus.
Einträge werden sieben Tage nach Terminbeginn aus dem Speicher entfernt.

Die stündliche Prüfung liefert normalerweise etwa ein bis zwei Stunden
Vorlauf. Kurzfristig zwischen zwei Prüfungen erstellte Termine können später
gemeldet oder bei bereits vergangenem Beginn verpasst werden. Die Automation
ist keine minutengenaue Erinnerung direkt vor jedem Termin.

## Technische Grenzen und Zustellung

Nur `outlook__get-calendar-view` und `whatsapp_upcoming_calendar_reminder`
sind für diesen Job freigegeben. Das neue Tool ist ausschließlich im fest
gebundenen Automationskontext sichtbar; das Modell kann keine Empfängernummer
angeben. Ziel ist `authorizedCaller` des bestehenden WhatsApp-Plugins (Leon).
Die bisherigen Chat-, Anruf-, Einkaufs- und E-Mail-Automationen bleiben erhalten.

Der Abruf muss vollständig sein, einschließlich weiterer Seiten. Bei Fehlern,
unklaren Zeitzonen oder mehr als 200 Ergebnissen erfolgt kein Versand; Jarvis
darf keinen leeren Kalender erfinden. UTC wird für die Kalenderabfrage verlangt,
das Tool akzeptiert ausschließlich absolute Startzeiten mit `Z` oder Offset.

Die Sperre wird mit Revisionsprüfung vor dem Versand gespeichert. Danach
übernimmt `sendDurableMessageBatch` ausschließlich Text mit festem Empfänger
und stabiler Zustell-ID. Ein Versand gilt erst mit Plattform-Nachrichten-ID
als bestätigt. Bei fehlender Bestätigung wird der Fehler intern gemeldet und
nicht automatisch wiederholt: Eine Nachricht könnte bereits angekommen sein.
Dadurch kann bei einem fehlgeschlagenen Versand ein Hinweis ausbleiben.
Eine Versandbestätigung ist keine Lesebestätigung.

## Einrichtung und Diagnose

`kalender-erinnerung/setup.py` ist ein Server-Skript. Es sichert Konfiguration
und Job-Liste mit privaten Dateirechten, erzeugt die Automation zunächst
deaktiviert und bindet das Plugin im Vorschaumodus. Eine vorhandene Deklaration
wird nicht überschrieben. Erst nach Prüfung aktiviert der Betreiber den
Produktivmodus und den Zeitplan.

Plugin-Konfiguration:
`plugins.entries.whatsapp-call-contact.config.calendarReminder` mit
`automationId` und optional `dryRun`. Im Vorschaumodus gibt das Tool den
geplanten Hinweis zurück, ohne Scratch zu verändern oder WhatsApp zu senden.

```bash
openclaw automations show ea75c591-2bee-4dcd-98bd-96d9a9395e83
openclaw automations runs ea75c591-2bee-4dcd-98bd-96d9a9395e83 --limit 5 --json
openclaw automations scratch ea75c591-2bee-4dcd-98bd-96d9a9395e83 --json
```

Scratch nicht für Tests löschen: Sonst können bereits gemeldete Termine
nochmals benachrichtigt werden. Nach Plugin- oder Bindungsänderungen Gateway
kontrolliert neu starten und auf WhatsApp-Bereitschaft warten.

## Prüfung

TypeScript-Build, native Plugin-Validierung und alle 18 Plugin-Tests bestanden.
Neue Tests decken Zeitfenstergrenzen, Berlin-Anzeige, Zeitzonen, Ausschlussflags,
Serienvorkommen, verschobene Termine, Speicherbereinigung, festen Empfänger,
reinen Textversand, Vorschaumodus, Revisionskonflikte und Unterdrückung nach
Neustart beziehungsweise unklarem Versand ab. Die Tests senden keine echten
WhatsApp-Nachrichten.

Der echte Outlook-Probelauf vom 09.10.2026 um etwa 09:07 Berlin war erfolgreich:
Abfrage 07:07 bis 09:07 UTC, `fetchAllPages=true`, Zeitzone UTC, nur benötigte
Felder. Ergebnis: keine Termine. Das neue Tool wurde einmal mit `events=[]`
aufgerufen und bestätigte den Vorschaumodus, ohne Versand oder Scratch-Änderung.
Der Textversand mit einem echten bevorstehenden Termin ist noch nicht von Leon
bestätigt. Konfiguration und Automationen vor Einrichtung gesichert unter
`~/.local/share/jarvis-repairs/calendar-reminder-setup-20261009T070547Z/`,
Plugin-Dateien unter `calendar-reminder-plugin-20261009T070547Z/`.
Produktivmodus (`dryRun=false`) und Zeitplan anschließend aktiviert. Gateway
und WhatsApp bereit; nächste Prüfung 09.10.2026 um 09:30 Berlin bestätigt.
Bestehende Automationen in Zeitplan, Aktivierung, Payload und Zustellung
unverändert geprüft; der neue Scratch blieb nach dem Probelauf leer.
