let parsedDataByDate = {};
let selectedFile = null;

const STORAGE_KEY = "gt_sales_hourly_data";

function saveToLocalStorage() {
    const dataToSave = {};
    Object.keys(parsedDataByDate).forEach(date => {
        const dateData = parsedDataByDate[date];
        dataToSave[date] = {
            shifts: {},
            hourly: {}
        };
        Object.keys(dateData.shifts).forEach(shiftKey => {
            const shift = dateData.shifts[shiftKey];
            dataToSave[date].shifts[shiftKey] = {
                sales: shift.sales,
                tx: Array.from(shift.tx),
                qty: shift.qty
            };
        });
        Object.keys(dateData.hourly).forEach(hourKey => {
            const hourData = dateData.hourly[hourKey];
            dataToSave[date].hourly[hourKey] = {
                sales: hourData.sales,
                qty: hourData.qty,
                tx: Array.from(hourData.tx)
            };
        });
    });
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave));
}

function updateProgress(percent, text = null) {
    const progressFill = document.getElementById("loadingProgressFill");
    const progressPercent = document.getElementById("loadingPercent");
    const loadingText = document.getElementById("loadingText");
    
    progressFill.style.width = percent + "%";
    progressPercent.innerText = Math.round(percent) + "%";
    if (text) loadingText.innerText = text;
}

function loadFromLocalStorage() {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) return false;
    
    try {
        const data = JSON.parse(stored);
        parsedDataByDate = {};
        Object.keys(data).forEach(date => {
            parsedDataByDate[date] = {
                shifts: {},
                hourly: {}
            };
            Object.keys(data[date].shifts).forEach(shiftKey => {
                const shift = data[date].shifts[shiftKey];
                parsedDataByDate[date].shifts[shiftKey] = {
                    sales: shift.sales,
                    tx: new Set(shift.tx),
                    qty: shift.qty
                };
            });
            Object.keys(data[date].hourly).forEach(hourKey => {
                const hourData = data[date].hourly[hourKey];
                parsedDataByDate[date].hourly[hourKey] = {
                    sales: hourData.sales,
                    qty: hourData.qty,
                    tx: new Set(hourData.tx)
                };
            });
        });
        return true;
    } catch (err) {
        console.error("Error loading from localStorage:", err);
        return false;
    }
}

