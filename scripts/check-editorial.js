import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const docsDir = join(root, "docs");
const contentDir = join(root, "content");

const findings = [];
const documentRequiredFields = ["title", "slug", "summary", "compatibility", "license_mode", "author"];
const challengeProfiles = [
  { max: 0.125, damage: [0, 3], dc: [10, 13], reward: [0, 25] },
  { max: 0.25, damage: [2, 5], dc: [10, 13], reward: [25, 50] },
  { max: 0.5, damage: [4, 8], dc: [10, 13], reward: [50, 100] },
  { max: 1, damage: [6, 14], dc: [11, 14], reward: [100, 200] },
  { max: 2, damage: [10, 22], dc: [12, 15], reward: [200, 450] },
  { max: 3, damage: [16, 32], dc: [12, 16], reward: [450, 700] },
  { max: 4, damage: [22, 42], dc: [13, 16], reward: [700, 1100] },
  { max: 5, damage: [28, 55], dc: [13, 17], reward: [1100, 1800] }
];

await checkDocuments();
await checkRulesText();

for (const finding of findings) {
  console.log(`${finding.level.toUpperCase()} ${finding.file}:${finding.line} ${finding.message}`);
  if (finding.hint) console.log(`  ${finding.hint}`);
}

if (!findings.length) {
  console.log("Check editoriale: metadati, CD, GS, danni e ricompense coerenti.");
}

process.exit(findings.some((finding) => finding.level === "errore") ? 1 : 0);

async function checkDocuments() {
  if (!existsSync(docsDir)) return;

  for (const filePath of await listFiles(docsDir, [".md"])) {
    const source = await readFile(filePath, "utf8");
    const { metadata, bodyStartLine } = parseFrontmatter(source);
    const rel = relative(root, filePath);

    for (const field of documentRequiredFields) {
      if (!metadata[field]) {
        add("errore", rel, 1, `frontmatter senza "${field}".`);
      }
    }

    if (metadata.compatibility && !/5e|5\.5e/i.test(metadata.compatibility)) {
      add("avviso", rel, 1, `compatibility insolita: "${metadata.compatibility}".`, "Per questo progetto usa una dicitura esplicita tipo 5e/5.5e.");
    }

    if (metadata.license_mode && !metadata.license_mode.startsWith("srd-")) {
      add("avviso", rel, 1, `license_mode non SRD: "${metadata.license_mode}".`, "Verifica che appendice legale ed export siano coerenti con la licenza scelta.");
    }

    checkHeadingOrder(source, rel, bodyStartLine);
    checkRewardText(source, rel);
  }
}

async function checkRulesText() {
  for (const folder of [docsDir, contentDir]) {
    if (!existsSync(folder)) continue;

    for (const filePath of await listFiles(folder, [".md", ".html"])) {
      const source = await readFile(filePath, "utf8");
      const rel = relative(root, filePath);
      checkDifficultyClasses(source, rel);
      checkChallengeBlocks(source, rel);
    }
  }
}

