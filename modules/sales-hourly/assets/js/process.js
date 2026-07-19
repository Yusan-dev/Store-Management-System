let parsedDataByDate = {};
let selectedFile = null;

document.addEventListener("DOMContentLoaded", () => {
    const fileInput = document.getElementById("excelFile");
    const fileLabel = document.getElementById("fileLabel");
    const processBtn = document.getElementById("processBtn");
    const dateSelect = document.getElementById("dateSelect");

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

        const spinner = document.getElementById("loadingSpinner");
        spinner.classList.add("show");

        try {
            const rows = await readExcel(selectedFile);
            parseHourlyData(rows);
            populateDateDropdown();
            
            // Show content sections
            document.getElementById("filterContainer").style.display = "flex";
            document.getElementById("dashboardContent").style.display = "grid";
        } catch (err) {
            alert("Error processing Excel file: " + err.message);
            console.error(err);
        } finally {
            spinner.classList.remove("show");
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
        const str = String(val || "").trim();
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
