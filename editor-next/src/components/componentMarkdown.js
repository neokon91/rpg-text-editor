export function buildComponentMarkdown(component) {
  return buildComponentMarkdownFromValues(component, defaultComponentValues(component));
}

export function defaultComponentValues(component) {
  return {
    fields: Object.fromEntries((component.fields || []).map((field) => [field.key, field.default ?? ""])),
    label: component.default_label || component.label || component.id,
    lists: (component.lists || []).map((list) => ({
      key: list.key,
      name: list.default_name || list.label || "Voce",
      text: list.default_text || "Dettaglio"
    }))
  };
}

export function buildComponentMarkdownFromValues(component, values) {
  const label = component.default_label || component.label || component.id;
  const lines = [`::: ${component.container || component.id} ${values.label || label}`];

  for (const field of component.fields || []) {
    const value = values.fields?.[field.key] ?? "";
    if (field.key === "body") {
      if (value) lines.push(String(value));
      continue;
    }
    if (value !== "") lines.push(`${field.key}: ${value}`);
  }

  for (const list of values.lists || []) {
    if (!list.name && !list.text) continue;
    lines.push(`${list.key}: ${list.name || "Voce"} | ${list.text || "Dettaglio"}`);
  }

  lines.push(":::");
  return `\n\n${lines.join("\n")}\n`;
}
