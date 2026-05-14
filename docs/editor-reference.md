---
title: Reference Editor
slug: reference-editor
summary: Stato operativo compatto della UI React/CodeMirror.
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

## Avvio

Target prodotto: l'utente finale deve usare l'editor nel browser senza installare Node/npm o un'app desktop. I comandi sotto sono per sviluppo e QA locale.

```sh
npm install
npm run doctor
npm start
```

`npm start` apre `editor-next/` sul server locale. `npm run editor` resta disponibile per avviare solo il server editor. Se la porta `5173` e occupata, il server usa automaticamente la successiva.

## Architettura

- UI: `editor-next/` con React, Vite, CodeMirror 6.
- API locali: `scripts/serve-editor-next.js` e `scripts/editor-server/*`.
- Core condiviso: `packages/components`, `packages/documents`, `packages/markdown`.
- Rendering preview: `packages/documents/preview-shell.js` + `packages/components/preview.js` + `styles/main.css`.
- Test principale UI: `scripts/test-editor-next-ui.js`.

## Funzioni Disponibili

- Markdown sempre visibile, autosave locale, download Markdown.
- Documenti da `docs/`: apri, salva, salva copia, rename, delete.
- Dialog custom per reset, cambio documento, rename e delete.
- Frontmatter compatto, outline da heading Markdown e salto alla riga sorgente.
- Check guidato con diagnostiche schema e author check.
- Export HTML/PDF in `dist/`, con stato busy/error e log export nel tooltip.
- Modalita browser-only iniziale: se le API locali non esistono, documenti/check/export HTML usano storage e download del browser; export PDF scarica un HTML stampabile per `Salva come PDF`.
- Backup/import JSON dei documenti browser-only per migrazione e salvataggio esterno; i conflitti vengono rinominati invece di sovrascrivere.
- Status bar con conteggio documenti browser e dimensione storage per capire quando fare backup.
- Persistenza browser documenti su IndexedDB quando disponibile, con fallback e migrazione automatica da `localStorage`.
- Smoke UI verifica la migrazione dei documenti browser legacy da `localStorage` a IndexedDB.
- Lista documenti browser-only usa lo stesso formato del server: filename stabile e titolo da frontmatter/H1.
- `Importa` accetta archivi JSON e uno o piu file `.md`, salvandoli nello storage browser con rinomina conflitti.
- La topbar espone il toggle `Browser-only`; la status bar indica il runtime documenti: `Server locale` oppure `Browser-only`.
- Palette componenti schema-driven con ricerca, gruppi, preset, pack manifest e pack JSON esterni.
- Form componenti generati dallo schema, con liste, preset e validazione inline.
- Preview iframe con tema/carta da frontmatter, zoom, fit/fill, pagina corrente/totale, prev/next, single/facing/flow.
- Sync editor-preview: toggle `Sync`, scroll preview dalla linea cursore, click preview verso sorgente.
- Paginazione manuale: `::pagebreak`, bottone `Break`, overflow badge e revisione post-break.
- Paginazione assistita: `Auto break` predittivo e `Auto pages` misurato in preview, inoltrato anche a export HTML/PDF.

## Auto Pages

`Auto pages` ora partecipa all'export; resta da raffinare la resa PDF web-native e una persistenza cloud opzionale.

- Misura le `.page-shell` nell'iframe.
- Sposta blocchi interi su nuove pagine quando una pagina supera il box carta.
- Mostra `Auto Np (+M) · ok` quando risolve.
- Mostra `Auto Np (+M) · X overflow` quando restano residui.
- Il badge residuo e cliccabile e porta alla prima pagina/riga problematica.

## Mancanze Prioritarie

1. Estendere la modalita browser-only con persistenza backend/cloud opzionale.
2. Rendere l'export PDF web-native oltre al fallback print.
3. Rifinire deploy, onboarding e messaggi errore per utente finale non tecnico.

## Guardrail

Homebrewery resta solo benchmark UX. Non copiare sintassi `{{...}}`, stile PHB, font, asset, loghi o trade dress. Questo editor resta browser-first, schema-driven e Markdown-first.
