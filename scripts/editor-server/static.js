import { readFile, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, normalize, resolve } from "node:path";

const types = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".pdf": "application/pdf"
};

export function createStaticHandler({ root }) {
  return async function handleStatic(request, response, url) {
    const pathname = url.pathname === "/" ? "/editor/index.html" : url.pathname;
    const filePath = resolve(root, normalize(pathname).replace(/^\/+/, ""));

    if (!filePath.startsWith(root) || !existsSync(filePath) || !(await stat(filePath)).isFile()) {
      response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      response.end("Not found");
      return;
    }

    response.writeHead(200, { "content-type": types[extname(filePath)] || "application/octet-stream" });
    response.end(await readFile(filePath));
  };
}
