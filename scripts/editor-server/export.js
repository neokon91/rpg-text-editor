import { mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, join, relative } from "node:path";
import { spawn } from "node:child_process";
import { readRequestBody, readTitle, safeMarkdownFilename, sendJson } from "./http.js";
import { slugify } from "../lib/component-schema.js";

export function createDocumentExportApi({ root }) {
  return async function handleDocumentExportApi(request, response) {
    if (request.method !== "POST") {
      sendJson(response, { error: "Method not allowed" }, 405);
      return;
    }

    const payload = JSON.parse(await readRequestBody(request));
    const filename = safeMarkdownFilename(payload.filename || "bozza-rpg.md");
    const content = String(payload.content || "");
    const format = payload.format === "pdf" ? "pdf" : "html";
    const autoPaginate = payload.autoPaginate === true;
    const tempPath = join(root, ".tmp", "editor-export", filename);
    const slug = readSlug(content) || filename.replace(/\.md$/i, "");

    await mkdir(dirname(tempPath), { recursive: true });
    await writeFile(tempPath, content, "utf8");

    try {
      const args = [join(root, "scripts", "build.js"), format === "pdf" ? "--pdf" : "--html"];
      if (autoPaginate) args.push("--auto-pages");
      args.push(relative(root, tempPath));
      const result = await run(process.execPath, args, root);
      const outputs = [{
        format: "html",
        path: `dist/${slug}.html`,
        url: `/dist/${slug}.html`
      }];

      if (format === "pdf") {
        outputs.push({
          format: "pdf",
          path: `dist/${slug}.pdf`,
          url: `/dist/${slug}.pdf`
        });
      }

      sendJson(response, { filename, format, outputs, log: result.stdout.trim() });
    } catch (error) {
      sendJson(response, {
        error: "Export failed",
        message: error.message,
        log: [error.stdout, error.stderr].filter(Boolean).join("\n").trim()
      }, 500);
    } finally {
      await rm(tempPath, { force: true });
    }
  };
}

export function readSlug(markdown) {
  return slugify(markdown.match(/^slug:\s*(.+)$/m)?.[1]?.trim() || readTitle(markdown) || "bozza-rpg");
}

function run(command, args, cwd) {
  return new Promise((resolveRun, rejectRun) => {
    const child = spawn(command, args, { cwd, stdio: ["ignore", "pipe", "pipe"] });
    let stdout = "";
    let stderr = "";
    child.stdout.on("data", (chunk) => {
      stdout += chunk;
    });
    child.stderr.on("data", (chunk) => {
      stderr += chunk;
    });
    child.on("error", rejectRun);
    child.on("close", (code) => {
      if (code === 0) {
        resolveRun({ stdout, stderr });
        return;
      }
      const error = new Error(`Comando export fallito con codice ${code}.`);
      error.stdout = stdout;
      error.stderr = stderr;
      rejectRun(error);
    });
  });
}
