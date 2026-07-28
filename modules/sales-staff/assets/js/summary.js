// =====================================================
// GT AUTO SALES STAFF
// SUMMARY CONTROLLER V2
// UNIVERSAL PRODUCT DIVISION
// =====================================================

// =====================================================
// FORMAT NUMBER
// =====================================================

function formatNumber(value) {
  return Number(value || 0).toLocaleString("en-US");
}

function money(value) {
  return Number(value || 0).toLocaleString("en-US");
}

// =====================================================
// KPI HELPERS
// =====================================================

function calculateUPT(row) {
  const qty = Number(row?.qty || 0);
  const sm = Number(row?.sm || 0);

  if (sm <= 0) {
    return 0;
  }

  return qty / sm;
}

function calculateATV(row) {
  const sales = Number(row?.sales || 0);
  const sm = Number(row?.sm || 0);

  if (sm <= 0) {
    return 0;
  }

  return sales / sm;
}

function calculateAUR(row) {
  const sales = Number(row?.sales || 0);
  const qty = Number(row?.qty || 0);

  if (qty <= 0) {
    return 0;
  }

  return sales / qty;
}

// =====================================================
// CALCULATE ALL STAFF KPI
// =====================================================

function calculateStaffKPI(row) {
  return {
    upt: calculateUPT(row),

    atv: calculateATV(row),

    aur: calculateAUR(row),
  };
}

// =====================================================
// FORMAT DECIMAL
// =====================================================

