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
- Integrazione futura nel sito reference come app statica.

## Stato Attuale

- Il repo ha molte modifiche non committate e preesistenti. Non fare revert automatici.
- Ultimo check completo eseguito con successo: `npm run check`.
- Server locale corrente: `npm run editor` su `http://127.0.0.1:5173/editor-next/`.
- La shell vanilla `editor/` e stata rimossa; `editor-next/` e l'unica UI applicativa.
- Tranche Homebrewery-like avviata in `editor-next/` con Vite, React, CodeMirror 6, preview iframe e autosave locale separato.
- `editor-next` ora usa un server integrato Vite + API locali con `npm run editor:next`, include apertura documenti, salvataggio, check guidato ed export HTML/PDF.
- Build statica: `npm run editor:next:build`; smoke dedicato: `npm run test:editor-next-ui`.

## File Da Conoscere

- `packages/markdown/editor-actions.js`
- `packages/documents/preview-shell.js`
- `packages/components/preview.js`
- `packages/documents/api.js`
- `scripts/serve-editor-next.js`
- `scripts/editor-server/*`
- `styles/preview.css`
- `styles/core/*`
- `scripts/test-editor-next-ui.js`

## Primo Task Consigliato

Continuare la nuova app editor moderna:

```text
editor-next/
  index.html
  src/
    App.jsx
    editor/MarkdownEditor.jsx
    preview/PreviewFrame.jsx
    shell/TopMenu.jsx
    storage/localDrafts.js
```

Poi:

1. Raffinare form componenti: rimozione righe lista, preset avanzati e validazione inline.
2. Aggiungere sync preview/editor bidirezionale piu robusto.
3. Portare rename/delete o decidere se lasciarli fuori dal flusso Next.
4. Rifinire test UI per coprire save/open, frontmatter edit e component insertion da `editor-next`.
5. Spezzare il bundle CodeMirror se il peso diventa un problema reale.

## Guardrail UX

- Niente pannelli impilati sopra il testo.
- Niente UI da gestionale: menu compatti e contenuto dominante.
- Markdown resta sorgente primaria.
- Preview pulita, senza immagini demo o ornamenti inutili.
- Stile fantasy/SRD originale: non copiare trade dress, loghi, font o asset proprietari di editori terzi.

## Verifica Minima

Prima di chiudere ogni tranche:

```bash
npm run test:editor-next-ui
npm run check
```