function checkHeadingOrder(source, file, bodyStartLine) {
  let previous = 0;
  for (const [index, line] of source.split(/\r?\n/).entries()) {
    const match = line.match(/^(#{1,6})\s+/);
    if (!match) continue;

    const level = match[1].length;
    if (previous && level > previous + 1) {
      add("avviso", file, index + 1, `salto gerarchico da H${previous} a H${level}.`, "Controlla che l'indice e la navigazione del PDF restino leggibili.");
    }
    previous = level;
  }

  if (!source.split(/\r?\n/).slice(bodyStartLine - 1).some((line) => /^#\s+/.test(line))) {
    add("errore", file, bodyStartLine, "documento senza titolo H1 nel corpo.");
  }
}

function checkDifficultyClasses(source, file) {
  for (const match of matchAllWithLine(source, /\bCD\s*([0-9]{1,2})\b/gi)) {
    const dc = Number(match.groups[0]);
    if (dc < 5 || dc > 30) {
      add("errore", file, match.line, `CD ${dc} fuori scala.`, "Usa CD tra 5 e 30 salvo casi dichiaratamente speciali.");
    } else if (dc >= 21) {
      add("avviso", file, match.line, `CD ${dc} molto alta.`, "Per personaggi di basso livello, valuta una conseguenza parziale o una strada alternativa.");
    }
  }
}

function checkChallengeBlocks(source, file) {
  const text = stripTags(source);
  const crMatches = matchAllWithLine(text, /\b(?:GS|CR)\s*([0-9]+(?:\/[248])?|\d+(?:\.\d+)?)\b/gi);

  for (const crMatch of crMatches) {
    const cr = parseChallenge(crMatch.groups[0]);
    const profile = challengeProfiles.find((item) => cr <= item.max) || challengeProfiles.at(-1);
    const window = text.slice(Math.max(0, crMatch.index - 1200), crMatch.index + 1800);
    const damage = highestAverageDamage(window);
    const dc = highestNumber(window, /\bCD\s*([0-9]{1,2})\b/gi);

    if (damage && (damage < profile.damage[0] || damage > profile.damage[1])) {
      add("avviso", file, crMatch.line, `GS ${crMatch.groups[0]} con danno medio massimo ${formatNumber(damage)} fuori dalla fascia ${profile.damage[0]}-${profile.damage[1]}.`, "Il controllo e indicativo: considera multiattacco, condizioni, area e durata degli effetti.");
    }

    if (dc && (dc < profile.dc[0] || dc > profile.dc[1])) {
      add("avviso", file, crMatch.line, `GS ${crMatch.groups[0]} con CD ${dc} fuori dalla fascia ${profile.dc[0]}-${profile.dc[1]}.`);
    }
  }
}

function checkRewardText(source, file) {
  for (const match of matchAllWithLine(source, /\b([0-9][0-9.]*)\s*(PE|PX|XP)\b/gi)) {
    const reward = Number(match.groups[0].replace(/\./g, ""));
    const profile = challengeProfiles.find((item) => reward <= item.reward[1]) || challengeProfiles.at(-1);
    if (reward > profile.reward[1]) {
      add("avviso", file, match.line, `ricompensa ${reward} ${match.groups[1].toUpperCase()} elevata.`, "Verifica che sia allineata a livello, milestone e numero di personaggi.");
    }
  }
}

function highestAverageDamage(text) {
  const values = matchAllWithLine(text, /\b([0-9]+)d([0-9]+)(?:\s*([+-])\s*([0-9]+))?\b/gi)
    .map((match) => {
      const dice = Number(match.groups[0]);
      const sides = Number(match.groups[1]);
      const sign = match.groups[2] === "-" ? -1 : 1;
      const modifier = Number(match.groups[3] || 0) * sign;
      return dice * ((sides + 1) / 2) + modifier;
    });

  return values.length ? Math.max(...values) : 0;
}

function highestNumber(text, pattern) {
  const values = matchAllWithLine(text, pattern).map((match) => Number(match.groups[0]));
  return values.length ? Math.max(...values) : 0;
}

function parseFrontmatter(source) {
  if (!source.startsWith("---\n")) return { metadata: {}, bodyStartLine: 1 };

  const end = source.indexOf("\n---", 4);
  if (end === -1) return { metadata: {}, bodyStartLine: 1 };

  const raw = source.slice(4, end).trim();
  const metadata = {};
  for (const line of raw.split("\n")) {
    const index = line.indexOf(":");
    if (index === -1) continue;
    metadata[line.slice(0, index).trim()] = line.slice(index + 1).trim().replace(/^["']|["']$/g, "");
  }

  return {
    metadata,
    bodyStartLine: source.slice(0, end + 4).split(/\r?\n/).length
  };
}

function parseChallenge(value) {
  if (value.includes("/")) {
    const [num, den] = value.split("/").map(Number);
    return num / den;
  }
  return Number(value);
}

function matchAllWithLine(source, pattern) {
  const matches = [];
  for (const match of source.matchAll(pattern)) {
    matches.push({
      index: match.index || 0,
      line: source.slice(0, match.index || 0).split(/\r?\n/).length,
      groups: match.slice(1)
    });
  }
  return matches;
}

function stripTags(source) {
  return source.replace(/<[^>]+>/g, " ");
}

function formatNumber(value) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function add(level, file, line, message, hint = "") {
  findings.push({ level, file, line, message, hint });
}

async function listFiles(folder, extensions) {
  const entries = await readdir(folder, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = join(folder, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(entryPath, extensions));
    } else if (extensions.includes(extname(entry.name))) {
      files.push(entryPath);
    }
  }

  return files;
}
