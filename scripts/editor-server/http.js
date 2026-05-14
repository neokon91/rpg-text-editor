import { basename } from "node:path";
import { slugify } from "../lib/component-schema.js";

export async function readRequestBody(request) {
  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);
  return Buffer.concat(chunks).toString("utf8");
}

export function sendJson(response, payload, status = 200) {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(payload));
}

export function safeMarkdownFilename(filename) {
  const clean = basename(filename).replace(/\.md$/i, "");
  return `${slugify(clean)}.md`;
}

export function readTitle(markdown) {
  return markdown.match(/^title:\s*(.+)$/m)?.[1]?.trim() || markdown.match(/^#\s+(.+)$/m)?.[1]?.trim() || "";
}
