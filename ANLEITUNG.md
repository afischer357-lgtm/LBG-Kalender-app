# Anleitung: Von deinem Mac über GitHub ins Internet

Diese Anleitung ist für Einsteiger:innen. Du brauchst etwa **30 Minuten** beim ersten Mal.
Danach dauert jede neue Version nur noch **eine Minute**.

---

## Das große Bild

```
 Dein Mac                    GitHub                         Netlify
 Ordner LBG-Kalender-app  →  Repository LBG-Kalender-app  →  fertige Webseite
        (Commit + Push mit GitHub Desktop)   (veröffentlicht automatisch)
```

**Die wichtigsten Wörter**

| Wort | Bedeutung |
|---|---|
| **Repository (Repo)** | Ein Projektordner mit Gedächtnis: Er merkt sich jede Version. |
| **Commit** | „Speicherpunkt“: Du hältst den aktuellen Stand fest und schreibst kurz dazu, was sich geändert hat. |
| **Push** | Deine Speicherpunkte vom Mac zu GitHub hochladen. |
| **Pull** | Änderungen von GitHub auf den Mac holen (z. B. wenn du online etwas geändert hast). |
| **Deploy** | Netlify baut aus dem Repo die Webseite und stellt sie online. |
| **Umgebungsvariable** | Ein geheimer Wert (z. B. ein Passwort), der bei Netlify liegt – nicht im öffentlichen Code. |

---

## Teil A – GitHub Desktop einrichten (einmalig)

1. Lade **GitHub Desktop** herunter: <https://desktop.github.com> → installieren → öffnen.
2. **Sign in to GitHub.com** → mit deinem Konto *afischer357-lgtm* anmelden → im Browser „Authorize“ bestätigen.
3. Bei „Configure Git“ deinen Namen und deine Mailadresse übernehmen → **Finish**.

## Teil B – Den Ordner mit GitHub verbinden (einmalig)

Dein Ordner *Dokumente → Projekte → LBG-Kalender-app* ist bereits mit deinem GitHub-Repo verknüpft.
Du musst ihn GitHub Desktop nur noch zeigen:

1. In GitHub Desktop: Menü **File → Add Local Repository …**
2. **Choose …** → *Dokumente → Projekte → LBG-Kalender-app* auswählen → **Add Repository**.
3. Links unter **Changes** siehst du jetzt alle neuen Dateien der App (grünes **+**) und die geänderte README (gelbes **●**).
   Klick ruhig eine Datei an – rechts siehst du genau, was neu ist.

## Teil C – Dein erster Commit und Push

1. Unten links bei **Summary** eintippen: `Erste Version der LBG-App`
2. Auf **Commit to main** klicken. → Der Speicherpunkt ist angelegt (noch nur auf deinem Mac).
3. Oben auf **Push origin** klicken. → Jetzt ist alles bei GitHub.
4. Kontrolle: Öffne dein Repo im Browser (<https://github.com/afischer357-lgtm/LBG-Kalender-app>) und lade neu – die Ordner `public`, `netlify`, `lib` sind jetzt da.

> 💡 Der Ordner `node_modules` taucht absichtlich **nicht** auf – das regelt die Datei `.gitignore`.

## Teil D – Mit Netlify veröffentlichen (einmalig)

1. <https://app.netlify.com> öffnen und anmelden.
2. **Add new project → Import an existing project → GitHub**.
   Beim ersten Mal fragt GitHub, ob Netlify zugreifen darf → **Authorize** und am besten nur das Repo *LBG-Kalender-app* freigeben.
3. Repo **LBG-Kalender-app** auswählen.
4. Bei den Einstellungen nichts ändern – Netlify liest alles aus der Datei `netlify.toml`
   (Publish directory: `public`, Functions directory: `netlify/functions`).
5. **Admin-Passwort setzen:** Klick auf **Add environment variables** → **New variable**
   - Key: `ADMIN_PASSWORT`
   - Value: ein langes, eigenes Passwort (nur du kennst es)
   - „Contains secret values“ anhaken
   (Falls du den Knopf übersiehst: später unter **Project configuration → Environment variables**, danach unter **Deploys → Trigger deploy → Deploy project** neu veröffentlichen.)
6. **Deploy LBG-Kalender-app** klicken. Nach ca. 1 Minute steht oben ein Link wie `https://zufalls-name-123.netlify.app`.
7. Schöneren Namen geben: **Project configuration → Change project name** → z. B. `lbg-heliosschule` → Adresse wird `https://lbg-heliosschule.netlify.app`.

## Teil E – Die App einrichten

1. `https://<deine-adresse>.netlify.app/admin.html` öffnen → mit deinem Admin-Passwort anmelden.
2. **Einstellungen:** Mail-Domain der Schüler:innen prüfen (z. B. `heliosschule.de`), Ferien als Sperrzeiten eintragen.
3. **Lernbegleitungen importieren:** Ganz unten „Liste der Lernbegleitungen importieren (Excel)“ aufklappen → deine Excel-Datei (Kürzel, Vorname, Nachname) auswählen → Vorschau prüfen → **Importieren**.
   Die Excel-Datei selbst gehört **nicht** in den GitHub-Ordner.
4. **LBG-Zeiten eintragen:** Bei jeder Lernbegleitung auf **Bearbeiten** → Dauer und feste LBG-Zeiten → Speichern.
   Erst wenn Zeiten eingetragen sind, sehen die Schüler:innen diese Person.
5. Nach dem Speichern erscheint der **persönliche Link** der Lernbegleitung → kopieren und ihr direkt schicken.
6. Den Link zur Startseite bekommen die Schüler:innen (z. B. als Lesezeichen auf den iPads über JAMF).

## Teil F – Später: Änderungen veröffentlichen (jedes Mal)

1. Dateien im Ordner ändern (oder von Claude ändern lassen).
2. GitHub Desktop zeigt die Änderungen → **Summary** schreiben → **Commit to main** → **Push origin**.
3. Netlify merkt das automatisch und ist nach ca. 1 Minute fertig (unter **Deploys** siehst du den Fortschritt).

Ging etwas schief? In Netlify unter **Deploys** die vorherige Version anklicken → **Publish deploy**. Damit ist der alte Stand sofort wieder online.

---

## Vor dem echten Einsatz mit Schüler:innen

- **Datenschutz:** Die App speichert Name, Klasse, Schul-Mail und das freiwillige Anliegen bei Netlify (US-Anbieter, mit EU-Standardvertragsklauseln).
  Bitte vor dem Start mit der/dem schulischen Datenschutzbeauftragten abstimmen (Auftragsverarbeitungsvertrag mit Netlify, Eintrag ins Verarbeitungsverzeichnis, kurze Info für Schüler:innen/Eltern).
  Die App löscht Buchungen 4 Wochen nach dem Termin automatisch.
- **Bekannte Grenze der ersten Version:** Ohne Mailversand kann die App noch nicht prüfen, ob die eingegebene Schul-Mail wirklich der Person gehört. Das kommt mit Ausbaustufe 1 (Mails).
