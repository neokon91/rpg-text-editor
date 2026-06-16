import { parseMarkdownOutline } from "../../../packages/markdown/outline.js";

export function DocumentOutline({
  markdown,
  metadata = {},
  selectedLine,
  panels = { frontmatter: true, outline: true },
  onMetadataChange,
  onSelectLine,
  onTogglePanel
}) {
  const items = parseMarkdownOutline(markdown);

  return (
    <aside className="document-side" aria-label="Documento">
      <section className="metadata-panel" aria-label="Dettagli documento" data-collapsed={panels.frontmatter ? "false" : "true"}>
        <header className="side-panel-header">
          <div>
            <strong>Documento</strong>
            <span>Dettagli</span>
          </div>
          <button type="button" aria-expanded={panels.frontmatter} onClick={() => onTogglePanel?.("frontmatter")}>
            {panels.frontmatter ? "Nascondi dettagli" : "Mostra dettagli"}
          </button>
        </header>
        {panels.frontmatter ? (
          <div className="metadata-fields">
            <MetadataField label="Titolo" fieldKey="title" value={metadata.title} onChange={onMetadataChange} />
            <MetadataField label="Slug" fieldKey="slug" value={metadata.slug} onChange={onMetadataChange} />
            <MetadataField label="Summary" fieldKey="summary" value={metadata.summary} onChange={onMetadataChange} textarea />
            <MetadataField label="Categoria" fieldKey="category" value={metadata.category} onChange={onMetadataChange} />
            <MetadataField label="Tags" fieldKey="tags" value={metadata.tags} onChange={onMetadataChange} />
            <MetadataField label="Autore" fieldKey="author" value={metadata.author} onChange={onMetadataChange} />
            <label>
              <span>Tema</span>
              <select value={metadata.theme || "fifth-edition-compatible"} onChange={(event) => onMetadataChange?.("theme", event.target.value)}>
                <optgroup label="Compatibili fantasy (D&amp;D)">
                  <option value="fifth-edition-compatible">D&amp;D 5e — PHB (pergamena)</option>
                  <option value="mm-2024">D&amp;D — Manuale dei Mostri</option>
                  <option value="dmg-2024">D&amp;D — Guida del DM</option>
                  <option value="strahd">Strahd — gotico</option>
                  <option value="classic-parchment">Classic parchment</option>
                  <option value="old-school">Old-school — OSR / TSR</option>
                  <option value="dark-arcane">Dark arcane</option>
                </optgroup>
                <optgroup label="Altri editori / generi">
                  <option value="mythos">Mythos — Chaosium / Cthulhu</option>
                  <option value="modern-5-5">Modern 5.5</option>
                  <option value="clean-guild">Clean guild</option>
                  <option value="printer-friendly">Printer friendly</option>
                </optgroup>
              </select>
            </label>
            <label>
              <span>Carta</span>
              <select value={metadata.paper || "A4"} onChange={(event) => onMetadataChange?.("paper", event.target.value)}>
                <option value="A4">A4</option>
                <option value="Letter">Letter</option>
              </select>
            </label>
          </div>
        ) : null}
      </section>
      <section className="outline-panel" aria-label="Navigatore documento" data-collapsed={panels.outline ? "false" : "true"}>
        <header className="side-panel-header">
          <div>
            <strong>Navigatore</strong>
            <span>{items.length ? `${items.length} sezioni` : "Vuoto"}</span>
          </div>
          <button type="button" aria-expanded={panels.outline} onClick={() => onTogglePanel?.("outline")}>
            {panels.outline ? "Nascondi outline" : "Mostra outline"}
          </button>
        </header>
        {panels.outline ? (
          <>
            <ol className="outline-list">
              {items.map((item) => (
                <li key={`${item.line}-${item.title}`} className={`outline-item level-${Math.min(item.level, 4)}${item.line === selectedLine ? " is-active" : ""}`}>
                  <button type="button" aria-current={item.line === selectedLine ? "location" : undefined} onClick={() => onSelectLine(item.line)}>
                    <span>{item.title}</span>
                    <small>riga {item.line}</small>
                  </button>
                </li>
              ))}
            </ol>
            {!items.length ? <p className="empty-panel">Aggiungi heading Markdown.</p> : null}
          </>
        ) : null}
      </section>
    </aside>
  );
}

function MetadataField({ label, fieldKey, value = "", onChange, textarea = false }) {
  return (
    <label>
      <span>{label}</span>
      {textarea ? (
        <textarea value={value} onChange={(event) => onChange?.(fieldKey, event.target.value)} />
      ) : (
        <input value={value} onChange={(event) => onChange?.(fieldKey, event.target.value)} />
      )}
    </label>
  );
}
