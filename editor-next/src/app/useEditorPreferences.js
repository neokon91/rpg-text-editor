import { useEffect, useState } from "react";
import { loadBooleanWorkspaceSetting, loadNumberWorkspaceSetting, saveBooleanWorkspaceSetting, workspaceKey } from "./workspaceSettings.js";

export function useEditorPreferences() {
  const [previewVisible, setPreviewVisible] = useBooleanPreference("preview-visible", true);
  const [zoom, setZoom] = useStringPreference("zoom", "1");
  const [viewport, setViewport] = useStringPreference("viewport", "desktop");
  const [previewSpread, setPreviewSpread] = useStringPreference("preview-spread", "single");
  const [autoPaginatePreview, setAutoPaginatePreview] = useBooleanPreference("auto-paginate-preview", false);
  const [syncPreview, setSyncPreview] = useBooleanPreference("sync-preview", false);
  const [onboardingVisible, setOnboardingVisible] = useBooleanPreference("onboarding-visible", true);
  const [mobilePanel, setMobilePanel] = useStringPreference("mobile-panel", "editor");
  const [activeComponentGroup, setActiveComponentGroup] = useStringPreference("component-group", "all");
  // La riga selezionata puo essere nulla, quindi non usa gli helper generici stringa/boolean.
  const [selectedLine, setSelectedLine] = useState(() => loadNumberWorkspaceSetting("selected-line"));
  const [documentPanels, setDocumentPanels] = useState(() => ({
    frontmatter: loadBooleanWorkspaceSetting("frontmatter-panel", true),
    outline: loadBooleanWorkspaceSetting("outline-panel", true)
  }));

  useEffect(() => {
    if (selectedLine) {
      localStorage.setItem(workspaceKey("selected-line"), String(selectedLine));
    } else {
      localStorage.removeItem(workspaceKey("selected-line"));
    }
  }, [selectedLine]);

  useEffect(() => {
    saveBooleanWorkspaceSetting("frontmatter-panel", documentPanels.frontmatter);
    saveBooleanWorkspaceSetting("outline-panel", documentPanels.outline);
  }, [documentPanels]);

  function toggleDocumentPanel(panel) {
    setDocumentPanels((current) => ({
      ...current,
      [panel]: !current[panel]
    }));
  }

  return {
    activeComponentGroup,
    autoPaginatePreview,
    documentPanels,
    mobilePanel,
    onboardingVisible,
    previewSpread,
    previewVisible,
    selectedLine,
    syncPreview,
    viewport,
    zoom,
    setActiveComponentGroup,
    setAutoPaginatePreview,
    setMobilePanel,
    setOnboardingVisible,
    setPreviewSpread,
    setPreviewVisible,
    setSelectedLine,
    setSyncPreview,
    setViewport,
    setZoom,
    toggleDocumentPanel
  };
}

function useBooleanPreference(key, fallback) {
  const [value, setValue] = useState(() => loadBooleanWorkspaceSetting(key, fallback));

  useEffect(() => {
    saveBooleanWorkspaceSetting(key, value);
  }, [key, value]);

  return [value, setValue];
}

function useStringPreference(key, fallback) {
  const [value, setValue] = useState(() => localStorage.getItem(workspaceKey(key)) || fallback);

  useEffect(() => {
    localStorage.setItem(workspaceKey(key), value);
  }, [key, value]);

  return [value, setValue];
}
