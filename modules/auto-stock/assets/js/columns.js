// =====================================================
// COLUMN CHOOSER
// Ceklis kolom di header: mengatur kolom yang tampil di
// dashboard, Export Excel, Print, dan Print Center PDF.
// =====================================================

window.GT_COLUMNS = [
  { key: "brand", label: "BRAND" },
  { key: "category", label: "CATEGORY" },
  { key: "artikel", label: "ARTIKEL" },
  { key: "generic", label: "GENERIC ARTICLE" },
  { key: "variant", label: "VARIANT" },
  { key: "desc", label: "DESCRIPTION" },
  { key: "price", label: "PRICE" },
  { key: "status", label: "STATUS" },
  { key: "gender", label: "GENDER" },
  { key: "qty", label: "QTY" },
];

window.gtVisibleCols = new Set(window.GT_COLUMNS.map((c) => c.key));

const GT_COL_STORAGE = "gtAutoStock.visibleColumns";

(function restoreColumns() {
  try {
    const saved = JSON.parse(localStorage.getItem(GT_COL_STORAGE) || "null");
    if (Array.isArray(saved) && saved.length) {
      const valid = saved.filter((k) =>
        window.GT_COLUMNS.some((c) => c.key === k),
      );
      if (valid.length) window.gtVisibleCols = new Set(valid);
    }
  } catch (e) {
    /* abaikan storage rusak -> pakai default semua kolom */
  }
})();

// Helper render: td hanya jika kolomnya tampil
function gtTd(key, content) {
  return window.gtVisibleCols.has(key) ? `<td>${content ?? ""}</td>` : "";
}

// Daftar kolom aktif (dipakai export/print/PDF)
function gtGetVisibleColumnList() {
  return window.GT_COLUMNS.filter((c) => window.gtVisibleCols.has(c.key));
}

function gtApplyColumns() {
  document.querySelectorAll("thead th").forEach((th) => {
    const key = th.dataset.key;
    if (!key) return;
    th.style.display = window.gtVisibleCols.has(key) ? "" : "none";
  });

  document.querySelectorAll("tbody td[colspan]").forEach((td) => {
    td.colSpan = Math.max(window.gtVisibleCols.size, 1);
  });

  if (Array.isArray(window.filteredData) && typeof drawTable === "function") {
    drawTable(window.filteredData);
  }

  try {
    localStorage.setItem(
      GT_COL_STORAGE,
      JSON.stringify([...window.gtVisibleCols]),
    );
  } catch (e) {
    /* storage penuh/blokir -> pilihan tetap aktif untuk sesi ini */
  }
}

function gtBuildColumnChooser() {
  const header = document.querySelector(".content-header");
  if (!header || document.getElementById("columnsToggle")) return;

  const cs = getComputedStyle(header);
  if (cs.position === "static") header.style.position = "relative";

  const wrap = document.createElement("div");
  wrap.style.cssText =
    "position:absolute; right:14px; top:50%; transform:translateY(-50%);";
  wrap.innerHTML = `
    <button id="columnsToggle" type="button" style="background:#111; color:#fff; border:2px solid #111; font-weight:bold; font-family:monospace; padding:6px 14px; cursor:pointer; letter-spacing:1px; font-size:12px;">COLUMNS ▾</button>
    <div id="columnsMenu" style="display:none; position:absolute; right:0; top:calc(100% + 6px); background:#fff; border:2px solid #111; min-width:240px; max-height:70vh; overflow:auto; z-index:9999; box-shadow:6px 6px 0 rgba(0,0,0,0.15); text-align:left;">
      <div style="display:flex; justify-content:space-between; align-items:center; padding:8px 10px; border-bottom:2px solid #111; font-family:monospace; font-size:11px; font-weight:bold;">
        <span>SHOW COLUMNS</span>
        <button id="colsCheckAll" type="button" style="background:#fff; border:2px solid #111; font-family:monospace; font-weight:bold; font-size:11px; padding:2px 10px; cursor:pointer;">ALL</button>
      </div>
      <div id="columnsList"></div>
    </div>`;
  header.appendChild(wrap);

  const menu = wrap.querySelector("#columnsMenu");
  const list = wrap.querySelector("#columnsList");

  list.innerHTML = window.GT_COLUMNS.map(
    (c) => `
    <label style="display:flex; align-items:center; gap:8px; padding:7px 10px; cursor:pointer; font-size:12px; font-weight:bold; font-family:monospace; border-bottom:1px solid #eee;">
      <input type="checkbox" data-col="${c.key}" ${
        window.gtVisibleCols.has(c.key) ? "checked" : ""
      } style="cursor:pointer;">
      ${c.label}
    </label>`,
  ).join("");

  wrap.querySelector("#columnsToggle").onclick = (e) => {
    e.stopPropagation();
    menu.style.display = menu.style.display === "none" ? "block" : "none";
  };

  document.addEventListener("click", (e) => {
    if (!wrap.contains(e.target)) menu.style.display = "none";
  });

  list.querySelectorAll("input[data-col]").forEach((box) => {
    box.addEventListener("change", () => {
      if (!box.checked) {
        const remaining = [
          ...list.querySelectorAll("input[data-col]:checked"),
        ].length;
        if (remaining === 0) {
          alert("Minimal satu kolom harus ditampilkan.");
          box.checked = true;
          return;
        }
      }
      if (box.checked) window.gtVisibleCols.add(box.dataset.col);
      else window.gtVisibleCols.delete(box.dataset.col);
      gtApplyColumns();
    });
  });

  wrap.querySelector("#colsCheckAll").onclick = () => {
    window.GT_COLUMNS.forEach((c) => window.gtVisibleCols.add(c.key));
    list
      .querySelectorAll("input[data-col]")
      .forEach((b) => (b.checked = true));
    gtApplyColumns();
  };

  gtApplyColumns();
}

document.addEventListener("DOMContentLoaded", gtBuildColumnChooser);