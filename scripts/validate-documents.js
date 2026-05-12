import { readFile, readdir } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mergeComponentSources, validateMarkdownBlocks } from "./lib/component-schema.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const docsDir = join(root, "docs");

async function main() {
  const schema = await loadSchema();
  const files = (await readdir(docsDir)).filter((file) => extname(file) === ".md").sort();
  const diagnostics = [];

  for (const file of files) {
    const markdown = await readFile(join(docsDir, file), "utf8");
    for (const diagnostic of validateMarkdownBlocks(markdown, schema)) {
      diagnostics.push({ file, ...diagnostic });
    }
  }

  for (const diagnostic of diagnostics) {
    const prefix = diagnostic.severity === "error" ? "Errore" : "Avviso";
    console.log(`${prefix}: docs/${diagnostic.file}:${diagnostic.line} ${diagnostic.message}`);
  }

  const errors = diagnostics.filter((diagnostic) => diagnostic.severity === "error");
  if (errors.length) {
    throw new Error(`Validazione documenti fallita: ${errors.length} errori.`);
  }

  console.log(`Documenti validati contro schema componenti: ${files.length} file, ${diagnostics.length} avvisi.`);
}

async function loadSchema() {
  const manifest = await readJson(join(root, "schemas", "components.json"));
  const sources = [{
    id: "core",
    name: "Core",
    schema: await readJson(resolveSchemaPath(manifest.core))
  }];

  for (const pack of manifest.packs || []) {
    if (pack.enabled === false) continue;
    sources.push({
      id: pack.id,
      name: pack.name,
      schema: await readJson(resolveSchemaPath(pack.path))
    });
  }

  return mergeComponentSources(sources);
}

function resolveSchemaPath(path) {
  if (!path || path.includes("..")) throw new Error(`Path schema non consentito: ${path}`);
  return resolve(root, path.replace(/^\/+/, ""));
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
