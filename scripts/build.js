import { cp, mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { dirname, extname, join, resolve, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { spawn } from "node:child_process";
import { mergeComponentSources } from "./lib/component-schema.js";
import { challengeText, hasAbilities, initiativeText, renderAbilityTables } from "../packages/components/statblock.js";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const sourceDir = join(root, "docs");
const outDir = join(root, "dist");
const templatePath = join(root, "templates", "document.html");
const cssPath = join(root, "styles", "main.css");
const assetManifestPath = join(root, "assets", "manifest.json");
const bookManifestPath = join(root, "book.json");
const componentManifestPath = join(root, "schemas", "components.json");

const args = new Set(process.argv.slice(2));
const buildSite = args.has("--site");
const buildBook = args.has("--book");
const buildHtml = args.has("--html") || (!args.has("--pdf") && !buildSite);
const buildPdf = args.has("--pdf");
const autoPages = args.has("--auto-pages");
const sourceArg = [...args].find((arg) => arg.endsWith(".md"));
const sourcePath = sourceArg ? resolve(root, sourceArg) : join(sourceDir, "esempio.md");
let componentSchema = { components: [] };

async function main() {
  const documents = buildSite && !sourceArg && !buildBook
    ? await loadDocuments()
    : [{ path: sourcePath, markdown: await readFile(sourcePath, "utf8") }];
  const css = await loadCss(cssPath);
  const template = await readFile(templatePath, "utf8");
  const assetManifest = await loadAssetManifest();
  componentSchema = await loadComponentSchema();
  await copyBuildAssets(assetManifest, { includeSite: buildSite });

  if (buildBook) {
    const output = await renderBook(css, template, assetManifest);
    await mkdir(dirname(output.htmlPath), { recursive: true });

    if (buildHtml) {
      await writeFile(output.htmlPath, output.rendered, "utf8");
      console.log(`Libro HTML scritto in ${relative(root, output.htmlPath)}`);
    }

    if (buildPdf) {
      await writeFile(output.htmlPath, output.rendered, "utf8");
      await printPdf(output.htmlPath, output.pdfPath);
      console.log(`Libro PDF scritto in ${relative(root, output.pdfPath)}`);
    }

    return;
  }

  const siteEntries = [];

  for (const document of documents) {
    const output = await renderDocument(document, css, template, assetManifest);
    siteEntries.push(output.entry);

    await mkdir(outDir, { recursive: true });

    if (buildHtml) {
      await writeFile(output.htmlPath, output.rendered, "utf8");
      console.log(`HTML scritto in ${relative(root, output.htmlPath)}`);
    }

    if (buildSite) {
      await mkdir(dirname(output.sitePath), { recursive: true });
      await writeFile(output.sitePath, output.rendered, "utf8");
      console.log(`Sito scritto in ${relative(root, output.sitePath)}`);
    }

    if (buildPdf) {
      await writeFile(output.htmlPath, output.rendered, "utf8");
      await printPdf(output.htmlPath, output.pdfPath);
      console.log(`PDF scritto in ${relative(root, output.pdfPath)}`);
    }
  }

  if (buildSite) {
    await mkdir(join(outDir, "site"), { recursive: true });
    await writeFile(join(outDir, "site", "index.html"), renderSiteIndex(siteEntries), "utf8");
  }
}

async function renderDocument(document, css, template, assetManifest) {
  const { metadata, body } = parseFrontmatter(document.markdown);
  const expandedBody = await expandIncludes(body);
  const html = renderMarkdown(expandedBody, { anchorHeadings: true }) + renderLegalAppendix(metadata, assetManifest);
  const title = metadata.title || firstHeading(body) || "Homebrew";
  const slug = metadata.slug || basenameWithoutExt(document.path);
  const documentClass = [
    metadata.class || "homebrew-document",
    metadata.theme ? `theme-${metadata.theme}` : "theme-fifth-edition-compatible",
    metadata.paper ? `paper-${metadata.paper.toLowerCase()}` : ""
  ].filter(Boolean).join(" ");
  const rendered = withAutoPages(template
    .replaceAll("{{title}}", escapeHtml(title))
    .replace("{{styles}}", css)
    .replace("{{content}}", html)
    .replace("{{documentClass}}", documentClass));

  const htmlPath = join(outDir, `${slug}.html`);
  const pdfPath = join(outDir, `${slug}.pdf`);
  const sitePath = join(outDir, "site", slug, "index.html");

  return {
    rendered,
    htmlPath,
    pdfPath,
    sitePath,
    entry: {
      title,
      slug,
      summary: metadata.summary || "",
      category: metadata.category || "homebrew",
      compatibility: metadata.compatibility || "",
      tags: splitList(metadata.tags),
      public: metadata.public !== "false"
    }
  };
}

async function renderBook(css, template, assetManifest) {
  const book = await loadBookManifest();
  const chapters = await Promise.all(book.chapters.map(async (chapter, index) => {
    const chapterPath = resolve(root, chapter.path || chapter);
    const markdown = await readFile(chapterPath, "utf8");
    const { metadata, body } = parseFrontmatter(markdown);
    const expandedBody = await expandIncludes(body);
    const slug = metadata.slug || basenameWithoutExt(chapterPath);
    const title = metadata.title || firstHeading(expandedBody) || `Capitolo ${index + 1}`;

    return {
      body: expandedBody,
      metadata,
      path: chapterPath,
      slug,
      title,
      html: renderMarkdown(expandedBody, { anchorHeadings: true, headingPrefix: slug })
    };
  }));

  const metadata = {
    title: book.title || "Homebrew",
    slug: book.slug || "homebrew-book",
    summary: book.summary || "",
    author: book.author || "Autore indipendente",
    compatibility: book.compatibility || "5e/5.5e",
    license_mode: book.license_mode || "srd-5.2-cc",
    theme: book.theme || "fifth-edition-compatible",
    paper: book.paper || "A4"
  };

  const documentClass = [
    "homebrew-document",
    `theme-${metadata.theme}`,
    `paper-${metadata.paper.toLowerCase()}`
  ].join(" ");

  const content = [
    renderBookCover(metadata),
    renderBookToc(chapters),
    ...chapters.map((chapter, index) => [
      `<section class="book-chapter${index > 0 ? " page-break" : ""}">`,
      chapter.html,
      "</section>"
    ].join("\n")),
    renderLegalAppendix(metadata, assetManifest)
  ].join("\n");

  const rendered = withAutoPages(template
    .replaceAll("{{title}}", escapeHtml(metadata.title))
    .replace("{{styles}}", css)
    .replace("{{content}}", content)
    .replace("{{documentClass}}", documentClass));

  const htmlPath = join(outDir, "book", `${metadata.slug}.html`);
  const pdfPath = join(outDir, "book", `${metadata.slug}.pdf`);

  return { rendered, htmlPath, pdfPath };
}

function withAutoPages(rendered) {
  if (!autoPages) return rendered;

  const tools = `
    <style id="rpg-auto-pages-export">
      body[data-auto-pages="true"] {
        padding: 24px 0;
      }
      body[data-auto-pages="true"] .page-shell {
        margin-bottom: 24px;
      }
      @media print {
        body[data-auto-pages="true"] {
          width: auto;
          padding: 0;
        }
        body[data-auto-pages="true"] .page-shell {
          min-height: 297mm;
          margin: 0;
          overflow: hidden;
          break-after: page;
          page-break-after: always;
        }
        body[data-auto-pages="true"] .page-shell:last-of-type {
          break-after: auto;
          page-break-after: auto;
        }
      }
    </style>
    <script>
      window.addEventListener("load", function() {
        document.body.dataset.autoPages = "true";
        requestAnimationFrame(paginateExportPages);
      });

      function paginateExportPages() {
        var guard = 0;

        while (guard < 120) {
          guard += 1;
          var changed = false;
          var pages = Array.from(document.querySelectorAll("body > .page-shell"));

          for (var index = 0; index < pages.length; index += 1) {
            var page = pages[index];
            if (!pageOverflows(page)) continue;
            var children = Array.from(page.children).filter(function(child) {
              return !child.classList.contains("page-break");
            });
            if (children.length <= 1) continue;

            var nextPage = page.nextElementSibling;
            if (!nextPage || !nextPage.classList.contains("page-shell")) {
              nextPage = document.createElement("main");
              nextPage.className = page.className;
              page.parentNode.insertBefore(nextPage, page.nextSibling);
            }

            while (pageOverflows(page) && children.length > 1) {
              nextPage.insertBefore(children.pop(), nextPage.firstChild);
              changed = true;
            }
          }

          if (!changed) break;
        }

        document.body.setAttribute("data-auto-pages-ready", "true");
        document.body.setAttribute("data-auto-pages-total", String(document.querySelectorAll("body > .page-shell").length));
      }

      function pageOverflows(page) {
        var style = getComputedStyle(page);
        var limit = parseFloat(style.minHeight || "0") || parseFloat(style.height || "0") || page.clientHeight;
        return page.scrollHeight > limit + 4 || page.scrollWidth > page.clientWidth + 4;
      }
    </script>`;

  return rendered
    .replace("<body ", '<body data-auto-pages="true" ')
    .replace("</body>", `${tools}\n  </body>`);
}

function parseFrontmatter(markdown) {
  if (!markdown.startsWith("---\n")) {
    return { metadata: {}, body: markdown };
  }

  const end = markdown.indexOf("\n---", 4);
  if (end === -1) {
    return { metadata: {}, body: markdown };
  }

  const raw = markdown.slice(4, end).trim();
  const metadata = {};

  for (const line of raw.split("\n")) {
    const index = line.indexOf(":");
    if (index === -1) continue;
    const key = line.slice(0, index).trim();
    const value = line.slice(index + 1).trim().replace(/^["']|["']$/g, "");
    metadata[key] = value;
  }

  return { metadata, body: markdown.slice(end + 4).trimStart() };
}

async function expandIncludes(markdown, seen = new Set()) {
  const includePattern = /<rpg-include\s+src="([^"]+)"\s*><\/rpg-include>/g;
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const chunks = [];
  let inFence = false;

  for (const line of lines) {
    if (/^```/.test(line.trim())) {
      inFence = !inFence;
      chunks.push(line);
      continue;
    }

    if (inFence) {
      chunks.push(line);
      continue;
    }

    chunks.push(await replaceIncludesInLine(line, includePattern, seen));
  }

  return chunks.join("\n");
}

async function replaceIncludesInLine(line, includePattern, seen) {
  const chunks = [];
  let cursor = 0;
  let match;
  includePattern.lastIndex = 0;

  while ((match = includePattern.exec(line)) !== null) {
    chunks.push(line.slice(cursor, match.index));
    const includePath = resolveIncludePath(match[1]);

    if (seen.has(includePath)) {
      throw new Error(`Include circolare rilevato: ${relative(root, includePath)}`);
    }

    seen.add(includePath);
    const source = await readFile(includePath, "utf8");
    chunks.push(await expandIncludes(source, seen));
    seen.delete(includePath);
    cursor = match.index + match[0].length;
  }

  chunks.push(line.slice(cursor));
  return chunks.join("");
}

function resolveIncludePath(src) {
  if (src.startsWith("/") || src.includes("..")) {
    throw new Error(`Include non consentito: ${src}`);
  }

  const includePath = resolve(root, src);

  if (!includePath.startsWith(root) || !existsSync(includePath)) {
    throw new Error(`Include non trovato: ${src}`);
  }

  return includePath;
}

function renderMarkdown(markdown, options = {}) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const out = [];
  const headingCounts = new Map();

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    const trimmed = line.trim();

    if (!trimmed) continue;

    if (trimmed === "---") {
      out.push("<hr>");
      continue;
    }

    const fence = trimmed.match(/^```([a-z0-9_-]+)?$/i);
    if (fence) {
      const code = [];
      while (++i < lines.length && lines[i].trim() !== "```") {
        code.push(lines[i]);
      }
      const language = fence[1] ? ` class="language-${escapeHtml(fence[1])}"` : "";
      out.push(`<pre><code${language}>${escapeHtml(code.join("\n"))}</code></pre>`);
      continue;
    }

    if (trimmed === "\\page" || trimmed === "::pagebreak") {
      out.push('<div class="page-break"></div>');
      continue;
    }

    if (trimmed === "\\column" || trimmed === "::column") {
      out.push('<div class="column-break"></div>');
      continue;
    }

    const container = trimmed.match(/^:::\s*([a-z0-9_-]+)(?:\s+(.*))?$/i);
    if (container) {
      const [, name, label] = container;
      const inner = [];
      while (++i < lines.length && lines[i].trim() !== ":::") {
        inner.push(lines[i]);
      }
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
      const text = heading[2];
      const id = options.anchorHeadings && level <= 2
        ? ` id="${headingId(options.headingPrefix || "", text, headingCounts)}"`
        : "";
      out.push(`<h${level}${id}>${renderInline(text)}</h${level}>`);
      continue;
    }

    if (isTableStart(lines, i)) {
      const table = [];
      while (i < lines.length && lines[i].includes("|") && lines[i].trim()) {
        table.push(lines[i]);
        i += 1;
      }
      i -= 1;
      out.push(renderTable(table));
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

    if (/^\d+\.\s+/.test(trimmed)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i].trim())) {
        items.push(lines[i].trim().replace(/^\d+\.\s+/, ""));
        i += 1;
      }
      i -= 1;
      out.push(`<ol>${items.map((item) => `<li>${renderInline(item)}</li>`).join("")}</ol>`);
      continue;
    }

    const paragraph = [trimmed];
    while (i + 1 < lines.length && isParagraphContinuation(lines[i + 1])) {
      paragraph.push(lines[i + 1].trim());
      i += 1;
    }
    out.push(`<p>${renderInline(paragraph.join(" "))}</p>`);
  }

  return out.join("\n");
}

