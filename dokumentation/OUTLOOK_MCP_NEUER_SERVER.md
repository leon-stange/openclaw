# Outlook-Kalender und lesenden E-Mail-Zugriff auf dem neuen Server einrichten

Stand: 05.10.2026. Die neue lokale `.openclaw/openclaw.json` enthält keinen
MCP-Abschnitt. Eingetragen sind OpenClaw `2026.9.8` und Linux-Pfade unter
`/home/leon`. Der laufende neue Server wurde hier nicht direkt geprüft.

Leons anschließender Terminal-Screenshot vom 05.10.2026 bestätigt die erfolgreiche
Paketinstallation und Microsoft-Anmeldung mit den unten angegebenen neuen
Outlook-/Mail-Parametern. Ein weiterer Screenshot bestätigt das Speichern der
Verbindung in `/home/leon/.openclaw/openclaw.json` und **`outlook: ok`** bei der
MCP-Verbindungsprobe. Anschließend bestätigt Leons WhatsApp-Screenshot einen
erfolgreichen 72-Stunden-Kalenderabruf in Berlin-Zeit sowie das Lesen und
Zusammenfassen der letzten fünf E-Mails im Posteingang. Laut Jarvis wurden
keine Daten verändert oder E-Mails als gelesen markiert. Kalender-Schreibzugriffe
und die tägliche Anrufautomation wurden dabei nicht getestet.
Die lokale Konfigurationskopie enthält die nachträgliche MCP-Änderung noch nicht.

Wir richten die zuvor verwendete Kalenderanbindung erneut ein: privates
Microsoft-Konto, lokaler stdio-Dienst, Kalender lesen und bearbeiten sowie
**E-Mails ausschließlich lesen und durchsuchen**. Leon hat den E-Mail-Zugriff
am 05.10.2026 ergänzt. Dafür werden `Mail.Read`, aber weder `Mail.ReadWrite`
noch `Mail.Send` angefordert. Das Preset ist jetzt `outlook` statt `calendar`.
Alle folgenden Befehle im Ubuntu-Terminal des **neuen Servers als `leon`**
ausführen, ohne `sudo`. Die lokale heruntergeladene `.openclaw`-Kopie wird dafür
nicht als vollständige Server-Konfiguration zurückgespielt.

## 1. Voraussetzungen und Installation

```bash
whoami
openclaw --version
node --version
node -p 'process.execPath'
openclaw mcp list
```

Falls `outlook` dort bereits vorhanden ist, erst `openclaw mcp show outlook`
prüfen. Die neue Kopie enthält diesen Eintrag noch nicht.

Wir verwenden die zuvor angeleitete Paketversion `0.158.0` gezielt erneut:

```bash
mkdir -p "$HOME/.local/share/jarvis-outlook"
npm install --prefix "$HOME/.local/share/jarvis-outlook" \
  --ignore-scripts --no-audit --no-fund \
  @softeria/ms-365-mcp-server@0.158.0
```

Das Paket bringt den ausführbaren Dienst bereits mit. Native keytar-Skripte
werden nicht benötigt, da wir für die Server-Anmeldung den Dateicache verwenden.

## 2. Berechtigungen prüfen und bei Microsoft anmelden

```bash
MS365_MCP_USE_KEYTAR=0 node \
  "$HOME/.local/share/jarvis-outlook/node_modules/@softeria/ms-365-mcp-server/dist/index.js" \
  --preset outlook \
  --allowed-scopes "User.Read Calendars.ReadWrite Mail.Read" \
  --list-permissions
```

Erwartet: effektive Rechte `User.Read`, `Calendars.ReadWrite` und `Mail.Read`.
Das Outlook-Preset enthält auch weitere Werkzeuge. Warnungen über deaktivierte
Werkzeuge mit fehlenden Scopes, beispielsweise `Mail.Send`, `Mail.ReadWrite`,
`Contacts.Read` oder `MailboxSettings.*`, sind bei dieser bewusst begrenzten
Einrichtung erwartbar. Diese zusätzlichen Rechte nicht freigeben.

Dann anmelden:

```bash
MS365_MCP_USE_KEYTAR=0 node \
  "$HOME/.local/share/jarvis-outlook/node_modules/@softeria/ms-365-mcp-server/dist/index.js" \
  --preset outlook \
  --allowed-scopes "User.Read Calendars.ReadWrite Mail.Read" \
  --expected-username "leon-stange@outlook.com" \
  --login
```

Die ausgegebene Microsoft-Seite im Browser öffnen, den **neu ausgegebenen** Code
eingeben und mit deinem privaten Microsoft-Konto anmelden. Den Code nicht hier
posten. Anschließend muss `Login successful` erscheinen.

Anmeldung kontrollieren:

```bash
MS365_MCP_USE_KEYTAR=0 node \
  "$HOME/.local/share/jarvis-outlook/node_modules/@softeria/ms-365-mcp-server/dist/index.js" \
  --preset outlook \
  --allowed-scopes "User.Read Calendars.ReadWrite Mail.Read" \
  --expected-username "leon-stange@outlook.com" \
  --verify-login
```

Nur nach erfolgreicher Prüfung fortfahren. Anmeldung und späterer MCP-Prozess
müssen unter demselben Linux-Benutzer laufen. Die Anmeldung wird lokal gespeichert;
in OpenClaws JSON kommen weder Passwort noch Zugriffstoken.

Falls bereits mit der vorherigen Kalender-Konfiguration angemeldet wurde,
den oben angepassten `--login`-Befehl für die zusätzliche E-Mail-Berechtigung
erneut ausführen. Kein `--read-only` für den gesamten Dienst setzen: das würde
auch die weiterhin gewünschten Kalender-Schreibzugriffe abschalten.

