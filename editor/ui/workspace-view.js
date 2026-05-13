const allowedViews = new Set(["all", "write", "focus", "components"]);

export function createWorkspaceViewController({ shell, buttons, storageKey }) {
  function restore() {
    setView(localStorage.getItem(storageKey) || "write");
  }

  function bind() {
    for (const button of buttons) {
      button.addEventListener("click", () => setView(button.dataset.workspaceView));
    }
  }

  function setView(view) {
    const nextView = allowedViews.has(view) ? view : "all";
    shell.dataset.workspaceView = nextView;
    localStorage.setItem(storageKey, nextView);

    for (const button of buttons) {
      const active = button.dataset.workspaceView === nextView;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-pressed", active ? "true" : "false");
    }
  }

  return { bind, restore, setView };
}
