import { mergeComponentSources, slugifyDocumentName, validateMarkdownBlocks } from "/scripts/lib/component-schema.js";

const storageKey = "rpg-text-editor:draft";
const manifestUrl = "/schemas/components.json";

const input = document.querySelector("#markdown-input");
const preview = document.querySelector("#preview");
const componentList = document.querySelector("#component-list");
const componentSearch = document.querySelector("#component-search");
const dialog = document.querySelector("#component-dialog");
const dialogTitle = document.querySelector("#dialog-title");
const dialogDescription = document.querySelector("#dialog-description");
const componentForm = document.querySelector("#component-form");
const insertButton = document.querySelector("#insert-component");
const saveState = document.querySelector("#save-state");
const wordCount = document.querySelector("#word-count");
const validationPanel = document.querySelector("#validation-panel");
const documentPicker = document.querySelector("#document-picker");

let schema;
let manifest;
let selectedComponent;

const starterDocument = `---
title: Nuova Avventura
slug: nuova-avventura
summary: Bozza creata dall'editor locale.
category: avventure
tags: bozza, ttrpg
compatibility: 5e/5.5e
license_mode: srd-5.2-cc
author: Andrea
theme: classic-parchment
paper: A4
public: true
---

# Nuova Avventura

<p class="subtitle">Una premessa pronta da sviluppare.</p>

## Scena iniziale

Scrivi qui la prima scena.
`;

init();

async function init() {
  ({ manifest, schema } = await loadComponentManifest(manifestUrl));

  input.value = localStorage.getItem(storageKey) || starterDocument;
  renderComponentList();
  await refreshDocumentPicker();
  renderPreview();

  input.addEventListener("input", () => {
    localStorage.setItem(storageKey, input.value);
    saveState.textContent = "Salvato localmente";
    renderPreview();
  });

  componentSearch.addEventListener("input", renderComponentList);
  document.querySelector("#new-document").addEventListener("click", resetDraft);
  document.querySelector("#copy-markdown").addEventListener("click", copyMarkdown);
  document.querySelector("#download-markdown").addEventListener("click", downloadMarkdown);
  document.querySelector("#save-document").addEventListener("click", saveDocumentToDocs);
  documentPicker.addEventListener("change", importSelectedDocument);
  insertButton.addEventListener("click", insertSelectedComponent);
}

async function loadComponentManifest(url) {
  const loadedManifest = await fetchJson(url, "Manifest componenti non caricato");
  const sources = [];
  const core = await fetchJson(loadedManifest.core, "Schema core non caricato");
  sources.push({ id: "core", name: "Core", schema: core });

  for (const pack of loadedManifest.packs || []) {
    if (pack.enabled === false) continue;

    const packSchema = await fetchJson(pack.path, `Plugin pack non caricato: ${pack.id}`);
    sources.push({ id: pack.id, name: pack.name, schema: packSchema });
  }

  return {
    manifest: loadedManifest,
    schema: mergeComponentSources(sources)
  };
}

async function fetchJson(url, errorMessage) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`${errorMessage}: ${response.status}`);
  return response.json();
}

function renderComponentList() {
  const query = componentSearch.value.trim().toLowerCase();
  const components = schema.components.filter((component) => {
    const haystack = [component.label, component.group, component.description, component.id].join(" ").toLowerCase();
    return haystack.includes(query);
  });
  const groups = groupBy(components, "group");

  componentList.replaceChildren(...Object.entries(groups).map(([group, groupComponents]) => {
    const section = document.createElement("section");
    section.className = "component-group";
    section.innerHTML = `<h3>${escapeHtml(group)}</h3>`;

    for (const component of groupComponents) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "component-card";
      button.innerHTML = `
        <span>${escapeHtml(component.label)}</span>
        <small>${escapeHtml(component.description)}</small>
        <em>${escapeHtml(component.source_name || "Core")}</em>
      `;
      button.addEventListener("click", () => openComponentDialog(component));
      section.append(button);
    }

    return section;
  }));
}

function openComponentDialog(component) {
  selectedComponent = component;
  dialogTitle.textContent = component.label;
  dialogDescription.textContent = component.description;
  componentForm.replaceChildren();

  const labelField = createField({
    key: "__label",
    label: "Etichetta blocco",
    type: "text",
    default: component.default_label || component.label
  });
  componentForm.append(labelField);

  for (const field of component.fields || []) {
    componentForm.append(createField(field));
  }

  for (const [index, list] of (component.lists || []).entries()) {
    componentForm.append(createListField(list, index));
  }

  dialog.showModal();
}

