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
};

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

    const targetStore = document.getElementById("targetStore").value;
    const targetUPT = document.getElementById("targetUPT").value;
    const targetATV = document.getElementById("targetATV").value;
    const targetAUR = document.getElementById("targetAUR").value;

    if (!targetStore || !targetUPT || !targetATV || !targetAUR) {
      alert("Please complete the fields Target Store, UPT, ATV, dan AUR.");
      return;
    }

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
        advOrdData,
        Number(targetStore),
      );

      buildDateDropdowns();
      renderDashboard(
        "ALL",
        null,
        null,
        Number(targetUPT),
        Number(targetATV),
        Number(targetAUR),
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
  const targetUPTEl = document.getElementById("targetUPT");
  const targetATVEl = document.getElementById("targetATV");
  const targetAUREl = document.getElementById("targetAUR");
  const getTargets = () => {
    return {
      upt: parseFloat(targetUPTEl ? targetUPTEl.value : "1.8"),
      atv: parseFloat(targetATVEl ? targetATVEl.value : "850000"),
      aur: parseFloat(targetAUREl ? targetAUREl.value : "250000"),
    };
  };

  const reRender = () => {
    const dFrom = document.getElementById("performanceDateFrom").value;
    const dTo = document.getElementById("performanceDateTo").value;
    const mode = dFrom && dTo ? "CUSTOM" : "ALL";
    const t = getTargets();
    const discFilter =
      document.getElementById("discountTypeFilter")?.value || "ALL";
    const catFilter =
      document.getElementById("categoryTypeFilter")?.value || "ALL";
    renderDashboard(
      mode,
      dFrom,
      dTo,
      t.upt,
      t.atv,
      t.aur,
      discFilter,
      catFilter,
    );
  };

  const applyBtn = document.getElementById("applyPerformanceDateRange");
  if (applyBtn) applyBtn.addEventListener("click", reRender);

  const resetBtn = document.getElementById("resetPerformanceDateRange");
  if (resetBtn)
    resetBtn.addEventListener("click", () => {
      document.getElementById("performanceDateFrom").value = "";
      document.getElementById("performanceDateTo").value = "";
      const t = getTargets();
      renderDashboard("ALL", null, null, t.upt, t.atv, t.aur, "ALL", "ALL");
    });

  const discFilterEl = document.getElementById("discountTypeFilter");
  if (discFilterEl) discFilterEl.addEventListener("change", reRender);

  const catFilterEl = document.getElementById("categoryTypeFilter");
  if (catFilterEl) catFilterEl.addEventListener("change", reRender);
});

function readExcel(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target.result);
        const workbook = window.XLSX.read(data, { type: "array" });
        const firstSheet = workbook.SheetNames[0];
        const rows = window.XLSX.utils.sheet_to_json(
          workbook.Sheets[firstSheet],
          { header: 1 },
        );
        resolve(rows);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
}

