import { slugifyDocumentName } from "/scripts/lib/component-schema.js";
import { createComponentController } from "/editor/components/controller.js";
import { createAuthorCheckController } from "/editor/documents/check-controller.js";
import { createDocumentController } from "/editor/documents/controller.js";
import { createExportController } from "/editor/documents/export-controller.js";
import { createMetadataController } from "/editor/documents/metadata-controller.js";
import { createDraftRecoveryController } from "/editor/documents/recovery.js";
import {
  copyMarkdown as copyMarkdownToClipboard,
  createSnippetHandler,
  createToolbarHandler,
  downloadMarkdown as downloadMarkdownFile,
  insertAtCursor
} from "/editor/markdown/editor-actions.js";
import { createOutlineController } from "/editor/markdown/outline.js";
import { createPreviewController } from "/editor/preview/controller.js";
import { createModalController } from "/editor/ui/modal.js";
import { createWorkspaceViewController } from "/editor/ui/workspace-view.js";

const storageKey = "rpg-text-editor:draft";
const draftMetaKey = "rpg-text-editor:draft-meta";
const enabledPacksKey = "rpg-text-editor:enabled-packs";
const workspaceViewKey = "rpg-text-editor:workspace-view";

const appShell = document.querySelector(".app-shell");
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
const exportPanel = document.querySelector("#export-panel");
const documentPicker = document.querySelector("#document-picker");
const packList = document.querySelector("#pack-list");
const metadataControls = [...document.querySelectorAll("[data-meta]")];
const toolbar = document.querySelector(".editor-toolbar");
const currentDocumentLabel = document.querySelector("#current-document");
const dirtyState = document.querySelector("#dirty-state");
const recoveryPanel = document.querySelector("#recovery-panel");
const discardDraftButton = document.querySelector("#discard-draft");
const guideStatus = document.querySelector("#guide-status");
const documentOutline = document.querySelector("#document-outline");
const previewViewport = document.querySelector("#preview-viewport");
const previewWidth = document.querySelector("#preview-width");
const previewZoom = document.querySelector("#preview-zoom");
const previewPagePrev = document.querySelector("#preview-page-prev");
const previewPageNext = document.querySelector("#preview-page-next");
const previewPageIndicator = document.querySelector("#preview-page-indicator");
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
const workspaceViewButtons = [...document.querySelectorAll("button[data-workspace-view]")];

let componentController;
let authorCheckController;
let documentController;
let draftRecoveryController;
let exportController;
let metadataController;
let outlineController;
let previewController;
let workspaceViewController;
let currentDocument = "";
let lastSavedContent = "";
let isDirty = false;
let currentDiagnostics = [];

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
  authorCheckController = createAuthorCheckController({
    panel: authorCheckPanel,
    saveState,
    getMarkdown: () => input.value,
    getFilename: editorFilename,
    renderSchema: () => {
      currentDiagnostics = previewController.render() || [];
      updateGuideStatus();
      return currentDiagnostics;
    },
    onSelectLine: focusMarkdownLine,
    onStatusChange: updateGuideStatus
  });
  exportController = createExportController({
    panel: exportPanel,
    saveState,
    getMarkdown: () => input.value,
    getFilename: editorFilename,
    getDownloadFilename: editorFilename,
    downloadMarkdown: downloadMarkdownFile,
    checkDocument: (options) => authorCheckController.checkDocument({
      ...options,
      schemaDiagnostics: currentDiagnostics
    })
  });
  draftRecoveryController = createDraftRecoveryController({
    storageKey,
    draftMetaKey,
    panel: recoveryPanel,
    discardButton: discardDraftButton,
    modalController,
    starterDocument,
    documentPicker,
    getMarkdown: () => input.value,
    setMarkdown: (markdown) => {
      input.value = markdown;
    },
    getCurrentDocument: () => currentDocument,
    setCurrentDocument: (filename) => {
      currentDocument = filename;
    },
    setLastSavedContent: (content) => {
      lastSavedContent = content;
    },
    setSaveState: (message) => {
      saveState.textContent = message;
    },
    setDirty,
    syncMetadata,
    renderPreview
  });
  workspaceViewController = createWorkspaceViewController({
    shell: appShell,
    buttons: workspaceViewButtons,
    storageKey: workspaceViewKey
  });
  outlineController = createOutlineController({
    panel: documentOutline,
    sourceInput: input,
    getMarkdown: () => input.value,
    onSelectLine: focusMarkdownLine
  });
  previewController = createPreviewController({
    preview,
    wordCount,
    validationPanel,
    previewViewport,
    previewWidth,
    previewZoom,
    previewPagePrev,
    previewPageNext,
    previewPageIndicator,
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
    draftMetaKey,
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

  const recoveredDraft = draftRecoveryController.loadDraft();
  input.value = recoveredDraft.content || starterDocument;
  currentDocument = recoveredDraft.currentDocument || "";
  lastSavedContent = input.value;
  setDirty(Boolean(recoveredDraft.content));
  syncMetadata();
  await documentController.refreshPicker(currentDocument);
  workspaceViewController.restore();
  renderPreview();
  authorCheckController.render();

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
  document.querySelector("#guide-export").addEventListener("click", exportController.exportCheckedMarkdown);
  document.querySelector("#guide-export-html").addEventListener("click", () => exportController.exportCheckedRender("html"));
  document.querySelector("#guide-export-pdf").addEventListener("click", () => exportController.exportCheckedRender("pdf"));
  discardDraftButton.addEventListener("click", draftRecoveryController.discardLocalDraft);
  workspaceViewController.bind();
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
  draftRecoveryController.saveDraft();
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
  draftRecoveryController?.render();
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
  outlineController?.render();
  authorCheckController?.markStaleIfChanged();
  currentDiagnostics = previewController.render() || [];
  authorCheckController?.render();
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
  downloadMarkdownFile(input.value, editorFilename());
  saveState.textContent = "Export Markdown pronto";
}

function checkDocument(options = {}) {
  return authorCheckController.checkDocument({
    ...(options instanceof Event ? {} : options),
    schemaDiagnostics: currentDiagnostics
  });
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
      : authorCheckController?.getState() === "stale"
        ? "author check da rifare"
        : "schema ok";
  guideStatus.textContent = `${saveHint}; ${checkHint}; esporta quando il Markdown e pronto.`;
}

function checkedDiagnostics() {
  return authorCheckController?.getDiagnostics(currentDiagnostics) || currentDiagnostics;
}

function editorFilename() {
  return currentDocument || `${slugifyDocumentName(input.value)}.md`;
}