function formatDecimal(value, digits = 2) {
  return Number(value || 0).toLocaleString("id-ID", {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

// =====================================================
// RANKING HELPERS
// =====================================================

let currentRankingFilterMode = 'top3';

function getTop3(data, getValue) {
  return getRankedData(data, getValue, currentRankingFilterMode);
}

function getRankedData(data, getValue, mode) {
  const m = mode || currentRankingFilterMode || 'top3';
  const cleanData = [...data].filter((row) => row && row.staff && row.staff !== 'TOTAL' && row.staff !== 'UNKNOWN' && row.staff !== 'O2O');
  
  if (m === 'bottom3') {
    return cleanData
      .filter((row) => Number(getValue(row) || 0) >= 0)
      .sort((a, b) => Number(getValue(a) || 0) - Number(getValue(b) || 0))
      .slice(0, 3);
  } else if (m === 'all') {
    return cleanData
      .filter((row) => Number(getValue(row) || 0) >= 0)
      .sort((a, b) => Number(getValue(b) || 0) - Number(getValue(a) || 0));
  } else {
    // top3 (default)
    return cleanData
      .filter((row) => Number(getValue(row) || 0) > 0)
      .sort((a, b) => Number(getValue(b) || 0) - Number(getValue(a) || 0))
      .slice(0, 3);
  }
}

function renderTop3Ranking(ranking, getValue, formatter, mode) {
  const m = mode || currentRankingFilterMode || 'top3';
  if (!Array.isArray(ranking) || ranking.length === 0) {
    return "-";
  }

  const medals = ["🥇", "🥈", "🥉"];

  return ranking
    .map((row, index) => {
      const value = getValue(row);
      let positionText = "";
      if (m === 'bottom3') {
        positionText = `🔻 #${index + 1}`;
      } else {
        positionText = medals[index] || `#${index + 1}`;
      }

      return `

                <div class="rank-item">

                    <span class="rank-position">

                        ${positionText}

                    </span>


                    <span class="rank-staff">

                        ${displayStaffName(row.staff)}

                    </span>


                    <strong class="rank-value">

                        ${formatter(value)}

                    </strong>

                </div>

            `;
    })

    .join("");
}

// =====================================================
// TABLE SORT STATE
// =====================================================

const tableSortState = {
  key: null,

  direction: "desc",
};

// =====================================================
// NORMALIZE STAFF NAME
// =====================================================

function displayStaffName(name) {
  const normalizedName = String(name ?? "")
    .trim()
    .toUpperCase();

  if (normalizedName === "") {
    return "UNKNOWN";
  }

  return normalizedName;
}

// =====================================================
// GET ACTIVE DIVISIONS
// =====================================================

function getActiveDivisions(summary, divisions) {
  if (Array.isArray(divisions) && divisions.length > 0) {
    return [...divisions];
  }
  const divisionSet = new Set();
  if (Array.isArray(window.divisionData) && window.divisionData.length > 0) {
    window.divisionData.forEach((d) => divisionSet.add(d));
  }
  (summary || []).forEach((row) => {
    Object.keys(row.categories || {}).forEach((division) => {
      const divUpper = division.toUpperCase();
      if (divUpper !== "NON-MD" && divUpper !== "PAPERBAG") {
        divisionSet.add(division);
      }
    });
  });
  return [...divisionSet];
}

// =====================================================
// PERFORMANCE DATE RANGE CONTROLLER
// =====================================================

let activePerformanceDateFilter = "";

// =====================================================
// CONVERT HTML DATE
// YYYY-MM-DD => DD-MM-YYYY
// =====================================================

function convertHTMLDateToEngineDate(value) {
  if (!value) {
    return "";
  }

  const parts = String(value).split("-");

  if (parts.length !== 3) {
    return "";
  }

  const [year, month, day] = parts;

  return `${day}-${month}-${year}`;
}

// =====================================================
// GET ACTIVE PERFORMANCE FILTER
// =====================================================

function getActivePerformanceDateFilter() {
  return activePerformanceDateFilter;
}

// =====================================================
// GET PERFORMANCE FILTER LABEL
// =====================================================

function getPerformanceFilterLabel(filter) {
  const normalized = GTEngine.normalizeDateFilter(filter);

  if (normalized.mode === "ALL") {
    return "ALL PERIOD";
  }

  if (normalized.mode === "SINGLE_DATE") {
    return normalized.date;
  }

  return `${normalized.from || "START"} → ${normalized.to || "END"}`;
}

// =====================================================
// APPLY PERFORMANCE DATE FILTER
// =====================================================

// =====================================================
// POPULATE STAFF FILTER
// =====================================================
function populateStaffFilter() {
  const optionsContainer = document.getElementById("staffMultiSelectOptions");
  const allCheckbox = document.getElementById("staffMultiSelectAll");
  const header = document.getElementById("staffMultiSelectHeader");
  const label = document.getElementById("staffMultiSelectLabel");
  const dropdown = document.getElementById("staffMultiSelectDropdown");
  
  if (!optionsContainer) return;

  if (typeof GTEngine !== "undefined" && GTEngine.staffMap) {
    const staffs = Array.from(GTEngine.staffMap.values())
      .map((s) => String(s.name || "").trim().toUpperCase())
      .filter((name) => name && name !== "UNKNOWN");
    staffs.push("O2O");
    const uniqueStaffs = [...new Set(staffs.sort())];

    const staffListHash = uniqueStaffs.join(",");
    if (optionsContainer.dataset.lastStaffs === staffListHash) {
      return; 
    }
    optionsContainer.dataset.lastStaffs = staffListHash;

    optionsContainer.innerHTML = '';

    uniqueStaffs.forEach((staff) => {
      const wrapper = document.createElement("label");
      wrapper.style.cssText = "display:flex; align-items:center; padding:8px 12px; cursor:pointer; border-bottom:1px solid #eee; margin:0; width:100%;";
      
      const cb = document.createElement("input");
      cb.type = "checkbox";
      cb.value = staff;
      cb.checked = true; // default checked if "ALL" was selected
      cb.style.cssText = "margin-right:10px; width:16px; height:16px;";
      
      const text = document.createElement("span");
      text.innerText = staff;
      
      wrapper.appendChild(cb);
      wrapper.appendChild(text);
      optionsContainer.appendChild(wrapper);
      
      cb.addEventListener('change', () => {
          allCheckbox.checked = false;
          updateMultiSelectLabel();
          applyPerformanceDateFilter(getActivePerformanceDateFilter());
      });
    });

    if (allCheckbox && allCheckbox.dataset.registered !== "true") {
        allCheckbox.addEventListener('change', (e) => {
            const checkboxes = optionsContainer.querySelectorAll('input[type="checkbox"]');
            checkboxes.forEach(cb => cb.checked = e.target.checked);
            updateMultiSelectLabel();
            applyPerformanceDateFilter(getActivePerformanceDateFilter());
        });
        allCheckbox.dataset.registered = "true";
    }
    
    if (header && header.dataset.registered !== "true") {
        header.addEventListener('click', () => {
            dropdown.style.display = dropdown.style.display === 'none' ? 'block' : 'none';
        });
        document.addEventListener('click', (e) => {
            if (!document.getElementById('staffMultiSelectContainer').contains(e.target)) {
                dropdown.style.display = 'none';
            }
        });
        header.dataset.registered = "true";
    }

    function updateMultiSelectLabel() {
        const checked = optionsContainer.querySelectorAll('input[type="checkbox"]:checked');
        if (allCheckbox.checked || checked.length === uniqueStaffs.length || checked.length === 0) {
            allCheckbox.checked = true;
            optionsContainer.querySelectorAll('input[type="checkbox"]').forEach(c => c.checked = true);
            label.innerText = 'ALL STAFF';
        } else {
            const names = Array.from(checked).map(c => c.value);
            label.innerText = names.length + ' STAFF SELECTED';
            label.title = names.join(', ');
        }
    }
    
    updateMultiSelectLabel();
  }
}

function applyPerformanceDateFilter(filter = "") {
  if (!Array.isArray(window.summaryData) || window.summaryData.length === 0) {
    alert("PROCESS SOURCE FILE TERLEBIH DAHULU.");
    return;
  }
  activePerformanceDateFilter = filter;

  if (typeof populateStaffFilter === "function") {
    populateStaffFilter();
  }

  const allStaffSummary = GTEngine.getAllStaffDailySummary(activePerformanceDateFilter);

  const allCheckbox = document.getElementById('staffMultiSelectAll');
  const optionsContainer = document.getElementById('staffMultiSelectOptions');
  let summary = [];

  if (allCheckbox && optionsContainer && !allCheckbox.checked) {
    const checkedBoxes = Array.from(optionsContainer.querySelectorAll('input[type="checkbox"]:checked'));
    const selectedStaffs = checkedBoxes.map(cb => cb.value);
    
    if (selectedStaffs.length > 0) {
      summary = allStaffSummary.filter(row => row.staff === 'TOTAL' || selectedStaffs.includes(row.staff));
      
      // Recalculate total row for filtered summary
      let totalSales = 0, totalQty = 0, totalSm = 0;
      summary.forEach(row => {
          if (row.staff !== 'TOTAL') {
              totalSales += (row.sales || 0);
              totalQty += (row.qty || 0);
              totalSm += (row.sm || 0);
          }
      });
      const totalRow = summary.find(r => r.staff === 'TOTAL');
      if (totalRow) {
          totalRow.sales = totalSales;
          totalRow.qty = totalQty;
          totalRow.sm = totalSm;
      }
    }
  } else {
    summary = allStaffSummary;
  }

  const divisions = getActiveDivisions(summary, []);

  window.summaryData = summary;
  window.divisionData = divisions;

  drawTable(summary, divisions);
  updateSummary(summary, divisions);

  if (typeof drawMonthlySummaryTable === "function") {
    drawMonthlySummaryTable(summary, divisions);
  }

  updatePerformanceFilterUI();
}

function updatePerformanceFilterUI() {
  const statusElement = document.getElementById("performanceFilterStatus");

  const infoElement = document.getElementById("performanceFilterInfo");

  const normalized = GTEngine.normalizeDateFilter(activePerformanceDateFilter);

  const label = getPerformanceFilterLabel(activePerformanceDateFilter);

  if (statusElement) {
    statusElement.innerText = label;

    statusElement.dataset.mode = normalized.mode;
  }

  if (infoElement) {
    if (normalized.mode === "ALL") {
      infoElement.innerText = "CURRENT SUMMARY • ALL AVAILABLE DATES";
    } else if (normalized.mode === "SINGLE_DATE") {
      infoElement.innerText = `CURRENT SUMMARY • ${normalized.date}`;
    } else {
      infoElement.innerText = `CURRENT SUMMARY • ${
        normalized.from || "START"
      } TO ${normalized.to || "END"}`;
    }
  }
}

// =====================================================
// PERFORMANCE DATE SELECT OPTIONS
// ONLY DATES AVAILABLE FROM UPLOADED DATA
// =====================================================

function configurePerformanceDateLimits() {
  const fromInput = document.getElementById("performanceDateFrom");
  const toInput = document.getElementById("performanceDateTo");

  if (!fromInput || !toInput) {
    return;
  }

  const availableDates = GTEngine.getAvailableDates();

  if (!Array.isArray(availableDates) || availableDates.length === 0) {
    fromInput.disabled = true;
    toInput.disabled = true;
    return;
  }

  // Set min and max based on available dates
  const minDate = engineDateToInputDate(availableDates[0]);
  const maxDate = engineDateToInputDate(availableDates[availableDates.length - 1]);
  
  if (minDate && maxDate) {
      fromInput.min = minDate;
      fromInput.max = maxDate;
      toInput.min = minDate;
      toInput.max = maxDate;
  }

  fromInput.disabled = false;
  toInput.disabled = false;

  console.log(
    "PERFORMANCE AVAILABLE DATES CONFIGURED:",
    availableDates,
  );
}
// =====================================================
// ENGINE DATE -> HTML INPUT DATE
//
// 01-07-2026
// =>
// 2026-07-01
// =====================================================

function engineDateToInputDate(value) {
  const match = String(value || "").match(/^(\d{2})-(\d{2})-(\d{4})$/);

  if (!match) {
    return "";
  }

  return match[3] + "-" + match[2] + "-" + match[1];
}

// =====================================================
// INITIALIZE PERFORMANCE DATE RANGE UI
// =====================================================

function initializePerformanceDateRange() {
  const fromInput = document.getElementById("performanceDateFrom");

  const toInput = document.getElementById("performanceDateTo");

  const applyButton = document.getElementById("applyPerformanceDateRange");

  const resetButton = document.getElementById("resetPerformanceDateRange");

  if (!fromInput || !toInput || !applyButton || !resetButton) {
    console.warn("PERFORMANCE DATE RANGE UI NOT FOUND.");

    return;
  }

  // =============================================
  // PREVENT DUPLICATE EVENT REGISTRATION
  // =============================================

  if (applyButton.dataset.registered === "true") {
    return;
  }

  // =============================================
  // APPLY RANGE
  // =============================================

  applyButton.addEventListener(
    "click",

    () => {
      const from = convertHTMLDateToEngineDate(fromInput.value);

      const to = convertHTMLDateToEngineDate(toInput.value);

      // =====================================
      // BOTH EMPTY
      // =====================================

      if (!from && !to) {
        alert("SELECT FROM DATE ATAU TO DATE.");

        return;
      }

      // =====================================
      // SAME DATE
      // SINGLE DATE FILTER
      // =====================================

      if (from && to && from === to) {
        applyPerformanceDateFilter(from);

        return;
      }

      // =====================================
      // CUSTOM RANGE
      // OPEN RANGE JUGA DIDUKUNG
      // =====================================

      applyPerformanceDateFilter({
        from,

        to,
      });
    },
  );

  // =============================================
  // RESET
  // =============================================

  resetButton.addEventListener(
    "click",

    () => {
      fromInput.value = "";

      toInput.value = "";

      applyPerformanceDateFilter("");
    },
  );

  applyButton.dataset.registered = "true";

  resetButton.dataset.registered = "true";

  updatePerformanceFilterUI();
}

// =====================================================
// INITIALIZE AFTER DOM READY
// =====================================================

document.addEventListener(
  "DOMContentLoaded",

  initializePerformanceDateRange,
);

// =====================================================
// UPDATE SUMMARY CARDS
// =====================================================

function updateSummary(summary, divisions) {
  if (!Array.isArray(summary) || summary.length === 0) return;

  const total = summary.find((row) => row.staff === "TOTAL");
  if (!total) return;

  const uniqueStaffs = new Set();
  const staffOnly = summary.filter((row) => {
    if (row.staff === "TOTAL" || row.staff === "UNKNOWN" || row.staff === "O2O")
      return false;
    uniqueStaffs.add(row.staff);
    return true;
  });

  const elTotalStaff = document.getElementById("staffCount");
  if (elTotalStaff) elTotalStaff.innerText = formatNumber(uniqueStaffs.size);

  const elTotalSales = document.getElementById("salesTotal");
  if (elTotalSales) elTotalSales.innerText = `${money(total.sales)}`;

  const elTotalSM = document.getElementById("smTotal");
  if (elTotalSM) elTotalSM.innerText = formatNumber(total.sm);

  const elTotalQty = document.getElementById("qtyTotal");
  if (elTotalQty) elTotalQty.innerText = formatNumber(total.qty);

  const activeCount = uniqueStaffs.size > 0 ? uniqueStaffs.size : 1;
  const elAvgSales = document.getElementById("avgSales");
  if (elAvgSales)
    elAvgSales.innerText = `${money(Math.round(total.sales / activeCount))}`;

  updateValidation();
  if (typeof populateStaffFilter === "function") {
    populateStaffFilter();
  }
  if (typeof drawMonthlySummaryTable === "function") {
    drawMonthlySummaryTable(summary, divisions);
  }
}

function drawTableHeader(divisions) {
  const thead = document.getElementById("tableHead");
  if (!thead) return;
  thead.innerHTML = "";

  const tr = document.createElement("tr");

  const isDaily =
    window.summaryData &&
    window.summaryData.length > 0 &&
    window.summaryData[0].date !== undefined;

  const staticColumns = [];
  if (isDaily) {
    staticColumns.push({ key: "date", label: "DATE" });
  }
  staticColumns.push({ key: "staff", label: "STAFF" });
  staticColumns.push({ key: "sales", label: "SALES" });
  staticColumns.push({ key: "sm", label: "SM" });
  staticColumns.push({ key: "qty", label: "QTY" });
  staticColumns.push({ key: "upt", label: "UPT" });
  staticColumns.push({ key: "atv", label: "ATV" });
  staticColumns.push({ key: "aur", label: "AUR" });

  staticColumns.forEach((col) => {
    const th = document.createElement("th");
    th.innerText = col.label;
    if (col.key === "staff") th.className = "sticky-col";
    tr.appendChild(th);
  });

  divisions.forEach((division) => {
    const th = document.createElement("th");
    th.innerText = division;
    tr.appendChild(th);
  });

  thead.appendChild(tr);
}

function drawTable(summary, divisions) {
  drawTableHeader(divisions);
  const tbody = document.getElementById("tableBody");
  if (!tbody) return;
  tbody.innerHTML = "";

  const isDaily = summary.length > 0 && summary[0].date !== undefined;

  summary.forEach((row) => {
    const tr = document.createElement("tr");
    if (row.staff === "TOTAL") tr.classList.add("total-row");

    if (isDaily) {
      const dateCell = document.createElement("td");
      dateCell.innerText = row.staff === "TOTAL" ? "" : row.date || "";
      tr.appendChild(dateCell);
    }

    const staffCell = document.createElement("td");
    staffCell.className = "sticky-col";
    staffCell.innerText = displayStaffName(row.staff);
    tr.appendChild(staffCell);

    const salesCell = document.createElement("td");
    salesCell.innerText = `${money(row.sales)}`;
    tr.appendChild(salesCell);

    const smCell = document.createElement("td");
    smCell.innerText = row.sm || 0;
    tr.appendChild(smCell);

    const qtyCell = document.createElement("td");
    qtyCell.innerText = row.qty || 0;
    tr.appendChild(qtyCell);

    const uptCell = document.createElement("td");
    uptCell.innerText = formatDecimal(calculateUPT(row), 2);
    tr.appendChild(uptCell);

    const atvCell = document.createElement("td");
    atvCell.innerText = `${money(Math.round(calculateATV(row)))}`;
    tr.appendChild(atvCell);

    const aurCell = document.createElement("td");
    aurCell.innerText = `${money(Math.round(calculateAUR(row)))}`;
    tr.appendChild(aurCell);

    divisions.forEach((division) => {
      const catCell = document.createElement("td");
      catCell.innerText = row.categories?.[division] || 0;
      tr.appendChild(catCell);
    });

    tbody.appendChild(tr);
  });

  updateRanking(summary, divisions);
  if (typeof updateStaffChart === 'function') {
      updateStaffChart(summary);
  }
}

function sortTable(key) {
  const summary = window.summaryData;

  if (!Array.isArray(summary) || summary.length === 0) {
    console.warn("SUMMARY DATA TIDAK TERSEDIA");

    return;
  }

  // ==========================
  // SORT DIRECTION
  // ==========================

  if (tableSortState.key === key) {
    tableSortState.direction =
      tableSortState.direction === "desc" ? "asc" : "desc";
  } else {
    tableSortState.key = key;

    tableSortState.direction = key === "staff" ? "asc" : "desc";
  }

  // ==========================
  // TOTAL SELALU DI BAWAH
  // ==========================

  const totalRow = summary.find((row) => row.staff === "TOTAL");

  const rows = summary.filter((row) => row.staff !== "TOTAL");

  const divisions = getActiveDivisions(
    summary,

    window.divisionData,
  );

  const isDivision = divisions.includes(key);

  // ==========================
  // GET SORT VALUE
  // ==========================

  function getSortValue(row) {
    if (isDivision) {
      return Number(row.categories?.[key] || 0);
    }

    if (key === "staff") {
      return displayStaffName(row.staff);
    }

    if (key === "upt") {
      return calculateUPT(row);
    }

    if (key === "atv") {
      return calculateATV(row);
    }

    if (key === "aur") {
      return calculateAUR(row);
    }

    return Number(row[key] || 0);
  }

  // ==========================
  // SORT
  // ==========================

  rows.sort((a, b) => {
    const valueA = getSortValue(a);

    const valueB = getSortValue(b);

    let comparison = 0;

    if (key === "staff") {
      comparison = String(valueA).localeCompare(
        String(valueB),

        "id",

        {
          sensitivity: "base",
        },
      );
    } else {
      comparison = valueA - valueB;
    }

    return tableSortState.direction === "asc" ? comparison : -comparison;
  });

  const sortedSummary = totalRow ? [...rows, totalRow] : rows;

  window.summaryData = sortedSummary;

  drawTable(
    sortedSummary,

    divisions,
  );

  console.log(
    "SORT SUCCESS:",

    {
      key,

      direction: tableSortState.direction,

      isDivision,
    },
  );
}

// =====================================================
// UPDATE RANKING
// TOP 3 STAFF RANKING CONTROLLER
// =====================================================

function updateRanking(filteredSummary, filteredDivisions) {
  const summary =
    typeof GTEngine !== "undefined"
      ? GTEngine.generateSummary(getActivePerformanceDateFilter())
      : filteredSummary;
  const divisions =
    typeof getActiveDivisions !== "undefined"
      ? getActiveDivisions(summary, [])
      : filteredDivisions;

  if (!Array.isArray(summary)) {
    return;
  }

  window.latestStaffSummaryData = summary;
  window.latestStaffDivisionsData = divisions;

  const data = summary
    .filter(
      (row) =>
        row.staff !== "TOTAL" && row.staff !== "UNKNOWN" && row.staff !== "O2O",
    )
    .map((row) => {
      return {
        ...row,
        staff: displayStaffName(row.staff),
        ...calculateStaffKPI(row),
      };
    });

  const mode = currentRankingFilterMode || 'top3';

  // Title updates based on mode
  const topSalesTitle = document.getElementById("topSalesTitle");
  if (topSalesTitle) {
    topSalesTitle.innerText = mode === 'bottom3' ? '🔻 BOTTOM SALES' : (mode === 'all' ? '👥 ALL SALES RANK' : '🏆 TOP SALES');
  }

  const topSalesElement = document.getElementById("topSales");
  if (topSalesElement) {
    const ranking = getRankedData(data, (row) => Number(row.sales || 0), mode);
    topSalesElement.classList.add("rank-list");
    topSalesElement.innerHTML = renderTop3Ranking(ranking, (row) => row.sales, (value) => `${money(value)}`, mode);
  }

  const topQtyTitle = document.getElementById("topQtyTitle");
  if (topQtyTitle) {
    topQtyTitle.innerText = mode === 'bottom3' ? '🔻 BOTTOM QTY' : (mode === 'all' ? '👥 ALL QTY RANK' : '📦 TOP QTY');
  }

  const topQtyElement = document.getElementById("topQty");
  if (topQtyElement) {
    const ranking = getRankedData(data, (row) => Number(row.qty || 0), mode);
    topQtyElement.classList.add("rank-list");
    topQtyElement.innerHTML = renderTop3Ranking(ranking, (row) => row.qty, (value) => formatNumber(value), mode);
  }

  const rankingContainer = document.querySelector(".ranking");
  if (rankingContainer) {
    rankingContainer
      .querySelectorAll(".dynamic-kpi-rank, .dynamic-division-rank")
      .forEach((card) => {
        card.remove();
      });
  }

  drawKPIRankings(data);
  drawDivisionRankings(data, divisions);

  if (typeof initBestSalesAwardFeature === 'function') {
    initBestSalesAwardFeature(summary);
  }
}

function drawKPIRankings(data) {
  const rankingContainer = document.querySelector(".ranking");
  if (!rankingContainer) {
    return;
  }

  const mode = currentRankingFilterMode || 'top3';

  const kpiConfig = [
    {
      key: "upt",
      title: mode === 'bottom3' ? "🔻 BOTTOM UPT" : (mode === 'all' ? "📈 ALL UPT RANK" : "📈 TOP UPT"),
      formatter: (value) => formatDecimal(value, 2),
    },
    {
      key: "atv",
      title: mode === 'bottom3' ? "🔻 BOTTOM ATV" : (mode === 'all' ? "💳 ALL ATV RANK" : "💳 TOP ATV"),
      formatter: (value) => `${money(Math.round(value))}`,
    },
    {
      key: "aur",
      title: mode === 'bottom3' ? "🔻 BOTTOM AUR" : (mode === 'all' ? "🏷️ ALL AUR RANK" : "🏷️ TOP AUR"),
      formatter: (value) => `${money(Math.round(value))}`,
    },
  ];

  kpiConfig.forEach((config) => {
    const ranking = getRankedData(data, (row) => Number(row[config.key] || 0), mode);

    const card = document.createElement("div");
    card.className = "rank-card dynamic-kpi-rank";

    const title = document.createElement("h3");
    title.innerText = config.title;

    const content = document.createElement("div");
    content.className = "rank-list";
    content.innerHTML = renderTop3Ranking(ranking, (row) => row[config.key], config.formatter, mode);

    card.appendChild(title);
    card.appendChild(content);
    rankingContainer.appendChild(card);
  });
}

function drawDivisionRankings(data, divisions) {
  const rankingContainer = document.querySelector(".ranking");
  if (!rankingContainer) {
    return;
  }

  const mode = currentRankingFilterMode || 'top3';

  const oldTopFw = document.getElementById("topFw");
  if (oldTopFw) {
    const oldCard = oldTopFw.closest(".rank-card");
    if (oldCard) {
      oldCard.style.display = "none";
    }
  }

  const activeDivisions = Array.isArray(divisions) ? divisions : [];

  activeDivisions.forEach((division) => {
    const ranking = getRankedData(data, (row) => Number(row.categories?.[division] || 0), mode);

    const card = document.createElement("div");
    card.className = "rank-card dynamic-division-rank";

    const title = document.createElement("h3");
    const prefix = mode === 'bottom3' ? '🔻 BOTTOM' : (mode === 'all' ? '👥 ALL' : 'TOP');
    title.innerText = `${prefix} ${division}`;

    const content = document.createElement("div");
    content.className = "rank-list";
    content.innerHTML = renderTop3Ranking(ranking, (row) => Number(row.categories?.[division] || 0), (value) => formatNumber(value), mode);

    card.appendChild(title);
    card.appendChild(content);
    rankingContainer.appendChild(card);
  });
}

// =====================================================
// BEST SALES AWARD CERTIFICATE GENERATOR CONTROLLER
// =====================================================

// Applies a user-picked custom color to the certificate frame/accents,
// automatically deriving a subtle background tint and a readable text
// color so any chosen color still looks clean and professional.
function applyCustomCertColor(printArea, hexColor) {
    const hex = (hexColor || '#d4af37').replace('#', '');
    const r = parseInt(hex.substring(0, 2), 16) || 0;
    const g = parseInt(hex.substring(2, 4), 16) || 0;
    const b = parseInt(hex.substring(4, 6), 16) || 0;

    // Very light tint of the chosen color for the background gradient
    const tint = (channel) => Math.round(channel + (255 - channel) * 0.94);
    const bgTint = `rgb(${tint(r)}, ${tint(g)}, ${tint(b)})`;

    // Perceived luminance to decide whether text/ink should be dark or light
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    const inkColor = luminance > 0.6 ? '#1e1e1e' : `rgb(${Math.round(r * 0.45)}, ${Math.round(g * 0.45)}, ${Math.round(b * 0.45)})`;

    printArea.style.setProperty('--cert-theme-color', hexColor);
    printArea.style.borderColor = hexColor;
    printArea.style.background = `linear-gradient(135deg, #ffffff 0%, ${bgTint} 100%)`;
    printArea.style.color = inkColor;
}

window.certPhotoPosX = 50;
window.certPhotoPosY = 50;
let isPhotoDragInitialized = false;

function updateCertPhotoPositionUI() {
    const logoImg = document.getElementById("certLogoImage");
    if (logoImg) {
        logoImg.style.objectPosition = `${window.certPhotoPosX}% ${window.certPhotoPosY}%`;
    }
    const posValX = document.getElementById("posValX");
    const posValY = document.getElementById("posValY");
    if (posValX) posValX.innerText = `${Math.round(window.certPhotoPosX)}%`;
    if (posValY) posValY.innerText = `${Math.round(window.certPhotoPosY)}%`;
    const rangeX = document.getElementById("certPhotoPosX");
    const rangeY = document.getElementById("certPhotoPosY");
    if (rangeX) rangeX.value = Math.round(window.certPhotoPosX);
    if (rangeY) rangeY.value = Math.round(window.certPhotoPosY);
}

function initCertPhotoDragEvents() {
    if (isPhotoDragInitialized) return;
    isPhotoDragInitialized = true;
    
    const logoImg = document.getElementById("certLogoImage");
    const rangeX = document.getElementById("certPhotoPosX");
    const rangeY = document.getElementById("certPhotoPosY");
    const resetBtn = document.getElementById("resetCertPhotoPosBtn");

    if (rangeX) {
        rangeX.addEventListener("input", (e) => {
            window.certPhotoPosX = parseFloat(e.target.value);
            updateCertPhotoPositionUI();
        });
    }
    if (rangeY) {
        rangeY.addEventListener("input", (e) => {
            window.certPhotoPosY = parseFloat(e.target.value);
            updateCertPhotoPositionUI();
        });
    }
    if (resetBtn) {
        resetBtn.addEventListener("click", () => {
            window.certPhotoPosX = 50;
            window.certPhotoPosY = 50;
            updateCertPhotoPositionUI();
        });
    }

    if (!logoImg) return;

    let isDragging = false;
    let startX = 0, startY = 0;
    let startPosX = 50, startPosY = 50;

    const onStart = (clientX, clientY) => {
        isDragging = true;
        startX = clientX;
        startY = clientY;
        startPosX = window.certPhotoPosX;
        startPosY = window.certPhotoPosY;
        logoImg.style.cursor = 'grabbing';
    };

    const onMove = (clientX, clientY) => {
        if (!isDragging) return;
        const rect = logoImg.getBoundingClientRect();
        const width = rect.width || 220;
        const height = rect.height || 220;
        const dx = ((clientX - startX) / width) * 100;
        const dy = ((clientY - startY) / height) * 100;

        window.certPhotoPosX = Math.max(0, Math.min(100, startPosX - dx));
        window.certPhotoPosY = Math.max(0, Math.min(100, startPosY - dy));
        updateCertPhotoPositionUI();
    };

    const onEnd = () => {
        if (isDragging) {
            isDragging = false;
            logoImg.style.cursor = 'grab';
        }
    };

    logoImg.addEventListener('mousedown', (e) => {
        e.preventDefault();
        onStart(e.clientX, e.clientY);
    });
    window.addEventListener('mousemove', (e) => onMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', onEnd);

    logoImg.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            onStart(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: true });
    window.addEventListener('touchmove', (e) => {
        if (e.touches.length === 1) {
            onMove(e.touches[0].clientX, e.touches[0].clientY);
        }
    }, { passive: true });
    window.addEventListener('touchend', onEnd);
}

function initBestSalesAwardFeature(summaryData) {
    const openBtn = document.getElementById("openAwardModalBtn");
    const modal = document.getElementById("bestSalesAwardModal");
    const closeBtn = document.getElementById("closeAwardModal");
    const staffSelect = document.getElementById("awardStaffSelect");
    const storeNameInput = document.getElementById("awardStoreName");
    const titleInput = document.getElementById("awardTitleInput");
    const colorSelect = document.getElementById("awardFrameColor");
    const customColorInput = document.getElementById("awardCustomColor");
    const customColorWrap = document.getElementById("awardCustomColorWrap");
    const imageUpload = document.getElementById("awardImageUpload");
    const dateInput = document.getElementById("awardDateInput");
    const printBtn = document.getElementById("printCertificateBtn");
    const printArea = document.getElementById("awardCertificatePrintArea");

    if (!modal) return;

    // Set default date to today if empty
    if (dateInput && !dateInput.value) {
        dateInput.value = new Date().toISOString().split('T')[0];
    }

    // Populate staff dropdown from summaryData — sort/label dynamically by award category
    if (staffSelect && Array.isArray(summaryData)) {
        const currentStaffVal = staffSelect.value;
        const currentTitle = (titleInput ? titleInput.value : '').toUpperCase();
        
        // Determine sort metric from the current award title
        let sortKey = 'sales'; // default
        let metricLabel = 'Sales';
        let metricFormatter = (r) => typeof money === 'function' ? money(r.sales || 0) : r.sales;
        
        if (currentTitle.includes('UPT')) {
            sortKey = 'upt';
            metricLabel = 'UPT';
            metricFormatter = (r) => { const upt = (r.sm || 0) > 0 ? (r.qty || 0) / r.sm : 0; return typeof formatDecimal === 'function' ? formatDecimal(upt, 2) : upt.toFixed(2); };
        } else if (currentTitle.includes('AUR')) {
            sortKey = 'aur';
            metricLabel = 'AUR';
            metricFormatter = (r) => { const aur = (r.qty || 0) > 0 ? (r.sales || 0) / r.qty : 0; return typeof money === 'function' ? money(Math.round(aur)) : Math.round(aur); };
        } else if (currentTitle.includes('RPT') || currentTitle.includes('ATV')) {
            sortKey = 'rpt';
            metricLabel = 'RPT/ATV';
            metricFormatter = (r) => { const rpt = (r.sm || 0) > 0 ? (r.sales || 0) / r.sm : 0; return typeof money === 'function' ? money(Math.round(rpt)) : Math.round(rpt); };
        }
        
        // Update label
        const staffLabel = document.getElementById("awardStaffLabel");
        if (staffLabel) staffLabel.innerText = `2. PILIH STAFF (BEST ${metricLabel.toUpperCase()})`;
        
        const staffList = summaryData
            .filter(r => r.staff && r.staff !== 'TOTAL' && r.staff !== 'UNKNOWN' && r.staff !== 'O2O')
            .sort((a, b) => {
                if (sortKey === 'upt') {
                    const uptA = (a.sm || 0) > 0 ? (a.qty || 0) / a.sm : 0;
                    const uptB = (b.sm || 0) > 0 ? (b.qty || 0) / b.sm : 0;
                    return uptB - uptA;
                } else if (sortKey === 'aur') {
                    const aurA = (a.qty || 0) > 0 ? (a.sales || 0) / a.qty : 0;
                    const aurB = (b.qty || 0) > 0 ? (b.sales || 0) / b.qty : 0;
                    return aurB - aurA;
                } else if (sortKey === 'rpt') {
                    const rptA = (a.sm || 0) > 0 ? (a.sales || 0) / a.sm : 0;
                    const rptB = (b.sm || 0) > 0 ? (b.sales || 0) / b.sm : 0;
                    return rptB - rptA;
                }
                return (b.sales || 0) - (a.sales || 0);
            });

        staffSelect.innerHTML = "";
        if (staffList.length === 0) {
            const opt = document.createElement("option");
            opt.value = "";
            opt.innerText = "Belum Ada Data Staff";
            staffSelect.appendChild(opt);
        } else {
            staffList.forEach((r, idx) => {
                const name = typeof displayStaffName === 'function' ? displayStaffName(r.staff) : r.staff;
                const opt = document.createElement("option");
                opt.value = r.staff;
                opt.innerText = `${idx === 0 ? '🏆 ' : ''}${name} (${metricFormatter(r)})`;
                if (r.staff === currentStaffVal) opt.selected = true;
                staffSelect.appendChild(opt);
            });
        }
    }

    // Function to update certificate preview
    function updateCertificatePreview() {
        if (!summaryData || !Array.isArray(summaryData)) return;
        const selectedStaff = staffSelect ? staffSelect.value : '';
        const storeName = storeNameInput ? (storeNameInput.value.trim() || 'MAA STORE JAKARTA') : 'MAA STORE JAKARTA';
        const awardTitle = titleInput ? (titleInput.value.trim() || 'BEST SALES OF THE MONTH') : 'BEST SALES OF THE MONTH';
        const frameColor = colorSelect ? colorSelect.value : 'gold';
        const dateVal = dateInput ? dateInput.value : '';
        
        // Grab the Photo Frame Style dropdown element manually since it might be outside the initial scope of the file
        const awardPhotoFrameStyle = document.getElementById("awardPhotoFrameStyle");
        const photoFrameStyle = awardPhotoFrameStyle ? awardPhotoFrameStyle.value : 'classic';

        // Find staff metrics
        const staffRow = summaryData.find(r => r.staff === selectedStaff) || summaryData.find(r => r.staff !== 'TOTAL' && r.staff !== 'UNKNOWN' && r.staff !== 'O2O') || {};
        const staffName = staffRow.staff ? (typeof displayStaffName === 'function' ? displayStaffName(staffRow.staff) : staffRow.staff) : '-';
        const sales = staffRow.sales || 0;
        const qty = staffRow.qty || 0;
        const sm = staffRow.sm || 0;
        const upt = sm > 0 ? (qty / sm) : (staffRow.upt || 0);
        const rpt = sm > 0 ? (sales / sm) : (staffRow.rpt || 0);
        const aur = qty > 0 ? (sales / qty) : (staffRow.aur || 0);

        // Determine metric suffix for the title based on the award category
        let titleSuffix = "";
        const upperTitle = awardTitle.toUpperCase();
        if (upperTitle.includes('UPT')) {
            titleSuffix = " " + (typeof formatDecimal === 'function' ? formatDecimal(upt, 2) : upt.toFixed(2));
        } else if (upperTitle.includes('AUR')) {
            titleSuffix = " " + (typeof money === 'function' ? money(Math.round(aur)) : Math.round(aur));
        } else if (upperTitle.includes('RPT') || upperTitle.includes('ATV')) {
            titleSuffix = " " + (typeof money === 'function' ? money(Math.round(rpt)) : Math.round(rpt));
        } else if (upperTitle.includes('SALES')) {
            titleSuffix = " " + (typeof money === 'function' ? money(sales) : sales);
        }

        // Update Certificate DOM Elements
        const certStoreTitle = document.getElementById("certStoreTitle");
        if (certStoreTitle) certStoreTitle.innerText = `${upperTitle}${titleSuffix} — ${storeName.toUpperCase()}`;

        const certStaffName = document.getElementById("certStaffName");
        if (certStaffName) certStaffName.innerText = staffName.toUpperCase();

        const certAwardTitle = document.getElementById("certAwardTitle");
        if (certAwardTitle) certAwardTitle.innerText = `${upperTitle}${titleSuffix}`;

        const certAwardCategoryText = document.getElementById("certAwardCategoryText");
        if (certAwardCategoryText) {
            certAwardCategoryText.innerHTML = `Diberikan atas prestasi dan dedikasi luar biasa sebagai <strong id="certAwardTitle" style="text-decoration:underline;">${upperTitle}${titleSuffix}</strong> di ${storeName.toUpperCase()} berdasarkan analisis performa penjualan staf.`;
        }

        const certSalesVal = document.getElementById("certSalesVal");
        if (certSalesVal) certSalesVal.innerText = typeof money === 'function' ? money(sales) : sales;

        const certQtyVal = document.getElementById("certQtyVal");
        if (certQtyVal) certQtyVal.innerText = `${typeof formatNumber === 'function' ? formatNumber(qty) : qty} Pcs`;

        const certSmVal = document.getElementById("certSmVal");
        if (certSmVal) certSmVal.innerText = typeof formatNumber === 'function' ? formatNumber(sm) : sm;

        const certUptVal = document.getElementById("certUptVal");
        if (certUptVal) certUptVal.innerText = typeof formatDecimal === 'function' ? formatDecimal(upt, 2) : upt.toFixed(2);

        const certAurVal = document.getElementById("certAurVal");
        if (certAurVal) certAurVal.innerText = typeof money === 'function' ? money(Math.round(aur)) : Math.round(aur);

        const certRptVal = document.getElementById("certRptVal");
        if (certRptVal) certRptVal.innerText = typeof money === 'function' ? money(Math.round(rpt)) : Math.round(rpt);

        const certDateVal = document.getElementById("certDateVal");
        if (certDateVal) {
            if (dateVal) {
                const parts = dateVal.split('-');
                if (parts.length === 3) {
                    const months = ["JANUARI", "FEBRUARI", "MARET", "APRIL", "MEI", "JUNI", "JULI", "AGUSTUS", "SEPTEMBER", "OKTOBER", "NOVEMBER", "DESEMBER"];
                    const monthIdx = parseInt(parts[1], 10) - 1;
                    certDateVal.innerText = `${parseInt(parts[2], 10)} ${months[monthIdx] || ''} ${parts[0]}`;
                } else {
                    certDateVal.innerText = dateVal;
                }
            } else {
                certDateVal.innerText = '-';
            }
        }

        // Frame Theme
        if (printArea) {
            if (frameColor === 'custom') {
                const customColor = customColorInput ? (customColorInput.value || '#d4af37') : '#d4af37';
                printArea.className = 'award-theme-custom';
                applyCustomCertColor(printArea, customColor);
            } else {
                printArea.className = `award-theme-${frameColor}`;
                // Clear any inline overrides left over from a previous custom selection
                printArea.style.borderColor = '';
                printArea.style.background = '';
                printArea.style.color = '';
                printArea.style.removeProperty('--cert-theme-color');
            }
        }

        // Show/hide the custom color picker depending on selected theme
        if (customColorWrap) {
            customColorWrap.style.display = frameColor === 'custom' ? 'flex' : 'none';
        }

        // Photo Frame Style & Ideal Sizing (220px x 220px) with Drag-to-Position
        const certLogoImage = document.getElementById("certLogoImage");
        if (certLogoImage) {
            certLogoImage.style.width = "220px";
            certLogoImage.style.height = "220px";
            certLogoImage.style.maxWidth = "220px";
            certLogoImage.style.maxHeight = "220px";
            certLogoImage.style.objectFit = "cover";
            certLogoImage.style.objectPosition = `${window.certPhotoPosX || 50}% ${window.certPhotoPosY || 50}%`;
            certLogoImage.style.cursor = "grab";

            // Reset base styles first (Classic / Default)
            certLogoImage.style.borderRadius = "4px";
            certLogoImage.style.border = "3px double currentColor";
            certLogoImage.style.padding = "6px";
            certLogoImage.style.boxShadow = "0 4px 12px rgba(0,0,0,0.1)";
            certLogoImage.style.background = "#fff";
            
            if (photoFrameStyle === 'minimalist') {
                certLogoImage.style.border = "1px solid rgba(0,0,0,0.1)";
                certLogoImage.style.padding = "0";
                certLogoImage.style.boxShadow = "0 8px 24px rgba(0,0,0,0.12)";
                certLogoImage.style.borderRadius = "8px";
            } else if (photoFrameStyle === 'polaroid') {
                certLogoImage.style.border = "1px solid #e2e8f0";
                certLogoImage.style.padding = "8px 8px 24px 8px";
                certLogoImage.style.boxShadow = "2px 4px 15px rgba(0,0,0,0.15)";
                certLogoImage.style.borderRadius = "2px";
                certLogoImage.style.background = "#fdfdfd";
            } else if (photoFrameStyle === 'circle') {
                certLogoImage.style.border = "4px solid currentColor";
                certLogoImage.style.padding = "4px";
                certLogoImage.style.borderRadius = "50%";
            } else if (photoFrameStyle === 'none') {
                certLogoImage.style.border = "none";
                certLogoImage.style.padding = "0";
                certLogoImage.style.boxShadow = "none";
                certLogoImage.style.background = "transparent";
            }
        }
    }

    updateCertificatePreview();
}

(function initAwardAndRankingListeners() {
    // If DOM not ready yet, wait and re-call
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAwardAndRankingListeners);
        return;
    }
    // =========================================
    // BEST SALES AWARD MODAL - ALL EVENT WIRING
    // =========================================
    const awardModal = document.getElementById("bestSalesAwardModal");
    const openAwardBtn = document.getElementById("openAwardModalBtn");
    const closeAwardBtn = document.getElementById("closeAwardModal");
    const awardStaffSelect = document.getElementById("awardStaffSelect");
    const awardStoreNameInput = document.getElementById("awardStoreName");
    const awardTitleInput = document.getElementById("awardTitleInput");
    const awardFrameColor = document.getElementById("awardFrameColor");
    const awardCustomColor = document.getElementById("awardCustomColor");
    const awardImageUpload = document.getElementById("awardImageUpload");
    const awardDateInput = document.getElementById("awardDateInput");
    const printCertBtn = document.getElementById("printCertificateBtn");

    function openAwardModal(bestCategory) {
        if (!awardModal) return;
        awardModal.style.display = "flex";
        awardModal.classList.add("show");

        // Auto-select best staff based on category
        if (bestCategory && window.latestStaffSummaryData) {
            const summary = window.latestStaffSummaryData;
            const staffRows = summary.filter(r => r.staff && r.staff !== 'TOTAL' && r.staff !== 'UNKNOWN' && r.staff !== 'O2O');

            let bestStaff = null;
            let awardTitle = 'BEST SALES OF THE MONTH';

            if (bestCategory === 'sales') {
                bestStaff = staffRows.sort((a, b) => (b.sales || 0) - (a.sales || 0))[0];
                awardTitle = 'BEST SALES OF THE MONTH';
            } else if (bestCategory === 'upt') {
                bestStaff = staffRows.sort((a, b) => {
                    const uptA = (a.sm || 0) > 0 ? (a.qty || 0) / a.sm : 0;
                    const uptB = (b.sm || 0) > 0 ? (b.qty || 0) / b.sm : 0;
                    return uptB - uptA;
                })[0];
                awardTitle = 'BEST UPT OF THE MONTH';
            } else if (bestCategory === 'aur') {
                bestStaff = staffRows.sort((a, b) => {
                    const aurA = (a.qty || 0) > 0 ? (a.sales || 0) / a.qty : 0;
                    const aurB = (b.qty || 0) > 0 ? (b.sales || 0) / b.qty : 0;
                    return aurB - aurA;
                })[0];
                awardTitle = 'BEST AUR OF THE MONTH';
            } else if (bestCategory === 'rpt') {
                bestStaff = staffRows.sort((a, b) => {
                    const rptA = (a.sm || 0) > 0 ? (a.sales || 0) / a.sm : 0;
                    const rptB = (b.sm || 0) > 0 ? (b.sales || 0) / b.sm : 0;
                    return rptB - rptA;
                })[0];
                awardTitle = 'BEST RPT / ATV OF THE MONTH';
            }

            // Pre-fill award title
            if (awardTitleInput) {
                awardTitleInput.value = awardTitle;
            }

            // Init feature first to populate staff dropdown
            if (typeof initBestSalesAwardFeature === 'function') {
                initBestSalesAwardFeature(summary);
            }

            // Auto-select best staff in dropdown
            if (bestStaff && awardStaffSelect) {
                awardStaffSelect.value = bestStaff.staff;
                // Trigger preview update after selection
                if (typeof initBestSalesAwardFeature === 'function') {
                    initBestSalesAwardFeature(summary);
                }
            }
        } else if (window.latestStaffSummaryData && typeof initBestSalesAwardFeature === 'function') {
            initBestSalesAwardFeature(window.latestStaffSummaryData);
        }
    }

    function closeAwardModal() {
        if (!awardModal) return;
        awardModal.style.display = "none";
    }

    function triggerCertPreview() {
        if (window.latestStaffSummaryData && typeof initBestSalesAwardFeature === 'function') {
            initBestSalesAwardFeature(window.latestStaffSummaryData);
        }
    }

    // Open button (default: best sales)
    if (openAwardBtn) {
        openAwardBtn.addEventListener("click", () => openAwardModal('sales'));
    }

    // Close button
    if (closeAwardBtn) {
        closeAwardBtn.addEventListener("click", closeAwardModal);
    }

    // Form controls trigger preview update
    if (awardStaffSelect) awardStaffSelect.addEventListener("change", triggerCertPreview);
    if (awardStoreNameInput) awardStoreNameInput.addEventListener("input", triggerCertPreview);
    if (awardTitleInput) awardTitleInput.addEventListener("input", triggerCertPreview);
    if (awardFrameColor) awardFrameColor.addEventListener("change", triggerCertPreview);
    if (awardCustomColor) awardCustomColor.addEventListener("input", triggerCertPreview);
    if (awardDateInput) awardDateInput.addEventListener("change", triggerCertPreview);
    const awardPhotoFrameStyleNode = document.getElementById("awardPhotoFrameStyle");
    if (awardPhotoFrameStyleNode) awardPhotoFrameStyleNode.addEventListener("change", triggerCertPreview);

    // Image Upload & Photo Position Dragging
    if (awardImageUpload) {
        awardImageUpload.addEventListener("change", (e) => {
            const file = e.target.files[0];
            const logoImg = document.getElementById("certLogoImage");
            const defaultBadge = document.getElementById("certDefaultBadge");
            const photoPosControls = document.getElementById("certPhotoPosControls");
            if (file) {
                const reader = new FileReader();
                reader.onload = (evt) => {
                    if (logoImg) {
                        logoImg.src = evt.target.result;
                        logoImg.style.display = "block";
                        initCertPhotoDragEvents();
                        updateCertPhotoPositionUI();
                    }
                    if (defaultBadge) defaultBadge.style.display = "none";
                    if (photoPosControls) photoPosControls.style.display = "block";
                };
                reader.readAsDataURL(file);
            } else {
                if (logoImg) logoImg.style.display = "none";
                if (defaultBadge) defaultBadge.style.display = "block";
                if (photoPosControls) photoPosControls.style.display = "none";
            }
            triggerCertPreview();
        });
    }

    // Initialize photo drag handlers globally
    initCertPhotoDragEvents();

    // Print Button — opens certificate in a NEW WINDOW to avoid
    // blank-page issues with file:// iframes and window.print().
    if (printCertBtn) {
        printCertBtn.addEventListener("click", () => {
            const printArea = document.getElementById("awardCertificatePrintArea");
            if (!printArea) { alert("Sertifikat belum tersedia."); return; }

            // Clone the certificate so we don't alter the live DOM
            const clone = printArea.cloneNode(true);

            // Grab computed styles of the original print area for inline transfer
            const origStyle = window.getComputedStyle(printArea);

            // Collect all relevant stylesheets from this document
            let cssText = '';
            try {
                for (const sheet of document.styleSheets) {
                    try {
                        for (const rule of sheet.cssRules) {
                            cssText += rule.cssText + '\n';
                        }
                    } catch(e) { /* cross-origin sheet, skip */ }
                }
            } catch(e) {}

            // Build a standalone HTML document with CSS-based print layout
            const html = `<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <title>Sertifikat Best Sales Award</title>
    <style>
        ${cssText}

        /* 
         * PURE CSS PRINT LAYOUT 
         * 1. Force landscape orientation by default
         * 2. Set exact physical size (A4 Landscape is 297x210mm)
         * 3. Let browser's native "Scale to Fit" handle portrait mode
         */
        @media print {
            @page {
                size: A4 landscape;
                margin: 5mm;
            }
            html, body {
                margin: 0 !important;
                padding: 0 !important;
                width: 100% !important;
                height: 100% !important;
                background: #ffffff !important;
            }
            #printWrapper {
                display: block !important;
                width: 100% !important;
                height: 100% !important;
            }
            #awardCertificatePrintArea {
                /* Exact A4 dimensions minus margins */
                width: 287mm !important;
                height: 195mm !important;
                max-width: none !important;
                max-height: none !important;
                margin: 0 !important;
                padding: 8mm 12mm !important;
                box-sizing: border-box !important;
                box-shadow: none !important;
                transform: none !important;
                page-break-inside: avoid;
            }
            /* Adjust internal text for physical mm size to prevent cutoff */
            #awardCertificatePrintArea h1 {
                font-size: 21px !important;
                margin-bottom: 8px !important;
            }
            #awardCertificatePrintArea p#certAwardCategoryText {
                margin: 10px auto 16px auto !important;
                font-size: 11px !important;
            }
            #awardCertificatePrintArea #certStaffName {
                font-size: 28px !important;
                margin-bottom: 4px !important;
            }
            #awardCertificatePrintArea #certLogoImage {
                max-height: 140px !important;
                max-width: 300px !important;
            }
            /* Reduce space below metrics grid */
            #awardCertificatePrintArea > div:nth-of-type(8) {
                margin-bottom: 15px !important;
            }
            /* Force print backgrounds */
            * {
                -webkit-print-color-adjust: exact !important;
                print-color-adjust: exact !important;
                color-adjust: exact !important;
            }
        }

        /* Screen preview styling inside the popup */
        @media screen {
            body { background: #555; display: flex; justify-content: center; padding: 20px; }
            #awardCertificatePrintArea { max-width: 1000px; }
        }
        #closePrintPopupBtn {
            position: fixed;
            top: 12px;
            right: 12px;
            z-index: 9999;
            padding: 10px 18px;
            background: #111;
            color: #fff;
            border: none;
            border-radius: 6px;
            font-size: 14px;
            font-weight: bold;
            cursor: pointer;
        }
        @media print {
            #closePrintPopupBtn { display: none !important; }
        }
    </style>
</head>
<body>
    <button id="closePrintPopupBtn" onclick="window.close()">✕ Tutup</button>
    <div id="printWrapper">
        ${clone.outerHTML}
    </div>
    <script>
        (function() {
            // Give the popup a brief moment to finish laying out fonts/images
            // before invoking print.
            setTimeout(function() {
                window.print();
            }, 500);

            // Deliberately NOT auto-closing this window anymore.
            // On Android Chrome, "afterprint" fires as soon as Chrome hands
            // the document off to the native Android print/PDF UI — not
            // after the user actually finishes choosing "Save as PDF" and
            // saving the file. Closing the popup based on that event (or any
            // short fixed delay) kills the source document while the native
            // Save-as-PDF flow is still in progress, which is why the dialog
            // was flashing and disappearing. Leaving the popup open lets that
            // flow complete safely; the user can close this tab afterwards.
        })();
    <\/script>
</body>
</html>`;

            // Open the new window and write the certificate
            const printWin = window.open('', '_blank', 'width=1000,height=700');
            if (!printWin) {
                alert("Pop-up diblokir browser! Izinkan pop-up untuk mencetak sertifikat.");
                return;
            }
            printWin.document.open();
            printWin.document.write(html);
            printWin.document.close();
        });
    }

    // Close modal on backdrop click
    if (awardModal) {
        awardModal.addEventListener("click", (e) => {
            if (e.target === awardModal) closeAwardModal();
        });
    }

    // =========================================
    // RANKING FILTER DROPDOWN
    // =========================================
    const filterSelect = document.getElementById("rankingFilterMode");
    if (filterSelect) {
        filterSelect.addEventListener("change", () => {
            const val = filterSelect.value;
            // Handle best_* categories
            if (val.startsWith('best_')) {
                const category = val.replace('best_', '');
                openAwardModal(category);
                // Reset dropdown back to previous ranking mode
                filterSelect.value = currentRankingFilterMode || 'top3';
                return;
            }
            currentRankingFilterMode = val;
            if (window.latestStaffSummaryData) {
                updateRanking(window.latestStaffSummaryData, window.latestStaffDivisionsData);
            }
        });
    }
})();

// =====================================================
// VALIDATION
// =====================================================

// =====================================================
// VALIDATION UI V4
// ENGINE BUSINESS RULE RENDERER
// =====================================================

function updateValidation() {
  const v = GTEngine.getValidation(getActivePerformanceDateFilter());

  // ============================================
  // ELEMENTS
  // ============================================

  const dailyCashElement = document.getElementById("valDailySM");

  const staffSMElement = document.getElementById("valStaffSM");

  const diffElement = document.getElementById("valSMDiff");

  const statusElement = document.getElementById("valSMStatus");

  const reasonElement = document.getElementById("valReason");

  // ============================================
  // BASIC VALUES
  // ============================================

  if (dailyCashElement) {
    dailyCashElement.innerText = v.dailyCashSM;
  }

  if (staffSMElement) {
    staffSMElement.innerText = v.staffSM;
  }

  if (diffElement) {
    diffElement.innerText =
      v.difference > 0 ? `+${v.difference}` : String(v.difference);
  }

  // ============================================
  // CLASSIFY SHARED INVOICES
  //
  // VALID SHARED:
  // STAFF A + STAFF B
  //
  // ATTRIBUTION ANOMALY:
  // UNKNOWN + STAFF
  // ============================================

  const validShared = v.shared.filter(
    (item) => !item.staffs.includes("UNKNOWN"),
  );

  const attributionAnomalies = v.shared.filter((item) =>
    item.staffs.includes("UNKNOWN"),
  );

  // ============================================
  // VALID SHARED EXTRA ATTRIBUTION
  // ============================================

  const validSharedExtra = validShared.reduce(
    (sum, item) =>
      sum +
      Math.max(
        0,

        item.staffs.length - 1,
      ),

    0,
  );

  // ============================================
  // UNKNOWN EXTRA ATTRIBUTION
  //
  // UNKNOWN + STAFF PADA INVOICE SAMA
  // JUGA MENAMBAH STAFF SM SEBESAR +1
  // ============================================

  const unknownExtraAttribution = attributionAnomalies.reduce(
    (sum, item) =>
      sum +
      Math.max(
        0,

        item.staffs.length - 1,
      ),

    0,
  );

  // ============================================
  // EXPECTED STAFF SM
  // ============================================

  const expectedStaffSM =
    v.dailyCashSM + validSharedExtra + unknownExtraAttribution;

  const staffAttributionMatch = v.staffSM === expectedStaffSM;

  // ============================================
  // CORE RECONCILIATION
  // ============================================

  const coreValid =
    v.salesMatch &&
    v.qtyMatch &&
    v.smMatch &&
    v.grossReconciliation &&
    staffAttributionMatch;

  // ============================================
  // FINAL UI STATUS
  // ============================================

  let finalStatus = "";

  let finalStatusType = "";

  if (!coreValid) {
    finalStatus = "❌ INVALID";

    finalStatusType = "INVALID";
  } else if (v.unknownTransactions > 0 || attributionAnomalies.length > 0) {
    finalStatus = "⚠ VALID WITH WARNING";

    finalStatusType = "WARNING";
  } else {
    finalStatus = "✅ VALID";

    finalStatusType = "VALID";
  }

  if (statusElement) {
    statusElement.innerText = finalStatus;
  }

  // ============================================
  // BUILD REASON
  // ============================================

  if (!reasonElement) {
    return;
  }

  let reason = "";

  // ============================================
  // ATTRIBUTION SUMMARY
  // ============================================

  reason += `

        <b>ATTRIBUTION RECONCILIATION</b>

        <br>

        Daily Cash SM:
        ${v.dailyCashSM}

        <br>

        Staff SM:
        ${v.staffSM}

        <br>

        Difference:
        ${v.difference > 0 ? "+" : ""}
        ${v.difference}

        <br>

        Valid Shared Extra:
        +${validSharedExtra}

        <br>

        Unknown Extra:
        +${unknownExtraAttribution}

    `;

  // ============================================
  // VALID SHARED INVOICES
  // ============================================

  if (validShared.length > 0) {
    reason += `

            <br><br>

            <b>
            ${validShared.length}
            VALID SHARED INVOICE
            </b>

        `;

    validShared.forEach((item) => {
      reason += `

                <br><br>

                <b>${item.invoice}</b>

                <br>

                ${item.staffs.join(" / ")}

            `;
    });
  }

  // ============================================
  // ATTRIBUTION ANOMALIES
  // ============================================

  if (attributionAnomalies.length > 0) {
    reason += `

            <br><br>

            <b>
            ⚠ ATTRIBUTION ANOMALY
            </b>

        `;

    attributionAnomalies.forEach((item) => {
      reason += `

                <br><br>

                <b>${item.invoice}</b>

                <br>

                ${item.staffs.join(" / ")}

            `;
    });
  }

  // ============================================
  // UNKNOWN TRANSACTION SUMMARY
  // ============================================

  if (v.unknownTransactions > 0) {
    reason += `

            <br><br>

            <b>
            UNKNOWN STAFF TRANSACTION
            </b>

            <br>

            Transaction Rows:
            ${v.unknownTransactions}

            <br>

            Unique Invoice:
            ${v.unknownSM}

            <br>

            Sales:
            ${money(v.unknownSales)}

            <br>

            Qty:
            ${v.unknownQty}

        `;
  }

  // ============================================
  // CORE ERROR LIST
  // ============================================

  const errors = [];

  if (!v.salesMatch) {
    errors.push("MD SALES RECONCILIATION FAILED");
  }

  if (!v.qtyMatch) {
    errors.push("MD QTY RECONCILIATION FAILED");
  }

  if (!v.smMatch) {
    errors.push("UNIQUE MD INVOICE RECONCILIATION FAILED");
  }

  if (!v.grossReconciliation) {
    errors.push("GROSS SALES RECONCILIATION FAILED");
  }

  if (!staffAttributionMatch) {
    errors.push("STAFF SM ATTRIBUTION FAILED");
  }

  if (errors.length > 0) {
    reason += `

            <br><br>

            <b>VALIDATION ERRORS</b>

            <br>

            ${errors.join("<br>")}

        `;
  }

  // ============================================
  // CLEAN VALID RESULT
  // ============================================

  if (finalStatusType === "VALID" && validShared.length === 0) {
    reason += `

            <br><br>

            No shared invoice or staff attribution anomaly detected.

        `;
  }

  reasonElement.innerHTML = reason;
}

// =====================================================
// DAILY AUDIT WORKSPACE V2
// DATE SELECTOR + DAILY STAFF PERFORMANCE
// =====================================================

let selectedDailyAuditDate = "";

// =====================================================
// INITIALIZE DAILY AUDIT
// DIPANGGIL SETELAH PROCESS SELESAI
// =====================================================

function updateDailyValidation() {
  const selector = document.getElementById("dailyAuditDate");

  const workspace = document.getElementById("dailyAuditWorkspace");

  const statusElement = document.getElementById("dailyAuditStatus");

  if (!selector || !workspace) {
    console.warn("Daily Audit UI element tidak ditemukan.");

    return;
  }

  // ============================================
  // GET AVAILABLE DATES
  // SOURCE OF TRUTH = DAILY CASH
  // ============================================

  const dates = [
    ...new Set(
      [...GTEngine.invoiceMap.values()]

        .map((inv) => inv.date)

        .filter(Boolean),
    ),
  ].sort((a, b) => {
    const [dayA, monthA, yearA] = a.split("-").map(Number);

    const [dayB, monthB, yearB] = b.split("-").map(Number);

    return (
      new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB)
    );
  });

  // ============================================
  // EMPTY STATE
  // ============================================

  if (dates.length === 0) {
    selector.innerHTML = `

            <option value="">

                NO DATE AVAILABLE

            </option>

        `;

    workspace.innerHTML = `

            <div class="daily-audit-empty">

                NO DAILY AUDIT DATA

            </div>

        `;

    if (statusElement) {
      statusElement.innerText = "-";
    }

    return;
  }

  // ============================================
  // REBUILD SELECTOR
  // ============================================

  const previousDate = selectedDailyAuditDate;

  selector.innerHTML = "";

  dates.forEach((date) => {
    const option = document.createElement("option");

    option.value = date;

    option.innerText = date;

    selector.appendChild(option);
  });

  // ============================================
  // KEEP SELECTED DATE IF STILL AVAILABLE
  // DEFAULT = FIRST WARNING / INVALID
  // OTHERWISE LATEST DATE
  // ============================================

  const issueDate = dates.find((date) => {
    const validation = GTEngine.getValidation(date);

    return validation.status === "WARNING" || validation.status === "INVALID";
  });

  if (previousDate && dates.includes(previousDate)) {
    selectedDailyAuditDate = previousDate;
  } else if (issueDate) {
    selectedDailyAuditDate = issueDate;
  } else {
    selectedDailyAuditDate = dates[dates.length - 1];
  }

  selector.value = selectedDailyAuditDate;

  // ============================================
  // REGISTER CHANGE EVENT ONCE
  // ============================================

  if (selector.dataset.auditRegistered !== "true") {
    selector.addEventListener(
      "change",

      (event) => {
        selectedDailyAuditDate = event.target.value;

        renderDailyAudit(selectedDailyAuditDate);
      },
    );

    selector.dataset.auditRegistered = "true";
  }

  // ============================================
  // INITIAL RENDER
  // ============================================

  renderDailyAudit(selectedDailyAuditDate);
}

