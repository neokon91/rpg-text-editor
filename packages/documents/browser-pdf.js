export function makePrintablePdfHtml(html) {
  const printTools = `
    <style id="rpg-browser-pdf-print">
      .browser-print-banner {
        position: sticky;
        top: 0;
        z-index: 20;
        margin: -24px -24px 24px;
        padding: 12px 16px;
        background: #12343b;
        color: #f8f3df;
        font: 700 14px/1.4 system-ui, sans-serif;
        text-align: center;
      }
      @media print {
        body { background: #fff !important; padding: 0 !important; zoom: 1 !important; }
        .browser-print-banner { display: none !important; }
        .preview-pages { gap: 0 !important; }
        .page-shell { box-shadow: none !important; margin: 0 !important; break-after: page; }
      }
    </style>
    <div class="browser-print-banner">Fallback stampa: usa Stampa / Salva come PDF se vuoi la resa visuale identica alla preview.</div>
    <script>
      window.addEventListener("load", function() {
        window.setTimeout(function() { window.print(); }, 250);
      });
    </script>`;

  return html.replace("</body>", `${printTools}\n  </body>`);
}

export async function makeBrowserPdfBlob({ html, title, markdown }) {
  const fallbackPdfBlob = () => makeBrowserTextPdfBlob({ title, markdown });
  return makeBrowserVisualPdfBlob(html, fallbackPdfBlob);
}

async function makeBrowserVisualPdfBlob(html, fallbackPdfBlob) {
  if (!canRenderVisualPdf()) {
    markVisualPdfStatus("fallback: unsupported browser APIs");
    return fallbackPdfBlob();
  }

  const iframe = document.createElement("iframe");
  iframe.setAttribute("aria-hidden", "true");
  iframe.style.cssText = "position:fixed;left:-10000px;top:0;width:1200px;height:1600px;border:0;opacity:0;pointer-events:none;";
  document.body.appendChild(iframe);

  try {
    iframe.srcdoc = html;
    await waitForFrameLoad(iframe);
    const frameDocument = iframe.contentDocument;
    if (!frameDocument) {
      markVisualPdfStatus("fallback: iframe document unavailable");
      return fallbackPdfBlob();
    }
    if (frameDocument.fonts?.ready) await frameDocument.fonts.ready.catch(() => {});
    await waitForAnimationFrames(iframe.contentWindow, 3);
    await wait(180);

    const pages = Array.from(frameDocument.querySelectorAll(".page-shell"));
    if (!pages.length) {
      markVisualPdfStatus("fallback: no pages");
      return fallbackPdfBlob();
    }

    const html2canvas = await loadHtml2Canvas();
    const images = [];
    for (const page of pages) {
      const image = await renderPageImage(page, html2canvas);
      if (!image) {
        markVisualPdfStatus("fallback: page image unavailable");
        return fallbackPdfBlob();
      }
      images.push(image);
    }

    markVisualPdfStatus(`visual: ${images.length} pages`);
    return makeImagePdfBlob(images);
  } catch (error) {
    markVisualPdfStatus(`fallback: ${error.message}`);
    return fallbackPdfBlob();
  } finally {
    iframe.remove();
  }
}

function markVisualPdfStatus(status) {
  try {
    window.__rpgVisualPdfStatus = status;
  } catch {}
}

function canRenderVisualPdf() {
  return Boolean(
    typeof document !== "undefined"
    && document.body
    && typeof Image !== "undefined"
    && typeof Blob !== "undefined"
    && document.createElement("canvas").getContext
  );
}

async function loadHtml2Canvas() {
  const module = await import("html2canvas");
  return module.default || module;
}

function waitForFrameLoad(iframe) {
  return new Promise((resolve) => {
    const done = () => resolve();
    iframe.addEventListener("load", done, { once: true });
    setTimeout(done, 1200);
  });
}