function renderContainer(name, label, markdown) {
  const className = name.toLowerCase();
  const structured = renderStructuredContainer(className, label, markdown);
  if (structured) return structured;

  const title = label ? `<div class="${className}__label">${renderInline(label)}</div>` : "";
  return `<aside class="${className} no-break">${title}${renderMarkdown(markdown)}</aside>`;
}

function renderStructuredContainer(name, label, markdown) {
  if (name === "subtitle" || name === "dropcap" || name === "lead") {
    const text = [label, markdown].filter(Boolean).join(" ").replace(/\s*\n\s*/g, " ").trim();
    return `<p class="${name}">${renderInline(text)}</p>`;
  }

  if (name === "wide" || name === "frame") {
    const mods = new Set([name, ...(label || "").toLowerCase().split(/\s+/).filter(Boolean)]);
    const className = ["wide", "frame"].filter((mod) => mods.has(mod)).join(" ");
    return `<div class="${className}">${renderMarkdown(markdown)}</div>`;
  }

  if (name === "fullpage" || name === "cover") {
    const data = parseBlockData(markdown);
    const fit = data.fit === "contain" ? "contain" : "cover";
    return `<div class="page-image" data-fit="${fit}"><img src="${escapeHtml(data.src || "")}" alt="${escapeHtml(data.alt || label || "")}"></div>`;
  }

  const data = parseBlockData(markdown);

  if (name === "monster") return renderMonster(data, label);
  if (name === "spell") return renderSpell(data, label);
  if (name === "magicitem") return renderMagicItem(data, label);
  if (name === "npc") return renderNpc(data, label);
  if (name === "location") return renderLocation(data, label);
  if (name === "random-table") return renderRandomTable(data, label);
  if (name === "randomtable") return renderRandomTable(data, label);
  if (name === "hazard") return renderHazard(data, label);
  if (name === "map") return renderMediaFigure("rpg-map", data, label || data.caption || "Mappa");
  if (name === "image") return renderMediaFigure("rpg-image", data, label || data.caption || "");

  const component = componentSchema.components.find((item) => item.container === name || item.id === name);
  if (component && (component.fields || []).some((field) => field.key === "name")) {
    return renderSchemaComponent(component, data, label);
  }

  return "";
}

