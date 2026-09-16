// ============================================================
// Paste Image Anywhere — content.js (v2 — Octadesk/Dropzone)
// Intercepta Ctrl+V e injeta no input.dz-hidden-input
// ============================================================

(function () {
  "use strict";

  // Marcador de diagnóstico: confirma que o content script rodou nesta página/frame.
  try {
    document.documentElement.setAttribute("data-pia-loaded", String(Date.now()));
    console.log("[PasteImage] content script carregado em", location.hostname);
  } catch (e) {}

  let overlay = null;

  // ── MutationObserver: aguarda o chat abrir e o input aparecer ──
  const observer = new MutationObserver(() => {
    // Só precisa observar, o paste handler já busca em tempo real
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });

  // ── Intercepta Ctrl+V global ──
  document.addEventListener("paste", handlePaste, true);

  async function handlePaste(e) {
    const items = e.clipboardData?.items;
    if (!items) return;

    // Procura imagem no clipboard
    let imageItem = null;
    for (const item of items) {
      if (item.type.startsWith("image/")) {
        imageItem = item;
        break;
      }
    }
    if (!imageItem) return;

    // Busca o input do Dropzone (só existe depois que o chat abre)
    const targetInput = findDropzoneInput();
    if (!targetInput) {
      showToast("⚠️ Abra o chat de suporte antes de colar.", "warn");
      return;
    }

    e.preventDefault();
    e.stopPropagation();

    const blob = imageItem.getAsFile();
    if (!blob) return;

    const ext = blob.type.split("/")[1] || "png";
    const filename = `print_${Date.now()}.${ext}`;
    const file = new File([blob], filename, { type: blob.type });

    const success = injectFileIntoInput(targetInput, file);

    if (success) {
      showToast(`✅ Imagem injetada no chat!`, "success");
    } else {
      showToast("⚠️ Falha ao injetar. Salvando arquivo localmente...", "warn");
      downloadFile(blob, filename);
    }
  }

  // ── Busca o input do Dropzone (na própria página + iframes same-origin) ──
  function findDropzoneInput() {
    return findInputInDocument(document, 0);
  }

  function findInputInDocument(doc, depth) {
    if (!doc || depth > 4) return null;

    // Tenta pelo class name do Dropzone
    const byClass = doc.querySelector("input.dz-hidden-input");
    if (byClass) return byClass;

    // Fallback: input[type=file]. Apps Angular (ex.: Saipos) podem ter VÁRIAS
    // modais/campos de upload no DOM ao mesmo tempo (uma por trás da outra).
    // O último input[type=file] no DOM corresponde à modal aberta mais
    // recentemente (a que está no topo/visível), então priorizamos ele em vez
    // do primeiro — senão a imagem cai no campo errado.
    const fileInputs = doc.querySelectorAll('input[type="file"]');
    if (fileInputs.length) return fileInputs[fileInputs.length - 1];

    // Desce em iframes same-origin (ex.: widgets de chat renderizados em iframe,
    // como o do Octadesk/Zendesk que ficam dentro de <iframe> ou about:blank)
    const iframes = doc.querySelectorAll("iframe");
    for (const iframe of iframes) {
      try {
        const innerDoc = iframe.contentDocument;
        const found = findInputInDocument(innerDoc, depth + 1);
        if (found) return found;
      } catch (err) {
        // cross-origin de verdade (ex.: cdn.octadesk.com) — inacessível daqui,
        // depende do content script ter sido injetado dentro daquele frame
        continue;
      }
    }
    return null;
  }

  // ── Injeta File via DataTransfer ──
  function injectFileIntoInput(input, file) {
    try {
      const dt = new DataTransfer();
      dt.items.add(file);

      // Remove visibility:hidden temporariamente para garantir eventos
      const prevVisibility = input.style.visibility;
      const prevDisplay = input.style.display;
      input.style.visibility = "visible";
      input.style.display = "block";

      input.files = dt.files;

      // Dispara change — Dropzone.js escuta isso
      input.dispatchEvent(new Event("change", { bubbles: true }));
      input.dispatchEvent(new Event("input",  { bubbles: true }));

      // Restaura estilo
      input.style.visibility = prevVisibility;
      input.style.display = prevDisplay;

      return input.files.length > 0;
    } catch (err) {
      console.warn("[PasteImage] Erro ao injetar:", err);
      return false;
    }
  }

  // ── Fallback: baixa o arquivo ──
  function downloadFile(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 5000);
  }

  // ── Toast de feedback ──
  function showToast(message, type = "info") {
    if (overlay) overlay.remove();
    overlay = document.createElement("div");
    overlay.style.cssText = `
      position: fixed;
      bottom: 24px;
      right: 24px;
      z-index: 2147483647;
      background: ${type === "success" ? "#1a7f37" : type === "warn" ? "#9a6700" : "#1c58a9"};
      color: #fff;
      font-family: system-ui, sans-serif;
      font-size: 14px;
      padding: 12px 18px;
      border-radius: 8px;
      box-shadow: 0 4px 16px rgba(0,0,0,0.25);
      max-width: 340px;
      line-height: 1.4;
    `;
    overlay.textContent = message;
    if (!document.getElementById("pia-style")) {
      const style = document.createElement("style");
      style.id = "pia-style";
      style.textContent = `@keyframes pia-fadein { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }`;
      document.head.appendChild(style);
    }
    document.body.appendChild(overlay);
    setTimeout(() => overlay?.remove(), 4000);
  }

})();
