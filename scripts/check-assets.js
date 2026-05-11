import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve } from "node:path";
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

if (findings.length) {
  for (const finding of findings) {
    console.log(`ERRORE ${finding}`);
  }
  process.exit(1);
}

console.log(`Asset manifest: ${manifest.assets.length} asset tracciati e validi.`);
