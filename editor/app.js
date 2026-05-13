import { slugifyDocumentName } from "/scripts/lib/component-schema.js";
import { createComponentController } from "/editor/components/controller.js";
import { renderDiagnostics } from "/editor/components/validation.js";
import { checkDocument as checkDocumentQuality } from "/editor/documents/api.js";
import { createDocumentController } from "/editor/documents/controller.js";
import { createMetadataController } from "/editor/documents/metadata-controller.js";
import {
  copyMarkdown as copyMarkdownToClipboard,
  createSnippetHandler,
  createToolbarHandler,
  downloadMarkdown as downloadMarkdownFile,
  insertAtCursor
} from "/editor/markdown/editor-actions.js";
import { createPreviewController } from "/editor/preview/controller.js";
import { createModalController } from "/editor/ui/modal.js";

const storageKey = "rpg-text-editor:draft";
const enabledPacksKey = "rpg-text-editor:enabled-packs";

const input = document.querySelector("#markdown-input");
const preview = document.querySelector("#preview");
const componentList = document.querySelector("#component-list");
const componentSearch = document.querySelector("#component-search");
const componentFilter = document.querySelector("#component-filter");
const recentComponents = document.querySelector("#recent-components");
const dialog = document.querySelector("#component-dialog");
const dialogTitle = document.querySelector("#dialog-title");
const dialogDescription = document.querySelector("#dialog-description");
const componentForm = document.querySelector("#component-form");
const insertButton = document.querySelector("#insert-component");
const externalPackInput = document.querySelector("#external-pack-input");
const clearExternalPacksButton = document.querySelector("#clear-external-packs");
const externalPackStatus = document.querySelector("#external-pack-status");
const saveState = document.querySelector("#save-state");
const wordCount = document.querySelector("#word-count");
const validationPanel = document.querySelector("#validation-panel");
const authorCheckPanel = document.querySelector("#author-check-panel");
const documentPicker = document.querySelector("#document-picker");
const packList = document.querySelector("#pack-list");
const metadataControls = [...document.querySelectorAll("[data-meta]")];
const toolbar = document.querySelector(".editor-toolbar");
const currentDocumentLabel = document.querySelector("#current-document");
const dirtyState = document.querySelector("#dirty-state");
const guideStatus = document.querySelector("#guide-status");
const previewViewport = document.querySelector("#preview-viewport");
const previewWidth = document.querySelector("#preview-width");
const previewSync = document.querySelector("#preview-sync");
const previewMeta = document.querySelector("#preview-meta");
const modalController = createModalController({
  dialog: document.querySelector("#modal-dialog"),
  title: document.querySelector("#modal-title"),
  message: document.querySelector("#modal-message"),
  field: document.querySelector("#modal-input"),
  cancelButton: document.querySelector("#modal-cancel"),
  confirmButton: document.querySelector("#modal-confirm")
});

let componentController;
let documentController;
let metadataController;
let previewController;
let currentDocument = "";
let lastSavedContent = "";
let isDirty = false;
let currentDiagnostics = [];
let authorDiagnostics = [];
let authorCheckState = "idle";
let authorCheckedMarkdown = "";

const starterDocument = `---
title: Nuova Avventura
slug: nuova-avventura
summary: Bozza creata dall'editor locale.
category: avventure
tags: bozza, ttrpg
compatibility: 5e/5.5e
license_mode: srd-5.2-cc
author: Andrea
theme: classic-parchment
paper: A4
public: true
---

# Nuova Avventura

<p class="subtitle">Una premessa pronta da sviluppare.</p>

## Scena iniziale

Scrivi qui la prima scena.
`;

const handleToolbarClick = createToolbarHandler(input, persistEditorChange);
const handleSnippetClick = createSnippetHandler(input, persistEditorChange);

init();

