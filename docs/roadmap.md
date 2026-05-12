---
title: Roadmap Prodotto
slug: roadmap-prodotto
summary: Direzione evolutiva della suite editoriale RPG Text Editor.
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

## Stato repository

- Repository GitHub: `neokon91/rpg-text-editor`.
- Visibilita GitHub: privata.
- Branch corrente: `main`.
- Stato locale all'ultimo aggiornamento: pulito e allineato a `origin/main`.
- Connettore GitHub Codex/GPT: installato sull'account `neokon91` e repository visibile al connector.

## Direzione

RPG Text Editor deve diventare un ambiente di scrittura Markdown per contenuti TTRPG, con preview editoriale e componenti riusabili descritti da schema. Il formato sorgente resta Markdown leggibile e versionabile; la UI deve aiutare a produrre blocchi corretti senza nascondere il testo.

## Fase 1 - UI editor Markdown

- Fatto: UI locale con editor Markdown, preview e palette componenti.
- Fatto: inserimento guidato di blocchi `:::`.
- Fatto: form frontmatter e toolbar Markdown rapida.
- Fatto: Markdown come sorgente primaria.
- Fatto: salvataggio bozze in `localStorage`, senza backend.
- Fatto: stato documento, dirty indicator, overwrite esplicito e salva come nuovo.
- Fatto: script `npm run editor`.

## Fase 2 - Sistema componenti a schema

- Fatto: descrivere componenti come dati.
- Fatto: modellare campi, liste ripetibili e valori di default.
- Fatto: generare palette e form dalla definizione schema.
- Fatto: evitare registry hardcoded in UI per i componenti disponibili.
- Allineare progressivamente schema UI e renderer Node.

Componenti prioritari:

- `monster`
- `spell`
- `magicitem`
- `npc`
- `location`
- `hazard`
- `random-table`
- `readaloud`
- `encounter`
- `treasure`
- `note`
- `map`
- `image`

## Fase 3 - Plugin pack

- Fatto: separare schema core da schema installabili.
- Fatto: introdurre manifest per plugin pack con nome, versione, compatibilita e componenti esportati.
- Fatto: validare collisioni di `id` e `container`.
- Fatto: aggiungere pack tematico `fantasy-classic`.
- Fatto: decidere strategia di caricamento pack da UI, con scelta locale in `localStorage` e manifest versionato per build/check.

## Fase 4 - Validazione e import/export

- Fatto: validare blocchi Markdown contro lo schema.
- Fatto: segnalare campi mancanti, chiavi sconosciute e liste malformate.
- Fatto: esportare bozze in file Markdown dentro `docs/` dal server editor locale.
- Fatto: importare documenti esistenti mantenendo frontmatter e contenuti non riconosciuti.
- Prossimo: aggiungere test fixture per diagnostica e copertura di casi limite.

## Fase 5 - Integrazione build

- Fatto: rendere lo schema una fonte comune per UI, snippet e documentazione.
- Fatto: generare reference componenti e snippet VS Code a partire dallo schema.
- Fatto: aggiungere test di regressione per rendering componenti strutturati.
