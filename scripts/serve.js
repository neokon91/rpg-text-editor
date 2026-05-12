import { createServer } from "node:http";
import { statSync, watch } from "node:fs";
import { readFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const publicDir = join(root, "dist");
const port = Number(process.env.PORT || 8081);
const args = new Set(process.argv.slice(2));
const expandedPreview = args.has("--expanded");
const watchPreview = args.has("--watch");
let building = false;
let rebuildQueued = false;
let rebuildTimer;

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".pdf": "application/pdf",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".ttf": "font/ttf",
  ".otf": "font/otf"
};

if (expandedPreview) {
  await buildExpandedPreview();
}

createServer(async (request, response) => {
  const url = new URL(request.url || "/", `http://127.0.0.1:${port}`);
  const pathname = previewPath(url.pathname);
  const filePath = join(publicDir, pathname);

  if (!filePath.startsWith(publicDir) || !existsSync(filePath)) {
    response.writeHead(404);
    response.end("Not found");
    return;
  }

  response.writeHead(200, { "content-type": types[extname(filePath)] || "application/octet-stream" });
  response.end(await readFile(filePath));
}).listen(port, () => {
  console.log(`Preview disponibile su http://127.0.0.1:${port}`);
  if (expandedPreview) {
    console.log("Modalita expanded: include espansi e indice sito rigenerato all'avvio.");
  }
  if (watchPreview) {
    watchSources();
    console.log("Watch attivo: salva un file in docs/, content/, styles/, templates/, assets/ o book.json e aggiorna il browser.");
  }
});

function previewPath(pathname) {
  if (pathname === "/" && expandedPreview && existsSync(join(publicDir, "site", "index.html"))) {
    return "/site/index.html";
  }

  if (pathname === "/") return "/esempio.html";
  if (pathname.endsWith("/") && existsSync(join(publicDir, pathname, "index.html"))) {
    return `${pathname}index.html`;
  }

  return pathname;
}

async function buildExpandedPreview() {
  if (building) {
    rebuildQueued = true;
    return;
  }

  building = true;
  try {
    await run(process.execPath, [join(root, "scripts", "build.js"), "--site"], root);
  } finally {
    building = false;
  }

  if (rebuildQueued) {
    rebuildQueued = false;
    await buildExpandedPreview();
  }
}

function watchSources() {
  const targets = ["docs", "content", "styles", "templates", "assets", "book.json"]
    .map((target) => join(root, target))
    .filter((target) => existsSync(target));

  for (const target of targets) {
    const recursive = statSync(target).isDirectory();
    watch(target, { recursive }, () => {
      clearTimeout(rebuildTimer);
      rebuildTimer = setTimeout(async () => {
        try {
          await buildExpandedPreview();
          console.log(`Preview aggiornata alle ${new Date().toLocaleTimeString("it-IT")}`);
        } catch (error) {
          console.error(`Preview non aggiornata: ${error.message}`);
        }
      }, 150);
    });
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
