import { readdir, readFile } from "node:fs/promises";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const docsDir = join(root, "docs");

const checks = [
  {
    level: "errore",
    terms: [
      "beholder",
      "mind flayer",
      "illithid",
      "strahd",
      "orcus",
      "tiamat",
      "forgotten realms",
      "waterdeep",
      "baldur's gate",
      "ravenloft",
      "dragonlance",
      "eberron",
      "artificer",
      "aasimar"
    ],
    reason: "nome o contenuto esplicitamente segnalato come fuori dallo SRD o legato a identità protetta"
  },
  {
    level: "avviso",
    terms: [
      "dungeons & dragons",
      "dnd",
      "d&d",
      "wizards of the coast",
      "wotc",
      "dungeon master",
      "monster manual",
      "player's handbook",
      "dungeon master's guide"
    ],
    reason: "marchio o riferimento editoriale da usare solo in note legali o contesto nominativo prudente"
  }
];

const files = (await readdir(docsDir)).filter((file) => file.endsWith(".md"));
const findings = [];

for (const file of files) {
  const path = join(docsDir, file);
  const source = await readFile(path, "utf8");
  const lines = source.split(/\r?\n/);

  for (const [index, line] of lines.entries()) {
    const normalized = line.toLowerCase();
    for (const check of checks) {
      for (const term of check.terms) {
        if (normalized.includes(term)) {
          findings.push({
            file,
            line: index + 1,
            level: check.level,
            term,
            reason: check.reason
          });
        }
      }
    }
  }
}

if (findings.length === 0) {
  console.log("Check legale/editoriale: nessun termine rischioso trovato nei sorgenti Markdown.");
  process.exit(0);
}

for (const finding of findings) {
  console.log(`${finding.level.toUpperCase()} ${finding.file}:${finding.line} "${finding.term}"`);
  console.log(`  ${finding.reason}`);
}

const hasErrors = findings.some((finding) => finding.level === "errore");
process.exit(hasErrors ? 1 : 0);
