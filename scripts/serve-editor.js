import { createServer } from "node:http";
import { readFile, readdir, rename, stat, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { basename, extname, join, normalize, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { slugify } from "./lib/component-schema.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const docsDir = join(root, "docs");
const port = Number(process.env.PORT || 8082);

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp"
};

createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://127.0.0.1:${port}`);

    if (url.pathname.startsWith("/api/documents")) {
      await handleDocumentsApi(request, response, url);
      return;
    }

    if (url.pathname === "/api/check-document") {
      await handleDocumentCheckApi(request, response);
      return;
    }

    const pathname = url.pathname === "/" ? "/editor/index.html" : url.pathname;
    const filePath = resolve(root, normalize(pathname).replace(/^\/+/, ""));

    if (!filePath.startsWith(root) || !existsSync(filePath) || !(await stat(filePath)).isFile()) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, { "content-type": types[extname(filePath)] || "application/octet-stream" });
    response.end(await readFile(filePath));
  } catch (error) {
    response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    response.end(error.message);
  }
}).listen(port, () => {
  console.log(`Editor disponibile su http://127.0.0.1:${port}`);
});

async function handleDocumentsApi(request, response, url) {
  if (request.method === "GET" && url.pathname === "/api/documents") {
    const files = (await readdir(docsDir)).filter((file) => extname(file) === ".md").sort();
    const documents = await Promise.all(files.map(async (filename) => {
      const content = await readFile(join(docsDir, filename), "utf8");
      return { filename, title: readTitle(content) || filename };
    }));
    sendJson(response, { documents });
    return;
  }

  if (request.method === "GET" && url.pathname.startsWith("/api/documents/")) {
    const filename = safeMarkdownFilename(decodeURIComponent(url.pathname.replace("/api/documents/", "")));
    const content = await readFile(join(docsDir, filename), "utf8");
    sendJson(response, { filename, content });
    return;
  }

  if (request.method === "PUT" && url.pathname.startsWith("/api/documents/")) {
    const filename = safeMarkdownFilename(decodeURIComponent(url.pathname.replace("/api/documents/", "")));
    const payload = JSON.parse(await readRequestBody(request));
    const nextFilename = safeMarkdownFilename(payload.filename || "");
    const sourcePath = join(docsDir, filename);
    const targetPath = join(docsDir, nextFilename);

    if (!existsSync(sourcePath)) {
      response.writeHead(404, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "File not found", filename }));
      return;
    }

    if (filename !== nextFilename && existsSync(targetPath)) {
      response.writeHead(409, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "File already exists", filename: nextFilename }));
      return;
    }

    if (filename !== nextFilename) await rename(sourcePath, targetPath);
    sendJson(response, { filename: nextFilename });
    return;
  }

  if (request.method === "DELETE" && url.pathname.startsWith("/api/documents/")) {
    const filename = safeMarkdownFilename(decodeURIComponent(url.pathname.replace("/api/documents/", "")));
    const filePath = join(docsDir, filename);

    if (!existsSync(filePath)) {
      response.writeHead(404, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "File not found", filename }));
      return;
    }

    await unlink(filePath);
    sendJson(response, { filename });
    return;
  }

  if (request.method === "POST" && url.pathname === "/api/documents") {
    const payload = JSON.parse(await readRequestBody(request));
    let filename = safeMarkdownFilename(payload.filename || `${slugify(readTitle(payload.content || "") || "bozza-rpg")}.md`);
    if (payload.unique) {
      filename = await uniqueMarkdownFilename(filename);
    } else if (!payload.overwrite && existsSync(join(docsDir, filename))) {
      response.writeHead(409, { "content-type": "application/json; charset=utf-8" });
      response.end(JSON.stringify({ error: "File already exists", filename }));
      return;
    }
    await writeFile(join(docsDir, filename), payload.content || "", "utf8");
    sendJson(response, { filename });
    return;
  }

  response.writeHead(404, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({ error: "Not found" }));
}

async function handleDocumentCheckApi(request, response) {
  if (request.method !== "POST") {
    response.writeHead(405, { "content-type": "application/json; charset=utf-8" });
    response.end(JSON.stringify({ error: "Method not allowed" }));
    return;
  }

  const payload = JSON.parse(await readRequestBody(request));
  const filename = safeMarkdownFilename(payload.filename || "bozza-rpg.md");
  const content = String(payload.content || "");
  sendJson(response, { filename, diagnostics: checkCurrentDocument(content) });
}

function checkCurrentDocument(source) {
  return [
    ...checkFrontmatter(source),
    ...checkHeadingOrder(source),
    ...checkLegalTerms(source),
    ...checkIncludes(source),
    ...checkDifficultyClasses(source)
  ].sort((a, b) => a.line - b.line || severityWeight(a.severity) - severityWeight(b.severity));
}

function checkFrontmatter(source) {
  const diagnostics = [];
  const required = ["title", "slug", "summary", "compatibility", "license_mode", "author"];
  const { metadata } = parseFrontmatter(source);

  for (const field of required) {
    if (!metadata[field]) {
      diagnostics.push({
        severity: "error",
        line: 1,
        message: `Frontmatter senza "${field}".`,
        fix: `Aggiungi ${field}: ... nel blocco frontmatter.`
      });
    }
  }

  if (metadata.compatibility && !/5e|5\.5e/i.test(metadata.compatibility)) {
    diagnostics.push({
      severity: "warning",
      line: 1,
      message: `Compatibility insolita: "${metadata.compatibility}".`,
      fix: "Usa una dicitura esplicita tipo 5e/5.5e."
    });
  }

  if (metadata.license_mode && !metadata.license_mode.startsWith("srd-")) {
    diagnostics.push({
      severity: "warning",
      line: 1,
      message: `License mode non SRD: "${metadata.license_mode}".`,
      fix: "Verifica appendice legale ed export prima di pubblicare."
    });
  }

  return diagnostics;
}

