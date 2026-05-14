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

RPG Text Editor e un ambiente locale Markdown-first per contenuti TTRPG: editor CodeMirror, preview editoriale, componenti schema-driven, check guidati ed export HTML/PDF. Il sorgente resta Markdown leggibile e versionabile.

## Stato Attuale

- UI React/Vite/CodeMirror in `editor-next/`.
- API locali per documenti, check ed export in `scripts/editor-server/*`.
- Componenti core e plugin pack descritti da schema.
- Palette componenti con ricerca, gruppi, preset, pack manifest e pack JSON esterni.
- Preview iframe con sync editor-preview, toolbar pagine, `::pagebreak`, overflow badge, `Auto break` e `Auto pages`.
- Avvio utente semplificato: `npm start`; preflight: `npm run doctor`.
- Packaging locale: `npm run package:editor`; package pubblicazione libro: `npm run export:package`.
- QA aggregata: `npm run check`.

## Prossime Fasi

1. **Paginazione stabile**
   Portare la misurazione di `Auto pages` nel renderer/export HTML/PDF, mantenendo `::pagebreak` come override manuale.

2. **Distribuzione finale**
   Passare dallo ZIP applicativo locale a installer/app desktop o bundle equivalente per utenti non tecnici.

3. **Onboarding e recovery**
   Rifinire primo avvio, messaggi errore, recupero draft, esempi iniziali e indicazioni export.

4. **Hardening QA**
   Mantenere `npm run check` verde, ridurre flakiness UI e aggiungere casi su documenti lunghi, immagini e pagine multiple.

## Non Obiettivi

- Account/cloud/share pubblico finche non richiesti.
- Sintassi proprietaria nascosta al posto del Markdown.
- Copia di trade dress, font, asset o layout riconoscibili di Homebrewery/manuali ufficiali.
