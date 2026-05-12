export function mergeComponentSources(sources) {
  const components = [];
  const ids = new Set();
  const containers = new Set();

  for (const source of sources) {
    for (const component of source.schema.components || []) {
      if (ids.has(component.id)) throw new Error(`Component id duplicato: ${component.id}`);
      if (containers.has(component.container)) throw new Error(`Container duplicato: ${component.container}`);

      ids.add(component.id);
      containers.add(component.container);
      components.push({
        ...component,
        source: source.id,
        source_name: source.name
      });
    }
  }

  return { components };
}

export function validateMarkdownBlocks(markdown, schema) {
  const componentsByContainer = new Map(schema.components.map((component) => [component.container, component]));
  const diagnostics = [];

  for (const block of parseMarkdownBlocks(markdown)) {
    const component = componentsByContainer.get(block.name);
    if (!component) {
      diagnostics.push({
        severity: "error",
        line: block.line,
        message: `Componente sconosciuto "${block.name}".`
      });
      continue;
    }

    const parsed = parseBlockData(block.body);
    const fieldKeys = new Set((component.fields || []).map((field) => field.key));
    const requiredFields = (component.fields || []).filter((field) => field.required).map((field) => field.key);
    const listKeys = new Set((component.lists || []).map((list) => list.key));
    const allowedKeys = new Set([...fieldKeys, ...listKeys]);

    for (const key of requiredFields) {
      if (!parsed.fields.has(key) || !String(parsed.fields.get(key)).trim()) {
        diagnostics.push({
          severity: "error",
          line: block.line,
          message: `${component.label}: campo obbligatorio mancante "${key}".`
        });
      }
    }

    for (const entry of parsed.entries) {
      if (!allowedKeys.has(entry.key)) {
        diagnostics.push({
          severity: "warning",
          line: block.line + entry.offset,
          message: `${component.label}: chiave non prevista "${entry.key}".`
        });
      }

      if (listKeys.has(entry.key) && !entry.value.includes("|")) {
        diagnostics.push({
          severity: "warning",
          line: block.line + entry.offset,
          message: `${component.label}: lista "${entry.key}" malformata, usa "nome | testo".`
        });
      }
    }
  }

  return diagnostics;
}

export function parseMarkdownBlocks(markdown) {
  const lines = markdown.replace(/\r\n/g, "\n").split("\n");
  const blocks = [];
  let inFence = false;

  for (let index = 0; index < lines.length; index += 1) {
    const trimmed = lines[index].trim();

    if (/^```/.test(trimmed)) {
      inFence = !inFence;
      continue;
    }

    if (inFence) continue;

    const container = trimmed.match(/^:::\s*([a-z0-9_-]+)(?:\s+(.*))?$/i);
    if (!container) continue;

    const body = [];
    const startLine = index + 1;
    while (++index < lines.length && lines[index].trim() !== ":::") {
      body.push(lines[index]);
    }

    blocks.push({
      name: container[1].toLowerCase(),
      label: container[2] || "",
      body: body.join("\n"),
      line: startLine
    });
  }

  return blocks;
}

export function parseBlockData(markdown) {
  const fields = new Map();
  const entries = [];
  const body = [];

  for (const [offset, rawLine] of markdown.split("\n").entries()) {
    const line = rawLine.trim();
    if (!line) continue;

    const index = line.indexOf(":");
    if (index > 0 && /^[a-zA-Z][a-zA-Z0-9_-]*:/.test(line)) {
      const key = line.slice(0, index).trim().toLowerCase();
      const value = line.slice(index + 1).trim();
      fields.set(key, value);
      entries.push({ key, value, offset: offset + 1 });
      continue;
    }

    body.push(line);
  }

  return { body, entries, fields };
}

export function slugifyDocumentName(markdown, fallback = "bozza-rpg") {
  const metadataSlug = markdown.match(/^---\n[\s\S]*?\nslug:\s*([^\n]+)[\s\S]*?\n---/m)?.[1];
  const heading = markdown.match(/^#\s+(.+)$/m)?.[1];
  return slugify(metadataSlug || heading || fallback);
}

export function slugify(value) {
  return String(value)
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "documento";
}
