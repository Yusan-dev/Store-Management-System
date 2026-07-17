const GTEngine = (() => {
  // =====================================================
  // MASTER DATABASE
  // =====================================================

  const invoiceMap = new Map();

  const articleMap = new Map();

  const staffMap = new Map();
  // ======================================
  // ENGINE V2
  // ======================================
  const invoiceSales = new Map();

  const articleCategory = new Map();

  const transactions = [];

  const msrTransactions = [];

  const sharedInvoiceMap = new Map();
  // =====================================================
  // RESET
  // =====================================================

  function clear() {
    invoiceMap.clear();

    articleMap.clear();

    staffMap.clear();

    invoiceSales.clear();

    articleCategory.clear();

    transactions.length = 0;

    msrTransactions.length = 0;

    sharedInvoiceMap.clear();
  }

  // =====================================================
  // HELPER
  // =====================================================

  function text(value) {
    return String(value ?? "")
      .trim()
      .toUpperCase();
  }

  function number(value) {
    if (value === undefined || value === null) return 0;

    return (
      Number(
        String(value)
          .replace(/,/g, "")

          .replace(/ /g, "")

          .trim(),
      ) || 0
    );
  }
  function normalizeDate(value) {
    if (value === undefined || value === null || value === "") {
      return "";
    }

    // ==========================================
    // EXCEL SERIAL DATE
    // ==========================================

    if (typeof value === "number" && Number.isFinite(value)) {
      const excelEpoch = new Date(Date.UTC(1899, 11, 30));

      const date = new Date(excelEpoch.getTime() + value * 86400000);

      const day = String(date.getUTCDate()).padStart(2, "0");

      const month = String(date.getUTCMonth() + 1).padStart(2, "0");

      const year = date.getUTCFullYear();

      return `${day}-${month}-${year}`;
    }

    // ==========================================
    // STRING DATE
    // ==========================================

    const raw = String(value).trim();

    // DD-MM-YYYY
    // DD/MM/YYYY
    // DD.MM.YYYY

    let match = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);

    if (match) {
      const day = match[1].padStart(2, "0");

      const month = match[2].padStart(2, "0");

      const year = match[3];

      return `${day}-${month}-${year}`;
    }

    // ==========================================
    // JAVASCRIPT PARSEABLE DATE
    // ==========================================

    const parsed = new Date(raw);

    if (!Number.isNaN(parsed.getTime())) {
      const day = String(parsed.getDate()).padStart(2, "0");

      const month = String(parsed.getMonth() + 1).padStart(2, "0");

      const year = parsed.getFullYear();

      return `${day}-${month}-${year}`;
    }

    console.warn(
      "UNRECOGNIZED DATE:",

      value,
    );

    return raw;
  }

  // =====================================================
  // STAFF
  // =====================================================

  function getStaff(id, name) {
    id = text(id);

    name = text(name);

    if (!staffMap.has(id)) {
      staffMap.set(id, {
        id,

        name,
      });
    }

    return staffMap.get(id);
  }

  // =====================================================
  // INVOICE
  // =====================================================

  function getInvoice(invoice) {
    invoice = text(invoice);

    if (!invoiceMap.has(invoice)) {
      invoiceMap.set(invoice, {
        invoice,

        date: "",

        counter: 0,

        sales: 0,

        staff: null,

        isO2O: false,

        isSale: false,

        isReturn: false,

        transactionType: "UNKNOWN",

        items: [],
      });
    }

    return invoiceMap.get(invoice);
  }

  function getCategory(article) {
    article = text(article);

    return articleCategory.get(article) || "";
  }
  function registerSharedInvoice(invoice, staff) {
    invoice = text(invoice);

    const staffName = staff ? staff.name : "UNKNOWN";

    if (!sharedInvoiceMap.has(invoice)) {
      sharedInvoiceMap.set(
        invoice,

        new Set(),
      );
    }

    sharedInvoiceMap

      .get(invoice)

      .add(staffName);
  }

  // =====================================================
  // non md
  // =====================================================

  function isNonMD(article) {
    article = text(article);

    return (
      article.startsWith("ZSP") ||
      article.startsWith("ZZZ") ||
      article.startsWith("NON")
    );
  }

  // =====================================================
  // ARTICLE
  // =====================================================

  function getArticle(article) {
    article = text(article);

    if (!articleMap.has(article)) {
      articleMap.set(article, {
        article,

        category: "",
      });
    }

    return articleMap.get(article);
  }

  // =====================================================
  // PARSER DAILY CASH COLLECTION
  // DATE-AWARE V1
  // =====================================================

  function parseDailyCash(rows) {
    let currentDate = "";

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      if (!row) continue;

      // ============================================
      // DETECT DATE HEADER
      // CONTOH:
      // 01-06-2026
      // ============================================

      const firstCell = String(row[0] ?? "").trim();

      const dateMatch = firstCell.match(/^(\d{2})-(\d{2})-(\d{4})$/);

      if (dateMatch) {
        currentDate = firstCell;

        continue;
      }

      // ============================================
      // COUNTER
      // 1  = STORE
      // 99 = O2O
      // ============================================

      const counter = number(row[0]);

      // ============================================
      // INVOICE
      // ============================================

      const invoice = text(row[1]);

      if (invoice === "") {
        continue;
      }

      // ============================================
      // VALID INVOICE DETECTOR
      //
      // Mencegah:
      // header
      // total
      // text lain
      // masuk invoiceMap
      // ============================================

      if (!/^\d{6,}$/.test(invoice)) {
        continue;
      }

      // ============================================
      // SALES
      // ============================================

      const sales = number(row[2]);

      invoiceSales.set(
        invoice,

        sales,
      );

      // ============================================
      // GET INVOICE OBJECT
      // ============================================

      const inv = getInvoice(invoice);

      inv.date = currentDate;

      inv.counter = counter;

      inv.sales = sales;

      inv.isO2O = counter === 99;

      // ============================================
      // TRANSACTION TYPE DETECTOR
      //
      // 100... = NORMAL SALE
      // 63...  = RETURN
      // ============================================

      inv.isSale = invoice.startsWith("100");

      inv.isReturn = invoice.startsWith("63");

      if (inv.isSale) {
        inv.transactionType = "SALE";
      } else if (inv.isReturn) {
        inv.transactionType = "RETURN";
      } else {
        inv.transactionType = "UNKNOWN";
      }

      // ============================================
      // COUNTER 99 = O2O
      // ============================================

      if (counter === 99) {
        inv.staff = {
          id: "O2O",

          name: "O2O",
        };
      }
    }

    console.log(
      "Daily Cash Loaded:",

      {
        invoices: invoiceMap.size,

        dates: [
          ...new Set(
            [...invoiceMap.values()]

              .map((inv) => inv.date)

              .filter(Boolean),
          ),
        ],
      },
    );
  }
  // =====================================================
  // PARSER SALESPERSON WISE
  // DATE-AWARE V1
  // =====================================================

  function parseSalesPerson(rows) {
    let currentDate = "";

    let currentStaff = null;

    let currentArticle = "";

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      if (!row) continue;

      // ============================================
      // DATE HEADER
      // CONTOH:
      // 01-06-2026
      // ============================================

      const firstCell = String(row[0] ?? "").trim();

      const dateMatch = firstCell.match(/^(\d{2})-(\d{2})-(\d{4})$/);

      if (dateMatch) {
        currentDate = firstCell;

        // PENTING:
        // reset state antar tanggal

        currentStaff = null;

        currentArticle = "";

        continue;
      }

      // ============================================
      // UNIVERSAL STAFF HEADER
      //
      // CONTOH:
      // 23028224 / Alifi Fajar
      // ============================================

      const header = text(row.join(" "));

      const match = header.match(/(\d{8})\s*\/\s*(.+)/);

      if (match) {
        const id = match[1].trim();

        const name = match[2]

          .replace(/TOTAL FOR/i, "")

          .replace(/GRAND TOTAL/i, "")

          .trim();

        currentStaff = getStaff(
          id,

          name,
        );

        currentArticle = "";

        continue;
      }

      // ============================================
      // ARTICLE DETECTOR
      //
      // MASTER SOURCE:
      // articleCategory dari MSR
      // ============================================

      const possibleArticle = text(row[1]);

      const articleCandidate = possibleArticle.split("/")[0].trim();

      if (articleCandidate !== "" && articleCategory.has(articleCandidate)) {
        currentArticle = articleCandidate;

        continue;
      }

      // ============================================
      // DETAIL TRANSACTION
      //
      // PRICE | INVOICE | SALES
      // ============================================

      const unitPrice = number(row[0]);

      const invoice = text(row[1]);

      const sales = number(row[2]);
      if (currentDate === "08-06-2026" && text(row[1]) === "100037367") {
        console.log(
          "RAW INVOICE 100037367:",

          {
            rowIndex: i,

            rawRow: [...row],

            currentStaff: currentStaff?.name || "UNKNOWN",

            currentArticle,

            parsedUnitPrice: unitPrice,

            parsedInvoice: invoice,

            parsedSales: sales,
          },
        );
      }

      // ============================================
      // VALID INVOICE
      // ============================================

      if (invoice === "") {
        continue;
      }

      if (!/^\d{6,}$/.test(invoice)) {
        continue;
      }

      if (unitPrice <= 0) {
        continue;
      }

      // ============================================
      // QTY
      // ============================================

      // ============================================
      // QTY
      // SIGNED QTY SUPPORT
      //
      // SALES POSITIF  => QTY POSITIF
      // SALES NEGATIF  => QTY NEGATIF (RETURN)
      //
      // Jangan pernah mengubah return menjadi +1.
      // ============================================

      let qty = Math.round(sales / unitPrice);

      // ============================================
      // ZERO QTY FALLBACK
      //
      // Hanya digunakan jika hasil pembagian
      // sales / unitPrice membulat menjadi 0.
      //
      // Tanda QTY mengikuti tanda SALES.
      // ============================================

      if (qty === 0) {
        qty = sales < 0 ? -1 : 1;
      }

      // ============================================
      // GET INVOICE OBJECT
      // ============================================

      const inv = getInvoice(invoice);

      // ============================================
      // DATE RESOLUTION
      //
      // PRIORITAS:
      // 1. Tanggal Salesperson Wise
      // 2. Tanggal Daily Cash
      // ============================================

      const transactionDate = currentDate || inv.date || "";

      // Jika invoice dari Daily Cash belum punya tanggal,
      // isi dari Salesperson Wise.

      if (!inv.date && transactionDate) {
        inv.date = transactionDate;
      }

      // ============================================
      // STAFF RESOLUTION
      // ============================================

      if (!inv.isO2O) {
        inv.staff = currentStaff;
      }

      const transactionStaff = inv.isO2O ? inv.staff : currentStaff;

      // ============================================
      // PUSH ITEM TO INVOICE
      // ============================================

      inv.items.push({
        article: currentArticle,

        qty,

        date: transactionDate,
      });

      // ============================================
      // PUSH TRANSACTION
      // ============================================

      transactions.push({
        date: transactionDate,

        staff: transactionStaff,

        invoice,

        article: currentArticle,

        qty,

        sales,

        unitPrice,

        isO2O: inv.isO2O,

        isNonMD: isNonMD(currentArticle),
      });

      // ============================================
      // SHARED INVOICE
      // ============================================

      registerSharedInvoice(
        invoice,

        transactionStaff,
      );
    }

    console.log(
      "SalesPerson Parsed:",

      {
        invoices: invoiceMap.size,

        transactions: transactions.length,

        dates: [
          ...new Set(
            transactions

              .map((t) => t.date)

              .filter(Boolean),
          ),
        ],
      },
    );
  }
  // =====================================================
  // PARSER MERCHANDISE SALES REPORT
  // =====================================================

  function parseMSR(rows) {
    articleMap.clear();

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];

      if (!row) continue;

      // ============================================
      // DIVISION
      // ============================================

      const division = text(row[1]);

      if (!division) {
        continue;
      }

      if (
        division.startsWith("TOTAL") ||
        division.startsWith("GRAND") ||
        division === "PRODUCT DIVISION"
      ) {
        continue;
      }
      // ============================================
      // ARTICLE
      // Kolom F
      // ============================================

      const rawArticle = text(row[5]);

      if (rawArticle === "") continue;

      const article = rawArticle.split("/")[0].trim();

      // ============================================
      // MSR TRANSACTION DATA
      //
      // row[4] = DATE
      // row[6] = SIGNED QTY
      // row[8] = SIGNED VALUE
      // ============================================

      const date = normalizeDate(row[4]);

      const qty = number(row[6]);

      const value = number(row[8]);

      // ===============================
      // ENGINE V2
      // ===============================

      articleCategory.set(
        article,

        division,
      );

      // ============================================
      // STORE MSR TRANSACTION
      //
      // QTY dan VALUE disimpan apa adanya.
      //
      // SALE:
      // qty   = +1
      // value = +900000
      //
      // RETURN:
      // qty   = -1
      // value = -900000
      // ============================================

      msrTransactions.push({
        date,

        article,

        division,

        qty,

        value,

        isReturn: qty < 0 || value < 0,
      });

      console.log(
        article,

        "=>",

        division,
      );

      console.log(article, articleCategory.get(article));
    }

    console.log(
      "Article Loaded :",

      articleCategory.size,
    );
  }

  console.log(
    "MSR AVAILABLE DATES:",

    [
      ...new Set(
        msrTransactions

          .map((item) => item.date)

          .filter(Boolean),
      ),
    ],
  );
  // =====================================================
  // MATCH RETURN
  //
  // DAILY CASH RETURN:
  // invoice + date + sales
  //
  // MSR RETURN:
  // article + division + date + qty + value
  //
  // MATCH KEY:
  // DATE + VALUE
  // =====================================================

  function matchReturns() {
    // ============================================
    // REMOVE PREVIOUS GENERATED RETURN TRANSACTIONS
    // AGAR MATCH RETURNS IDEMPOTENT
    // ============================================

    for (let i = transactions.length - 1; i >= 0; i--) {
      if (transactions[i].isGeneratedReturn === true) {
        transactions.splice(i, 1);
      }
    }

    // ============================================
    // RESET PREVIOUS RETURN MATCH
    // ============================================

    invoiceMap.forEach((inv) => {
      if (inv.isReturn) {
        inv.returnMatch = null;

        inv.items = [];
      }
    });

    // ============================================
    // GET DAILY CASH RETURNS
    // ============================================

    const dailyReturns = [...invoiceMap.values()].filter((inv) => inv.isReturn);

    // ============================================
    // GET MSR RETURNS
    // ============================================

    const msrReturns = msrTransactions.filter((item) => item.isReturn);

    // ============================================
    // PREVENT ONE MSR ROW USED TWICE
    // ============================================

    const usedMSRIndexes = new Set();

    // ============================================
    // MATCH EACH DAILY CASH RETURN
    // ============================================

    dailyReturns.forEach((inv) => {
      const matchIndex = msrReturns.findIndex((item, index) => {
        if (usedMSRIndexes.has(index)) {
          return false;
        }

        return item.date === inv.date && item.value === inv.sales;
      });

      // ========================================
      // RETURN NOT FOUND
      // ========================================

      if (matchIndex === -1) {
        console.warn(
          "UNMATCHED DAILY RETURN:",

          {
            date: inv.date,

            invoice: inv.invoice,

            sales: inv.sales,
          },
        );

        return;
      }

      // ========================================
      // REGISTER MATCH
      // ========================================

      usedMSRIndexes.add(matchIndex);

      const item = msrReturns[matchIndex];

      // ========================================
      // STORE RETURN ITEM ON INVOICE
      // ========================================

      inv.items.push({
        article: item.article,

        qty: item.qty,

        date: item.date,
      });

      // ========================================
      // STORE MATCH INFORMATION
      // ========================================

      inv.returnMatch = {
        article: item.article,

        division: item.division,

        qty: item.qty,

        value: item.value,
      };

      // ========================================
      // PUSH RETURN TRANSACTION
      //
      // RETURN MASUK KE SALES & QTY
      // DENGAN NILAI NEGATIF
      //
      // TIDAK BOLEH MENAMBAH SM
      // ========================================

      transactions.push({
        date: inv.date,

        staff: null,

        invoice: inv.invoice,

        article: item.article,

        qty: item.qty,

        sales: item.value,

        unitPrice: item.qty !== 0 ? Math.abs(item.value / item.qty) : 0,

        isO2O: false,

        isSale: false,

        isReturn: true,

        isGeneratedReturn: true,

        isNonMD: isNonMD(item.article),
      });
    });

    // ============================================
    // DEBUG RESULT
    // ============================================

    console.log(
      "RETURN MATCH RESULT:",

      {
        dailyReturns: dailyReturns.length,

        msrReturns: msrReturns.length,

        matched: usedMSRIndexes.size,

        unmatchedDaily: dailyReturns.length - usedMSRIndexes.size,

        unmatchedMSR: msrReturns.length - usedMSRIndexes.size,
      },
    );

    console.log(
      "GENERATED RETURN TRANSACTIONS:",

      transactions

        .filter((t) => t.isGeneratedReturn === true)

        .map((t) => ({
          date: t.date,

          invoice: t.invoice,

          article: t.article,

          sales: t.sales,

          qty: t.qty,
        })),
    );
  }

  // =====================================================
  // GET DAILY CASH INVOICES BY DATE
  // =====================================================

  function getDailyInvoices(dateFilter = "") {
    const selectedDate = text(dateFilter);

    return [...invoiceMap.values()].filter((inv) => {
      if (selectedDate !== "" && inv.date !== selectedDate) {
        return false;
      }

      return true;
    });
  }

  // =====================================================
  // GENERATE SUMMARY
  // DATE FILTER SUPPORT
  //
  // generateSummary()
  // => seluruh bulan
  //
  // generateSummary("01-06-2026")
  // => hanya 1 tanggal
  // =====================================================

  // =====================================================
  // GENERATE SUMMARY
  // SUPPORT:
  // generateSummary()
  // generateSummary("01-07-2026")
  // generateSummary({ from:"01-07-2026", to:"10-07-2026" })
  // =====================================================

  function generateSummary(dateFilter = "") {
    const summary = new Map();

    // =====================================================
    // 1. STAFF PERFORMANCE
    // SOURCE = SALESPERSON WISE
    // =====================================================

    transactions.forEach((t) => {
      // FILTER DATE / DATE RANGE

      if (!matchDateFilter(t.date, dateFilter)) {
        return;
      }

      // NON-MD TIDAK MASUK STAFF PERFORMANCE

      if (t.isNonMD) {
        return;
      }

      // RETURN TIDAK MASUK STAFF PERFORMANCE ROW

      if (t.isReturn) {
        return;
      }

      const staffName = t.staff ? t.staff.name : "UNKNOWN";

      if (!summary.has(staffName)) {
        summary.set(staffName, {
          id: t.staff ? t.staff.id : "",

          staff: staffName,

          sales: 0,

          sm: 0,

          qty: 0,

          categories: {},

          invoices: new Set(),
        });
      }

      const row = summary.get(staffName);

      row.sales += Number(t.sales || 0);

      row.qty += Number(t.qty || 0);

      // UNIQUE INVOICE PER STAFF

      row.invoices.add(t.invoice);

      // PRODUCT DIVISION

      const division = getCategory(t.article);

      if (division) {
        row.categories[division] =
          (row.categories[division] || 0) + Number(t.qty || 0);
      }
    });

    // =====================================================
    // 2. FINALIZE STAFF SM
    // =====================================================

    summary.forEach((row) => {
      row.sm = row.invoices.size;

      delete row.invoices;
    });

    // =====================================================
    // 3. SELECT MSR BY DATE FILTER
    // =====================================================

    const selectedMSR = msrTransactions.filter((item) =>
      matchDateFilter(
        item.date,

        dateFilter,
      ),
    );

    // =====================================================
    // 4. SPLIT MD / NON-MD
    // =====================================================

    const mdMSR = selectedMSR.filter(
      (item) => text(item.division) !== "NON-MD",
    );

    const nonMDMSR = selectedMSR.filter(
      (item) => text(item.division) === "NON-MD",
    );

    // =====================================================
    // 5. MD SALES
    // =====================================================

    const mdBaseSales = mdMSR.reduce(
      (sum, item) => sum + Number(item.value || 0),

      0,
    );

    // =====================================================
    // 6. MD QTY
    // =====================================================

    const mdBaseQty = mdMSR.reduce(
      (sum, item) => sum + Number(item.qty || 0),

      0,
    );

    // =====================================================
    // 7. NON-MD
    // =====================================================

    const nonMDSales = nonMDMSR.reduce(
      (sum, item) => sum + Number(item.value || 0),

      0,
    );

    const nonMDQty = nonMDMSR.reduce(
      (sum, item) => sum + Number(item.qty || 0),

      0,
    );

    // =====================================================
    // 8. FINAL TOTAL SALES & QTY
    //
    // mdMSR SUDAH EXCLUDE NON-MD.
    //
    // mdBaseSales dan mdBaseQty hanya berisi transaksi MD,
    // sehingga NON-MD TIDAK BOLEH dikurangi lagi.
    //
    // BUSINESS RULE:
    // FINAL SALES = NET MD SALES
    // FINAL QTY   = NET MD QTY
    // =====================================================

    const finalSales = mdBaseSales;

    const finalQty = mdBaseQty;

    // =====================================================
    // 9. TOTAL PRODUCT DIVISION
    // =====================================================

    const totalCategories = {};

    mdMSR.forEach((item) => {
      const division = text(item.division);

      if (!division) {
        return;
      }

      totalCategories[division] =
        (totalCategories[division] || 0) + Number(item.qty || 0);
    });

    // =====================================================
    // 10. TOTAL SM
    // SOURCE = DAILY CASH
    // SALE ONLY
    // =====================================================

    const dailySaleInvoices = new Set();

    invoiceMap.forEach((inv) => {
      if (!matchDateFilter(inv.date, dateFilter)) {
        return;
      }

      if (!inv.isSale) {
        return;
      }

      dailySaleInvoices.add(inv.invoice);
    });

    // =====================================================
    // 11. TOTAL ROW
    // =====================================================

    const total = {
      id: "",

      staff: "TOTAL",

      sales: finalSales,

      sm: dailySaleInvoices.size,

      qty: finalQty,

      categories: totalCategories,
    };

    // =====================================================
    // 12. DEBUG
    // =====================================================

    const normalizedFilter = normalizeDateFilter(dateFilter);

    console.log(
      "GT SUMMARY RESULT:",

      {
        filter: normalizedFilter,

        selectedMSRRows: selectedMSR.length,

        mdBaseSales,

        mdBaseQty,

        nonMDSales,

        nonMDQty,

        finalSales,

        finalQty,

        totalSM: dailySaleInvoices.size,

        categories: totalCategories,
      },
    );

    // =====================================================
    // 13. RETURN SUMMARY
    // =====================================================

    return [...summary.values(), total];
  }

  // =====================================================
  // SHARED INVOICE
  // =====================================================

  // =====================================================
  // SHARED INVOICE
  // SUPPORT DATE FILTER
  //
  // getSharedInvoices()
  // => seluruh bulan
  //
  // getSharedInvoices("01-06-2026")
  // => shared MD invoice tanggal tersebut
  // =====================================================

  // =====================================================
  // SHARED INVOICE
  // SUPPORT:
  // getSharedInvoices()
  // getSharedInvoices("01-07-2026")
  // getSharedInvoices({
  //     from:"01-07-2026",
  //     to:"10-07-2026"
  // })
  // =====================================================

  function getSharedInvoices(dateFilter = "") {
    const invoiceStaffMap = new Map();

    // =================================================
    // LOOP TRANSACTIONS
    // =================================================

    transactions.forEach((t) => {
      // =============================================
      // FILTER DATE / CUSTOM DATE RANGE
      // =============================================

      if (!matchDateFilter(t.date, dateFilter)) {
        return;
      }

      // =============================================
      // SKIP NON-MD
      // =============================================

      if (t.isNonMD) {
        return;
      }

      // =============================================
      // SKIP RETURN
      // =============================================

      if (t.isReturn) {
        return;
      }

      // =============================================
      // STAFF NAME
      // =============================================

      const staffName = t.staff ? text(t.staff.name) : "UNKNOWN";

      // =============================================
      // CREATE INVOICE STAFF SET
      // =============================================

      if (!invoiceStaffMap.has(t.invoice)) {
        invoiceStaffMap.set(
          t.invoice,

          new Set(),
        );
      }

      // =============================================
      // REGISTER STAFF
      // =============================================

      invoiceStaffMap

        .get(t.invoice)

        .add(staffName);
    });

    // =================================================
    // FIND SHARED INVOICES
    // =================================================

    const result = [];

    invoiceStaffMap.forEach((staffs, invoice) => {
      if (staffs.size > 1) {
        result.push({
          invoice,

          staffs: [...staffs],
        });
      }
    });

    return result;
  }
  // =====================================================
  // STAFF DETAIL
  // =====================================================

  // =====================================================
  // STAFF TRANSACTIONS
  // SUPPORT DATE FILTER
  //
  // getStaffTransactions("ALIFI FAJAR")
  // => seluruh bulan
  //
  // getStaffTransactions(
  //     "ALIFI FAJAR",
  //     "01-06-2026"
  // )
  // => hanya tanggal tersebut
  // =====================================================

  // =====================================================
  // STAFF TRANSACTIONS
  // SUPPORT:
  // getStaffTransactions("HANIFAH PRATAMI")
  // getStaffTransactions("HANIFAH PRATAMI", "01-07-2026")
  // getStaffTransactions(
  //     "HANIFAH PRATAMI",
  //     {
  //         from:"01-07-2026",
  //         to:"10-07-2026"
  //     }
  // )
  // =====================================================

  function getStaffTransactions(
    staffName,

    dateFilter = "",
  ) {
    // =================================================
    // NORMALIZE STAFF NAME
    // =================================================

    let selectedStaff = text(staffName);

    // =================================================
    // O2O ALIAS
    // =================================================

    if (selectedStaff === "🌐 O2O") {
      selectedStaff = "O2O";
    }

    // =================================================
    // FILTER TRANSACTIONS
    // =================================================

    return transactions.filter((t) => {
      // =============================================
      // FILTER DATE / CUSTOM DATE RANGE
      // =============================================

      if (!matchDateFilter(t.date, dateFilter)) {
        return false;
      }

      // =============================================
      // STAFF NAME
      // =============================================

      const transactionStaff = t.staff ? text(t.staff.name) : "UNKNOWN";

      if (transactionStaff !== selectedStaff) {
        return false;
      }

      return true;
    });
  }

  // =====================================================
  // STAFF SUMMARY
  // =====================================================

  // =====================================================
  // STAFF SUMMARY
  // SUPPORT DATE FILTER
  //
  // getStaffSummary("ALIFI FAJAR")
  // => summary seluruh bulan
  //
  // getStaffSummary(
  //     "ALIFI FAJAR",
  //     "01-06-2026"
  // )
  // => summary tanggal tertentu
  // =====================================================

  // =====================================================
  // STAFF SUMMARY
  // SUPPORT:
  // getStaffSummary("HANIFAH PRATAMI")
  // getStaffSummary("HANIFAH PRATAMI", "01-07-2026")
  // getStaffSummary(
  //     "HANIFAH PRATAMI",
  //     {
  //         from:"01-07-2026",
  //         to:"10-07-2026"
  //     }
  // )
  // =====================================================

  function getStaffSummary(
    staffName,

    dateFilter = "",
  ) {
    // =================================================
    // NORMALIZE STAFF NAME
    // =================================================

    let selectedStaff = text(staffName);

    // =================================================
    // O2O ALIAS
    // =================================================

    if (selectedStaff === "🌐 O2O") {
      selectedStaff = "O2O";
    }

    // =================================================
    // GENERATE SUMMARY
    // SUPPORT ALL / SINGLE DATE / CUSTOM RANGE
    // =================================================

    const summary = generateSummary(dateFilter);

    // =================================================
    // FIND STAFF ROW
    // =================================================

    const row = summary.find((item) => text(item.staff) === selectedStaff);

    return row || null;
  }
  // =====================================================
  // VALIDATION V4
  // SOURCE RECONCILIATION + ATTRIBUTION CLASSIFICATION
  //
  // VALID SHARED:
  // invoice digunakan >1 staff valid
  //
  // ATTRIBUTION ANOMALY:
  // invoice digunakan UNKNOWN + staff valid
  //
  // getValidation()
  // => seluruh bulan
  //
  // getValidation("04-06-2026")
  // => tanggal tertentu
  // =====================================================

  // =====================================================
  // VALIDATION V5
  // SUPPORT:
  // getValidation()
  // getValidation("01-07-2026")
  // getValidation({
  //     from:"01-07-2026",
  //     to:"10-07-2026"
  // })
  // =====================================================

  function getValidation(dateFilter = "") {
    // =================================================
    // FILTER TRANSACTIONS
    // =================================================

    const filteredTransactions = transactions.filter((t) =>
      matchDateFilter(
        t.date,

        dateFilter,
      ),
    );

    // =================================================
    // DAILY CASH INVOICES
    // =================================================

    const dailyInvoices = [...invoiceMap.values()].filter((inv) =>
      matchDateFilter(
        inv.date,

        dateFilter,
      ),
    );

    // =================================================
    // DAILY CASH SALE INVOICES
    // RETURN TIDAK MENAMBAH SM
    // =================================================

    const dailyCashSaleInvoices = dailyInvoices.filter((inv) => inv.isSale);

    const dailyCashSM = dailyCashSaleInvoices.length;

    // =================================================
    // DAILY CASH SALES
    // SALE + RETURN
    // =================================================

    const dailyCashSales = dailyInvoices.reduce(
      (sum, inv) => sum + Number(inv.sales || 0),

      0,
    );

    // =================================================
    // MD / NON-MD TRANSACTIONS
    // =================================================

    const mdTransactions = filteredTransactions.filter((t) => !t.isNonMD);

    const nonMDTransactions = filteredTransactions.filter((t) => t.isNonMD);

    // =================================================
    // NON-MD SALES / QTY
    // =================================================

    const nonMDSales = nonMDTransactions.reduce(
      (sum, t) => sum + Number(t.sales || 0),

      0,
    );

    const nonMDQty = nonMDTransactions.reduce(
      (sum, t) => sum + Number(t.qty || 0),

      0,
    );

    // =================================================
    // ENGINE SUMMARY
    // =================================================

    const summary = generateSummary(dateFilter);

    const total = summary.find((row) => row.staff === "TOTAL");

    const engineSales = Number(total?.sales || 0);

    const engineQty = Number(total?.qty || 0);

    const engineSM = Number(total?.sm || 0);

    // =================================================
    // STAFF ROWS
    // =================================================

    const staffRows = summary.filter((row) => row.staff !== "TOTAL");

    // =================================================
    // STAFF SM
    // SUM UNIQUE INVOICE PER STAFF
    // =================================================

    const staffSM = staffRows.reduce(
      (sum, row) => sum + Number(row.sm || 0),

      0,
    );

    // =================================================
    // BUILD INVOICE -> STAFF SET
    // MD SALE ONLY
    // =================================================

    const invoiceStaffMap = new Map();

    mdTransactions.forEach((t) => {
      if (t.isReturn) {
        return;
      }

      const staffName = t.staff ? text(t.staff.name) : "UNKNOWN";

      if (!invoiceStaffMap.has(t.invoice)) {
        invoiceStaffMap.set(
          t.invoice,

          new Set(),
        );
      }

      invoiceStaffMap

        .get(t.invoice)

        .add(staffName);
    });

    // =================================================
    // CLASSIFY ATTRIBUTION
    // =================================================

    const validShared = [];

    const attributionAnomalies = [];

    invoiceStaffMap.forEach((staffSet, invoice) => {
      const staffs = [...staffSet];

      if (staffs.length <= 1) {
        return;
      }

      const hasUnknown = staffs.includes("UNKNOWN");

      const data = {
        invoice,

        staffs,

        extraAttribution: staffs.length - 1,
      };

      if (hasUnknown) {
        attributionAnomalies.push(data);
      } else {
        validShared.push(data);
      }
    });

    // =================================================
    // VALID SHARED METRICS
    // =================================================

    const validSharedCount = validShared.length;

    const validSharedExtraAttribution = validShared.reduce(
      (sum, item) => sum + Number(item.extraAttribution || 0),

      0,
    );

    // =================================================
    // ATTRIBUTION ANOMALY METRICS
    // =================================================

    const attributionAnomalyCount = attributionAnomalies.length;

    const anomalyExtraAttribution = attributionAnomalies.reduce(
      (sum, item) => sum + Number(item.extraAttribution || 0),

      0,
    );

    // =================================================
    // ALL SHARED
    // =================================================

    const shared = [...validShared, ...attributionAnomalies];

    const sharedInvoiceCount = shared.length;

    const sharedExtraAttribution =
      validSharedExtraAttribution + anomalyExtraAttribution;

    // =================================================
    // DIFFERENCE
    // =================================================

    const difference = staffSM - dailyCashSM;

    // =================================================
    // EXPECTED STAFF SM
    // =================================================

    const expectedStaffSM =
      dailyCashSM + validSharedExtraAttribution + anomalyExtraAttribution;

    const expectedStaffSMMatch = staffSM === expectedStaffSM;

    // =================================================
    // UNKNOWN TRANSACTIONS
    // MD SALE ONLY
    // =================================================

    const unknownTransactionRows = mdTransactions.filter(
      (t) => !t.isReturn && (!t.staff || text(t.staff.name) === "UNKNOWN"),
    );

    const unknownInvoiceSet = new Set(
      unknownTransactionRows.map((t) => t.invoice),
    );

    const unknownSM = unknownInvoiceSet.size;

    const unknownSales = unknownTransactionRows.reduce(
      (sum, t) => sum + Number(t.sales || 0),

      0,
    );

    const unknownQty = unknownTransactionRows.reduce(
      (sum, t) => sum + Number(t.qty || 0),

      0,
    );

    // =================================================
    // TRANSACTION RECONCILIATION
    // =================================================

    const transactionSales = mdTransactions.reduce(
      (sum, t) => sum + Number(t.sales || 0),

      0,
    );

    const transactionQty = mdTransactions.reduce(
      (sum, t) => sum + Number(t.qty || 0),

      0,
    );

    const transactionSM = new Set(
      mdTransactions

        .filter((t) => !t.isReturn)

        .map((t) => t.invoice),
    ).size;

    // =================================================
    // CORE RECONCILIATION
    // =================================================

    const salesMatch = engineSales === transactionSales;

    const qtyMatch = engineQty === transactionQty;

    const smMatch = engineSM === transactionSM;

    const sourceSMMatch = dailyCashSM === transactionSM;

    const attributionMatch = difference === sharedExtraAttribution;

    // =================================================
    // GROSS SALES RECONCILIATION
    // =================================================

    const reconstructedGrossSales = engineSales + nonMDSales;

    const grossReconciliation = dailyCashSales === reconstructedGrossSales;

    // =================================================
    // CORE VALID
    // =================================================

    const coreValid =
      salesMatch &&
      qtyMatch &&
      smMatch &&
      sourceSMMatch &&
      attributionMatch &&
      expectedStaffSMMatch &&
      grossReconciliation;

    // =================================================
    // STATUS
    // =================================================

    let status;

    let statusLabel;

    if (!coreValid) {
      status = "INVALID";

      statusLabel = "❌ INVALID";
    } else if (
      attributionAnomalyCount > 0 ||
      unknownTransactionRows.length > 0
    ) {
      status = "WARNING";

      statusLabel = "⚠ VALID WITH WARNING";
    } else {
      status = "VALID";

      statusLabel = "✅ VALID";
    }

    // =================================================
    // FILTER INFORMATION
    // =================================================

    const normalizedFilter = normalizeDateFilter(dateFilter);

    let filterLabel = "ALL DATES";

    if (normalizedFilter.mode === "SINGLE_DATE") {
      filterLabel = normalizedFilter.date;
    } else if (normalizedFilter.mode === "CUSTOM_RANGE") {
      filterLabel = `${normalizedFilter.from || "START"} - ${
        normalizedFilter.to || "END"
      }`;
    }

    // =================================================
    // RETURN RESULT
    // =================================================

    return {
      date: filterLabel,

      filter: normalizedFilter,

      // DAILY CASH

      dailyCashSM,

      dailyCashSales,

      // STAFF ATTRIBUTION

      staffSM,

      difference,

      expectedStaffSM,

      expectedStaffSMMatch,

      // ENGINE

      engineSales,

      engineSM,

      engineQty,

      // VALID SHARED

      validShared,

      validSharedCount,

      validSharedExtraAttribution,

      // ATTRIBUTION ANOMALY

      attributionAnomalies,

      attributionAnomalyCount,

      anomalyExtraAttribution,

      // ALL SHARED

      shared,

      sharedInvoiceCount,

      sharedExtraAttribution,

      // UNKNOWN

      unknownTransactions: unknownTransactionRows.length,

      unknownSM,

      unknownSales,

      unknownQty,

      // TRANSACTION RECONCILIATION

      transactionSales,

      transactionSM,

      transactionQty,

      // NON-MD

      nonMDSales,

      nonMDQty,

      reconstructedGrossSales,

      // VALIDATION FLAGS

      salesMatch,

      qtyMatch,

      smMatch,

      sourceSMMatch,

      attributionMatch,

      grossReconciliation,

      coreValid,

      // STATUS

      status,

      statusLabel,
    };
  }
  // =====================================================
  // GET AVAILABLE DATES
  // =====================================================

  function getAvailableDates() {
    const dates = new Set();

    invoiceMap.forEach((inv) => {
      if (inv.date) {
        dates.add(inv.date);
      }
    });

    transactions.forEach((t) => {
      if (t.date) {
        dates.add(t.date);
      }
    });

    return [...dates].sort((a, b) => {
      const [dayA, monthA, yearA] = a.split("-").map(Number);

      const [dayB, monthB, yearB] = b.split("-").map(Number);

      return (
        new Date(yearA, monthA - 1, dayA) - new Date(yearB, monthB - 1, dayB)
      );
    });
  }

  // =====================================================
  // DAILY VALIDATION AUDIT
  // =====================================================

  function getDailyValidationAudit() {
    return getAvailableDates().map((date) => {
      const validation = getValidation(date);

      return {
        date,

        dailyCashSM: validation.dailyCashSM,

        staffSM: validation.staffSM,

        difference: validation.difference,

        validSharedCount: validation.validSharedCount,

        validSharedExtraAttribution: validation.validSharedExtraAttribution,

        attributionAnomalyCount: validation.attributionAnomalyCount,

        anomalyExtraAttribution: validation.anomalyExtraAttribution,

        unknownTransactions: validation.unknownTransactions,

        unknownSM: validation.unknownSM,

        unknownSales: validation.unknownSales,

        unknownQty: validation.unknownQty,

        coreValid: validation.coreValid,

        status: validation.status,

        statusLabel: validation.statusLabel,
      };
    });
  }

  // =====================================================
  // VALIDATION DETAIL BY DATE
  // =====================================================

  function getValidationDetail(date) {
    const selectedDate = text(date);

    const validation = getValidation(selectedDate);

    // ==========================================
    // STAFF PERFORMANCE PER DATE
    // ==========================================

    const staffSummary = generateSummary(selectedDate);

    const divisions = new Set(["ACCESSORIES", "BAGS", "APPAREL", "FOOTWEAR"]);

    staffSummary.forEach((row) => {
      Object.keys(row.categories || {}).forEach((division) => {
        divisions.add(division);
      });
    });

    // ==========================================
    // UNKNOWN TRANSACTIONS
    // ==========================================

    const unknownTransactions = transactions.filter(
      (t) =>
        t.date === selectedDate &&
        !t.isNonMD &&
        (!t.staff || text(t.staff.name) === "UNKNOWN"),
    );

    return {
      date: selectedDate,

      validation,

      staffSummary,

      divisions: [...divisions],

      validShared: validation.validShared || [],

      attributionAnomalies: validation.attributionAnomalies || [],

      unknownTransactions,
    };
  }

  // =====================================================
  // NORMALIZE DATE FILTER
  // SUPPORT:
  // ALL
  // SINGLE DATE
  // CUSTOM RANGE
  // =====================================================

  function normalizeDateFilter(dateFilter = "") {
    // ==========================================
    // ALL DATES
    // ==========================================

    if (dateFilter === undefined || dateFilter === null || dateFilter === "") {
      return {
        mode: "ALL",

        date: "",

        from: "",

        to: "",
      };
    }

    // ==========================================
    // SINGLE DATE
    // ==========================================

    if (typeof dateFilter === "string") {
      const date = normalizeDate(dateFilter);

      if (!date) {
        return {
          mode: "ALL",

          date: "",

          from: "",

          to: "",
        };
      }

      return {
        mode: "SINGLE_DATE",

        date,

        from: date,

        to: date,
      };
    }

    // ==========================================
    // CUSTOM RANGE
    // SUPPORT:
    // { from, to }
    // { start, end }
    // { startDate, endDate }
    // ==========================================

    if (typeof dateFilter === "object" && !Array.isArray(dateFilter)) {
      const from = normalizeDate(
        dateFilter.from || dateFilter.start || dateFilter.startDate || "",
      );

      const to = normalizeDate(
        dateFilter.to || dateFilter.end || dateFilter.endDate || "",
      );

      // OBJECT KOSONG = ALL

      if (!from && !to) {
        return {
          mode: "ALL",

          date: "",

          from: "",

          to: "",
        };
      }

      // RANGE DENGAN TANGGAL SAMA
      // DIANGGAP SINGLE DATE

      if (from && to && from === to) {
        return {
          mode: "SINGLE_DATE",

          date: from,

          from,

          to,
        };
      }

      return {
        mode: "CUSTOM_RANGE",

        date: "",

        from,

        to,
      };
    }

    return {
      mode: "ALL",

      date: "",

      from: "",

      to: "",
    };
  }

  // =====================================================
  // DATE TO COMPARABLE NUMBER
  // DD-MM-YYYY => YYYYMMDD
  // =====================================================

  function dateToComparableValue(value) {
    const normalized = normalizeDate(value);

    if (!normalized) {
      return null;
    }

    const parts = normalized.split("-");

    if (parts.length !== 3) {
      return null;
    }

    const [day, month, year] = parts;

    return Number(`${year}${month}${day}`);
  }

  // =====================================================
  // MATCH DATE FILTER
  // SUPPORT:
  // ALL
  // SINGLE DATE
  // CUSTOM RANGE
  // OPEN RANGE
  // =====================================================

  function matchDateFilter(
    transactionDate,

    dateFilter = "",
  ) {
    const filter = normalizeDateFilter(dateFilter);

    // ==========================================
    // ALL DATES
    // ==========================================

    if (filter.mode === "ALL") {
      return true;
    }

    const normalizedTransactionDate = normalizeDate(transactionDate);

    if (!normalizedTransactionDate) {
      return false;
    }

    // ==========================================
    // SINGLE DATE
    // ==========================================

    if (filter.mode === "SINGLE_DATE") {
      return normalizedTransactionDate === filter.date;
    }

    // ==========================================
    // CUSTOM RANGE
    // ==========================================

    const transactionValue = dateToComparableValue(normalizedTransactionDate);

    if (transactionValue === null) {
      return false;
    }

    if (filter.from) {
      const fromValue = dateToComparableValue(filter.from);

      if (fromValue !== null && transactionValue < fromValue) {
        return false;
      }
    }

    if (filter.to) {
      const toValue = dateToComparableValue(filter.to);

      if (toValue !== null && transactionValue > toValue) {
        return false;
      }
    }

    return true;
  }
  // =====================================================
  // PUBLIC API
  // =====================================================

  return {
    invoiceMap,
    articleMap,
    staffMap,

    transactions,
    msrTransactions,
    articleCategory,

    clear,

    getInvoice,
    getArticle,
    getStaff,
    getCategory,

    normalizeDateFilter,
    matchDateFilter,

    parseDailyCash,
    parseSalesPerson,
    parseMSR,

    matchReturns,

    generateSummary,

    getDailyInvoices,

    getSharedInvoices,
    getStaffTransactions,
    getStaffSummary,
    getValidation,

    getAvailableDates,
    getDailyValidationAudit,
    getValidationDetail,
  };
})();
