---
title: Benchmark Homebrewery
slug: benchmark-homebrewery
summary: Confronto operativo minimo con naturalcrit/homebrewery e V3.
category: reference
tags: editor, ux, homebrewery, benchmark
compatibility: 5e/5.5e
license_mode: srd-5.2-cc
author: Andrea
theme: clean-guild
paper: A4
public: false
---

# Benchmark Homebrewery

<p class="subtitle">Riferimento compatto per procedere senza rileggere il repository upstream.</p>

## Fonte Verificata

- Repo principale: `naturalcrit/homebrewery`.
- V3 non e un repo separato principale: e un branch storico e oggi un renderer/tema nello stesso repo.
- Release recente verificata: `v3.21.0`, con migrazione backend a Vite.
- Changelog upstream 2026 cita migrazione editor a CodeMirror 6.

## File Upstream Da Ricordare

- `shared/markdown.js`: parser Markdown V3 con blocchi `{{...}}`, injection stile e variabili.
- `client/components/codeEditor/codeEditor.jsx`: CodeMirror 6, page map da `\page`, fold, history, search, shortcut.
- `client/homebrew/brewRenderer/brewRenderer.jsx`: iframe renderer, split pagine, lazy rendering, page visibility.
- `client/homebrew/brewRenderer/toolBar/toolBar.jsx`: zoom fit/fill, spread single/facing/flow, prev/next pagina, input pagina.
- `client/homebrew/editor/snippetbar/snippetbar.jsx`: snippet per tema, sottosnippet, history locale.
- `client/homebrew/editor/metadataEditor/metadataEditor.jsx`: proprieta, tema, lingua, publish/delete.

## Decisione Per Questo Repo

- Seguire Homebrewery solo come benchmark UX: editor Markdown visibile, preview impaginata, snippet/componenti rapidi, export.
- Non importare sintassi `{{...}}`, PHB/trade dress, asset, font, stylesheet, icone o temi upstream.
- Restare local-first: niente account, vault, share pubblico, MongoDB o Google Drive finche non diventa un requisito esplicito.
- Preferire componenti `:::` schema-driven perche sono validabili, documentabili e compatibili con plugin pack.

## Gap Prioritario

Prima tranche preview implementata:

1. Marker pagina basati su `.page-shell` e `.page-break`.
2. Stato pagina corrente e totale pagine.
3. Comandi pagina precedente/successiva.
4. Zoom `fit page` e `fill width`, oltre allo zoom percentuale.
5. Selettore `single`, `facing` e `flow`.
6. Test UI su pagina, zoom e navigazione.

Limite noto: `facing/flow` sono modalita preparatorie; lo spread diventera pienamente equivalente al benchmark quando il renderer produrra pagine separate.

## Dopo La Preview

- Sync editor-preview bidirezionale basato su pagina/linea.
- Renderer multipagina reale per spread affiancato/flusso.
- Palette componenti con sottopreset e gruppi piu ricchi.
- Pannello plugin pack nella UI.
