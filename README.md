# RPG Text Editor

Suite editoriale leggera per scrivere homebrew fantasy in Markdown ed esportarli in HTML e PDF pronti per la stampa.

## Comandi

```sh
npm run build
npm run build:pdf
npm run build:all
npm run build:book
npm run build:book:pdf
npm run build:site
npm run export:package
npm run export:package:pdf
npm run qa:pdf
npm run check:legal
npm run check:editorial
npm run check:assets
npm run check:includes
npm run check:components
npm run check:documents
npm run check:schema-artifacts
npm run check
npm run generate:schema-artifacts
npm run new -- adventure "La Torre Sommersa"
npm run preview
npm run preview:expanded
npm run preview:watch
npm run editor
```

- `npm run build` genera `dist/santuario-sepolto.html`.
- `npm run build:pdf` genera anche il PDF usando Brave/Chrome in modalità headless, se disponibile.
- `npm run build:book` genera `dist/book/santuario-sepolto-book.html` usando `book.json`.
- `npm run build:book:pdf` genera anche il PDF unico multi-capitolo da `book.json`.
- `npm run build:site` genera `dist/site/`, pronta per una repo GitHub Pages.
- `npm run export:package` crea uno ZIP di pubblicazione da `book.json` con HTML, asset, crediti e manifest verificabile.
- `npm run export:package:pdf` include anche il PDF nel package, se Brave/Chrome headless e disponibile.
- `npm run qa:pdf` genera il PDF, rasterizza tutte le pagine in PNG e crea `dist/qa/pdf/index.html` per controllare il layout.
- `npm run check:legal` segnala termini rischiosi o marchi da trattare con cautela nei sorgenti Markdown.
- `npm run check:editorial` controlla metadati, gerarchia titoli, CD, GS, danni medi e ricompense.
- `npm run check:assets` valida il registro asset e verifica che i file dichiarati esistano.
- `npm run check:includes` verifica che gli include riusabili puntino a file esistenti.
- `npm run check:components` valida manifest e plugin pack dei componenti.
- `npm run check:documents` valida i blocchi `:::` in `docs/` contro lo schema componenti.
- `npm run check:schema-artifacts` verifica che reference e snippet generati siano aggiornati.
- `npm run check` esegue controlli legali/editoriali, asset, include, componenti, documenti e artefatti schema.
- `npm run generate:schema-artifacts` rigenera `docs/reference.md` e `.vscode/rpg.schema.code-snippets` dallo schema componenti.
- `npm run new -- adventure "Titolo"` crea un nuovo documento da template. Tipi disponibili: `adventure`, `bestiary`, `item`, `reference`.
- `npm run preview` serve la cartella `dist` su `http://127.0.0.1:8081`.
- `npm run preview:expanded` rigenera `dist/site/` e serve una preview navigabile con `<rpg-include>` gia espansi.
- `npm run preview:watch` mantiene la preview espansa aggiornata mentre modifichi sorgenti, stili, template e asset.
- `npm run editor` avvia la nuova UI locale su `http://127.0.0.1:8082` con editor Markdown, preview e componenti guidati da schema.

## Authoring in VS Code

Per il flusso pratico completo vedi `docs/authoring.md`.

## Editor UI

La prima UI locale vive in `editor/` e si avvia con:

```sh
npm run editor
```

L'editor mantiene il Markdown come sorgente primaria, salva bozze in `localStorage` e inserisce blocchi `:::` compatibili con la build. La palette componenti non usa un registry JavaScript hardcoded: viene generata dal manifest `schemas/components.json`, che aggrega lo schema core in `schemas/core/components.json` e i plugin pack abilitati. Il pannello preview segnala in tempo reale componenti sconosciuti, campi obbligatori mancanti, chiavi non previste e liste malformate.

Dal server locale dell'editor puoi aprire documenti Markdown esistenti da `docs/` e salvare la bozza corrente direttamente come file `.md` in `docs/`. Il salvataggio usa lo `slug` del frontmatter, il primo H1 o un fallback normalizzato.

