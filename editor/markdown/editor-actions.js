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
    image: "",
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
    image: "\n\n::: image Immagine\nsrc: ../assets/images/maps/santuario-sepolto-map.svg\nalt: Immagine di riferimento\ncaption: Didascalia\n:::\n",
    include: '\n\n<rpg-include src="content/monsters/custode-ossa.html"></rpg-include>\n',
    pagebreak: "\n\n::pagebreak\n"
  }[action] || "";
}
