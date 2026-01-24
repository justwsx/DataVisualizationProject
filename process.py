
import pandas as pd

# --- CONFIGURATION ---
INPUT_FILE = 'data/world_clean_dataset.csv'
PRICE_FILE = 'data/fossil_price_table_1990_2022.csv'
OUTPUT_FILE = 'data/world_energy_cleaned_final.csv'

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
    'hydro_elec_per_capita', 'renewables_energy_per_capita',
    'low_carbon_energy_per_capita', 'fossil_fuel_consumption',
    'renewables_consumption'
]

def preprocess_energy_data():
    print(f"Reading {INPUT_FILE}...")

    # --- STEP 1: READ MAIN DATA ---
    df = pd.read_csv(INPUT_FILE, low_memory=False)


    # --- STEP 2: FILTER COUNTRIES ---
    df = df[df['country'].isin(COUNTRIES)].copy()

    # --- STEP 3: SELECT COLUMNS ---
    df = df[REQUIRED_COLUMNS]

    # --- STEP 4: NUMERIC CONVERSION ---
    numeric_cols = df.columns.difference(['country', 'year'])
    for col in numeric_cols:
        df[col] = pd.to_numeric(df[col], errors='coerce')

    # --- STEP 5: FILTER YEARS (1990–2022) ---
    df = df[(df['year'] >= 1990) & (df['year'] <= 2022)]

    # --- STEP 6: LOAD PRICE DATA ---
    print(f"Reading {PRICE_FILE}...")
    price_df = pd.read_csv(PRICE_FILE)

    price_df = price_df[
        ['year', 'oil_price_global', 'gas_price_global', 'coal_price_global']
    ]

    # --- STEP 7: MERGE PRICE DATA ---
    df = df.merge(price_df, on='year', how='left')

    # --- STEP 8: FINAL CLEANING ---
    df = df.dropna(subset=['country', 'year'])
    df['year'] = df['year'].astype(int)
    df = df.sort_values(['country', 'year']).reset_index(drop=True)

    # --- STEP 9: EXPORT ---
    df.to_csv(OUTPUT_FILE, index=False)

    print("-" * 40)
    print("Preprocessing finished successfully!")
    print(f"File saved: {OUTPUT_FILE}")
    print(f"Year range: {df['year'].min()} to {df['year'].max()}")
    print(f"Columns: {list(df.columns)}")
    print("-" * 40)

if __name__ == "__main__":
    preprocess_energy_data()
