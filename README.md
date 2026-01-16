### 🌍 The Green Shift: Energy Transition and Climate Policy in Europe

> **An interactive data-driven storytelling project analyzing the shift from fossil fuels to renewable sources, highlighting how EU policies have reshaped national energy profiles.**

---

**🌐 Live Website:** [https://justwsx.github.io/DataVisualizationProject/](https://justwsx.github.io/DataVisualizationProject/)

---

**Clone this repository**
   ```bash
   git clone https://github.com/justwsx/DataVisualizationProject.git
   cd DataVisualizationProject
   ```

#### 🛠️ How to Run Locally

Since this project uses **D3.js** to fetch data files, you can't just open `index.html` in your browser—it would block the data for security reasons (CORS). You’ll need a local server.

#### Python (Fastest)
1. Open your terminal in the project folder.
2. Run this command:
   ```bash
   python -m http.server 8000
3. Go to the browser and write: http://localhost:8000, then press Enter.

---

### 🧠 Methodology & Transparency
*This section provides a detailed overview of our data pipeline, fulfilling the requirement for methodological transparency and reproducibility.*

#### 1. Data Sources
Our narrative is built upon a high-quality academic dataset:
* **Dataset Name**: World Energy Consumption Dataset.
* **Source**: Maintained by researchers at **Oxford University (Our World in Data)** and hosted on Kaggle.
* **Raw Format**: CSV file containing 23,195 rows and 130 columns.
* **Scope**: Global data, which we specifically filtered for all EU Member States.
* **Time Span**: Historical data from 1900-2024, with our analysis specifically focused on the **2010-2024** window.

#### 2. Data Cleaning & Preprocessing
The raw data was processed using **Python (Pandas)** to ensure a clean narrative flow:
* **Geographic Filtering**: We isolated EU countries to connect the data directly to European climate policy affairs.
* **Missing Values**: Records with significant gaps were excluded; for minor gaps, we applied linear interpolation to ensure visual trend continuity.
* **Data Transformation**: Raw values were normalized (e.g., percentages or per capita) to allow fair comparisons between countries of different economic sizes.
* **Assumptions**: We assume that data reporting standards remained consistent across the EU member states during the observed timeframe.

#### 3. Processing & Visual Encoding
We translated raw metrics into interactive elements using **D3.js** to address our core research objectives:
* **Visualizing the Transition**: Mapping the growth of solar, wind, and hydro relative to traditional fossil fuels.
* **Comparative Insights**: Identifying regional leaders and laggards in the energy shift.
* **Environmental Impact**: Illustrating the correlation between energy consumption patterns and carbon intensity.

#### 4. Limitations & Uncertainty
* **Data Lag**: The most recent data points (2024) are preliminary and subject to potential revision.
* **Visual Complexity**: To ensure legibility and performance, we aggregated energy categories representing less than 1% of total volume.
* **Geographic Bias**: Data granularity may vary slightly between older and newer EU member states.

---

### 🎨 Design & Typography
Adhering to the **Typography Triangle** principles:
* **Typography**: We used a *Sans-Serif* font for data labels (maximum legibility) and a *Serif* font for narrative sections (improved reading flow).
* **Hierarchy**: Clear distinction between H1 (Context/Framing), H2 (Section Insights), and Body (Detailed Analysis).
* **Accessibility**: High-contrast color palettes (tested for color blindness) and clear ARIA labels for all charts and UI elements.
* **Structure**: A clear layout featuring a Header, a Scarf/Hero section (framing the key message), and a Footer.

---

### 📂 Project Structure
```text
DataVisualizationProject/
├── data/           <-- Optimized datasets used by D3 (CSV/JSON)
├── preprocessing/  <-- Jupyter Notebooks & Python cleaning scripts
├── js/             <-- D3.js visualization logic and interaction handlers
├── css/            <-- Custom styles and Typography scale
├── assets/         <-- Static images, icons, and branding
└── index.html      <-- Main storytelling entry point
```
---

#### 👥 The Team
- **Wassim Fatnassi** (S4684857)
- **Nahid Davoudi** (S5812831)
