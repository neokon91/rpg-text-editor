import { mkdtemp, rm } from "node:fs/promises";
import { existsSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawn } from "node:child_process";

const root = new URL("..", import.meta.url).pathname;
const editorPort = 8100 + Math.floor(Math.random() * 500);
const cdpPort = 9200 + Math.floor(Math.random() * 500);
const baseUrl = `http://127.0.0.1:${editorPort}`;
const renameSourceFile = "codex-rename-temp.md";
const renameTargetFile = "codex-rename-temp-renamed.md";
const openGuardFile = "codex-open-guard.md";

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
  await cleanupTestDocument(renameSourceFile);
  await cleanupTestDocument(renameTargetFile);
  await cleanupTestDocument(openGuardFile);

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
  await installBrowserErrorCapture();
  await cdp.send("Page.navigate", { url: `${baseUrl}/editor-next/` });
  await waitFor(() => evalInPage("document.readyState === 'complete'"));
  await waitFor(() => evalInPage("document.querySelector('iframe')?.contentDocument?.querySelector('.page-shell h1')?.textContent.toLowerCase().includes('nuova avventura')"));
  await waitFor(() => evalInPage("document.querySelector('iframe')?.contentDocument?.querySelector('p[data-source-end-line]')?.dataset.sourceEndLine"));
  await evalInPage(`
    window.localStorage.setItem('rpg-text-editor-next:draft', '---\\ntitle: Codex Rename Temp\\nslug: codex-rename-temp\\nsummary: Documento temporaneo rename/delete\\ncompatibility: 5e/5.5e\\nlicense_mode: srd-5.2-cc\\nauthor: Codex\\ntheme: classic-parchment\\npaper: A4\\n---\\n\\n# Codex Rename Temp\\n\\nContenuto temporaneo.');
  `);
  await reloadPage();
  await waitFor(() => evalInPage("document.readyState === 'complete'"));
  await waitFor(() => evalInPage("document.querySelector('iframe')?.contentDocument?.querySelector('.page-shell h1')?.textContent.includes('Codex Rename Temp')"));
  await clickTopbarButton("Salva");
  await waitFor(() => evalInPage(`document.body.textContent.includes('docs/${renameSourceFile}')`));
  await saveTestDocument(openGuardFile, "---\ntitle: Codex Open Guard\nslug: codex-open-guard\nsummary: Documento temporaneo open guard\ncompatibility: 5e/5.5e\nlicense_mode: srd-5.2-cc\nauthor: Codex\ntheme: classic-parchment\npaper: A4\n---\n\n# Codex Open Guard\n\nDocumento per test apertura.");
  await refreshDocumentSelect();
  await evalInPage("window.localStorage.setItem('rpg-text-editor-next:draft', window.localStorage.getItem('rpg-text-editor-next:draft') + '\\n\\nModifica non salvata')");
  await reloadPage();
  await waitFor(() => evalInPage("document.body.textContent.includes('*') && window.localStorage.getItem('rpg-text-editor-next:draft')?.includes('Modifica non salvata')"));
  await refreshDocumentSelect();
  await waitFor(() => evalInPage(`Array.from(document.querySelector('.next-actions select')?.options || []).some((item) => item.value === ${JSON.stringify(openGuardFile)})`));
  await selectDocument(openGuardFile);
  await waitFor(() => evalInPage("document.querySelector('.app-dialog')?.textContent.includes('Scartare le modifiche')"));
  await clickDialogButton("Annulla");
  await waitFor(() => evalInPage("!document.querySelector('.app-dialog') && window.localStorage.getItem('rpg-text-editor-next:draft')?.includes('Modifica non salvata')"));
  await refreshDocumentSelect();
  await waitFor(() => evalInPage(`Array.from(document.querySelector('.next-actions select')?.options || []).some((item) => item.value === ${JSON.stringify(openGuardFile)})`));
  await selectDocument(openGuardFile);
  await clickDialogButton("Apri");
  await waitFor(() => evalInPage("document.querySelector('iframe')?.contentDocument?.querySelector('.page-shell h1')?.textContent.includes('Codex Open Guard')"));
  await selectDocument(renameSourceFile);
  await waitFor(() => evalInPage("document.querySelector('iframe')?.contentDocument?.querySelector('.page-shell h1')?.textContent.includes('Codex Rename Temp')"));
  await clickTopbarButton("Rinomina");
  await fillDialogInput(renameTargetFile);
  await clickDialogButton("Rinomina");
  await waitFor(() => evalInPage(`document.body.textContent.includes('docs/${renameTargetFile}') && document.body.textContent.includes('Rinominato')`));
  await clickTopbarButton("Elimina");
  await clickDialogButton("Elimina");
  await waitFor(() => evalInPage("document.body.textContent.includes('Eliminato docs/codex-rename-temp-renamed.md')"));
  await clickTopbarButton("Nuovo");
  await waitFor(() => evalInPage("document.querySelector('iframe')?.contentDocument?.querySelector('.page-shell h1')?.textContent.toLowerCase().includes('nuova avventura')"));
  await setViewport(1180, 820);
  await waitFor(() => evalInPage("document.querySelector('.next-workspace') && document.documentElement.scrollWidth <= window.innerWidth"));
  await setViewport(800, 600);
  await clickButton("Componenti");
  await waitFor(() => evalInPage("getComputedStyle(document.querySelector('.component-palette')).display !== 'none' && getComputedStyle(document.querySelector('.markdown-pane')).display === 'none'"));
  await clickButton("Documento");
  await waitFor(() => evalInPage("getComputedStyle(document.querySelector('.document-side')).display !== 'none'"));
  await clickButton("Preview");
  await waitFor(() => evalInPage("getComputedStyle(document.querySelector('.preview-pane')).display !== 'none'"));
  await clickButton("Editor");
  await waitFor(() => evalInPage("getComputedStyle(document.querySelector('.markdown-pane')).display !== 'none'"));
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
  await setViewport(1180, 820);
  await waitFor(() => evalInPage("document.querySelector('select')?.options.length > 1"));
  await waitFor(() => evalInPage("document.querySelectorAll('.component-card').length === 15"));
  await waitFor(() => evalInPage("Array.from(document.querySelectorAll('.component-preset-group-label')).some((node) => node.textContent.trim() === 'Ruolo')"));
  await clickButton("Media");
  await waitFor(() => evalInPage("document.querySelectorAll('.component-card').length === 2"));
  await assertEqual(await evalInPage("window.localStorage.getItem('rpg-text-editor-next:component-group')"), "Media", "component group persisted");
  await reloadPage();
  await waitFor(() => evalInPage("document.readyState === 'complete'"));
  await waitFor(() => evalInPage("document.querySelectorAll('.component-card').length === 2"));
  await clickButton("Tutti");
  await waitFor(() => evalInPage("document.querySelectorAll('.component-card').length === 15"));
  await assertEqual(await evalInPage("document.body.textContent.includes('Fazione')"), true, "plugin pack component visible");
  await clickButton("Tono");
  await waitFor(() => evalInPage("document.querySelectorAll('.component-card').length === 1 && document.body.textContent.includes('Fazione') && !document.body.textContent.includes('Missione')"));
  await waitFor(() => evalInPage("Array.from(document.querySelectorAll('.component-preset-group-label')).every((node) => node.textContent.trim() === 'Tono')"));
  await clickButton("Tutti preset");
  await waitFor(() => evalInPage("document.querySelectorAll('.component-card').length === 15"));
  await dispatchDocumentKey("k", { ctrlKey: true });
  await waitFor(() => evalInPage("document.activeElement === document.querySelector('.component-palette input[type=\"search\"]')"));
  await setComponentSearch("Congrega");
  await waitFor(() => evalInPage("document.querySelectorAll('.component-card').length === 1 && document.body.textContent.includes('Fazione')"));
  await waitFor(() => evalInPage("document.querySelector('.component-form optgroup[label=\"Tono\"]') || Array.from(document.querySelectorAll('.component-preset-group-label')).some((node) => node.textContent.trim() === 'Tono')"));
  await dispatchDocumentKey("Escape");
  await waitFor(() => evalInPage("document.querySelectorAll('.component-card').length === 15"));
  await waitFor(() => evalInPage("Array.from(document.querySelectorAll('.component-preset-group-label')).some((node) => node.textContent.trim() === 'Tono')"));
  const draftBeforePluginPreset = await evalInPage("window.localStorage.getItem('rpg-text-editor-next:draft')");
  await clickButton("Congrega segreta");
  await waitFor(() => evalInPage("window.localStorage.getItem('rpg-text-editor-next:draft')?.includes('Congrega della Soglia')"));
  await evalInPage(`window.localStorage.setItem('rpg-text-editor-next:draft', ${JSON.stringify(draftBeforePluginPreset)})`);
  await reloadPage();
  await waitFor(() => evalInPage("document.readyState === 'complete'"));
  await waitFor(() => evalInPage("document.querySelectorAll('.component-card').length === 15"));
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
  await setViewport(800, 600);

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
  await setViewport(1180, 820);
  await waitFor(() => evalInPage("Boolean(document.querySelector('.component-palette input[type=\"search\"]'))"));
  await setComponentSearch("");
  await waitFor(() => evalInPage("document.querySelectorAll('.component-card').length === 15"));
  await clickButton("Combattimento");
  await waitFor(() => evalInPage("window.localStorage.getItem('rpg-text-editor-next:draft')?.includes('Scheggia Astrale')"));
  await waitFor(() => evalInPage("document.readyState === 'complete' && Boolean(document.querySelector('.next-actions'))"));

  await clickTopbarButton("Scena");
  await waitFor(() => evalInPage("document.body.textContent.includes('Nuova scena')"));
  await clickTopbarButton("Nota");
  await waitFor(() => evalInPage("window.localStorage.getItem('rpg-text-editor-next:draft')?.includes('::: note Nota')"));
  await clickTopbarButton("Include");
  await waitFor(() => evalInPage("window.localStorage.getItem('rpg-text-editor-next:draft')?.includes('<rpg-include src=\"content/monsters/custode-ossa.html\"></rpg-include>')"));
  await clickTopbarButton("Immagine");
  await waitFor(() => evalInPage("window.localStorage.getItem('rpg-text-editor-next:draft')?.includes('![Mappa santuario sepolto]')"));

  await assertEqual(await evalInPage("window.localStorage.getItem('rpg-text-editor-next:draft')?.includes('Nuova scena')"), true, "draft includes inserted scene");

  await clickTopbarButton("Pagina");
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
      const longToken = "OverflowOrizzontale" + "X".repeat(900);
      const body = [longToken, ...Array.from({ length: 80 }, (_, index) => "Paragrafo overflow " + (index + 1) + " con testo di prova per saturare la pagina.")].join("\\n\\n");
      window.localStorage.setItem('rpg-text-editor-next:draft', "---\\ntitle: Overflow Test\\nslug: overflow-test\\nsummary: Test overflow\\ntheme: classic-parchment\\npaper: A4\\n---\\n\\n# Overflow Test\\n\\n" + body);
      window.localStorage.setItem('rpg-text-editor-next:preview-spread', 'single');
      window.localStorage.setItem('rpg-text-editor-next:zoom', '1');
    }
  `);
  await setViewport(1180, 820);
  await reloadPage();
  await waitFor(() => evalInPage("document.readyState === 'complete'"));
  await waitFor(() => evalInPage("document.querySelector('.preview-overflow')?.textContent.includes('riga')"));
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
  await cleanupTestDocument(renameSourceFile);
  await cleanupTestDocument(renameTargetFile);
  await cleanupTestDocument(openGuardFile);
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
  return connection;
}

async function installBrowserErrorCapture() {
  await cdp.send("Page.addScriptToEvaluateOnNewDocument", {
    source: `
      window.__editorNextErrors = [];
      window.addEventListener('error', (event) => window.__editorNextErrors.push(event.message));
      window.addEventListener('unhandledrejection', (event) => window.__editorNextErrors.push(String(event.reason)));
    `
  });
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

async function setViewport(width, height) {
  await cdp.send("Emulation.setDeviceMetricsOverride", {
    width,
    height,
    deviceScaleFactor: 1,
    mobile: false
  });
}

async function dispatchDocumentKey(key, options = {}) {
  await evalInPage(`
    {
      const event = new KeyboardEvent('keydown', {
        key: ${JSON.stringify(key)},
        ctrlKey: ${Boolean(options.ctrlKey)},
        metaKey: ${Boolean(options.metaKey)},
        bubbles: true,
        cancelable: true
      });
      window.dispatchEvent(event);
    }
  `);
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

async function setComponentSearch(value) {
  await evalInPage(`
    {
      const input = document.querySelector('.component-palette input[type="search"]');
      if (!input) throw new Error('Component search not found');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, ${JSON.stringify(value)});
      input.dispatchEvent(new Event('input', { bubbles: true }));
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

