// Helper condivisi per lo statblock stile 5.5e (2024), usati sia dal renderer
// dell'editor (preview.js) sia dalla build statica (build.js).

const ABILITIES = [
  ["str", "FOR"],
  ["dex", "DES"],
  ["con", "COS"],
  ["int", "INT"],
  ["wis", "SAG"],
  ["cha", "CAR"]
];

const XP_BY_CR = {
  "0": 10, "1/8": 25, "1/4": 50, "1/2": 100,
  "1": 200, "2": 450, "3": 700, "4": 1100, "5": 1800,
  "6": 2300, "7": 2900, "8": 3900, "9": 5000, "10": 5900,
  "11": 7200, "12": 8400, "13": 10000, "14": 11500, "15": 13000,
  "16": 15000, "17": 18000, "18": 20000, "19": 22000, "20": 25000,
  "21": 33000, "22": 41000, "23": 50000, "24": 62000, "25": 75000,
  "26": 90000, "27": 105000, "28": 120000, "29": 135000, "30": 155000
};

export function abilityScore(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : 10;
}

export function abilityMod(value) {
  return Math.floor((abilityScore(value) - 10) / 2);
}

export function formatMod(mod) {
  return mod >= 0 ? `+${mod}` : `${mod}`;
}

export function parseCr(cr) {
  const text = String(cr ?? "").trim();
  if (!text) return 0;
  if (text.includes("/")) {
    const [a, b] = text.split("/").map(Number);
    return b ? a / b : 0;
  }
  return Number(text) || 0;
}

export function crToProficiency(cr) {
  const value = parseCr(cr);
  if (value < 1) return 2;
  return Math.min(9, 2 + Math.floor((value - 1) / 4));
}

export function crToXp(cr) {
  return XP_BY_CR[String(cr ?? "").trim()] ?? null;
}

export function formatNumber(value) {
  return String(value).replace(/\B(?=(\d{3})+(?!\d))/g, ".");
}

// Lista delle abilità con tiro salvezza competente (campo prof_saves: "str, con").
export function parseProficientSaves(data) {
  return String(data.prof_saves || data.saves_prof || "")
    .toLowerCase()
    .split(/[,\s]+/)
    .map((token) => token.trim())
    .filter(Boolean);
}

export function hasAbilities(data) {
  return ABILITIES.some(([key]) => data[key] !== undefined && data[key] !== "");
}

// Riga "Iniziativa +X (Y)" derivata dalla Destrezza (o dal campo initiative).
export function initiativeText(data) {
  if (data.initiative) return String(data.initiative);
  const dexMod = abilityMod(data.dex);
  return `${formatMod(dexMod)} (${10 + dexMod})`;
}

// Riga GS in stile 2024: "GS 1 (PE 200; BC +2)".
export function challengeText(data) {
  if (!data.cr) return "";
  const xp = crToXp(data.cr);
  const pb = crToProficiency(data.cr);
  const extra = [xp != null ? `PE ${formatNumber(xp)}` : null, `BC ${formatMod(pb)}`].filter(Boolean);
  return `GS ${data.cr}${extra.length ? ` (${extra.join("; ")})` : ""}`;
}

// Due tabelle affiancate (FOR/DES/COS e INT/SAG/CAR) con Punteggio, Mod e TS.
export function renderAbilityTables(data) {
  const proficient = parseProficientSaves(data);
  const pb = crToProficiency(data.cr);
  const row = ([key, abbr]) => {
    const score = abilityScore(data[key]);
    const mod = abilityMod(data[key]);
    const save = mod + (proficient.includes(key) ? pb : 0);
    return `<tr><th>${abbr}</th><td>${score}</td><td>${formatMod(mod)}</td><td>${formatMod(save)}</td></tr>`;
  };
  const table = (group) =>
    `<table class="ability-table"><thead><tr><td></td><th>Punt.</th><th>Mod</th><th>TS</th></tr></thead>` +
    `<tbody>${group.map(row).join("")}</tbody></table>`;
  return `<div class="ability-block">${table(ABILITIES.slice(0, 3))}${table(ABILITIES.slice(3))}</div>`;
}
