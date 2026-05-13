import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mergeComponentSources, validateMarkdownBlocks } from "./lib/component-schema.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");

const coreSchema = await readJson(join(root, "schemas", "core", "components.json"));
const fantasyClassicSchema = await readJson(join(root, "schemas", "plugins", "fantasy-classic", "pack.json"));
const externalSchema = {
  components: [
    {
      id: "omen",
      label: "Presagio",
      group: "Mondo",
      container: "omen",
      fields: [
        { key: "name", label: "Nome", type: "text", required: true }
      ],
      lists: [
        { key: "sign", label: "Segno" }
      ]
    }
  ]
};

const fullSchema = mergeComponentSources([
  { id: "core", name: "Core", schema: coreSchema },
  { id: "fantasy-classic", name: "Fantasy Classic Pack", schema: fantasyClassicSchema },
  { id: "external-test", name: "External Test Pack", schema: externalSchema }
]);

const fixture = await readFile(join(root, "tests", "fixtures", "schema-diagnostics.md"), "utf8");
const diagnostics = validateMarkdownBlocks(fixture, fullSchema);
const signatures = diagnostics.map((diagnostic) => `${diagnostic.severity}:${diagnostic.message}`);

assert.deepEqual(signatures, [
  'error:Componente sconosciuto "unknown-widget".',
  'error:Incantesimo: campo obbligatorio mancante "name".',
  'warning:Incantesimo: chiave non prevista "unexpected".',
  'warning:Tabella: lista "row" malformata, usa "nome | testo".'
]);

const coreOnlySchema = mergeComponentSources([
  { id: "core", name: "Core", schema: coreSchema }
]);
assert.deepEqual(
  validateMarkdownBlocks("::: faction Pack disabilitato\nname: Custodi\n:::", coreOnlySchema).map((diagnostic) => diagnostic.message),
  ['Componente sconosciuto "faction".']
);

const externalOnlySchema = mergeComponentSources([
  { id: "core", name: "Core", schema: coreSchema },
  { id: "external-test", name: "External Test Pack", schema: externalSchema }
]);
assert.deepEqual(
  validateMarkdownBlocks("::: omen Pack esterno\nname: Presagio\nsign: Campana | Suona senza vento.\n:::", externalOnlySchema),
  []
);

console.log(`Diagnostici schema verificati: ${diagnostics.length} assert su fixture negativa.`);

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}
