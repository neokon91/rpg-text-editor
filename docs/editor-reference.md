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
- `Rinomina` cambia nome al file Markdown corrente in `docs/`.
- `Elimina` rimuove il file Markdown corrente da `docs/` dopo conferma.
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
- tabella Markdown;
- readaloud;
- callout nota;
- immagine;
- include riusabile;
- page break.

La barra `Snippet rapidi` offre inserimenti one-click per blocchi frequenti, ispirata al pattern a gruppi di Homebrewery ma basata sui componenti originali del progetto:

- struttura: scena e page break;
- tavolo: readaloud e nota;
- gioco: incontro, tesoro e tabella.

La palette componenti e generata da `schemas/components.json`, schema core e plugin pack abilitati.

## Plugin pack

Il pannello componenti mostra i pack dichiarati nel manifest. La selezione e locale in `localStorage`: disattivare un pack rimuove i componenti dalla palette editor e fa emergere diagnostiche sui blocchi gia presenti. Build, check e artefatti generati continuano a usare il manifest versionato.

Il pannello permette anche di caricare un `pack.json` esterno non versionato. Il pack resta attivo solo nella sessione editor corrente e puo essere rimosso con `Rimuovi esterni`; per renderlo parte della suite va dichiarato nel manifest schema.

## Preview

La preview usa un iframe con:

- `styles/main.css`;
- `page-shell`;
- tema da frontmatter;
- formato carta da frontmatter.

Questo mantiene la preview piu vicina all'output HTML/PDF finale senza applicare gli stili del documento alla UI dell'editor.

La direzione UX e avvicinare l'esperienza a un editor visuale tipo Homebrewery, senza copiarne trade dress o asset: Markdown sempre visibile, preview live sempre utile, snippet componenti rapidi, controlli pagina e export nel flusso locale.

Comportamenti di composizione attesi:

- scrivere nel Markdown aggiorna la preview;
- scorrere il Markdown mantiene la preview orientata sulla sezione corrispondente quando `Sync` e attivo;
- cliccare un elemento renderizzato nella preview seleziona la riga sorgente nel Markdown;
- i controlli preview mantengono espliciti vista, larghezza, tema e carta.

Benchmark Homebrewery da adattare senza copiarne trade dress:

- controlli preview persistenti per zoom/spread/sync;
- live scroll attivabile, non imposto;
- snippet organizzati per gruppi e accessibili in un solo click;
- page navigation e print/export come strumenti centrali del flusso.

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

Il pulsante `Check` dell'editor esegue anche controlli autore sulla bozza corrente: frontmatter, titolo H1, termini sensibili, include e CD fuori scala. Il risultato e legato al contenuto controllato; se il Markdown cambia, l'author check diventa da rifare.

## Limiti noti

- La preview e fedele agli stili finali, ma non sostituisce `npm run qa:pdf` per controllo pagina e sovrapposizioni.
- I componenti sono vicini a convenzioni 5e/5.5e, ma mantengono identita visuale originale.