// =====================================================
// RENDER DAILY AUDIT
// =====================================================

function renderDailyAudit(date) {
  const workspace = document.getElementById("dailyAuditWorkspace");

  const statusElement = document.getElementById("dailyAuditStatus");

  if (!workspace) {
    return;
  }

  if (!date) {
    workspace.innerHTML = `

            <div class="daily-audit-empty">

                SELECT DATE

            </div>

        `;

    return;
  }

  // ============================================
  // GET ENGINE DATA
  // ============================================

  const validation = GTEngine.getValidation(date);

  const summary = GTEngine.generateSummary(date);

  const divisions = getActiveDivisions(
    summary,

    window.divisionData,
  );

  // ============================================
  // BUILD DETAIL OBJECT
  // ============================================

  const detail = {
    date,

    validation,

    staffSummary: summary,

    divisions,
  };

  // ============================================
  // STATUS
  // ============================================

  if (statusElement) {
    statusElement.innerText = validation.statusLabel;

    statusElement.dataset.status = validation.status;
  }

  // ============================================
  // RENDER
  // ============================================

  let html = "";

  html += buildDailyAuditKPI(detail);

  html += buildDailyStaffPerformance(detail);

  html += buildDailyValidationDetail(detail);

  workspace.innerHTML = html;
}

