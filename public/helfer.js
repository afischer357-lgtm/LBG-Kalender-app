// Kleine Helfer, die alle Seiten benutzen
const TAGE = ["", "Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];
const TAGE_KURZ = ["", "Mo", "Di", "Mi", "Do", "Fr", "Sa", "So"];

const STATUS_TEXT = {
  angefragt: "Wartet auf Bestätigung",
  bestaetigt: "Bestätigt",
  abgelehnt: "Abgelehnt",
  abgesagt_schueler: "Von Schüler:in abgesagt",
  abgesagt_lb: "Von Lernbegleitung abgesagt",
  abgesagt_admin: "Von der Schule abgesagt",
};

async function api(pfad, daten, kopf = {}) {
  const opt = daten
    ? { method: "POST", headers: { "content-type": "application/json", ...kopf }, body: JSON.stringify(daten) }
    : { headers: kopf };
  let r;
  try { r = await fetch(pfad, opt); } catch { throw new Error("Keine Verbindung. Bitte prüfe dein Internet."); }
  const j = await r.json().catch(() => ({}));
  if (!r.ok) throw Object.assign(new Error(j.fehler || "Etwas ist schiefgelaufen."), { status: r.status });
  return j;
}

function wochentagVon(datum) {
  const t = new Date(datum + "T12:00:00").getDay();
  return t === 0 ? 7 : t;
}

function datumLang(datum) {
  const [j, m, t] = datum.split("-");
  return `${TAGE[wochentagVon(datum)]}, ${Number(t)}.${Number(m)}.${j}`;
}

function datumKurz(datum) {
  const [, m, t] = datum.split("-");
  return `${TAGE_KURZ[wochentagVon(datum)]} ${Number(t)}.${Number(m)}.`;
}

function esc(s) {
  return String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function marke(status) {
  return `<span class="marke ${esc(status)}">${esc(STATUS_TEXT[status] || status)}</span>`;
}

function $(sel) { return document.querySelector(sel); }

function zeige(el, html, art = "") {
  el.innerHTML = html ? `<div class="hinweis ${art}">${html}</div>` : "";
}

async function kopieren(text, knopf) {
  try {
    await navigator.clipboard.writeText(text);
    const alt = knopf.textContent; knopf.textContent = "Kopiert ✓";
    setTimeout(() => (knopf.textContent = alt), 1500);
  } catch { prompt("Bitte kopieren:", text); }
}

// Kleiner Speicher im Browser: merkt sich die eigenen Reservierungen auf diesem Gerät
const merker = {
  laden() { try { return JSON.parse(localStorage.getItem("lbg-meine") || "[]"); } catch { return []; } },
  speichern(liste) { try { localStorage.setItem("lbg-meine", JSON.stringify(liste)); } catch {} },
  dazu(id, t) { const l = this.laden().filter((x) => x.id !== id); l.unshift({ id, t }); this.speichern(l.slice(0, 10)); },
  weg(id) { this.speichern(this.laden().filter((x) => x.id !== id)); },
};
