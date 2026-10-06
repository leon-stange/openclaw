# Jarvis und die bestehende Einkaufs-PWA

Stand: 06.10.2026. Plugin auf dem Server aktiviert und von Leon erfolgreich
über WhatsApp getestet. Kein Passwort im Repository.

## Getrennte Projekte

Die App bleibt in `C:\Users\leon-\Desktop\Einkaufs-APP`, Repository
`leon-stange/einkauf_pwa_bhd`. Gelesener Stand: `b5fd742` auf `main`, sauberer
Arbeitsbaum. An der App wurde nichts geändert. Das OpenClaw-Plugin liegt hier
unter [plugins/einkaufsplaner](../plugins/einkaufsplaner/).

Server-Pfad: `/home/leon/.local/share/jarvis-einkaufsplaner`.
Adresse fest `https://app.stangeleon.de`, API unter `/api`, Konto fest `Jarvis`.
Leon hat das normale Konto angelegt, der gemeinsamen Gruppe zugewiesen und
den Zugang selbst getestet. Standardliste: **Einkaufen**.

Die App speichert beim Hinzufügen `req.auth.id` als `created_by` und
`updated_by`. Beim Lesen wird der Spitzname, andernfalls der Benutzername,
als `createdBy` zurückgegeben und im Einkaufsmodus unter dem Artikel gezeigt.
So erscheinen neue Plugin-Einträge unter Jarvis. Beim Abhaken bleibt der
ursprüngliche Ersteller erhalten; letzter Bearbeiter wird Jarvis.

## Funktionen

- `einkauf_listen_lesen`: Listen der Gruppe mit Zählern lesen.
- `einkauf_liste_lesen`: standardmäßig offene Artikel aus Einkaufen; optional
  erledigte Artikel und anderer eindeutiger Listenname. Maximal 200 Artikel
  in der Antwort; Gesamtzahl wird mitgeliefert.
- `einkauf_artikel_hinzufuegen`: ein Artikel mit optionaler Beschreibung,
  Menge und Einheit. Unterstützte Einheiten der App: g, kg, ml, Stück.
- `einkauf_artikel_abhaken`: einen vorhandenen Artikel über seine vorher
  gelesene ID erledigen. Bei mehrdeutigem Namen nachfragen.

Nur WhatsApp-Aufträge von OpenClaw-Ownern erhalten diese Tools. Damit sind
Leon und Annka gemäß der vorhandenen Owner-Konfiguration zugelassen. Keine
Admin-Funktionen, kein Löschen, kein direktes Schreiben in die App-Datenbank.
Die vorhandenen API-Routen bewahren Gruppenzuordnung, Aktivitätsereignisse
und Aktualisierung geöffneter PWAs.

Seit der Mittwoch-Erinnerung gibt es zusätzlich eine enge Automationsfreigabe:
Nur der gebundene Wochenjob darf `einkauf_liste_lesen` für offene Artikel auf
Einkaufen verwenden. Artikel hinzufügen oder abhaken bleibt den Owner-Chats
vorbehalten. Details: [EINKAUF_DONNERSTAG_ERINNERUNG.md](EINKAUF_DONNERSTAG_ERINNERUNG.md).

## Passwort hinterlegen und aktivieren

Auf dem Ubuntu-Server im normalen interaktiven SSH-Terminal ausführen:

```bash
python3 "$HOME/.local/share/jarvis-einkaufsplaner/setup.py"
```

Das Passwort wird verdeckt abgefragt und in einer Datei mit Modus 600
gespeichert. Es wird weder als Kommandoargument noch in OpenClaws JSON
gespeichert. Das Skript meldet sich zuerst über die API an und liest nur
Einkaufen. Bei erfolglosem Login ändert es keine OpenClaw-Konfiguration.
Eine Anmeldung erzeugt dabei eine normale App-Sitzung; Artikel bleiben unverändert.

Nach erfolgreicher Prüfung sichert das Skript die Konfiguration, ergänzt
gezielt die Plugin-Pfade und den Plugin-Eintrag, führt Dry-Run und Validierung
aus und startet den Gateway kontrolliert neu. Bestehende Pfade bleiben erhalten.
Nach WhatsApp-Bereitschaft mit einer Leseanfrage testen:

> Jarvis, was steht auf unserer Einkaufsliste?

Danach beispielsweise:

> Setz 1000 ml Milch auf Einkaufen.

> Hake die Milch auf Einkaufen ab.

Eine neue Sitzung kann helfen, falls die aktuelle Sitzung die neuen Tools
noch nicht kennt. Die Anfragen benutzen weiterhin die normalen Text-/Audioregeln.

## Zuverlässigkeit und Grenzen

Sitzungscookie und CSRF-Token bleiben im Prozessspeicher. Bei einer abgelaufenen
Sitzung meldet sich das Plugin vor einer Leseanfrage erneut an. Schreibanfragen
werden bei Fehlern oder Zeitüberschreitung nicht automatisch wiederholt.
HTTPS-Ziel ist fest vorgegeben; HTTP-Weiterleitungen werden abgewiesen.

Ein privates Auftragsprotokoll verhindert eine zweite Mutation mit derselben
Tool-Call-ID, auch nach einem Neustart. Unklare Aufträge bleiben gesperrt.
Die App besitzt jedoch keine serverseitige Idempotenz für diese Routen:
Ein neuer Tool-Aufruf mit einer neuen ID kann einen weiteren Artikel anlegen.
Deshalb bei unklarer Speicherung zuerst lesen und nicht blind erneut hinzufügen.
Gleichnamige Artikel werden nicht automatisch zusammengeführt.

## Prüfung

Sechs API-Client-Tests lokal und auf Ubuntu erfolgreich: feste Kontoidentität,
Cookie/CSRF, Wiederholung mit gleicher ID, Sperre bei unklarem Schreibversuch
auch nach neuer Client-Instanz, doppelte Listennamen, erneute Anmeldung und
Abbruch ohne Anfrage. Plugin-Metadaten auf OpenClaw 2026.9.8 generiert,
native Plugin-Validierung erfolgreich.

**Praktischer Abschluss am 06.10.2026:** Leon bestätigt, dass die Anbindung
„echt super“ funktioniert. Der WhatsApp-Screenshot zeigt um 18:57 die Abfrage
der Einkaufsliste mit Antwort „Die Einkaufsliste ist leer“, um 18:58 eine
Sprachnachricht mit Audioantwort und anschließend den Auftrag, Bananen
abzuhaken. Um 18:59 bestätigt Jarvis: „Erledigt, die drei Bananen sind abgehakt.“
Damit sind Anmeldung, Leseabfrage und Abhaken im praktischen Einsatz bestätigt.
Der genaue Inhalt des Audioauftrags sowie die Anzeige des Erstellernamens in
der PWA sind im Screenshot nicht sichtbar; hierfür gilt Leons allgemeine
Erfolgsrückmeldung, keine zusätzliche unabhängige Prüfung. Keine weiteren
Testartikel oder Nachrichten durch Codex angelegt.

```bash
node build.mjs
node --test test/client.test.mjs
openclaw plugins build --entry ./dist/index.js
openclaw plugins validate --entry ./dist/index.js
```
