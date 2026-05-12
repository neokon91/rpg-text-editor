---
title: Schema Render Regression
slug: schema-render-regression
summary: Fixture per testare rendering componenti core e plugin.
category: test
tags: test, schema, rendering
compatibility: 5e/5.5e
license_mode: srd-5.2-cc
author: Andrea
theme: clean-guild
paper: A4
public: false
---

# Schema Render Regression

::: spell Formula rituale
name: Luce del Test
level: 1° livello
school: divinazione
casting_time: 1 azione
range: personale
components: V, S
duration: 1 minuto
Il testo dell'incantesimo deve restare nel corpo della card.
:::

::: random-table d4
name: Eventi test
die: d4
row: 1 | Primo evento
row: 2 | Secondo evento
:::

::: faction Fazione
name: Compagnia del Test
goal: Verificare il rendering dei plugin pack.
resources: Fixture, script e build HTML.
complication: Un cambiamento al renderer potrebbe degradare il blocco.
hook: Segnale | Il test deve trovare questo aggancio nel markup.
:::

::: quest Missione
name: Missione di Regressione
objective: Coprire i componenti generici da schema.
stakes: Evitare che tornino a rendering generico.
reward: Fiducia nella build.
hook: Prova | Il markup deve contenere il dettaglio strutturato.
:::
