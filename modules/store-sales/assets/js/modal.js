const modal = document.getElementById("staffModal");

const modalBody = document.getElementById("modalBody");

const modalTitle = document.getElementById("modalTitle");

const closeModalBtn = document.getElementById("closeModal");
if (closeModalBtn) {
  closeModalBtn.onclick = () => {
    if (modal) modal.classList.remove("show");
  };
}

window.onclick = (e) => {
  if (e.target === modal) {
    modal.classList.remove("show");
  }
};

// =====================================================
// STAFF DETAIL MODAL
// SUPPORT ACTIVE PERFORMANCE DATE FILTER
// =====================================================

function openStaffDetail(staff) {
  // =============================================
  // GET ACTIVE DATE FILTER FROM SUMMARY CONTROLLER
  // =============================================

  const activeFilter =
    typeof getActivePerformanceDateFilter === "function"
      ? getActivePerformanceDateFilter()
      : "";

  // =============================================
  // GET FILTERED STAFF TRANSACTIONS
  // =============================================

  const data = GTEngine.getStaffTransactions(
    staff,

    activeFilter,
  );

  // =============================================
  // GET FILTERED STAFF SUMMARY
  // =============================================

  const staffSummary = GTEngine.getStaffSummary(
    staff,

    activeFilter,
  );

  // =============================================
  // MODAL TITLE
  // =============================================

  modalTitle.innerText = staff;

  // =============================================
  // EMPTY DATA
  // =============================================

  if (data.length === 0) {
    modalBody.innerHTML = "<p>No data pada periode yang dipilih.</p>";

    modal.classList.add("show");

    return;
  }

  // =============================================
  // FILTER LABEL
  // =============================================

  let filterLabel = "ALL PERIOD";

  if (typeof getPerformanceFilterLabel === "function") {
    filterLabel = getPerformanceFilterLabel(activeFilter);
  }

  // =============================================
  // STAFF KPI
  // =============================================

  const sales = Number(staffSummary?.sales || 0);

  const sm = Number(staffSummary?.sm || 0);

  const qty = Number(staffSummary?.qty || 0);

  const upt = sm > 0 ? qty / sm : 0;

  const atv = sm > 0 ? sales / sm : 0;

  const aur = qty > 0 ? sales / qty : 0;

  // =============================================
  // BUILD HTML
  // =============================================

  let html = "";

  // =============================================
  // PERIOD INFORMATION
  // =============================================

  html += `

        <div class="staff-modal-period">

            <span>
                PERFORMANCE PERIOD
            </span>

            <strong>
                ${filterLabel}
            </strong>

        </div>

    `;

  // =============================================
  // STAFF KPI SUMMARY
  // =============================================

  html += `

        <div class="staff-modal-kpi-grid">


            <div class="staff-modal-kpi-card">

                <span>SALES</span>

                <strong>

                    Rp ${Number(sales).toLocaleString("id-ID")}

                </strong>

            </div>


            <div class="staff-modal-kpi-card">

                <span>SM</span>

                <strong>

                    ${sm}

                </strong>

            </div>


            <div class="staff-modal-kpi-card">

                <span>QTY</span>

                <strong>

                    ${qty}

                </strong>

            </div>


            <div class="staff-modal-kpi-card">

                <span>UPT</span>

                <strong>

                    ${Number(upt).toLocaleString(
                      "id-ID",

                      {
                        minimumFractionDigits: 2,

                        maximumFractionDigits: 2,
                      },
                    )}

                </strong>

            </div>


            <div class="staff-modal-kpi-card">

                <span>ATV</span>

                <strong>

                    Rp ${Math.round(atv)

                      .toLocaleString("id-ID")}

                </strong>

            </div>


            <div class="staff-modal-kpi-card">

                <span>AUR</span>

                <strong>

                    Rp ${Math.round(aur)

                      .toLocaleString("id-ID")}

                </strong>

            </div>


        </div>

    `;

  // =============================================
  // TRANSACTION TABLE
  // =============================================

  html += `

        <div class="table-wrap">

            <table class="validation-table">

                <thead>

                    <tr>

                        <th>DATE</th>

                        <th>INVOICE</th>

                        <th>ARTICLE</th>

                        <th>QTY</th>

                        <th>SALES</th>

                    </tr>

                </thead>


                <tbody>

    `;

  data.forEach((t) => {
    html += `

            <tr>

                <td>
                    ${t.date || "-"}
                </td>

                <td>
                    ${t.invoice}
                </td>

                <td>
                    ${t.article}
                </td>

                <td>
                    ${t.qty}
                </td>

                <td>

                    Rp ${Number(t.sales).toLocaleString("id-ID")}

                </td>

            </tr>

        `;
  });

  html += `

                </tbody>

            </table>

        </div>

    `;

  modalBody.innerHTML = html;

  modal.classList.add("show");
}

function openStaffDetail(staff) {
  const data = GTEngine.getStaffTransactions(staff);

  modalTitle.innerText = staff;

  if (data.length === 0) {
    modalBody.innerHTML = "<p>No data.</p>";

    modal.classList.add("show");

    return;
  }

  let html = "";

  html += `

    <table class="validation-table">

    <thead>

    <tr>

    <th>Invoice</th>

    <th>Article</th>

    <th>Qty</th>

    <th>Sales</th>

    </tr>

    </thead>

    <tbody>

    `;

  data.forEach((t) => {
    html += `

        <tr>

        <td>${t.invoice}</td>

        <td>${t.article}</td>

        <td>${t.qty}</td>

        <td>${Number(t.sales).toLocaleString("id-ID")}</td>

        </tr>

        `;
  });

  html += `

    </tbody>

    </table>

    `;

  modalBody.innerHTML = html;

  modal.classList.add("show");
}

