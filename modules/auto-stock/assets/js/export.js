document.getElementById("export").onclick = exportFiltered;

/**
 * Mengubah data yang sudah difilter menjadi format HTML table khusus (XML mso)
 * dan men-downloadnya sebagai file .xls agar sesuai warna dan formatnya.
 */
function exportFiltered() {
  const rows = window.filteredData || [];
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
    <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>GT AUTO STOCK</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
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
        <tr><td colspan="8" class="title">KANGODING.ORG - GT AUTO STOCK</td></tr>
        <tr><td colspan="8" class="meta">GENERATED: ${generatedAt}</td></tr>
        <tr></tr>
        <tr>
            <th class="th-bg">BRAND</th>
            <th class="th-bg">CATEGORY</th>
            <th class="th-bg">ARTIKEL</th>
            <th class="th-bg">DESCRIPTION</th>
            <th class="th-bg">PRICE</th>
            <th class="th-bg">STATUS</th>
            <th class="th-bg">GENDER</th>
            <th class="th-bg">QTY</th>
        </tr>
    `;

  rows.forEach((x) => {
    html += `<tr>
            <td class="td-border">${x.brand || ""}</td>
            <td class="td-border">${x.category || ""}</td>
            <td class="td-border">${x.artikel || ""}</td>
            <td class="td-border">${x.desc || ""}</td>
            <td class="td-border">${x.price || ""}</td>
            <td class="td-border">${x.status || ""}</td>
            <td class="td-border">${x.gender || ""}</td>
            <td class="td-border">${x.qty || ""}</td>
        </tr>`;
  });

  html += `</table></body></html>`;

  let blob = new Blob([html], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
  let link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `GT_AUTO_STOCK_${stamp}.xls`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
