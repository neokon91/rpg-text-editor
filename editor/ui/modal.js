export function createModalController({
  dialog,
  title,
  message,
  field,
  cancelButton,
  confirmButton
}) {
  let resolver;

  cancelButton.addEventListener("click", () => close({ confirmed: false }));
  confirmButton.addEventListener("click", () => close({ confirmed: true, value: field.value.trim() }));
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    close({ confirmed: false });
  });

  function confirm({ title: nextTitle, message: nextMessage, confirmLabel = "Conferma", cancelLabel = "Annulla" }) {
    field.hidden = true;
    field.value = "";
    return open({ title: nextTitle, message: nextMessage, confirmLabel, cancelLabel });
  }

  function prompt({
    title: nextTitle,
    message: nextMessage,
    value = "",
    confirmLabel = "Rinomina",
    cancelLabel = "Annulla"
  }) {
    field.hidden = false;
    field.value = value;
    return open({ title: nextTitle, message: nextMessage, confirmLabel, cancelLabel, focusField: true });
  }

  function open({ title: nextTitle, message: nextMessage, confirmLabel, cancelLabel, focusField = false }) {
    title.textContent = nextTitle;
    message.textContent = nextMessage;
    confirmButton.textContent = confirmLabel;
    cancelButton.textContent = cancelLabel;
    dialog.showModal();
    if (focusField) {
      field.focus();
      field.select();
    } else {
      confirmButton.focus();
    }

    return new Promise((resolve) => {
      resolver = resolve;
    });
  }

  function close(result) {
    if (!dialog.open) return;
    dialog.close();
    resolver?.(result);
    resolver = undefined;
  }

  return {
    confirm,
    prompt
  };
}