// =====================================================
// BUILD DAILY KPI
// =====================================================

function buildDailyAuditKPI(detail) {
  const summary = detail.staffSummary || [];

  const validation = detail.validation;

  const total = summary.find((row) => row.staff === "TOTAL");

  const staffRows = summary.filter(
    (row) =>
      row.staff !== "TOTAL" && row.staff !== "UNKNOWN" && row.staff !== "O2O",
  );

  const totalSales = total?.sales || 0;

  const totalQty = total?.qty || 0;

  const avgSales =
    staffRows.length > 0 ? Math.round(totalSales / staffRows.length) : 0;

  return `

        <div class="daily-performance-cards">


            <div class="daily-performance-card">

                <span>TOTAL STAFF</span>

                <strong>

                    ${staffRows.length}

                </strong>

            </div>


            <div class="daily-performance-card">

                <span>TOTAL SALES</span>

                <strong>

                    ${money(totalSales)}

                </strong>

            </div>


            <div class="daily-performance-card">

                <span>DAILY CASH SM</span>

                <strong>

                    ${validation.dailyCashSM}

                </strong>

            </div>


            <div class="daily-performance-card">

                <span>STAFF SM</span>

                <strong>

                    ${validation.staffSM}

                </strong>

            </div>


            <div class="daily-performance-card">

                <span>DIFF</span>

                <strong>

                    ${
                      validation.difference > 0 ? "+" : ""
                    }${validation.difference}

                </strong>

            </div>


            <div class="daily-performance-card">

                <span>TOTAL QTY</span>

                <strong>

                    ${totalQty}

                </strong>

            </div>


            <div class="daily-performance-card">

                <span>AVG SALES / STAFF</span>

                <strong>

                    ${money(avgSales)}

                </strong>

            </div>


        </div>

    `;
}