function createField(field) {
  const wrapper = document.createElement("label");
  wrapper.className = "field";
  wrapper.dataset.key = field.key;
  wrapper.innerHTML = `<span>${escapeHtml(field.label)}${field.required ? " *" : ""}</span>`;

  const control = field.type === "textarea" ? document.createElement("textarea") : document.createElement("input");
  control.name = field.key;
  control.value = field.default ?? "";
  if (field.type === "number") {
    control.type = "number";
  } else if (field.type !== "textarea") {
    control.type = "text";
  }
  if (field.required) control.required = true;
  wrapper.append(control);

  return wrapper;
}

function createListField(list, index) {
  const wrapper = document.createElement("fieldset");
  wrapper.className = "list-field";
  wrapper.dataset.listKey = list.key;
  wrapper.dataset.listIndex = String(index);
  wrapper.innerHTML = `<legend>${escapeHtml(list.label)}</legend>`;
  const row = document.createElement("div");
  row.className = "list-row";
  row.innerHTML = `
    <input name="${escapeHtml(list.key)}__name__${index}" value="${escapeHtml(list.default_name || "")}" aria-label="${escapeHtml(list.label)} nome">
    <textarea name="${escapeHtml(list.key)}__text__${index}" aria-label="${escapeHtml(list.label)} testo">${escapeHtml(list.default_text || "")}</textarea>
  `;
  wrapper.append(row);
  return wrapper;
}

function insertSelectedComponent() {
  if (!selectedComponent) return;

  const markdown = componentToMarkdown(selectedComponent);
  insertAtCursor(input, markdown);
  localStorage.setItem(storageKey, input.value);
  renderPreview();
  dialog.close();
}

function componentToMarkdown(component) {
  const values = new FormData(dialog.querySelector("form"));
  const label = String(values.get("__label") || component.default_label || "").trim();
  const lines = [`::: ${component.container}${label ? ` ${label}` : ""}`];

  for (const field of component.fields || []) {
    const value = String(values.get(field.key) || "").trim();
    if (!value) continue;

    if (field.key === "body") {
      lines.push(value);
    } else {
      lines.push(`${field.key}: ${value}`);
    }
  }

  for (const [index, list] of (component.lists || []).entries()) {
    const name = String(values.get(`${list.key}__name__${index}`) || "").trim();
    const text = String(values.get(`${list.key}__text__${index}`) || "").trim();
    if (name || text) lines.push(`${list.key}: ${name} | ${text}`);
  }

  lines.push(":::");
  return `\n\n${lines.join("\n")}\n`;
}

function insertAtCursor(textarea, text) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  textarea.value = `${textarea.value.slice(0, start)}${text}${textarea.value.slice(end)}`;
  textarea.focus();
  textarea.selectionStart = textarea.selectionEnd = start + text.length;
}

function renderPreview() {
  const { body } = stripFrontmatter(input.value);
  preview.innerHTML = renderMarkdown(body);
  wordCount.textContent = `${countWords(body)} parole`;
  renderValidation();
}

function renderValidation() {
  const diagnostics = validateMarkdownBlocks(input.value, schema);
  validationPanel.className = `validation-panel${diagnostics.some((item) => item.severity === "error") ? " has-errors" : ""}`;

  if (!diagnostics.length) {
    validationPanel.innerHTML = '<strong>Schema ok</strong><span>Nessun problema nei componenti Markdown.</span>';
    return;
  }

  validationPanel.innerHTML = [
    "<strong>Controllo schema</strong>",
    "<ul>",
    ...diagnostics.map((diagnostic) => `<li class="${diagnostic.severity}">Riga ${diagnostic.line}: ${escapeHtml(diagnostic.message)}</li>`),
    "</ul>"
  ].join("");
}

