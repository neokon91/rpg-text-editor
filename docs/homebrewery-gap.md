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
- Sync editor-preview base con toggle, scroll preview dalla linea cursore e click preview verso sorgente.
- Toggle plugin pack manifest nella UI React, con scelta persistente.
- Palette componenti generata da schema, con ricerca e gruppi.
- Inserimento componenti al cursore CodeMirror.
- Form guidati generati da schema per campi e liste, con preset, rimozione righe e validazione inline dei campi richiesti.
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

1. Renderer multipagina reale: rendere `single/facing/flow` basati su pagine separate, non solo marker `::pagebreak` navigabili.
2. Sync editor-preview fine: scroll continuo piu preciso tra linee intermedie e blocchi lunghi.
3. Palette componenti piu ricca: sottopreset, gruppi rapidi e preset estendibili da schema/plugin.
4. Caricamento plugin pack esterni non versionati nella UI React.
5. Comandi editor da tastiera e toolbar Markdown piu completa.
6. Test UI per open/save, component insertion, sync preview e export PDF.

## Non Obiettivi

- Copiare stylesheet, font, cornici, loghi o asset di Homebrewery o manuali ufficiali.
- Nascondere il Markdown dietro un formato proprietario.
- Trasformare l'editor in un gestionale documentale pesante.

## Definizione Di Pronto

L'editor puo dirsi Homebrewery-like quando un autore riesce a scrivere, inserire blocchi strutturati, navigare sezioni, vedere la resa impaginata, correggere diagnostiche ed esportare HTML/PDF senza uscire dalla UI React.
