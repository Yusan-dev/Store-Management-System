(function () {
  const DB_NAME = "MAA_DASHBOARD_CACHE";
  const MOD_NAME = window.location.pathname.split("/").filter(Boolean).slice(-2)[0] || "unknown";
  
  function initDB() {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        if (!db.objectStoreNames.contains("file_cache")) {
          db.createObjectStore("file_cache");
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async function saveFiles() {
    try {
      const inputs = document.querySelectorAll('input[type="file"]');
      const filesToSave = [];
      
      for (let input of inputs) {
        if (!input.id || !input.files || input.files.length === 0) continue;
        const file = input.files[0];
        const data = await file.arrayBuffer();
        filesToSave.push({
           id: MOD_NAME + "_" + input.id,
           record: { name: file.name, type: file.type, data }
        });
      }

      if (filesToSave.length === 0) return;

      const db = await initDB();
      const tx = db.transaction("file_cache", "readwrite");
      const store = tx.objectStore("file_cache");
      
      for (let item of filesToSave) {
        store.put(item.record, item.id);
      }
    } catch (e) {
      console.error("Auto-Load Save Error:", e);
    }
  }

  function getRecord(store, key) {
    return new Promise((resolve) => {
      const req = store.get(key);
      req.onsuccess = (e) => resolve(e.target.result || null);
      req.onerror = () => resolve(null);
    });
  }

  async function loadFiles() {
    try {
      if(typeof DataTransfer === 'undefined') return;
      
      const db = await initDB();
      const tx = db.transaction("file_cache", "readonly");
      const store = tx.objectStore("file_cache");
      const inputs = [...document.querySelectorAll('input[type="file"]')].filter(i => i.id);
      
      if (inputs.length === 0) return;
      
      const records = await Promise.all(inputs.map(input => getRecord(store, MOD_NAME + "_" + input.id)));
      let loadedCount = 0;
      
      records.forEach((record, idx) => {
        if (!record) return;
        const blob = new Blob([record.data], { type: record.type });
        const file = new File([blob], record.name, { type: record.type });
        const dt = new DataTransfer();
        dt.items.add(file);
        inputs[idx].files = dt.files;
        inputs[idx].dispatchEvent(new Event("change", { bubbles: true }));
        loadedCount++;
      });
      
      const minRequired = inputs.length >= 4 ? 3 : inputs.length;
      if (loadedCount >= minRequired) {
        setTimeout(() => {
          const btn = document.getElementById("process") || document.getElementById("processBtn");
          const form = document.getElementById("uploadForm");
          if (form) form.dispatchEvent(new Event("submit", { cancelable: true, bubbles: true }));
          else if (btn) btn.click();
        }, 1200);
      }
    } catch (e) {
      console.error("Auto-Load Load Error:", e);
    }
  }

  window.addEventListener("load", () => {
    const inputs = document.querySelectorAll('input[type="file"]');
    inputs.forEach(input => input.addEventListener("change", saveFiles));
    setTimeout(loadFiles, 500);
  });
})();
