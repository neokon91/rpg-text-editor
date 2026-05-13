---
title: Checklist Prodotto
slug: checklist-prodotto
summary: Checklist di stato per editor, schema, build e prossimi passaggi.
category: reference
tags: checklist, editor, roadmap, qa
compatibility: 5e/5.5e
license_mode: srd-5.2-cc
author: Andrea
theme: clean-guild
paper: A4
public: false
---

# Checklist Prodotto

<p class="subtitle">Stato sintetico per decidere il prossimo incremento senza rileggere tutta la roadmap.</p>

## Repository

- [x] Repository privata su GitHub.
- [x] Repository visibile dal connector GitHub.
- [x] Branch `main` usato come linea principale.
- [x] Commit e push effettuati per ogni incremento.

## Editor UI

- [x] Editor locale avviabile con `npm run editor`.
- [x] Markdown sempre visibile come sorgente.
- [x] Form frontmatter.
- [x] Toolbar Markdown base.
- [x] Palette componenti da schema.
- [x] Toggle plugin pack.
- [x] Import documenti da `docs/`.
- [x] Salvataggio con file corrente.
- [x] Dirty state.
- [x] Overwrite esplicito.
- [x] Salva nuovo con nome unico.
- [x] Conferma prima di perdere modifiche non salvate.
- [x] Rename documento.
- [x] Delete documento.
- [x] Conferme custom non native.
- [x] Toolbar estesa per tabelle, immagini, callout e include.

## Preview

- [x] Preview live.
- [x] Preview in iframe isolato.
- [x] Preview con `styles/main.css`.
- [x] Preview con `page-shell`.
- [x] Tema e carta letti dal frontmatter.
- [x] Verifica visuale automatizzata stabile via browser.
- [x] Controllo layout PDF/pagine integrato nel flusso editor.
- [x] Markdown Preview VS Code allineata ai token visuali del template.

## Componenti e schema

- [x] Componenti core descritti in schema.
- [x] Manifest aggregatore.
- [x] Plugin pack `fantasy-classic`.
- [x] Validazione collisioni `id` e `container`.
- [x] Palette generata da schema.
- [x] Form componenti generati da schema.
- [x] Renderer build allineato ai plugin pack.
- [x] UI per caricare pack esterni non versionati.
- [x] Documentazione dedicata per creare nuovi pack.

## Validazione e QA

- [x] `npm run check:legal`.
- [x] `npm run check:editorial`.
- [x] `npm run check:assets`.
- [x] `npm run check:includes`.
- [x] `npm run check:components`.
- [x] `npm run check:documents`.
- [x] `npm run check:schema-artifacts`.
- [x] `npm run test:rendering`.
- [x] `npm run check` aggregato.
- [x] Fixture diagnostiche per casi limite della validazione.
- [x] Test UI automatizzati affidabili.

## Output editoriale

- [x] Build HTML singolo.
- [x] Build sito.
- [x] Build libro.
- [x] Export package.
- [x] QA PDF disponibile.
- [x] Pass visuale completo su PDF dopo redesign finale.
- [x] Template ulteriormente raffinato verso qualita manuale fantasy professionale, con identita visuale originale.
- [x] Guardrail visuali e licenza per output 5E-compatible originale.

## Prossimi passi consigliati

1. Migliorare UX autore nell'editor locale e nei workflow VS Code.
2. Rafforzare componenti/statblock verso una resa fantasy professionale originale.