async function init() {
  componentController = createComponentController({
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
    onInsert: (markdown) => {
      insertAtCursor(input, markdown);
      persistEditorChange();
    },
    onRemember: () => {
      saveState.textContent = "Componente aggiunto agli ultimi usati";
    },
    onSchemaChange: renderPreview
  });
  await componentController.init();
  metadataController = createMetadataController({
    controls: metadataControls,
    fallbackMarkdown: starterDocument,
    getMarkdown: () => input.value,
    setMarkdown: (markdown) => {
      input.value = markdown;
    },
    onChange: persistEditorChange
  });
  metadataController.init();
  previewController = createPreviewController({
    preview,
    wordCount,
    validationPanel,
    previewViewport,
    previewWidth,
    previewSync,
    previewMeta,
    sourceInput: input,
    getMarkdown: () => input.value,
    getSchema: () => componentController.schema,
    onSelectLine: focusMarkdownLine,
    onDiagnostics: (diagnostics) => {
      currentDiagnostics = diagnostics;
      updateGuideStatus();
    }
  });
  documentController = createDocumentController({
    documentPicker,
    storageKey,
    getMarkdown: () => input.value,
    setMarkdown: (markdown) => {
      input.value = markdown;
    },
    getCurrentDocument: () => currentDocument,
    setCurrentDocument: (filename) => {
      currentDocument = filename;
    },
    getIsDirty: () => isDirty,
    setLastSavedContent: (content) => {
      lastSavedContent = content;
    },
    setSaveState: (message) => {
      saveState.textContent = message;
    },
    setDirty,
    syncMetadataForm: syncMetadata,
    renderPreview,
    confirmDiscardChanges,
    requestRename,
    confirmDelete
  });

  input.value = localStorage.getItem(storageKey) || starterDocument;
  lastSavedContent = input.value;
  setDirty(Boolean(localStorage.getItem(storageKey)));
  syncMetadata();
  await documentController.refreshPicker();
  renderPreview();
  renderAuthorDiagnostics();

  input.addEventListener("input", () => {
    persistEditorChange();
    syncMetadata();
  });

  toolbar.addEventListener("click", handleToolbarClick);
  document.querySelector(".quick-snippets").addEventListener("click", handleSnippetClick);
  document.querySelector("#new-document").addEventListener("click", resetDraft);
  document.querySelector("#copy-markdown").addEventListener("click", copyMarkdown);
  document.querySelector("#download-markdown").addEventListener("click", downloadMarkdown);
  document.querySelector("#check-document").addEventListener("click", checkDocument);
  document.querySelector("#save-document").addEventListener("click", documentController.saveCurrent);
  document.querySelector("#save-copy").addEventListener("click", documentController.saveCopy);
  document.querySelector("#rename-document").addEventListener("click", documentController.renameCurrent);
  document.querySelector("#delete-document").addEventListener("click", documentController.deleteCurrent);
  document.querySelector("#guide-save").addEventListener("click", documentController.saveCurrent);
  document.querySelector("#guide-check").addEventListener("click", checkDocument);
  document.querySelector("#guide-export").addEventListener("click", exportCheckedMarkdown);
  documentPicker.addEventListener("change", documentController.importSelected);
  window.addEventListener("beforeunload", (event) => {
    if (!isDirty) return;
    event.preventDefault();
    event.returnValue = "";
  });
}

function syncMetadata() {
  metadataController.sync();
}

function persistEditorChange() {
  localStorage.setItem(storageKey, input.value);
  setDirty(input.value !== lastSavedContent);
  renderPreview();
}

function setDirty(value) {
  isDirty = value;
  const filename = currentDocument || `${slugifyDocumentName(input.value)}.md`;
  currentDocumentLabel.textContent = currentDocument ? `docs/${currentDocument}` : "Bozza locale";
  dirtyState.textContent = isDirty ? "Modifiche non salvate" : `Salvato: ${filename}`;
  dirtyState.className = isDirty ? "dirty" : "";
  saveState.textContent = isDirty ? "Modifiche locali" : "Salvato in docs";
  updateGuideStatus();
}

async function confirmDiscardChanges() {
  if (!isDirty) return true;
  const result = await modalController.confirm({
    title: "Scartare modifiche?",
    message: "Ci sono modifiche non salvate. Continuando verranno perse.",
    confirmLabel: "Scarta modifiche"
  });
  return result.confirmed;
}

async function requestRename(suggestedName) {
  const result = await modalController.prompt({
    title: "Rinomina documento",
    message: "Inserisci il nuovo nome del file Markdown.",
    value: suggestedName,
    confirmLabel: "Rinomina"
  });
  return result.confirmed ? result.value : "";
}

async function confirmDelete(filename) {
  const result = await modalController.confirm({
    title: "Eliminare documento?",
    message: `Il file docs/${filename} verra rimosso.`,
    confirmLabel: "Elimina"
  });
  return result.confirmed;
}

function renderPreview() {
  if (authorCheckState === "fresh" && input.value !== authorCheckedMarkdown) {
    authorCheckState = "stale";
    authorDiagnostics = [];
  }
  currentDiagnostics = previewController.render() || [];
  renderAuthorDiagnostics();
  updateGuideStatus();
}

async function resetDraft() {
  await documentController.resetToDraft(starterDocument);
}

async function copyMarkdown() {
  await copyMarkdownToClipboard(input.value);
  saveState.textContent = "Markdown copiato";
}

