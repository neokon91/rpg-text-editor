# RPG Text Editor

Suite editoriale leggera per scrivere homebrew fantasy in Markdown ed esportarli in HTML e PDF pronti per la stampa.

## Comandi

```sh
npm run build
npm run build:pdf
npm run build:all
npm run build:site
npm run check:legal
npm run preview
```

- `npm run build` genera `dist/santuario-sepolto.html`.
- `npm run build:pdf` genera anche il PDF usando Brave/Chrome in modalità headless, se disponibile.
- `npm run build:site` genera `dist/site/`, pronta per una repo GitHub Pages.
- `npm run check:legal` segnala termini rischiosi o marchi da trattare con cautela nei sorgenti Markdown.
- `npm run preview` serve la cartella `dist` su `http://127.0.0.1:8081`.

## Authoring in VS Code

La repo include snippet in `.vsc/rpg.code-snippets` per creare rapidamente frontmatter e blocchi TTRPG. I prefissi principali sono:

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

Se usi Markdown Preview, `.vscode/settings.json` aggancia `styles/preview.css` alla preview. La preview serve per scrivere comodo; la resa finale resta quella generata da `npm run build`.

`docs/reference.md` è una pagina kitchen sink con tutti i componenti principali, utile per controllare temi e CSS.

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

Componenti editoriali:

```md
::: readaloud Da leggere al tavolo
Testo descrittivo da leggere ai giocatori.
:::

::: encounter Incontro
Dettagli tattici o conseguenze.
:::

::: treasure Tesoro
- Monete
- Oggetti
:::

::: note Nota
Promemoria per il master o nota editoriale.
:::

::: quote Fonte
"Citazione in stile manuale."
:::

::: statblock Creatura
## Nome Creatura

*Tipo, allineamento*

**Azione.** Descrizione.
:::
```

Puoi continuare a usare HTML inline quando serve controllo tipografico preciso, per esempio `<p class="dropcap">`.

## Componenti TTRPG strutturati

Per avere layout coerenti senza scrivere HTML, usa blocchi strutturati:

```md
::: monster Creatura
name: Custode d'Ossa
meta: Non morto medio, neutrale malvagio
ac: 14
hp: 45
speed: 9 m
cr: 2
str: 16
dex: 12
con: 15
int: 6
wis: 10
cha: 8
senses: scurovisione 18 m, Percezione passiva 10
languages: comprende le lingue che conosceva in vita
trait: Resistenza Necrotica | Dimezza i danni necrotici ricevuti.
action: Lama Arrugginita | +5 a colpire, 1d8 + 3 danni taglienti.
reaction: Scatto d'Ossa | Si muove di 3 m senza provocare attacchi di opportunità.
:::

::: spell Formula rituale
name: Sigillo della Porta Muta
level: Trucchetto rituale
school: abiurazione
casting_time: 1 azione
range: contatto
components: V, S, M
duration: 1 ora
Descrizione dell'effetto.
:::

::: magicitem Reliquia
name: Anello del Voto Spezzato
type: Anello
rarity: non comune
attunement: richiesta
Descrizione dell'oggetto.
:::

::: npc PNG
name: Elira Voss
role: Cartografa inquieta
motive: vuole recuperare un sigillo antico
secret: conosce una seconda entrata
hook: Patto di sangue | Offre una mappa incompleta.
:::

::: location Luogo
name: Sala delle Candele Nere
tags: buio, silenzio, presagio
mood: l'aria è calda anche se la pietra è umida
danger: chi spegne una candela sente il proprio nome
treasure: una chiave nascosta sotto cera fusa
:::

::: hazard Trappola
name: Pavimento Cedevole
trigger: una creatura termina il turno sulla piattaforma
dc: Destrezza CD 13
effect: cade per 6 m e subisce 2d6 danni contundenti
countermeasure: Intelligenza CD 14 individua i cardini nascosti
:::

::: random-table Eventi nel santuario
die: d6
1 | Una torcia si spegne senza vento.
2 | Un frammento d'osso rotola fuori da una fessura.
:::
```

I blocchi liberi restano disponibili: `readaloud`, `encounter`, `treasure`, `note`, `quote` e `statblock`.

## Struttura

- `docs/`: sorgenti Markdown.
- `styles/`: sistema tipografico e componenti.
- `templates/`: scheletro HTML.
- `scripts/`: build HTML/PDF e preview locale.
- `dist/`: output generati.

## Obiettivo editoriale

La suite privilegia documenti A4 leggibili, box narrativi, blocchi statistiche, tabelle, colonne e colori adatti a homebrew fantasy. Il tema non copia layout proprietari: evoca un manuale fantasy classico mantenendo una base personalizzabile.
