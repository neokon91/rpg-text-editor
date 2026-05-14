import { useCallback, useEffect, useRef, useState } from "react";

const MIN_ZOOM = 0.4;
const MAX_ZOOM = 1.6;

export function PreviewFrame({
  html,
  zoom,
  viewport,
  spread,
  autoPaginate,
  syncSourceLine,
  onOverflowChange,
  onSelectLine,
  onZoomChange,
  onSpreadChange,
  onAutoPaginateChange
}) {
  const frame = useRef(null);
  const removeScrollListener = useRef(null);
  const [pageState, setPageState] = useState({ current: 1, total: 1 });
  const [pageInput, setPageInput] = useState("1");
  const [overflowPages, setOverflowPages] = useState([]);
  const [autoPageReport, setAutoPageReport] = useState(null);

  const readPageMarkers = useCallback(() => {
    const doc = frame.current?.contentDocument;
    if (!doc) return [];
    return [...doc.querySelectorAll(".page-shell")].map((node, index) => ({
      index: index + 1,
      top: node.offsetTop
    }));
  }, []);

  const updatePageState = useCallback(() => {
    const doc = frame.current?.contentDocument;
    if (!doc?.documentElement || !doc.body) return;
    const markers = readPageMarkers();
    const scrollTop = doc.documentElement.scrollTop || doc.body.scrollTop || 0;
    const current = markers.reduce((active, marker) => scrollTop + 40 >= marker.top ? marker.index : active, 1);
    const nextState = { current, total: Math.max(markers.length, 1) };
    setPageState(nextState);
    setPageInput(String(nextState.current));
    const nextOverflowPages = readOverflowPages(doc);
    setOverflowPages(nextOverflowPages);
    onOverflowChange?.(nextOverflowPages);
  }, [onOverflowChange, readPageMarkers]);

  useEffect(() => {
    function handleMessage(event) {
      if (event.source !== frame.current?.contentWindow) return;
      if (event.data?.type === "rpg-preview-source-line") {
        onSelectLine(Number(event.data.line));
        return;
      }
      if (event.data?.type === "rpg-preview-pagination") {
        setAutoPageReport({
          totalPages: Number(event.data.totalPages) || 1,
          generatedPages: Number(event.data.generatedPages) || 0,
          overflowPages: Number(event.data.overflowPages) || 0,
          firstOverflowPage: Number(event.data.firstOverflowPage) || 0,
          firstOverflowLine: Number(event.data.firstOverflowLine) || 0
        });
        updatePageState();
      }
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSelectLine, updatePageState]);

  useEffect(() => {
    const documentElement = frame.current?.contentDocument?.documentElement;
    documentElement?.style.setProperty("--rpg-preview-zoom", zoom);
    updatePageState();
  }, [html, zoom, updatePageState]);

  useEffect(() => {
    const body = frame.current?.contentDocument?.body;
    if (body) body.dataset.spread = spread;
    updatePageState();
  }, [html, spread, updatePageState]);

  useEffect(() => {
    if (!syncSourceLine) return;
    scrollToSourceLine(syncSourceLine);
  }, [html, syncSourceLine]);

  useEffect(() => {
    setPageInput(String(pageState.current));
  }, [pageState.current]);

  useEffect(() => () => removeScrollListener.current?.(), []);

  function bindFrame() {
    const doc = frame.current?.contentDocument;
    if (!doc) return;
    removeScrollListener.current?.();
    setAutoPageReport(null);
    doc.documentElement.style.setProperty("--rpg-preview-zoom", zoom);
    if (doc.body) doc.body.dataset.spread = spread;
    const win = frame.current.contentWindow;
    win?.addEventListener("scroll", updatePageState, { passive: true });
    removeScrollListener.current = () => win?.removeEventListener("scroll", updatePageState);
    updatePageState();
    win?.requestAnimationFrame(() => updatePageState());
    win?.setTimeout(() => updatePageState(), 120);
    if (syncSourceLine) scrollToSourceLine(syncSourceLine);
  }

  function goToPage(nextPage) {
    const markers = readPageMarkers();
    const page = Math.min(Math.max(Number(nextPage) || 1, 1), Math.max(markers.length, 1));
    const marker = markers[page - 1];
    if (!marker) return;
    frame.current?.contentWindow?.scrollTo({ top: Math.max(marker.top - 18, 0), behavior: "smooth" });
    setPageState({ current: page, total: Math.max(markers.length, 1) });
  }

  function scrollToSourceLine(line) {
    const doc = frame.current?.contentDocument;
    if (!doc) return;
    const targetLine = Number(line) || 0;
    const targets = [...doc.querySelectorAll("[data-source-line]")]
      .map((node) => {
        const start = Number(node.dataset.sourceLine) || 0;
        const end = Math.max(Number(node.dataset.sourceEndLine) || start, start);
        return { node, start, end };
      })
      .filter((item) => item.start > 0);
    const target = findSourceTarget(targets, targetLine);
    if (!target) return;
    scrollTargetIntoView(doc, target, targetLine);
  }

  function fitPreview(mode) {
    const frameNode = frame.current;
    const doc = frameNode?.contentDocument;
    const shell = doc?.querySelector(".page-shell");
    if (!frameNode || !shell) return;

    const activeZoom = Number(zoom) || 1;
    const rect = shell.getBoundingClientRect();
    const width = rect.width / activeZoom;
    const height = rect.height / activeZoom;
    const availableWidth = frameNode.clientWidth - 36;
    const availableHeight = frameNode.clientHeight - 36;
    const widthRatio = availableWidth / width;
    const heightRatio = availableHeight / height;
    const nextZoom = mode === "fill" ? widthRatio : Math.min(widthRatio, heightRatio);
    onZoomChange(String(clampZoom(nextZoom)));
  }

  function selectFirstOverflow() {
    if (!firstOverflow) return;
    goToPage(firstOverflow.page);
    if (firstOverflow.line) onSelectLine(firstOverflow.line);
  }

  function selectAutoPageOverflow() {
    if (!visibleAutoPageReport?.firstOverflowPage) return;
    goToPage(visibleAutoPageReport.firstOverflowPage);
    if (visibleAutoPageReport.firstOverflowLine) onSelectLine(visibleAutoPageReport.firstOverflowLine);
  }

  const canGoBack = pageState.current > 1;
  const canGoForward = pageState.current < pageState.total;
  const firstOverflow = overflowPages[0];
  const visibleAutoPageReport = autoPageReport || (autoPaginate ? {
    totalPages: pageState.total,
    generatedPages: 0,
    overflowPages: overflowPages.length,
    firstOverflowPage: firstOverflow?.page || 0,
    firstOverflowLine: firstOverflow?.line || 0
  } : null);
  const autoPageSummary = visibleAutoPageReport
    ? `Auto ${visibleAutoPageReport.totalPages}p (+${visibleAutoPageReport.generatedPages})`
    : "";

  return (
    <section className="preview-pane" aria-label="Anteprima" data-spread={spread}>
      <div className="preview-toolbar" aria-label="Controlli anteprima">
        <button type="button" onClick={() => fitPreview("fit")}>Fit</button>
        <button type="button" onClick={() => fitPreview("fill")}>Fill</button>
        <select value={spread} onChange={(event) => onSpreadChange(event.target.value)} aria-label="Modalita pagine">
          <option value="single">Singola</option>
          <option value="facing">Affiancata</option>
          <option value="flow">Flusso</option>
        </select>
        <button
          type="button"
          aria-pressed={autoPaginate}
          title="Paginazione automatica preview"
          onClick={() => onAutoPaginateChange(!autoPaginate)}
        >
          Auto pages
        </button>
        {autoPaginate && visibleAutoPageReport ? (
          visibleAutoPageReport.overflowPages ? (
            <button
              type="button"
              className="preview-auto-pages"
              data-state="warning"
              title={`Prima pagina auto overflow: ${visibleAutoPageReport.firstOverflowPage}, riga ${visibleAutoPageReport.firstOverflowLine}`}
              onClick={selectAutoPageOverflow}
            >
              {autoPageSummary} · {visibleAutoPageReport.overflowPages} overflow
            </button>
          ) : (
            <span className="preview-auto-pages" data-state="ok" title="Pagine generate dalla preview automatica">
              {autoPageSummary} · ok
            </span>
          )
        ) : null}
        <button type="button" disabled={!canGoBack} onClick={() => goToPage(pageState.current - 1)} aria-label="Pagina precedente">‹</button>
        <label>
          <span>Pagina</span>
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            value={pageInput}
            onChange={(event) => setPageInput(event.target.value.replace(/\D/g, ""))}
            onBlur={() => goToPage(pageInput)}
            onKeyDown={(event) => {
              if (event.key === "Enter") goToPage(pageInput);
            }}
          />
          <span>/ {pageState.total}</span>
        </label>
        <button type="button" disabled={!canGoForward} onClick={() => goToPage(pageState.current + 1)} aria-label="Pagina successiva">›</button>
        {overflowPages.length ? (
          <button
            type="button"
            className="preview-overflow"
            title={`Prima pagina overflow: ${firstOverflow.page}, riga ${firstOverflow.line}`}
            onClick={selectFirstOverflow}
          >
            Overflow {overflowPages.length} · riga {firstOverflow.line}
          </button>
        ) : null}
      </div>
      <iframe
        ref={frame}
        className="next-preview-frame"
        title="Anteprima documento"
        srcDoc={html}
        data-viewport={viewport}
        onLoad={bindFrame}
      />
    </section>
  );
}

function readOverflowPages(doc) {
  const spread = doc.body?.dataset.spread;
  if (spread === "flow") return [];
  return [...doc.querySelectorAll(".page-shell")]
    .map((page) => {
      const style = doc.defaultView?.getComputedStyle(page);
      const pageLimit = parseFloat(style?.minHeight || "0") || parseFloat(style?.height || "0") || page.clientHeight;
      const pageRect = page.getBoundingClientRect();
      const pageBottom = pageRect.top + pageLimit;
      const clippedNode = [...page.querySelectorAll("[data-source-line]")].find((node) => {
        const rect = node.getBoundingClientRect();
        return rect.bottom > pageBottom - 4 || rect.right > pageRect.right - 4;
      });
      const hasOverflow = page.scrollHeight > pageLimit + 4 || page.scrollWidth > page.clientWidth + 4 || clippedNode;
      if (!hasOverflow) return null;
      return {
        page: Number(page.dataset.previewPage) || 1,
        line: Number(clippedNode?.dataset.sourceLine) || firstSourceLine(page)
      };
    })
    .filter(Boolean);
}

function firstSourceLine(page) {
  const source = page.querySelector("[data-source-line]");
  return Number(source?.dataset.sourceLine) || 1;
}

function findSourceTarget(targets, line) {
  const containing = targets.find((item) => item.start <= line && item.end >= line);
  if (containing) return containing;
  return targets.reduce((best, item) => {
    if (!best) return item;
    const itemDistance = Math.min(Math.abs(item.start - line), Math.abs(item.end - line));
    const bestDistance = Math.min(Math.abs(best.start - line), Math.abs(best.end - line));
    return itemDistance < bestDistance ? item : best;
  }, null);
}

function scrollTargetIntoView(doc, target, line) {
  const win = doc.defaultView;
  if (!win) {
    target.node.scrollIntoView({ block: "center", behavior: "smooth" });
    return;
  }

  const rect = target.node.getBoundingClientRect();
  const range = Math.max(target.end - target.start, 1);
  const ratio = target.start <= line && line <= target.end ? (line - target.start) / range : 0.5;
  const targetTop = rect.top + win.scrollY + rect.height * ratio;
  win.scrollTo({ top: Math.max(targetTop - win.innerHeight / 2, 0), behavior: "smooth" });
}

function clampZoom(value) {
  return Math.min(Math.max(Number(value) || 1, MIN_ZOOM), MAX_ZOOM).toFixed(2);
}
