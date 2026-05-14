export function renderPreviewDocument(metadata, content, options = {}) {
  const theme = metadata.theme || "fifth-edition-compatible";
  const paper = String(metadata.paper || "A4").toLowerCase();
  const title = metadata.title || "Anteprima";
  const pages = splitPreviewPages(content);
  const autoPaginate = options.autoPaginate === true;
  const assetBase = normalizeAssetBase(options.assetBase || "/");
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
    <link rel="stylesheet" href="${assetBase}styles/main.css">
    <style>
      html, body { min-height: 100%; }
      body { background: #1c1510; padding: 24px; }
      body { zoom: var(--rpg-preview-zoom, 1); }
      .preview-pages {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 24px;
      }
      .page-shell {
        min-height: 260mm;
        margin: 0;
        scroll-margin-top: 1.5rem;
      }
      body[data-spread="facing"] .preview-pages,
      body[data-spread="flow"] .preview-pages {
        flex-flow: row wrap;
        align-items: flex-start;
        justify-content: center;
      }
      body[data-spread="flow"] .page-shell { min-height: auto; overflow: visible; }
      .page-break {
        height: auto;
        margin: 1.4rem 0;
        border-top: 2px dashed rgba(31, 111, 120, 0.48);
        break-after: page;
        scroll-margin-top: 1.5rem;
      }
      .page-break::after {
        content: "Page break";
        display: inline-block;
        transform: translateY(-50%);
        padding: 0.1rem 0.45rem;
        background: var(--color-paper-light, #fff8e2);
        color: #1f6f78;
        font: 700 0.68rem/1.2 system-ui, sans-serif;
        text-transform: uppercase;
      }
      body.preview-mobile { padding: 0; }
      body.preview-mobile .page-shell { width: 390px; max-width: 100%; }
      body.preview-mobile .preview-pages { gap: 0; }
      [data-source-line] { cursor: pointer; }
      [data-source-line]:hover { outline: 2px solid rgba(31, 111, 120, 0.35); outline-offset: 3px; }
      @media screen and (max-width: 760px) {
        body { padding: 0; }
      }
    </style>
  </head>
  <body class="${escapeHtml(`${documentClass} ${options.viewport === "mobile" ? "preview-mobile" : ""}`.trim())}" data-auto-paginate="${autoPaginate ? "true" : "false"}">
    <main class="preview-pages" aria-label="Pagine anteprima">
${pages.map((page, index) => `      <section class="page-shell" data-preview-page="${index + 1}">
${page}
      </section>`).join("\n")}
    </main>
    <script>
      document.addEventListener("click", function(event) {
        var target = event.target.closest("[data-source-line]");
        if (!target) return;
        event.preventDefault();
        window.parent.postMessage({ type: "rpg-preview-source-line", line: Number(target.dataset.sourceLine) }, "*");
      });

      if (document.body.dataset.autoPaginate === "true") {
        requestAnimationFrame(paginatePreviewPages);
      }

      function paginatePreviewPages() {
        if (document.body.dataset.spread === "flow") return;
        var container = document.querySelector(".preview-pages");
        if (!container) return;
        var guard = 0;
        var initialPages = container.querySelectorAll(".page-shell").length;

        while (guard < 120) {
          guard += 1;
          var changed = false;
          var pages = Array.from(container.querySelectorAll(".page-shell"));

          for (var index = 0; index < pages.length; index += 1) {
            var page = pages[index];
            if (!pageOverflows(page)) continue;
            var children = Array.from(page.children).filter(function(child) {
              return !child.classList.contains("page-break");
            });
            if (children.length <= 1) continue;

            var nextPage = page.nextElementSibling;
            if (!nextPage || !nextPage.classList.contains("page-shell")) {
              nextPage = document.createElement("section");
              nextPage.className = "page-shell";
              container.insertBefore(nextPage, page.nextSibling);
            }

            while (pageOverflows(page) && children.length > 1) {
              nextPage.insertBefore(children.pop(), nextPage.firstChild);
              changed = true;
            }
          }

          refreshPageNumbers(container);
          if (!changed) break;
        }

        reportAutoPagination(container, initialPages);
      }

      function pageOverflows(page) {
        var style = getComputedStyle(page);
        var limit = parseFloat(style.minHeight || "0") || parseFloat(style.height || "0") || page.clientHeight;
        return page.scrollHeight > limit + 4 || page.scrollWidth > page.clientWidth + 4;
      }

      function refreshPageNumbers(container) {
        Array.from(container.querySelectorAll(".page-shell")).forEach(function(page, index) {
          page.dataset.previewPage = String(index + 1);
        });
      }

      function reportAutoPagination(container, initialPages) {
        var pages = Array.from(container.querySelectorAll(".page-shell"));
        var totalPages = pages.length;
        var overflowedPages = pages.filter(pageOverflows);
        var firstOverflowPage = overflowedPages[0];
        var firstOverflowSource = firstOverflowPage ? firstOverflowPage.querySelector("[data-source-line]") : null;
        window.parent.postMessage({
          type: "rpg-preview-pagination",
          autoPaginate: true,
          totalPages: totalPages,
          generatedPages: Math.max(totalPages - initialPages, 0),
          overflowPages: overflowedPages.length,
          firstOverflowPage: firstOverflowPage ? Number(firstOverflowPage.dataset.previewPage) || 1 : 0,
          firstOverflowLine: firstOverflowSource ? Number(firstOverflowSource.dataset.sourceLine) || 0 : 0
        }, "*");
      }
    </script>
  </body>
</html>`;
}

function normalizeAssetBase(value) {
  const base = String(value || "/");
  return base.endsWith("/") ? base : `${base}/`;
}

function splitPreviewPages(content) {
  const pages = String(content)
    .split(/<div class="page-break"[^>]*><\/div>/g)
    .map((page) => page.trim());
  return pages.length ? pages : [""];
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
