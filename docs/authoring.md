---
title: Guida Authoring
slug: guida-authoring
summary: Flusso pratico per scrivere documenti TTRPG nella suite.
category: reference
tags: authoring, preview, workflow
compatibility: 5e/5.5e
license_mode: srd-5.2-cc
author: Andrea
theme: clean-guild
paper: A4
public: false
---

# Guida Authoring

::: subtitle
Scrivere, controllare e pubblicare contenuti senza uscire dal flusso Markdown.
:::

## Flusso consigliato

1. Crea un documento da modello (palette o `npm run new`).
2. Scrivi il testo in Markdown e inserisci i componenti dalla palette.
3. Controlla la preview impaginata a destra.
4. Premi `Check` prima dell'export.
5. Esporta in PDF o HTML.

```sh
npm run new -- adventure "La Torre Sommersa"
```

## Sintassi unica: i blocchi `:::`

Tutti i componenti — box, statblock, tabelle, mappe, sottotitoli — si scrivono con un solo schema: apri con `::: tipo`, scrivi il contenuto, chiudi con `:::`. La palette inserisce automaticamente la forma giusta, quindi di norma non serve ricordarla a memoria.

```md
::: readaloud Da leggere al tavolo
Le torce proiettano ombre innaturali sulle colonne spezzate.
:::
```

Box con solo testo (`readaloud`, `note`, `encounter`, `treasure`, `quote`) usano l'etichetta sulla riga di apertura e il corpo all'interno. I componenti con dati (`monster`, `spell`, `magicitem`, `npc`, `location`, `hazard`, `random-table`, `map`) usano righe `chiave: valore` e liste `chiave: Nome | Testo`.

```md
::: monster Creatura
name: Custode d'Ossa
meta: Costrutto medio, senza allineamento
ac: 15
hp: 38
cr: 1
str: 14
dex: 10
con: 16
trait: Corpo di Pietra | Vantaggio ai tiri salvezza contro veleno.
action: Pugno Inciso | +4 a colpire, 1d8 + 2 danni contundenti.
:::
```

### Prosa impaginata

```md
::: subtitle
Un'avventura per personaggi di livello 1-3
:::

::: dropcap
Quando la porta di pietra si apre, l'aria cambia.
:::
```

La pagina è già su due colonne: non serve avvolgere il testo in contenitori di colonna. Scrivi headings e paragrafi normali e il flusso si dispone da solo.

### Mappe e immagini

```md
::: map Mappa del Santuario Sepolto
src: ../assets/images/maps/santuario-sepolto-map.svg
alt: Mappa del Santuario Sepolto
:::
```

Ogni immagine locale deve essere dichiarata in `assets/manifest.json`. `npm run check:assets` segnala quelle mancanti.

## Include riusabili

Metti componenti ricorrenti in `content/` e includili nei documenti (utile per statblock condivisi tra più avventure):

```md
<rpg-include src="content/monsters/custode-ossa.html"></rpg-include>
```

## HTML grezzo (solo casi avanzati)

Il renderer lascia passare l'HTML inline, quindi per impaginazioni particolari puoi ancora scrivere tag a mano. Non è la via consigliata: l'HTML non viene validato dai check e non compare nella palette. Preferisci sempre i blocchi `:::`.

## Regola PDF-first

La preview serve a scrivere più velocemente, ma il formato primario della suite è il PDF A4. Dopo modifiche a componenti, immagini, tabelle o statblock controlla il PDF:

```sh
npm run build:book:pdf
npm run qa:pdf
```

Nel PDF nessun box dovrebbe sovrapporsi a testo, cornici, immagini o tabelle. Se un contenuto è lungo, dividilo in sottosezioni invece di forzarlo in una sola pagina.

## Guardrail visuali e licenza

Il progetto punta a output `5E compatible` con identità originale. Non usare loghi, marchi, impaginati o asset proprietari del publisher ufficiale. I criteri operativi sono in `docs/design-guardrails.md`.

## Prima di pubblicare

```sh
npm run check
npm run build:book:pdf
npm run qa:pdf
npm run export:package
```

Usa `npm run export:package:pdf` se vuoi rigenerare e includere anche il PDF.
