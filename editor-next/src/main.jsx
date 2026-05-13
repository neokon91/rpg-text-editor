import React, { useEffect, useMemo, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { renderMarkdown } from "../../packages/components/preview.js";
import { renderComponentValidation } from "../../packages/components/validation.js";
import { loadComponentSchema, loadEnabledPacks, manifestUrl, fetchJson, saveEnabledPacks } from "../../packages/components/schema.js";
import { renderPreviewDocument } from "../../packages/documents/preview-shell.js";
import { parseFrontmatter, serializeFrontmatter } from "../../packages/documents/frontmatter.js";
import { checkDocument, exportDocument, getDocument, listDocuments, saveDocument } from "../../packages/documents/api.js";
import { countWords, downloadMarkdown } from "../../packages/markdown/editor-actions.js";
import { slugifyDocumentName } from "../../scripts/lib/component-schema.js";
import { ComponentPalette } from "./components/ComponentPalette.jsx";
import { MarkdownEditor } from "./editor/MarkdownEditor.jsx";
import { DocumentOutline } from "./outline/DocumentOutline.jsx";
import { PreviewFrame } from "./preview/PreviewFrame.jsx";
import { TopMenu } from "./shell/TopMenu.jsx";
import { clearDraft, loadDraft, saveDraft } from "./storage/localDrafts.js";
import "./styles.css";

const enabledPacksStorageKey = "rpg-text-editor:enabled-packs";
const externalPacksStorageKey = "rpg-text-editor:external-packs";
const workspaceStoragePrefix = "rpg-text-editor-next";

const starterDocument = `---
title: Nuova Avventura
slug: nuova-avventura
summary: Bozza creata dall'editor Next.
category: avventure
tags: bozza, ttrpg
compatibility: 5e/5.5e
license_mode: srd-5.2-cc
author: Andrea
theme: classic-parchment
paper: A4
public: true
---

# Nuova Avventura

<p class="subtitle">Una premessa pronta da sviluppare.</p>

## Scena iniziale

Scrivi qui la prima scena.
`;

function App() {
  const editorRef = useRef(null);
  const [markdown, setMarkdown] = useState(() => loadDraft() || starterDocument);
  const [componentManifest, setComponentManifest] = useState(null);
  const [enabledPacks, setEnabledPacks] = useState(() => new Set());
  const [externalPacks, setExternalPacks] = useState(() => loadExternalPacks());
  const [schema, setSchema] = useState({ components: [] });
  const [schemaState, setSchemaState] = useState("Caricamento schema");
  const [previewVisible, setPreviewVisible] = useState(() => loadBooleanWorkspaceSetting("preview-visible", true));
  const [zoom, setZoom] = useState(() => localStorage.getItem(`${workspaceStoragePrefix}:zoom`) || "1");
  const [viewport, setViewport] = useState(() => localStorage.getItem(`${workspaceStoragePrefix}:viewport`) || "desktop");
  const [previewSpread, setPreviewSpread] = useState(() => localStorage.getItem(`${workspaceStoragePrefix}:preview-spread`) || "single");
  const [syncPreview, setSyncPreview] = useState(() => loadBooleanWorkspaceSetting("sync-preview", false));
  const [activeComponentGroup, setActiveComponentGroup] = useState(() => localStorage.getItem(`${workspaceStoragePrefix}:component-group`) || "all");
  const [cursorLine, setCursorLine] = useState(null);
  const [selectedLine, setSelectedLine] = useState(() => loadNumberWorkspaceSetting("selected-line"));
  const [documentPanels, setDocumentPanels] = useState(() => ({
    frontmatter: loadBooleanWorkspaceSetting("frontmatter-panel", true),
    outline: loadBooleanWorkspaceSetting("outline-panel", true)
  }));
  const [documents, setDocuments] = useState([]);
  const [currentDocument, setCurrentDocument] = useState("");
  const [lastSavedContent, setLastSavedContent] = useState("");
  const [status, setStatus] = useState("Bozza locale");
  const [authorDiagnostics, setAuthorDiagnostics] = useState([]);
  const [checkedMarkdown, setCheckedMarkdown] = useState("");
  const [isChecking, setIsChecking] = useState(false);
  const [exportOutputs, setExportOutputs] = useState([]);

  useEffect(() => {
    let cancelled = false;
    async function loadManifest() {
      try {
        const manifest = await fetchJson(manifestUrl, "Manifest componenti non caricato");
        if (cancelled) return;
        setComponentManifest(manifest);
        setEnabledPacks(loadEnabledPacks(manifest, enabledPacksStorageKey));
      } catch (error) {
        if (cancelled) return;
        setSchemaState(error.message);
      }
    }
    loadManifest();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (!componentManifest) return undefined;
    let cancelled = false;
    async function loadSchema() {
      try {
        const loadedSchema = await loadComponentSchema(componentManifest, enabledPacks, externalPacks);
        if (cancelled) return;
        setSchema(loadedSchema);
        setSchemaState(`${loadedSchema.components.length} componenti`);
      } catch (error) {
        if (cancelled) return;
        setSchema({ components: [] });
        setSchemaState(error.message);
      }
    }
    loadSchema();
    return () => {
      cancelled = true;
    };
  }, [componentManifest, enabledPacks, externalPacks]);

  useEffect(() => {
    saveDraft(markdown);
  }, [markdown]);

  useEffect(() => {
    refreshDocuments();
  }, []);

  useEffect(() => {
    localStorage.setItem(`${workspaceStoragePrefix}:preview-visible`, previewVisible ? "true" : "false");
  }, [previewVisible]);

  useEffect(() => {
    localStorage.setItem(`${workspaceStoragePrefix}:zoom`, zoom);
  }, [zoom]);

  useEffect(() => {
    localStorage.setItem(`${workspaceStoragePrefix}:viewport`, viewport);
  }, [viewport]);

  useEffect(() => {
    localStorage.setItem(`${workspaceStoragePrefix}:preview-spread`, previewSpread);
  }, [previewSpread]);

  useEffect(() => {
    localStorage.setItem(`${workspaceStoragePrefix}:sync-preview`, syncPreview ? "true" : "false");
  }, [syncPreview]);

  useEffect(() => {
    localStorage.setItem(`${workspaceStoragePrefix}:component-group`, activeComponentGroup);
  }, [activeComponentGroup]);

  useEffect(() => {
    if (selectedLine) {
      localStorage.setItem(`${workspaceStoragePrefix}:selected-line`, String(selectedLine));
    } else {
      localStorage.removeItem(`${workspaceStoragePrefix}:selected-line`);
    }
  }, [selectedLine]);

  useEffect(() => {
    localStorage.setItem(`${workspaceStoragePrefix}:frontmatter-panel`, documentPanels.frontmatter ? "true" : "false");
    localStorage.setItem(`${workspaceStoragePrefix}:outline-panel`, documentPanels.outline ? "true" : "false");
  }, [documentPanels]);

  const parsed = useMemo(() => parseFrontmatter(markdown), [markdown]);
  const previewHtml = useMemo(() => {
    const content = renderMarkdown(parsed.body, schema, { startLine: parsed.bodyStartLine });
    return renderPreviewDocument(parsed.metadata, content, { viewport });
  }, [parsed, schema, viewport]);
  const diagnostics = useMemo(() => collectDiagnostics(markdown, schema), [markdown, schema]);
  const activeAuthorDiagnostics = checkedMarkdown === markdown ? authorDiagnostics : [];
  const combinedDiagnostics = useMemo(
    () => [...diagnostics, ...activeAuthorDiagnostics],
    [diagnostics, activeAuthorDiagnostics]
  );
  const words = useMemo(() => countWords(parsed.body), [parsed.body]);
  const title = parsed.metadata.title || "Bozza locale";
  const isDirty = markdown !== lastSavedContent;
  const filename = currentDocument || `${slugifyDocumentName(markdown)}.md`;

  function updateMarkdown(nextMarkdown) {
    setMarkdown(nextMarkdown);
    setExportOutputs([]);
  }

  function resetDraft() {
    if (isDirty && !window.confirm("Scartare le modifiche non salvate?")) return;
    clearDraft();
    setMarkdown(starterDocument);
    setCurrentDocument("");
    setLastSavedContent(starterDocument);
    setAuthorDiagnostics([]);
    setCheckedMarkdown("");
    setExportOutputs([]);
    setSelectedLine(null);
    setStatus("Nuova bozza locale");
  }

  function insertSnippet(snippet) {
    insertMarkdown(`\n\n${snippet}\n`);
  }

  function insertMarkdown(snippet) {
    if (editorRef.current) {
      editorRef.current.insertText(snippet);
    } else {
      setMarkdown((current) => `${current.trimEnd()}${snippet}`);
    }
    setExportOutputs([]);
  }

  function insertPageBreakAtSelection() {
    const targetLine = selectedLine || editorRef.current?.getCursorLine();
    if (!targetLine) return;
    setMarkdown((current) => insertPageBreakBeforeLine(current, targetLine));
    setSelectedLine(targetLine);
    setStatus(`Page break inserito prima della riga ${targetLine}`);
    setExportOutputs([]);
  }

  function togglePack(packId) {
    setEnabledPacks((current) => {
      const next = new Set(current);
      if (next.has(packId)) {
        next.delete(packId);
      } else {
        next.add(packId);
      }
      saveEnabledPacks(enabledPacksStorageKey, next);
      return next;
    });
    setExportOutputs([]);
  }

  function importExternalPack(pack) {
    const normalized = normalizeExternalPack(pack);
    validateExternalPack(normalized, {
      manifest: componentManifest,
      schema,
      externalPacks
    });
    setExternalPacks((current) => {
      const next = [
        ...current.filter((item) => item.id !== normalized.id),
        normalized
      ];
      saveExternalPacks(next);
      return next;
    });
    setStatus(`Pack esterno caricato: ${normalized.name}`);
    setExportOutputs([]);
  }

  function removeExternalPack(packId) {
    setExternalPacks((current) => {
      const next = current.filter((pack) => pack.id !== packId);
      saveExternalPacks(next);
      return next;
    });
    setStatus("Pack esterno rimosso");
    setExportOutputs([]);
  }

  function updateMetadata(key, value) {
    const { metadata, body } = parseFrontmatter(markdown);
    const nextMetadata = { ...metadata, [key]: value };
    setMarkdown(`${serializeFrontmatter(nextMetadata)}\n\n${body}`);
    setExportOutputs([]);
  }

  function toggleDocumentPanel(panel) {
    setDocumentPanels((current) => ({
      ...current,
      [panel]: !current[panel]
    }));
  }

  async function refreshDocuments() {
    try {
      const result = await listDocuments();
      setDocuments(result.documents || []);
    } catch {
      setStatus("Lista documenti non disponibile");
    }
  }

  async function openDocument(nextFilename) {
    if (!nextFilename) return;
    if (isDirty && !window.confirm("Scartare le modifiche non salvate?")) return;

    try {
      const document = await getDocument(nextFilename);
      setMarkdown(document.content);
      setCurrentDocument(document.filename);
      setLastSavedContent(document.content);
      setAuthorDiagnostics([]);
      setCheckedMarkdown("");
      setExportOutputs([]);
      setStatus(`Aperto docs/${document.filename}`);
    } catch {
      setStatus("Import non riuscito");
    }
  }

  async function saveCurrent() {
    try {
      const result = await saveDocument({
        filename,
        content: markdown,
        overwrite: Boolean(currentDocument)
      });
      setCurrentDocument(result.filename);
      setLastSavedContent(markdown);
      clearDraft();
      await refreshDocuments();
      setStatus(`Salvato docs/${result.filename}`);
    } catch (error) {
      setStatus(error.status === 409 ? "File gia esistente: usa Salva copia" : "Salvataggio non riuscito");
    }
  }

  async function saveCopy() {
    try {
      const result = await saveDocument({
        filename,
        content: markdown,
        unique: true
      });
      setCurrentDocument(result.filename);
      setLastSavedContent(markdown);
      clearDraft();
      await refreshDocuments();
      setStatus(`Salvato nuovo docs/${result.filename}`);
    } catch {
      setStatus("Salva copia non riuscito");
    }
  }

  function downloadCurrentMarkdown() {
    downloadMarkdown(markdown, filename);
    setStatus("Download Markdown pronto");
  }

  async function runCheck({ focus = true } = {}) {
    setIsChecking(true);
    setExportOutputs([]);
    try {
      const result = await checkDocument({ filename, content: markdown });
      const nextAuthorDiagnostics = result.diagnostics || [];
      const allDiagnostics = [...diagnostics, ...nextAuthorDiagnostics];
      setAuthorDiagnostics(nextAuthorDiagnostics);
      setCheckedMarkdown(markdown);
      const firstBlocking = allDiagnostics.find((item) => item.severity === "error") || allDiagnostics[0];
      if (firstBlocking && focus) setSelectedLine(firstBlocking.line);
      setStatus(firstBlocking
        ? firstBlocking.severity === "error" ? "Check: errori da correggere" : "Check: avvisi presenti"
        : "Check completo ok");
      return { ok: !allDiagnostics.some((item) => item.severity === "error"), diagnostics: allDiagnostics };
    } catch {
      const failed = [{
        severity: "error",
        line: 1,
        message: "Author check non disponibile.",
        fix: "Verifica che il server editor-next sia attivo."
      }];
      setAuthorDiagnostics(failed);
      setCheckedMarkdown(markdown);
      setStatus("Check non disponibile");
      return { ok: false, diagnostics: [...diagnostics, ...failed] };
    } finally {
      setIsChecking(false);
    }
  }

  async function exportChecked(format) {
    const result = await runCheck({ focus: true });
    if (!result.ok) {
      setStatus("Export bloccato: correggi gli errori");
      return;
    }

    if (format === "markdown") {
      downloadCurrentMarkdown();
      return;
    }

    setStatus(`Export ${format.toUpperCase()} in corso...`);
    try {
      const exportResult = await exportDocument({ filename, content: markdown, format });
      setExportOutputs(exportResult.outputs || []);
      setStatus(`Export ${format.toUpperCase()} pronto`);
    } catch (error) {
      setExportOutputs([]);
      setStatus(error.log || error.message || "Export non riuscito");
    }
  }

  return (
    <main className="next-shell" data-preview={previewVisible ? "on" : "off"}>
      <TopMenu
        title={title}
        words={words}
        schemaState={schemaState}
        diagnostics={combinedDiagnostics}
        documents={documents}
        currentDocument={currentDocument}
        isDirty={isDirty}
        status={status}
        isChecking={isChecking}
        exportOutputs={exportOutputs}
        previewVisible={previewVisible}
        syncPreview={syncPreview}
        viewport={viewport}
        zoom={zoom}
        onOpenDocument={openDocument}
        onSave={saveCurrent}
        onSaveCopy={saveCopy}
        onDownloadMarkdown={downloadCurrentMarkdown}
        onCheck={runCheck}
        onExport={exportChecked}
        onRefreshDocuments={refreshDocuments}
        onTogglePreview={() => setPreviewVisible((value) => !value)}
        onToggleSyncPreview={() => setSyncPreview((value) => !value)}
        onViewportChange={setViewport}
        onZoomChange={setZoom}
        onResetDraft={resetDraft}
        onInsertSnippet={insertSnippet}
        onInsertPageBreakAtSelection={insertPageBreakAtSelection}
      />
      <section className="next-workspace">
        <ComponentPalette
          schema={schema}
          packs={componentManifest?.packs || []}
          enabledPackIds={enabledPacks}
          externalPacks={externalPacks}
          activeGroup={activeComponentGroup}
          onTogglePack={togglePack}
          onImportExternalPack={importExternalPack}
          onRemoveExternalPack={removeExternalPack}
          onActiveGroupChange={setActiveComponentGroup}
          onInsert={insertMarkdown}
        />
        <MarkdownEditor
          ref={editorRef}
          markdown={markdown}
          selectedLine={selectedLine}
          onChange={updateMarkdown}
          onCursorLineChange={setCursorLine}
        />
        {previewVisible ? (
          <PreviewFrame
            html={previewHtml}
            zoom={zoom}
            viewport={viewport}
            spread={previewSpread}
            syncSourceLine={syncPreview ? cursorLine : null}
            onSelectLine={setSelectedLine}
            onZoomChange={setZoom}
            onSpreadChange={setPreviewSpread}
          />
        ) : null}
        <DocumentOutline
          markdown={markdown}
          metadata={parsed.metadata}
          selectedLine={selectedLine}
          panels={documentPanels}
          onMetadataChange={updateMetadata}
          onSelectLine={setSelectedLine}
          onTogglePanel={toggleDocumentPanel}
        />
      </section>
    </main>
  );
}

function collectDiagnostics(markdown, schema) {
  const target = document.createElement("div");
  return renderComponentValidation(markdown, schema, target, () => {}) || [];
}

createRoot(document.querySelector("#root")).render(<App />);

function loadBooleanWorkspaceSetting(key, fallback) {
  const value = localStorage.getItem(`${workspaceStoragePrefix}:${key}`);
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

function loadNumberWorkspaceSetting(key) {
  const value = Number(localStorage.getItem(`${workspaceStoragePrefix}:${key}`));
  return Number.isInteger(value) && value > 0 ? value : null;
}

function insertPageBreakBeforeLine(markdown, lineNumber) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const index = Math.max(0, Math.min(Number(lineNumber) - 1, lines.length));
  const nearby = lines.slice(Math.max(0, index - 2), Math.min(lines.length, index + 2)).map((line) => line.trim());
  if (nearby.includes("::pagebreak")) return markdown;
  lines.splice(index, 0, "", "::pagebreak", "");
  return lines.join("\n");
}

function loadExternalPacks() {
  try {
    const stored = JSON.parse(localStorage.getItem(externalPacksStorageKey) || "[]");
    if (!Array.isArray(stored)) return [];
    return stored.map(normalizeExternalPack);
  } catch {
    localStorage.removeItem(externalPacksStorageKey);
    return [];
  }
}

function saveExternalPacks(packs) {
  localStorage.setItem(externalPacksStorageKey, JSON.stringify(packs));
}

function normalizeExternalPack(pack) {
  if (!pack || typeof pack !== "object") throw new Error("Pack esterno non valido.");
  if (!pack.id || !pack.name || !Array.isArray(pack.components)) {
    throw new Error("Il pack richiede id, name e components.");
  }
  return {
    id: String(pack.id),
    name: String(pack.name),
    schema: {
      ...pack,
      components: pack.components
    }
  };
}

function validateExternalPack(pack, { manifest, schema, externalPacks }) {
  const manifestPackIds = new Set((manifest?.packs || []).map((item) => item.id));
  if (manifestPackIds.has(pack.id)) throw new Error(`Pack id gia dichiarato nel manifest: ${pack.id}.`);

  for (const component of pack.schema.components) {
    validateExternalComponent(component);
  }

  const replacingIds = new Set([pack.id]);
  const externalIds = new Set(externalPacks.map((item) => item.id));
  if (externalIds.has(pack.id)) replacingIds.add(pack.id);

  const existingComponents = (schema.components || []).filter((component) => !replacingIds.has(component.source));
  const componentIds = new Set(existingComponents.map((component) => component.id));
  const containers = new Set(existingComponents.map((component) => component.container));

  for (const component of pack.schema.components) {
    if (componentIds.has(component.id)) throw new Error(`Component id duplicato: ${component.id}.`);
    if (containers.has(component.container)) throw new Error(`Container duplicato: ${component.container}.`);
    componentIds.add(component.id);
    containers.add(component.container);
  }
}

function validateExternalComponent(component) {
  for (const key of ["id", "label", "group", "description", "container", "fields"]) {
    if (!component[key]) throw new Error(`Componente esterno senza campo obbligatorio: ${key}.`);
  }
  if (!Array.isArray(component.fields)) throw new Error(`${component.id}: fields deve essere un array.`);
  for (const field of component.fields) {
    if (!field.key || !field.label || !field.type) {
      throw new Error(`${component.id}: ogni field richiede key, label e type.`);
    }
  }
}
