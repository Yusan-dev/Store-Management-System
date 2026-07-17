/**
 * Menggambar atau me-render baris data ke dalam tabel UI.
 * @param {Array} rows - Array data stok yang telah diproses
 */
function drawTable(rows) {
  const body = document.querySelector("tbody");
  if (!body) return;
  body.innerHTML = "";
  if (!rows.length) {
    body.innerHTML = `<tr><td colspan="10" style="text-align:center;padding:20px;">NO DATA</td></tr>`;
    return;
  }
  rows.forEach((r) => {
    const rowStyle =
      r.status === "TRUE"
        ? 'style="background-color: #d4edda; color: #155724;"'
        : 'style="background-color: #f8d7da; color: #721c24;"';

    const priceLamaStr = Number(r.oldPrice).toLocaleString("id-ID");
    const priceBaruStr =
      r.newPrice !== "-" ? Number(r.newPrice).toLocaleString("id-ID") : "-";

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
        <td>${Number(r.qty).toLocaleString("id-ID")}</td>
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

  const trueRows  = rows.filter((x) => x.status === "TRUE");
  const falseRows = rows.filter((x) => x.status === "FALSE");

  const affectedSku  = trueRows.length;
  const affectedQty  = trueRows.reduce((a, b) => a + (Number(b.qty) || 0), 0);
  const unaffectedSku = falseRows.length;
  const unaffectedQty = falseRows.reduce((a, b) => a + (Number(b.qty) || 0), 0);

  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
  };

  setEl("totalSku",      totalSku.toLocaleString("id-ID"));
  setEl("totalQty",      totalQty.toLocaleString("id-ID"));
  setEl("affectedSku",   `${affectedSku.toLocaleString("id-ID")} SKU`);
  setEl("affectedQty",   `${affectedQty.toLocaleString("id-ID")} PCS`);
  setEl("unaffectedSku", `${unaffectedSku.toLocaleString("id-ID")} SKU`);
  setEl("unaffectedQty", `${unaffectedQty.toLocaleString("id-ID")} PCS`);

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
    const catAffectedSku = catRows.filter((x) => x.status === "TRUE").length;
    const catAffectedQty = catRows
      .filter((x) => x.status === "TRUE")
      .reduce((a, b) => a + (Number(b.qty) || 0), 0);

    dynContainer.insertAdjacentHTML(
      "beforeend",
      `<div class="card">
        <div class="label" style="display:flex; justify-content:space-between; align-items:center;">
          <span>${cat}</span>
          <span style="font-size:10px; background:#00ffff; color:#000; padding:2px 4px; border-radius:4px; font-weight:bold;">AFFECTED</span>
        </div>
        <h2>${catAffectedSku.toLocaleString("id-ID")} SKU</h2>
        <small>${catAffectedQty.toLocaleString("id-ID")} PCS</small>
      </div>`
    );
  });
}
