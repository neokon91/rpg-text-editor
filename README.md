# RPG Text Editor

Editor browser-first per scrivere contenuti TTRPG in Markdown ed esportarli in HTML/PDF con resa editoriale compatibile 5e/5.5e.

L'app ha una propria identita, ma l'output finale e pensato per risultare familiare a chi usa manuali fantasy 5e/5.5e: pagine A4, due colonne, titoli rossi, box descrittivi, tabelle e statblock. Non include loghi, marchi o illustrazioni ufficiali.

## Per chi scrive

Apri l'editor:

```sh
npm install
npm start
```

Poi usa il browser:

1. Scrivi o importa un documento Markdown.
2. Controlla la preview a destra.
3. Usa `Check` prima dell'export.
4. Usa `PDF` per scaricare il PDF; l'HTML stampabile resta disponibile come fallback.
5. Usa `Backup` se lavori in modalita browser-only.

Guida breve per utenti non tecnici: [docs/user-guide.md](docs/user-guide.md).

## Stato Prodotto

- UI principale: `editor-next/`.
- Sorgente principale: Markdown leggibile, non formato proprietario.
- Output primario: PDF A4 compatibile 5e/5.5e.
- Tema output consigliato: `fifth-edition-compatible`.
- Modalita locale: salva/apre documenti in `docs/` tramite server locale.
- Modalita browser-only: usa IndexedDB/download del browser quando non ci sono API locali.
- Export browser-only: genera PDF web-native dalla preview e un fallback `.print.html`.

Non e ancora una web app pubblica deployata per utenti finali: manca la verifica completa su deploy reale e browser reali.

## Comandi Essenziali

```sh
npm start                 # avvia editor locale
npm run doctor            # controlla prerequisiti
npm run check             # controlli progetto principali
npm run editor:next:build # build statica editor
npm run build:book:pdf    # genera libro/PDF da book.json
npm run qa:pdf            # crea anteprime PNG del PDF per controllo layout
```

Comandi utili durante authoring:

```sh
npm run new -- adventure "La Torre Sommersa"
npm run preview:expanded
npm run preview:watch
```

Comandi per package/pubblicazione:

```sh
npm run export:package
npm run export:package:pdf
npm run package:editor
```

## Dove Lavorare

- `docs/`: documenti Markdown.
- `templates/markdown/`: modelli per nuovi documenti.
- `book.json`: capitoli e metadati per libro unico.
- `styles/`: visual system dell'output PDF/HTML.
- `assets/manifest.json`: crediti/licenze di font, immagini e SVG.
- `content/`: blocchi riusabili inclusi con `<rpg-include>`.
- `editor-next/`: app React/CodeMirror.
- `packages/`: logica condivisa tra editor, preview ed export.
- `scripts/`: build, check, export e server locale.

## Moduli Chiave

- `packages/components`: schema componenti, renderer e validazione.
- `packages/documents`: frontmatter, preview shell, API client ed export browser.
- `packages/markdown`: outline e azioni Markdown/page break.
- `styles/core`: pagina, temi, tipografia e variabili.
- `styles/components`: box, statblock, tabelle, media e ornamenti.

Questa separazione evita che editor UI, rendering PDF e validazione Markdown si mescolino.

## Flusso Documento

Ogni documento puo iniziare con frontmatter:

```md
---
title: Il Santuario Sepolto
slug: santuario-sepolto
summary: Un'avventura introduttiva in una cripta montana.
category: avventure
tags: dungeon, livello-1, non-morti
compatibility: 5e/5.5e
license_mode: srd-5.2-cc
author: Andrea
theme: fifth-edition-compatible
paper: A4
public: true
---
```

Il tema `fifth-edition-compatible` e il preset raccomandato per output manuale fantasy 5e/5.5e. Gli altri temi restano disponibili per varianti editoriali:

- `classic-parchment`
- `dark-arcane`
- `clean-guild`
- `modern-5-5`
- `printer-friendly`

Con `license_mode: srd-5.2-cc`, la build aggiunge l'appendice di attribuzione per materiale compatibile SRD/Creative Commons.

## Componenti Editoriali

Per contenuti ricorrenti usa gli snippet o la palette componenti dell'editor:

- `Readaloud`: testo da leggere al tavolo.
- `Incontro`: scena o combattimento.
- `Tesoro`: ricompense.
- `Nota`: regola, avviso o dettaglio GM.
- `Statblock`: creature e PNG.
- `Tabella`: risultati casuali o riepiloghi.

Il renderer supporta sia blocchi HTML preview-safe sia blocchi `:::` schema-driven. Per lavoro quotidiano in editor e Markdown Preview, gli snippet HTML sono i piu prevedibili.

## Qualita Prima Dell'Export

Prima di considerare pronto un PDF:

```sh
npm run check
npm run qa:pdf
```

Controlla in particolare:

- nessun overflow pagina residuo;
- titoli e box non spezzati male;
- statblock e tabelle leggibili;
- immagini dichiarate in `assets/manifest.json`;
- appendice crediti presente quando serve.

## Reference

- [docs/user-guide.md](docs/user-guide.md): guida per utente non tecnico.
- [docs/editor-reference.md](docs/editor-reference.md): stato operativo dell'editor.
- [docs/checklist.md](docs/checklist.md): checklist prodotto.
- [docs/homebrewery-benchmark.md](docs/homebrewery-benchmark.md): benchmark UX/output stile Homebrewery/GM Binder.
- [docs/roadmap.md](docs/roadmap.md): direzione prodotto.
- [docs/plugin-packs.md](docs/plugin-packs.md): creare pack componenti.
- [docs/reference.md](docs/reference.md): kitchen sink componenti.

## Pronto Per Utente Finale?

Quasi, ma non ancora solo deploy.

Gia pronto:

- editor locale usabile;
- browser-only con IndexedDB, import/export e backup;
- PDF web-native con fallback stampa;
- output 5e/5.5e coerente tramite `fifth-edition-compatible`;
- controlli tecnici principali.

Da chiudere prima del rilascio pubblico:

- deploy web statico reale;
- smoke su Chrome/Brave/Safari/Firefox;
- controllo PDF su documenti lunghi;
- messaggi recovery/backup ancora piu guidati per utenti non tecnici.
