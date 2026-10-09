# Dashboard

Erste lokal umgesetzte Version: **0.0.1**.

Dashboard-Repository: [leon-stange/jarvis-dashboard](https://github.com/leon-stange/jarvis-dashboard).
Der gesamte Dashboard-Code einschließlich Docker-Dateien und eigener
Dokumentation gehört in dieses separate Repository. Diese Datei im
OpenClaw-Projekt hält die Planung fest.

## Idee

Ein eigenes Dashboard als zusätzliche Oberfläche für Jarvis. Was sich aktuell
über WhatsApp mit Jarvis erledigen lässt, soll auch über das Dashboard möglich
sein. WhatsApp bleibt weiterhin nutzbar.

## Gewünschte Funktionen

- Texteingabe für Nachrichten und Aufträge an Jarvis.
- Spracheingabe zum Aufnehmen und Senden von Sprachnachrichten.
- Anzeige von Jarvis' Textantworten und Wiedergabe seiner Audioantworten.
- Chatverlauf mit den eigenen Nachrichten und Jarvis' Antworten.
- Anbindung an den bestehenden Jarvis mit seinen Plugins und Fähigkeiten.

## Anbindung über ein eigenes Plugin

Das Dashboard soll möglichst über ein neues, eigenes OpenClaw-Plugin an Jarvis
angeschlossen werden. Dieses Plugin bildet die Schnittstelle zwischen Dashboard
und Jarvis: Es nimmt Text- und Sprachnachrichten entgegen und stellt Antworten
sowie den Chatverlauf für das Dashboard bereit.

Das Dashboard nutzt darüber den bestehenden Jarvis und seine vorhandenen
Fähigkeiten. Die genaue technische Umsetzung und die verfügbaren
OpenClaw-Schnittstellen werden vor der Implementierung geprüft.

## Gestaltung

Das Dashboard soll futuristisch aussehen und optisch zu Jarvis passen.
Als erste Designrichtung eignen sich ein dunkler Hintergrund, leuchtende
Akzente, dezente Animationen und eine klare Darstellung von Chat und
Sprachbedienung. Die Oberfläche soll trotz des futuristischen Looks gut
lesbar und einfach bedienbar bleiben.

**Animationen sind eine feste Anforderung.** Das Dashboard soll sichtbar
animiert sein, insbesondere bei der Sprachaufnahme, während Jarvis arbeitet
und bei der Audioausgabe. Eine animierte Jarvis-Visualisierung soll diese
Zustände erkennbar machen. Übergänge und Bedienelemente sollen ebenfalls
passende Animationen erhalten.

### Designreferenz

Das von Leon im Chat gezeigte Bild dient als visuelle Vorlage: ein
futuristisches HUD auf dunkelblauem Hintergrund mit leuchtenden Linien in
Blau, Türkis und Cyan.

- Zentraler kreisförmiger Jarvis-Kern mit mehreren konzentrischen Ringen.
- Animierte Ringsegmente, Lichtimpulse und eine auf Sprache reagierende
  Visualisierung für Aufnahme und Audioausgabe.
- Technische Rahmen, feine Raster und geometrische Verbindungslinien.
- Seitliche Panels für Chatverlauf, Texteingabe und Sprachbedienung.
- Sanfte Bewegungen und Zustandswechsel, passend zur technischen HUD-Optik.

Das Bild gibt die gestalterische Richtung vor. Die Panels sollen tatsächliche
Funktionen und Zustände von Jarvis darstellen; Chat und Bedienung müssen gut
lesbar und erreichbar bleiben.

## Erste Phase: lokal unter Docker – Version 0.0.1

- Das Dashboard zunächst lokal auf Leons Windows-PC unter Docker betreiben.
- Lokaler Zugriff über **http://localhost:4459**; der Docker-Container stellt
  das Dashboard auf Host-Port **4459** bereit.
- Im Browser öffnen und das Design dort testen und
  schrittweise bearbeiten.
- Schwerpunkt: futuristische HUD-Oberfläche, Animationen, Chatdarstellung und
  Bedienelemente entsprechend der Designreferenz.
- Noch keine Anbindung an Jarvis oder OpenClaw. Beispielnachrichten und
  simulierte Zustände dienen ausschließlich der lokalen Designvorschau und
  müssen als solche erkennbar sein.
- Das eigene OpenClaw-Plugin, echte Antworten und Sprachverarbeitung folgen
  in einer späteren Phase.
- Für diesen lokalen Schritt werden weder Cloudflare Tunnel noch eine
  öffentliche Domain benötigt.

## Spätere Phase: GitHub und Serverbetrieb

- Den Dashboard-Quellcode später aus dem Repository `leon-stange/jarvis-dashboard`
  über GitHub auf den Server übertragen.
- Auf dem Server aus dem Quellcode ein Docker-Image bauen und den Container starten.
- Das Dashboard soll auf dem bestehenden Server in einem Docker-Container laufen.
- Für den späteren Serverbetrieb ebenfalls Host-Port **4459** vorsehen.
- Ein zusätzlicher Docker-Container mit `cloudflared` stellt einen Cloudflare
  Tunnel bereit.
- Über Cloudflare soll eine ausgewählte Domain auf das Dashboard geroutet werden.

## Vor der Umsetzung zu klären

- Domain für das Dashboard; Host-Port **4459** ist festgelegt.
- HTTPS-Konfiguration und eigener Zugang für den Server; lokale Anmeldung ist umgesetzt.
- Anbindung an OpenClaw sowie Übertragung von Text und Audio.
- Ob Dashboard und WhatsApp einen gemeinsamen Chatverlauf verwenden oder
  getrennte Verläufe mit denselben Jarvis-Fähigkeiten erhalten.

## Aktueller Stand · 09.10.2026

Version **0.0.1** ist lokal umgesetzt. Der vollständige Quellcode samt Docker-
Konfiguration, Tests und Betriebsdokumentation liegt im separaten Dashboard-
Repository. Diese Datei dokumentiert den Stand und die nächsten Schritte für
OpenClaw. Beide Repositories werden für die spätere Weiterarbeit synchronisiert.

Entwicklungscontainer: **http://localhost:4459**, nur an Loopback gebunden.
Start/Neubau im Dashboard-Verzeichnis: `docker compose up -d --build`.
Voraussetzung ist eine eingerichtete `.env`; vorhandene lokale Zugangsdaten
nicht erneut überschreiben. Produktionsimage `jarvis-dashboard:0.0.1` nutzt
Node mit Anmeldung, dauerhaftem Datenvolume und internem TCP-Healthcheck.

### Oberfläche

- Futuristisches dunkelblaues HUD mit Jarvis-Profilbild im Core, Header,
  Favicon und an Assistentennachrichten.
- „J.A.R.V.I.S. bereit“, „© Leon Stange · Core v0.0.1“ und Chatüberschrift
  „Gespräch mit Jarvis“.
- Weiche Zustandswechsel, gut unterscheidbare Hör-, Verarbeitungs- und
  Sprechbewegungen, abschaltbare Animationen und reduzierte Bewegung.
- Aufbauanimation: Kern und Ringe, anschließend Strich und Beschreibung
  nacheinander im Uhrzeigersinn, danach Kacheln/Status und zuletzt Audioanzeige.
- Statuskarte ist nicht anklickbar. Aufnahme, tatsächliche Audiovorbereitung
  und Wiedergabe ändern den Zustand automatisch.
- Keine Vorschau-/Demo-Texte oder künstlichen Jarvis-Antworten. Jarvis ist noch
  nicht verbunden; Nachrichten werden gespeichert, aber nicht gesendet.
- Systemkarte mit CPU, RAM, Speicher, Uptime, Docker, Gateway und Netzwerk.
  Ohne Server-Anbindung zeigen Werte „—“ und das Gateway „Nicht verbunden“.
- Mobil steht Jarvis-Status vor Systemstats; Systemwerte sind zweispaltig,
  Netzwerk steht zuletzt über die volle Breite. „Auf deinem Gerät“ ist entfernt.
- Kein horizontales Scrollen in Systemkarte oder Benutzerverwaltung.
  Benutzerverwaltung hat eine stabile Höhe und sperrt den Hintergrund.

### Anmeldung, Konten und Daten

Serverseitige Anmeldung schützt Seiten, Dateien, APIs und Entwicklungs-
WebSockets. Gesalzene scrypt-Passworthashes, achtstündige Sitzungen,
HttpOnly-/SameSite-Cookies, Origin-Prüfung und begrenzte Loginversuche.
Abmelden im Header widerruft die Sitzung. Ohne Konfiguration startet der
Server nicht.

Leon ist der ursprüngliche Admin. Im Header öffnet das Personen-Symbol eine
Admin-Ansicht zum Anlegen von Konten, Aktivieren/Deaktivieren, Rollenwechsel
und Passwortzurücksetzen. Der eigene Admin-Zugang und der letzte aktive Admin
sind geschützt. Keine öffentliche Registrierung. Neue Kontopasswörter müssen
mindestens zwölf Zeichen lang sein; der lokale Testzugang bleibt wie vereinbart.

Jedes Konto hat eine dauerhafte interne Benutzer-ID und eine eindeutige
Jarvis-Person, beispielsweise `leon` oder `annka`. Die Identität wird vom
Backend aus der Sitzung ermittelt; der Browser darf sie nicht frei auswählen.
Benutzername und Personenzuordnung sind nach dem Anlegen unveränderlich.
Rollen-, Status- und Passwortwechsel beenden betroffene Sitzungen und WebSockets.

Konten und Textverläufe liegen dauerhaft im Docker-Volume `dashboard-data`.
Chats sind serverseitig je Benutzer getrennt. Normale Benutzer können weder
Konten verwalten noch fremde Verläufe abrufen. Aufnahmen bleiben nur im
Browser-Arbeitsspeicher und verschwinden beim Neuladen; maximal 60 Sekunden,
keine Transkription und kein Audio-Upload. Aufnahme/Wiedergabe zeigen echte
Audiopegel. Vorlesen nutzt bisher die Browserstimme.

`.env`, Klartext-Zugangsdaten, Konten, Chatdaten und Docker-Volumes werden nicht
zu GitHub gepusht. Serverbetrieb benötigt eigene Konfiguration und dauerhaftes
Datenvolume. Start-, Test- und Passwortbefehle stehen in der Dashboard-README.

### Nächste Schritte

1. Domain und HTTPS-Serverbetrieb mit Docker/Cloudflare-Tunnel einrichten.
2. Neues OpenClaw-Plugin für Text, Audio, Antworten und Statusereignisse bauen.
   Konten der bekannten Jarvis-Person und WhatsApp-Identität zuordnen;
   Benutzer- und Auftragszuordnung stets serverseitig prüfen.
3. Echte Ubuntu-, Docker- und Gateway-Messwerte anbinden.
4. Gemeinsame Haushaltsberechtigungen und den Verlauf je Person zwischen
   WhatsApp und Dashboard festlegen.

Noch keine echte Jarvis-Verbindung, keine Serverabfrage, kein Cloudflare-Tunnel
und keine Serveränderung umgesetzt.

## Gesicherter Stand

Dashboard-Commit: [`49b357a`](https://github.com/leon-stange/jarvis-dashboard/commit/49b357a)
auf `main`. Build, sechs Backend-/Logiktests, sechs Browsertests und Docker-
Produktionsbuild erfolgreich. Die Dashboard-README enthält den vollständigen
Start- und Betriebsablauf, Passwortwiederherstellung sowie den Arbeitsstand
zum Weiterarbeiten. Lokale Zugangsdaten und das Datenvolume bleiben vor Ort.