function waitForAnimationFrames(targetWindow, count) {
  return new Promise((resolve) => {
    let remaining = count;
    const timeout = setTimeout(resolve, 600);
    const next = () => {
      remaining -= 1;
      if (remaining <= 0) {
        clearTimeout(timeout);
        resolve();
        return;
      }
      targetWindow.requestAnimationFrame(next);
    };
    targetWindow.requestAnimationFrame(next);
  });
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function renderPageImage(page, html2canvas) {
  const svgImage = await renderPageImageWithSvg(page);
  if (svgImage) return svgImage;

  const rect = page.getBoundingClientRect();
  const width = Math.ceil(rect.width || page.scrollWidth || 794);
  const height = Math.ceil(rect.height || page.scrollHeight || 1123);
  const scale = Math.min(Math.max(window.devicePixelRatio || 1, 1.5), 2);
  const canvas = await withTimeout(html2canvas(page, {
    allowTaint: false,
    backgroundColor: "#ffffff",
    height,
    logging: false,
    scale,
    useCORS: true,
    width,
    windowHeight: height,
    windowWidth: width
  }), 15000, "render PDF visuale troppo lento");
  const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
  return {
    width,
    height,
    pixelWidth: canvas.width,
    pixelHeight: canvas.height,
    bytes: base64ToBytes(dataUrl.split(",")[1] || "")
  };
}

async function renderPageImageWithSvg(page) {
  if (typeof XMLSerializer === "undefined" || typeof URL === "undefined") return null;

  const rect = page.getBoundingClientRect();
  const width = Math.ceil(rect.width || page.scrollWidth || 794);
  const height = Math.ceil(rect.height || page.scrollHeight || 1123);
  const scale = Math.min(Math.max(window.devicePixelRatio || 1, 1.5), 2);
  const doc = page.ownerDocument;
  const clone = page.cloneNode(true);
  clone.style.margin = "0";
  clone.style.boxShadow = "none";

  const xhtml = [
    `<html xmlns="http://www.w3.org/1999/xhtml">`,
    "<head>",
    `<style>${collectStyleText(doc)}</style>`,
    "<style>",
    "html,body{width:100%;height:100%;margin:0;padding:0!important;background:#fff!important;zoom:1!important;}",
    ".preview-pages{display:block!important;margin:0!important;padding:0!important;}",
    ".page-shell{margin:0!important;box-shadow:none!important;}",
    "</style>",
    "</head>",
    `<body class="${escapeAttribute(doc.body.className || "")}">${new XMLSerializer().serializeToString(clone)}</body>`,
    "</html>"
  ].join("");
  const svg = [
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">`,
    `<foreignObject width="100%" height="100%">${xhtml}</foreignObject>`,
    "</svg>"
  ].join("");
  const url = URL.createObjectURL(new Blob([svg], { type: "image/svg+xml;charset=utf-8" }));

  try {
    const image = new Image();
    image.decoding = "async";
    image.src = url;
    await withTimeout(image.decode(), 5000, "render SVG PDF troppo lento");

    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(width * scale);
    canvas.height = Math.ceil(height * scale);
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.scale(scale, scale);
    context.drawImage(image, 0, 0, width, height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    return {
      width,
      height,
      pixelWidth: canvas.width,
      pixelHeight: canvas.height,
      bytes: base64ToBytes(dataUrl.split(",")[1] || "")
    };
  } catch {
    return null;
  } finally {
    URL.revokeObjectURL(url);
  }
}

function collectStyleText(doc) {
  const rules = [];
  for (const sheet of Array.from(doc.styleSheets || [])) {
    rules.push(...collectRules(sheet));
  }
  return rules.join("\n");
}

function collectRules(sheet) {
  const rules = [];
  try {
    for (const rule of Array.from(sheet.cssRules || [])) {
      if (rule.styleSheet) {
        rules.push(...collectRules(rule.styleSheet));
      } else if (rule.type === CSSRule.FONT_FACE_RULE) {
        continue;
      } else {
        rules.push(rule.cssText);
      }
    }
  } catch {}
  return rules;
}

function withTimeout(promise, timeoutMs, message) {
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error(message)), timeoutMs);
    promise.then(
      (value) => {
        clearTimeout(timeout);
        resolve(value);
      },
      (error) => {
        clearTimeout(timeout);
        reject(error);
      }
    );
  });
}

function escapeAttribute(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll('"', "&quot;")
    .replaceAll("<", "&lt;");
}

