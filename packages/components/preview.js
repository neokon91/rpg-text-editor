import { challengeText, hasAbilities, initiativeText, renderAbilityTables } from "./statblock.js";

export function renderMarkdown(markdown, schema, options = {}) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  const startLine = options.startLine || 1;

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();
    if (!trimmed) continue;
    const sourceLine = startLine + i;

    const container = trimmed.match(/^:::\s*([a-z0-9_-]+)(?:\s+(.*))?$/i);
    if (container) {
      const [, name, label] = container;
      const inner = [];
      while (++i < lines.length && lines[i].trim() !== ":::") inner.push(lines[i]);
      out.push(renderContainer(name, label, inner.join("\n"), schema, sourceLine, startLine + i));
      continue;
    }

    if (/^<[^>]+>/.test(trimmed) || /^<\/[^>]+>/.test(trimmed)) {
      out.push(line);
      continue;
    }

    if (trimmed === "\\page" || trimmed === "::pagebreak") {
      out.push(`<div class="page-break" data-source-line="${sourceLine}" aria-label="Interruzione pagina"></div>`);
      continue;
    }

    if (trimmed === "\\column" || trimmed === "::column") {
      out.push(`<div class="column-break" data-source-line="${sourceLine}" aria-label="Interruzione colonna"></div>`);
      continue;
    }

    if (trimmed === "---" || trimmed === "***" || trimmed === "___") {
      out.push(`<hr data-source-line="${sourceLine}">`);
      continue;
    }

    const heading = trimmed.match(/^(#{1,6})\s+(.+)$/);
    if (heading) {
      const level = heading[1].length;
      out.push(`<h${level} data-source-line="${sourceLine}">${renderInline(heading[2])}</h${level}>`);
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^[-*]\s+/, ""));
        i += 1;
      }
      i -= 1;
      out.push(`<ul ${sourceAttrs(sourceLine, startLine + i)}>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ul>`);
      continue;
    }

    if (isTableStart(lines, i)) {
      const table = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        table.push(lines[i]);
        i += 1;
      }
      i -= 1;
      out.push(renderTable(table, sourceLine, startLine + i));
      continue;
    }

    const paragraph = [trimmed];
    while (i + 1 < lines.length && lines[i + 1].trim() && !/^(#{1,6})\s+/.test(lines[i + 1].trim()) && !/^:::\s*/.test(lines[i + 1].trim())) {
      paragraph.push(lines[i + 1].trim());
      i += 1;
    }
    out.push(`<p ${sourceAttrs(sourceLine, startLine + i)}>${renderInline(paragraph.join(" "))}</p>`);
  }

  return out.join("\n");
}

function renderTable(lines, sourceLine, sourceEndLine = sourceLine) {
  const [header, , ...rows] = lines;
  return [
    `<table class="table-compact" ${sourceAttrs(sourceLine, sourceEndLine)}>`,
    `<thead><tr>${splitTableRow(header).map((cell) => `<th>${renderInline(cell)}</th>`).join("")}</tr></thead>`,
    `<tbody>${rows.map((row) => `<tr>${splitTableRow(row).map((cell) => `<td>${renderInline(cell)}</td>`).join("")}</tr>`).join("")}</tbody>`,
    "</table>"
  ].join("");
}

function splitTableRow(row) {
  return row.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
}

function isTableStart(lines, index) {
  return lines[index]?.includes("|") && /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[index + 1] || "");
}

const proseDirectives = new Set(["subtitle", "dropcap", "lead"]);

