import { slugifyDocumentName } from "../../scripts/lib/component-schema.js";
import { getDocument } from "./api.js";

export function createDraftRecoveryController({
  storageKey,
  draftMetaKey,
  panel,
  discardButton,
  modalController,
  starterDocument,
  documentPicker,
  getMarkdown,
  setMarkdown,
  getCurrentDocument,
  setCurrentDocument,
  setLastSavedContent,
  setSaveState,
  setDirty,
  syncMetadata,
  renderPreview
}) {
  function loadDraft() {
    const content = localStorage.getItem(storageKey) || "";
    const metadata = readDraftMeta();
    return {
      content,
      currentDocument: content ? metadata.currentDocument || "" : ""
    };
  }

  function saveDraft() {
    localStorage.setItem(storageKey, getMarkdown());
    localStorage.setItem(draftMetaKey, JSON.stringify({
      currentDocument: getCurrentDocument(),
      title: slugifyDocumentName(getMarkdown()),
      updatedAt: new Date().toISOString()
    }));
  }

  function render() {
    const content = localStorage.getItem(storageKey);
    const meta = readDraftMeta();
    const message = panel.querySelector("span");
    panel.classList.toggle("has-draft", Boolean(content));
    discardButton.hidden = !content;

    if (!content) {
      message.textContent = "Nessuna bozza locale da recuperare.";
      return;
    }

    const source = meta.currentDocument ? `docs/${meta.currentDocument}` : "bozza locale";
    const time = meta.updatedAt ? formatDraftTime(meta.updatedAt) : "ora sconosciuta";
    message.textContent = `Bozza autosalvata da ${source}, aggiornata ${time}.`;
  }

  async function discardLocalDraft() {
    if (!localStorage.getItem(storageKey)) return;
    const result = await modalController.confirm({
      title: "Scartare bozza locale?",
      message: "La bozza autosalvata nel browser verra rimossa. Il file salvato in docs, se presente, resta invariato.",
      confirmLabel: "Scarta bozza"
    });
    if (!result.confirmed) return;

    const documentToRestore = getCurrentDocument() || readDraftMeta().currentDocument || "";
    localStorage.removeItem(storageKey);
    localStorage.removeItem(draftMetaKey);

    if (documentToRestore && await restoreDocument(documentToRestore)) return;
    restoreStarterDocument();
  }

  async function restoreDocument(filename) {
    try {
      const document = await getDocument(filename);
      setMarkdown(document.content);
      setCurrentDocument(document.filename);
      setLastSavedContent(document.content);
      syncMetadata();
      setDirty(false);
      renderPreview();
      setSaveState("Bozza locale scartata");
      return true;
    } catch {
      return false;
    }
  }

  function restoreStarterDocument() {
    setMarkdown(starterDocument);
    setCurrentDocument("");
    setLastSavedContent(starterDocument);
    documentPicker.value = "";
    syncMetadata();
    setDirty(false);
    renderPreview();
    setSaveState("Bozza locale scartata");
  }

  function readDraftMeta() {
    try {
      return JSON.parse(localStorage.getItem(draftMetaKey) || "{}");
    } catch {
      return {};
    }
  }

  return { discardLocalDraft, loadDraft, render, saveDraft };
}

function formatDraftTime(value) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "ora sconosciuta";
  return date.toLocaleString("it-IT", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit"
  });
}
