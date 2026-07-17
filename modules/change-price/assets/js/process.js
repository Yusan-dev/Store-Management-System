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
 * Membaca file excel dan mengembalikan data json.
 */
function readExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "binary" });
        resolve(wb);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Gagal membaca file"));
    reader.readAsBinaryString(file);
  });
}

/**
 * Menjalankan proses pembacaan file excel stock (A) dan pricelist (B).
 */
async function runProcess() {
  showLoading();
  const fileA = document.getElementById("stock").files[0];
  const fileB = document.getElementById("pricelist").files[0];

  if (!fileA || !fileB) {
    alert("Harap upload File A (Stock Report) dan File B (Price List)");
    hideLoading();
    return;
  }

  try {
    const wbA = await readExcel(fileA);
    const wbB = await readExcel(fileB);

    // 1. Process File A (Stock)
    const wsA = wbA.Sheets[wbA.SheetNames[0]];
    const rowsA = XLSX.utils.sheet_to_json(wsA, { header: 1, defval: "" });

    // 2. Process File B (Price List)
    // Map untuk menyimpan mapping Artikel -> Harga Baru
    const priceMap = new Map();
    wbB.SheetNames.forEach(sheetName => {
      const wsB = wbB.Sheets[sheetName];
      const rowsB = XLSX.utils.sheet_to_json(wsB, { header: 1, defval: "" });
      for (let i = 1; i < rowsB.length; i++) {
        const r = rowsB[i];
        if (!r) continue;
        const article = String(r[2] || "").trim(); // Generic Article (Kolom 3)
        const price = Math.round(Number(r[4])) || 0; // Price (Kolom 5)
        if (article && price > 0) {
          // Jika ada duplikat artikel, biarkan menimpa / ambil yang terakhir (atau bisa juga pakai !priceMap.has(article))
          if (!priceMap.has(article)) {
             priceMap.set(article, price);
          }
        }
      }
    });

    processRows(rowsA, priceMap);
    setTimeout(hideLoading, 300);
  } catch (err) {
    hideLoading();
    console.error(err);
    alert("Gagal membaca file");
  }
}

/**
 * Memproses data baris excel untuk mengelompokkan jumlah qty per SKU dan membandingkan harga.
 * @param {Array} rows - Array data baris dari excel Stock
 * @param {Map} priceMap - Map harga dari file Price List
 */
function processRows(rows, priceMap) {
  const grouped = {};
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;
    const brand = String(r[0] || "");
    const category = String(r[1] || "");
    const raw = String(r[4] || "");
    const oldPrice = Math.round(Number(r[6])) || 0;
    const rowQty = Number(r[7]) || 0;
    
    if (!raw || rowQty <= 0) continue;
    
    const variant = extractVariant(raw);
    const artikel = extractArtikel(variant);
    if (!artikel) continue;
    
    const desc = extractDesc(raw);
    const oldDiscount = kangodingPrice(oldPrice, category);
    
    if (!grouped[artikel]) {
      // Cek apakah artikel ada di priceMap (File B)
      const hasNewPrice = priceMap.has(artikel);
      const newPrice = hasNewPrice ? priceMap.get(artikel) : 0;
      const newDiscount = hasNewPrice ? kangodingPrice(newPrice, category) : "-";
      const status = hasNewPrice ? "TRUE" : "FALSE";
      
      grouped[artikel] = {
        brand,
        category,
        artikel,
        desc,
        status,
        oldPrice,
        newPrice: hasNewPrice ? newPrice : "-",
        oldDiscount,
        newDiscount,
        qty: 0,
      };
    }
    grouped[artikel].qty += rowQty;
  }
  const result = Object.values(grouped);
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
    body.innerHTML = `<tr><td colspan="10">NO DATA</td></tr>`;
    return;
  }
  rows.forEach((r) => {
    // Styling row color based on status
    let trClass = "";
    if (r.status === "TRUE") {
      trClass = 'style="background-color: #d4edda; color: #155724;"';
    } else {
      trClass = 'style="background-color: #f8d7da; color: #721c24;"';
    }

    const priceLamaStr = Number(r.oldPrice).toLocaleString();
    const priceBaruStr = r.newPrice !== "-" ? Number(r.newPrice).toLocaleString() : "-";
    
    body.insertAdjacentHTML(
      "beforeend",
      `<tr ${trClass}>
        <td>${r.brand}</td>
        <td>${r.category}</td>
        <td>${r.artikel}</td>
        <td>${r.desc}</td>
        <td style="font-weight: bold;">${r.status}</td>
        <td>${priceLamaStr}</td>
        <td>${priceBaruStr}</td>
        <td>${r.oldDiscount}</td>
        <td>${r.newDiscount}</td>
        <td>${Number(r.qty).toLocaleString()}</td>
      </tr>`
    );
  });
}

/**
 * Memperbarui angka ringkasan (summary) total SKU, qty, affected SKU, dan kategori di dashboard.
 * @param {Array} rows - Array data stok yang telah diproses
 */
function updateSummary(rows) {
  const totalSku = rows.length;
  const totalQty = rows.reduce((a, b) => a + (Number(b.qty) || 0), 0);
  
  const affectedSku = rows.filter(x => x.status === "TRUE").length;
  const affectedQty = rows.filter(x => x.status === "TRUE").reduce((a, b) => a + (Number(b.qty) || 0), 0);

  const unaffectedSku = rows.filter(x => x.status === "FALSE").length;
  const unaffectedQty = rows.filter(x => x.status === "FALSE").reduce((a, b) => a + (Number(b.qty) || 0), 0);

  document.getElementById("totalSku").innerText = totalSku.toLocaleString();
  document.getElementById("totalQty").innerText = totalQty.toLocaleString();
  
  document.getElementById("affectedSku").innerText = `${affectedSku.toLocaleString()} SKU`;
  document.getElementById("affectedQty").innerText = `${affectedQty.toLocaleString()} PCS`;

  document.getElementById("unaffectedSku").innerText = `${unaffectedSku.toLocaleString()} SKU`;
  document.getElementById("unaffectedQty").innerText = `${unaffectedQty.toLocaleString()} PCS`;

  // Dynamic Categories - affected SKU logic
  const uniqueCats = [...new Set(rows.map((x) => (x.category || "").toUpperCase()))].filter((c) => c !== "");
  const dynContainer = document.getElementById("dynamicCategories");
  
  if (dynContainer) {
    dynContainer.innerHTML = "";
    uniqueCats.forEach((cat) => {
      const catRows = rows.filter((x) => (x.category || "").toUpperCase() === cat);
      // Let's show affected info for each category
      const catAffectedSku = catRows.filter(x => x.status === "TRUE").length;
      const catAffectedQty = catRows.filter(x => x.status === "TRUE").reduce((a, b) => a + (Number(b.qty) || 0), 0);
      
      dynContainer.insertAdjacentHTML(
        "beforeend",
        `<div class="card">
          <div class="label" style="display:flex; justify-content:space-between; align-items:center;">
             <span>${cat}</span>
             <span style="font-size:10px; background:#00ffff; color:#000; padding:2px 4px; border-radius:4px; font-weight:bold;">AFFECTED</span>
          </div>
          <h2>${catAffectedSku.toLocaleString()} SKU</h2>
          <small>${catAffectedQty.toLocaleString()} PCS</small>
        </div>`
      );
    });
  }
}