function renderContainer(name, label, markdown, schema, sourceLine, sourceEndLine = sourceLine) {
  if (proseDirectives.has(name.toLowerCase())) {
    return renderProse(name.toLowerCase(), label, markdown, sourceLine, sourceEndLine);
  }

  if (name.toLowerCase() === "wide" || name.toLowerCase() === "frame") {
    const mods = new Set([name.toLowerCase(), ...(label || "").toLowerCase().split(/\s+/).filter(Boolean)]);
    const className = ["wide", "frame"].filter((mod) => mods.has(mod)).join(" ");
    return `<div class="${className}" ${sourceAttrs(sourceLine, sourceEndLine)}>${renderMarkdown(markdown, schema, { startLine: sourceLine })}</div>`;
  }

  if (name.toLowerCase() === "fullpage" || name.toLowerCase() === "cover") {
    const pageData = parseBlockData(markdown);
    const fit = pageData.fit === "contain" ? "contain" : "cover";
    return `<div class="page-image" data-fit="${fit}" ${sourceAttrs(sourceLine, sourceEndLine)}><img src="${escapeHtml(pageData.src || "")}" alt="${escapeHtml(pageData.alt || label || "")}"></div>`;
  }

  const data = parseBlockData(markdown);
  const component = schema.components.find((item) => item.container === name || item.id === name);
  const className = component?.container || name;
  const title = label || component?.default_label || component?.label || name;

  if (className === "monster") return renderStatblock(title, data, schema, sourceLine, sourceEndLine);

  if (["spell", "magicitem", "npc", "location", "hazard"].includes(className)) {
    return renderRulesComponent(className, title, data, schema, sourceLine, sourceEndLine);
  }

  if (className === "random-table") return renderRandomTable(title, data, sourceLine, sourceEndLine);
  if (className === "map" || className === "image") return renderMedia(className, title, data, sourceLine, sourceEndLine);
  if (component && hasNamedHeading(component)) return renderSchemaComponent(component, title, data, schema, sourceLine, sourceEndLine);

  const body = Array.isArray(data.body) ? data.body : [data.body].filter(Boolean);
  return `<aside class="${escapeHtml(className)} no-break" ${sourceAttrs(sourceLine, sourceEndLine)}><div class="${escapeHtml(className)}__label">${renderInline(title)}</div>${renderMarkdown(body.join("\n"), schema, { startLine: sourceLine })}</aside>`;
}

function renderSchemaComponent(component, label, data, schema, sourceLine, sourceEndLine = sourceLine) {
  const className = component.container;
  const body = componentBody(data);
  const bodyKeys = new Set(["body"]);
  const lines = (component.fields || [])
    .filter((field) => !bodyKeys.has(field.key) && data[field.key])
    .map((field) => `<p class="rules-line"><strong>${renderInline(field.label)}.</strong> ${renderInline(data[field.key])}</p>`)
    .join("");
  const features = [...(data.hooks || []), ...(data.traits || []), ...(data.actions || [])]
    .map((item) => `<p><strong>${renderInline(item.name)}.</strong> ${renderInline(item.text)}</p>`)
    .join("");

  return `
    <aside class="${escapeHtml(className)} rules-card no-break" ${sourceAttrs(sourceLine, sourceEndLine)}>
      <div class="${escapeHtml(className)}__label rules-card__label">${renderInline(label)}</div>
      <h3>${renderInline(data.name || label)}</h3>
      ${lines}
      ${features}
      ${body.length ? renderMarkdown(body.join("\n"), schema, { startLine: sourceLine }) : ""}
    </aside>
  `;
}

function renderRulesComponent(className, label, data, schema, sourceLine, sourceEndLine = sourceLine) {
  const body = componentBody(data);
  const headingLevel = className === "monster" ? "h2" : "h3";
  const classes = className === "monster" ? "statblock monster no-break" : `${className} rules-card no-break`;
  const titleClass = className === "monster" ? "statblock__label" : `${className}__label rules-card__label`;
  const features = [...(data.traits || []), ...(data.actions || []), ...(data.hooks || [])];
  const meta = [data.meta, data.level, data.school, data.type, data.rarity, data.role, data.tags].filter(Boolean).join(", ");

  return `
    <aside class="${classes}" ${sourceAttrs(sourceLine, sourceEndLine)}>
      <div class="${titleClass}">${renderInline(label)}</div>
      <${headingLevel}>${renderInline(data.name || label)}</${headingLevel}>
      ${meta ? `<p><em>${renderInline(meta)}</em></p>` : ""}
      ${renderDataLines(data)}
      ${features.map((item) => `<p><strong>${renderInline(item.name)}.</strong> ${renderInline(item.text)}</p>`).join("")}
      ${body.length ? renderMarkdown(body.join("\n"), schema, { startLine: sourceLine }) : ""}
    </aside>
  `;
}

