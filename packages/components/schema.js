import { mergeComponentSources } from "../../scripts/lib/component-schema.js";

export const manifestUrl = runtimeAssetUrl("schemas/components.json");

export async function fetchJson(url, errorMessage) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${errorMessage}: ${response.status}`);
  return response.json();
}

export async function loadComponentSchema(loadedManifest, activePackIds, externalPacks = []) {
  const sources = [];
  const core = await fetchJson(runtimeAssetUrl(loadedManifest.core), "Schema core non caricato");
  sources.push({ id: "core", name: "Core", schema: core });

  for (const pack of loadedManifest.packs || []) {
    if (!activePackIds.has(pack.id)) continue;

    const packSchema = await fetchJson(runtimeAssetUrl(pack.path), `Plugin pack non caricato: ${pack.id}`);
    sources.push({ id: pack.id, name: pack.name, schema: packSchema });
  }

  for (const pack of externalPacks) {
    sources.push({ id: pack.id, name: pack.name, schema: pack.schema });
  }

  return mergeComponentSources(sources);
}

export function loadEnabledPacks(loadedManifest, storageKey) {
  const declared = new Set((loadedManifest.packs || []).map((pack) => pack.id));
  const stored = localStorage.getItem(storageKey);

  if (stored) {
    try {
      const selected = JSON.parse(stored).filter((id) => declared.has(id));
      return new Set(selected);
    } catch {
      localStorage.removeItem(storageKey);
    }
  }

  return new Set((loadedManifest.packs || [])
    .filter((pack) => pack.enabled !== false)
    .map((pack) => pack.id));
}

export function saveEnabledPacks(storageKey, enabledPacks) {
  localStorage.setItem(storageKey, JSON.stringify([...enabledPacks]));
}

function runtimeAssetUrl(path) {
  const cleanPath = String(path || "").replace(/^\/+/, "");
  const viteBase = import.meta.env?.BASE_URL || "/";

  if (/^https?:\/\//i.test(cleanPath)) return cleanPath;
  if (viteBase === "./" || viteBase === "") {
    return new URL(cleanPath, typeof document !== "undefined" ? document.baseURI : "http://localhost/").href;
  }
  return new URL(cleanPath, `http://localhost${viteBase}`).pathname;
}
