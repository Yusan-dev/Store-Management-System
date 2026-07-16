// =====================================================
// GT AUTO SALES
// PROCESS CONTROLLER V2
// =====================================================


// =====================================================
// FILE STATE
// =====================================================

const files = {

    dailyCash: null,

    salesPerson: null,

    msr: null

};


// =====================================================
// LICENSE UI CONTROLLER
// =====================================================

function formatLicenseDate(freeLimit){

    if(!freeLimit){

        return "-";

    }


    const date = new Date(

        freeLimit.year,

        freeLimit.month - 1,

        freeLimit.day

    );


    return date

        .toLocaleDateString(

            "id-ID",

            {

                day: "2-digit",

                month: "long",

                year: "numeric"

            }

        )

        .toUpperCase();

}


// =====================================================
// UPDATE LICENSE STATUS UI
// =====================================================

function updateLicenseStatusUI(){

    const status =
        GTRuntime.getStatus();


    const card =
        document.getElementById(
            "licenseStatusCard"
        );


    const planElement =
        document.getElementById(
            "licensePlan"
        );


    const userIdElement =
        document.getElementById(
            "licenseUserId"
        );


    const infoElement =
        document.getElementById(
            "licenseAccessInfo"
        );


    if(!card){

        return;

    }


    // =============================================
    // GLOBAL STATUS DATA
    // =============================================

    card.dataset.plan =
        status.plan || "NONE";


    card.dataset.authority =
        status.authority || "NONE";


    if(userIdElement){

        userIdElement.innerText =
            status.userId || "-";

    }


    // =============================================
    // VIP LORD
    // OWNER / SOVEREIGN ACCOUNT
    // =============================================

    if(status.plan === "VIP_LORD"){

        if(planElement){

            planElement.innerText =
                "👑 VIP LORD";

        }


        if(infoElement){

            infoElement.innerText =

                `${status.accountName || "KANGODING.ORG"} • ` +

                `${status.authority || "SOVEREIGN"} • ` +

                `PERMANENT ACCESS`;

        }


        return;

    }


    // =============================================
    // VIP LIFETIME
    // CUSTOMER PREMIUM ACCOUNT
    // =============================================

    if(status.plan === "VIP_LIFETIME"){

        if(planElement){

            planElement.innerText =
                "◆ VIP LIFETIME";

        }


        if(infoElement){

            infoElement.innerText =

                `${status.accountName || "VIP MEMBER"} • ` +

                `PERMANENT ACCESS • NO EXPIRATION`;

        }


        return;

    }


    // =============================================
    // FREE ACCESS
    // =============================================

    if(status.plan === "FREE_ACCESS"){

        if(planElement){

            planElement.innerText =
                "FREE ACCESS";

        }


        if(infoElement){

            infoElement.innerText =

                "ACTIVE UNTIL • " +

                formatLicenseDate(
                    status.freeLimit
                );

        }


        return;

    }


    // =============================================
    // FREE EXPIRED
    // =============================================

    if(status.plan === "FREE_EXPIRED"){

        if(planElement){

            planElement.innerText =
                "ACCESS EXPIRED";

        }


        if(infoElement){

            infoElement.innerText =
                "VIP LIFETIME ACCESS REQUIRED";

        }


        return;

    }


    // =============================================
    // NOT AUTHORIZED
    // INITIAL STATE
    // =============================================

    if(planElement){

        planElement.innerText =
            "NOT AUTHORIZED";

    }


    if(infoElement){

        infoElement.innerText =
            "PROCESS DAILY CASH TO VERIFY ACCESS";

    }

}
// =====================================================
// SHOW EXPIRED ACCESS SCREEN
// =====================================================

function showExpiredAccessScreen(){

    const status =
        GTRuntime.getStatus();


    const screen =
        document.getElementById(
            "licenseAccessScreen"
        );


    const userIdElement =
        document.getElementById(
            "expiredUserId"
        );


    const expiredDateElement =
        document.getElementById(
            "expiredDate"
        );


    if(!screen){

        return;

    }


    if(userIdElement){

        userIdElement.innerText =
            status.userId || "-";

    }


    if(expiredDateElement){

        expiredDateElement.innerText =

            formatLicenseDate(
                status.freeLimit
            );

    }


    screen.classList.add("show");

    screen.setAttribute(
        "aria-hidden",
        "false"
    );


    document.body.style.overflow =
        "hidden";

}


// =====================================================
// LOADING
// =====================================================

