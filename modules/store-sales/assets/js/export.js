document.getElementById("export").addEventListener("click", async function() {
    const tableElement = document.getElementById("tableBody");
    if (!tableElement || tableElement.innerText.includes("NO DATA AVAILABLE")) {
        alert("No data to export. Please process data first.");
        return;
    }

    const table = tableElement.parentElement;
    
    // Function to clean formatting and return raw numbers for Excel
    function cleanNumber(str) {
        if (!str) return "";
        let cleaned = str.replace(/Rp/gi, "").trim();
        // Handle dots (thousands separators vs decimal separators)
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

    // Build a brand new clean table for export to split TY and LY and format numbers properly
    const exportTable = document.createElement("table");
    exportTable.setAttribute("border", "1");
    exportTable.style.borderCollapse = "collapse";
    exportTable.style.fontFamily = "monospace";

    // 1. Process Headers
    const originalHeaders = Array.from(table.querySelectorAll("thead th"));
    const thead = document.createElement("thead");
    const headerRow = document.createElement("tr");
    headerRow.style.background = "#f0f0f0";
    
    // We map which columns have LY values
    const hasLyCompanion = [];
    
    originalHeaders.forEach((th, idx) => {
        const text = th.innerText.trim().toUpperCase();
        if (text === "DATE" || text === "TARGET") {
            hasLyCompanion.push(false);
            const newTh = document.createElement("th");
            newTh.innerText = text;
            newTh.style.border = "1pt solid black";
            newTh.style.padding = "8px";
            headerRow.appendChild(newTh);
        } else {
            hasLyCompanion.push(true);
            const thTy = document.createElement("th");
            thTy.innerText = `${text} (TY)`;
            thTy.style.border = "1pt solid black";
            thTy.style.padding = "8px";
            headerRow.appendChild(thTy);

            const thLy = document.createElement("th");
            thLy.innerText = `${text} (LY/COMP)`;
            thLy.style.border = "1pt solid black";
            thLy.style.padding = "8px";
            headerRow.appendChild(thLy);
        }
    });
    thead.appendChild(headerRow);
    exportTable.appendChild(thead);

    // 2. Process Body Rows
    const tbody = document.createElement("tbody");
    const originalRows = Array.from(table.querySelectorAll("tbody tr"));
    
    originalRows.forEach(tr => {
        const newTr = document.createElement("tr");
        const cells = Array.from(tr.querySelectorAll("td"));
        
        cells.forEach((td, idx) => {
            const hasComp = hasLyCompanion[idx];
            const html = td.innerHTML;
            
            // Extract TY and Comp values
            let tyText = html.split(/<br|<span/i)[0] || "";
            let compText = "";
            const compMatch = html.match(/\((?:LY|LM|LW):\s*([^)]+)\)/i);
            if (compMatch) {
                compText = compMatch[1];
            }

            if (idx === 0) {
                // Date column - keep as text
                const newTd = document.createElement("td");
                newTd.innerText = td.innerText.trim();
                newTd.style.border = "1pt solid black";
                newTd.style.padding = "8px";
                newTr.appendChild(newTd);
            } else if (!hasComp) {
                // Target column or other single column
                const newTd = document.createElement("td");
                const val = cleanNumber(tyText);
                newTd.innerText = val;
                newTd.style.border = "1pt solid black";
                newTd.style.padding = "8px";
                newTd.style.textAlign = "right";
                // Force numeric type in Excel
                if (val !== "") newTd.setAttribute("x:num", val);
                newTr.appendChild(newTd);
            } else {
                // Split TY and LY
                const tdTy = document.createElement("td");
                const valTy = cleanNumber(tyText);
                tdTy.innerText = valTy;
                tdTy.style.border = "1pt solid black";
                tdTy.style.padding = "8px";
                tdTy.style.textAlign = "right";
                if (valTy !== "") tdTy.setAttribute("x:num", valTy);
                newTr.appendChild(tdTy);

                const tdLy = document.createElement("td");
                const valLy = cleanNumber(compText);
                tdLy.innerText = valLy;
                tdLy.style.border = "1pt solid black";
                tdLy.style.padding = "8px";
                tdLy.style.textAlign = "right";
                if (valLy !== "") tdLy.setAttribute("x:num", valLy);
                newTr.appendChild(tdLy);
            }
        });
        tbody.appendChild(newTr);
    });
    exportTable.appendChild(tbody);

    let html = exportTable.outerHTML;

    const salesCategoryElement = document.getElementById("salesCategorySection");
    if (salesCategoryElement) {
        const salesCategoryClone = salesCategoryElement.cloneNode(true);
        // Clean categories table cells as well
        salesCategoryClone.querySelectorAll("td").forEach(td => {
            const rawVal = cleanNumber(td.innerText);
            if (rawVal && !isNaN(rawVal)) {
                td.innerText = rawVal;
                td.setAttribute("x:num", rawVal);
            }
        });
        html += "<br><br>" + salesCategoryClone.outerHTML;
    }

    const topArticlesElement = document.getElementById("topArticlesSection");
    if (topArticlesElement) {
        const topArticlesClone = topArticlesElement.cloneNode(true);
        topArticlesClone.querySelectorAll("td").forEach(td => {
            const rawVal = cleanNumber(td.innerText);
            if (rawVal && !isNaN(rawVal)) {
                td.innerText = rawVal;
                td.setAttribute("x:num", rawVal);
            }
        });
        html += "<br><br>" + topArticlesClone.outerHTML;
    }
    
    let template = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office"
          xmlns:x="urn:schemas-microsoft-com:office:excel"
          xmlns="http://www.w3.org/TR/REC-html40">
    <head>
        <meta charset="utf-8">
        <!--[if gte mso 9]>
        <xml>
            <x:ExcelWorkbook>
                <x:ExcelWorksheets>
                    <x:ExcelWorksheet>
                        <x:Name>Store Sales</x:Name>
                        <x:WorksheetOptions>
                            <x:DisplayGridlines/>
                        </x:WorksheetOptions>
                    </x:ExcelWorksheet>
                </x:ExcelWorksheets>
            </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
            table { border-collapse: collapse; font-family: monospace; }
        </style>
    </head>
    <body>
        <h2>MAA STORE SALES ACHIEVEMENT</h2>
        ${html}
    </body>
    </html>
    `;
    
    const blob = new Blob([template], { type: "application/vnd.ms-excel" });
    
    let useFallback = !window.showSaveFilePicker;
    if (window.showSaveFilePicker) {
      try {
        const handle = await window.showSaveFilePicker({
          suggestedName: "Store_Sales_Achievement.xls",
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
      a.href = url; a.download = "Store_Sales_Achievement.xls";
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    }
    
    // Auto-copy clean table ke clipboard
    navigator.clipboard.write([
      new ClipboardItem({
        "text/html": new Blob([exportTable.outerHTML], { type: "text/html" }),
        "text/plain": new Blob([exportTable.innerText], { type: "text/plain" })
      })
    ]).catch(() => {});
});
