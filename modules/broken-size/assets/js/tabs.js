/* ========================================
   GT BROKEN SIZE - TABS.JS
   Tab switching between Broken Size & IL
   ======================================== */

window.addEventListener("load", () => {
  const tabButtons = document.querySelectorAll(".tab-btn");

  tabButtons.forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;

      // Update button states
      tabButtons.forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");

      // Update content visibility
      document.querySelectorAll(".tab-content").forEach((tab) => {
        tab.classList.remove("active");
      });

      const targetTab = document.getElementById("tab-" + target);
      if (targetTab) {
        targetTab.classList.add("active");
      }
    });
  });
});
