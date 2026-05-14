export function insertPageBreakBeforeLine(markdown, lineNumber) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blockLine = findBlockStartLine(lines, lineNumber);
  const index = blockLine - 1;
  const nearby = lines.slice(Math.max(0, index - 2), Math.min(lines.length, index + 2)).map((line) => line.trim());
  if (nearby.includes("::pagebreak")) return { markdown, line: blockLine, breakLine: blockLine, contentLine: blockLine, inserted: false };
  const insertion = index > 0 && !lines[index - 1].trim() ? ["::pagebreak", ""] : ["", "::pagebreak", ""];
  lines.splice(index, 0, ...insertion);
  const breakLine = index + insertion.indexOf("::pagebreak") + 1;
  return {
    markdown: lines.join("\n"),
    line: blockLine,
    breakLine,
    contentLine: blockLine + insertion.length,
    inserted: true
  };
}

export function insertPageBreaksBeforeLines(markdown, lineNumbers) {
  const targets = normalizeTargetLines(lineNumbers)
    .sort((a, b) => a - b);
  let nextMarkdown = markdown;
  let lineOffset = 0;
  const breaks = [];

  for (const targetLine of targets) {
    const adjustedLine = targetLine + lineOffset;
    const result = insertPageBreakBeforeLine(nextMarkdown, adjustedLine);
    if (!result.inserted) continue;
    nextMarkdown = result.markdown;
    lineOffset += result.contentLine - result.line;
    breaks.push({
      targetLine,
      breakLine: result.breakLine,
      contentLine: result.contentLine
    });
  }

  return {
    markdown: nextMarkdown,
    inserted: breaks.length,
    breaks
  };
}

export function predictPageBreakLines(markdown, overflowLines, options = {}) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const threshold = Number(options.blockWeightThreshold) || 30;
  const targets = normalizeTargetLines(overflowLines).map((line) => findBlockStartLine(lines, line));
  const planned = new Set(targets);

  for (const targetLine of targets) {
    let weight = 0;
    for (const block of readMarkdownBlocks(lines, targetLine)) {
      if (hasNearbyPageBreak(lines, block.start)) {
        weight = 0;
        continue;
      }
      weight += block.weight;
      if (weight >= threshold) {
        planned.add(block.start);
        weight = 0;
      }
    }
  }

  return [...planned].sort((a, b) => a - b);
}

function findBlockStartLine(lines, lineNumber) {
  let index = Math.max(0, Math.min(Number(lineNumber) - 1, lines.length - 1));
  while (index > 0 && lines[index].trim() && lines[index - 1].trim() && lines[index - 1].trim() !== "::pagebreak") {
    index -= 1;
  }
  return index + 1;
}

function normalizeTargetLines(lineNumbers) {
  return [...new Set(lineNumbers.map(Number).filter((line) => Number.isInteger(line) && line > 0))];
}

function readMarkdownBlocks(lines, startLine) {
  const blocks = [];
  let index = Math.max(0, startLine - 1);

  while (index < lines.length) {
    while (index < lines.length && !lines[index].trim()) index += 1;
    if (index >= lines.length) break;

    const start = index + 1;
    const trimmed = lines[index].trim();

    if (trimmed === "::pagebreak" || trimmed === "\\page") {
      blocks.push({ start, weight: 0 });
      index += 1;
      continue;
    }

    if (/^:::\s*/.test(trimmed)) {
      index += 1;
      while (index < lines.length && lines[index].trim() !== ":::") index += 1;
      if (index < lines.length) index += 1;
      blocks.push({ start, weight: Math.max(8, (index - start + 1) * 1.5) });
      continue;
    }

    if (/^[-*]\s+/.test(trimmed)) {
      while (index < lines.length && /^[-*]\s+/.test(lines[index].trim())) index += 1;
      blocks.push({ start, weight: Math.max(4, index - start + 1) });
      continue;
    }

    if (/^(#{1,6})\s+/.test(trimmed)) {
      index += 1;
      blocks.push({ start, weight: 4 });
      continue;
    }

    const text = [];
    while (index < lines.length && lines[index].trim() && !isBlockBoundary(lines[index].trim())) {
      text.push(lines[index].trim());
      index += 1;
    }
    blocks.push({ start, weight: Math.max(3, Math.ceil(text.join(" ").length / 90)) });
  }

  return blocks;
}

function isBlockBoundary(trimmed) {
  return trimmed === "::pagebreak"
    || trimmed === "\\page"
    || /^:::\s*/.test(trimmed)
    || /^[-*]\s+/.test(trimmed)
    || /^(#{1,6})\s+/.test(trimmed);
}

function hasNearbyPageBreak(lines, lineNumber) {
  const index = lineNumber - 1;
  const nearby = lines.slice(Math.max(0, index - 3), Math.min(lines.length, index + 2)).map((line) => line.trim());
  return nearby.includes("::pagebreak") || nearby.includes("\\page");
}
