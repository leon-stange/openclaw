# Jarvis / OpenClaw – Erinnerungen für die Weiterarbeit

Stand: 08.10.2026

## Ergänzung vom 08.10.2026: Einkaufs-Erinnerung freier formuliert

Leon bestätigt den regulären Einkaufsanruf, möchte abwechslungsreichere Texte.
Die Donnerstag-Automation liefert jetzt `reminderLeon` und `reminderAnnka`
als frei formulierte kurze Hinweise. Persönliche Anrede und echte Artikelzahl
setzt das Plugin fest davor. Alte Aufrufe ohne Texte behalten den bisherigen
Text als Fallback, ebenfalls ohne WhatsApp-Kontakthinweis oder Angebot zum
Hinzufügen von Artikeln. Auch der freie Text verzichtet darauf.
Zeitplan, Empfänger, Zehnerschwelle, Wochensperre und
Audio-Ersatzversand unverändert. Build, 15 Plugin-Tests und native Validierung
erfolgreich; Server aktualisiert und Gateway neu gestartet. Scratch vor/nach
identisch geprüft, keine Anrufe zu Testzwecken ausgelöst. Echte Audio mit den
neuen freien Texten noch nicht bestätigt. Details:
[EINKAUF_DONNERSTAG_ERINNERUNG.md](EINKAUF_DONNERSTAG_ERINNERUNG.md).

## Ergänzung vom 06.10.2026: Einkaufs-Erinnerung, jetzt Donnerstag

Job `6e6d41db-2988-4b6c-9bff-b5322527cbd2`, jeden Donnerstag exakt 16:00 Uhr
Europe/Berlin. Prüft offene Artikel auf Einkaufen. Weniger als zehn:
persönlicher Anruf an Leon und Annka; bei Nichtannahme oder technischem
Anruffehler die jeweilige vorbereitete Audio als Sprachnachricht. Zehn oder
mehr: keine Erinnerung. Ein Versuch je Donnerstag-Zyklus durch privaten Scratch
mit Revisionsprüfung; nächste Woche bei weiterhin kurzer Liste erneut.
Die Einkaufs-App bleibt unverändert, Schreibrechte der Chat-Tools unverändert.
Automationskontext bekommt ausschließlich das Lesen der offenen Standardliste
und das feste Erinnerungs-Tool, keine frei wählbaren Empfänger.

20 Tests und beide nativen Plugin-Validierungen erfolgreich. Echter Vorschaulauf
mit null offenen Artikeln erfolgreich, ohne Versand oder Scratch-Änderung.
Ursprünglicher Start war am 07.10.2026 um 12:00 Berlin vorgesehen; auf Leons
Wunsch umgestellt, nächste Ausführung nun 08.10.2026 um 16:00 Berlin.
Sperrzyklus von Mittwoch auf Donnerstag verschoben, vorhandenen Marker
entsprechend migriert. Nach zunächst stillem Anruf
zusätzliche private Phasendiagnose in MeowCaller und im Plugin installiert;
Go-Tests, 14 Anruf-Plugin-Tests und Plugin-Validierung erfolgreich. Die
Wochensperre beim erneuten manuellen Lauf griff nachweislich. Auf Wunsch
Leons einmalig gesichert zurückgesetzt. Abschließend bestätigt Leon beim
selbst gestarteten Automationslauf hörbare Audio im Anruf und nach absichtlichem
Auflegen erfolgreich eingegangene Sprachnachricht. Annkas Anruf vom ersten
Lauf ist nur durch den Client als abgeschlossen bestätigt. Diagnose bleibt
aktiv; Ursache der ersten Stille weiterhin offen. Details und Backup:
[EINKAUF_DONNERSTAG_ERINNERUNG.md](EINKAUF_DONNERSTAG_ERINNERUNG.md).

## Ergänzung vom 06.10.2026: Einkaufs-PWA angebunden und getestet

Eigenes Plugin `einkaufsplaner` unter `plugins/einkaufsplaner`, auf dem Server
unter `/home/leon/.local/share/jarvis-einkaufsplaner`. Verwendet ausschließlich
die HTTPS-API der bestehenden App `https://app.stangeleon.de`, Konto `Jarvis`
als normaler Benutzer in der gemeinsamen Gruppe. Standardliste **Einkaufen**.
Listen lesen, Artikel hinzufügen und abhaken; nur aktuelle WhatsApp-Owner
erhalten die Tools. Passwort separat in privater Serverdatei, nicht im Repo.
Die Einkaufs-App bleibt in ihrem eigenen Repository und wurde nicht verändert.

Sechs Client-Tests lokal und auf Ubuntu erfolgreich, native Plugin-Validierung
erfolgreich. Leon bestätigt anschließend den erfolgreichen echten Einsatz;
WhatsApp-Screenshot zeigt Lesen, Audioantwort und Abhaken von drei Bananen
zwischen 18:57 und 18:59 Berlin. Details, Einrichtung und Grenzen:
[EINKAUFSPLANER_ANBINDUNG.md](EINKAUFSPLANER_ANBINDUNG.md).

Auch die beiden Anruf-Automationen hat Leon heute bestätigt: regulärer
18-Uhr-Anruf erfolgreich, danach Warnanruf der stündlichen Prüfung mit neun
ungelesenen E-Mails erfolgreich. Damit ist der tatsächliche Anruf nach der
MeowCaller-Versionsreparatur bestätigt.

## Ergänzung vom 06.10.2026: stündliche E-Mail-Warnung

Leon berichtet nach einem Tag Nutzung, dass der aktuelle Stand gut funktioniert.
Neue Automation `19bcc650-d420-44e6-91ff-8cbc43bec279`, Name
`hourly-unread-mail-threshold-call-leon`: stündlich um fünf nach in
`Europe/Berlin`, isoliert, Agent `main`. Bei mehr als sieben ungelesenen Mails
im Outlook-Posteingang einmal anrufen und Absender/Betreff der zwei neuesten
ungelesenen Mails nennen. Bei Nichtannahme nach 45 Sekunden dieselbe Audio
als Sprachnachricht. Erst eine spätere Prüfung **unter sieben** gibt wieder
frei; genau sieben setzt nicht zurück. Persistente Sperre im privaten
Automation-Scratch mit Revisionsprüfung, nicht nur im Prompt oder RAM.
Neues Plugin-Tool `whatsapp_check_unread_mail_alert` an diesen Job und Leon
gebunden. Bestehendes tägliches Briefing und Kontakt-Tools bleiben erhalten.
Details und Prüfungen: [OUTLOOK_UNGELESEN_WARNUNG.md](OUTLOOK_UNGELESEN_WARNUNG.md).

Erster echter Versuch mit neun Mails am 06.10. um 17:26 scheiterte vor dem
Wählen an MeowCaller `Client outdated (405)`. MeowCaller aktualisiert jetzt
vor jeder Verbindung die WhatsApp-Web-Version; realer Verbindungstest ohne
Anruf erfolgreich, Binary auf dem Server ersetzt. Kein OpenClaw-Update.
Scratch einmalig nach gesichertem Nichtversand wieder freigegeben, nächster
regulärer Lauf 18:05. Leon hat diesen Warnanruf mit neun ungelesenen E-Mails
anschließend erfolgreich bestätigt.
Patch und genaue Belege stehen in der verlinkten Anleitung.

**Ablage:** Unsere Markdown-Dokumentation liegt unter `dokumentation/`;
Anleitungen zu Sprachnachrichten unter `dokumentation/sprachnachrichten/`.
Übersicht: [README.md](README.md). Die ausführbaren Helfer bleiben im
Workspace-Ordner `sprachnachrichten/`. Die Markdown-Dateien der kopierten
`.openclaw`-Installation wurden nicht verschoben. Diese Umordnung betrifft
nur die lokale Dokumentation und ändert den Server nicht.

Diese Datei hält den bekannten Projektstand für die weitere Zusammenarbeit fest.
Grundlage sind die Installationsanleitung, das Gesprächsprotokoll vom 04.10.2026,
anschließende Rückmeldungen von Leon und die lokal heruntergeladene Kopie des
Server-Ordners `.openclaw`. Seit dem 05.10.2026 ist zusätzlich ein von Leon
autorisierter SSH-Zugang zum Ubuntu-Server verfügbar. Frühere Dateibefunde
beziehen sich auf die heruntergeladene Kopie; ausdrücklich als SSH-Prüfung
bezeichnete Befunde stammen vom laufenden Server.

## Aktueller Stand nach Neuinstallation am 05.10.2026

**Gegenseitige WhatsApp-Bestätigungen auf dem Server angewiesen:** Leon möchte
nach Anrufen und Sprachnachrichten an Annka eine Textbestätigung; Annka soll nach
entsprechenden Aufträgen an Leon ebenfalls eine Textbestätigung erhalten.
Am 05.10.2026 wurde die aktive Server-`workspace/USER.md` gesichert und gezielt
angepasst: Bestätigung ausdrücklich über das Nachrichten-Tool an den verifizierten
Absender des aktuellen Auftrags senden, unabhängig von Text-/Audioeingang.
Nicht mit einer nur im Dashboard gespeicherten Abschlussantwort gleichsetzen.
Nach erfolgreicher expliziter Bestätigung intern `NO_REPLY`, ohne zweite
Audioantwort. Versand bestätigen, tatsächliche Zustellung/Lesen nur mit
entsprechendem Nachweis behaupten; bereits erfolgreiche Aktion bei fehlender
Bestätigung nicht wiederholen. Anrede berücksichtigt Leon und Annka.
Vorher belegter Vorfall: Run `58996cf4-683c-4893-bde4-a43b0b749c38`,
05.10.2026, 20:38:21 Uhr Berlin: Sprachnachricht an Annka erfolgreich gesendet,
danach Textbestätigung nur im Dashboard, kein WhatsApp-Send an Leon im Journal.
Die genaue interne Unterdrückungsursache ist nicht abschließend belegt.
Regeländerung zurückgelesen; keine Testnachricht oder Testanruf versendet.
Praktischer Test beider Richtungen noch offen. Details:
[WHATSAPP_ANTWORTREGELN.md](sprachnachrichten/WHATSAPP_ANTWORTREGELN.md).

**Tägliche Outlook-/Mail-Anrufautomation eingerichtet und aktiviert:**
Job `c67e5c8b-837c-424a-87a7-861e44f64c50`, Name
`daily-outlook-mail-whatsapp-call-1800-berlin`, täglich exakt 18:00 Uhr
`Europe/Berlin`, isolierte Sitzung, Agent `main`. Nächste Ausführung laut
Gateway: 06.10.2026, 18:00 Uhr Berlin (16:00 UTC). Inhalt: Termine der nächsten
72 Stunden und kurz die Absender ungelesener E-Mails im Posteingang.
Keine Mail-/Kalenderänderungen, keine Kennzeichnung als gelesen.

Das vorhandene Kontakt-Plugin wurde um `whatsapp_call_daily_briefing` erweitert.
Diese Funktion akzeptiert nur den vertrauenswürdigen Sitzungsschlüssel genau
dieses Jobs und Agent `main`; Ziel fest `authorizedCaller` (Leon), kein
Telefonnummern- oder Kontaktparameter. Bestehende Chat-/Kontakt-Anrufe behalten
ihre Owner-/WhatsApp-Bedingungen. Persistenter Tagesnachweis verhindert einen
zweiten automatischen Anrufversuch am selben Tag. Die neue Automation hat nur
drei erlaubte Tools: Kalenderansicht lesen, ungelesene Inbox-Mails lesen und
den fest gebundenen täglichen Anruf.

Anruffreier Probelauf erfolgreich: 05.10.2026, 20:24 Uhr Berlin, ca. 27 Sekunden,
isolierte Sitzung `147ef954-f965-4299-8831-35dbf343b524`. Kalender und Mail mit
`fetchAllPages: true`; Mailfilter `isRead eq false`, Select `from,isRead`.
Plugin erzeugte Vorschau statt TTS/Anruf; Laufstatus `ok`. Danach Vorschau-Modus
deaktiviert und Job aktiviert. ElevenLabs-Key im laufenden Gateway vorhanden,
MeowCaller ausführbar, vorhandener VoIP-Speicher verfügbar. Anschließend auf
Leons ausdrücklichen Wunsch ein echter manueller Test ausgeführt: 05.10.2026,
20:33:58–20:35:16 Uhr Berlin, rund 77 Sekunden. Run-ID
`manual:c67e5c8b-837c-424a-87a7-861e44f64c50:1791225238837:1`,
Sitzung `06db96c2-e460-46b9-8938-0fec72bd6437`. Scheduler meldet
`status: ok`, `completionStatus: succeeded` und erfolgreichen Briefing-Anruf.
Tagesnachweis für 05.10.2026 vorhanden. Leons Bestätigung der tatsächlichen
Annahme und hörbaren Audioausgabe steht noch aus. Nicht erneut ausführen.
Quellcode lokal unter `plugins/whatsapp-call-contact/`; Anleitung und Sicherungen:
[OUTLOOK_MAIL_ANRUFAUTOMATION.md](OUTLOOK_MAIL_ANRUFAUTOMATION.md).

**Outlook-Buchung nach TTS-Korrektur erfolgreich, mit korrigiertem Zwischenfehler:**
Leon bestätigt die Terminbuchung und bittet um Prüfung eines Tool-Fehlers.
SSH-Prüfung des Runs `efa25776-230f-4a63-8677-f5affe2f58ad` vom 05.10.2026:
Um 20:12:26 Uhr Berlin versuchte Jarvis
`const t = MCP.outlook.createCalendarEvent; await t.describe()` und erhielt
`TypeError: t.describe is not a function`. `failurePhase: guest`,
`bridgeDispatchStarted: false`, `callCount: 0`: Dieser fehlerhafte Aufruf
führte keine Outlook-Aktion aus. Danach las Jarvis die API und verwendete
erfolgreich `.describe()` auf dem passenden Handle aus `catalog.search`.
Um 20:12:41 Uhr lieferte der eigentliche `createCalendarEvent`-Aufruf ohne
MCP-Fehler den Termin „Einkaufen gehen“ zurück: 06.10.2026, 09:00–10:00 Uhr
Europe/Berlin (07:00–08:00 UTC). Die einstündige Dauer wurde im Aufruf gesetzt;
Leon hatte nur den Beginn um 09:00 Uhr genannt. Finale TTS-Bestätigung im
Transkript vorhanden. Damit war der Fehler ein selbst korrigierter Fehler bei
der Schemaabfrage, kein fehlgeschlagener Kalender-Schreibzugriff. Keine erneute
Buchung oder Änderung an der funktionierenden MCP-Konfiguration durchgeführt.
Merken: `.describe()` gehört zum Katalog-Handle, nicht zur direkt aufrufbaren
Funktion `MCP.outlook.createCalendarEvent`.

