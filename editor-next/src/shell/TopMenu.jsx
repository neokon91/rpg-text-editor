const snippets = {
  // Box da tavolo
  readaloud: "::: readaloud Da leggere al tavolo\nLe torce proiettano ombre innaturali sulle colonne spezzate. In fondo alla sala, una figura immobile osserva il gruppo.\n:::",
  note: "::: note Nota\nPromemoria per il master, variante opzionale o appunto di design.\n:::",
  encounter: "::: encounter Incontro\nObiettivo, avversari e complicazione che rende la scena interessante.\n:::",
  treasure: "::: treasure Tesoro\n- 25 monete d'argento\n- Una chiave annerita\n- Un frammento di mappa\n:::",
  quote: "::: quote Cronache Perdute\n\"Il re dorme ancora sotto la montagna. E sogna fame.\"\n:::",
  // Schede regole
  monster: "::: monster Creatura\nname: Custode della Soglia\nmeta: Costrutto medio, senza allineamento\nac: 15\nhp: 38\nspeed: 9 m\ncr: 1\nstr: 14\ndex: 10\ncon: 16\nint: 5\nwis: 12\ncha: 6\nsenses: scurovisione 18 m, Percezione passiva 11\nlanguages: comprende una lingua scelta dal creatore\ntrait: Corpo di Pietra | Ha vantaggio ai tiri salvezza contro veleno e malattia.\naction: Pugno Inciso | +4 a colpire, portata 1,5 m, un bersaglio. Colpisce per 1d8 + 2 danni contundenti.\n:::",
  spell: "::: spell Incantesimo\nname: Luce del Cartografo\nlevel: 1° livello\nschool: divinazione\ncasting_time: 1 azione\nrange: personale\ncomponents: V, S, M\nduration: 10 minuti\nUna linea luminosa indica il percorso più breve verso una destinazione nominata entro 300 metri.\n:::",
  magicitem: "::: magicitem Oggetto magico\nname: Bussola senza Nord\ntype: Oggetto meraviglioso\nrarity: raro\nattunement: richiesta\nLa bussola indica la cosa che chi la impugna teme di trovare.\n:::",
  npc: "::: npc PNG\nname: Mira Calden\nrole: Mediatrice di gilda con troppi debiti\nappearance: abiti eleganti consumati ai polsini\nmotive: vuole uscire viva da un accordo sbagliato\nsecret: ha venduto una mappa falsa a due fazioni diverse\nhook: Offerta | Paga bene per recuperare l'originale prima dell'alba.\n:::",
  location: "::: location Luogo\nname: Ponte delle Campane\ntags: rovina, vento, vertigine\nmood: ogni passo risponde con un tintinnio lontano\ndanger: una campana spezzata attira creature ostili se viene toccata\ntreasure: una moneta votiva incastrata tra le pietre\n:::",
  hazard: "::: hazard Pericolo\nname: Nebbia di Vetro\ntrigger: una creatura corre o cade nella sala\ndc: Costituzione CD 14\neffect: la creatura subisce 2d6 danni taglienti e tossisce sangue cristallino\ncountermeasure: muoversi lentamente evita di sollevare la nebbia\n:::",
  // Struttura, tabelle e media
  subtitle: "::: subtitle\nSottotitolo dell'avventura o del capitolo\n:::",
  dropcap: "::: dropcap\nIl primo paragrafo del capitolo: apre con un capolettera decorativo e dà il tono alla scena.\n:::",
  scene: "## Nuova scena\n\nDescrivi qui obiettivo, conflitto e uscita.",
  table: "::: random-table d6\nname: Eventi rapidi\nrow: 1 | Si sente un colpo metallico.\nrow: 2 | Una porta si apre da sola.\nrow: 3 | Un alleato riconosce un simbolo sul pavimento.\n:::",
  map: "::: map Mappa del luogo\nsrc: assets/images/maps/santuario-sepolto-map.svg\nalt: Mappa del luogo\n:::",
  image: "::: image Immagine\nsrc: assets/images/maps/santuario-sepolto-map.svg\ncaption: Didascalia dell'immagine\n:::",
  wideimage: "::: wide\n![Illustrazione](assets/images/maps/santuario-sepolto-map.svg)\n:::",
  fullpage: "::pagebreak\n\n::: fullpage\nsrc: assets/images/maps/santuario-sepolto-map.svg\nalt: Illustrazione a tutta pagina\nfit: cover\n:::\n\n::pagebreak",
  include: '<rpg-include src="content/monsters/custode-ossa.html"></rpg-include>',
  frame: "::: frame\nContenuto in un riquadro decorato: una regola opzionale, un riepilogo o una piccola tavola.\n:::",
  wide: "::: wide\n| Livello | Bonus | Privilegio |\n|---|---|---|\n| 1 | +2 | Scelta iniziale |\n| 2 | +2 | Specializzazione |\n| 3 | +3 | Talento |\n:::",
  column: "::column",
  pagebreak: "::pagebreak"
};

