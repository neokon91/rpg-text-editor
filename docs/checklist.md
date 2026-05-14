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
- [x] Rename documento nella UI React.
- [x] Delete documento nella UI React.
- [x] Conferme custom non native per reset, cambio documento, rename e delete.
- [x] Toolbar estesa per tabelle, immagini, callout e include nella UI React.
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
- [x] Sync editor-preview piu fine su blocchi multi-linea tramite range sorgente.
- [x] Preview locale con zoom persistente e marker `::pagebreak` visibile.
- [x] Workspace persistente per visibilita preview, zoom, viewport, spread, sync e filtro gruppo componenti.
- [x] Workspace persistente per collasso pannelli frontmatter/outline e riga outline selezionata.
- [x] Prima toolbar pagina/spread nella UI React: pagina corrente/totale, prev/next, input pagina, fit page/fill width e modalita single/facing/flow.
- [x] Preview multipagina reale basata su `::pagebreak`, con una `page-shell` per pagina.
- [x] Indicatore overflow pagine nella toolbar preview, con salto alla prima pagina e selezione della riga da spezzare.
- [x] Inserimento assistito `::pagebreak` dalla riga overflow selezionata.
- [x] Inserimento page break block-aware, evitando di spezzare paragrafi/liste/tabelle nel mezzo.
- [x] Stato page break esplicito: dopo inserimento viene selezionato il marker creato e tracciata la riga del contenuto spostato.
- [x] Badge overflow con riga sorgente del prossimo intervento.
- [x] Revisione post-break: se resta overflow seleziona la prossima riga da spezzare.
- [x] Tema originale `modern-5-5` per resa 5.5-compatible piu moderna e pulita.

## Componenti e schema

- [x] Componenti core descritti in schema.
- [x] Manifest aggregatore.
- [x] Plugin pack `fantasy-classic`.
- [x] Validazione collisioni `id` e `container`.
- [x] Palette generata da schema nella UI React.
- [x] Form componenti generati da schema nella UI React, con preset, rimozione righe lista e validazione inline.
- [x] Azioni preset rapide sulle card componenti.
- [x] Sottogruppi preset visibili sulle card componenti.
- [x] Filtro categorie preset dedicato nella palette componenti.
- [x] Filtri rapidi per gruppo nella palette componenti.
- [x] Breakpoint desktop compatti per evitare overflow orizzontale dei pannelli.
- [x] Switch pannelli mobile per Editor, Componenti, Preview e Documento.
- [x] Preset dichiarati anche da plugin pack versionati.
- [x] Ricerca palette estesa a label, gruppi e valori dei preset.
- [x] Shortcut palette: `Ctrl/Cmd+K` focus ricerca, `Escape` pulisce filtro attivo.
- [x] Renderer build allineato ai plugin pack.
- [x] UI React per attivare/disattivare pack dichiarati nel manifest.
- [x] UI React per caricare pack esterni non versionati.
- [x] Validazione locale pack esterni per campi minimi e collisioni `id`/`container`.
- [x] Anteprima componenti inclusi nei pack esterni importati.
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
- [x] Test UI per open con modifiche non salvate: annulla e conferma.
- [x] Test UI per errore save su file esistente e export bloccato dai diagnostici.
- [x] Test UI per export PDF con stato in corso e file generato.

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

1. Test UI piu ampi per component insertion e sync preview.
2. Palette/componenti e preview come workspace persistenti.
