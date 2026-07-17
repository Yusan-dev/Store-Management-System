/* ========================================
   GT BROKEN SIZE - EXPORT.JS
   Export Excel for both Broken Size & IL
   ======================================== */

document.getElementById("export").onclick = exportData;

/**
 * Mengekspor data sesuai dengan tab yang sedang aktif (Broken Size atau IL).
 */
function exportData() {
  const bsTab = document.getElementById("tab-broken");
  const isBS = bsTab && bsTab.classList.contains("active");

  if (isBS) {
    exportBrokenSize();
  } else {
    exportIL();
  }
}

/**
 * Mengekspor data Broken Size ke dalam file Excel (.xls)
 * dengan gaya warna dan border kustom berbasis XML mso.
 */
function exportBrokenSize() {
  const rows = window.bsFilteredData || [];

  if (!rows.length) {
    alert("Tidak ada data");
    return;
  }

  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const generatedAt = now.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  let html = `
  <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
  <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>BROKEN SIZE</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
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
      <tr><td colspan="9" class="title">KANGODING.ORG - GT BROKEN SIZE</td></tr>
      <tr><td colspan="9" class="meta">GENERATED: ${generatedAt}</td></tr>
      <tr></tr>
      <tr>
          <th class="th-bg">BRAND</th>
          <th class="th-bg">CATEGORY</th>
          <th class="th-bg">ARTIKEL</th>
          <th class="th-bg">DESCRIPTION</th>
          <th class="th-bg">DISCOUNT</th>
          <th class="th-bg">SIZES</th>
          <th class="th-bg">SIZE COUNT</th>
          <th class="th-bg">STATUS</th>
          <th class="th-bg">TOTAL QTY</th>
      </tr>
  `;

  rows.forEach((x) => {
    html += `<tr>
          <td class="td-border">${x.brand || ""}</td>
          <td class="td-border">${x.category || ""}</td>
          <td class="td-border">${x.artikel || ""}</td>
          <td class="td-border">${x.desc || ""}</td>
          <td class="td-border">${x.discount || ""}</td>
          <td class="td-border">${x.sizes || ""}</td>
          <td class="td-border">${x.sizeCount || ""}</td>
          <td class="td-border">${x.status || ""}</td>
          <td class="td-border">${x.totalQty || ""}</td>
      </tr>`;
  });

  html += `</table></body></html>`;

  let blob = new Blob([html], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  let link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `GT_BROKEN_SIZE_${stamp}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

/**
 * Mengekspor data Inventory Level (IL) ke dalam file Excel (.xls)
 * dengan gaya warna dan border kustom berbasis XML mso.
 */
function exportIL() {
  const rows = window.ilTableData || [];

  if (!rows.length) {
    alert("Tidak ada data IL");
    return;
  }

  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  const generatedAt = now.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  let html = `
  <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
  <head>
  <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>INVENTORY LEVEL</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
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
      <tr><td colspan="8" class="title">KANGODING.ORG - GT INVENTORY LEVEL</td></tr>
      <tr><td colspan="8" class="meta">GENERATED: ${generatedAt}</td></tr>
      <tr></tr>
      <tr>
          <th class="th-bg">CATEGORY</th>
          <th class="th-bg">STOCK QTY</th>
          <th class="th-bg">SALES BULAN 1</th>
          <th class="th-bg">SALES BULAN 2</th>
          <th class="th-bg">SALES BULAN 3</th>
          <th class="th-bg">AVG SALES / BULAN</th>
          <th class="th-bg">IL RATIO</th>
          <th class="th-bg">STATUS</th>
      </tr>
  `;

  rows.forEach((x) => {
    html += `<tr>
          <td class="td-border">${x.category || ""}</td>
          <td class="td-border">${x.stockQty || ""}</td>
          <td class="td-border">${x.sales1 || ""}</td>
          <td class="td-border">${x.sales2 || ""}</td>
          <td class="td-border">${x.sales3 || ""}</td>
          <td class="td-border">${x.avgSales || ""}</td>
          <td class="td-border">${x.ilRatio || ""}</td>
          <td class="td-border">${x.ilStatus || ""}</td>
      </tr>`;
  });

  html += `</table></body></html>`;

  let blob = new Blob([html], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  let link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `GT_INVENTORY_LEVEL_${stamp}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
