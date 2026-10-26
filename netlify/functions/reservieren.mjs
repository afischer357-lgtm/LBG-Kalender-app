// Schüler:in reserviert einen Termin
//   POST /api/reservieren  { lb, datum, von, name, klasse, email, anliegen }
import {
  ladeEinstellungen, alleTermine, alleBuchungen, slotBelegen, speichereBuchung,
  neueId, neuerToken, jetztBerlin, json, fehler, text,
} from "../../lib/kern.mjs";

export default async (req) => {
  if (req.method !== "POST") return fehler("Nur POST erlaubt.", 405);
  let d;
  try { d = await req.json(); } catch { return fehler("Ungültige Anfrage."); }

  const e = await ladeEinstellungen();
  const lb = e.lernbegleitungen.find((x) => x.id === d.lb && x.aktiv !== false);
  if (!lb) return fehler("Diese Lernbegleitung gibt es nicht.", 404);

  const name = text(d.name, 80);
  const klasse = text(d.klasse, 20);
  const email = text(d.email, 120).toLowerCase();
  const anliegen = text(d.anliegen, 500);
  if (name.length < 2) return fehler("Bitte gib deinen Namen an.");

  // Nur Schul-Mailadressen zulassen
  const domain = email.split("@")[1] || "";
  const domains = (e.erlaubteDomains || []).map((x) => x.toLowerCase().replace(/^@/, ""));
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return fehler("Bitte gib eine gültige Mailadresse an.");
  if (domains.length && !domains.includes(domain)) {
    return fehler(`Bitte nutze deine Schul-Mailadresse (@${domains.join(" oder @")}).`);
  }

  // Gibt es diesen Termin überhaupt (noch)?
  const termin = alleTermine(lb, e).find((t) => t.datum === d.datum && t.von === d.von);
  if (!termin) return fehler("Diesen Termin gibt es nicht (mehr). Bitte wähle einen anderen.", 409);

  // Nicht zu viele offene Termine pro Person
  const heute = jetztBerlin().datum;
  const offen = (await alleBuchungen()).filter(
    (b) => b.email === email && b.datum >= heute && ["angefragt", "bestaetigt"].includes(b.status)
  );
  if (offen.length >= (e.maxOffeneProSchueler || 2)) {
    return fehler(`Du hast schon ${offen.length} offene Termin(e). Warte erst ein Gespräch ab oder sage einen Termin ab.`, 409);
  }

  // Slot sperren – wenn jemand schneller war, klappt das nicht
  const id = neueId();
  const frei = await slotBelegen(lb.id, termin.datum, termin.von, id);
  if (!frei) return fehler("Schade – dieser Termin wurde gerade von jemand anderem reserviert.", 409);

  const buchung = {
    id, token: neuerToken(), lbId: lb.id,
    datum: termin.datum, von: termin.von, bis: termin.bis, ort: termin.ort,
    name, klasse, email, anliegen,
    status: "angefragt", nachricht: "",
    erstellt: new Date().toISOString(), geaendert: new Date().toISOString(),
  };
  await speichereBuchung(buchung);

  return json({ ok: true, id: buchung.id, token: buchung.token });
};

export const config = { path: "/api/reservieren" };