function setLoading(percent, message){

    const loading =
        document.getElementById("loading");

    const progress =
        document.getElementById("loadingProgress");

    const percentText =
        document.getElementById("loadingPercent");

    const loadingText =
        document.getElementById("loadingText");


    if(loading){

        loading.classList.add("show");

    }


    if(progress){

        progress.style.width =
            percent + "%";

    }


    if(percentText){

        percentText.innerText =
            percent + "%";

    }


    if(loadingText){

        loadingText.innerText =
            message;

    }

}


function hideLoading(){

    const loading =
        document.getElementById("loading");

    if(loading){

        loading.classList.remove("show");

    }

}


// =====================================================
// FILE INPUT HANDLER
// =====================================================

function registerFileInput(

    inputId,

    fileNameId,

    fileKey

){

    const input =
        document.getElementById(inputId);

    const fileName =
        document.getElementById(fileNameId);


    if(!input){

        console.warn(

            "File input not found:",

            inputId

        );

        return;

    }


    input.addEventListener(

        "change",

        event => {

            const file =
                event.target.files?.[0] || null;


            files[fileKey] = file;


            if(fileName){

                fileName.innerText =

                    file

                    ? file.name

                    : "No file selected";

            }

        }

    );

}


// =====================================================
// REGISTER FILE INPUT
// =====================================================

registerFileInput(

    "dailyCash",

    "dailyCashName",

    "dailyCash"

);


registerFileInput(

    "salesPerson",

    "salesPersonName",

    "salesPerson"

);


registerFileInput(

    "msr",

    "msrName",

    "msr"

);


// =====================================================
// PROCESS BUTTON
// =====================================================

const processButton =

    document.getElementById("process");


if(processButton){

    processButton.addEventListener(

        "click",

        runProcess

    );

}


// =====================================================
// READ EXCEL
// =====================================================

function readExcel(file){

    return new Promise(

        (resolve, reject) => {

            if(!file){

                reject(

                    new Error(

                        "Excel file tidak ditemukan."

                    )

                );

                return;

            }


            const reader =
                new FileReader();


            reader.onload = event => {

                try{

                    const workbook =

                        XLSX.read(

                            event.target.result,

                            {

                                type: "array"

                            }

                        );


                    if(

                        !workbook.SheetNames ||

                        workbook.SheetNames.length === 0

                    ){

                        throw new Error(

                            "Workbook tidak memiliki worksheet."

                        );

                    }


                    const firstSheetName =

                        workbook.SheetNames[0];


                    const worksheet =

                        workbook.Sheets[

                            firstSheetName

                        ];


                    const rows =

                        XLSX.utils.sheet_to_json(

                            worksheet,

                            {

                                header: 1,

                                defval: "",

                                raw: false

                            }

                        );


                    resolve(rows);

                }

                catch(error){

                    reject(error);

                }

            };


            reader.onerror = () => {

                reject(

                    new Error(

                        "Gagal membaca file Excel."

                    )

                );

            };


            reader.readAsArrayBuffer(file);

        }

    );

}


// =====================================================
// VALIDATE FILES
// =====================================================

function validateFiles(){

    if(!files.dailyCash){

        alert(

            "Upload Daily Cash Collection."

        );

        return false;

    }


    if(!files.salesPerson){

        alert(

            "Upload Salesperson Wise."

        );

        return false;

    }


    if(!files.msr){

        alert(

            "Upload Merchandise Sales Report."

        );

        return false;

    }


    return true;

}


// =====================================================
// EXTRACT DYNAMIC DIVISIONS
// =====================================================

function getDynamicDivisions(summary){

    const divisions =
        new Set();


    summary.forEach(row => {

        if(row.staff === "TOTAL"){

            return;

        }


        const categories =

            row.categories || {};


        Object.keys(categories)

            .forEach(division => {

                divisions.add(

                    division

                );

            });

    });


    return [

        ...divisions

    ];

}


// =====================================================
// DEBUG ENGINE RESULT
// =====================================================

function debugEngine(summary){

    console.group(

        "GT AUTO SALES ENGINE RESULT"

    );


    console.table(summary);


    const divisions =

        getDynamicDivisions(summary);


    console.log(

        "Detected Divisions:",

        divisions

    );


    summary.forEach(row => {

        console.log(

            row.staff,

            {

                sales:
                    row.sales,

                sm:
                    row.sm,

                qty:
                    row.qty,

                categories:
                    row.categories

            }

        );

    });


    const total =

        summary.find(

            row =>

                row.staff === "TOTAL"

        );


    if(total){

        const categoryQty =

            Object.values(

                total.categories || {}

            )

            .reduce(

                (sum, qty) =>

                    sum + qty,

                0

            );


        console.log(

            "TOTAL QTY:",

            total.qty

        );


        console.log(

            "TOTAL CATEGORY QTY:",

            categoryQty

        );


        console.log(

            "CATEGORY QTY MATCH:",

            total.qty === categoryQty

        );

    }


    console.groupEnd();

}


