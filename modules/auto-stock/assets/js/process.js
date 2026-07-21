function toNum(v) {
  if (typeof v === "number") return v;
  const s = String(v || "").replace(/[Rr][Pp]\s*/g, "").trim();
  if (!s) return 0;
  if (/^\d{1,3}(\.\d{3})+([,]\d+)?$/.test(s)) return Number(s.replace(/\./g, "").replace(",", ".")) || 0;
  if (/^\d{1,3}(,\d{3})+([.]\d+)?$/.test(s)) return Number(s.replace(/,/g, "")) || 0;
  return Number(s.replace(/,/g, "")) || 0;
}
/**
 * Menampilkan loading indicator di UI.
 */
function showLoading() {
  document.getElementById("loading")?.classList.add("show");
}
/**
 * Menyembunyikan loading indicator dari UI.
 */
function hideLoading() {
  document.getElementById("loading")?.classList.remove("show");
}
document.getElementById("process").onclick = runProcess;
/**
 * Menjalankan proses pembacaan file excel dan inisiasi parsing stock.
 */
async function runProcess() {
  showLoading();
  const file = document.getElementById("stock").files[0];
  if (!file) {
    alert("Upload stock dulu");
    return;
  }
  const reader = new FileReader();
  reader.onload = (e) => {
    try {
      const wb = XLSX.read(e.target.result, {
        type: "binary",
      });
      const ws = wb.Sheets[wb.SheetNames[0]];
      const rows = XLSX.utils.sheet_to_json(ws, {
        header: 1,
        defval: "",
      });
      processRows(rows);
      setTimeout(hideLoading, 300);
    } catch (err) {
      hideLoading();
      console.error(err);
      alert("Failed to read file");
    }
  };
  reader.readAsBinaryString(file);
}
/**
 * Memproses data baris excel untuk mengelompokkan jumlah qty per SKU.
 * @param {Array} rows - Array data baris dari excel
 */
function processRows(rows) {
  const grouped = {};
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;
    const brand = String(r[0] || "");
    const category = String(r[1] || "");
    const raw = String(r[4] || "");
    const price = toNum(r[6]);
    const rowQty = toNum(r[7]);
    if (!raw || rowQty <= 0) continue;
    const variant = extractVariant(raw);
    const artikel = extractArtikel(variant);
    if (!artikel) continue;
    const desc = extractDesc(raw);
    const status = kangodingPrice(price, category);
    const gender = detectGender(raw);
    if (!grouped[artikel]) {
      grouped[artikel] = {
        brand,
        category,
        artikel,
        desc,
        price,
        status,
        gender,
        qty: 0,
      };
    }
    grouped[artikel].qty += rowQty;
  }
  const result = Object.values(grouped);
  console.log("ROWS", result.length);
  saveData(result);
}
/**
 * Menggambar atau me-render baris data ke dalam tabel UI.
 * @param {Array} rows - Array data stok yang telah diproses
 */
function drawTable(rows) {
  const body = document.querySelector("tbody");
  if (!body) return;
  body.innerHTML = "";
  if (!rows.length) {
    body.innerHTML = `
<tr>
<td
colspan="8">
NO DATA
</td>
</tr>
`;
    return;
  }
  rows.forEach((r) => {
    body.insertAdjacentHTML(
      "beforeend",
      `
<tr>
<td>
${r.brand}
</td>
<td>
${r.category}
</td>
<td>
${r.artikel}
</td>
<td>
${r.desc}
</td>
<td>
${Number(r.price).toLocaleString()}
</td>
<td>
${r.status}
</td>
<td>
${r.gender}
</td>
<td>
${Number(r.qty).toLocaleString()}
</td>
</tr>
`,
    );
  });
}
/**
 * Memperbarui angka ringkasan (summary) total SKU, qty, gender, dan kategori di dashboard.
 * @param {Array} rows - Array data stok yang telah diproses
 */
function updateSummary(rows) {
  const totalSku = rows.length;
  const totalQty = rows.reduce((a, b) => a + (Number(b.qty) || 0), 0);
  document.getElementById("totalSku").innerText = totalSku.toLocaleString();
  document.getElementById("totalQty").innerText = totalQty.toLocaleString();
  const genders = ["MEN", "WOMEN", "KIDS", "UNISEX"];
  genders.forEach((g) => {
    const sku = rows.filter((x) => x.gender === g).length;
    const qty = rows
      .filter((x) => x.gender === g)
      .reduce((a, b) => a + (Number(b.qty) || 0), 0);
    const skuEl = document.getElementById(g.toLowerCase() + "Sku");
    const qtyEl = document.getElementById(g.toLowerCase() + "Qty");
    if (skuEl) skuEl.innerText = `${sku.toLocaleString()} SKU`;
    if (qtyEl) qtyEl.innerText = `${qty.toLocaleString()} PCS`;
  });
  const uniqueCats = [
    ...new Set(rows.map((x) => (x.category || "").toUpperCase())),
  ].filter((c) => c !== "");
  const dynContainer = document.getElementById("dynamicCategories");
  if (dynContainer) {
    let catHtml = "";
    uniqueCats.forEach((cat) => {
      const catSku = rows.filter(
        (x) => (x.category || "").toUpperCase() === cat,
      ).length;
      const catQty = rows
        .filter((x) => (x.category || "").toUpperCase() === cat)
        .reduce((a, b) => a + (Number(b.qty) || 0), 0);
      catHtml += `
            <div class="card">
                <div class="label">${cat}</div>
                <h2>${catSku.toLocaleString()} SKU</h2>
                <small>${catQty.toLocaleString()} PCS</small>
            </div>
        `;
    });
    dynContainer.innerHTML = catHtml;
  }
}


