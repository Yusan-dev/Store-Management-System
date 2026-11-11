/* =========================================================
   CHANGE PRICE & PROMO
   Mode PROMO: mencocokkan artikel di Stock Position Report dengan file promo
   (sheet "List Article" = INCLUDE, sheet "List Article Exclude" = EXCLUDE).
   Pencocokan hanya berdasarkan artikel (tanpa harga).
   Status: INCLUDE | EXCLUDE | TIDAK TERDAFTAR
   ========================================================= */

window.cpMode = "price";
const CP_MODE_KEY = "cp_mode";
const PROMO_STATUS_STYLE = {
  INCLUDE: "background-color: #d4edda; color: #155724;",
  EXCLUDE: "background-color: #f8d7da; color: #721c24;",
  "TIDAK TERDAFTAR": "background-color: #e2e3e5; color: #383d41;",
};
const PROMO_HEAD_HTML = `<tr>
  <th>BRAND</th><th>CATEGORY</th><th>ARTIKEL</th><th>DESCRIPTION</th>
  <th>STATUS PROMO</th><th>REMARK</th><th>STOCK QTY</th></tr>`;
let priceHeadHtml = "";

/** Escape teks agar aman ditulis ke HTML. */
function escHtml(s) {
  return String(s == null ? "" : s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/** Kode artikel dinormalkan: spasi/nbsp dibuang, huruf besar. */
function normPromoCode(v) {
  return String(v == null ? "" : v).replace(/ /g, " ").trim().toUpperCase();
}

/** Remark dirapikan (nbsp dan spasi ganda). */
function cleanRemark(v) {
  return String(v == null ? "" : v).replace(/[ \s]+/g, " ").trim();
}

const PROMO_ARTICLE_HEADER = /^gen\.?\s*art(icle)?\.?$/i;

/** True jika workbook terlihat seperti file promo (ada sheet "List Article"). */
function looksLikePromoWorkbook(wb) {
  return (wb.SheetNames || []).some((n) => /list\s*article/i.test(n));
}

/**
 * Mencari baris header sheet promo: kolom Gen.Art / Gen.Article, Brand, Desc, Remarks.
 * @returns {Object|null}
 */
function findPromoHeader(rows) {
  const limit = Math.min(rows.length, 30);
  for (let i = 0; i < limit; i++) {
    const row = rows[i] || [];
    const art = row.findIndex((c) => PROMO_ARTICLE_HEADER.test(String(c || "").trim()));
    if (art >= 0) {
      const find = (re) => row.findIndex((c) => re.test(String(c || "").trim()));
      return {
        headerRow: i,
        art,
        brand: find(/^brand$/i),
        desc: find(/^desc/i),
        remark: find(/^remarks?$/i),
      };
    }
  }
  return null;
}

/** Menambah artikel ke daftar; entri berbentuk varian penuh (>12 karakter) juga diberi alias artikelnya. */
function addPromoEntry(list, art, brand, desc, remark) {
  const key = normPromoCode(art);
  if (!key) return;
  let entry = list.map.get(key);
  if (!entry) {
    entry = { brand, desc, remarks: new Set() };
    list.map.set(key, entry);
    list.count++;
  }
  if (remark) entry.remarks.add(remark);
  if (key.length > GENERIC_ARTICLE_MAX_LENGTH && !/^(ZSP|ZZZ)/.test(key)) {
    const suffix = key.slice(-VARIANT_SUFFIX_LENGTH);
    const generic = key.slice(0, -VARIANT_SUFFIX_LENGTH);
    if (/^[0-9A-Z]{6}$/.test(suffix) && generic.length >= 7 && !list.map.has(generic)) {
      list.map.set(generic, entry);
    }
  }
}

/**
 * Membaca file promo. Sheet yang tidak punya kolom Gen.Art (user, brand, store) diabaikan.
 * Sheet exclude dikenali dari namanya ("Exclude") atau adanya kolom Remarks.
 * Baris header yang berulang di tengah data dilewati; duplikat digabung (remark digabung).
 * @param {Object} wb - Workbook XLSX
 * @returns {{include:Object, exclude:Object}}
 */
function parsePromoWorkbook(wb) {
  const include = { map: new Map(), count: 0 };
  const exclude = { map: new Map(), count: 0 };

  wb.SheetNames.forEach((name) => {
    const rows = XLSX.utils.sheet_to_json(wb.Sheets[name], { header: 1, defval: "" });
    const h = findPromoHeader(rows);
    if (!h) return;

    const isExclude =
      /exclu|exception/i.test(name) || (h.remark >= 0 && !/includ/i.test(name));
    const target = isExclude ? exclude : include;

    for (let i = h.headerRow + 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r) continue;
      const art = String(r[h.art] == null ? "" : r[h.art]).trim();
      if (!art || PROMO_ARTICLE_HEADER.test(art)) continue;
      addPromoEntry(
        target,
        art,
        h.brand >= 0 ? String(r[h.brand] || "").trim() : "",
        h.desc >= 0 ? String(r[h.desc] || "").trim() : "",
        isExclude && h.remark >= 0 ? cleanRemark(r[h.remark]) : "",
      );
    }
  });

  return { include, exclude };
}

/**
 * Mencocokkan satu varian stok ke daftar promo. Dicoba bentuk artikel lalu bentuk varian penuh;
 * EXCLUDE diperiksa lebih dulu sehingga menang jika suatu artikel ada di dua daftar.
 * @returns {{status:string, remark:string}|null}
 */
function matchPromo(variant, artikel, lists) {
  const keys = [normPromoCode(artikel), normPromoCode(variant)];
  for (const k of keys) {
    const e = lists.exclude.map.get(k);
    if (e) return { status: "EXCLUDE", remark: [...e.remarks].join(" | ") };
  }
  for (const k of keys) {
    if (lists.include.map.has(k)) return { status: "INCLUDE", remark: "" };
  }
  return null;
}

/**
 * Mengelompokkan stok per artikel (semua size jadi satu) dan menentukan status promo.
 * Non-MD ikut ditampilkan (status TIDAK TERDAFTAR).
 */
function processPromoRows(rows, lists) {
  const grouped = {};
  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;
    const brand = String(r[0] || "");
    const category = String(r[1] || "");
    const raw = String(r[4] || "");
    const rowQty = toNum(r[7]);
    if (!raw || rowQty <= 0) continue;

    const variant = extractVariant(raw);
    const artikel = extractArtikel(variant);
    if (!artikel) continue;

    let g = grouped[artikel];
    if (!g) {
      g = grouped[artikel] = {
        brand,
        category,
        artikel,
        desc: extractDesc(raw),
        status: "TIDAK TERDAFTAR",
        remark: "",
        oldPrice: 0,
        newPrice: "-",
        oldDiscount: "-",
        newDiscount: "-",
        qty: 0,
      };
    }
    if (g.status === "TIDAK TERDAFTAR") {
      const m = matchPromo(variant, artikel, lists);
      if (m) {
        g.status = m.status;
        g.remark = m.remark;
      }
    }
    g.qty += rowQty;
  }
  return Object.values(grouped);
}