document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("excelFile");
    const fileLabel = document.getElementById("fileLabel");
    const processBtn = document.getElementById("processBtn");
    const clearCacheBtn = document.getElementById("clearCacheBtn");
    const dateSelect = document.getElementById("dateSelect");

    const spinner = document.getElementById("loadingSpinner");

    if (loadFromLocalStorage()) {
        spinner.classList.add("show");
        updateProgress(0, "Loading cached data...");
        
        setTimeout(() => {
            updateProgress(50, "Preparing dashboard...");
        }, 150);
        
        setTimeout(() => {
            populateDateDropdown();
            document.getElementById("filterContainer").style.display = "flex";
            document.getElementById("dashboardContent").style.display = "grid";
            updateProgress(100, "Done!");
        }, 300);
        
        setTimeout(() => {
            spinner.classList.remove("show");
        }, 800);
    }

    fileInput.addEventListener("change", (e) => {
        if (e.target.files.length > 0) {
            selectedFile = e.target.files[0];
            fileLabel.innerText = selectedFile.name;
        }
    });

    processBtn.addEventListener("click", async () => {
        if (!selectedFile) {
            alert("Please choose a file first!");
            return;
        }

        spinner.classList.add("show");
        updateProgress(0, "Reading Excel file...");

        try {
            const rows = await readExcel(selectedFile);
            updateProgress(30, "Parsing data...");
            
            parseHourlyData(rows);
            updateProgress(70, "Saving to cache...");
            
            saveToLocalStorage();
            updateProgress(85, "Preparing dashboard...");
            
            populateDateDropdown();
            updateProgress(100, "Done!");
            
            document.getElementById("filterContainer").style.display = "flex";
            document.getElementById("dashboardContent").style.display = "grid";
            
            setTimeout(() => {
                spinner.classList.remove("show");
            }, 600);
        } catch (err) {
            alert("Error processing Excel file: " + err.message);
            console.error(err);
            spinner.classList.remove("show");
        }
    });

    clearCacheBtn.addEventListener("click", () => {
        if (confirm("Clear all cached data? You'll need to upload the file again.")) {
            localStorage.removeItem(STORAGE_KEY);
            parsedDataByDate = {};
            selectedFile = null;
            fileLabel.innerText = "salesregisteritemdatewisehhmmss,xls/xlsx";
            document.getElementById("filterContainer").style.display = "none";
            document.getElementById("dashboardContent").style.display = "none";
            document.getElementById("dateSelect").innerHTML = '<option value="">-- Choose Date --</option>';
        }
    });

    dateSelect.addEventListener("change", (e) => {
        const date = e.target.value;
        if (date) {
            renderDateData(date);
        }
    });

    // Initialize click-to-copy on main tables
    function initMainTableCopy() {
        const cleanNumber = (str) => {
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
        };

        const copyCol = (tableId, colIdx) => {
            const table = document.getElementById(tableId);
            if (!table) return;
            const rows = Array.from(table.querySelectorAll("tbody tr"));
            const vals = [];
            
            rows.forEach(row => {
                const cells = row.querySelectorAll("td");
                // Skip grand total row if copying summary
                if (row.classList.contains("grand-total-row")) return;
                
                if (cells[colIdx]) {
                    const txt = cells[colIdx].innerText.trim();
                    if (colIdx > 0 && tableId !== "hourlyBreakdownTable" || (tableId === "hourlyBreakdownTable" && colIdx === 1)) {
                        vals.push(cleanNumber(txt));
                    } else {
                        vals.push(txt);
                    }
                }
            });

            if (!vals.length) return;

            // Generate temporary table for Excel Clipboard numeric recognition
            const box = document.createElement("div");
            let tblHtml = '<table style="border-collapse:collapse;">';
            vals.forEach(v => {
                const isNum = !isNaN(v) && v !== "";
                const attr = isNum ? ` x:num="${v}"` : "";
                tblHtml += `<tr><td${attr} style="border:1px solid #000;padding:4px 12px;font-family:monospace;">${v}</td></tr>`;
            });
            tblHtml += '</table>';
            box.innerHTML = tblHtml;

            navigator.clipboard.write([
                new ClipboardItem({
                    "text/html": new Blob([box.innerHTML], { type: "text/html" }),
                    "text/plain": new Blob([vals.join("\n")], { type: "text/plain" })
                })
            ]).then(() => {
                alert(`Kolom berhasil dicopy! Silakan paste langsung ke Excel.`);
            }).catch(err => {
                navigator.clipboard.writeText(vals.join("\n")).then(() => {
                    alert(`Kolom berhasil dicopy sebagai teks!`);
                });
            });
        };

        // Bind for Shift Summary
        document.querySelectorAll("#shiftSummaryTable thead th").forEach(th => {
            th.addEventListener("click", () => {
                const colIdx = th.parentNode.rowIndex === 0 ? th.cellIndex : th.cellIndex + 1;
                copyCol("shiftSummaryTable", colIdx);
            });
        });

        // Bind for Hourly Breakdown
        document.querySelectorAll("#hourlyBreakdownTable thead th").forEach(th => {
            th.addEventListener("click", () => {
                copyCol("hourlyBreakdownTable", th.cellIndex);
            });
        });
    }

    initMainTableCopy();
});

const readExcel = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result);
                const workbook = window.XLSX.read(data, { type: "array" });
                let allRows = [];
                workbook.SheetNames.forEach(sheetName => {
                    const rows = window.XLSX.utils.sheet_to_json(
                        workbook.Sheets[sheetName],
                        { header: 1 }
                    );
                    allRows = allRows.concat(rows);
                });
                resolve(allRows);
            } catch (err) {
                reject(err);
            }
        };
        reader.onerror = reject;
        reader.readAsArrayBuffer(file);
    });
};