const insertGroups = [
  {
    label: "Box da tavolo",
    items: [
      ["readaloud", "Da leggere"],
      ["note", "Nota"],
      ["encounter", "Incontro"],
      ["treasure", "Tesoro"],
      ["quote", "Citazione"]
    ]
  },
  {
    label: "Schede regole",
    items: [
      ["monster", "Statblock"],
      ["spell", "Incantesimo"],
      ["magicitem", "Oggetto"],
      ["npc", "PNG"],
      ["location", "Luogo"],
      ["hazard", "Pericolo"]
    ]
  },
  {
    label: "Struttura e media",
    items: [
      ["subtitle", "Sottotitolo"],
      ["dropcap", "Capolettera"],
      ["scene", "Scena"],
      ["table", "Tabella"],
      ["frame", "Riquadro"],
      ["map", "Mappa"],
      ["image", "Immagine"],
      ["wideimage", "Immagine larga"],
      ["fullpage", "Pagina illustrata"],
      ["include", "Include"]
    ]
  }
];

const zoomOptions = ["0.75", "0.9", "1", "1.1", "1.25"];

// Chiude il menu a comparsa dopo un click su un pulsante interno (nessuno stato React).
function closeMenuOnAction(event) {
  if (!event.target.closest("button")) return;
  const details = event.currentTarget.closest("details");
  if (details) details.open = false;
}

