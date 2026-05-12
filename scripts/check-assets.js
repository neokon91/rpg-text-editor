import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const manifestPath = join(root, "assets", "manifest.json");
const requiredFields = ["path", "title", "author", "license", "source", "usage"];

const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
const findings = [];
const paths = new Set();

for (const [index, asset] of (manifest.assets || []).entries()) {
  for (const field of requiredFields) {
    if (!asset[field]) {
      findings.push(`assets[${index}] manca il campo "${field}"`);
    }
  }

  if (asset.path) {
    if (paths.has(asset.path)) {
      findings.push(`asset duplicato: ${asset.path}`);
    }
    paths.add(asset.path);

    if (!existsSync(join(root, asset.path))) {
      findings.push(`file non trovato: ${asset.path}`);
    }
  }
}

for (const filePath of await listFiles(join(root, "docs"), [".md"])) {
  await checkReferencedAssets(filePath);
}

for (const filePath of await listFiles(join(root, "content"), [".html", ".md"])) {
  await checkReferencedAssets(filePath);
}

if (findings.length) {
  for (const finding of findings) {
    console.log(`ERRORE ${finding}`);
  }
  process.exit(1);
}

console.log(`Asset manifest: ${manifest.assets.length} asset tracciati e validi.`);

async function checkReferencedAssets(filePath) {
  if (!existsSync(filePath)) return;

  const source = await readFile(filePath, "utf8");
  const imagePattern = /<img\b[^>]*\bsrc=["']([^"']+)["'][^>]*>/gi;
  let match;

  while ((match = imagePattern.exec(source)) !== null) {
    const src = match[1];
    const line = source.slice(0, match.index).split(/\r?\n/).length;
    checkAssetReference(src, filePath, line);
  }

  const lines = source.split(/\r?\n/);
  for (let index = 0; index < lines.length; index += 1) {
    const container = lines[index].trim().match(/^:::\s*(map|image)\b/i);
    if (!container) continue;

    while (++index < lines.length && lines[index].trim() !== ":::") {
      const src = lines[index].trim().match(/^src:\s*(.+)$/i);
      if (src) {
        checkAssetReference(src[1].trim().replace(/^["']|["']$/g, ""), filePath, index + 1);
      }
    }
  }
}

function checkAssetReference(src, filePath, line) {
  if (/^(https?:)?\/\//.test(src) || src.startsWith("data:")) return;

  const assetPath = normalizeAssetPath(src);

  if (!assetPath) {
    findings.push(`${relative(root, filePath)}:${line} asset immagine fuori progetto: ${src}`);
    return;
  }

  if (!paths.has(assetPath)) {
    findings.push(`${relative(root, filePath)}:${line} immagine non dichiarata in assets/manifest.json: ${assetPath}`);
  }
}

function normalizeAssetPath(src) {
  const cleanSrc = src.split(/[?#]/)[0];
  const candidates = [
    cleanSrc,
    cleanSrc.replace(/^(\.\.\/)+/, ""),
    cleanSrc.replace(/^\.\/+/, "")
  ];

  for (const candidate of candidates) {
    if (candidate.startsWith("assets/") || candidate.startsWith("fonts/")) {
      return candidate;
    }
  }

  const resolved = resolve(root, cleanSrc);
  if (resolved.startsWith(root)) {
    return relative(root, resolved);
  }

  return "";
}

async function listFiles(folder, extensions) {
  if (!existsSync(folder)) return [];

  const entries = await readdir(folder, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = join(folder, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(entryPath, extensions));
    } else if (extensions.includes(extname(entry.name))) {
      files.push(entryPath);
    }
  }

  return files;
}
