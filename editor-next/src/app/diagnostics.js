import { renderComponentValidation } from "../../../packages/components/validation.js";

export function collectDiagnostics(markdown, schema) {
  const target = document.createElement("div");
  return renderComponentValidation(markdown, schema, target, () => {}) || [];
}

export function sameOverflowPages(left, right) {
  if (left.length !== right.length) return false;
  return left.every((item, index) => item.page === right[index].page && item.line === right[index].line);
}
