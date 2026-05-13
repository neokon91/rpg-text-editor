import {
  componentToMarkdown,
  openComponentDialog,
  renderComponentList,
  renderGroupFilter,
  renderPackList,
  renderRecentComponents
} from "/editor/components/dialog.js";
import { fetchJson, loadComponentSchema, loadEnabledPacks, manifestUrl, saveEnabledPacks } from "/editor/components/schema.js";

export function createComponentController({
  componentList,
  componentSearch,
  componentFilter,
  recentComponents,
  dialog,
  dialogTitle,
  dialogDescription,
  componentForm,
  insertButton,
  packList,
  externalPackInput,
  clearExternalPacksButton,
    externalPackStatus,
    enabledPacksKey,
    onInsert,
    onRemember,
    onSchemaChange
}) {
  let schema;
  let manifest;
  let enabledPacks = new Set();
  let externalPacks = [];
  let selectedComponent;
  let recentIds = loadRecentComponents();

  async function init() {
    manifest = await fetchJson(manifestUrl, "Manifest componenti non caricato");
    enabledPacks = loadEnabledPacks(manifest, enabledPacksKey);
    schema = await loadComponentSchema(manifest, enabledPacks, externalPacks);

    renderPacks();
    renderExternalPackStatus();
    renderFilters();
    renderComponents();
    renderRecent();

    componentSearch.addEventListener("input", renderComponents);
    componentFilter?.addEventListener("change", renderComponents);
    insertButton.addEventListener("click", insertSelectedComponent);
    externalPackInput.addEventListener("change", loadExternalPack);
    clearExternalPacksButton.addEventListener("click", clearExternalPacks);
  }

  function renderComponents() {
    renderComponentList({
      schema,
      searchInput: componentSearch,
      groupFilter: componentFilter,
      listElement: componentList,
      onSelect: showDialog
    });
  }

  function renderFilters() {
    renderGroupFilter({ schema, groupFilter: componentFilter });
  }

  function renderRecent() {
    renderRecentComponents({
      schema,
      recentIds,
      listElement: recentComponents,
      onSelect: showDialog
    });
  }

  function renderPacks() {
    renderPackList({
      manifest,
      enabledPacks,
      listElement: packList,
      onToggle: updatePackSelection
    });
  }

  async function updatePackSelection(packId) {
    if (enabledPacks.has(packId)) {
      enabledPacks.delete(packId);
    } else {
      enabledPacks.add(packId);
    }

    saveEnabledPacks(enabledPacksKey, enabledPacks);
    schema = await loadComponentSchema(manifest, enabledPacks, externalPacks);
    renderFilters();
    renderComponents();
    renderRecent();
    onSchemaChange?.(schema);
  }

  async function loadExternalPack() {
    const file = externalPackInput.files?.[0];
    if (!file) return;

    try {
      const pack = JSON.parse(await file.text());
      validateExternalPack(pack);
      const nextExternalPacks = [
        ...externalPacks.filter((item) => item.id !== pack.id),
        { id: pack.id, name: pack.name, schema: pack }
      ];
      const nextSchema = await loadComponentSchema(manifest, enabledPacks, nextExternalPacks);
      externalPacks = nextExternalPacks;
      schema = nextSchema;
      renderExternalPackStatus();
      renderFilters();
      renderComponents();
      renderRecent();
      onSchemaChange?.(schema);
    } catch (error) {
      externalPackStatus.textContent = `Pack non caricato: ${error.message}`;
    } finally {
      externalPackInput.value = "";
    }
  }

  async function clearExternalPacks() {
    if (!externalPacks.length) return;
    externalPacks = [];
    schema = await loadComponentSchema(manifest, enabledPacks, externalPacks);
    renderExternalPackStatus();
    renderFilters();
    renderComponents();
    renderRecent();
    onSchemaChange?.(schema);
  }

  function renderExternalPackStatus() {
    clearExternalPacksButton.disabled = externalPacks.length === 0;
    externalPackStatus.textContent = externalPacks.length
      ? `Pack esterni attivi: ${externalPacks.map((pack) => pack.name).join(", ")}`
      : "Nessun pack esterno caricato.";
  }

  function validateExternalPack(pack) {
    for (const key of ["id", "name", "version", "components"]) {
      if (!pack[key]) throw new Error(`campo obbligatorio mancante: ${key}`);
    }
    if (!Array.isArray(pack.components)) throw new Error("components deve essere un array");

    for (const component of pack.components) {
      for (const key of ["id", "label", "group", "description", "container", "fields"]) {
        if (!component[key]) throw new Error(`${component.id || "componente"}: campo obbligatorio mancante: ${key}`);
      }
      if (!Array.isArray(component.fields)) throw new Error(`${component.id}: fields deve essere un array`);
    }
  }

  function showDialog(component) {
    selectedComponent = component;
    openComponentDialog({
      component,
      dialog,
      titleElement: dialogTitle,
      descriptionElement: dialogDescription,
      formElement: componentForm
    });
  }

  function insertSelectedComponent() {
    if (!selectedComponent) return;

    onInsert(componentToMarkdown(selectedComponent, dialog.querySelector("form")));
    rememberComponent(selectedComponent.id);
    dialog.close();
  }

  function rememberComponent(componentId) {
    recentIds = [componentId, ...recentIds.filter((id) => id !== componentId)].slice(0, 5);
    localStorage.setItem(`${enabledPacksKey}:recent-components`, JSON.stringify(recentIds));
    renderRecent();
    onRemember?.(componentId);
  }

  function loadRecentComponents() {
    try {
      return JSON.parse(localStorage.getItem(`${enabledPacksKey}:recent-components`) || "[]");
    } catch {
      return [];
    }
  }

  return {
    init,
    renderComponents,
    get schema() {
      return schema;
    }
  };
}
