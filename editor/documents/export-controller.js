import { exportDocument as exportRenderedDocument } from "/editor/documents/api.js";

export function createExportController({
  panel,
  saveState,
  getMarkdown,
  getFilename,
  getDownloadFilename,
  downloadMarkdown,
  checkDocument
}) {
  async function exportCheckedMarkdown() {
    const result = await checkDocument({ scroll: false, focus: true });
    const blocking = result.diagnostics.find((diagnostic) => diagnostic.severity === "error");
    if (blocking) {
      saveState.textContent = "Export bloccato: correggi gli errori";
      return;
    }

    downloadMarkdown(getMarkdown(), getDownloadFilename());
    saveState.textContent = result.diagnostics.length
      ? "Export Markdown pronto con avvisi"
      : "Export Markdown pronto";
  }

  async function exportCheckedRender(format) {
    panel.className = "export-panel";
    panel.replaceChildren(
      element("strong", "Export"),
      element("span", `Preparo export ${format.toUpperCase()} dopo i controlli...`)
    );

    const result = await checkDocument({ scroll: false, focus: true });
    const blocking = result.diagnostics.find((diagnostic) => diagnostic.severity === "error");
    if (blocking) {
      saveState.textContent = "Export bloccato: correggi gli errori";
      renderExportBlocked(blocking);
      return;
    }

    try {
      const exportResult = await exportRenderedDocument({
        filename: getFilename(),
        content: getMarkdown(),
        format
      });
      renderExportResult(exportResult);
      saveState.textContent = `Export ${format.toUpperCase()} pronto`;
    } catch (error) {
      panel.className = "export-panel has-errors";
      panel.replaceChildren(
        element("strong", "Export non riuscito"),
        element("span", error.log || error.message)
      );
      saveState.textContent = "Export non riuscito";
    }
  }

  function renderExportBlocked(diagnostic) {
    panel.className = "export-panel has-errors";
    panel.replaceChildren(
      element("strong", "Export bloccato"),
      element("span", `${diagnostic.message} ${diagnostic.fix || ""}`.trim())
    );
  }

  function renderExportResult(result) {
    panel.className = "export-panel has-output";
    panel.replaceChildren(
      element("strong", `Export ${result.format.toUpperCase()} pronto`),
      element("span", "Apri l'output generato in dist/.")
    );

    const links = document.createElement("div");
    links.className = "export-links";
    for (const output of result.outputs || []) {
      const link = document.createElement("a");
      link.href = output.url;
      link.target = "_blank";
      link.rel = "noreferrer";
      link.textContent = output.path;
      links.append(link);
    }
    panel.append(links);
  }

  return { exportCheckedMarkdown, exportCheckedRender };
}

function element(tag, text) {
  const node = document.createElement(tag);
  node.textContent = text;
  return node;
}
