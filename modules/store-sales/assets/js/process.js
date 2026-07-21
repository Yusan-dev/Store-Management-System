// =====================================================
// LICENSE UI FUNCTIONS
// =====================================================
function formatLicenseDate(freeLimit) {
  if (!freeLimit) return "-";
  const date = new Date(freeLimit.year, freeLimit.month - 1, freeLimit.day);
  return date
    .toLocaleDateString("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    })
    .toUpperCase();
}

function updateLicenseStatusUI() {
  const status = GTRuntime.getStatus();
  const card = document.getElementById("licenseStatusCard");
  const planElement = document.getElementById("licensePlan");
  const userIdElement = document.getElementById("licenseUserId");
  const infoElement = document.getElementById("licenseAccessInfo");
  if (!card) return;
  card.dataset.plan = status.plan || "NONE";
  card.dataset.authority = status.authority || "NONE";
  if (userIdElement) userIdElement.innerText = status.userId || "-";

  if (status.plan === "VIP_LORD") {
    if (planElement) planElement.innerText = "👑 VIP LORD";
    if (infoElement)
      infoElement.innerText = `${status.accountName || "KANGODING.ORG"} • ${status.authority || "SOVEREIGN"} • PERMANENT ACCESS`;
    return;
  }
  if (status.plan === "VIP_LIFETIME") {
    if (planElement) planElement.innerText = "◆ VIP LIFETIME";
    if (infoElement)
      infoElement.innerText = `${status.accountName || "VIP MEMBER"} • PERMANENT ACCESS • NO EXPIRATION`;
    return;
  }
  if (status.plan === "FREE_ACCESS") {
    if (planElement) planElement.innerText = "FREE ACCESS";
    if (infoElement) {
      infoElement.innerText = "";
    }return;
  }
  if (status.plan === "FREE_EXPIRED") {
    if (planElement) planElement.innerText = "ACCESS EXPIRED";
    if (infoElement) infoElement.innerText = "VIP LIFETIME ACCESS REQUIRED";
    return;
  }
  if (planElement) planElement.innerText = "NOT AUTHORIZED";
  if (infoElement)
    infoElement.innerText = "PROCESS DAILY CASH TO VERIFY ACCESS";
}

// =====================================================

const files = {
  msr: null,
  target: null,
  dailyCash: null,
  advOrd: null,
  salesLy: null,
};

const LY_STORAGE_KEY = "gt_store_ly_data";

function registerFileInput(id, labelId, fileKey) {
  const input = document.getElementById(id);
  const label = document.getElementById(labelId);
  if (!input || !label) return;

  input.addEventListener("change", (e) => {
    if (e.target.files.length > 0) {
      files[fileKey] = e.target.files[0];
      label.innerText = e.target.files[0].name;
      label.style.color = "#FF00FF";
    } else {
      files[fileKey] = null;
      label.innerText = "Belum dipilih";
      label.style.color = "inherit";
    }
  });
}

document.addEventListener("DOMContentLoaded", () => {
  registerFileInput("msr", "msrName", "msr");
  registerFileInput("target", "targetName", "target");
  registerFileInput("dailyCash", "dailyCashName", "dailyCash");
  registerFileInput("advOrd", "advOrdName", "advOrd");
  registerFileInput("salesLy", "salesLyName", "salesLy");
  document.getElementById("salesLy").addEventListener("change", () => {
    localStorage.removeItem(LY_STORAGE_KEY);
  });

  const inputs = ["targetStore", "targetUPT", "targetATV", "targetAUR"];
  inputs.forEach((id) => {
    const el = document.getElementById(id);
    if (el) {
      const saved = localStorage.getItem("gt_store_" + id);
      if (saved) el.value = saved;
      el.addEventListener("change", (e) => {
        localStorage.setItem("gt_store_" + id, e.target.value);
      });
    }
  });

  const savedTargetData = localStorage.getItem("gt_store_target_data");
  if (savedTargetData) {
    const lbl = document.getElementById("targetName");
    if (lbl) {
      lbl.innerText = "Target Saved in Memory";
      lbl.style.color = "#FF00FF";
    }
  }

  // Auto-load LY data from localStorage
  const savedLyData = localStorage.getItem(LY_STORAGE_KEY);
  if (savedLyData) {
    try {
      window.storeDataLY = JSON.parse(savedLyData);
      const lbl = document.getElementById("salesLyName");
      if (lbl) {
        lbl.innerText = "LY Data Loaded from Cache";
        lbl.style.color = "#FF00FF";
      }
    } catch (e) {
      localStorage.removeItem(LY_STORAGE_KEY);
    }
  }

  document.getElementById("process").onclick = async () => {
    if (!files.msr) {
      alert("Upload Merchandise Sales Report (MSR)");
      return;
    }

    let targetData = null;
    if (!files.target) {
      const saved = localStorage.getItem("gt_store_target_data");
      if (saved) {
        targetData = JSON.parse(saved);
      } else {
        alert("Upload Target Harian");
        return;
      }
    }

    if (!files.dailyCash) {
      alert("Upload Daily Cash Collection");
      return;
    }
    if (!files.advOrd) {
      alert("Upload Salesperson / Advance Order");
      return;
    }

    // Removed targetUPT, targetATV, targetAUR validation

    try {
      const loading = document.getElementById("loading");
      if (loading) loading.classList.add("show");

      const msrData = await readExcel(files.msr);

      if (files.target) {
        targetData = await readExcel(files.target);
        localStorage.setItem(
          "gt_store_target_data",
          JSON.stringify(targetData),
        );
      }

      const dailyCashData = await readExcel(files.dailyCash);
      const advOrdData = await readExcel(files.advOrd);

      window.storeData = parseAllData(
        msrData,
        targetData,
        dailyCashData,
        advOrdData
      );

      if (files.salesLy) {
        const salesLyData = await readExcel(files.salesLy);
        window.storeDataLY = parseLYTemplate(salesLyData);
        localStorage.setItem(LY_STORAGE_KEY, JSON.stringify(window.storeDataLY));
      } else {
        const cachedLy = localStorage.getItem(LY_STORAGE_KEY);
        if (cachedLy) {
          window.storeDataLY = JSON.parse(cachedLy);
        } else {
          window.storeDataLY = null;
        }
      }

      buildDateDropdowns();
      renderDashboard(
        "ALL",
        null,
        null
      );

      if (loading) {
        setTimeout(() => loading.classList.remove("show"), 300);
      }
    } catch (err) {
      console.error(err);
      alert("Error processing data: " + err.message);
      const loading = document.getElementById("loading");
      if (loading) loading.classList.remove("show");
    }
  };

  // Report Control listeners
  const reRender = () => {
    const rawFrom = document.getElementById("performanceDateFrom").value;
    const rawTo = document.getElementById("performanceDateTo").value;
    
    // convert YYYY-MM-DD to DD-MM-YYYY
    const dFrom = rawFrom ? rawFrom.split("-").reverse().join("-") : "";
    const dTo = rawTo ? rawTo.split("-").reverse().join("-") : "";
    
    const mode = dFrom && dTo ? "CUSTOM" : "ALL";
    
    const discEls = document.querySelectorAll(".disc-filter:checked");
    const activeDisc = new Set([...discEls].map(x => x.value));
    
    const catEls = document.querySelectorAll(".cat-filter:checked");
    const activeCat = new Set([...catEls].map(x => x.value));

    renderDashboard(
      mode,
      dFrom,
      dTo,
      activeDisc,
      activeCat,
    );
  };
  const periodSel = document.getElementById("performanceTimePeriod");
  if (periodSel) {
    periodSel.addEventListener("change", (e) => {
      const p = e.target.value;
      if (!p || !window.storeData) return;
      
      const available = Object.keys(window.storeData.dates).sort((a, b) => {
         const pa = a.split("-"); const pb = b.split("-");
         return new Date(pa[2], pa[1]-1, pa[0]) - new Date(pb[2], pb[1]-1, pb[0]);
      });
      if (available.length === 0) return;
      
      const maxDateStr = window.storeData.maxActualDateStr || available[available.length - 1];
      const parts = maxDateStr.split("-");
      const maxDate = new Date(parts[2], parts[1]-1, parts[0]);
      
      let fromDateObj, toDateObj;
      if (p === "today") {
          fromDateObj = new Date(maxDate); toDateObj = new Date(maxDate);
      } else if (p === "yesterday") {
          fromDateObj = new Date(maxDate); fromDateObj.setDate(fromDateObj.getDate() - 1); toDateObj = new Date(fromDateObj);
      } else if (p === "this_week") {
          let day = maxDate.getDay();
          if (day === 0) day = 7; 
          fromDateObj = new Date(maxDate); fromDateObj.setDate(maxDate.getDate() - day + 1); 
          toDateObj = new Date(fromDateObj); toDateObj.setDate(fromDateObj.getDate() + 6);
      } else if (p === "last_week") {
          let day = maxDate.getDay();
          if (day === 0) day = 7; 
          fromDateObj = new Date(maxDate); fromDateObj.setDate(maxDate.getDate() - day - 6);
          toDateObj = new Date(fromDateObj); toDateObj.setDate(fromDateObj.getDate() + 6);
      } else if (p === "this_month") {
          fromDateObj = new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);
          toDateObj = new Date(maxDate.getFullYear(), maxDate.getMonth() + 1, 0);
      } else if (p === "last_month") {
          fromDateObj = new Date(maxDate.getFullYear(), maxDate.getMonth() - 1, 1);
          toDateObj = new Date(maxDate.getFullYear(), maxDate.getMonth(), 0);
      } else if (p === "this_quarter") {
          const q = Math.floor(maxDate.getMonth() / 3);
          fromDateObj = new Date(maxDate.getFullYear(), q * 3, 1);
          toDateObj = new Date(maxDate.getFullYear(), q * 3 + 3, 0);
      } else if (p === "this_semester") {
          const s = Math.floor(maxDate.getMonth() / 6);
          fromDateObj = new Date(maxDate.getFullYear(), s * 6, 1);
          toDateObj = new Date(maxDate.getFullYear(), s * 6 + 6, 0);
      } else if (p === "this_year") {
          fromDateObj = new Date(maxDate.getFullYear(), 0, 1);
          toDateObj = new Date(maxDate.getFullYear(), 11, 31);
      }
      
      const toHtmlStr = (d) => `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const fHtmlStr = toHtmlStr(fromDateObj);
      const tHtmlStr = toHtmlStr(toDateObj);
      
      const selFrom = document.getElementById("performanceDateFrom");
      const selTo = document.getElementById("performanceDateTo");
      if (selFrom) selFrom.value = fHtmlStr;
      if (selTo) selTo.value = tHtmlStr;
      
      const compSel = document.getElementById("performanceCompareTo");
      if (compSel) {
          const isLongPeriod = ["this_quarter", "this_semester", "this_year"].includes(p);
          const isMonthOrLong = ["this_month", "last_month", "this_quarter", "this_semester", "this_year"].includes(p);
          for (let i = 0; i < compSel.options.length; i++) {
              const opt = compSel.options[i];
              if (opt.value === "lw") {
                  opt.disabled = isMonthOrLong;
                  opt.style.color = isMonthOrLong ? "#ccc" : "";
              } else if (opt.value === "lm") {
                  opt.disabled = isLongPeriod;
                  opt.style.color = isLongPeriod ? "#ccc" : "";
              }
          }
          if (isMonthOrLong && compSel.value === "lw") {
              compSel.value = "ly";
          }
          if (isLongPeriod && compSel.value === "lm") {
              compSel.value = "ly";
          }
      }

      reRender();
    });
  }

  const compareToSel = document.getElementById("performanceCompareTo");
  if (compareToSel) compareToSel.addEventListener("change", reRender);

  window.reRender = reRender;

  const applyBtn = document.getElementById("applyPerformanceDateRange");
  if (applyBtn) applyBtn.addEventListener("click", reRender);

  const resetBtn = document.getElementById("resetPerformanceDateRange");
  if (resetBtn)
    resetBtn.addEventListener("click", () => {
      document.getElementById("performanceDateFrom").value = "";
      document.getElementById("performanceDateTo").value = "";
      
      const discEls = document.querySelectorAll(".disc-filter:checked");
      const activeDisc = new Set([...discEls].map(x => x.value));
      
      const catEls = document.querySelectorAll(".cat-filter:checked");
      const activeCat = new Set([...catEls].map(x => x.value));

      renderDashboard("ALL", null, null, activeDisc, activeCat);
    });

  // Checkbox listeners are attached directly after rendering categories or in HTML for discount
  document.querySelectorAll(".disc-filter").forEach(el => el.addEventListener("change", window.reRender));
});

const readExcel = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = window.XLSX.read(data, { type: "array" });
        let allRows = [];
        workbook.SheetNames.forEach(sheetName => {
          const rows = window.XLSX.utils.sheet_to_json(
            workbook.Sheets[sheetName],
            { header: 1 }
          );
          allRows = allRows.concat(rows);
        });
        resolve(allRows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

function parseDate(rawDate) {
  if (!rawDate) return "";
  let str = String(rawDate).trim();
  
  if (!isNaN(str) && Number(str) > 20000 && Number(str) < 100000) {
    const date = new Date((Number(str) - (25567 + 1)) * 86400 * 1000);
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  }
  
  // Deteksi format YYYYMMDD string rapat tanpa pemisah (contoh: 20250101)
  if (!isNaN(str) && str.length === 8 && Number(str) > 20000000) {
    const y = str.substring(0, 4);
    const m = str.substring(4, 6);
    const d = str.substring(6, 8);
    return `${d}-${m}-${y}`;
  }
  
  if (str.includes(" ")) str = str.split(" ")[0];
  str = str.replace(/[\/\.]/g, "-");
  
  const monthNames = {
    jan:"01", feb:"02", mar:"03", apr:"04", may:"05", mei:"05", jun:"06",
    jul:"07", aug:"08", agt:"08", sep:"09", oct:"10", okt:"10", nov:"11", dec:"12", des:"12"
  };

  const parts = str.split("-");
  if (parts.length === 3) {
    let p0 = parts[0], p1 = parts[1], p2 = parts[2];
    
    if (isNaN(p1)) {
       const mStr = p1.substring(0,3).toLowerCase();
       if (monthNames[mStr]) p1 = monthNames[mStr];
    }
    if (isNaN(p0)) {
       const mStr = p0.substring(0,3).toLowerCase();
       if (monthNames[mStr]) p0 = monthNames[mStr];
    }
    
    if (p0.length === 4) {
      return `${p2.padStart(2, "0")}-${p1.padStart(2, "0")}-${p0}`;
    }
    
    // Asumsi ekstrim jika ternyata formatnya YY-MM-DD atau YY/MM/DD (Misal: 25/01/31)
    // p0 = 25 (Tahun), p1 = 01 (Bulan), p2 = 31 (Tanggal)
    if (p0.length === 2 && parseInt(p0, 10) >= 24 && parseInt(p0, 10) <= 30) {
        if (parseInt(p1, 10) <= 12 && parseInt(p2, 10) <= 31) {
            // Karena p0 adalah 24-30 (tahun masuk akal untuk sistem 2024-2030), dan p1 adalah bulan valid, kita asumsikan YY-MM-DD
            return `${p2.padStart(2, "0")}-${p1.padStart(2, "0")}-20${p0}`;
        }
    }
    
    let y = p2;
    if (y.length === 2) {
       y = "20" + y;
    }
    
    let d = parseInt(p0, 10);
    let m = parseInt(p1, 10);
    
    if (d > 12 && m <= 12) {
      return `${p0.padStart(2, "0")}-${p1.padStart(2, "0")}-${y}`;
    } else if (d <= 12 && m > 12) {
      return `${p1.padStart(2, "0")}-${p0.padStart(2, "0")}-${y}`;
    } else {
      return `${p0.padStart(2, "0")}-${p1.padStart(2, "0")}-${y}`;
    }
  }

  return "";
}

// =============================================
// PRICE TYPE DETECTOR (dari logika auto stock)
// =============================================
function gesttechPrice(price, division) {
  price = Number(price);
  if (!price || isNaN(price)) return "unknown";

  const isFW =
    division.includes("FOOTWEAR") ||
    division.includes("SHOES") ||
    division.includes("SEPATU");

  // FREEFALL FOOTWEAR: harga <= 200,000 dan habis bagi 1000
  if (isFW && price <= 200000 && price % 1000 === 0) return "freefall";

  // FREEFALL NON-FOOTWEAR: harga < 25,000 dan habis bagi 1000
  if (!isFW && price < 25000 && price % 1000 === 0) return "freefall";

  // NORMAL: habis bagi 1000
  if (price % 1000 === 0) return "normal";

  // DISCOUNT XX%: ambil 2 digit sebelum digit terakhir
  return String(price).slice(-3, -1) + "%";
}

function getCatKey(division) {
  const d = division.toUpperCase();
  if (d.includes("ACC") || d.includes("ACCESSORIES")) return "ACC";
  if (d.includes("BAG") || d.includes("TAS")) return "BAG";
  if (d.includes("SHOES") || d.includes("FOOTWEAR")) return "FTW";
  if (d.includes("APP") || d.includes("APPAREL") || d.includes("CLOTHING"))
    return "APP";
  return "OTHER";
}

function dateToComparable(val) {
  if (!val) return null;
  const p = val.split("-");
  if (p.length !== 3) return null;
  return parseInt(p[2] + p[1] + p[0], 10);
}

function parseAllData(
  msrData,
  targetData,
  dailyCashData,
  advOrdData
) {
  const parseRupiah = (val) => {
    if (typeof val === "number") return val;
    const str = String(val || "").replace(/[Rr][Pp]\s*/g, "").trim();
    if (!str) return 0;
    const hasDotThousands = /^\d{1,3}(\.\d{3})+([,]\d+)?$/.test(str);
    const hasCommaThousands = /^\d{1,3}(,\d{3})+([.]\d+)?$/.test(str);
    if (hasDotThousands) return Number(str.replace(/\./g, "").replace(",", ".")) || 0;
    if (hasCommaThousands) return Number(str.replace(/,/g, "")) || 0;
    return Number(str.replace(/[^\d.-]/g, "")) || 0;
  };
  const dataByDate = {};
  let o2oInvoices = {};
  const targetMap = {};

  // 1. Parse Target
  for (let i = 1; i < targetData.length; i++) {
    const row = targetData[i];
    if (row && row[0]) {
      const dayStr = String(row[0]).trim();
      // Gunakan Kolom C (row[2]) untuk target persentase harian, atau fallback ke row[1]
      let rawPct = row[2] !== undefined ? row[2] : row[1];
      let pct = typeof rawPct === "number" ? rawPct : parseFloat(String(rawPct || "").replace(",", ".").replace(/[^0-9.\-]/g, "")) || 0;
      // If the percentage is written as a number > 1 (e.g. 3.5 instead of 0.035), divide by 100
      if (pct > 1) pct = pct / 100;
      targetMap[dayStr] = pct;
    }
  }

  // 2. Parse MSR
  for (let i = 0; i < msrData.length; i++) {
    const row = msrData[i];
    if (!row || row.length < 5) continue;

    // Exclude paperbag
    const rawArticle = String(row[5] || "")
      .trim()
      .toUpperCase();
    if (
      rawArticle.startsWith("ZSP") ||
      rawArticle.startsWith("ZZZ") ||
      rawArticle.startsWith("NON")
    )
      continue;

    const division = String(row[1] || "")
      .trim()
      .toUpperCase();
    if (
      !division ||
      division.startsWith("TOTAL") ||
      division.startsWith("GRAND") ||
      division === "PRODUCT DIVISION" ||
      division === "NON-MD" ||
      division === "NON MD"
    )
      continue;

    const rawDate = row[4];
    if (!rawDate) continue;

    const date = parseDate(rawDate);
    if (!date) continue;

    if (!dataByDate[date]) {
      const dayNum = parseInt(date.split("-")[0], 10);
      dataByDate[date] = {
        sales: 0,
        qty: 0,
        sm: 0,
        o2oSales: 0,
        o2oSM: 0,
        o2oQty: 0,
        targetPercent: targetMap[String(dayNum)] || 0,
        dayOfMonth: dayNum,
        articles: {},
        dynamicCats: {}, // Format: { "APP": { qty: 0, sales: 0 }, "BAG": ... }
        catSM: {},       // Format: { "APP": new Set(), "BAG": new Set() }
      };
    }

    const qty = Math.round(parseRupiah(row[6]));
    const netAmt = parseRupiah(row[8]);
    const article = String(row[5] || "").trim();

    dataByDate[date].sales += netAmt;
    dataByDate[date].qty += qty;

    // Determine the dynamic category key (e.g. "HARDGOODS", "ACC", etc)
    let catKey = division;
    if (division.includes("ACC") || division.includes("ACCESSORIES")) catKey = "ACC";
    else if (division.includes("BAG") || division.includes("TAS")) catKey = "BAG";
    else if (division.includes("SHOES") || division.includes("FOOTWEAR")) catKey = "FTW";
    else if (division.includes("APP") || division.includes("APPAREL") || division.includes("CLOTHING")) catKey = "APP";
    // We map known names to shorthand for backward compatibility, but any new ones like "HARDGOODS" will just stay "HARDGOODS"

    if (!dataByDate[date].dynamicCats[catKey]) {
      dataByDate[date].dynamicCats[catKey] = { qty: 0, sales: 0 };
    }
    if (!dataByDate[date].catSM[catKey]) {
      dataByDate[date].catSM[catKey] = new Set();
    }

    dataByDate[date].dynamicCats[catKey].qty += qty;
    dataByDate[date].dynamicCats[catKey].sales += netAmt;

    // *** DISCOUNT DETECTION FROM MSR ***
    if (qty > 0) {
      const discountAmt = parseRupiah(row[7]);
      const total = discountAmt + netAmt;
      const hargaAsli = Math.round(total / qty);
      let priceType = "normal";

      if (hargaAsli > 0) {
        const last4 = hargaAsli % 10000;
        const last3 = hargaAsli % 1000;

        if (last4 === 0) {
          priceType = "FREEFALL";
        } else if (last3 === 100) {
          priceType = "DISCOUNT 10%";
        } else if (last3 === 200) {
          priceType = "DISCOUNT 20%";
        } else if (last3 === 300) {
          priceType = "DISCOUNT 30%";
        } else if (last3 === 400) {
          priceType = "DISCOUNT 40%";
        } else if (last3 === 500) {
          priceType = "DISCOUNT 50%";
        } else if (last3 === 600) {
          priceType = "DISCOUNT 60%";
        } else if (last3 === 700) {
          priceType = "DISCOUNT 70%";
        } else if (last3 === 800) {
          priceType = "DISCOUNT 80%";
        } else if (last3 === 900) {
          priceType = "DISCOUNT 90%";
        } else {
          priceType = "normal";
        }
      }

      const catKey = getCatKey(division);
      const productDivision = String(row[3] || "UNKNOWN").trim().toUpperCase();

      if (!dataByDate[date].discountData) dataByDate[date].discountData = {};
      if (!dataByDate[date].discountData[catKey])
        dataByDate[date].discountData[catKey] = {};
      if (!dataByDate[date].discountData[catKey][productDivision])
        dataByDate[date].discountData[catKey][productDivision] = {};
      if (!dataByDate[date].discountData[catKey][productDivision][priceType]) {
        dataByDate[date].discountData[catKey][productDivision][priceType] = { qty: 0, sales: 0 };
      }
      dataByDate[date].discountData[catKey][productDivision][priceType].qty += qty;
      dataByDate[date].discountData[catKey][productDivision][priceType].sales += netAmt;
    }

    if (article) {
      if (!dataByDate[date].articles[article]) {
        dataByDate[date].articles[article] = {
          qty: 0,
          sales: 0,
          division: division,
        };
      }
      dataByDate[date].articles[article].qty += qty;
      dataByDate[date].articles[article].sales += netAmt;
    }
  }

  // 3. Parse Daily Cash
  let currentDate = "";
  // smSet per date: Set of unique sale invoice numbers
  const smSets = {};
  for (let i = 0; i < dailyCashData.length; i++) {
    const row = dailyCashData[i];
    if (!row) continue;

    const firstCell = String(row[0] || "").trim();
    const possibleDate = parseDate(firstCell);
    if (possibleDate) {
      currentDate = possibleDate;
      continue;
    }

    if (!currentDate || !dataByDate[currentDate]) continue;

    const counter = parseInt(row[0], 10);
    const invoice = String(row[1] || "").trim();
    const sales = parseRupiah(row[2]);

    if (!/^\d{6,}$/.test(invoice)) continue; // harus angka 6+
    if (!invoice.startsWith("100")) continue; // hanya struk PENJUALAN (bukan return)

    if (!smSets[currentDate]) smSets[currentDate] = new Set();
    smSets[currentDate].add(invoice);
    dataByDate[currentDate].sm = smSets[currentDate].size;

    if (counter === 99) {
      dataByDate[currentDate].o2oSales += sales;
      dataByDate[currentDate].o2oSM += 1;
      const invId = String(row[1] || "").trim(); // Fix: row[1] is Invoice Number
      if (invId) o2oInvoices[invId] = currentDate;
    }
  }

  // 4. Parse Advance Order (Salesperson Wise) to get o2oQty and Category SM
  let currentAdvDate = "";
  let currentArticle = "";
  for (let i = 0; i < advOrdData.length; i++) {
    const row = advOrdData[i];
    if (!row) continue;
    const firstCell = String(row[0] || "").trim();
    
    let isAdvDate = false;
    if (firstCell.includes("-") || firstCell.includes("/") || firstCell.includes(".")) {
      isAdvDate = true;
    } else if (!isNaN(firstCell) && Number(firstCell) > 20000 && !row[1]) {
      isAdvDate = true;
    }

    if (isAdvDate) {
      const possibleDate = parseDate(firstCell);
      if (possibleDate) {
        currentAdvDate = possibleDate;
        continue;
      }
    }

    // Track current article
    if (
      row.length === 2 &&
      typeof row[1] === "string" &&
      /[A-Z0-9]{5,}/.test(row[1])
    ) {
      currentArticle = row[1].trim();
      continue;
    }

    const parseNumStr = (val) => {
      if (typeof val === "number") return val;
      const str = String(val || "").replace(/[Rr][Pp]\s*/g, "").trim();
      if (!str) return 0;
      const hasDotThousands = /^\d{1,3}(\.\d{3})+([,]\d+)?$/.test(str);
      const hasCommaThousands = /^\d{1,3}(,\d{3})+([.]\d+)?$/.test(str);
      if (hasDotThousands) return Number(str.replace(/\./g, "").replace(",", ".")) || 0;
      if (hasCommaThousands) return Number(str.replace(/,/g, "")) || 0;
      return Number(str.replace(/[^\d.-]/g, "")) || 0;
    };
    const unitPrice = parseNumStr(row[0]);
    const invoice = String(row[1] || "").trim();
    const sales = parseNumStr(row[2]);

    if (!invoice || !/^\d{6,}$/.test(invoice)) continue;

    // Process O2O
    if (o2oInvoices[invoice]) {
      let qty = Math.round(sales / unitPrice);
      if (qty === 0 || isNaN(qty) || !isFinite(qty)) qty = sales < 0 ? -1 : 1;

      const date = o2oInvoices[invoice];
      if (dataByDate[date]) {
        dataByDate[date].o2oQty = (dataByDate[date].o2oQty || 0) + qty;
      }
    }

    // Process Category SM
    if (currentAdvDate && dataByDate[currentAdvDate] && currentArticle) {
      const artData = dataByDate[currentAdvDate].articles[currentArticle];
      if (artData) {
        const catKey = getCatKey(artData.division);
        if (
          dataByDate[currentAdvDate].catSM &&
          dataByDate[currentAdvDate].catSM[catKey]
        ) {
          dataByDate[currentAdvDate].catSM[catKey].add(invoice);
        }
      }
    }
  }

  // Get actual max date before extrapolation
  const actualDates = Object.keys(dataByDate).sort((a, b) => {
    const pa = a.split("-"); const pb = b.split("-");
    return new Date(pa[2], pa[1]-1, pa[0]) - new Date(pb[2], pb[1]-1, pb[0]);
  });
  const maxActualDateStr = actualDates.length > 0 ? actualDates[actualDates.length - 1] : "";

  // Extrapolate all days for the months present
  const monthsPresent = new Set();
  for (const date in dataByDate) {
    const parts = date.split("-");
    if (parts.length === 3) monthsPresent.add(`${parts[1]}-${parts[2]}`);
  }
  
  monthsPresent.forEach(my => {
    const [mStr, yStr] = my.split("-");
    const m = parseInt(mStr, 10);
    const y = parseInt(yStr, 10);
    const daysInMonth = new Date(y, m, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      const dateStr = `${String(i).padStart(2, '0')}-${mStr}-${yStr}`;
      if (!dataByDate[dateStr]) {
        dataByDate[dateStr] = {
          dayOfMonth: i,
          sales: 0,
          qty: 0,
          sm: 0,
          o2oSales: 0,
          o2oQty: 0,
          o2oSM: 0,
          discountData: {},
          articles: {},
          catSM: {},
        };
      }
    }
  });

  for (const date in dataByDate) {
    const dom = String(dataByDate[date].dayOfMonth);
    dataByDate[date].targetPercent = targetMap[dom] || 0;
  }

  // Extract global unique categories
  const allCategories = new Set();
  for (const date in dataByDate) {
    for (const cat in dataByDate[date].dynamicCats) {
      allCategories.add(cat);
    }
  }

  return {
    dates: dataByDate,
    targetMap: targetMap,
    maxActualDateStr: maxActualDateStr,
    categories: Array.from(allCategories).sort()
  };
}

function buildDateDropdowns() {
  const dates = Object.keys(window.storeData.dates).sort(
    (a, b) => dateToComparable(a) - dateToComparable(b),
  ); // Ascending

  const selFrom = document.getElementById("performanceDateFrom");
  const selTo = document.getElementById("performanceDateTo");
  
  if (dates.length > 0) {
      const minDate = dates[0];
      const maxDate = dates[dates.length - 1];
      const formatHtmlDate = (d) => {
          const p = d.split("-"); return `${p[2]}-${p[1]}-${p[0]}`;
      };
      const minHtml = formatHtmlDate(minDate);
      const maxHtml = formatHtmlDate(maxDate);
      
      if (selFrom) {
          selFrom.disabled = false;
          selFrom.min = minHtml;
          selFrom.max = maxHtml;
      }
      if (selTo) {
          selTo.disabled = false;
          selTo.min = minHtml;
          selTo.max = maxHtml;
      }
  }
}

function getPreviousWeekDate(dateStr) {
  const parts = dateStr.split("-");
  const d = new Date(parts[2], parts[1] - 1, parts[0]);
  d.setDate(d.getDate() - 7);
  const dd = String(d.getDate()).padStart(2, "0");
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const yy = d.getFullYear();
  return `${dd}-${mm}-${yy}`;
}

function renderDashboard(
  mode,
  fromD,
  toD,
  discFilter = "ALL",
  catFilter = "ALL",
) {
  if (!window.storeData) return;

  const dates = Object.keys(window.storeData.dates).sort(
    (a, b) => dateToComparable(a) - dateToComparable(b),
  );
  
  if (dates.length === 0) return;

  // Determine days in month from the first available date
  const parts = dates[0].split("-");
  const dataMonth = parseInt(parts[1], 10);
  const dataYear = parseInt(parts[2], 10);
  const daysInMonth = new Date(dataYear, dataMonth, 0).getDate();

  let selectedDates = [];
  let displayDates = [];

  if (mode === "ALL") {
    selectedDates = dates;
    const titleEl = document.getElementById("summaryStoreTitle");
    if (titleEl) {
      const dtStr =
        dates.length > 0
          ? dates[0] + " TO " + dates[dates.length - 1]
          : "ALL DATES";
      titleEl.innerText = "SUMMARY SALES STORE: " + dtStr;
    }
    const statusEl = document.getElementById("performanceFilterStatus");
    if (statusEl) statusEl.innerText = "ALL PERIOD";
    const infoEl = document.getElementById("performanceFilterInfo");
    if (infoEl) infoEl.innerText = "CURRENT SUMMARY • ALL AVAILABLE DATES";

    // Create array of all dates in this month
    for (let i = 1; i <= daysInMonth; i++) {
      const dStr = String(i).padStart(2, "0") + "-" + String(dataMonth).padStart(2, "0") + "-" + dataYear;
      displayDates.push(dStr);
    }

  } else if (mode === "CUSTOM") {
    const cFrom = dateToComparable(fromD);
    const cTo = dateToComparable(toD);
    if (!cFrom && !cTo) {
      renderDashboard("ALL", null, null, discFilter, catFilter);
      return;
    }

    selectedDates = dates.filter((d) => {
      const cur = dateToComparable(d);
      if (cFrom && cur < cFrom) return false;
      if (cTo && cur > cTo) return false;
      return true;
    });

    displayDates = selectedDates;

    const titleEl = document.getElementById("summaryStoreTitle");
    if (titleEl)
      titleEl.innerText = "SUMMARY SALES STORE: " + fromD + " TO " + toD;
    const statusEl = document.getElementById("performanceFilterStatus");
    if (statusEl) statusEl.innerText = "CUSTOM PERIOD";
    const infoEl = document.getElementById("performanceFilterInfo");
    if (infoEl)
      infoEl.innerText = `CURRENT SUMMARY • ${fromD || "..."} TO ${toD || "..."}`;
  }

  let totalSales = 0,
    totalQty = 0,
    totalSM = 0,
    totalTargetSales = 0;
  const formatMoney = (val) => "Rp&nbsp;" + Math.round(val).toLocaleString("id-ID");
  const formatNumber = (val) => Math.round(val).toLocaleString("id-ID");
  const formatDec = (val) => val.toFixed(2);

  const cyTargets = JSON.parse(localStorage.getItem("gt_store_targets_cy") || "{}");
  const lyTargets = JSON.parse(localStorage.getItem("gt_store_targets_ly") || "{}");
  
  let targetUPT = 0;
  let targetATV = 0;
  let targetAUR = 0;
  if (selectedDates.length > 0) {
    const lastDate = selectedDates[selectedDates.length - 1];
    const parts = lastDate.split("-");
    if (parts.length === 3) {
      const monthData = cyTargets[parseInt(parts[1], 10)] || {};
      targetUPT = monthData.upt || 0;
      targetATV = monthData.atv || 0;
      targetAUR = monthData.aur || 0;
    }
  }

  const targetMap = window.storeData ? (window.storeData.targetMap || {}) : {};
  const categories = window.storeData ? (window.storeData.categories || []) : [];

  const dynamicCatTotals = {};
  categories.forEach(cat => {
    dynamicCatTotals[cat] = { qty: 0, sales: 0, sm: 0 };
  });

  // Inject table headers and update colspan
  const tableHeaderRow = document.getElementById("tableHeaderRow");
  if (tableHeaderRow) {
    let thHtml = `
      <th style="padding:8px; text-align:left;">DATE</th>
      <th style="padding:8px; text-align:right;">TARGET</th>
      <th style="padding:8px; text-align:right;">SALES</th>
      <th style="padding:8px; text-align:right;">SM</th>
      <th style="padding:8px; text-align:right;">QTY</th>
      <th style="padding:8px; text-align:right;">UPT</th>
      <th style="padding:8px; text-align:right;">ATV</th>
      <th style="padding:8px; text-align:right;">AUR</th>
    `;
    categories.forEach(cat => {
      thHtml += `<th style="padding:8px; text-align:right;">${cat}</th>`;
    });
    thHtml += `<th style="padding:8px; text-align:right;">O2O</th>`;
    tableHeaderRow.innerHTML = thHtml;
    
    const emptyRowCell = document.getElementById("emptyRowCell");
    if (emptyRowCell) {
        emptyRowCell.setAttribute("colspan", 9 + categories.length);
    }
  }

  // Generate Filter Checkboxes Options
  const categoryCheckboxes = document.getElementById("categoryCheckboxes");
  if (categoryCheckboxes) {
    let optHtml = ``;
    categories.forEach(cat => {
      optHtml += `<label><input type="checkbox" value="${cat}" checked class="cat-filter"> ${cat}</label>`;
    });
    categoryCheckboxes.innerHTML = optHtml;
    document.querySelectorAll(".cat-filter").forEach(el => el.addEventListener("change", window.reRender));
  }

  const discountCheckboxes = document.getElementById("discountCheckboxes");
  if (discountCheckboxes) {
    let allDiscTypes = new Set();
    Object.values(window.storeData.dates).forEach(dateObj => {
        if (dateObj.discountData) {
            Object.values(dateObj.discountData).forEach(catObj => {
                Object.keys(catObj).forEach(divOrPtype => {
                    if (catObj[divOrPtype].qty !== undefined) {
                        allDiscTypes.add(divOrPtype);
                    } else {
                        Object.keys(catObj[divOrPtype]).forEach(ptype => allDiscTypes.add(ptype));
                    }
                });
            });
        }
    });
    
    // Sort price types
    const sortedDiscTypes = Array.from(allDiscTypes).sort((a, b) => {
      const order = (t) => {
        if (t === "normal") return 0;
        if (t === "FREEFALL") return 99;
        return parseInt(t) || 50;
      };
      return order(a) - order(b);
    });

    let optHtml = ``;
    sortedDiscTypes.forEach(disc => {
      const label = disc === "normal" ? "NORMAL" : disc === "FREEFALL" ? "FREEFALL" : disc.toUpperCase();
      optHtml += `<label><input type="checkbox" value="${disc}" checked class="disc-filter"> ${label}</label>`;
    });
    discountCheckboxes.innerHTML = optHtml;
    document.querySelectorAll(".disc-filter").forEach(el => el.addEventListener("change", window.reRender));
  }
  let totalO2OSales = 0,
    totalO2OSM = 0,
    totalO2OQty = 0;
  let articleAgg = {};



  const compareTo = document.getElementById("performanceCompareTo") ? document.getElementById("performanceCompareTo").value : "ly";
  const maxActualNum = (window.storeData && window.storeData.maxActualDateStr) ? dateToComparable(window.storeData.maxActualDateStr) : 99999999;

  let htmlRows = "";
  let maxIncludedDay = 0;
  let fullPeriodTargetSales = 0;

  displayDates.forEach((d) => {
    const data = window.storeData.dates[d];
    const parts = d.split("-");
    const monthNum = parts.length === 3 ? parseInt(parts[1], 10) : 0;
    
    // Load dynamic daily target map for this specific month
    const savedDaily = JSON.parse(localStorage.getItem("gt_store_daily_targets_cy") || "{}");
    const monthDailyInfo = savedDaily[monthNum] || {};
    const monthTargetMap = monthDailyInfo.targetMap || {};
    
    const dayStr = String(parseInt(parts[0], 10));
    const dailyPct = monthTargetMap[dayStr] !== undefined ? monthTargetMap[dayStr] : (targetMap[dayStr] || 0);
    
    let rawTargetStore = 0;
    if (parts.length === 3) {
      const monthData = cyTargets[monthNum] || {};
      rawTargetStore = monthData.sales || 0;
    }
    const dailyTarget = Math.round(rawTargetStore * dailyPct);

    if (selectedDates.includes(d)) {
      fullPeriodTargetSales += dailyTarget;
      if (dateToComparable(d) <= maxActualNum) {
        totalTargetSales += dailyTarget;
        const currentDay = parseInt(d.split("-")[0], 10);
        if (currentDay > maxIncludedDay) maxIncludedDay = currentDay;
      }
    }

    let compData = null;
    let compLabelStr = "LY";
    if (compareTo === "ly" && window.storeDataLY) {
      const p = d.split("-");
      if (p.length === 3) {
        const lyDate = `${p[0]}-${p[1]}-${parseInt(p[2], 10) - 1}`;
        compData = window.storeDataLY.dates[lyDate];
        compLabelStr = "LY";
      }
    } else if (compareTo === "lm" && window.storeData) {
      const p = d.split("-");
      if (p.length === 3) {
        let m = parseInt(p[1], 10) - 1;
        let y = parseInt(p[2], 10);
        if (m === 0) { m = 12; y -= 1; }
        const lmDate = `${p[0]}-${String(m).padStart(2, '0')}-${y}`;
        compData = window.storeData.dates[lmDate];
        compLabelStr = "LM";
      }
    } else if (compareTo === "lw" && window.storeData) {
      const lwDate = getPreviousWeekDate(d);
      compData = window.storeData.dates[lwDate];
      compLabelStr = "LW";
    }

    if (data && selectedDates.includes(d)) {
      totalSales += data.sales;
      totalQty += data.qty;
      totalSM += data.sm;
      totalO2OSales += data.o2oSales || 0;
      totalO2OSM += data.o2oSM || 0;
      totalO2OQty += data.o2oQty || 0;

      categories.forEach(cat => {
        if (data.dynamicCats && data.dynamicCats[cat]) {
            dynamicCatTotals[cat].qty += data.dynamicCats[cat].qty || 0;
            dynamicCatTotals[cat].sales += data.dynamicCats[cat].sales || 0;
        }
        if (data.catSM && data.catSM[cat]) {
            dynamicCatTotals[cat].sm += data.catSM[cat].size || 0;
        }
      });

      // aggregate articles
      for (const art in data.articles) {
        if (!articleAgg[art])
          articleAgg[art] = {
            qty: 0,
            sales: 0,
            division: data.articles[art].division,
          };
        articleAgg[art].qty += data.articles[art].qty;
        articleAgg[art].sales += data.articles[art].sales;
      }

      const dUPT = data.sm > 0 ? data.qty / data.sm : 0;
      const dAUR = data.qty > 0 ? data.sales / data.qty : 0;
      const dATV = data.sm > 0 ? data.sales / data.sm : 0;

      const cSales = data.sales >= dailyTarget ? "#16a34a" : "#dc2626";
      const cUPT = dUPT >= targetUPT ? "#16a34a" : "#dc2626";
      const cATV = dATV >= targetATV ? "#16a34a" : "#dc2626";
      const cAUR = dAUR >= targetAUR ? "#16a34a" : "#dc2626";

      let catTds = "";
      categories.forEach(cat => {
        const catQty = data.dynamicCats && data.dynamicCats[cat] ? data.dynamicCats[cat].qty : 0;
        const compCatQty = compData && compData.dynamicCats && compData.dynamicCats[cat] ? compData.dynamicCats[cat].qty : 0;
        const compStr = compareTo !== "none" ? `<br><span style="font-size:10px; color:#888; font-weight:normal;">(${compLabelStr}: ${formatNumber(compCatQty)})</span>` : "";
        catTds += `<td>${formatNumber(catQty)}${compStr}</td>`;
      });

      htmlRows += `
              <tr>
                  <td>${d}</td>
                  <td>${formatMoney(dailyTarget)}</td>
                  <td style="color:${cSales}; font-weight:600;">
                    ${formatMoney(data.sales)}
                    ${compareTo !== "none" ? `<br><span style="font-size:10px; color:#888; font-weight:normal;">(${compLabelStr}: ${compData ? formatMoney(compData.sales || 0) : "Rp 0"})</span>` : ""}
                  </td>
                  <td>
                    ${formatNumber(data.sm)}
                    ${compareTo !== "none" ? `<br><span style="font-size:10px; color:#888; font-weight:normal;">(${compLabelStr}: ${compData ? formatNumber(compData.sm || 0) : "0"})</span>` : ""}
                  </td>
                  <td>
                    ${formatNumber(data.qty)}
                    ${compareTo !== "none" ? `<br><span style="font-size:10px; color:#888; font-weight:normal;">(${compLabelStr}: ${compData ? formatNumber(compData.qty || 0) : "0"})</span>` : ""}
                  </td>
                  <td style="color:${cUPT}; font-weight:600;">
                    ${formatDec(dUPT)}
                    ${compareTo !== "none" ? `<br><span style="font-size:10px; color:#888; font-weight:normal;">(${compLabelStr}: ${compData ? formatDec((compData.sm > 0 ? compData.qty / compData.sm : 0)) : "0.00"})</span>` : ""}
                  </td>
                  <td style="color:${cATV}; font-weight:600;">
                    ${formatMoney(dATV)}
                    ${compareTo !== "none" ? `<br><span style="font-size:10px; color:#888; font-weight:normal;">(${compLabelStr}: ${compData ? formatMoney((compData.sm > 0 ? compData.sales / compData.sm : 0)) : "Rp 0"})</span>` : ""}
                  </td>
                  <td style="color:${cAUR}; font-weight:600;">
                    ${formatMoney(dAUR)}
                    ${compareTo !== "none" ? `<br><span style="font-size:10px; color:#888; font-weight:normal;">(${compLabelStr}: ${compData ? formatMoney((compData.qty > 0 ? compData.sales / compData.qty : 0)) : "Rp 0"})</span>` : ""}
                  </td>
                  ${catTds}
                  <td>
                    ${formatMoney(data.o2oSales)}
                    ${compareTo !== "none" ? `<br><span style="font-size:10px; color:#888; font-weight:normal;">(${compLabelStr}: ${compData ? formatMoney(compData.o2oSales || 0) : "Rp 0"})</span>` : ""}
                  </td>
              </tr>
          `;
    } else {
      // Row is generated but no sales data yet
      let catEmptyTds = "";
      categories.forEach(cat => { 
        const compCatQty = compData && compData.dynamicCats && compData.dynamicCats[cat] ? compData.dynamicCats[cat].qty : 0;
        const compStr = compareTo !== "none" ? `<br><span style="font-size:10px; color:#888; font-weight:normal;">(${compLabelStr}: ${formatNumber(compCatQty)})</span>` : "";
        catEmptyTds += `<td>- ${compStr}</td>`; 
      });

      htmlRows += `
              <tr>
                  <td>${d}</td>
                  <td>${formatMoney(dailyTarget)}</td>
                  <td>- ${compareTo !== "none" ? `<br><span style="font-size:10px; color:#888; font-weight:normal;">(${compLabelStr}: ${compData ? formatMoney(compData.sales || 0) : "Rp 0"})</span>` : ""}</td>
                  <td>- ${compareTo !== "none" ? `<br><span style="font-size:10px; color:#888; font-weight:normal;">(${compLabelStr}: ${compData ? formatNumber(compData.sm || 0) : "0"})</span>` : ""}</td>
                  <td>- ${compareTo !== "none" ? `<br><span style="font-size:10px; color:#888; font-weight:normal;">(${compLabelStr}: ${compData ? formatNumber(compData.qty || 0) : "0"})</span>` : ""}</td>
                  <td>- ${compareTo !== "none" ? `<br><span style="font-size:10px; color:#888; font-weight:normal;">(${compLabelStr}: ${compData ? formatDec((compData.sm > 0 ? compData.qty / compData.sm : 0)) : "0.00"})</span>` : ""}</td>
                  <td>- ${compareTo !== "none" ? `<br><span style="font-size:10px; color:#888; font-weight:normal;">(${compLabelStr}: ${compData ? formatMoney((compData.sm > 0 ? compData.sales / compData.sm : 0)) : "Rp 0"})</span>` : ""}</td>
                  <td>- ${compareTo !== "none" ? `<br><span style="font-size:10px; color:#888; font-weight:normal;">(${compLabelStr}: ${compData ? formatMoney((compData.qty > 0 ? compData.sales / compData.qty : 0)) : "Rp 0"})</span>` : ""}</td>
                  ${catEmptyTds}
                  <td>- ${compareTo !== "none" ? `<br><span style="font-size:10px; color:#888; font-weight:normal;">(${compLabelStr}: ${compData ? formatMoney(compData.o2oSales || 0) : "Rp 0"})</span>` : ""}</td>
              </tr>
          `;
    }
  });

  const actualUPT = totalSM > 0 ? totalQty / totalSM : 0;
  const actualAUR = totalQty > 0 ? totalSales / totalQty : 0;
  const actualATV = totalSM > 0 ? totalSales / totalSM : 0;

  // =============================================
  // TARGET AKUMULASI
  // =============================================
  let prorataTarget = totalTargetSales;
  let lastDataDay = maxIncludedDay;

  const diffSales = totalSales - prorataTarget;
  const diffUPT = actualUPT - targetUPT;
  const diffAUR = actualAUR - targetAUR;
  const diffATV = actualATV - targetATV;

  const colorSales = diffSales >= 0 ? "#16a34a" : "#dc2626";
  const colorUPT = diffUPT >= 0 ? "#16a34a" : "#dc2626";
  const colorAUR = diffAUR >= 0 ? "#16a34a" : "#dc2626";
  const colorATV = diffATV >= 0 ? "#16a34a" : "#dc2626";

  const pct = fullPeriodTargetSales > 0 ? ((totalSales / fullPeriodTargetSales) * 100).toFixed(1) : "-";
  const pctColor = parseFloat(pct) >= 100 ? "#16a34a" : "#dc2626";

  const tbody = document.getElementById("tableBody");
  if (tbody) {
    let totalCatQtyTds = "";
    categories.forEach(cat => {
      totalCatQtyTds += `<td>${formatNumber(dynamicCatTotals[cat].qty)}</td>`;
    });
    let catDashTds = "";
    categories.forEach(cat => { catDashTds += `<td>-</td>`; });

    tbody.innerHTML = htmlRows + `
            <tr style="border-top:2px solid #111; background:#f0f0f0;">
                <td style="font-weight:bold;">ACTUAL TOTAL</td>
                <td>-</td>
                <td style="font-weight:bold;">${formatMoney(totalSales)}</td>
                <td style="font-weight:bold;">${formatNumber(totalSM)}</td>
                <td style="font-weight:bold;">${formatNumber(totalQty)}</td>
                <td style="font-weight:bold;">${formatDec(actualUPT)}</td>
                <td style="font-weight:bold;">${formatMoney(actualATV)}</td>
                <td style="font-weight:bold;">${formatMoney(actualAUR)}</td>
                ${totalCatQtyTds}
                <td style="font-weight:bold;">${formatMoney(totalO2OSales)}</td>
            </tr>
            <tr style="background:#f9f9f9;">
                <td style="font-weight:bold;">TARGET (UP TO DAY-${lastDataDay})</td>
                <td>-</td>
                <td style="font-weight:bold;">${formatMoney(prorataTarget)}</td>
                <td>-</td>
                <td>-</td>
                <td style="font-weight:bold;">${formatDec(targetUPT)}</td>
                <td style="font-weight:bold;">${formatMoney(targetATV)}</td>
                <td style="font-weight:bold;">${formatMoney(targetAUR)}</td>
                ${catDashTds}
                <td>-</td>
            </tr>
            <tr style="background:#fff3cd;">
                <td style="font-weight:bold;">VARIANCE</td>
                <td>-</td>
                <td style="font-weight:bold; color:${colorSales};">${diffSales > 0 ? "+" : ""}${formatMoney(diffSales)}</td>
                <td>-</td>
                <td>-</td>
                <td style="font-weight:bold; color:${colorUPT};">${diffUPT > 0 ? "+" : ""}${formatDec(diffUPT)}</td>
                <td style="font-weight:bold; color:${colorATV};">${diffATV > 0 ? "+" : ""}${formatMoney(diffATV)}</td>
                <td style="font-weight:bold; color:${colorAUR};">${diffAUR > 0 ? "+" : ""}${formatMoney(diffAUR)}</td>
                ${catDashTds}
                <td>-</td>
            </tr>
            <tr style="background:#111; color:#fff; border-bottom:2px solid #111;">
                <td style="font-weight:bold;">ACHIEVEMENT</td>
                <td>-</td>
                <td style="font-weight:bold; color:${pctColor}; font-size:15px;">${pct}%</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                <td>-</td>
                ${catDashTds}
                <td>-</td>
            </tr>
        `;
  }

  // VALIDATION SUMMARY DATA Update
  const setEl = (id, val) => {
    const el = document.getElementById(id);
    if (el) el.innerText = val;
  };

  setEl("sumTotalSales", formatMoney(totalSales));
  setEl("sumTotalQty", formatNumber(totalQty));
  // Generate dynamic category cards
  const categoryCardsContainer = document.getElementById("categoryCardsContainer");
  if (categoryCardsContainer) {
    let cardsHtml = "";
    categories.forEach(cat => {
      const catData = dynamicCatTotals[cat];
      cardsHtml += `
        <div style="border:2px solid #111; padding:12px;">
            <div style="font-size:11px; font-weight:bold; color:#555; letter-spacing:1px;">${cat}</div>
            <div style="font-size:18px; font-weight:bold; margin:4px 0;">QTY: <span id="sum${cat}Qty">${formatNumber(catData.qty)}</span></div>
            <div style="font-size:12px; color:#111;" id="sum${cat}Sales">${formatMoney(catData.sales)}</div>
        </div>
      `;
    });
    // Add O2O
    cardsHtml += `
        <div style="border:2px solid #111; padding:12px;">
            <div style="font-size:11px; font-weight:bold; color:#555; letter-spacing:1px;">O2O</div>
            <div style="font-size:18px; font-weight:bold; margin:4px 0;">SM: <span id="sumO2OSM">${formatNumber(totalO2OSM)}</span> &nbsp; QTY: <span id="sumO2OQty">${formatNumber(totalO2OQty)}</span></div>
            <div style="font-size:12px; color:#111;" id="sumO2OSales">${formatMoney(totalO2OSales)}</div>
        </div>
    `;
    // Add TOTAL
    cardsHtml += `
        <div style="border:2px solid #111; padding:12px; background:#111; color:#fff;">
            <div style="font-size:11px; font-weight:bold; letter-spacing:1px;">TOTAL</div>
            <div style="font-size:18px; font-weight:bold; margin:4px 0;" id="sumTotalSales">${formatMoney(totalSales)}</div>
            <div style="font-size:11px;">SM: <span id="sumTotalSM">${formatNumber(totalSM)}</span> &nbsp; QTY: <span id="sumTotalQty">${formatNumber(totalQty)}</span></div>
        </div>
    `;
    categoryCardsContainer.innerHTML = cardsHtml;
  }

  // For Last Week Growth
  let lwSales = 0,
    lwSM = 0,
    lwQty = 0;
  let showGrowth = false;
  if (selectedDates.length === 1) {
    const prevDate = getPreviousWeekDate(selectedDates[0]);
    const lwData = window.storeData.dates[prevDate];
    if (lwData) {
      showGrowth = true;
      lwSales = lwData.sales;
      lwSM = lwData.sm;
      lwQty = lwData.qty;
    }
  }

  const formatGrowth = (actual, lw, targetVal, isMoney) => {
    let text = "";

    // Target Achievement
    if (targetVal && targetVal > 0) {
      const diff = actual - targetVal;
      const achPct = (diff / targetVal) * 100;
      const tColor = achPct >= 0 ? "green" : "red";
      const sign = achPct > 0 ? "+" : "";
      const diffSign = diff > 0 ? "+" : "";

      let diffText = "";
      let baseText = "";
      if (isMoney) {
        diffText = `(${diffSign}Rp ${Math.round(Math.abs(diff)).toLocaleString("id-ID")})`;
        baseText = `Rp ${Math.round(targetVal).toLocaleString("id-ID")}`;
      } else {
        diffText = `(${diffSign}${Math.abs(diff).toFixed(2)})`;
        baseText = targetVal % 1 === 0 ? targetVal.toLocaleString("id-ID") : targetVal.toFixed(2);
      }

      text += `<div style="font-size:12px;color:${tColor};margin-top:4px;font-weight:bold;">T (${baseText}): ${sign}${achPct.toFixed(1)}% <span style="font-size:10px;color:#555;">${diffText}</span></div>`;
    }

    // Last Week (Single Day fallback)
    if (showGrowth && lw > 0) {
      const pct = ((actual - lw) / lw) * 100;
      const color = pct >= 0 ? "green" : "red";
      const sign = pct > 0 ? "+" : "";
      
      let baseText = "";
      if (isMoney) baseText = `Rp ${Math.round(lw).toLocaleString("id-ID")}`;
      else baseText = lw % 1 === 0 ? lw.toLocaleString("id-ID") : lw.toFixed(2);
      
      text += `<div style="font-size:11px;color:${color};margin-top:2px;">LW (${baseText}): ${sign}${pct.toFixed(1)}%</div>`;
    }

    return text;
  };

  const idVal = (id, val, lwVal, targetVal, isMoney, isDec) => {
    const el = document.getElementById(id);
    if (!el) return;

    let textVal = "";
    if (isMoney) textVal = "Rp&nbsp;" + Math.round(val).toLocaleString("id-ID");
    else if (isDec) textVal = val.toFixed(2);
    else textVal = Math.round(val).toLocaleString("id-ID");

    el.innerHTML = textVal + formatGrowth(val, lwVal, targetVal, isMoney);
  };

  const lwUPT = lwSM > 0 ? lwQty / lwSM : 0;
  idVal("staffCount", actualUPT, lwUPT, targetUPT, false, true);
  idVal("salesTotal", totalSales, lwSales, fullPeriodTargetSales, true, false);
  idVal("smTotal", totalSM, lwSM, 0, false, false);
  idVal("qtyTotal", totalQty, lwQty, 0, false, false);
  const lwATV = lwSM > 0 ? lwSales / lwSM : 0;
  idVal("avgSales", actualATV, lwATV, targetATV, true, false);
  const lwAUR = lwQty > 0 ? lwSales / lwQty : 0;
  idVal("aurTotal", actualAUR, lwAUR, targetAUR, true, false);
  
  // O2O Total Update
  const o2oTotalEl = document.getElementById("o2oTotal");
  if (o2oTotalEl) o2oTotalEl.innerHTML = `Rp&nbsp;${Math.round(totalO2OSales).toLocaleString("id-ID")}`;

  // ==========================================
  // COMPARISON (LY / LM)
  // ==========================================
  const renderCompare = (id, actual, compVal, isMoney, isDec, compLabel) => {
    const el = document.getElementById(id);
    if (!el) return;
    if (!compVal || compVal === 0) {
      el.innerHTML = `No ${compLabel} Data`;
      el.style.color = "#666";
      return;
    }
    const diff = actual - compVal;
    const pct = (diff / compVal) * 100;
    const color = pct >= 0 ? "green" : "red";
    const sign = pct > 0 ? "+" : "";
    const diffSign = diff > 0 ? "+" : "";
    
    let diffText = "";
    let baseText = "";
    if (isMoney) {
        diffText = `(${diffSign}Rp ${Math.round(Math.abs(diff)).toLocaleString("id-ID")})`;
        baseText = `Rp ${Math.round(compVal).toLocaleString("id-ID")}`;
    } else if (isDec) {
        diffText = `(${diffSign}${Math.abs(diff).toFixed(2)})`;
        baseText = compVal.toFixed(2);
    } else {
        diffText = `(${diffSign}${Math.round(Math.abs(diff)).toLocaleString("id-ID")})`;
        baseText = Math.round(compVal).toLocaleString("id-ID");
    }
    
    el.innerHTML = `${compLabel} (${baseText}): ${sign}${pct.toFixed(1)}% <span style="font-size:10px;color:#555;">${diffText}</span>`;
    el.style.color = color;
  };

  let compSales = 0, compSM = 0, compQty = 0, compO2OSales = 0;
  let compLabel = "LY";
  
  if (compareTo === "ly" && window.storeDataLY && selectedDates.length > 0) {
    compLabel = "LY";
    selectedDates.forEach(d => {
      if (dateToComparable(d) > maxActualNum) return;
      const parts = d.split("-");
      if (parts.length === 3) {
        const lyDate = `${parts[0]}-${parts[1]}-${parseInt(parts[2], 10) - 1}`;
        const data = window.storeDataLY.dates[lyDate];
        if (data) {
          compSales += data.sales || 0;
          compSM += data.sm || 0;
          compQty += data.qty || 0;
          compO2OSales += data.o2oSales || 0;
        }
      }
    });
  } else if (compareTo === "lm" && window.storeData && selectedDates.length > 0) {
    compLabel = "LM";
    selectedDates.forEach(d => {
      if (dateToComparable(d) > maxActualNum) return;
      const parts = d.split("-");
      if (parts.length === 3) {
        let m = parseInt(parts[1], 10) - 1;
        let y = parseInt(parts[2], 10);
        if (m === 0) { m = 12; y -= 1; }
        const lmDate = `${parts[0]}-${String(m).padStart(2, '0')}-${y}`;
        const data = window.storeData.dates[lmDate];
        if (data) {
          compSales += data.sales || 0;
          compSM += data.sm || 0;
          compQty += data.qty || 0;
          compO2OSales += data.o2oSales || 0;
        }
      }
    });
  } else if (compareTo === "lw" && window.storeData && selectedDates.length > 0) {
    compLabel = "LW";
    selectedDates.forEach(d => {
      if (dateToComparable(d) > maxActualNum) return;
      const parts = d.split("-");
      if (parts.length === 3) {
        const curD = new Date(parts[2], parts[1]-1, parts[0]);
        curD.setDate(curD.getDate() - 7);
        const lwDate = `${String(curD.getDate()).padStart(2, '0')}-${String(curD.getMonth()+1).padStart(2, '0')}-${curD.getFullYear()}`;
        const data = window.storeData.dates[lwDate];
        if (data) {
          compSales += data.sales || 0;
          compSM += data.sm || 0;
          compQty += data.qty || 0;
          compO2OSales += data.o2oSales || 0;
        }
      }
    });
  }

  const compUPT = compSM > 0 ? compQty / compSM : 0;
  const compATV = compSM > 0 ? compSales / compSM : 0;
  const compAUR = compQty > 0 ? compSales / compQty : 0;

  renderCompare("salesCompare", totalSales, compSales, true, false, compLabel);
  renderCompare("smLy", totalSM, compSM, false, false, compLabel);
  renderCompare("qtyLy", totalQty, compQty, false, false, compLabel);
  renderCompare("uptLy", actualUPT, compUPT, false, true, compLabel);
  renderCompare("atvLy", actualATV, compATV, true, false, compLabel);
  renderCompare("aurLy", actualAUR, compAUR, true, false, compLabel);
  renderCompare("o2oLy", totalO2OSales, compO2OSales, true, false, compLabel);
  // ===================================
  // Render SALES BY DISCOUNT table (collapsible per kategori)
  // Sumber: discountData dari MSR (gesttechPrice logic)
  // ===================================
  const discAgg = {}; // { ACC: { MEN: { normal: {qty,sales}, ... }, WOMEN: ... } }
  selectedDates.forEach((d) => {
    const data = window.storeData.dates[d];
    if (data.discountData) {
      for (const cat in data.discountData) {
        if (!discAgg[cat]) discAgg[cat] = {};
        for (const divOrPtype in data.discountData[cat]) {
          if (data.discountData[cat][divOrPtype].qty !== undefined) {
            // Backward compatibility: old format (divOrPtype is priceType)
            const ptype = divOrPtype;
            const div = "UNKNOWN";
            if (!discAgg[cat][div]) discAgg[cat][div] = {};
            if (!discAgg[cat][div][ptype]) discAgg[cat][div][ptype] = { qty: 0, sales: 0 };
            discAgg[cat][div][ptype].qty += data.discountData[cat][ptype].qty;
            discAgg[cat][div][ptype].sales += data.discountData[cat][ptype].sales;
          } else {
            // New format (divOrPtype is division)
            const div = divOrPtype;
            if (!discAgg[cat][div]) discAgg[cat][div] = {};
            for (const ptype in data.discountData[cat][div]) {
              if (!discAgg[cat][div][ptype]) discAgg[cat][div][ptype] = { qty: 0, sales: 0 };
              discAgg[cat][div][ptype].qty += data.discountData[cat][div][ptype].qty;
              discAgg[cat][div][ptype].sales += data.discountData[cat][div][ptype].sales;
            }
          }
        }
      }
    }
  });

  const catBody = document.getElementById("tableCatBody");
  if (catBody) {
    catBody.innerHTML = "";
    let CATS = ["ACC", "BAG", "APP", "FTW"];
    if (catFilter !== "ALL") {
      CATS = CATS.filter((c) => catFilter.has(c));
    }
    
    const CAT_LABELS = {
      ACC: "ACCESSORIES",
      BAG: "BAG",
      APP: "APPAREL",
      FTW: "FOOTWEAR",
    };

    // Sort price types: normal first, FREEFALL last, discount % in between
    const sortTypes = (types) => {
      const order = (t) => {
        if (t === "normal") return 0;
        if (t === "FREEFALL") return 99;
        return parseInt(t) || 50;
      };
      return types.sort((a, b) => order(a) - order(b));
    };

    // Calculate Grand Total Sales for % contribution
    let grandTotalSales = 0;
    CATS.forEach((c) => {
      if (discAgg[c]) {
        Object.keys(discAgg[c]).forEach(div => {
          Object.keys(discAgg[c][div]).forEach(ptype => {
            if (discFilter !== "ALL" && !discFilter.has(ptype)) return;
            grandTotalSales += discAgg[c][div][ptype].sales;
          });
        });
      }
    });

    CATS.forEach((cat) => {
      let divData = discAgg[cat] || {};
      
      // Calculate category total across all divisions
      let catTotalQty = 0;
      let catTotalSales = 0;
      
      Object.keys(divData).forEach(div => {
         Object.keys(divData[div]).forEach(ptype => {
            if (discFilter !== "ALL" && !discFilter.has(ptype)) return;
            catTotalQty += divData[div][ptype].qty;
            catTotalSales += divData[div][ptype].sales;
         });
      });
      
      if (catTotalQty === 0 && catTotalSales === 0) return; // Hidden by filter

      const groupId = "disc-group-" + cat;

      // Category header row (clickable)
      const catContrib = grandTotalSales > 0 ? ((catTotalSales / grandTotalSales) * 100).toFixed(2) + "%" : "0.00%";
      catBody.innerHTML += `<tr class="disc-cat-header" onclick="toggleDiscGroup('${groupId}')"
                style="background:#111; color:#fff; cursor:pointer; user-select:none;">
                <td style="padding:10px; font-weight:bold; letter-spacing:1px;">
                    ▼ ${CAT_LABELS[cat]}
                </td>
                <td style="padding:10px; font-weight:bold;">ALL TYPES</td>
                <td style="padding:10px; text-align:right; font-weight:bold;">${Math.round(catTotalQty).toLocaleString("id-ID")}</td>
                <td style="padding:10px; text-align:right; font-weight:bold;">Rp ${Math.round(catTotalSales).toLocaleString("id-ID")}</td>
                <td style="padding:10px; text-align:right; font-weight:bold;">${catContrib}</td>
            </tr>`;

      // Render divisions
      Object.keys(divData).sort().forEach(div => {
         let types = sortTypes(Object.keys(divData[div]));
         if (discFilter !== "ALL") {
            types = types.filter((t) => discFilter.has(t));
         }
         if (types.length === 0) return;
         
         let divTotalQty = 0;
         let divTotalSales = 0;
         types.forEach((t) => {
            divTotalQty += divData[div][t].qty;
            divTotalSales += divData[div][t].sales;
         });
         
         const divContrib = grandTotalSales > 0 ? ((divTotalSales / grandTotalSales) * 100).toFixed(2) + "%" : "0.00%";

         // Division header row
         catBody.innerHTML += `<tr class="disc-sub-row" data-group="${groupId}"
                    style="background:#f5f5f5; border-bottom:1px solid #ddd;">
                    <td style="padding:8px; padding-left:30px; font-size:12px; font-weight:bold; color:#555;">► ${div}</td>
                    <td style="padding:8px; font-weight:bold; font-size:12px; color:#555;">ALL TYPES</td>
                    <td style="padding:8px; text-align:right; font-size:12px; font-weight:bold; color:#555;">${Math.round(divTotalQty).toLocaleString("id-ID")}</td>
                    <td style="padding:8px; text-align:right; font-size:12px; font-weight:bold; color:#555;">Rp ${Math.round(divTotalSales).toLocaleString("id-ID")}</td>
                    <td style="padding:8px; text-align:right; font-size:12px; font-weight:bold; color:#555;">${divContrib}</td>
                </tr>`;

         // Sub-rows per price type
         types.forEach((ptype) => {
            const { qty, sales } = divData[div][ptype];
            if (qty === 0 && sales === 0) return;
            const isNormal = ptype === "normal";
            const isFreefall = ptype === "FREEFALL";
            const typeColor = isNormal ? "#111" : isFreefall ? "#0066cc" : "#d32f2f";
            const typeLabel = isNormal ? "NORMAL" : isFreefall ? "FREEFALL" : ptype.toUpperCase();
            
            const typeContrib = grandTotalSales > 0 ? ((sales / grandTotalSales) * 100).toFixed(2) + "%" : "0.00%";

            catBody.innerHTML += `<tr class="disc-sub-row" data-group="${groupId}"
                        style="border-left:4px solid ${typeColor};">
                        <td style="padding:8px; padding-left:50px; font-size:12px; font-weight:bold;"></td>
                        <td style="padding:8px; font-weight:bold; font-size:12px; color:${typeColor};">${typeLabel}</td>
                        <td style="padding:8px; text-align:right; font-size:12px;">${Math.round(qty).toLocaleString("id-ID")}</td>
                        <td style="padding:8px; text-align:right; font-size:12px; color:${typeColor};">Rp ${Math.round(sales).toLocaleString("id-ID")}</td>
                        <td style="padding:8px; text-align:right; font-size:12px; color:${typeColor};">${typeContrib}</td>
                    </tr>`;
         });
      });
    });

    // O2O row dihilangkan dari tabel kategori (Breakdown by Category and Type)
    if (catBody.innerHTML === "") {
      catBody.innerHTML =
        '<tr><td colspan="5" style="text-align:center; padding:20px;">NO DATA AVAILABLE</td></tr>';
    }
  }

  // Render TOP 5 Articles
  renderTopArticles(articleAgg);
}

// Toggle collapse/expand discount group rows
function toggleDiscGroup(groupId) {
  const rows = document.querySelectorAll(
    `.disc-sub-row[data-group="${groupId}"]`,
  );
  const header = document.querySelector(
    `.disc-cat-header[onclick*="${groupId}"]`,
  );
  let isHidden = false;
  rows.forEach((r) => {
    const hidden = r.style.display === "none";
    isHidden = hidden;
    r.style.display = hidden ? "" : "none";
  });
  if (header) {
    const firstTd = header.querySelector("td");
    if (firstTd) {
      const label = firstTd.innerText.replace(/^[▼▶] /, "");
      firstTd.innerText = (isHidden ? "▼ " : "▶ ") + label;
    }
  }
}

function renderTopArticles(articleAgg) {
  const arr = Object.keys(articleAgg).map((art) => ({
    article: art,
    sales: articleAgg[art].sales,
    qty: articleAgg[art].qty,
    division: articleAgg[art].division,
  }));

  const topSales = arr
    .slice()
    .sort((a, b) => b.sales - a.sales)
    .slice(0, 5);
  const topQty = arr
    .slice()
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);
  const topFootwear = arr
    .slice()
    .filter(
      (a) =>
        a.division.includes("FOOTWEAR") ||
        a.division.includes("SHOES") ||
        a.division.includes("SEPATU"),
    )
    .sort((a, b) => b.qty - a.qty)
    .slice(0, 5);

  const renderList = (items, isSales) => {
    if (items.length === 0) return "-";
    let html =
      '<ol style="margin-left: 20px; font-size: 14px; line-height: 1.5;">';
    items.forEach((it) => {
      const val = isSales
        ? "Rp " + Math.round(it.sales).toLocaleString("id-ID")
        : Math.round(it.qty).toLocaleString("id-ID") + " pcs";
      html += `<li><strong>${it.article}</strong> : ${val}</li>`;
    });
    html += "</ol>";
    return html;
  };

  const elSales = document.getElementById("topSales");
  if (elSales) elSales.innerHTML = renderList(topSales, true);

  const elQty = document.getElementById("topQty");
  if (elQty) elQty.innerHTML = renderList(topQty, false);

  const elFootwear = document.getElementById("topFootwear");
  if (elFootwear) elFootwear.innerHTML = renderList(topFootwear, false);
}

// =============================================
// LY TEMPLATE DOWNLOAD & PARSER
// =============================================
function downloadLYTemplate() {
  document.getElementById("yearModal").style.display = "flex";
  document.getElementById("yearInput").value = new Date().getFullYear() - 1;
  document.getElementById("yearInput").focus();
  document.getElementById("confirmYearBtn").onclick = () => {
    const year = document.getElementById("yearInput").value.trim();
    document.getElementById("yearModal").style.display = "none";
    if (!year || !/^\d{4}$/.test(year)) return;
    
    const daysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
    if ((year % 4 === 0 && year % 100 !== 0) || year % 400 === 0) daysInMonth[1] = 29;
    
    const rows = [["DATE", "SALES", "QTY", "SM", "O2O SALES"]];
    for (let m = 0; m < 12; m++) {
      for (let d = 1; d <= daysInMonth[m]; d++) {
        const dd = String(d).padStart(2, "0");
        const mm = String(m + 1).padStart(2, "0");
        rows.push([`${dd}-${mm}-${year}`, "", "", "", ""]);
      }
    }
    
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet(rows);
    ws["!cols"] = [{ wch: 14 }, { wch: 16 }, { wch: 10 }, { wch: 10 }, { wch: 16 }];
    XLSX.utils.book_append_sheet(wb, ws, "SALES LY");
    XLSX.writeFile(wb, `template_sales_last_year_${year}.xlsx`);
  };
}

function parseLYTemplate(rows) {
  const dates = {};
  let started = false;
  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    if (!row || !row.length) continue;
    const first = String(row[0] || "").trim();
    if (!started) {
      if (first.toUpperCase() === "DATE" || first.toUpperCase().includes("DATE")) { started = true; }
      continue;
    }
    if (!first) continue;
    const date = first.replace(/[\/\.]/g, "-");
    const sales = parseFloat(String(row[1] || "0").replace(/,/g, "")) || 0;
    const qty = parseFloat(String(row[2] || "0").replace(/,/g, "")) || 0;
    const sm = parseFloat(String(row[3] || "0").replace(/,/g, "")) || 0;
    const o2oSales = parseFloat(String(row[4] || "0").replace(/,/g, "")) || 0;
    if (!dates[date]) {
      const dayNum = parseInt(date.split("-")[0], 10);
      dates[date] = { sales: 0, qty: 0, sm: 0, o2oSales: 0, o2oSM: 0, o2oQty: 0, targetPercent: 0, dayOfMonth: dayNum, articles: {}, dynamicCats: {}, catSM: {} };
    }
    dates[date].sales += sales;
    dates[date].qty += qty;
    dates[date].sm += sm;
    dates[date].o2oSales += o2oSales;
  }
  return { dates };
}

document.addEventListener("DOMContentLoaded", () => {
  const dlBtn = document.getElementById("dlTemplateLy");
  if (dlBtn) dlBtn.addEventListener("click", downloadLYTemplate);
});

