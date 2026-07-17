// MAA DASHBOARD GLOBAL CACHE
(function() {
    const DB_NAME = "MAA_DASHBOARD_CACHE";
    const MOD_NAME = window.location.pathname.split('/').filter(Boolean).slice(-2)[0] || "unknown"; 

    function initDB() {
        return new Promise((resolve, reject) => {
            const req = indexedDB.open(DB_NAME, 1);
            req.onupgradeneeded = e => {
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
            const filesToSave = [];
            const inputs = document.querySelectorAll('input[type="file"]');
            for (let input of inputs) {
                if (input.files && input.files.length > 0) {
                    const file = input.files[0];
                    const arrayBuffer = await file.arrayBuffer();
                    filesToSave.push({
                        id: input.id,
                        name: file.name,
                        type: file.type,
                        data: arrayBuffer
                    });
                }
            }
            
            const db = await initDB();
            const tx = db.transaction("file_cache", "readwrite");
            const store = tx.objectStore("file_cache");
            for (let f of filesToSave) {
                store.put({ name: f.name, type: f.type, data: f.data }, `${MOD_NAME}_${f.id}`);
            }
        } catch(e) { console.error(e); }
    }

    async function loadFiles() {
        try {
            const db = await initDB();
            const tx = db.transaction("file_cache", "readonly");
            const store = tx.objectStore("file_cache");
            
            const inputs = document.querySelectorAll('input[type="file"]');
            let loadedCount = 0;
            let totalExpected = 0;
            
            for(let input of inputs){
                if(input.id) totalExpected++;
            }

            if(totalExpected === 0) return;

            for (let input of inputs) {
                if(!input.id) continue;
                const req = store.get(`${MOD_NAME}_${input.id}`);
                req.onsuccess = e => {
                    const record = e.target.result;
                    if (record) {
                        const blob = new Blob([record.data], { type: record.type });
                        const file = new File([blob], record.name, { type: record.type });
                        const dt = new DataTransfer();
                        dt.items.add(file);
                        input.files = dt.files;
                        input.dispatchEvent(new Event('change', { bubbles: true }));
                        loadedCount++;
                    }
                };
            }
            
            tx.oncomplete = () => {
                if (loadedCount > 0 && loadedCount >= totalExpected) {
                    setTimeout(() => {
                        const form = document.getElementById('uploadForm');
                        if (form) {
                            form.dispatchEvent(new Event('submit', { cancelable: true, bubbles: true }));
                        } else {
                            const btn = document.getElementById('process') || document.getElementById('processBtn');
                            if (btn) btn.click();
                        }
                    }, 1000);
                }
            };
        } catch (e) { console.error(e); }
    }

    window.addEventListener('load', () => {
        const inputs = document.querySelectorAll('input[type="file"]');
        inputs.forEach(input => input.addEventListener('change', saveFiles));
        setTimeout(loadFiles, 300);
    });
})();
