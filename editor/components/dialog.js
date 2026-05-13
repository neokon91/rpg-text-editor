export function renderComponentList({ schema, searchInput, listElement, onSelect }) {
  const query = searchInput.value.trim().toLowerCase();
  const components = schema.components.filter((component) => {
    const haystack = [component.label, component.group, component.description, component.id].join(" ").toLowerCase();
    return haystack.includes(query);
  });
  const groups = groupBy(components, "group");

  listElement.replaceChildren(...Object.entries(groups).map(([group, groupComponents]) => {
    const section = document.createElement("section");
    section.className = "component-group";
    section.innerHTML = `<h3>${escapeHtml(group)}</h3>`;

    for (const component of groupComponents) {
      const button = document.createElement("button");
      button.type = "button";
      button.className = "component-card";
      button.innerHTML = `
        <span>${escapeHtml(component.label)}</span>
        <small>${escapeHtml(component.description)}</small>
        <em>${escapeHtml(component.source_name || "Core")}</em>
      `;
      button.addEventListener("click", () => onSelect(component));
      section.append(button);
    }

    return section;
  }));
}

export function renderPackList({ manifest, enabledPacks, listElement, onToggle }) {
  const packs = manifest.packs || [];
  if (!packs.length) {
    listElement.innerHTML = '<p class="pack-empty">Nessun pack dichiarato.</p>';
    return;
  }

  listElement.replaceChildren(...packs.map((pack) => {
    const label = document.createElement("label");
    label.className = "pack-toggle";
    label.innerHTML = `
      <input type="checkbox" value="${escapeHtml(pack.id)}" ${enabledPacks.has(pack.id) ? "checked" : ""}>
      <span>
        <strong>${escapeHtml(pack.name)}</strong>
        <small>${escapeHtml(pack.version)} · ${escapeHtml(pack.compatibility)}</small>
      </span>
    `;
    label.querySelector("input").addEventListener("change", () => onToggle(pack.id));
    return label;
  }));
}

export function openComponentDialog({ component, dialog, titleElement, descriptionElement, formElement }) {
  titleElement.textContent = component.label;
  descriptionElement.textContent = component.description;
  formElement.replaceChildren();

  const labelField = createField({
    key: "__label",
    label: "Etichetta blocco",
    type: "text",
    default: component.default_label || component.label
  });
  formElement.append(labelField);

  for (const field of component.fields || []) {
    formElement.append(createField(field));
  }

  for (const [index, list] of (component.lists || []).entries()) {
    formElement.append(createListField(list, index));
  }

  dialog.showModal();
}

export function componentToMarkdown(component, form) {
  const values = new FormData(form);
  const label = String(values.get("__label") || component.default_label || "").trim();
  const lines = [`::: ${component.container}${label ? ` ${label}` : ""}`];

  for (const field of component.fields || []) {
    const value = String(values.get(field.key) || "").trim();
    if (!value) continue;

    if (field.key === "body") {
      lines.push(value);
    } else {
      lines.push(`${field.key}: ${value}`);
    }
  }

  for (const [index, list] of (component.lists || []).entries()) {
    const name = String(values.get(`${list.key}__name__${index}`) || "").trim();
    const text = String(values.get(`${list.key}__text__${index}`) || "").trim();
    if (name || text) lines.push(`${list.key}: ${name} | ${text}`);
  }

  lines.push(":::");
  return `\n\n${lines.join("\n")}\n`;
}

function createField(field) {
  const wrapper = document.createElement("label");
  wrapper.className = "field";
  wrapper.dataset.key = field.key;
  wrapper.innerHTML = `<span>${escapeHtml(field.label)}${field.required ? " *" : ""}</span>`;

  const control = field.type === "textarea" ? document.createElement("textarea") : document.createElement("input");
  control.name = field.key;
  control.value = field.default ?? "";
  if (field.type === "number") {
    control.type = "number";
  } else if (field.type !== "textarea") {
    control.type = "text";
  }
  if (field.required) control.required = true;
  wrapper.append(control);

  return wrapper;
}

function createListField(list, index) {
  const wrapper = document.createElement("fieldset");
  wrapper.className = "list-field";
  wrapper.dataset.listKey = list.key;
  wrapper.dataset.listIndex = String(index);
  wrapper.innerHTML = `<legend>${escapeHtml(list.label)}</legend>`;
  const row = document.createElement("div");
  row.className = "list-row";
  row.innerHTML = `
    <input name="${escapeHtml(list.key)}__name__${index}" value="${escapeHtml(list.default_name || "")}" aria-label="${escapeHtml(list.label)} nome">
    <textarea name="${escapeHtml(list.key)}__text__${index}" aria-label="${escapeHtml(list.label)} testo">${escapeHtml(list.default_text || "")}</textarea>
  `;
  wrapper.append(row);
  return wrapper;
}

function groupBy(items, key) {
  return items.reduce((groups, item) => {
    const value = item[key] || "Altro";
    groups[value] ||= [];
    groups[value].push(item);
    return groups;
  }, {});
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
