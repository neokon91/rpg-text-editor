import { renderMarkdown } from "../components/preview.js";
import { parseFrontmatter } from "./frontmatter.js";
import { renderPreviewDocument } from "./preview-shell.js";

const browserDocumentStorageKey = "rpg-text-editor-next:browser-documents";
const browserModeStorageKey = "rpg-text-editor-next:browser-only";

export async function listDocuments() {
  return withServerFallback(
    () => fetchJson("/api/documents", {}, "Lista documenti non disponibile"),
    () => ({ documents: browserDocuments().map(({ filename }) => filename) })
  );
}

export async function getDocument(filename) {
  return withServerFallback(
    () => fetchJson(`/api/documents/${encodeURIComponent(filename)}`, {}, "Import non riuscito"),
    () => {
      const document = browserDocuments().find((item) => item.filename === filename);
      if (!document) throw new Error("Documento browser non trovato");
      return document;
    }
  );
}

export async function saveDocument({ filename, content, overwrite = false, unique = false }) {
  return withServerFallback(
    () => fetchJson("/api/documents", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ filename, content, overwrite, unique })
    }, "Salvataggio non riuscito"),
    () => saveBrowserDocument({ filename, content, overwrite, unique })
  );
}

export async function renameDocument(filename, nextFilename) {
  return withServerFallback(
    () => fetchJson(`/api/documents/${encodeURIComponent(filename)}`, {
      method: "PUT",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ filename: nextFilename })
    }, "Rename non riuscito"),
    () => renameBrowserDocument(filename, nextFilename)
  );
}

export async function deleteDocument(filename) {
  return withServerFallback(
    () => fetchJson(`/api/documents/${encodeURIComponent(filename)}`, { method: "DELETE" }, "Delete non riuscito"),
    () => {
      saveBrowserDocuments(browserDocuments().filter((item) => item.filename !== filename));
      return { filename };
    }
  );
}

export async function checkDocument({ filename, content }) {
  return withServerFallback(
    () => fetchJson("/api/check-document", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ filename, content })
    }, "Check documento non riuscito"),
    () => ({ filename, diagnostics: checkBrowserDocument(content) })
  );
}

export async function exportDocument({ filename, content, format }) {
  return withServerFallback(
    () => fetchJson("/api/export-document", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ filename, content, format })
    }, "Export documento non riuscito", { includeLog: true }),
    () => exportBrowserDocument({ filename, content, format })
  );
}

export function getDocumentRuntimeMode() {
  return browserOnlyMode() ? "browser" : "server";
}

export function setBrowserOnlyMode(enabled) {
  try {
    if (enabled) {
      localStorage.setItem(browserModeStorageKey, "true");
    } else {
      localStorage.removeItem(browserModeStorageKey);
    }
  } catch {}
}

async function withServerFallback(serverAction, browserAction) {
  if (browserOnlyMode()) return browserAction();
  try {
    return await serverAction();
  } catch (error) {
    if (error.status) throw error;
    activateBrowserOnlyMode();
    return browserAction();
  }
}

async function fetchJson(url, options, errorMessage, { includeLog = false } = {}) {
  const response = await fetch(url, options);
  const contentType = response.headers.get("content-type") || "";

  if (!contentType.includes("application/json")) {
    throw new Error(errorMessage);
  }

  if (!response.ok) {
    const payload = contentType.includes("application/json") ? await response.json().catch(() => ({})) : {};
    const error = new Error(payload.message || errorMessage);
    error.status = response.status;
    if (includeLog) error.log = payload.log || "";
    throw error;
  }

  return response.json();
}

function browserOnlyMode() {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.has("browser-only")
    || window.__RPG_TEXT_EDITOR_BROWSER_ONLY__ === true
    || safeLocalStorageGet(browserModeStorageKey) === "true";
}

function activateBrowserOnlyMode() {
  setBrowserOnlyMode(true);
}

function browserDocuments() {
  return JSON.parse(safeLocalStorageGet(browserDocumentStorageKey) || "[]");
}

function saveBrowserDocuments(documents) {
  localStorage.setItem(browserDocumentStorageKey, JSON.stringify(documents.sort((a, b) => a.filename.localeCompare(b.filename))));
}

function safeLocalStorageGet(key) {
  try {
    return localStorage.getItem(key);
  } catch {
    return "";
  }
}

function saveBrowserDocument({ filename, content, overwrite = false, unique = false }) {
  const documents = browserDocuments();
  const safeFilename = safeMarkdownFilename(filename);
  const nextFilename = unique ? uniqueFilename(documents, safeFilename) : safeFilename;
  const index = documents.findIndex((item) => item.filename === nextFilename);

  if (index >= 0 && !overwrite && !unique) {
    const error = new Error("File gia esistente");
    error.status = 409;
    throw error;
  }

  const document = { filename: nextFilename, content, updatedAt: new Date().toISOString() };
  if (index >= 0) {
    documents[index] = document;
  } else {
    documents.push(document);
  }
  saveBrowserDocuments(documents);
  return document;
}

function renameBrowserDocument(filename, nextFilename) {
  const documents = browserDocuments();
  const safeNext = safeMarkdownFilename(nextFilename);
  const index = documents.findIndex((item) => item.filename === filename);
  if (index === -1) throw new Error("Documento browser non trovato");
  if (documents.some((item) => item.filename === safeNext)) {
    const error = new Error("File gia esistente");
    error.status = 409;
    throw error;
  }
  documents[index] = { ...documents[index], filename: safeNext, updatedAt: new Date().toISOString() };
  saveBrowserDocuments(documents);
  return documents[index];
}