function parseHourlyData(rows) {
    parsedDataByDate = {};
    let currentDate = "";
    let currentTimeSlot = "";
    let currentInvoice = "";

    const parseNum = (val) => {
        if (typeof val === "number") return val;
        const str = String(val || "").replace(/[Rr][Pp]\s*/g, "").trim();
        if (!str) return 0;
        const hasDotThousands = /^\d{1,3}(\.\d{3})+([,]\d+)?$/.test(str);
        const hasCommaThousands = /^\d{1,3}(,\d{3})+([.]\d+)?$/.test(str);
        if (hasDotThousands) return parseFloat(str.replace(/\./g, "").replace(",", ".")) || 0;
        if (hasCommaThousands) return parseFloat(str.replace(/,/g, "")) || 0;
        return parseFloat(str.replace(/,/g, "")) || 0;
    };

    for (let i = 0; i < rows.length; i++) {
        const row = rows[i];
        if (!row || row.length === 0) continue;

        const firstCell = String(row[0] || "").trim();
        const secondCell = String(row[1] || "").trim();

        // 1. Detect Date (e.g. "Date" in column A, actual date in column B)
        if (firstCell.toUpperCase() === "DATE") {
            if (secondCell) {
                currentDate = secondCell.replace(/[\/\.]/g, "-");
                // Standardize to DD-MM-YYYY if we can
                if (!parsedDataByDate[currentDate]) {
                    parsedDataByDate[currentDate] = {
                        shifts: {
                            shift1: { sales: 0, tx: new Set(), qty: 0 }, // Open - 12:00
                            shift2: { sales: 0, tx: new Set(), qty: 0 }, // 12:00 - 15:00
                            shift3: { sales: 0, tx: new Set(), qty: 0 }, // 15:00 - 18:00
                            shift4: { sales: 0, tx: new Set(), qty: 0 }  // 18:00 - Closing
                        },
                        hourly: {} // "12.00 to 13.00" -> { sales: 0, qty: 0, tx: new Set() }
                    };
                }
            }
            continue;
        }

        if (!currentDate) continue;

        // 2. Detect Time Slot (e.g. "Time" in column A, "12.00 to 13.00" in column B)
        if (firstCell.toUpperCase() === "TIME") {
            if (secondCell) {
                currentTimeSlot = secondCell;
            }
            continue;
        }

        // 3. Detect Invoice Number (e.g. "Invoice No." in column A, invoice ID in column B)
        if (firstCell.toUpperCase().startsWith("INVOICE NO")) {
            if (secondCell) {
                currentInvoice = secondCell;
            }
            continue;
        }

        // 4. Ignore summary rows and clear invoice block state
        if (firstCell.toUpperCase().startsWith("TOTAL FOR") || firstCell.toUpperCase().startsWith("GRAND TOTAL")) {
            currentInvoice = "";
            continue;
        }

        // 5. Parse Item Row
        // Item rows have product code/name in column A, quantity in column B, net sales in column G (index 6)
        if (currentTimeSlot && currentInvoice && row.length >= 2) {
            const itemName = firstCell;
            const qty = parseNum(row[1]);
            const sales = parseNum(row[6]); // Column G is index 6

            // Check exclusions
            const isExcluded = 
                itemName.toUpperCase().startsWith("ZSP") ||
                itemName.toUpperCase().includes("PAPER BAG") ||
                itemName.toUpperCase().includes("SHOPPING");

            if (isExcluded) continue;
            if (qty === 0 && sales === 0) continue;

            // Log data into hourly slot
            if (!parsedDataByDate[currentDate].hourly[currentTimeSlot]) {
                parsedDataByDate[currentDate].hourly[currentTimeSlot] = {
                    sales: 0,
                    qty: 0,
                    tx: new Set()
                };
            }

            parsedDataByDate[currentDate].hourly[currentTimeSlot].sales += sales;
            parsedDataByDate[currentDate].hourly[currentTimeSlot].qty += qty;
            parsedDataByDate[currentDate].hourly[currentTimeSlot].tx.add(currentInvoice);

            // Log data into Shift groups
            const shiftKey = getShiftKey(currentTimeSlot);
            const shift = parsedDataByDate[currentDate].shifts[shiftKey];
            shift.sales += sales;
            shift.qty += qty;
            shift.tx.add(currentInvoice);
        }
    }
}

function getShiftKey(timeSlot) {
    // Determine hourly range from string (e.g. "12.00 to 13.00")
    const match = timeSlot.match(/(\d+)\.(\d+)/);
    if (!match) return "shift1"; // Default/Fallback

    const hour = parseInt(match[1], 10);

    if (hour < 12) return "shift1";         // Open - 12:00
    if (hour >= 12 && hour < 15) return "shift2"; // 12:00 - 15:00
    if (hour >= 15 && hour < 18) return "shift3"; // 15:00 - 18:00
    return "shift4";                        // 18:00 - Closing
}

function populateDateDropdown() {
    const dateSelect = document.getElementById("dateSelect");
    dateSelect.innerHTML = '<option value="">-- Choose Date --</option>';

    const dates = Object.keys(parsedDataByDate).sort();
    dates.forEach(date => {
        const option = document.createElement("option");
        option.value = date;
        option.innerText = date;
        dateSelect.appendChild(option);
    });

    if (dates.length > 0) {
        dateSelect.value = dates[0];
        renderDateData(dates[0]);
    }
}

