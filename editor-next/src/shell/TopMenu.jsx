const snippets = {
  scene: "## Nuova scena\n\nDescrivi qui obiettivo, conflitto e uscita.",
  readaloud: "::: readaloud Da leggere al tavolo\nTesto da leggere al tavolo.\n:::",
  note: "::: note Nota\nPromemoria per il master.\n:::",
  encounter: "::: encounter Incontro\nname: Nuovo incontro\nbody: Obiettivo, minaccia e complicazione.\n:::",
  table: "::: random-table Tabella\nname: Tabella casuale\ndie: d6\nrow: 1 | Evento\nrow: 2 | Svolta inattesa\n:::",
  include: '<rpg-include src="content/monsters/custode-ossa.html"></rpg-include>',
  image: '![Mappa santuario sepolto](assets/images/maps/santuario-sepolto-map.svg)',
  pagebreak: "::pagebreak"
};

const zoomOptions = ["0.75", "0.9", "1", "1.1", "1.25"];

export function TopMenu({
  title,
  words,
  schemaState,
  diagnostics,
  documents,
  currentDocument,
  documentRuntimeMode,
  isDirty,
  status,
  statusDetail,
  isChecking,
  exportOutputs,
  previewVisible,
  syncPreview,
  mobilePanel,
  viewport,
  zoom,
  onOpenDocument,
  onSave,
  onSaveCopy,
  onRename,
  onDelete,
  onDownloadMarkdown,
  onExportBrowserArchive,
  onImportBrowserArchive,
  onCheck,
  onExport,
  onRefreshDocuments,
  onToggleDocumentRuntimeMode,
  onTogglePreview,
  onToggleSyncPreview,
  onMobilePanelChange,
  onViewportChange,
  onZoomChange,
  onResetDraft,
  onInsertSnippet,
  onInsertPageBreakAtSelection,
  onInsertPageBreaksAtOverflow
}) {
  const errors = diagnostics.filter((item) => item.severity === "error").length;
  const warnings = diagnostics.filter((item) => item.severity === "warning").length;
  const checkStatus = errors ? `${errors} errori` : warnings ? `${warnings} avvisi` : "Check ok";
  const runtimeLabel = documentRuntimeMode === "browser" ? "Browser-only" : "Server locale";
  const visibleZoomOptions = zoomOptions.includes(zoom) ? zoomOptions : [...zoomOptions, zoom];
  const statusState = statusDetail || /non riuscito|bloccato|errore|errori|non disponibile/i.test(status)
    ? "error"
    : /in corso|\.\.\./i.test(status)
      ? "busy"
      : /avvisi|gia|modifiche/i.test(status)
        ? "warning"
        : "ok";

  return (
    <header className="next-topbar">
      <div className="next-brand">
        <strong>RPG Text Editor Next</strong>
        <span>{currentDocument ? `docs/${currentDocument}` : title}{isDirty ? " *" : ""}</span>
      </div>
      <nav className="next-actions" aria-label="Controlli editor">
        <label>
          <span>File</span>
          <select
            value={currentDocument}
            onFocus={onRefreshDocuments}
            onChange={(event) => onOpenDocument(event.target.value)}
          >
            <option value="">Apri documento</option>
            {documents.map((document) => (
              <option key={document.filename} value={document.filename}>
                {document.title || document.filename}
              </option>
            ))}
          </select>
        </label>
        <button type="button" onClick={onSave}>Salva</button>
        <button type="button" onClick={onSaveCopy}>Salva copia</button>
        <button type="button" disabled={!currentDocument || isDirty} onClick={onRename}>Rinomina</button>
        <button type="button" disabled={!currentDocument} onClick={onDelete}>Elimina</button>
        <button type="button" onClick={onDownloadMarkdown}>MD</button>
        <button
          type="button"
          aria-pressed={documentRuntimeMode === "browser"}
          title="Forza salvataggio, check ed export HTML nel browser"
          onClick={onToggleDocumentRuntimeMode}
        >
          Browser-only
        </button>
        <button type="button" title="Scarica archivio JSON dei documenti browser" onClick={onExportBrowserArchive}>Backup</button>
        <button type="button" title="Importa archivio JSON nel browser" onClick={onImportBrowserArchive}>Importa</button>
        <span className="next-separator" />
        <button type="button" onClick={() => onInsertSnippet(snippets.scene)}>Scena</button>
        <button type="button" onClick={() => onInsertSnippet(snippets.readaloud)}>Readaloud</button>
        <button type="button" onClick={() => onInsertSnippet(snippets.note)}>Nota</button>
        <button type="button" onClick={() => onInsertSnippet(snippets.encounter)}>Incontro</button>
        <button type="button" onClick={() => onInsertSnippet(snippets.table)}>Tabella</button>
        <button type="button" onClick={() => onInsertSnippet(snippets.include)}>Include</button>
        <button type="button" onClick={() => onInsertSnippet(snippets.image)}>Immagine</button>
        <button type="button" onClick={() => onInsertSnippet(snippets.pagebreak)}>Pagina</button>
        <button type="button" onClick={onInsertPageBreakAtSelection}>Break</button>
        <button type="button" onClick={onInsertPageBreaksAtOverflow}>Auto break</button>
        <span className="next-separator" />
        <button type="button" disabled={isChecking} onClick={() => onCheck()}>
          {isChecking ? "Check..." : "Check"}
        </button>
        <button type="button" disabled={isChecking} onClick={() => onExport("html")}>HTML</button>
        <button type="button" disabled={isChecking} onClick={() => onExport("pdf")}>PDF</button>
        <span className="next-separator" />
        <label>
          <span>Vista</span>
          <select value={viewport} onChange={(event) => onViewportChange(event.target.value)}>
            <option value="desktop">Desktop</option>
            <option value="mobile">Mobile</option>
          </select>
        </label>
        <label>
          <span>Zoom</span>
          <select value={zoom} onChange={(event) => onZoomChange(event.target.value)}>
            {visibleZoomOptions.map((value) => (
              <option key={value} value={value}>{Math.round(Number(value) * 100)}%</option>
            ))}
          </select>
        </label>
        <button type="button" aria-pressed={previewVisible} onClick={onTogglePreview}>
          {previewVisible ? "Nascondi preview" : "Mostra preview"}
        </button>
        <button type="button" aria-pressed={syncPreview} onClick={onToggleSyncPreview}>
          Sync
        </button>
        <button type="button" onClick={onResetDraft}>Nuovo</button>
        <div className="mobile-panel-switch" aria-label="Pannelli mobile">
          {[
            ["editor", "Editor"],
            ["components", "Componenti"],
            ["preview", "Preview"],
            ["document", "Documento"]
          ].map(([value, label]) => (
            <button key={value} type="button" aria-pressed={mobilePanel === value} onClick={() => onMobilePanelChange(value)}>
              {label}
            </button>
          ))}
        </div>
      </nav>
      <div className="next-status" aria-live="polite">
        <span>{words} parole</span>
        <span>{schemaState}</span>
        <span data-state={documentRuntimeMode === "browser" ? "warning" : "ok"} title="Runtime documenti">{runtimeLabel}</span>
        <span data-state={errors ? "error" : warnings ? "warning" : "ok"}>{checkStatus}</span>
        <span data-state={statusState} title={statusDetail || status}>{status}</span>
        {exportOutputs.map((output) => (
          <a key={output.path} href={output.url} target="_blank" rel="noreferrer">{output.path}</a>
        ))}
      </div>
    </header>
  );
}
