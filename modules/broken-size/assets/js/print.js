/* ========================================
   MAA BROKEN SIZE - PRINT.JS
   Print PDF for both Broken Size & IL
   ======================================== */

document.getElementById("print").onclick = printData;

function printData() {
  const bsTab = document.getElementById("tab-broken");
  const isBS = bsTab && bsTab.classList.contains("active");

  if (isBS) {
    printBrokenSize();
  } else {
    printIL();
  }
}

function printBrokenSize() {
  const rows = window.bsFilteredData || [];

  if (!rows.length) {
    alert("No data");
    return;
  }

  const total = rows.length;
  const broken = rows.filter((x) => x.status === "BROKEN").length;
  const notBroken = rows.filter((x) => x.status === "NOT BROKEN").length;
  const totalQty = rows.reduce((a, b) => a + (Number(b.totalQty) || 0), 0);

  let html = `
  <html>
  <head>
  <title>MAA BROKEN SIZE</title>
  <style>
  @page { size: A4 landscape; margin: 10mm; }
  * { box-sizing: border-box; }
  body { margin: 0; font-family: Arial, sans-serif; color: #111; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; border-bottom: 2px solid #111; padding-bottom: 12px; margin-bottom: 14px; }
  .title { font-size: 22px; font-weight: 800; }
  .meta { font-size: 11px; line-height: 1.5; color: #333; text-align: right; }
  .summary { display: flex; gap: 18px; font-size: 12px; margin-bottom: 12px; }
  .summary strong { font-size: 14px; }
  table { width: 100%; border-collapse: collapse; font-size: 9px; }
  th { background: #111827; color: #fff; }
  th, td { border: 1px solid #d6dbe3; padding: 5px 6px; text-align: left; vertical-align: top; }
  tr { break-inside: avoid; }
  .broken { color: #FF0000; font-weight: 800; }
  .not-broken { color: #00AA00; font-weight: 800; }
  .footer { margin-top: 12px; text-align: center; color: #555; font-size: 10px; }
  </style>
  </head>
  <body>
  <div class="header">
    <div>
      <div class="title">MAA BROKEN SIZE ANALYSIS</div>
      <div>Professional Stock Intelligence Dashboard</div>
    </div>
    <div class="meta">
      Generated: ${new Date().toLocaleString()}<br>
      Paper: A4 Landscape
    </div>
  </div>
  <div class="summary">
    <div>Total Artikel<br><strong>${total.toLocaleString()}</strong></div>
    <div>Total QTY<br><strong>${totalQty.toLocaleString()}</strong></div>
    <div>Broken<br><strong style="color:red">${broken.toLocaleString()} (${((broken / total) * 100).toFixed(1)}%)</strong></div>
    <div>Not Broken<br><strong style="color:green">${notBroken.toLocaleString()} (${((notBroken / total) * 100).toFixed(1)}%)</strong></div>
  </div>
  <table>
  <thead>
  <tr>
    <th>BRAND</th><th>CATEGORY</th><th>ARTIKEL</th><th>DESCRIPTION</th>
    <th>DISCOUNT</th><th>SIZES</th><th>SIZE COUNT</th><th>STATUS</th><th>TOTAL QTY</th>
  </tr>
  </thead>
  <tbody>`;

  rows.forEach((r) => {
    const cls =
      r.status === "BROKEN"
        ? "broken"
        : r.status === "NOT BROKEN"
          ? "not-broken"
          : "";
    html += `
    <tr>
      <td>${r.brand}</td><td>${r.category}</td><td>${r.artikel}</td><td>${r.desc}</td>
      <td>${r.discount}</td><td>${r.sizes}</td><td>${r.sizeCount}</td><td class="${cls}">${r.status}</td>
      <td>${Number(r.totalQty).toLocaleString()}</td>
    </tr>`;
  });

  html += `
  </tbody></table>
  <div class="footer">KANGODING.ORG © 2026 - MAA BROKEN SIZE & IL</div>
  </body></html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 400);
}

function printIL() {
  const rows = window.ilTableData || [];

  if (!rows.length) {
    alert("No IL data");
    return;
  }

  let html = `
  <html>
  <head>
  <title>MAA INVENTORY LEVEL</title>
  <style>
  @page { size: A4 landscape; margin: 10mm; }
  body { margin: 0; font-family: Arial, sans-serif; color: #111; padding: 20px; }
  .title { font-size: 22px; font-weight: 800; margin-bottom: 20px; }
  table { width: 100%; border-collapse: collapse; font-size: 12px; }
  th { background: #FFDF00; color: #111; }
  th, td { border: 1px solid #d6dbe3; padding: 8px 10px; text-align: left; }
  .good { color: #00AA00; font-weight: 800; }
  .warn { color: #FF8800; font-weight: 800; }
  .bad { color: #FF0000; font-weight: 800; }
  .footer { margin-top: 20px; text-align: center; color: #555; font-size: 10px; }
  </style>
  </head>
  <body>
  <div class="title">MAA INVENTORY LEVEL</div>
  <p>Generated: ${new Date().toLocaleString()}</p><br>
  <table>
  <thead><tr>
    <th>CATEGORY</th><th>STOCK QTY</th><th>SALES BULAN 1</th><th>SALES BULAN 2</th>
    <th>SALES BULAN 3</th><th>AVG SALES / BULAN</th><th>IL RATIO</th><th>STATUS</th>
  </tr></thead>
  <tbody>`;

  rows.forEach((r) => {
    const cls = r.ilRatio < 2 ? "bad" : r.ilRatio <= 4 ? "good" : "warn";
    html += `
    <tr>
      <td>${r.category}</td><td>${r.stockQty.toLocaleString()}</td>
      <td>${r.sales1.toLocaleString()}</td><td>${r.sales2.toLocaleString()}</td>
      <td>${r.sales3.toLocaleString()}</td><td>${r.avgSales.toLocaleString()}</td>
      <td class="${cls}">${r.ilRatio.toFixed(2)}</td><td class="${cls}">${r.ilStatus}</td>
    </tr>`;
  });

  html += `
  </tbody></table>
  <div class="footer">KANGODING.ORG © 2026 - MAA BROKEN SIZE & IL</div>
  </body></html>`;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
  setTimeout(() => win.print(), 400);
}


