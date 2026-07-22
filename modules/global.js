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
            if (e.target.closest('.no-drag')) return;
            
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

    // ==========================================
    // 5. USER GUIDANCE & POPUP MODAL FEATURE
    // ==========================================
    initUserGuidance();
});

// User Guidance Modules Data
const GT_MODULE_GUIDANCE = {
    'store-sales': {
        title: "Panduan: Store Sales Achievement",
        icon: "🏆",
        summary: "Modul ini digunakan untuk menganalisis pencapaian penjualan toko secara keseluruhan dibanding target dan data tahun sebelumnya (LY).",
        steps: [
            { step: "1. Upload File Data", desc: "Unggah file Excel: Merchandise Sales Report, Daily Cash Collection, Salesperson/ADV ORD, dan Sales Last Year." },
            { step: "2. Set Target Bulanan", desc: "Klik tombol 'SET MONTHLY TARGETS' untuk menginput target penjualan per bulan." },
            { step: "3. Klik Process", desc: "Klik 'PROCESS' untuk mengkalkulasi UPT, ATV, AUR, Total Sales, SM, Qty, dan perbandingan dengan LY." },
            { step: "4. Analisis & Export", desc: "Gunakan filter rentang waktu/periode, lalu gunakan tombol 'EXPORT EXCEL' atau 'PRINT REPORT'." }
        ],
        tips: "Pastikan format file Excel sesuai dengan template yang dapat diunduh pada tombol TEMPLATE."
    },
    'sales-staff': {
        title: "Panduan: Sales Staff Performance",
        icon: "📊",
        steps: [
            { step: "1. Upload Data Staf", desc: "Unggah file Excel data penjualan per staf / Sales Memo." },
            { step: "2. Filter Multi-Select Staf", desc: "Pilih 1 atau beberapa staf pada dropdown 'STAFF FILTER' dan tentukan rentang tanggal kalender." },
            { step: "3. Analisis Pie Chart", desc: "Grafik Pie Chart otomatis menampilkan distribusi Sales (Rp), Qty, UPT, RPT, dan kontribusi staf." },
            { step: "4. Download Grafik & Laporan", desc: "Gunakan tombol 'DOWNLOAD CHART' atau cetak rangkuman performa staf." }
        ],
        tips: "Nilai kontribusi staf dihitung berdasarkan total sales staf dibagi total sales seluruh toko pada periode terpilih."
    },
    'sales-hourly': {
        title: "Panduan: Sales Hourly Analysis",
        icon: "🕒",
        steps: [
            { step: "1. Upload File Transaksi Jam-jaman", desc: "Unggah file data transaksi yang memuat stempel jam transaksi." },
            { step: "2. Analisis Jam Puncak (Peak Hours)", desc: "Periksa grafik jam per jam untuk mengidentifikasi jam dengan trafik dan penjualan tertinggi." },
            { step: "3. Evaluasi Penjadwalan Staf", desc: "Gunakan data jam sibuk untuk mengoptimalkan jumlah staf yang bertugas di toko." }
        ],
        tips: "Memantau jam puncak membantu efisiensi alokasi tim sales pada jam-jam paling krusial."
    },
    'auto-stock': {
        title: "Panduan: Auto Stock Dashboard",
        icon: "📦",
        steps: [
            { step: "1. Upload Master Stock & Sales", desc: "Unggah file stok barang dan laporan penjualan terkini." },
            { step: "2. Filter Produk", desc: "Gunakan sidebar filter kiri (Pencarian artikel, harga min/max, brand, kategori, gender, diskon)." },
            { step: "3. Cek Rekomendasi Restock", desc: "Sistem otomatis menghitung sisa stok dan memberi rekomendasi jumlah pengisian stok (Auto Stock)." },
            { step: "4. Simpan Preset & Export", desc: "Gunakan fitur Preset untuk menyimpan kombinasi filter favorit Anda." }
        ],
        tips: "Tinggi tabel akan menyesuaikan secara dinamis dengan panjang sidebar filter di sebelah kiri."
    },
    'broken-size': {
        title: "Panduan: Broken Size & IL Ratio",
        icon: "📐",
        steps: [
            { step: "1. Upload Master Stock Size", desc: "Unggah file stok produk yang berisi rincian ukuran (size matrix)." },
            { step: "2. Periksa Status Broken Size", desc: "Filter berdasarkan Brand/Category untuk melihat artikel yang ukuran produknya sudah tidak lengkap (Broken Size)." },
            { step: "3. Evaluasi Rasio IL", desc: "Periksa kolom rasio IL untuk menentukan artikel mana yang perlu diprioritaskan dalam program diskon/clearing." }
        ],
        tips: "Status BROKEN memudahkan tim merchandiser dalam mengambil tindakan cuci gudang atau retur."
    },
    'change-price': {
        title: "Panduan: Change Price Analysis",
        icon: "🏷️",
        steps: [
            { step: "1. Upload File Perubahan Harga", desc: "Unggah file Excel daftar perubahan diskon dan harga baru." },
            { step: "2. Filter & Sortir Diskon", desc: "Filter berdasarkan status perubahan (TRUE = Berubah / FALSE = Tetap), Brand, Kategori, atau Tingkat Diskon." },
            { step: "3. Cetak & Export", desc: "Periksa estimasi perubahan harga baru lalu cetak atau export data untuk kebutuhan label harga toko." }
        ],
        tips: "Gunakan fitur Sort By (Qty Tertinggi/Terendah) untuk memprioritaskan barang dengan stok terbesar."
    }
};

