import { useEffect, useMemo, useState } from "react";
import {
  applyComponentPreset,
  buildComponentMarkdownFromValues,
  defaultComponentValues,
  validateComponentValues
} from "./componentMarkdown.js";

export function ComponentPalette({
  schema,
  packs = [],
  enabledPackIds = new Set(),
  externalPacks = [],
  activeGroup = "all",
  onTogglePack,
  onImportExternalPack,
  onRemoveExternalPack,
  onActiveGroupChange,
  onInsert
}) {
  const [query, setQuery] = useState("");
  const [selectedId, setSelectedId] = useState("");
  const [packError, setPackError] = useState("");
  const selectedComponent = useMemo(
    () => (schema.components || []).find((component) => component.id === selectedId) || null,
    [schema, selectedId]
  );
  const [draftValues, setDraftValues] = useState(null);
  const componentGroups = useMemo(() => {
    const groups = new Set((schema.components || []).map((component) => component.group || "Componenti"));
    return [...groups].sort((a, b) => a.localeCompare(b));
  }, [schema]);
  useEffect(() => {
    if (componentGroups.length && activeGroup !== "all" && !componentGroups.includes(activeGroup)) onActiveGroupChange?.("all");
  }, [activeGroup, componentGroups, onActiveGroupChange]);
  const groupedComponents = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    const groups = new Map();

    for (const component of schema.components || []) {
      const group = component.group || "Componenti";
      if (activeGroup !== "all" && group !== activeGroup) continue;
      const searchable = [
        component.label,
        component.id,
        component.container,
        component.description,
        component.group
      ].join(" ").toLowerCase();
      if (normalized && !searchable.includes(normalized)) continue;
      if (!groups.has(group)) groups.set(group, []);
      groups.get(group).push(component);
    }

    return [...groups.entries()];
  }, [schema, query, activeGroup]);

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
        <div className="component-group-filter" aria-label="Filtra gruppi componenti">
          <button type="button" aria-pressed={activeGroup === "all"} onClick={() => onActiveGroupChange?.("all")}>Tutti</button>
          {componentGroups.map((group) => (
            <button key={group} type="button" aria-pressed={activeGroup === group} onClick={() => onActiveGroupChange?.(group)}>
              {group}
            </button>
          ))}
        </div>
        {packs.length ? (
          <div className="pack-toggles" aria-label="Plugin pack">
            {packs.map((pack) => (
              <label key={pack.id}>
                <input
                  type="checkbox"
                  checked={enabledPackIds.has(pack.id)}
                  onChange={() => onTogglePack?.(pack.id)}
                />
                <span>{pack.name}</span>
              </label>
            ))}
          </div>
        ) : null}
        <ExternalPackControls
          packs={externalPacks}
          error={packError}
          onError={setPackError}
          onImport={onImportExternalPack}
          onRemove={onRemoveExternalPack}
        />
      </header>
      <div className="component-palette-scroll">
        {groupedComponents.map(([group, components]) => (
          <section key={group} className="component-group">
            <h2>{group}</h2>
            {components.map((component) => (
              <ComponentCard
                key={component.id}
                component={component}
                selected={component.id === selectedId}
                onSelect={() => {
                  setSelectedId(component.id);
                  setDraftValues(defaultComponentValues(component));
                }}
                onPreset={(presetId) => {
                  const values = applyComponentPreset(component, defaultComponentValues(component), presetId);
                  setSelectedId(component.id);
                  setDraftValues(values);
                  onInsert(buildComponentMarkdownFromValues(component, values));
                }}
              />
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

function ExternalPackControls({ packs, error, onError, onImport, onRemove }) {
  async function handleFile(event) {
    const [file] = event.target.files || [];
    if (!file) return;

    try {
      const pack = JSON.parse(await file.text());
      onImport?.(pack);
      onError("");
    } catch (caught) {
      onError(caught.message || "Pack JSON non valido.");
    } finally {
      event.target.value = "";
    }
  }

  return (
    <div className="external-pack-controls">
      <label className="external-pack-import">
        <span>Importa pack JSON</span>
        <input type="file" accept="application/json,.json" onChange={handleFile} />
      </label>
      {packs.length ? (
        <div className="external-pack-list">
          {packs.map((pack) => (
            <section key={pack.id} className="external-pack-item">
              <header>
                <span>{pack.name}</span>
                <button type="button" aria-label={`Rimuovi pack ${pack.name}`} onClick={() => onRemove?.(pack.id)}>Rimuovi</button>
              </header>
              <small>{pack.schema.components.length} componenti</small>
              <div className="external-pack-components">
                {pack.schema.components.map((component) => (
                  <span key={component.id} title={component.description}>
                    {component.label}
                    <small>{component.container}</small>
                  </span>
                ))}
              </div>
            </section>
          ))}
        </div>
      ) : null}
      {error ? <small className="inline-error">{error}</small> : null}
    </div>
  );
}

function ComponentCard({ component, selected, onSelect, onPreset }) {
  return (
    <article className={`component-card${selected ? " is-selected" : ""}`}>
      <button type="button" className="component-card-main" onClick={onSelect}>
        <span>{component.label}</span>
        <small>{component.description}</small>
      </button>
      {component.presets?.length ? (
        <div className="component-preset-actions" aria-label={`Preset ${component.label}`}>
          {component.presets.map((preset) => (
            <button key={preset.id} type="button" onClick={() => onPreset(preset.id)}>
              {preset.label || preset.id}
            </button>
          ))}
        </div>
      ) : null}
    </article>
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
