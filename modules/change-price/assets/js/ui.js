/**
 * Menggambar atau me-render baris data ke dalam tabel UI.
 * @param {Array} rows - Array data stok yang telah diproses
 */
function drawTable(rows) {
  const body = document.querySelector("tbody");
  if (!body) return;
  body.innerHTML = "";
  const promoMode = window.cpMode === "promo";
  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="${promoMode ? 7 : 10}" style="text-align:center;padding:20px;">NO DATA</td></tr>`;
    return;
  }
  if (promoMode) {
    rows.forEach((r) => {
      body.insertAdjacentHTML(
        "beforeend",
        `<tr style="${PROMO_STATUS_STYLE[r.status] || ""}">
        <td>${escHtml(r.brand)}</td>
        <td>${escHtml(r.category)}</td>
        <td>${escHtml(r.artikel)}</td>
        <td>${escHtml(r.desc)}</td>
        <td style="font-weight: bold;">${escHtml(r.status)}</td>
        <td>${escHtml(r.remark)}</td>
        <td>${Number(r.qty).toLocaleString("en-US")}</td>
      </tr>`
      );
    });
    return;
  }
  rows.forEach((r) => {
    const rowStyle =
      r.status === "TRUE"
        ? 'style="background-color: #d4edda; color: #155724;"'
        : 'style="background-color: #f8d7da; color: #721c24;"';

    const priceLamaStr = Number(r.oldPrice).toLocaleString("en-US");
    const priceBaruStr =
      r.newPrice !== "-" ? Number(r.newPrice).toLocaleString("en-US") : "-";

    body.insertAdjacentHTML(
      "beforeend",
      `<tr ${rowStyle}>
        <td>${r.brand}</td>
        <td>${r.category}</td>
        <td>${r.artikel}</td>
        <td>${r.desc}</td>
        <td style="font-weight: bold;">${r.status}</td>
        <td>${priceLamaStr}</td>
        <td>${priceBaruStr}</td>
        <td>${r.oldDiscount}</td>
        <td>${r.newDiscount}</td>
        <td>${Number(r.qty).toLocaleString("en-US")}</td>
      </tr>`
    );
  });
}

/**
 * Memperbarui angka ringkasan (summary) total SKU, qty, affected/unaffected, dan kategori di dashboard.
 * @param {Array} rows - Array data stok yang telah diproses
 */
function updateSummary(rows) {
  const totalSku = rows.length;
  const totalQty = rows.reduce((a, b) => a + (Number(b.qty) || 0), 0);

  // Mode PROMO: INCLUDE = kartu pertama, EXCLUDE = kartu kedua, TIDAK TERDAFTAR = kartu ketiga.
  const promoMode = window.cpMode === "promo";
  const okStatus = promoMode ? "INCLUDE" : "TRUE";
  const koStatus = promoMode ? "EXCLUDE" : "FALSE";
  const trueRows  = rows.filter((x) => x.status === okStatus);
  const falseRows = rows.filter((x) => x.status === koStatus);
  const noneRows  = rows.filter((x) => x.status === "TIDAK TERDAFTAR");

  const affectedSku  = trueRows.length;
  const affectedQty  = trueRows.reduce((a, b) => a + (Number(b.qty) || 0), 0);
  const unaffectedSku = falseRows.length;
  const unaffectedQty = falseRows.reduce((a, b) => a + (Number(b.qty) || 0), 0);

  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
  };

  setEl("totalSku",      totalSku.toLocaleString("en-US"));
  setEl("totalQty",      totalQty.toLocaleString("en-US"));
  setEl("affectedSku",   `${affectedSku.toLocaleString("en-US")} SKU`);
  setEl("affectedQty",   `${affectedQty.toLocaleString("en-US")} PCS`);
  setEl("unaffectedSku", `${unaffectedSku.toLocaleString("en-US")} SKU`);
  setEl("unaffectedQty", `${unaffectedQty.toLocaleString("en-US")} PCS`);
  setEl("affectedLabel",   promoMode ? "INCLUDE SKU" : "AFFECTED SKU");
  setEl("unaffectedLabel", promoMode ? "EXCLUDE SKU" : "UNAFFECTED SKU");
  setEl("noneSku", `${noneRows.length.toLocaleString("en-US")} SKU`);
  setEl("noneQty", `${noneRows.reduce((a, b) => a + (Number(b.qty) || 0), 0).toLocaleString("en-US")} PCS`);
  const noneCard = document.getElementById("noneCard");
  if (noneCard) noneCard.style.display = promoMode ? "" : "none";

  // Dynamic Categories
  const dynContainer = document.getElementById("dynamicCategories");
  if (!dynContainer) return;

  const uniqueCats = [
    ...new Set(rows.map((x) => (x.category || "").toUpperCase())),
  ].filter(Boolean).sort();

  dynContainer.innerHTML = "";
  uniqueCats.forEach((cat) => {
    const catRows = rows.filter(
      (x) => (x.category || "").toUpperCase() === cat
    );
    const catAffectedSku = catRows.filter((x) => x.status === okStatus).length;
    const catAffectedQty = catRows
      .filter((x) => x.status === okStatus)
      .reduce((a, b) => a + (Number(b.qty) || 0), 0);

    dynContainer.insertAdjacentHTML(
      "beforeend",
      `<div class="card">
        <div class="label" style="display:flex; justify-content:space-between; align-items:center;">
          <span>${cat}</span>
          <span style="font-size:10px; background:#00ffff; color:#000; padding:2px 4px; border-radius:4px; font-weight:bold;">${promoMode ? "INCLUDE" : "AFFECTED"}</span>
        </div>
        <h2>${catAffectedSku.toLocaleString("en-US")} SKU</h2>
        <small>${catAffectedQty.toLocaleString("en-US")} PCS</small>
      </div>`
    );
  });
}