I plugin pack vivono in `schemas/plugins/<pack-id>/pack.json` e dichiarano nome, versione, compatibilita e componenti esportati. `npm run check:components` valida campi obbligatori e collisioni di `id`/`container`.

`npm run generate:schema-artifacts` usa lo stesso manifest per rigenerare la reference componenti e gli snippet rapidi in `.vscode/rpg.schema.code-snippets`. `npm run check:schema-artifacts` fallisce se questi file non sono allineati allo schema.

La direzione prodotto e tracciata in `docs/roadmap.md`.

La repo include snippet in `.vscode/rpg.code-snippets` per creare rapidamente frontmatter e blocchi TTRPG. I prefissi principali sono:

- `frontttrpg`
- `monster`
- `spell`
- `magicitem`
- `npc`
- `location`
- `hazard`
- `randomtable`
- `readaloud`
- `encounter`
- `treasure`
- `note`
- `quote`
- `map`
- `image`
- `include`
- `qreadaloud`
- `qencounter`
- `qtreasure`
- `qnote`
- `qmap`
- `qimage`

Se usi Markdown Preview, `.vscode/settings.json` aggancia `styles/preview.css` alla preview. Per vedere i componenti renderizzati direttamente nella preview usa gli snippet HTML di `.vscode/rpg.code-snippets`; la vecchia sintassi `:::` resta supportata dal build finale, ma Markdown Preview la mostra come testo.

`docs/reference.md` è una pagina kitchen sink con tutti i componenti principali, utile per controllare temi e CSS.

## Nuovi Documenti

Usa il generatore per partire da file già coerenti con Markdown Preview e build finale:

```sh
npm run new -- adventure "La Torre Sommersa"
npm run new -- bestiary "Bestiario delle Rovine"
npm run new -- item "Reliquie Minori"
npm run new -- reference "Appunti Campagna"
```

I template vivono in `templates/markdown/`. Puoi modificarli per adattarli al tuo stile personale.

## Libreria Riusabile

I componenti ricorrenti possono vivere in `content/` ed essere richiamati dai documenti:

```html
<rpg-include src="content/monsters/custode-ossa.html"></rpg-include>
```

Il build espande gli include in HTML/PDF/sito. Markdown Preview mostra il tag non espanso, quindi usa `docs/reference.md` o `npm run build` per controllare la resa finale quando lavori con contenuti inclusi. `npm run check:includes` segnala percorsi mancanti o non consentiti.

## Asset e crediti

Ogni asset usato stabilmente dalla suite dovrebbe essere dichiarato in `assets/manifest.json`:

```json
{
  "path": "fonts/Cinzel-Regular.ttf",
  "title": "Cinzel Regular",
  "author": "Natanael Gama",
  "license": "OFL-1.1",
  "source": "Bundled local font file",
  "usage": "Headings"
}
```

La build include questi crediti nella sezione finale “Legal & Attribution”. Prima di pubblicare, usa `npm run check`.

## Mappe e immagini

Usa componenti HTML preview-safe con file dichiarati in `assets/manifest.json`:

```html
<figure class="rpg-map no-break">
  <img src="../assets/images/maps/santuario-sepolto-map.svg" alt="Mappa del Santuario Sepolto">
  <figcaption>Mappa del Santuario Sepolto</figcaption>
</figure>

<figure class="rpg-image no-break">
  <img src="../assets/images/handouts/sigillo-antico.webp" alt="Handout del Sigillo Antico">
  <figcaption>Handout per i giocatori</figcaption>
</figure>
```

`npm run check:assets` verifica che ogni `<img src="...">` locale in `docs/` e `content/` sia presente nel manifest. La build copia gli asset dichiarati dentro `dist/` e `dist/site/`, così preview, sito, libro ed export ZIP restano portabili.

## Visual System

Il layer decorativo vive in `styles/components/ornaments.css` e usa SVG sorgenti in `assets/svg/`:

- `assets/svg/dividers/`: separatori editoriali.
- `assets/svg/corners/`: ornamenti di cornice pagina.
- `assets/svg/icons/`: icone per etichette di componenti.
- `assets/svg/seals/`: sigilli per copertina o colophon.

Gli SVG sono tracciati in `assets/manifest.json`. Il CSS usa data URI derivate dagli SVG per mantenere portabili gli HTML generati in `dist/`, `dist/book/` e `dist/site/`.

## Libri Multi-Capitolo

Per generare un volume unico, modifica `book.json`:

```json
{
  "title": "Il Santuario Sepolto",
  "slug": "santuario-sepolto-book",
  "summary": "Volume TTRPG compatibile 5e/5.5e.",
  "author": "Andrea",
  "compatibility": "5e/5.5e",
  "license_mode": "srd-5.2-cc",
  "theme": "classic-parchment",
  "paper": "A4",
  "chapters": [
    { "path": "docs/esempio.md" }
  ]
}
```

`npm run build:book` crea copertina, indice automatico da `#`/`##`, capitoli concatenati e appendice legale finale. Aggiungi altri file Markdown a `chapters` quando il progetto cresce.

## Package Export

`npm run export:package` genera `dist/packages/<slug>-v<version>.zip` partendo da `book.json`.

Il package contiene:

- `book/<slug>.html`: output pubblicabile con CSS inline.
- `assets/` e `fonts/`: file dichiarati in `assets/manifest.json`, copiati mantenendo i percorsi originali.
- `credits.md`: riepilogo leggibile di compatibilità, attribuzione e asset.
- `package-manifest.json`: schema, metadati libro, capitoli, output, asset, dimensioni e checksum SHA-256.

Lo script esegue la build del libro prima di comprimere e valida lo ZIP con `unzip -t`. Usa `npm run export:package:pdf` quando vuoi forzare anche la generazione e inclusione del PDF.

## Editorial Checks

`npm run check:editorial` aggiunge controlli leggeri da revisione TTRPG:

- frontmatter minimo per i documenti in `docs/`;
- presenza di un titolo H1 e gerarchia titoli senza salti;
- CD fuori scala o molto alte;
- confronto indicativo tra GS, CD e danno medio massimo delle formule tipo `2d6 + 3`;
- ricompense PE/PX/XP molto elevate.

I problemi strutturali sono errori e bloccano `npm run check`. Le valutazioni di bilanciamento sono avvisi, perché dipendono da contesto, numero di personaggi, azioni disponibili e obiettivi di design.

## Preview Expanded

`npm run preview:expanded` esegue una build HTML del sito e poi avvia il server locale. La home punta a `dist/site/index.html`, quindi puoi controllare i documenti con include gia espansi senza generare PDF.

`npm run preview:watch` usa la stessa preview, ma ricostruisce automaticamente quando salvi file in `docs/`, `content/`, `styles/`, `templates/`, `assets/` o `book.json`. Dopo il rebuild aggiorna il browser.

La preview resta uno strumento di lavoro: il target primario e il PDF A4. Prima di chiudere una modifica di layout, componenti o CSS usa `npm run build:book:pdf` e controlla che box, tabelle, immagini, cornici e titoli non si sovrappongano.

Per un controllo piu rapido dell'intero PDF usa `npm run qa:pdf`: produce una PNG per pagina e una contact sheet HTML in `dist/qa/pdf/index.html`.

Percorsi utili:

- `http://127.0.0.1:8081/`: indice dei documenti pubblici.
- `http://127.0.0.1:8081/site/santuario-sepolto/`: avventura renderizzata con contenuti da `content/`.
- `http://127.0.0.1:8081/site/reference-componenti/`: reference componenti, anche se non pubblica nell'indice.

## Scrivere un documento