// =====================================================
// BUILD DAILY STAFF PERFORMANCE
// =====================================================

function buildDailyStaffPerformance(detail) {
  const summary = detail.staffSummary || [];

  const divisions = detail.divisions || [];

  if (summary.length === 0) {
    return `

            <section class="daily-audit-section">

                <div class="daily-audit-section-header">

                    <div>

                        <h3>
                            DAILY STAFF PERFORMANCE
                        </h3>

                        <p>
                            No staff performance data.
                        </p>

                    </div>

                </div>

            </section>

        `;
  }

  let html = `

        <section class="daily-audit-section">


            <div class="daily-audit-section-header">

                <div>

                    <h3>

                        DAILY STAFF PERFORMANCE

                    </h3>

                    <p>

                        Sales, SM, quantity and product division by staff.

                    </p>

                </div>

            </div>


            <div class="table-wrap">

                <table class="validation-detail-table daily-staff-table">

                    <thead>

                        <tr>

                           <th>STAFF</th>

<th>SALES</th>

<th>SM</th>

<th>QTY</th>

<th>UPT</th>

<th>ATV</th>

<th>AUR</th>
    `;

  divisions.forEach((division) => {
    html += `

            <th>

                ${division}

            </th>

        `;
  });

  html += `

                        </tr>

                    </thead>


                    <tbody>

    `;

  summary.forEach((row) => {
    const isTotal = row.staff === "TOTAL";

    html += `

        
            <tr class="${isTotal ? "daily-staff-total-row" : ""}">

                <td>

                    ${displayStaffName(row.staff)}

                </td>


                <td>

                    ${money(row.sales)}

                </td>


                <td>

                    ${row.sm || 0}

                </td>


                <td>

                    ${row.qty || 0}

                </td>

<td>

    ${formatDecimal(calculateUPT(row), 2)}

</td>


<td>

    ${money(Math.round(calculateATV(row)))}

</td>


<td>

    ${money(Math.round(calculateAUR(row)))}

</td>

        `;

    divisions.forEach((division) => {
      html += `

                <td>

                    ${row.categories?.[division] || 0}

                </td>

            `;
    });

    html += `

            </tr>

        `;
  });

  html += `

                    </tbody>

                </table>

            </div>


        </section>

    `;

  return html;
}

