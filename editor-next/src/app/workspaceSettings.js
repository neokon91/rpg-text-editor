import { workspaceStoragePrefix } from "./constants.js";

export function workspaceKey(key) {
  return `${workspaceStoragePrefix}:${key}`;
}

export function loadBooleanWorkspaceSetting(key, fallback) {
  const value = localStorage.getItem(workspaceKey(key));
  if (value === "true") return true;
  if (value === "false") return false;
  return fallback;
}

export function saveBooleanWorkspaceSetting(key, value) {
  localStorage.setItem(workspaceKey(key), value ? "true" : "false");
}

export function loadNumberWorkspaceSetting(key) {
  const value = Number(localStorage.getItem(workspaceKey(key)));
  return Number.isInteger(value) && value > 0 ? value : null;
}
