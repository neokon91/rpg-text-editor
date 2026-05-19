import { useEffect, useRef, useState } from "react";
import {
  deleteDocument,
  exportBrowserDocumentsArchive,
  getBrowserDocumentStorageStats,
  getDocument,
  getDocumentRuntimeMode,
  importBrowserDocumentsArchive,
  importBrowserMarkdownDocuments,
  listDocuments,
  renameDocument,
  saveDocument,
  setBrowserOnlyMode
} from "../../../packages/documents/api.js";
import { downloadMarkdown } from "../../../packages/markdown/editor-actions.js";
import { slugifyDocumentName } from "../../../scripts/lib/component-schema.js";
import { clearDraft } from "../storage/localDrafts.js";

const initialBrowserStorageStats = {
  count: 0,
  bytes: 0,
  label: "0 B",
  warning: false,
  storage: "browser"
};

export function useEditorDocuments({
  markdown,
  initialMarkdown,
  onClearDocumentDiagnostics,
  requestConfirm,
  requestPrompt,
  setExportOutputs,
  setMarkdown,
  setStatus
}) {
  const archiveInputRef = useRef(null);
  const [documents, setDocuments] = useState([]);
  const [currentDocument, setCurrentDocument] = useState("");
  const [documentRuntimeMode, setDocumentRuntimeMode] = useState(() => getDocumentRuntimeMode());
  const [browserStorageStats, setBrowserStorageStats] = useState(() => initialBrowserStorageStats);
  const [lastSavedContent, setLastSavedContent] = useState(() => initialMarkdown);
  const [isDraggingImport, setIsDraggingImport] = useState(false);
  const isDirty = markdown !== lastSavedContent;
  const filename = currentDocument || `${slugifyDocumentName(markdown)}.md`;

  useEffect(() => {
    refreshDocuments();
  }, []);

  async function refreshDocuments() {
    try {
      const result = await listDocuments();
      setDocuments(result.documents || []);
    } catch {
      setStatus("Lista documenti non disponibile");
    } finally {
      await refreshDocumentRuntimeState();
    }
  }

  async function refreshDocumentRuntimeState() {
    setDocumentRuntimeMode(getDocumentRuntimeMode());
    setBrowserStorageStats(await getBrowserDocumentStorageStats());
  }

  async function toggleDocumentRuntimeMode() {
    const enableBrowserOnly = documentRuntimeMode !== "browser";
    setBrowserOnlyMode(enableBrowserOnly);
    setDocumentRuntimeMode(getDocumentRuntimeMode());
    setDocuments([]);
    setCurrentDocument("");
    setLastSavedContent(markdown);
    setExportOutputs([]);
    setStatus(enableBrowserOnly ? "Modalita Browser-only attiva" : "Tentativo server locale");
    await refreshDocuments();
  }

  function resetDocumentState(content) {
    setCurrentDocument("");
    setLastSavedContent(content);
  }

  function documentLabel(documentFilename) {
    return `${getDocumentRuntimeMode() === "browser" ? "browser" : "docs"}/${documentFilename}`;
  }

  async function openDocument(nextFilename) {
    if (!nextFilename) return;
    if (isDirty) {
      const confirmed = await requestConfirm({
        title: "Apri documento",
        message: "Scartare le modifiche non salvate e aprire un altro documento?",
        confirmLabel: "Apri"
      });
      if (!confirmed) return;
    }

    try {
      const document = await getDocument(nextFilename);
      setMarkdown(document.content);
      setCurrentDocument(document.filename);
      setLastSavedContent(document.content);
      onClearDocumentDiagnostics();
      setExportOutputs([]);
      setStatus(`Aperto ${documentLabel(document.filename)}`);
    } catch {
      setStatus("Import non riuscito");
    } finally {
      setDocumentRuntimeMode(getDocumentRuntimeMode());
    }
  }

  async function saveCurrent() {
    try {
      const result = await saveDocument({
        filename,
        content: markdown,
        overwrite: Boolean(currentDocument)
      });
      setCurrentDocument(result.filename);
      setLastSavedContent(markdown);
      clearDraft();
      await refreshDocuments();
      setStatus(`Salvato ${documentLabel(result.filename)}`);
    } catch (error) {
      setStatus(error.status === 409 ? "File gia esistente: usa Salva copia" : "Salvataggio non riuscito");
    } finally {
      setDocumentRuntimeMode(getDocumentRuntimeMode());
    }
  }

  async function saveCopy() {
    try {
      const result = await saveDocument({
        filename,
        content: markdown,
        unique: true
      });
      setCurrentDocument(result.filename);
      setLastSavedContent(markdown);
      clearDraft();
      await refreshDocuments();
      setStatus(`Salvato nuovo ${documentLabel(result.filename)}`);
    } catch {
      setStatus("Salva copia non riuscito");
    } finally {
      setDocumentRuntimeMode(getDocumentRuntimeMode());
    }
  }

  async function renameCurrent() {
    if (!currentDocument) {
      setStatus("Apri o salva un documento prima di rinominarlo");
      return;
    }
    if (isDirty) {
      setStatus("Salva le modifiche prima di rinominare");
      return;
    }

    const nextName = await requestPrompt({
      title: "Rinomina documento",
      message: "Inserisci il nuovo nome file Markdown.",
      defaultValue: currentDocument,
      confirmLabel: "Rinomina"
    });
    if (!nextName || nextName === currentDocument) return;

    try {
      const result = await renameDocument(currentDocument, nextName);
      setCurrentDocument(result.filename);
      await refreshDocuments();
      setStatus(`Rinominato ${documentLabel(result.filename)}`);
    } catch (error) {
      setStatus(error.status === 409 ? "Rename non riuscito: file gia esistente" : "Rename non riuscito");
    } finally {
      setDocumentRuntimeMode(getDocumentRuntimeMode());
    }
  }

  async function deleteCurrent() {
    if (!currentDocument) {
      setStatus("Apri o salva un documento prima di eliminarlo");
      return;
    }
    const confirmed = await requestConfirm({
      title: "Elimina documento",
      message: `Eliminare definitivamente ${documentLabel(currentDocument)}?`,
      confirmLabel: "Elimina"
    });
    if (!confirmed) return;

    try {
      const deleted = currentDocument;
      await deleteDocument(currentDocument);
      setCurrentDocument("");
      setLastSavedContent(markdown);
      await refreshDocuments();
      setStatus(`Eliminato ${documentLabel(deleted)}`);
    } catch {
      setStatus("Eliminazione non riuscita");
    } finally {
      setDocumentRuntimeMode(getDocumentRuntimeMode());
    }
  }

  function downloadCurrentMarkdown() {
    downloadMarkdown(markdown, filename);
    setStatus("Download Markdown pronto");
  }

  async function exportBrowserArchive() {
    const result = await exportBrowserDocumentsArchive();
    setExportOutputs([{ path: result.path, url: result.url }]);
    setStatus(`Backup browser pronto: ${result.count} documenti`);
    await refreshDocumentRuntimeState();
  }

  function selectBrowserArchive() {
    archiveInputRef.current?.click();
  }

  async function importBrowserArchive(event) {
    const files = Array.from(event.target.files || []);
    event.target.value = "";
    await importBrowserFiles(files);
  }

  async function importBrowserFiles(files) {
    if (!files.length) return;

    try {
      const markdownFiles = files.filter((file) => /\.md$/i.test(file.name || ""));
      const isMarkdown = markdownFiles.length > 0;
      const result = isMarkdown
        ? await importBrowserMarkdownDocuments(markdownFiles)
        : await importBrowserDocumentsArchive(files[0]);
      await refreshDocuments();
      const importedFilename = result.imported?.[0];
      if (importedFilename) {
        const importedDocument = await getDocument(importedFilename);
        setMarkdown(importedDocument.content);
        setCurrentDocument(importedDocument.filename);
        setLastSavedContent(importedDocument.content);
        onClearDocumentDiagnostics();
      } else {
        setCurrentDocument("");
      }
      setExportOutputs([]);
      setBrowserStorageStats(await getBrowserDocumentStorageStats());
      const kind = isMarkdown ? "Markdown" : "browser";
      setStatus(result.renamed
        ? `Import ${kind} completato: ${result.count} documenti, ${result.renamed} rinominati`
        : `Import ${kind} completato: ${result.count} documenti`);
    } catch {
      setStatus("Import browser non riuscito");
    } finally {
      setDocumentRuntimeMode(getDocumentRuntimeMode());
    }
  }

  function handleImportDrag(event) {
    if (!Array.from(event.dataTransfer?.types || []).includes("Files")) return;
    event.preventDefault();
    setIsDraggingImport(true);
  }

  function clearImportDrag(event) {
    if (event.currentTarget.contains(event.relatedTarget)) return;
    setIsDraggingImport(false);
  }

  async function handleImportDrop(event) {
    event.preventDefault();
    setIsDraggingImport(false);
    await importBrowserFiles(Array.from(event.dataTransfer?.files || []));
  }

  return {
    archiveInputRef,
    browserStorageStats,
    currentDocument,
    documentRuntimeMode,
    documents,
    filename,
    isDirty,
    isDraggingImport,
    clearImportDrag,
    deleteCurrent,
    downloadCurrentMarkdown,
    exportBrowserArchive,
    handleImportDrag,
    handleImportDrop,
    importBrowserArchive,
    openDocument,
    refreshDocuments,
    refreshDocumentRuntimeState,
    renameCurrent,
    resetDocumentState,
    saveCopy,
    saveCurrent,
    selectBrowserArchive,
    toggleDocumentRuntimeMode
  };
}
