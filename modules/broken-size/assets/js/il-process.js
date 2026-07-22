/* ========================================
   SMS BROKEN SIZE - IL-PROCESS.JS
   Inventory Level calculation
   IL = Current Stock / Avg Monthly Sales
   
   MSR format (from engine.js research):
   - Column B (index 1) = Product Division (category)
   - Column F (index 5) = Article Code  
   - Column G (index 6) = Qty Sold (signed)
   ======================================== */

window.ilTableData = [];
window.ilRawStockRows = [];
window.ilRawMsrArr = [];
window.ilDiscountFilter = new Set();

/* ---------- PROCESS IL ---------- */
async function processIL(stockRows) {
  const msr1File = document.getElementById("msr1").files[0];
  const msr2File = document.getElementById("msr2").files[0];
  const msr3File = document.getElementById("msr3").files[0];

  if (!msr1File && !msr2File && !msr3File) {
    console.log("IL: No MSR files uploaded, skipping IL calculation");
    return;
  }

  try {
    const msrFiles = [msr1File, msr2File, msr3File].filter(Boolean);
    const msrDataArr = [];

    for (const file of msrFiles) {
      const data = await readExcel(file);
      msrDataArr.push(data);
    }

    window.ilRawStockRows = stockRows;
    window.ilRawMsrArr = msrDataArr;
    
    // Extract available discounts
    extractILDiscounts();

    reRunIL();
  } catch (err) {
    console.error("IL Error:", err);
    alert("Failed memproses IL: " + err.message);
  }
}

function extractILDiscounts() {
  if (typeof kangodingPrice !== 'function') return;
  const allDiscounts = new Set();
  
  // From Stock
  for (let i = 1; i < window.ilRawStockRows.length; i++) {
    const r = window.ilRawStockRows[i];
    if (!r) continue;
    const cat = getStandardCategory(r);
    const p = toNum(r[6]);
    const d = kangodingPrice(p, cat);
    if (d) allDiscounts.add(d);
  }
  
  // From MSR
  window.ilRawMsrArr.forEach(rows => {
    for (let i = 1; i < rows.length; i++) {
      const r = rows[i];
      if (!r) continue;
      const cat = getStandardCategory(r);
      const qty = Math.abs(toNum(r[6]));
      const sales = toNum(r[8]);
      const discountAmt = toNum(r[7]);
      const total = discountAmt + sales;
      const hargaAsli = qty > 0 ? Math.round(total / qty) : 0;
      const d = kangodingPrice(hargaAsli, cat);
      if (d) allDiscounts.add(d);
    }
  });
  
  const root = document.getElementById("ilDiscountCheckboxes");
  if (root) {
      root.innerHTML = "";
      [...allDiscounts].sort().forEach(v => {
          root.insertAdjacentHTML("beforeend", `<label><input type="checkbox" class="il-disc-cb" value="${v}"> ${v}</label>`);
      });
      root.querySelectorAll("input").forEach(cb => {
          cb.addEventListener("change", (e) => {
              if (e.target.checked) window.ilDiscountFilter.add(e.target.value);
              else window.ilDiscountFilter.delete(e.target.value);
              reRunIL();
          });
      });
  }
}

function reRunIL() {
    if (!window.ilRawStockRows || window.ilRawStockRows.length === 0) return;
    
    const stockPerCat = calcStockPerCategory(window.ilRawStockRows, window.ilDiscountFilter);
    const salesPerMonth = window.ilRawMsrArr.map((rows) => calcSalesPerCategory(rows, window.ilDiscountFilter));

    const ilData = buildILTable(stockPerCat, salesPerMonth);
    window.ilTableData = ilData;

    drawILTable(ilData);
    updateILSummary(ilData);
}

/* ---------- CATEGORY EXTRACTOR ---------- */
function getStandardCategory(r) {
  for (let i = 0; i <= 4; i++) {
    const val = String(r[i] || "").toUpperCase();
    if (val.includes("ACC") || val.includes("ACCESSORIES")) return "ACCESSORIES";
    if (val.includes("BAG") || val.includes("TAS")) return "BAGS";
    if (val.includes("SHOES") || val.includes("FOOTWEAR")) return "FOOTWEAR";
    if (val.includes("APP") || val.includes("APPAREL") || val.includes("CLOTHING")) return "APPAREL";
    if (val === "NON-MD" || val === "NON MD" || val.includes("ZSP")) return "NON-MD";
  }
  let def = String(r[1] || "").toUpperCase().trim();
  const isNumberOrBrand = /^\d+$/.test(def) || ["NEW ERA", "REEBOK", "CONVERSE", "PUMA", "SKECHERS", "CROCS", "NIKE", "ADIDAS", "DIADORA", "AIRWALK"].includes(def);
  
  if (isNumberOrBrand) {
      const col2 = String(r[2] || "").toUpperCase().trim();
      if (col2 && !/^\d+$/.test(col2)) return col2;
      return "UNCATEGORIZED"; // Never return numbers or brands as category!
  }
  
  return def || "UNCATEGORIZED";
}

