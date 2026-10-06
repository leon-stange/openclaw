# Einkaufsliste: Erinnerung am Mittwoch

Stand: 06.10.2026. Gewünschter Ablauf: jeden Mittwoch exakt 12:00 Uhr
Europe/Berlin die **offenen** Artikel der Liste **Einkaufen** prüfen.
Erledigte Artikel zählen nicht, Mengen zählen nicht als mehrere Artikel.
Bei zehn oder mehr offenen Artikeln keine Nachricht und kein Anruf.
Bei null bis neun offenen Artikeln einmal Leon und einmal Annka anrufen.

Job-ID: `6e6d41db-2988-4b6c-9bff-b5322527cbd2`.
Name: `weekly-shopping-completeness-wednesday-noon`.
Cron: `0 12 * * 3`, exakt, Zeitzone Europe/Berlin, Agent main, isoliert,
360 Sekunden Zeitlimit, keine zusätzliche automatische Chat-Zustellung.
Nur zwei Tools: `einkauf_liste_lesen` und `whatsapp_weekly_shopping_reminder`.

## Nachricht und Empfänger

Persönliche Anreden entsprechend den vorhandenen Servervorgaben:

- Leon: „Hallo Leon, Jarvis hier.“
- Annka: „Hallo Annka, JARVIS hier.“

Danach nennt Jarvis die Zahl offener Artikel und erklärt, dass die Liste
scheinbar noch nicht vollständig ist und ausgefüllt werden müsste. Er bietet
an, über WhatsApp kontaktiert zu werden und Artikel hinzuzufügen. Die konkrete
Anrede ist je Empfänger anders; es werden zwei separate Audios erzeugt.
Leon ist fest der konfigurierte authorizedCaller, Annka wird aus dem bereits
zugelassenen Kontakt Annka genommen. Das Modell liefert keine Telefonnummer.

Bei einem erfolglosen Anruf, einschließlich Nichtannahme nach 45 Sekunden,
wird die **für diesen Empfänger bereits erzeugte Audio** als Sprachnachricht
an genau diesen Empfänger gesendet. Für diese Automation ist der Ersatzversand
auch bei technischen Anruffehlern vorgesehen. Bei einem Abbruch oder veralteten
Aufrufkontext erfolgt kein neuer Versand. Ein Fehler bei TTS oder Ersatzversand
wird nicht durch erneute Anrufe kompensiert. Wenn der Anruf teilweise abgespielt
wurde und danach fehlschlägt, kann die Sprachnachricht den schon gehörten Teil
erneut enthalten. Bestehende tägliche und stündliche Mail-Automationen behalten
ihre bisherige Regel für eindeutig nicht angenommene Anrufe.

Die beiden Empfänger werden nacheinander bearbeitet. Ein Fehler bei Leon
verhindert den Versuch für Annka nicht, sofern die Automation nicht abgebrochen
oder ihr Kontext ungültig wurde. Erfolgreicher Anruf bedeutet abgeschlossene
Audioausgabe; erfolgreicher Versand bedeutet Plattformbestätigung, nicht Lesen.

## Zustand und Fehler

Vor den Anrufen wird der private Automation-Scratch mit Revisionsprüfung
gespeichert. Er enthält den bereits versuchten Mittwoch-Zyklus. Ein erneuter
Aufruf derselben Woche löst keine weiteren Anrufe aus. Der nächste Mittwoch
ist automatisch ein neuer Zyklus; eine anhaltend kurze Liste wird dann erneut
gemeldet. Die Wochenzuordnung verwendet das Datum in Europe/Berlin.

Bei einer nicht gefundenen oder mehrdeutigen Liste, API-Fehlern oder unklarem
Zähler erfolgt keine falsche Null-Meldung und kein Warnanruf. Das neue
Automationsrecht im Einkaufs-Plugin erlaubt ausschließlich das Lesen offener
Artikel auf Einkaufen, keine Schreibaktionen. Die normalen Owner-Tools für
Leon und Annka bleiben erhalten.

## Tests und Betrieb

Testmodus: `plugins.entries.whatsapp-call-contact.config.shoppingReminder.dryRun`.
Er prüft den Zähler und liefert beide Nachrichtentexte, ohne Scratch zu ändern,
Audio zu erzeugen, anzurufen oder Nachrichten zu senden.

```bash
openclaw automations show 6e6d41db-2988-4b6c-9bff-b5322527cbd2
openclaw automations scratch 6e6d41db-2988-4b6c-9bff-b5322527cbd2 --json
openclaw automations runs 6e6d41db-2988-4b6c-9bff-b5322527cbd2 --limit 5 --json
```

Scratch nicht für einen erneuten Test löschen: Das kann in derselben Woche
erneute Anrufe auslösen. Ein Vorschaulauf benötigt das nicht.
## Einrichtung am 06.10.2026

Beide Plugins gebaut, Metadaten generiert und durch OpenClaw 2026.9.8 validiert.
Alle 20 Tests erfolgreich: 13 im Anruf-Plugin einschließlich bestehender
Tages-/Mail-Fallback-Tests, sieben im Einkaufs-Plugin. Neue Tests prüfen
persönliche Anreden, Berliner Wochenwechsel, Grenze zehn, zwei getrennte
Fallbacks auch bei technischen Anruffehlern, Wochensperre, nächsten Zyklus,
Vorschau, Revisionskonflikt und ausschließlich lesendes Automationsrecht.
Anrufe und Versand waren in diesen Tests simuliert.

