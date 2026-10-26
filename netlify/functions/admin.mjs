// Admin-Bereich – geschützt durch das Passwort aus der Netlify-Umgebungsvariable ADMIN_PASSWORT
//   POST /api/admin  { aktion, ... }   Header: x-admin-passwort
import {
  ladeEinstellungen, speichereEinstellungen, alleBuchungen, ladeBuchung, speichereBuchung,
  slotFreigeben, neueId, neuerToken, gleich, json, fehler, text,
} from "../../lib/kern.mjs";

const UHRZEIT = /^([01]\d|2[0-3]):[0-5]\d$/;
const DATUM = /^\d{4}-\d{2}-\d{2}$/;

export default async (req) => {
  if (req.method !== "POST") return fehler("Nur POST erlaubt.", 405);
  const passwort = process.env.ADMIN_PASSWORT || Netlify.env.get("ADMIN_PASSWORT");
  if (!passwort) return fehler("Es ist noch kein Admin-Passwort eingerichtet (Netlify → Environment variables → ADMIN_PASSWORT).", 500);
  if (!gleich(req.headers.get("x-admin-passwort") || "", passwort)) return fehler("Falsches Passwort.", 401);

  let d;
  try { d = await req.json(); } catch { return fehler("Ungültige Anfrage."); }
  const e = await ladeEinstellungen();

  switch (d.aktion) {
    case "anmelden":
      return json({ ok: true });

    case "laden":
      break;

    case "einstellungen_speichern": {
      const n = d.einstellungen || {};
      e.schulname = text(n.schulname, 80) || e.schulname;
      e.erlaubteDomains = String(n.erlaubteDomains ?? "")
        .split(/[,\s]+/).map((x) => x.trim().toLowerCase().replace(/^@/, "")).filter(Boolean);
      e.vorlaufTage = Math.min(90, Math.max(1, Number(n.vorlaufTage) || 21));
      e.mindestStundenVorher = Math.min(168, Math.max(0, Number(n.mindestStundenVorher) || 0));
      e.maxOffeneProSchueler = Math.min(10, Math.max(1, Number(n.maxOffeneProSchueler) || 2));
      e.sperrzeiten = pruefeSperrzeiten(n.sperrzeiten);
      await speichereEinstellungen(e);
      break;
    }

    case "lb_speichern": {
      const n = d.lb || {};
      const name = text(n.name, 80);
      if (!name) return fehler("Bitte einen Namen eingeben.");
      const zeiten = [];
      for (const z of n.zeiten || []) {
        const tag = Number(z.tag);
        if (!(tag >= 1 && tag <= 7) || !UHRZEIT.test(z.von) || !UHRZEIT.test(z.bis) || z.von >= z.bis) {
          return fehler(`Zeit ungültig: ${z.von || "?"}–${z.bis || "?"}. Bitte im Format 09:45 und „von“ vor „bis“.`);
        }
        zeiten.push({ tag, von: z.von, bis: z.bis, ort: text(z.ort, 40) });
      }
      const daten = {
        name, kuerzel: text(n.kuerzel, 10).toUpperCase(), gruppe: text(n.gruppe, 40),
        email: text(n.email, 120).toLowerCase(),
        dauer: Math.min(90, Math.max(5, Number(n.dauer) || 15)),
        aktiv: n.aktiv !== false, zeiten, sperrzeiten: pruefeSperrzeiten(n.sperrzeiten),
      };
      const alt = e.lernbegleitungen.find((x) => x.id === n.id);
      if (alt) Object.assign(alt, daten);
      else e.lernbegleitungen.push({ id: neueId().slice(0, 8), token: neuerToken(), ...daten });
      e.lernbegleitungen.sort((a, b) => a.name.localeCompare(b.name, "de"));
      await speichereEinstellungen(e);
      break;
    }

    case "lb_import": {
      // Liste aus Excel: [{ kuerzel, vorname, nachname }]
      // Bestehende (gleiches Kürzel) bekommen nur den neuen Namen, neue werden angelegt.
      // Kürzel mit "XX" am Anfang (ausgeschieden) werden übersprungen.
      const zaehler = { neu: 0, aktualisiert: 0, uebersprungen: 0 };
      const gesehen = new Set();
      for (const z of Array.isArray(d.liste) ? d.liste.slice(0, 500) : []) {
        const kuerzel = text(z.kuerzel, 10).toUpperCase();
        const name = [text(z.vorname, 40), text(z.nachname, 40)].filter(Boolean).join(" ");
        if (!kuerzel || !name || kuerzel.startsWith("XX") || gesehen.has(kuerzel)) { zaehler.uebersprungen++; continue; }
        gesehen.add(kuerzel);
        const alt = e.lernbegleitungen.find((x) => (x.kuerzel || "").toUpperCase() === kuerzel);
        if (alt) { alt.name = name; zaehler.aktualisiert++; }
        else {
          e.lernbegleitungen.push({ id: neueId().slice(0, 8), token: neuerToken(), name, kuerzel, gruppe: "", email: "",
            dauer: 15, aktiv: true, zeiten: [], sperrzeiten: [] });
          zaehler.neu++;
        }
      }
      e.lernbegleitungen.sort((a, b) => a.name.localeCompare(b.name, "de"));
      await speichereEinstellungen(e);
      const buchungen = (await alleBuchungen()).map(({ token, ...rest }) => rest);
      return json({ einstellungen: e, buchungen, import: zaehler });
    }

    case "lb_loeschen":
      e.lernbegleitungen = e.lernbegleitungen.filter((x) => x.id !== d.id);
      await speichereEinstellungen(e);
      break;

    case "lb_neuer_link": {
      const lb = e.lernbegleitungen.find((x) => x.id === d.id);
      if (!lb) return fehler("Nicht gefunden.", 404);
      lb.token = neuerToken();
      await speichereEinstellungen(e);
      break;
    }

    case "buchung_absagen": {
      const b = await ladeBuchung(d.id);
      if (!b || !["angefragt", "bestaetigt"].includes(b.status)) return fehler("Dieser Termin kann nicht abgesagt werden.", 409);
      b.status = "abgesagt_admin";
      b.nachricht = text(d.nachricht, 300);
      b.geaendert = new Date().toISOString();
      await speichereBuchung(b);
      await slotFreigeben(b.lbId, b.datum, b.von);
      break;
    }

    default:
      return fehler("Unbekannte Aktion.");
  }

  const buchungen = (await alleBuchungen())
    .sort((a, b) => (a.datum + a.von).localeCompare(b.datum + b.von))
    .map(({ token, ...rest }) => rest);
  return json({ einstellungen: e, buchungen });
};

function pruefeSperrzeiten(liste) {
  return (Array.isArray(liste) ? liste : [])
    .filter((s) => DATUM.test(s.von) && (!s.bis || DATUM.test(s.bis)))
    .map((s) => ({ von: s.von, bis: s.bis && s.bis >= s.von ? s.bis : s.von, grund: text(s.grund, 60) }));
}

export const config = { path: "/api/admin" };
