// Bereich der Lernbegleitung – Zugang über ihren persönlichen Link (?t=...)
//   GET  /api/lernbegleitung?t=..
//   POST /api/lernbegleitung  { t, id, aktion: "annehmen"|"ablehnen"|"absagen", nachricht }
import {
  ladeEinstellungen, alleBuchungen, ladeBuchung, speichereBuchung, slotFreigeben,
  jetztBerlin, gleich, json, fehler, text,
} from "../../lib/kern.mjs";

export default async (req) => {
  const url = new URL(req.url);
  let body = {};
  if (req.method === "POST") {
    try { body = await req.json(); } catch { return fehler("Ungültige Anfrage."); }
  }
  const t = body.t || url.searchParams.get("t") || "";

  const e = await ladeEinstellungen();
  const lb = e.lernbegleitungen.find((x) => x.token && gleich(t, x.token));
  if (!lb) return fehler("Dieser Link ist ungültig. Bitte frag im Sekretariat/bei der Schulleitung nach einem neuen.", 403);

  if (req.method === "POST") {
    const b = await ladeBuchung(body.id);
    if (!b || b.lbId !== lb.id) return fehler("Termin nicht gefunden.", 404);
    const nachricht = text(body.nachricht, 300);
    const jetzt = new Date().toISOString();

    if (body.aktion === "annehmen" && b.status === "angefragt") {
      b.status = "bestaetigt";
    } else if (body.aktion === "ablehnen" && b.status === "angefragt") {
      b.status = "abgelehnt";
      await slotFreigeben(b.lbId, b.datum, b.von);
    } else if (body.aktion === "absagen" && b.status === "bestaetigt") {
      b.status = "abgesagt_lb";
      await slotFreigeben(b.lbId, b.datum, b.von);
    } else {
      return fehler("Das geht bei diesem Termin nicht (mehr).", 409);
    }
    b.nachricht = nachricht;
    b.geaendert = jetzt;
    await speichereBuchung(b);
  }

  const heute = jetztBerlin().datum;
  const meine = (await alleBuchungen())
    .filter((b) => b.lbId === lb.id && b.datum >= heute)
    .sort((a, b) => (a.datum + a.von).localeCompare(b.datum + b.von))
    .map(({ token, ...rest }) => rest);

  return json({
    lernbegleitung: { name: lb.name, dauer: lb.dauer, zeiten: lb.zeiten || [] },
    buchungen: meine,
  });
};

export const config = { path: "/api/lernbegleitung" };
