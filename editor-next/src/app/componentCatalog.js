import { useEffect, useState } from "react";
import { fetchJson, loadComponentSchema, loadEnabledPacks, manifestUrl, saveEnabledPacks } from "../../../packages/components/schema.js";
import { enabledPacksStorageKey } from "./constants.js";
import { loadExternalPacks, normalizeExternalPack, saveExternalPacks, validateExternalPack } from "./externalPacks.js";

export function useComponentCatalog() {
  const [manifest, setManifest] = useState(null);
  const [enabledPacks, setEnabledPacks] = useState(() => new Set());
  const [externalPacks, setExternalPacks] = useState(() => loadExternalPacks());
  const [schema, setSchema] = useState({ components: [] });
  const [schemaState, setSchemaState] = useState("Caricamento schema");

  useEffect(() => {
    let cancelled = false;
    async function loadManifest() {
      try {
        const nextManifest = await fetchJson(manifestUrl, "Manifest componenti non caricato");
        if (cancelled) return;
        setManifest(nextManifest);
        setEnabledPacks(loadEnabledPacks(nextManifest, enabledPacksStorageKey));
      } catch (error) {
        if (cancelled) return;
        setSchemaState(error.message);
      }
    }
    loadManifest();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!manifest) return undefined;
    let cancelled = false;
    async function loadSchema() {
      try {
        const loadedSchema = await loadComponentSchema(manifest, enabledPacks, externalPacks);
        if (cancelled) return;
        setSchema(loadedSchema);
        setSchemaState(`${loadedSchema.components.length} componenti`);
      } catch (error) {
        if (cancelled) return;
        setSchema({ components: [] });
        setSchemaState(error.message);
      }
    }
    loadSchema();
    return () => {
      cancelled = true;
    };
  }, [manifest, enabledPacks, externalPacks]);

  function togglePack(packId) {
    setEnabledPacks((current) => {
      const next = new Set(current);
      if (next.has(packId)) {
        next.delete(packId);
      } else {
        next.add(packId);
      }
      saveEnabledPacks(enabledPacksStorageKey, next);
      return next;
    });
  }

  function importExternalPack(pack) {
    const normalized = normalizeExternalPack(pack);
    validateExternalPack(normalized, {
      manifest,
      schema,
      externalPacks
    });
    setExternalPacks((current) => {
      const next = [
        ...current.filter((item) => item.id !== normalized.id),
        normalized
      ];
      saveExternalPacks(next);
      return next;
    });
    return normalized;
  }

  function removeExternalPack(packId) {
    setExternalPacks((current) => {
      const next = current.filter((pack) => pack.id !== packId);
      saveExternalPacks(next);
      return next;
    });
  }

  return {
    enabledPacks,
    externalPacks,
    importExternalPack,
    manifest,
    removeExternalPack,
    schema,
    schemaState,
    togglePack
  };
}
