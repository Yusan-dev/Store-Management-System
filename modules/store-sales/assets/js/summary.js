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

function getTop3(data, getValue) {
  return [...data]

    .filter((row) => {
      const value = Number(getValue(row) || 0);

      return value > 0;
    })

    .sort((a, b) => {
      return Number(getValue(b) || 0) - Number(getValue(a) || 0);
    })

    .slice(0, 3);
}

function renderTop3Ranking(ranking, getValue, formatter) {
  if (!Array.isArray(ranking) || ranking.length === 0) {
    return "-";
  }

  const medals = ["🥇", "🥈", "🥉"];

  return ranking

    .map((row, index) => {
      const value = getValue(row);

      return `

                <div class="rank-item">

                    <span class="rank-position">

                        ${medals[index]}

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

  if (window.storeData && window.storeData.categories) {
    window.storeData.categories.forEach(d => divisionSet.add(d));
  }

  if (Array.isArray(window.divisionData) && window.divisionData.length > 0) {
    window.divisionData.forEach((d) => divisionSet.add(d));
  }

  (summary || []).forEach((row) => {
    Object.keys(row.categories || {}).forEach((division) => {
      divisionSet.add(division);
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

function applyPerformanceDateFilter(filter = "") {
  if (!Array.isArray(window.summaryData) || window.summaryData.length === 0) {
    alert("PROCESS SOURCE FILE TERLEBIH DAHULU.");

    return;
  }

  activePerformanceDateFilter = filter;

  const summary = GTEngine.generateSummary(activePerformanceDateFilter);

  const divisions = getActiveDivisions(
    summary,

    [],
  );

  window.summaryData = summary;

  window.divisionData = divisions;

  drawTable(
    summary,

    divisions,
  );

  updateSummary(
    summary,

    divisions,
  );

  updatePerformanceFilterUI();

  console.log(
    "PERFORMANCE FILTER APPLIED:",

    {
      filter: GTEngine.normalizeDateFilter(activePerformanceDateFilter),

      summary,

      divisions,
    },
  );
}

// =====================================================
// UPDATE PERFORMANCE FILTER UI
// =====================================================

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

  fromInput.innerHTML = `

        <option value="">
            SELECT FROM DATE
        </option>

    `;

  toInput.innerHTML = `

        <option value="">
            SELECT TO DATE
        </option>

    `;

  if (!Array.isArray(availableDates) || availableDates.length === 0) {
    fromInput.disabled = true;

    toInput.disabled = true;

    return;
  }

  availableDates.forEach((date) => {
    const inputDate = engineDateToInputDate(date);

    if (!inputDate) {
      return;
    }

    const fromOption = document.createElement("option");

    fromOption.value = inputDate;

    fromOption.innerText = date;

    fromInput.appendChild(fromOption);

    const toOption = document.createElement("option");

    toOption.value = inputDate;

    toOption.innerText = date;

    toInput.appendChild(toOption);
  });

  fromInput.disabled = false;

  toInput.disabled = false;

  console.log(
    "PERFORMANCE AVAILABLE DATES:",

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
  if (!Array.isArray(summary) || summary.length === 0) {
    return;
  }

  const total = summary.find((row) => row.staff === "TOTAL");

  if (!total) {
    return;
  }

  // O2O bukan staff store

  const staffOnly = summary.filter(
    (row) =>
      row.staff !== "TOTAL" && row.staff !== "UNKNOWN" && row.staff !== "O2O",
  );
  document.getElementById("staffCount").innerText = staffOnly.length;

  document.getElementById("salesTotal").innerText = formatNumber(total.sales);

  document.getElementById("smTotal").innerText = total.sm;

  document.getElementById("qtyTotal").innerText = total.qty;

  const avgSales =
    staffOnly.length > 0 ? Math.round(total.sales / staffOnly.length) : 0;

  document.getElementById("avgSales").innerText = formatNumber(avgSales);

  const activeDivisions = getActiveDivisions(
    summary,

    divisions,
  );

  updateRanking(
    summary,

    activeDivisions,
  );

  updateValidation();
}

// =====================================================
// DRAW TABLE HEADER
// =====================================================

function drawTableHeader(divisions) {
  const thead = document.getElementById("tableHead");

  if (!thead) {
    console.error("tableHead tidak ditemukan.");

    return;
  }

  thead.innerHTML = "";

  const tr = document.createElement("tr");

  // ==========================
  // STATIC COLUMNS
  // ==========================

  const staticColumns = [
    {
      key: "staff",
      label: "STAFF",
    },

    {
      key: "sales",
      label: "SALES",
    },

    {
      key: "sm",
      label: "SM",
    },

    {
      key: "qty",
      label: "QTY",
    },

    {
      key: "upt",
      label: "UPT",
    },

    {
      key: "atv",
      label: "ATV",
    },

    {
      key: "aur",
      label: "AUR",
    },
  ];

  staticColumns.forEach((column) => {
    const th = document.createElement("th");

    th.innerText = column.label;

    th.dataset.sortKey = column.key;

    th.style.cursor = "pointer";

    th.addEventListener(
      "click",

      () => {
        sortTable(column.key);
      },
    );

    tr.appendChild(th);
  });

  // ==========================
  // DYNAMIC DIVISIONS
  // ==========================

  divisions.forEach((division) => {
    const th = document.createElement("th");

    th.innerText = division;

    th.dataset.sortKey = division;

    th.style.cursor = "pointer";

    th.addEventListener(
      "click",

      () => {
        sortTable(division);
      },
    );

    tr.appendChild(th);
  });

  thead.appendChild(tr);
}

// =====================================================
// DRAW TABLE
// =====================================================

function drawTable(summary, divisions) {
  if (!Array.isArray(summary)) {
    return;
  }

  const activeDivisions = getActiveDivisions(
    summary,

    divisions,
  );

  drawTableHeader(activeDivisions);

  const tbody = document.getElementById("tableBody");

  if (!tbody) {
    console.error("tableBody tidak ditemukan.");

    return;
  }

  tbody.innerHTML = "";

  summary.forEach((row) => {
    const tr = document.createElement("tr");

    if (row.staff === "TOTAL") {
      tr.classList.add("total-row");
    }

    // ==========================
    // STAFF
    // ==========================

    const staffCell = document.createElement("td");

    const staffName = displayStaffName(row.staff);

    staffCell.innerText = staffName;

    staffCell.style.fontWeight = "700";

    if (
      row.staff !== "TOTAL" &&
      row.staff !== "UNKNOWN" &&
      row.staff !== "O2O"
    ) {
      staffCell.style.cursor = "pointer";

      staffCell.style.color = "#2563eb";

      staffCell.onclick = () => {
        if (typeof openStaffDetail === "function") {
          openStaffDetail(staffName);
        }
      };
    }

    tr.appendChild(staffCell);

    // ==========================
    // SALES
    // ==========================

    const salesCell = document.createElement("td");

    salesCell.innerText = money(row.sales);

    tr.appendChild(salesCell);

    // ==========================
    // SM
    // ==========================

    const smCell = document.createElement("td");

    smCell.innerText = row.sm || 0;

    tr.appendChild(smCell);

    // ==========================
    // QTY
    // ==========================

    const qtyCell = document.createElement("td");

    qtyCell.innerText = row.qty || 0;

    tr.appendChild(qtyCell);

    // ==========================
    // UPT
    // ==========================

    const uptCell = document.createElement("td");

    uptCell.innerText = formatDecimal(calculateUPT(row), 2);

    tr.appendChild(uptCell);

    // ==========================
    // ATV
    // ==========================

    const atvCell = document.createElement("td");

    atvCell.innerText = money(Math.round(calculateATV(row)));

    tr.appendChild(atvCell);

    // ==========================
    // AUR
    // ==========================

    const aurCell = document.createElement("td");

    aurCell.innerText = money(Math.round(calculateAUR(row)));

    tr.appendChild(aurCell);

    // ==========================
    // DYNAMIC DIVISIONS
    // ==========================

    activeDivisions.forEach((division) => {
      const td = document.createElement("td");

      td.innerText = row.categories?.[division] || 0;

      tr.appendChild(td);
    });

    tbody.appendChild(tr);
  });
}

// =====================================================
// UNIVERSAL TABLE SORT
// =====================================================

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

function updateRanking(summary, divisions) {
  if (!Array.isArray(summary)) {
    return;
  }

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

  // =================================================
  // TOP 3 SALES
  // =================================================

  const topSalesElement = document.getElementById("topSales");

  if (topSalesElement) {
    const ranking = getTop3(
      data,

      (row) => Number(row.sales || 0),
    );

    topSalesElement.classList.add("rank-list");

    topSalesElement.innerHTML = renderTop3Ranking(
      ranking,

      (row) => row.sales,

      (value) => `${money(value)}`,
    );
  }

  // =================================================
  // TOP 3 QTY
  // =================================================

  const topQtyElement = document.getElementById("topQty");

  if (topQtyElement) {
    const ranking = getTop3(
      data,

      (row) => Number(row.qty || 0),
    );

    topQtyElement.classList.add("rank-list");

    topQtyElement.innerHTML = renderTop3Ranking(
      ranking,

      (row) => row.qty,

      (value) => formatNumber(value),
    );
  }

  // =================================================
  // REMOVE ALL DYNAMIC RANKING CARDS
  //
  // SATU CONTROLLER YANG MEMBERSIHKAN CARD
  // AGAR TIDAK DUPLIKASI SAAT PROCESS ULANG
  // =================================================

  const rankingContainer = document.querySelector(".ranking");

  if (rankingContainer) {
    rankingContainer

      .querySelectorAll(".dynamic-kpi-rank, .dynamic-division-rank")

      .forEach((card) => {
        card.remove();
      });
  }

  // =================================================
  // RENDER ORDER
  //
  // TOP SALES
  // TOP QTY
  // TOP UPT
  // TOP ATV
  // TOP AUR
  // PRODUCT DIVISIONS
  // =================================================

  drawKPIRankings(data);

  drawDivisionRankings(data, divisions);
}

// =====================================================
// DRAW KPI RANKINGS
// TOP 3 UPT / ATV / AUR
// =====================================================

function drawKPIRankings(data) {
  const rankingContainer = document.querySelector(".ranking");

  if (!rankingContainer) {
    return;
  }

  const kpiConfig = [
    {
      key: "upt",

      title: "📈 TOP UPT",

      formatter: (value) => formatDecimal(value, 2),
    },

    {
      key: "atv",

      title: "💳 TOP ATV",

      formatter: (value) => `${money(Math.round(value))}`,
    },

    {
      key: "aur",

      title: "🏷️ TOP AUR",

      formatter: (value) => `${money(Math.round(value))}`,
    },
  ];

  kpiConfig.forEach((config) => {
    const ranking = getTop3(
      data,

      (row) => Number(row[config.key] || 0),
    );

    const card = document.createElement("div");

    card.className = "rank-card dynamic-kpi-rank";

    const title = document.createElement("h3");

    title.innerText = config.title;

    const content = document.createElement("div");

    content.className = "rank-list";

    content.innerHTML = renderTop3Ranking(
      ranking,

      (row) => row[config.key],

      config.formatter,
    );

    card.appendChild(title);

    card.appendChild(content);

    rankingContainer.appendChild(card);
  });
}

// =====================================================
// DRAW DYNAMIC DIVISION RANKINGS
// TOP 3 STAFF PER PRODUCT DIVISION
// =====================================================

function drawDivisionRankings(data, divisions) {
  const rankingContainer = document.querySelector(".ranking");

  if (!rankingContainer) {
    return;
  }

  // =================================================
  // HIDE OLD STATIC TOP FOOTWEAR CARD
  // =================================================

  const oldTopFw = document.getElementById("topFw");

  if (oldTopFw) {
    const oldCard = oldTopFw.closest(".rank-card");

    if (oldCard) {
      oldCard.style.display = "none";
    }
  }

  // =================================================
  // SAFE DIVISION ARRAY
  // =================================================

  const activeDivisions = Array.isArray(divisions) ? divisions : [];

  // =================================================
  // CREATE TOP 3 PER DIVISION
  // =================================================

  activeDivisions.forEach((division) => {
    const ranking = getTop3(
      data,

      (row) => Number(row.categories?.[division] || 0),
    );

    const card = document.createElement("div");

    card.className = "rank-card dynamic-division-rank";

    const title = document.createElement("h3");

    title.innerText = `TOP ${division}`;

    const content = document.createElement("div");

    content.className = "rank-list";

    content.innerHTML = renderTop3Ranking(
      ranking,

      (row) => Number(row.categories?.[division] || 0),

      (value) => formatNumber(value),
    );

    card.appendChild(title);

    card.appendChild(content);

    rankingContainer.appendChild(card);
  });
}
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
  const headers = [
    "STAFF",
    "SALES",
    "SM",
    "QTY",
    "UPT",
    "ATV",
    "AUR",

    ...divisions,
  ];

  const rowsHTML = summary
    .map((row) => {
      const isTotal = row.staff === "TOTAL";

      const divisionCells = divisions
        .map(
          (division) => `

                <td>

                    ${escapePrintHTML(row.categories?.[division] || 0)}

                </td>

            `,
        )
        .join("");

      return `

            <tr class="${isTotal ? "total-row" : ""}">

                <td>
                    ${escapePrintHTML(displayStaffName(row.staff))}
                </td>

                <td>
                    ${escapePrintHTML(money(row.sales))}
                </td>

                <td>
                    ${escapePrintHTML(row.sm || 0)}
                </td>

                <td>
                    ${escapePrintHTML(row.qty || 0)}
                </td>

                <td>
                    ${escapePrintHTML(formatDecimal(calculateUPT(row), 2))}
                </td>

                <td>
                    ${escapePrintHTML(money(Math.round(calculateATV(row))))}
                </td>

                <td>
                    ${escapePrintHTML(money(Math.round(calculateAUR(row))))}
                </td>

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

                        <th>
                            ${escapePrintHTML(header)}
                        </th>

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

// =====================================================
// CREATE RANKING CONFIGURATION
// =====================================================

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

                    PERFORMANCE SUMMARY

                </div>


                ${buildPrintSummary(summary)}

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