**TTS-Abschlusskorrektur am 05.10.2026 direkt per SSH installiert:** Ein zweiter
Lauf um 20:06:07 Uhr Berlin (`320990fb-07bf-4e6d-a457-9039888051e8`) scheiterte
nach „Schicke mir mal eine Sprachnachricht“, ohne Tool-Aufrufe. Die gespeicherte
Antwort enthielt wieder ausschließlich einen nicht leeren TTS-Text bei
`stopReason: stop`. Die Abschlussfunktion `resolveIncompleteTurnPayloadText`
wurde in den vier ausgelieferten Modulvarianten gezielt ergänzt: vollständig
beendete, weder abgebrochene noch zeitüberschrittene Antworten mit nicht leerem
`openclawDelivery.tts.text` werden nicht als unvollständig verworfen.
Negativprüfungen für leere/ungültige TTS-Texte, Fehler, Tool-Zwischenstände,
Längenlimit, Abbruch und Zeitüberschreitung bestanden; alle vier Module bestehen
`node --check`. Gateway sauber neu gestartet und Dienst aktiv. Leon meldet
anschließend „Scheinbar geht es jetzt“; damit ist ein erster praktischer Erfolg
nach der Änderung berichtet. Langzeitstabilität und das genaue Ergebnis des
Testlaufs wurden noch nicht unabhängig geprüft. Sicherung und Grenzen der
lokalen Paketänderung: [TTS_ABSCHLUSS_REPARATUR.md](sprachnachrichten/TTS_ABSCHLUSS_REPARATUR.md).

**Neuer offener Vorfall um 19:54–19:55 Uhr am 05.10.2026:** Nach Leons
achtsekündiger WhatsApp-Sprachnachricht um 19:54 folgt um 19:55 eine
Fehlermeldung mit dem Zusatz, dass möglicherweise bereits Tool-Aktionen
ausgeführt wurden und vor einem erneuten Versuch geprüft werden sollen.
Leon bestätigt anschließend: Der Audioauftrag war, einen Termin in Outlook
einzutragen, und Jarvis hat diesen Termin tatsächlich angelegt. Damit ist die
Kalenderaktion nach Nutzerprüfung erfolgreich; der Fehler betrifft offenbar
die anschließende Antworterzeugung oder Zustellung. Die zunächst verfügbare
lokale SQLite-Kopie endete um 19:18:18 Uhr Berlin und enthielt den Lauf nicht.

**Direkte SSH-Prüfung am 05.10.2026:** Anmeldung als `leon` auf dem von Leon
genannten Server erfolgreich; `openclaw` liegt unter
`/home/leon/.npm-global/bin/openclaw`. Der Gateway-Dienst ist aktiv. Die aktive
`~/.openclaw/openclaw.json` ist für diesen Benutzer les- und schreibbar.
Die Heartbeat-Einstellungen `target: none`, `isolatedSession: true`,
`lightContext: true` und der reparierte Prompt sind auf dem Server vorhanden.
Es wurden bei dieser Prüfung keine Server-Einstellungen verändert.

Der neue Outlook-Lauf hat die Run-ID
`96cb4202-15f6-4b30-9580-b16fec07a206`. Das Live-Journal meldet um
17:55:02 UTC `incomplete turn detected`, Provider/Modell `openai/gpt-5.6-sol`,
`stopReason=stop`, `payloads=1`, `tools=4`, `replaySafe=no`.
Das gespeicherte Live-Transkript bestätigt: `createCalendarEvent` war erfolgreich
und lieferte den Termin zurück. Die finale Assistant-Nachricht enthält einen
leeren normalen Textblock, aber in `openclawDelivery.tts` die vollständige
Sprachbestätigung: „Erledigt. Morgen um dreizehn Uhr steht ‚Arbeit anrufen‘
für dreißig Minuten in deinem Kalender.“ Kein Assistant-`errorMessage`.
Die installierte Abschlussprüfung verwirft den Lauf als unvollständig und
liefert wegen der bereits ausgeführten Aktion den Zusatz zu möglichen
Tool-Aktionen. Damit ist der Fehler auf die Behandlung der TTS-Abschlussantwort
eingegrenzt; ein ElevenLabs-API-Fehler ist in diesem Lauf nicht belegt.
Die anschließende Korrektur in der Abschlussprüfung ist oben dokumentiert.
Den Kalenderauftrag nicht wiederholen, keine Sitzung auf Verdacht zurücksetzen.

**Weiterhin bestätigter Stand: Heartbeat-Reparatur erfolgreich.** Leon meldet
am 05.10.2026 nach der angeleiteten Änderung „geht jetzt“. Sein Dashboard zeigt
für `Heartbeat (main)` einen grünen Haken bei der letzten Ausführung („gerade
eben“), weiterhin alle 30 Minuten, nächste Ausführung im Screenshot in fünf
Minuten. Der zuvor belegte Heartbeat-Fehler gilt damit als behoben. Reparatur:
eigene Sitzung, leichter Kontext und ein eigener Prompt ohne Chat-Fortsetzung
oder TTS. Anleitung und Befund: `dokumentation/sprachnachrichten/HEARTBEAT_REPARATUR.md`.
Keine weitere Änderung oder Wiederholung der Einrichtung nötig. Annkas
separater `/new`-Test und normale Audioantworten werden durch diesen Screenshot
nicht zusätzlich bestätigt. Die folgenden Abschnitte enthalten auch frühere
Diagnose- und Vorbereitungsstände; diese sind dem aktuellen Ergebnis untergeordnet.

**Leon hat OpenClaw auf einem anderen Server vollständig neu installiert und
eingerichtet. Die jetzt vorliegende `.openclaw`-Kopie stammt vom neuen Server.**
Die nachfolgenden Abschnitte zur alten Outlook-Anbindung und Anrufautomation
dokumentieren den bisherigen Verlauf; ihre Erfolge gelten nicht automatisch
für diesen neuen Server.

Aktuelle Dateibefunde aus `.openclaw/openclaw.json`:

- `meta.lastTouchedVersion`: `2026.9.8`; Standardmodell `openai/gpt-5.6-sol`.
- **Kein `mcp`-Abschnitt, damit kein konfigurierter Outlook-MCP-Dienst.**
- Kontakt-Plugin und MeowCaller-Pfade verwenden weiterhin `/home/leon`.
- WhatsApp-Anrufe sind aktiviert. Die WhatsApp-Allowlist enthält jetzt zwei
  Einträge; die Commands-Owner-Allowlist enthält einen Eintrag. Keine Nummern
  in dieser Datei speichern. Diese Listen wurden nicht verändert.
- Die neue `workspace/USER.md` bestätigt `Europe/Berlin`, kurze Telefonantworten
  und Rückfrage vor dem Löschen von Kalenderterminen.
- `elevenlabs.env` ist vorhanden. Die frühere Annahme einer Datei
  `gateway.systemd.env` darf für diesen Server nicht ungeprüft übernommen werden.
- Der zuvor lokal vorbereitete Ordner `outlook-anruf` ist im aktuellen
  Workspace nicht mehr vorhanden, obwohl der Editor noch einen alten Tab zeigt.

Auftrag jetzt: die bestehende private Microsoft-Kalenderanbindung erneut
einrichten und auf Leons Wunsch vom 05.10.2026 **E-Mails ausschließlich lesend**
anbinden. Kalender bleibt les-/bearbeitbar; E-Mails dürfen aufgelistet,
durchsucht und gelesen werden, nicht gesendet, verändert, verschoben, gelöscht
oder als gelesen markiert. Anleitung mit vollständigen Ubuntu-Befehlen unter
`dokumentation/OUTLOOK_MCP_NEUER_SERVER.md`: Paket `@softeria/ms-365-mcp-server@0.158.0`,
Preset `outlook` statt `calendar`, Scopes
`User.Read Calendars.ReadWrite Mail.Read` ohne `Mail.Send`/`Mail.ReadWrite`, Dateicache mit
`MS365_MCP_USE_KEYTAR=0`, neue Microsoft-Anmeldung und Kontobindung,
anschließend `openclaw mcp set outlook` und `doctor outlook --probe`.
Der absolute Node-Pfad wird auf dem neuen Server automatisch ermittelt.
Die bestehende Server-Konfiguration wird vor dem gezielten Ergänzen gesichert.
Die vorbereitete MCP-Werkzeugliste ergänzt ausschließlich `list-mail-folders`,
`list-mail-child-folders`, `list-mail-messages`, `list-mail-folder-messages`
und `get-mail-message`. Login, Login-Prüfung und spätere MCP-Startparameter
müssen identische neue Preset-/Scope-Werte verwenden. Falls zuvor bereits nur
mit Kalenderrechten angemeldet: den angepassten Login für `Mail.Read` wiederholen.
Kein globales `--read-only`, da Kalender-Schreibzugriff weiterhin gewünscht ist.

**Von Leon per Terminal-Screenshot am 05.10.2026 bestätigt:**
Die Installation mit `npm install ... @softeria/ms-365-mcp-server@0.158.0`
und `--ignore-scripts` ist erfolgreich abgeschlossen (212 Pakete).
Die anschließende Microsoft-Anmeldung mit Preset `outlook`, Scopes
`User.Read Calendars.ReadWrite Mail.Read`, `MS365_MCP_USE_KEYTAR=0`
und erwarteter Konto-Bindung meldet `success: true` / `Login successful`.
Die npm-Deprecation-Warnung zu `prebuild-install@7.1.3` war kein Installationsfehler.
Anmeldecode und Tokens nicht speichern.

Ein weiterer Screenshot vom 05.10.2026 bestätigt:
`Saved MCP server "outlook" to /home/leon/.openclaw/openclaw.json`
und anschließend **`outlook: ok`** bei `openclaw mcp doctor outlook --probe`.
Die ausgegebene OpenClaw-Version ist `2026.9.8 (fc23bc8)`.
Damit sind Speichern und Verbindungsprobe auf dem neuen Server bestätigt.
Die gespeicherte Verbindung wurde mit der angeleiteten Werkzeugliste für
Kalenderbearbeitung und ausschließlich lesenden E-Mail-Zugriff eingerichtet;
die einzelnen gespeicherten Felder wurden noch nicht separat ausgelesen.

**Funktionstest auf dem neuen Server am 05.10.2026 erfolgreich laut Leons
WhatsApp-Screenshot:** Jarvis hat den Kalender für die nächsten 72 Stunden
(05.10.2026, 17:39 bis 08.10.2026, 17:39, `Europe/Berlin`) abgerufen und
einen ganztägigen Termin ausgegeben. Außerdem hat er die letzten fünf E-Mails
im Posteingang mit Absender, Betreff und kurzer Inhaltszusammenfassung gelesen.
Keine Fehler gemeldet. Laut Jarvis wurden keine Daten verändert und keine
E-Mails als gelesen markiert; der tatsächliche Lesestatus wurde hier nicht
unabhängig geprüft. Private Termin- und Mail-Inhalte nicht in dieser Datei speichern.
Damit sind Kalender-Lesen und lesender E-Mail-Zugriff durch Jarvis auf dem
neuen Server im praktischen Test bestätigt. Kalender-Anlegen/Ändern/Löschen
ist konfiguriert, aber noch nicht praktisch getestet. Vor Löschen weiterhin
nachfragen. Die tägliche Telefonautomation wurde mit diesem Test nicht geprüft.
Eine separate `--verify-login`-Ausgabe wurde nicht geteilt; erfolgreicher Login
und MCP-Verbindungsprobe sind dokumentiert. Jarvis sieht die neue Verbindung
bereits; ein zusätzlicher Gateway-Neustart ist für diese Einrichtung nicht nötig.
Hier besteht kein direkter Zugang zum neuen Server. Dafür führt Leon die
vorbereiteten Befehle dort aus. Keine alten Tokens oder Anmeldecodes voraussetzen.
Die alte Automation-ID `c54eabed-8d27-44b8-9f19-db5785392ee0` ist ein historischer
Bezug; Existenz und Aktivierung auf dem neuen Server sind nicht geprüft.

## Nächster Auftrag: WhatsApp-Sprachnachrichten vor Automationen

**Aktuelle Entscheidung nach fehlgeschlagenem Test am 05.10.2026:** Leon
möchte jetzt **ElevenLabs für STT und TTS** und die lokale Whisper-Erkennung
vollständig deaktivieren. Die frühere Vorgabe „nur lokale Transkription“ ist
damit aufgehoben. Die eingehenden Aufnahmen dürfen für diesen Ablauf an
ElevenLabs übertragen werden. Automationen bleiben zunächst zurückgestellt.

WhatsApp-Screenshot: vier Sekunden Aufnahme um 18:05, acht Sekunden Antwort
um 18:09; Jarvis spricht laut Leon die angezeigte Meldung „Agent couldn't
generate a response“. Das beweist einen gescheiterten Agentenlauf, aber noch
nicht, ob Whisper, das Sprachmodell oder ein nachgelagerter Schritt die
Ursache war. Keine gesicherte Diagnose oder Geschwindigkeitszusage abgeben.

Umstellung vorbereitet in `dokumentation/sprachnachrichten/ELEVENLABS_UMSTELLUNG.md`,
`prepare-elevenlabs.mjs` und `elevenlabs-setup.py`: neuer Key mit Zugriff auf
Text to Speech und Speech to Text; unsichtbare Eingabe nur auf dem Server,
privates Backup der vorhandenen `elevenlabs.env` und eigener systemd-Drop-in.
Explizites `scribe_v2` ohne lokalen Audio-Fallback, bestehende Stimme und
`tts.auto: inbound`/`tts.mode: final` beibehalten. Änderungen über die
OpenClaw-Batch-CLI mit vorherigem Dry-run. Anschließend Gateway neu starten
und den dedizierten Whisper-Ordner nach Prozessprüfung deaktiviert archivieren
(Dateien bleiben zunächst auf der Festplatte). `ffmpeg` für WhatsApp-Audio und
System-Python behalten. Outlook und Kontakt-Anruf-Plugin werden nicht ersetzt.
Neue Helfer lokal geprüft; die Schema-Prüfung und Anwendung auf dem Server
sind inzwischen durch Leons Terminalausgabe bestätigt. Ein erneuter
WhatsApp-Sprachtest war anschließend laut Leon erfolgreich (siehe unten).

