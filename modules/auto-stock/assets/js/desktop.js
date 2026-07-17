(function () {
  const storageKey = "gtAutoStock.filterPresets";
  const printableColumns = [
    ["brand", "BRAND"],
    ["category", "CATEGORY"],
    ["artikel", "ARTIKEL"],
    ["desc", "DESCRIPTION"],
    ["price", "PRICE"],
    ["status", "STATUS"],
    ["gender", "GENDER"],
    ["qty", "QTY"],
  ];

  function rows() {
    return Array.isArray(window.filteredData) ? window.filteredData : [];
  }

  function escapeHtml(value) {
    return String(value ?? "")
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }

  function stamp() {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(
      2,
      "0",
    )}-${String(now.getDate()).padStart(2, "0")}`;
  }

  function currentFilterState() {
    const checked = (id) =>
      [...document.querySelectorAll(`#${id} input:checked`)].map(
        (x) => x.value,
      );

    return {
      search: document.getElementById("search")?.value || "",
      price: document.getElementById("price")?.value || "",
      minPrice: document.getElementById("minPrice")?.value || "",
      maxPrice: document.getElementById("maxPrice")?.value || "",
      brand: checked("brand"),
      category: checked("category"),
      gender: checked("gender"),
      status: checked("status"),
    };
  }

  function applyFilterState(state) {
    ["search", "price", "minPrice", "maxPrice"].forEach((id) => {
      const el = document.getElementById(id);
      if (el) el.value = state[id] || "";
    });

    ["brand", "category", "gender", "status"].forEach((id) => {
      const selected = new Set(Array.isArray(state[id]) ? state[id] : []);
      document.querySelectorAll(`#${id} input`).forEach((box) => {
        box.checked = selected.size ? selected.has(box.value) : true;
      });
    });

    if (typeof applyFilter === "function") {
      applyFilter();
    }
  }

  const DB_NAME = "gtAutoStockDB";
  const STORE_NAME = "presets";

  function openDB() {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, 1);
      request.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME, { keyPath: "name" });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  async function getPresets() {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readonly");
      const store = tx.objectStore(STORE_NAME);
      const request = store.getAll();
      request.onsuccess = () => {
        const result = request.result || [];
        result.sort((a, b) => a.name.localeCompare(b.name));
        resolve(result);
      };
      request.onerror = () => reject(request.error);
    });
  }

  async function savePreset(name) {
    const preset = {
      name,
      createdAt: new Date().toISOString(),
      filters: currentFilterState(),
      data: typeof dashboardData !== "undefined" ? dashboardData : [],
    };

    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.put(preset);
      tx.oncomplete = () => resolve({ ok: true });
      tx.onerror = () => resolve({ ok: false, error: tx.error });
    });
  }

  async function deletePreset(name) {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_NAME, "readwrite");
      const store = tx.objectStore(STORE_NAME);
      store.delete(name);
      tx.oncomplete = () => resolve({ ok: true });
      tx.onerror = () => resolve({ ok: false, error: tx.error });
    });
  }

  function buildPrintHtml(data) {
    const totalQty = data.reduce(
      (sum, item) => sum + (Number(item.qty) || 0),
      0,
    );
    const body = data
      .map(
        (item) => `
          <tr>
            ${printableColumns
              .map(([key]) => {
                const value =
                  key === "price" || key === "qty"
                    ? Number(item[key] || 0).toLocaleString()
                    : item[key];
                return `<td>${escapeHtml(value)}</td>`;
              })
              .join("")}
          </tr>`,
      )
      .join("");

    return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="UTF-8">
<title>GT AUTO STOCK</title>
<style>
@page { size: A4 landscape; margin: 10mm; }
* { box-sizing: border-box; }
body { margin: 0; font-family: Arial, sans-serif; color: #111; }
.header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 14px; }
.title { font-size: 22px; font-weight: 800; }
.meta { font-size: 11px; line-height: 1.5; color: #333; text-align: right; }
.summary { display: flex; gap: 18px; font-size: 12px; margin-bottom: 12px; }
.summary strong { font-size: 14px; }
table { width: 100%; border-collapse: collapse; font-size: 9px; }
th { background: #111827; color: #fff; }
th, td { border: 1px solid #d6dbe3; padding: 5px 6px; text-align: left; vertical-align: top; }
td:nth-child(5), td:nth-child(8) { text-align: right; white-space: nowrap; }
tr { break-inside: avoid; }
.footer { margin-top: 12px; text-align: center; color: #555; font-size: 10px; }
</style>
</head>
<body>
<div class="header">
  <div>
    <div class="title">GT AUTO STOCK</div>
    <div>Professional Stock Intelligence Dashboard</div>
  </div>
  <div class="meta">
    Generated: ${escapeHtml(new Date().toLocaleString())}<br>
    Paper: A4 Landscape
  </div>
</div>
<div class="summary">
  <div>SKU<br><strong>${data.length.toLocaleString()}</strong></div>
  <div>QTY<br><strong>${totalQty.toLocaleString()}</strong></div>
</div>
<table>
  <thead>
    <tr>${printableColumns.map(([, label]) => `<th>${label}</th>`).join("")}</tr>
  </thead>
  <tbody>${body}</tbody>
</table>
<div class="footer">KANGODING.ORG © 2026 - GT AUTO STOCK</div>
</body>
</html>`;
  }

  function ensurePrintCenter() {
    let modal = document.getElementById("printCenter");

    if (modal) {
      return modal;
    }

    modal = document.createElement("div");
    modal.id = "printCenter";
    modal.className = "gt-modal hidden";
    modal.innerHTML = `
      <div class="gt-modal-panel">
        <div class="gt-modal-head">
          <div>
            <h3>Print Center</h3>
            <p>A4 Landscape PDF</p>
          </div>
          <button type="button" class="gt-icon-btn" data-close-print>×</button>
        </div>
        <div class="gt-print-stats">
          <div><span>SKU</span><strong data-print-sku>0</strong></div>
          <div><span>QTY</span><strong data-print-qty>0</strong></div>
        </div>
        <label class="gt-field">
          <span>File Name</span>
          <input id="printFileName" type="text">
        </label>
        <div class="gt-modal-actions">
          <button type="button" data-browser-print>PRINT</button>
          <button type="button" data-save-pdf>SAVE PDF</button>
        </div>
      </div>`;
    document.body.appendChild(modal);

    modal.querySelector("[data-close-print]").onclick = () => {
      modal.classList.add("hidden");
    };

    modal.querySelector("[data-browser-print]").onclick = () => {
      if (typeof printPDF === "function") {
        printPDF();
      }
    };

    modal.querySelector("[data-save-pdf]").onclick = async () => {
      const data = rows();

      if (!data.length) {
        alert("Tidak ada data");
        return;
      }

      const fileName =
        document.getElementById("printFileName")?.value ||
        `GT_AUTO_STOCK_${stamp()}.pdf`;
      const html = buildPrintHtml(data);

      if (!window.gtDesktop?.savePdf) {
        const win = window.open("", "_blank");
        win.document.write(html);
        win.document.close();
        setTimeout(() => win.print(), 400);
        return;
      }

      const result = await window.gtDesktop.savePdf({
        html,
        defaultFileName: fileName.endsWith(".pdf")
          ? fileName
          : `${fileName}.pdf`,
      });

      if (result?.ok) {
        alert(`PDF tersimpan:\n${result.filePath}`);
      } else if (!result?.canceled) {
        alert(result?.error || "Gagal menyimpan PDF");
      }
    };

    return modal;
  }

  function openPrintCenter() {
    const data = rows();

    if (!data.length) {
      alert("Tidak ada data");
      return;
    }

    const modal = ensurePrintCenter();
    const qty = data.reduce((sum, item) => sum + (Number(item.qty) || 0), 0);
    modal.querySelector("[data-print-sku]").innerText =
      data.length.toLocaleString();
    modal.querySelector("[data-print-qty]").innerText = qty.toLocaleString();
    modal.querySelector("#printFileName").value =
      `GT_AUTO_STOCK_${stamp()}.pdf`;
    modal.classList.remove("hidden");
  }

  function ensurePresetControls() {
    const filter = document.querySelector(".filter");

    if (!filter || document.getElementById("presetName")) {
      return;
    }

    const box = document.createElement("div");
    box.className = "filter-box preset-box";
    box.innerHTML = `
      <div class="filter-title">PRESET</div>
      <input id="presetName" type="text" placeholder="Preset name">
      <select id="presetList"></select>
      <div class="preset-actions">
        <button type="button" id="savePreset">SAVE</button>
        <button type="button" id="loadPreset">LOAD</button>
        <button type="button" id="deletePreset">DELETE</button>
      </div>`;
    filter.appendChild(box);

    async function refresh() {
      const list = document.getElementById("presetList");
      const presets = await getPresets();
      list.innerHTML = "";
      presets.forEach((preset) => {
        const option = document.createElement("option");
        option.value = preset.name;
        option.innerText = preset.name;
        list.appendChild(option);
      });
    }

    document.getElementById("savePreset").onclick = async () => {
      const name = document.getElementById("presetName").value.trim();

      if (!name) {
        alert("Isi nama preset");
        return;
      }

      const result = await savePreset(name);
      if (!result?.ok) {
        alert(result?.error || "Gagal menyimpan preset");
      }
      await refresh();
    };

    document.getElementById("loadPreset").onclick = async () => {
      const name = document.getElementById("presetList").value;
      const preset = (await getPresets()).find((x) => x.name === name);

      if (preset) {
        if (preset.data && preset.data.length > 0) {
          if (typeof saveData === "function") {
            saveData(preset.data);
          }
        }
        if (preset.filters) {
          applyFilterState(preset.filters);
        }
      }
    };

    document.getElementById("deletePreset").onclick = async () => {
      const name = document.getElementById("presetList").value;

      if (name) {
        await deletePreset(name);
        await refresh();
      }
    };

    refresh();
  }

  window.addEventListener("load", () => {
    const print = document.getElementById("print");
    if (print) {
      print.onclick = openPrintCenter;
    }

    ensurePresetControls();
  });
})();
