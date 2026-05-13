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
- Palette componenti generata da schema, con ricerca e gruppi.
- Inserimento componenti al cursore CodeMirror.
- Form guidati base generati da schema per campi e liste.
- Navigatore documento da heading Markdown con salto alla riga.
- Frontmatter visuale compatto per titolo, slug, summary, tema e carta.
- Tema editoriale originale, senza trade dress Homebrewery/PHB.
- Core modulare in `packages/`.

## Gap Prioritari

1. Raffinare form guidati: campi ripetibili removibili, preset per componenti complessi, validazione inline.
2. Sync editor-preview bidirezionale: scroll opzionale e click su preview verso riga sorgente.
3. Controlli pagina/spread piu completi: pagina precedente/successiva, fit/page/mobile, marker pagina affidabili.
4. Gestione plugin pack nella UI React: attiva/disattiva pack e prova pack esterni.
5. Comandi editor da tastiera e toolbar Markdown piu completa.
6. Test UI per open/save, component insertion, sync preview e export PDF.

## Non Obiettivi

- Copiare stylesheet, font, cornici, loghi o asset di Homebrewery o manuali ufficiali.
- Nascondere il Markdown dietro un formato proprietario.
- Trasformare l'editor in un gestionale documentale pesante.

## Definizione Di Pronto

L'editor puo dirsi Homebrewery-like quando un autore riesce a scrivere, inserire blocchi strutturati, navigare sezioni, vedere la resa impaginata, correggere diagnostiche ed esportare HTML/PDF senza uscire dalla UI React.
