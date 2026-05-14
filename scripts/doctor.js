import { existsSync } from "node:fs";
import { createServer } from "node:net";
import { spawnSync } from "node:child_process";

const checks = [];

checkNode();
checkNpm();
checkDependencies();
checkBrowser();
await checkPort(Number(process.env.PORT || 5173));

const failed = checks.filter((check) => check.state === "error");
const warned = checks.filter((check) => check.state === "warning");

for (const check of checks) {
  const marker = check.state === "ok" ? "OK" : check.state === "warning" ? "WARN" : "ERR";
  console.log(`[${marker}] ${check.label}`);
  if (check.detail) console.log(`      ${check.detail}`);
}

if (failed.length) {
  console.error(`\nPreflight fallito: ${failed.length} problema/i da correggere.`);
  process.exitCode = 1;
} else if (warned.length) {
  console.log(`\nPreflight completato con ${warned.length} avviso/i.`);
} else {
  console.log("\nPreflight completato: puoi avviare l'editor con npm run editor.");
}

function checkNode() {
  const major = Number(process.versions.node.split(".")[0]);
  push(
    major >= 20 ? "ok" : "error",
    `Node.js ${process.versions.node}`,
    major >= 20 ? "" : "Installa Node.js 20 o superiore."
  );
}

function checkNpm() {
  const result = spawnSync("npm", ["--version"], { encoding: "utf8" });
  push(
    result.status === 0 ? "ok" : "error",
    result.status === 0 ? `npm ${result.stdout.trim()}` : "npm non trovato",
    result.status === 0 ? "" : "Installa npm insieme a Node.js."
  );
}

function checkDependencies() {
  const installed = existsSync("node_modules/vite") && existsSync("node_modules/react");
  push(
    installed,
    "Dipendenze npm installate",
    installed ? "" : "Esegui npm install nella root del progetto."
  );
}

function checkBrowser() {
  const browser = findBrowser();
  push(
    Boolean(browser),
    browser ? `Browser PDF trovato: ${browser}` : "Browser Chromium/Brave/Chrome non trovato",
    browser ? "" : "Installa Brave, Google Chrome o Chromium per export PDF e test UI."
  );
}

async function checkPort(port) {
  const free = await portIsFree(port);
  push(
    free ? "ok" : "warning",
    free ? `Porta editor ${port} libera` : `Porta editor ${port} gia occupata`,
    free ? "" : "npm run editor usera una porta successiva se PORT non e impostato."
  );
}

function push(state, label, detail = "") {
  checks.push({
    state: state === true ? "ok" : state === false ? "error" : state,
    label,
    detail
  });
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
  return candidates.find((candidate) => existsSync(candidate) || commandExists(candidate));
}

function commandExists(command) {
  if (command.startsWith("/")) return false;
  return spawnSync("which", [command], { stdio: "ignore" }).status === 0;
}

function portIsFree(port) {
  return new Promise((resolve) => {
    const tester = createServer();
    tester.once("error", () => resolve(false));
    tester.once("listening", () => {
      tester.close(() => resolve(true));
    });
    tester.listen(port, "127.0.0.1");
  });
}
