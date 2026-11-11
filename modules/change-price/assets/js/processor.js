/**
 * Mengekstrak varian dari deskripsi.
 * Mengambil string sebelum karakter '/' pertama.
 * @param {string} desc - Deskripsi raw dari file
 * @returns {string} String varian yang telah dipotong
 */
function extractVariant(desc) {
  if (!desc) return "";
  const s = String(desc);
  const slash = s.indexOf("/");
  if (slash <= 0) return "";
  return s.substring(0, slash).trim();
}
// function extractArtikel(variant) {
//     if (!variant) return "";
//     // User requested "CCR10001-001" which is exactly 12 characters.
//     return variant.trim().substring(0, 12);
// }
/**
 * Mengekstrak artikel (Generic Article) untuk semua brand.
 *
 * Aturan (dipelajari dari Price List seluruh brand: 27.851 generic article,
 * 59 brand, sheet Sport/Golf, Fashion Footwear, Footwear Xpress, Adidas):
 * - Generic Article selalu diawali kode brand 3 karakter dan panjangnya
 *   7 s.d. 12 karakter (tidak ada yang lebih pendek dari 7 atau lebih panjang dari 12).
 * - Kode varian = Generic Article + 6 karakter terakhir (warna/size, atau "000000"
 *   untuk barang tanpa size). Jadi varian bisa dipotong 6 karakter HANYA jika
 *   panjangnya > 12 (13 s.d. 18).
 * - Kode 12 karakter atau kurang sudah berupa Generic Article itu sendiri; kalau
 *   dipotong 6 karakter hasilnya cuma 1-6 karakter dan banyak artikel berbeda
 *   tergabung jadi satu (contoh: CCR100-15666 -> "CCR100", ADIHT3469 -> "ADI").
 * @param {string} variant - Varian yang telah diekstrak
 * @returns {string} String artikel
 */
const GENERIC_ARTICLE_MAX_LENGTH = 12;
const VARIANT_SUFFIX_LENGTH = 6;
function extractArtikel(variant) {
  if (!variant) return "";
  variant = String(variant).trim();
  // Non-MD (paper bag, box, dll) berkode ZSP.../ZZZ... tanpa akhiran size: artikelnya
  // seluruh karakter sebelum "/" (sama dengan Auto Stock).
  if (/^(ZSP|ZZZ)/i.test(variant)) return variant;
  if (variant.length <= GENERIC_ARTICLE_MAX_LENGTH) {
    return variant;
  }
  return variant.slice(0, -VARIANT_SUFFIX_LENGTH);
}
/**
 * Mengekstrak deskripsi produk dari data mentah.
 * Mengambil string setelah karakter '/' pertama.
 * @param {string} raw - Data mentah deskripsi
 * @returns {string} Deskripsi produk
 */
function extractDesc(raw) {
  if (!raw) return "";
  const slash = raw.indexOf("/");
  if (slash < 0) return raw;
  return raw.substring(slash + 1).trim();
}
/**
 * Menentukan status harga/diskon Kangoding (normal, freefall, atau %).
 * @param {number|string} price - Harga produk
 * @param {string} category - Kategori produk (misal: FOOTWEAR)
 * @returns {string} Status atau persentase diskon
 */
function kangodingPrice(price, category) {
  price = Number(price);
  category = String(category).toUpperCase();
  if (!price) return "";
  // FOOTWEAR
  if (category === "FOOTWEAR" && price <= 200000 && price % 1000 === 0)
    return "freefall";
  // NON FOOTWEAR
  if (category !== "FOOTWEAR" && price < 25000 && price % 1000 === 0)
    return "freefall";
  if (price % 1000 === 0) return "normal";
  return String(price).slice(-3, -1) + "%";
}
/**
 * Mendeteksi gender/divisi dari deskripsi sel.
 * Memeriksa kode khas (REEM, REEW) atau kata kunci (MEN, WOMEN, KIDS).
 * @param {string} cell - Deskripsi dari sel Excel
 * @returns {string} Gender yang terdeteksi (MEN, WOMEN, KIDS, UNISEX, dll)
 */
function detectGender(cell) {
  let txt = String(cell || "")
    .trim()
    .toUpperCase();
  let gender = "";
  if (txt === "") return "UNISEX";
  // 1
  if (txt.includes("REEM")) return "MEN";
  if (txt.includes("REEW")) return "WOMEN";
  if (txt.includes("REEK")) return "KIDS";
  if (txt.includes("REEG")) return "KIDS";
  if (txt.includes("REEB")) return "KIDS";
  if (txt.includes("ZSP")) return "NON-MD";
  if (txt.includes("ZZZ")) return "NON-MD";
  // 2 REEX
  let pos = txt.indexOf("REEX");
  if (pos >= 0) {
    for (let i = pos + 4; i < txt.length; i++) {
      let ch = txt[i];
      if (ch === "M") return "MEN";
      if (ch === "W") return "WOMEN";
      if (ch === "K") return "KIDS";
    }
  }
  // 3
  if (txt.includes("A/M")) gender = "MEN";
  else if (txt.includes("A/W")) gender = "WOMEN";
  else if (txt.includes("A/K")) gender = "KIDS";
  else if (txt.includes("K/")) gender = "KIDS";
  else if (txt.includes("M/")) gender = "MEN";
  else if (txt.includes("W/")) gender = "WOMEN";
  else if (txt.includes("BOY")) gender = "KIDS";
  else if (txt.includes("GIRL")) gender = "KIDS";
  else if (txt.includes("MEN")) gender = "MEN";
  else if (txt.includes("WOMEN")) gender = "WOMEN";
  else if (txt.includes("(M,")) gender = "MEN";
  else if (txt.includes("(W,")) gender = "WOMEN";
  else if (txt.includes("(K,")) gender = "KIDS";
  else if (txt.includes("(M)")) gender = "MEN";
  else if (txt.includes("(W)")) gender = "WOMEN";
  else if (txt.includes("(K)")) gender = "KIDS";
  else if (txt.includes("M)")) gender = "MEN";
  else if (txt.includes("W)")) gender = "WOMEN";
  else if (txt.includes("K)")) gender = "KIDS";
  else if (txt.includes(",M")) gender = "MEN";
  else if (txt.includes(",W")) gender = "WOMEN";
  else if (txt.includes(",K")) gender = "KIDS";
  else if (txt.includes("/M")) gender = "MEN";
  else if (txt.includes("/W")) gender = "WOMEN";
  else if (txt.includes("/K")) gender = "KIDS";
  else if (txt.includes("ZSP")) gender = "NON-MD";
  // 4 warna fallback
  if (gender === "") {
    if (
      txt.includes("PINK") ||
      txt.includes("PURPLE") ||
      txt.includes("MAUVE") ||
      txt.includes("MAGENTA") ||
      txt.includes("BLUE") ||
      txt.includes("YELLOW")
    )
      gender = "WOMEN";
    else if (
      txt.includes("BLACK") ||
      txt.includes("BROWN") ||
      txt.includes("NAVY") ||
      txt.includes("GREY")
    )
      gender = "MEN";
  }
  // 5
  if (gender === "") gender = "UNISEX";
  return gender;
}

