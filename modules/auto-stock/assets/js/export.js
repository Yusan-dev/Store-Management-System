document.getElementById("export").onclick = exportFiltered;

/**
 * Mengubah data yang sudah difilter menjadi format HTML table khusus (XML mso)
 * dan men-downloadnya sebagai file .xls agar sesuai warna dan formatnya.
 */
async function exportFiltered() {
  const rows = window.filteredData || [];
  if (!rows.length) {
    alert("No data");
    return;
  }

  let cols = [
    { key: "brand", label: "BRAND" },
    { key: "category", label: "CATEGORY" },
    { key: "artikel", label: "ARTIKEL" },
    { key: "generic", label: "GENERIC ARTICLE" },
    { key: "variant", label: "VARIANT" },
    { key: "desc", label: "DESCRIPTION" },
    { key: "price", label: "PRICE" },
    { key: "status", label: "STATUS" },
    { key: "gender", label: "GENDER" },
    { key: "qty", label: "QTY" },
  ];
  if (typeof gtGetVisibleColumnList === "function") {
    const visibleCols = gtGetVisibleColumnList();
    if (visibleCols.length) cols = visibleCols;
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
    <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>SMS AUTO STOCK</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
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
        <tr><td colspan="${cols.length}" class="title">KANGODING.ORG - SMS AUTO STOCK</td></tr>
        <tr><td colspan="${cols.length}" class="meta">GENERATED: ${generatedAt}</td></tr>
        <tr></tr>
        <tr>
            ${cols.map((c) => `<th class="th-bg">${c.label}</th>`).join("")}
        </tr>
    `;

  rows.forEach((x) => {
    html += `<tr>
            ${cols
              .map(
                (c) =>
                  `<td class="td-border">${
                    x[c.key] !== undefined && x[c.key] !== null ? x[c.key] : ""
                  }</td>`,
              )
              .join("")}
        </tr>`;
  });

  html += `</table></body></html>`;

  await saveFile(html, `AUTO_STOCK_${stamp}.xls`);
}

async function saveFile(html, filename) {
  const blob = new Blob([html], { type: "application/vnd.ms-excel;charset=utf-8" });
  let useFallback = !window.showSaveFilePicker;
  if (window.showSaveFilePicker) {
    try {
      const handle = await window.showSaveFilePicker({
        suggestedName: filename,
        types: [{ description: "Excel File", accept: { "application/vnd.ms-excel": [".xls"] } }]
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
    } catch (e) { 
      if (e.name === "AbortError") return; 
      useFallback = true;
    }
  }
  if (useFallback) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename;
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
  }
  const d = document.createElement("div"); d.innerHTML = html;
  const t = d.querySelector("table");
  if (t) { 
    const c = t.cloneNode(true); 
    function cleanNumber(str) {
        if (!str) return "";
        let cleaned = str.replace(/Rp/gi, "").trim();
        if ((cleaned.match(/\./g) || []).length > 1) {
            cleaned = cleaned.replace(/\./g, "");
        } else if ((cleaned.match(/\./g) || []).length === 1) {
            const parts = cleaned.split(".");
            if (parts[1] && parts[1].length === 3) {
                cleaned = cleaned.replace(/\./g, "");
            }
        }
        cleaned = cleaned.replace(/[^\d.-]/g, "");
        return cleaned;
    }
    c.querySelectorAll("td").forEach(td => {
        const txt = td.innerText.trim();
        const cleaned = cleanNumber(txt);
        if (cleaned !== "" && !isNaN(cleaned)) {
            td.innerText = cleaned;
            td.setAttribute("x:num", cleaned);
        }
    });
    navigator.clipboard.write([new ClipboardItem({"text/html": new Blob([`<table>${c.innerHTML}</table>`],{type:"text/html"})})]).catch(()=>{}); 
  }
}



