/* ========================================
   GT BROKEN SIZE - EXPORT.JS
   Export Excel for both Broken Size & IL
   ======================================== */

document.getElementById("export").onclick = exportData;

function exportData() {
  // Check which tab is active
  const bsTab = document.getElementById("tab-broken");
  const isBS = bsTab && bsTab.classList.contains("active");

  if (isBS) {
    exportBrokenSize();
  } else {
    exportIL();
  }
}

function exportBrokenSize() {
  const rows = window.bsFilteredData || [];

  if (!rows.length) {
    alert("Tidak ada data");
    return;
  }

  const exportRows = rows.map(x => ({
    BRAND: x.brand,
    CATEGORY: x.category,
    ARTIKEL: x.artikel,
    DESCRIPTION: x.desc,
    DISCOUNT: x.discount,
    SIZES: x.sizes,
    "SIZE COUNT": x.sizeCount,
    STATUS: x.status,
    "TOTAL QTY": x.totalQty
  }));

  const ws = XLSX.utils.json_to_sheet(exportRows);

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "BROKEN SIZE");

  ws["!cols"] = [
    { wch: 18 }, { wch: 18 }, { wch: 18 }, { wch: 40 },
    { wch: 12 }, { wch: 30 }, { wch: 12 }, { wch: 14 }, { wch: 12 }
  ];

  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, 0)}-${String(now.getDate()).padStart(2, 0)}`;

  XLSX.writeFile(wb, `GT_BROKEN_SIZE_${stamp}.xlsx`);
}

function exportIL() {
  const rows = window.ilTableData || [];

  if (!rows.length) {
    alert("Tidak ada data IL");
    return;
  }

  const exportRows = rows.map(x => ({
    CATEGORY: x.category,
    "STOCK QTY": x.stockQty,
    "SALES BULAN 1": x.sales1,
    "SALES BULAN 2": x.sales2,
    "SALES BULAN 3": x.sales3,
    "AVG SALES / BULAN": x.avgSales,
    "IL RATIO": x.ilRatio,
    STATUS: x.ilStatus
  }));

  const ws = XLSX.utils.json_to_sheet(exportRows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "INVENTORY LEVEL");

  ws["!cols"] = [
    { wch: 18 }, { wch: 14 }, { wch: 16 }, { wch: 16 },
    { wch: 16 }, { wch: 18 }, { wch: 12 }, { wch: 16 }
  ];

  const now = new Date();
  const stamp = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, 0)}-${String(now.getDate()).padStart(2, 0)}`;

  XLSX.writeFile(wb, `GT_INVENTORY_LEVEL_${stamp}.xlsx`);
}