function makeImagePdfBlob(images) {
  const pageWidth = 595.28;
  const objects = [];
  const pageIds = [];

  objects[1] = asciiBytes("<< /Type /Catalog /Pages 2 0 R >>");
  objects[3] = asciiBytes("<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>");

  images.forEach((image, index) => {
    const pageId = 4 + index * 3;
    const contentId = pageId + 1;
    const imageId = pageId + 2;
    const pageHeight = pageWidth * (image.height / image.width);
    pageIds.push(pageId);
    objects[pageId] = asciiBytes(`<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth.toFixed(2)} ${pageHeight.toFixed(2)}] /Resources << /Font << /F1 3 0 R >> /XObject << /Im${index + 1} ${imageId} 0 R >> >> /Contents ${contentId} 0 R >>`);
    const stream = asciiBytes(`q\n${pageWidth.toFixed(2)} 0 0 ${pageHeight.toFixed(2)} 0 0 cm\n/Im${index + 1} Do\nQ`);
    objects[contentId] = pdfStreamObject(stream);
    objects[imageId] = pdfStreamObject(image.bytes, `<< /Type /XObject /Subtype /Image /Width ${image.pixelWidth} /Height ${image.pixelHeight} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /DCTDecode /Length ${image.bytes.length} >>`);
  });

  objects[2] = asciiBytes(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${images.length} >>`);
  return makePdfBlob(objects);
}

function makeBrowserTextPdfBlob({ title, markdown }) {
  const pageWidth = 595.28;
  const pageHeight = 841.89;
  const marginX = 54;
  const marginTop = 64;
  const marginBottom = 58;
  const maxWidth = pageWidth - marginX * 2;
  const lines = markdownToPdfLines(markdown, title, maxWidth);
  const pages = [];
  let currentPage = [];
  let y = pageHeight - marginTop;

  for (const line of lines) {
    const size = line.size || 11;
    const gap = line.gap || 0;
    const lineHeight = Math.max(14, size * 1.35) + gap;
    if (currentPage.length && y - lineHeight < marginBottom) {
      pages.push(currentPage);
      currentPage = [];
      y = pageHeight - marginTop;
    }
    currentPage.push({ ...line, y });
    y -= lineHeight;
  }
  pages.push(currentPage.length ? currentPage : [{ text: title, size: 18, font: "F2", y: pageHeight - marginTop }]);

  const objects = [];
  const pageObjectIds = pages.map((_, index) => 4 + index * 2);
  objects[1] = "<< /Type /Catalog /Pages 2 0 R >>";
  objects[2] = `<< /Type /Pages /Kids [${pageObjectIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pages.length} >>`;
  objects[3] = "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>";

  pages.forEach((pageLines, index) => {
    const pageId = pageObjectIds[index];
    const contentId = pageId + 1;
    const stream = pageLines.map((line) => {
      const font = line.font || "F1";
      const size = line.size || 11;
      return `BT /${font} ${size} Tf ${marginX} ${line.y.toFixed(2)} Td (${escapePdfText(line.text)}) Tj ET`;
    }).join("\n");
    objects[pageId] = `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 ${pageWidth} ${pageHeight}] /Resources << /Font << /F1 3 0 R /F2 3 0 R >> >> /Contents ${contentId} 0 R >>`;
    objects[contentId] = `<< /Length ${asciiBytes(stream).length} >>\nstream\n${stream}\nendstream`;
  });

  return makePdfBlob(objects.map((object) => object ? asciiBytes(object) : object));
}

function markdownToPdfLines(markdown, title, maxWidth) {
  const lines = [{ text: title, size: 18, font: "F2", gap: 8 }];
  const sourceLines = String(markdown)
    .replace(/:::\s*[a-z-]+[^\n]*/gi, "")
    .replace(/:::/g, "")
    .replace(/<[^>]+>/g, " ")
    .split(/\r?\n/);

  for (const sourceLine of sourceLines) {
    const clean = cleanMarkdownText(sourceLine);
    if (!clean) {
      if (lines.at(-1)?.text) lines.push({ text: "", size: 11, gap: 4 });
      continue;
    }
    const heading = sourceLine.match(/^(#{1,3})\s+(.+)/);
    const size = heading ? heading[1].length === 1 ? 16 : 13 : 11;
    const font = heading ? "F2" : "F1";
    const text = heading ? cleanMarkdownText(heading[2]) : clean;
    for (const wrapped of wrapPdfText(text, maxWidth, size)) {
      lines.push({ text: wrapped, size, font, gap: heading ? 4 : 0 });
    }
  }
  return lines;
}

function wrapPdfText(text, maxWidth, size) {
  const averageCharWidth = size * 0.52;
  const maxChars = Math.max(24, Math.floor(maxWidth / averageCharWidth));
  const words = text.split(/\s+/).filter(Boolean);
  const lines = [];
  let current = "";
  for (const word of words) {
    const next = current ? `${current} ${word}` : word;
    if (next.length > maxChars && current) {
      lines.push(current);
      current = word;
    } else {
      current = next;
    }
  }
  if (current) lines.push(current);
  return lines.length ? lines : [""];
}

function cleanMarkdownText(value) {
  return String(value)
    .replace(/^#{1,6}\s+/, "")
    .replace(/^[-*]\s+/, "- ")
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, "$1")
    .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
    .replace(/[`*_~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

function escapePdfText(value) {
  return String(value)
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\x20-\x7e]/g, " ")
    .replace(/\\/g, "\\\\")
    .replace(/\(/g, "\\(")
    .replace(/\)/g, "\\)");
}

function makePdfBlob(objects) {
  const chunks = [asciiBytes("%PDF-1.4\n")];
  const offsets = [0];
  let length = chunks[0].length;

  for (let index = 1; index < objects.length; index += 1) {
    offsets[index] = length;
    const prefix = asciiBytes(`${index} 0 obj\n`);
    const suffix = asciiBytes("\nendobj\n");
    chunks.push(prefix, objects[index], suffix);
    length += prefix.length + objects[index].length + suffix.length;
  }

  const xrefOffset = length;
  let xref = `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let index = 1; index < objects.length; index += 1) {
    xref += `${String(offsets[index]).padStart(10, "0")} 00000 n \n`;
  }
  xref += `trailer\n<< /Size ${objects.length} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  chunks.push(asciiBytes(xref));
  return new Blob(chunks, { type: "application/pdf" });
}

function pdfStreamObject(bytes, header) {
  if (header) {
    return concatBytes(asciiBytes(`${header}\nstream\n`), bytes, asciiBytes("\nendstream"));
  }
  return concatBytes(asciiBytes(`<< /Length ${bytes.length} >>\nstream\n`), bytes, asciiBytes("\nendstream"));
}

function asciiBytes(value) {
  return new TextEncoder().encode(value);
}

function concatBytes(...parts) {
  const total = parts.reduce((sum, part) => sum + part.length, 0);
  const output = new Uint8Array(total);
  let offset = 0;
  for (const part of parts) {
    output.set(part, offset);
    offset += part.length;
  }
  return output;
}

function base64ToBytes(value) {
  const binary = atob(value);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}