function renderSchemaComponent(component, data, label) {
  const className = component.container;
  const body = componentBody(data);
  const bodyKeys = new Set(["body", "name"]);
  const title = data.name || label || component.default_label || component.label;
  const lines = (component.fields || [])
    .filter((field) => !bodyKeys.has(field.key) && data[field.key])
    .map((field) => `<p class="rules-line"><strong>${renderInline(field.label)}.</strong> ${renderInline(data[field.key])}</p>`);
  const features = [
    ...data.hooks,
    ...data.traits,
    ...data.actions,
    ...data.reactions,
    ...data.legendary
  ].map((item) => `<p><strong>${renderInline(item.name)}.</strong> ${renderInline(item.text)}</p>`);

  return renderRulesCard(className, label || component.default_label || component.label, title, [
    ...lines,
    ...features,
    body.length ? renderMarkdown(body.join("\n")) : ""
  ]);
}

function parseBlockData(markdown) {
  const data = { body: [], traits: [], actions: [], reactions: [], legendary: [], rows: [], hooks: [] };

  for (const rawLine of markdown.split("\n")) {
    const line = rawLine.trim();
    if (!line) continue;

    const index = line.indexOf(":");
    if (index > 0 && /^[a-zA-Z][a-zA-Z0-9_-]*:/.test(line)) {
      const key = line.slice(0, index).trim().toLowerCase();
      const value = line.slice(index + 1).trim();

      if (["trait", "action", "reaction", "legendary", "row", "hook"].includes(key)) {
        const listName = {
          trait: "traits",
          action: "actions",
          reaction: "reactions",
          legendary: "legendary",
          row: "rows",
          hook: "hooks"
        }[key];
        data[listName].push(splitPair(value));
      } else {
        data[key] = value;
      }
      continue;
    }

    if (line.includes("|") && /^[0-9dD%-]+/.test(line)) {
      data.rows.push(splitPair(line));
      continue;
    }

    data.body.push(line);
  }

  return data;
}

