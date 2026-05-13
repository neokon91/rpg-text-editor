import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mergeComponentSources } from "./lib/component-schema.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = resolve(root, "schemas", "components.json");
const requiredComponentFields = ["id", "label", "group", "description", "container", "fields"];

async function main() {
  const manifest = await readJson(manifestPath);
  const sources = [];

  if (!manifest.core) {
    throw new Error("Il manifest componenti deve dichiarare `core`.");
  }

  sources.push({
    id: "core",
    kind: "core",
    path: resolveSchemaPath(manifest.core),
    schema: await readJson(resolveSchemaPath(manifest.core))
  });

  for (const pack of manifest.packs || []) {
    validatePackManifest(pack);
    if (pack.enabled === false) continue;

    sources.push({
      id: pack.id,
      kind: "pack",
      path: resolveSchemaPath(pack.path),
      schema: await readJson(resolveSchemaPath(pack.path))
    });
  }

  let componentCount = 0;

  for (const source of sources) {
    const components = source.schema.components || [];
    if (!Array.isArray(components)) {
      throw new Error(`${source.id}: components deve essere un array.`);
    }

    for (const component of components) {
      componentCount += 1;
      validateComponent(source.id, component);
    }
  }

  mergeComponentSources(sources);

  console.log(`Component packs validi: ${sources.length} sorgenti, ${componentCount} componenti.`);
}

function validatePackManifest(pack) {
  for (const key of ["id", "name", "version", "compatibility", "path"]) {
    if (!pack[key]) throw new Error(`Plugin pack senza campo obbligatorio: ${key}.`);
  }
}

function validateComponent(sourceId, component) {
  for (const key of requiredComponentFields) {
    if (!component[key]) throw new Error(`${sourceId}: componente senza campo obbligatorio: ${key}.`);
  }

  if (!Array.isArray(component.fields)) {
    throw new Error(`${sourceId}/${component.id}: fields deve essere un array.`);
  }

  const fieldKeys = new Set();
  for (const field of component.fields) {
    if (!field.key || !field.label || !field.type) {
      throw new Error(`${sourceId}/${component.id}: ogni field richiede key, label e type.`);
    }
    if (fieldKeys.has(field.key)) {
      throw new Error(`${sourceId}/${component.id}: field duplicato ${field.key}.`);
    }
    fieldKeys.add(field.key);
  }

  validatePresets(sourceId, component, fieldKeys);
}

function validatePresets(sourceId, component, fieldKeys) {
  if (!component.presets) return;
  if (!Array.isArray(component.presets)) {
    throw new Error(`${sourceId}/${component.id}: presets deve essere un array.`);
  }

  const presetIds = new Set();
  const listKeys = new Set((component.lists || []).map((list) => list.key));

  for (const preset of component.presets) {
    if (!preset.id || !preset.label) {
      throw new Error(`${sourceId}/${component.id}: ogni preset richiede id e label.`);
    }
    if (presetIds.has(preset.id)) {
      throw new Error(`${sourceId}/${component.id}: preset duplicato ${preset.id}.`);
    }
    presetIds.add(preset.id);

    for (const key of Object.keys(preset.fields || {})) {
      if (!fieldKeys.has(key)) {
        throw new Error(`${sourceId}/${component.id}/${preset.id}: field preset non previsto ${key}.`);
      }
    }

    if (preset.lists && !Array.isArray(preset.lists)) {
      throw new Error(`${sourceId}/${component.id}/${preset.id}: lists preset deve essere un array.`);
    }

    for (const item of preset.lists || []) {
      if (!item.key || !listKeys.has(item.key)) {
        throw new Error(`${sourceId}/${component.id}/${preset.id}: lista preset non prevista ${item.key || "(vuota)"}.`);
      }
      if (!("text" in item) && !("default_text" in item)) {
        throw new Error(`${sourceId}/${component.id}/${preset.id}: ogni lista preset richiede text.`);
      }
    }
  }
}

function resolveSchemaPath(path) {
  if (!path || path.includes("..")) {
    throw new Error(`Path schema non consentito: ${path}`);
  }

  return resolve(root, path.replace(/^\/+/, ""));
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