**Umstellung auf dem neuen Server von Leon bestätigt:**
`Dry run successful: 12 update(s) validated`, `Updated 12 config paths`,
`Config valid` und nach Gateway-Neustart Dienststatus `active`.
Der Deaktivierungshelfer bestätigt: lokaler STT-Aufruf entfernt, kein
zugehöriger Prozess aktiv. Whisper-Modell, venv und Helfer wurden nach
`/home/leon/.local/share/jarvis-stt.deaktiviert-20261005-162853-656795`
verschoben. Dateien bleiben inaktiv auf der Festplatte. `ffmpeg` bleibt installiert.
Die Provider-Inventur meldet ElevenLabs verfügbar und konfiguriert mit
Standardmodell `scribe_v2`; auch OpenAI ist verfügbar und konfiguriert.
Die explizite Audio-Modellliste der angewendeten Batch enthält nur ElevenLabs.
Alle Inventurzeilen zeigen `selected: false`; daraus keinen erfolgreichen
API-Aufruf oder eine tatsächliche Verarbeitung durch einen Provider ableiten.
Die Ausgabe bestätigt nicht separat die Erstellung oder Endpoint-Rechte des
neuen Keys. Die kopierte `.openclaw`-Konfiguration bleibt gegenüber dem Server
veraltet. Ein separater Texttest und eine genaue Antwortdauer wurden nicht
mitgeteilt; der erfolgreiche Sprachtest ist nachfolgend dokumentiert.
**Erster WhatsApp-Test nach Cloud-Umstellung fehlgeschlagen:** Leons Screenshot
zeigt eine neue Sitzung um 18:30, danach eine dreisekündige Sprachnachricht und
in derselben Minute die Meldung „OpenClaw couldn't produce or deliver a reply“.
Fehlerreferenz beginnt mit `849b1f2b`. Bei diesem ersten Versuch war kein Erfolg
bestätigt. Ursache weiterhin ungeklärt; keine Logs dazu geteilt.

**Erneuter WhatsApp-Sprachtest am 05.10.2026 erfolgreich laut Leon:**
Screenshot um 18:32 zeigt eine zweisekündige eingehende Aufnahme, anschließend
eine viersekündige Audioantwort und eine passende Textbestätigung von Jarvis,
dass der Test funktioniert. Nachricht und Antwort liegen innerhalb derselben
angezeigten Minute; genaue Verarbeitungslatenz nicht gemessen. Damit ist der
Sprachnachrichtenablauf praktisch bestätigt. Der genaue Wortlaut der Aufnahme
und die Stimme wurden hier nicht angehört; Provider-Requests nicht unabhängig
per Log geprüft. Die angewendete Konfiguration verwendet ElevenLabs Scribe v2
und ElevenLabs-TTS mit der bestehenden Stimme. Whisper bleibt deaktiviert.
Aktuell keine weitere Änderung oder Logabfrage erforderlich. Die Ursache des
vorherigen Einzelfehlers nicht als behoben oder diagnostiziert darstellen;
bei Wiederholung gezielt Logs prüfen. Automationen wurden noch nicht bearbeitet.

**Akzeptierter Stand nach neuer Sitzung, von Leon am 05.10.2026 bestätigt:**
Textnachricht → Textantwort; Sprachnachricht ohne Anrufauftrag → nur Audio;
Rückruf an Leon → Anruf und kurze Textbestätigung sind akzeptiert; Anruf an
Annka → kurze Textmeldung an Leon, auch wenn der Auftrag per Audio kam.
Die frühere Forderung „keine Bestätigung beim Rückruf an mich“ ist aufgehoben.
Keine weitere Unterdrückung über `NO_REPLY` erzwingen.

Um 18:44 erschien nach einem angenommenen Anruf die technische Meldung
„The tool run finished, but no final summary was produced. I did not repeat
any completed actions.“ Eine angefangene Prüfung ergab keine gesicherte
Ursachendiagnose; kein Server-Code oder Gateway wurde dabei verändert.
Leon unterbrach die Fehlersuche und startete um 18:45 per `/new` eine neue Sitzung.
Der neue Screenshot zeigt: Audioauftrag 18:45 → angenommener Rückruf und
Textbestätigung 18:46; Textnachricht 18:46 → Textantwort; Sprachnachricht 18:47
→ Audioantwort ohne identischen Zusatztext; Audioauftrag 18:48 → Jarvis meldet
den Anruf an Annka per Text als erfolgreich. Annkas Gespräch und die exakte
Werkzeugantwort wurden hier nicht separat geprüft. Leon bewertet diesen Stand
ausdrücklich als ausreichend: **so lassen und dokumentieren**. Keine weitere
Fehlersuche, kein erneuter Kontaktanruf und keine Konfigurationsänderung für
diesen Schritt erforderlich. Die frühere Ersatzmeldung trat im gezeigten Test
nach der neuen Sitzung nicht wieder auf; nicht als technisch diagnostiziert werten.

Für die Antwortformat-Ausnahme war `tts.auto: tagged` bei weiterhin `tts.mode: final`
vorbereitet; die lokale `prepare-elevenlabs.mjs` erzeugt inzwischen `tagged`.
Die letzte geteilte CLI-Bestätigung betraf noch den vorherigen `inbound`-Stand.
Die spätere einzelne Modusänderung und der aktive Server-Inhalt der USER.md
wurden nicht separat ausgelesen; das gewünschte Verhalten ist nun praktisch
bestätigt. Keine neue Abfrage allein für diese Dokumentationslücke nötig.
Aktuelle Dokumentation: `dokumentation/sprachnachrichten/WHATSAPP_ANTWORTREGELN.md`.
Die kopierte `.openclaw/workspace/USER.md` ist lokal an die akzeptierte Präferenz
angepasst; nicht ungeprüft über die aktuelle Server-Datei kopieren.
Whisper bleibt deaktiviert; ElevenLabs und Outlook beibehalten. Automationen
sind weiterhin ein gesonderter, noch nicht bearbeiteter Schritt.

**Offen: Annkas `/new` scheitert weiterhin; normale Antworten funktionieren
laut Leon inzwischen.** Leon
meldet nach den obigen erfolgreichen eigenen Tests: Annkas sechssekündige
Aufnahme um 18:50 führt zu „Agent couldn't generate a response“; auch ihre
`/new`-Versuche um 18:50/18:52 führen zu „OpenClaw couldn't produce or deliver
a reply“. Leons `/new` um 18:53 funktioniert dagegen sofort. Ein erfolgreicher
ausgehender Anruf an Annka beweist keinen funktionierenden eingehenden Agentenlauf
für ihre Nummer. Die oben dokumentierten vollständigen Antworttests betreffen
Leon. Danach meldet Leon, dass es bei Annka plötzlich ging, stellt aber klar:
Ihr `/new` funktioniert weiterhin nicht. Annkas Verhalten deshalb nur teilweise
als bestätigt behandeln.

Read-only-Prüfung der lokalen Konfigurationskopie: WhatsApp `dmPolicy: allowlist`,
beide bekannten Absender in `channels.whatsapp.allowFrom`, nur Leon in
`commands.ownerAllowFrom`; keine expliziten `commands.allowFrom`, `session.dmScope`
oder `bindings` vorhanden. Keine vollständigen Nummern dokumentieren. Die Kopie
kann gegenüber dem Server veraltet sein. Nach Doku sind Nachrichten- und
Owner-Berechtigungen getrennt; fehlende Owner-Rechte nicht als gesicherte Ursache
einstufen und Annka nicht auf Verdacht zum Owner machen. Auch Sitzungs-/Agenten-
Fehler sind möglich. Da `/new` scheitert, nicht ausschließlich STT/TTS verdächtigen.
Die geteilten früheren Logs zeigen um 18:50 und 18:52 unvollständige Modellläufe
für Annka (`incomplete turn detected`, keine Tool-Aufrufe); daraus folgt keine
gesicherte Berechtigungsursache. Die Läufe nutzen `agent:main:main`; getrennte
Sitzungen pro Absender sind in der Kopie nicht konfiguriert. Der letzte Logauszug
enthält vor allem Dashboard-Authentifizierungsfehler (`device_token_mismatch`,
`token_mismatch`) und anschließend eine erfolgreiche Webchat-Verbindung. Er
liefert keinen frischen Fehlernachweis für Annkas `/new`.

Konkreter neuer Hinweis aus dem offiziellen WhatsApp-Quellcode auf `main`:
`extensions/whatsapp/src/command-policy.ts` setzt `enforceOwnerForCommands: true`.
Quelle: https://github.com/openclaw/openclaw/blob/main/extensions/whatsapp/src/command-policy.ts
Die Slash-Command-Doku erlaubt `/new` für autorisierte Nicht-Owner ausdrücklich
nur auf Kanälen ohne diese Owner-Pflicht. Das passt zum Unterschied zwischen
Leon und Annka, ist aber für die installierte Version 2026.9.8 noch zu prüfen;
der versionierte Policy-Quelltext konnte nicht abgerufen werden. Annka nicht
allein für `/new` ungefragt zum Owner machen: das würde weitere Rechte geben.
Quelle: https://docs.openclaw.ai/tools/slash-commands

Nächster Schritt: frische Gateway-Logs während genau eines `/new`-Versuchs von
Annka und Prüfung der tatsächlich installierten WhatsApp-Befehlspolitik, falls
die Logs die Berechtigungsentscheidung nicht zeigen. Keine Rechte, Sitzungen,
Tokens oder funktionierenden Voice-/Outlook-Einstellungen verändert.

**Neue ausdrückliche Freigabe am 05.10.2026:** Leon möchte Annka zusätzlich zum
Owner machen. Die frühere Einschränkung gegen eine ungefragte Erweiterung ihrer
Owner-Rechte gilt damit für diese gewünschte Ergänzung nicht mehr. Anleitung
mit Sicherung, Erhalt aller bestehenden Owner, Dry-Run, Validierung und Neustart:
`dokumentation/sprachnachrichten/ANNKA_OWNER.md`. Der Block liest die aktuelle Server-Datei und
ergänzt ausschließlich Annkas bereits zugelassene, eindeutig zugeordnete Nummer
mit Endung `1170`. Umsetzung ist inzwischen durch die geteilte Terminalausgabe
bestätigt: Dry-Run erfolgreich, `Updated commands.ownerAllowFrom`, Konfiguration
gültig, Dienst `active`. Journal: Hot-Reload um 19:07:33, sauberer Neustart ab
19:07:37, Gateway bereit um 19:08:12 und WhatsApp empfangsbereit um 19:08:16
(alles Europe/Berlin). Annkas `/new`-Erfolg nach dieser Änderung steht noch aus;
die lokale Server-Konfigurationskopie wurde nicht verändert. Sprache, Outlook und
Sitzungsaufteilung unverändert lassen.

**Neue Beobachtung am 05.10.2026:** Leon erhält um 19:07 Uhr (Europe/Berlin)
unerwartet „Agent couldn't generate a response. Please try again“, ohne gerade
etwas angefordert zu haben. Der Screenshot zeigt davor ein Jarvis-Audio um
18:59 Uhr; ein Zusammenhang mit diesem Audio ist nicht nachgewiesen. Zu diesem
Zeitpunkt lag die spätere Terminalbestätigung der Owner-Änderung noch nicht vor.
Eine verspätete Fehlermeldung eines früheren Laufs oder ein Hintergrundlauf
sind mögliche Erklärungen, keine gesicherte Diagnose. Der kopierte Config-Stand
enthält keine explizite `agents.defaults.heartbeat`-Konfiguration und keinen
expliziten `timeoutSeconds`; daraus folgt nicht, dass Heartbeats deaktiviert
sind. Nächster Nachweis: Gateway-Journal für 18:55–19:09 Uhr Berlin, entsprechend
16:55–17:09 UTC, einschließlich Fehler-/Run-/Trigger-Zeilen. Keine weiteren
Neustarts oder Änderungen allein wegen des Screenshots durchgeführt.

**Auswertung des nachgereichten Journals:** Der unerwartete Lauf beginnt laut
Dauer und Tool-Katalog-Zeile ungefähr um 19:06:59 und endet um 19:07:04 mit
`incomplete turn detected`, Provider/Modell `openai/gpt-5.6-sol`, `stopReason=stop`,
keine Tool-Aufrufe und Laufdauer rund 5,5 Sekunden. `channel=unknown`,
`messageId=unknown`, `sessionKey=agent:main:main`; im Journal steht unmittelbar
davor keine neue WhatsApp-Eingabe. Die Fehlermeldung wird um 19:07:05 an Leon
gesendet, noch vor der Owner-Änderung um 19:07:33. Somit weder ein durch diese
Änderung verursachter Fehler noch ein nachgewiesener achtminütiger Timeout.
Ein intern angestoßener Lauf ist naheliegend; Heartbeat ist eine mögliche,
noch nicht bestätigte Quelle. Der normale Heartbeat startet nach dem Neustart
um 19:08:12. Die offizielle Doku nennt als Standardziel `owner`; deshalb kann
ein Heartbeat auch ohne neue Nutzernachricht beim ersten Owner ankommen.
Quelle: https://docs.openclaw.ai/gateway/heartbeat

Um 19:01:46 zeigt das Journal denselben Typ unvollständigen Modelllaufs nach
einer eingehenden Sprachnachricht. Mehrere andere Sprachnachrichten um 18:57,
18:59, 19:00 und 19:01 erhalten dagegen Medienantworten nach wenigen Sekunden.
Keine ElevenLabs-STT/TTS-Fehlermeldung in diesem Ausschnitt; den Fehler nicht
ohne weiteren Nachweis ElevenLabs zuschreiben. Für den genauen Auslöser des
19:07-Laufs die ausführliche Datei `/tmp/openclaw/openclaw-2026-10-05.log` um
Run-ID `8eb2e75b-ddd1-4d1b-a98c-377dcae9a827` sowie die aktiven Automationen
prüfen. Kein Heartbeat abgeschaltet, kein Modell gewechselt, keine weiteren
Server-Änderungen durchgeführt.

