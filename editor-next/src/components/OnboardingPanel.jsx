export function OnboardingPanel({
  isChecking,
  onShowExample,
  onImport,
  onExportPdf,
  onHide
}) {
  return (
    <section className="onboarding-panel" aria-label="Guida rapida">
      <div>
        <strong>Parti da qui</strong>
        <span>Scrivi nel pannello centrale, controlla la pagina a destra e usa Check prima dell'export.</span>
      </div>
      <ol>
        <li><strong>Salva</strong> conserva una copia nel browser o nei documenti locali.</li>
        <li><strong>Importa</strong> carica documenti Markdown o backup senza configurare nulla.</li>
        <li><strong>PDF</strong> scarica un file PDF; il link stampabile resta come fallback.</li>
      </ol>
      <div className="onboarding-actions">
        <button type="button" onClick={onShowExample}>Mostra esempio</button>
        <button type="button" onClick={onImport}>Importa file</button>
        <button type="button" onClick={onExportPdf} disabled={isChecking}>Esporta PDF</button>
        <button type="button" onClick={onHide}>Nascondi</button>
      </div>
    </section>
  );
}
