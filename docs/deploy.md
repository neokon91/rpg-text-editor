---
title: Deploy Web
slug: deploy-web
summary: Preparazione della web app per una pubblicazione finale browser-first.
category: reference
tags: deploy, web, qa, browser
compatibility: 5e/5.5e
license_mode: srd-5.2-cc
author: Andrea
theme: clean-guild
paper: A4
public: false
---

# Deploy Web

Questa app deve arrivare all'utente finale come pagina web: niente Node/npm, niente terminale, niente setup locale.

## Build

```sh
npm run deploy:build
```

Output:

```text
dist/web/
```

Il deploy deve servire `dist/web/` come sito statico. La build usa asset relativi, quindi puo funzionare sia alla root di un dominio sia sotto una sottocartella.

Per controllare localmente l'output deploy:

```sh
npm run deploy:preview
```

La versione locale con API (`npm start` / `npm run editor`) resta uno strumento di sviluppo.

## Check Deploy-Safe

```sh
npm run deploy:check
```

Questo comando usa solo controlli stabili per preparare una build candidata:

- controlli legali/editoriali;
- asset, include, componenti e documenti;
- artefatti schema;
- test rendering e moduli;
- build statica editor;
- verifica package locale.

`npm run test:editor-next-ui` resta utile, ma non e ancora un gate deploy-safe: lo smoke headless completo e stato intermittente sul segmento drag&drop/CDP. Va stabilizzato o spezzato prima di renderlo obbligatorio per release.

## Requisiti Per Release Pubblica

Prima di dire "pronto per utente finale":

- deploy statico accessibile da URL reale;
- smoke manuale su Chrome, Brave, Safari e Firefox;
- import `.md` e backup JSON verificati in browser-only;
- export PDF verificato su almeno un documento breve e uno lungo;
- fallback `.print.html` verificato;
- comportamento IndexedDB verificato dopo refresh e riapertura tab;
- messaggio chiaro se storage o download non sono disponibili.

## Boundary SRD

L'integrazione con `srd-reference` non e parte del deploy base.

Per tenerla pulita in futuro:

- non accoppiare il renderer PDF a un database SRD;
- importare contenuti SRD come pack/schema o sorgenti Markdown separati;
- mantenere `packages/components` come confine per nuovi blocchi strutturati;
- mantenere attribuzioni e licenze in `assets/manifest.json` o metadati documento.

Il prodotto deployabile deve funzionare anche senza SRD-reference.

## Cosa Non Portare Nel Deploy

- `dist/` generato da run locali precedenti;
- `.tmp/`;
- `node_modules/`;
- documenti di test non voluti come contenuto pubblico;
- credenziali, token o configurazioni private.

## Smoke Manuale Minimo

1. Apri l'app da URL reale.
2. Scrivi una riga nel documento starter.
3. Premi `Check`.
4. Premi `PDF`.
5. Scarica `MD`.
6. Premi `Backup`.
7. Ricarica la pagina e verifica che la bozza sia ancora presente.
8. Importa il backup in un profilo/browser pulito.

Se questi passaggi funzionano, la base browser-first e pronta per test utenti.
