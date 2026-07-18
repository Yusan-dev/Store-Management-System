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

/* ---------- PROCESS IL ---------- */
async function processIL(stockRows) {
  const msr1File = document.getElementById("msr1").files[0];
  const msr2File = document.getElementById("msr2").files[0];
  const msr3File = document.getElementById("msr3").files[0];

  // IL needs at least stock + 1 MSR file
  if (!msr1File && !msr2File && !msr3File) {
    console.log("IL: No MSR files uploaded, skipping IL calculation");
    return;
  }

  try {
    // Parse MSR files
    const msrFiles = [msr1File, msr2File, msr3File].filter(Boolean);
    const msrDataArr = [];

    for (const file of msrFiles) {
      const data = await readExcel(file);
      msrDataArr.push(data);
    }

    // Calculate stock per category from stock file
    const stockPerCat = calcStockPerCategory(stockRows);

    // Calculate sales per category per month from MSR files
    const salesPerMonth = msrDataArr.map((rows) => calcSalesPerCategory(rows));

    // Combine into IL table
    const ilData = buildILTable(stockPerCat, salesPerMonth);
    window.ilTableData = ilData;

    // Render IL table
    drawILTable(ilData);
    updateILSummary(ilData);
  } catch (err) {
    console.error("IL Error:", err);
    alert("Failed memproses IL: " + err.message);
  }
}

/* ---------- STOCK PER CATEGORY ---------- */
function calcStockPerCategory(rows) {
  const cats = {};

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;

    const category = String(r[1] || "")
      .toUpperCase()
      .trim();
    const qty = Number(r[7]) || 0;

    if (!category || qty <= 0) continue;

    if (!cats[category]) cats[category] = 0;
    cats[category] += qty;
  }

  return cats;
}

/* ---------- SALES PER CATEGORY FROM MSR ---------- */
function calcSalesPerCategory(rows) {
  const cats = {};

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (!r) continue;

    const division = String(r[1] || "")
      .toUpperCase()
      .trim();

    // Skip header rows and totals
    if (
      !division ||
      division === "PRODUCT DIVISION" ||
      division.startsWith("TOTAL") ||
      division.startsWith("GRAND")
    )
      continue;

    const qty = Math.abs(Number(r[6]) || 0);

    if (!cats[division]) cats[division] = 0;
    cats[division] += qty;
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
    const stockQty = stockPerCat[category] || 0;
    const sales1 = salesPerMonth[0] ? salesPerMonth[0][category] || 0 : 0;
    const sales2 = salesPerMonth[1] ? salesPerMonth[1][category] || 0 : 0;
    const sales3 = salesPerMonth[2] ? salesPerMonth[2][category] || 0 : 0;

    const totalSales = sales1 + sales2 + sales3;
    const avgSales = Math.round(totalSales / monthCount);
    const ilRatio = avgSales > 0 ? stockQty / avgSales : 0;

    let ilStatus;
    if (avgSales === 0) {
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
      sales1,
      sales2,
      sales3,
      avgSales,
      ilRatio: Math.round(ilRatio * 100) / 100,
      ilStatus,
    });
  });

  // Sort by category name
  result.sort((a, b) => a.category.localeCompare(b.category));

  return result;
}

/* ---------- DRAW IL TABLE ---------- */
function drawILTable(rows) {
  const body = document.querySelector("#ilTable tbody");
  if (!body) return;

  body.innerHTML = "";

  if (!rows.length) {
    body.innerHTML = '<tr><td colspan="8">NO DATA</td></tr>';
    return;
  }

  rows.forEach((r) => {
    let ratioClass = "";
    if (r.avgSales > 0) {
      if (r.ilRatio < 2) ratioClass = "il-ratio-bad";
      else if (r.ilRatio <= 4) ratioClass = "il-ratio-good";
      else ratioClass = "il-ratio-warn";
    }

    body.insertAdjacentHTML(
      "beforeend",
      `
      <tr>
        <td>${r.category}</td>
        <td>${r.stockQty.toLocaleString()}</td>
        <td>${r.sales1.toLocaleString()}</td>
        <td>${r.sales2.toLocaleString()}</td>
        <td>${r.sales3.toLocaleString()}</td>
        <td>${r.avgSales.toLocaleString()}</td>
        <td class="${ratioClass}">${r.ilRatio.toFixed(2)}</td>
        <td class="${ratioClass}">${r.ilStatus}</td>
      </tr>
    `,
    );
  });
}

/* ---------- UPDATE IL SUMMARY ---------- */
function updateILSummary(rows) {
  const totalCat = rows.length;
  const totalStock = rows.reduce((a, b) => a + b.stockQty, 0);
  const totalAvgSales = rows.reduce((a, b) => a + b.avgSales, 0);
  const overallIL = totalAvgSales > 0 ? totalStock / totalAvgSales : 0;

  document.getElementById("ilTotalCat").innerText = totalCat.toLocaleString();
  document.getElementById("ilTotalStock").innerText =
    totalStock.toLocaleString();
  document.getElementById("ilAvgSales").innerText =
    totalAvgSales.toLocaleString();
  document.getElementById("ilOverall").innerText = overallIL.toFixed(2);
}


