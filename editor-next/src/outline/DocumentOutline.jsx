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
      <section className="metadata-panel" aria-label="Frontmatter" data-collapsed={panels.frontmatter ? "false" : "true"}>
        <header className="side-panel-header">
          <div>
            <strong>Documento</strong>
            <span>Frontmatter</span>
          </div>
          <button type="button" aria-expanded={panels.frontmatter} onClick={() => onTogglePanel?.("frontmatter")}>
            {panels.frontmatter ? "Nascondi frontmatter" : "Mostra frontmatter"}
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
              <select value={metadata.theme || "classic-parchment"} onChange={(event) => onMetadataChange?.("theme", event.target.value)}>
                <option value="classic-parchment">classic-parchment</option>
                <option value="dark-arcane">dark-arcane</option>
                <option value="clean-guild">clean-guild</option>
                <option value="modern-5-5">modern-5-5</option>
                <option value="printer-friendly">printer-friendly</option>
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
