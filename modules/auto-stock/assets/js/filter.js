let dashboardData = [];

let active = {
  brand: new Set(),

  category: new Set(),

  gender: new Set(),

  status: new Set(),
};

function saveData(data) {
  dashboardData = Array.isArray(data) ? data : [];

  buildAll();

  applyFilter();
}

function buildCheckbox(
  id,

  values,
) {
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

<label>

<input

checked

type="checkbox"

value="${v}">

<span>

${v}

</span>

</label>

`,
    );
  });

  root

    .querySelectorAll("input")

    .forEach((box) => {
      box.onchange = applyFilter;
    });
}

function buildAll() {
  buildCheckbox(
    "brand",

    dashboardData.map((x) => x.brand),
  );

  buildCheckbox(
    "category",

    dashboardData.map((x) => x.category),
  );

  buildCheckbox(
    "gender",

    [
      ...dashboardData.map((x) => x.gender),

      "MEN",

      "WOMEN",

      "KIDS",

      "UNISEX",

      "NON-MD",
    ],
  );

  buildCheckbox(
    "status",

    dashboardData.map((x) => x.status),
  );
}

function syncFilter() {
  active.brand = new Set(
    [...document.querySelectorAll("#brand input:checked")].map((x) => x.value),
  );

  active.category = new Set(
    [...document.querySelectorAll("#category input:checked")].map(
      (x) => x.value,
    ),
  );

  active.gender = new Set(
    [...document.querySelectorAll("#gender input:checked")].map((x) => x.value),
  );

  active.status = new Set(
    [...document.querySelectorAll("#status input:checked")].map((x) => x.value),
  );
}

function applyFilter() {
  if (!dashboardData.length) return;

  syncFilter();

  const search = (document.getElementById("search")?.value || "").toUpperCase();

  const exact = Number(document.getElementById("price")?.value || 0);

  const min = Number(document.getElementById("minPrice")?.value || 0);

  const max = Number(document.getElementById("maxPrice")?.value || 999999999);

  let rows = dashboardData.filter((r) => {
    if (
      search &&
      !JSON.stringify(r)

        .toUpperCase()

        .includes(search)
    )
      return false;

    const p = Number(r.price) || 0;

    if (exact > 0) {
      if (p !== exact) return false;
    } else {
      if (p < min) return false;

      if (p > max) return false;
    }

    if (active.brand.size && !active.brand.has(r.brand)) return false;

    if (active.category.size && !active.category.has(r.category)) return false;

    if (active.gender.size && !active.gender.has(r.gender)) return false;

    if (active.status.size && !active.status.has(r.status)) return false;

    return true;
  });

  if (typeof getSortedRows === "function") {
    rows = getSortedRows(rows);
  }

  window.filteredData = rows;

  drawTable(rows);

  updateSummary(rows);
}

window.addEventListener(
  "load",

  () => {
    ["search", "price", "minPrice", "maxPrice"].forEach((id) => {
      const el = document.getElementById(id);

      if (el) {
        el.oninput = applyFilter;
      }
    });
  },
);
