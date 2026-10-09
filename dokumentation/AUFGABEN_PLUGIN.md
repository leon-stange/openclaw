# Jarvis Aufgaben und Anruf-Erinnerungen

Stand: 09.10.2026. Eigenes OpenClaw-Plugin `aufgaben` für Leon und Annka.
Die erste Version unterstützt einmalige Aufgaben, keine Wiederholungsregeln.

## Verwendung über WhatsApp

- „Erinnere mich morgen daran, einen Werkstatttermin zu buchen.“
  → morgen um **15:00 Europe/Berlin**.
- „Erinnere mich morgen um 10:30 Uhr daran, das Paket abzuholen.“
  → die ausdrücklich genannte Uhrzeit hat Vorrang.
- „Erinnere mich in zwei Stunden an die Waschmaschine.“
  → zwei Stunden nach dem Tool-Aufruf.
- „Ich muss noch einen Werkstatttermin vereinbaren.“
  → Aufgabe ohne Erinnerung, sofern kein Erinnerungszeitpunkt beauftragt wurde.
- „Was habe ich noch offen?“ → eigene und gemeinsame offene Aufgaben.
- „Der Werkstatttermin ist erledigt.“ → passende Aufgabe abschließen.
- „Verschiebe die Erinnerung auf morgen.“ → neuer Termin morgen um 15 Uhr.
- „Lösche die Aufgabe mit dem Paket.“ → Aufgabe aus der Anzeige entfernen.
- „Erinnere uns morgen daran, den Balkon aufzuräumen.“
  → ausdrücklich gemeinsame Aufgabe mit separater Erinnerung für beide.

Jarvis bestätigt nach dem Anlegen das konkrete Datum und die Berliner Uhrzeit.
Bei mehrdeutiger Zuordnung fragt er nach und benutzt eine echte Aufgaben-ID
aus einer frischen Liste. Wenn auch das Datum fehlt, fragt er nach dem Zeitpunkt.
Ein Zeitpunkt in der Vergangenheit wird abgewiesen und nicht heimlich verschoben.
Mehrdeutige oder nicht existente Uhrzeiten bei Zeitumstellung werden abgewiesen.

## Anruf und Ersatz-Audio

Der Hintergrundlauf prüft **jede Minute** fällige Erinnerungen. Dafür wird kein
Sprachmodell gestartet: Ein natives OpenClaw-Skript ruft nur das gebundene
Aufgabentool auf. Der Anruf erfolgt daher ungefähr zur gewünschten Uhrzeit,
nicht mit garantierter Sekundengenauigkeit. Bei ausgeschaltetem Server werden
fällige offene Erinnerungen nach dem Wiederanlauf nachgeholt.

Jede Erinnerung ruft ausschließlich ihre fest zugeordneten Personen an. Persönliche
Aufgaben von Leon gehen nur an Leon, Annkas Aufgaben nur an Annka. Bei einer
gemeinsamen Aufgabe erhält jeder eine eigene Audio mit persönlicher Anrede.
Nichtannahme nach 45 Sekunden und technische Anruffehler verwenden dieselbe
vorbereitete Audio als WhatsApp-Sprachnachricht. Ein abgebrochener oder veralteter
Aufrufkontext löst keinen weiteren Versand aus.

Ein Erinnerungsversuch wird **vor dem Anruf** dauerhaft markiert. Es erfolgt
kein ständiges Nachtelefonieren. Der Anruf erledigt die Aufgabe nicht; sie bleibt
offen. „Verschieben“ setzt eine neue einmalige Erinnerung. „Erledigt“ und „Löschen“
beenden ausstehende Erinnerungen. Ein bereits gestarteter Anruf lässt sich durch
eine nachträgliche Änderung nicht zurückholen.

Der Dispatcher verarbeitet höchstens zwei Empfänger-Erinnerungen pro Lauf,
seriell. Mehrere gleichzeitig fällige Aufgaben können dadurch später kommen.
Das bestehende Anruflimit bleibt wirksam. Bei einem Fehler ohne bestätigten
Anruf oder Ersatzversand wird der Versuch nicht automatisch wiederholt;
eine gewünschte neue Erinnerung muss ausdrücklich verschoben werden.

## Personen und Speicherung

Das Modell kann keine persönliche Zielperson oder Telefonnummer angeben.
Zuordnung ausschließlich aus `requesterSenderId` plus OpenClaws `senderIsOwner`,
mit fest hinterlegten Nummern und LID-Zuordnungen aus den vorhandenen WhatsApp-
Zugangsdaten. Bei unbekannter oder mehrdeutiger Identität werden die Chattools
nicht angeboten. Gemeinsame Aufgaben dürfen beide Beteiligten bearbeiten.

`session.dmScope=per-channel-peer` trennt die WhatsApp-Unterhaltungen pro
Absender. Neue Chatsitzungen verwenden nicht die bisherige gemeinsame Historie.
Die bisherigen Kalender-, Einkaufs- und Anruffunktionen bleiben vorhanden.
Eine neue WhatsApp-LID-Zuordnung muss bei Bedarf vom Betreiber aktualisiert
werden; Chattext kann diese Zuordnung nicht ändern.

