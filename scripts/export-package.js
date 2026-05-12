import { createHash } from "node:crypto";
import { createReadStream } from "node:fs";
import { access, cp, mkdir, readFile, rm, stat, writeFile } from "node:fs/promises";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const distDir = join(root, "dist");
const packageRoot = join(distDir, "packages");
const bookPath = join(root, "book.json");
const assetManifestPath = join(root, "assets", "manifest.json");
const packageSchemaVersion = 1;
const args = new Set(process.argv.slice(2));
const includePdf = args.has("--pdf");

async function main() {
  const book = JSON.parse(await readFile(bookPath, "utf8"));
  const project = JSON.parse(await readFile(join(root, "package.json"), "utf8"));
  const assetManifest = await readJsonIfExists(assetManifestPath, { assets: [] });
  const slug = book.slug || slugify(book.title || "homebrew-book");
  const packageName = `${slug}-v${project.version || "0.0.0"}`;
  const stagingDir = join(packageRoot, ".staging", packageName);
  const zipPath = join(packageRoot, `${packageName}.zip`);

  await rm(stagingDir, { recursive: true, force: true });
  await rm(zipPath, { force: true });
  await mkdir(stagingDir, { recursive: true });

  await buildBook(includePdf);

  const outputs = await copyOutputs(book, slug, stagingDir, includePdf);
  const assets = await copyAssets(assetManifest.assets || [], stagingDir);
  const chapters = normalizeChapters(book.chapters || []);

  await writeFile(join(stagingDir, "credits.md"), renderCredits(book, assets), "utf8");
  await writeFile(join(stagingDir, "package-manifest.json"), `${JSON.stringify({
    schemaVersion: packageSchemaVersion,
    packageName,
    exportedAt: new Date().toISOString(),
    generator: {
      name: project.name,
      version: project.version
    },
    book: {
      title: book.title || "Homebrew",
      slug,
      summary: book.summary || "",
      author: book.author || "Autore indipendente",
      compatibility: book.compatibility || "5e/5.5e",
      license_mode: book.license_mode || "srd-5.2-cc",
      chapters
    },
    outputs,
    assets
  }, null, 2)}\n`, "utf8");

  await zipDirectory(stagingDir, zipPath);
  await verifyZip(zipPath);

  console.log(`Package scritto in ${relative(root, zipPath)}`);
  console.log(`Verifica ZIP completata: ${relative(root, zipPath)}`);
}

async function buildBook(withPdf) {
  const buildArgs = [join(root, "scripts", "build.js"), "--book", "--html"];
  if (withPdf) buildArgs.push("--pdf");
  await run(process.execPath, buildArgs, root);
}

async function copyOutputs(book, slug, stagingDir, withPdf) {
  const outputs = [];
  const htmlSource = join(distDir, "book", `${slug}.html`);
  const htmlTarget = join(stagingDir, "book", `${slug}.html`);

  await copyFileWithDirs(htmlSource, htmlTarget);
  outputs.push(await fileEntry(htmlTarget, stagingDir, "text/html"));

  const pdfSource = join(distDir, "book", `${slug}.pdf`);
  if (withPdf || await exists(pdfSource)) {
    const pdfTarget = join(stagingDir, "book", `${slug}.pdf`);
    await copyFileWithDirs(pdfSource, pdfTarget);
    outputs.push(await fileEntry(pdfTarget, stagingDir, "application/pdf"));
  }

  return outputs;
}

async function copyAssets(assetList, stagingDir) {
  const copied = [];

  for (const asset of assetList) {
    if (!asset.path) continue;
    const source = join(root, asset.path);
    const target = join(stagingDir, asset.path);
    await copyFileWithDirs(source, target);
    copied.push({
      ...asset,
      ...(await fileEntry(target, stagingDir, mediaTypeFor(asset.path)))
    });
  }

  return copied;
}

async function copyFileWithDirs(source, target) {
  await mkdir(dirname(target), { recursive: true });
  await cp(source, target);
}

async function fileEntry(path, baseDir, mediaType = "application/octet-stream") {
  const info = await stat(path);
  return {
    path: relative(baseDir, path),
    mediaType,
    bytes: info.size,
    sha256: await sha256(path)
  };
}

async function sha256(path) {
  const hash = createHash("sha256");
  await new Promise((resolvePromise, reject) => {
    createReadStream(path)
      .on("data", (chunk) => hash.update(chunk))
      .on("error", reject)
      .on("end", resolvePromise);
  });
  return hash.digest("hex");
}

function renderCredits(book, assets) {
  const rows = assets.map((asset) => [
    `- ${asset.title || asset.path}`,
    asset.author ? `  Autore: ${asset.author}` : "",
    asset.license ? `  Licenza: ${asset.license}` : "",
    asset.source ? `  Fonte: ${asset.source}` : "",
    asset.usage ? `  Uso: ${asset.usage}` : "",
    `  File: ${asset.path}`
  ].filter(Boolean).join("\n"));

  return [
    `# Credits - ${book.title || "Homebrew"}`,
    "",
    `Compatibilita: ${book.compatibility || "5e/5.5e"}`,
    `Autore: ${book.author || "Autore indipendente"}`,
    "",
    "Questo pacchetto contiene una pubblicazione indipendente. Non e approvato, sponsorizzato o affiliato a Wizards of the Coast LLC.",
    "",
    "## Asset",
    "",
    rows.join("\n\n") || "Nessun asset dichiarato."
  ].join("\n");
}

function normalizeChapters(chapters) {
  return chapters.map((chapter) => ({
    path: typeof chapter === "string" ? chapter : chapter.path
  }));
}

function mediaTypeFor(path) {
  if (path.endsWith(".svg")) return "image/svg+xml";
  if (path.endsWith(".ttf")) return "font/ttf";
  if (path.endsWith(".otf")) return "font/otf";
  if (path.endsWith(".png")) return "image/png";
  if (path.endsWith(".jpg") || path.endsWith(".jpeg")) return "image/jpeg";
  if (path.endsWith(".webp")) return "image/webp";
  return "application/octet-stream";
}

async function zipDirectory(sourceDir, zipPath) {
  await mkdir(dirname(zipPath), { recursive: true });
  await run("zip", ["-qr", zipPath, "."], sourceDir);
}

async function verifyZip(zipPath) {
  await run("unzip", ["-t", zipPath], root);
}

async function readJsonIfExists(path, fallback) {
  if (!await exists(path)) return fallback;
  return JSON.parse(await readFile(path, "utf8"));
}

async function exists(path) {
  try {
    await access(path);
    return true;
  } catch {
    return false;
  }
}

async function run(command, commandArgs, cwd) {
  await new Promise((resolvePromise, reject) => {
    const child = spawn(command, commandArgs, { cwd, stdio: "inherit" });
    child.on("error", reject);
    child.on("exit", (code) => {
      code === 0 ? resolvePromise() : reject(new Error(`${command} fallito con codice ${code}.`));
    });
  });
}

function slugify(value) {
  return String(value)
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "homebrew-book";
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