function initUserGuidance() {
    // Determine current module from URL path or body dataset
    const path = window.location.pathname;
    let moduleKey = '';
    
    if (path.includes('store-sales')) moduleKey = 'store-sales';
    else if (path.includes('sales-staff')) moduleKey = 'sales-staff';
    else if (path.includes('sales-hourly')) moduleKey = 'sales-hourly';
    else if (path.includes('auto-stock')) moduleKey = 'auto-stock';
    else if (path.includes('broken-size')) moduleKey = 'broken-size';
    else if (path.includes('change-price')) moduleKey = 'change-price';

    const info = GT_MODULE_GUIDANCE[moduleKey] || {
        title: "Panduan Dashboard Store Management",
        icon: "💡",
        steps: [
            { step: "1. Pilih Modul", desc: "Pilih modul di sidebar kiri sesuai analisis yang ingin dilakukan." },
            { step: "2. Upload Data", desc: "Unggah data Excel yang sesuai pada bagian upload file." },
            { step: "3. Filter & Export", desc: "Gunakan filter interaktif lalu export laporan dalam bentuk Excel atau Print." }
        ],
        tips: "Pastikan format file Excel sesuai spesifikasi modul."
    };

    // 1. Create Floating / Topbar Guidance Button
    const helpBtn = document.createElement("button");
    helpBtn.id = "gtGuidanceBtn";
    helpBtn.className = "no-drag";
    helpBtn.style.cssText = `
        position: fixed;
        bottom: 20px;
        right: 20px;
        z-index: 9999;
        background: #FFDF00;
        color: #111;
        border: 3px solid #111;
        box-shadow: 4px 4px 0px #111;
        padding: 10px 16px;
        font-family: 'Space Mono', monospace, sans-serif;
        font-weight: 800;
        font-size: 13px;
        cursor: pointer;
        display: flex;
        align-items: center;
        gap: 8px;
        border-radius: 8px;
        transition: transform 0.15s ease, box-shadow 0.15s ease;
    `;
    helpBtn.innerHTML = `<span>${info.icon}</span> <span>PANDUAN / HELP</span>`;
    helpBtn.title = "Klik untuk membuka panduan & cara penggunaan modul ini";

    // Tooltip Hover effect
    helpBtn.addEventListener('mouseenter', () => {
        helpBtn.style.transform = 'translate(-2px, -2px)';
        helpBtn.style.boxShadow = '6px 6px 0px #111';
    });
    helpBtn.addEventListener('mouseleave', () => {
        helpBtn.style.transform = 'none';
        helpBtn.style.boxShadow = '4px 4px 0px #111';
    });

    document.body.appendChild(helpBtn);

    // 2. Create Modal Overlay
    const modalOverlay = document.createElement("div");
    modalOverlay.id = "gtGuidanceModal";
    modalOverlay.className = "no-drag";
    modalOverlay.style.cssText = `
        position: fixed;
        inset: 0;
        background: rgba(0, 0, 0, 0.65);
        backdrop-filter: blur(3px);
        z-index: 99999;
        display: none;
        align-items: center;
        justify-content: center;
        padding: 20px;
    `;

    const modalBox = document.createElement("div");
    modalBox.style.cssText = `
        background: #ffffff;
        border: 4px solid #111;
        box-shadow: 8px 8px 0px #111;
        max-width: 600px;
        width: 100%;
        max-height: 85vh;
        overflow-y: auto;
        padding: 24px;
        font-family: 'Space Mono', monospace, sans-serif;
        color: #111;
        position: relative;
    `;

    let stepsHTML = info.steps.map(s => `
        <div style="background:#f8fafc; border:2px solid #111; padding:12px 14px; margin-bottom:10px; border-radius:6px;">
            <strong style="color:#000; font-size:14px; display:block; margin-bottom:4px;">${s.step}</strong>
            <span style="font-size:12px; color:#444; line-height:1.4;">${s.desc}</span>
        </div>
    `).join('');

    modalBox.innerHTML = `
        <div style="display:flex; justify-content:space-between; align-items:center; border-bottom:3px solid #111; padding-bottom:12px; margin-bottom:16px;">
            <div style="display:flex; align-items:center; gap:10px;">
                <span style="font-size:24px;">${info.icon}</span>
                <h2 style="font-size:16px; margin:0; font-weight:800; text-transform:uppercase;">${info.title}</h2>
            </div>
            <button id="gtCloseGuidance" style="background:#fff; border:2px solid #111; width:30px; height:30px; font-weight:bold; cursor:pointer; box-shadow:2px 2px 0 #111;">✕</button>
        </div>
        
        ${info.summary ? `<p style="font-size:12px; font-weight:bold; background:#e0f2fe; border:2px solid #0284c7; padding:10px; margin-bottom:16px;">💡 ${info.summary}</p>` : ''}
        
        <div style="margin-bottom:16px;">
            <h4 style="font-size:13px; margin-bottom:10px; letter-spacing:1px;">LANGKAH-LANGKAH PENGGUNAAN:</h4>
            ${stepsHTML}
        </div>

        ${info.tips ? `
        <div style="background:#fef3c7; border:2px solid #d97706; padding:10px; font-size:12px; font-weight:bold; margin-bottom:16px;">
            📌 TIPS: ${info.tips}
        </div>
        ` : ''}

        <div style="display:flex; justify-content:flex-end; gap:10px; border-top:2px solid #111; padding-top:14px;">
            <button id="gtCloseGuidanceBtn" style="background:#FFDF00; color:#111; border:3px solid #111; padding:8px 20px; font-weight:bold; cursor:pointer; box-shadow:3px 3px 0 #111;">MENGERTI (CLOSE)</button>
        </div>
    `;

    modalOverlay.appendChild(modalBox);
    document.body.appendChild(modalOverlay);

    // Event Listeners for Open & Close
    helpBtn.addEventListener('click', () => {
        modalOverlay.style.display = 'flex';
    });

    const closeModal = () => {
        modalOverlay.style.display = 'none';
    };

    modalBox.querySelector('#gtCloseGuidance').addEventListener('click', closeModal);
    modalBox.querySelector('#gtCloseGuidanceBtn').addEventListener('click', closeModal);
    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) closeModal();
    });
}

