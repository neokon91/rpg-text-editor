import test from "node:test";
import assert from "node:assert/strict";
import {
  applyComponentPreset,
  buildComponentMarkdown,
  buildComponentMarkdownFromValues,
  defaultComponentValues,
  validateComponentValues
} from "../../editor-next/src/components/componentMarkdown.js";
import { insertPageBreakBeforeLine, insertPageBreaksBeforeLines, predictPageBreakLines } from "../../editor-next/src/editor/pageBreaks.js";
import { renderMarkdown } from "../../packages/components/preview.js";
import { renderPreviewDocument } from "../../packages/documents/preview-shell.js";
import { checkDocument, listDocuments, saveDocument } from "../../packages/documents/api.js";
import { parseMarkdownOutline } from "../../packages/markdown/outline.js";

test("parseMarkdownOutline ignores fenced headings and strips inline HTML", () => {
  const outline = parseMarkdownOutline(`# Titolo <span>x</span>

\`\`\`md
## Ignorato
\`\`\`

### Sezione finale ###`);

  assert.deepEqual(outline, [
    { level: 1, title: "Titolo x", line: 1 },
    { level: 3, title: "Sezione finale", line: 7 }
  ]);
});

test("buildComponentMarkdown creates schema driven container blocks", () => {
  const component = {
    id: "spell",
    label: "Incantesimo",
    container: "spell",
    default_label: "Formula rituale",
    fields: [
      { key: "name", default: "Luce del Cartografo" },
      { key: "level", default: "1 livello" },
      { key: "body", default: "Illumina una rotta sicura." }
    ],
    lists: [
      { key: "hook", default_name: "Eco", default_text: "La luce pulsa vicino alle soglie." }
    ]
  };
  const markdown = buildComponentMarkdown(component);

  assert.match(markdown, /::: spell Formula rituale/);
  assert.match(markdown, /name: Luce del Cartografo/);
  assert.match(markdown, /Illumina una rotta sicura\./);
  assert.match(markdown, /hook: Eco \| La luce pulsa vicino alle soglie\./);

  const values = defaultComponentValues(component);
  values.fields.name = "Ombra del Cartografo";
  values.lists[0].text = "La luce si spegne vicino alle soglie.";
  const customized = buildComponentMarkdownFromValues(component, values);

  assert.match(customized, /name: Ombra del Cartografo/);
  assert.match(customized, /hook: Eco \| La luce si spegne vicino alle soglie\./);
});

test("component form values support presets, list removal and required diagnostics", () => {
  const component = {
    id: "random-table",
    label: "Tabella",
    container: "random-table",
    fields: [
      { key: "name", label: "Titolo", type: "text", required: true, default: "Eventi rapidi" },
      { key: "die", label: "Dado", type: "text", default: "d6" }
    ],
    lists: [
      { key: "row", default_name: "1", default_text: "Primo evento." }
    ],
    presets: [
      {
        id: "d4",
        label: "Eventi d4",
        fields: { name: "Eventi d4", die: "d4" },
        lists: [
          { key: "row", name: "1", text: "Evento uno." },
          { key: "row", name: "2", text: "Evento due." }
        ]
      }
    ]
  };

  const values = defaultComponentValues(component);
  assert.equal(values.fields.name, "Eventi d4");
  assert.equal(values.lists.length, 2);

  const sparseValues = { ...values, fields: { ...values.fields, name: "" }, lists: values.lists.slice(0, 1) };
  assert.deepEqual(validateComponentValues(component, sparseValues), [{
    key: "name",
    message: "Titolo e obbligatorio."
  }]);

  const presetValues = applyComponentPreset(component, sparseValues, "d4");
  assert.equal(presetValues.fields.name, "Eventi d4");
  assert.equal(presetValues.lists.length, 2);
});

test("renderMarkdown marks multi-line source ranges for preview sync", () => {
  const html = renderMarkdown(`# Titolo

Riga uno del paragrafo
riga due del paragrafo

- primo
- secondo

| Nome | Valore |
| --- | --- |
| A | B |`, { components: [] });

  assert.match(html, /<p data-source-line="3" data-source-end-line="4">/);
  assert.match(html, /<ul data-source-line="6" data-source-end-line="7">/);
  assert.match(html, /<table class="table-compact" data-source-line="9" data-source-end-line="11">/);
});

