// MAA DASHBOARD GLOBAL CACHE
// Saving dan memulihkan file upload otomatis menggunakan IndexedDB
// sehingga user tidak perlu upload ulang setiap refresh/pindah halaman.
(function () {
  const DB_NAME = "MAA_DASHBOARD_CACHE";
  const MOD_NAME =
    window.location.pathname.split("/").filter(Boolean).slice(-2)[0] ||
    "unknown";

  /**
   * Buka koneksi ke IndexedDB.
   * @returns {Promise<IDBDatabase>}
   */
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

  /**
   * Simpan semua file yang sedang ada di input[type=file] ke IndexedDB.
   */
  async function saveFiles() {
    try {
      const db = await initDB();
      const tx = db.transaction("file_cache", "readwrite");
      const store = tx.objectStore("file_cache");

      const inputs = document.querySelectorAll('input[type="file"]');
      for (let input of inputs) {
        if (!input.id || !input.files || input.files.length === 0) continue;
        const file = input.files[0];
        const data = await file.arrayBuffer();
        store.put(
          { name: file.name, type: file.type, data },
          `${MOD_NAME}_${input.id}`
        );
      }
    } catch (e) {
      console.error("[db-cache] saveFiles error:", e);
    }
  }

  /**
   * Ambil satu file dari IndexedDB berdasarkan key.
   * @param {IDBObjectStore} store
   * @param {string} key
   * @returns {Promise<{name,type,data}|null>}
   */
  function getRecord(store, key) {
    return new Promise((resolve) => {
      const req = store.get(key);
      req.onsuccess = (e) => resolve(e.target.result || null);
      req.onerror = () => resolve(null);
    });
  }

  /**
   * Pulihkan semua file dari IndexedDB ke input[type=file].
   * Jika cukup file berhasil dipulihkan, tombol PROSES diklik otomatis.
   */
  async function loadFiles() {
    try {
      const db = await initDB();
      const tx = db.transaction("file_cache", "readonly");
      const store = tx.objectStore("file_cache");

      const inputs = [...document.querySelectorAll('input[type="file"]')].filter(
        (i) => i.id
      );

      if (inputs.length === 0) return;

      // Ambil semua record secara paralel (Promise.all)
      const records = await Promise.all(
        inputs.map((input) => getRecord(store, `${MOD_NAME}_${input.id}`))
      );

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

      // Klik proses jika minimal 1 file berhasil dipulihkan
      // (untuk store-sales yang bisa berjalan tanpa file target karena ada di localStorage)
      const minRequired = inputs.length >= 4 ? 3 : inputs.length;
      if (loadedCount >= minRequired) {
        setTimeout(() => {
          const btn =
            document.getElementById("process") ||
            document.getElementById("processBtn");
          const form = document.getElementById("uploadForm");
          if (form) {
            form.dispatchEvent(
              new Event("submit", { cancelable: true, bubbles: true })
            );
          } else if (btn) {
            btn.click();
          }
        }, 1200);
      }
    } catch (e) {
      console.error("[db-cache] loadFiles error:", e);
    }
  }

  window.addEventListener("load", () => {
    const inputs = document.querySelectorAll('input[type="file"]');
    inputs.forEach((input) => input.addEventListener("change", saveFiles));
    setTimeout(loadFiles, 500);
  });
})();

