import { mkdtemp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const root = new URL("..", import.meta.url).pathname;
const editorPort = 8094;
const cdpPort = 9231;
const baseUrl = `http://127.0.0.1:${editorPort}`;
const tempFilename = "codex-preview-visual.md";

let server;
let browser;
let userDataDir;
let cdp;

class CdpConnection {
  constructor(url) {
    this.url = url;
    this.id = 0;
    this.pending = new Map();
  }

  open() {
    return new Promise((resolve, reject) => {
      this.socket = new WebSocket(this.url);
      this.socket.addEventListener("open", resolve, { once: true });
      this.socket.addEventListener("error", reject, { once: true });
      this.socket.addEventListener("message", (event) => this.handleMessage(event));
    });
  }

  send(method, params = {}) {
    const id = ++this.id;
    const payload = { id, method, params };
    if (this.sessionId && !method.startsWith("Target.")) payload.sessionId = this.sessionId;

    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      this.socket.send(JSON.stringify(payload));
    });
  }

  handleMessage(event) {
    const message = JSON.parse(event.data);
    if (!message.id || !this.pending.has(message.id)) return;

    const pending = this.pending.get(message.id);
    this.pending.delete(message.id);
    if (message.error) {
      pending.reject(new Error(message.error.message));
    } else {
      pending.resolve(message.result || {});
    }
  }

  close() {
    this.socket?.close();
  }
}

try {
  server = spawn(process.execPath, ["scripts/serve-editor.js"], {
    cwd: root,
    env: { ...process.env, PORT: String(editorPort) },
    stdio: ["ignore", "pipe", "pipe"]
  });
  await waitForServer();
  await createTempDocument();

  userDataDir = await mkdtemp(join(tmpdir(), "rpg-preview-visual-"));
  browser = spawn(findBrowser(), [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${userDataDir}`,
    "about:blank"
  ], { stdio: "ignore" });

  cdp = await openTarget();
  await cdp.send("Runtime.enable");
  await cdp.send("Page.enable");

  await runViewportCheck({ width: 1440, height: 1100, label: "desktop" });
  await runViewportCheck({ width: 390, height: 900, label: "mobile" });

  const errors = await evalInPage("Array.from(window.__previewVisualErrors || [])");
  if (errors.length) throw new Error(`Errori console browser: ${errors.join("; ")}`);

  console.log("Preview visual smoke test: ok su desktop e mobile.");
} finally {
  await cleanupTempDocument();
  cdp?.close();
  browser?.kill();
  server?.kill();
  if (userDataDir) await rm(userDataDir, { recursive: true, force: true });
}

async function runViewportCheck({ width, height, label }) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: width < 600
  });
  await cdp.send("Page.navigate", { url: baseUrl });
  await waitFor(() => evalInPage("document.readyState === 'complete'"));
  await waitFor(() => evalInPage("document.querySelectorAll('.component-card').length === 15"));
  await selectDocument(tempFilename);
  await waitFor(() => evalInPage("document.querySelector('#preview')?.contentDocument?.querySelector('.page-shell h1')?.textContent === 'Codex Preview Visual'"));
  await waitFor(() => evalInPage("document.querySelector('#preview')?.contentDocument?.querySelector('link[href=\"/styles/main.css\"]')?.sheet"));
  await evalInPage("document.querySelector('.preview-panel')?.scrollIntoView({ block: 'start' })");
  await new Promise((resolve) => setTimeout(resolve, 100));

  const metrics = await previewMetrics();
  assertEqual(metrics.title, "Codex Preview Visual", `${label}: titolo preview`);
  assertEqual(metrics.hasPageShell, true, `${label}: page shell`);
  assertEqual(metrics.hasSpell, true, `${label}: componente spell`);
  assertEqual(metrics.hasTable, true, `${label}: componente random-table`);
  assertEqual(metrics.hasFaction, true, `${label}: componente plugin`);
  assertEqual(metrics.hasCss, true, `${label}: CSS finale caricato`);
  assertEqual(metrics.hasThemeClass, true, `${label}: classe tema`);
  assertEqual(metrics.hasPaperClass, true, `${label}: classe carta`);

  if (metrics.textLength < 180) throw new Error(`${label}: preview troppo vuota (${metrics.textLength} caratteri).`);
  if (metrics.shellWidth < 260) throw new Error(`${label}: page shell troppo stretta (${metrics.shellWidth}px).`);
  if (metrics.horizontalOverflow > 2) throw new Error(`${label}: overflow orizzontale preview ${metrics.horizontalOverflow}px.`);
  if (metrics.frameWidth < 280) throw new Error(`${label}: iframe preview troppo stretto (${metrics.frameWidth}px).`);

  const screenshot = await capturePreviewScreenshot();
  const minimumScreenshotSize = 1000;
  if (!screenshot.data || screenshot.data.length < minimumScreenshotSize) {
    throw new Error(`${label}: screenshot preview assente o quasi vuoto (${screenshot.data?.length || 0}/${minimumScreenshotSize}, area ${Math.round(screenshot.clipArea)}).`);
  }
}

async function openTarget() {
  await waitFor(async () => {
    try {
      const response = await fetch(`http://127.0.0.1:${cdpPort}/json/version`);
      return response.ok;
    } catch {
      return false;
    }
  });

  const version = await fetchJson(`http://127.0.0.1:${cdpPort}/json/version`);
  const connection = new CdpConnection(version.webSocketDebuggerUrl);
  await connection.open();
  const { targetId } = await connection.send("Target.createTarget", { url: "about:blank" });
  const { sessionId } = await connection.send("Target.attachToTarget", { targetId, flatten: true });
  connection.sessionId = sessionId;
  await connection.send("Runtime.evaluate", {
    expression: `
      window.__previewVisualErrors = [];
      window.addEventListener('error', (event) => window.__previewVisualErrors.push(event.message));
      window.addEventListener('unhandledrejection', (event) => window.__previewVisualErrors.push(String(event.reason)));
    `
  });
  return connection;
}

