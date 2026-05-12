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
- Stato locale prima di questa roadmap: pulito e allineato a `origin/main`.
- Connettore GitHub Codex/GPT: installato sull'account `neokon91`, ma la repository deve essere inclusa nell'installazione GitHub App per essere visibile al connector.

## Direzione

RPG Text Editor deve diventare un ambiente di scrittura Markdown per contenuti TTRPG, con preview editoriale e componenti riusabili descritti da schema. Il formato sorgente resta Markdown leggibile e versionabile; la UI deve aiutare a produrre blocchi corretti senza nascondere il testo.

## Fase 1 - UI editor Markdown

- Creare una UI locale con editor Markdown, preview e palette componenti.
- Consentire inserimento guidato di blocchi `:::`.
- Mantenere il testo Markdown come sorgente primaria.
- Usare `localStorage` per bozze rapide, senza introdurre backend prematuro.
- Servire l'editor con uno script npm dedicato.

## Fase 2 - Sistema componenti a schema

- Descrivere componenti come dati in `schemas/components.json`.
- Modellare campi, liste ripetibili, valori di default e template di output.
- Generare palette e form dalla definizione schema.
- Evitare registry hardcoded in UI: nuovi componenti devono nascere aggiungendo o estendendo schema.
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

- Separare schema core da schema installabili.
- Introdurre manifest per plugin pack con nome, versione, compatibilita e componenti esportati.
- Validare collisioni di slug e classi CSS.
- Consentire pack tematici, per esempio fantasy classico, fantascienza, horror investigativo.

## Fase 4 - Validazione e import/export

- Validare blocchi Markdown contro lo schema.
- Segnalare campi mancanti, chiavi sconosciute e liste malformate.
- Esportare bozze in file Markdown dentro `docs/`.
- Importare documenti esistenti mantenendo frontmatter e contenuti non riconosciuti.

## Fase 5 - Integrazione build

- Rendere lo schema una fonte comune per UI, snippet e documentazione.
- Generare reference componenti e snippet VS Code a partire dallo schema.
- Aggiungere test di regressione per rendering componenti strutturati.
