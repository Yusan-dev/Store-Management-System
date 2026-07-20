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
            fileLabel.innerText = "Choose XLS File";
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

        // 4. Ignore summary rows
        if (firstCell.toUpperCase().startsWith("TOTAL FOR")) {
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
        document.getElementById(`${key}_sales`).innerText = "Rp " + Math.round(shift.sales).toLocaleString("id-ID");
        document.getElementById(`${key}_tx`).innerText = shift.tx.size.toLocaleString("id-ID");
        document.getElementById(`${key}_qty`).innerText = shift.qty.toLocaleString("id-ID");

        totalSales += shift.sales;
        totalQty += shift.qty;
        // Merge transaction sets to get unique transaction count overall
        shift.tx.forEach(invoice => grandTxSet.add(invoice));
    });

    document.getElementById("total_sales").innerText = "Rp " + Math.round(totalSales).toLocaleString("id-ID");
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
            <td>Rp ${Math.round(hourlySales).toLocaleString("id-ID")}</td>
        `;
        breakdownBody.appendChild(tr);
    }
}
