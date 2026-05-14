import { useState } from "react";

export function AppDialog({ dialog, onCancel, onConfirm }) {
  const [value, setValue] = useState(dialog.defaultValue || "");

  return (
    <div className="app-dialog-backdrop" role="presentation">
      <form
        className="app-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="app-dialog-title"
        onSubmit={(event) => {
          event.preventDefault();
          onConfirm(dialog.kind === "prompt" ? value.trim() : true);
        }}
      >
        <header>
          <strong id="app-dialog-title">{dialog.title}</strong>
          <button type="button" aria-label="Chiudi dialog" onClick={onCancel}>x</button>
        </header>
        <p>{dialog.message}</p>
        {dialog.kind === "prompt" ? (
          <input autoFocus value={value} onChange={(event) => setValue(event.target.value)} />
        ) : null}
        <footer>
          <button type="button" onClick={onCancel}>Annulla</button>
          <button type="submit" className="primary-action">{dialog.confirmLabel || "Conferma"}</button>
        </footer>
      </form>
    </div>
  );
}