function downloadMarkdown() {
  downloadMarkdownFile(input.value, `${slugifyDocumentName(input.value)}.md`);
  saveState.textContent = "Export Markdown pronto";
}

async function checkDocument(options = {}) {
  const settings = options instanceof Event ? {} : options;
  renderPreview();
  authorCheckState = "running";
  authorCheckPanel.replaceChildren(
    document.createElement("strong"),
    document.createElement("span")
  );
  authorCheckPanel.querySelector("strong").textContent = "Author check";
  authorCheckPanel.querySelector("span").textContent = "Controlli editoriali in corso...";

  try {
    const result = await checkDocumentQuality({
      filename: currentDocument || `${slugifyDocumentName(input.value)}.md`,
      content: input.value
    });
    authorDiagnostics = result.diagnostics || [];
    authorCheckState = "fresh";
    authorCheckedMarkdown = input.value;
  } catch {
    authorCheckState = "failed";
    authorDiagnostics = [{
      severity: "error",
      line: 1,
      message: "Author check non disponibile.",
      fix: "Verifica che il server editor locale sia attivo."
    }];
  }

  renderAuthorDiagnostics();
  if (settings.scroll !== false) authorCheckPanel.scrollIntoView({ block: "nearest" });
  const allDiagnostics = checkedDiagnostics();
  const firstBlocking = allDiagnostics.find((diagnostic) => diagnostic.severity === "error") || allDiagnostics[0];
  if (firstBlocking) {
    if (settings.focus !== false) focusMarkdownLine(firstBlocking.line);
    saveState.textContent = firstBlocking.severity === "error" ? "Check: errori da correggere" : "Check: avvisi presenti";
    return { ok: firstBlocking.severity !== "error", diagnostics: allDiagnostics };
  }
  saveState.textContent = "Check completo ok";
  return { ok: true, diagnostics: allDiagnostics };
}

async function exportCheckedMarkdown() {
  const result = await checkDocument({ scroll: false, focus: true });
  const blocking = result.diagnostics.find((diagnostic) => diagnostic.severity === "error");
  if (blocking) {
    saveState.textContent = "Export bloccato: correggi gli errori";
    return;
  }

  downloadMarkdownFile(input.value, `${slugifyDocumentName(input.value)}.md`);
  saveState.textContent = result.diagnostics.length
    ? "Export Markdown pronto con avvisi"
    : "Export Markdown pronto";
}

function focusMarkdownLine(lineNumber) {
  const lines = input.value.replace(/\r\n/g, "\n").split("\n");
  const safeLine = Math.max(1, Math.min(Number(lineNumber) || 1, lines.length));
  const start = lines.slice(0, safeLine - 1).join("\n").length + (safeLine > 1 ? 1 : 0);
  const end = start + lines[safeLine - 1].length;
  input.focus();
  input.setSelectionRange(start, end);
}

function updateGuideStatus() {
  if (!guideStatus) return;
  const allDiagnostics = checkedDiagnostics();
  const errors = allDiagnostics.filter((diagnostic) => diagnostic.severity === "error").length;
  const warnings = allDiagnostics.filter((diagnostic) => diagnostic.severity === "warning").length;
  const saveHint = isDirty ? "salva le modifiche" : "documento salvato";
  const checkHint = errors
    ? `${errors} errori schema`
    : warnings
      ? `${warnings} avvisi schema`
      : authorCheckState === "stale"
        ? "author check da rifare"
        : "schema ok";
  guideStatus.textContent = `${saveHint}; ${checkHint}; esporta quando il Markdown e pronto.`;
}

function checkedDiagnostics() {
  return [
    ...currentDiagnostics,
    ...(authorCheckState === "fresh" || authorCheckState === "failed" ? authorDiagnostics : [])
  ];
}

function renderAuthorDiagnostics() {
  const emptyMessage = {
    fresh: "Controlli editoriali, legali e include ok sulla bozza corrente.",
    stale: "Il Markdown e cambiato dopo l'ultimo author check. Premi Check per aggiornare.",
    failed: "Author check non disponibile.",
    idle: "Premi Check per controlli editoriali, legali e include sulla bozza corrente.",
    running: "Controlli editoriali in corso..."
  }[authorCheckState] || "Premi Check per controlli editoriali, legali e include sulla bozza corrente.";

  renderDiagnostics({
    diagnostics: authorDiagnostics,
    emptyTitle: "Author check",
    emptyMessage,
    panel: authorCheckPanel,
    title: "Author check",
    onSelectLine: focusMarkdownLine
  });
  updateGuideStatus();
}