test("renderMarkdown supports schema component body fields", () => {
  const html = renderMarkdown(`::: encounter Incontro
name: Guardiani
body: Due custodi proteggono la soglia.
:::`, {
    components: [{
      id: "encounter",
      label: "Incontro",
      container: "encounter",
      fields: [
        { key: "name", label: "Nome" },
        { key: "body", label: "Descrizione" }
      ]
    }]
  });

  assert.match(html, /<aside class="encounter rules-card no-break"/);
  assert.match(html, /Due custodi proteggono la soglia\./);
});

test("insertPageBreakBeforeLine inserts before the current markdown block", () => {
  const result = insertPageBreakBeforeLine(`# Titolo

Paragrafo uno
continua qui

- voce uno
- voce due`, 4);

  assert.equal(result.line, 3);
  assert.equal(result.breakLine, 3);
  assert.equal(result.contentLine, 5);
  assert.equal(result.inserted, true);
  assert.match(result.markdown, /# Titolo\n\n::pagebreak\n\nParagrafo uno/);

  const duplicate = insertPageBreakBeforeLine(result.markdown, 5);
  assert.equal(duplicate.inserted, false);
  assert.equal(duplicate.breakLine, 5);
  assert.equal(duplicate.markdown, result.markdown);
});

test("insertPageBreaksBeforeLines inserts multiple block-aware breaks", () => {
  const result = insertPageBreaksBeforeLines(`# Titolo

Primo blocco
continua

Secondo blocco
continua

Terzo blocco`, [4, 7, 4]);

  assert.equal(result.inserted, 2);
  assert.deepEqual(result.breaks.map((item) => item.targetLine), [4, 7]);
  assert.match(result.markdown, /# Titolo\n\n::pagebreak\n\nPrimo blocco/);
  assert.match(result.markdown, /continua\n\n::pagebreak\n\nSecondo blocco/);
});

test("predictPageBreakLines plans extra block-aware breaks after overflow", () => {
  const blocks = Array.from({ length: 12 }, (_, index) => `Paragrafo ${index + 1}\n${"testo ".repeat(95)}`).join("\n\n");
  const markdown = `# Titolo\n\n${blocks}`;

  const targets = predictPageBreakLines(markdown, [4], { blockWeightThreshold: 18 });

  assert.equal(targets[0], 3);
  assert.ok(targets.length > 1);
  assert.ok(targets.every((line) => markdown.split("\n")[line - 1]?.startsWith("Paragrafo")));
});

test("renderPreviewDocument can enable measured auto pagination", () => {
  const html = renderPreviewDocument({ title: "Preview" }, "<h1 data-source-line=\"1\">Preview</h1>", { autoPaginate: true });

  assert.match(html, /data-auto-paginate="true"/);
  assert.match(html, /function paginatePreviewPages/);
  assert.match(html, /pageOverflows/);
  assert.match(html, /rpg-preview-pagination/);
  assert.match(html, /overflowPages/);
  assert.match(html, /firstOverflowLine/);
});

test("browser-only document api stores documents and runs client checks", async () => {
  withBrowserOnlyStorage();

  const content = `---
title: Browser Test
slug: browser-test
summary: Test browser
compatibility: 5e/5.5e
license_mode: srd-5.2-cc
author: Codex
---

# Browser Test

CD 31`;

  const saved = await saveDocument({ filename: "browser-test.md", content });
  const listed = await listDocuments();
  const checked = await checkDocument({ filename: saved.filename, content });

  assert.equal(saved.filename, "browser-test.md");
  assert.deepEqual(listed.documents, ["browser-test.md"]);
  assert.equal(checked.diagnostics.some((item) => item.message.includes("CD 31 fuori scala")), true);
});

function withBrowserOnlyStorage() {
  const store = new Map();
  globalThis.window = {
    location: { search: "?browser-only" },
    __RPG_TEXT_EDITOR_BROWSER_ONLY__: true
  };
  globalThis.localStorage = {
    getItem: (key) => store.get(key) || null,
    setItem: (key, value) => store.set(key, String(value)),
    removeItem: (key) => store.delete(key)
  };
}