export function TopMenu({
  title,
  words,
  schemaState,
  diagnostics,
  documents,
  currentDocument,
  documentRuntimeMode,
  browserStorageStats,
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
  onToggleOnboarding,
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
  const problemsLabel = errors
    ? `${errors} da correggere`
    : warnings
      ? `${warnings} da rivedere`
      : "Nessun problema";
  const isBrowser = documentRuntimeMode === "browser";
  const docLabel = title || "Bozza senza titolo";
  const visibleZoomOptions = zoomOptions.includes(zoom) ? zoomOptions : [...zoomOptions, zoom];
  const statusState = statusDetail || /non riuscito|bloccato|errore|errori|non disponibile/i.test(status)
    ? "error"
    : /in corso|\.\.\.|controllo/i.test(status)
      ? "busy"
      : /avvisi|gia|modifiche/i.test(status)
        ? "warning"
        : "ok";

  return (
    <header className="next-topbar">
      <div className="next-brand">
        <strong title={docLabel}>{docLabel}{isDirty ? " •" : ""}</strong>
        <span>RPG Text Editor</span>
      </div>
      <nav className="next-actions" aria-label="Controlli editor">
        <label className="field-inline">
          <span className="field-label">Apri</span>
          <select
            value={currentDocument}
            onFocus={onRefreshDocuments}
            onChange={(event) => onOpenDocument(event.target.value)}
          >
            <option value="">Apri un documento…</option>
            {documents.map((document) => (
              <option key={document.filename} value={document.filename}>
                {document.title || document.filename}
              </option>
            ))}
          </select>
        </label>
        <button type="button" className="ghost" onClick={onResetDraft}>Nuovo</button>
        <button type="button" className="primary" onClick={onSave}>Salva</button>

        <details className="topbar-menu">
          <summary>Documento</summary>
          <div className="topbar-menu-pop" onClick={closeMenuOnAction}>
            <button type="button" onClick={onSaveCopy}>Salva una copia</button>
            <button type="button" disabled={!currentDocument || isDirty} onClick={onRename}>Rinomina</button>
            <button type="button" disabled={!currentDocument} onClick={onDelete}>Elimina</button>
            <hr />
            <button type="button" onClick={onDownloadMarkdown}>Scarica testo (.md)</button>
            <button type="button" title="Salva una copia di sicurezza di tutti i documenti" onClick={onExportBrowserArchive}>Backup</button>
            <button type="button" onClick={onImportBrowserArchive}>Importa…</button>
            <hr />
            <button type="button" aria-pressed={isBrowser} title="Salva i documenti solo in questo browser, senza server" onClick={onToggleDocumentRuntimeMode}>Browser-only</button>
          </div>
        </details>

        <details className="topbar-menu">
          <summary>Inserisci</summary>
          <div className="topbar-menu-pop topbar-menu-pop--insert" onClick={closeMenuOnAction}>
            {insertGroups.map((group) => (
              <div className="menu-group" key={group.label}>
                <span className="menu-group-label">{group.label}</span>
                {group.items.map(([key, label]) => (
                  <button type="button" key={key} onClick={() => onInsertSnippet(snippets[key])}>{label}</button>
                ))}
              </div>
            ))}
            <div className="menu-group">
              <span className="menu-group-label">Impaginazione</span>
              <button type="button" onClick={() => onInsertSnippet(snippets.wide)}>A tutta larghezza</button>
              <button type="button" onClick={() => onInsertSnippet(snippets.column)}>Interruzione colonna</button>
              <button type="button" onClick={() => onInsertSnippet(snippets.pagebreak)}>Interruzione pagina</button>
              <button type="button" onClick={onInsertPageBreakAtSelection}>Spezza qui</button>
              <button type="button" onClick={onInsertPageBreaksAtOverflow}>Impagina auto</button>
            </div>
          </div>
        </details>

        <span className="next-spacer" />

        <button type="button" disabled={isChecking} onClick={() => onCheck()}>
          {isChecking ? "Controllo…" : "Controlla"}
        </button>

        <details className="topbar-menu">
          <summary className="primary">Esporta</summary>
          <div className="topbar-menu-pop" onClick={closeMenuOnAction}>
            <button type="button" disabled={isChecking} title="Scarica un PDF pronto da stampare o condividere" onClick={() => onExport("pdf")}>PDF</button>
            <button type="button" disabled={isChecking} onClick={() => onExport("html")}>HTML</button>
          </div>
        </details>

        <details className="topbar-menu">
          <summary>Vista</summary>
          <div className="topbar-menu-pop" onClick={closeMenuOnAction}>
            <button type="button" aria-pressed={previewVisible} onClick={onTogglePreview}>
              {previewVisible ? "Nascondi preview" : "Mostra preview"}
            </button>
            <button type="button" aria-pressed={syncPreview} onClick={onToggleSyncPreview}>Sync</button>
            <label className="menu-field">
              <span>Schermo</span>
              <select value={viewport} onChange={(event) => onViewportChange(event.target.value)}>
                <option value="desktop">Desktop</option>
                <option value="mobile">Mobile</option>
              </select>
            </label>
            <label className="menu-field">
              <span>Zoom</span>
              <select value={zoom} onChange={(event) => onZoomChange(event.target.value)}>
                {visibleZoomOptions.map((value) => (
                  <option key={value} value={value}>{Math.round(Number(value) * 100)}%</option>
                ))}
              </select>
            </label>
            <hr />
            <button type="button" onClick={onToggleOnboarding}>Guida</button>
          </div>
        </details>

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
        <span data-state={errors ? "error" : warnings ? "warning" : "ok"}>{problemsLabel}</span>
        <span data-state={statusState} title={statusDetail || status}>{status}</span>
        {isBrowser ? (
          <span
            data-state={browserStorageStats.warning ? "warning" : "ok"}
            title={`Documenti salvati in questo browser — ${browserStorageStats.count} doc, ${browserStorageStats.label}`}
          >
            {browserStorageStats.warning ? "Spazio quasi pieno" : "In questo browser"}
          </span>
        ) : null}
        {exportOutputs.map((output) => (
          <a key={output.path} href={output.url} target="_blank" rel="noreferrer">{output.path}</a>
        ))}
      </div>
    </header>
  );
}
