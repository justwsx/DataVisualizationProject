## The Green Shift: Energy Transition and Climate Policy in Europe 🌍⚡

### 🔁 Reproducibility & Project Overview

> **An interactive data-driven storytelling project analyzing the shift from fossil fuels to renewable sources, highlighting how EU policies have reshaped national energy profiles.**

This project explores the energy transition using **interactive web-based storytelling**.
✅ The codebase is open, and the data transformation steps are managed via a Python script to ensure transparency.

**🌐 Live Website:** [https://justwsx.github.io/DataVisualizationProject/](https://justwsx.github.io/DataVisualizationProject/)

---

### 1. 🧹 Data Preprocessing Pipeline

🗂️ The data processing logic is contained in the `process.py` script located in the root directory. Run this script to regenerate the cleaned datasets used by the visualization.

### Step 1: 🧼 Data Cleaning & Enrichment
- **Script:** `process.py`
- **Input:** Raw data located in the `data/` folder (including Fossil Fuel Prices).
- **Operations:**
  - Imports raw CSV data (World Energy Consumption / Our World in Data).
  - Filters specifically for **EU Member States**.
  - Handles missing values via linear interpolation.
  - Normalizes metrics (per capita / percentages) for fair comparison.
- **Output:** Processed JSON/CSV files saved into `data/`, optimized for D3.js.

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