/* ---------- STOCK PER CATEGORY ---------- */
function calcStockPerCategory(rows, activeDiscounts) {
  const cats = {};

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;

    const category = getStandardCategory(r);
    const qty = toNum(r[7]);
    
    // Extract discount
    const price = toNum(r[6]);
    const discount = typeof kangodingPrice === 'function' ? kangodingPrice(price, category) : "";
    
    if (activeDiscounts && activeDiscounts.size > 0 && discount && !activeDiscounts.has(discount)) continue;

    if (!category || qty <= 0) continue;

    if (!cats[category]) cats[category] = 0;
    cats[category] += qty;
  }

  return cats;
}

/* ---------- SALES PER CATEGORY FROM MSR ---------- */
function calcSalesPerCategory(rows, activeDiscounts) {
  const cats = {};

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;

    const division = getStandardCategory(r);

    // Skip header rows and totals based on common values in column A or B
    const rawCol0 = String(r[0] || "").toUpperCase().trim();
    const rawCol1 = String(r[1] || "").toUpperCase().trim();
    if (
      !rawCol0 ||
      rawCol0.startsWith("TOTAL") ||
      rawCol0.startsWith("GRAND") ||
      !rawCol1 ||
      rawCol1 === "PRODUCT DIVISION" ||
      rawCol1.startsWith("TOTAL") ||
      rawCol1.startsWith("GRAND")
    )
      continue;

    const qty = Math.abs(toNum(r[6]));
    const sales = toNum(r[8]); // Total Rupiah
    
    // Extract discount for MSR
    const discountAmt = toNum(r[7]);
    const total = discountAmt + sales;
    const hargaAsli = qty > 0 ? Math.round(total / qty) : 0;
    const discount = typeof kangodingPrice === 'function' ? kangodingPrice(hargaAsli, division) : "";

    if (activeDiscounts && activeDiscounts.size > 0 && discount && !activeDiscounts.has(discount)) continue;

    if (!cats[division]) cats[division] = { qty: 0, sales: 0 };
    cats[division].qty += qty;
    cats[division].sales += sales;
  }

  return cats;
}

/* ---------- BUILD IL TABLE ---------- */
function buildILTable(stockPerCat, salesPerMonth) {
  // Get all unique categories
  const allCats = new Set([
    ...Object.keys(stockPerCat),
    ...salesPerMonth.flatMap((s) => Object.keys(s)),
  ]);

  const monthCount = salesPerMonth.length || 1;
  const result = [];

  allCats.forEach((category) => {
    if (category === "UNCATEGORIZED") return; // Optional: skip uncategorized
    
    const stockQty = stockPerCat[category] || 0;
    const sales1 = salesPerMonth[0] && salesPerMonth[0][category] ? salesPerMonth[0][category] : {qty: 0, sales: 0};
    const sales2 = salesPerMonth[1] && salesPerMonth[1][category] ? salesPerMonth[1][category] : {qty: 0, sales: 0};
    const sales3 = salesPerMonth[2] && salesPerMonth[2][category] ? salesPerMonth[2][category] : {qty: 0, sales: 0};

    const totalSalesQty = sales1.qty + sales2.qty + sales3.qty;
    const totalSalesRp = sales1.sales + sales2.sales + sales3.sales;
    const avgSalesQty = Math.round(totalSalesQty / monthCount);
    const avgSalesRp = Math.round(totalSalesRp / monthCount);
    
    const ilRatio = avgSalesQty > 0 ? stockQty / avgSalesQty : 0;

    let ilStatus;
    if (avgSalesQty === 0) {
      ilStatus = "NO SALES DATA";
    } else if (ilRatio < 2) {
      ilStatus = "STOCK KURANG";
    } else if (ilRatio <= 4) {
      ilStatus = "STOCK IDEAL";
    } else {
      ilStatus = "STOCK BERLEBIH";
    }

    result.push({
      category,
      stockQty,
      sales1: sales1.qty,
      sales1Rp: sales1.sales,
      sales2: sales2.qty,
      sales2Rp: sales2.sales,
      sales3: sales3.qty,
      sales3Rp: sales3.sales,
      avgSales: avgSalesQty,
      avgSalesRp: avgSalesRp,
      ilRatio: Math.round(ilRatio * 100) / 100,
      ilStatus,
    });
  });

  // Sort by category name
  result.sort((a, b) => a.category.localeCompare(b.category));

  return result;
}