// =====================================================
// BUILD DAILY VALIDATION DETAIL
// =====================================================

function buildDailyValidationDetail(detail) {
  const v = detail.validation;

  const validShared = Array.isArray(v.validShared)
    ? v.validShared
    : (v.shared || []).filter((item) => !item.staffs.includes("UNKNOWN"));

  const anomalies = Array.isArray(v.attributionAnomalies)
    ? v.attributionAnomalies
    : (v.shared || []).filter((item) => item.staffs.includes("UNKNOWN"));

  const unknownTransactions = GTEngine.transactions.filter((t) => {
    if (t.date !== detail.date) {
      return false;
    }

    if (t.isNonMD) {
      return false;
    }

    return (
      !t.staff ||
      String(t.staff.name || "")
        .trim()
        .toUpperCase() === "UNKNOWN"
    );
  });

  let html = `

        <section class="daily-audit-section">


            <div class="daily-audit-section-header">

                <div>

                    <h3>

                        VALIDATION DETAIL

                    </h3>

                    <p>

                        Source reconciliation and staff attribution audit.

                    </p>

                </div>

            </div>


            <div class="daily-validation-overview">


                <div>

                    <span>STATUS</span>

                    <strong>

                        ${v.statusLabel}

                    </strong>

                </div>


                <div>

                    <span>VALID SHARED</span>

                    <strong>

                        ${validShared.length}

                    </strong>

                </div>


                <div>

                    <span>ATTRIBUTION ANOMALY</span>

                    <strong>

                        ${anomalies.length}

                    </strong>

                </div>


                <div>

                    <span>UNKNOWN ROW</span>

                    <strong>

                        ${v.unknownTransactions}

                    </strong>

                </div>


                <div>

                    <span>UNKNOWN SALES</span>

                    <strong>

                        ${money(v.unknownSales)}

                    </strong>

                </div>


                <div>

                    <span>UNKNOWN QTY</span>

                    <strong>

                        ${v.unknownQty}

                    </strong>

                </div>


            </div>

    `;

  // ============================================
  // VALID SHARED
  // ============================================

  if (validShared.length > 0) {
    html += `

            <div class="daily-validation-group">

                <h4>

                    VALID SHARED INVOICE

                </h4>

        `;

    validShared.forEach((item) => {
      html += `

                <div class="daily-validation-item">

                    <strong>

                        ${item.invoice}

                    </strong>

                    <span>

                        ${item.staffs.join(" / ")}

                    </span>

                    <small>

                        Extra Attribution:
                        +${
                          item.extraAttribution ??
                          Math.max(0, item.staffs.length - 1)
                        }

                    </small>

                </div>

            `;
    });

    html += `

            </div>

        `;
  }

  // ============================================
  // ATTRIBUTION ANOMALY
  // ============================================

  if (anomalies.length > 0) {
    html += `

            <div class="daily-validation-group">

                <h4>

                    ⚠ ATTRIBUTION ANOMALY

                </h4>

        `;

    anomalies.forEach((item) => {
      html += `

                <div class="
                    daily-validation-item
                    daily-validation-anomaly
                ">

                    <strong>

                        ${item.invoice}

                    </strong>

                    <span>

                        ${item.staffs.join(" / ")}

                    </span>

                </div>

            `;
    });

    html += `

            </div>

        `;
  }

  // ============================================
  // UNKNOWN TRANSACTIONS
  // ============================================

  if (unknownTransactions.length > 0) {
    html += `

            <div class="daily-validation-group">

                <h4>

                    UNKNOWN STAFF TRANSACTIONS

                </h4>


                <div class="table-wrap">

                    <table class="validation-detail-table">

                        <thead>

                            <tr>

                                <th>INVOICE</th>

                                <th>ARTICLE</th>

                                <th>SALES</th>

                                <th>QTY</th>

                            </tr>

                        </thead>


                        <tbody>

        `;

    unknownTransactions.forEach((t) => {
      html += `

                <tr>

                    <td>

                        ${t.invoice}

                    </td>

                    <td>

                        ${t.article}

                    </td>

                    <td>

                        ${money(t.sales)}

                    </td>

                    <td>

                        ${t.qty}

                    </td>

                </tr>

            `;
    });

    html += `

                        </tbody>

                    </table>

                </div>


            </div>

        `;
  }

  // ============================================
  // CLEAN STATE
  // ============================================

  if (
    validShared.length === 0 &&
    anomalies.length === 0 &&
    unknownTransactions.length === 0
  ) {
    html += `

            <div class="daily-validation-clean">

                <strong>

                    DATA RECONCILED

                </strong>

                <span>

                    No shared invoice, attribution anomaly,
                    or unknown staff transaction detected.

                </span>

            </div>

        `;
  }

  html += `

        </section>

    `;

  return html;
}

// =====================================================
// PRINT STAFF PERFORMANCE REPORT
// SUMMARY + PERFORMANCE TABLE + KPI RANKING
// =====================================================

function printStaffPerformanceReport() {
  if (!Array.isArray(window.summaryData) || window.summaryData.length === 0) {
    alert("PROCESS DATA TERLEBIH DAHULU.");

    return;
  }

  // =================================================
  // REPORT GENERATED TIME
  // =================================================

  const now = new Date();

  const generatedAt = now.toLocaleString(
    "id-ID",

    {
      day: "2-digit",

      month: "2-digit",

      year: "numeric",

      hour: "2-digit",

      minute: "2-digit",
    },
  );

  document.body.dataset.printGeneratedAt = generatedAt;

  // =================================================
  // PRINT MODE
  // =================================================

  document.body.classList.add("staff-performance-print-mode");

  // =================================================
  // PRINT
  // =================================================

  window.print();

  // =================================================
  // CLEANUP
  // =================================================

  setTimeout(() => {
    document.body.classList.remove("staff-performance-print-mode");

    delete document.body.dataset.printGeneratedAt;
  }, 500);
}

// =====================================================
// PRINT STAFF PERFORMANCE REPORT
// =====================================================

function printStaffPerformanceReport() {
  if (!Array.isArray(window.summaryData) || window.summaryData.length === 0) {
    alert("PROCESS DATA TERLEBIH DAHULU SEBELUM PRINT REPORT.");

    return;
  }

  const now = new Date();

  const generatedAt = now.toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  document.body.dataset.printGeneratedAt = generatedAt;

  document.body.classList.add("staff-performance-print-mode");

  const cleanupPrintMode = () => {
    document.body.classList.remove("staff-performance-print-mode");

    window.removeEventListener("afterprint", cleanupPrintMode);
  };

  window.addEventListener("afterprint", cleanupPrintMode);

  window.print();
}

// =====================================================
// GT AUTO SALES STAFF
// PRINT REPORT SYSTEM V2
// ISOLATED PRINT ROOT
// =====================================================

function escapePrintHTML(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")

    .replaceAll("<", "&lt;")

    .replaceAll(">", "&gt;")

    .replaceAll('"', "&quot;")

    .replaceAll("'", "&#039;");
}

// =====================================================
// GET PRINT LICENSE INFORMATION
// =====================================================

function getPrintLicenseInfo() {
  const status = GTRuntime.getStatus();

  let planLabel = "NOT AUTHORIZED";

  let accessLabel = "ACCESS DENIED";

  if (status.plan === "VIP_LIFETIME") {
    planLabel = "VIP LIFETIME";

    accessLabel = "AUTHORIZED • PERMANENT ACCESS";
  } else if (status.plan === "FREE_ACCESS") {
    planLabel = "FREE ACCESS";

    const freeLimit = status.freeLimit;

    if (freeLimit) {
      const limitDate = new Date(
        freeLimit.year,

        freeLimit.month - 1,

        freeLimit.day,
      );

      const formattedDate = limitDate
        .toLocaleDateString(
          "id-ID",

          {
            day: "2-digit",

            month: "long",

            year: "numeric",
          },
        )
        .toUpperCase();

      accessLabel = ``;
    } else {
      accessLabel = "AUTHORIZED";
    }
  } else if (status.plan === "FREE_EXPIRED") {
    planLabel = "FREE ACCESS";

    accessLabel = "ACCESS EXPIRED";
  }

  return {
    userId: status.userId || "-",

    plan: planLabel,

    access: accessLabel,
  };
}

// =====================================================
// BUILD PRINT SUMMARY
// =====================================================

function buildPrintSummary(summary) {
  const total = summary.find((row) => row.staff === "TOTAL");

  if (!total) {
    return "";
  }

  const staffOnly = summary.filter(
    (row) =>
      row.staff !== "TOTAL" && row.staff !== "UNKNOWN" && row.staff !== "O2O",
  );

  const avgSales =
    staffOnly.length > 0
      ? Math.round(Number(total.sales || 0) / staffOnly.length)
      : 0;

  const licenseInfo = getPrintLicenseInfo();

  const cards = [
    {
      label: "TOTAL STAFF",
      value: staffOnly.length,
    },

    {
      label: "TOTAL SALES",
      value: `${money(total.sales)}`,
    },

    {
      label: "TOTAL SM",
      value: formatNumber(total.sm),
    },

    {
      label: "TOTAL QTY",
      value: formatNumber(total.qty),
    },

    {
      label: "AVG SALES / STAFF",
      value: `${money(avgSales)}`,
    },

    {
      label: "ACCOUNT ID",
      value: licenseInfo.userId,
    },

    {
      label: "LICENSE PLAN",
      value: licenseInfo.plan,
    },

    {
      label: "ACCESS STATUS",
      value: licenseInfo.access,
    },
  ];

  return `

        <div class="print-summary">

            ${cards
              .map(
                (card) => `

                <div class="print-summary-card">

                    <span>
                        ${escapePrintHTML(card.label)}
                    </span>

                    <strong>
                        ${escapePrintHTML(card.value)}
                    </strong>

                </div>

            `,
              )
              .join("")}

        </div>

    `;
}

// =====================================================
// BUILD PRINT PERFORMANCE TABLE
// =====================================================