function renderStatblock(label, data, schema, sourceLine, sourceEndLine = sourceLine) {
  const body = componentBody(data);
  const showInitiative = hasAbilities(data) || data.initiative;
  const headLines = [
    ["CA", data.ac],
    ["Iniziativa", showInitiative ? initiativeText(data) : ""],
    ["PF", data.hp],
    ["Velocità", data.speed]
  ]
    .filter(([, value]) => value)
    .map(([key, value]) => `<span><strong>${key}</strong> ${renderInline(String(value))}</span>`)
    .join("");
  const abilityTables = hasAbilities(data) ? renderAbilityTables(data) : "";
  const keyValues = ["skills", "resistances", "immunities", "senses", "languages"]
    .filter((key) => data[key])
    .map((key) => `<p class="rules-line"><strong>${labelFor(key)}.</strong> ${renderInline(String(data[key]))}</p>`)
    .join("");
  const cr = challengeText(data);
  const crLine = cr ? `<p class="rules-line cr-line"><strong>GS</strong> ${renderInline(cr.replace(/^GS\s*/, ""))}</p>` : "";
  const featureList = (items, title) => (items && items.length)
    ? `<h3 class="feature-heading">${title}</h3>${items.map((item) => `<p><strong>${renderInline(item.name)}.</strong> ${renderInline(item.text)}</p>`).join("")}`
    : "";

  return `
    <aside class="statblock monster no-break" ${sourceAttrs(sourceLine, sourceEndLine)}>
      <div class="statblock__label">${renderInline(label)}</div>
      <h2>${renderInline(data.name || label)}</h2>
      ${data.meta ? `<p class="creature-meta"><em>${renderInline(data.meta)}</em></p>` : ""}
      <div class="statline">${headLines}</div>
      ${abilityTables}
      ${keyValues}
      ${crLine}
      ${featureList(data.traits, "Tratti")}
      ${featureList(data.actions, "Azioni")}
      ${body.length ? renderMarkdown(body.join("\n"), schema, { startLine: sourceLine }) : ""}
    </aside>
  `;
}

function componentBody(data) {
  return Array.isArray(data.body) ? data.body : [data.body].filter(Boolean);
}

function renderDataLines(data) {
  const skip = new Set(["name", "meta", "level", "school", "type", "rarity", "role", "tags", "body", "traits", "actions", "hooks", "rows"]);
  return Object.entries(data)
    .filter(([key, value]) => !skip.has(key) && value)
    .map(([key, value]) => `<p class="rules-line"><strong>${labelFor(key)}.</strong> ${renderInline(String(value))}</p>`)
    .join("");
}

function renderRandomTable(label, data, sourceLine, sourceEndLine = sourceLine) {
  const rows = (data.rows || []).map((row) => `<tr><td>${renderInline(row.name)}</td><td>${renderInline(row.text)}</td></tr>`).join("");
  return `<aside class="random-table no-break" ${sourceAttrs(sourceLine, sourceEndLine)}><div class="random-table__label">${renderInline(data.die || label)}</div><h3>${renderInline(data.name || "Tabella")}</h3><table class="table-compact"><tbody>${rows}</tbody></table></aside>`;
}

function renderMedia(className, label, data, sourceLine, sourceEndLine = sourceLine) {
  return `<figure class="rpg-${className} no-break" ${sourceAttrs(sourceLine, sourceEndLine)}><img src="${escapeHtml(data.src || "")}" alt="${escapeHtml(data.alt || label)}"><figcaption>${renderInline(data.caption || label)}</figcaption></figure>`;
}

function hasNamedHeading(component) {
  return (component.fields || []).some((field) => field.key === "name");
}

function renderProse(className, label, markdown, sourceLine, sourceEndLine = sourceLine) {
  const text = [label, markdown].filter(Boolean).join(" ").replace(/\s*\n\s*/g, " ").trim();
  return `<p class="${className}" ${sourceAttrs(sourceLine, sourceEndLine)}>${renderInline(text)}</p>`;
}

function sourceAttrs(sourceLine, sourceEndLine = sourceLine) {
  const end = Math.max(Number(sourceEndLine) || sourceLine, sourceLine);
  return `data-source-line="${sourceLine}" data-source-end-line="${end}"`;
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
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img class="inline-image" src="$2" alt="$1">')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>")
    .replace(/`([^`]+)`/g, "<code>$1</code>");
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
    attunement: "Sintonia",
    rarity: "Rarita",
    type: "Tipo",
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
