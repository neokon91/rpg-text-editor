import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

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

  const componentIds = new Map();
  const containers = new Map();
  let componentCount = 0;

  for (const source of sources) {
    const components = source.schema.components || [];
    if (!Array.isArray(components)) {
      throw new Error(`${source.id}: components deve essere un array.`);
    }

    for (const component of components) {
      componentCount += 1;
      validateComponent(source.id, component);
      assertUnique(componentIds, component.id, source.id, "component id");
      assertUnique(containers, component.container, source.id, "container");
    }
  }

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
}

function assertUnique(registry, key, sourceId, label) {
  if (registry.has(key)) {
    throw new Error(`Collisione ${label} "${key}" tra ${registry.get(key)} e ${sourceId}.`);
  }

  registry.set(key, sourceId);
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
