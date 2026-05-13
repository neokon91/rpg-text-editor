import { mkdtemp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const root = new URL("..", import.meta.url).pathname;
const editorPort = 8092;
const cdpPort = 9229;
const baseUrl = `http://127.0.0.1:${editorPort}`;
const tempFilename = "codex-ui-test.md";
const renamedFilename = "codex-ui-test-renamed.md";

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

  userDataDir = await mkdtemp(join(tmpdir(), "rpg-editor-ui-"));
  browser = spawn(findBrowser(), [
    "--headless=new",
    "--no-sandbox",
    "--disable-gpu",
    "--disable-dev-shm-usage",
    `--remote-debugging-port=${cdpPort}`,
    `--user-data-dir=${userDataDir}`,
    "about:blank"
  ], { stdio: "ignore" });

  cdp = await openEditorTarget();
  await cdp.send("Runtime.enable");
  await cdp.send("Page.enable");
  await cdp.send("Page.navigate", { url: baseUrl });
  await waitFor(() => evalInPage("document.readyState === 'complete'"));
  await waitFor(() => evalInPage("document.querySelectorAll('.component-card').length === 15"));

  await assertEqual(await evalInPage("document.querySelectorAll('.component-card').length"), 15, "component palette count");
  await click("button[data-workspace-view='write']");
  await assertEqual(await evalInPage("document.querySelector('.app-shell')?.dataset.workspaceView"), "write", "workspace write mode");
  await assertEqual(await evalInPage("getComputedStyle(document.querySelector('.component-panel')).display"), "none", "write mode hides component panel");
  await assertEqual(await evalInPage("getComputedStyle(document.querySelector('.editor-panel')).display !== 'none'"), true, "write mode keeps markdown visible");
  await click("button[data-workspace-view='components']");
  await assertEqual(await evalInPage("document.querySelector('.app-shell')?.dataset.workspaceView"), "components", "workspace components mode");
  await assertEqual(await evalInPage("getComputedStyle(document.querySelector('.preview-panel')).display"), "none", "components mode hides preview panel");
  await assertEqual(await evalInPage("getComputedStyle(document.querySelector('.editor-panel')).display !== 'none'"), true, "components mode keeps markdown visible");
  await click("button[data-workspace-view='all']");
  await assertEqual(await evalInPage("document.querySelector('.app-shell')?.dataset.workspaceView"), "all", "workspace all mode");
  await assertEqual(await evalInPage("document.querySelector('#validation-panel strong')?.textContent"), "Schema ok", "initial schema status");
  await assertEqual(await evalInPage("document.querySelector('#author-check-panel strong')?.textContent"), "Author check", "initial author check status");
  await assertIncludes(await evalInPage("document.querySelector('#guide-status')?.textContent"), "schema ok", "author flow schema status");
  await assertIncludes(await evalInPage("document.querySelector('#recovery-panel')?.textContent"), "Nessuna bozza locale", "initial recovery status");
  await click("#guide-export-html");
  await waitFor(() => evalInPage("document.querySelector('#export-panel')?.textContent.includes('dist/nuova-avventura.html')"), 12000);
  await assertIncludes(await evalInPage("document.querySelector('#export-panel')?.textContent"), "Export HTML pronto", "guided HTML export status");
  await assertEqual(await exportedFileExists("nuova-avventura.html"), true, "guided HTML export file");
  await evalInPage(`
    {
      const input = document.querySelector('#markdown-input');
      input.value += '\\n\\n## Recovery Test\\n';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  `);
  await waitFor(() => evalInPage("document.querySelector('#recovery-panel')?.textContent.includes('Bozza autosalvata')"));
  await assertEqual(await evalInPage("!document.querySelector('#discard-draft')?.hidden"), true, "discard draft visible");
  await click("#discard-draft");
  await waitFor(() => evalInPage("document.querySelector('#modal-dialog')?.open"));
  await click("#modal-confirm");
  await waitFor(() => evalInPage("document.querySelector('#recovery-panel')?.textContent.includes('Nessuna bozza locale')"));
  await assertIncludes(await textareaValue(), "# Nuova Avventura", "discard draft restores starter");
  await assertEqual(await evalInPage("localStorage.getItem('rpg-text-editor:draft')"), null, "draft storage cleared");
  await assertEqual(await evalInPage("document.querySelectorAll('#document-outline button[data-line]').length"), 2, "initial outline count");
  await assertIncludes(await evalInPage("document.querySelector('#document-outline')?.textContent"), "Scena iniziale", "initial outline heading");
  await evalInPage(`
    Array.from(document.querySelectorAll('#document-outline button[data-line]'))
      .find((button) => button.textContent.includes('Scena iniziale'))
      .click()
  `);
  await assertIncludes(await evalInPage(`
    {
      const input = document.querySelector('#markdown-input');
      input.value.slice(input.selectionStart, input.selectionEnd);
    }
  `), "## Scena iniziale", "outline focuses markdown heading");
  await waitFor(() => evalInPage("document.querySelector('#preview')?.contentDocument?.querySelector('h1[data-source-line]')"));
  await evalInPage(`
    {
      const frame = document.querySelector('#preview');
      const line = Number(frame.contentDocument.querySelector('h1[data-source-line]').dataset.sourceLine);
      window.dispatchEvent(new MessageEvent('message', {
        source: frame.contentWindow,
        data: { type: 'rpg-preview-source-line', line }
      }));
    }
  `);
  await waitFor(() => evalInPage(`
    {
      const input = document.querySelector('#markdown-input');
      input.value.slice(input.selectionStart, input.selectionEnd).includes('# Nuova Avventura');
    }
  `));
  await assertIncludes(await evalInPage(`
    {
      const input = document.querySelector('#markdown-input');
      input.value.slice(input.selectionStart, input.selectionEnd);
    }
  `), "# Nuova Avventura", "preview click focuses markdown source");
  await evalInPage(`
    {
      const input = document.querySelector('#markdown-input');
      input.selectionStart = input.selectionEnd = input.value.length;
    }
  `);

  await fill("#component-search", "Readaloud");
  await assertEqual(await evalInPage("document.querySelectorAll('.component-card').length"), 1, "component search filters palette");
  await fill("#component-search", "");
  await fill("#component-filter", "Regole");
  await assertEqual(await evalInPage("Array.from(document.querySelectorAll('.component-card')).every((button) => button.closest('.component-group')?.querySelector('h3')?.textContent === 'Regole')"), true, "component group filter");
  await fill("#component-filter", "");

  await fill("#preview-viewport", "mobile");
  await fill("#preview-width", "mobile");
  await evalInPage(`
    {
      const sync = document.querySelector('#preview-sync');
      sync.checked = false;
      sync.dispatchEvent(new Event('change', { bubbles: true }));
    }
  `);
  await assertEqual(await evalInPage("document.querySelector('#preview')?.dataset.viewport"), "mobile", "preview mobile viewport");
  await assertEqual(await evalInPage("document.querySelector('#preview')?.dataset.width"), "mobile", "preview mobile width");
  await assertEqual(await evalInPage("document.querySelector('#preview')?.dataset.sync"), "off", "preview sync toggle");
  await fill("#preview-zoom", "1.25");
  await assertEqual(await evalInPage("document.querySelector('#preview')?.dataset.zoom"), "1.25", "preview zoom dataset");
  await waitFor(() => evalInPage("document.querySelector('#preview')?.contentDocument?.documentElement?.style.getPropertyValue('--rpg-preview-zoom') === '1.25'"));
  await evalInPage(`
    {
      const sync = document.querySelector('#preview-sync');
      sync.checked = true;
      sync.dispatchEvent(new Event('change', { bubbles: true }));
    }
  `);
  await assertIncludes(await evalInPage("document.querySelector('#preview-meta')?.textContent"), "Tema:", "preview theme paper signal");

  await loadExternalPack();
  await waitFor(() => evalInPage("document.querySelectorAll('.component-card').length === 16"));
  await assertIncludes(await evalInPage("document.querySelector('#external-pack-status')?.textContent"), "UI Test Pack", "external pack status");
  await assertIncludes(await evalInPage("document.querySelector('#component-list')?.textContent"), "Blocco Test UI", "external component listed");
  await click("#clear-external-packs");
  await waitFor(() => evalInPage("document.querySelectorAll('.component-card').length === 15"));

  await selectDocument(tempFilename);
  await assertIncludes(await textareaValue(), "Codex UI Test", "imported temp document");

  await click("#rename-document");
  await waitFor(() => evalInPage("document.querySelector('#modal-dialog')?.open"));
  await fill("#modal-input", "codex-ui-test-renamed");
  await click("#modal-confirm");
  await waitFor(() => evalInPage("document.querySelector('#current-document')?.textContent.includes('codex-ui-test-renamed.md')"));
  await assertEqual(await documentExists(renamedFilename), true, "renamed document exists");

  await click("#delete-document");
  await waitFor(() => evalInPage("document.querySelector('#modal-dialog')?.open"));
  await click("#modal-confirm");
  await waitFor(async () => !(await documentExists(renamedFilename)));
  await assertEqual(await documentExists(tempFilename), false, "original temp document removed");

  await click("[data-action='heading']");
  await assertIncludes(await textareaValue(), "## Nuova sezione", "toolbar heading insert");
  await click("[data-action='table']");
  await assertIncludes(await textareaValue(), "| Voce | Dettaglio |", "toolbar table insert");
  await click("[data-action='callout']");
  await assertIncludes(await textareaValue(), "::: note Nota", "toolbar callout insert");
  await click("[data-action='include']");
  await assertIncludes(await textareaValue(), '<rpg-include src="content/monsters/custode-ossa.html"></rpg-include>', "toolbar include insert");
  await click("[data-action='pagebreak']");
  await assertIncludes(await textareaValue(), "::pagebreak", "toolbar pagebreak insert");
  await waitFor(() => evalInPage("document.querySelector('#preview-page-indicator')?.textContent === '1/2'"));
  await click("#preview-page-next");
  await assertEqual(await evalInPage("document.querySelector('#preview-page-indicator')?.textContent"), "2/2", "preview next page");
  await assertEqual(await evalInPage("document.querySelector('#preview')?.contentDocument?.querySelectorAll('.page-break').length"), 1, "preview pagebreak marker");
  await click("[data-snippet='scene']");
  await assertIncludes(await textareaValue(), "## Nuova scena", "quick snippet scene insert");
  await waitFor(() => evalInPage("document.querySelector('#document-outline')?.textContent.includes('Nuova scena')"));
  await assertIncludes(await evalInPage("document.querySelector('#document-outline')?.textContent"), "Nuova scena", "outline updates after snippet");
  await click("[data-snippet='encounter']");
  await assertIncludes(await textareaValue(), "::: encounter Incontro", "quick snippet encounter insert");
  await click("[data-snippet='table']");
  await assertIncludes(await textareaValue(), "::: random-table Tabella", "quick snippet table insert");

  await click("#new-document");
  await waitFor(() => evalInPage("document.querySelector('#modal-dialog')?.open"));
  await assertEqual(await evalInPage("document.querySelector('#modal-title')?.textContent"), "Scartare modifiche?", "discard modal title");
  await click("#modal-cancel");
  await waitFor(() => evalInPage("!document.querySelector('#modal-dialog')?.open"));

  await fill("#component-search", "");
  await click("[data-snippet='readaloud']");
  await assertIncludes(await textareaValue(), "::: readaloud", "component insert");

  await click("#new-document");
  await waitFor(() => evalInPage("document.querySelector('#modal-dialog')?.open"));
  await click("#modal-confirm");
  await waitFor(() => evalInPage("!document.querySelector('#modal-dialog')?.open"));

  await evalInPage(`
    {
      const input = document.querySelector('#markdown-input');
      input.value += '\\n\\n::: unknown-widget Test\\nbody: Broken\\n:::';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  `);
  await assertIncludes(await textareaValue(), "::: unknown-widget", "diagnostic fixture inserted");
  await evalInPage("document.querySelector('#check-document').click()");
  await waitFor(() => evalInPage("document.querySelector('#validation-panel')?.textContent.includes('Componente sconosciuto')"));
  await waitFor(() => evalInPage("!document.querySelector('#author-check-panel')?.textContent.includes('in corso')"));
  await assertIncludes(await evalInPage("document.querySelector('#validation-panel')?.textContent"), "Componente sconosciuto", "diagnostic message");
  await click(".validation-panel button");
  await assertIncludes(await evalInPage(`
    {
      const input = document.querySelector('#markdown-input');
      input.value.slice(input.selectionStart, input.selectionEnd);
    }
  `), "::: unknown-widget", "diagnostic focuses markdown line");

  await evalInPage(`
    {
      const input = document.querySelector('#markdown-input');
      input.value += '\\n\\nUn controllo difficile richiede CD 31.\\n';
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  `);
  await waitFor(() => evalInPage("document.querySelector('#author-check-panel')?.textContent.includes('Markdown e cambiato')"));
  await assertIncludes(await evalInPage("document.querySelector('#author-check-panel')?.textContent"), "Markdown e cambiato", "author check marked stale");
  await click("#check-document");
  await waitFor(() => evalInPage("document.querySelector('#author-check-panel')?.textContent.includes('CD 31 fuori scala')"));
  await assertIncludes(await evalInPage("document.querySelector('#author-check-panel')?.textContent"), "Usa CD tra 5 e 30", "author check fix hint");
  await click("#guide-export");
  await waitFor(() => evalInPage("document.querySelector('#save-state')?.textContent.includes('Export bloccato')"));
  await assertIncludes(await evalInPage("document.querySelector('#save-state')?.textContent"), "Export bloccato", "guided export blocks errors");

  const errors = await evalInPage("Array.from(window.__editorUiTestErrors || [])");
  if (errors.length) throw new Error(`Errori console browser: ${errors.join('; ')}`);

  console.log("Editor UI smoke test: ok");
} finally {
  await cleanupTempDocuments();
  cdp?.close();
  browser?.kill();
  server?.kill();
  if (userDataDir) await removeUserDataDir(userDataDir);
}

