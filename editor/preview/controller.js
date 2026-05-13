import { renderMarkdown as renderComponentMarkdown } from "/editor/components/preview.js";
import { renderComponentValidation } from "/editor/components/validation.js";
import { parseFrontmatter } from "/editor/documents/frontmatter.js";
import { renderPreviewDocument } from "/editor/documents/preview-shell.js";
import { countWords } from "/editor/markdown/editor-actions.js";

export function createPreviewController({
  preview,
  wordCount,
  validationPanel,
  getMarkdown,
  getSchema
}) {
  function render() {
    const markdown = getMarkdown();
    const schema = getSchema();
    const { metadata, body } = parseFrontmatter(markdown);

    preview.srcdoc = renderPreviewDocument(metadata, renderComponentMarkdown(body, schema));
    wordCount.textContent = `${countWords(body)} parole`;
    renderComponentValidation(markdown, schema, validationPanel);
  }

  return { render };
}
