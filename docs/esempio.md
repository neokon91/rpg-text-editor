---
title: Il Santuario Sepolto
slug: santuario-sepolto
summary: Un'avventura introduttiva in una cripta montana piena di presagi e non morti.
category: avventure
tags: dungeon, livello-1, non-morti
compatibility: 5e/5.5e
license_mode: srd-5.2-cc
author: Andrea
theme: fifth-edition-compatible
paper: A4
public: true
---

# Il Santuario Sepolto

::: subtitle
Un'avventura introduttiva per personaggi di livello 1-3
:::

::: dropcap
Quando la porta di pietra si apre, l'aria cambia. Un odore di cera spenta, muffa e ferro antico riempie il corridoio. Il rumore del vento sparisce dietro di voi mentre la montagna richiude lentamente il suo respiro.
:::

::: readaloud Da leggere al tavolo
Le torce proiettano ombre innaturali sulle colonne spezzate. In fondo alla sala, una figura immobile osserva il gruppo senza muoversi.
:::

## Entrata del Tempio

::: map Mappa del Santuario Sepolto
src: ../assets/images/maps/santuario-sepolto-map.svg
alt: Mappa del Santuario Sepolto con ingresso, sala delle candele, altare e camera del custode
:::

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

::: encounter Incontro opzionale
Se i personaggi fanno rumore per più di un minuto, 1d4 scheletri emergono dalle nicchie laterali e bloccano la via di fuga.
:::

::: random-table d6
name: Eventi nel santuario
row: 1 | Una torcia si spegne senza vento.
row: 2 | Un frammento d'osso rotola fuori da una fessura.
row: 3 | Il nome di un personaggio compare inciso nella polvere.
row: 4 | Un canto lontano svanisce appena qualcuno parla.
row: 5 | Una porta sigillata pulsa di luce rossastra.
row: 6 | Il Custode d'Ossa si muove di una stanza verso il gruppo.
:::

::: treasure Tesori
- 14 monete d'argento
- Un anello spezzato con sigillo nobiliare
- Una pergamena consumata con tre parole ancora leggibili: **sangue**, **cenere**, **ritorno**
:::

## Custode d'Ossa

<rpg-include src="content/monsters/custode-ossa.html"></rpg-include>

<rpg-include src="content/spells/sigillo-porta-muta.html"></rpg-include>

<rpg-include src="content/items/anello-voto-spezzato.html"></rpg-include>

<rpg-include src="content/npcs/elira-voss.html"></rpg-include>

<rpg-include src="content/locations/sala-candele-nere.html"></rpg-include>

<rpg-include src="content/hazards/pavimento-cedevole.html"></rpg-include>

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
Usa la palette dei componenti per inserire box, statblock e tabelle: ogni elemento diventa un blocco `:::` validato, senza scrivere HTML a mano.
:::
