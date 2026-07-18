/* ========================================
   SMS BROKEN SIZE - PROCESS.JS
   Logika utama parsing stock & broken size
   ======================================== */

// Global data store
let bsAllData = [];
let bsFilteredData = [];

/**
 * Menampilkan loading indicator di layar.
 */
function showLoading() {
  document.getElementById("loading")?.classList.add("show");
}
/**
 * Menyembunyikan loading indicator dari layar.
 */
function hideLoading() {
  document.getElementById("loading")?.classList.remove("show");
}

/* ---------- PROSES BUTTON ---------- */
document.getElementById("process").onclick = runProcess;

/**
 * Fungsi utama untuk memproses file stock dan menjalankan kalkulasi
 * Broken Size serta Inventory Level.
 */
async function runProcess() {
  showLoading();

  const stockFile = document.getElementById("stock").files[0];

  if (!stockFile) {
    hideLoading();
    alert("Upload file stock dulu!");
    return;
  }

  try {
    // Parse stock file
    const stockData = await readExcel(stockFile);

    // Process broken size
    const result = processBrokenSize(stockData);
    bsAllData = result;

    // Save and render
    bsSaveData(result);

    // Also process IL if MSR files available
    processIL(stockData);

    setTimeout(hideLoading, 300);
  } catch (err) {
    hideLoading();
    console.error(err);
    alert("Failed to read file: " + err.message);
  }
}

/* ---------- READ EXCEL ---------- */
/**
 * Membaca file Excel dan mengubah isinya menjadi array baris.
 * @param {File} file - File Excel yang diunggah
 * @returns {Promise<Array>} Promise yang menghasilkan array data baris
 */
function readExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const wb = XLSX.read(e.target.result, { type: "binary" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: "" });
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsBinaryString(file);
  });
}

/* ---------- EXTRACT VARIANT ---------- */
/**
 * Mengekstrak varian dari deskripsi dengan memotong bagian sebelum tanda slash (/).
 * @param {string} desc - Deskripsi raw dari excel
 * @returns {string} String varian
 */
function extractVariant(desc) {
  if (!desc) return "";
  const s = String(desc);
  const slash = s.indexOf("/");
  if (slash <= 0) return "";
  return s.substring(0, slash).trim();
}

/**
 * Mengekstrak artikel semua brand secara dinamis.
 * PERINGATAN: Jangan merubah fungsi ini.
 * Memotong 6 karakter terakhir dari variant.
 * @param {string} variant - String varian
 * @returns {string} String artikel utama
 */
//jangan pernah ganggu function dibawah ini karena mengekstrak artikel semua brand dengan pintar
function extractArtikel(variant) {
  if (!variant) return "";
  variant = String(variant).trim();

  if (variant.length <= 6) {
    return variant;
  }

  return variant.slice(0, -6);
}

/* ---------- EXTRACT SIZE ---------- */
/**
 * Mengekstrak size / ukuran dari string varian berdasarkan 6 karakter terakhir.
 * @param {string} variant - String varian
 * @returns {string} String ukuran yang terekstrak
 */
function extractSize(variant) {
  if (!variant) return "";

  // Based on the smart extractArtikel, the suffix is the last 6 characters
  const suffix = variant.length > 6 ? variant.slice(-6) : variant;

  // Try to match standard apparel sizes at the end
  const sizeMatch = suffix.match(/(XXXL|XXL|XL|XS|OS|S|M|L)$/i);
  if (sizeMatch) return sizeMatch[1].toUpperCase();

  // Try numeric sizes (footwear): trailing digits possibly with decimal
  const numMatch = suffix.match(/(\d+\.?\d*)$/);
  if (numMatch) return numMatch[1];

  // Fallback: last 1-3 characters
  if (suffix.length >= 1) {
    const last = suffix.slice(-3).replace(/^[0-9]+/, "");
    if (last) return last.toUpperCase();
  }

  return "N/A";
}

/* ---------- EXTRACT DESCRIPTION ---------- */
/**
 * Mengekstrak deskripsi produk dari data raw dengan mengambil bagian setelah tanda slash (/).
 * @param {string} raw - String raw dari excel
 * @returns {string} Deskripsi produk
 */
function extractDesc(raw) {
  if (!raw) return "";
  const slash = raw.indexOf("/");
  if (slash < 0) return raw;
  return raw.substring(slash + 1).trim();
}

/* ---------- EXTRACT DISCOUNT ---------- */
/**
 * Menentukan nilai diskon atau status harga Kangoding (FREEFALL, NORMAL, dll).
 * @param {number|string} price - Harga produk
 * @param {string} category - Kategori produk
 * @returns {string} Teks status diskon
 */
function kangodingPrice(price, category) {
  price = Number(price) || 0;
  category = String(category).toUpperCase();
  if (!price) return "";

  if (category === "FOOTWEAR" && price <= 200000 && price % 1000 === 0)
    return "FREEFALL";
  if (category !== "FOOTWEAR" && price < 25000 && price % 1000 === 0)
    return "FREEFALL";
  if (price % 1000 === 0) return "NORMAL";
  return String(price).slice(-3, -1) + "%";
}