function exportBrowserDocument({ filename, content, format }) {
  if (format === "pdf") {
    const error = new Error("Export PDF richiede un servizio backend web");
    error.log = "La modalita browser-only puo esportare HTML/Markdown. Per PDF serve print browser o rendering server-side.";
    throw error;
  }

  const parsed = parseFrontmatter(content);
  const html = renderPreviewDocument(parsed.metadata, renderMarkdown(parsed.body, { components: [] }, { startLine: parsed.bodyStartLine }));
  const outputName = safeMarkdownFilename(filename).replace(/\.md$/i, ".html");
  const blob = new Blob([html], { type: "text/html;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  triggerDownload(url, outputName);
  return { outputs: [{ path: `browser-download/${outputName}`, url }] };
}

function triggerDownload(url, filename) {
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
}

function checkBrowserDocument(source) {
  return [
    ...checkBrowserFrontmatter(source),
    ...checkBrowserHeadingOrder(source),
    ...checkBrowserLegalTerms(source),
    ...checkBrowserIncludes(source),
    ...checkBrowserDifficultyClasses(source)
  ].sort((a, b) => a.line - b.line || severityWeight(a.severity) - severityWeight(b.severity));
}

function checkBrowserFrontmatter(source) {
  const diagnostics = [];
  const required = ["title", "slug", "summary", "compatibility", "license_mode", "author"];
  const { metadata } = parseFrontmatter(source);

  for (const field of required) {
    if (!metadata[field]) diagnostics.push({
      severity: "error",
      line: 1,
      message: `Frontmatter senza "${field}".`,
      fix: `Aggiungi ${field}: ... nel blocco frontmatter.`
    });
  }

  return diagnostics;
}

function checkBrowserHeadingOrder(source) {
  const diagnostics = [];
  const { bodyStartLine } = parseFrontmatter(source);
  let previous = 0;

  for (const [index, line] of source.split(/\r?\n/).entries()) {
    const match = line.match(/^(#{1,6})\s+/);
    if (!match) continue;
    const level = match[1].length;
    if (previous && level > previous + 1) diagnostics.push({
      severity: "warning",
      line: index + 1,
      message: `Salto gerarchico da H${previous} a H${level}.`,
      fix: "Inserisci un heading intermedio o abbassa il livello del titolo."
    });
    previous = level;
  }

  if (!source.split(/\r?\n/).slice(bodyStartLine - 1).some((line) => /^#\s+/.test(line))) diagnostics.push({
    severity: "error",
    line: bodyStartLine,
    message: "Documento senza titolo H1 nel corpo.",
    fix: "Aggiungi un titolo principale con # Titolo dopo il frontmatter."
  });

  return diagnostics;
}

function checkBrowserLegalTerms(source) {
  const terms = ["beholder", "mind flayer", "illithid", "strahd", "orcus", "tiamat", "forgotten realms", "waterdeep", "baldur's gate", "ravenloft", "dragonlance", "eberron", "artificer", "aasimar"];
  const diagnostics = [];
  for (const [index, line] of source.split(/\r?\n/).entries()) {
    const normalized = line.toLowerCase();
    for (const term of terms) {
      if (normalized.includes(term)) diagnostics.push({
        severity: "error",
        line: index + 1,
        message: `Termine sensibile: "${term}".`,
        fix: "Sostituisci con un nome originale o verifica una licenza esplicita."
      });
    }
  }
  return diagnostics;
}

function checkBrowserIncludes(source) {
  const diagnostics = [];
  for (const match of source.matchAll(/<rpg-include\s+src="([^"]+)"\s*><\/rpg-include>/g)) {
    const src = match[1];
    if (src.startsWith("/") || src.includes("..")) diagnostics.push({
      severity: "error",
      line: source.slice(0, match.index || 0).split(/\r?\n/).length,
      message: `Include non consentito: ${src}.`,
      fix: "Usa un percorso relativo interno senza / iniziale o segmenti ..."
    });
  }
  return diagnostics;
}

function checkBrowserDifficultyClasses(source) {
  const diagnostics = [];
  for (const match of source.matchAll(/\bCD\s*([0-9]{1,2})\b/gi)) {
    const dc = Number(match[1]);
    const line = source.slice(0, match.index || 0).split(/\r?\n/).length;
    if (dc < 5 || dc > 30) diagnostics.push({
      severity: "error",
      line,
      message: `CD ${dc} fuori scala.`,
      fix: "Usa CD tra 5 e 30 salvo casi dichiaratamente speciali."
    });
  }
  return diagnostics;
}

function safeMarkdownFilename(filename) {
  const clean = String(filename || "bozza-rpg.md").split(/[\\/]/).pop().replace(/[^a-zA-Z0-9._-]+/g, "-");
  return clean.endsWith(".md") ? clean : `${clean || "bozza-rpg"}.md`;
}

function uniqueFilename(documents, filename) {
  const taken = new Set(documents.map((item) => item.filename));
  if (!taken.has(filename)) return filename;
  const base = filename.replace(/\.md$/i, "");
  let index = 2;
  while (taken.has(`${base}-${index}.md`)) index += 1;
  return `${base}-${index}.md`;
}

function severityWeight(severity) {
  return severity === "error" ? 0 : 1;
}