**Nachgereichte Automationsliste:** `690288ff-5a82-4d81-ad5c-fedd86514197`,
Deklaration `heartbeat:main`, Name `Heartbeat (main)`, alle 30 Minuten,
letzter Lauf vor sechs Minuten, Status `error`, Ziel `main`. Dies passt zum
ungefragten Fehler um 19:07 und macht den Heartbeat als Auslöser sehr
wahrscheinlich; die direkte Zuordnung zur Run-ID fehlt im geteilten Auszug.
Weitere sichtbare deklarierte Jobs: Memory Dreaming um 03:00 (noch kein Lauf),
Skill Collection Review alle sieben Tage (noch kein Lauf). Keine tägliche
Outlook-Anrufautomation in dieser Liste vorhanden. `Delivery: not requested`
beim Heartbeat nicht als Beweis für unterdrückte WhatsApp-Ausgaben werten:
Heartbeat-Zustellung wird zusätzlich über `heartbeat.target` gesteuert.

Vorbereiteter nächster Schritt gegen ungefragte Heartbeat-Meldungen:
`agents.defaults.heartbeat.target` auf `none` setzen (nach Sicherung, Dry-Run
und Validierung). Der Heartbeat läuft damit intern weiter; seine Meldungen
und Fehlerhinweise werden laut Doku nicht extern zugestellt. Dies behebt
nicht den zugrunde liegenden unvollständigen Modelllauf. Umsetzung dieser
Einstellung noch nicht bestätigt. Andere Automationen, Annkas Owner-Rechte,
Sprache und Outlook nicht verändern. Falls weiterhin ungefragte Fehler
ankommen, deren tatsächlichen Auslöser anhand einer neuen Run-ID prüfen.

**Aktuelle Priorität laut Leon:** Die tatsächliche Fehlerursache verstehen,
statt nur die Heartbeat-Ausgabe zu unterdrücken. Keine Bestätigung, dass
`heartbeat.target: none` angewendet wurde; diese Einstellung nicht als
umgesetzt behandeln. `stopReason=stop`, `hasCurrentAttemptAssistant=yes`,
`payloads=1`, `tools=0` zeigen nicht den eigentlichen Antwortinhalt. Insbesondere
keine leere Antwort, `NO_REPLY`, `HEARTBEAT_OK`, Tokenlimit oder API-Störung
als gesicherte Ursache behaupten. Benötigt werden Heartbeat-Laufhistorie und
die gespeicherten User-/Assistant-Nachrichten um 17:07:04 UTC (19:07:04 Berlin).
Die lokale SQLite-Kopie enthält mit ihrem vorhandenen WAL auch den fraglichen
Lauf. Ihre Tabellenstruktur wurde ausschließlich lesend geprüft:
`transcript_events.event_json/created_at` und `session_windows.session_key`.
Keine Sitzung löschen oder zurücksetzen, um den Fehler zu untersuchen.

**Konkreter Befund aus der SQLite-Kopie inklusive WAL:** Die zunächst notierte
Annahme, die Kopie sei zu alt, war falsch. Beim Lesen mit Berücksichtigung des
vorhandenen WAL enthält sie Nachrichten bis 19:18:18 Uhr Europe/Berlin und auch
den gesuchten Lauf um 19:07. Die vorherige Behauptung einer leeren Modellantwort
ist ebenfalls zu präzisieren: Das sichtbare Textfeld ist leer, aber ein fertiger
Sprachtext ist in `message.openclawDelivery.tts.text` vorhanden.

- 19:06:59: Gespeicherte Nutzernachricht `[OpenClaw heartbeat poll]` in der
  Hauptsitzung; keine neue Nutzer-Sprachnachricht. Transport-Metadaten zeigen
  WhatsApp und `senderIsOwner: false` für den internen Poll.
- 19:07:04: Assistant-Antwort für exakt die Run-ID
  `8eb2e75b-ddd1-4d1b-a98c-377dcae9a827`, Modell `gpt-5.6-sol`,
  `response.completed`, `stopReason: stop`, kein gespeichertes `errorMessage`.
  Finales Textfeld leer; `openclawDelivery.tts.tagged: true` und vollständiger
  Sprachtext über die vorherige Unterhaltung zu Pizza für Leon und Mamas
  Spaghetti Bolognese. Der Assistant beantwortet also alten Chatinhalt, statt
  den Heartbeat still abzuschließen. Journal meldet danach `incomplete turn`.
- 19:18:18: Zweiter Heartbeat mit Run-ID
  `fa6a0ab1-f423-4016-a86f-ed48d58b5a08`; dasselbe Muster, erneut nur
  TTS-Text zur vorherigen Essensunterhaltung und leeres finales Textfeld.
- 18:37:01: Früherer erfolgreicher Heartbeat antwortet dagegen `NO_REPLY`.

Der neue Screenshot bestätigt beide fehlgeschlagenen Heartbeats um 19:07 und
19:18 mit `heartbeat failed: agent-runner-failure`, sowie den erfolgreichen
Lauf um 18:37. Der Status ist eine Zusammenfassung des internen Agentenfehlers.
Belegt sind die Fortsetzung alten Chatkontexts und die reine TTS-Antwort im
Heartbeat. Dass die Prüfung auf eine vollständige Antwort den ausgelagerten
Sprachtext nicht ausreichend berücksichtigt, ist eine plausible Erklärung
des Runner-Fehlers; die genaue Prüfstelle im installierten Code ist noch nicht
nachgewiesen. Auch der normale Audiofehler um 19:01:46 enthält solchen TTS-Text;
mehrere erfolgreiche Sprachantworten haben ebenfalls leere sichtbare Textfelder.
Daher nicht behaupten, jede reine TTS-Antwort müsse scheitern oder die
Heartbeat-Korrektur behebe bereits alle gelegentlichen Sprachfehler.

Gezielte Korrektur für den belegten Heartbeat-Kontextfehler: Heartbeat mit
`agents.defaults.heartbeat.isolatedSession: true` in einer eigenen Sitzung und
mit `lightContext: true` ohne die normalen Chat-/Sprachantwort-Bootstrapdateien
ausführen; dazu eine explizite Heartbeat-Anweisung, alte Unterhaltungen nicht
fortzusetzen, keine TTS-Tags zu benutzen und bei nichts Neuem `NO_REPLY`
zurückzugeben. Die offizielle Doku unterstützt diese beiden Optionen und den
konfigurierbaren Prompt. Umsetzung und anschließender Test waren zu diesem
Diagnosezeitpunkt noch offen; erfolgreicher Stand inzwischen unten bestätigt. Eine
bloße Änderung auf `target: none` unterdrückt nur die externe Ausgabe und
behebt diese Fehlverarbeitung nicht.

**Reparatur von Leon ausdrücklich beauftragt:** Anleitung mit vollständig
kopierbarem Ubuntu-Block unter `dokumentation/sprachnachrichten/HEARTBEAT_REPARATUR.md`
vorbereitet. Drei gezielte Änderungen: eigener Heartbeat-Kontext, leichter
Bootstrap-Kontext und ein eigener Prompt ohne Chat-Fortsetzung oder TTS.
Bestehender `main`-Heartbeat-Override wird berücksichtigt. Ziel, Zeitplan,
Modell, Owner, Outlook und normale Sprachantwortregeln werden nicht geändert.
Die aktuelle lokale Config-Kopie enthält bereits `heartbeat.target: none`;
der zuletzt geteilte CLI-Beleg für diese Änderung fehlt, daher nicht allein
daraus auf den aktiven Server-Zustand schließen. Anwendung erfolgt mit Sicherung,
Batch-Dry-Run und Validierung, danach ein einzelner manueller Lauf mit
`automations run ... --wait` und Prüfung genau dieses Run-ID-Eintrags. Zum
Vorbereitungszeitpunkt waren Anwendung und praktischer Test noch offen;
die anschließende Erfolgsmeldung ist unten dokumentiert.

Lokale Prüfung der Reparatur erfolgreich: Batch-Generator aus der Anleitung
mit aktueller Config-Kopie sowie `main`-Override als Objekt und als Liste
ausgeführt. Jeweils genau drei vorgesehene Felder; bestehende Owner-, Kanal-,
MCP-/Outlook-, TTS-, Medien- und Plugin-Konfigurationen erhalten. Die Quelle
wird nicht vom Generator geändert. Kein Live-Server-Test durch Codex erfolgt.

**Reparaturabschluss am 05.10.2026:** Leon bestätigt „geht jetzt“ und liefert
einen Dashboard-Screenshot. `Heartbeat (main)` zeigt einen erfolgreichen
letzten Lauf mit grünem Haken („gerade eben“), Intervall alle 30 Minuten und
nächste Ausführung in fünf Minuten. Der Fehler gilt als behoben; nicht weiter
auf Verdacht Sprachkonfiguration, Modell, Sitzungen oder Berechtigungen ändern.
Die Reparatur ist in `dokumentation/sprachnachrichten/HEARTBEAT_REPARATUR.md` jetzt als
erfolgreich dokumentiert. Der konkrete Run-ID-Eintrag, sein Antworttext und
eine neue Ausgabe der aktiven Konfigurationsfelder wurden nicht separat
geteilt; kein `NO_REPLY`-Inhalt oder genauer Ausführungszeitpunkt erfinden.
Die Einträge Memory Dreaming Promotion und Skill Collection Review sind im
Screenshot ebenfalls sichtbar, wurden durch diese Reparatur nicht bearbeitet
und zeigen dort keine letzte Ausführung. Dieser Erfolg bestätigt ausschließlich
den Heartbeat, keinen neuen Test von Annkas `/new` oder normalen Audioantworten.

Die folgende Beschreibung hält den bisherigen lokalen Einrichtungsverlauf
fest; sie ist kein erneuter Installationsauftrag.

Leon möchte am 05.10.2026 zuerst WhatsApp-Sprachnachrichten verarbeiten:
**eingehendes Audio lokal auf dem Server transkribieren**, Auftrag durch Jarvis
bearbeiten und auf eine Sprachnachricht mit der bekannten ElevenLabs-Stimme
als WhatsApp-Audio antworten. Die Automationen sind bis danach zurückgestellt.
Nur die Transkription ist lokal; Sprachmodell nutzt den Text, ElevenLabs erzeugt
aus dem Antworttext die Sprachausgabe.

Von Leon per Terminal bestätigt: 4 CPU-Kerne, 7,8 GiB RAM, 5,5 GiB verfügbar,
4 GiB Swap, Python 3.12.3; `ffmpeg` wurde auf dem PATH nicht gefunden.
Die heruntergeladene Konfiguration vor der Spracheinrichtung enthält
`tts.auto: off`, Provider `elevenlabs`,
die bekannte `speakerVoiceId` und bisher `model: eleven_multilingual_v2`.
Keine explizite Audiotranskriptionskonfiguration vorhanden. Laut aktueller
Feldreferenz ist ElevenLabs `modelId` das wirksame Feld; `model` wird ignoriert.

Anleitung unter `dokumentation/sprachnachrichten/README.md`; im Skriptordner
`sprachnachrichten/` vorbereitet: lokaler Helfer
`transcribe-local.py`, Konfigurationsvorbereitung `prepare-config.mjs`.
Ansatz: `faster-whisper==1.2.1`, mehrsprachiges Modell `small`, CPU/int8,
zwei Threads, vorhandene lokale Gewichte und Offline-Modus; kein konfiguriertes
Cloud-ASR-Ersatzmodell. OpenClaw nutzt einen expliziten Audio-CLI-Eintrag unter
`tools.media.models` mit `{{AttachmentPath}}`. `tts.auto: inbound` und
`tts.mode: final` für Audio-Antworten auf eingehende Sprachnachrichten.
Bekannte Stimme wird aus der aktiven Server-Konfiguration übernommen.
Der Outlook-MCP-Eintrag wird durch die gezielten Änderungen nicht ersetzt.

Vorbereitete Grenzen: drei Minuten / 20 MB pro Aufnahme, 300 Sekunden CLI-Timeout,
ein Medienlauf gleichzeitig. Modellgewichte werden nur bei der Einrichtung
geladen. Drei lokale Tests mit simuliertem ASR bestanden: lokale Modellbindung,
saubere Transkriptausgabe, fehlendes Modell, Stille und überlange Aufnahme.
**Teilinstallation von Leon per Terminal-Screenshot am 05.10.2026 bestätigt:**
pip meldet `Successfully installed` für `faster-whisper 1.2.1` samt Abhängigkeiten,
darunter `ctranslate2 4.8.2`, `av 19.0.1` und `onnxruntime 1.30.0`.
Keine erneute Paketinstallation erforderlich.
Ein weiterer Screenshot bestätigt den abgeschlossenen Modelldownload
(486 MB, Rekonstruktion 100 %) sowie das installierte `ffmpeg`
`6.1.1-3ubuntu5+esm13`. Downloadziel gemäß Anleitung:
`~/.local/share/jarvis-stt/model`, Modell `Systran/faster-whisper-small`.
**Weitere Live-Bestätigung per Terminalausgabe am 05.10.2026:**
Das Modell wurde mit `HF_HUB_OFFLINE=1`, `local_files_only=True`, CPU/int8
und zwei Threads erfolgreich geladen. Die zunächst fehlende Datei
`prepare-config.mjs` wurde ergänzt; beim zweiten Versuch wurde die Batch-Datei
erzeugt. OpenClaw meldete `Dry run successful: 10 update(s) validated`, danach
`Updated 10 config paths` und `Config valid: ~/.openclaw/openclaw.json`.
Nach dem von Leon ausgeführten Gateway-Neustart meldete der User-Dienst `active`.
Die Konfigurationsänderungen wurden laut CLI bereits ohne Neustart übernommen;
ein weiterer Neustart ist derzeit nicht nötig.