let ilCategoryFilter = new Set();

/* ---------- DRAW IL TABLE ---------- */
function drawILTable(rows) {
  const body = document.querySelector("#ilTable tbody");
  if (!body) return;

  body.innerHTML = "";

  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="8">NO DATA</td></tr>';
    return;
  }

  // Update Checkboxes if filter is empty
  const filterContainer = document.getElementById("ilCategoryCheckboxes");
  if (filterContainer && ilCategoryFilter.size === 0 && rows.length > 0) {
      let cbHtml = "";
      rows.forEach(r => {
          ilCategoryFilter.add(r.category);
          cbHtml += `<label><input type="checkbox" class="il-cat-cb" value="${r.category}" checked> ${r.category}</label>`;
      });
      filterContainer.innerHTML = cbHtml;
      
      document.querySelectorAll(".il-cat-cb").forEach(cb => {
          cb.addEventListener("change", (e) => {
              if (e.target.checked) ilCategoryFilter.add(e.target.value);
              else ilCategoryFilter.delete(e.target.value);
              drawILTable(window.ilTableData);
              updateILSummary(window.ilTableData);
          });
      });
  }

  // Filter rows
  const filteredRows = rows.filter(r => ilCategoryFilter.size === 0 || ilCategoryFilter.has(r.category));

  filteredRows.forEach((r) => {
    let ratioClass = "";
    if (r.avgSales > 0) {
      if (r.ilRatio < 2) ratioClass = "il-ratio-bad";
      else if (r.ilRatio <= 4) ratioClass = "il-ratio-good";
      else ratioClass = "il-ratio-warn";
    }
    
    const fMoney = (val) => val === 0 ? "-" : val.toLocaleString("en-US");

    body.insertAdjacentHTML(
      "beforeend",
      `
      <tr>
        <td style="font-weight:bold;">${r.category}</td>
        <td style="font-weight:bold; font-size:14px;">${r.stockQty.toLocaleString()}</td>
        <td><div style="font-weight:bold;">${r.sales1.toLocaleString()}</div><div style="font-size:11px; color:#666;">${fMoney(r.sales1Rp)}</div></td>
        <td><div style="font-weight:bold;">${r.sales2.toLocaleString()}</div><div style="font-size:11px; color:#666;">${fMoney(r.sales2Rp)}</div></td>
        <td><div style="font-weight:bold;">${r.sales3.toLocaleString()}</div><div style="font-size:11px; color:#666;">${fMoney(r.sales3Rp)}</div></td>
        <td style="background:#f8fafc;"><div style="font-weight:bold;">${r.avgSales.toLocaleString()}</div><div style="font-size:11px; color:#666;">${fMoney(r.avgSalesRp)}</div></td>
        <td class="${ratioClass}">${r.ilRatio.toFixed(2)}</td>
        <td class="${ratioClass}">${r.ilStatus}</td>
      </tr>
    `,
    );
  });
}

/* ---------- UPDATE IL SUMMARY ---------- */
function updateILSummary(rows) {
  const filteredRows = rows.filter(r => ilCategoryFilter.size === 0 || ilCategoryFilter.has(r.category));
  const totalCat = filteredRows.length;
  const totalStock = filteredRows.reduce((a, b) => a + b.stockQty, 0);
  const totalAvgSales = filteredRows.reduce((a, b) => a + b.avgSales, 0);
  const overallIL = totalAvgSales > 0 ? totalStock / totalAvgSales : 0;

  document.getElementById("ilTotalCat").innerText = totalCat.toLocaleString("en-US");
  document.getElementById("ilTotalStock").innerText = totalStock.toLocaleString("en-US");
  document.getElementById("ilAvgSales").innerText = totalAvgSales.toLocaleString("en-US");
  document.getElementById("ilOverall").innerText = overallIL.toFixed(2);
}
