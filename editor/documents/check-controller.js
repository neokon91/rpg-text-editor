import { renderDiagnostics } from "/editor/components/validation.js";
import { checkDocument as checkDocumentQuality } from "/editor/documents/api.js";

export function createAuthorCheckController({
  panel,
  saveState,
  getMarkdown,
  getFilename,
  renderSchema,
  onSelectLine,
  onStatusChange
}) {
  let diagnostics = [];
  let state = "idle";
  let checkedMarkdown = "";

  function markStaleIfChanged() {
    if (state === "fresh" && getMarkdown() !== checkedMarkdown) {
      state = "stale";
      diagnostics = [];
      onStatusChange?.();
    }
  }

  async function checkDocument(options = {}) {
    const settings = options instanceof Event ? {} : options;
    const schemaDiagnostics = renderSchema() || options.schemaDiagnostics || [];
    state = "running";
    panel.replaceChildren(
      document.createElement("strong"),
      document.createElement("span")
    );
    panel.querySelector("strong").textContent = "Author check";
    panel.querySelector("span").textContent = "Controlli editoriali in corso...";
    onStatusChange?.();

    try {
      const result = await checkDocumentQuality({
        filename: getFilename(),
        content: getMarkdown()
      });
      diagnostics = result.diagnostics || [];
      state = "fresh";
      checkedMarkdown = getMarkdown();
    } catch {
      state = "failed";
      diagnostics = [{
        severity: "error",
        line: 1,
        message: "Author check non disponibile.",
        fix: "Verifica che il server editor locale sia attivo."
      }];
    }

    render();
    if (settings.scroll !== false) panel.scrollIntoView({ block: "nearest" });
    const allDiagnostics = getDiagnostics(schemaDiagnostics);
    const firstBlocking = allDiagnostics.find((diagnostic) => diagnostic.severity === "error") || allDiagnostics[0];
    if (firstBlocking) {
      if (settings.focus !== false) onSelectLine(firstBlocking.line);
      saveState.textContent = firstBlocking.severity === "error" ? "Check: errori da correggere" : "Check: avvisi presenti";
      return { ok: firstBlocking.severity !== "error", diagnostics: allDiagnostics };
    }
    saveState.textContent = "Check completo ok";
    return { ok: true, diagnostics: allDiagnostics };
  }

  function getDiagnostics(schemaDiagnostics = []) {
    return [
      ...schemaDiagnostics,
      ...(state === "fresh" || state === "failed" ? diagnostics : [])
    ];
  }

  function render() {
    const emptyMessage = {
      fresh: "Controlli editoriali, legali e include ok sulla bozza corrente.",
      stale: "Il Markdown e cambiato dopo l'ultimo author check. Premi Check per aggiornare.",
      failed: "Author check non disponibile.",
      idle: "Premi Check per controlli editoriali, legali e include sulla bozza corrente.",
      running: "Controlli editoriali in corso..."
    }[state] || "Premi Check per controlli editoriali, legali e include sulla bozza corrente.";

    renderDiagnostics({
      diagnostics,
      emptyTitle: "Author check",
      emptyMessage,
      panel,
      title: "Author check",
      onSelectLine
    });
    onStatusChange?.();
  }

  return {
    checkDocument,
    getDiagnostics,
    getState: () => state,
    markStaleIfChanged,
    render
  };
}