Damit waren Modelldateien, Offline-Modellladen, Konfigurationsaktivierung und
laufender Gateway bestätigt. Damaliger Server-Stand: explizite lokale
Audio-CLI, `tts.auto: inbound`, finale ElevenLabs-Antworten mit bekannter Stimme.
Die heruntergeladene `.openclaw`-Kopie ist hinsichtlich dieser Änderungen veraltet.
Der anschließende WhatsApp-Test ist fehlgeschlagen (siehe aktuelle Entscheidung
oben). Das erfolgreiche Modellladen allein war kein Nachweis für die gesamte
Sprachnachrichtenverarbeitung. Nun Cloud-Umstellung und getrennte Text-/Sprachtests
durchführen; die lokale Methode nicht erneut aktivieren.

Quellen: [Audio](https://docs.openclaw.ai/nodes/audio),
[TTS-Feldreferenz](https://docs.openclaw.ai/tools/tts/field-reference),
[faster-whisper](https://github.com/SYSTRAN/faster-whisper).

## Ziel und Aufbau

Jarvis ist Leons persönlicher Assistent. Er wurde von einer Windows-VM auf einen
Ubuntu-Server übertragen und soll dort dauerhaft laufen, auch ohne SSH-Login.

| Bestandteil | Bekannter Stand |
| --- | --- |
| Server | `stangeserv` |
| Betriebssystem | Ubuntu Server 24.04 |
| Linux-Benutzer | `leon` |
| OpenClaw | `2026.9.8`, Commit laut Protokoll `fc23bc8` |
| Modellzugang | OpenAI / ChatGPT über Device-Code-Login |
| Standardmodell | `openai/gpt-5.6-sol` |
| Agent-Runtime | `openclaw` |
| Nachrichtenkanal | Separate Jarvis-WhatsApp-Business-Nummer |
| Steuerung | Private Owner-Nummer in WhatsApp-Allowlist und Owner-Allowlist |
| WhatsApp-Gruppen | Deaktiviert |
| Sprachausgabe | ElevenLabs, `eleven_multilingual_v2`, Sprache `de` |
| Voice-ID | `QY3Oz57TOFa67IL9gWWV` |
| WhatsApp-Anrufe | MeowCaller mit eigener Linked-Device-Session |
| Kontakt-Plugin | `whatsapp-call-contact`, Version `0.1.2`, Ubuntu-Variante |
| Dienst | `openclaw-gateway.service` als systemd-User-Service |

## Bestätigter Funktionsstand

Laut Gesprächsprotokoll sind OpenClaw, Modellzugang, WhatsApp, die Allowlists,
MeowCaller, ElevenLabs und der systemd-Service eingerichtet. Der normale
WhatsApp-Rückruf an den aktuellen Absender funktioniert. Das Kontakt-Plugin ist
geladen und die Kontaktliste nennt Annka.

**Neue Bestätigung von Leon am 04.10.2026: Annka konnte erfolgreich angerufen
werden.** Der zuvor offene Kontaktanruf-Test ist damit erledigt. Die Rückmeldung
enthält keine gesonderte Aussage über die Audioqualität oder die gehörte Stimme.

Die relevanten Tools:

- `whatsapp_call`: eingebauter Rückruf an den aktuellen WhatsApp-Absender.
- `whatsapp_call_contacts`: Liste der freigegebenen Kontakte.
- `whatsapp_call_contact`: Anruf an einen konfigurierten Kontakt, beispielsweise
  Annka; keine freie Zielnummernwahl durch das Modell.

Annkas konfigurierte Namen beziehungsweise Aliase: `Annka`, `Ann-Kathrin`.
Telefonnummern und API-Keys werden in dieser Datei nicht gespeichert.

## Alter Server: Outlook-Kalender und Ausgabe im Telefonat bestätigt

Leon möchte, dass Jarvis seinen Outlook-Kalender lesen und bearbeiten kann.
**Kontotyp von Leon bestätigt: privates Microsoft-Konto.** Der MCP-Dienst ist laut Leons Screenshot
installiert und startet für die Berechtigungsprüfung. Microsoft-Anmeldung
und erneute Login-Prüfung sind erfolgreich. Die Verbindung `outlook` wurde
in OpenClaw gespeichert, und `openclaw mcp doctor outlook --probe` meldet `ok`.
**Neue Bestätigung von Leon am 04.10.2026: Jarvis hat Termine erfolgreich
gelesen und konnte sie ihm auch im Telefonat nennen.** Kalenderabruf und
gesprochene Ausgabe sind damit im praktischen Einsatz bestätigt.
Anlegen, Ändern/Verschieben und Löschen von Terminen wurden noch nicht bestätigt.

Microsoft Graph unterstützt für private Konten die delegierte Berechtigung
`Calendars.ReadWrite` zum Lesen, Anlegen, Ändern und Löschen von Terminen.
Quelle: [Microsoft-Berechtigungen](https://learn.microsoft.com/en-us/graph/permissions-reference#calendarsreadwrite).

Vorgeschlagene Anbindung: vorhandener Community-MCP-Server
[`@softeria/ms-365-mcp-server`](https://github.com/Softeria/ms-365-mcp-server),
lokal unter Linux-Benutzer `leon`, per stdio. Kalender-Preset `--preset calendar`
mit Scope-Grenze `--allowed-scopes 'User.Read Calendars.ReadWrite'` kombinieren.
Vor der Anmeldung die effektiven Rechte mit `--list-permissions` prüfen.
Anmeldung über Microsoft im Browser mittels Device Code.

OpenClaw verwaltet solche Verbindungen nach aktueller Doku unter `mcp.servers`.
Quelle: [MCP-Anbindung](https://docs.openclaw.ai/tools/mcp).
Leons Terminal-Screenshot bestätigt am 04.10.2026: OpenClaw
`2026.9.8 (fc23bc8)`, vorhandene MCP-Unterbefehle einschließlich `add`, `set`
und `doctor` sowie Node.js `v24.21.0`. Diese Voraussetzung ist damit geprüft.
Die Installation von MCP-Paket `0.158.0` unter `~/.local/share/jarvis-outlook`
wurde angeleitet. Ein weiterer Screenshot bestätigt den erfolgreichen Start
von `dist/index.js` mit `--list-permissions`: Modus `personal`, `readOnly: false`,
effektive Rechte ausschließlich `Calendars.ReadWrite` und `User.Read`.
Die konkrete Paketversion wurde noch nicht separat ausgegeben.
Die Scope-Grenze deaktiviert erwartungsgemäß `list-outlook-categories` und
`create-outlook-category`, die `MailboxSettings.*` benötigen.
npm meldet einen nicht freigegebenen Installationsskript von `keytar@7.9.0`.
Für den Server wird deshalb bei Anmeldung, Login-Prüfung und späterer
MCP-Konfiguration `MS365_MCP_USE_KEYTAR=0` vorgesehen. Laut Paketdokumentation
nutzt der Dienst dann einen verschlüsselten Dateicache mit lokalem Schlüssel.
Keine Freigabe des keytar-Installationsskripts erforderlich.
Leons Terminalausgabe bestätigt erfolgreiche `--login`- und
`--verify-login`-Aufrufe mit Kalender-Preset, Scope-Grenze und
`MS365_MCP_USE_KEYTAR=0`. Der bestätigte absolute Node-Pfad ist `/usr/bin/node`.
Anmeldecodes und Tokens werden hier nicht gespeichert.
Angeleitete Konfiguration: `openclaw mcp set outlook` mit absolutem Node-/Skriptpfad,
demselben Preset und denselben Scopes sowie `env.MS365_MCP_USE_KEYTAR: "0"`.
Eine zusätzliche Werkzeug-Allowlist soll Kalender-Auflistung, Terminabfragen
einschließlich Kalenderansicht/Serien und Termin-Anlegen/Ändern/Löschen umfassen;
Kalender-Löschen und Berechtigungsänderungen nicht freigeben. Der vorgeschlagene
Eintrag enthält zusätzlich eine Bindung an das angemeldete Microsoft-Konto.
Leons Screenshot bestätigt am 04.10.2026 die Meldung
`Saved MCP server "outlook" to /home/leon/.openclaw/openclaw.json`
und anschließend `outlook: ok` bei `openclaw mcp doctor outlook --probe`.
Der Screenshot zeigt keine einzelnen Werkzeuge oder gespeicherten JSON-Felder;
deren genaue Übernahme wurde nicht separat ausgelesen.
Der angeleitete lesende Test war erfolgreich laut Leons Rückmeldung;
zusätzlich wurden die Termine im Telefonat ausgegeben. Eine vollständige
Kalender-Auflistung und die genaue Zeitzonendarstellung wurden nicht separat
bestätigt. Nächster Schritt: gezielt Anlegen/Ändern und, mit Bestätigung,
Löschen eines Testtermins prüfen.
Quelle zur Paketversion: [Release 0.158.0](https://github.com/Softeria/ms-365-mcp-server/releases/tag/v0.158.0).
Für die spätere systemd-Anbindung absolute Programm-Pfade verwenden.

Noch offene Funktionstests: Zielkalender für Schreibzugriffe festlegen und
einen ausdrücklich beauftragten Testtermin anlegen/ändern/löschen; das Ergebnis
jeweils auch in Outlook prüfen.
Die bestehende Regel in Jarvis' `USER.md` beachten: vor Löschen immer nachfragen.
Zeitangaben auf `Europe/Berlin` beziehen und Ergebnisse erst nach erfolgreichem
Tool-Aufruf bestätigen. Anmeldungscache des MCP-Dienstes beim Backup einplanen.

## Alter Server: tägliche Kalenderübersicht per Anruf

Leon bestätigt am 04.10.2026, dass Jarvis die gewünschte Automation angelegt
hat. Der WhatsApp-Screenshot enthält folgende Bestätigung von Jarvis:

| Einstellung | Bestätigter Stand laut Jarvis |
| --- | --- |
| Automation-ID | `c54eabed-8d27-44b8-9f19-db5785392ee0` |
| Zeitplan | Täglich um 18:00 Uhr |
| Zeitzone | `Europe/Berlin`, Sommer-/Winterzeit automatisch |
| Nächste angekündigte Ausführung | Montag, 05.10.2026, 18:00 Uhr MESZ |
| Anrufziel/-kontext | Zunächst von Jarvis als freigegeben/Owner-gebunden gemeldet; im nachfolgenden Test nicht verfügbar |
| Dublettenprüfung | Keine bestehende gleichartige Automation gefunden |
| Kalenderaktionen dieser Automation | Nur lesen; keine Termine verändern |

Der erteilte Auftrag: bei jeder Ausführung aktuelle Outlook-Termine für die
nächsten 72 Stunden ab dem Anrufzeitpunkt abrufen und Leon über die bestehende
WhatsApp-Anruffunktion eine kurze deutsche Übersicht geben. Serien-,
ganztägige und mehrtägige Termine berücksichtigen; Titel, Wochentag, Datum und
Uhrzeit chronologisch nennen. Auch ohne Termine anrufen und das ausdrücklich
sagen. Bei einem fehlgeschlagenen Kalenderabruf den Fehler benennen, statt
einen leeren Kalender zu behaupten.

Die Einrichtung ist durch Leons Rückmeldung, Jarvis' WhatsApp-Bestätigung und
die anschließend von Leon geteilte CLI-Ausgabe von `automations show` dokumentiert.
**Nachträglicher Test am 04.10.2026: Kalenderabruf erfolgreich, Anruf fehlgeschlagen.**
Laut Jarvis' neuer WhatsApp-Rückmeldung ist die WhatsApp-Anruffunktion in normalen
Chats verfügbar, wird aber im automatisierten Hintergrundlauf nicht bereitgestellt.
Damit ist seine ursprüngliche Freigabe-Bestätigung widerlegt; die Automation
ist noch keine funktionierende tägliche Anruflösung. Jarvis meldet sie weiterhin
als gespeichert und aktiv. Eine Deaktivierung wurde nur angeboten, nicht bestätigt.

Die lokale Kopie von
`.openclaw/npm/projects/openclaw-whatsapp-290d7f7427/node_modules/@openclaw/whatsapp/dist/agent-tools-api.js`
zeigt in `createWhatsAppCallTool` die Verfügbarkeitsprüfung:
`actions.calls` muss aktiviert sein, `context.messageChannel` muss `whatsapp`
sein und `context.requesterSenderId` muss vorhanden sein (Zeilen 118–122).
Das erklärt plausibel das fehlende Werkzeug im Hintergrundlauf; dessen konkreter
Laufkontext wurde noch nicht direkt geprüft. Die bestehende Kontakt-Plugin-Version
hat ebenfalls eine WhatsApp-/Owner-Kontextprüfung und ist damit nicht automatisch
eine Lösung für geplante Anrufe. Die Dokumentation beschreibt `whatsapp_call`
als Rückruf an den aktuellen autorisierten WhatsApp-Absender:
[WhatsApp-Anrufwerkzeug](https://docs.openclaw.ai/channels/whatsapp#call-the-current-requester-with-meowcaller-experimental).

Leons CLI-Ausgabe bestätigt folgende gespeicherte Grunddaten:
Name `daily-outlook-whatsapp-call-1800-berlin`, Owner-Agent `main`,
Owner-Sitzung `agent:main:main`, aktiviert, Zeitplan `0 18 * * *` in
`Europe/Berlin` (exact), Sitzungsmodus `current`, Agent `main`,
Delivery `not requested`. Der letzte Testlauf hat Scheduler-Status `ok`
und keinen gespeicherten Fehler, obwohl der gewünschte Anruf ausblieb.
Der Scheduler-Status ist daher kein Nachweis für den fachlichen Erfolg.
Die Hilfe der installierten Version nennt `get`, `edit`, `run` und `runs`.

Die aktuelle Doku beschreibt `current` als separaten Lauf, der Verlauf und
Ergebniszustellung an die Ersteller-Unterhaltung bindet; der Modus ist nicht
identisch mit einem eingehenden WhatsApp-Agententurn:
[Automations-Ausführungsmodi](https://docs.openclaw.ai/automation/cron-jobs/payloads#main-session-vs-current-vs-isolated-vs-custom).
Eine Umstellung auf `current` löst diesen Fehler somit nicht; dieser Modus ist
bereits gespeichert. Ebenso ist keine generelle Abschaltung der bisherigen
WhatsApp-/Owner-Prüfungen vorgesehen.

Leon hat anschließend die vollständige JSON-Ausgabe von `automations get`
und die Hilfe von `automations edit` bereitgestellt. Bestätigt sind
Payload `agentTurn`, `lightContext: true`, `timeoutSeconds: 300` und
**`toolsAllow: ["*"]`**. Der Prompt fordert `whatsapp_call` für den
„aktuellen WhatsApp-Anforderer“. Die gespeicherte Account-Policy
(`mode: account`, Owner-Sitzung `agent:main:main`, Owner-Account `default`)
ist vorhanden. Eine fehlende allgemeine Tool-Freigabe ist damit keine
ausreichende Erklärung; sie erzeugt insbesondere keinen eingehenden
WhatsApp-Absenderkontext. `current` ist bereits eingestellt.

**Lokal vorbereitete Lösung, noch nicht auf dem Server installiert:**
`outlook-anruf/daily-outlook-call.mjs` und Anleitung `outlook-anruf/README.md`.
Das feste Node-Skript verwendet den angemeldeten Outlook-MCP-Dienst und
dessen vorhandenes MCP-SDK. Es ruft ausschließlich `get-calendar-view` für
die nächsten 72 Stunden auf, erstellt die Sprache über das bestehende
ElevenLabs-Setup und wählt über den vorhandenen MeowCaller ausschließlich
den übereinstimmend konfigurierten Owner. Kein frei übergebbares Anrufziel.
Kalenderfehler werden ehrlich angesagt und mit Fehlerstatus beendet;
Anruffehler bleiben ebenfalls Fehler. Berlin-Zeit, Ganztagesende,
chronologische Reihenfolge, Dubletten und begrenzte Sprachausgabe sind
berücksichtigt. Bei vielen Terminen nennt es die Gesamtzahl und einen
kurzen Auszug mit der Anzahl weiterer Termine.

Die bereitgestellte CLI-Hilfe bestätigt `edit --command-argv`,
`--command-cwd`, `--timeout-seconds`, `--no-output-timeout-seconds` und
`--session isolated`. Die Anleitung beschreibt die Umstellung derselben
Automation auf einen Command-Payload; ID und Zeitplan bleiben erhalten.
Die bestehenden Tool-/Plugin-Kontextprüfungen werden nicht abgeschaltet.
`--check` und `--preview` tätigen keinen Anruf. Erst der anschließende
Scheduler-Test tätigt einen echten Owner-Anruf. Versuchszähler/Sperrdatei
unter `~/.local/state/jarvis-outlook-call` verhindern parallele Läufe und
mehrfache Tagesversuche; bewusste `--test`-Wiederholungen haben zehn Minuten
Abstand. Ein manueller Scheduler-Test vor 18:00 verbraucht den Tagesversuch.

Lokale Prüfung am 04.10.2026: **12/12 Tests bestanden**, einschließlich
stdio-Handshake/Tool-Aufruf mit echtem MCP-SDK und simuliertem Outlook-Server,
Owner-Bindung, Zeitumstellung, Fehlern und Audio-Bereinigung. ElevenLabs
und Telefonie wurden dabei simuliert. Es gab keinen Live-Serverzugriff.
Nächster Schritt: Skript nach `/home/leon/daily-outlook-call.mjs` übertragen,
als `leon` prüfen/Vorschau abrufen, die bestehende Automation gemäß Anleitung
umstellen und aus genau diesem Scheduler-Lauf einen Anruf bestätigen.
**Weiter offen: erster erfolgreicher automatischer Anruf um 18:00 Uhr.**
Ein manueller Kalenderabruf und die Ausgabe von Terminen im Telefonat sind
bereits bestätigt. Die nur lesende Aufgabe dieser Automation ändert nicht die
zuvor eingerichteten MCP-Berechtigungen `Calendars.ReadWrite`/`User.Read`.

## Bisherige Probleme und Lösungen

### Owner- und WhatsApp-Allowlist

`channels.whatsapp.allowFrom` und `commands.ownerAllowFrom` sind getrennte
Einstellungen. Beide müssen korrekt gesetzt sein. Der Owner-Eintrag hat die Form
`whatsapp:+49…`.

Bei `read -rp` ist der Text nur die Eingabeaufforderung. Die Nummer muss danach
tatsächlich eingegeben werden. Eine leere Variable führte bei der Einrichtung
zu einer leeren WhatsApp-Allowlist und dem falschen Owner-Eintrag `whatsapp:`.

### Kontakt-Plugin v0.1.2

Die frühere Prüfung von `requesterSenderId` gegen eine Telefonnummer scheiterte,
weil WhatsApp auch LID/JID-Kennungen liefert. Die korrigierte Plugin-Version
verwendet die Owner-Erkennung von OpenClaw:

```ts
if (toolContext.messageChannel !== "whatsapp") return null;
if (toolContext.senderIsOwner !== true) return null;
```

Deshalb ist eine korrekte `commands.ownerAllowFrom`-Konfiguration entscheidend.
Das Plugin enthält laut Protokoll Kontakt-Allowlist, Nachrichtenlängenlimit,
Rate-Limiting und Bereinigung temporärer Audiodateien.

### MeowCaller und PATH

MeowCaller liegt unter `/home/leon/.local/bin/meowcaller`. Der PATH einer
interaktiven Shell ist nicht automatisch der PATH des systemd-Service.
`/home/leon/.local/bin` muss für den Gateway-Prozess verfügbar sein.

MeowCaller benötigt eine eigene WhatsApp-Kopplung zusätzlich zum Nachrichtenkanal.
Verwendeter Repository-Stand:

- Repository: `https://github.com/steipete/meowcaller.git`
- Branch: `feat/send-only-notify`
- Commit: `752050471fc2bf7a8cdfbf7dbd3cd4e865d85d3f`
- Go-Version laut Dokumentation: `1.27.0`

### ElevenLabs und systemd-Environment

Der ElevenLabs-Key liegt laut Protokoll in
`/home/leon/.openclaw/gateway.systemd.env` mit Dateirechten `600`.
Im Protokoll war dort zusätzlich ein PATH vorgesehen. Die später geprüfte lokale
Server-Kopie enthält in dieser Datei jedoch nur `ELEVENLABS_API_KEY`, keinen PATH.
Der tatsächliche Dienst-PATH und die Linux-Dateirechte sind damit nicht geprüft.

Die Datei muss tatsächlich vom systemd-Service geladen werden. Dazu wurde ein
Drop-in angelegt:

Pfad: `/home/leon/.config/systemd/user/openclaw-gateway.service.d/environment.conf`

```ini
[Service]
EnvironmentFile=/home/leon/.openclaw/gateway.systemd.env
```

Nach Änderungen wurden `systemctl --user daemon-reload` und ein Neustart des
Gateway-Service ausgeführt. Eine konfigurierte TTS-Provider-Einstellung allein
war zuvor nicht ausreichend, weil der laufende Prozess den API-Key nicht hatte.

`tts.auto = off` ist bewusst eingestellt. Laut Protokoll bleiben gezielte
Sprachausgabe und WhatsApp-Anrufe damit möglich.

### systemd-Verzeichnisrechte

Die Service-Installation scheiterte zunächst mit
`SERVICE_DEFINITION_UNKNOWN: [unsafe-permissions]`.
`/home/leon/.config` war mit `775` gruppenschreibbar.

Die dokumentierte Lösung war: Verzeichnisse `.config`, `.config/systemd` und
`.config/systemd/user` anlegen beziehungsweise auf Rechte `700` setzen und
sicherstellen, dass sie `leon:leon` gehören. Anschließend funktionierte
`openclaw gateway install --force`.

## Wichtige Pfade auf Ubuntu

| Zweck | Pfad |
| --- | --- |
| OpenClaw-State | `/home/leon/.openclaw/` |
| Konfiguration | `/home/leon/.openclaw/openclaw.json` |
| Dienst-Environment | `/home/leon/.openclaw/gateway.systemd.env` |
| systemd-Service | `/home/leon/.config/systemd/user/openclaw-gateway.service` |
| systemd-Drop-in | `/home/leon/.config/systemd/user/openclaw-gateway.service.d/environment.conf` |
| MeowCaller-Binary | `/home/leon/.local/bin/meowcaller` |
| MeowCaller-Repository | `/home/leon/meowcaller/` |
| MeowCaller-Session | `/home/leon/.openclaw/credentials/whatsapp-calls/default/wa-voip.db` |
| Kontakt-Plugin | `/home/leon/openclaw-whatsapp-call-contact-v0.1.2-ubuntu/` |

## Noch offen oder nicht bestätigt

- [x] Erfolgreichen Anruf bei Annka bestätigen – durch Leon am 04.10.2026 erledigt.
- [ ] Prüfen, ob `loginctl show-user leon -p Linger` tatsächlich `Linger=yes`
  meldet. Die Einrichtung ist beschrieben, das Ergebnis bleibt im Protokoll offen.
- [ ] Server-Reboot und automatische Erreichbarkeit ohne vorherigen SSH-Login
  bestätigen. Eine erst nach SSH-Anmeldung durchgeführte Statusprüfung allein
  belegt den Start ohne Login nicht.
- [ ] Backup erstellen und Wiederherstellungsumfang prüfen.
- [x] JARVIS-Persönlichkeit und Nutzerpräferenzen im Ubuntu-Workspace nachweisen –
  in der lokalen Kopie sind `SOUL.md`, `USER.md`, `IDENTITY.md` und `AGENTS.md`
  vorhanden und inhaltlich geprüft.
- [ ] Klären, ob zusätzliches altes Windows-Gedächtnis übernommen werden soll;
  in der Kopie fehlen `MEMORY.md` und `memory/`.
- [x] Globale State-Datenbank in der vollständig heruntergeladenen Kopie prüfen –
  `state/openclaw.sqlite` ist vorhanden und strukturell lesbar.
- [ ] Für eine vollständige Wiederherstellung systemd-Dateien und externe
  Plugin-/MeowCaller-Dateien ergänzen beziehungsweise deren Speicherorte prüfen.
- [ ] Installationsanleitung an den aktuellen Stand anpassen: Plugin v0.1.2 für
  Ubuntu, systemd-Environment-Drop-in und Verzeichnisrechte berücksichtigen.

Der Backup-Befehl im bisherigen Protokoll umfasst `.openclaw`, die MeowCaller-
Binary und das Kontakt-Plugin. Er enthält **nicht** die systemd-Service-Datei und
den Drop-in unter `.config/systemd/user/`. Diese müssen für eine vollständige
Wiederherstellungsanleitung zusätzlich berücksichtigt werden.

## Diagnose für die Weiterarbeit

Diese Befehle sind aus dem bisherigen Protokoll übernommen. Vor Änderungen oder
Updates den tatsächlichen Serverstand prüfen; bisher wurde hier nichts auf dem
Server ausgeführt.

```bash
openclaw --version
openclaw gateway status --deep
systemctl --user status openclaw-gateway.service --no-pager
systemctl --user show openclaw-gateway.service -p EnvironmentFiles
loginctl show-user leon -p Linger
openclaw channels status --channel whatsapp --probe
openclaw plugins inspect whatsapp-call-contact --runtime
openclaw plugins doctor
openclaw models status
journalctl --user -u openclaw-gateway.service -n 100 --no-pager
```

Die Allowlists lassen sich mit `openclaw config get channels.whatsapp.allowFrom
--json` und `openclaw config get commands.ownerAllowFrom --json` prüfen. Die
Ausgaben enthalten private Telefonnummern.

## Vorgaben für weitere Änderungen

- OpenClaw als Benutzer `leon` betreiben.
- Gateway-Port `18789` nicht öffentlich freigeben; vorgesehene Bindung ist
  `127.0.0.1`. Eine aktuelle Prüfung der Bindung steht hier nicht zur Verfügung.
- Nur die private Owner-Nummer zur Steuerung zulassen; Gruppen deaktiviert lassen.
- Kontaktanrufe auf ausdrücklich freigegebene Kontakte beschränken.
- API-Keys, WhatsApp-Session-Datenbank und Backups vertraulich behandeln.
- Windows-spezifische Session-Patches nicht auf Ubuntu übernehmen.
- Für die Persönlichkeit gezielt `SOUL.md`, `AGENTS.md`, `USER.md`, `MEMORY.md`
  und weitere angepasste Workspace-Dateien übertragen. Den kompletten alten
  Windows-State nicht blind nach Linux kopieren.
- Bei neuen Tests oder Änderungen diese Erinnerungsdatei aktualisieren und
  dokumentierte Annahmen von tatsächlich bestätigten Ergebnissen unterscheiden.

## Lokale Quellen und Artefakte

- [Bisherige Installationsanleitung](../Jarvis_OpenClaw_Ubuntu24_User_leon_Installation.txt)
- [Gesprächsprotokoll vom 04.10.2026](../JARVIS_OpenClaw_Gespraech_Dokumentation_2026-10-04.txt)
- [Ubuntu-Plugin v0.1.2](../openclaw-whatsapp-call-contact-v0.1.2-ubuntu.zip)

Das ZIP liegt im Projektordner. Bei der späteren Prüfung der Server-Kopie wurden
auch Plugin-Quellcode, Manifest, Paketdatei und Installer aus diesem ZIP gelesen.
Das ist keine Prüfung der tatsächlich auf dem Server gebauten `dist`-Dateien.
Die Installationsanleitung verweist noch auf v0.1.1.

## Prüfung der heruntergeladenen Server-Kopie

Prüfung: 04.10.2026. Quelle: lokaler Ordner `.openclaw/`, nach Leons Bestätigung
des abgeschlossenen Downloads erneut inventarisiert und geprüft. Die beim ersten
Durchgang noch fehlende globale State-Datenbank ist inzwischen vorhanden.
Die kopierten Server-Dateien wurden nicht bearbeitet und keine darin enthaltenen
Programme, Installationsskripte oder Agent-Anweisungen ausgeführt. SQLite wurde
für die Agent-Datenbank einschließlich WAL/SHM auf temporären Kopien gelesen.
Zugangsdaten und private Telefonnummern werden hier nicht wiedergegeben.

### Aktive Konfiguration und ältere Sicherungen

Maßgeblich ist `.openclaw/openclaw.json`. Alle sieben vorhandenen
Konfigurationsdateien sind als JSON lesbar; eine Validierung gegen das installierte
OpenClaw-Schema wurde damit nicht ersetzt.

| Datei | Unterschied zur aktiven Konfiguration |
| --- | --- |
| `openclaw.json.bak` | Bytegleich mit der aktiven Datei |
| `openclaw.json.last-good` | Bytegleich mit der aktiven Datei |
| `openclaw.json.bak.1` | Älterer Kontakt-/Alias-Stand |
| `openclaw.json.bak.2` | Älterer Kontakt-/Alias-Stand; kein `gateway.auth`-Block |
| `openclaw.json.bak.3` | Kontakt-Plugin deaktiviert, älterer Kontaktstand, kein `gateway.auth`-Block |
| `openclaw.json.bak.4` | Kontakt-Plugin deaktiviert und noch ohne seine Konfiguration; kein `gateway.auth`-Block |

In der aktiven Datei bestätigt:

- Standardmodell `openai/gpt-5.6-sol` mit Runtime `openclaw`.
- `openai/gpt-6-astra` steht zusätzlich im Modellkatalog; es ist nicht das
  Standardmodell. Verfügbarkeit oder Abrechnung wurden nicht geprüft.
- Agent `main` hat die Identität JARVIS mit Emoji `◉`.
- WhatsApp-, OpenAI-, Codex- und Kontakt-Plugin sind ausdrücklich aktiviert.
  Die Session-Kataloge für Codex und Anthropic sind auf `enabled: false` gesetzt;
  das bedeutet nicht, dass damit beide gesamten Plugins deaktiviert sind.
- WhatsApp: `dmPolicy: allowlist`, genau ein erlaubter Absender,
  `groupPolicy: disabled`, `mediaMaxMb: 50`, `actions.calls: true`.
- Genau ein Owner-Eintrag. Er stimmt mit dem WhatsApp-Absender und der
  Plugin-Referenz `authorizedCaller` überein; Nummernformate wurden geprüft.
- Ein freigegebener Kontakt: Annka mit Alias `Ann-Kathrin` und gültigem
  E.164-Nummernformat.
- Kontakt-Plugin: maximal 450 Nachrichtenzeichen und 5 Anrufe pro 10 Minuten,
  Account `default`, absoluter MeowCaller-Pfad unter `/home/leon/.local/bin/`.
- Gateway: `mode: local`, Authentifizierung über Token; Token ist gesetzt.
  `gateway.bind` und `gateway.port` sind nicht ausdrücklich angegeben. Eine
  tatsächliche Listener-Bindung lässt sich aus dieser Datei allein nicht ablesen.
- TTS: ElevenLabs, `auto: off`, `model: eleven_multilingual_v2`, dokumentierte
  Voice-ID und Sprache `de`.
- `meta.lastTouchedVersion` und das Schema-Metadatum der Agent-Datenbank nennen
  `2026.9.8`; die aktuelle Server-Binary wurde nicht abgefragt.

### Workspace und Gedächtnis

`workspace/` enthält die vier Startdateien und ein Git-Repository.

- `SOUL.md` enthält zusätzlich zur Vorlage eine deutsche JARVIS-Persona:
  souverän, präzise, vorausschauend und mit dezent trockenem Humor.
- `USER.md` enthält Leons Präferenzen: Deutsch, knappe natürliche Antworten,
  Zeitzone `Europe/Berlin`, selbstständige Tool-Nutzung und keine erfundenen
  Tool-Ergebnisse. Vor dem Löschen eines Kalendertermins ist Bestätigung gewünscht.
- `IDENTITY.md` setzt Name JARVIS, persönlichen KI-Assistenten und Emoji `◉`.
- `AGENTS.md` enthält allgemeine Regeln zu Arbeitsweise, Gedächtnis und
  Automationen. Beschriebene Kalender-/E-Mail-Aufgaben sind kein Nachweis,
  dass entsprechende Integrationen eingerichtet sind.
- `MEMORY.md`, `memory/`, Workspace-Skills und lokale State-Skills fehlen in
  dieser Kopie. Es besteht trotzdem Sitzungsverlauf in SQLite.
- Der vorhandene Memory-Index hat zwei Quellen: `USER.md` und ein
  Sitzungstranskript, insgesamt 25 Chunks.

Die grundlegende Persönlichkeit ist damit bereits auf dem Ubuntu-Stand vorhanden.
Ob ältere Windows-Erinnerungen übernommen wurden oder noch benötigt werden,
bleibt separat zu klären.

### Datenbanken, Kopplungen und Logs

- `agents/main/agent/openclaw-agent.sqlite` enthält eine Sitzung mit einem
  Sitzungsfenster und 220 Transcript-Events. Das gespeicherte Fenster nennt
  OpenAI, `gpt-5.6-sol` und Runtime `openclaw`.
- `PRAGMA quick_check` meldete für die temporäre Agent-Datenbank `ok`;
  `PRAGMA foreign_key_check` meldete keine Verletzungen.
- `credentials/whatsapp-calls/default/wa-voip.db` meldete ebenfalls `ok` und
  enthält einen gekoppelten MeowCaller-Geräteeintrag. Das beweist keine aktuelle
  Verbindung zum WhatsApp-Dienst.
- Baileys-Zugangsdaten einschließlich `creds.json` und kryptografischer
  Sitzungsdateien sind vorhanden. Keine aktuelle Verbindung geprüft.
- In der Agent-Datenbank finden sich keine lokalen Auth-Profil-Einträge,
  Standing Intents oder Heartbeat-Ergebnisse. Die vollständig heruntergeladene
  globale State-Datenbank enthält dagegen das gemeinsame OpenAI-OAuth-Profil
  und die Hintergrundaufgaben; siehe folgenden Abschnitt.
- Im gespeicherten Verlauf sind historische Tool-Fehler aus der Einrichtung
  enthalten, unter anderem zu TTS und fehlenden Programmen. Sie sind kein
  Nachweis fortbestehender Fehler.
- `logs/gateway-restart.log` hält am 04.10.2026 einen Restart um 20:31:19 und
  ein Stop-Signal um 20:38:51 fest, jeweils Europe/Berlin. Der Log enthält keinen
  anschließenden Startnachweis; daraus lässt sich der jetzige Serverstatus
  nicht bestimmen.

Die Datenbankprüfungen belegen die Lesbarkeit der geprüften Kopien. Sie garantieren
keinen konsistenten Gesamt-Export aller Dateien und Dienste. Der erfolgreiche
Anruf bei Annka bleibt durch Leons Rückmeldung bestätigt; er wurde bei der
statischen Prüfung nicht erneut ausgelöst.

### Globale State-Datenbank nach abgeschlossenem Download

`state/openclaw.sqlite` ist vorhanden, einschließlich WAL/SHM. Auf einer temporären
Kopie meldeten `PRAGMA quick_check` den Wert `ok` und
`PRAGMA foreign_key_check` keine Verletzungen. Die globale Schema-Version ist
19, die gespeicherte App-Version `2026.9.8`.

Zusätzlich geprüft wurden `state/openclaw-quarantine.sqlite` und die Agent-Datenbank
unter `agents/openclaw/agent/`; auch diese Strukturprüfungen waren unauffällig.
Die zusätzliche Agent-Datenbank `openclaw` enthält keine Sitzungen oder
Transcript-Events. Ihre Existenz ist kein Nachweis für einen zweiten aktiv
konfigurierten Assistenten; die aktive Konfiguration hat weiterhin Agent `main`.

Aus dem globalen State bestätigt:

- Ein gemeinsames OpenAI-OAuth-Profil mit gespeichertem Access- und Refresh-Token.
  Tokenwerte wurden nicht ausgegeben; aktuelle Gültigkeit nicht online geprüft.
- Plugin-Installationsdatensätze für `@openclaw/whatsapp` und `@openclaw/codex`,
  jeweils Version `2026.9.8`, sowie das externe Kontakt-Plugin `0.1.2`.
- Die beiden npm-Plugin-Projekte samt Paketdateien und Abhängigkeiten sind nun
  unter `.openclaw/npm/projects/` vorhanden; Paketversionen wurden abgeglichen.
- Der gespeicherte Plugin-Index führt WhatsApp, Codex, OpenAI, ElevenLabs,
  `memory-core` und das Kontakt-Plugin als aktiviert. Die Index-Diagnoseliste ist
  leer. Dies ersetzt keine Live-Runtime-Prüfung.
- `memory-core` deklariert unter anderem `memory_get`, `memory_search` und `intent`.
- 58 gespeicherte WhatsApp-Eingangsereignisse haben den Status `completed`.
- Drei aktivierte Scheduler-Aufgaben; ihre technischen Bezeichnungen und
  Zeitpläne sind unten festgehalten.
- Zwei gespeicherte Scheduler-Run-Receipts haben Status `ok`.
- Die Tabelle `backup_runs` ist leer. Damit ist kein von OpenClaw erfasstes Backup
  nachgewiesen; manuelle Sicherungen außerhalb des State sind damit nicht ausgeschlossen.
- Der registrierte Workspace-Pfad lautet `/home/leon/.openclaw/workspace`.

| Gespeicherte Aufgabe | Zeitplan | Zustand in der Kopie |
| --- | --- | --- |
| `heartbeat-main` | Alle 30 Minuten | Aktiviert, letzter Laufstatus `ok`, 0 aufeinanderfolgende Fehler |
| `Memory Dreaming Promotion` | Cron `0 3 * * *` | Aktiviert, isolierte Sitzung, keine Ergebniszustellung, noch kein Laufstatus gespeichert |
| `skill-collection-review-main` | Alle 7 Tage | Aktiviert, isolierte Sitzung, keine Ergebniszustellung, noch kein Laufstatus gespeichert |

Der Cron-Plan bedeutet täglich 03:00 in der wirksamen Scheduler-Zeitzone.
Im gespeicherten Schedule ist keine ausdrückliche Zeitzone angegeben; die
tatsächliche Server-/Scheduler-Zeitzone wurde nicht geprüft. Leons gewünschte
Zeitzone bleibt `Europe/Berlin`.

Keine dieser Aufgaben wurde bei der Prüfung neu angelegt, geändert oder gestartet.

### Grenzen dieser Kopie und Wiederherstellung

- `.openclaw/state/openclaw.sqlite` ist nach abgeschlossenem Download vorhanden
  und geprüft. Die erste Inventur erfolgte noch während des Downloads und war
  für den Umfang dieses Ordners unvollständig.
- Die systemd-Service-Datei und ihr Drop-in liegen außerhalb `.openclaw` und
  wurden nicht mitgeliefert. Linger, Autostart, Dienst-PATH und Linux-Dateirechte
  bleiben ungeprüft.
- `gateway.systemd.env` enthält einen nicht leeren ElevenLabs-Key und keinen PATH.
- `extensions/` ist leer. Das ist mit dem extern verlinkten Kontakt-Plugin
  vereinbar: `plugins.load.paths` verweist auf
  `/home/leon/openclaw-whatsapp-call-contact-v0.1.2-ubuntu` außerhalb dieses Ordners.
  Das vollständige installierte Plugin samt Build ist in dieser Kopie nicht enthalten.
- Auch `/home/leon/.local/bin/meowcaller` und `/home/leon/meowcaller/` liegen
  außerhalb der Kopie.
- Die vollständig heruntergeladene Kopie enthält rund 25.400 Dateien mit
  zusammen etwa 2,62 GiB an Dateiinhalten. Der Großteil entfällt auf `agents/`
  (ca. 1.179 MiB), `tmp/` (ca. 970 MiB) und `npm/` (ca. 491 MiB), darunter große
  Linux-Binaries, Abhängigkeiten und temporäre Build-Artefakte. Inventar geprüft,
  nicht jedes mitgelieferte Bibliotheks- oder UI-Asset einzeln untersucht.
  Die Summe der Dateigrößen ist keine Messung des tatsächlichen Speicherverbrauchs
  auf dem Linux-Server, etwa bei dortigen Hardlinks. Kein automatisches Bereinigen.

Diese heruntergeladene Kopie ist nützlich zur Analyse, aber noch kein als
vollständig geprüftes Wiederherstellungs-Backup.

### Zusätzliche Erkenntnisse aus dem vorhandenen Plugin-ZIP

Der gelesene Quellcode von v0.1.2 bestätigt:

- Beide Tools werden nur für WhatsApp und `senderIsOwner === true` bereitgestellt.
- `authorizedCaller` ist eine Setup-Referenz, keine zweite aktive Nummernprüfung.
  Die tatsächliche Owner-Autorisierung erfolgt über OpenClaw.
- Kontakte werden ausschließlich anhand konfigurierter Namen/Aliase aufgelöst.
  Das Modell übergibt keine Zieltelefonnummer.
- Das Plugin ruft ElevenLabs direkt auf und liest `ELEVENLABS_API_KEY` oder
  `XI_API_KEY` aus dem Prozess-Environment. Seine TTS-Einstellungen sind von der
  Core-TTS-Konfiguration getrennt.
- Vor MeowCaller werden Abbruchsignal und `assertInvocationCurrent`, sofern
  vorhanden, geprüft. Ein solcher Guard ist im ZIP also bereits berücksichtigt.
- MeowCaller wird mit `spawn` und einer Argumentliste aufgerufen; Erfolg wird
  erst bei Exit-Code 0 gemeldet. Temporäre MP3-Dateien werden im `finally` entfernt.
- Das Rate-Limit zählt erfolgreiche Kontaktanrufe in einem Array im Prozess.
  Fehlversuche werden nicht gezählt; bei einem Prozessneustart geht der Zähler
  verloren. Es ist kein persistentes Limit für sämtliche Anrufarten.
- Der Installer setzt `commands.ownerAllowFrom` und die Kontaktliste auf die
  eingegebenen Werte. Bei späteren zusätzlichen Ownern oder Kontakten nicht
  ungeprüft erneut ausführen, da diese Listen ersetzt werden können.

Keine Änderungen am Plugin vorgenommen; der tatsächlich installierte Build
ist weiterhin gesondert zu prüfen, falls daran gearbeitet werden soll.

## Wissen aus der offiziellen OpenClaw-Dokumentation

Recherche: 04.10.2026. Die folgenden Notizen stammen aus der aktuellen offiziellen
Online-Dokumentation. Sie beschreiben nicht automatisch den genauen Stand der
installierten Version `2026.9.8`. Versionsgebundene Dokumentation zu diesem Release
konnte bei der Recherche nicht erfolgreich abgerufen werden. Vor konkreten
Änderungen deshalb die Hilfe, das Schema und gegebenenfalls den Quellcode der
installierten Version heranziehen.

Diese Datei ist unsere lokale Grundlage für die Weiterarbeit in Codex. Sie wird
nicht automatisch auf den Ubuntu-Server übertragen oder von Jarvis gelesen.
Für eine neue Arbeitssitzung zuerst den Projektstand und diese Wissensnotizen lesen.

### Gateway und Agent-Runtime

Der Gateway hält die Kanalverbindungen und verwaltet den laufenden Betrieb.
CLI und Verwaltungsoberfläche kommunizieren mit ihm über WebSocket; die
Standardadresse ist `127.0.0.1:18789`. Für unsere WhatsApp-Nachrichtensitzung ist
der Gateway der zuständige Prozess. MeowCaller hat zusätzlich seine separat
gekoppelte Anrufsitzung. Quelle:
[Gateway-Architektur](https://docs.openclaw.ai/concepts/architecture).

Die eingebettete Agent-Runtime verbindet Modellaufrufe, Prompt-Aufbau und Tools.
Ein Agent hat einen Workspace, Startdateien und eigenen Sitzungszustand.
Eine Modellkennung und die gewählte Agent-Runtime sind unterschiedliche
Einstellungen; unser dokumentierter Runtime-Stand ist `openclaw`. Quelle:
[Agent-Runtime](https://docs.openclaw.ai/concepts/agent).

### Konfiguration und Änderungen

`~/.openclaw/openclaw.json` verwendet JSON5. Das Schema wird streng validiert:
unbekannte Schlüssel, falsche Typen oder ungültige Werte können den Gateway-Start
verhindern. Die aktuelle Doku nennt `openclaw config schema` und
`config.schema.lookup` zur Schemaabfrage. Vor Änderungen Verfügbarkeit in der
installierten Version prüfen. Quelle:
[Konfiguration](https://docs.openclaw.ai/gateway/configuration).

Die aktuelle Doku beschreibt `gateway.reload.mode: "hybrid"` als Standard:
geeignete Änderungen werden im Betrieb angewendet, andere können automatisch
einen Neustart auslösen. Ein gespeicherter Wert allein beweist nicht, dass ein
Tool im laufenden Prozess verfügbar ist. Nach Änderungen Runtime und Funktion
prüfen. Quelle:
[Konfigurations-Reload](https://docs.openclaw.ai/gateway/configuration/hot-reload).

### Linux, Dienst und Umgebungsvariablen

`openclaw gateway install` erzeugt laut Linux-Doku standardmäßig einen
systemd-User-Service. Für unseren bestehenden Aufbau bleiben der Benutzer `leon`,
die Dienstdatei und das Environment-Drop-in die maßgeblichen Betriebspunkte.
Quelle: [Linux und systemd](https://docs.openclaw.ai/platforms/linux).

Die Setup-Doku bestätigt die Bedeutung von Linger für einen User-Service ohne
aktive Anmeldung. Bei uns ist `sudo loginctl enable-linger leon` dokumentiert;
die tatsächliche Bestätigung bleibt offen. Quelle:
[Setup und Linger](https://docs.openclaw.ai/setup).

OpenClaw übernimmt Umgebungsvariablen des Elternprozesses und kann zusätzlich
`.env` im Arbeitsverzeichnis sowie `~/.openclaw/.env` lesen. Diese Dateien
überschreiben laut aktueller Doku bereits vorhandene Variablen nicht. Der Inhalt
einer SSH-Shell ist daher kein Beweis für das Dienst-Environment. Unsere Datei
`gateway.systemd.env` wird über den systemd-Drop-in geladen. Quelle:
[Umgebungsvariablen](https://docs.openclaw.ai/gateway/configuration/environment-variables).

### WhatsApp und Anrufe

WhatsApp-Nachrichten laufen über Baileys. QR-Kopplung des Kontos und Freigabe
eines Absenders sind unterschiedliche Vorgänge. `dmPolicy: "allowlist"` begrenzt
eingehende Direktnachrichten; `groupPolicy: "disabled"` blockiert eingehende
Gruppennachrichten. Eine Eingangs-Allowlist ist keine allgemeine Beschränkung
aller ausgehenden Ziele.

`whatsapp_call` benötigt `channels.whatsapp.actions.calls: true`, MeowCaller im
Dienst-PATH, eine eigene MeowCaller-Kopplung und einen geeigneten TTS-Provider.
Das Tool hat keinen frei wählbaren Zielnummernparameter. Der in unserem Protokoll
festgehaltene MeowCaller-Commit wird auch in der aktuellen Doku genannt.
Die Funktion spielt erzeugte Sprache ab; diese Dokumentation belegt keinen
wechselseitigen KI-Telefonassistenten. Quelle:
[WhatsApp einschließlich MeowCaller](https://docs.openclaw.ai/channels/whatsapp).

`commands.ownerAllowFrom` bestimmt ausdrücklich die Owner-Identität für
Owner-Befehle und entsprechende Kanalaktionen. Es ist von der normalen
Befehls-Allowlist getrennt. Bei weiteren Absendern deshalb Eingangszugriff und
Owner-Berechtigung unabhängig prüfen. Quelle:
[Befehle und Owner-Allowlist](https://docs.openclaw.ai/gateway/config-channels/commands).

### Plugins und Tool-Verfügbarkeit

Plugin-Konfiguration liegt unter `plugins.entries.<id>.config`. Installation,
Aktivierung, Zulassung durch Plugin-Policy und Registrierung zur Laufzeit sind
getrennte Prüfpunkte. `openclaw plugins inspect <id> --runtime --json` ist laut
Doku zur Runtime-Prüfung geeignet; anschließend eine echte Funktion testen.
Ein lokal verlinktes Plugin hängt weiterhin von seinem Quellordner ab. Quelle:
[Plugins](https://docs.openclaw.ai/tools/plugin).

Tool-Plugins können über `defineToolPlugin` Parametertypen, Konfigurationsschema
und Tool-Metadaten deklarieren. Eine Tool-Factory kann anhand des Aufrufkontexts
ein Tool bereitstellen oder `null` zurückgeben. Das erklärt, warum ein geladenes
Plugin nicht zwingend in jedem Gespräch seine Tools anbietet.

Die aktuelle Doku behandelt außerdem `contextVersion: 2` und
`assertInvocationCurrent()` für fortgesetzte beziehungsweise asynchrone Aufrufe.
`senderIsOwner` prüft dort die Verfügbarkeit, ersetzt aber nicht die abschließende
Prüfung einer noch gültigen Aufrufberechtigung. Bei einer späteren Weiterentwicklung
unseres Kontakt-Plugins API-Kompatibilität und Berechtigung direkt vor dem Anruf
prüfen. Der später gelesene ZIP-Quellcode enthält bereits einen optionalen Aufruf
von `assertInvocationCurrent` vor MeowCaller; der Server-Build und die konkrete
SDK-Kompatibilität bleiben ungeprüft. Quelle:
[Tool-Plugins und Owner-Kontext](https://docs.openclaw.ai/plugins/tool-plugins).

### Workspace, Persönlichkeit und Gedächtnis

Der Standard-Workspace ist `~/.openclaw/workspace`; der tatsächliche Pfad kann
konfiguriert sein. Er ist Arbeitsverzeichnis und Kontextquelle, aber allein keine
harte Sandbox. Die wichtigsten Dateien haben unterschiedliche Aufgaben:

| Datei | Aufgabe |
| --- | --- |
| `AGENTS.md` | Arbeitsregeln und Vorgehensweise |
| `SOUL.md` | Persönlichkeit, Ton und Grenzen |
| `USER.md` | Stabile Angaben und Präferenzen des Nutzers |
| `IDENTITY.md` | Name und Identität des Agenten |
| `BOOTSTRAP.md` | Einmalige Ersteinrichtung eines neuen Workspace |
| `MEMORY.md` | Kompaktes langfristiges Gedächtnis |
| `memory/YYYY-MM-DD.md` | Ausführlichere Tagesnotizen |

Quelle: [Agent-Workspace](https://docs.openclaw.ai/concepts/agent-workspace).

Dauerhaftes Gedächtnis entsteht durch gespeicherte Dateien. `MEMORY.md` soll
wichtige Fakten und Entscheidungen verdichten; detaillierte Protokolle gehören
in Tagesnotizen. Große Startdateien können im Modellkontext gekürzt werden.
Für Jarvis sollten wir bei Bedarf eine kurze Projektzusammenfassung in dessen
Workspace pflegen, statt sämtliche Dokumentation in den Startprompt zu packen.
Quelle: [Gedächtnis](https://docs.openclaw.ai/concepts/memory).

Sitzungen verwaltet der Gateway. Die aktuelle Doku beschreibt geteilte
Direktnachrichten-Sitzungen als Standard sowie getrennte Gruppen-/Raumsitzungen.
Wenn später weitere Nutzer hinzukommen, Sitzungsisolation ausdrücklich prüfen.
Eine neue Sitzung und das langfristige Datei-Gedächtnis sind verschiedene Ebenen.
Quelle: [Sitzungsverwaltung](https://docs.openclaw.ai/concepts/session).

### Skills, Tools und Ausführungsumgebung

Skills bestehen aus einem `SKILL.md` mit Metadaten und Anweisungen zur
Tool-Nutzung. Sie stellen allein kein neues ausführbares Tool bereit.
Die aktuelle Doku nennt unter anderem `<workspace>/skills`, lokale State-Skills
und mitgelieferte Skills; Workspace-Skills haben hohe Priorität. Anforderungen
an Konfiguration, vorhandene Programme und Umgebung beeinflussen, welche Skills
geladen werden. Quelle: [Skills](https://docs.openclaw.ai/tools/skills).

Sandbox und Tool-Policy beantworten unterschiedliche Fragen: Wo wird ein Tool
ausgeführt, und welche Tools sind verfügbar? Elevated betrifft zusätzliche
Exec-Ausführung außerhalb der gewöhnlichen Sandbox. Für spätere Fehlersuche
nennt die Doku `openclaw sandbox explain`. Ein fehlendes Tool sollte nicht
pauschal durch Öffnen sämtlicher Berechtigungen behoben werden. Quelle:
[Sandbox, Tool-Policy und Elevated](https://docs.openclaw.ai/gateway/sandbox-vs-tool-policy-vs-elevated).

### TTS und mögliche Schema-Unterschiede

Die aktuelle TTS-Konfiguration liegt unter `tts`. Das ElevenLabs-Beispiel nutzt
`tts.providers.elevenlabs.modelId` und `speakerVoiceId`. Unser Installationsprotokoll
verwendet im Provider-Block `model`. Das ist ein konkreter Prüfpunkt für das
installierte Schema; daraus folgt noch nicht, dass die funktionierende
Server-Konfiguration falsch ist. Die Plugin-eigene Einstellung `model` ist
zusätzlich vom Core-TTS-Schema zu unterscheiden. Quelle:
[TTS-Konfiguration](https://docs.openclaw.ai/tools/tts/configuration).

### Automationen und Heartbeat

Der eingebaute Scheduler speichert Aufgaben und kann Ergebnisse an einen Kanal
oder Webhook ausliefern. Die aktuelle Doku verwendet `openclaw automations`;
`openclaw cron` bleibt dort ein Alias. Für konkrete Erinnerungen zuerst die
Befehle der installierten Version und die gewünschte Zustelladresse prüfen.
Quelle: [Automationen](https://docs.openclaw.ai/automation/cron-jobs).

Heartbeat ist die regelmäßige Aktivierung des Agenten. Die aktuelle Doku nennt
standardmäßig `30m` und `0m` zum Abschalten der wiederkehrenden Aktivierung.
Zeitplan, aktive Stunden und Zustellziel sind eigenständige Einstellungen.
Der später vollständig gelesene Server-State enthält einen aktivierten
`heartbeat-main`-Job mit 30-Minuten-Intervall und zuletzt gespeichertem Status `ok`.
Die tatsächliche Live-Ausführung und Zustellroute wurden nicht geprüft.
Quelle: [Heartbeat](https://docs.openclaw.ai/gateway/heartbeat).

### Backups und Updates

Die aktuelle Backup-Doku beschreibt SQLite-State und sichere Snapshot-Verfahren.
Ein einfaches Kopieren laufender SQLite-Dateien samt WAL ist kein verlässliches
Datenbank-Backup. Sie nennt beispielsweise
`openclaw backup create --output ~/Backups/openclaw --verify`.
Verfügbarkeit und Sicherungsumfang in `2026.9.8` zuerst prüfen; eigene Plugin-Dateien,
MeowCaller samt Session und systemd-Konfiguration zusätzlich berücksichtigen.
Der alte `tar`-Vorschlag ist deshalb noch keine geprüfte vollständige
Backup-Lösung. Quelle: [Backups](https://docs.openclaw.ai/install/backups).

Vor einem größeren Update ein verifiziertes Backup erstellen. Die aktuelle Doku
nennt `openclaw update --dry-run` für eine Vorschau. Nach einem Update Gateway,
Kanäle und Plugins prüfen; für unser Projekt gehören Rückruf und Kontaktanruf
zur Funktionsprüfung. Version und Migrationshinweise vor dem Update abgleichen.
In dieser Sitzung wurde kein Update oder anderer Servereingriff ausgeführt.
Quelle: [Updates](https://docs.openclaw.ai/install/updating).

### Vorgehen beim nächsten konkreten Arbeitsschritt

1. Projektstand in dieser Datei lesen und neue Rückmeldungen berücksichtigen.
2. Tatsächliche Version, Gateway, Kanal und gegebenenfalls Plugin-Runtime prüfen.
3. Benötigte Befehlsoptionen über `<befehl> --help` und Konfigurationsfelder über
   das verfügbare Schema der installierten Version verifizieren.
4. Betroffene Dateien und Zustand sichern, Änderung gezielt umsetzen und die
   betreffende Funktion prüfen.
5. Bestätigte Ergebnisse, neue Pfade und verbleibende Aufgaben hier nachtragen.
