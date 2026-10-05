# WhatsApp-Antworten und Versandbestätigungen

Stand: 05.10.2026. Normale Text-/Audioantworten bleiben wie akzeptiert.
Auf Leons ausdrücklichen Wunsch wurden die aktiven Server-Regeln in `USER.md`
um verlässliche, ausdrücklich versendete Textbestätigungen für Anrufe und
Sprachnachrichten an die andere Person ergänzt.

## Aktuelle Regeln

| Auftrag | Antwort |
| --- | --- |
| Normale Textnachricht | Textantwort |
| Sprachnachricht ohne Anruf-/Versandauftrag an die andere Person | Audioantwort ohne identischen Zusatztext |
| Rückruf an Leon | Anruf; eine kurze Textbestätigung ist akzeptiert, kein zusätzliches Audio |
| Leon beauftragt einen Anruf oder eine Sprachnachricht an Annka | Danach genau eine kurze Textmeldung ausdrücklich an Leons WhatsApp-Chat |
| Annka beauftragt einen Anruf oder eine Sprachnachricht an Leon | Danach genau eine kurze Textmeldung ausdrücklich an Annkas WhatsApp-Chat |

Die frühere Vorgabe, nach einem Rückruf an Leon vollständig still zu bleiben,
ist **aufgehoben**. Den funktionierenden Ablauf nicht erneut mit `NO_REPLY`
erzwingen oder allein für diese Feinheit verändern. Erfolg nur entsprechend
dem tatsächlichen Werkzeugergebnis melden; einen bloß gestarteten Anruf nicht
als bestätigte erfolgreiche Verbindung darstellen.

## Explizite Bestätigung an den Auftraggeber

Der Auftraggeber ist der vertrauenswürdig identifizierte Absender des aktuellen
eingehenden Auftrags. Die gemeinsame Chat-Historie, der zuletzt angeschriebene
Empfänger und Leons Rolle als Ersteller dürfen die Auswahl nicht bestimmen.
Eine normale Abschlussantwort im Dashboard reicht nach dem Versand an eine
andere Person nicht als Zustellungsnachweis.

Nach der Aktion daher das Nachrichten-Tool ausdrücklich für eine kurze
Textbestätigung an den ursprünglichen Absender verwenden; alternativ
`conversations_send` mit dessen verifiziertem `conversationRef`. Erst nach
erfolgreicher Bestätigungszustellung intern `NO_REPLY` verwenden, um doppelte
Text-/Audioantworten zu vermeiden. Das ist keine erneute Forderung nach einem
stillen Rückruf, sondern der Abschluss nach einer bereits versendeten Bestätigung.

Erfolgreichen Versand beispielsweise mit „Sprachnachricht an Annka gesendet.“
bestätigen. „Zugestellt“, „angekommen“ und „gelesen“ nur bei entsprechendem
Empfänger-Nachweis verwenden; `messageId` oder eine abgeschlossene lokale
Send-Operation allein beweisen dies nicht. Anrufe nur entsprechend dem tatsächlichen
Tool-Ergebnis als gestartet, erfolgreich, nicht angenommen oder fehlgeschlagen
melden. Schlägt die Bestätigung fehl, die bereits erfolgreiche Aktion nicht
wiederholen. Diese Regeln ändern die tägliche Hintergrundautomation nicht.

## Direkte Server-Änderung und Prüfung

Aktive Datei `/home/leon/.openclaw/workspace/USER.md` gelesen und gezielt
aktualisiert, andere Direktiven erhalten. Anrede an die verifizierte Identität
des aktuellen WhatsApp-Absenders angepasst, damit Annka nicht pauschal Leon
genannt wird. Sicherung:

```text
/home/leon/.openclaw/workspace/USER.md.vor-versandbestaetigung-20261005T184702Z
```

Neue Regeln zurückgelesen und geprüft: beide Richtungen enthalten, genau ein
aktiver Antwortregelblock, andere Direktiven erhalten. Kein Plugin-/Gateway-
Umbau und keine erneute Sprachnachricht oder kein Anruf an Annka ausgelöst.
Ein neuer praktischer Test in beide Richtungen steht noch aus; dies ist eine
Agentenanweisung, keine programmatisch garantierte Zustellungsbestätigung.

## Früherer von Leon bestätigter Test

Vorher um 18:44: angenommener Anruf, danach die technische Meldung
„The tool run finished, but no final summary was produced. I did not repeat
any completed actions.“ Die genaue Ursache wurde nicht ermittelt.

Leon startete um 18:45 mit `/new` eine neue Sitzung. Sein anschließender
Screenshot und seine Rückmeldung bestätigen den akzeptierten Ablauf:

- Audioauftrag um 18:45 → angenommener Rückruf um 18:46 und kurze Textbestätigung.
- Textnachricht um 18:46 → Textantwort.
- Sprachnachricht um 18:47 → Audioantwort, kein identischer Zusatztext sichtbar.
- Audioauftrag um 18:48 → Textmeldung von Jarvis, dass der Anruf an Annka
  erfolgreich war. Das Gespräch mit Annka wurde hier nicht unabhängig geprüft.

Leon bewertet diesen Stand ausdrücklich als ausreichend. Die vorherige Meldung
trat im gezeigten Test nach der neuen Sitzung nicht erneut auf. Daraus keine
abschließende technische Fehlerdiagnose ableiten.

## Konfiguration und gespeicherte Dateien

ElevenLabs übernimmt STT und TTS. Whisper bleibt deaktiviert archiviert;
`ffmpeg` bleibt für WhatsApp-Audio installiert. Outlook bleibt wie eingerichtet.

Für die Formatwahl war der Wechsel von `tts.auto: inbound` zu `tagged`
vorbereitet worden. Die lokale `prepare-elevenlabs.mjs` erzeugt `tagged`;
die Anwendung dieses einzelnen Wertes wurde nicht separat per CLI-Ausgabe
geteilt. Das gewünschte Verhalten ist praktisch bestätigt. **Keine erneute
Einrichtung oder Modusänderung durchführen, um diese Dokumentationslücke zu füllen.**

Die Regeln in der kopierten `.openclaw/workspace/USER.md` sind lokal an Leons
akzeptierte Präferenz angepasst. Die Kopie ist kein aktueller vollständiger
Server-Abzug und soll nicht ungeprüft über die aktive Server-Datei kopiert werden.

Automationen wurden in diesem Schritt nicht eingerichtet.
