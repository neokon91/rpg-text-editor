const draftKey = "rpg-text-editor-next:draft";

export function loadDraft() {
  return localStorage.getItem(draftKey);
}

export function saveDraft(markdown) {
  localStorage.setItem(draftKey, markdown);
}

export function clearDraft() {
  localStorage.removeItem(draftKey);
}
