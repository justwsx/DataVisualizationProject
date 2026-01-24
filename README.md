## The Green Shift: Energy Transition and Climate Policy in Europe 🌍⚡

### 🔁 Reproducibility & Project Overview

> **An interactive data-driven storytelling project analyzing the shift from fossil fuels to renewable sources.**

This project explores the energy transition using **interactive web-based storytelling**.

✅ The codebase is open, and the data transformation steps are managed via a Python script to ensure transparency.

**🌐 Live Website:** [https://justwsx.github.io/DataVisualizationProject/](https://justwsx.github.io/DataVisualizationProject/)

---

### 1. 🧹 Data Preprocessing Pipeline

🗂️ The data processing logic is contained in the `process.py` script located in the root directory. Run this script to regenerate the cleaned datasets used by the visualization.

### 🧼 Data Cleaning & Enrichment
- **Script:** `process.py`
- **Input:** Raw data located in the `data/` folder:
  - `world_clean_dataset.csv` (Energy consumption metrics).
  - `world_energy_cleaned_final.csv ` (Global fossil fuel prices).
- **Operations:**
  - **Country Filtering:** Filters the dataset for a selected list of **50 major countries** (covering diverse economies across all continents) to focus the analysis.
  - **Timeframe Restriction:** Limits the data range to **1990–2022** for consistent historical comparison.
  - **Data Cleaning:**
    - Extracts only relevant columns (GDP, population, energy per capita).
    - Converts all metrics to numeric types, handling non-numeric errors via coercion.
    - Removes incomplete records (rows with missing country or year).
  - **Price Enrichment:** Merges the energy data with global **fossil fuel prices** (Oil, Gas, Coal) by year to correlate consumption with market costs.
- **Output:** A clean `world_energy_cleaned_final.csv` file saved into `data/`.

#### ▶️ To run preprocessing
If you need to update the data or reproduce the cleaning steps:

1. 📦 Install dependencies (see Section 4).
2. 🧪 Run the script from the root folder:

```bash
python process.py
```

### 2. 🚀 Serving the Website Locally

🧱 The website uses **D3.js** to fetch data asynchronously. To avoid CORS (Cross-Origin Resource Sharing) security blocks, you cannot simply open the `.html` files directly. You must use a local server.

### Option: 🐍 Python HTTP Server (Fastest)
From the project root directory, run:

```bash
python -m http.server 8000
```

Then open http://localhost:8000 in your browser 🌍.

### 3. 🗺️ Folder Structure & Data Locations

```text
DataVisualizationProject/
├── data/                  # Raw inputs and optimized datasets for D3
├── js/                    # D3.js visualization logic and specific chart modules
├── demand.html            # Story page: Energy Demand Analysis
├── economics.html         # Story page: Economic Impact & Prices
├── geopolitics.html       # Story page: Geopolitical Analysis & KPIs
├── index.html             # Homepage: Main storytelling entry point
├── main.js                # Global Dashboard initialization and event handling
├── mix.html               # Story page: Energy Mix (Fossil vs Renewables)
├── process.py             # Python script for data cleaning and processing
├── style.css              # Main stylesheet (Typography & Layout)
├── transition.html        # Story page: Focus on the transition timeline
└── README.md
```

### 📌 Where does the data for visualizations live?
✅ **All data used by the website's visualizations is in the `data/` folder.**
The HTML pages (e.g., `economics.html`, `mix.html`) load specific subsets of data processed by `process.py` and render them using the scripts found in `js/` and `main.js`.

## 4. 📦 Dependencies

🛠️ To run the `process.py` preprocessing script, you need Python installed along with the following libraries:

- **pandas** (Data manipulation and cleaning)
- **numpy** (Numerical calculations)

```bash
pip install pandas numpy
```
> **Note:** The website itself does not require Node.js or a build step; it is a static site.

## 5. 🧠 Methodology & Transparency

Our narrative is built upon a high-quality academic dataset to ensure methodological transparency.

### 📊 Data Sources
- **Dataset:** World Energy Consumption Dataset.
- **Source:** Maintained by researchers at **Oxford University (Our World in Data)** and hosted on Kaggle.
- **Scope:** Global data filtered for World Member States, focusing on the **1990-2022** window.

### 🎨 Visual Encoding & Design
- **Visualizing the Transition:** We use **D3.js** to map the growth of solar, wind, and hydro relative to traditional fossil fuels.
- **Typography:** Adhering to the *Typography Triangle* principles—Sans-Serif for data labels (legibility) and Serif for narrative sections (flow).
- **Accessibility:** High-contrast color palettes and clear ARIA labels.

### ⚠️ Limitations & Uncertainty
- **Data Lag:** The most recent data points (2024) are preliminary.
- **Simplification:** Energy categories representing less than 1% of total volume were aggregated to ensure visual clarity.

---

## 👥 The Team

- **Wassim Fatnassi** - Layout structure and visual styling (HTML, CSS & UI Design).
- **Nahid Davoudi** - Interactive logic and chart integration (JavaScript & Data Visualization).

---

## 📄 License

This project is an academic Data Visualization exercise.
Copyright (c) 2026.

