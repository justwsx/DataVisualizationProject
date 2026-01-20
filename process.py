import pandas as pd

# --- CONFIGURATION ---
INPUT_FILE = 'data/owid-energy-data.csv'
OUTPUT_FILE = 'world_clean_dataset.csv'

# Target country list for filtering
COUNTRIES = [
    "Argentina", "Australia", "Austria", "Bangladesh", "Belgium", "Brazil",
    "Canada", "Chile", "China", "Colombia", "Czechia", "Denmark", "Egypt",
    "Finland", "France", "Germany", "Hong Kong", "India", "Indonesia", "Iran",
    "Iraq", "Ireland", "Israel", "Italy", "Japan", "Malaysia", "Mexico",
    "Netherlands", "Nigeria", "Norway", "Pakistan", "Philippines", "Poland",
    "Romania", "Russia", "Saudi Arabia", "Singapore", "South Africa",
    "South Korea", "Spain", "Sweden", "Switzerland", "Taiwan", "Thailand",
    "Turkey", "United Arab Emirates", "United Kingdom", "United States",
    "Venezuela", "Vietnam"
]

# Columns needed for the dashboard
REQUIRED_COLUMNS = [
    'country', 'year', 'gdp', 'population', 'primary_energy_consumption',
    'coal_cons_per_capita', 'gas_energy_per_capita', 'oil_energy_per_capita',
    'hydro_elec_per_capita', 'renewables_energy_per_capita', 'low_carbon_energy_per_capita',
    'fossil_fuel_consumption', 'renewables_consumption'
]

def preprocess_energy_data():
    print(f"Reading {INPUT_FILE}...")

    # --- STEP 1: READ DATA ---
    # Using regex separator to handle potential multiple commas
    df = pd.read_csv(INPUT_FILE, sep=r',+', engine='python', low_memory=False)

    # --- STEP 2: FILTER COUNTRIES ---
    df = df[df['country'].isin(COUNTRIES)].copy()

    # --- STEP 3: SELECT COLUMNS ---
    df = df[REQUIRED_COLUMNS]

    # --- STEP 4: NUMERIC CONVERSION ---
    numeric_cols = df.columns.difference(['country', 'year'])
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)

    # --- STEP 5: FILTER YEARS (1990 - 2022) ---
    # This keeps only the data within your dashboard's timeline
    df = df[(df['year'] >= 1990) & (df['year'] <= 2022)]

    # --- STEP 6: FINAL NORMALIZATION ---
    df = df.dropna(subset=['country', 'year'])
    df['year'] = df['year'].astype(int)
    df = df.sort_values(['country', 'year']).reset_index(drop=True)

    # --- STEP 7: EXPORT ---
    df.to_csv(OUTPUT_FILE, index=False)
    
    print("-" * 30)
    print(f"Preprocessing finished successfully!")
    print(f"File saved: {OUTPUT_FILE}")
    print(f"Year range: {df['year'].min()} to {df['year'].max()}")
    print("-" * 30)

if __name__ == "__main__":
    # Calling the correct function name to avoid NameError
    preprocess_energy_data()
