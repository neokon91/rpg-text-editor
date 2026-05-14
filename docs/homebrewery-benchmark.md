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
- Non importare sintassi `{{...}}`, CSS, font, asset, loghi, cornici o trade dress.
- Preferire componenti `:::` schema-driven per validazione, snippet, plugin pack e reference generate.
- Restare browser-first: niente installazione locale per l'utente finale; account, vault, MongoDB, drive/cloud o share pubblico solo se diventano requisiti espliciti.

## Stato Comparativo

- Allineato: React/Vite, CodeMirror 6, preview iframe, toolbar pagina, zoom fit/fill, single/facing/flow, snippet/componenti, metadata/frontmatter, export.
- Superficie originale: schema componenti, plugin pack, author check, export e persistenza browser-first.
- Gap attuale: `Auto pages` e disponibile in preview ma non ancora nel renderer/export stabile.

## Prossimo Passo

Promuovere la paginazione misurata da esperimento preview a output riproducibile per HTML/PDF, mantenendo `::pagebreak` come override manuale esplicito.
