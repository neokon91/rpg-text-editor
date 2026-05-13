import { createServer } from "node:http";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createDocumentCheckApi } from "./editor-server/check.js";
import { createDocumentsApi } from "./editor-server/documents.js";
import { createDocumentExportApi } from "./editor-server/export.js";
import { createStaticHandler } from "./editor-server/static.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const docsDir = join(root, "docs");
const port = Number(process.env.PORT || 8082);

const handleDocumentsApi = createDocumentsApi({ docsDir });
const handleDocumentCheckApi = createDocumentCheckApi({ root });
const handleDocumentExportApi = createDocumentExportApi({ root });
const handleStatic = createStaticHandler({ root });

createServer(async (request, response) => {
  try {
    const url = new URL(request.url || "/", `http://127.0.0.1:${port}`);

    if (url.pathname.startsWith("/api/documents")) {
      await handleDocumentsApi(request, response, url);
      return;
    }

    if (url.pathname === "/api/check-document") {
      await handleDocumentCheckApi(request, response);
      return;
    }

    if (url.pathname === "/api/export-document") {
      await handleDocumentExportApi(request, response);
      return;
    }

    await handleStatic(request, response, url);
  } catch (error) {
    response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    response.end(error.message);
  }
}).listen(port, () => {
  console.log(`Editor disponibile su http://127.0.0.1:${port}`);
});