function buildPrintPerformanceTable(summary, divisions) {
  const isDaily = summary.length > 0 && summary[0].date !== undefined;
  const headers = [];
  if (isDaily) headers.push("DATE");
  headers.push(
    "STAFF",
    "SALES",
    "SM",
    "QTY",
    "UPT",
    "ATV",
    "AUR",
    ...divisions,
  );

  const rowsHTML = summary
    .map((row) => {
      const isTotal = row.staff === "TOTAL";
      const dateCell = isDaily
        ? `<td>${escapePrintHTML(row.staff === "TOTAL" ? "" : row.date || "")}</td>`
        : "";

      const divisionCells = divisions
        .map(
          (division) => `
            <td>${escapePrintHTML(row.categories?.[division] || 0)}</td>
        `,
        )
        .join("");

      return `
            <tr class="${isTotal ? "total-row" : ""}">
                ${dateCell}
                <td>${escapePrintHTML(displayStaffName(row.staff))}</td>
                <td>${escapePrintHTML(money(row.sales))}</td>
                <td>${escapePrintHTML(row.sm || 0)}</td>
                <td>${escapePrintHTML(row.qty || 0)}</td>
                <td>${escapePrintHTML(formatDecimal(calculateUPT(row), 2))}</td>
                <td>${escapePrintHTML(money(Math.round(calculateATV(row))))}</td>
                <td>${escapePrintHTML(money(Math.round(calculateAUR(row))))}</td>
                ${divisionCells}
            </tr>
        `;
    })
    .join("");

  return `
        <table class="print-performance-table">
            <thead>
                <tr>
                    ${headers
                      .map(
                        (header) => `
                        <th>${escapePrintHTML(header)}</th>
                    `,
                      )
                      .join("")}
                </tr>
            </thead>
            <tbody>
                ${rowsHTML}
            </tbody>
        </table>
    `;
}

function getPrintRankingConfig(divisions) {
  const config = [
    {
      title: "TOP SALES",

      getValue: (row) => Number(row.sales || 0),

      formatter: (value) => `${money(value)}`,
    },

    {
      title: "TOP QTY",

      getValue: (row) => Number(row.qty || 0),

      formatter: (value) => formatNumber(value),
    },

    {
      title: "TOP UPT",

      getValue: (row) => calculateUPT(row),

      formatter: (value) => formatDecimal(value, 2),
    },

    {
      title: "TOP ATV",

      getValue: (row) => calculateATV(row),

      formatter: (value) => `${money(Math.round(value))}`,
    },

    {
      title: "TOP AUR",

      getValue: (row) => calculateAUR(row),

      formatter: (value) => `${money(Math.round(value))}`,
    },
  ];

  divisions.forEach((division) => {
    config.push({
      title: `TOP ${division}`,

      getValue: (row) => Number(row.categories?.[division] || 0),

      formatter: (value) => formatNumber(value),
    });
  });

  return config;
}

// =====================================================
// BUILD PRINT RANKING
// =====================================================

function buildPrintRanking(summary, divisions) {
  const staffData = summary.filter(
    (row) =>
      row.staff !== "TOTAL" && row.staff !== "UNKNOWN" && row.staff !== "O2O",
  );

  const medals = ["🥇", "🥈", "🥉"];

  const config = getPrintRankingConfig(divisions);

  return `

        <div class="print-ranking-grid">

            ${config
              .map((item) => {
                const ranking = getTop3(
                  staffData,

                  item.getValue,
                );

                const rankingHTML =
                  ranking.length > 0
                    ? ranking
                        .map(
                          (row, index) => `

                            <div class="print-ranking-item">

                                <span class="print-ranking-position">

                                    ${medals[index]}

                                </span>


                                <span class="print-ranking-staff">

                                    ${escapePrintHTML(
                                      displayStaffName(row.staff),
                                    )}

                                </span>


                                <strong class="print-ranking-value">

                                    ${escapePrintHTML(
                                      item.formatter(item.getValue(row)),
                                    )}

                                </strong>

                            </div>

                        `,
                        )
                        .join("")
                    : `

                            <div class="print-ranking-item">

                                <span>-</span>

                            </div>

                        `;

                return `

                    <div class="print-ranking-card">

                        <h3>

                            ${escapePrintHTML(item.title)}

                        </h3>


                        <div class="print-ranking-list">

                            ${rankingHTML}

                        </div>

                    </div>

                `;
              })
              .join("")}

        </div>

    `;
}

// =====================================================
// BUILD COMPLETE PRINT REPORT
// =====================================================

function buildStaffPerformancePrintReport() {
  const summary = window.summaryData;

  if (!Array.isArray(summary) || summary.length === 0) {
    return false;
  }

  const printRoot = document.getElementById("printReportRoot");

  if (!printRoot) {
    console.error("printReportRoot tidak ditemukan.");

    return false;
  }

  const divisions = getActiveDivisions(
    summary,

    window.divisionData,
  );

  const periodLabel = getPerformanceFilterLabel(
    getActivePerformanceDateFilter(),
  );

  const generatedAt = new Date().toLocaleString(
    "id-ID",

    {
      dateStyle: "medium",
      timeStyle: "short",
    },
  );

  const licenseInfo = getPrintLicenseInfo();

  printRoot.innerHTML = `

        <main class="print-report">


            <header class="print-report-header">

                <div class="print-report-brand">

                    <img
                        src="img/logo.png"
                        class="print-report-logo"
                        alt="KANGODING.ORG"
                    >


                    <div class="print-report-title">

                        <h1>
                            GT AUTO SALES STAFF
                        </h1>

                        <p>
                            SALES STAFF PERFORMANCE REPORT
                        </p>

                    </div>

                </div>


                <div class="print-report-meta">

    <strong>
        KANGODING.ORG
    </strong>
<span>
    PERIOD •
    ${escapePrintHTML(periodLabel)}
</span>
    <span>
        ACCOUNT ID •
        ${escapePrintHTML(licenseInfo.userId)}
    </span>

    <span>
        LICENSE •
        ${escapePrintHTML(licenseInfo.plan)}
    </span>

    <span>
        ACCESS •
        ${escapePrintHTML(licenseInfo.access)}
    </span>

    <span>
        REPORT ID • 19002369
    </span>

    <span>
        GENERATED •
        ${escapePrintHTML(generatedAt)}
    </span>

</div>

            </header>


            <section class="print-report-section">

                <div class="print-report-section-title">

                    MONTHLY SUMMARY

                </div>


                ${buildPrintMonthlySummary(summary, divisions)}

            </section>


            <section class="print-report-section">

                <div class="print-report-section-title">

                    SALES STAFF PERFORMANCE

                </div>


                ${buildPrintPerformanceTable(summary, divisions)}

            </section>


            <section class="print-report-section">

                <div class="print-report-section-title">

                    KPI & PRODUCT DIVISION RANKING

                </div>


                ${buildPrintRanking(summary, divisions)}

            </section>


            <footer class="print-report-footer">

    GT AUTO SALES STAFF •
    KANGODING.ORG ENGINE •

    PERIOD
    ${escapePrintHTML(periodLabel)} •

    REPORT ID 19002369 •

    GENERATED
    ${escapePrintHTML(generatedAt)}

</footer>

            <div class="print-report-watermark">

                <strong>
                    KANGODING.ORG
                </strong>

                <span>
                    19002369
                </span>

            </div>


        </main>

    `;

  return true;
}

// =====================================================
// PRINT REPORT
// =====================================================

function printStaffPerformanceReport() {
  GTRuntime.assertPrintAccess();

  const reportReady = buildStaffPerformancePrintReport();

  if (!reportReady) {
    alert("PROCESS DATA TERLEBIH DAHULU SEBELUM PRINT REPORT.");

    return;
  }

  /*
    Tunggu logo / image selesai load.
    Ini mencegah logo kosong saat print pertama.
    */

  const printRoot = document.getElementById("printReportRoot");

  const images = [...printRoot.querySelectorAll("img")];

  const imagePromises = images.map((image) => {
    if (image.complete) {
      return Promise.resolve();
    }

    return new Promise((resolve) => {
      image.addEventListener("load", resolve, { once: true });

      image.addEventListener("error", resolve, { once: true });
    });
  });

  Promise.all(imagePromises)

    .then(() => {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          window.print();
        });
      });
    });
}

// =====================================================
// DRAW MONTHLY SUMMARY TABLE
// =====================================================
function drawMonthlySummaryTable(summary, divisions) {
  if (!Array.isArray(summary)) {
    return;
  }
  const activeDivisions = getActiveDivisions(summary, divisions);
  const thead = document.getElementById("monthlySummaryHead");
  
  // Create an aggregated summary (group by staff)
  const aggregatedMap = new Map();
  summary.forEach(row => {
      const staff = row.staff || 'UNKNOWN';
      if (!aggregatedMap.has(staff)) {
          aggregatedMap.set(staff, {
              staff: staff,
              sales: 0,
              sm: 0,
              qty: 0,
              categories: {}
          });
      }
      const agg = aggregatedMap.get(staff);
      agg.sales += (row.sales || 0);
      agg.sm += (row.sm || 0);
      agg.qty += (row.qty || 0);
      
      if (row.categories) {
          activeDivisions.forEach(div => {
              if (row.categories[div]) {
                  agg.categories[div] = (agg.categories[div] || 0) + row.categories[div];
              }
          });
      }
  });

  const aggregatedSummary = Array.from(aggregatedMap.values());

  if (thead) {
    thead.innerHTML = "";
    const tr = document.createElement("tr");
    let staticColumns = [];
    staticColumns.push({ key: "staff", label: "STAFF" });
    staticColumns.push({ key: "sales", label: "SALES" });
    staticColumns.push({ key: "sm", label: "SM" });
    staticColumns.push({ key: "qty", label: "QTY" });
    staticColumns.push({ key: "upt", label: "UPT" });
    staticColumns.push({ key: "atv", label: "ATV" });
    staticColumns.push({ key: "aur", label: "AUR" });

    staticColumns.forEach((col) => {
      const th = document.createElement("th");
      th.innerText = col.label;
      tr.appendChild(th);
    });
    activeDivisions.forEach((div) => {
      const th = document.createElement("th");
      th.innerText = div;
      tr.appendChild(th);
    });
    thead.appendChild(tr);
  }
  const tbody = document.getElementById("monthlySummaryBody");
  if (!tbody) {
    return;
  }
  tbody.innerHTML = "";

  // Sort logic
  const sortedSummary = [...aggregatedSummary].sort((a, b) => {
    if (a.staff === "TOTAL") return 1;
    if (b.staff === "TOTAL") return -1;
    return (b.sales || 0) - (a.sales || 0);
  });

  sortedSummary.forEach((row) => {
    const isTotal = row.staff === "TOTAL";
    const tr = document.createElement("tr");
    if (isTotal) {
      tr.className = "total-row";
    }
    let staticColumns = [];
    staticColumns.push({ key: "staff", value: row.staff });
    staticColumns.push({
      key: "sales",
      value: `${formatNumber(Math.round(row.sales || 0))}`,
    });
    staticColumns.push({ key: "sm", value: formatNumber(row.sm || 0) });
    staticColumns.push({ key: "qty", value: formatNumber(row.qty || 0) });
    staticColumns.push({
      key: "upt",
      value: ((row.qty || 0) / (row.sm || 1)).toFixed(2).replace(".", ","),
    });
    staticColumns.push({
      key: "atv",
      value: `${formatNumber(Math.round((row.sales || 0) / (row.sm || 1)))}`,
    });
    staticColumns.push({
      key: "aur",
      value: `${formatNumber(Math.round((row.sales || 0) / (row.qty || 1)))}`,
    });

    staticColumns.forEach((col) => {
      const td = document.createElement("td");
      td.innerText = col.value;
      tr.appendChild(td);
    });
    activeDivisions.forEach((div) => {
      const td = document.createElement("td");
      td.innerText = formatNumber(row.categories?.[div] || 0);
      tr.appendChild(td);
    });
    tbody.appendChild(tr);
  });
}

// =====================================================
// BUILD PRINT MONTHLY SUMMARY
// =====================================================
function buildPrintMonthlySummary(summary, divisions) {
  if (!Array.isArray(summary)) return "";
  const activeDivisions = getActiveDivisions(summary, divisions);

  let headers = [];
  headers.push(
    "STAFF",
    "SALES",
    "SM",
    "QTY",
    "UPT",
    "ATV",
    "AUR",
    ...activeDivisions,
  );
  
  // Create an aggregated summary (group by staff)
  const aggregatedMap = new Map();
  summary.forEach(row => {
      const staff = row.staff || 'UNKNOWN';
      if (!aggregatedMap.has(staff)) {
          aggregatedMap.set(staff, {
              staff: staff,
              sales: 0,
              sm: 0,
              qty: 0,
              categories: {}
          });
      }
      const agg = aggregatedMap.get(staff);
      agg.sales += (row.sales || 0);
      agg.sm += (row.sm || 0);
      agg.qty += (row.qty || 0);
      
      if (row.categories) {
          activeDivisions.forEach(div => {
              if (row.categories[div]) {
                  agg.categories[div] = (agg.categories[div] || 0) + row.categories[div];
              }
          });
      }
  });

  const aggregatedSummary = Array.from(aggregatedMap.values());

  const sortedSummary = [...aggregatedSummary].sort((a, b) => {
    if (a.staff === "TOTAL") return 1;
    if (b.staff === "TOTAL") return -1;
    return (b.sales || 0) - (a.sales || 0);
  });

  const rowsHTML = sortedSummary
    .map((row) => {
      const isTotal = row.staff === "TOTAL";
      const cols = [];
      cols.push(
        escapePrintHTML(row.staff),
        `${formatNumber(Math.round(row.sales || 0))}`,
        formatNumber(row.sm || 0),
        formatNumber(row.qty || 0),
        ((row.qty || 0) / (row.sm || 1)).toFixed(2).replace(".", ","),
        `${formatNumber(Math.round((row.sales || 0) / (row.sm || 1)))}`,
        `${formatNumber(Math.round((row.sales || 0) / (row.qty || 1)))}`,
      );
      activeDivisions.forEach((div) => {
        cols.push(formatNumber(row.categories?.[div] || 0));
      });
      return `
            <tr class="${isTotal ? "total-row" : ""}">
                ${cols.map((c) => `<td>${c}</td>`).join("")}
            </tr>
        `;
    })
    .join("");
  return `
        <table class="print-performance-table">
            <thead>
                <tr>
                    ${headers.map((h) => `<th>${escapePrintHTML(h)}</th>`).join("")}
                </tr>
            </thead>
            <tbody>
                ${rowsHTML}
            </tbody>
        </table>
    `;
}

