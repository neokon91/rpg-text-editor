---
title: Reference Editor
slug: reference-editor
summary: Stato operativo della UI editor e dei flussi disponibili.
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

<p class="subtitle">Mappa operativa della UI locale e dei comportamenti gia implementati.</p>

## Avvio

```sh
npm run editor
```

L'editor locale si apre su `http://127.0.0.1:8082`. Il Markdown resta il sorgente primario: ogni controllo della UI modifica il testo visibile, non un formato proprietario.

## Documento

- `Nuovo` riparte dal template base e chiede conferma se ci sono modifiche non salvate.
- `Apri documento` importa file Markdown da `docs/`.
- `Salva` sovrascrive il file corrente, se esiste.
- `Salva nuovo` crea una copia con nome unico, evitando overwrite accidentali.
- `Scarica .md` esporta il Markdown corrente dal browser.
- `Copia Markdown` mette il sorgente negli appunti.

L'editor mostra il file corrente, lo stato salvato e l'indicatore di modifiche non salvate.

## Frontmatter

Il form metadati copre i campi principali:

- titolo;
- slug;
- summary;
- categoria;
- tag;
- autore;
- tema;
- formato carta;
- visibilita pubblica.

I campi tecnici `compatibility` e `license_mode` restano preservati o inseriti con default compatibili 5e/5.5e.

## Scrittura

La toolbar Markdown copre:

- heading H2;
- grassetto;
- corsivo;
- lista;
- readaloud;
- page break.

La palette componenti e generata da `schemas/components.json`, schema core e plugin pack abilitati.

## Plugin pack

Il pannello componenti mostra i pack dichiarati nel manifest. La selezione e locale in `localStorage`: disattivare un pack rimuove i componenti dalla palette editor e fa emergere diagnostiche sui blocchi gia presenti. Build, check e artefatti generati continuano a usare il manifest versionato.

## Preview

La preview usa un iframe con:

- `styles/main.css`;
- `page-shell`;
- tema da frontmatter;
- formato carta da frontmatter.

Questo mantiene la preview piu vicina all'output HTML/PDF finale senza applicare gli stili del documento alla UI dell'editor.

## Validazione

La validazione live segnala:

- componente sconosciuto;
- campo obbligatorio mancante;
- chiave non prevista;
- lista malformata.

La stessa famiglia di controlli e disponibile da CLI con:

```sh
npm run check
```

## Limiti noti

- La preview e fedele agli stili finali, ma non sostituisce `npm run qa:pdf` per controllo pagina e sovrapposizioni.
- Rename e delete dei documenti non sono ancora implementati.
- Le conferme usano dialoghi browser nativi.
- La toolbar e volutamente essenziale.
- I componenti sono vicini a convenzioni 5e/5.5e, ma mantengono identita visuale originale.
