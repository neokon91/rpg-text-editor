import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderMarkdown } from "../../packages/components/preview.js";
import { renderPreviewDocument } from "../../packages/documents/preview-shell.js";
import { parseFrontmatter, serializeFrontmatter } from "../../packages/documents/frontmatter.js";
import { countWords } from "../../packages/markdown/editor-actions.js";
import { useComponentCatalog } from "./app/componentCatalog.js";
import { collectDiagnostics } from "./app/diagnostics.js";
import { useDialogState } from "./app/dialogState.js";
import { starterDocument } from "./app/constants.js";
import { useEditorChecks } from "./app/useEditorChecks.js";
import { useEditorDocuments } from "./app/useEditorDocuments.js";
import { useEditorPreferences } from "./app/useEditorPreferences.js";
import { usePreviewBreaks } from "./app/usePreviewBreaks.js";
import { AppDialog } from "./components/AppDialog.jsx";
import { ComponentPalette } from "./components/ComponentPalette.jsx";
import { OnboardingPanel } from "./components/OnboardingPanel.jsx";
import { MarkdownEditor } from "./editor/MarkdownEditor.jsx";
import { DocumentOutline } from "./outline/DocumentOutline.jsx";
import { PreviewFrame } from "./preview/PreviewFrame.jsx";
import { TopMenu } from "./shell/TopMenu.jsx";
import { clearDraft, loadDraft, saveDraft } from "./storage/localDrafts.js";
import "./styles.css";

function App() {
  const editorRef = useRef(null);
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
  const {
    activeComponentGroup,
    autoPaginatePreview,
    documentPanels,
    mobilePanel,
    onboardingVisible,
    previewSpread,
    previewVisible,
    selectedLine,
    syncPreview,
    viewport,
    zoom,
    setActiveComponentGroup,
    setAutoPaginatePreview,
    setMobilePanel,
    setOnboardingVisible,
    setPreviewSpread,
    setPreviewVisible,
    setSelectedLine,
    setSyncPreview,
    setViewport,
    setZoom,
    toggleDocumentPanel
  } = useEditorPreferences();
  const [cursorLine, setCursorLine] = useState(null);
  const [status, setStatus] = useState("Bozza locale");
  const [exportOutputs, setExportOutputs] = useState([]);
  const { dialog, requestConfirm, requestPrompt, resolveDialog } = useDialogState();
  const {
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
  } = useEditorDocuments({
    markdown,
    initialMarkdown: initialMarkdown.current,
    onClearDocumentDiagnostics: () => clearDocumentDiagnostics(),
    requestConfirm,
    requestPrompt,
    setExportOutputs,
    setMarkdown,
    setStatus
  });

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
  const {
    combinedDiagnostics,
    isChecking,
    statusDetail,
    clearDocumentDiagnostics,
    clearExportOutputs,
    exportChecked,
    runCheck
  } = useEditorChecks({
    autoPaginatePreview,
    diagnostics,
    downloadCurrentMarkdown,
    filename,
    markdown,
    refreshDocumentRuntimeState,
    setExportOutputs,
    setSelectedLine,
    setStatus
  });
  const words = useMemo(() => countWords(parsed.body), [parsed.body]);
  const title = parsed.metadata.title || "Bozza locale";
  const {
    handleOverflowChange,
    insertPageBreakAtSelection,
    insertPageBreaksAtOverflow
  } = usePreviewBreaks({
    clearExportOutputs,
    editorRef,
    markdown,
    selectedLine,
    setMarkdown,
    setSelectedLine,
    setStatus
  });

  useEffect(() => {
    saveDraft(markdown);
  }, [markdown]);

  function updateMarkdown(nextMarkdown) {
    setMarkdown(nextMarkdown);
    clearExportOutputs();
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
    resetDocumentState(starterDocument);
    clearDocumentDiagnostics();
    clearExportOutputs();
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
    clearExportOutputs();
  }

  function togglePack(packId) {
    toggleEnabledPack(packId);
    clearExportOutputs();
  }

  function importExternalPack(pack) {
    const normalized = upsertExternalPack(pack);
    setStatus(`Pack esterno caricato: ${normalized.name}`);
    clearExportOutputs();
  }

  function removeExternalPack(packId) {
    deleteExternalPack(packId);
    setStatus("Pack esterno rimosso");
    clearExportOutputs();
  }

  function updateMetadata(key, value) {
    const { metadata, body } = parseFrontmatter(markdown);
    const nextMetadata = { ...metadata, [key]: value };
    setMarkdown(`${serializeFrontmatter(nextMetadata)}\n\n${body}`);
    clearExportOutputs();
  }

  function openStarterGuide() {
    setPreviewVisible(true);
    setMobilePanel("editor");
    setSelectedLine(1);
    setStatus("Guida: modifica a sinistra, controlla la preview, poi esporta PDF");
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
