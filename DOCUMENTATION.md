# GT MASTER DASHBOARD — Complete User Guide & Technical Documentation

**Version:** 2.2 (Enhanced & Optimized)  
**Platform:** Web-based (Local / Server)  
**Created by:** KANGODING.ORG — ID: 2309445  

---

## Table of Contents

1. [System Requirements](#1-system-requirements)
2. [Installation & Setup](#2-installation--setup)
3. [Main Dashboard Navigation](#3-main-dashboard-navigation)
4. [Global Accessibility & User Guidance](#4-global-accessibility--user-guidance)
5. [Module 1: Store Sales Achievement](#5-module-1-store-sales-achievement)
6. [Module 2: Sales Staff Performance](#6-module-2-sales-staff-performance)
7. [Module 3: Sales Hourly](#7-module-3-sales-hourly)
8. [Module 4: Auto Stock Dashboard](#8-module-4-auto-stock-dashboard)
9. [Module 5: Broken Size & Inventory Level](#9-module-5-broken-size--inventory-level)
10. [Module 6: Change Price](#10-module-6-change-price)
11. [Data Persistence & Auto-Load](#11-data-persistence--auto-load)
12. [Number Format Handling](#12-number-format-handling)
13. [Troubleshooting](#13-troubleshooting)

---

## 1. System Requirements

| Requirement | Specification |
|---|---|
| **Browser** | Google Chrome / Mozilla Firefox / Microsoft Edge (latest version) |
| **Operating System** | Windows 7+, macOS, Linux |
| **Internet** | Required only for initial font loading (Space Mono). All data parsing & processing is 100% offline & local. |
| **Local Server (Optional)** | Python 3.x, Node.js (`http-server`), or Java Tomcat |
| **Storage** | Minimal — browser localStorage for targets, presets, and cached reports |

---

## 2. Installation & Setup

### Option A: Open Directly (No Server)
1. Download & extract the `GT_MASTER_DASHBOARD` folder
2. Open `index.html` in your web browser
3. Done! ✅

### Option B: Local Server (Recommended)
**Using Python:**
```bash
cd GT_MASTER_DASHBOARD
python -m http.server 8080
# Open browser → http://localhost:8080
```

**Using Node.js:**
```bash
cd GT_MASTER_DASHBOARD
npx http-server -p 8080
# Open browser → http://localhost:8080
```

**Using Tomcat (Java):**
1. Run `create-war.bat` to generate `dashboard.war`
2. Copy `dashboard.war` to `tomcat/webapps/`
3. Restart Tomcat
4. Open browser → `http://localhost:8080/dashboard`

### Option C: GitHub Pages
1. Push to GitHub repository
2. Enable GitHub Pages in repository Settings
3. Access via `https://<username>.github.io/<repository>/`

---

## 3. Main Dashboard Navigation

When you open the dashboard, you'll see:

- **Left Sidebar** — Navigation menu with 6 modules
- **Main Content Area** — Displays the selected module in an iframe
- **Logo Area (KG)** — Click to collapse/expand sidebar

| Menu Icon | Module Name | Description |
|---|---|---|
| 🏆 | Store Sales Achievement | Daily sales tracking, target vs actual, LY comparison |
| 📊 | Sales Staff Performance | Per-staff performance, pie chart analysis, daily audit |
| 🕒 | Sales Hourly | Hourly sales shift breakdown & peak hours |
| 📦 | Auto Stock Dashboard | Stock position analysis with dynamic height matching filter |
| 📐 | Broken Size & IL | Size completeness & inventory level analysis |
| 🏷️ | Change Price | Price comparison & affected discount analysis |

---

## 4. Global Accessibility & User Guidance

### 4.1 Interactive User Guidance Modal (Pop-up Help)
Every module features a floating button in the bottom-right corner:
- **`❓ PANDUAN / HELP`** — Hovering displays a tooltip description. Clicking opens an in-app **Neobrutalism Modal Window** with step-by-step usage instructions tailored to the active module.

### 4.2 Drag-to-Scroll Support
Users can click and hold on table areas or scrollable containers to drag scroll horizontally and vertically. Form inputs, checkboxes, and custom dropdowns automatically bypass drag interception for smooth interaction.

### 4.3 Sticky Table Headers & Bounded Scroll Areas
Across all modules, long tables feature sticky column headers (`position: sticky; top: 0; z-index: 10;`) so table column headers remain visible while scrolling data vertically.

---

## 5. Module 1: Store Sales Achievement

### 5.1 Purpose
Track daily store sales performance against targets, with year-over-year (LY) comparison.

### 5.2 Required Upload Files

| # | File | Description | Format |
|---|---|---|---|
| 1 | **Merchandise Sales Report (MSR)** | Daily sales transactions | Excel (.xls/.xlsx) |
| 2 | **Daily Cash Collection** | Cash collection summary | Excel (.xls/.xlsx) |
| 3 | **Salesperson / Advance Order** | Staff order data | Excel (.xls/.xlsx) |
| 4 | **Sales Last Year (Optional)** | Last year sales for comparison | Excel (.xls/.xlsx) |

### 5.3 Year-Over-Year Comparison
1. Click **📥 TEMPLATE** button beside "SALES LAST YEAR"
2. Enter the year (e.g., 2025)
3. Click **DOWNLOAD** — template file is generated with all dates of that year
4. Fill in: `DATE`, `SALES`, `QTY`, `SM`, `O2O SALES`
5. Upload under "SALES LAST YEAR" and process

### 5.4 Set Monthly Targets
1. Click **SET MONTHLY TARGETS**
2. Fill in Target Sales, UPT, ATV, AUR for January–December
3. Click **SAVE & CLOSE** — targets load automatically

### 5.5 Features
- **Summary Cards (7 KPIs):** UPT, Total Sales, Total SM (Sales Memo), Total Qty, ATV, AUR, Total O2O
- **Report Controls:** Period presets + Date Range inputs
- **Sticky Header Tables:** Bounded table view with sticky column titles

---

## 6. Module 2: Sales Staff Performance

### 6.1 Purpose
Analyze individual staff sales performance, calculate contribution ratios, and reconcile daily transactions.

### 6.2 Key Features & Optimizations

#### Staff Multi-Select Dropdown Filter
- Replaced basic dropdown with a custom **Multi-Select Checkbox UI**.
- Allows filtering performance data for 1, 2, or multiple staff simultaneously.
- Header displays summary (e.g., `"2 STAFF SELECTED"` or `"ALL STAFF"`).

#### Calendar Date Range Filter
- Replaced standard option dropdowns with native **Calendar Date Pickers** (`<input type="date">`).
- Automatically computes and sets valid date ranges (`min` and `max`) based on uploaded dataset dates.

#### Enhanced Pie Charts with Direct Numerical + Percentage Labels
- **Real Values + Percentages**: Slices display exact numerical figures (e.g., `Rp 15.000.000` / `15 Pcs` / `35%`) directly on the pie chart slices using `chartjs-plugin-datalabels`. Hovering is no longer required.
- **SM Definition**: SM stands for **Sales Memo / Invoice Count**.
- **Dynamic Contribution Calculation**: Staff contribution percentage is calculated dynamically based on total sales within the selected period.

---

## 7. Module 3: Sales Hourly

### 7.1 Purpose
Map hourly transaction patterns to identify peak shopping hours and optimize staff shift scheduling.

### 7.2 Features
- Hourly transaction bar/line chart
- Peak hour identification
- Date selector for shift comparison

---

## 8. Module 4: Auto Stock Dashboard

### 8.1 Purpose
Automatic stock replenishment recommendations (*Auto Stock*) based on sales rate and current inventory.

### 8.2 Dynamic Height Alignment
- **Dynamic Height Sync**: Powered by JavaScript `ResizeObserver`, the right-hand table container dynamically adjusts its height to match the exact height of the left sidebar filter.
- **Independent Table Scroll**: Eliminates wasted empty space beneath the table while allowing independent internal vertical scrolling.

### 8.3 Features
- Multi-filter sidebar (Brand, Category, Price Range, Gender, Discount)
- Preset manager (Save, Load, Delete filter presets)
- Sticky headers for article stock list

---

## 9. Module 5: Broken Size & Inventory Level

### 9.1 Purpose
Identify articles with incomplete size matrices (*Broken Size*) and calculate Inventory Level (IL) ratios.

### 9.2 Features
- **Tab 1: Broken Size**: Categorizes stock into Broken vs Not Broken sizes.
- **Tab 2: Inventory Level (IL)**: Calculates IL ratio = `Current Stock ÷ Average 3-Month Sales`.
- **Threshold Badges**:
  - 🟢 **Ideal**: IL Ratio 2.0 – 4.0
  - 🔴 **Deficient (Kurang)**: IL Ratio < 2.0
  - 🟡 **Excess (Berlebih)**: IL Ratio > 4.0

---

## 10. Module 6: Change Price

### 10.1 Purpose
Compare current stock position report against updated price lists to identify affected SKUs and price changes.

### 10.2 Dynamic Height Alignment
- **Dynamic Height Sync**: Similar to Auto Stock, the table container (`.table-container`) uses `ResizeObserver` to match the exact height of the left filter panel dynamically.
- **Sorting Options**: Sort by Qty (Highest/Lowest), Brand (A-Z/Z-A), Category (A-Z), or Discount.

---

## 11. Data Persistence & Auto-Load

The dashboard uses browser local storage to persist user data across sessions.

| Data | Module | Storage Type |
|---|---|---|
| Monthly Targets | Store Sales | localStorage (`gt_monthly_targets`) |
| Last Year Data | Store Sales | localStorage (`gt_sales_ly_cache`) |
| Filter Presets | Auto Stock | localStorage (`gt_autostock_presets`) |

---

## 12. Number Format Handling

Automatically parses and converts various number formats:
- Indonesian Format: `1.234.567,50`
- International Format: `1,234,567.50`
- Currency Prefixes: `Rp 1.234.567`

---

## 13. Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| **Old styles appearing after update** | Browser CSS Cache | Press **Ctrl + F5** (Hard Refresh) |
| **LY Data shows "No LY Data"** | No Last Year file uploaded | Upload LY file or use template |
| **Dropdown/Table cutoff** | Fixed overflow on parent | Updated to `overflow: visible` for card containers |

---

*© 2026 KANGODING.ORG — GT MASTER DASHBOARD v2.2 — All Rights Reserved*
