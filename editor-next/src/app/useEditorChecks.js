import { useEffect, useMemo, useState } from "react";
import { checkDocument, exportDocument } from "../../../packages/documents/api.js";

export function useEditorChecks({
  autoPaginatePreview,
  diagnostics,
  downloadCurrentMarkdown,
  filename,
  markdown,
  refreshDocumentRuntimeState,
  setExportOutputs,
  setSelectedLine,
  setStatus
}) {
  const [statusDetail, setStatusDetail] = useState("");
  const [authorDiagnostics, setAuthorDiagnostics] = useState([]);
  const [checkedMarkdown, setCheckedMarkdown] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    if (statusDetail) setStatusDetail("");
  }, [statusDetail, markdown]);

  const activeAuthorDiagnostics = checkedMarkdown === markdown ? authorDiagnostics : [];
  const combinedDiagnostics = useMemo(
    () => [...diagnostics, ...activeAuthorDiagnostics],
    [diagnostics, activeAuthorDiagnostics]
  );

  function clearDocumentDiagnostics() {
    setAuthorDiagnostics([]);
    setCheckedMarkdown("");
  }

  function clearExportOutputs() {
    setExportOutputs([]);
  }

  async function runCheck({ focus = true } = {}) {
    setIsChecking(true);
    clearExportOutputs();
    try {
      const result = await checkDocument({ filename, content: markdown });
      const nextAuthorDiagnostics = result.diagnostics || [];
      const allDiagnostics = [...diagnostics, ...nextAuthorDiagnostics];
      setAuthorDiagnostics(nextAuthorDiagnostics);
      setCheckedMarkdown(markdown);
      const firstBlocking = allDiagnostics.find((item) => item.severity === "error") || allDiagnostics[0];
      if (firstBlocking && focus) setSelectedLine(firstBlocking.line);
      setStatus(firstBlocking
        ? firstBlocking.severity === "error" ? "Check: errori da correggere" : "Check: avvisi presenti"
        : "Check completo ok");
      return { ok: !allDiagnostics.some((item) => item.severity === "error"), diagnostics: allDiagnostics };
    } catch {
      const failed = [{
        severity: "error",
        line: 1,
        message: "Author check non disponibile.",
        fix: "Verifica che il server editor-next sia attivo."
      }];
      setAuthorDiagnostics(failed);
      setCheckedMarkdown(markdown);
      setStatus("Check non disponibile");
      return { ok: false, diagnostics: [...diagnostics, ...failed] };
    } finally {
      setIsChecking(false);
      await refreshDocumentRuntimeState();
    }
  }

  async function exportChecked(format) {
    const result = await runCheck({ focus: true });
    if (!result.ok) {
      setStatus("Export bloccato: correggi gli errori");
      return;
    }

    if (format === "markdown") {
      downloadCurrentMarkdown();
      return;
    }

    setStatus(`Export ${format.toUpperCase()} in corso...`);
    setStatusDetail("");
    try {
      const exportResult = await exportDocument({ filename, content: markdown, format, autoPaginate: autoPaginatePreview });
      setExportOutputs(exportResult.outputs || []);
      setStatus(`Export ${format.toUpperCase()} pronto`);
      setStatusDetail("");
    } catch (error) {
      setExportOutputs([]);
      setStatus(error.message || "Export non riuscito");
      setStatusDetail(error.log || "");
    } finally {
      await refreshDocumentRuntimeState();
    }
  }

  return {
    combinedDiagnostics,
    isChecking,
    statusDetail,
    clearDocumentDiagnostics,
    clearExportOutputs,
    exportChecked,
    runCheck
  };
}
