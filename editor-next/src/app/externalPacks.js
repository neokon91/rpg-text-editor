import { externalPacksStorageKey } from "./constants.js";

export function loadExternalPacks() {
  try {
    const stored = JSON.parse(localStorage.getItem(externalPacksStorageKey) || "[]");
    if (!Array.isArray(stored)) return [];
    return stored.map(normalizeExternalPack);
  } catch {
    localStorage.removeItem(externalPacksStorageKey);
    return [];
  }
}

export function saveExternalPacks(packs) {
  localStorage.setItem(externalPacksStorageKey, JSON.stringify(packs));
}

export function normalizeExternalPack(pack) {
  if (!pack || typeof pack !== "object") throw new Error("Pack esterno non valido.");
  if (!pack.id || !pack.name || !Array.isArray(pack.components)) {
    throw new Error("Il pack richiede id, name e components.");
  }
  return {
    id: String(pack.id),
    name: String(pack.name),
    schema: {
      ...pack,
      components: pack.components
    }
  };
}

export function validateExternalPack(pack, { manifest, schema, externalPacks }) {
  const manifestPackIds = new Set((manifest?.packs || []).map((item) => item.id));
  if (manifestPackIds.has(pack.id)) throw new Error(`Pack id gia dichiarato nel manifest: ${pack.id}.`);

  for (const component of pack.schema.components) {
    validateExternalComponent(component);
  }

  const replacingIds = new Set([pack.id]);
  const externalIds = new Set(externalPacks.map((item) => item.id));
  if (externalIds.has(pack.id)) replacingIds.add(pack.id);

  const existingComponents = (schema.components || []).filter((component) => !replacingIds.has(component.source));
  const componentIds = new Set(existingComponents.map((component) => component.id));
  const containers = new Set(existingComponents.map((component) => component.container));

  for (const component of pack.schema.components) {
    if (componentIds.has(component.id)) throw new Error(`Component id duplicato: ${component.id}.`);
    if (containers.has(component.container)) throw new Error(`Container duplicato: ${component.container}.`);
    componentIds.add(component.id);
    containers.add(component.container);
  }
}

function validateExternalComponent(component) {
  for (const key of ["id", "label", "group", "description", "container", "fields"]) {
    if (!component[key]) throw new Error(`Componente esterno senza campo obbligatorio: ${key}.`);
  }
  if (!Array.isArray(component.fields)) throw new Error(`${component.id}: fields deve essere un array.`);
  for (const field of component.fields) {
    if (!field.key || !field.label || !field.type) {
      throw new Error(`${component.id}: ogni field richiede key, label e type.`);
    }
  }
}
