export function OnboardingPanel({
  templates = [],
  isChecking,
  onLoadTemplate,
  onImport,
  onExportPdf,
  onHide
}) {
  return (
    <section className="onboarding-panel" aria-label="Guida rapida">
      <div className="onboarding-intro">
        <div className="onboarding-lead">
          <strong>Parti da un modello</strong>
          <span>
            Scegli un punto di partenza già impaginato, poi modifica il testo a sinistra.
            I componenti si scrivono sempre con i blocchi <code>:::</code> della palette.
          </span>
        </div>
        <div className="onboarding-actions">
          <button type="button" onClick={onImport}>Importa file</button>
          <button type="button" onClick={onExportPdf} disabled={isChecking}>Esporta PDF</button>
          <button type="button" className="onboarding-close" onClick={onHide}>Nascondi</button>
        </div>
      </div>

      <div className="onboarding-gallery">
        {templates.map((template) => (
          <article key={template.id} className="onboarding-card">
            <h3>{template.title}</h3>
            <p>{template.blurb}</p>
            <button type="button" onClick={() => onLoadTemplate(template)}>
              Usa questo modello
            </button>
          </article>
        ))}
      </div>

      <details className="onboarding-cheatsheet">
        <summary>Promemoria sintassi <code>:::</code></summary>
        <div className="cheatsheet-grid">
          <div>
            <strong>Box da leggere</strong>
            <pre>{"::: readaloud Titolo\nTesto del box.\n:::"}</pre>
          </div>
          <div>
            <strong>Sottotitolo</strong>
            <pre>{"::: subtitle\nSotto al titolo.\n:::"}</pre>
          </div>
          <div>
            <strong>Creatura</strong>
            <pre>{"::: monster Nome\nac: 13\nhp: 22\n:::"}</pre>
          </div>
          <div>
            <strong>Tabella casuale</strong>
            <pre>{"::: random-table d6\nrow: 1 | Evento\n:::"}</pre>
          </div>
        </div>
      </details>
    </section>
  );
}
