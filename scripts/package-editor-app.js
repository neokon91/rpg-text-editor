import { spawn } from "node:child_process";
import { access, cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const distDir = join(root, "dist", "editor-app");
const args = new Set(process.argv.slice(2));
const dryRun = args.has("--check");
const packageSchemaVersion = 1;

const includeEntries = [
  "assets",
  "content",
  "docs",
  "editor-next",
  "fonts",
  "packages",
  "schemas",
  "scripts",
  "styles",
  "templates",
  "tests",
  "book.json",
  "package.json",
  "package-lock.json",
  "README.md",
  "vite.config.js"
];

async function main() {
  const project = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  const packageName = `${project.name || "rpg-text-editor"}-app-v${project.version || "0.0.0"}`;
  const stagingDir = join(distDir, ".staging", packageName);
  const zipPath = join(distDir, `${packageName}.zip`);

  await verifyInputs();
  await verifyZipTools();

  if (dryRun) {
    console.log(`Editor app package check: ${packageName}`);
    console.log(`Output previsto: ${relative(root, zipPath)}`);
    return;
  }

  await rm(stagingDir, { recursive: true, force: true });
  await rm(zipPath, { force: true });
  await mkdir(stagingDir, { recursive: true });

  for (const entry of includeEntries) {
    await cp(join(root, entry), join(stagingDir, entry), {
      recursive: true,
      filter: (source) => !shouldExclude(source)
    });
  }

  await writeFile(join(stagingDir, "START_HERE.md"), renderStartHere(project), "utf8");
  await writeFile(join(stagingDir, "editor-app-manifest.json"), `${JSON.stringify({
    schemaVersion: packageSchemaVersion,
    packageName,
    exportedAt: new Date().toISOString(),
    generator: {
      name: project.name,
      version: project.version
    },
    start: {
      install: "npm install",
      preflight: "npm run doctor",
      launch: "npm start"
    },
    contents: includeEntries
  }, null, 2)}\n`, "utf8");

  await zipDirectory(stagingDir, zipPath);
  await verifyZip(zipPath);

  const info = await stat(zipPath);
  console.log(`Editor app package scritto in ${relative(root, zipPath)} (${formatBytes(info.size)})`);
  console.log("Verifica ZIP completata.");
}

async function verifyInputs() {
  const missing = [];
  for (const entry of includeEntries) {
    if (!await exists(join(root, entry))) missing.push(entry);
  }

  if (missing.length) {
    throw new Error(`Input package mancanti: ${missing.join(", ")}`);
  }
}

async function verifyZipTools() {
  await run("zip", ["--version"], root, { quiet: true });
  await run("unzip", ["-v"], root, { quiet: true });
}

function shouldExclude(source) {
  const rel = relative(root, source);
  return rel === "node_modules"
    || rel === "dist"
    || rel === ".git"
    || rel === ".tmp"
    || rel.startsWith(`node_modules/`)
    || rel.startsWith(`dist/`)
    || rel.startsWith(`.git/`)
    || rel.startsWith(`.tmp/`);
}

function renderStartHere(project) {
  return [
    `# ${project.name || "RPG Text Editor"} app`,
    "",
    "Pacchetto locale dell'editor Markdown per contenuti TTRPG con export PDF compatibile 5e/5.5e.",
    "",
    "## Avvio Rapido",
    "",
    "```sh",
    "npm install",
    "npm start",
    "```",
    "",
    "`npm start` avvia il server locale e apre il browser sull'editor.",
    "",
    "Se qualcosa non parte, esegui:",
    "",
    "```sh",
    "npm run doctor",
    "```",
    "",
    "## Uso Normale",
    "",
    "1. Scrivi o importa un documento Markdown.",
    "2. Controlla la preview.",
    "3. Premi `Check`.",
    "4. Premi `PDF` per scaricare il PDF.",
    "5. Usa `Backup` se stai lavorando in modalita browser-only.",
    "",
    "Guida completa per utenti non tecnici: `docs/user-guide.md`.",
    "",
    "## Comandi Tecnici",
    "",
    "- `npm run check` esegue la suite di validazione.",
    "- `npm run export:package` genera lo ZIP di pubblicazione del libro.",
    "- `npm run export:package:pdf` include anche il PDF se e disponibile un browser Chromium/Brave/Chrome.",
    "",
    "## Requisiti",
    "",
    "- Node.js 20 o superiore.",
    "- npm.",
    "- Brave, Chrome o Chromium per export PDF e test visuali."
  ].join("\n");
}

async function zipDirectory(sourceDir, zipPath) {
  await mkdir(dirname(zipPath), { recursive: true });
  await run("zip", ["-qr", zipPath, "."], sourceDir);
}

async function verifyZip(zipPath) {
  await run("unzip", ["-t", zipPath], root);
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function run(command, commandArgs, cwd, options = {}) {
  await new Promise((resolvePromise, reject) => {
    const child = spawn(command, commandArgs, {
      cwd,
      stdio: options.quiet ? "ignore" : "inherit"
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      code === 0 ? resolvePromise() : reject(new Error(`${command} fallito con codice ${code}.`));
    });
  });
}

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