function renderDateData(date) {
    const data = parsedDataByDate[date];
    if (!data) return;

    document.getElementById("activeDateBadge").innerText = `DATE: ${date}`;

    // 1. Render Shift Summary Table
    let totalSales = 0;
    let totalQty = 0;
    let grandTxSet = new Set();

    const shifts = ["shift1", "shift2", "shift3", "shift4"];
    shifts.forEach((key, idx) => {
        const shift = data.shifts[key];
        document.getElementById(`${key}_sales`).innerText = Math.round(shift.sales).toLocaleString("id-ID");
        document.getElementById(`${key}_tx`).innerText = shift.tx.size.toLocaleString("id-ID");
        document.getElementById(`${key}_qty`).innerText = shift.qty.toLocaleString("id-ID");

        totalSales += shift.sales;
        totalQty += shift.qty;
        // Merge transaction sets to get unique transaction count overall
        shift.tx.forEach(invoice => grandTxSet.add(invoice));
    });

    document.getElementById("total_sales").innerText = Math.round(totalSales).toLocaleString("id-ID");
    document.getElementById("total_tx").innerText = grandTxSet.size.toLocaleString("id-ID");
    document.getElementById("total_qty").innerText = totalQty.toLocaleString("id-ID");

    // 2. Render Hourly Breakdown Table
    const breakdownBody = document.getElementById("hourlyBreakdownBody");
    breakdownBody.innerHTML = "";

    // Generate standard hour blocks from 5.00 to 22.00
    for (let hour = 5; hour < 22; hour++) {
        const nextHour = hour + 1;
        const padHour = String(hour).padStart(2, "0");
        const padNextHour = String(nextHour).padStart(2, "0");
        const timeLabel = `${padHour}.00 to ${padNextHour}.00`;

        // Search for matching hourly slot in parsed data
        let hourlySales = 0;
        Object.keys(data.hourly).forEach(slotKey => {
            // Match slot (e.g. "12.00 to 13.00")
            const match = slotKey.match(/(\d+)\.(\d+)/);
            if (match) {
                const slotHour = parseInt(match[1], 10);
                if (slotHour === hour) {
                    hourlySales += data.hourly[slotKey].sales;
                }
            }
        });

        const tr = document.createElement("tr");
        if (hourlySales > 0) {
            tr.className = "highlight-row";
        }
        tr.innerHTML = `
            <td>${timeLabel}</td>
            <td>${Math.round(hourlySales).toLocaleString("id-ID")}</td>
        `;
        breakdownBody.appendChild(tr);
    }
}

