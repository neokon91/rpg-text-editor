export function buildComponentMarkdown(component) {
  return buildComponentMarkdownFromValues(component, defaultComponentValues(component));
}

export function defaultComponentValues(component) {
  const preset = component.presets?.[0];
  const presetFields = preset?.fields || {};
  return {
    fields: Object.fromEntries((component.fields || []).map((field) => [field.key, presetFields[field.key] ?? field.default ?? ""])),
    label: preset?.label || component.default_label || component.label || component.id,
    lists: preset?.lists ? normalizePresetLists(preset.lists) : (component.lists || []).map((list) => ({
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

export function applyComponentPreset(component, currentValues, presetId) {
  const preset = (component.presets || []).find((item) => item.id === presetId);
  if (!preset) return currentValues;

  return {
    fields: {
      ...currentValues.fields,
      ...(preset.fields || {})
    },
    label: preset.label || currentValues.label,
    lists: preset.lists ? normalizePresetLists(preset.lists) : currentValues.lists
  };
}

export function validateComponentValues(component, values) {
  return (component.fields || [])
    .filter((field) => field.required && !String(values.fields?.[field.key] ?? "").trim())
    .map((field) => ({
      key: field.key,
      message: `${field.label || field.key} e obbligatorio.`
    }));
}

function normalizePresetLists(lists) {
  return lists.map((item) => ({
    key: item.key,
    name: item.name ?? item.default_name ?? "Voce",
    text: item.text ?? item.default_text ?? "Dettaglio"
  }));
}
