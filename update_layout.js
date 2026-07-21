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
        let modTitle = getModuleName(mod);

        // Replace Header
        const headerRegex = /<header class="topbar"[\s\S]*?<\/header>/;
        
        const newHeader = `<header class="topbar" style="background: #0f172a; color: #ffffff; border-radius: 12px; padding: 24px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 24px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    <div class="brand" style="display: flex; align-items: center; gap: 20px;">
        <div class="logo-box" style="width:50px;height:50px;background:#FF00FF;border:4px solid #000;display:flex;align-items:center;justify-content:center;font-weight:bold;color:#000;box-shadow:4px 4px 0px #000;">KG</div>
        <div>
            <h1 style="margin: 0; font-size: 24px; color: #ffffff;">${modTitle}</h1>
            <p style="margin: 4px 0 8px 0; font-size: 14px; color: #94a3b8;">Created By : 2309445</p>
            <span class="version global-version-badge" style="background:transparent; border:1px solid #FFDF00; color:#FFDF00; padding:4px 12px; font-weight:bold; border-radius:12px; font-size:12px; display: inline-block;">Version 1.0</span>
        </div>
    </div>
    <div class="top-action">
        <div id="licenseStatusCard" class="license-status-card" data-plan="NONE" style="background: #1e293b; border: 2px solid #334155; border-radius: 12px; padding: 16px 20px; color: #f8fafc; min-width: 250px;">
            <div class="license-status-top" style="display:flex; align-items:center; gap:8px; margin-bottom:12px;">
                <span class="license-status-dot" style="width:10px; height:10px; background:#64748b; border-radius:50%; display:inline-block;"></span>
                <span id="licensePlan" style="font-weight:bold; font-size:14px; color:#f8fafc;">NOT AUTHORIZED</span>
            </div>
            <div class="license-status-info" style="display:flex; justify-content:space-between; gap:20px; font-size:13px; border-bottom: 1px solid #334155; padding-bottom: 12px; margin-bottom: 12px;">
                <span style="color:#94a3b8;">USER ID</span>
                <strong id="licenseUserId" style="font-family:monospace; color:#ffffff;">-</strong>
            </div>
            <div class="license-status-footer">
                <span id="licenseAccessInfo" style="font-size:11px; color:#94a3b8; letter-spacing: 0.5px;">PROCESS DAILY CASH TO VERIFY ACCESS</span>
            </div>
        </div>
    </div>
</header>`;

        if (headerRegex.test(content)) {
            content = content.replace(headerRegex, newHeader);
            fs.writeFileSync(htmlPath, content, 'utf8');
            console.log(`Updated header HTML for ${mod} with dark container`);
        }
    }
});
