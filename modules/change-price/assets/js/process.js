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
 * Membaca file excel dan mengembalikan workbook XLSX.
 * @param {File} file
 * @returns {Promise<Object>} workbook
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

    // 1. Ambil data baris dari File A (Sheet pertama)
    const wsA = wbA.Sheets[wbA.SheetNames[0]];
    const rowsA = XLSX.utils.sheet_to_json(wsA, { header: 1, defval: "" });

    // 2. Buat priceMap dari SEMUA sheet di File B
    const priceMap = new Map();
    wbB.SheetNames.forEach((sheetName) => {
      const wsB = wbB.Sheets[sheetName];
      const rowsB = XLSX.utils.sheet_to_json(wsB, { header: 1, defval: "" });
      for (let i = 1; i < rowsB.length; i++) {
        const r = rowsB[i];
        if (!r) continue;
        const article = String(r[2] || "").trim(); // Generic Article (Kolom 3)
        const price = Math.round(Number(r[4])) || 0; // Price (Kolom 5)
        // Simpan harga pertama jika ada duplikat artikel
        if (article && price > 0 && !priceMap.has(article)) {
          priceMap.set(article, price);
        }
      }
    });

    processRows(rowsA, priceMap);
    setTimeout(hideLoading, 300);
  } catch (err) {
    hideLoading();
    console.error(err);
    alert("Gagal membaca file: " + err.message);
  }
}

/**
 * Memproses data baris excel untuk mengelompokkan jumlah qty per SKU dan membandingkan harga.
 * @param {Array} rows     - Array data baris dari excel Stock (File A)
 * @param {Map}   priceMap - Map artikel->hargaBaru dari File B
 */
function processRows(rows, priceMap) {
  const grouped = {};
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;
    const brand    = String(r[0] || "");
    const category = String(r[1] || "");
    const raw      = String(r[4] || "");
    const oldPrice = Math.round(Number(r[6])) || 0;
    const rowQty   = Number(r[7]) || 0;

    if (!raw || rowQty <= 0) continue;

    const variant = extractVariant(raw);
    const artikel = extractArtikel(variant);
    if (!artikel) continue;

    const desc        = extractDesc(raw);
    const oldDiscount = kangodingPrice(oldPrice, category);

    if (!grouped[artikel]) {
      const hasNewPrice = priceMap.has(artikel);
      const newPrice    = hasNewPrice ? priceMap.get(artikel) : "-";
      const newDiscount = hasNewPrice ? kangodingPrice(newPrice, category) : "-";
      const status      = hasNewPrice ? "TRUE" : "FALSE";

      grouped[artikel] = {
        brand,
        category,
        artikel,
        desc,
        status,
        oldPrice,
        newPrice,
        oldDiscount,
        newDiscount,
        qty: 0,
      };
    }
    grouped[artikel].qty += rowQty;
  }
  // saveData ada di filter.js — dipanggil setelah semua data digroup
  saveData(Object.values(grouped));
}
