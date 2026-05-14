---
title: Prossima Sessione
slug: prossima-sessione
summary: Handoff compatto per continuare lo sviluppo con poco contesto.
category: reference
tags: handoff, editor, ux, codemirror
compatibility: 5e/5.5e
license_mode: srd-5.2-cc
author: Andrea
theme: clean-guild
paper: A4
public: false
---

# Prossima Sessione

## Stato Canonico

- Branch di lavoro: `main`.
- UI unica: `editor-next/` con React, Vite, CodeMirror 6 e preview iframe.
- Target utente finale: web app browser-first, senza installazione locale.
- Avvio sviluppo: `npm start`; preflight sviluppo: `npm run doctor`; deploy candidate: `npm run deploy:check`; pacchetto locale solo per QA/dev: `npm run package:editor`.
- Verifica completa richiesta prima di chiudere tranche: `npm run check`.
- Smoke minimo durante sviluppo UI: `npm run test:editor-next-ui`.
- Reference operative da leggere prima del codice: `README.md`, `docs/user-guide.md`, `docs/deploy.md`, `docs/editor-reference.md`, `docs/checklist.md`, `docs/homebrewery-benchmark.md`.

## Cosa Funziona

- Markdown resta sorgente primaria, con autosave locale e download Markdown.
- Apertura/salvataggio/rename/delete documenti da `docs/`, con dialog custom.
- Check guidato, diagnostiche schema + author check, export HTML/PDF.
- Adapter documenti browser-only iniziale: fallback automatico da API locali a storage/download browser, label `browser/` distinta da `docs/`, persistenza IndexedDB con migrazione da `localStorage` coperta da smoke UI, lista documenti con titolo, import JSON/Markdown multiplo e drag & drop con apertura immediata coperta da smoke UI e conflitti rinominati, PDF web-native visuale con fallback HTML stampabile, preset `fifth-edition-compatible` per starter/template e indicatore uso storage.
- Palette componenti schema-driven con ricerca, gruppi, preset, pack manifest, pack JSON esterni, validazione collisioni e workspace persistente fino al draft del form componente selezionato.
- Preview live iframe con tema/carta, sync editor-preview, zoom, pagina corrente/totale, single/facing/flow.
- `::pagebreak` crea pagine fisiche; `Break` e `Auto break` inseriscono page break block-aware.
- `Auto pages` e disponibile nella preview e viene inoltrato a export HTML/PDF: misura l'iframe, crea nuove `page-shell`, mostra pagine totali, pagine generate e residui overflow cliccabili.
- Test UI spezzato in suite isolate copre editor, componenti, workspace palette, sync, overflow, Auto pages, export HTML/PDF e stati errore principali.

## Prossime Priorita

1. Deploy web statico e verifica su browser reali.
2. Completare persistenza backend web/cloud opzionale per documenti utente reali.
3. Rifinire messaggi di recupero/backup per utente finale non tecnico.
4. Hardening visuale su documenti lunghi, immagini e pagine multiple.

## Guardrail

- Non copiare loghi, marchi, illustrazioni o asset ufficiali. Tenere l'app con identita propria, ma rendere l'output PDF familiare per utenti 5e tramite font, colonne, titoli, box e statblock compatibili.
- Restare browser-first e schema-driven finche account/cloud non diventano requisito esplicito.
- Non nascondere il Markdown dietro un formato proprietario.
- Conservare UI compatta: niente landing page, niente pannelli che coprono il testo.
