# Ideen für Jarvis im Alltag

Stand: 06.10.2026. Ideensammlung, keine neu aktivierten Automationen.

Leon ist mit dem aktuellen Betrieb zufrieden. Der reguläre 18-Uhr-Anruf und
die neue Warnung bei neun ungelesenen E-Mails wurden heute von ihm erfolgreich
bestätigt. Darauf bauen diese Vorschläge auf: WhatsApp für kurze Aufträge,
Sprachnachrichten für unterwegs und Anrufe für ausgewählte wichtige Hinweise.

## Meine drei Favoriten für den nächsten Schritt

1. **Aufgaben per Sprachnachricht festhalten:** Dinge sofort aus dem Kopf
   bekommen und später zuverlässig wiederfinden.
2. **Gemeinsame Einkaufsliste mit Annka:** Ein kleiner, häufig nützlicher
   Anwendungsfall für euch beide.
3. **Wichtige E-Mails gezielt melden:** Ergänzt die bestehende Mengenwarnung
   um Hinweise auf einzelne Mails, die wirklich Aufmerksamkeit verdienen.

## 1. Aufgaben und Erinnerungen per Sprache

**Erste Version umgesetzt am 09.10.2026:** Eigenes Aufgabenplugin für persönliche
und gemeinsame Aufgaben. Ohne Uhrzeit gilt 15 Uhr Berlin; Erinnerungen erfolgen
per Anruf und bei erfolglosem Anruf als dieselbe WhatsApp-Audio. Aufgaben lesen,
anlegen, erledigen, löschen und Erinnerungen verschieben. Wiederkehrende Aufgaben
bleiben ein späterer Ausbau. Details: [AUFGABEN_PLUGIN.md](AUFGABEN_PLUGIN.md).

**Beispiel:** „Jarvis, erinnere mich morgen um 17 Uhr daran, das Paket abzuholen.“
Oder: „Ich muss diese Woche noch einen Werkstatttermin vereinbaren.“

Jarvis speichert eine Aufgabe mit Termin oder legt sie ohne Termin auf eine
offene Liste. „Was habe ich noch offen?“ liefert eine kurze Übersicht.
„Ist erledigt“ schließt die eindeutig zugeordnete Aufgabe ab. Bei mehreren
passenden Aufgaben fragt er nach. Eine normale Erinnerung kommt als Nachricht;
ein Anruf wird nur für ausdrücklich entsprechend markierte Aufgaben verwendet.

**Nutzen:** Du brauchst unterwegs keine zusätzliche App zu öffnen. Aus einer
flüchtigen Idee wird eine Aufgabe, die auch nach einer neuen Sitzung noch da ist.