Echter Vorschaulauf am 06.10.2026 um 19:09:17–19:09:39 Berlin: null offene
Artikel ermittelt, Erinnerungs-Tool einmal erfolgreich im Vorschaumodus
ausgeführt. Keine Anrufe oder Nachrichten und keine Scratch-Änderung.
Run-ID: `manual:6e6d41db-2988-4b6c-9bff-b5322527cbd2:1791306557585:1`.

Anschließend Vorschau ausgeschaltet, Konfiguration validiert und Gateway
kontrolliert neu gestartet. Erste reguläre Ausführung: **07.10.2026, 12:00
Uhr Berlin**, anschließend jeden Mittwoch. Ein echter Anruf an beide Personen
war zu diesem Zeitpunkt noch nicht praktisch bestätigt; siehe den folgenden Test.

Backup vor der Änderung:
`~/.local/share/jarvis-repairs/weekly-shopping-before-20261006T170820Z/`.
Enthält vorherige Plugin-Dateien und private Konfiguration. Das bestehende
Einkaufs-Setup-Skript bewahrt beim erneuten Aufruf jetzt die Automationsbindung.

## Manueller Test und zusätzliche Anrufdiagnose

Leon startete die Automation am 06.10.2026 um 19:13:32 Berlin manuell.
Run-ID: `manual:6e6d41db-2988-4b6c-9bff-b5322527cbd2:1791306812566:1`.
Null offene Artikel. Leon berichtet: Anruf angenommen, nichts gehört,
nach ungefähr fünf Sekunden aufgelegt, anschließend Sprachnachricht erhalten.
Der gespeicherte Tool-Aufruf bestätigt für Leon `called: false` und erfolgreichen
Fallback-Versand. WhatsApp bestätigt den Medienversand um 19:14:07 Berlin.
Für Annka meldet der Client `called: true`; das ist keine unabhängige Bestätigung,
dass sie die Audio tatsächlich gehört hat. Die konkrete Ursache der Stille
ist rückwirkend nicht belegt: Der erfolgreiche Fallback hatte den ursprünglichen
Anruffehler nicht im Resultat erhalten.

Deshalb wurde MeowCaller um strukturierte Phasen ergänzt: Verbindung vorhanden,
Anruf gestartet, Audiokanal bereit, erster Audioframe gelesen, Wiedergabe beendet
mit Frame-Zähler, Anruf beendet. Das Plugin speichert diese Phasen sowie Exitcode
und bekannten Fehlergrund auch bei erfolgreichem Ersatzversand privat unter
`~/.openclaw/state/call-diagnostics/<zufällige ID>.json`, Modus 600, Verzeichnis 700.
Es speichert keine Rohlogs, Audioinhalte, Zugangsdaten oder Telefonnummern;
das Ziel wird als Hash zugeordnet. Ein gelesener Frame beweist nicht, dass die
Gegenseite ihn hörte. Fehlende Phasen werden nicht als gesicherter Ablauf gewertet.

Go-Tests inklusive Sichtbarkeit der Diagnose bei normalem Log-Level bestanden;
14 Anruf-Plugin-Tests einschließlich Erhalt von Fehlergrund nach erfolgreichem
Fallback und Ausschluss von Zusatzdaten bestanden. Build und Plugin-Validierung
bestanden. Instrumentierte Version auf dem Server installiert, Gateway neu
gestartet. Keine echten Anrufe zu Diagnosezwecken ausgelöst und Wochensperre
nicht zurückgesetzt. Backup:
`~/.local/share/jarvis-repairs/call-diagnostics-before-20261006T171901Z/`.
Reproduzierbarer MeowCaller-Patch:
[call-diagnostics.patch](../meowcaller-patches/call-diagnostics.patch).

## Erfolgreicher Abschlusstest

Leon bestätigt anschließend einen hörbaren normalen Testanruf. Ein erneuter
manueller Automationslauf um 19:23:07 Berlin löste erwartungsgemäß keinen
Anruf aus: Scratch enthielt `attemptedPeriod: 2026-09-30`. Die Modellzusammenfassung
sprach ungenau von der Schwelle; tatsächlich war die Wochensperre maßgeblich.

Auf Leons ausdrücklichen Wunsch wurde die Sperre um 19:25 Berlin einmalig mit
Revisionsprüfung zurückgesetzt (Revision 2 auf 3). Vorheriger Zustand gesichert:
`~/.local/share/jarvis-repairs/weekly-shopping-manual-tests/20261006T172517Z-scratch-before-reset.json`.
Codex löste dabei keinen Anruf aus.

Leon startete danach selbst erneut die Automation und bestätigt: Er hörte
die Audio im Anruf, legte absichtlich auf und erhielt anschließend die
Sprachnachricht. Persönlicher Anruf und Ersatzversand an Leon sind damit
praktisch erfolgreich bestätigt. Für Annka liegt die oben genannte erfolgreiche
Client-Rückmeldung vor, keine separate Hörbestätigung. Ursache der ersten
vorübergehenden Stille weiterhin nicht gesichert; Diagnose bleibt aktiv.
Der nächste Mittwoch beginnt einen neuen Zyklus und wird durch den heutigen
manuellen Versuch nicht gesperrt.
