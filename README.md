# RPG Text Editor

Editor locale/browser-first per scrivere contenuti TTRPG in Markdown e ottenere output HTML/PDF con resa editoriale fantasy compatibile 5e/5.5e.

L'output usa pagine A4, colonne, box, tabelle e statblock. Non include loghi, marchi o illustrazioni ufficiali.

## Avvio Rapido

```sh
npm install
npm start
```

Apri l'URL mostrato dal terminale, di solito:

```txt
http://127.0.0.1:5173/editor-next/
```

Flusso consigliato:

1. Scrivi o importa un documento Markdown.
2. Controlla la preview a destra.
3. Premi `Check`.
4. Esporta con `PDF` o `HTML`.
5. Usa `Backup` se lavori in modalita browser-only.

Guida non tecnica: [docs/user-guide.md](docs/user-guide.md).

## Funzioni Principali

- Editor Markdown con preview impaginata.
- Salvataggio locale in `docs/` quando il server e attivo.
- Modalita browser-only con IndexedDB, import/export e backup.
- Export HTML/PDF, con fallback `.print.html` per la stampa.
- Palette componenti per readaloud, incontri, note, statblock, tabelle e media.
- Check automatici su frontmatter, struttura, licenze e contenuti sensibili.

## Comandi Utili

```sh
npm start                 # avvia editor locale
npm run doctor            # controlla prerequisiti
npm run check             # esegue tutti i controlli principali
npm run editor:next:build # build dell'app editor
npm run deploy:check      # gate consigliato prima di deploy
npm run build:book:pdf    # genera PDF da book.json
npm run qa:pdf            # crea anteprime PNG del PDF
```

Per creare un nuovo documento:

```sh
npm run new -- adventure "La Torre Sommersa"
```

## Dove Sono Le Cose

- `editor-next/`: app React/CodeMirror.
- `docs/`: documenti Markdown.
- `content/`: blocchi riusabili con `<rpg-include>`.
- `templates/markdown/`: modelli iniziali.
- `styles/`: CSS dell'output HTML/PDF.
- `packages/`: logica condivisa per componenti, documenti e Markdown.
- `scripts/`: build, check, export e server locale.
- `assets/manifest.json`: asset, crediti e licenze.
- `book.json`: configurazione per libro unico.

## Frontmatter Minimo

Ogni documento dovrebbe iniziare cosi:

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

Tema consigliato: `fifth-edition-compatible`.

Con `license_mode: srd-5.2-cc`, la build aggiunge l'appendice di attribuzione richiesta.

## Prima Di Esportare

Esegui:

```sh
npm run check
```

Poi controlla in preview:

- nessun overflow pagina;
- titoli, box e tabelle leggibili;
- statblock non spezzati male;
- immagini presenti nel manifest asset;
- crediti/licenze corretti.

## Stato Prodotto

Gia utilizzabile:

- editor locale;
- browser-only con backup;
- PDF web-native e fallback stampabile;
- output coerente 5e/5.5e;
- check tecnici principali.

Da chiudere prima di un rilascio per utenti finali non tecnici:

- deploy pubblico stabile;
- test manuali su Chrome, Safari, Firefox e Brave;
- onboarding piu guidato dentro l'app;
- messaggi di errore piu semplici;
- pacchetto/installazione senza terminale;
- esempi pronti e template piu visibili.

## Licenza

Il progetto e rilasciato sotto `GPL-3.0-or-later`. Vedi [LICENSE](LICENSE) e [NOTICE.md](NOTICE.md).

I font inclusi restano sotto `OFL-1.1`; le dipendenze npm mantengono le proprie licenze. I documenti creati dagli utenti restano di proprieta dei rispettivi autori.

## Documentazione

- [docs/user-guide.md](docs/user-guide.md): guida per utenti non tecnici.
- [docs/deploy.md](docs/deploy.md): deploy web.
- [docs/editor-reference.md](docs/editor-reference.md): riferimento editor.
- [docs/checklist.md](docs/checklist.md): checklist prodotto.
- [docs/plugin-packs.md](docs/plugin-packs.md): pack componenti.
- [docs/reference.md](docs/reference.md): esempi completi di componenti.
