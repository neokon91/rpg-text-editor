import test from "node:test";
import assert from "node:assert/strict";
import { parseMarkdownOutline } from "../../editor/markdown/outline.js";
import { createDraftRecoveryController } from "../../editor/documents/recovery.js";
import { createWorkspaceViewController } from "../../editor/ui/workspace-view.js";

test("parseMarkdownOutline ignores fenced headings and strips inline HTML", () => {
  const outline = parseMarkdownOutline(`# Titolo <span>x</span>

\`\`\`md
## Ignorato
\`\`\`

### Sezione finale ###`);

  assert.deepEqual(outline, [
    { level: 1, title: "Titolo x", line: 1 },
    { level: 3, title: "Sezione finale", line: 7 }
  ]);
});

test("draft recovery stores content with current document metadata", () => {
  const restoreStorage = installMemoryStorage();
  const panelMessage = { textContent: "" };
  const panel = {
    classList: createClassList(),
    querySelector: () => panelMessage
  };
  const discardButton = { hidden: true };
  let markdown = "# Bozza Test";
  let currentDocument = "bozza-test.md";

  try {
    const controller = createDraftRecoveryController({
      storageKey: "draft",
      draftMetaKey: "draft-meta",
      panel,
      discardButton,
      modalController: {},
      starterDocument: "# Starter",
      documentPicker: { value: "" },
      getMarkdown: () => markdown,
      setMarkdown: (value) => {
        markdown = value;
      },
      getCurrentDocument: () => currentDocument,
      setCurrentDocument: (value) => {
        currentDocument = value;
      },
      setLastSavedContent: () => {},
      setSaveState: () => {},
      setDirty: () => {},
      syncMetadata: () => {},
      renderPreview: () => {}
    });

    controller.saveDraft();
    assert.deepEqual(controller.loadDraft(), {
      content: "# Bozza Test",
      currentDocument: "bozza-test.md"
    });

    controller.render();
    assert.equal(discardButton.hidden, false);
    assert.equal(panel.classList.contains("has-draft"), true);
    assert.match(panelMessage.textContent, /docs\/bozza-test\.md/);
  } finally {
    restoreStorage();
  }
});

test("workspace view normalizes invalid views and updates button state", () => {
  const restoreStorage = installMemoryStorage();
  const shell = { dataset: {} };
  const buttons = ["all", "write", "focus", "components"].map((view) => createButton(view));

  try {
    const controller = createWorkspaceViewController({
      shell,
      buttons,
      storageKey: "workspace-view"
    });

    controller.setView("write");
    assert.equal(shell.dataset.workspaceView, "write");
    assert.equal(localStorage.getItem("workspace-view"), "write");
    assert.equal(buttons[1].classList.contains("is-active"), true);
    assert.equal(buttons[1].attributes["aria-pressed"], "true");

    controller.setView("focus");
    assert.equal(shell.dataset.workspaceView, "focus");
    assert.equal(localStorage.getItem("workspace-view"), "focus");
    assert.equal(buttons[2].classList.contains("is-active"), true);

    controller.setView("unknown");
    assert.equal(shell.dataset.workspaceView, "all");
    assert.equal(buttons[0].classList.contains("is-active"), true);
    assert.equal(buttons[1].classList.contains("is-active"), false);
  } finally {
    restoreStorage();
  }
});

function installMemoryStorage() {
  const previousDescriptor = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const values = new Map();
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => values.set(key, String(value)),
    removeItem: (key) => values.delete(key)
    }
  });
  return () => {
    if (previousDescriptor) {
      Object.defineProperty(globalThis, "localStorage", previousDescriptor);
    } else {
      delete globalThis.localStorage;
    }
  };
}

function createButton(view) {
  const listeners = new Map();
  return {
    dataset: { workspaceView: view },
    classList: createClassList(),
    attributes: {},
    addEventListener: (event, listener) => listeners.set(event, listener),
    click: () => listeners.get("click")?.(),
    setAttribute(name, value) {
      this.attributes[name] = value;
    }
  };
}

function createClassList() {
  const classes = new Set();
  return {
    toggle(name, active) {
      if (active) classes.add(name);
      else classes.delete(name);
    },
    contains: (name) => classes.has(name)
  };
}
