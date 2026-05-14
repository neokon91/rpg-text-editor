---
title: Benchmark Homebrewery
slug: benchmark-homebrewery
summary: Riferimento minimo Homebrewery/V3 per orientare la UX senza copiare trade dress.
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

## Fonte

- Upstream: `naturalcrit/homebrewery`.
- V3 non e una codebase separata da imitare: e una modalita/tema nello stesso progetto.
- Riferimenti utili upstream: CodeMirror 6 editor, iframe renderer, toolbar pagina/zoom/spread, snippet bar, metadata editor.

## Decisione Locale

- Usare Homebrewery solo come benchmark UX: Markdown visibile, preview impaginata, snippet rapidi, export centrale.
- Usare codice/licenze idonee solo dove serve davvero; per ora il tema `fifth-edition-compatible` e scritto localmente, senza importare il CSS minificato Homebrewery.
- Non importare loghi, marchi, illustrazioni o asset ufficiali. Font, titoli, colonne, box e statblock sono trattati come linguaggio editoriale compatibile 5e, non come brand dell'app.
- Preferire componenti `:::` schema-driven per validazione, snippet, plugin pack e reference generate.
- Restare browser-first: niente installazione locale per l'utente finale; account, vault, MongoDB, drive/cloud o share pubblico solo se diventano requisiti espliciti.

## Stato Comparativo

- Allineato: React/Vite, CodeMirror 6, preview iframe, toolbar pagina, zoom fit/fill, single/facing/flow, snippet/componenti, metadata/frontmatter, export.
- Superficie originale: schema componenti, plugin pack, author check, export e persistenza browser-first.
- Output PDF: preset `fifth-edition-compatible` usato da starter, template, libro e render senza tema esplicito; target visivo a due colonne con carta calda, titoli rossi, box editoriali, tabelle e statblock compatti.
- Gap attuale: resta da rifinire deploy web, persistenza web/cloud opzionale e messaggi di recupero/backup; `Auto pages`, backup/import JSON e PDF browser-native sono collegati all'export.

## Prossimo Passo

Portare l'app su un deploy web statico e verificare il flusso browser-only completo su browser reali.
