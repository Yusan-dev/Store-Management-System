const fs = require('fs');
const htmlPath = 'd:/Download/GT_MASTER_DASHBOARD/modules/sales-staff/index.html';
let html = fs.readFileSync(htmlPath, 'utf-8');

// Replace everything inside <div class="upload-grid"> to include the new inputs
const newUploadGrid = `
<div class="upload-grid" style="display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px;">
    <div class="upload-box">
        <label>DAILY CASH COLLECTION</label>
        <input type="file" id="dailyCash" accept=".xls,.xlsx">
        <div id="dailyCashName" class="filename">Belum dipilih</div>
    </div>
    <div class="upload-box">
        <label>MERCHANDISE SALES REPORT</label>
        <input type="file" id="msr" accept=".xls,.xlsx">
        <div id="msrName" class="filename">Belum dipilih</div>
    </div>
    <div class="upload-box">
        <label>SALESPERSON / ADV ORD</label>
        <input type="file" id="salesPerson" accept=".xls,.xlsx">
        <div id="salesPersonName" class="filename">Belum dipilih</div>
    </div>
    <div class="upload-box">
        <label>TARGET HARIAN</label>
        <input type="file" id="target" accept=".xls,.xlsx">
        <div id="targetName" class="filename">Belum dipilih</div>
    </div>
</div>
<div class="upload-grid" style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin-top: 15px;">
    <div class="upload-box">
        <label>TARGET STORE (Bulan)</label>
        <input type="number" id="targetStore" placeholder="Contoh: 100000000" style="width: 100%; border: 2px solid #111; padding: 6px; font-weight: 600; font-family: monospace; background: transparent;">
    </div>
    <div class="upload-box">
        <label>TARGET UPT</label>
        <input type="number" step="0.01" id="targetUPT" placeholder="Contoh: 1.5" style="width: 100%; border: 2px solid #111; padding: 6px; font-weight: 600; font-family: monospace; background: transparent;">
    </div>
    <div class="upload-box">
        <label>TARGET AUR</label>
        <input type="number" id="targetAUR" placeholder="Contoh: 350000" style="width: 100%; border: 2px solid #111; padding: 6px; font-weight: 600; font-family: monospace; background: transparent;">
    </div>
</div>
`;

html = html.replace(/<div class="upload-grid">[\s\S]*?<\/div>\s*<\/div>/, newUploadGrid);

// Now, insert the Store Sales section before the summary section
const storeSalesSection = `
<section class="store-sales-section" id="storeSalesSection" style="display:none; margin-top: 30px;">
    <div style="background: #333; color: white; padding: 10px; border-radius: 4px; margin-bottom: 20px;">
        <h2 style="margin:0; font-size: 18px;">STORE SALES ACHIEVEMENT</h2>
    </div>

    <div class="summary" style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 15px; margin-bottom: 20px;">
        <div class="summary-card"><span class="summary-title">TOTAL SALES</span><h2 id="ss-totalSales">0</h2><div id="ss-gwSales" style="font-size:12px; font-weight:bold; margin-top:5px;"></div></div>
        <div class="summary-card"><span class="summary-title">TOTAL QTY</span><h2 id="ss-totalQty">0</h2><div id="ss-gwQty" style="font-size:12px; font-weight:bold; margin-top:5px;"></div></div>
        <div class="summary-card"><span class="summary-title">TOTAL SM</span><h2 id="ss-totalSM">0</h2><div id="ss-gwSM" style="font-size:12px; font-weight:bold; margin-top:5px;"></div></div>
        <div class="summary-card"><span class="summary-title">UPT</span><h2 id="ss-upt">0</h2><div id="ss-gwUPT" style="font-size:12px; font-weight:bold; margin-top:5px;"></div></div>
        <div class="summary-card"><span class="summary-title">AUR</span><h2 id="ss-aur">0</h2><div id="ss-gwAUR" style="font-size:12px; font-weight:bold; margin-top:5px;"></div></div>
    </div>

    <div style="display: grid; grid-template-columns: 2fr 1fr; gap: 20px; margin-bottom: 20px;">
        <div class="validation-card" style="margin:0;">
            <h3>Summary Categories</h3>
            <table class="validation-table" style="width: 100%;">
                <thead>
                    <tr><th>Category</th><th>Sales</th><th>SM (Inv)</th><th>Qty</th></tr>
                </thead>
                <tbody id="ss-categoryBody">
                    <tr><td>Total Store</td><td id="cat-totalSales">0</td><td id="cat-totalSM">0</td><td id="cat-totalQty">0</td></tr>
                    <tr><td>Bag</td><td id="cat-bagSales">0</td><td>-</td><td id="cat-bagQty">0</td></tr>
                    <tr><td>Apparel</td><td id="cat-appSales">0</td><td>-</td><td id="cat-appQty">0</td></tr>
                    <tr><td>Accessories</td><td id="cat-accSales">0</td><td>-</td><td id="cat-accQty">0</td></tr>
                    <tr><td>O2O (Online)</td><td id="cat-o2oSales">0</td><td id="cat-o2oSM">0</td><td id="cat-o2oQty">0</td></tr>
                </tbody>
            </table>
        </div>
        <div class="validation-card" style="margin:0;">
            <h3>Top 5 Articles</h3>
            <div style="margin-bottom: 10px;"><strong>Top Sales:</strong><div id="ss-topSales"></div></div>
            <div style="margin-bottom: 10px;"><strong>Top Qty:</strong><div id="ss-topQty"></div></div>
            <div><strong>Top Footwear (Qty):</strong><div id="ss-topFootwear"></div></div>
        </div>
    </div>

    <div class="validation-card" style="margin:0;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px;">
            <h3 style="margin:0;">Daily Sales Achievement vs Target</h3>
            <button onclick="exportStoreSalesExcel()" style="padding: 5px 15px; background: #28a745; color: white; border: none; cursor: pointer; border-radius: 4px;">Export Excel</button>
        </div>
        <table class="validation-table" style="width: 100%;">
            <thead>
                <tr>
                    <th>DATE</th><th>SALES</th><th>SM</th><th>QTY</th><th>UPT</th><th>AUR</th>
                    <th>BAG QTY</th><th>APP QTY</th><th>ACC QTY</th><th>O2O SALES</th>
                </tr>
            </thead>
            <tbody id="ss-dailyBody">
            </tbody>
        </table>
    </div>
</section>

<div style="background: #333; color: white; padding: 10px; border-radius: 4px; margin-top: 40px; margin-bottom: 20px;">
    <h2 style="margin:0; font-size: 18px;">STAFF PERFORMANCE</h2>
</div>
`;

html = html.replace(/<section class="summary">/, storeSalesSection + '\n<section class="summary">');

fs.writeFileSync(htmlPath, html);
console.log("HTML successfully updated");
