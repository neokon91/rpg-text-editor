---
title: Roadmap Prodotto
slug: roadmap-prodotto
summary: Direzione sintetica della suite RPG Text Editor.
category: reference
tags: roadmap, editor, plugin, markdown
compatibility: 5e/5.5e
license_mode: srd-5.2-cc
author: Andrea
theme: clean-guild
paper: A4
public: false
---

# Roadmap Prodotto

## Direzione

RPG Text Editor deve essere una web app browser-first per contenuti TTRPG: editor CodeMirror, preview editoriale, componenti schema-driven, check guidati ed export HTML/PDF. L'utente finale non deve installare Node/npm o un'app desktop. Il sorgente resta Markdown leggibile e versionabile.

## Stato Attuale

- UI React/Vite/CodeMirror in `editor-next/`.
- API locali per documenti, check ed export in `scripts/editor-server/*`.
- Componenti core e plugin pack descritti da schema.
- Palette componenti con ricerca, gruppi, preset, pack manifest e pack JSON esterni.
- Preview iframe con sync editor-preview, toolbar pagine, `::pagebreak`, overflow badge, `Auto break` e `Auto pages`.
- Adapter browser-only iniziale per documenti, check client-side ed export HTML via download browser.
- Avvio sviluppo semplificato: `npm start`; preflight sviluppo: `npm run doctor`.
- Packaging locale disponibile per QA/dev: `npm run package:editor`; package pubblicazione libro: `npm run export:package`.
- QA aggregata: `npm run check`.

## Prossime Fasi

1. **Paginazione stabile**
   Portare la misurazione di `Auto pages` nel renderer/export HTML/PDF, mantenendo `::pagebreak` come override manuale.

2. **Web app finale**
   Rendere l'editor deployabile e usabile da browser senza installazione locale, completando persistenza web/browser ed export PDF web.

3. **Onboarding e recovery**
   Rifinire primo avvio, messaggi errore, recupero draft, esempi iniziali e indicazioni export.

4. **Hardening QA**
   Mantenere `npm run check` verde, ridurre flakiness UI e aggiungere casi su documenti lunghi, immagini e pagine multiple.

## Non Obiettivi

- Installer desktop come percorso principale per l'utente finale.
- Account/cloud/share pubblico finche non richiesti.
- Sintassi proprietaria nascosta al posto del Markdown.
- Copia di trade dress, font, asset o layout riconoscibili di Homebrewery/manuali ufficiali.
