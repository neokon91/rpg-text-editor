export async function listDocuments() {
  const response = await fetch("/api/documents");
  if (!response.ok) throw new Error("Lista documenti non disponibile");
  return response.json();
}

export async function getDocument(filename) {
  const response = await fetch(`/api/documents/${encodeURIComponent(filename)}`);
  if (!response.ok) throw new Error("Import non riuscito");
  return response.json();
}

export async function saveDocument({ filename, content, overwrite = false, unique = false }) {
  const response = await fetch("/api/documents", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ filename, content, overwrite, unique })
  });

  if (!response.ok) {
    const error = new Error("Salvataggio non riuscito");
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function renameDocument(filename, nextFilename) {
  const response = await fetch(`/api/documents/${encodeURIComponent(filename)}`, {
    method: "PUT",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ filename: nextFilename })
  });

  if (!response.ok) {
    const error = new Error("Rename non riuscito");
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function deleteDocument(filename) {
  const response = await fetch(`/api/documents/${encodeURIComponent(filename)}`, {
    method: "DELETE"
  });

  if (!response.ok) {
    const error = new Error("Delete non riuscito");
    error.status = response.status;
    throw error;
  }

  return response.json();
}

export async function checkDocument({ filename, content }) {
  const response = await fetch("/api/check-document", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ filename, content })
  });

  if (!response.ok) throw new Error("Check documento non riuscito");
  return response.json();
}

export async function exportDocument({ filename, content, format }) {
  const response = await fetch("/api/export-document", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ filename, content, format })
  });

  if (!response.ok) {
    const payload = await response.json().catch(() => ({}));
    const error = new Error(payload.message || "Export documento non riuscito");
    error.log = payload.log || "";
    throw error;
  }

  return response.json();
}