async function refreshDocumentSelect() {
  await evalInPage(`
    {
      const select = document.querySelector('.next-actions select');
      if (!select) throw new Error('Document select not found');
      select.focus();
      select.dispatchEvent(new FocusEvent('focus', { bubbles: true }));
    }
  `);
}

async function selectDocument(filename) {
  await evalInPage(`
    {
      const select = document.querySelector('.next-actions select');
      if (!select) throw new Error('Document select not found');
      const setter = Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype, 'value').set;
      setter.call(select, ${JSON.stringify(filename)});
      select.dispatchEvent(new Event('change', { bubbles: true }));
    }
  `);
}

async function fillDialogInput(value) {
  await evalInPage(`
    {
      const input = document.querySelector('.app-dialog input');
      if (!input) throw new Error('Dialog input not found');
      const setter = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set;
      setter.call(input, ${JSON.stringify(value)});
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
  `);
}

async function clickDialogButton(label) {
  await evalInPage(`
    {
      const button = Array.from(document.querySelectorAll('.app-dialog button'))
        .find((item) => item.textContent.trim() === ${JSON.stringify(label)});
      if (!button) throw new Error('Dialog button not found: ${label}');
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

async function cleanupTestDocument(filename) {
  try {
    await fetch(`${baseUrl}/api/documents/${encodeURIComponent(filename)}`, { method: "DELETE" });
  } catch {}
}

async function saveTestDocument(filename, content) {
  const response = await fetch(`${baseUrl}/api/documents`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ filename, content, overwrite: true })
  });
  if (!response.ok) throw new Error(`Unable to save test document: ${filename}`);
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
