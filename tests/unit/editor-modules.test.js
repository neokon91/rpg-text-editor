import test from "node:test";
import assert from "node:assert/strict";
import { buildComponentMarkdown, buildComponentMarkdownFromValues, defaultComponentValues } from "../../editor-next/src/components/componentMarkdown.js";
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
