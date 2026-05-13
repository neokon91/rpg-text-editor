export function parseFrontmatter(markdown) {
  if (!markdown.startsWith("---\n")) return { metadata: {}, body: markdown };
  const end = markdown.indexOf("\n---", 4);
  if (end === -1) return { metadata: {}, body: markdown };

  const raw = markdown.slice(4, end).trim();
  const metadata = {};
  for (const line of raw.split("\n")) {
    const index = line.indexOf(":");
    if (index === -1) continue;
    metadata[line.slice(0, index).trim()] = line.slice(index + 1).trim().replace(/^["']|["']$/g, "");
  }

  return { metadata, body: markdown.slice(end + 4).trimStart() };
}

export function serializeFrontmatter(metadata) {
  const order = [
    "title",
    "slug",
    "summary",
    "category",
    "tags",
    "compatibility",
    "license_mode",
    "author",
    "theme",
    "paper",
    "public"
  ];
  const keys = [...order, ...Object.keys(metadata).filter((key) => !order.includes(key))];
  const lines = keys
    .filter((key, index) => keys.indexOf(key) === index && metadata[key] !== undefined && metadata[key] !== "")
    .map((key) => `${key}: ${metadata[key]}`);
  return ["---", ...lines, "---"].join("\n");
}

export function metadataWithDefaults(markdown, fallbackMarkdown) {
  const { metadata } = parseFrontmatter(markdown);
  const defaults = parseFrontmatter(fallbackMarkdown).metadata;
  return { ...defaults, ...metadata };
}
