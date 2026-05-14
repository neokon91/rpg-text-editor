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
- Rename/delete del documento corrente dalla topbar.
- Dialog custom per conferme e input rename, senza prompt/confirm nativi.
- Download Markdown.
- Check guidato con diagnostiche schema + author check.
- Export HTML/PDF in `dist/` tramite renderer ufficiale.
- Preview live con `styles/main.css`, `page-shell`, tema e carta da frontmatter.
- Controlli preview: desktop/mobile, zoom, toggle preview, fit/fill, pagina corrente/totale, prev/next, input pagina e modalita single/facing/flow.
- Preview multipagina reale: ogni `::pagebreak` crea una nuova `page-shell` navigabile.
- Indicatore overflow nella toolbar preview quando una pagina manuale supera il box pagina, con riga sorgente del prossimo intervento e salto alla selezione da spezzare.
- Comando `Break` per inserire `::pagebreak` prima del blocco Markdown selezionato, selezionando il marker creato e indicando la riga del contenuto spostato.
- Revisione post-break: se resta overflow dopo l'inserimento assistito, la prossima riga da spezzare viene selezionata automaticamente.
- Sync preview: toggle `Sync`, scroll preview dalla linea cursore, range sorgente sui blocchi multi-linea e click su preview verso la linea sorgente.
- Snippet rapidi: scena, readaloud, nota/callout, incontro, tabella, include, immagine e page break.
- Palette componenti generata da schema con ricerca, gruppi e inserimento al cursore.
- Toggle plugin pack dichiarati nel manifest, con scelta persistente in `localStorage`.
- Import pack JSON esterni non versionati dalla palette, con rimozione, persistenza locale e validazione collisioni prima del salvataggio.
- Anteprima dei componenti inclusi nei pack esterni importati.
- Form componenti per campi e liste dichiarati nello schema, con preset, rimozione righe e validazione inline dei campi richiesti.
- Azioni preset rapide direttamente sulle card dei componenti.
- Sottogruppi preset visibili sulle card componenti quando dichiarati nello schema.
- Filtro categorie preset dedicato nella palette componenti.
- Preset supportati anche nei plugin pack versionati.
- Ricerca palette estesa a label, gruppi e valori dei preset.
- Shortcut palette: `Ctrl/Cmd+K` porta il focus sulla ricerca componenti, `Escape` svuota il filtro attivo.
- Filtri rapidi per gruppo nella palette componenti.
- Breakpoint desktop compatti per mantenere palette, editor, preview e documento entro la viewport senza overflow orizzontale.
- Switch pannelli mobile per passare tra Editor, Componenti, Preview e Documento sotto 920px.
- Workspace locale persistente per preview visibile, zoom, viewport, spread, sync e filtro gruppo componenti.
- Workspace locale persistente per collasso frontmatter/outline e riga outline selezionata.
- Navigatore documento da heading Markdown con salto alla riga.
- Form frontmatter compatto nel pannello documento.

## Benchmark Homebrewery

- Vedi `docs/homebrewery-benchmark.md` per il confronto sintetico aggiornato.
- Direzione tecnica allineata: React, Vite, CodeMirror 6, preview iframe.
- Differenza intenzionale: questo editor resta local-first e schema-driven, senza account/vault/MongoDB e senza copiare sintassi o trade dress Homebrewery.
- Prima toolbar preview implementata; resta da rendere lo spread fisicamente multipagina quando il renderer verra spezzato in pagine reali.

## Mancanze Verso Homebrewery

- Test UI piu ampi per save/open e component insertion.

## Guardrail

La direzione resta Homebrewery-like solo per UX e flusso: Markdown visibile, preview live, snippet rapidi, export centrale. Non copiare trade dress, font, asset, stylesheet o layout riconoscibili di editori terzi.
