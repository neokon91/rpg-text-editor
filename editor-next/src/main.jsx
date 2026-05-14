import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderMarkdown } from "../../packages/components/preview.js";
import { renderPreviewDocument } from "../../packages/documents/preview-shell.js";
import { parseFrontmatter, serializeFrontmatter } from "../../packages/documents/frontmatter.js";
import { checkDocument, deleteDocument, exportBrowserDocumentsArchive, exportDocument, getBrowserDocumentStorageStats, getDocument, getDocumentRuntimeMode, importBrowserDocumentsArchive, importBrowserMarkdownDocuments, listDocuments, renameDocument, saveDocument, setBrowserOnlyMode } from "../../packages/documents/api.js";
import { countWords, downloadMarkdown } from "../../packages/markdown/editor-actions.js";
import { slugifyDocumentName } from "../../scripts/lib/component-schema.js";
import { useComponentCatalog } from "./app/componentCatalog.js";
import { collectDiagnostics, sameOverflowPages } from "./app/diagnostics.js";
import { useDialogState } from "./app/dialogState.js";
import { starterDocument } from "./app/constants.js";
import { loadBooleanWorkspaceSetting, loadNumberWorkspaceSetting, saveBooleanWorkspaceSetting, workspaceKey } from "./app/workspaceSettings.js";
import { AppDialog } from "./components/AppDialog.jsx";
import { ComponentPalette } from "./components/ComponentPalette.jsx";
import { OnboardingPanel } from "./components/OnboardingPanel.jsx";
import { MarkdownEditor } from "./editor/MarkdownEditor.jsx";
import { insertPageBreakBeforeLine, insertPageBreaksBeforeLines, predictPageBreakLines } from "./editor/pageBreaks.js";
import { DocumentOutline } from "./outline/DocumentOutline.jsx";
import { PreviewFrame } from "./preview/PreviewFrame.jsx";
import { TopMenu } from "./shell/TopMenu.jsx";
import { clearDraft, loadDraft, saveDraft } from "./storage/localDrafts.js";
import "./styles.css";

