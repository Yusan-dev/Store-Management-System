let dashboardData = [];

let active = {
  brand: new Set(),
  category: new Set(),
  status: new Set(),
};

function saveData(data) {
  dashboardData = Array.isArray(data) ? data : [];
  buildAll();
  applyFilter();
}

function buildCheckbox(id, values) {
  const root = document.getElementById(id);
  if (!root) return;
  root.innerHTML = "";
  active[id].clear();

  const clean = [...new Set(values.filter(Boolean))].sort();

  clean.forEach((v) => {
    active[id].add(v);
    root.insertAdjacentHTML(
      "beforeend",
      `
      <label style="display: block; margin-bottom: 8px;">
        <input checked type="checkbox" value="${v}">
        <span style="font-weight: bold; font-family: monospace;">${v}</span>
      </label>
      `
    );
  });

  root.querySelectorAll("input").forEach((box) => {
    box.onchange = applyFilter;
  });
}

function buildAll() {
  buildCheckbox("brand", dashboardData.map((x) => x.brand));
  buildCheckbox("category", dashboardData.map((x) => x.category));
  buildCheckbox("status", dashboardData.map((x) => x.status));
}

function syncFilter() {
  active.brand = new Set([...document.querySelectorAll("#brand input:checked")].map((x) => x.value));
  active.category = new Set([...document.querySelectorAll("#category input:checked")].map((x) => x.value));
  active.status = new Set([...document.querySelectorAll("#status input:checked")].map((x) => x.value));
}

function applyFilter() {
  if (!dashboardData.length) return;
  syncFilter();

  const search = (document.getElementById("search")?.value || "").toUpperCase();
  const sortVal = document.getElementById("sortSelect")?.value || "";

  let filtered = dashboardData.filter((x) => {
    if (!active.brand.has(x.brand)) return false;
    if (!active.category.has(x.category)) return false;
    if (!active.status.has(x.status)) return false;

    let match = true;
    if (search) {
      match = (x.artikel || "").toUpperCase().includes(search) ||
              (x.brand || "").toUpperCase().includes(search) ||
              (x.category || "").toUpperCase().includes(search) ||
              (x.desc || "").toUpperCase().includes(search);
    }
    return match;
  });

  // Sorting
  if (sortVal) {
    const [key, dir] = sortVal.split("-"); // e.g. "qty-desc"
    filtered.sort((a, b) => {
      let valA = a[key];
      let valB = b[key];
      
      if (typeof valA === "string") valA = valA.toUpperCase();
      if (typeof valB === "string") valB = valB.toUpperCase();
      
      if (valA < valB) return dir === "asc" ? -1 : 1;
      if (valA > valB) return dir === "asc" ? 1 : -1;
      return 0;
    });
  }

  window.filteredData = filtered;
  drawTable(filtered);
  updateSummary(filtered);
}

// Attach event listeners
document.getElementById("search")?.addEventListener("input", applyFilter);
document.getElementById("sortSelect")?.addEventListener("change", applyFilter);
