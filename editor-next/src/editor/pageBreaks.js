export function insertPageBreakBeforeLine(markdown, lineNumber) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blockLine = findBlockStartLine(lines, lineNumber);
  const index = blockLine - 1;
  const nearby = lines.slice(Math.max(0, index - 2), Math.min(lines.length, index + 2)).map((line) => line.trim());
  if (nearby.includes("::pagebreak")) return { markdown, line: blockLine, inserted: false };
  const insertion = index > 0 && !lines[index - 1].trim() ? ["::pagebreak", ""] : ["", "::pagebreak", ""];
  lines.splice(index, 0, ...insertion);
  return { markdown: lines.join("\n"), line: blockLine, inserted: true };
}

function findBlockStartLine(lines, lineNumber) {
  let index = Math.max(0, Math.min(Number(lineNumber) - 1, lines.length - 1));
  while (index > 0 && lines[index].trim() && lines[index - 1].trim() && lines[index - 1].trim() !== "::pagebreak") {
    index -= 1;
  }
  return index + 1;
}
