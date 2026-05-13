const snippets = {
  scene: "## Nuova scena\n\nDescrivi qui obiettivo, conflitto e uscita.",
  readaloud: "::: readaloud Da leggere al tavolo\nTesto da leggere al tavolo.\n:::",
  note: "::: note Nota\nPromemoria per il master.\n:::",
  encounter: "::: encounter Incontro\nname: Nuovo incontro\nbody: Obiettivo, minaccia e complicazione.\n:::",
  table: "::: random-table Tabella\nname: Tabella casuale\ndie: d6\nrow: 1 | Evento\nrow: 2 | Svolta inattesa\n:::",
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
  isDirty,
  status,
  isChecking,
  exportOutputs,
  previewVisible,
  syncPreview,
  viewport,
  zoom,
  onOpenDocument,
  onSave,
  onSaveCopy,
  onDownloadMarkdown,
  onCheck,
  onExport,
  onRefreshDocuments,
  onTogglePreview,
  onToggleSyncPreview,
  onViewportChange,
  onZoomChange,
  onResetDraft,
  onInsertSnippet
}) {
  const errors = diagnostics.filter((item) => item.severity === "error").length;
  const warnings = diagnostics.filter((item) => item.severity === "warning").length;
  const checkStatus = errors ? `${errors} errori` : warnings ? `${warnings} avvisi` : "Check ok";
  const visibleZoomOptions = zoomOptions.includes(zoom) ? zoomOptions : [...zoomOptions, zoom];

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
        <button type="button" onClick={onDownloadMarkdown}>MD</button>
        <span className="next-separator" />
        <button type="button" onClick={() => onInsertSnippet(snippets.scene)}>Scena</button>
        <button type="button" onClick={() => onInsertSnippet(snippets.readaloud)}>Readaloud</button>
        <button type="button" onClick={() => onInsertSnippet(snippets.encounter)}>Incontro</button>
        <button type="button" onClick={() => onInsertSnippet(snippets.table)}>Tabella</button>
        <button type="button" onClick={() => onInsertSnippet(snippets.pagebreak)}>Pagina</button>
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
      </nav>
      <div className="next-status" aria-live="polite">
        <span>{words} parole</span>
        <span>{schemaState}</span>
        <span data-state={errors ? "error" : warnings ? "warning" : "ok"}>{checkStatus}</span>
        <span>{status}</span>
        {exportOutputs.map((output) => (
          <a key={output.path} href={output.url} target="_blank" rel="noreferrer">{output.path}</a>
        ))}
      </div>
    </header>
  );
}
