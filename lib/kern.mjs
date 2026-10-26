// =====================================================================
//  kern.mjs – gemeinsame Bausteine für alle Funktionen der LBG-App
//  (Datenspeicher, Datum/Uhrzeit, Termin-Berechnung, Antworten)
// =====================================================================
import { getStore } from "@netlify/blobs";
import crypto from "node:crypto";

// ---------- Datenspeicher (Netlify Blobs) ----------------------------
// Alles liegt in EINEM Speicher namens "lbg":
//   einstellungen          -> Lernbegleitungen + allgemeine Einstellungen
//   buchungen/<id>         -> eine Reservierung
//   belegt/<lb>/<datum>/<uhrzeit> -> Sperre, damit ein Slot nur 1x vergeben wird
export function speicher() {
  return getStore({ name: "lbg", consistency: "strong" });
}

export const STANDARD_EINSTELLUNGEN = {
  schulname: "Heliosschule",
  erlaubteDomains: ["heliosschule.de"],
  vorlaufTage: 21,              // so weit im Voraus darf gebucht werden
  mindestStundenVorher: 2,      // so kurzfristig darf noch gebucht werden
  maxOffeneProSchueler: 2,      // gleichzeitig offene Termine pro Schüler:in
  sperrzeiten: [],              // z. B. Ferien: { von, bis, grund }
  lernbegleitungen: [],
};

export async function ladeEinstellungen() {
  const e = await speicher().get("einstellungen", { type: "json" });
  return { ...STANDARD_EINSTELLUNGEN, ...(e || {}) };
}

export async function speichereEinstellungen(e) {
  await speicher().setJSON("einstellungen", e);
}

export async function ladeBuchung(id) {
  if (!/^[a-z0-9-]{8,40}$/i.test(id || "")) return null;
  return speicher().get(`buchungen/${id}`, { type: "json" });
}

export async function speichereBuchung(b) {
  await speicher().setJSON(`buchungen/${b.id}`, b);
}

export async function alleBuchungen() {
  const s = speicher();
  const { blobs } = await s.list({ prefix: "buchungen/" });
  const liste = await Promise.all(blobs.map((x) => s.get(x.key, { type: "json" })));
  return liste.filter(Boolean);
}

export function sperrSchluessel(lbId, datum, von) {
  return `belegt/${lbId}/${datum}/${von.replace(":", "")}`;
}

// Slot belegen – klappt nur, wenn er noch frei ist (verhindert Doppelbuchungen)
export async function slotBelegen(lbId, datum, von, buchungsId) {
  const r = await speicher().set(sperrSchluessel(lbId, datum, von), buchungsId, { onlyIfNew: true });
  return r.modified;
}

export async function slotFreigeben(lbId, datum, von) {
  await speicher().delete(sperrSchluessel(lbId, datum, von));
}

export async function belegteSlots(lbId) {
  const { blobs } = await speicher().list({ prefix: `belegt/${lbId}/` });
  // "belegt/lb/2026-11-03/0945" -> "2026-11-03 09:45"
  return new Set(
    blobs.map((b) => {
      const [, , datum, hhmm] = b.key.split("/");
      return `${datum} ${hhmm.slice(0, 2)}:${hhmm.slice(2)}`;
    })
  );
}

// ---------- Datum & Uhrzeit (immer deutsche Zeit) ---------------------
export function jetztBerlin() {
  const s = new Intl.DateTimeFormat("sv-SE", {
    timeZone: "Europe/Berlin",
    year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", minute: "2-digit", hour12: false,
  }).format(new Date());
  const [datum, zeit] = s.split(" ");
  return { datum, zeit, minuten: zuMinuten(zeit) };
}

export function zuMinuten(hhmm) {
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + m;
}

export function zuUhrzeit(min) {
  return `${String(Math.floor(min / 60)).padStart(2, "0")}:${String(min % 60).padStart(2, "0")}`;
}

export function plusTage(datum, n) {
  const d = new Date(datum + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

// 1 = Montag … 7 = Sonntag
export function wochentag(datum) {
  const t = new Date(datum + "T12:00:00Z").getUTCDay();
  return t === 0 ? 7 : t;
}

function istGesperrt(datum, sperrzeiten) {
  return (sperrzeiten || []).some((s) => datum >= s.von && datum <= (s.bis || s.von));
}

// ---------- Freie Termine einer Lernbegleitung berechnen --------------
// Aus den festen Wochenzeiten (z. B. Di 09:45–10:30) und der Gesprächsdauer
// (z. B. 15 Min.) entstehen einzelne Termine: 09:45, 10:00, 10:15.
export function alleTermine(lb, einstellungen) {
  const jetzt = jetztBerlin();
  const grenzeMin = jetzt.minuten + (einstellungen.mindestStundenVorher || 0) * 60;
  const dauer = Number(lb.dauer) || 15;
  const termine = [];

  for (let i = 0; i <= (einstellungen.vorlaufTage || 21); i++) {
    const datum = plusTage(jetzt.datum, i);
    if (istGesperrt(datum, einstellungen.sperrzeiten) || istGesperrt(datum, lb.sperrzeiten)) continue;
    const tag = wochentag(datum);

    for (const z of lb.zeiten || []) {
      if (Number(z.tag) !== tag) continue;
      const start = zuMinuten(z.von);
      const ende = zuMinuten(z.bis);
      for (let m = start; m + dauer <= ende; m += dauer) {
        // Mindestvorlauf beachten (auch über Mitternacht hinaus)
        const minutenAbJetzt = i * 1440 + m;
        if (minutenAbJetzt < grenzeMin) continue;
        termine.push({ datum, von: zuUhrzeit(m), bis: zuUhrzeit(m + dauer), ort: z.ort || "" });
      }
    }
  }
  termine.sort((a, b) => (a.datum + a.von).localeCompare(b.datum + b.von));
  return termine;
}

// ---------- Kleinkram --------------------------------------------------
export function neueId() {
  return crypto.randomUUID();
}

export function neuerToken() {
  return crypto.randomBytes(18).toString("base64url");
}

export function gleich(a, b) {
  const ha = crypto.createHash("sha256").update(String(a)).digest();
  const hb = crypto.createHash("sha256").update(String(b)).digest();
  return crypto.timingSafeEqual(ha, hb);
}

export function json(daten, status = 200) {
  return new Response(JSON.stringify(daten), {
    status,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

export function fehler(text, status = 400) {
  return json({ fehler: text }, status);
}

export function text(wert, max = 300) {
  return String(wert ?? "").trim().slice(0, max);
}

// Öffentliche Sicht auf eine Buchung (für Schüler:in)
export function buchungFuerSchueler(b, lb) {
  return {
    id: b.id, datum: b.datum, von: b.von, bis: b.bis, ort: b.ort,
    status: b.status, name: b.name, anliegen: b.anliegen,
    nachricht: b.nachricht || "",
    lernbegleitung: lb ? lb.name : "(nicht mehr vorhanden)",
  };
}
