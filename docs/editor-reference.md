---
title: Reference Editor
slug: reference-editor
summary: Stato operativo della UI editor React/CodeMirror e dei flussi disponibili.
category: reference
tags: editor, ui, workflow, checklist
compatibility: 5e/5.5e
license_mode: srd-5.2-cc
author: Andrea
theme: clean-guild
paper: A4
public: false
---

# Reference Editor

<p class="subtitle">Mappa operativa della UI locale corrente.</p>

## Avvio

```sh
npm run editor
```

Il server apre `editor-next/` su `http://127.0.0.1:5173/editor-next/` e combina Vite con le API locali per documenti, check ed export. Se la porta e occupata, usa automaticamente la successiva.

## Stato attuale

- UI unica: `editor-next/` con React, CodeMirror 6 e preview iframe.
- Core condiviso: `packages/components`, `packages/documents`, `packages/markdown`.
- Markdown sempre sorgente primario.
- Autosave locale in `localStorage`.
- Apertura documenti da `docs/`.
- Salvataggio su file corrente e salvataggio copia.
- Download Markdown.
- Check guidato con diagnostiche schema + author check.
- Export HTML/PDF in `dist/` tramite renderer ufficiale.
- Preview live con `styles/main.css`, `page-shell`, tema e carta da frontmatter.
- Controlli preview: desktop/mobile, zoom, toggle preview.
- Snippet rapidi: scena, readaloud, incontro, tabella e page break.
- Palette componenti generata da schema con ricerca, gruppi e inserimento al cursore.
- Form componenti base per campi e liste dichiarati nello schema.
- Navigatore documento da heading Markdown con salto alla riga.
- Form frontmatter compatto nel pannello documento.

## Mancanze Verso Homebrewery

- Raffinamento form componenti e supporto ai plugin pack esterni nella nuova UI.
- Sync editor-preview bidirezionale piu robusto.
- Navigazione pagina/spread piu vicina a Homebrewery.
- Controlli frontmatter visuali nella UI React.
- Rename/delete documento, se confermati come parte del flusso editor.
- Test UI piu ampi per save/open e component insertion.

## Guardrail

La direzione resta Homebrewery-like solo per UX e flusso: Markdown visibile, preview live, snippet rapidi, export centrale. Non copiare trade dress, font, asset, stylesheet o layout riconoscibili di editori terzi.
