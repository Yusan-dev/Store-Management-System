const fs = require('fs');
const path = require('path');

const modulesDir = path.join(__dirname, 'modules');
const modules = ['auto-stock', 'broken-size', 'change-price', 'sales-hourly', 'sales-staff', 'store-sales'];

const getModuleName = (folder) => {
    return folder.split('-').map(w => w.toUpperCase()).join(' ');
};

modules.forEach(mod => {
    const htmlPath = path.join(modulesDir, mod, 'index.html');
    if (fs.existsSync(htmlPath)) {
        let content = fs.readFileSync(htmlPath, 'utf8');

        // Extract current title
        let modTitle = `MAA ${getModuleName(mod)}`;
        if (mod === 'store-sales') modTitle = 'MAA STORE SALES';
        if (mod === 'sales-hourly') modTitle = 'MAA SALES HOURLY';

        // 1. Replace Header
        const headerRegex = /<header class="topbar">[\s\S]*?<\/header>/;
        
        const newHeader = `<header class="topbar">
    <div class="brand">
        <div class="logo-box" style="width:50px;height:50px;background:#FF00FF;border:4px solid #000;display:flex;align-items:center;justify-content:center;font-weight:bold;box-shadow:4px 4px 0px #000;margin-right:16px;">KG</div>
        <div>
            <h1>${modTitle}</h1>
            <p>Created By : 2309445</p>
            <span class="version global-version-badge" style="background:transparent; border:1px solid #FFDF00; color:#FFDF00; padding:2px 8px; font-weight:bold; border-radius:10px; font-size:11px;">Version 1.0</span>
        </div>
    </div>
    <div class="top-action">
        <div id="licenseStatusCard" class="license-status-card" data-plan="NONE">
            <div class="license-status-top">
                <span class="license-status-dot"></span>
                <span id="licensePlan">NOT AUTHORIZED</span>
            </div>
            <div class="license-status-info">
                <span>USER ID</span>
                <strong id="licenseUserId">-</strong>
            </div>
            <div class="license-status-footer">
                <span id="licenseAccessInfo">PROCESS DAILY CASH TO VERIFY ACCESS</span>
            </div>
        </div>
    </div>
</header>`;

        content = content.replace(headerRegex, newHeader);

        // 2. Remove any existing footer if there's one inside the container or something, 
        // actually we can just let JS inject it or we can hardcode the footer.
        // User said: "dan version 1.0 nanti bisa di rubah secara global untuk tempatnya dimana... footernya ini harus satu untuk semua".
        // The best way to make them globally editable is to link a shared JS file `modules/global.js`.
        
        // Let's add `<script src="../global.js"></script>` before `</body>` if it's not there.
        if (!content.includes('../global.js')) {
            content = content.replace('</body>', '    <script src="../global.js"></script>\n</body>');
        }

        fs.writeFileSync(htmlPath, content, 'utf8');
        console.log(`Updated header for ${mod}`);
    }
});