async function previewMetrics() {
  return evalInPage(`
    (() => {
      const frame = document.querySelector('#preview');
      const doc = frame.contentDocument;
      const shell = doc.querySelector('.page-shell');
      const spell = doc.querySelector('.spell.rules-card');
      const table = doc.querySelector('.random-table');
      const faction = doc.querySelector('.faction.rules-card');
      const shellRect = shell.getBoundingClientRect();
      const frameRect = frame.getBoundingClientRect();
      return {
        title: doc.querySelector('h1')?.textContent,
        hasPageShell: Boolean(shell),
        hasSpell: Boolean(spell),
        hasTable: Boolean(table),
        hasFaction: Boolean(faction),
        hasCss: Boolean(doc.querySelector('link[href="/styles/main.css"]')?.sheet),
        hasThemeClass: doc.body.classList.contains('theme-clean-guild'),
        hasPaperClass: doc.body.classList.contains('paper-a4'),
        textLength: shell.innerText.trim().length,
        shellWidth: shellRect.width,
        frameWidth: frameRect.width,
        horizontalOverflow: Math.max(0, doc.documentElement.scrollWidth - doc.documentElement.clientWidth)
      };
    })()
  `);
}

async function capturePreviewScreenshot() {
  const clip = await evalInPage(`
    (() => {
      const rect = document.querySelector('#preview').getBoundingClientRect();
      return {
        x: Math.max(0, rect.x),
        y: Math.max(0, rect.y),
        width: Math.max(1, Math.min(rect.width, window.innerWidth - Math.max(0, rect.x))),
        height: Math.max(1, Math.min(rect.height, window.innerHeight - Math.max(0, rect.y))),
        scale: 1
      };
    })()
  `);
  const screenshot = await cdp.send("Page.captureScreenshot", { format: "png", clip });
  screenshot.clipArea = clip.width * clip.height;
  return screenshot;
}

