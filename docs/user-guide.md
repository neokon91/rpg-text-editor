---
title: Guida Utente
slug: guida-utente
summary: Guida breve per usare RPG Text Editor senza conoscere il codice.
category: reference
tags: guida, utente, editor, pdf
compatibility: 5e/5.5e
license_mode: srd-5.2-cc
author: Andrea
theme: clean-guild
paper: A4
public: false
---

# Guida Utente

Questa guida spiega il flusso normale per chi vuole solo scrivere un documento e ottenere un PDF.

## Aprire l'App

Se stai usando la versione locale:

```sh
npm start
```

Si apre il browser con l'editor. Se un giorno l'app viene deployata online, questo passaggio non servira piu.

## Scrivere

- Il testo si scrive nel pannello centrale.
- La preview a destra mostra il risultato impaginato.
- Il pannello `Documento` contiene titolo, slug, summary, tema e carta.
- Il tema consigliato per PDF stile manuale 5e/5.5e e `fifth-edition-compatible`.

## Importare Documenti

Usa `Importa` per caricare:

- file Markdown `.md`;
- backup JSON creati dall'app.

Se esiste gia un documento con lo stesso nome, l'app rinomina il nuovo file invece di sovrascrivere in silenzio.

## Salvare

- `Salva`: aggiorna il documento corrente.
- `Salva copia`: crea una nuova copia.
- `MD`: scarica il Markdown corrente.
- `Backup`: scarica tutti i documenti salvati nel browser.

In modalita browser-only i documenti vivono nel browser. Fai backup prima di cambiare computer, browser o profilo.

## Controllare

Prima del PDF usa `Check`.

Il controllo segnala:

- frontmatter mancante;
- componenti compilati male;
- include o asset mancanti;
- possibili problemi editoriali.

Se la preview mostra `Overflow`, usa `Break`, `Auto break` o `Auto pages` per sistemare la paginazione.

## Esportare PDF

Usa `PDF`.

L'app genera:

- un file `.pdf`;
- un file `.print.html` come fallback stampabile.

Il PDF usa la preview renderizzata, quindi il risultato deve corrispondere alla pagina che vedi nell'editor.

## Ripristinare

Per ripristinare documenti:

1. Premi `Importa`.
2. Seleziona il backup JSON.
3. Apri il documento dal menu `File`.

I conflitti vengono rinominati automaticamente.

## Quando Chiedere Supporto Tecnico

Serve supporto se:

- il PDF non viene scaricato;
- la preview resta bianca;
- il browser segnala storage pieno;
- un documento lungo resta con overflow non risolvibile;
- `Check` mostra errori che non capisci.

In questi casi conserva il Markdown e, se possibile, scarica un backup JSON.
