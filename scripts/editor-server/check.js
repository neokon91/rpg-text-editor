import { existsSync } from "node:fs";
import { resolve } from "node:path";
import { readRequestBody, safeMarkdownFilename, sendJson } from "./http.js";

export function createDocumentCheckApi({ root }) {
  return async function handleDocumentCheckApi(request, response) {
    if (request.method !== "POST") {
      sendJson(response, { error: "Method not allowed" }, 405);
      return;
    }

    const payload = JSON.parse(await readRequestBody(request));
    const filename = safeMarkdownFilename(payload.filename || "bozza-rpg.md");
    const content = String(payload.content || "");
    sendJson(response, { filename, diagnostics: checkCurrentDocument(content, { root }) });
  };
}

export function checkCurrentDocument(source, { root = process.cwd() } = {}) {
  return [
    ...checkFrontmatter(source),
    ...checkHeadingOrder(source),
    ...checkLegalTerms(source),
    ...checkIncludes(source, root),
    ...checkDifficultyClasses(source)
  ].sort((a, b) => a.line - b.line || severityWeight(a.severity) - severityWeight(b.severity));
}

export function checkFrontmatter(source) {
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

export function checkHeadingOrder(source) {
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

export function checkLegalTerms(source) {
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

export function checkIncludes(source, root) {
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

export function checkDifficultyClasses(source) {
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

export function parseFrontmatter(source) {
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
