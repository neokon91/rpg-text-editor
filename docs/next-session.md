---
title: Prossima Sessione
slug: prossima-sessione
summary: Handoff conciso per migrare l'editor verso una UX Homebrewery-like moderna.
category: reference
tags: handoff, editor, ux, codemirror
compatibility: 5e/5.5e
license_mode: srd-5.2-cc
author: Andrea
theme: clean-guild
paper: A4
public: false
---

# Prossima Sessione

## Obiettivo

Preparare una nuova esperienza editor statica integrabile nel sito reference SRD: topbar minima, Markdown editor a sinistra, preview viva a destra, preview nascondibile, dati salvati localmente nel browser.

## Decisione Tecnica

Migrare la UI editor verso:

```text
Vite + React + CodeMirror 6 + iframe preview
```

- CodeMirror 6 per editing Markdown, shortcut, completions, lint e comandi.
- React solo per shell, menu, pannelli e stato.
- Preview iframe usando il renderer/CSS gia presenti.
- Storage statico iniziale: `localStorage`/download-import Markdown.
- Integrazione futura in una sottocartella `/editor/` del sito reference come app statica.

## Stato Attuale

- Il repo ha molte modifiche non committate e preesistenti. Non fare revert automatici.
- Ultimo check completo eseguito con successo: `npm run check`.
- Server locale puo essere avviato con `npm run editor` su `http://127.0.0.1:8082/`.
- L'editor vanilla attuale e stato refactorizzato ma resta UX insufficiente; usarlo come riferimento funzionale, non come base UI definitiva.

## File Da Conoscere

- `editor/index.html`
- `editor/app.js`
- `editor/markdown/editor-actions.js`
- `editor/preview/controller.js`
- `editor/documents/preview-shell.js`
- `editor/components/preview.js`
- `editor/documents/api.js`
- `scripts/serve-editor.js`
- `scripts/editor-server/*`
- `styles/preview.css`
- `styles/core/*`
- `scripts/test-editor-ui.js`
- `scripts/test-preview-visual.js`

## Primo Task Consigliato

Creare una nuova app editor moderna senza cancellare subito la vanilla:

```text
editor-next/
  index.html
  package/build config se necessario
  src/
    App.jsx
    editor/MarkdownEditor.jsx
    preview/PreviewFrame.jsx
    shell/TopMenu.jsx
    storage/localDrafts.js
```

Poi:

1. Installare/configurare Vite + React + CodeMirror 6.
2. Montare layout split editor/preview a piena altezza.
3. Collegare CodeMirror a preview iframe usando il renderer esistente.
4. Implementare toggle preview e autosave locale.
5. Aggiungere test smoke browser minimo.

## Guardrail UX

- Niente pannelli impilati sopra il testo.
- Niente UI da gestionale: menu compatti e contenuto dominante.
- Markdown resta sorgente primaria.
- Preview pulita, senza immagini demo o ornamenti inutili.
- Stile fantasy/SRD originale: non copiare trade dress, loghi, font o asset proprietari di editori terzi.

## Verifica Minima

Prima di chiudere ogni tranche:

```bash
npm run test:editor-ui
npm run test:preview-visual
npm run check
```