function checkHeadingOrder(source) {
  const diagnostics = [];
  const { bodyStartLine } = parseFrontmatter(source);
  let previous = 0;

  for (const [index, line] of source.split(/\r?\n/).entries()) {
    const match = line.match(/^(#{1,6})\s+/);
    if (!match) continue;

    const level = match[1].length;
    if (previous && level > previous + 1) {
      diagnostics.push({
        severity: "warning",
        line: index + 1,
        message: `Salto gerarchico da H${previous} a H${level}.`,
        fix: "Inserisci un heading intermedio o abbassa il livello del titolo."
      });
    }
    previous = level;
  }

  if (!source.split(/\r?\n/).slice(bodyStartLine - 1).some((line) => /^#\s+/.test(line))) {
    diagnostics.push({
      severity: "error",
      line: bodyStartLine,
      message: "Documento senza titolo H1 nel corpo.",
      fix: "Aggiungi un titolo principale con # Titolo dopo il frontmatter."
    });
  }

  return diagnostics;
}

function checkLegalTerms(source) {
  const checks = [
    {
      severity: "error",
      terms: ["beholder", "mind flayer", "illithid", "strahd", "orcus", "tiamat", "forgotten realms", "waterdeep", "baldur's gate", "ravenloft", "dragonlance", "eberron", "artificer", "aasimar"],
      fix: "Sostituisci con un nome originale o verifica una licenza esplicita."
    },
    {
      severity: "warning",
      terms: ["dungeons & dragons", "dnd", "d&d", "wizards of the coast", "wotc", "dungeon master", "monster manual", "player's handbook", "dungeon master's guide"],
      fix: "Usa riferimenti nominativi solo dove necessari e mantieni il testo 5E compatible."
    }
  ];
  const diagnostics = [];

  for (const [index, line] of source.split(/\r?\n/).entries()) {
    const normalized = line.toLowerCase();
    for (const check of checks) {
      for (const term of check.terms) {
        if (normalized.includes(term)) {
          diagnostics.push({
            severity: check.severity,
            line: index + 1,
            message: `Termine sensibile: "${term}".`,
            fix: check.fix
          });
        }
      }
    }
  }

  return diagnostics;
}

function checkIncludes(source) {
  const diagnostics = [];
  const includePattern = /<rpg-include\s+src="([^"]+)"\s*><\/rpg-include>/g;
  let match;

  while ((match = includePattern.exec(source)) !== null) {
    const src = match[1];
    const line = source.slice(0, match.index).split(/\r?\n/).length;

    if (src.startsWith("/") || src.includes("..")) {
      diagnostics.push({
        severity: "error",
        line,
        message: `Include non consentito: ${src}.`,
        fix: "Usa un percorso relativo interno senza / iniziale o segmenti ..."
      });
      continue;
    }

    const includePath = resolve(root, src);
    if (!includePath.startsWith(root) || !existsSync(includePath)) {
      diagnostics.push({
        severity: "error",
        line,
        message: `Include mancante: ${src}.`,
        fix: "Controlla il percorso o crea il frammento incluso."
      });
    }
  }

  return diagnostics;
}

function checkDifficultyClasses(source) {
  const diagnostics = [];
  for (const match of source.matchAll(/\bCD\s*([0-9]{1,2})\b/gi)) {
    const dc = Number(match[1]);
    const line = source.slice(0, match.index || 0).split(/\r?\n/).length;
    if (dc < 5 || dc > 30) {
      diagnostics.push({
        severity: "error",
        line,
        message: `CD ${dc} fuori scala.`,
        fix: "Usa CD tra 5 e 30 salvo casi dichiaratamente speciali."
      });
    } else if (dc >= 21) {
      diagnostics.push({
        severity: "warning",
        line,
        message: `CD ${dc} molto alta.`,
        fix: "Valuta una conseguenza parziale o una strada alternativa."
      });
    }
  }
  return diagnostics;
}

function parseFrontmatter(source) {
  if (!source.startsWith("---\n")) return { metadata: {}, bodyStartLine: 1 };

  const end = source.indexOf("\n---", 4);
  if (end === -1) return { metadata: {}, bodyStartLine: 1 };

  const metadata = {};
  for (const line of source.slice(4, end).trim().split("\n")) {
    const index = line.indexOf(":");
    if (index === -1) continue;
    metadata[line.slice(0, index).trim()] = line.slice(index + 1).trim().replace(/^["']|["']$/g, "");
  }

  return {
    metadata,
    bodyStartLine: source.slice(0, end + 4).split(/\r?\n/).length
  };
}

function severityWeight(severity) {
  return severity === "error" ? 0 : 1;
}

function safeMarkdownFilename(filename) {
  const clean = basename(filename).replace(/\.md$/i, "");
  return `${slugify(clean)}.md`;
}

async function uniqueMarkdownFilename(filename) {
  const base = safeMarkdownFilename(filename).replace(/\.md$/i, "");
  let candidate = `${base}.md`;
  let index = 2;

  while (existsSync(join(docsDir, candidate))) {
    candidate = `${base}-${index}.md`;
    index += 1;
  }

  return candidate;
}

function readTitle(markdown) {
  return markdown.match(/^title:\s*(.+)$/m)?.[1]?.trim() || markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() || "";
}

async function readRequestBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

function sendJson(response, payload) {
  response.writeHead(200, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}
