// Datenschutz: Läuft jede Nacht automatisch und löscht Buchungen,
// deren Termin länger als 28 Tage zurückliegt (inkl. Namen und Mailadressen).
import { speicher, alleBuchungen, jetztBerlin, plusTage } from "../../lib/kern.mjs";

const AUFBEWAHRUNG_TAGE = 28;

export default async () => {
  const grenze = plusTage(jetztBerlin().datum, -AUFBEWAHRUNG_TAGE);
  const s = speicher();
  let geloescht = 0;
  for (const b of await alleBuchungen()) {
    if (b.datum < grenze) {
      await s.delete(`buchungen/${b.id}`);
      geloescht++;
    }
  }
  // alte Slot-Sperren entfernen
  const { blobs } = await s.list({ prefix: "belegt/" });
  for (const x of blobs) {
    if (x.key.split("/")[2] < grenze) await s.delete(x.key);
  }
  console.log(`Aufräumen: ${geloescht} alte Buchung(en) gelöscht.`);
};

export const config = { schedule: "@daily" };
