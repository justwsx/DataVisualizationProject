# Data-Driven Storytelling Project - 2026

**Live Website:** [https://justwsx.github.io/DataVisualizationProject/](https://justwsx.github.io/DataVisualizationProject/)

---

## 📊 Methodology (Mandatory Section)

### 1. Data Sources
The data used in this story was sourced from:
- **[Source Name Here]**: [Link to the dataset] - *Briefly describe what this data tells us (e.g., Global CO2 emissions by country).*
- **[Optional Second Source]**: [Link] - *Description.*

### 2. Data Cleaning & Imputation
We ensured data quality using Python (Pandas) scripts found in the `/preprocessing` folder.
- **Handling Missing Values**: We [removed / filled with mean] records where [Column Name] was null.
- **Data Transformation**: Converted [Format X] to [Format Y] to ensure compatibility with D3.js.
- **Assumptions**: We assumed that [Example: data from 2020 is representative despite the pandemic].

### 3. Data Processing & Pipeline
Our pipeline transforms raw data into a visual narrative:
1. **Extraction**: Loading raw CSV/JSON files.
2. **Analysis**: Calculating [Metrics, e.g., Growth Rate] via Python.
3. **Visual Encoding**: Mapping [Data Field] to the [X/Y-axis] and [Color/Size] in D3.js to highlight [The Insight].

### 4. Limitations & Uncertainty
In the spirit of transparency, we acknowledge the following constraints:
- **Biases**: The dataset might be biased towards [e.g., Western countries].
- **Missing Data**: Lack of data for the period [Year-Year] prevents a full longitudinal analysis.
- **Uncertainty**: Small sample sizes in [Category] may lead to high variance.

---

## 🛠️ Technology Stack
- **Languages**: HTML5, CSS3, JavaScript (ES6+)
- **Visualization Library**: **D3.js (v7)**
- **Preprocessing**: Python (Pandas, Jupyter Notebooks)
- **Deployment**: GitHub Pages

---

## 📂 Folder Structure & Reproducibility
To run this project locally or reproduce the data analysis:

```text
DataVisualizationProject/
├── data/               <-- Final clean data used by the website
├── preprocessing/      <-- Python notebooks for data cleaning
├── js/                 <-- D3.js visualization scripts
├── css/                <-- Styles (Typography triangle implementation)
└── index.html          <-- Main entry point
