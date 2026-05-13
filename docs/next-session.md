---
title: Prossima Sessione
slug: prossima-sessione
summary: Handoff conciso per il prossimo ciclo UX autore.
category: reference
tags: handoff, editor, ux
compatibility: 5e/5.5e
license_mode: srd-5.2-cc
author: Andrea
theme: clean-guild
paper: A4
public: false
---

# Prossima Sessione

## Obiettivo

Rendere l'editor locale il flusso autore primario, cosi VS Code resta utile per sviluppo/review ma non necessario per scrivere contenuti.

## Stato

- `main` e aggiornato con PR #1: refactor editor, QA schema/preview/PDF e restyling template.
- Branch attivo: `codex/vscode-preview-rendering`.
- Commit locale sul branch: `5a1015f Align VS Code preview guardrails`.
- Pulizia branch precedente completata.
- Guardrail visuali/licenza aggiunti in `docs/design-guardrails.md`.
- Markdown Preview VS Code allineata meglio al template, ma il focus prossimo e l'editor locale.

## File Di Riferimento

- `editor/index.html`
- `editor/styles.css`
- `editor/app.js`
- `editor/components/*`
- `editor/documents/*`
- `editor/preview/controller.js`
- `editor/documents/preview-shell.js`
- `scripts/serve-editor.js`
- `scripts/test-editor-ui.js`
- `scripts/test-preview-visual.js`
- `docs/editor-reference.md`
- `docs/checklist.md`
- `docs/design-guardrails.md`

## Direzione UX

- Diagnostic panel piu utile: errori cliccabili, severita visiva, suggerimento di fix.
- Workflow autore chiaro: nuovo documento, salvataggio, stato dirty, export/check come azioni guidate.
- Preview piu fedele e controllabile: desktop/mobile/page width, refresh stabile, segnale tema/carta.
- Component insertion piu veloce: ricerca palette, filtri, preferiti o ultimi usati.
- Ridurre dipendenza da VS Code: tutto cio che serve a scrivere e controllare deve essere nell'editor.

## Vincoli

- Markdown resta sorgente primaria e sempre visibile.
- Output `5E compatible`, originale: niente loghi, marchi, impaginati o asset proprietari.
- Non copiare trade dress ufficiale; usare token e componenti originali del progetto.
- Ogni incremento deve passare almeno `npm run check` e `npm run test:editor-ui`.
