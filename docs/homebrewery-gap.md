---
title: Gap Homebrewery
slug: gap-homebrewery
summary: Stato della migrazione verso una UX Homebrewery-like originale.
category: reference
tags: editor, ux, homebrewery, roadmap
compatibility: 5e/5.5e
license_mode: srd-5.2-cc
author: Andrea
theme: clean-guild
paper: A4
public: false
---

# Gap Homebrewery

<p class="subtitle">Cosa e gia vicino al benchmark e cosa manca prima di considerare l'editor maturo.</p>

## Gia Presente

- Editor React/CodeMirror con Markdown sempre visibile.
- Preview live in iframe con resa editoriale reale.
- Autosave locale.
- Apertura e salvataggio file Markdown da `docs/`.
- Check guidato con diagnostiche schema e author check.
- Export HTML/PDF dal flusso locale.
- Snippet rapidi per blocchi frequenti.
- Toolbar preview con pagina corrente/totale, prev/next, input pagina, fit page/fill width e modalita single/facing/flow.
- Preview multipagina reale da `::pagebreak`, con pagine `page-shell` separate.
- Indicatore overflow pagine nella toolbar preview, con riga sorgente del prossimo intervento e selezione da spezzare.
- Inserimento assistito `::pagebreak` prima del blocco Markdown selezionato, con marker creato tracciato in editor.
- Sync editor-preview con toggle, scroll preview dalla linea cursore, range sorgente sui blocchi multi-linea e click preview verso sorgente.
- Toggle plugin pack manifest nella UI React, con scelta persistente.
- Import di plugin pack JSON esterni non versionati, con persistenza locale e validazione collisioni.
- Anteprima componenti inclusi nei pack esterni importati.
- Palette componenti generata da schema, con ricerca e gruppi.
- Inserimento componenti al cursore CodeMirror.
- Form guidati generati da schema per campi e liste, con preset, rimozione righe e validazione inline dei campi richiesti.
- Azioni preset rapide sulle card componenti.
- Sottogruppi preset visibili sulle card componenti.
- Filtri rapidi per gruppo nella palette componenti.
- Breakpoint desktop compatti per evitare overflow orizzontale dei pannelli.
- Workspace locale persistente per preview, zoom, viewport, spread, sync e filtro gruppo componenti.
- Workspace locale persistente per collasso frontmatter/outline e riga outline selezionata.
- Navigatore documento da heading Markdown con salto alla riga.
- Frontmatter visuale compatto per titolo, slug, summary, tema e carta.
- Tema editoriale originale, senza trade dress Homebrewery/PHB.
- Core modulare in `packages/`.

## Benchmark Verificato

- Riferimento compatto: `docs/homebrewery-benchmark.md`.
- Upstream principale: `naturalcrit/homebrewery`.
- V3 e una modalita/tema nello stesso repo, non una codebase separata da imitare.
- Stack upstream recente: React, Vite, CodeMirror 6, renderer iframe, toolbar preview avanzata.

## Gap Prioritari

1. Ridurre overflow residuo dopo l'inserimento assistito.
2. Paginazione automatica piu evoluta oltre agli split manuali `::pagebreak`.
3. Palette componenti piu ricca: preset estendibili da schema/plugin.
4. Rifiniture responsive mobile dei pannelli laterali.
5. Comandi editor da tastiera e toolbar Markdown piu completa.
6. Test UI per open/save, component insertion, sync preview e export PDF.

## Non Obiettivi

- Copiare stylesheet, font, cornici, loghi o asset di Homebrewery o manuali ufficiali.
- Nascondere il Markdown dietro un formato proprietario.
- Trasformare l'editor in un gestionale documentale pesante.

## Definizione Di Pronto

L'editor puo dirsi Homebrewery-like quando un autore riesce a scrivere, inserire blocchi strutturati, navigare sezioni, vedere la resa impaginata, correggere diagnostiche ed esportare HTML/PDF senza uscire dalla UI React.
