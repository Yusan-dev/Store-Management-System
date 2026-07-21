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

        // Extract current title without "MAA "
        let modTitle = getModuleName(mod);

        // Replace Header
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
        fs.writeFileSync(htmlPath, content, 'utf8');
        console.log(`Updated header HTML for ${mod}`);
    }

    // Fix magenta CSS issue in dashboard.css
    const cssPath = path.join(modulesDir, mod, 'assets', 'css', 'dashboard.css');
    if (fs.existsSync(cssPath)) {
        let cssContent = fs.readFileSync(cssPath, 'utf8');
        
        // Let's replace any `background: #FF00FF;` inside `.topbar` block. 
        // Actually, let's just globally replace `background: #FF00FF;` with `/* removed background: #FF00FF; */` 
        // but only if it's near `.topbar`. Or just replace `background: #FF00FF;` and `background:#FF00FF;` inside dashboard.css?
        // Wait, the .logo-box also uses #FF00FF. So we can't do a global replace in the HTML. But in CSS it's safe if .logo-box isn't in CSS.
        // Let's be safer and use regex for .topbar { ... background: #FF00FF; ... }
        
        let modified = false;
        if (cssContent.includes('.topbar{') || cssContent.includes('.topbar {')) {
            // simpler way: replace `background: #FF00FF;` with `background: transparent;`
            const topbarIndex = cssContent.indexOf('.topbar');
            if (topbarIndex !== -1) {
                // Find next closing brace
                const closeBrace = cssContent.indexOf('}', topbarIndex);
                if (closeBrace !== -1) {
                    const block = cssContent.substring(topbarIndex, closeBrace);
                    if (block.includes('background: #FF00FF;')) {
                        const newBlock = block.replace('background: #FF00FF;', 'background: transparent;');
                        cssContent = cssContent.substring(0, topbarIndex) + newBlock + cssContent.substring(closeBrace);
                        modified = true;
                    } else if (block.includes('background:#FF00FF;')) {
                        const newBlock = block.replace('background:#FF00FF;', 'background: transparent;');
                        cssContent = cssContent.substring(0, topbarIndex) + newBlock + cssContent.substring(closeBrace);
                        modified = true;
                    }
                }
            }
        }
        
        if (modified) {
            fs.writeFileSync(cssPath, cssContent, 'utf8');
            console.log(`Updated CSS for ${mod} (removed magenta topbar background)`);
        }
    }
});
