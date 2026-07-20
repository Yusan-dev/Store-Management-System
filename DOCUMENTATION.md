# GT MASTER DASHBOARD — User Guide

**Version:** 2.0  
**Platform:** Web-based (Local / Server)  
**Created by:** KANGODING.ORG — ID: 2309445  

---

## Table of Contents

1. [System Requirements](#1-system-requirements)
2. [Installation & Setup](#2-installation--setup)
3. [Main Dashboard Navigation](#3-main-dashboard-navigation)
4. [Module 1: Store Sales Achievement](#4-module-1-store-sales-achievement)
5. [Module 2: Sales Staff Performance](#5-module-2-sales-staff-performance)
6. [Module 3: Sales Hourly](#6-module-3-sales-hourly)
7. [Module 4: Auto Stock Dashboard](#7-module-4-auto-stock-dashboard)
8. [Module 5: Broken Size & Inventory Level](#8-module-5-broken-size--inventory-level)
9. [Module 6: Change Price](#9-module-6-change-price)
10. [Data Persistence & Auto-Load](#10-data-persistence--auto-load)
11. [Number Format Handling](#11-number-format-handling)
12. [Troubleshooting](#12-troubleshooting)

---

## 1. System Requirements

| Requirement | Specification |
|---|---|
| **Browser** | Google Chrome / Mozilla Firefox / Microsoft Edge (latest version) |
| **Operating System** | Windows 7+, macOS, Linux |
| **Internet** | Required only for first-time loading (Google Fonts). All data processing is offline. |
| **Local Server (Optional)** | Python 3.x, Node.js (with `http-server`), or Java Tomcat |
| **Storage** | Minimal — data is stored in browser localStorage |

---

## 2. Installation & Setup

### Option A: Open Directly (No Server)
1. Download & extract the `GT_MASTER_DASHBOARD` folder
2. Open `index.html` in your browser
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
- **Main Content** — Displays the selected module in an iframe
- **Logo** (KG) — Click to collapse/expand sidebar

| Menu Icon | Module Name | Description |
|---|---|---|
| 🏆 | Store Sales Achievement | Daily sales tracking, target vs actual, LY comparison |
| 📊 | Sales Staff Performance | Per-staff performance, daily audit, validation |
| 🕒 | Sales Hourly | Hourly sales shift breakdown |
| 📦 | Auto Stock Dashboard | Stock position analysis with multi-filter |
| 📐 | Broken Size & IL | Size completeness & inventory level analysis |
| 🏷️ | Change Price | Price comparison between stock & price list |

---

## 4. Module 1: Store Sales Achievement

### 4.1 Purpose
Track daily store sales performance against targets, with year-over-year comparison.

### 4.2 Required Upload Files

| # | File | Description | Format |
|---|---|---|---|
| 1 | **Merchandise Sales Report (MSR)** | Daily sales transactions | Excel (.xls/.xlsx) |
| 2 | **Target Harian (Excel)** | Daily target percentages | Excel (.xls/.xlsx) |
| 3 | **Daily Cash Collection** | Cash collection summary | Excel (.xls/.xlsx) |
| 4 | **Salesperson / Advance Order** | Staff order data | Excel (.xls/.xlsx) |
| 5 | **Sales Last Year (Optional)** | Last year sales for comparison | Excel (.xls/.xlsx) |

### 4.3 Year-Over-Year Comparison

**Download LY Template:**
1. Click **📥 TEMPLATE** button beside "SALES LAST YEAR"
2. Enter the year (e.g., 2025)
3. Click **DOWNLOAD** — template file is generated with all dates of that year
4. Open the template and fill in: `DATE`, `SALES`, `QTY`, `SM`, `O2O SALES`
5. Upload the completed file under "SALES LAST YEAR"
6. Process data — LY comparison will appear automatically

**Note:** UPT, ATV, and AUR values are calculated automatically by the engine from SALES, QTY, and SM data.

### 4.4 Set Monthly Targets
1. Click **SET MONTHLY TARGETS**
2. Fill in Target Sales, UPT, ATV, AUR for each month (January–December)
3. Click **SAVE & CLOSE** — targets are saved automatically

### 4.5 Processing
1. Upload all required files
2. Click **PROCESS** — data is parsed, analyzed, and displayed

### 4.6 Features

**Summary Cards (7 KPIs):**
| Card | Description | LY Comparison |
|---|---|---|
| UPT | Units Per Transaction | ✅ + change % |
| TOTAL SALES | Total revenue | ✅ + change % |
| TOTAL SM | Sales Margin count | ✅ + change % |
| TOTAL QTY | Total quantity sold | ✅ + change % |
| ATV | Average Transaction Value | ✅ + change % |
| AUR | Average Unit Retail | ✅ + change % |
| TOTAL O2O | Online-to-Offline sales | ✅ + change % |

**Report Controls:**
- **Period Filter**: Today, Yesterday, This Week, Last Week, This Month, Last Month, This Quarter, This Semester, This Year
- **Custom Date Range**: Select From/To dates manually
- **Comparison**: Compare with Last Year / Last Month / Last Week / None

**Tables:**
- **Daily Report Table**: Date, Target, Sales, SM, QTY, UPT, ATV, AUR, Category QTY, O2O
- **Category Summary**: Grid cards per product category
- **Sales Category & Discount Table**: Breakdown by category and discount type
- **Top 5 Artikel**: Best-selling articles by sales value, quantity, and footwear

**Export:**
- **PRINT REPORT** — Print formatted report
- **EXPORT EXCEL** — Export data to Excel

### 4.7 Data Persistence
- **Target data** is saved automatically to browser storage
- **LY data** is cached and auto-loaded on next visit
- All other data is reprocessed from uploaded files

---

## 5. Module 2: Sales Staff Performance

### 5.1 Purpose
Analyze individual staff sales performance, validate data accuracy, and reconcile daily transactions.

### 5.2 Required Upload Files

| # | File | Description | Format |
|---|---|---|---|
| 1 | **Daily Cash Collection** | Cash collection per staff | Excel (.xls/.xlsx) |
| 2 | **Merchandise Sales Report (MSR)** | Sales transactions | Excel (.xls/.xlsx) |
| 3 | **Salesperson Wise** | Per-staff sales breakdown | Excel (.xls/.xlsx) |

### 5.3 Processing
1. Upload all 3 required files
2. Click **PROCESS** — system reconciles data across sources

### 5.4 Features

**Summary Cards (5 KPIs):**
| Card | Description |
|---|---|
| TOTAL STAFF | Active staff count |
| TOTAL SALES | Aggregate sales |
| TOTAL SM | Total sales margin |
| TOTAL QTY | Total quantity |
| AVG SALES | Average sales per staff |

**Data Validation Table:**
| Validation | Description |
|---|---|
| Daily Cash SM | SM count from Daily Cash file |
| Staff SM | SM count from Staff file |
| Diff | Difference between sources |
| Status | Pass / Fail |
| Reason | Detailed explanation if mismatch |

**Validation Detail Modal:**
- Opens with detailed breakdown when validation has issues
- Shows invoice-level reconciliation

**Monthly Summary Table:**
- Aggregated staff performance per month
- Dynamic columns based on available data

**Daily Audit Section:**
- **Date Selector** — Pick a specific date
- **Audit Status** — Shows data quality status (VALID / WARNING / INVALID)
- **Detailed Audit** — Invoice-level breakdown, anomaly detection

**Staff Performance Table:**
Columns: DATE, STAFF, SALES, SM, QTY, UPT, ATV, AUR

**Ranking Cards:**
| Rank | Metric |
|---|---|
| 🏆 TOP SALES | Staff with highest sales |
| 📦 TOP QTY | Staff with highest quantity |
| 👟 TOP FOOTWEAR | Staff with highest footwear sales |

**Staff Detail Modal:**
- Click on a staff row to open detailed breakdown
- Shows all transactions, KPIs, and daily performance

**Period Filter:**
- Staff filter (ALL or specific staff)
- Custom date range with APPLY / RESET
- From/To date selectors

### 5.5 Export
- **EXPORT EXCEL** — Export staff performance report
- **PRINT REPORT** — Print formatted report

---

## 6. Module 3: Sales Hourly

### 6.1 Purpose
Analyze hourly sales patterns from the Sales Register report.

### 6.2 Required Upload Files

| # | File | Description | Format |
|---|---|---|---|
| 1 | **XLS File** | Sales Register report | Excel (.xls/.xlsx) |

### 6.3 Processing
1. Click **Choose XLS File** and select your Sales Register report
2. Click **Process Data** — system analyzes hourly sales
3. Data is saved to cache for next visit

### 6.4 Features

**Data Persistence:**
- Data is cached in your browser's storage
- On next visit, data auto-loads — no need to re-upload
- Click **Clear Cache** to reset and upload fresh data

**Date Selector:**
- After processing, select a date from the dropdown
- Dashboard updates automatically for the selected date

**Daily Sales Shift Summary:**
| Shift | Time Range | Metrics |
|---|---|---|
| Shift 1 | Open - 12:00 | Sales, Transactions, Unit Sold |
| Shift 2 | 12:00 - 15:00 | Sales, Transactions, Unit Sold |
| Shift 3 | 15:00 - 18:00 | Sales, Transactions, Unit Sold |
| Shift 4 | 18:00 - Closing | Sales, Transactions, Unit Sold |
| Grand Total | All Shifts | Aggregate totals |

**Hourly Sales Breakdown:**
- Hour-by-hour sales from 05:00 to 22:00
- Highlighted rows for hours with sales activity

---

## 7. Module 4: Auto Stock Dashboard

### 7.1 Purpose
Visualize stock position with advanced filtering and categorization.

### 7.2 Required Upload Files

| # | File | Description | Format |
|---|---|---|---|
| 1 | **UPLOAD STOCK** | Stock Position Report | Excel (.xlsx/.xls) |

### 7.3 Processing
1. Upload the Stock Position Report
2. Click **PROSES** — data is parsed and displayed

### 7.4 Features

**Summary Cards:**
| Card | Metrics |
|---|---|
| SKU | Total unique articles |
| QTY | Total stock quantity |
| MEN | SKU count + QTY for Men's category |
| WOMEN | SKU count + QTY for Women's category |
| KIDS | SKU count + QTY for Kids' category |
| UNISEX | SKU count + QTY for Unisex category |
| + Dynamic | Additional gender/category cards |

**Filters (Left Sidebar):**
| Filter | Type | Description |
|---|---|---|
| Search Artikel | Text | Search by article name/code |
| Price (EXACT) | Number | Exact price match |
| Price (MIN) | Number | Minimum price |
| Price (MAX) | Number | Maximum price |
| BRAND | Checkboxes | Filter by brand(s) |
| CATEGORY | Checkboxes | Filter by category(s) |
| GENDER | Checkboxes | Filter by gender(s) |
| STATUS | Checkboxes | Filter by discount status |

**Main Table:**
| Column | Sortable |
|---|---|
| BRAND | ✅ Click to sort |
| CATEGORY | ✅ |
| ARTIKEL | ✅ |
| DESCRIPTION | ✅ |
| PRICE | ✅ |
| STATUS | ✅ |
| GENDER | ✅ |
| QTY | ✅ |

All columns are sortable by clicking the header.

### 7.5 Export
- **PRINT REPORT** — Print formatted report
- **EXPORT EXCEL** — Export filtered data to Excel

---

## 8. Module 5: Broken Size & Inventory Level

### 8.1 Purpose
Identify articles with incomplete size ranges (Broken Size) and calculate inventory level ratios.

### 8.2 Required Upload Files

| # | File | Description | Format |
|---|---|---|---|
| 1 | **UPLOAD STOCK** | Stock Position Report | Excel (.xlsx/.xls) |
| 2 | **UPLOAD MSR BULAN 1** | MSR data — Month 1 | Excel (.xlsx/.xls) |
| 3 | **UPLOAD MSR BULAN 2** | MSR data — Month 2 | Excel (.xlsx/.xls) |
| 4 | **UPLOAD MSR BULAN 3** | MSR data — Month 3 | Excel (.xlsx/.xls) |

### 8.3 Processing
1. Upload all required files
2. Click **PROCESS** — both Broken Size and IL analysis run

### 8.4 Features

**Tab Navigation:**
- **BROKEN SIZE** — Size completeness analysis
- **IL (INVENTORY LEVEL)** — Stock adequacy analysis

### Tab 1: Broken Size

**Summary Cards:**
| Card | Description |
|---|---|
| TOTAL ARTIKEL | Total unique articles |
| TOTAL QTY | Total stock quantity |
| BROKEN SIZE | Count + % of articles with incomplete sizes |
| NOT BROKEN | Count + % of articles with complete sizes |
| APPAREL BROKEN | Broken size count + % in Apparel |
| FOOTWEAR BROKEN | Broken size count + % in Footwear |

**Filters (Left Sidebar):**
| Filter | Type | Description |
|---|---|---|
| Search Artikel | Text | Search by article |
| BRAND | Checkboxes | Filter by brand |
| CATEGORY | Checkboxes | Filter by category |
| DISCOUNT | Checkboxes | Filter by discount status |
| STATUS | Checkboxes | Filter by broken/not broken |

**Main Table:**
| Column | Sortable |
|---|---|
| BRAND | ✅ |
| CATEGORY | ✅ |
| ARTIKEL | ✅ |
| DESCRIPTION | ✅ |
| DISCOUNT | ✅ |
| SIZES | ✅ |
| SIZE COUNT | ✅ |
| STATUS | ✅ |
| TOTAL QTY | ✅ |

### Tab 2: Inventory Level (IL)

**Summary Cards:**
| Card | Description |
|---|---|
| TOTAL CATEGORY | Product categories analyzed |
| TOTAL STOCK | Total stock quantity |
| AVG SALES / BULAN | Average monthly sales (from 3 MSR files) |
| IL RATIO (OVERALL) | Overall inventory level ratio |

**IL Formula:**
```
IL = Current Stock Quantity ÷ Average Monthly Sales (3 months)
```

**IL Thresholds:**
| Status | Condition |
|---|---|
| 🟢 **Ideal** | IL Ratio 2.0 – 4.0 |
| 🔴 **Kurang (Deficient)** | IL Ratio < 2.0 |
| 🟡 **Berlebih (Excess)** | IL Ratio > 4.0 |

**Main Table:**
| Column | Description |
|---|---|
| CATEGORY | Category name |
| STOCK QTY | Current stock quantity |
| SALES BULAN 1 | MSR Month 1 sales |
| SALES BULAN 2 | MSR Month 2 sales |
| SALES BULAN 3 | MSR Month 3 sales |
| AVG SALES / BULAN | Average monthly sales |
| IL RATIO | Calculated ratio |
| STATUS | Kurang / Ideal / Berlebih |

### 8.5 Export
- **PRINT REPORT** — Print formatted report
- **EXPORT EXCEL** — Export filtered data

---

## 9. Module 6: Change Price

### 9.1 Purpose
Compare stock position report with a new price list to identify articles with price changes.

### 9.2 Required Upload Files

| # | File | Description | Format |
|---|---|---|---|
| 1 | **UPLOAD FILE STOCK POSITION REPORT** | Current stock with prices | Excel (.xlsx/.xls) |
| 2 | **UPLOAD FILE PRICE LIST** | Updated price list | Excel (.xlsx/.xls/.xlsb) |

### 9.3 Processing
1. Upload both files
2. Click **PROCESS** — system compares old vs new prices

### 9.4 Features

**Price List Metadata:**
- Title information from the price list file is displayed
- Shows source file name/header information

**Summary Cards:**
| Card | Description |
|---|---|
| TOTAL SKU | Total articles in stock |
| TOTAL QTY | Total stock quantity |
| AFFECTED SKU + QTY | Articles with price changes (count + pcs) |
| UNAFFECTED SKU + QTY | Articles without price changes (count + pcs) |
| + Dynamic | Additional category cards |

**Filters (Left Sidebar):**
| Filter | Type | Description |
|---|---|---|
| Search | Text | Search by Artikel, Brand |
| SORT BY | Dropdown | 7 sort options (Qty, Brand, Category, Discount) |
| STATUS | Checkboxes | Affected / Unaffected |
| BRAND | Checkboxes | Filter by brand |
| CATEGORY | Checkboxes | Filter by category |
| DISCOUNT | Checkboxes | Filter by discount type |

**Main Table:**
| Column | Description |
|---|---|
| BRAND | Brand name |
| CATEGORY | Category name |
| ARTIKEL | Article code |
| DESCRIPTION | Article description |
| STATUS | Affected / Unaffected |
| PRICE LAMA | Original price |
| NEW PRICE | Updated price |
| DISC LAMA | Original discount |
| NEW DISC | Updated discount |
| STOCK QTY | Current stock quantity |

**Sort Options:**
| Option | Order |
|---|---|
| Qty Tertinggi | Highest quantity first |
| Qty Terendah | Lowest quantity first |
| Brand A-Z | Alphabetical brand |
| Brand Z-A | Reverse alphabetical brand |
| Category A-Z | Alphabetical category |
| Discount Terkecil-Tertinggi | Smallest to largest discount |
| Discount Tertinggi-Terkecil | Largest to smallest discount |

### 9.5 Export
- **PRINT REPORT** — Print formatted report
- **EXPORT EXCEL** — Export data to Excel

---

## 10. Data Persistence & Auto-Load

The dashboard uses your browser's local storage to save data for a seamless experience.

### What is saved automatically:
| Data | Module | Auto-Load |
|---|---|---|
| Monthly Targets | Store Sales | ✅ Loaded on page open |
| Last Year Comparison Data | Store Sales | ✅ Cached from last upload |
| Sales Hourly Data | Sales Hourly | ✅ Cached from last upload |
| Filter preferences | Various | ✅ Saved per session |

### How it works:
1. Upload and process data as usual
2. Data is automatically saved to browser storage
3. Close and reopen the dashboard
4. Previously processed data loads automatically
5. Upload a new file to replace cached data

### To clear cached data:
- **Sales Hourly**: Click **Clear Cache** button
- **Store Sales LY**: Upload a new LY file (automatically replaces cache)

### Important Notes:
- Data is stored in your browser only (per device)
- Clearing browser data will remove all cached dashboard data
- Each user on each computer has their own cache
- No server-side storage is required

---

## 11. Number Format Handling

The dashboard supports multiple number formats from Excel. You can paste or enter numbers in the following formats:

| Format | Example | Supported |
|---|---|---|
| Plain number | `1234567` | ✅ |
| Dot thousand separator | `1.234.567` | ✅ (Indonesian format) |
| Comma thousand separator | `1,234,567` | ✅ (International format) |
| Comma decimal | `3,5` | ✅ (Indonesian decimal) |
| Dot decimal | `3.5` | ✅ (International decimal) |
| Rp prefix | `Rp 1.234.567` | ✅ |
| Rp prefix + dot thousand | `Rp1.234.567` | ✅ |
| Mixed thousands + decimal | `1.234.567,50` | ✅ |

**No special formatting required** — the dashboard automatically detects and converts all formats to proper numbers.

---

## 12. Troubleshooting

### Common Issues & Solutions

| Problem | Cause | Solution |
|---|---|---|
| **Data not loading on page open** | Browser cache cleared | Re-upload and process files |
| **"LY Data" shows "No LY Data"** | No last year file uploaded | Upload LY file or download template |
| **Numbers showing as 0** | Incorrect Excel column format | Ensure numbers are pasted as values, not text |
| **Target not appearing** | Targets not set | Click SET MONTHLY TARGETS and save |
| **Module not displaying** | File path issue | Open via local server (not file://) |
| **Browser storage full** | Too much cached data | Clear browser data or use Clear Cache button |
| **Excel file not reading** | Corrupted file | Re-save Excel file as .xlsx |
| **GitHub Pages blocked** | Network firewall | Use local server deployment |
| **IFrame not loading** | Cross-origin restriction | Use local server (Python/Node.js/Tomcat) |

### Support Contact
- **Email:** yusup.gunners@gmail.com
- **Trakteer:** [Buy me a coffee](https://trakteer.id/muhammad_yusuf525)

---

*© 2026 KANGODING.ORG — GT MASTER DASHBOARD v2.0 — All Rights Reserved*
