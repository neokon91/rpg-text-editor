export function parseMarkdownOutline(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const outline = [];
  let inFence = false;

  lines.forEach((line, index) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return;
    }

    if (inFence) return;

    const match = /^(#{1,4})\s+(.+?)\s*#*\s*$/.exec(line);
    if (!match) return;

    const title = match[2].replace(/<[^>]+>/g, "").trim();
    if (!title) return;

    outline.push({
      level: match[1].length,
      title,
      line: index + 1
    });
  });

  return outline;
}

export function createOutlineController({ panel, sourceInput, getMarkdown, onSelectLine }) {
  let items = [];

  function render() {
    items = parseMarkdownOutline(getMarkdown());
    panel.replaceChildren();

    const heading = document.createElement("div");
    heading.className = "document-outline__header";

    const title = document.createElement("strong");
    title.textContent = "Navigatore";
    const count = document.createElement("span");
    count.textContent = items.length ? `${items.length} sezioni` : "Nessuna sezione";
    heading.append(title, count);
    panel.append(heading);

    if (!items.length) {
      const empty = document.createElement("p");
      empty.className = "document-outline__empty";
      empty.textContent = "Aggiungi heading Markdown per navigare il documento.";
      panel.append(empty);
      return items;
    }

    const list = document.createElement("ol");
    list.className = "document-outline__list";
    for (const item of items) {
      const row = document.createElement("li");
      row.className = `document-outline__item document-outline__item--level-${Math.min(item.level, 4)}`;

      const button = document.createElement("button");
      button.type = "button";
      button.dataset.line = String(item.line);
      button.innerHTML = `<span>${escapeHtml(item.title)}</span><small>riga ${item.line}</small>`;
      row.append(button);
      list.append(row);
    }
    panel.append(list);
    highlightCurrentLine();
    return items;
  }

  function highlightCurrentLine() {
    const currentLine = lineFromOffset(sourceInput.value, sourceInput.selectionStart);
    let active = null;
    for (const item of items) {
      if (item.line <= currentLine) active = item;
    }

    for (const button of panel.querySelectorAll("button[data-line]")) {
      button.classList.toggle("is-active", active && Number(button.dataset.line) === active.line);
    }
  }

  panel.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-line]");
    if (!button) return;
    onSelectLine(Number(button.dataset.line));
    highlightCurrentLine();
  });

  sourceInput.addEventListener("click", highlightCurrentLine);
  sourceInput.addEventListener("keyup", highlightCurrentLine);
  sourceInput.addEventListener("select", highlightCurrentLine);

  return { render, highlightCurrentLine };
}

function lineFromOffset(text, offset) {
  return text.slice(0, offset).replace(/\r\n/g, "\n").split("\n").length;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
