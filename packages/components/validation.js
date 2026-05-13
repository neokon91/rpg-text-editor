import { validateMarkdownBlocks } from "/scripts/lib/component-schema.js";

export function renderComponentValidation(markdown, schema, validationPanel, onSelectLine) {
  const diagnostics = validateMarkdownBlocks(markdown, schema);
  renderDiagnostics({
    diagnostics,
    emptyTitle: "Schema ok",
    emptyMessage: "Nessun problema nei componenti Markdown.",
    panel: validationPanel,
    title: "Controllo schema",
    onSelectLine
  });
  return diagnostics;
}

export function renderDiagnostics({
  diagnostics,
  emptyTitle,
  emptyMessage,
  panel,
  title,
  onSelectLine
}) {
  const hasErrors = diagnostics.some((item) => item.severity === "error");
  const hasWarnings = diagnostics.some((item) => item.severity === "warning");
  panel.className = `${panel.classList.contains("author-check-panel") ? "validation-panel author-check-panel" : "validation-panel"}${hasErrors ? " has-errors" : ""}${!hasErrors && hasWarnings ? " has-warnings" : ""}`;

  if (!diagnostics.length) {
    panel.replaceChildren(element("strong", {}, emptyTitle), element("span", {}, emptyMessage));
    return;
  }

  panel.replaceChildren(
    element("strong", {}, title),
    element("ul", {}, ...diagnostics.map((diagnostic) => {
      const item = element("li", { class: diagnostic.severity });
      const button = element(
        "button",
        { type: "button" },
        element("span", { class: "severity" }, diagnostic.severity === "error" ? "Errore" : "Avviso"),
        element(
          "span",
          { class: "diagnostic-body" },
          element("span", {}, `Riga ${diagnostic.line}: ${diagnostic.message}`),
          element("span", { class: "diagnostic-fix" }, diagnostic.fix || suggestFix(diagnostic.message))
        )
      );
      button.addEventListener("click", () => onSelectLine?.(diagnostic.line));
      item.append(button);
      return item;
    }))
  );
}

function suggestFix(message) {
  if (message.includes("Componente sconosciuto")) return "Controlla il nome dopo ::: oppure riattiva il plugin pack corretto.";
  if (message.includes("campo obbligatorio mancante")) return "Aggiungi la chiave richiesta dentro il blocco, per esempio name: Valore.";
  if (message.includes("chiave non prevista")) return "Rimuovi la chiave o scegli un campo previsto dallo schema del componente.";
  if (message.includes("malformata")) return 'Scrivi la riga come "chiave: nome | testo".';
  return "Apri la riga indicata e correggi il blocco Markdown.";
}

function element(tagName, attributes = {}, ...children) {
  const node = document.createElement(tagName);
  for (const [key, value] of Object.entries(attributes)) {
    node.setAttribute(key, value);
  }
  for (const child of children) {
    node.append(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  return node;
}