// =====================================================
// EXPORT EXCEL
// =====================================================
async function exportStaffPerformanceReportExcel() {
  if (!Array.isArray(window.summaryData) || window.summaryData.length === 0) {
    alert("PROCESS DATA TERLEBIH DAHULU SEBELUM EXPORT EXCEL.");
    return;
  }

  // Ensure print DOM is built
  buildStaffPerformancePrintReport();

  const periodLabel = getPerformanceFilterLabel(
    getActivePerformanceDateFilter(),
  );
  const generatedAt = new Date().toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  let html = `
    <html xmlns:o="urn:schemas-microsoft-com:office:office" xmlns:x="urn:schemas-microsoft-com:office:excel" xmlns="http://www.w3.org/TR/REC-html40">
    <head>
    <!--[if gte mso 9]><xml><x:ExcelWorkbook><x:ExcelWorksheets><x:ExcelWorksheet><x:Name>Print Report</x:Name><x:WorksheetOptions><x:DisplayGridlines/></x:WorksheetOptions></x:ExcelWorksheet></x:ExcelWorksheets></x:ExcelWorkbook></xml><![endif]-->
    <style>
        .title { font-size: 20px; font-weight: bold; background-color: #00ffff; }
        .subtitle { font-size: 16px; font-weight: bold; }
        .meta { font-style: italic; }
        .th-bg { background-color: #f0f0f0; font-weight: bold; border: 1pt solid #000; text-align: center; }
        .td-border { border: 1pt solid #000; }
        .rank-title { font-weight: bold; background-color: #ffeb3b; border: 1pt solid #000; text-align: center; }
        table { border-collapse: collapse; font-family: sans-serif; }
    </style>
    </head>
    <body>
    <table>
        <tr><td colspan="5" class="title">KANGODING.ORG - SMS AUTO SALES STAFF</td></tr>
        <tr><td colspan="5" class="subtitle">SALES STAFF PERFORMANCE REPORT</td></tr>
        <tr><td colspan="2" class="meta">PERIOD:</td><td colspan="3" class="meta">${periodLabel}</td></tr>
        <tr><td colspan="2" class="meta">GENERATED:</td><td colspan="3" class="meta">${generatedAt}</td></tr>
        <tr></tr>
    `;

  // 2. Monthly Summary
  html += `<tr><td colspan="5" class="title">MONTHLY SUMMARY</td></tr>`;
  const monthlyTable = document.querySelector(".print-monthly-summary-table");
  if (monthlyTable) {
    let headersHTML = "";
    monthlyTable.querySelectorAll("thead th").forEach((th) => {
      headersHTML += `<th class="th-bg">${th.innerText}</th>`;
    });
    html += `<tr>${headersHTML}</tr>`;

    monthlyTable.querySelectorAll("tbody tr").forEach((tr) => {
      let rowHTML = "";
      tr.querySelectorAll("td").forEach((td) => {
        rowHTML += `<td class="td-border">${td.innerText}</td>`;
      });
      html += `<tr>${rowHTML}</tr>`;
    });
  }
  html += `<tr></tr>`;

  // 3. Performance Table
  html += `<tr><td colspan="5" class="title">SALES STAFF PERFORMANCE</td></tr>`;
  const perfTable = document.querySelector(".print-performance-table");
  if (perfTable) {
    let headersHTML = "";
    perfTable.querySelectorAll("thead th").forEach((th) => {
      headersHTML += `<th class="th-bg">${th.innerText}</th>`;
    });
    html += `<tr>${headersHTML}</tr>`;

    perfTable.querySelectorAll("tbody tr").forEach((tr) => {
      let rowHTML = "";
      tr.querySelectorAll("td").forEach((td) => {
        rowHTML += `<td class="td-border">${td.innerText}</td>`;
      });
      html += `<tr>${rowHTML}</tr>`;
    });
  }
  html += `<tr></tr>`;

  // 4. Ranking Cards
  html += `<tr><td colspan="5" class="title">KPI & PRODUCT DIVISION RANKING</td></tr>`;
  const rankingCards = document.querySelectorAll(".print-ranking-card");
  let rankingGrid = [];
  let currentCardIndex = 0;

  rankingCards.forEach((card) => {
    let title = card.querySelector("h3")
      ? card.querySelector("h3").innerText
      : "";
    let items = card.querySelectorAll(".print-ranking-item");
    let colOffset = (currentCardIndex % 3) * 4;
    let rowOffset = Math.floor(currentCardIndex / 3) * 5;

    for (let r = 0; r < 5; r++) {
      if (!rankingGrid[rowOffset + r]) rankingGrid[rowOffset + r] = [];
    }

    rankingGrid[rowOffset][colOffset] = { text: title, isTitle: true };

    items.forEach((item, index) => {
      let spans = item.querySelectorAll("span, strong");
      let rank = spans[0] ? spans[0].innerText : "-";
      let name = spans[1] ? spans[1].innerText : "-";
      let val = spans[2] ? spans[2].innerText : "-";

      rankingGrid[rowOffset + 1 + index][colOffset] = { text: rank };
      rankingGrid[rowOffset + 1 + index][colOffset + 1] = { text: name };
      rankingGrid[rowOffset + 1 + index][colOffset + 2] = { text: val };
    });
    currentCardIndex++;
  });

  rankingGrid.forEach((row) => {
    html += `<tr>`;
    for (let i = 0; i < row.length; i++) {
      let cell = row[i];
      if (!cell) {
        html += `<td></td>`;
      } else {
        if (cell.isTitle) {
          html += `<td colspan="3" class="rank-title">${cell.text}</td>`;
          i += 2; // skip next 2 empty cells covered by colspan
        } else {
          html += `<td class="td-border">${cell.text}</td>`;
        }
      }
    }
    html += `</tr>`;
  });

  html += `</table></body></html>`;
  html += `</table></body></html>`;

  await saveFile(html, "Sales_Staff_Performance_Report.xls");
}

async function saveFile(html, filename) {
  const blob = new Blob([html], {
    type: "application/vnd.ms-excel;charset=utf-8",
  });
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




let chartSales = null, chartQty = null, chartUPT = null, chartSM = null;

function updateStaffChart(summary) {
    if (!summary || summary.length === 0) return;
    
    const aggregated = {};
    summary.forEach(row => {
        if (row.staff === 'TOTAL') return;
        const name = typeof displayStaffName === 'function' ? displayStaffName(row.staff) : row.staff;
        if (!aggregated[name]) {
            aggregated[name] = { staff: name, sales: 0, qty: 0, sm: 0 };
        }
        aggregated[name].sales += (row.sales || 0);
        aggregated[name].qty += (row.qty || 0);
        aggregated[name].sm += (row.sm || 0);
    });

    const chartData = Object.values(aggregated).filter(r => r.sales > 0).sort((a, b) => b.sales - a.sales);
    if (chartData.length === 0) return;
    
    const labels = chartData.map(r => r.staff);
    const salesData = chartData.map(r => r.sales);
    const qtyData = chartData.map(r => r.qty);
    const smData = chartData.map(r => r.sm);
    const aurData = chartData.map(r => r.qty > 0 ? r.sales / r.qty : 0);
    // Use manual calculation for aggregated UPT and RPT
    const uptData = chartData.map(r => r.sm > 0 ? r.qty / r.sm : 0);
    const rptData = chartData.map(r => r.sm > 0 ? r.sales / r.sm : 0);
    
    const colors = [
        '#ef4444', '#f97316', '#f59e0b', '#84cc16', '#22c55e', '#10b981', '#14b8a6', '#06b6d4', 
        '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef', '#ec4899', '#f43f5e',
        '#7f1d1d', '#7c2d12', '#78350f', '#3f6212', '#14532d', '#064e3b', '#134e4a', '#164e63',
        '#0c4a6e', '#1e3a8a', '#312e81', '#4c1d95', '#581c87', '#701a75', '#831843', '#881337'
    ];
    const bgColors = labels.map((_, i) => colors[i % colors.length]);

    const createPie = (id, label, data, instance) => {
        const ctx = document.getElementById(id);
        if (!ctx) return instance;
        if (instance) instance.destroy();
        
        return new Chart(ctx, {
            type: 'pie',
            plugins: [ChartDataLabels],
            data: {
                labels: labels,
                datasets: [{
                    label: label,
                    data: data,
                    backgroundColor: bgColors,
                    borderWidth: 1,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true, maintainAspectRatio: false,
                plugins: {
                    datalabels: {
                        color: '#fff',
                        font: { weight: 'bold', size: 10, family: 'monospace' },
                        textAlign: 'center',
                        formatter: function(value, context) {
                            const dataset = context.chart.data.datasets[0];
                            const total = dataset.data.reduce((acc, current) => acc + (current || 0), 0);
                            if (total === 0 || value === 0) return '';
                            const percentage = Math.round((value / total) * 100);
                            
                            let formattedVal = value;
                            if (label.includes('SALES') || label.includes('RPT') || label.includes('AUR')) {
                                formattedVal = 'Rp' + Math.round(value / 1000).toLocaleString('en-US') + 'k';
                            } else if (label.includes('UPT')) {
                                formattedVal = value.toFixed(2);
                            } else {
                                formattedVal = value.toLocaleString('en-US');
                            }
                            
                            return percentage >= 2 ? [formattedVal, percentage + '%'] : '';
                        }
                    },
                    legend: { position: 'bottom', labels: { font: { family: 'monospace', size: 10 } } },
                    title: { display: true, text: label, font: { family: 'monospace', size: 14, weight: 'bold' } },
                    tooltip: {
                        callbacks: {
                            label: function(context) {
                                let val = context.parsed;
                                const dataset = context.chart.data.datasets[0];
                                const total = dataset.data.reduce((acc, current) => acc + (current || 0), 0);
                                const percentage = total > 0 ? ((val / total) * 100).toFixed(1) + '%' : '0%';
                                
                                if (label.includes('SALES') || label.includes('RPT') || label.includes('AUR')) val = 'Rp ' + Math.round(val).toLocaleString('en-US');
                                else if (label.includes('UPT')) val = val.toFixed(2);
                                else val = val.toLocaleString('en-US');
                                
                                return ' ' + context.label + ': ' + val + ' (' + percentage + ')';
                            }
                        }
                    }
                }
            }
        });
    };

    chartSales = createPie('staffChartSales', 'SALES CONTRIBUTION', salesData, chartSales);
    chartQty   = createPie('staffChartQty', 'AUR (AVERAGE UNIT RETAIL)', aurData, chartQty);
    chartUPT   = createPie('staffChartUPT', 'UPT (UNITS PER TRANSACTION)', uptData, chartUPT);
    chartSM    = createPie('staffChartSM', 'RPT (RUPIAH PER TRANSACTION)', rptData, chartSM);
}

document.addEventListener('DOMContentLoaded', () => {
    const btn = document.getElementById('downloadStaffChartBtn');
    if (btn) {
        btn.addEventListener('click', () => {
            const container = document.getElementById('chartExportContainer');
            if (!container) return;
            
            const canvases = container.querySelectorAll('canvas');
            if (canvases.length === 0) return;
            
            const destCtx = document.createElement('canvas');
            destCtx.width = 1200; 
            destCtx.height = 1200;
            const ctx2 = destCtx.getContext('2d');
            
            ctx2.fillStyle = '#FFFFFF'; 
            ctx2.fillRect(0, 0, destCtx.width, destCtx.height);
            
            ctx2.fillStyle = '#111111';
            ctx2.font = 'bold 32px monospace';
            ctx2.textAlign = 'center';
            ctx2.fillText('STAFF PERFORMANCE', 600, 60);
            
            // Get current selected period from DOM
            let periodText = '';
            const startDateEl = document.getElementById('startDate');
            const endDateEl = document.getElementById('endDate');
            if (startDateEl && endDateEl && startDateEl.value && endDateEl.value) {
                periodText = `Periode: ${startDateEl.value} s/d ${endDateEl.value}`;
            } else {
                periodText = `Periode: All Data`;
            }
            ctx2.fillStyle = '#555555';
            ctx2.font = 'bold 16px monospace';
            ctx2.fillText(periodText, 600, 90);
            
            const positions = [
                {x: 50, y: 100}, {x: 650, y: 100},
                {x: 50, y: 650}, {x: 650, y: 650}
            ];
            
            canvases.forEach((c, i) => {
                if (i < 4) {
                    ctx2.drawImage(c, positions[i].x, positions[i].y, 500, 500);
                }
            });
            
            const link = document.createElement('a');
            link.download = 'staff_performance_pies.png';
            link.href = destCtx.toDataURL('image/png');
            link.click();
        });
    }
});
