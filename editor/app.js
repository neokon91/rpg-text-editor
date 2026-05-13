import { slugifyDocumentName } from "/scripts/lib/component-schema.js";
import { createComponentController } from "/editor/components/controller.js";
import { createDocumentController } from "/editor/documents/controller.js";
import { createMetadataController } from "/editor/documents/metadata-controller.js";
import {
  copyMarkdown as copyMarkdownToClipboard,
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
const documentPicker = document.querySelector("#document-picker");
const packList = document.querySelector("#pack-list");
const metadataControls = [...document.querySelectorAll("[data-meta]")];
const toolbar = document.querySelector(".editor-toolbar");
const currentDocumentLabel = document.querySelector("#current-document");
const dirtyState = document.querySelector("#dirty-state");
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

init();

async function init() {
  componentController = createComponentController({
    componentList,
    componentSearch,
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
    getMarkdown: () => input.value,
    getSchema: () => componentController.schema
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

  input.addEventListener("input", () => {
    persistEditorChange();
    syncMetadata();
  });

  toolbar.addEventListener("click", handleToolbarClick);
  document.querySelector("#new-document").addEventListener("click", resetDraft);
  document.querySelector("#copy-markdown").addEventListener("click", copyMarkdown);
  document.querySelector("#download-markdown").addEventListener("click", downloadMarkdown);
  document.querySelector("#save-document").addEventListener("click", documentController.saveCurrent);
  document.querySelector("#save-copy").addEventListener("click", documentController.saveCopy);
  document.querySelector("#rename-document").addEventListener("click", documentController.renameCurrent);
  document.querySelector("#delete-document").addEventListener("click", documentController.deleteCurrent);
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
  previewController.render();
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
}