function splitPair(value) {
  const [name, ...rest] = value.split("|");
  return {
    name: name.trim(),
    text: rest.join("|").trim()
  };
}

function renderMonster(data, label) {
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
  const cr = challengeText(data);

  return [
    '<aside class="statblock monster no-break">',
    label ? `<div class="statblock__label">${renderInline(label)}</div>` : "",
    `<h2>${renderInline(data.name || "Creatura")}</h2>`,
    data.meta ? `<p class="creature-meta"><em>${renderInline(data.meta)}</em></p>` : "",
    `<div class="statline">${headLines}</div>`,
    hasAbilities(data) ? renderAbilityTables(data) : "",
    renderKeyValueList(data, ["skills", "resistances", "immunities", "senses", "languages"]),
    cr ? `<p class="rules-line cr-line"><strong>GS</strong> ${renderInline(cr.replace(/^GS\s*/, ""))}</p>` : "",
    renderFeatureList(data.traits, "Tratti"),
    renderFeatureList(data.actions, "Azioni"),
    renderFeatureList(data.reactions, "Reazioni"),
    renderFeatureList(data.legendary, "Azioni leggendarie"),
    body.length ? renderMarkdown(body.join("\n")) : "",
    "</aside>"
  ].join("\n");
}

function renderKeyValueList(data, keys) {
  const items = keys
    .filter((key) => data[key])
    .map((key) => `<p class="rules-line"><strong>${labelFor(key)}.</strong> ${renderInline(data[key])}</p>`);
  return items.join("\n");
}

