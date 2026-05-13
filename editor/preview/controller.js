import { renderMarkdown as renderComponentMarkdown } from "/editor/components/preview.js";
import { renderComponentValidation } from "/editor/components/validation.js";
import { parseFrontmatter } from "/editor/documents/frontmatter.js";
import { renderPreviewDocument } from "/editor/documents/preview-shell.js";
import { countWords } from "/editor/markdown/editor-actions.js";

const previewViewportKey = "rpg-text-editor:preview-viewport";
const previewWidthKey = "rpg-text-editor:preview-width";
const previewSyncKey = "rpg-text-editor:preview-sync";

export function createPreviewController({
  preview,
  wordCount,
  validationPanel,
  previewViewport,
  previewWidth,
  previewSync,
  previewMeta,
  sourceInput,
  getMarkdown,
  getSchema,
  onSelectLine,
  onDiagnostics
}) {
  let syncFrame = 0;

  restorePreviewControls();
  previewViewport?.addEventListener("change", applyPreviewControls);
  previewWidth?.addEventListener("change", applyPreviewControls);
  previewSync?.addEventListener("change", applyPreviewControls);
  sourceInput?.addEventListener("scroll", syncPreviewToEditor);
  preview.addEventListener("load", bindPreviewInteractions);
  window.addEventListener("message", handlePreviewMessage);

  function render() {
    const markdown = getMarkdown();
    const schema = getSchema();
    const { metadata, body, bodyStartLine } = parseFrontmatter(markdown);

    preview.onload = bindPreviewInteractions;
    preview.srcdoc = renderPreviewDocument(metadata, renderComponentMarkdown(body, schema, { startLine: bodyStartLine }), {
      viewport: previewViewport?.value || "desktop"
    });
    setTimeout(bindPreviewInteractions, 0);
    wordCount.textContent = `${countWords(body)} parole`;
    previewMeta.textContent = `Tema: ${metadata.theme || "classic-parchment"} · Carta: ${metadata.paper || "A4"}`;
    applyPreviewControls();
    const diagnostics = renderComponentValidation(markdown, schema, validationPanel, onSelectLine);
    onDiagnostics?.(diagnostics);
    return diagnostics;
  }

  function applyPreviewControls() {
    preview.dataset.viewport = previewViewport?.value || "desktop";
    preview.dataset.width = previewWidth?.value || "fit";
    preview.dataset.sync = previewSync?.checked ? "on" : "off";
    localStorage.setItem(previewViewportKey, preview.dataset.viewport);
    localStorage.setItem(previewWidthKey, preview.dataset.width);
    localStorage.setItem(previewSyncKey, preview.dataset.sync);
  }

  function handlePreviewMessage(event) {
    if (event.source !== preview.contentWindow) return;
    if (event.data?.type !== "rpg-preview-source-line") return;
    onSelectLine?.(Number(event.data.line));
  }

  function bindPreviewInteractions() {
    const document = preview.contentDocument;
    if (!document) return;

    document.addEventListener("click", (event) => {
      const target = event.target.closest("[data-source-line]");
      if (!target) return;

      event.preventDefault();
      onSelectLine?.(Number(target.dataset.sourceLine));
    });
  }

  function syncPreviewToEditor() {
    if (previewSync && !previewSync.checked) return;
    if (syncFrame) cancelAnimationFrame(syncFrame);
    syncFrame = requestAnimationFrame(() => {
      syncFrame = 0;
      const document = preview.contentDocument;
      if (!document || !sourceInput) return;

      const targetLine = lineAtEditorScroll();
      const elements = [...document.querySelectorAll("[data-source-line]")];
      const target = elements.reduce((best, element) => {
        const line = Number(element.dataset.sourceLine);
        if (line <= targetLine && (!best || line > Number(best.dataset.sourceLine))) return element;
        return best;
      }, elements[0]);

      target?.scrollIntoView({ block: "start" });
    });
  }

  function lineAtEditorScroll() {
    const lineCount = sourceInput.value.replace(/\r\n/g, "\n").split("\n").length;
    const scrollable = Math.max(1, sourceInput.scrollHeight - sourceInput.clientHeight);
    const ratio = sourceInput.scrollTop / scrollable;
    return Math.max(1, Math.round(lineCount * ratio));
  }

  function restorePreviewControls() {
    const storedViewport = localStorage.getItem(previewViewportKey);
    const storedWidth = localStorage.getItem(previewWidthKey);
    const storedSync = localStorage.getItem(previewSyncKey);
    if (previewViewport && storedViewport) previewViewport.value = storedViewport;
    if (previewWidth && storedWidth) previewWidth.value = storedWidth;
    if (previewSync && storedSync) previewSync.checked = storedSync !== "off";
  }

  return { render };
}
