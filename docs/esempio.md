---
title: Il Santuario Sepolto
slug: santuario-sepolto
summary: Un'avventura introduttiva in una cripta montana piena di presagi e non morti.
category: avventure
tags: dungeon, livello-1, non-morti
compatibility: 5e/5.5e
license_mode: srd-5.2-cc
author: Andrea
theme: classic-parchment
paper: A4
public: true
---

# Il Santuario Sepolto

<p class="subtitle">Un'avventura introduttiva per personaggi di livello 1-3</p>

<p class="dropcap">Quando la porta di pietra si apre, l'aria cambia. Un odore di cera spenta, muffa e ferro antico riempie il corridoio. Il rumore del vento sparisce dietro di voi mentre la montagna richiude lentamente il suo respiro.</p>

::: readaloud Da leggere al tavolo
Le torce proiettano ombre innaturali sulle colonne spezzate. In fondo alla sala, una figura immobile osserva il gruppo senza muoversi.
:::

## Entrata del Tempio

<div class="columns-2">

### Corridoi Frantumati

Le pareti sono ricoperte da iscrizioni erose dal tempo. Alcune mostrano guerrieri inginocchiati davanti a una figura coronata.

### Percezione

| CD | Evento |
|---|---|
| 10 | Rumore metallico distante |
| 15 | Tracce recenti sul pavimento |
| 18 | Presenza magica residua |

### Pericolo

Un passaggio cede se più di una creatura si ferma sulla piattaforma centrale. Le creature nell'area devono superare un tiro salvezza su Destrezza CD 13 o cadere in una cripta inferiore.

</div>

::: encounter Incontro opzionale
Se i personaggi fanno rumore per più di un minuto, 1d4 scheletri emergono dalle nicchie laterali e bloccano la via di fuga.
:::

::: random-table Eventi nel santuario
die: d6
1 | Una torcia si spegne senza vento.
2 | Un frammento d'osso rotola fuori da una fessura.
3 | Il nome di un personaggio compare inciso nella polvere.
4 | Un canto lontano svanisce appena qualcuno parla.
5 | Una porta sigillata pulsa di luce rossastra.
6 | Il Custode d'Ossa si muove di una stanza verso il gruppo.
:::

::: treasure Tesori
- 14 monete d'argento
- Un anello spezzato con sigillo nobiliare
- Una pergamena consumata con tre parole ancora leggibili: **sangue**, **cenere**, **ritorno**
:::

## Custode d'Ossa

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
languages: comprende le lingue che conosceva in vita ma non parla
trait: Resistenza Necrotica | Il Custode dimezza i danni necrotici ricevuti.
trait: Guardia Sepolcrale | Finché resta nel santuario, ha vantaggio alle prove per resistere a effetti che lo sposterebbero.
action: Lama Arrugginita | Attacco con arma da mischia: +5 a colpire, portata 1,5 m, un bersaglio. Colpisce per 1d8 + 3 danni taglienti.
reaction: Scatto d'Ossa | Quando una creatura manca il Custode con un attacco in mischia, il Custode può muoversi di 3 m senza provocare attacchi di opportunità.
:::

::: spell Formula rituale
name: Sigillo della Porta Muta
level: Trucchetto rituale
school: abiurazione
casting_time: 1 azione
range: contatto
components: V, S, M
duration: 1 ora
Una porta, un coperchio o una serratura toccata diventa silenziosa. Aprirla o chiuderla non produce rumore udibile oltre 3 metri.
:::

::: magicitem Reliquia
name: Anello del Voto Spezzato
type: Anello
rarity: non comune
attunement: richiesta
Chi lo indossa può aggiungere 1d4 a una prova di Saggezza una volta per riposo lungo. Se il tiro rivela una menzogna, l'anello si incrina ulteriormente.
:::

::: npc PNG
name: Elira Voss
role: Cartografa inquieta e ultima discendente dei custodi
appearance: mantello cerato, mani macchiate d'inchiostro, bussola senza ago
voice: parla a bassa voce e finisce spesso le frasi come se ascoltasse qualcun altro
motive: vuole recuperare il Sigillo Antico prima che lo faccia la sua famiglia
secret: conosce una seconda entrata, ma teme ciò che l'ha sigillata
hook: Patto di sangue | Offre una mappa incompleta in cambio della promessa di non distruggere l'altare.
hook: Debito antico | Riconosce l'anello spezzato e cambia subito atteggiamento.
:::

::: location Cripta laterale
name: Sala delle Candele Nere
tags: buio, silenzio, presagio
mood: l'aria è calda anche se la pietra è umida
danger: chi spegne una candela sente il proprio nome pronunciato dal buio
treasure: una chiave d'ottone nascosta sotto cera fusa
hook: Iscrizione | "Non destare chi veglia al posto dei vivi."
hook: Indizio | La disposizione delle candele riproduce la mappa del santuario.
:::

::: hazard Trappola
name: Pavimento Cedevole
trigger: una creatura termina il turno sulla piattaforma centrale
dc: Destrezza CD 13
effect: la creatura cade per 6 m e subisce 2d6 danni contundenti
countermeasure: una prova di Intelligenza CD 14 individua i cardini nascosti
:::

::: quote Cronache Perdute di Karadun
"Il re dorme ancora sotto la montagna. E sogna fame."
:::

## Ricompense

| Obiettivo | Ricompensa |
|---|---|
| Esplorare il santuario | 150 PE |
| Distruggere il Custode | 300 PE |
| Recuperare il Sigillo Antico | 1 gemma da 75 mo |

::: note Nota editoriale
Usa `::: monster`, `::: spell`, `::: magicitem`, `::: npc`, `::: location`, `::: hazard`, `::: random-table`, `::: readaloud`, `::: encounter`, `::: treasure`, `::: note` e `::: quote` per comporre documenti leggibili sia in HTML sia in PDF.
:::

<div class="center smallcaps muted mt-3">Fine del Capitolo I</div>
