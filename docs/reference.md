---
title: Reference Componenti TTRPG
slug: reference-componenti
summary: Pagina generata dallo schema componenti per verificare temi, plugin pack e resa Markdown.
category: reference
tags: componenti, preview, autore, schema
compatibility: 5e/5.5e
license_mode: srd-5.2-cc
author: Andrea
theme: clean-guild
paper: A4
public: false
---

# Reference Componenti TTRPG

<p class="subtitle">Pagina generata da <code>schemas/components.json</code> e dai plugin pack abilitati.</p>

<p class="dropcap">Questa reference e rigenerabile con <code>npm run generate:schema-artifacts</code>. Ogni blocco sotto usa la sintassi breve <code>:::</code>, cosi lo stesso schema alimenta editor, snippet e documentazione.</p>

## Regole
### Creatura

<p class="muted"><strong>Core.</strong> Statblock completo per mostri e PNG ostili.</p>

::: monster Creatura
name: Guardiano della Soglia
meta: Costrutto medio, senza allineamento
ac: 15
hp: 38
speed: 9 m
cr: 1
str: 14
dex: 10
con: 16
int: 5
wis: 12
cha: 6
senses: scurovisione 18 m, Percezione passiva 11
languages: comprende una lingua scelta dal creatore
initiative: 
prof_saves: 

trait: Corpo di Pietra | Ha vantaggio ai tiri salvezza contro veleno e malattia.
action: Pugno Inciso | +4 a colpire, portata 1,5 m, un bersaglio. Colpisce per 1d8 + 2 danni contundenti.
:::
### Incantesimo

<p class="muted"><strong>Core.</strong> Scheda breve per incantesimi, rituali e formule.</p>

::: spell Formula rituale
name: Luce del Cartografo
level: 1° livello
school: divinazione
casting_time: 1 azione
range: personale
components: V, S, M
duration: 10 minuti
Una linea luminosa indica il percorso piu breve verso una destinazione nominata entro 300 metri.
:::
### Oggetto

<p class="muted"><strong>Core.</strong> Oggetto magico o reliquia con rarita e sintonia.</p>

::: magicitem Oggetto magico
name: Bussola senza Nord
type: Oggetto meraviglioso
rarity: raro
attunement: richiesta
La bussola indica la cosa che chi la impugna teme di trovare.
:::
### Pericolo

<p class="muted"><strong>Core.</strong> Trappola, pericolo ambientale o complicazione meccanica.</p>

::: hazard Pericolo
name: Nebbia di Vetro
trigger: una creatura corre o cade nella sala
dc: Costituzione CD 14
effect: la creatura subisce 2d6 danni taglienti e tossisce sangue cristallino
countermeasure: muoversi lentamente evita di sollevare la nebbia
:::
## Mondo
### PNG

<p class="muted"><strong>Core.</strong> Personaggio non giocante con motivazioni e spunti.</p>

::: npc PNG
name: Mira Calden
role: Mediatrice di gilda con troppi debiti
appearance: abiti eleganti consumati ai polsini
voice: precisa, gentile, sempre un mezzo tono troppo calma
motive: vuole uscire viva da un accordo sbagliato
secret: ha venduto una mappa falsa a due fazioni diverse
hook: Offerta | Paga bene per recuperare l'originale prima dell'alba.
:::
### Luogo

<p class="muted"><strong>Core.</strong> Luogo esplorabile con atmosfera, pericolo e ricompensa.</p>

::: location Luogo
name: Ponte delle Campane
tags: rovina, vento, vertigine
mood: ogni passo risponde con un tintinnio lontano
danger: una campana spezzata attira creature ostili se viene toccata
treasure: una moneta votiva incastrata tra le pietre
hook: Segno | Le corde delle campane formano un simbolo ricorrente.
:::
### Fazione

<p class="muted"><strong>Fantasy Classic Pack.</strong> Organizzazione con obiettivo, risorse e tensioni.</p>

::: faction Fazione
name: Ordine della Lanterna
goal: Recuperare reliquie perdute prima che cadano in mani ostili.
resources: Informatori, archivi sigillati, piccoli santuari lungo le strade.
complication: Un ramo interno nasconde un patto con una creatura extraplanare.
hook: Richiesta | La fazione offre protezione in cambio di una mappa sottratta a un rivale.
:::
## Tavolo
### Tabella

<p class="muted"><strong>Core.</strong> Tabella casuale compatta.</p>

::: random-table d6
name: Eventi rapidi
die: d6
row: 1 | Si sente un colpo metallico.
row: 2 | Una porta si apre da sola.
:::
### Readaloud

<p class="muted"><strong>Core.</strong> Testo da leggere ai giocatori.</p>

::: readaloud Da leggere al tavolo
Le torce proiettano ombre innaturali sulle colonne spezzate.
:::
### Incontro

<p class="muted"><strong>Core.</strong> Nota tattica o situazione di conflitto.</p>

::: encounter Incontro
Tre avversari deboli entrano da lati opposti.
:::
### Tesoro

<p class="muted"><strong>Core.</strong> Ricompensa o bottino.</p>

::: treasure Tesoro
- 25 monete d'argento
- Una chiave annerita
- Un frammento di mappa
:::
### Nota

<p class="muted"><strong>Core.</strong> Promemoria per autore o master.</p>

::: note Nota autore
Promemoria di design, appunto per playtest o variante opzionale.
:::
### Citazione

<p class="muted"><strong>Core.</strong> Citazione o frammento di lore con fonte.</p>

::: quote Fonte
"Il re dorme ancora sotto la montagna. E sogna fame."
:::
### Missione

<p class="muted"><strong>Fantasy Classic Pack.</strong> Obiettivo giocabile con posta, ostacolo e ricompensa.</p>

::: quest Missione
name: La Campana Sepolta
objective: Trovare la campana votiva prima dell'equinozio.
stakes: Se la campana resta sepolta, il villaggio perdera la protezione rituale.
reward: Accesso agli archivi del tempio e una reliquia minore.
hook: Rivale | Una compagnia mercenaria vuole vendere la campana al miglior offerente.
:::
## Media
### Mappa

<p class="muted"><strong>Core.</strong> Figura mappa con src e alt.</p>

::: map Mappa
src: ../assets/images/maps/santuario-sepolto-map.svg
alt: Mappa del Santuario Sepolto
:::
### Immagine

<p class="muted"><strong>Core.</strong> Figura immagine generica.</p>

::: image Immagine
src: ../assets/images/maps/santuario-sepolto-map.svg
alt: Handout
caption: Handout per i giocatori
:::

## Tabelle Markdown

| d8 | Complicazione |
|---|---|
| 1 | Una fazione rivale arriva prima |
| 2 | Il tesoro e gia stato spostato |
| 3 | Un alleato mente per paura |
| 4 | La mappa e corretta ma incompleta |

<div class="center smallcaps muted mt-3">Fine reference generata</div>
