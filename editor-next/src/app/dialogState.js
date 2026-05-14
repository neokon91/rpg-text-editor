import { useRef, useState } from "react";

export function useDialogState() {
  const resolverRef = useRef(null);
  const [dialog, setDialog] = useState(null);

  function resolveDialog(value) {
    const resolver = resolverRef.current;
    resolverRef.current = null;
    setDialog(null);
    resolver?.(value);
  }

  function requestConfirm({ title, message, confirmLabel = "Conferma" }) {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({ kind: "confirm", title, message, confirmLabel });
    });
  }

  function requestPrompt({ title, message, defaultValue = "", confirmLabel = "Conferma" }) {
    return new Promise((resolve) => {
      resolverRef.current = resolve;
      setDialog({ kind: "prompt", title, message, defaultValue, confirmLabel });
    });
  }

  return {
    dialog,
    requestConfirm,
    requestPrompt,
    resolveDialog
  };
}
