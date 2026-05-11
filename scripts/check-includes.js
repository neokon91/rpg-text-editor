import { readdir, readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { join, resolve, relative } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const includePattern = /<rpg-include\s+src="([^"]+)"\s*><\/rpg-include>/g;
const rootsToScan = ["docs", "content"];
const findings = [];

for (const folder of rootsToScan) {
  const folderPath = join(root, folder);
  if (!existsSync(folderPath)) continue;

  for (const filePath of await listFiles(folderPath)) {
    if (!/\.(md|html)$/.test(filePath)) continue;
    await checkFile(filePath);
  }
}

if (findings.length) {
  for (const finding of findings) {
    console.log(`ERRORE ${finding}`);
  }
  process.exit(1);
}

console.log("Include check: tutti gli rpg-include puntano a file validi.");

async function checkFile(filePath) {
  const source = await readFile(filePath, "utf8");
  let match;

  while ((match = includePattern.exec(source)) !== null) {
    const src = match[1];

    if (src.startsWith("/") || src.includes("..")) {
      findings.push(`${relative(root, filePath)} include non consentito: ${src}`);
      continue;
    }

    const includePath = resolve(root, src);
    if (!includePath.startsWith(root) || !existsSync(includePath)) {
      findings.push(`${relative(root, filePath)} include mancante: ${src}`);
    }
  }
}

async function listFiles(folder) {
  const entries = await readdir(folder, { withFileTypes: true });
  const files = [];

  for (const entry of entries) {
    const entryPath = join(folder, entry.name);
    if (entry.isDirectory()) {
      files.push(...await listFiles(entryPath));
    } else {
      files.push(entryPath);
    }
  }

  return files;
}
