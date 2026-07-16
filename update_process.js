const fs = require('fs');
const processPath = 'd:/Download/GT_MASTER_DASHBOARD/modules/sales-staff/assets/js/process.js';
let pContent = fs.readFileSync(processPath, 'utf-8');

// 1. Add target to files state
pContent = pContent.replace(
    /msr: null\s*\};/,
    `msr: null,
    target: null
};`
);

// 2. Add Target parsing in runProcess
const parseTargetLogic = `
        // ==========================
        // TARGET HARIAN
        // ==========================
        if(files.target){
            setLoading(70, "Reading Target Harian...");
            const targetRows = await readExcel(files.target);
            const targetDataMap = {};
            for(let i = 4; i < targetRows.length; i++){
                const row = targetRows[i];
                if(!row) continue;
                const rawDate = row[1];
                if(!rawDate) continue;
                let dateStr = "";
                if(typeof rawDate === "number") {
                    const excelEpoch = new Date(1899, 11, 30);
                    const d = new Date(excelEpoch.getTime() + rawDate * 86400000);
                    const dd = String(d.getDate()).padStart(2, '0');
                    dateStr = dd; // Just store Day of Month
                } else if (typeof rawDate === "string") {
                    dateStr = rawDate.split("-")[0]; // assumed DD-MM-YYYY
                }
                const pct = parseFloat(row[8]) || 0;
                if(dateStr) targetDataMap[dateStr] = pct;
            }
            localStorage.setItem("gt_daily_targets", JSON.stringify(targetDataMap));
        }
`;

pContent = pContent.replace(
    /GTEngine\.parseSalesPerson\(salesRows\);/,
    `GTEngine.parseSalesPerson(salesRows);
${parseTargetLogic}`
);

// 3. Inject rendering function hook
const hookLogic = `
        // =========================
        // STORE SALES INTEGRATION
        // =========================
        if(typeof renderStoreSalesDashboard === "function"){
            renderStoreSalesDashboard();
        }
`;

pContent = pContent.replace(
    /updateDailyValidation\(\);\s*\}/,
    `updateDailyValidation();
}
${hookLogic}`
);

fs.writeFileSync(processPath, pContent);
console.log("process.js updated");