function renderFeatureList(items, title) {
  if (!items.length) return "";
  return [
    `<h3 class="feature-heading">${title}</h3>`,
    ...items.map((item) => `<p><strong>${renderInline(item.name)}.</strong> ${renderInline(item.text)}</p>`)
  ].join("\n");
}

function renderSpell(data, label) {
  const body = componentBody(data);
  return renderRulesCard("spell", label || "Incantesimo", data.name || "Incantesimo", [
    data.level || data.school ? `<p><em>${renderInline([data.level, data.school].filter(Boolean).join(", "))}</em></p>` : "",
    renderKeyValueList(data, ["casting_time", "range", "components", "duration"]),
    body.length ? renderMarkdown(body.join("\n")) : ""
  ]);
}

function renderMagicItem(data, label) {
  const body = componentBody(data);
  return renderRulesCard("magicitem", label || "Oggetto magico", data.name || "Oggetto magico", [
    data.rarity || data.type ? `<p><em>${renderInline([data.type, data.rarity].filter(Boolean).join(", "))}</em></p>` : "",
    data.attunement ? `<p class="rules-line"><strong>Sintonia.</strong> ${renderInline(data.attunement)}</p>` : "",
    body.length ? renderMarkdown(body.join("\n")) : ""
  ]);
}

function renderNpc(data, label) {
  const body = componentBody(data);
  return renderRulesCard("npc", label || "PNG", data.name || "PNG", [
    data.role ? `<p><em>${renderInline(data.role)}</em></p>` : "",
    renderKeyValueList(data, ["motive", "secret", "voice", "appearance"]),
    renderFeatureList(data.hooks, "Spunti"),
    body.length ? renderMarkdown(body.join("\n")) : ""
  ]);
}

function renderLocation(data, label) {
  const body = componentBody(data);
  return renderRulesCard("location", label || "Luogo", data.name || "Luogo", [
    data.tags ? `<p><em>${renderInline(data.tags)}</em></p>` : "",
    renderKeyValueList(data, ["mood", "danger", "treasure"]),
    renderFeatureList(data.hooks, "Dettagli"),
    body.length ? renderMarkdown(body.join("\n")) : ""
  ]);
}

