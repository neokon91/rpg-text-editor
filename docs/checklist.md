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

- [x] Editor React/CodeMirror avviabile con `npm run editor`.
- [x] Markdown sempre visibile come sorgente.
- [x] Form frontmatter nella UI React.
- [x] Snippet Markdown base.
- [x] Palette componenti da schema nella UI React.
- [x] Benchmark Homebrewery/V3 documentato in `docs/homebrewery-benchmark.md`.
- [x] Toggle plugin pack nella UI React.
- [x] Import documenti da `docs/`.
- [x] Salvataggio con file corrente.
- [x] Dirty state.
- [x] Autosave locale.
- [x] Export HTML/PDF guidato dal workflow autore locale.
- [x] Overwrite esplicito.
- [x] Salva nuovo con nome unico.
- [x] Conferma prima di perdere modifiche non salvate.
- [ ] Rename documento nella UI React.
- [ ] Delete documento nella UI React.
- [ ] Conferme custom non native.
- [ ] Toolbar estesa per tabelle, immagini, callout e include nella UI React.
- [x] Navigatore documento da heading Markdown con salto alla riga sorgente.
- [x] Sync editor-preview base: toggle, scroll preview dalla linea cursore e click preview verso linea sorgente.
- [ ] Palette/componenti e preview come workspace persistenti.

## Preview

- [x] Preview live.
- [x] Preview in iframe isolato.
- [x] Preview con `styles/main.css`.
- [x] Preview con `page-shell`.
- [x] Tema e carta letti dal frontmatter.
- [x] Smoke test automatizzato via browser per editor React.
- [x] Controllo layout PDF/pagine integrato nel flusso editor.
- [x] Markdown Preview VS Code allineata ai token visuali del template.
- [x] Preview locale con zoom persistente e marker `::pagebreak` visibile.
- [x] Prima toolbar pagina/spread nella UI React: pagina corrente/totale, prev/next, input pagina, fit page/fill width e modalita single/facing/flow.
- [x] Tema originale `modern-5-5` per resa 5.5-compatible piu moderna e pulita.

## Componenti e schema

- [x] Componenti core descritti in schema.
- [x] Manifest aggregatore.
- [x] Plugin pack `fantasy-classic`.
- [x] Validazione collisioni `id` e `container`.
- [x] Palette generata da schema nella UI React.
- [x] Form componenti generati da schema nella UI React, con preset, rimozione righe lista e validazione inline.
- [x] Renderer build allineato ai plugin pack.
- [x] UI React per attivare/disattivare pack dichiarati nel manifest.
- [ ] UI React per caricare pack esterni non versionati.
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

1. Rendere lo spread `facing/flow` fisicamente multipagina quando il renderer verra spezzato in pagine reali.
2. Aggiungere caricamento pack esterni non versionati.
3. Poi palette componenti con sottopreset e workspace persistenti.
