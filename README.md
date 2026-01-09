### 🌍 THE GREEN SHIFT: Energy Transition and Climate Policy in Europe (2010-2024)

> [cite_start]**An interactive data-driven storytelling project analyzing the shift from fossil fuels to renewable sources, highlighting how EU policies have reshaped national energy profiles.** [cite: 7]

**🌐 Live Website:** [https://justwsx.github.io/DataVisualizationProject/](https://justwsx.github.io/DataVisualizationProject/)

---

## 👥 The Team
- [cite_start]**Wassim Fatnassi** (S4684857) [cite: 4]
- [cite_start]**Nahid Davoudi** (5812831) [cite: 4]

---

## 🧠 Methodology & Transparency
*This section provides a detailed overview of our data pipeline, fulfilling the requirement for methodological transparency and reproducibility.*

### 1. Data Sources
Our narrative is built upon a high-quality academic dataset:
* [cite_start]**Dataset Name**: World Energy Consumption Dataset. [cite: 10]
* [cite_start]**Source**: Maintained by researchers at **Oxford University (Our World in Data)** and hosted on Kaggle. [cite: 10, 12]
* [cite_start]**Raw Format**: CSV file containing 23,195 rows and 130 columns. [cite: 13]
* [cite_start]**Scope**: Global data, which we specifically filtered for all EU Member States. [cite: 14]
* [cite_start]**Time Span**: Historical data from 1900-2024, with our analysis specifically focused on the **2010-2024** window. [cite: 15]

### 2. Data Cleaning & Preprocessing
The raw data was processed using **Python (Pandas)** to ensure a clean narrative flow:
* [cite_start]**Geographic Filtering**: We isolated EU countries to connect the data directly to European climate policy affairs. [cite: 8, 14]
* **Missing Values**: Records with significant gaps were excluded; for minor gaps, we applied linear interpolation to ensure visual trend continuity.
* **Data Transformation**: Raw values were normalized (e.g., percentages or per capita) to allow fair comparisons between countries of different economic sizes.
* **Assumptions**: We assume that data reporting standards remained consistent across the EU member states during the observed timeframe.

### 3. Processing & Visual Encoding
[cite_start]We translated raw metrics into interactive elements using **D3.js** to address our core research objectives: [cite: 17]
* [cite_start]**Visualizing the Transition**: Mapping the growth of solar, wind, and hydro relative to traditional fossil fuels. [cite: 18]
* [cite_start]**Comparative Insights**: Identifying regional leaders and laggards in the energy shift. [cite: 19]
* [cite_start]**Environmental Impact**: Illustrating the correlation between energy consumption patterns and carbon intensity. [cite: 20]

### 4. Limitations & Uncertainty
* [cite_start]**Data Lag**: The most recent data points (2024) are preliminary and subject to potential revision. [cite: 15]
* **Visual Complexity**: To ensure legibility and performance, we aggregated energy categories representing less than 1% of total volume.
* **Geographic Bias**: Data granularity may vary slightly between older and newer EU member states.

---

## 🎨 Design & Typography
Adhering to the **Typography Triangle** principles:
* **Typography**: We used a *Sans-Serif* font for data labels (maximum legibility) and a *Serif* font for narrative sections (improved reading flow).
* **Hierarchy**: Clear distinction between H1 (Context/Framing), H2 (Section Insights), and Body (Detailed Analysis).
* **Accessibility**: High-contrast color palettes (tested for color blindness) and clear ARIA labels for all charts and UI elements.
* **Structure**: A clear layout featuring a Header, a Scarf/Hero section (framing the key message), and a Footer.

---

## 📂 Project Structure
```text
DataVisualizationProject/
├── data/           <-- Optimized datasets used by D3 (CSV/JSON)
├── preprocessing/  <-- Python scripts & Jupyter Notebooks for data cleaning
├── js/             <-- D3.js visualization logic and interaction handlers
├── css/            <-- Custom styles and Typography scale
├── assets/         <-- Static images, icons, and branding
└── index.html      <-- Main storytelling entry point├── data/               <-- Final optimized datasets (CSV/JSON)
├── preprocessing/      <-- Jupyter Notebooks & Python cleaning scripts
├── js/                 <-- D3.js logic and interaction handlers
├── css/                <-- Custom styles and Typography scale
├── assets/             <-- Static images and iconography
└── index.html          <-- Main Storytelling Entry Point
