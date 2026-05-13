import { useEffect, useRef } from "react";

export function PreviewFrame({ html, zoom, viewport, onSelectLine }) {
  const frame = useRef(null);

  useEffect(() => {
    function handleMessage(event) {
      if (event.source !== frame.current?.contentWindow) return;
      if (event.data?.type !== "rpg-preview-source-line") return;
      onSelectLine(Number(event.data.line));
    }
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [onSelectLine]);

  useEffect(() => {
    const documentElement = frame.current?.contentDocument?.documentElement;
    documentElement?.style.setProperty("--rpg-preview-zoom", zoom);
  }, [html, zoom]);

  return (
    <section className="preview-pane" aria-label="Anteprima">
      <iframe
        ref={frame}
        className="next-preview-frame"
        title="Anteprima documento"
        srcDoc={html}
        data-viewport={viewport}
        onLoad={() => {
          frame.current?.contentDocument?.documentElement.style.setProperty("--rpg-preview-zoom", zoom);
        }}
      />
    </section>
  );
}