/** Proses mode PROMO: stok (File A) + file promo (File B). */
async function runPromoProcess() {
  showLoading();
  const fileA = document.getElementById("stock").files[0];
  const fileB = document.getElementById("pricelist").files[0];

  if (!fileA || !fileB) {
    alert("Please upload Stock Position Report dan File Promo");
    hideLoading();
    return;
  }

  try {
    const wbA = await readExcel(fileA);
    const wbB = await readExcel(fileB);
    const lists = parsePromoWorkbook(wbB);

    if (lists.include.count === 0 && lists.exclude.count === 0) {
      hideLoading();
      alert(
        "File ini bukan file promo: sheet 'List Article' / 'List Article Exclude' dengan kolom Gen.Art tidak ditemukan.",
      );
      return;
    }

    const rowsA = XLSX.utils.sheet_to_json(wbA.Sheets[wbA.SheetNames[0]], {
      header: 1,
      defval: "",
    });

    const titleContainer = document.getElementById("priceListMeta");
    const t1 = document.getElementById("plTitle1");
    const t2 = document.getElementById("plTitle2");
    if (titleContainer && t1 && t2) {
      t1.innerText = "FILE PROMO: " + fileB.name;
      t2.innerText = `LIST INCLUDE ${lists.include.count.toLocaleString("en-US")} ARTIKEL · LIST EXCLUDE ${lists.exclude.count.toLocaleString("en-US")} ARTIKEL`;
      titleContainer.style.display = "block";
    }

    saveData(processPromoRows(rowsA, lists));
    setTimeout(hideLoading, 300);
  } catch (err) {
    hideLoading();
    console.error(err);
    alert("Failed to read file: " + err.message);
  }
}

/** Mengosongkan tabel dan ringkasan (saat ganti mode). */
function resetCpView() {
  dashboardData = [];
  window.filteredData = [];
  buildAll();
  drawTable([]);
  updateSummary([]);
  const meta = document.getElementById("priceListMeta");
  if (meta) meta.style.display = "none";
}

/**
 * Mengganti mode tampilan: "price" (Change Price) atau "promo" (Promo).
 * @param {string} mode
 * @param {boolean} clear - kosongkan data dan file price list/promo (aksi user)
 */