// =============================================
// EXPORT EXCEL & PDF
// =============================================
function getExportData() {
    const date = document.getElementById("dateSelect").value;
    if (!date || !parsedDataByDate[date]) return null;
    const data = parsedDataByDate[date];
    const title = `KANGODING.ORG - SALES HOURLY - ${date}`;
    let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head><meta charset="utf-8"><title>${title}</title>
    <style>
        body { font-family: 'Courier New', monospace; padding: 20px; }
        h2 { background: #FF00FF; color: #fff; padding: 10px; border: 3px solid #000; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 20px; }
        th { background: #111; color: #fff; padding: 8px; border: 2px solid #000; text-align: center; cursor: copy !important; }
        th:hover { background: #FF00FF !important; }
        th.copied { background: #16a34a !important; }
        td { padding: 8px; border: 2px solid #000; text-align: right; }
        td:first-child { text-align: left; font-weight: bold; }
        .grand-total { background: #FFDF00; font-weight: bold; }
        .highlight { background: #ccff00; }
        .title { font-size: 20px; font-weight: bold; background: #00FFFF; padding: 12px; border: 3px solid #000; margin-bottom: 10px; }
    </style>
    <script>
    function copyColumn(btn, idx) {
        const table = btn.closest("table");
        if (!table) return;
        const vals = [];
        for (const row of table.rows) {
            if (row.cells[idx]) {
                let txt = row.cells[idx].innerText.trim();
                txt = txt.replace(/[Rr][Pp]\s*/g, "").replace(/\./g, "").replace(/,/g, "").trim();
                if (txt) vals.push(txt);
            }
        }
        if (!vals.length) return;
        
        // Hapus box lama jika ada
        let existing = document.getElementById("copyBox");
        if (existing) existing.remove();
        
        // Buat tabel dengan 1 kolom + instruksi
        const box = document.createElement("div");
        box.id = "copyBox";
        let tbl = '<table style="border-collapse:collapse;margin-top:8px;">';
        vals.forEach(v => { tbl += '<tr><td style="padding:6px 16px;border:2px solid #000;font-family:monospace;font-size:15px;background:#fff;font-weight:bold;text-align:right;">' + v + '</td></tr>'; });
        tbl += '</table>';
        box.innerHTML = '<div style="background:#16a34a;color:#fff;padding:10px 14px;font-family:sans-serif;font-size:14px;border-radius:4px;margin-top:10px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">✅ <span id="copyMsg">Klik ' + vals.length + ' angka di bawah, lalu <b>Ctrl+C</b> — paste ke Excel Online</span></div>' + tbl;
        table.parentNode.insertBefore(box, table.nextSibling);
        
        // Scroll ke hasil
        box.scrollIntoView({ behavior: "smooth", block: "nearest" });
        btn.classList.add("copied");
    }
    </script></head><body>
    <div class="title">KANGODING.ORG - SALES HOURLY</div>
    <h2>SHIFT SUMMARY - ${date}</h2>
    <table>
        <tr><th onclick="copyColumn(this,0)" title="Klik untuk copy">Shift Hours</th><th onclick="copyColumn(this,1)" title="Klik untuk copy">Daily Sales</th><th onclick="copyColumn(this,2)" title="Klik untuk copy">Transaction</th><th onclick="copyColumn(this,3)" title="Klik untuk copy">Unit Sold</th></tr>`;
    
    const shifts = [
        ["Open - 12:00", "shift1"], ["12:00 - 15:00", "shift2"],
        ["15:00 - 18:00", "shift3"], ["18:00 - Closing", "shift4"]
    ];
    let tSales = 0, tTx = 0, tQty = 0;
    const txSet = new Set();
    shifts.forEach(([label, key]) => {
        const s = data.shifts[key];
        tSales += s.sales; tQty += s.qty; s.tx.forEach(i => txSet.add(i));
        html += `<tr><td>${label}</td><td x:num="${Math.round(s.sales)}">${Math.round(s.sales)}</td><td x:num="${s.tx.size}">${s.tx.size}</td><td x:num="${s.qty}">${s.qty}</td></tr>`;
    });
    html += `<tr class="grand-total"><td>Grand Total</td><td x:num="${Math.round(tSales)}">${Math.round(tSales)}</td><td x:num="${txSet.size}">${txSet.size}</td><td x:num="${tQty}">${tQty}</td></tr>`;
    html += `</table>`;
    
    html += `<h2>HOURLY BREAKDOWN</h2><table><tr><th onclick="copyColumn(this,0)" title="Klik untuk copy">Hour Range</th><th onclick="copyColumn(this,1)" title="Klik untuk copy">Sales Amount</th></tr>`;
    for (let hour = 5; hour < 22; hour++) {
        const nxt = hour + 1;
        const label = `${String(hour).padStart(2,"0")}.00 to ${String(nxt).padStart(2,"0")}.00`;
        let hSales = 0;
        Object.keys(data.hourly).forEach(slot => {
            const m = slot.match(/(\d+)\.(\d+)/);
            if (m && parseInt(m[1],10) === hour) hSales += data.hourly[slot].sales;
        });
        const cls = hSales > 0 ? ' class="highlight"' : "";
        html += `<tr${cls}><td>${label}</td><td x:num="${Math.round(hSales)}">${Math.round(hSales)}</td></tr>`;
    }
    html += `</table></body></html>`;
    return html;
}

document.getElementById("exportExcelBtn").addEventListener("click", () => {
    const html = getExportData();
    if (!html) { alert("No data to export. Process a file first."); return; }
    
    const bar = `<div style="background:#0078d4;color:#fff;padding:16px;font-family:sans-serif;font-size:14px;border-radius:6px;margin-bottom:16px;display:flex;align-items:center;gap:12px;flex-wrap:wrap;">
        <span>✅ Klik <b style="background:#FFDF00;color:#111;padding:2px 8px;">header kolom</b> untuk copy per kolom</span>
        <a href="https://www.office.com/launch/excel" target="_blank" style="background:#fff;color:#0078d4;border:none;padding:10px 20px;border-radius:4px;font-weight:bold;cursor:pointer;text-decoration:none;">🚀 Buka Excel Online</a>
        <span style="font-size:12px;opacity:.8;"><b>Ctrl+S</b> simpan file</span>
    </div>`;
    
    const exportHtml = html.replace("</head>", `<style>.eo-link{display:inline-block;background:#0078d4;color:#fff;padding:10px 20px;border-radius:4px;font-weight:bold;text-decoration:none}</style></head>`).replace("<body>", `<body>${bar}`);
    
    const w = window.open("", "_blank");
    w.document.write(exportHtml);
    w.document.title = "Sales_Hourly_Report";
    w.document.close();
    w.focus();
});

document.getElementById("exportPdfBtn").addEventListener("click", () => {
    const html = getExportData();
    if (!html) { alert("No data to export. Process a file first."); return; }
    const w = window.open("", "_blank");
    w.document.write(html);
    w.document.title = "Sales_Hourly_Report";
    w.document.close();
    w.onload = () => { w.focus(); w.print(); };
});

