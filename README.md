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
npm run check:legal
npm run check:assets
npm run check
npm run preview
```

- `npm run build` genera `dist/santuario-sepolto.html`.
- `npm run build:pdf` genera anche il PDF usando Brave/Chrome in modalità headless, se disponibile.
- `npm run build:book` genera `dist/book/santuario-sepolto-book.html` usando `book.json`.
- `npm run build:book:pdf` genera anche il PDF unico multi-capitolo da `book.json`.
- `npm run build:site` genera `dist/site/`, pronta per una repo GitHub Pages.
- `npm run check:legal` segnala termini rischiosi o marchi da trattare con cautela nei sorgenti Markdown.
- `npm run check:assets` valida il registro asset e verifica che i file dichiarati esistano.
- `npm run check` esegue i controlli legali/editoriali e il controllo asset.
- `npm run preview` serve la cartella `dist` su `http://127.0.0.1:8081`.

## Authoring in VS Code

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

Se usi Markdown Preview, `.vscode/settings.json` aggancia `styles/preview.css` alla preview. Per vedere i componenti renderizzati direttamente nella preview usa gli snippet HTML di `.vscode/rpg.code-snippets`; la vecchia sintassi `:::` resta supportata dal build finale, ma Markdown Preview la mostra come testo.

`docs/reference.md` è una pagina kitchen sink con tutti i componenti principali, utile per controllare temi e CSS.

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
- `styles/`: sistema tipografico e componenti.
- `assets/`: manifest per font, immagini e risorse con crediti/licenze.
- `templates/`: scheletro HTML.
- `scripts/`: build HTML/PDF e preview locale.
- `dist/`: output generati.
- `.vscode/`: impostazioni Markdown Preview e snippet workspace.

## Mini Checklist Migliorie

- [x] Generare un indice interno automatico per PDF lunghi.
- [x] Supportare build multi-capitolo in un PDF unico.
- [ ] Aggiungere un database locale riusabile per mostri, PNG, luoghi e oggetti.
- [ ] Creare un export `.zip` di pubblicazione con HTML, PDF, asset e crediti.
- [ ] Aggiungere controlli di bilanciamento per GS, danni medi, CD e ricompense.
- [ ] Aggiungere temi specializzati per hexcrawl, investigativo, grimdark e fiabesco.
- [ ] Aggiungere immagini di copertina e pagine capitolo con manifest asset obbligatorio.

## Obiettivo editoriale

La suite privilegia documenti A4 leggibili, box narrativi, blocchi statistiche, tabelle, colonne e colori adatti a homebrew fantasy. Il tema non copia layout proprietari: evoca un manuale fantasy classico mantenendo una base personalizzabile.
