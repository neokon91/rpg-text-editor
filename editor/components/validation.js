import { validateMarkdownBlocks } from "/scripts/lib/component-schema.js";

export function renderComponentValidation(markdown, schema, validationPanel) {
  const diagnostics = validateMarkdownBlocks(markdown, schema);
  validationPanel.className = `validation-panel${diagnostics.some((item) => item.severity === "error") ? " has-errors" : ""}`;

  if (!diagnostics.length) {
    validationPanel.innerHTML = '<strong>Schema ok</strong><span>Nessun problema nei componenti Markdown.</span>';
    return;
  }

  validationPanel.innerHTML = [
    "<strong>Controllo schema</strong>",
    "<ul>",
    ...diagnostics.map((diagnostic) => `<li class="${diagnostic.severity}">Riga ${diagnostic.line}: ${escapeHtml(diagnostic.message)}</li>`),
    "</ul>"
  ].join("");
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
