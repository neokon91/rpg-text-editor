// Modelli pronti mostrati nell'onboarding. Sono self-contained (niente
// rpg-include) cosi funzionano anche in modalita browser-only, e usano solo
// la sintassi ::: per restare coerenti con la palette e i check.

const adventure = `---
title: La Torre Sommersa
slug: la-torre-sommersa
summary: Una one-shot in una torre allagata dalle maree arcane.
category: avventure
tags: one-shot, livello-2, acqua
compatibility: 5e/5.5e
license_mode: srd-5.2-cc
author: Autore
theme: fifth-edition-compatible
paper: A4
public: true
---

# La Torre Sommersa

::: subtitle
One-shot per personaggi di livello 2-3
:::

::: dropcap
La marea sale ogni notte oltre il normale, e ogni notte la vecchia torre del faro affonda un piano di piu. Qualcuno, la dentro, continua ad accendere la luce.
:::

::: readaloud Da leggere al tavolo
L'acqua nera lambisce i gradini coperti di alghe. In cima alla scala a chiocciola, una luce verde pulsa al ritmo di un respiro lento.
:::

## La sala allagata

Il primo piano e sommerso fino alla cintola. Le correnti spostano oggetti e nascondono il fondo.

| CD Percezione | Cosa si nota |
|---|---|
| 10 | Una scia di bolle regolari |
| 14 | Un baule incastrato sotto un arco |
| 17 | Due occhi che seguono il gruppo |

::: encounter Custode delle correnti
Se i personaggi disturbano il baule, qualcosa si stacca dal soffitto e scivola nell'acqua dietro di loro.
:::

## Avversario

::: monster Statblock
name: Larva di Marea
meta: Aberrazione piccola, senza allineamento
ac: 13
hp: 27
speed: 3 m, nuotare 12 m
cr: 1
str: 9
dex: 16
con: 13
int: 4
wis: 11
cha: 6
senses: scurovisione 18 m, Percezione passiva 10
languages: -
trait: Anfibia | Puo respirare aria e acqua.
action: Tentacolo | +5 a colpire, portata 1,5 m. Colpisce per 1d6 + 3 danni e trattiene il bersaglio.
:::

::: treasure Bottino
- Una lanterna che brucia sott'acqua
- 30 monete d'argento corrose
- Una mappa nautica con una rotta cancellata
:::

::: note Nota per il master
Se il gruppo e in difficolta, la marea si ritira di un piano e regala una scena di respiro.
:::
`;

const bestiary = `---
title: Creature delle Brughiere
slug: creature-delle-brughiere
summary: Due avversari pronti all'uso per avventure di bassa fascia.
category: bestiari
tags: mostri, livello-1, brughiera
compatibility: 5e/5.5e
license_mode: srd-5.2-cc
author: Autore
theme: fifth-edition-compatible
paper: A4
public: true
---

# Creature delle Brughiere

::: subtitle
Avversari pronti all'uso per le terre di confine
:::

::: monster Statblock
name: Mastino di Rovi
meta: Bestia media, senza allineamento
ac: 13
hp: 26
speed: 12 m
cr: 1
str: 15
dex: 14
con: 13
int: 3
wis: 12
cha: 7
senses: olfatto acuto, Percezione passiva 13
languages: -
trait: Olfatto acuto | Vantaggio alle prove di Saggezza (Percezione) basate sull'odorato.
action: Morso | +4 a colpire, portata 1,5 m. Colpisce per 1d8 + 2 danni perforanti.
:::

::: monster Statblock
name: Fuoco Fatuo del Pantano
meta: Folletto piccolo, caotico neutrale
ac: 19
hp: 22
speed: 0 m, volare 15 m (fluttuare)
cr: 2
str: 1
dex: 28
con: 10
int: 13
wis: 14
cha: 11
senses: scurovisione 36 m, Percezione passiva 12
languages: Comune, Silvano
trait: Incorporeo | Puo attraversare creature e oggetti come terreno difficile.
action: Scarica | +4 a colpire, gittata 9 m. Colpisce per 2d8 danni da fulmine.
:::
`;

const trove = `---
title: Reliquie e Formule
slug: reliquie-e-formule
summary: Oggetti magici e incantesimi pronti da inserire in qualsiasi tavolo.
category: oggetti
tags: oggetti-magici, incantesimi, tabelle
compatibility: 5e/5.5e
license_mode: srd-5.2-cc
author: Autore
theme: clean-guild
paper: A4
public: true
---

# Reliquie e Formule

::: subtitle
Tesori e magie pronti per il prossimo bottino
:::

::: magicitem Oggetto magico
name: Bussola senza Nord
type: Oggetto meraviglioso
rarity: raro
attunement: richiesta
La bussola non indica il nord, ma la cosa che chi la impugna teme di trovare.
:::

::: spell Incantesimo
name: Scheggia Astrale
level: 2° livello
school: invocazione
casting_time: 1 azione
range: 18 metri
components: V, S
duration: istantanea
Una scheggia luminosa colpisce una creatura visibile, che effettua un tiro salvezza su Destrezza o subisce 3d8 danni radiosi.
:::

::: random-table d6
name: Cosa custodisce davvero il forziere
row: 1 | Monete che pesano il doppio del normale.
row: 2 | Una lettera mai consegnata.
row: 3 | Un dente avvolto in seta rossa.
row: 4 | Una chiave senza serratura conosciuta.
row: 5 | Polvere che brilla solo al buio.
row: 6 | Lo stesso forziere, piu piccolo, dentro.
:::

::: quote Detto dei rigattieri
"Ogni oggetto magico e una promessa. Pochi leggono le clausole."
:::
`;

export const galleryTemplates = [
  {
    id: "adventure",
    title: "Avventura one-shot",
    blurb: "Incipit, scene, incontro, statblock e bottino: la struttura completa di una sessione.",
    markdown: adventure
  },
  {
    id: "bestiary",
    title: "Bestiario",
    blurb: "Due statblock pronti all'uso che mostrano la resa delle creature.",
    markdown: bestiary
  },
  {
    id: "trove",
    title: "Oggetti & incantesimi",
    blurb: "Oggetto magico, incantesimo, tabella casuale e citazione di lore.",
    markdown: trove
  }
];
