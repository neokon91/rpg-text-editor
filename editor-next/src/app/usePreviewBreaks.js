import { useRef } from "react";
import { sameOverflowPages } from "./diagnostics.js";
import { insertPageBreakBeforeLine, insertPageBreaksBeforeLines, predictPageBreakLines } from "../editor/pageBreaks.js";

export function usePreviewBreaks({
  clearExportOutputs,
  editorRef,
  markdown,
  selectedLine,
  setMarkdown,
  setSelectedLine,
  setStatus
}) {
  const previewOverflowPages = useRef([]);
  const pendingBreakReview = useRef(null);

  function insertPageBreakAtSelection() {
    const targetLine = selectedLine || editorRef.current?.getCursorLine();
    if (!targetLine) return;
    let breakLine = targetLine;
    let contentLine = targetLine;
    let inserted = false;
    setMarkdown((current) => {
      const result = insertPageBreakBeforeLine(current, targetLine);
      breakLine = result.breakLine;
      contentLine = result.contentLine;
      inserted = result.inserted;
      return result.markdown;
    });
    setSelectedLine(breakLine);
    pendingBreakReview.current = inserted ? { breakLine, contentLine } : null;
    setStatus(inserted ? `Page break inserito alla riga ${breakLine}; contenuto da riga ${contentLine}` : `Page break gia vicino alla riga ${breakLine}`);
    clearExportOutputs();
  }

  function insertPageBreaksAtOverflow() {
    const overflowLines = previewOverflowPages.current.map((item) => item.line).filter(Boolean);
    if (!overflowLines.length) {
      setStatus("Nessun overflow preview da spezzare");
      return;
    }

    const plannedLines = predictPageBreakLines(markdown, overflowLines);
    const result = insertPageBreaksBeforeLines(markdown, plannedLines);
    setMarkdown(result.markdown);

    if (result.inserted) {
      setSelectedLine(result.breaks[0].breakLine);
      pendingBreakReview.current = null;
      setStatus(`Auto break: ${result.inserted} page break predittivi inseriti`);
    } else {
      setStatus("Auto break: page break gia presenti vicino agli overflow");
    }
    clearExportOutputs();
  }

  function handleOverflowChange(overflowPages) {
    previewOverflowPages.current = sameOverflowPages(previewOverflowPages.current, overflowPages) ? previewOverflowPages.current : overflowPages;
    reviewBreakOverflow(overflowPages);
  }

  function reviewBreakOverflow(overflowPages) {
    if (!pendingBreakReview.current) return;

    const residualOverflow = overflowPages.find((item) => item.line > pendingBreakReview.current.breakLine);
    if (residualOverflow) {
      setSelectedLine(residualOverflow.line);
      setStatus(`Overflow residuo: prossima pagina ${residualOverflow.page}, riga ${residualOverflow.line}`);
    } else {
      setStatus(`Page break inserito alla riga ${pendingBreakReview.current.breakLine}; overflow risolto`);
    }
    pendingBreakReview.current = null;
  }

  return {
    handleOverflowChange,
    insertPageBreakAtSelection,
    insertPageBreaksAtOverflow
  };
}
