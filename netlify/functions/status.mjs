// Schüler:in schaut den Stand ihrer Reservierung an oder sagt ab
//   GET  /api/status?id=..&t=..
//   POST /api/status  { id, t, aktion: "absagen" }
import {
  ladeEinstellungen, ladeBuchung, speichereBuchung, slotFreigeben,
  buchungFuerSchueler, gleich, json, fehler,
} from "../../lib/kern.mjs";

export default async (req) => {
  const url = new URL(req.url);
  let id = url.searchParams.get("id");
  let t = url.searchParams.get("t");
  let aktion = null;
  if (req.method === "POST") {
    try { ({ id, t, aktion } = await req.json()); } catch { return fehler("Ungültige Anfrage."); }
  }

  const b = await ladeBuchung(id);
  if (!b || !t || !gleich(t, b.token)) return fehler("Diese Reservierung wurde nicht gefunden.", 404);
  const e = await ladeEinstellungen();
  const lb = e.lernbegleitungen.find((x) => x.id === b.lbId);

  if (aktion === "absagen") {
    if (!["angefragt", "bestaetigt"].includes(b.status)) return fehler("Dieser Termin ist schon erledigt.", 409);
    b.status = "abgesagt_schueler";
    b.geaendert = new Date().toISOString();
    await speichereBuchung(b);
    await slotFreigeben(b.lbId, b.datum, b.von);
  }

  return json({ buchung: buchungFuerSchueler(b, lb) });
};

export const config = { path: "/api/status" };