function App() {
  const editorRef = useRef(null);
  const archiveInputRef = useRef(null);
  const initialMarkdown = useRef(loadDraft() || starterDocument);
  const [markdown, setMarkdown] = useState(() => initialMarkdown.current);
  const {
    enabledPacks,
    externalPacks,
    importExternalPack: upsertExternalPack,
    manifest: componentManifest,
    removeExternalPack: deleteExternalPack,
    schema,
    schemaState,
    togglePack: toggleEnabledPack
  } = useComponentCatalog();
  const [previewVisible, setPreviewVisible] = useState(() => loadBooleanWorkspaceSetting("preview-visible", true));
  const [zoom, setZoom] = useState(() => localStorage.getItem(workspaceKey("zoom")) || "1");
  const [viewport, setViewport] = useState(() => localStorage.getItem(workspaceKey("viewport")) || "desktop");
  const [previewSpread, setPreviewSpread] = useState(() => localStorage.getItem(workspaceKey("preview-spread")) || "single");
  const [autoPaginatePreview, setAutoPaginatePreview] = useState(() => loadBooleanWorkspaceSetting("auto-paginate-preview", false));
  const [syncPreview, setSyncPreview] = useState(() => loadBooleanWorkspaceSetting("sync-preview", false));
  const [onboardingVisible, setOnboardingVisible] = useState(() => loadBooleanWorkspaceSetting("onboarding-visible", true));
  const [mobilePanel, setMobilePanel] = useState(() => localStorage.getItem(workspaceKey("mobile-panel")) || "editor");
  const [activeComponentGroup, setActiveComponentGroup] = useState(() => localStorage.getItem(workspaceKey("component-group")) || "all");
  const [cursorLine, setCursorLine] = useState(null);
  const [selectedLine, setSelectedLine] = useState(() => loadNumberWorkspaceSetting("selected-line"));
  const [documentPanels, setDocumentPanels] = useState(() => ({
    frontmatter: loadBooleanWorkspaceSetting("frontmatter-panel", true),
    outline: loadBooleanWorkspaceSetting("outline-panel", true)
  }));
  const [documents, setDocuments] = useState([]);
  const [currentDocument, setCurrentDocument] = useState("");
  const [documentRuntimeMode, setDocumentRuntimeMode] = useState(() => getDocumentRuntimeMode());
  const [browserStorageStats, setBrowserStorageStats] = useState(() => ({
    count: 0,
    bytes: 0,
    label: "0 B",
    warning: false,
    storage: "browser"
  }));
  const [lastSavedContent, setLastSavedContent] = useState(() => initialMarkdown.current);
  const [status, setStatus] = useState("Bozza locale");
  const [statusDetail, setStatusDetail] = useState("");
  const [authorDiagnostics, setAuthorDiagnostics] = useState([]);
  const [checkedMarkdown, setCheckedMarkdown] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [exportOutputs, setExportOutputs] = useState([]);
  const [pendingBreakReview, setPendingBreakReview] = useState(null);
  const [previewOverflowPages, setPreviewOverflowPages] = useState([]);
  const [isDraggingImport, setIsDraggingImport] = useState(false);
  const { dialog, requestConfirm, requestPrompt, resolveDialog } = useDialogState();

  useEffect(() => {
    saveDraft(markdown);
  }, [markdown]);

  useEffect(() => {
    if (statusDetail && !/export/i.test(status)) setStatusDetail("");
  }, [status, statusDetail]);

  useEffect(() => {
    refreshDocuments();
  }, []);

  useEffect(() => {
    saveBooleanWorkspaceSetting("preview-visible", previewVisible);
  }, [previewVisible]);

  useEffect(() => {
    localStorage.setItem(workspaceKey("zoom"), zoom);
  }, [zoom]);

  useEffect(() => {
    localStorage.setItem(workspaceKey("viewport"), viewport);
  }, [viewport]);

  useEffect(() => {
    localStorage.setItem(workspaceKey("preview-spread"), previewSpread);
  }, [previewSpread]);

  useEffect(() => {
    saveBooleanWorkspaceSetting("auto-paginate-preview", autoPaginatePreview);
  }, [autoPaginatePreview]);

  useEffect(() => {
    saveBooleanWorkspaceSetting("sync-preview", syncPreview);
  }, [syncPreview]);

  useEffect(() => {
    saveBooleanWorkspaceSetting("onboarding-visible", onboardingVisible);
  }, [onboardingVisible]);

  useEffect(() => {
    localStorage.setItem(workspaceKey("mobile-panel"), mobilePanel);
  }, [mobilePanel]);

  useEffect(() => {
    localStorage.setItem(workspaceKey("component-group"), activeComponentGroup);
  }, [activeComponentGroup]);

  useEffect(() => {
    if (selectedLine) {
      localStorage.setItem(workspaceKey("selected-line"), String(selectedLine));
    } else {
      localStorage.removeItem(workspaceKey("selected-line"));
    }
  }, [selectedLine]);

  useEffect(() => {
    saveBooleanWorkspaceSetting("frontmatter-panel", documentPanels.frontmatter);
    saveBooleanWorkspaceSetting("outline-panel", documentPanels.outline);
  }, [documentPanels]);

  const parsed = useMemo(() => parseFrontmatter(markdown), [markdown]);
  const previewHtml = useMemo(() => {
    const content = renderMarkdown(parsed.body, schema, { startLine: parsed.bodyStartLine });
    return renderPreviewDocument(parsed.metadata, content, {
      viewport,
      autoPaginate: autoPaginatePreview,
      assetBase: runtimeAssetBase()
    });
  }, [autoPaginatePreview, parsed, schema, viewport]);
  const diagnostics = useMemo(() => collectDiagnostics(markdown, schema), [markdown, schema]);
  const activeAuthorDiagnostics = checkedMarkdown === markdown ? authorDiagnostics : [];
  const combinedDiagnostics = useMemo(
    () => [...diagnostics, ...activeAuthorDiagnostics],
    [diagnostics, activeAuthorDiagnostics]
  );
  const words = useMemo(() => countWords(parsed.body), [parsed.body]);
  const title = parsed.metadata.title || "Bozza locale";
  const isDirty = markdown !== lastSavedContent;
  const filename = currentDocument || `${slugifyDocumentName(markdown)}.md`;

  function updateMarkdown(nextMarkdown) {
    setMarkdown(nextMarkdown);
    setExportOutputs([]);
  }

  async function resetDraft() {
    if (isDirty) {
      const confirmed = await requestConfirm({
        title: "Nuova bozza",
        message: "Scartare le modifiche non salvate e tornare al documento iniziale?",
        confirmLabel: "Scarta"
      });
      if (!confirmed) return;
    }
    clearDraft();
    setMarkdown(starterDocument);
    setCurrentDocument("");
    setLastSavedContent(starterDocument);
    setAuthorDiagnostics([]);
    setCheckedMarkdown("");
    setExportOutputs([]);
    setSelectedLine(null);
    setStatus("Nuova bozza locale");
  }

  function insertSnippet(snippet) {
    insertMarkdown(`\n\n${snippet}\n`);
  }

  function insertMarkdown(snippet) {
    if (editorRef.current) {
      editorRef.current.insertText(snippet);
    } else {
      setMarkdown((current) => `${current.trimEnd()}${snippet}`);
    }
    setExportOutputs([]);
  }

  function insertPageBreakAtSelection() {
    const targetLine = selectedLine || editorRef.current?.getCursorLine();
    if (!targetLine) return;
    let breakLine = targetLine;
    let contentLine = targetLine;
    let inserted = false;
    setMarkdown((current) => {
      const result = insertPageBreakBeforeLine(current, targetLine);
      breakLine = result.breakLine;
      contentLine = result.contentLine;
      inserted = result.inserted;
      return result.markdown;
    });
    setSelectedLine(breakLine);
    setPendingBreakReview(inserted ? { breakLine, contentLine } : null);
    setStatus(inserted ? `Page break inserito alla riga ${breakLine}; contenuto da riga ${contentLine}` : `Page break gia vicino alla riga ${breakLine}`);
    setExportOutputs([]);
  }

  function insertPageBreaksAtOverflow() {
    const overflowLines = previewOverflowPages.map((item) => item.line).filter(Boolean);
    if (!overflowLines.length) {
      setStatus("Nessun overflow preview da spezzare");
      return;
    }

    const plannedLines = predictPageBreakLines(markdown, overflowLines);
    const result = insertPageBreaksBeforeLines(markdown, plannedLines);
    setMarkdown(result.markdown);

    if (result.inserted) {
      setSelectedLine(result.breaks[0].breakLine);
      setPendingBreakReview(null);
      setStatus(`Auto break: ${result.inserted} page break predittivi inseriti`);
    } else {
      setStatus("Auto break: page break gia presenti vicino agli overflow");
    }
    setExportOutputs([]);
  }

  function handleOverflowChange(overflowPages) {
    setPreviewOverflowPages((current) => sameOverflowPages(current, overflowPages) ? current : overflowPages);
    reviewBreakOverflow(overflowPages);
  }

  function reviewBreakOverflow(overflowPages) {
    if (!pendingBreakReview) return;

    const residualOverflow = overflowPages.find((item) => item.line > pendingBreakReview.breakLine);
    if (residualOverflow) {
      setSelectedLine(residualOverflow.line);
      setStatus(`Overflow residuo: prossima pagina ${residualOverflow.page}, riga ${residualOverflow.line}`);
    } else {
      setStatus(`Page break inserito alla riga ${pendingBreakReview.breakLine}; overflow risolto`);
    }
    setPendingBreakReview(null);
  }

  function togglePack(packId) {
    toggleEnabledPack(packId);
    setExportOutputs([]);
  }

  function importExternalPack(pack) {
    const normalized = upsertExternalPack(pack);
    setStatus(`Pack esterno caricato: ${normalized.name}`);
    setExportOutputs([]);
  }

  function removeExternalPack(packId) {
    deleteExternalPack(packId);
    setStatus("Pack esterno rimosso");
    setExportOutputs([]);
  }

  function updateMetadata(key, value) {
    const { metadata, body } = parseFrontmatter(markdown);
    const nextMetadata = { ...metadata, [key]: value };
    setMarkdown(`${serializeFrontmatter(nextMetadata)}\n\n${body}`);
    setExportOutputs([]);
  }

  function toggleDocumentPanel(panel) {
    setDocumentPanels((current) => ({
      ...current,
      [panel]: !current[panel]
    }));
  }

  async function refreshDocuments() {
    try {
      const result = await listDocuments();
      setDocuments(result.documents || []);
    } catch {
      setStatus("Lista documenti non disponibile");
    } finally {
      setDocumentRuntimeMode(getDocumentRuntimeMode());
      setBrowserStorageStats(await getBrowserDocumentStorageStats());
    }
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

  function documentLabel(filename) {
    return `${getDocumentRuntimeMode() === "browser" ? "browser" : "docs"}/${filename}`;
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
      setAuthorDiagnostics([]);
      setCheckedMarkdown("");
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

  function openStarterGuide() {
    setPreviewVisible(true);
    setMobilePanel("editor");
    setSelectedLine(1);
    setStatus("Guida: modifica a sinistra, controlla la preview, poi esporta PDF");
  }

  async function exportBrowserArchive() {
    const result = await exportBrowserDocumentsArchive();
    setExportOutputs([{ path: result.path, url: result.url }]);
    setStatus(`Backup browser pronto: ${result.count} documenti`);
    setDocumentRuntimeMode(getDocumentRuntimeMode());
    setBrowserStorageStats(await getBrowserDocumentStorageStats());
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
        setAuthorDiagnostics([]);
        setCheckedMarkdown("");
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

  async function runCheck({ focus = true } = {}) {
    setIsChecking(true);
    setExportOutputs([]);
    try {
      const result = await checkDocument({ filename, content: markdown });
      const nextAuthorDiagnostics = result.diagnostics || [];
      const allDiagnostics = [...diagnostics, ...nextAuthorDiagnostics];
      setAuthorDiagnostics(nextAuthorDiagnostics);
      setCheckedMarkdown(markdown);
      const firstBlocking = allDiagnostics.find((item) => item.severity === "error") || allDiagnostics[0];
      if (firstBlocking && focus) setSelectedLine(firstBlocking.line);
      setStatus(firstBlocking
        ? firstBlocking.severity === "error" ? "Check: errori da correggere" : "Check: avvisi presenti"
        : "Check completo ok");
      return { ok: !allDiagnostics.some((item) => item.severity === "error"), diagnostics: allDiagnostics };
    } catch {
      const failed = [{
        severity: "error",
        line: 1,
        message: "Author check non disponibile.",
        fix: "Verifica che il server editor-next sia attivo."
      }];
      setAuthorDiagnostics(failed);
      setCheckedMarkdown(markdown);
      setStatus("Check non disponibile");
      return { ok: false, diagnostics: [...diagnostics, ...failed] };
    } finally {
      setIsChecking(false);
      setDocumentRuntimeMode(getDocumentRuntimeMode());
    }
  }

  async function exportChecked(format) {
    const result = await runCheck({ focus: true });
    if (!result.ok) {
      setStatus("Export bloccato: correggi gli errori");
      return;
    }

    if (format === "markdown") {
      downloadCurrentMarkdown();
      return;
    }

    setStatus(`Export ${format.toUpperCase()} in corso...`);
    setStatusDetail("");
    try {
      const exportResult = await exportDocument({ filename, content: markdown, format, autoPaginate: autoPaginatePreview });
      setExportOutputs(exportResult.outputs || []);
      setStatus(`Export ${format.toUpperCase()} pronto`);
      setStatusDetail("");
    } catch (error) {
      setExportOutputs([]);
      setStatus(error.message || "Export non riuscito");
      setStatusDetail(error.log || "");
    } finally {
      setDocumentRuntimeMode(getDocumentRuntimeMode());
    }
  }

  return (
    <main
      className="next-shell"
      data-preview={previewVisible ? "on" : "off"}
      data-mobile-panel={mobilePanel}
      data-import-drag={isDraggingImport ? "on" : "off"}
      onDragEnter={handleImportDrag}
      onDragOver={handleImportDrag}
      onDragLeave={clearImportDrag}
      onDrop={handleImportDrop}
    >
      <TopMenu
        title={title}
        words={words}
        schemaState={schemaState}
        diagnostics={combinedDiagnostics}
        documents={documents}
        currentDocument={currentDocument}
        documentRuntimeMode={documentRuntimeMode}
        browserStorageStats={browserStorageStats}
        isDirty={isDirty}
        status={status}
        statusDetail={statusDetail}
        isChecking={isChecking}
        exportOutputs={exportOutputs}
        previewVisible={previewVisible}
        syncPreview={syncPreview}
        mobilePanel={mobilePanel}
        viewport={viewport}
        zoom={zoom}
        onOpenDocument={openDocument}
        onSave={saveCurrent}
        onSaveCopy={saveCopy}
        onRename={renameCurrent}
        onDelete={deleteCurrent}
        onDownloadMarkdown={downloadCurrentMarkdown}
        onExportBrowserArchive={exportBrowserArchive}
        onImportBrowserArchive={selectBrowserArchive}
        onCheck={runCheck}
        onExport={exportChecked}
        onRefreshDocuments={refreshDocuments}
        onToggleDocumentRuntimeMode={toggleDocumentRuntimeMode}
        onTogglePreview={() => setPreviewVisible((value) => !value)}
        onToggleSyncPreview={() => setSyncPreview((value) => !value)}
        onToggleOnboarding={() => setOnboardingVisible((value) => !value)}
        onMobilePanelChange={setMobilePanel}
        onViewportChange={setViewport}
        onZoomChange={setZoom}
        onResetDraft={resetDraft}
        onInsertSnippet={insertSnippet}
        onInsertPageBreakAtSelection={insertPageBreakAtSelection}
        onInsertPageBreaksAtOverflow={insertPageBreaksAtOverflow}
      />
      <input
        ref={archiveInputRef}
        type="file"
        accept="application/json,text/markdown,.json,.md"
        multiple
        hidden
        onChange={importBrowserArchive}
      />
      {onboardingVisible ? (
        <OnboardingPanel
          isChecking={isChecking}
          onShowExample={openStarterGuide}
          onImport={selectBrowserArchive}
          onExportPdf={() => exportChecked("pdf")}
          onHide={() => setOnboardingVisible(false)}
        />
      ) : null}
      <section className="next-workspace">
        <ComponentPalette
          schema={schema}
          packs={componentManifest?.packs || []}
          enabledPackIds={enabledPacks}
          externalPacks={externalPacks}
          activeGroup={activeComponentGroup}
          onTogglePack={togglePack}
          onImportExternalPack={importExternalPack}
          onRemoveExternalPack={removeExternalPack}
          onActiveGroupChange={setActiveComponentGroup}
          onInsert={insertMarkdown}
        />
        <MarkdownEditor
          ref={editorRef}
          markdown={markdown}
          selectedLine={selectedLine}
          onChange={updateMarkdown}
          onCursorLineChange={setCursorLine}
        />
        {previewVisible ? (
          <PreviewFrame
            html={previewHtml}
            zoom={zoom}
            viewport={viewport}
            spread={previewSpread}
            autoPaginate={autoPaginatePreview}
            syncSourceLine={syncPreview ? cursorLine : null}
            onOverflowChange={handleOverflowChange}
            onSelectLine={setSelectedLine}
            onZoomChange={setZoom}
            onSpreadChange={setPreviewSpread}
            onAutoPaginateChange={setAutoPaginatePreview}
          />
        ) : null}
        <DocumentOutline
          markdown={markdown}
          metadata={parsed.metadata}
          selectedLine={selectedLine}
          panels={documentPanels}
          onMetadataChange={updateMetadata}
          onSelectLine={setSelectedLine}
          onTogglePanel={toggleDocumentPanel}
        />
      </section>
      {dialog ? (
        <AppDialog
          dialog={dialog}
          onCancel={() => resolveDialog(null)}
          onConfirm={resolveDialog}
        />
      ) : null}
    </main>
  );
}

createRoot(document.querySelector("#root")).render(<App />);

function runtimeAssetBase() {
  const viteBase = import.meta.env?.BASE_URL || "/";
  if (viteBase === "./" || viteBase === "") return new URL("./", window.location.href).href;
  return viteBase;
}