async function evalInPage(expression) {
  const result = await cdp.send("Runtime.evaluate", {
    expression,
    awaitPromise: true,
    returnByValue: true
  });
  if (result.exceptionDetails) throw new Error(result.exceptionDetails.text || "Valutazione browser fallita");
  return result.result?.value;
}

async function selectDocument(filename) {
  await waitFor(() => evalInPage(`
    Array.from(document.querySelector('#document-picker')?.options || [])
      .some((option) => option.value === ${JSON.stringify(filename)})
  `));
  await evalInPage(`
    {
      const picker = document.querySelector('#document-picker');
      picker.value = ${JSON.stringify(filename)};
      picker.dispatchEvent(new Event('change', { bubbles: true }));
    }
  `);
  await waitFor(() => evalInPage(`document.querySelector('#current-document')?.textContent.includes(${JSON.stringify(filename)})`));
}

async function createTempDocument() {
  await fetchJson(`${baseUrl}/api/documents`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ filename: tempFilename, content: previewDocument(), overwrite: true })
  });
}

async function cleanupTempDocument() {
  try {
    await fetch(`${baseUrl}/api/documents/${encodeURIComponent(tempFilename)}`, { method: "DELETE" });
  } catch {
    // Best-effort cleanup.
  }
}

function previewDocument() {
  return [
    "---",
    "title: Codex Preview Visual",
    "slug: codex-preview-visual",
    "summary: Documento temporaneo per smoke test visuale della preview.",
    "category: test",
    "tags: test, preview, visual",
    "compatibility: 5e/5.5e",
    "license_mode: srd-5.2-cc",
    "author: Codex",
    "theme: clean-guild",
    "paper: A4",
    "public: false",
    "---",
    "",
    "# Codex Preview Visual",
    "",
    "Testo introduttivo con **grassetto**, *corsivo* e una tabella compatta.",
    "",
    "| Voce | Dettaglio |",
    "| --- | --- |",
    "| Alfa | Riga di verifica |",
    "",
    "::: spell Formula rituale",
    "name: Luce del Browser",
    "level: 1° livello",
    "school: divinazione",
    "casting_time: 1 azione",
    "range: personale",
    "components: V, S",
    "duration: 1 minuto",
    "Il testo dell'incantesimo deve restare nel corpo della card.",
    ":::",
    "",
    "::: random-table d4",
    "name: Eventi visuali",
    "die: d4",
    "row: 1 | Primo evento",
    "row: 2 | Secondo evento",
    ":::",
    "",
    "::: faction Fazione",
    "name: Custodi della Preview",
    "goal: Verificare il rendering nel browser.",
    "resources: Schema, CSS e iframe.",
    "complication: Un layout rotto causerebbe overflow.",
    "hook: Segnale | La card plugin deve essere visibile.",
    ":::",
    ""
  ].join("\n");
}

async function waitForServer() {
  await waitFor(async () => {
    try {
      const response = await fetch(baseUrl);
      return response.ok;
    } catch {
      return false;
    }
  });
}

async function waitFor(predicate, timeout = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Timeout durante il test visuale preview.");
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
}

function assertEqual(actual, expected, label) {
  if (actual !== expected) throw new Error(`${label}: atteso ${expected}, ricevuto ${actual}`);
}

function findBrowser() {
  const candidates = [
    "/Applications/Brave Browser.app/Contents/MacOS/Brave Browser",
    "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
    "/Applications/Chromium.app/Contents/MacOS/Chromium",
    "chromium",
    "google-chrome",
    "brave-browser"
  ];

  const browser = candidates.find((candidate) => existsSync(candidate) || !candidate.startsWith("/"));
  if (!browser) throw new Error("Nessun browser Chromium/Brave trovato per il test visuale preview.");
  return browser;
}
