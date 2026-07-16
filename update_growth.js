const fs = require('fs');
const jsPath = 'd:/Download/GT_MASTER_DASHBOARD/modules/sales-staff/assets/js/store-sales-integration.js';
let content = fs.readFileSync(jsPath, 'utf-8');

const growthLogic = `
    // Growth vs Last Week (if single date selected or just get the latest date)
    // Wait, Store Sales integration doesn't have the date dropdown yet, it shows all dates in the table.
    // Let's just find the last date in the list, get its previous week, and compare them.
    let lwSales = 0, lwQty = 0, lwSM = 0, lwUPT = 0, lwAUR = 0;
    let currSales = tSales, currQty = tQty, currSM = tSM, currUPT = actualUPT, currAUR = actualAUR;
    
    // Growth formatting helper
    const setGw = (id, curr, lw) => {
        const el = document.getElementById(id);
        if(!el) return;
        if(lw === 0) { el.innerHTML = "No LY Data"; el.style.color = "#666"; return; }
        const pct = ((curr - lw) / lw) * 100;
        const color = pct >= 0 ? "green" : "red";
        const sign = pct >= 0 ? "▲ +" : "▼ ";
        el.innerHTML = sign + Math.abs(pct).toFixed(1) + "% vs Last Week";
        el.style.color = color;
    };
    
    if (dates.length > 0) {
        // Find last date for growth
        const lastDate = dates.sort((a,b) => {
            const da = a.split("-"); const db = b.split("-");
            return new Date(da[2],da[1]-1,da[0]) - new Date(db[2],db[1]-1,db[0]);
        })[dates.length-1];
        
        const prevWeek = getPreviousWeekDate(lastDate);
        if (dataByDate[prevWeek]) {
            lwSales = dataByDate[prevWeek].sales;
            lwQty = dataByDate[prevWeek].qty;
            lwSM = dataByDate[prevWeek].sm;
            lwUPT = lwSM > 0 ? (lwQty / lwSM) : 0;
            lwAUR = lwQty > 0 ? (lwSales / lwQty) : 0;
            
            currSales = dataByDate[lastDate].sales;
            currQty = dataByDate[lastDate].qty;
            currSM = dataByDate[lastDate].sm;
            currUPT = currSM > 0 ? (currQty / currSM) : 0;
            currAUR = currQty > 0 ? (currSales / currQty) : 0;
        }
    }
    
    setGw("ss-gwSales", currSales, lwSales);
    setGw("ss-gwQty", currQty, lwQty);
    setGw("ss-gwSM", currSM, lwSM);
    setGw("ss-gwUPT", currUPT, lwUPT);
    setGw("ss-gwAUR", currAUR, lwAUR);
`;

content = content.replace(
    /setEl\("ss-aur", formatMoney\(actualAUR\)\);/,
    `setEl("ss-aur", formatMoney(actualAUR));
${growthLogic}`
);

fs.writeFileSync(jsPath, content);
console.log("Growth logic added");