// =====================================================
// MAIN PROCESS
// =====================================================

async function runProcess(){

    if(!validateFiles()){

        return;

    }


    try{

        // =========================
        // DISABLE BUTTON
        // =========================

        if(processButton){

            processButton.disabled = true;

        }


        console.clear();


        console.log(

            "===== GT AUTO SALES START ====="

        );


        // =========================
        // RESET ENGINE
        // =========================

        GTEngine.clear();


       // ==========================
// DAILY CASH
// ==========================

setLoading(10, "Reading Daily Cash...");

const dailyRows = await readExcel(files.dailyCash);


// ==========================================
// RUNTIME LICENSE AUTHORIZATION
// DAILY CASH A2 = USER ID
// ==========================================

const runtimeAccess =
    GTRuntime.authorize(dailyRows);


console.log(
    "GT RUNTIME ACCESS:",
    runtimeAccess
);

updateLicenseStatusUI();


// ==========================================
// ACCESS DENIED
// ==========================================

if(!runtimeAccess.ok){

    hideLoading();


if(
    runtimeAccess.reason ===
    "FREE_ACCESS_EXPIRED"
){

    showExpiredAccessScreen();

}
    else if(
        runtimeAccess.reason ===
        "USER_ID_NOT_FOUND"
    ){

        alert(

            "USER ID TIDAK DITEMUKAN.\n\n" +

            "Pastikan User ID tersedia pada cell A2 Daily Cash Collection."

        );

    }

    else{

        alert(

            "ACCESS DENIED.\n\n" +

            "Hubungi KANGODING.ORG."

        );

    }


    return;

}


// ==========================================
// ENGINE ACCESS GATE
// ==========================================

GTRuntime.assertEngineAccess();


// ==========================================
// PROCESS DAILY CASH
// ==========================================

GTEngine.parseDailyCash(dailyRows);

// ==========================
// MERCHANDISE SALES REPORT
// ==========================

setLoading(35, "Building Article Master...");

const msrRows = await readExcel(files.msr);

GTEngine.parseMSR(msrRows);


// ==========================
// SALESPERSON WISE
// ==========================

setLoading(60, "Mapping Staff Transactions...");

const salesRows = await readExcel(files.salesPerson);

GTEngine.parseSalesPerson(salesRows);



        // =========================
        // GENERATE SUMMARY
        // =========================

        setLoading(

            80,

            "Generating Summary..."

        );

GTRuntime.assertEngineAccess();

        const summary =

            GTEngine.generateSummary();


        // =========================
        // VALIDATE SUMMARY
        // =========================

        if(

            !Array.isArray(summary)

        ){

            throw new Error(

                "Engine menghasilkan summary invalid."

            );

        }


        // =========================
        // DYNAMIC DIVISIONS
        // =========================

        const divisions =

            getDynamicDivisions(

                summary

            );


        // =========================
        // GLOBAL APPLICATION STATE
        // =========================

        window.summaryData =

            summary;


        window.divisionData =

            divisions;



            // =========================
// CONFIGURE PERFORMANCE
// DATE INPUT LIMITS
// =========================

if(
    typeof configurePerformanceDateLimits ===
    "function"
){

    configurePerformanceDateLimits();

}

        // =========================
        // DEBUG
        // =========================

        debugEngine(summary);


        // =========================
        // DRAW TABLE
        // =========================

        if(typeof applyPerformanceDateFilter === "function") {
            window.summaryData = summary;
            window.divisionData = divisions;
            applyPerformanceDateFilter("");
        } else if (typeof drawTable === "function"){
            drawTable(summary, divisions);
        }


        // =========================
        // UPDATE SUMMARY
        // =========================

        if(

            typeof updateSummary ===

            "function"

        ){

            updateSummary(

                summary,

                divisions

            );

        }


        
// =========================
// DAILY VALIDATION AUDIT
// =========================

if(

    typeof updateDailyValidation ===

    "function"

){

    updateDailyValidation();

}


// =========================
// PERFORMANCE DATE LIMITS
// =========================

if(

    typeof configurePerformanceDateLimits ===

    "function"

){

    configurePerformanceDateLimits();

}


        // =========================
        // COMPLETE
        // =========================
        setLoading(

            100,

            "Completed"

        );


        console.log(

            "===== GT AUTO SALES FINISHED ====="

        );


        setTimeout(

            hideLoading,

            500

        );

    }

    catch(error){

        console.error(

            "GT AUTO SALES ERROR:",

            error

        );


        hideLoading();


        alert(

            "Process gagal.\n\n" +

            error.message

        );

    }

    finally{

        if(processButton){

            processButton.disabled = false;

        }

    }

}