async function openEditorTarget() {
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
  await connection.send("Runtime.addBinding", { name: "editorUiTestError" });
  await connection.send("Runtime.evaluate", {
    expression: `
      window.__editorUiTestErrors = [];
      window.addEventListener('error', (event) => window.__editorUiTestErrors.push(event.message));
      window.addEventListener('unhandledrejection', (event) => window.__editorUiTestErrors.push(String(event.reason)));
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

async function click(selector) {
  await evalInPage(`
    {
      const element = document.querySelector(${JSON.stringify(selector)});
      element.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true }));
    }
  `);
}

async function fill(selector, value) {
  await evalInPage(`
    {
      const element = document.querySelector(${JSON.stringify(selector)});
      element.value = ${JSON.stringify(value)};
      element.dispatchEvent(new Event('input', { bubbles: true }));
      element.dispatchEvent(new Event('change', { bubbles: true }));
    }
  `);
}

async function clickComponent(label) {
  await evalInPage(`
    Array.from(document.querySelectorAll('.component-card'))
      .find((button) => button.textContent.includes(${JSON.stringify(label)}))
      .click()
  `);
}

async function loadExternalPack() {
  const pack = {
    schema_version: "0.1.0",
    id: "ui-test-pack",
    name: "UI Test Pack",
    version: "0.1.0",
    compatibility: "rpg-text-editor>=0.1.0",
    components: [
      {
        id: "ui-test-block",
        label: "Blocco Test UI",
        group: "Test",
        description: "Componente esterno temporaneo per smoke test.",
        container: "ui-test-block",
        default_label: "Test UI",
        fields: [
          { key: "body", label: "Testo", type: "textarea", default: "Contenuto esterno." }
        ]
      }
    ]
  };

  await evalInPage(`
    {
      const input = document.querySelector('#external-pack-input');
      const file = new File([${JSON.stringify(JSON.stringify(pack))}], 'ui-test-pack.json', { type: 'application/json' });
      const transfer = new DataTransfer();
      transfer.items.add(file);
      input.files = transfer.files;
      input.dispatchEvent(new Event('change', { bubbles: true }));
    }
  `);
}

async function selectDocument(filename) {
  await evalInPage(`
    {
      const picker = document.querySelector('#document-picker');
      picker.value = ${JSON.stringify(filename)};
      picker.dispatchEvent(new Event('change', { bubbles: true }));
    }
  `);
  await waitFor(() => evalInPage(`document.querySelector('#current-document')?.textContent.includes(${JSON.stringify(filename)})`));
}

async function textareaValue() {
  return evalInPage("document.querySelector('#markdown-input').value");
}

async function createTempDocument() {
  const content = [
    "---",
    "title: Codex UI Test",
    "slug: codex-ui-test",
    "summary: Temporary UI test.",
    "category: test",
    "tags: test",
    "compatibility: 5e/5.5e",
    "license_mode: srd-5.2-cc",
    "author: Codex",
    "theme: clean-guild",
    "paper: A4",
    "public: false",
    "---",
    "",
    "# Codex UI Test",
    ""
  ].join("\n");

  await fetchJson(`${baseUrl}/api/documents`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ filename: tempFilename, content, overwrite: true })
  });
}

async function cleanupTempDocuments() {
  for (const filename of [tempFilename, renamedFilename]) {
    try {
      await fetch(`${baseUrl}/api/documents/${encodeURIComponent(filename)}`, { method: "DELETE" });
    } catch {
      // Best-effort cleanup.
    }
  }
}

async function removeUserDataDir(path) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    try {
      await rm(path, { recursive: true, force: true });
      return;
    } catch (error) {
      if (attempt === 4) throw error;
      await new Promise((resolve) => setTimeout(resolve, 150));
    }
  }
}

async function documentExists(filename) {
  const response = await fetch(`${baseUrl}/api/documents/${encodeURIComponent(filename)}`);
  return response.ok;
}

async function exportedFileExists(filename) {
  const response = await fetch(`${baseUrl}/dist/${encodeURIComponent(filename)}`);
  return response.ok;
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

async function waitFor(predicate, timeout = 8000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    if (await predicate()) return;
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error("Timeout durante il test UI.");
}

async function assertEqual(actual, expected, label) {
  if (actual !== expected) throw new Error(`${label}: atteso ${expected}, ricevuto ${actual}`);
}

async function assertIncludes(actual, expected, label) {
  if (!String(actual).includes(expected)) throw new Error(`${label}: testo non trovato ${expected}`);
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
