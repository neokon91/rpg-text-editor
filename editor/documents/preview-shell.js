export function renderPreviewDocument(metadata, content) {
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
      @media screen and (max-width: 760px) {
        body { padding: 0; }
      }
    </style>
  </head>
  <body class="${escapeHtml(documentClass)}">
    <main class="page-shell">
${content}
    </main>
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
