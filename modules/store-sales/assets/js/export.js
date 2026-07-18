document.getElementById("export").addEventListener("click", function() {
    const tableElement = document.getElementById("tableBody");
    if (!tableElement || tableElement.innerText.includes("NO DATA AVAILABLE")) {
        alert("No data to export. Please process data first.");
        return;
    }

    const table = tableElement.parentElement;
    const clone = table.cloneNode(true);
    clone.setAttribute("border", "1");
    
    // Add border to all cells inline for excel
    const cells = clone.querySelectorAll("th, td");
    cells.forEach(cell => {
        cell.style.border = "1pt solid black";
    });

    let html = clone.outerHTML;

    const salesCategoryElement = document.getElementById("salesCategorySection");
    if (salesCategoryElement) {
        const salesCategoryClone = salesCategoryElement.cloneNode(true);
        html += "<br><br>" + salesCategoryClone.outerHTML;
    }

    const topArticlesElement = document.getElementById("topArticlesSection");
    if (topArticlesElement) {
        const topArticlesClone = topArticlesElement.cloneNode(true);
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
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "Store_Sales_Achievement.xls";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
});

