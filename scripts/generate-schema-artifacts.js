import { readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { mergeComponentSources } from "./lib/component-schema.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const checkOnly = process.argv.includes("--check");
const generatedSnippetPath = join(root, ".vscode", "rpg.schema.code-snippets");
const referencePath = join(root, "docs", "reference.md");

async function main() {
  const schema = await loadSchema();
  const artifacts = [
    {
      path: generatedSnippetPath,
      content: `${JSON.stringify(generateSnippets(schema), null, 2)}\n`
    },
    {
      path: referencePath,
      content: generateReference(schema)
    }
  ];

  if (checkOnly) {
    const stale = [];
    for (const artifact of artifacts) {
      const current = await readFile(artifact.path, "utf8").catch(() => "");
      if (current !== artifact.content) stale.push(artifact.path);
    }

    if (stale.length) {
      throw new Error(`Artefatti schema non aggiornati: ${stale.map((path) => path.replace(`${root}/`, "")).join(", ")}`);
    }

    console.log("Artefatti schema aggiornati.");
    return;
  }

  for (const artifact of artifacts) {
    await writeFile(artifact.path, artifact.content, "utf8");
  }

  console.log("Artefatti schema generati: docs/reference.md, .vscode/rpg.schema.code-snippets.");
}

async function loadSchema() {
  const manifest = await readJson(join(root, "schemas", "components.json"));
  const sources = [{
    id: "core",
    name: "Core",
    schema: await readJson(resolveSchemaPath(manifest.core))
  }];

  for (const pack of manifest.packs || []) {
    if (pack.enabled === false) continue;
    sources.push({
      id: pack.id,
      name: pack.name,
      schema: await readJson(resolveSchemaPath(pack.path))
    });
  }

  return mergeComponentSources(sources);
}

function generateSnippets(schema) {
  const snippets = {
    "TTRPG Frontmatter": {
      prefix: "frontttrpg",
      body: [
        "---",
        "title: ${1:Titolo}",
        "slug: ${2:slug-documento}",
        "summary: ${3:Riassunto breve.}",
        "category: ${4:avventure}",
        "tags: ${5:dungeon, livello-1}",
        "compatibility: 5e/5.5e",
        "license_mode: srd-5.2-cc",
        "author: ${6:Andrea}",
        "theme: ${7|fifth-edition-compatible,mm-2024,dmg-2024,strahd,classic-parchment,old-school,dark-arcane,mythos,modern-5-5,clean-guild,printer-friendly|}",
        "paper: ${8|A4,Letter|}",
        "public: ${9|true,false|}",
        "---"
      ],
      description: "Frontmatter completo per documenti TTRPG"
    }
  };

  for (const component of schema.components) {
    snippets[`Schema ${component.label}`] = {
      prefix: `q${component.id.replace(/-/g, "")}`,
      body: componentSnippetBody(component),
      description: `${component.label} da schema (${component.source_name || "Core"})`
    };
  }

  return snippets;
}

function componentSnippetBody(component) {
  let tabstop = 1;
  const labelPlaceholder = placeholder(tabstop++, component.default_label || component.label);
  const lines = [`::: ${component.container} ${labelPlaceholder}`];

  for (const field of component.fields || []) {
    if (field.key === "body") {
      const bodyLines = String(field.default ?? sampleValue(field)).split("\n");
      for (const bodyLine of bodyLines) {
        lines.push(placeholder(tabstop++, bodyLine));
      }
    } else {
      const value = placeholder(tabstop++, field.default ?? sampleValue(field));
      lines.push(`${field.key}: ${value}`);
    }
  }

  for (const list of component.lists || []) {
    const name = placeholder(tabstop++, list.default_name || list.label);
    const text = placeholder(tabstop++, list.default_text || "Descrizione.");
    lines.push(`${list.key}: ${name} | ${text}`);
  }

  lines.push(":::");
  return lines;
}

function generateReference(schema) {
  const groups = groupBy(schema.components, "group");
  const sections = [];

  for (const [group, components] of Object.entries(groups)) {
    sections.push(`## ${group}`);
    for (const component of components) {
      sections.push([
        `### ${component.label}`,
        "",
        `<p class="muted"><strong>${component.source_name || "Core"}.</strong> ${escapeMarkdown(component.description)}</p>`,
        "",
        sampleBlock(component)
      ].join("\n"));
    }
  }

  return [
    "---",
    "title: Reference Componenti TTRPG",
    "slug: reference-componenti",
    "summary: Pagina generata dallo schema componenti per verificare temi, plugin pack e resa Markdown.",
    "category: reference",
    "tags: componenti, preview, autore, schema",
    "compatibility: 5e/5.5e",
    "license_mode: srd-5.2-cc",
    "author: Andrea",
    "theme: clean-guild",
    "paper: A4",
    "public: false",
    "---",
    "",
    "# Reference Componenti TTRPG",
    "",
    "<p class=\"subtitle\">Pagina generata da <code>schemas/components.json</code> e dai plugin pack abilitati.</p>",
    "",
    "<p class=\"dropcap\">Questa reference e rigenerabile con <code>npm run generate:schema-artifacts</code>. Ogni blocco sotto usa la sintassi breve <code>:::</code>, cosi lo stesso schema alimenta editor, snippet e documentazione.</p>",
    "",
    ...sections,
    "",
    "## Tabelle Markdown",
    "",
    "| d8 | Complicazione |",
    "|---|---|",
    "| 1 | Una fazione rivale arriva prima |",
    "| 2 | Il tesoro e gia stato spostato |",
    "| 3 | Un alleato mente per paura |",
    "| 4 | La mappa e corretta ma incompleta |",
    "",
    "<div class=\"center smallcaps muted mt-3\">Fine reference generata</div>",
    ""
  ].join("\n");
}

function sampleBlock(component) {
  return componentSnippetBody(component)
    .map((line) => line.replace(/\$\{\d+:(.*?)\}/g, "$1"))
    .join("\n");
}

function sampleValue(field) {
  if (field.type === "number") return 10;
  if (field.type === "textarea") return "Descrizione.";
  return field.label;
}

function placeholder(index, value) {
  return `\${${index}:${escapeSnippet(String(value))}}`;
}

function groupBy(items, key) {
  return items.reduce((groups, item) => {
    const value = item[key] || "Altro";
    groups[value] ||= [];
    groups[value].push(item);
    return groups;
  }, {});
}

function escapeMarkdown(value) {
  return String(value).replace(/\|/g, "\\|");
}

function escapeSnippet(value) {
  return value
    .replace(/\\/g, "\\\\")
    .replace(/\$/g, "\\$")
    .replace(/}/g, "\\}");
}

function resolveSchemaPath(path) {
  if (!path || path.includes("..")) throw new Error(`Path schema non consentito: ${path}`);
  return resolve(root, path.replace(/^\/+/, ""));
}

async function readJson(path) {
  return JSON.parse(await readFile(path, "utf8"));
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});
