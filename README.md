# 📊 Data-Driven Storytelling Project | 2026
> An interactive exploration of [..]

**🌐 Live Website:** [https://justwsx.github.io/DataVisualizationProject/](https://justwsx.github.io/DataVisualizationProject/)

---

## 👥 The Team
- **Wassim Fatnassi**
- **Nahid Davoudi**

---

## 🧠 Methodology & Transparency
*This section fulfills the requirement for methodological transparency and reproducibility.*

### 1. Data Sources
Our story is built upon the following datasets:
* **[Nome Fonte, es: World Bank Open Data]**: [Link] - Provides annual metrics on [Metric X] from 1990 to 2024.
* **[Nome Fonte, es: Our World in Data]**: [Link] - Used to cross-reference [Metric Y] and fill gaps in geographical coverage.

### 2. Data Cleaning & Imputation (Preprocessing)
The raw data underwent a rigorous cleaning process using **Python (Pandas)**. You can find the full pipeline in `/preprocessing`.
* **Missing Values**: Records with more than 20% missing values were excluded. For minor gaps, we used *linear interpolation* to maintain trend continuity.
* **Data Transformation**: Raw values were normalized to [es: percentages/per capita] to allow fair comparison between countries of different sizes.
* **Assumption**: We assumed that data reporting standards remained consistent across the observed timeframe.

### 3. Processing & Visual Encoding
We translated raw metrics into visual elements using **D3.js**:
1.  **Pipeline**: Raw Data (.csv) → Python Cleaning → Optimized JSON → D3.js Selection & Join.
2.  **Encodings**: 
    * **X-Axis**: Time (Temporal progression).
    * **Y-Axis**: [Metric Name, es: CO2 Emissions].
    * **Color Scale**: Categorical encoding for [es: Geographic Regions].
    * **Size**: Quantitative encoding for [es: GDP/Population].

### 4. Limitations & Uncertainty
* **Data Lag**: The most recent data points (2025) are preliminary and subject to revision.
* **Geographic Bias**: Data is more granular for OECD countries; some developing nations have interpolated values.
* **Visual Complexity**: To ensure legibility, we filtered out categories representing less than 1% of the total volume.

---

## 🎨 Design & Typography
Following the **Typography Triangle** requirements:
* **Font Choice**: We used a *Sans-Serif* font for data labels to maximize legibility and a *Serif* font for the narrative sections to improve reading flow.
* **Hierarchy**: Clear distinction between H1 (Context), H2 (Section Insights), and Body (Detailed Analysis).
* **Accessibility**: All charts include ARIA labels and high-contrast color palettes (tested for color blindness).

---

## 📂 Project Structure
```text
DataVisualizationProject/
├── data/               <-- Final optimized datasets (CSV/JSON)
├── preprocessing/      <-- Jupyter Notebooks & Python cleaning scripts
├── js/                 <-- D3.js logic and interaction handlers
├── css/                <-- Custom styles and Typography scale
├── assets/             <-- Static images and iconography
└── index.html          <-- Main Storytelling Entry Point