Ogni file Markdown in `docs/` può iniziare con metadati:

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
theme: classic-parchment
paper: A4
public: true
---
```

Con `license_mode: srd-5.2-cc`, la build aggiunge una sezione finale di attribuzione per materiale compatibile 5e/5.5e basato su SRD in Creative Commons.

Temi disponibili:

- `classic-parchment`: fantasy classico su carta calda.
- `dark-arcane`: tono cupo, rituale e sotterraneo.
- `clean-guild`: supplemento moderno, leggibile e ordinato.
- `printer-friendly`: alto contrasto, poco inchiostro.

Componenti editoriali preview-safe:

```md
<aside class="readaloud no-break">
  <div class="readaloud__label">Da leggere al tavolo</div>
  <p>Testo descrittivo da leggere ai giocatori.</p>
</aside>

<aside class="encounter no-break">
  <div class="encounter__label">Incontro</div>
  <p>Dettagli tattici o conseguenze.</p>
</aside>

<aside class="treasure no-break">
  <div class="treasure__label">Tesoro</div>
  <ul>
    <li>Monete</li>
    <li>Oggetti</li>
  </ul>
</aside>

<aside class="quote no-break">
  <div class="quote__label">Fonte</div>
  <p>"Citazione in stile manuale."</p>
</aside>
```

Puoi continuare a usare HTML inline quando serve controllo tipografico preciso, per esempio `<p class="dropcap">`.

## Componenti TTRPG strutturati

Per avere layout coerenti e visibili nella Markdown Preview, usa gli snippet HTML. Esempio:

```md
<aside class="spell rules-card no-break">
  <div class="spell__label rules-card__label">Formula rituale</div>
  <h3>Sigillo della Porta Muta</h3>
  <p><em>Trucchetto rituale, abiurazione</em></p>
  <p class="rules-line"><strong>Tempo di lancio.</strong> 1 azione</p>
  <p class="rules-line"><strong>Gittata.</strong> contatto</p>
  <p class="rules-line"><strong>Componenti.</strong> V, S, M</p>
  <p class="rules-line"><strong>Durata.</strong> 1 ora</p>
  <p>Descrizione dell'effetto.</p>
</aside>
```

Il renderer conserva il supporto ai blocchi `:::` per file vecchi o bozze rapide, ma per il lavoro quotidiano con Markdown Preview conviene usare gli snippet HTML.

## Struttura

- `docs/`: sorgenti Markdown.
- `book.json`: manifest per PDF/HTML multi-capitolo.
- `content/`: componenti riusabili richiamabili con `<rpg-include>`.
- `styles/`: sistema tipografico e componenti.
- `assets/`: manifest per font, immagini e risorse con crediti/licenze.
- `assets/svg/`: sorgenti ornamentali del visual system.
- `templates/`: scheletro HTML.
- `templates/markdown/`: template sorgente per nuovi documenti.
- `scripts/`: build HTML/PDF e preview locale.
- `dist/`: output generati.
- `.vscode/`: impostazioni Markdown Preview e snippet workspace.

## Mini Checklist Migliorie

- [x] Generare un indice interno automatico per PDF lunghi.
- [x] Supportare build multi-capitolo in un PDF unico.
- [x] Aggiungere template per nuovi documenti.
- [x] Aggiungere un database locale riusabile per mostri, PNG, luoghi e oggetti.
- [x] Aggiungere un visual system SVG coerente per cornici, icone, separatori e cover.
- [x] Creare un export `.zip` di pubblicazione con HTML, PDF, asset e crediti.
- [x] Aggiungere controlli di bilanciamento per GS, danni medi, CD e ricompense.
- [ ] Aggiungere temi specializzati per hexcrawl, investigativo, grimdark e fiabesco.
- [x] Aggiungere componenti immagine/mappe/handout con manifest asset obbligatorio.
- [x] Aggiungere preview espansa per `<rpg-include>` senza passare dal PDF.

## Obiettivo editoriale

La suite privilegia documenti A4 leggibili, box narrativi, blocchi statistiche, tabelle, colonne e colori adatti a homebrew fantasy. Il tema non copia layout proprietari: evoca un manuale fantasy classico mantenendo una base personalizzabile.
