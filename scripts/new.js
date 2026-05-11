import { mkdir, readFile, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const templateDir = join(root, "templates", "markdown");
const docsDir = join(root, "docs");

const [, , kindArg, ...rest] = process.argv;
const dryRun = rest.includes("--dry-run");
const titleParts = rest.filter((arg) => arg !== "--dry-run");
const kind = kindArg || "adventure";
const title = titleParts.join(" ").trim() || defaultTitle(kind);
const slug = slugify(title);

const templates = {
  adventure: "adventure.md",
  bestiary: "bestiary.md",
  item: "item.md",
  reference: "reference.md"
};

if (!templates[kind]) {
  console.error(`Tipo non supportato: ${kind}`);
  console.error(`Tipi disponibili: ${Object.keys(templates).join(", ")}`);
  process.exit(1);
}

const templatePath = join(templateDir, templates[kind]);
const outputPath = join(docsDir, `${slug}.md`);
const content = fillTemplate(await readFile(templatePath, "utf8"), {
  TITLE: title,
  SLUG: slug,
  AUTHOR: process.env.RPG_AUTHOR || "Andrea",
  CATEGORY: categoryFor(kind),
  TAGS: tagsFor(kind)
});

if (dryRun) {
  console.log(content);
  process.exit(0);
}

if (existsSync(outputPath)) {
  console.error(`File già esistente: ${relativePath(outputPath)}`);
  process.exit(1);
}

await mkdir(docsDir, { recursive: true });
await writeFile(outputPath, content, "utf8");
console.log(`Creato ${relativePath(outputPath)}`);

function fillTemplate(source, values) {
  return source.replaceAll(/%%([A-Z_]+)%%/g, (_, key) => values[key] || "");
}

function defaultTitle(type) {
  return {
    adventure: "Nuova Avventura",
    bestiary: "Nuovo Bestiario",
    item: "Nuovo Oggetto",
    reference: "Nuova Reference"
  }[type] || "Nuovo Documento";
}

function categoryFor(type) {
  return {
    adventure: "avventure",
    bestiary: "bestiari",
    item: "oggetti",
    reference: "reference"
  }[type] || "homebrew";
}

function tagsFor(type) {
  return {
    adventure: "avventura, bozza",
    bestiary: "creature, bozza",
    item: "oggetti-magici, bozza",
    reference: "reference, bozza"
  }[type] || "bozza";
}

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "documento";
}

function relativePath(path) {
  return path.replace(`${root}/`, "");
}
