import { useMemo, useState } from "react";
import {
  applyComponentPreset,
  buildComponentMarkdownFromValues,
  defaultComponentValues,
  validateComponentValues
} from "./componentMarkdown.js";

export function ComponentPalette({ schema, onInsert }) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const selectedComponent = useMemo(
    () => (schema.components || []).find((component) => component.id === selectedId) || null,
    [schema, selectedId]
  );
  const [draftValues, setDraftValues] = useState(null);
  const groupedComponents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const groups = new Map();

    for (const component of schema.components || []) {
      const searchable = [
        component.label,
        component.id,
        component.container,
        component.description,
        component.group
      ].join(" ").toLowerCase();
      if (normalized && !searchable.includes(normalized)) continue;
      const group = component.group || "Componenti";
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(component);
    }

    return [...groups.entries()];
  }, [schema, query]);

  return (
    <aside className="component-palette" aria-label="Componenti">
      <header className="side-panel-header">
        <strong>Componenti</strong>
        <input
          type="search"
          placeholder="Cerca"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
        />
      </header>
      <div className="component-palette-scroll">
        {groupedComponents.map(([group, components]) => (
          <section key={group} className="component-group">
            <h2>{group}</h2>
            {components.map((component) => (
              <button
                key={component.id}
                type="button"
                className={`component-card${component.id === selectedId ? " is-selected" : ""}`}
                onClick={() => {
                  setSelectedId(component.id);
                  setDraftValues(defaultComponentValues(component));
                }}
              >
                <span>{component.label}</span>
                <small>{component.description}</small>
              </button>
            ))}
          </section>
        ))}
        {!groupedComponents.length ? (
          <p className="empty-panel">Nessun componente trovato.</p>
        ) : null}
      </div>
      {selectedComponent && draftValues ? (
        <ComponentForm
          component={selectedComponent}
          values={draftValues}
          onChange={setDraftValues}
          onInsert={() => onInsert(buildComponentMarkdownFromValues(selectedComponent, draftValues))}
        />
      ) : null}
    </aside>
  );
}

function ComponentForm({ component, values, onChange, onInsert }) {
  const diagnostics = validateComponentValues(component, values);
  const diagnosticKeys = new Map(diagnostics.map((item) => [item.key, item.message]));

  function updateField(key, value) {
    onChange({
      ...values,
      fields: {
        ...values.fields,
        [key]: value
      }
    });
  }

  function updateList(index, patch) {
    onChange({
      ...values,
      lists: values.lists.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item)
    });
  }

  function removeListItem(index) {
    onChange({
      ...values,
      lists: values.lists.filter((_, itemIndex) => itemIndex !== index)
    });
  }

  function addListItem(template) {
    onChange({
      ...values,
      lists: [
        ...values.lists,
        {
          key: template.key,
          name: template.default_name || template.label || "Voce",
          text: template.default_text || "Dettaglio"
        }
      ]
    });
  }

  return (
    <form
      className="component-form"
      onSubmit={(event) => {
        event.preventDefault();
        if (diagnostics.length) return;
        onInsert();
      }}
    >
      <header>
        <strong>{component.label}</strong>
        <small>{component.container}</small>
      </header>
      {component.presets?.length ? (
        <label>
          <span>Preset</span>
          <select
            defaultValue=""
            onChange={(event) => {
              if (!event.target.value) return;
              onChange(applyComponentPreset(component, values, event.target.value));
              event.target.value = "";
            }}
          >
            <option value="">Scegli preset</option>
            {component.presets.map((preset) => (
              <option key={preset.id} value={preset.id}>{preset.label || preset.id}</option>
            ))}
          </select>
        </label>
      ) : null}
      <label>
        <span>Etichetta</span>
        <input value={values.label} onChange={(event) => onChange({ ...values, label: event.target.value })} />
      </label>
      {(component.fields || []).map((field) => {
        const message = diagnosticKeys.get(field.key);
        return (
          <label key={field.key} className={message ? "has-inline-error" : ""}>
            <span>{field.label || field.key}{field.required ? " *" : ""}</span>
            {field.type === "textarea" ? (
              <textarea value={values.fields[field.key] || ""} onChange={(event) => updateField(field.key, event.target.value)} />
            ) : (
              <input
                type={field.type === "number" ? "number" : "text"}
                value={values.fields[field.key] || ""}
                onChange={(event) => updateField(field.key, event.target.value)}
              />
            )}
            {message ? <small className="inline-error">{message}</small> : null}
          </label>
        );
      })}
      {values.lists.length || component.lists?.length ? (
        <div className="component-form-list">
          <strong>Liste</strong>
          {values.lists.map((item, index) => (
            <div key={`${item.key}-${index}`} className="component-list-row">
              <span>
                {item.key}
                <button type="button" aria-label={`Rimuovi ${item.key}`} onClick={() => removeListItem(index)}>Rimuovi</button>
              </span>
              <input value={item.name} onChange={(event) => updateList(index, { name: event.target.value })} />
              <textarea value={item.text} onChange={(event) => updateList(index, { text: event.target.value })} />
            </div>
          ))}
          {[...new Map((component.lists || []).map((list) => [list.key, list])).values()].map((list) => (
            <button key={list.key} type="button" onClick={() => addListItem(list)}>+ {list.label || list.key}</button>
          ))}
        </div>
      ) : null}
      <button type="submit" className="primary-action" disabled={diagnostics.length > 0}>Inserisci</button>
    </form>
  );
}
