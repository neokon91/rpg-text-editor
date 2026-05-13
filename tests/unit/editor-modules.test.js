import test from "node:test";
import assert from "node:assert/strict";
import {
  applyComponentPreset,
  buildComponentMarkdown,
  buildComponentMarkdownFromValues,
  defaultComponentValues,
  validateComponentValues
} from "../../editor-next/src/components/componentMarkdown.js";
import { insertPageBreakBeforeLine } from "../../editor-next/src/editor/pageBreaks.js";
import { renderMarkdown } from "../../packages/components/preview.js";
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

test("insertPageBreakBeforeLine inserts before the current markdown block", () => {
  const result = insertPageBreakBeforeLine(`# Titolo

Paragrafo uno
continua qui

- voce uno
- voce due`, 4);

  assert.equal(result.line, 3);
  assert.equal(result.inserted, true);
  assert.match(result.markdown, /# Titolo\n\n::pagebreak\n\nParagrafo uno/);

  const duplicate = insertPageBreakBeforeLine(result.markdown, 5);
  assert.equal(duplicate.inserted, false);
  assert.equal(duplicate.markdown, result.markdown);
});