function setCpMode(mode, clear) {
  window.cpMode = mode === "promo" ? "promo" : "price";
  const promo = window.cpMode === "promo";

  const on = "background:#FACC15;color:#111;";
  const off = "background:#fff;color:#111;";
  const bp = document.getElementById("modePrice");
  const bm = document.getElementById("modePromo");
  if (bp) bp.style.cssText += promo ? off : on;
  if (bm) bm.style.cssText += promo ? on : off;

  const lbl = document.getElementById("pricelistLabel");
  if (lbl) lbl.innerText = promo ? "UPLOAD FILE PROMO" : "UPLOAD FILE PRICE LIST";

  const head = document.querySelector(".table-container thead");
  if (head) {
    if (!priceHeadHtml) priceHeadHtml = head.innerHTML;
    head.innerHTML = promo ? PROMO_HEAD_HTML : priceHeadHtml;
  }

  const discBox = document.getElementById("discountBox");
  if (discBox) discBox.style.display = promo ? "none" : "";
  document.querySelectorAll('#sortSelect option[value^="newDiscount"]').forEach((o) => {
    o.hidden = promo;
    o.disabled = promo;
  });
  const sort = document.getElementById("sortSelect");
  if (sort && promo && sort.value.startsWith("newDiscount")) sort.value = "qty-desc";

  const h1 = document.getElementById("pageTitle");
  if (h1) h1.innerText = promo ? "CHANGE PRICE & PROMO · PROMO" : "CHANGE PRICE & PROMO · PRICE";

  if (clear) {
    const pl = document.getElementById("pricelist");
    if (pl) pl.value = "";
    resetCpView();
  }
}

document.addEventListener("DOMContentLoaded", () => {
  let saved = "price";
  try {
    saved = localStorage.getItem(CP_MODE_KEY) || "price";
  } catch (e) {}
  setCpMode(saved, false);

  document.getElementById("modePrice")?.addEventListener("click", () => setCpMode("price", true));
  document.getElementById("modePromo")?.addEventListener("click", () => setCpMode("promo", true));

  // Mode disimpan saat file price list/promo dipilih, supaya cocok dengan file yang tersimpan di cache.
  document.getElementById("pricelist")?.addEventListener("change", () => {
    try {
      localStorage.setItem(CP_MODE_KEY, window.cpMode);
    } catch (e) {}
  });
});

/* ---------- EXPORT & PRINT (mode PROMO) ---------- */

function promoRowStyle(status) {
  return PROMO_STATUS_STYLE[status] || "";
}

async function exportPromo(rows) {
  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const generatedAt = now.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });

  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
    <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>SMS PROMO</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
    <style>
        .title { font-size: 20px; font-weight: bold; background-color: #00ffff; }
        .meta { font-style: italic; }
        .th-bg { background-color: #00ffff; font-weight: bold; border: 1pt solid #000; text-align: center; }
        .td-border { border: 1pt solid #000; }
        table { border-collapse: collapse; font-family: sans-serif; }
    </style>
    </head>
    <body>
    <table>
        <tr><td colspan="7" class="title">KANGODING.ORG - SMS PROMO</td></tr>
        <tr><td colspan="7" class="meta">GENERATED: ${escHtml(generatedAt)}</td></tr>
        <tr></tr>
        <tr>
            <th class="th-bg">BRAND</th><th class="th-bg">CATEGORY</th><th class="th-bg">ARTIKEL</th>
            <th class="th-bg">DESCRIPTION</th><th class="th-bg">STATUS PROMO</th>
            <th class="th-bg">REMARK</th><th class="th-bg">STOCK QTY</th>
        </tr>`;

  rows.forEach((x) => {
    html += `<tr style="${promoRowStyle(x.status)}">
            <td class="td-border">${escHtml(x.brand)}</td>
            <td class="td-border">${escHtml(x.category)}</td>
            <td class="td-border">${escHtml(x.artikel)}</td>
            <td class="td-border">${escHtml(x.desc)}</td>
            <td class="td-border" style="font-weight: bold;">${escHtml(x.status)}</td>
            <td class="td-border">${escHtml(x.remark)}</td>
            <td class="td-border">${Number(x.qty) || 0}</td>
        </tr>`;
  });
  html += `</table></body></html>`;

  await saveFile(html, `PROMO_${stamp}.xls`);
}

function printPromo(rows) {
  const generatedAt = new Date().toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
  let html = `
    <html><head><title>Print - Promo</title>
    <style>
        body { font-family: sans-serif; margin: 20px; }
        h2 { text-align: center; margin-bottom: 5px; }
        p.meta { text-align: center; font-style: italic; color: #555; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #000; padding: 6px; text-align: left; }
        th { background-color: #00ffff; }
        @media print { tr, th { -webkit-print-color-adjust: exact; color-adjust: exact; } }
    </style></head><body>
        <h2>KANGODING.ORG - SMS PROMO</h2>
        <p class="meta">GENERATED: ${escHtml(generatedAt)}</p>
        <table><thead><tr>
            <th>BRAND</th><th>CATEGORY</th><th>ARTIKEL</th><th>DESCRIPTION</th>
            <th>STATUS PROMO</th><th>REMARK</th><th>STOCK QTY</th>
        </tr></thead><tbody>`;
  rows.forEach((x) => {
    html += `<tr style="${promoRowStyle(x.status)}">
            <td>${escHtml(x.brand)}</td><td>${escHtml(x.category)}</td><td>${escHtml(x.artikel)}</td>
            <td>${escHtml(x.desc)}</td><td style="font-weight: bold;">${escHtml(x.status)}</td>
            <td>${escHtml(x.remark)}</td><td>${Number(x.qty) || 0}</td></tr>`;
  });
  html += `</tbody></table>
        <script>window.onload = () => { window.print(); }<\/script>
    </body></html>`;
  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
}
