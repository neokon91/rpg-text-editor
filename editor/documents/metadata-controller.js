import { metadataWithDefaults, parseFrontmatter, serializeFrontmatter } from "/editor/documents/frontmatter.js";

export function createMetadataController({
  controls,
  fallbackMarkdown,
  getMarkdown,
  setMarkdown,
  onChange
}) {
  let syncing = false;

  function init() {
    for (const control of controls) {
      control.addEventListener("input", apply);
      control.addEventListener("change", apply);
    }
  }

  function sync() {
    if (syncing) return;

    syncing = true;
    const metadata = metadataWithDefaults(getMarkdown(), fallbackMarkdown);

    for (const control of controls) {
      const key = control.dataset.meta;
      control.value = metadata[key] ?? "";
    }

    syncing = false;
  }

  function apply() {
    if (syncing) return;

    const parsed = parseFrontmatter(getMarkdown());
    const metadata = { ...parsed.metadata };
    for (const control of controls) {
      metadata[control.dataset.meta] = control.value.trim();
    }
    metadata.compatibility ||= "5e/5.5e";
    metadata.license_mode ||= "srd-5.2-cc";

    setMarkdown(`${serializeFrontmatter(metadata)}\n\n${parsed.body.trimStart()}`);
    onChange();
  }

  return {
    init,
    sync
  };
}
