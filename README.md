# The Green Shift: Energy Transition and Climate Policy in Europe 🌍⚡

## 🔁 Reproducibility & Project Overview

This project is an **interactive data-driven storytelling experience** analyzing the shift from fossil fuels to renewable sources, highlighting how EU policies have reshaped national energy profiles.

✅ The codebase is fully open and reproducible: all data cleaning and transformation steps are documented in **Jupyter notebooks**, while the final interactive visualization is powered by **D3.js**.

**🌐 Live Website:** [https://justwsx.github.io/DataVisualizationProject/](https://justwsx.github.io/DataVisualizationProject/)

---

## 1. 🧹 Data Preprocessing Pipeline

🗂️ All preprocessing scripts are located in the `preprocessing/` folder and are Jupyter notebooks. Run them **in order** to reproduce the data pipeline:

### Step 1: 🧼 Dataset Cleaning
- **Notebook:** `preprocessing/1_data_cleaning.ipynb`
- **Source:** *World Energy Consumption Dataset* (Oxford University / Our World in Data).
- **Actions:**
  - **Geographic Filtering:** Isolating EU Member States to focus on European climate policy.
  - **Time Window:** Focusing on the critical **2010-2024** period.
  - **Gap Filling:** Handling missing values via linear interpolation to ensure visual continuity.

### Step 2: 🧠 Normalization & Transformation
- **Notebook:** `preprocessing/2_transformation.ipynb`
- **Actions:**
  - **Normalization:** Converting raw values to percentages or per capita metrics for fair comparison between countries of different economic sizes.
  - **Aggregation:** Grouping minor energy categories (<1% of total volume) to reduce visual noise.
- **Output:** Optimized CSV/JSON files ready for web integration.

### Step 3: 🧩 Web Integration
- The processed data is output to the `data/` folder, where it is asynchronously fetched by the D3.js visualizations.

#### ▶️ To run preprocessing
1. 📦 Install dependencies (see below).
2. 🧪 Open the notebooks in `preprocessing/` and run all cells.
3. 📁 The generated data will automatically update the website's data folder.

---

## 2. 🚀 Serving/Building the Website Locally

🧱 The website uses **D3.js** to fetch data files. Due to browser security policies (CORS), **you cannot** simply double-click `index.html`. You must use a local server.

### Option 1: 🐍 Python HTTP Server (Recommended)
From the project root directory, run:

```bash
python -m http.server 8000