function renderHazard(data, label) {
  const body = componentBody(data);
  return renderRulesCard("hazard", label || "Pericolo", data.name || "Pericolo", [
    renderKeyValueList(data, ["trigger", "effect", "countermeasure", "dc"]),
    body.length ? renderMarkdown(body.join("\n")) : ""
  ]);
}

function componentBody(data) {
  return Array.isArray(data.body) ? data.body : [data.body].filter(Boolean);
}

function renderRandomTable(data, label) {
  const die = data.die || "d6";
  const title = data.name || label || "Tabella casuale";
  const rows = data.rows.map((row) => `<tr><td>${renderInline(row.name)}</td><td>${renderInline(row.text)}</td></tr>`).join("");

  return [
    '<aside class="random-table no-break">',
    `<div class="random-table__label">${renderInline(die)}</div>`,
    `<h3>${renderInline(title)}</h3>`,
    `<table class="table-compact"><thead><tr><th>${renderInline(die)}</th><th>Risultato</th></tr></thead><tbody>${rows}</tbody></table>`,
    "</aside>"
  ].join("\n");
}

function renderMediaFigure(className, data, label) {
  if (!data.src) {
    return renderRulesCard("note", "Asset mancante", "Componente immagine", [
      "<p>Manca il campo <code>src</code>.</p>"
    ]);
  }

  const alt = data.alt || label || data.caption || "Immagine";
  const caption = data.caption || label || "";

  return [
    `<figure class="${className} no-break">`,
    `  <img src="${escapeHtml(data.src)}" alt="${escapeHtml(alt)}">`,
    caption ? `  <figcaption>${renderInline(caption)}</figcaption>` : "",
    "</figure>"
  ].filter(Boolean).join("\n");
}

function renderRulesCard(className, label, title, parts) {
  return [
    `<aside class="${className} rules-card no-break">`,
    `<div class="${className}__label rules-card__label">${renderInline(label)}</div>`,
    `<h3>${renderInline(title)}</h3>`,
    ...parts.filter(Boolean),
    "</aside>"
  ].join("\n");
}

function labelFor(key) {
  return {
    casting_time: "Tempo di lancio",
    range: "Gittata",
    components: "Componenti",
    duration: "Durata",
    saves: "Tiri salvezza",
    skills: "Abilità",
    resistances: "Resistenze",
    immunities: "Immunità",
    senses: "Sensi",
    languages: "Linguaggi",
    attunement: "Sintonia",
    rarity: "Rarità",
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
  }[key] || key;
}

function renderLegalAppendix(metadata, assetManifest = { assets: [] }) {
  if (!metadata.license_mode) return "";

  const compatibility = metadata.compatibility || "5e/5.5e";
  const author = metadata.author || "Autore indipendente";
  const mode = metadata.license_mode;
  const srdVersion = mode.includes("5.2") ? "SRD 5.2.1" : "SRD 5.1";

  if (!mode.startsWith("srd-")) return "";

  const assetCredits = (assetManifest.assets || [])
    .map((asset) => `<li><strong>${escapeHtml(asset.title)}</strong> di ${escapeHtml(asset.author)} (${escapeHtml(asset.license)}). Uso: ${escapeHtml(asset.usage)}.</li>`)
    .join("");

  return [
    '<section class="legal">',
    "<h2>Legal & Attribution</h2>",
    `<p><strong>Compatibilità:</strong> materiale originale compatibile con ${escapeHtml(compatibility)}.</p>`,
    `<p><strong>Autore:</strong> ${escapeHtml(author)}.</p>`,
    `<p>Questo documento usa contenuto di regole tratto dal ${escapeHtml(srdVersion)} pubblicato da Wizards of the Coast LLC sotto licenza Creative Commons Attribution 4.0 International (CC-BY-4.0).</p>`,
    "<p>Questo documento è una pubblicazione indipendente. Non è approvato, sponsorizzato o affiliato a Wizards of the Coast LLC.</p>",
    "<p>I nomi, i marchi, i loghi, le ambientazioni, i personaggi e le opere non inclusi nello SRD restano proprietà dei rispettivi titolari.</p>",
    assetCredits ? "<h3>Crediti asset</h3>" : "",
    assetCredits ? `<ul>${assetCredits}</ul>` : "",
    "</section>"
  ].join("\n");
}

