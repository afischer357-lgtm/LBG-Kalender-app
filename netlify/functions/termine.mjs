// Öffentlich: Liste der Lernbegleitungen und deren freie Termine
//   GET /api/lernbegleitungen
//   GET /api/termine?lb=<id>
import { ladeEinstellungen, alleTermine, belegteSlots, json, fehler } from "../../lib/kern.mjs";

export default async (req) => {
  const url = new URL(req.url);
  const e = await ladeEinstellungen();
  // Schüler:innen sehen nur aktive Lernbegleitungen, für die LBG-Zeiten eingetragen sind
  const aktive = e.lernbegleitungen.filter((lb) => lb.aktiv !== false && (lb.zeiten || []).length > 0);

  if (url.pathname.endsWith("/lernbegleitungen")) {
    return json({
      schulname: e.schulname,
      erlaubteDomains: e.erlaubteDomains,
      lernbegleitungen: aktive.map((lb) => ({
        id: lb.id, name: lb.name, kuerzel: lb.kuerzel || "", gruppe: lb.gruppe || "",
        dauer: Number(lb.dauer) || 15, hatZeiten: (lb.zeiten || []).length > 0,
      })),
    });
  }

  const lb = aktive.find((x) => x.id === url.searchParams.get("lb"));
  if (!lb) return fehler("Diese Lernbegleitung gibt es nicht.", 404);

  const belegt = await belegteSlots(lb.id);
  const termine = alleTermine(lb, e).map((t) => ({ ...t, frei: !belegt.has(`${t.datum} ${t.von}`) }));
  return json({ lernbegleitung: { id: lb.id, name: lb.name, dauer: Number(lb.dauer) || 15 }, termine });
};

export const config = { path: ["/api/lernbegleitungen", "/api/termine"] };
