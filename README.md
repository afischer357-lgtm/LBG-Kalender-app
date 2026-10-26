# LBG-Kalender-app

Web-App, mit der Schüler:innen der Heliosschule Termine für **Lernberatungsgespräche (LBG)** bei ihrer Lernbegleitung reservieren.

## So funktioniert es

| Wer | Seite | Was passiert dort |
|---|---|---|
| Schüler:innen | `/` (Startseite) | Lernbegleitung wählen → freie Zeit antippen → Name, Klasse, Schul-Mail eingeben → reservieren |
| Schüler:innen | `/status.html?...` | Stand der Reservierung ansehen (wartet / bestätigt / abgelehnt) oder absagen |
| Lernbegleitung | `/lernbegleitung.html?t=...` | Persönlicher Link: Anfragen **annehmen** oder **ablehnen**, bestätigte Termine absagen, kurze Nachricht an die Schüler:in |
| Admin | `/admin.html` | Lernbegleitungen anlegen oder als Excel-Liste importieren, feste LBG-Zeiten und Gesprächsdauer eintragen, Ferien sperren, alle Buchungen sehen |

**Regeln, die die App automatisch beachtet**
- Aus den festen Wochenzeiten (z. B. *Di 09:45–10:30*) und der Gesprächsdauer (z. B. *15 Min.*) entstehen einzelne Termine (09:45, 10:00, 10:15).
- Jeder Termin kann nur einmal vergeben werden – auch wenn zwei gleichzeitig klicken.
- Schüler:innen sehen nur Lernbegleitungen, für die LBG-Zeiten eingetragen sind.
- Nur Mailadressen der Schule (einstellbar) sind erlaubt.
- Pro Schüler:in nur eine begrenzte Zahl offener Termine (einstellbar).
- Schulweite Sperrzeiten (Ferien) und Abwesenheiten einzelner Lernbegleitungen.
- **Datenschutz:** Buchungen werden 4 Wochen nach dem Termin automatisch gelöscht.

## Aufbau des Projekts

```
public/                 ← die Webseiten (das, was man im Browser sieht)
  index.html            ← Buchung für Schüler:innen
  status.html           ← Stand einer Reservierung
  lernbegleitung.html   ← Bereich der Lernbegleitung
  admin.html            ← Verwaltung
  stil.css, helfer.js   ← Aussehen und gemeinsame Helfer
netlify/functions/      ← kleine Programme auf dem Server (speichern & prüfen)
lib/kern.mjs            ← gemeinsame Bausteine (Speicher, Datum, Termin-Berechnung)
netlify.toml            ← Einstellungen für Netlify
package.json            ← benötigte Bibliothek (@netlify/blobs = Datenspeicher)
ANLEITUNG.md            ← Schritt für Schritt: GitHub & Veröffentlichen
```

## Wichtig: Was NICHT in dieses Repository gehört

Das Repository ist **öffentlich**. Hier liegt nur Programmcode.
- Keine Schülerdaten, keine Listen mit Namen oder Mailadressen.
- Kein Admin-Passwort → das liegt als Umgebungsvariable `ADMIN_PASSWORT` bei Netlify.
- Die Buchungen speichert die App in Netlify Blobs, nicht in GitHub.

## Nächste Ausbaustufen

1. Mail-Benachrichtigungen (an Lernbegleitung und Schüler:in), dabei auch Bestätigung der Schul-Mailadresse
2. Kalender-Datei (.ics) zum Eintragen in den eigenen Kalender
