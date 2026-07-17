/* ========================================
   GT BROKEN SIZE - SORT.JS
   Column sorting for broken size table
   ======================================== */

let bsCurrentSort = null;
let bsCurrentDirection = "asc";

function sortBsTable(key) {
  if (!window.bsFilteredData || !window.bsFilteredData.length) return;

  if (bsCurrentSort === key) {
    bsCurrentDirection = bsCurrentDirection === "asc" ? "desc" : "asc";
  } else {
    bsCurrentSort = key;
    bsCurrentDirection = "asc";
  }

  const sorted = [...window.bsFilteredData].sort((a, b) => {
    let x = a[key];
    let y = b[key];

    if (typeof x === "string") {
      x = x.toUpperCase();
      y = (y || "").toUpperCase();
    }

    x = x ?? "";
    y = y ?? "";

    if (key === "sizeCount" || key === "totalQty") {
      x = Number(x) || 0;
      y = Number(y) || 0;
    }

    if (x > y) return bsCurrentDirection === "asc" ? 1 : -1;
    if (x < y) return bsCurrentDirection === "asc" ? -1 : 1;
    return 0;
  });

  window.bsFilteredData = sorted;
  drawBsTable(sorted);
  updateBsSummary(sorted);
  renderBsSort();
}

function getBsSortedRows(rows) {
  if (!bsCurrentSort) return rows;

  return [...rows].sort((a, b) => {
    let x = a[bsCurrentSort];
    let y = b[bsCurrentSort];

    if (typeof x === "string") {
      x = x.toUpperCase();
      y = (y || "").toUpperCase();
    }

    x = x ?? "";
    y = y ?? "";

    if (bsCurrentSort === "sizeCount" || bsCurrentSort === "totalQty") {
      x = Number(x) || 0;
      y = Number(y) || 0;
    }

    if (x > y) return bsCurrentDirection === "asc" ? 1 : -1;
    if (x < y) return bsCurrentDirection === "asc" ? -1 : 1;
    return 0;
  });
}

function renderBsSort() {
  document.querySelectorAll("#bsTable thead th").forEach((th) => {
    const label = th.dataset.label || th.dataset.key;
    if (!label) return;
    th.innerText = label;
    if (th.dataset.key === bsCurrentSort) {
      th.innerText += bsCurrentDirection === "asc" ? " ↑" : " ↓";
    }
  });
}
