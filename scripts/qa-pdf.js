import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { join, relative, resolve } from "node:path";
import { tmpdir } from "node:os";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const pdfPath = join(root, "dist", "book", "santuario-sepolto-book.pdf");
const qaDir = join(root, "dist", "qa", "pdf");
const dpi = 150;

async function main() {
  await run(process.execPath, [join(root, "scripts", "build.js"), "--book", "--pdf"], root);
  await rm(qaDir, { recursive: true, force: true });
  await mkdir(qaDir, { recursive: true });

  const tempDir = await mkdtemp(join(tmpdir(), "rpg-pdf-qa-"));
  const swiftPath = join(tempDir, "render-pdf.swift");

  try {
    await writeFile(swiftPath, swiftRenderer(), "utf8");
    await run("swift", [swiftPath, pdfPath, qaDir, String(dpi)], root);
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }

  const manifest = JSON.parse(await readFile(join(qaDir, "manifest.json"), "utf8"));
  await writeFile(join(qaDir, "index.html"), renderContactSheet(manifest), "utf8");

  console.log(`PDF QA: ${manifest.pages.length} pagine rasterizzate a ${dpi} dpi.`);
  console.log(`Contact sheet: ${relative(root, join(qaDir, "index.html"))}`);
}

function swiftRenderer() {
  return String.raw`
import AppKit
import Foundation
import PDFKit

let arguments = CommandLine.arguments
guard arguments.count == 4 else {
  fputs("Uso: render-pdf.swift input.pdf outDir dpi\n", stderr)
  exit(2)
}

let pdfURL = URL(fileURLWithPath: arguments[1])
let outURL = URL(fileURLWithPath: arguments[2], isDirectory: true)
let dpi = Double(arguments[3]) ?? 150
let scale = dpi / 72.0

guard let document = PDFDocument(url: pdfURL) else {
  fputs("Impossibile aprire il PDF: \(pdfURL.path)\n", stderr)
  exit(1)
}

try FileManager.default.createDirectory(at: outURL, withIntermediateDirectories: true)

struct PageInfo: Encodable {
  let page: Int
  let file: String
  let widthPx: Int
  let heightPx: Int
  let widthPt: Double
  let heightPt: Double
}

struct Manifest: Encodable {
  let source: String
  let dpi: Int
  let pages: [PageInfo]
}

var pages: [PageInfo] = []

for index in 0..<document.pageCount {
  guard let page = document.page(at: index) else { continue }
  let bounds = page.bounds(for: .mediaBox)
  let widthPx = max(1, Int((bounds.width * scale).rounded()))
  let heightPx = max(1, Int((bounds.height * scale).rounded()))

  guard let bitmap = NSBitmapImageRep(
    bitmapDataPlanes: nil,
    pixelsWide: widthPx,
    pixelsHigh: heightPx,
    bitsPerSample: 8,
    samplesPerPixel: 4,
    hasAlpha: true,
    isPlanar: false,
    colorSpaceName: .deviceRGB,
    bytesPerRow: 0,
    bitsPerPixel: 0
  ) else {
    fputs("Impossibile creare bitmap per pagina \(index + 1)\n", stderr)
    exit(1)
  }

  NSGraphicsContext.saveGraphicsState()
  let context = NSGraphicsContext(bitmapImageRep: bitmap)!
  NSGraphicsContext.current = context
  context.cgContext.setFillColor(NSColor.white.cgColor)
  context.cgContext.fill(CGRect(x: 0, y: 0, width: CGFloat(widthPx), height: CGFloat(heightPx)))
  context.cgContext.scaleBy(x: CGFloat(scale), y: CGFloat(scale))
  page.draw(with: .mediaBox, to: context.cgContext)
  NSGraphicsContext.restoreGraphicsState()

  guard let data = bitmap.representation(using: .png, properties: [:]) else {
    fputs("Impossibile codificare PNG per pagina \(index + 1)\n", stderr)
    exit(1)
  }

  let file = String(format: "page-%02d.png", index + 1)
  try data.write(to: outURL.appendingPathComponent(file))
  pages.append(PageInfo(
    page: index + 1,
    file: file,
    widthPx: widthPx,
    heightPx: heightPx,
    widthPt: Double(bounds.width),
    heightPt: Double(bounds.height)
  ))
}

let manifest = Manifest(source: pdfURL.path, dpi: Int(dpi), pages: pages)
let encoder = JSONEncoder()
encoder.outputFormatting = [.prettyPrinted, .sortedKeys]
try encoder.encode(manifest).write(to: outURL.appendingPathComponent("manifest.json"))
`;
}

function renderContactSheet(manifest) {
  const pages = manifest.pages.map((page) => [
    '<article class="page">',
    `<h2>Pagina ${page.page}</h2>`,
    `<p>${page.widthPx} x ${page.heightPx}px, ${Math.round(page.widthPt)} x ${Math.round(page.heightPt)}pt</p>`,
    `<img src="./${page.file}" alt="Pagina ${page.page} del PDF">`,
    "</article>"
  ].join("\n")).join("\n");

  return [
    "<!doctype html>",
    '<html lang="it">',
    "<head>",
    '<meta charset="utf-8">',
    '<meta name="viewport" content="width=device-width, initial-scale=1">',
    "<title>PDF QA</title>",
    "<style>",
    "body{margin:0;background:#242424;color:#eee;font-family:system-ui,sans-serif}",
    "header{position:sticky;top:0;z-index:1;padding:1rem 1.25rem;background:#111;border-bottom:1px solid #444}",
    "main{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:1.25rem;padding:1.25rem}",
    ".page{background:#333;border:1px solid #555;border-radius:6px;padding:0.85rem}",
    ".page h2{margin:0 0 .25rem;font-size:1rem}",
    ".page p{margin:.15rem 0 .75rem;color:#bbb;font-size:.85rem}",
    "img{display:block;width:100%;height:auto;background:white;border:1px solid #111}",
    "</style>",
    "</head>",
    "<body>",
    `<header><strong>PDF QA</strong> · ${manifest.pages.length} pagine · ${manifest.dpi} dpi · ${escapeHtml(manifest.source)}</header>`,
    `<main>${pages}</main>`,
    "</body>",
    "</html>"
  ].join("\n");
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

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
