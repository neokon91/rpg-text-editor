import { readFile, readdir, rename, unlink, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import { extname, join } from "node:path";
import { readRequestBody, readTitle, safeMarkdownFilename, sendJson } from "./http.js";

export function createDocumentsApi({ docsDir }) {
  async function uniqueMarkdownFilename(filename) {
    const base = safeMarkdownFilename(filename).replace(/\.md$/i, "");
    let candidate = `${base}.md`;
    let index = 2;

    while (existsSync(join(docsDir, candidate))) {
      candidate = `${base}-${index}.md`;
      index += 1;
    }

    return candidate;
  }

  return async function handleDocumentsApi(request, response, url) {
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

    if (request.method === "PUT" && url.pathname.startsWith("/api/documents/")) {
      const filename = safeMarkdownFilename(decodeURIComponent(url.pathname.replace("/api/documents/", "")));
      const payload = JSON.parse(await readRequestBody(request));
      const nextFilename = safeMarkdownFilename(payload.filename || "");
      const sourcePath = join(docsDir, filename);
      const targetPath = join(docsDir, nextFilename);

      if (!existsSync(sourcePath)) {
        sendJson(response, { error: "File not found", filename }, 404);
        return;
      }

      if (filename !== nextFilename && existsSync(targetPath)) {
        sendJson(response, { error: "File already exists", filename: nextFilename }, 409);
        return;
      }

      if (filename !== nextFilename) await rename(sourcePath, targetPath);
      sendJson(response, { filename: nextFilename });
      return;
    }

    if (request.method === "DELETE" && url.pathname.startsWith("/api/documents/")) {
      const filename = safeMarkdownFilename(decodeURIComponent(url.pathname.replace("/api/documents/", "")));
      const filePath = join(docsDir, filename);

      if (!existsSync(filePath)) {
        sendJson(response, { error: "File not found", filename }, 404);
        return;
      }

      await unlink(filePath);
      sendJson(response, { filename });
      return;
    }

    if (request.method === "POST" && url.pathname === "/api/documents") {
      const payload = JSON.parse(await readRequestBody(request));
      let filename = safeMarkdownFilename(payload.filename || `${readTitle(payload.content || "") || "bozza-rpg"}.md`);
      if (payload.unique) {
        filename = await uniqueMarkdownFilename(filename);
      } else if (!payload.overwrite && existsSync(join(docsDir, filename))) {
        sendJson(response, { error: "File already exists", filename }, 409);
        return;
      }
      await writeFile(join(docsDir, filename), payload.content || "", "utf8");
      sendJson(response, { filename });
      return;
    }

    sendJson(response, { error: "Not found" }, 404);
  };
}
