document.getElementById("print").addEventListener("click", function() {
    const tableElement = document.getElementById("tableBody");
    if (!tableElement || tableElement.innerText.includes("BELUM ADA DATA")) {
        alert("Tidak ada data untuk diprint. Silakan proses data terlebih dahulu.");
        return;
    }
    
    const tableHtml = tableElement.parentElement.outerHTML;
    const now = new Date();
    const generatedAt = now.toLocaleString("id-ID", { dateStyle: "medium", timeStyle: "short" });
    const period = document.getElementById("performanceFilterInfo") ? document.getElementById("performanceFilterInfo").innerText : "STORE SALES";

    let html = `
    <html>
    <head>
    <title>Print - Store Sales</title>
    <style>
        body { font-family: monospace; margin: 20px; font-size: 12px; }
        h2 { text-align: center; margin-bottom: 5px; font-family: sans-serif; }
        p.meta { text-align: center; font-style: italic; color: #555; margin-bottom: 20px; font-family: sans-serif; }
        table { width: 100%; border-collapse: collapse; font-size: 11px; }
        th, td { border: 1px solid #000; padding: 6px; text-align: right; }
        th { background-color: #f0f0f0; text-align: center; font-weight: bold; }
        td:first-child { text-align: left; }
        
        /* Preserve colors for print */
        @media print {
            * { -webkit-print-color-adjust: exact !important; color-adjust: exact !important; }
            th { background-color: #f0f0f0 !important; }
        }
    </style>
    </head>
    <body>
        <h2>MAA STORE SALES ACHIEVEMENT</h2>
        <p class="meta">${period} <br> GENERATED: ${generatedAt}</p>
        ${tableHtml}
        <script>
            window.onload = () => { window.print(); window.close(); }
        </script>
    </body>
    </html>
    `;

    const win = window.open("", "_blank");
    win.document.write(html);
    win.document.close();
});
