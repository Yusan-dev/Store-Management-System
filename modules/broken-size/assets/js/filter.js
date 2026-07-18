/* ========================================
   SMS BROKEN SIZE - FILTER.JS
   Filter system for broken size table
   ======================================== */

let bsDashboardData = [];
let bsActive = {
  bsBrand: new Set(),
  bsCategory: new Set(),
  bsDiscount: new Set(),
  bsStatus: new Set(),
};

function bsSaveData(data) {
  bsDashboardData = Array.isArray(data) ? data : [];
  bsBuildAll();
  bsApplyFilter();
}

function bsBuildCheckbox(id, values) {
  const root = document.getElementById(id);
  if (!root) return;
  root.innerHTML = "";
  bsActive[id] = bsActive[id] || new Set();
  bsActive[id].clear();

  const clean = [...new Set(values.filter(Boolean))].sort();

  clean.forEach((v) => {
    bsActive[id].add(v);
    root.insertAdjacentHTML(
      "beforeend",
      `
      <label>
        <input checked type="checkbox" value="${v}">
        <span>${v}</span>
      </label>
    `,
    );
  });

  root.querySelectorAll("input").forEach((box) => {
    box.onchange = bsApplyFilter;
  });
}

function bsBuildAll() {
  bsBuildCheckbox(
    "bsBrand",
    bsDashboardData.map((x) => x.brand),
  );
  bsBuildCheckbox(
    "bsCategory",
    bsDashboardData.map((x) => x.category),
  );
  bsBuildCheckbox(
    "bsDiscount",
    bsDashboardData.map((x) => x.discount),
  );
  bsBuildCheckbox(
    "bsStatus",
    bsDashboardData.map((x) => x.status),
  );
}

function bsSyncFilter() {
  const getChecked = (id) =>
    new Set(
      [...document.querySelectorAll(`#${id} input:checked`)].map(
        (x) => x.value,
      ),
    );
  bsActive.bsBrand = getChecked("bsBrand");
  bsActive.bsCategory = getChecked("bsCategory");
  bsActive.bsDiscount = getChecked("bsDiscount");
  bsActive.bsStatus = getChecked("bsStatus");
}

function bsApplyFilter() {
  if (!bsDashboardData.length) return;
  bsSyncFilter();

  const search = (
    document.getElementById("bsSearch")?.value || ""
  ).toUpperCase();

  let rows = bsDashboardData.filter((r) => {
    if (search && !JSON.stringify(r).toUpperCase().includes(search))
      return false;
    if (bsActive.bsBrand.size && !bsActive.bsBrand.has(r.brand)) return false;
    if (bsActive.bsCategory.size && !bsActive.bsCategory.has(r.category))
      return false;
    if (bsActive.bsDiscount.size && !bsActive.bsDiscount.has(r.discount))
      return false;
    if (bsActive.bsStatus.size && !bsActive.bsStatus.has(r.status))
      return false;
    return true;
  });

  if (typeof getBsSortedRows === "function") {
    rows = getBsSortedRows(rows);
  }

  bsFilteredData = rows;
  window.bsFilteredData = rows;
  drawBsTable(rows);
  updateBsSummary(rows);
}

window.addEventListener("load", () => {
  const searchEl = document.getElementById("bsSearch");
  if (searchEl) {
    searchEl.oninput = bsApplyFilter;
  }
});

