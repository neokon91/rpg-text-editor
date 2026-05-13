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

Il selettore workspace in alto offre tre viste persistenti:

- `Tutto`: componenti, Markdown e preview affiancati;
- `Scrivi`: Markdown e preview, con la palette nascosta per dare piu spazio alla stesura;
- `Componenti`: palette e Markdown, con preview nascosta per inserire blocchi rapidamente.

Anche nelle viste ridotte il pannello Markdown resta visibile.

## Documento

- `Nuovo` riparte dal template base e chiede conferma se ci sono modifiche non salvate.
- `Apri documento` importa file Markdown da `docs/`.
- `Salva` sovrascrive il file corrente, se esiste.
- `Salva nuovo` crea una copia con nome unico, evitando overwrite accidentali.
- `Rinomina` cambia nome al file Markdown corrente in `docs/`.
- `Elimina` rimuove il file Markdown corrente da `docs/` dopo conferma.
- `Scarica .md` esporta il Markdown corrente dal browser.
- `Copia Markdown` mette il sorgente negli appunti.
- `HTML` e `PDF` nel workflow autore eseguono prima i controlli guidati e poi generano output in `dist/` dalla bozza corrente.

L'editor mostra il file corrente, lo stato salvato e l'indicatore di modifiche non salvate.

Il pannello `Autosave` rende visibile la bozza locale salvata nel browser:

- quando non ci sono modifiche locali mostra che non c'e nulla da recuperare;
- quando il Markdown cambia indica origine e ultimo aggiornamento della bozza;
- `Scarta bozza` rimuove il recovery locale e ripristina il file salvato in `docs/`, se disponibile, o il template base.

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

Il `Navigatore` sotto gli snippet viene generato dagli heading Markdown `#`-`####`. Ogni voce mostra la riga sorgente e permette di saltare direttamente alla sezione nel textarea, mantenendo il Markdown come sorgente primaria.

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

Lo stile editoriale finale usa una pagina fantasy originale a due colonne su desktop/print, con font locali `Alegreya` e `Cinzel`, tabelle compatte e blocchi regole non spezzabili. La direzione e ispirata ai pattern tecnici di strumenti come Homebrewery, ma non importa font embedded, border image, stylesheet PHB o asset riconoscibili.

Il tema `modern-5-5` offre una variante 5.5-compatible piu moderna: carta piu chiara, griglia meno pergamena, accenti blu/verderame piu netti e card regole piu asciutte. Resta un tema originale del progetto, non una replica di manuali ufficiali.

I controlli preview includono:

- vista desktop/mobile;
- larghezza adatta, pagina, tablet o mobile;
- zoom persistente 75%-125%;
- navigazione tra pagine rilevate dai marker `::pagebreak`;
- sync opzionale tra scroll Markdown e preview.

La direzione UX e avvicinare l'esperienza a un editor visuale tipo Homebrewery, senza copiarne trade dress o asset: Markdown sempre visibile, preview live sempre utile, snippet componenti rapidi, controlli pagina e export nel flusso locale.

Comportamenti di composizione attesi:

- scrivere nel Markdown aggiorna la preview;
- scorrere il Markdown mantiene la preview orientata sulla sezione corrispondente quando `Sync` e attivo;
- cliccare un elemento renderizzato nella preview seleziona la riga sorgente nel Markdown;
- cliccare una voce del navigatore seleziona l'heading corrispondente nel Markdown;
- inserire `::pagebreak` mostra un marker visibile e aggiorna il contatore pagine;
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

## Export Guidato

Il workflow autore distingue due percorsi:

- `3 Esporta .md` scarica il sorgente Markdown dopo check guidato, bloccando solo gli errori;
- `HTML` e `PDF` inviano la bozza corrente al server editor, usano il renderer ufficiale `scripts/build.js` e mostrano link diretti agli output generati in `dist/`.

Questo permette di controllare e consegnare una bozza dall'editor locale senza passare da VS Code o da comandi CLI, mantenendo comunque Markdown come sorgente primaria.

## Limiti noti

- La preview e fedele agli stili finali, ma non sostituisce `npm run qa:pdf` per controllo pagina e sovrapposizioni.
- I componenti sono vicini a convenzioni 5e/5.5e, ma mantengono identita visuale originale.