function renderMarkdown(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const out = [];

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) continue;

    const container = trimmed.match(/^:::\s*([a-z0-9_-]+)(?:\s+(.*))?$/i);
    if (container) {
      const [, name, label] = container;
      const inner = [];
      while (++i < lines.length && lines[i].trim() !== ":::") inner.push(lines[i]);
      out.push(renderContainer(name, label, inner.join("\n")));
      continue;
    }

    if (/^<[^>]+>/.test(trimmed) || /^<\/[^>]+>/.test(trimmed)) {
      out.push(line);
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      out.push(`<h${level}>${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i += 1;
      }
      i -= 1;
      out.push(`<ul>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`);
      continue;
    }

    const paragraph = [trimmed];
    while (i + 1 < lines.length && lines[i + 1].trim() && !/^(#{1,6})\s+/.test(lines[i + 1].trim()) && !/^:::\s*/.test(lines[i + 1].trim())) {
      paragraph.push(lines[i + 1].trim());
      i += 1;
    }
    out.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
  }

  return out.join("\n");
}

function renderContainer(name, label, markdown) {
  const data = parseBlockData(markdown);
  const component = schema.components.find((item) => item.container === name || item.id === name);
  const className = component?.container || name;
  const title = label || component?.default_label || component?.label || name;

  if (["monster", "spell", "magicitem", "npc", "location", "hazard"].includes(className)) {
    return renderRulesComponent(className, title, data);
  }

  if (className === "random-table") return renderRandomTable(title, data);
  if (className === "map" || className === "image") return renderMedia(className, title, data);
  if (component) return renderSchemaComponent(component, title, data);

  return `<aside class="${escapeHtml(className)} no-break"><div class="${escapeHtml(className)}__label">${renderInline(title)}</div>${renderMarkdown(data.body.join("\n"))}</aside>`;
}

function renderSchemaComponent(component, label, data) {
  const className = component.container;
  const bodyKeys = new Set(["body"]);
  const lines = (component.fields || [])
    .filter((field) => !bodyKeys.has(field.key) && data[field.key])
    .map((field) => `<p class="rules-line"><strong>${renderInline(field.label)}.</strong> ${renderInline(data[field.key])}</p>`)
    .join("");
  const features = [...(data.hooks || []), ...(data.traits || []), ...(data.actions || [])]
    .map((item) => `<p><strong>${renderInline(item.name)}.</strong> ${renderInline(item.text)}</p>`)
    .join("");

  return `
    <aside class="${escapeHtml(className)} rules-card no-break">
      <div class="${escapeHtml(className)}__label rules-card__label">${renderInline(label)}</div>
      <h3>${renderInline(data.name || label)}</h3>
      ${lines}
      ${features}
      ${data.body.length ? renderMarkdown(data.body.join("\n")) : ""}
    </aside>
  `;
}

function renderRulesComponent(className, label, data) {
  const headingLevel = className === "monster" ? "h2" : "h3";
  const classes = className === "monster" ? "statblock monster no-break" : `${className} rules-card no-break`;
  const titleClass = className === "monster" ? "statblock__label" : `${className}__label rules-card__label`;
  const features = [...(data.traits || []), ...(data.actions || []), ...(data.hooks || [])];
  const meta = [data.meta, data.level, data.school, data.type, data.rarity, data.role, data.tags].filter(Boolean).join(", ");

  return `
    <aside class="${classes}">
      <div class="${titleClass}">${renderInline(label)}</div>
      <${headingLevel}>${renderInline(data.name || label)}</${headingLevel}>
      ${meta ? `<p><em>${renderInline(meta)}</em></p>` : ""}
      ${renderDataLines(data)}
      ${features.map((item) => `<p><strong>${renderInline(item.name)}.</strong> ${renderInline(item.text)}</p>`).join("")}
      ${data.body.length ? renderMarkdown(data.body.join("\n")) : ""}
    </aside>
  `;
}

function renderDataLines(data) {
  const skip = new Set(["name", "meta", "level", "school", "type", "rarity", "role", "tags", "body", "traits", "actions", "hooks", "rows"]);
  return Object.entries(data)
    .filter(([key, value]) => !skip.has(key) && value)
    .map(([key, value]) => `<p class="rules-line"><strong>${labelFor(key)}.</strong> ${renderInline(String(value))}</p>`)
    .join("");
}

function renderRandomTable(label, data) {
  const rows = (data.rows || []).map((row) => `<tr><td>${renderInline(row.name)}</td><td>${renderInline(row.text)}</td></tr>`).join("");
  return `<aside class="random-table no-break"><div class="random-table__label">${renderInline(data.die || label)}</div><h3>${renderInline(data.name || "Tabella")}</h3><table class="table-compact"><tbody>${rows}</tbody></table></aside>`;
}

function renderMedia(className, label, data) {
  return `<figure class="rpg-${className} no-break"><img src="${escapeHtml(data.src || "")}" alt="${escapeHtml(data.alt || label)}"><figcaption>${renderInline(data.caption || label)}</figcaption></figure>`;
}

function parseBlockData(markdown) {
  const data = { body: [], traits: [], actions: [], hooks: [], rows: [] };

  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;
    const index = line.indexOf(":");

    if (index > 0 && /^[a-zA-Z][a-zA-Z0-9_-]*:/.test(line)) {
      const key = line.slice(0, index).trim().toLowerCase();
      const value = line.slice(index + 1).trim();
      if (["trait", "action", "hook", "row"].includes(key)) {
        const listName = { trait: "traits", action: "actions", hook: "hooks", row: "rows" }[key];
        data[listName].push(splitPair(value));
      } else {
        data[key] = value;
      }
      continue;
    }

    data.body.push(line);
  }

  return data;
}

function splitPair(value) {
  const [name, ...rest] = value.split("|");
  return { name: name.trim(), text: rest.join("|").trim() };
}

function renderInline(text) {
  return escapeHtml(String(text))
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
}

function stripFrontmatter(markdown) {
  if (!markdown.startsWith("---\n")) return { body: markdown };
  const end = markdown.indexOf("\n---", 4);
  return end === -1 ? { body: markdown } : { body: markdown.slice(end + 4).trimStart() };
}

function resetDraft() {
  input.value = starterDocument;
  localStorage.setItem(storageKey, input.value);
  renderPreview();
}

async function copyMarkdown() {
  await navigator.clipboard.writeText(input.value);
  saveState.textContent = "Markdown copiato";
}

function downloadMarkdown() {
  const blob = new Blob([input.value], { type: "text/markdown;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `${slugifyDocumentName(input.value)}.md`;
  link.click();
  URL.revokeObjectURL(link.href);
}

async function saveDocumentToDocs() {
  const filename = `${slugifyDocumentName(input.value)}.md`;
  const response = await fetch("/api/documents", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ filename, content: input.value })
  });

  if (!response.ok) {
    saveState.textContent = "Salvataggio non riuscito";
    return;
  }

  const result = await response.json();
  saveState.textContent = `Salvato in docs/${result.filename}`;
  await refreshDocumentPicker(result.filename);
}

async function refreshDocumentPicker(selected = "") {
  const response = await fetch("/api/documents");
  if (!response.ok) return;

  const { documents } = await response.json();
  documentPicker.replaceChildren(new Option("Apri documento", ""));
  for (const document of documents) {
    documentPicker.append(new Option(document.title || document.filename, document.filename));
  }
  documentPicker.value = selected;
}

async function importSelectedDocument() {
  if (!documentPicker.value) return;

  const response = await fetch(`/api/documents/${encodeURIComponent(documentPicker.value)}`);
  if (!response.ok) {
    saveState.textContent = "Import non riuscito";
    return;
  }

  const { content, filename } = await response.json();
  input.value = content;
  localStorage.setItem(storageKey, input.value);
  saveState.textContent = `Aperto docs/${filename}`;
  renderPreview();
}

function groupBy(items, key) {
  return items.reduce((groups, item) => {
    const value = item[key] || "Altro";
    groups[value] ||= [];
    groups[value].push(item);
    return groups;
  }, {});
}

function countWords(text) {
  return (text.match(/\b[\w'’]+\b/g) || []).length;
}

function labelFor(key) {
  return {
    casting_time: "Tempo di lancio",
    range: "Gittata",
    components: "Componenti",
    duration: "Durata",
    saves: "Tiri salvezza",
    skills: "Abilita",
    resistances: "Resistenze",
    immunities: "Immunita",
    senses: "Sensi",
    languages: "Linguaggi",
    motive: "Motivazione",
    secret: "Segreto",
    voice: "Voce",
    appearance: "Aspetto",
    mood: "Atmosfera",
    danger: "Pericolo",
    treasure: "Tesoro",
    trigger: "Innesco",
    effect: "Effetto",
    countermeasure: "Contromisura",
    dc: "CD"
  }[key] || key.replaceAll("_", " ").replace(/^\w/, (letter) => letter.toUpperCase());
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
