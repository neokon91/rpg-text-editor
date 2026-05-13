import test from "node:test";
import assert from "node:assert/strict";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  checkCurrentDocument,
  checkDifficultyClasses,
  checkFrontmatter,
  checkHeadingOrder,
  checkIncludes,
  checkLegalTerms
} from "../../scripts/editor-server/check.js";

test("checkFrontmatter reports missing required metadata", () => {
  const diagnostics = checkFrontmatter("# Titolo");
  assert.equal(diagnostics.length, 6);
  assert.equal(diagnostics.every((diagnostic) => diagnostic.severity === "error"), true);
  assert.match(diagnostics[0].message, /title/);
});

test("checkHeadingOrder reports skipped levels and missing body H1", () => {
  const diagnostics = checkHeadingOrder(`---
title: Test
---

## Sezione
#### Troppo profonda`);

  assert.deepEqual(diagnostics.map((diagnostic) => diagnostic.message), [
    "Salto gerarchico da H2 a H4.",
    "Documento senza titolo H1 nel corpo."
  ]);
});

test("checkIncludes rejects unsafe paths and missing files", async () => {
  const root = await mkdtemp(join(tmpdir(), "rpg-editor-check-"));
  try {
    await writeFile(join(root, "valid.html"), "<p>ok</p>");
    const diagnostics = checkIncludes(`<rpg-include src="/abs.html"></rpg-include>
<rpg-include src="../escape.html"></rpg-include>
<rpg-include src="missing.html"></rpg-include>
<rpg-include src="valid.html"></rpg-include>`, root);

    assert.deepEqual(diagnostics.map((diagnostic) => diagnostic.message), [
      "Include non consentito: /abs.html.",
      "Include non consentito: ../escape.html.",
      "Include mancante: missing.html."
    ]);
  } finally {
    await rm(root, { force: true, recursive: true });
  }
});

test("checkDifficultyClasses flags out-of-range and high DC values", () => {
  const diagnostics = checkDifficultyClasses("CD 4\nCD 21\nCD 31");
  assert.deepEqual(diagnostics.map((diagnostic) => diagnostic.severity), ["error", "warning", "error"]);
  assert.deepEqual(diagnostics.map((diagnostic) => diagnostic.line), [1, 2, 3]);
});

test("checkLegalTerms distinguishes blocking and warning terms", () => {
  const diagnostics = checkLegalTerms("Un beholder cita Dungeons & Dragons.");
  assert.deepEqual(diagnostics.map((diagnostic) => diagnostic.severity), ["error", "warning"]);
});

test("checkCurrentDocument sorts diagnostics by line and severity", () => {
  const diagnostics = checkCurrentDocument(`---
title: Test
slug: test
summary: Test
compatibility: Pathfinder
license_mode: custom
author: Andrea
---

## Sezione
CD 31`, { root: process.cwd() });

  assert.deepEqual(diagnostics.map((diagnostic) => diagnostic.severity), ["warning", "warning", "error", "error"]);
  assert.deepEqual(diagnostics.map((diagnostic) => diagnostic.line), [1, 1, 8, 11]);
});
