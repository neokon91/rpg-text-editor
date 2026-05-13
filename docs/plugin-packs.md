---
title: Creare Plugin Pack
slug: creare-plugin-pack
summary: Guida pratica per definire, provare e versionare nuovi pack componenti.
category: reference
tags: schema, plugin, componenti, editor
compatibility: 5e/5.5e
license_mode: srd-5.2-cc
author: Andrea
theme: clean-guild
paper: A4
public: false
---

# Creare Plugin Pack

<p class="subtitle">Un plugin pack aggiunge componenti Markdown alla palette editor senza cambiare il formato sorgente dei documenti.</p>

## Struttura minima

Un pack e un file JSON con metadati e una lista di componenti:

```json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "schema_version": "0.1.0",
  "id": "dungeon-tools",
  "name": "Dungeon Tools",
  "version": "0.1.0",
  "compatibility": "rpg-text-editor>=0.1.0",
  "description": "Componenti per dungeon crawl.",
  "components": [
    {
      "id": "room",
      "label": "Stanza",
      "group": "Mondo",
      "description": "Area esplorabile con ingressi, dettagli e segreti.",
      "container": "room",
      "default_label": "Stanza",
      "fields": [
        { "key": "name", "label": "Nome", "type": "text", "required": true, "default": "Sala delle Catene" },
        { "key": "mood", "label": "Atmosfera", "type": "textarea", "default": "Aria fredda e metallo umido." },
        { "key": "secret", "label": "Segreto", "type": "textarea", "default": "Una pietra mobile nasconde una chiave." }
      ],
      "lists": [
        { "key": "hook", "label": "Dettaglio", "default_name": "Suono", "default_text": "Un anello vibra quando qualcuno mente." }
      ]
    }
  ]
}
```

## Campi del pack

- `id`: identificatore stabile, minuscolo e senza spazi.
- `name`: nome leggibile mostrato nell'editor.
- `version`: versione del pack.
- `compatibility`: versione minima o intervallo supportato della suite.
- `description`: descrizione breve.
- `components`: array di componenti esportati.

Quando il pack diventa stabile, mettilo in `schemas/plugins/<pack-id>/pack.json`.

## Campi del componente

- `id`: identificatore logico del componente.
- `label`: nome mostrato nella palette.
- `group`: gruppo nella palette, per esempio `Regole`, `Mondo`, `Tavolo`, `Media`.
- `description`: testo breve sotto la card.
- `container`: nome usato nel Markdown breve.
- `default_label`: etichetta proposta nel blocco.
- `fields`: campi del form.
- `lists`: liste ripetibili opzionali.

`id` e `container` devono essere unici tra core e tutti i pack attivi. Se due pack dichiarano lo stesso valore, la validazione fallisce.

## Fields

Ogni field richiede:

- `key`: chiave scritta nel blocco Markdown.
- `label`: etichetta del form.
- `type`: `text`, `number` o `textarea`.

Campi opzionali:

- `required`: se `true`, la validazione segnala il campo mancante.
- `default`: valore iniziale nel form.

Il campo speciale `body` viene scritto come corpo libero del blocco:

```md
::: readaloud Da leggere al tavolo
Le torce proiettano ombre innaturali sulle colonne spezzate.
:::
```

Gli altri field vengono scritti come `key: valore`:

```md
::: room Stanza
name: Sala delle Catene
mood: Aria fredda e metallo umido.
:::
```

## Lists

Le liste generano righe ripetibili nel formato `key: nome | testo`:

```json
{
  "key": "hook",
  "label": "Dettaglio",
  "default_name": "Suono",
  "default_text": "Un anello vibra quando qualcuno mente."
}
```

Output:

```md
hook: Suono | Un anello vibra quando qualcuno mente.
```

La validazione segnala una lista malformata se manca il separatore `|`.

## Prova rapida nella UI

1. Avvia l'editor.

```sh
npm run editor
```

2. Nel pannello Componenti usa `Pack esterno` e seleziona il tuo `pack.json`.
3. Controlla che i componenti appaiano nella palette.
4. Inserisci un componente e verifica preview e diagnostiche.
5. Usa `Rimuovi esterni` per tornare ai soli pack versionati.

Il caricamento esterno e solo locale alla sessione editor: non modifica il manifest e non entra nella build.

## Versionare un pack

Quando il pack e pronto:

1. Copia il file in `schemas/plugins/<pack-id>/pack.json`.
2. Aggiungi una voce a `schemas/components.json`.

```json
{
  "id": "dungeon-tools",
  "name": "Dungeon Tools",
  "version": "0.1.0",
  "compatibility": "rpg-text-editor>=0.1.0",
  "enabled": true,
  "path": "/schemas/plugins/dungeon-tools/pack.json"
}
```

3. Valida componenti e collisioni.

```sh
npm run check:components
```

4. Rigenera reference e snippet.

```sh
npm run generate:schema-artifacts
npm run check:schema-artifacts
```

5. Esegui i test principali.

```sh
npm run test:rendering
npm run test:editor-ui
npm run check
```

## Regole pratiche

- Usa `container` brevi e leggibili: saranno scritti nei documenti.
- Non cambiare `id` o `container` dopo che un documento li usa.
- Dai default realistici: la palette deve produrre blocchi gia utili.
- Usa `required` solo per campi davvero necessari alla resa.
- Tieni i pack tematici piccoli: meglio pochi componenti coerenti che un registro generico.
