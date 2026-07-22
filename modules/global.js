// modules/global.js

// ==========================================
// GLOBAL CONFIGURATION
// Edit these values to update all modules globally
// ==========================================
const GT_GLOBAL_CONFIG = {
    version: "Version 1.2",
    footerHTML: `
      <div style="display:flex; justify-content:center; gap:20px; align-items:center; flex-wrap:wrap; font-size:12px;">
        <div>📧 yusup.gunners@gmail.com</div>
        <div>☕ Buy me a coffee: <a href="https://trakteer.id/muhammad_yusuf525" target="_blank" style="color:inherit; text-decoration:underline;">Trakteer</a></div>
        <div><strong>STORE MANAGEMENT SYSTEM</strong> &copy; 2026</div>
      </div>
    `
};

document.addEventListener("DOMContentLoaded", () => {
    // 1. Update Version Badges
    const versionBadges = document.querySelectorAll(".global-version-badge");
    versionBadges.forEach(badge => {
        badge.innerHTML = GT_GLOBAL_CONFIG.version;
    });

    // 2. Inject Global Footer (Neobrutalism style)
    let container = document.querySelector(".container");
    if (!container) container = document.body;

    if (!document.querySelector(".gt-global-footer")) {
        const footer = document.createElement("footer");
        footer.className = "gt-global-footer footer";
        footer.style.textAlign = "center";
        footer.style.padding = "20px";
        footer.style.marginTop = "24px";
        footer.style.fontSize = "13px";
        footer.style.border = "4px solid #111";
        footer.style.background = "#fff";
        footer.style.boxShadow = "6px 6px 0px #111";
        footer.style.fontWeight = "bold";
        footer.innerHTML = GT_GLOBAL_CONFIG.footerHTML;
        
        container.appendChild(footer);
    }

    // 3. Apply Global User ID
    const globalUserId = localStorage.getItem("gt_global_user_id");
    if (globalUserId) {
        const uidEl = document.getElementById("licenseUserId");
        if (uidEl) uidEl.innerText = globalUserId;
    }

    // 4. Drag to Scroll Feature (For all scrollable areas)
    function enableDragToScroll(el) {
        let isDown = false;
        let startX, startY, scrollLeft, scrollTop;

        el.addEventListener('mousedown', (e) => {
            // Ignore if clicking on input, select, button, checkbox, etc.
            if (e.target.tagName.match(/INPUT|TEXTAREA|SELECT|BUTTON|A|LABEL/i)) return;
            
            isDown = true;
            el.classList.add('dragging');
            el.style.cursor = 'grabbing';
            startX = e.pageX - el.offsetLeft;
            startY = e.pageY - el.offsetTop;
            scrollLeft = el.scrollLeft;
            scrollTop = el.scrollTop;
        });

        el.addEventListener('mouseleave', () => {
            isDown = false;
            el.style.cursor = '';
        });

        el.addEventListener('mouseup', () => {
            isDown = false;
            el.style.cursor = '';
        });

        el.addEventListener('mousemove', (e) => {
            if (!isDown) return;
            e.preventDefault();
            const x = e.pageX - el.offsetLeft;
            const y = e.pageY - el.offsetTop;
            const walkX = (x - startX) * 1.5; // Scroll speed multiplier
            const walkY = (y - startY) * 1.5;
            el.scrollLeft = scrollLeft - walkX;
            el.scrollTop = scrollTop - walkY;
        });
    }

    // Apply to main containers and table wrappers
    const scrollContainers = document.querySelectorAll('.table-wrap, .table-container, .main-layout, .container, body');
    scrollContainers.forEach(enableDragToScroll);
});
