document.getElementById("print").onclick = printData;

function printData() {
  const rows = window.filteredData || [];
  if (!rows.length) {
    alert("No data untuk di print");
    return;
  }

  const now = new Date();
  const generatedAt = now.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  let html = `
    <html>
    <head>
    <title>Print - Change Price</title>
    <style>
        body { font-family: sans-serif; margin: 20px; }
        h2 { text-align: center; margin-bottom: 5px; }
        p.meta { text-align: center; font-style: italic; color: #555; margin-bottom: 20px; }
        table { width: 100%; border-collapse: collapse; font-size: 12px; }
        th, td { border: 1px solid #000; padding: 6px; text-align: left; }
        th { background-color: #00ffff; }
        .bg-true { background-color: #d4edda !important; color: #155724; }
        .bg-false { background-color: #f8d7da !important; color: #721c24; }
        @media print {
            .bg-true { background-color: #d4edda !important; -webkit-print-color-adjust: exact; color-adjust: exact; }
            .bg-false { background-color: #f8d7da !important; -webkit-print-color-adjust: exact; color-adjust: exact; }
            th { background-color: #00ffff !important; -webkit-print-color-adjust: exact; color-adjust: exact; }
        }
    </style>
    </head>
    <body>
        <h2>KANGODING.ORG - SMS CHANGE PRICE</h2>
        <p class="meta">GENERATED: ${generatedAt}</p>
        <table>
            <thead>
                <tr>
                    <th>BRAND</th>
                    <th>CATEGORY</th>
                    <th>ARTIKEL</th>
                    <th>DESCRIPTION</th>
                    <th>STATUS</th>
                    <th>PRICE LAMA</th>
                    <th>NEW PRICE</th>
                    <th>DISC LAMA</th>
                    <th>NEW DISC</th>
                    <th>STOCK QTY</th>
                </tr>
            </thead>
            <tbody>
  `;

  rows.forEach((x) => {
    const bgClass = x.status === "TRUE" ? "bg-true" : "bg-false";
    const priceLamaStr = Number(x.oldPrice || 0).toLocaleString("id-ID");
    const priceBaruStr = x.newPrice !== "-" ? Number(x.newPrice).toLocaleString("id-ID") : "-";
    html += `
        <tr class="${bgClass}">
            <td>${x.brand || ""}</td>
            <td>${x.category || ""}</td>
            <td>${x.artikel || ""}</td>
            <td>${x.desc || ""}</td>
            <td style="font-weight: bold;">${x.status || ""}</td>
            <td>${priceLamaStr}</td>
            <td>${priceBaruStr}</td>
            <td>${x.oldDiscount || ""}</td>
            <td>${x.newDiscount || ""}</td>
            <td>${x.qty || ""}</td>
        </tr>
    `;
  });

  html += `
            </tbody>
        </table>
        <script>
            window.onload = () => { window.print(); window.close(); }
        </script>
    </body>
    </html>
  `;

  const win = window.open("", "_blank");
  win.document.write(html);
  win.document.close();
}