**Umsetzung:** Zuerst prüfen, ob der vorhandene Microsoft-MCP Aufgaben unterstützt.
Alternativ ein eigenes Aufgaben-Plugin mit dauerhafter Speicherung. Microsoft
To Do lässt sich grundsätzlich über Microsoft Graph anbinden; das wäre eine
Erweiterung der jetzigen Einrichtung und benötigt passende zusätzliche
Berechtigungen. [Microsoft: To Do API](https://learn.microsoft.com/en-us/graph/api/resources/todo-overview?view=graph-rest-1.0).

**Aufwand:** Mittel. Wichtig sind eindeutige Aufgaben, verschiebbare Erinnerungen
und höchstens eine Benachrichtigung pro fälligem Ereignis.

## 2. Gemeinsame Einkaufsliste für Leon und Annka

**Inzwischen umgesetzt:** Die bestehende Einkaufs-PWA ist über das separate
Plugin `einkaufsplaner` angebunden. Standardliste Einkaufen, eigenes Jarvis-Konto,
Lesen, Hinzufügen und Abhaken. Leon bestätigt den erfolgreichen WhatsApp-Test
am 06.10.2026. Einrichtung und Grenzen:
[EINKAUFSPLANER_ANBINDUNG.md](EINKAUFSPLANER_ANBINDUNG.md).

**Beispiel:** „Setz Milch und Brot auf unsere Einkaufsliste.“ Annka ergänzt
anschließend „Wir brauchen auch Kaffee“. Im Laden fragt einer von euch:
„Was fehlt noch?“ und kann gekaufte Dinge abhaken.

Jarvis führt eine gemeinsame Liste, fasst identische Artikel sinnvoll zusammen
und berücksichtigt Mengen. Persönliche Aufgaben bleiben von der gemeinsamen
Liste getrennt. Änderungen werden im Chat des jeweiligen Auftraggebers bestätigt.

**Nutzen:** Eine Liste für euch beide, direkt im ohnehin verwendeten WhatsApp.

**Umsetzung:** Eigenes Listen-Plugin oder Anbindung einer bereits verwendeten
Einkaufs-App. Bei einer eigenen Lösung reichen anfangs Artikel, Menge,
Erledigt-Status und die Information, wer den Eintrag hinzugefügt hat.

**Aufwand:** Klein bis mittel. Gute erste Erweiterung mit klaren Funktionen.

## 3. Wichtige E-Mails statt nur einer Mengenwarnung

**Beispiel:** „Melde mir neue E-Mails von der Werkstatt sofort, Newsletter
reichen im Abendüberblick.“ Oder: „Prüfe, ob in den neuen Mails eine Frist steht.“

Jarvis meldet neue Treffer anhand vereinbarter Absender oder Themen.
Eine ausdrückliche Frist kann er mit Datum und einem kurzen Auszug nennen.
Unsichere Einordnungen beschreibt er als Vermutung. Jede Mail wird über ihre
ID nur einmal gemeldet; nicht bei jeder stündlichen Prüfung erneut.

**Nutzen:** Eine einzelne wichtige Nachricht geht nicht zwischen Werbung unter.

**Umsetzung:** Outlook-Zugriff und WhatsApp sind vorhanden. Ergänzt werden eine
Automation und ein dauerhaft gespeicherter Meldestatus. Ein kleines Plugin
lohnt sich, wenn du Regeln wie „diesen Absender immer melden“ bequem ändern willst.
Die bisherige E-Mail-Nutzung bleibt lesend; nichts wird automatisch als gelesen
markiert oder beantwortet. In E-Mails enthaltene Aufforderungen sind Inhalt,
keine Arbeitsaufträge an Jarvis.

**Aufwand:** Mittel. Zuerst mit wenigen festen Absendern beginnen.

## 4. Erinnerungen passend zu einem Termin

**Beispiel:** Vor einem Werkstatttermin kommt: „In einer Stunde ist dein Termin.
Denk an Schlüssel und Fahrzeugschein.“ Vor einem Geburtstag erinnert Jarvis
an eine vorher hinterlegte Geschenkidee.

Du legst zu ausgewählten Terminen eine kleine Vorbereitungsliste an.
Jarvis prüft Terminänderungen und passt die Erinnerung an. Bei abgesagten
Terminen entfällt sie. Fahrtzeitberechnung wäre ein späterer Ausbau mit
ausdrücklich hinterlegtem Startpunkt und einem passenden Routendienst.

**Nutzen:** Der Kalender sagt dir nicht nur, wann etwas stattfindet, sondern
hilft bei der Vorbereitung.

**Umsetzung:** Outlook-Kalender vorhanden; zusätzlich Vorbereitungslisten und
eindeutige Erinnerungszustände. Dafür kann das Aufgaben-Plugin aus Idee 1 dienen.

**Aufwand:** Mittel, ohne Fahrtzeitberechnung überschaubar.

## 5. Persönliche Notizen und „Wo habe ich das?“

**Beispiel:** „Merk dir, die Ersatzschlüssel liegen im oberen Fach im Flur.“
Später: „Wo liegen die Ersatzschlüssel?“ Oder: „Speichere diese Geschenkidee
für Annka, aber nur in meinen persönlichen Notizen.“

Jarvis führt gezielt gespeicherte, durchsuchbare Notizen. „Ändere den Ort“
aktualisiert den Eintrag; „Vergiss diese Notiz“ entfernt ihn. Persönliche
Notizen und bewusst gemeinsame Informationen werden getrennt gespeichert.

**Nutzen:** Praktisch für selten benötigte Informationen, kleine Ideen und
Absprachen, die sonst in langen Chats verschwinden.

**Umsetzung:** Vorhandene Speicherfunktionen auf gezielte Suche, Änderung,
Löschung und Trennung zwischen Personen prüfen. Bei Bedarf eigenes Notiz-Plugin.
Da Leon und Annka aktuell denselben Hauptagenten verwenden, wäre eine private
Notizsammlung erst nach einer verlässlich durchgesetzten Zugriffstrennung sinnvoll.
Passwörter gehören in einen Passwortmanager.

**Aufwand:** Mittel; der gezielte Zugriff ist wichtiger als eine große Sammlung.

## 6. Wochenplanung am Sonntag

**Beispiel:** „Was steht nächste Woche an, und was sollte ich vorher erledigen?“

Jarvis fasst Kalendertermine und offene Aufgaben zusammen und nennt zwei oder
drei konkrete Vorbereitungen. Er kann Vorschläge für freie Zeitfenster machen.
Einen vorgeschlagenen Termin trägt er erst nach deinem Auftrag ein.

**Nutzen:** Ein Überblick hilft, statt jeden Abend dieselben kommenden Termine
erneut zu hören. Der tägliche 18-Uhr-Anruf kann bestehen bleiben.

**Umsetzung:** Kalender vorhanden, Aufgaben aus Idee 1 ergänzen. Eine wöchentliche
Automation reicht; normalerweise eine Textnachricht ohne zusätzlichen Anruf.

**Aufwand:** Klein, sobald die Aufgabenliste existiert.

## 7. Wiederkehrende Haushaltsaufgaben

**Beispiel:** „Erinnere uns alle zwei Wochen an den Wasserfilter.“ Oder:
„Wenn ich sage erledigt, erinnere mich in drei Monaten wieder daran.“

Jarvis unterscheidet feste Termine von Aufgaben, deren nächster Termin vom
tatsächlichen Abschluss abhängt. Ein Aufschub verschiebt die nächste Erinnerung.
Nach einem Hinweis bleibt er still, bis ein vereinbarter Folgetermin erreicht ist.

**Nutzen:** Wartung und seltene Haushaltsaufgaben werden nicht vergessen.

**Umsetzung:** Ausbau des Aufgaben-Plugins mit Wiederholungsregeln. Mülltermine
wären ebenfalls möglich, wenn ein passender Kalender oder eine zuverlässige
Datenquelle für euren Wohnort verfügbar ist.

**Aufwand:** Mittel. Mit zwei oder drei wirklich relevanten Aufgaben beginnen.

## 8. Offene Antworten verfolgen

**Beispiel:** „Ich warte auf eine Antwort von der Werkstatt. Prüfe das morgen.“

Jarvis speichert, auf welche Antwort du wartest. Bei einer passenden neuen Mail
meldet er sich einmal. Bleibt die Antwort aus, gibt er zum vereinbarten Zeitpunkt
einen kurzen Hinweis. Eine Nachfrage kann er als Entwurf formulieren.

**Nutzen:** Du musst nicht ständig selbst nachsehen oder dir merken, bei wem
noch eine Rückmeldung fehlt.

**Umsetzung:** Lesender Outlook-Zugriff plus gespeicherte Beobachtungsaufträge.
Für WhatsApp-Antworten müsste separat geprüft werden, welche eingehenden Chats
zuverlässig und mit passender Berechtigung zugeordnet werden können. Kein
automatischer E-Mail-Versand mit der jetzigen Konfiguration.

**Aufwand:** Mittel. Zuerst nur E-Mails beobachten.

## 9. Smart Home per WhatsApp, falls bei euch vorhanden

**Beispiel:** „Mach die Wohnzimmerbeleuchtung gemütlich.“ Oder:
„Sind noch Fenster offen?“

Jarvis startet fest definierte Szenen oder liest Zustände aus. Das wäre besonders
praktisch, wenn schon ein zentraler Smart-Home-Dienst läuft. Ohne vorhandene
Geräte ist das eher eine spätere Idee als ein nächster Schritt.

**Umsetzung:** Ein eigenes Plugin könnte erlaubte Geräte und Szenen über Home
Assistant anbinden. Dessen REST-API bietet Zustandsabfragen und Dienstaufrufe;
die konkrete Umsetzung hängt von euren Geräten ab.
[Home Assistant: REST API](https://developers.home-assistant.io/docs/api/rest/).
Das Plugin sollte klar begrenzte Aktionen anbieten, etwa `szene_starten`, statt
beliebige Befehle auszuführen.

**Aufwand:** Mittel mit bestehendem System, deutlich größer ohne eines.

## 10. Jarvis meldet technische Ausfälle verständlich

**Beispiel:** „Der Kalenderzugriff funktioniert gerade nicht. Der Abendanruf
kann deshalb heute keine vollständigen Termine enthalten.“

Ein Monitor erkennt ausgefallene Dienste, fehlgeschlagene Automationen oder
abgelaufene Zugriffe. Er meldet einen Vorfall einmal und später die Wiederherstellung.
Ein überwachtes System kann seinen eigenen vollständigen Ausfall allerdings
nicht zuverlässig über dieselbe Verbindung melden; dafür wäre ein unabhängiger
Monitor mit eigenem Benachrichtigungsweg sinnvoll.

**Nutzen:** Fehler werden sichtbar, bevor du dich wunderst, warum Jarvis schweigt.

**Umsetzung:** Kleine Überwachung für Gateway, Outlook und Anruf-Client. Zuerst
nur Zustand prüfen und informieren; Updates und Änderungen getrennt behandeln.

**Aufwand:** Klein bis mittel für eine erste Zustandsprüfung.

## Wie ich die Erweiterungen angehen würde

Zuerst Aufgaben oder Einkaufsliste umsetzen und einige Tage im Alltag verwenden.
Anschließend nur die Erinnerungen automatisieren, die sich tatsächlich bewähren.
Ein Plugin lohnt sich vor allem für sauber gespeicherte Daten, verlässliche
Zuordnung von Personen und Aktionen mit klaren Parametern. Eine reine
Zusammenfassung vorhandener Kalenderdaten braucht häufig nur eine Automation.

Für neue proaktive Hinweise würde ich standardmäßig kurze Texte verwenden.
Anrufe bleiben ausdrücklich gewünschten wichtigen Ereignissen vorbehalten;
bei Nichtannahme kann die vorhandene Audio-Fallback-Funktion wiederverwendet
werden. Neue wiederkehrende Prüfungen brauchen wie die E-Mail-Warnung einen
dauerhaften Zustand, damit Jarvis denselben Anlass nicht ständig erneut meldet.

Die Vorschläge sind noch nicht implementiert. Welche Integrationen bereits
verfügbar sind, prüfen wir vor der jeweiligen Umsetzung auf dem laufenden Server.