## 3. Outlook-Verbindung in OpenClaw ergänzen

Die bestehende Konfiguration zunächst privat sichern:

```bash
umask 077
cp -- "$HOME/.openclaw/openclaw.json" \
  "$HOME/.openclaw/openclaw.json.vor-outlook-$(date +%Y%m%d-%H%M%S)"
```

Dann die neue Verbindung erzeugen. Der absolute Node-Pfad wird dabei automatisch
vom **neuen Server** übernommen:

```bash
node <<'NODE'
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const directory = path.join(os.homedir(), '.local/share/jarvis-outlook');
const config = {
  enabled: true,
  transport: 'stdio',
  command: process.execPath,
  cwd: directory,
  args: [
    path.join(directory, 'node_modules/@softeria/ms-365-mcp-server/dist/index.js'),
    '--preset', 'outlook',
    '--allowed-scopes', 'User.Read Calendars.ReadWrite Mail.Read',
    '--expected-username', 'leon-stange@outlook.com'
  ],
  env: { MS365_MCP_USE_KEYTAR: '0' },
  connectionTimeoutMs: 20000,
  requestTimeoutMs: 60000,
  toolFilter: {
    include: [
      'list-calendars',
      'get-calendar-view', 'get-specific-calendar-view',
      'list-calendar-events', 'list-specific-calendar-events',
      'list-calendar-event-instances',
      'get-calendar-event', 'get-specific-calendar-event',
      'create-calendar-event', 'create-specific-calendar-event',
      'update-calendar-event', 'update-specific-calendar-event',
      'delete-calendar-event', 'delete-specific-calendar-event',
      'list-mail-folders', 'list-mail-child-folders',
      'list-mail-messages', 'list-mail-folder-messages', 'get-mail-message'
    ]
  }
};
fs.writeFileSync(path.join(directory, 'outlook-server.json'),
  JSON.stringify(config, null, 2) + '\n', { mode: 0o600 });
console.log('Outlook-Verbindungsdatei erstellt.');
NODE

openclaw mcp set outlook \
  "$(cat "$HOME/.local/share/jarvis-outlook/outlook-server.json")"

openclaw mcp doctor outlook --probe
```

Erwartet: Verbindung gespeichert und `outlook: ok`. `mcp set outlook` ergänzt
gezielt den Outlook-Eintrag; WhatsApp, Modelle und die anderen Plugins werden
nicht durch eine alte Gesamtkonfiguration ersetzt.

Die Werkzeugliste umfasst Kalenderabfragen und Termin-Anlegen/Ändern/Löschen
sowie das Auflisten von Mail-Ordnern, Auflisten/Durchsuchen von E-Mails und Lesen
einzelner Nachrichten. Mail-Senden, Antworten, Entwürfe, Verschieben, Löschen
oder Markieren als gelesen werden nicht freigegeben. Auch Kalender-Löschung
und Berechtigungsänderungen sind nicht enthalten.
Die Bindung an das erwartete Microsoft-Konto bleibt beim automatischen Start aktiv.

## 4. Im laufenden Jarvis testen

Zuerst Jarvis einen neuen Auftrag schicken:

> Lies bitte meinen Outlook-Kalender für die nächsten drei Tage. Nenne mir die
> Termine mit Datum und Uhrzeit in Europe/Berlin; berücksichtige auch ganztägige
> Termine. Ändere dabei nichts. Falls der Zugriff nicht funktioniert, sage mir
> den konkreten Fehler.

Den E-Mail-Zugriff anschließend getrennt prüfen:

> Lies bitte die letzten fünf E-Mails in meinem Outlook-Posteingang. Nenne
> Absender, Betreff und eine kurze Zusammenfassung. Verändere keine Nachrichten
> und markiere sie nicht als gelesen. Falls der Zugriff scheitert, nenne den Fehler.

Falls Jarvis die neu hinzugefügte Verbindung noch nicht sieht, den bestehenden
Gateway-Dienst einmal neu starten, sofern er auf dem neuen Server wieder so heißt:

```bash
systemctl --user status openclaw-gateway.service --no-pager
systemctl --user restart openclaw-gateway.service
```

Danach den lesenden Auftrag erneut senden. `openclaw mcp reload` im SSH-Terminal
allein lädt laut Dokumentation nicht den getrennt laufenden Gateway-Prozess neu.

Erst wenn echte Termine und die gelesenen E-Mails mit Outlook übereinstimmen,
ist die jeweilige Anbindung bestätigt.
Schreibzugriffe werden durch diese Einrichtung ermöglicht, aber nicht automatisch
getestet. Die Regel aus Jarvis' neuer `USER.md` bleibt bestehen: vor dem Löschen
eines Termins nachfragen.

Die frühere tägliche 18-Uhr-Anrufautomation gehört zum alten Serverstand. Sie wird
hiermit weder neu angelegt noch als funktionierend vorausgesetzt. Nach erfolgreichem
Kalenderzugriff prüfen wir ihren aktuellen Stand gesondert.

## Quellen

- [OpenClaw: gespeicherte MCP-Verbindungen](https://docs.openclaw.ai/cli/mcp/registry)
- [Softeria: Dokumentation der verwendeten Version 0.158.0](https://github.com/Softeria/ms-365-mcp-server/blob/v0.158.0/README.md)
- [Microsoft Graph: lesende E-Mail-Berechtigung Mail.Read](https://learn.microsoft.com/en-us/graph/permissions-reference#mailread)
