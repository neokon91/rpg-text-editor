export function renderPreviewDocument(metadata, content, options = {}) {
  const theme = metadata.theme || "classic-parchment";
  const paper = String(metadata.paper || "A4").toLowerCase();
  const title = metadata.title || "Anteprima";
  const documentClass = [
    "homebrew-document",
    `theme-${theme}`,
    `paper-${paper}`
  ].join(" ");

  return `<!doctype html>
<html lang="it">
  <head>
    <meta charset="utf-8">
    <base href="/">
    <title>${escapeHtml(title)}</title>
    <link rel="stylesheet" href="/styles/main.css">
    <style>
      html, body { min-height: 100%; }
      body { background: #1c1510; padding: 24px; }
      .page-shell { min-height: 260mm; }
      body.preview-mobile { padding: 0; }
      body.preview-mobile .page-shell { width: 390px; max-width: 100%; }
      [data-source-line] { cursor: pointer; }
      [data-source-line]:hover { outline: 2px solid rgba(31, 111, 120, 0.35); outline-offset: 3px; }
      @media screen and (max-width: 760px) {
        body { padding: 0; }
      }
    </style>
  </head>
  <body class="${escapeHtml(`${documentClass} ${options.viewport === "mobile" ? "preview-mobile" : ""}`.trim())}">
    <main class="page-shell">
${content}
    </main>
    <script>
      document.addEventListener("click", function(event) {
        var target = event.target.closest("[data-source-line]");
        if (!target) return;
        event.preventDefault();
        window.parent.postMessage({ type: "rpg-preview-source-line", line: Number(target.dataset.sourceLine) }, "*");
      });
    </script>
  </body>
</html>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
