import { mkdtemp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const root = new URL("..", import.meta.url).pathname;
const editorPort = 8193;
const cdpPort = 9231;
const baseUrl = `http://127.0.0.1:${editorPort}`;

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
      this.socket.addEventListener("close", () => this.rejectPending(new Error("Connessione CDP chiusa.")));
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

  rejectPending(error) {
    for (const pending of this.pending.values()) {
      pending.reject(error);
    }
    this.pending.clear();
  }

  close() {
    this.socket?.close();
  }
}

try {
  server = spawn(process.execPath, ["scripts/serve-editor-next.js"], {
    cwd: root,
    env: { ...process.env, PORT: String(editorPort) },
    stdio: ["ignore", "pipe", "pipe"]
  });
  await waitForServer();

  userDataDir = await mkdtemp(join(tmpdir(), "rpg-editor-next-ui-"));
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
  await cdp.send("Page.navigate", { url: `${baseUrl}/editor-next/` });
  await waitFor(() => evalInPage("document.readyState === 'complete'"));
  await waitFor(() => evalInPage("document.querySelector('iframe')?.contentDocument?.querySelector('.page-shell h1')?.textContent.toLowerCase().includes('nuova avventura')"));
  await waitFor(() => evalInPage("document.querySelector('iframe')?.contentDocument?.querySelector('p[data-source-end-line]')?.dataset.sourceEndLine"));
  await clickTopbarButton("Nascondi preview");
  await waitFor(() => evalInPage("window.localStorage.getItem('rpg-text-editor-next:preview-visible') === 'false' && !document.querySelector('iframe')"));
  await reloadPage();
  await waitFor(() => evalInPage("document.readyState === 'complete'"));
  await waitFor(() => evalInPage("window.localStorage.getItem('rpg-text-editor-next:preview-visible') === 'false' && !document.querySelector('iframe')"));
  await waitFor(() => evalInPage("Boolean(document.querySelector('.next-actions'))"));
  await clickTopbarButton("Mostra preview");
  await waitFor(() => evalInPage("document.querySelector('iframe')?.contentDocument?.querySelector('.page-shell h1')?.textContent.toLowerCase().includes('nuova avventura')"));
  await clickButton("Nascondi frontmatter");
  await waitFor(() => evalInPage("window.localStorage.getItem('rpg-text-editor-next:frontmatter-panel') === 'false' && !document.querySelector('.metadata-fields')"));
  await clickButton("Nascondi outline");
  await waitFor(() => evalInPage("window.localStorage.getItem('rpg-text-editor-next:outline-panel') === 'false' && !document.querySelector('.outline-list')"));
  await reloadPage();
  await waitFor(() => evalInPage("document.readyState === 'complete'"));
  await waitFor(() => evalInPage("!document.querySelector('.metadata-fields') && !document.querySelector('.outline-list')"));
  await waitFor(() => evalInPage("Boolean(document.querySelector('.document-side'))"));
  await clickButton("Mostra frontmatter");
  await waitFor(() => evalInPage("Boolean(document.querySelector('.metadata-fields'))"));
  await clickButton("Mostra outline");
  await waitFor(() => evalInPage("Boolean(document.querySelector('.outline-list'))"));
  await waitFor(() => evalInPage("document.querySelector('select')?.options.length > 1"));
  await waitFor(() => evalInPage("document.querySelectorAll('.component-card').length === 15"));
  await clickButton("Media");
  await waitFor(() => evalInPage("document.querySelectorAll('.component-card').length === 2"));
  await assertEqual(await evalInPage("window.localStorage.getItem('rpg-text-editor-next:component-group')"), "Media", "component group persisted");
  await reloadPage();
  await waitFor(() => evalInPage("document.readyState === 'complete'"));
  await waitFor(() => evalInPage("document.querySelectorAll('.component-card').length === 2"));
  await clickButton("Tutti");
  await waitFor(() => evalInPage("document.querySelectorAll('.component-card').length === 15"));
  await assertEqual(await evalInPage("document.body.textContent.includes('Fazione')"), true, "plugin pack component visible");
  await evalInPage(`
    {
      const pack = document.querySelector('.pack-toggles input[type="checkbox"]');
      if (!pack) throw new Error('Plugin pack toggle not found');
      pack.click();
    }
  `);
  await waitFor(() => evalInPage("document.querySelectorAll('.component-card').length === 13"));
  await assertEqual(await evalInPage("document.body.textContent.includes('Fazione')"), false, "plugin pack component hidden");
  await evalInPage("document.querySelector('.pack-toggles input[type=\"checkbox\"]').click()");
  await waitFor(() => evalInPage("document.querySelectorAll('.component-card').length === 15"));
  await importExternalPack({
    id: "bad-pack",
    name: "Bad Pack",
    componentId: "spell",
    label: "Collisione",
    container: "external-collision"
  });
  await waitFor(() => evalInPage("document.querySelector('.external-pack-controls .inline-error')?.textContent.includes('Component id duplicato: spell')"));
  await waitFor(() => evalInPage("document.querySelectorAll('.component-card').length === 15"));
  await importExternalPack();
  await waitFor(() => evalInPage("document.querySelectorAll('.component-card').length === 16"));
  await assertEqual(await evalInPage("document.body.textContent.includes('Reliquia esterna')"), true, "external pack component visible");
  await assertEqual(await evalInPage("document.querySelector('.external-pack-components')?.textContent.includes('external-relic')"), true, "external pack component preview");
  await clickButtonByAriaLabel("Rimuovi pack External Test Pack");
  await waitFor(() => evalInPage("document.querySelectorAll('.component-card').length === 15"));

  await clickButton("Check");
  await waitFor(() => evalInPage("document.body.textContent.includes('Check completo ok')"));

  const exportResult = await fetchJson(`${baseUrl}/api/export-document`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      filename: "nuova-avventura.md",
      format: "html",
      content: await evalInPage("window.localStorage.getItem('rpg-text-editor-next:draft')")
    })
  });
  await assertEqual(exportResult.outputs?.[0]?.path, "dist/nuova-avventura.html", "export api output path");
  await assertEqual(await exportedFileExists("nuova-avventura.html"), true, "exported html exists");
  await waitFor(() => evalInPage("document.querySelectorAll('.component-card').length === 15"));
  await clickButton("Combattimento");
  await waitFor(() => evalInPage("window.localStorage.getItem('rpg-text-editor-next:draft')?.includes('Scheggia Astrale')"));
  await waitFor(() => evalInPage("document.readyState === 'complete' && Boolean(document.querySelector('.next-actions'))"));

  await clickTopbarButton("Scena");
  await waitFor(() => evalInPage("document.body.textContent.includes('Nuova scena')"));

  await assertEqual(await evalInPage("document.body.textContent.includes('Nuova scena')"), true, "outline shows inserted scene");

  await clickButton("Pagina");
  await waitFor(() => evalInPage("document.querySelector('.preview-toolbar')?.textContent.includes('/ 2')"));
  await waitFor(() => evalInPage("document.querySelector('iframe')?.contentDocument?.querySelectorAll('.page-shell').length === 2"));
  await clickButtonByAriaLabel("Pagina successiva");
  await waitFor(() => evalInPage("document.querySelector('.preview-toolbar input')?.value === '2'"));
  await clickButton("Fit");
  await waitFor(() => evalInPage("document.querySelector('iframe')?.contentDocument?.documentElement.style.getPropertyValue('--rpg-preview-zoom') !== '1'"));
  await clickButton("Sync");
  await waitFor(() => evalInPage("Array.from(document.querySelectorAll('button[aria-pressed=\"true\"]')).some((button) => button.textContent.trim() === 'Sync')"));
  await evalInPage(`
    {
      const heading = document.querySelector('iframe').contentDocument.querySelector('.page-shell h1');
      if (!heading) throw new Error('Preview heading not found');
      heading.click();
    }
  `);
  await waitFor(() => evalInPage("document.querySelector('.cm-activeLine')?.textContent.includes('# Nuova Avventura')"));
  await waitFor(() => evalInPage("Number(window.localStorage.getItem('rpg-text-editor-next:selected-line')) > 0"));
  await reloadPage();
  await waitFor(() => evalInPage("document.readyState === 'complete'"));
  await waitFor(() => evalInPage("document.querySelector('.outline-item.is-active button[aria-current=\"location\"]')?.textContent.includes('Nuova Avventura')"));
  await evalInPage(`
    {
      const body = Array.from({ length: 120 }, (_, index) => "Paragrafo overflow " + (index + 1) + " con testo di prova per saturare la pagina.").join("\\n\\n");
      window.localStorage.setItem('rpg-text-editor-next:draft', "---\\ntitle: Overflow Test\\nslug: overflow-test\\nsummary: Test overflow\\ntheme: classic-parchment\\npaper: A4\\n---\\n\\n# Overflow Test\\n\\n" + body);
    }
  `);
  await reloadPage();
  await waitFor(() => evalInPage("document.readyState === 'complete'"));
  await waitFor(() => evalInPage("document.querySelector('.preview-overflow')?.textContent.includes('Overflow')"));
  await evalInPage("document.querySelector('.preview-overflow').click()");
  await waitFor(() => evalInPage("Number(window.localStorage.getItem('rpg-text-editor-next:selected-line')) > 1"));
  await clickTopbarButton("Break");
  await waitFor(() => evalInPage("window.localStorage.getItem('rpg-text-editor-next:draft')?.includes('::pagebreak')"));
  await waitFor(() => evalInPage("document.querySelector('iframe')?.contentDocument?.querySelectorAll('.page-shell').length > 1"));

  const errors = await evalInPage("Array.from(window.__editorNextErrors || [])");
  if (errors.length) throw new Error(`Errori console browser: ${errors.join("; ")}`);

  console.log("Editor Next UI smoke test: ok");
} finally {
  cdp?.close();
  browser?.kill();
  server?.kill();
  if (userDataDir) await rm(userDataDir, { recursive: true, force: true, maxRetries: 3, retryDelay: 100 });
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
      window.__editorNextErrors = [];
      window.addEventListener('error', (event) => window.__editorNextErrors.push(event.message));
      window.addEventListener('unhandledrejection', (event) => window.__editorNextErrors.push(String(event.reason)));
    `
  });
  return connection;
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

async function reloadPage() {
  await cdp.send("Page.reload", { ignoreCache: true });
}

async function clickButton(label) {
  await evalInPage(`
    {
      const button = Array.from(document.querySelectorAll('button'))
        .find((item) => item.textContent.trim() === ${JSON.stringify(label)});
      if (!button) throw new Error('Button not found: ${label}');
      button.click();
    }
  `);
}

async function clickTopbarButton(label) {
  const result = await evalInPage(`
    (() => {
      const buttons = Array.from(document.querySelectorAll('.next-actions > button'));
      const button = buttons
        .find((item) => item.textContent.trim() === ${JSON.stringify(label)});
      if (!button) {
        return {
          clicked: false,
          labels: buttons.map((item) => item.textContent.trim()),
          allLabels: Array.from(document.querySelectorAll('button')).map((item) => item.textContent.trim()),
          hasTopbar: Boolean(document.querySelector('.next-actions')),
          href: window.location.href,
          readyState: document.readyState,
          body: document.body.textContent.slice(0, 200),
          errors: window.__editorNextErrors || []
        };
      }
      button.click();
      return { clicked: true, labels: buttons.map((item) => item.textContent.trim()) };
    })()
  `);
  if (!result.clicked) {
    throw new Error(`Topbar button ${label} not found. Topbar: ${result.hasTopbar}. URL: ${result.href}. Ready: ${result.readyState}. Body: ${result.body || "(empty)"}. Errors: ${result.errors.join("; ") || "(none)"}. Available: ${result.labels.join(", ") || "(none)"}. All buttons: ${result.allLabels.join(", ") || "(none)"}`);
  }
}

async function clickButtonByAriaLabel(label) {
  await evalInPage(`
    {
      const button = document.querySelector(\`button[aria-label="${label}"]\`);
      if (!button) throw new Error('Button not found: ${label}');
      button.click();
    }
  `);
}

async function importExternalPack(options = {}) {
  const pack = {
    id: options.id || "external-test-pack",
    name: options.name || "External Test Pack",
    version: "0.1.0",
    compatibility: "rpg-text-editor>=0.1.0",
    components: [{
      id: options.componentId || "external-relic",
      label: options.label || "Reliquia esterna",
      group: "Test",
      description: "Componente caricato da JSON esterno.",
      container: options.container || "external-relic",
      default_label: "Reliquia",
      fields: [
        { key: "name", label: "Nome", type: "text", required: true, default: "Specchio di prova" }
      ]
    }]
  };
  await evalInPage(`
    {
      const input = document.querySelector('.external-pack-import input[type="file"]');
      if (!input) throw new Error('External pack input not found');
      const pack = ${JSON.stringify(pack)};
      const file = new File([JSON.stringify(pack)], 'external-test-pack.json', { type: 'application/json' });
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  `);
}

async function exportedFileExists(filename) {
  const response = await fetch(`${baseUrl}/dist/${encodeURIComponent(filename)}`);
  return response.ok;
}

async function waitForServer() {
  await waitFor(async () => {
    try {
      const response = await fetch(`${baseUrl}/editor-next/`);
      return response.ok;
    } catch {
      return false;
    }
  });
}

async function waitFor(predicate, timeout = 8000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Timeout durante il test UI Editor Next.");
}

async function assertEqual(actual, expected, label) {
  if (actual !== expected) throw new Error(`${label}: atteso ${expected}, ricevuto ${actual}`);
}

async function fetchJson(url, options) {
  const response = await fetch(url, options);
  if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
  return response.json();
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
  if (!browser) throw new Error("Nessun browser Chromium/Brave trovato per i test UI.");
  return browser;
}
