// modules/global.js

// ==========================================
// GLOBAL CONFIGURATION
// Edit these values to update all modules globally
// ==========================================
const GT_GLOBAL_CONFIG = {
    version: "Version 1.0",
    footerText: "Copyright &copy; 2026 MAA KANGODING. All Rights Reserved."
};

document.addEventListener("DOMContentLoaded", () => {
    // 1. Update Version Badges
    const versionBadges = document.querySelectorAll(".global-version-badge");
    versionBadges.forEach(badge => {
        badge.innerHTML = GT_GLOBAL_CONFIG.version;
    });

    // 2. Inject Global Footer
    // Try to append it to the main container, otherwise append to body
    let container = document.querySelector(".container");
    if (!container) {
        container = document.body;
    }

    // Check if a global footer already exists to prevent duplicates
    if (!document.querySelector(".gt-global-footer")) {
        const footer = document.createElement("footer");
        footer.className = "gt-global-footer";
        footer.style.textAlign = "center";
        footer.style.padding = "20px";
        footer.style.marginTop = "30px";
        footer.style.fontSize = "12px";
        footer.style.color = "#888";
        footer.style.borderTop = "1px solid #333";
        footer.style.fontFamily = "monospace";
        footer.innerHTML = GT_GLOBAL_CONFIG.footerText;
        
        container.appendChild(footer);
    }

    // 3. Apply Global User ID from LocalStorage
    const globalUserId = localStorage.getItem("gt_global_user_id");
    if (globalUserId) {
        const uidEl = document.getElementById("licenseUserId");
        if (uidEl) {
            uidEl.innerText = globalUserId;
        }
    }
});