function renderBookCover(metadata) {
  return [
    '<section class="book-cover">',
    '<div class="book-cover__frame">',
    `<p class="book-kicker">${escapeHtml(metadata.compatibility || "5e/5.5e")}</p>`,
    '<div class="book-mark" aria-hidden="true"></div>',
    `<h1>${escapeHtml(metadata.title)}</h1>`,
    metadata.summary ? `<p class="book-summary">${escapeHtml(metadata.summary)}</p>` : "",
    `<p class="book-author">${escapeHtml(metadata.author || "Autore indipendente")}</p>`,
    "</div>",
    "</section>"
  ].join("\n");
}

function renderBookToc(chapters) {
  const items = chapters.flatMap((chapter) => {
    const headings = extractTocHeadings(chapter.body, chapter.slug);
    return headings.map((heading) => [
      `<li class="toc-level-${heading.level}">`,
      `<a href="#${escapeHtml(heading.id)}">${escapeHtml(heading.text)}</a>`,
      "</li>"
    ].join(""));
  }).join("\n");

  return [
    '<nav class="book-toc page-break" aria-label="Indice">',
    "<h2>Indice</h2>",
    `<ol>${items}</ol>`,
    "</nav>"
  ].join("\n");
}

function extractTocHeadings(markdown, prefix) {
  const counts = new Map();

  return markdown
    .split(/\r?\n/)
    .map((line) => line.match(/^(#{1,2})\s+(.+)$/))
    .filter(Boolean)
    .map((match) => ({
      level: match[1].length,
      text: stripInlineMarkdown(match[2]),
      id: headingId(prefix, match[2], counts)
    }));
}

function renderSiteIndex(entries) {
  const visibleEntries = entries.filter((entry) => entry.public);
  const groups = Map.groupBy(visibleEntries, (entry) => entry.category);
  const sections = [...groups.entries()].map(([category, items]) => [
    `<section><h2>${renderInline(category)}</h2>`,
    ...items.map((item) => [
      '<article class="library-item">',
      `<h3><a href="./${escapeHtml(item.slug)}/">${escapeHtml(item.title)}</a></h3>`,
      item.summary ? `<p>${escapeHtml(item.summary)}</p>` : "",
      `<p class="meta">${[item.compatibility, ...item.tags].filter(Boolean).map(escapeHtml).join(" · ")}</p>`,
      "</article>"
    ].join("")),
    "</section>"
  ].join("\n")).join("\n");

  return [
    "<!doctype html>",
    '<html lang="it">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    "<title>Homebrew Library</title>",
    "<style>body{font-family:system-ui,sans-serif;margin:3rem;line-height:1.5;max-width:900px}a{color:#7f1d1d}.library-item{border-top:1px solid #ddd;padding:1rem 0}.meta{color:#666;font-size:.9rem}</style>",
    "</head>",
    "<body>",
    "<h1>Homebrew Library</h1>",
    sections || "<p>Nessun documento pubblico.</p>",
    "</body>",
    "</html>"
  ].join("\n");
}

function renderTable(lines) {
  const [header, , ...body] = lines;
  const headings = splitTableRow(header);
  const rows = body.map(splitTableRow);

  return [
    "<table>",
    `<thead><tr>${headings.map((cell) => `<th>${renderInline(cell)}</th>`).join("")}</tr></thead>`,
    `<tbody>${rows.map((row) => `<tr>${row.map((cell) => `<td>${renderInline(cell)}</td>`).join("")}</tr>`).join("")}</tbody>`,
    "</table>"
  ].join("");
}

function splitTableRow(row) {
  return row.trim().replace(/^\||\|$/g, "").split("|").map((cell) => cell.trim());
}

function isTableStart(lines, index) {
  return lines[index]?.includes("|") && /^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(lines[index + 1] || "");
}

function isParagraphContinuation(line) {
  const trimmed = line.trim();
  return trimmed &&
    trimmed !== "---" &&
    !trimmed.startsWith("#") &&
    !trimmed.startsWith(":::") &&
    !/^[-*]\s+/.test(trimmed) &&
    !/^\d+\.\s+/.test(trimmed) &&
    !/^<[^>]+>/.test(trimmed) &&
    !trimmed.includes("|");
}

function renderInline(value) {
  return escapeHtml(value)
    .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img class="inline-image" src="$2" alt="$1">')
    .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, '<a href="$2">$1</a>')
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .replace(/\*([^*]+)\*/g, "<em>$1</em>");
}

function firstHeading(markdown) {
  const match = markdown.match(/^#\s+(.+)$/m);
  return match?.[1]?.trim();
}

function headingId(prefix, text, counts) {
  const base = [prefix, slugify(stripInlineMarkdown(text))].filter(Boolean).join("-");
  const count = counts.get(base) || 0;
  counts.set(base, count + 1);
  return count ? `${base}-${count + 1}` : base;
}

function stripInlineMarkdown(value) {
  return String(value)
    .replace(/`([^`]+)`/g, "$1")
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/\*([^*]+)\*/g, "$1")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "section";
}

function basenameWithoutExt(path) {
  return path.split(/[\\/]/).pop().replace(extname(path), "");
}

function splitList(value = "") {
  return String(value)
    .replace(/^\[|\]$/g, "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

async function loadDocuments() {
  const files = (await readdir(sourceDir)).filter((file) => file.endsWith(".md")).sort();
  return Promise.all(files.map(async (file) => ({
    path: join(sourceDir, file),
    markdown: await readFile(join(sourceDir, file), "utf8")
  })));
}

async function loadAssetManifest() {
  if (!existsSync(assetManifestPath)) {
    return { assets: [] };
  }

  return JSON.parse(await readFile(assetManifestPath, "utf8"));
}

async function loadComponentSchema() {
  if (!existsSync(componentManifestPath)) {
    return { components: [] };
  }

  const manifest = JSON.parse(await readFile(componentManifestPath, "utf8"));
  const sources = [{
    id: "core",
    name: "Core",
    schema: JSON.parse(await readFile(resolveSchemaPath(manifest.core), "utf8"))
  }];

  for (const pack of manifest.packs || []) {
    if (pack.enabled === false) continue;
    sources.push({
      id: pack.id,
      name: pack.name,
      schema: JSON.parse(await readFile(resolveSchemaPath(pack.path), "utf8"))
    });
  }

  return mergeComponentSources(sources);
}

function resolveSchemaPath(path) {
  if (!path || path.includes("..")) {
    throw new Error(`Path schema non consentito: ${path}`);
  }

  return resolve(root, path.replace(/^\/+/, ""));
}

async function loadBookManifest() {
  if (!existsSync(bookManifestPath)) {
    throw new Error("Manca book.json: crea un manifest con title, slug e chapters.");
  }

  const manifest = JSON.parse(await readFile(bookManifestPath, "utf8"));
  if (!Array.isArray(manifest.chapters) || manifest.chapters.length === 0) {
    throw new Error("book.json deve contenere un array chapters con almeno un documento.");
  }

  return manifest;
}

async function copyBuildAssets(assetManifest, options = {}) {
  for (const asset of assetManifest.assets || []) {
    if (!asset.path || !existsSync(join(root, asset.path))) continue;
    await copyFileWithDirs(join(root, asset.path), join(outDir, asset.path));
    if (options.includeSite) {
      await copyFileWithDirs(join(root, asset.path), join(outDir, "site", asset.path));
    }
  }
}

async function copyFileWithDirs(source, target) {
  await mkdir(dirname(target), { recursive: true });
  await cp(source, target);
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

async function printPdf(htmlPath, pdfPath) {
  const browser = findBrowser();
  if (!browser) {
    throw new Error("Nessun browser Chromium/Brave trovato per esportare il PDF.");
  }

  const args = [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    `--print-to-pdf=${pdfPath}`,
    "--print-to-pdf-no-header",
    pathToFileURL(htmlPath).href
  ];

  await new Promise((resolvePromise, reject) => {
    const child = spawn(browser, args, { stdio: "inherit" });
    child.on("exit", (code) => {
      code === 0 ? resolvePromise() : reject(new Error(`Export PDF fallito con codice ${code}.`));
    });
  });
}

function findBrowser() {
  const candidates = [
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "chromium",
    "google-chrome",
    "brave-browser"
  ];

  return candidates.find((candidate) => existsSync(candidate) || !candidate.startsWith("/"));
}

async function loadCss(path, seen = new Set()) {
  if (seen.has(path)) return "";
  seen.add(path);

  const source = await readFile(path, "utf8");
  const folder = dirname(path);
  const chunks = [];
  const importPattern = /@import\s+["'](.+?)["'];/g;
  let cursor = 0;
  let match;

  while ((match = importPattern.exec(source)) !== null) {
    chunks.push(source.slice(cursor, match.index));
    chunks.push(await loadCss(resolve(folder, match[1]), seen));
    cursor = match.index + match[0].length;
  }

  chunks.push(source.slice(cursor));
  return chunks.join("\n");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