Privater Bestand: `~/.local/share/jarvis-aufgaben/state/tasks.json`, Verzeichnis
0700, Datei 0600. Keine Aufgaben oder Identitätsdaten im Git-Repository.
Atomare Dateiersetzung und Schreibsperre schützen konkurrierende Änderungen.
Ein Tool-Aufruf wird über seine ID protokolliert, damit dessen Wiederholung
keine zweite Aufgabe erzeugt. Neue Tool-IDs sind neue Aufträge: Bei unklarer
Bestätigung muss Jarvis zuerst lesen, statt blind erneut anzulegen.

Erledigte Aufgaben bleiben über `includeCompleted` lesbar. Gelöschte Aufgaben
werden verborgen; technische Datensätze und Aufrufprotokolle bleiben im privaten
Bestand erhalten. Obergrenzen: 2.000 Aufgaben und 10.000 Mutationseinträge.
Bei Erreichen ist eine kontrollierte Bereinigung durch den Betreiber erforderlich.
Passwörter und andere Geheimnisse gehören nicht in Aufgabentitel.

## Installation und Betrieb

Live-Plugin: `~/.local/share/jarvis-aufgaben`.
Konfiguration: `plugins.entries.aufgaben.config` mit privatem `stateDir`,
festem `callModule`, gebundener `automationId`, den beiden Mitgliedern und
optionalem `dryRun`. Der gemeinsame Audio-Fallback wird über den exportierten
Helper `deliverInboxAlert` aus `whatsapp-call-contact` wiederverwendet.
Empfänger werden zusätzlich gegen dessen freigegebene Kontaktliste geprüft.

Job-ID: `022d4fd4-9aef-41cc-83fa-f167272c096d`.
Deklaration: `jarvis:task-call-reminders`.
Cron `* * * * *`, Europe/Berlin, exakt, isoliert, Agent main, 240 Sekunden
Skriptlimit, ein Tool-Aufruf, keine zusätzliche automatische Chat-Zustellung.
Einziges Tool: `aufgaben_erinnerungen_pruefen`.
Native Headless-Sitzung exakt `agent:main:cron:<Job-ID>:trigger`;
andere Jobs und normale Chats dürfen das interne Versandtool nicht verwenden.

Das Server-Skript `plugins/aufgaben/setup.py` sichert die bestehende Konfiguration,
übernimmt die fest freigegebenen Kontakte und deren LID-Zuordnung, registriert
das Plugin und erzeugt den Hintergrundlauf deaktiviert im Vorschaumodus.
Nach erfolgreichem Probelauf wird `dryRun=false` gesetzt und der Job aktiviert.
Bestehende Agent-Anweisungen wurden um die Regeln aus `instructions.md` ergänzt:
Aufgaben nur über das Plugin verwalten, keine zusätzlichen Cronjobs pro Aufgabe,
Standardzeit 15 Uhr, keine privaten Aufgaben über Datei- oder Shelltools lesen.

```bash
openclaw automations show 022d4fd4-9aef-41cc-83fa-f167272c096d
openclaw automations runs 022d4fd4-9aef-41cc-83fa-f167272c096d --limit 5 --json
```

Dateisperre oder Versuchszustand nicht zum erneuten Anrufen löschen. Beim
Vorschaumodus werden weder Aufgaben verändert noch Anrufe oder Nachrichten
ausgelöst. Nach Pluginänderungen kontrollierter Gateway-Neustart und Prüfung
der WhatsApp-Bereitschaft.

## Validierung und Sicherungen

Fünf Aufgaben-Tests sowie alle 18 bisherigen Anruf-Plugin-Tests erfolgreich.
Beide Plugins gebaut und nativ validiert. Tests prüfen Standardzeit, DST,
persönliche und gemeinsame Sichtbarkeit, vertrauenswürdige Identität,
Idempotenz, Verschieben, Erledigen, feste Empfänger, Versuchssperre vor Versand,
Neustart, unklare Ergebnisse, konkurrierende Änderungen und veraltete Aufrufe.
Es wurden keine echten Testanrufe ausgelöst.

Konfiguration und Agent-Anweisungen vor Einrichtung:
`~/.local/share/jarvis-repairs/tasks-setup-20261009T074019Z/`.
Anruf-Helper vor Export: `~/.local/share/jarvis-repairs/tasks-call-helper-before/`.
Beim ersten Skript-Probelauf fehlte das Tool, weil die native Headless-Sitzung
auf `:trigger` endet. Dieser genaue Kontext ist jetzt zugelassen; ähnliche
falsche Suffixe bleiben gesperrt. Dafür wurde kein OpenClaw-Kerncode verändert.

Vorschaulauf anschließend erfolgreich, Produktivmodus und minütlicher Zeitplan
aktiviert. Regulärer Lauf am 09.10.2026 um 09:52 Berlin erfolgreich in 68 ms,
ohne Sprachmodell oder Zusatz-Zustellung. Bestand noch leer, Datei 0600.
Der aktuelle Gateway war für WhatsApp bereit; bestehende Automationen in
Zeitplan, Aktivierung, Payload und Zustellung unverändert geprüft.
Das Anlegen einer echten Aufgabe über WhatsApp und deren tatsächlicher
Erinnerungsanruf sind noch nicht durch Leon bestätigt.
