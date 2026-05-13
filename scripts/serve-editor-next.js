import { createServer } from "node:http";
import { join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createServer as createViteServer } from "vite";
import { createDocumentCheckApi } from "./editor-server/check.js";
import { createDocumentsApi } from "./editor-server/documents.js";
import { createDocumentExportApi } from "./editor-server/export.js";

const root = resolve(fileURLToPath(new URL("..", import.meta.url)));
const docsDir = join(root, "docs");
const preferredPort = Number(process.env.PORT || 5173);

const vite = await createViteServer({
  root,
  appType: "spa",
  server: {
    host: "127.0.0.1",
    middlewareMode: true
  }
});

const handleDocumentsApi = createDocumentsApi({ docsDir });
const handleDocumentCheckApi = createDocumentCheckApi({ root });
const handleDocumentExportApi = createDocumentExportApi({ root });

const server = createServer(async (request, response) => {
  try {
    const host = request.headers.host || "127.0.0.1";
    const url = new URL(request.url || "/", `http://${host}`);

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

    vite.middlewares(request, response);
  } catch (error) {
    response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    response.end(error.message);
  }
});

listen(preferredPort);

function listen(port) {
  server.once("error", (error) => {
    if (error.code === "EADDRINUSE" && !process.env.PORT) {
      listen(port + 1);
      return;
    }
    throw error;
  });
  server.listen(port, "127.0.0.1", () => {
    console.log(`Editor Next disponibile su http://127.0.0.1:${port}/editor-next/`);
  });
}