/* ---------- PROCESS BROKEN SIZE ---------- */
/**
 * Memproses baris data stock untuk mengelompokkan artikel dan menghitung Broken Size.
 * @param {Array} rows - Data baris excel
 * @returns {Array} Array hasil kalkulasi Broken Size
 */
function processBrokenSize(rows) {
  // Group by artikel (11 char)
  const grouped = {};

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;

    const brand = String(r[0] || "");
    const category = String(r[1] || "").toUpperCase();
    const raw = String(r[4] || "");
    const price = Number(r[6]) || 0;
    const rowQty = Number(r[7]) || 0;

    if (!raw || rowQty <= 0) continue;

    const variant = extractVariant(raw);
    if (!variant) continue;

    const artikel = extractArtikel(variant);
    if (!artikel) continue;

    const size = extractSize(variant);
    const desc = extractDesc(raw);
    const discount = kangodingPrice(price, category);

    if (!grouped[artikel]) {
      grouped[artikel] = {
        brand,
        category,
        artikel,
        desc,
        discount,
        sizes: new Set(),
        totalQty: 0,
      };
    }

    if (size && size !== "N/A") {
      grouped[artikel].sizes.add(size);
    }
    grouped[artikel].totalQty += rowQty;
  }

  // Convert to array and determine broken status
  const result = Object.values(grouped).map((item) => {
    const sizeCount = item.sizes.size;
    const sizeList = [...item.sizes].sort().join(", ");

    let status;
    if (item.category === "FOOTWEAR" || item.category === "APPAREL") {
      const threshold = item.category === "FOOTWEAR" ? 3 : 2;
      const isBroken = sizeCount <= threshold && sizeCount > 0;
      status = sizeCount === 0 ? "NO SIZE" : isBroken ? "BROKEN" : "NOT BROKEN";
    } else {
      status = "UNCATEGORIZE";
    }

    return {
      brand: item.brand,
      category: item.category,
      artikel: item.artikel,
      desc: item.desc,
      discount: item.discount,
      sizes: sizeList,
      sizeCount: sizeCount,
      status: status,
      totalQty: item.totalQty,
    };
  });

  console.log("BROKEN SIZE ROWS:", result.length);
  return result;
}

/* ---------- DRAW TABLE ---------- */
function drawBsTable(rows) {
  const body = document.querySelector("#bsTable tbody");
  if (!body) return;

  body.innerHTML = "";

  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="9">NO DATA</td></tr>';
    return;
  }

  rows.forEach((r) => {
    const statusClass =
      r.status === "BROKEN"
        ? 'style="color:#FF0000;font-weight:800"'
        : r.status === "NOT BROKEN"
          ? 'style="color:#00AA00;font-weight:800"'
          : r.status === "UNCATEGORIZE"
            ? 'style="color:#888888;font-weight:800"'
            : "";

    body.insertAdjacentHTML(
      "beforeend",
      `
      <tr>
        <td>${r.brand}</td>
        <td>${r.category}</td>
        <td>${r.artikel}</td>
        <td>${r.desc}</td>
        <td>${r.discount}</td>
        <td>${r.sizes}</td>
        <td>${r.sizeCount}</td>
        <td ${statusClass}>${r.status}</td>
        <td>${Number(r.totalQty).toLocaleString()}</td>
      </tr>
    `,
    );
  });
}

/* ---------- UPDATE SUMMARY ---------- */
function updateBsSummary(rows) {
  const total = rows.length;
  const totalQty = rows.reduce((a, b) => a + (Number(b.totalQty) || 0), 0);
  const broken = rows.filter((x) => x.status === "BROKEN").length;
  const notBroken = rows.filter((x) => x.status === "NOT BROKEN").length;

  document.getElementById("bsTotalArtikel").innerText = total.toLocaleString();
  document.getElementById("bsTotalQty").innerText = totalQty.toLocaleString();

  document.getElementById("bsBrokenCount").innerText = broken.toLocaleString();
  document.getElementById("bsBrokenPct").innerText = total
    ? ((broken / total) * 100).toFixed(1) + "%"
    : "0%";

  document.getElementById("bsNotBrokenCount").innerText =
    notBroken.toLocaleString();
  document.getElementById("bsNotBrokenPct").innerText = total
    ? ((notBroken / total) * 100).toFixed(1) + "%"
    : "0%";

  // Apparel broken
  const apparelAll = rows.filter((x) => x.category === "APPAREL");
  const apparelBroken = apparelAll.filter((x) => x.status === "BROKEN").length;
  document.getElementById("bsApparelBroken").innerText =
    apparelBroken.toLocaleString();
  document.getElementById("bsApparelBrokenPct").innerText = apparelAll.length
    ? ((apparelBroken / apparelAll.length) * 100).toFixed(1) +
      "% of " +
      apparelAll.length
    : "0%";

  // Footwear broken
  const footwearAll = rows.filter((x) => x.category === "FOOTWEAR");
  const footwearBroken = footwearAll.filter(
    (x) => x.status === "BROKEN",
  ).length;
  document.getElementById("bsFootwearBroken").innerText =
    footwearBroken.toLocaleString();
  document.getElementById("bsFootwearBrokenPct").innerText = footwearAll.length
    ? ((footwearBroken / footwearAll.length) * 100).toFixed(1) +
      "% of " +
      footwearAll.length
    : "0%";
}


