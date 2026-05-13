---
title: Guardrail Design e Licenza
slug: guardrail-design-licenza
summary: Regole pratiche per restare 5E-compatible, originali e coerenti in preview.
category: reference
tags: design, licenza, preview, 5e
compatibility: 5e/5.5e
license_mode: srd-5.2-cc
author: Andrea
theme: clean-guild
paper: A4
public: false
---

# Guardrail Design e Licenza

<p class="subtitle">Come avvicinarsi alle aspettative editoriali fantasy 5E senza copiare trade dress, loghi o asset proprietari.</p>

## Linea legale

- Usa `5E compatible` o `compatible with fifth edition`; evita loghi, marchi e diciture che facciano sembrare il prodotto ufficiale.
- Mantieni asset, icone, ornamenti, mappe e palette originali o con licenze tracciate in `assets/manifest.json`.
- Usa contenuto SRD 5.2 solo con attribuzione CC-BY-4.0 nel blocco legale generato.
- Non copiare layout, pagine, frame, marchi, copertine, illustrazioni o elementi riconoscibili dai libri ufficiali.
- Per materiale fan non SRD, dichiaralo non ufficiale e non usarlo come base per output commerciali senza una licenza adeguata.

## Linea visiva

- Obiettivo: leggibilita da manuale fantasy, densita informativa alta, statblock scansionabili, tabelle robuste e callout distinti.
- Identita originale: verderame, lacca scura, oro spento e carta calda sono i token base del progetto.
- Evita di inseguire una replica: nessun logo ufficiale, nessuna cornice identificabile, nessuna imitazione diretta di copertine o pagine del publisher ufficiale.
- Due colonne, tabelle compatte e blocchi regole non spezzabili sono pattern editoriali generici ammessi; non importare font embedded, border image o stylesheet PHB/Homebrewery.
- Il tema `modern-5-5` puo suggerire un impianto piu moderno e pulito, ma deve restare originale: niente trade dress 2024 ufficiale, niente marchi, niente layout riconoscibili.
- I componenti devono sembrare parte della stessa suite: label coerenti, bordi sottili, spaziature compatte e tipografia stabile.

## Preview VS Code

- La Markdown Preview nativa usa `styles/preview.css`, che deve restare allineato a `styles/core/page.css` e agli ornamenti del template.
- Per componenti renderizzati direttamente in VS Code usa gli snippet HTML (`readaloud`, `monster`, `spell`, `map`, ecc.).
- La sintassi breve `:::` resta ottimizzata per editor locale, build e preview espansa.
- Gli include `rpg-include` sono risolti da `npm run preview:watch`; in VS Code appaiono come placeholder leggibili.

## Checklist Per Ogni Pass Visuale

- Titoli e ornamenti non si sovrappongono a 390px, 760px e desktop.
- Tabelle non generano overflow orizzontale.
- Statblock e card mantengono label leggibili e gerarchia chiara.
- Preview VS Code, preview editor e build HTML condividono palette, carta e spaziatura.
- PDF A4 passa `npm run check:pdf-layout` prima del merge.
