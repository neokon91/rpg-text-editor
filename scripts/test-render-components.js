import { readFile } from "node:fs/promises";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const execFileAsync = promisify(execFile);
const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const fixture = "tests/fixtures/schema-render-regression.md";
const output = join(root, "dist", "schema-render-regression.html");

const expectations = [
  '<aside class="spell rules-card no-break">',
  '<h3>Luce del Test</h3>',
  '<strong>Tempo di lancio.</strong> 1 azione',
  '<aside class="random-table no-break">',
  '<td>1</td><td>Primo evento</td>',
  '<aside class="faction rules-card no-break">',
  '<h3>Compagnia del Test</h3>',
  '<strong>Obiettivo.</strong> Verificare il rendering dei plugin pack.',
  '<strong>Segnale.</strong> Il test deve trovare questo aggancio nel markup.',
  '<aside class="quest rules-card no-break">',
  '<h3>Missione di Regressione</h3>',
  '<strong>Obiettivo.</strong> Coprire i componenti generici da schema.',
  '<strong>Prova.</strong> Il markup deve contenere il dettaglio strutturato.',
  '<p class="subtitle">Sottotitolo di regressione</p>',
  '<p class="dropcap">Il capolettera apre il paragrafo di prova.</p>',
  '<aside class="readaloud no-break"><div class="readaloud__label">Da leggere al tavolo</div>'
];

const forbidden = [
  '<aside class="faction no-break">',
  '<aside class="quest no-break">',
  '<p>name: Compagnia del Test',
  '<p>name: Missione di Regressione',
  '<aside class="subtitle',
  '<aside class="dropcap',
  '<h3>Da leggere al tavolo</h3>'
];

await execFileAsync(process.execPath, ["scripts/build.js", "--html", fixture], { cwd: root });
const html = await readFile(output, "utf8");
const failures = [];

for (const expected of expectations) {
  if (!html.includes(expected)) failures.push(`Manca: ${expected}`);
}

for (const rejected of forbidden) {
  if (html.includes(rejected)) failures.push(`Markup regressivo presente: ${rejected}`);
}

await execFileAsync(process.execPath, ["scripts/build.js", "--html", "--auto-pages", fixture], { cwd: root });
const autoPagesHtml = await readFile(output, "utf8");
const autoPageExpectations = [
  'data-auto-pages="true"',
  "function paginateExportPages()",
  "data-auto-pages-ready",
  "data-auto-pages-total"
];

for (const expected of autoPageExpectations) {
  if (!autoPagesHtml.includes(expected)) failures.push(`Auto pages export manca: ${expected}`);
}

if (failures.length) {
  for (const failure of failures) console.log(`ERRORE ${failure}`);
  process.exit(1);
}

console.log(`Rendering componenti strutturati verificato: ${expectations.length + autoPageExpectations.length} assert.`);
