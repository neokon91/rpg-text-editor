export function insertAtCursor(textarea, text) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  textarea.value = `${textarea.value.slice(0, start)}${text}${textarea.value.slice(end)}`;
  textarea.focus();
  textarea.selectionStart = textarea.selectionEnd = start + text.length;
}

export function createToolbarHandler(textarea, onChange) {
  return (event) => {
    const button = event.target.closest("button[data-action]");
    if (!button) return;

    const snippet = toolbarSnippet(button.dataset.action, textarea.value.slice(textarea.selectionStart, textarea.selectionEnd));
    insertAtCursor(textarea, snippet);
    onChange();
  };
}

export function createSnippetHandler(textarea, onChange) {
  return (event) => {
    const button = event.target.closest("button[data-snippet]");
    if (!button) return;

    const snippet = quickSnippet(button.dataset.snippet, textarea.value.slice(textarea.selectionStart, textarea.selectionEnd));
    insertAtCursor(textarea, snippet);
    onChange();
  };
}

export function countWords(text) {
  return (text.match(/\b[\w'’]+\b/g) || []).length;
}

export async function copyMarkdown(markdown) {
  await navigator.clipboard.writeText(markdown);
}

export function downloadMarkdown(markdown, filename) {
  const blob = new Blob([markdown], { type: "text/markdown;charset=utf-8" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = filename;
  link.click();
  URL.revokeObjectURL(link.href);
}

function toolbarSnippet(action, selected) {
  const fallback = selected || {
    heading: "Nuova sezione",
    bold: "testo importante",
    italic: "enfasi",
    list: "Elemento",
    table: "Voce",
    readaloud: "Testo da leggere al tavolo",
    callout: "Nota importante per il master.",
    include: "",
    pagebreak: ""
  }[action] || "";

  return {
    heading: `\n\n## ${fallback}\n`,
    bold: `**${fallback}**`,
    italic: `*${fallback}*`,
    list: `\n- ${fallback}\n`,
    table: `\n\n| Voce | Dettaglio |\n| --- | --- |\n| ${fallback} | Descrizione |\n| Variante | Effetto |\n`,
    readaloud: `\n\n::: readaloud Da leggere al tavolo\n${fallback}\n:::\n`,
    callout: `\n\n::: note Nota\n${fallback}\n:::\n`,
    include: '\n\n<rpg-include src="content/monsters/custode-ossa.html"></rpg-include>\n',
    pagebreak: "\n\n::pagebreak\n"
  }[action] || "";
}

function quickSnippet(action, selected) {
  const fallback = selected || {
    scene: "Descrivi qui la scena.",
    readaloud: "Testo da leggere al tavolo.",
    note: "Promemoria per l'autore.",
    encounter: "Descrivi obiettivo, minaccia e complicazione.",
    treasure: "Ricompensa o indizio.",
    pagebreak: "",
    table: "Evento"
  }[action] || "";

  return {
    scene: `\n\n## Nuova scena\n\n${fallback}\n`,
    readaloud: `\n\n::: readaloud Da leggere al tavolo\n${fallback}\n:::\n`,
    note: `\n\n::: note Nota\n${fallback}\n:::\n`,
    encounter: `\n\n::: encounter Incontro\nname: Nuovo incontro\nbody: ${fallback}\n:::\n`,
    treasure: `\n\n::: treasure Tesoro\nname: Nuovo tesoro\nbody: ${fallback}\n:::\n`,
    table: `\n\n::: random-table Tabella\nname: Tabella casuale\ndie: d6\nrow: 1 | ${fallback}\nrow: 2 | Svolta inattesa\n:::\n`,
    pagebreak: "\n\n::pagebreak\n"
  }[action] || "";
}
