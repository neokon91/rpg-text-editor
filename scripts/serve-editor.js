import { createServer } from "node:http";
import { readFile, readdir, stat, writeFile } from "node:fs/promises";
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

  if (request.method === "POST" && url.pathname === "/api/documents") {
    const payload = JSON.parse(await readRequestBody(request));
    const filename = safeMarkdownFilename(payload.filename || `${slugify(readTitle(payload.content || "") || "bozza-rpg")}.md`);
    await writeFile(join(docsDir, filename), payload.content || "", "utf8");
    sendJson(response, { filename });
    return;
  }

  response.writeHead(404, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify({ error: "Not found" }));
}

function safeMarkdownFilename(filename) {
  const clean = basename(filename).replace(/\.md$/i, "");
  return `${slugify(clean)}.md`;
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