function parseDate(rawDate) {
  if (!rawDate) return "";
  let str = String(rawDate).trim();
  if (!isNaN(str) && Number(str) > 20000) {
    const date = new Date((Number(str) - (25567 + 1)) * 86400 * 1000);
    const d = String(date.getDate()).padStart(2, "0");
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const y = date.getFullYear();
    return `${d}-${m}-${y}`;
  }
  if (str.includes(" ")) str = str.split(" ")[0];
  str = str.replace(/\//g, "-");
  const parts = str.split("-");
  if (parts.length === 3) {
    if (parts[0].length === 4)
      return `${parts[2].padStart(2, "0")}-${parts[1].padStart(2, "0")}-${parts[0]}`;
    return `${parts[0].padStart(2, "0")}-${parts[1].padStart(2, "0")}-${parts[2]}`;
  }
  return str;
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
  advOrdData,
  targetStore,
) {
  const parseRupiah = (val) => {
    if (typeof val === "number") return val;
    const str = String(val || "").trim();
    return Number(str.replace(/\./g, "").replace(/[^\d-]/g, "")) || 0;
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
      let pct = parseFloat(rawPct) || 0;
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

    const qty = parseFloat(row[6]) || 0;
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

      if (!dataByDate[date].discountData) dataByDate[date].discountData = {};
      if (!dataByDate[date].discountData[catKey])
        dataByDate[date].discountData[catKey] = {};
      if (!dataByDate[date].discountData[catKey][priceType]) {
        dataByDate[date].discountData[catKey][priceType] = { qty: 0, sales: 0 };
      }
      dataByDate[date].discountData[catKey][priceType].qty += qty;
      dataByDate[date].discountData[catKey][priceType].sales += netAmt;
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
    const dateMatch = firstCell.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (dateMatch) {
      currentDate = firstCell;
      continue;
    }

    if (!currentDate || !dataByDate[currentDate]) continue;

    const counter = parseInt(row[0], 10);
    const invoice = String(row[1] || "").trim();
    const sales = parseFloat(row[2]) || 0;

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
    const dateMatch = firstCell.match(/^(\d{2})-(\d{2})-(\d{4})$/);
    if (dateMatch) {
      currentAdvDate = firstCell;
      continue;
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
      return Number(String(val || "").replace(/[^\d.-]/g, "")) || 0;
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

  for (const date in dataByDate) {
    const dom = String(dataByDate[date].dayOfMonth);
    dataByDate[date].targetPercent = targetMap[dom] || 0;
    dataByDate[date].targetSales = targetStore * dataByDate[date].targetPercent;
  }

  // Extract global unique categories
  const allCategories = new Set();
  for (const date in dataByDate) {
    for (const cat in dataByDate[date].dynamicCats) {
      allCategories.add(cat);
    }
  }

  return {
    targetStore: targetStore,
    dates: dataByDate,
    targetMap: targetMap,
    categories: Array.from(allCategories).sort()
  };
}

function buildDateDropdowns() {
  const dates = Object.keys(window.storeData.dates).sort(
    (a, b) => dateToComparable(a) - dateToComparable(b),
  ); // Ascending

  const selFrom = document.getElementById("performanceDateFrom");
  const selTo = document.getElementById("performanceDateTo");
  if (selFrom) {
    selFrom.innerHTML = '<option value="">SELECT FROM DATE</option>';
    dates.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d;
      opt.innerText = d;
      selFrom.appendChild(opt);
    });
    selFrom.disabled = false;
  }
  if (selTo) {
    selTo.innerHTML = '<option value="">SELECT TO DATE</option>';
    dates.forEach((d) => {
      const opt = document.createElement("option");
      opt.value = d;
      opt.innerText = d;
      selTo.appendChild(opt);
    });
    selTo.disabled = false;
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
  targetUPT,
  targetATV,
  targetAUR,
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
      renderDashboard("ALL", null, null, targetUPT, targetATV, targetAUR);
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
  const formatMoney = (val) => "Rp " + Math.round(val).toLocaleString("id-ID");
  const formatNumber = (val) => Math.round(val).toLocaleString("id-ID");
  const formatDec = (val) => val.toFixed(2);

  const rawTargetStore = window.storeData ? window.storeData.targetStore : 0;
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

  // Generate Filter Dropdown Options
  const categoryTypeFilter = document.getElementById("categoryTypeFilter");
  if (categoryTypeFilter) {
    let optHtml = `<option value="ALL">ALL CATEGORIES</option>`;
    categories.forEach(cat => {
      optHtml += `<option value="${cat}">${cat}</option>`;
    });
    categoryTypeFilter.innerHTML = optHtml;
  }
  let totalO2OSales = 0,
    totalO2OSM = 0,
    totalO2OQty = 0;
  let articleAgg = {};



  let htmlRows = "";

  displayDates.forEach((d) => {
    const data = window.storeData.dates[d];
    const dayStr = String(parseInt(d.split("-")[0], 10));
    const dailyPct = targetMap[dayStr] || 0;
    const dailyTarget = Math.round(rawTargetStore * dailyPct);

    if (data && selectedDates.includes(d)) {
      totalSales += data.sales;
      totalQty += data.qty;
      totalSM += data.sm;
      totalTargetSales += data.targetSales;

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
        catTds += `<td>${formatNumber(catQty)}</td>`;
      });

      htmlRows += `
              <tr>
                  <td>${d}</td>
                  <td>${formatMoney(dailyTarget)}</td>
                  <td style="color:${cSales}; font-weight:600;">${formatMoney(data.sales)}</td>
                  <td>${formatNumber(data.sm)}</td>
                  <td>${formatNumber(data.qty)}</td>
                  <td style="color:${cUPT}; font-weight:600;">${formatDec(dUPT)}</td>
                  <td style="color:${cATV}; font-weight:600;">${formatMoney(dATV)}</td>
                  <td style="color:${cAUR}; font-weight:600;">${formatMoney(dAUR)}</td>
                  ${catTds}
                  <td>${formatMoney(data.o2oSales)}</td>
              </tr>
          `;
    } else {
      // Row is generated but no sales data yet
      let catEmptyTds = "";
      categories.forEach(cat => { catEmptyTds += `<td>-</td>`; });

      htmlRows += `
              <tr>
                  <td>${d}</td>
                  <td>${formatMoney(dailyTarget)}</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  <td>-</td>
                  ${catEmptyTds}
                  <td>-</td>
              </tr>
          `;
    }
  });

  const actualUPT = totalSM > 0 ? totalQty / totalSM : 0;
  const actualAUR = totalQty > 0 ? totalSales / totalQty : 0;
  const actualATV = totalSM > 0 ? totalSales / totalSM : 0;

  // =============================================
  // TARGET AKUMULASI PRORATA
  // Hitung berdasarkan hari ke-N dari data yang TAMPIL (selectedDates)
  // dan jumlahkan persentase dari targetMap
  // =============================================
  let prorataTarget = totalTargetSales; // fallback
  let lastDataDay = 0;
  if (rawTargetStore > 0 && selectedDates.length > 0) {
    const lastDate = selectedDates[selectedDates.length - 1]; // format: DD-MM-YYYY
    const parts = lastDate.split("-");
    if (parts.length === 3) {
      lastDataDay = parseInt(parts[0], 10);
      let totalPct = 0;
      for (let i = 1; i <= lastDataDay; i++) {
        totalPct += targetMap[String(i)] || 0;
      }
      prorataTarget = Math.round(rawTargetStore * totalPct);
    }
  }

  const diffSales = totalSales - prorataTarget;
  const diffUPT = actualUPT - targetUPT;
  const diffAUR = actualAUR - targetAUR;
  const diffATV = actualATV - targetATV;

  const colorSales = diffSales >= 0 ? "#16a34a" : "#dc2626";
  const colorUPT = diffUPT >= 0 ? "#16a34a" : "#dc2626";
  const colorAUR = diffAUR >= 0 ? "#16a34a" : "#dc2626";
  const colorATV = diffATV >= 0 ? "#16a34a" : "#dc2626";

  const pct = rawTargetStore > 0 ? ((totalSales / rawTargetStore) * 100).toFixed(1) : "-";
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
      if (isMoney) {
        diffText = `(${diffSign}Rp ${Math.round(Math.abs(diff)).toLocaleString("id-ID")})`;
      } else {
        diffText = `(${diffSign}${Math.abs(diff).toFixed(2)})`;
      }

      text += `<div style="font-size:12px;color:${tColor};margin-top:4px;font-weight:bold;">T: ${sign}${achPct.toFixed(1)}% <span style="font-size:10px;color:#555;">${diffText}</span></div>`;
    }

    // Last Year (Placeholder for now)
    text += `<div style="font-size:11px;color:#666;margin-top:2px;">No LY Data</div>`;

    // Last Week
    if (showGrowth && lw > 0) {
      const pct = ((actual - lw) / lw) * 100;
      const color = pct >= 0 ? "green" : "red";
      const sign = pct > 0 ? "+" : "";
      text += `<div style="font-size:11px;color:${color};margin-top:2px;">${sign}${pct.toFixed(1)}% vs Last Week</div>`;
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
  idVal("salesTotal", totalSales, lwSales, totalTargetSales, true, false);
  idVal("smTotal", totalSM, lwSM, 0, false, false);
  idVal("qtyTotal", totalQty, lwQty, 0, false, false);
  const lwATV = lwSM > 0 ? lwSales / lwSM : 0;
  idVal("avgSales", actualATV, lwATV, targetATV, true, false);
  const lwAUR = lwQty > 0 ? lwSales / lwQty : 0;
  idVal("aurTotal", actualAUR, lwAUR, targetAUR, true, false);

  // ===================================
  // Render SALES BY DISCOUNT table (collapsible per kategori)
  // Sumber: discountData dari MSR (gesttechPrice logic)
  // ===================================
  const discAgg = {}; // { ACC: { normal: {qty,sales}, freefall: {qty,sales}, "30%": {qty,sales}, ... }, BAG: {...}, ... }
  selectedDates.forEach((d) => {
    const data = window.storeData.dates[d];
    if (data.discountData) {
      for (const cat in data.discountData) {
        if (!discAgg[cat]) discAgg[cat] = {};
        for (const ptype in data.discountData[cat]) {
          if (!discAgg[cat][ptype]) discAgg[cat][ptype] = { qty: 0, sales: 0 };
          discAgg[cat][ptype].qty += data.discountData[cat][ptype].qty;
          discAgg[cat][ptype].sales += data.discountData[cat][ptype].sales;
        }
      }
    }
  });

  const catBody = document.getElementById("tableCatBody");
  if (catBody) {
    catBody.innerHTML = "";
    let CATS = ["ACC", "BAG", "APP", "FTW"];
    if (catFilter !== "ALL") {
      CATS = CATS.filter((c) => c === catFilter);
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

    CATS.forEach((cat) => {
      let catData = discAgg[cat] || {};
      let types = sortTypes(Object.keys(catData));

      // Apply Discount Filter
      if (discFilter !== "ALL") {
        types = types.filter((t) => t === discFilter);
      }
      if (types.length === 0) {
        if (discFilter !== "ALL") return; // Hidden by filter
        catData = { "-": { qty: 0, sales: 0 } };
        types = ["-"];
      }

      // Calculate category totals for header
      let catTotalQty = 0,
        catTotalSales = 0;
      types.forEach((t) => {
        catTotalQty += catData[t].qty;
        catTotalSales += catData[t].sales;
      });

      const groupId = "disc-group-" + cat;

      // Category header row (clickable)
      catBody.innerHTML += `<tr class="disc-cat-header" onclick="toggleDiscGroup('${groupId}')"
                style="background:#111; color:#fff; cursor:pointer; user-select:none;">
                <td style="padding:10px; font-weight:bold; letter-spacing:1px;">
                    ▼ ${CAT_LABELS[cat]}
                </td>
                <td style="padding:10px; font-weight:bold;">ALL TYPES</td>
                <td style="padding:10px; text-align:right; font-weight:bold;">${Math.round(catTotalQty).toLocaleString("id-ID")}</td>
                <td style="padding:10px; text-align:right; font-weight:bold;">Rp ${Math.round(catTotalSales).toLocaleString("id-ID")}</td>
            </tr>`;

      // Sub-rows per price type
      types.forEach((ptype) => {
        if (ptype === "-") return; // Don't render sub-row for empty category
        const { qty, sales } = catData[ptype];
        const isNormal = ptype === "normal";
        const isFreefall = ptype === "FREEFALL";
        const typeColor = isNormal
          ? "#111"
          : isFreefall
            ? "#0066cc"
            : "#d32f2f";
        const typeLabel = isNormal
          ? "NORMAL"
          : isFreefall
            ? "FREEFALL"
            : ptype.toUpperCase();

        catBody.innerHTML += `<tr class="disc-sub-row" data-group="${groupId}"
                    style="border-left:4px solid ${typeColor};">
                    <td style="padding:8px 8px 8px 24px; color:#555;"></td>
                    <td style="padding:8px; font-weight:bold; color:${typeColor};">${typeLabel}</td>
                    <td style="padding:8px; text-align:right;">${Math.round(qty).toLocaleString("id-ID")}</td>
                    <td style="padding:8px; text-align:right; color:${typeColor};">Rp ${Math.round(sales).toLocaleString("id-ID")}</td>
                </tr>`;
      });
    });

    // O2O row dihilangkan dari tabel kategori (Breakdown by Category and Type)
    if (catBody.innerHTML === "") {
      catBody.innerHTML =
        '<tr><td colspan="4" style="text-align:center; padding:20px;">NO DATA AVAILABLE</td></tr>';
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

