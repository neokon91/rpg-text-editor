import { slugifyDocumentName } from "/scripts/lib/component-schema.js";
import { deleteDocument, getDocument, listDocuments, renameDocument, saveDocument } from "/editor/documents/api.js";

export function createDocumentController({
  documentPicker,
  storageKey,
  draftMetaKey,
  getMarkdown,
  setMarkdown,
  getCurrentDocument,
  setCurrentDocument,
  getIsDirty,
  setLastSavedContent,
  setSaveState,
  setDirty,
  syncMetadataForm,
  renderPreview,
  confirmDiscardChanges,
  requestRename,
  confirmDelete
}) {
  async function refreshPicker(selected = "") {
    let documents;
    try {
      ({ documents } = await listDocuments());
    } catch {
      return;
    }

    documentPicker.replaceChildren(new Option("Apri documento", ""));
    for (const document of documents) {
      documentPicker.append(new Option(document.title || document.filename, document.filename));
    }
    documentPicker.value = selected;
  }

  async function saveCurrent() {
    const markdown = getMarkdown();
    const currentDocument = getCurrentDocument();
    const filename = currentDocument || `${slugifyDocumentName(markdown)}.md`;
    let result;

    try {
      result = await saveDocument({ filename, content: markdown, overwrite: Boolean(currentDocument) });
    } catch (error) {
      setSaveState(error.status === 409 ? "File gia esistente" : "Salvataggio non riuscito");
      return;
    }

    setCurrentDocument(result.filename);
    setLastSavedContent(markdown);
    localStorage.removeItem(storageKey);
    localStorage.removeItem(draftMetaKey);
    setDirty(false);
    await refreshPicker(result.filename);
  }

  async function saveCopy() {
    const markdown = getMarkdown();
    let result;

    try {
      result = await saveDocument({
        filename: `${slugifyDocumentName(markdown)}.md`,
        content: markdown,
        unique: true
      });
    } catch {
      setSaveState("Salva nuovo non riuscito");
      return;
    }

    setCurrentDocument(result.filename);
    setLastSavedContent(markdown);
    localStorage.removeItem(storageKey);
    localStorage.removeItem(draftMetaKey);
    setDirty(false);
    await refreshPicker(result.filename);
  }

  async function importSelected() {
    if (!documentPicker.value) return;
    const selected = documentPicker.value;

    if (!(await confirmDiscardChanges())) {
      documentPicker.value = getCurrentDocument();
      return;
    }

    let document;
    try {
      document = await getDocument(selected);
    } catch {
      setSaveState("Import non riuscito");
      return;
    }

    setMarkdown(document.content);
    setCurrentDocument(document.filename);
    setLastSavedContent(document.content);
    localStorage.removeItem(storageKey);
    localStorage.removeItem(draftMetaKey);
    syncMetadataForm();
    setDirty(false);
    renderPreview();
  }

  async function resetToDraft(markdown) {
    if (!(await confirmDiscardChanges())) return;
    setMarkdown(markdown);
    setCurrentDocument("");
    setLastSavedContent(markdown);
    localStorage.setItem(storageKey, markdown);
    localStorage.setItem(draftMetaKey, JSON.stringify({
      currentDocument: "",
      title: slugifyDocumentName(markdown),
      updatedAt: new Date().toISOString()
    }));
    syncMetadataForm();
    setDirty(true);
    renderPreview();
    documentPicker.value = "";
  }

  async function renameCurrent() {
    const currentDocument = getCurrentDocument();
    if (!currentDocument) {
      setSaveState("Apri o salva un documento prima di rinominarlo");
      return;
    }

    const suggested = currentDocument.replace(/\.md$/i, "");
    const requested = await requestRename(suggested);
    if (!requested) return;

    let result;
    try {
      result = await renameDocument(currentDocument, requested);
    } catch (error) {
      setSaveState(error.status === 409 ? "File gia esistente" : "Rinomina non riuscita");
      return;
    }

    setCurrentDocument(result.filename);
    setDirty(getIsDirty());
    setSaveState("Documento rinominato");
    await refreshPicker(result.filename);
  }

  async function deleteCurrent() {
    const currentDocument = getCurrentDocument();
    if (!currentDocument) {
      setSaveState("Apri un documento prima di eliminarlo");
      return;
    }

    if (!(await confirmDelete(currentDocument))) return;

    try {
      await deleteDocument(currentDocument);
    } catch {
      setSaveState("Eliminazione non riuscita");
      return;
    }

    setMarkdown("");
    setCurrentDocument("");
    setLastSavedContent("");
    localStorage.removeItem(storageKey);
    localStorage.removeItem(draftMetaKey);
    syncMetadataForm();
    setDirty(false);
    renderPreview();
    setSaveState("Documento eliminato");
    await refreshPicker();
  }

  return {
    deleteCurrent,
    importSelected,
    refreshPicker,
    renameCurrent,
    resetToDraft,
    saveCopy,
    saveCurrent
  };
}
