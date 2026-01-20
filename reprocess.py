import pandas as pd
import numpy as np

# ============================================
# Load Data
# ============================================
print("📂 Loading data...")
df = pd.read_csv('data/owid-energy-data.csv')
print(f"   Raw data: {len(df)} rows, {len(df.columns)} columns")

# ============================================
# 1. Handle CO2 Column
# ============================================
if 'co2' not in df.columns and 'greenhouse_gas_emissions' in df.columns:
    df.rename(columns={'greenhouse_gas_emissions': 'co2'}, inplace=True)
elif 'co2' not in df.columns:
    df['co2'] = 0

# ============================================
# 2. Filter Valid Data
# ============================================
print("🔍 Filtering data...")
# Remove aggregates and invalid rows
df = df[df['iso_code'].notna()]
df = df[~df['iso_code'].str.startswith('OWID_', na=False)]  # Remove OWID aggregates
df = df[df['country'] != 'World']
df = df[df['year'] >= 1990]
print(f"   After filtering: {len(df)} rows")

# ============================================
# 3. Fill Missing Values
# ============================================
print("🔧 Filling missing values...")
fill_cols = [
    'primary_energy_consumption', 'nuclear_consumption', 'renewables_consumption',
    'coal_consumption', 'oil_consumption', 'gas_consumption', 
    'hydro_consumption', 'solar_consumption', 'wind_consumption',
    'other_renewable_consumption', 'co2', 'population', 'gdp'
]

for c in fill_cols:
    if c in df.columns:
        df[c] = df[c].fillna(0)

# ============================================
# 4. Geographic Classification
# ============================================
print("🌍 Adding geographic classifications...")

# Continent Mapping (Extended)
continent_map = {
    'Asia': ['CHN', 'IND', 'JPN', 'KOR', 'IDN', 'SAU', 'TUR', 'IRN', 'IRQ', 'PAK', 
             'THA', 'VNM', 'MYS', 'PHL', 'BGD', 'ARE', 'ISR', 'SGP', 'HKG', 'KAZ',
             'UZB', 'TWN', 'LKA', 'MMR', 'KHM', 'JOR', 'LBN', 'OMN', 'KWT', 'QAT'],
    'Europe': ['DEU', 'GBR', 'FRA', 'ITA', 'ESP', 'POL', 'RUS', 'UKR', 'NLD', 'BEL', 
               'SWE', 'CZE', 'PRT', 'GRC', 'ROU', 'AUT', 'CHE', 'NOR', 'DNK', 'FIN',
               'HUN', 'SVK', 'IRL', 'HRV', 'BGR', 'SRB', 'LTU', 'SVN', 'LVA', 'EST'],
    'North America': ['USA', 'CAN', 'MEX'],
    'South America': ['BRA', 'ARG', 'CHL', 'COL', 'VEN', 'PER', 'ECU', 'BOL', 'PRY', 'URY'],
    'Africa': ['ZAF', 'EGY', 'NGA', 'DZA', 'MAR', 'ETH', 'KEN', 'GHA', 'AGO', 'TZA',
               'TUN', 'LBY', 'CMR', 'CIV', 'UGA', 'SDN'],
    'Oceania': ['AUS', 'NZL', 'PNG']
}

iso_to_continent = {iso: cont for cont, isos in continent_map.items() for iso in isos}
df['continent'] = df['iso_code'].map(iso_to_continent).fillna('Other')

# Region Mapping (More Detailed)
region_map = {
    'East Asia': ['CHN', 'JPN', 'KOR', 'TWN', 'HKG', 'SGP'],
    'South Asia': ['IND', 'PAK', 'BGD', 'LKA', 'MMR'],
    'Southeast Asia': ['IDN', 'THA', 'VNM', 'MYS', 'PHL', 'KHM'],
    'Middle East': ['SAU', 'TUR', 'IRN', 'IRQ', 'ARE', 'ISR', 'JOR', 'LBN', 'OMN', 'KWT', 'QAT'],
    'Western Europe': ['DEU', 'GBR', 'FRA', 'ITA', 'ESP', 'NLD', 'BEL', 'CHE', 'AUT', 'IRL'],
    'Northern Europe': ['SWE', 'NOR', 'DNK', 'FIN'],
    'Eastern Europe': ['POL', 'RUS', 'UKR', 'CZE', 'ROU', 'HUN', 'SVK', 'BGR', 'SRB'],
    'Southern Europe': ['GRC', 'PRT', 'HRV', 'SVN'],
    'North America': ['USA', 'CAN', 'MEX'],
    'South America': ['BRA', 'ARG', 'CHL', 'COL', 'VEN', 'PER', 'ECU', 'BOL'],
    'North Africa': ['EGY', 'DZA', 'MAR', 'TUN', 'LBY'],
    'Sub-Saharan Africa': ['ZAF', 'NGA', 'ETH', 'KEN', 'GHA', 'AGO', 'TZA'],
    'Oceania': ['AUS', 'NZL']
}

iso_to_region = {iso: reg for reg, isos in region_map.items() for iso in isos}
df['region'] = df['iso_code'].map(iso_to_region).fillna('Other')

# ============================================
# 5. Calculate Energy Metrics
# ============================================
print("📊 Calculating energy metrics...")

# Clean Energy Share (Nuclear + Renewables)
df['clean_energy_share'] = np.where(
    df['primary_energy_consumption'] > 0,
    ((df['nuclear_consumption'] + df['renewables_consumption']) / 
     df['primary_energy_consumption']) * 100,
    0
)

# Fossil Fuel Share (Coal + Oil + Gas)
df['fossil_fuel_share'] = np.where(
    df['primary_energy_consumption'] > 0,
    ((df['coal_consumption'] + df['oil_consumption'] + df['gas_consumption']) / 
     df['primary_energy_consumption']) * 100,
    0
)

# Energy Intensity (TWh per Trillion USD GDP)
df['energy_intensity'] = np.where(
    df['gdp'] > 0,
    (df['primary_energy_consumption'] / df['gdp']) * 1e12,
    0
)

# Per Capita Metrics
df['energy_per_capita'] = np.where(
    df['population'] > 0,
    (df['primary_energy_consumption'] * 1e9) / df['population'],  # kWh per person
    0
)

df['co2_per_capita'] = np.where(
    df['population'] > 0,
    (df['co2'] * 1e6) / df['population'],  # Tonnes per person
    0
)

df['gdp_per_capita'] = np.where(
    df['population'] > 0,
    df['gdp'] / df['population'],
    0
)

# Renewable Breakdown Percentages
df['solar_share'] = np.where(
    df['primary_energy_consumption'] > 0,
    (df['solar_consumption'] / df['primary_energy_consumption']) * 100,
    0
)

df['wind_share'] = np.where(
    df['primary_energy_consumption'] > 0,
    (df['wind_consumption'] / df['primary_energy_consumption']) * 100,
    0
)

df['hydro_share'] = np.where(
    df['primary_energy_consumption'] > 0,
    (df['hydro_consumption'] / df['primary_energy_consumption']) * 100,
    0
)

# ============================================
# 6. Income Level Classification
# ============================================
print("💰 Classifying income levels...")

def classify_income(gdp_per_capita):
    if gdp_per_capita == 0:
        return 'Unknown'
    elif gdp_per_capita > 40000:
        return 'High Income'
    elif gdp_per_capita > 12000:
        return 'Upper-Middle Income'
    elif gdp_per_capita > 4000:
        return 'Lower-Middle Income'
    else:
        return 'Low Income'

df['income_level'] = df['gdp_per_capita'].apply(classify_income)

# ============================================
# 7. Calculate Growth Rates
# ============================================
print("📈 Calculating growth rates...")

# Sort by country and year
df = df.sort_values(['country', 'year'])

# Calculate year-over-year growth
df['energy_growth_rate'] = df.groupby('country')['primary_energy_consumption'].pct_change() * 100
df['gdp_growth_rate'] = df.groupby('country')['gdp'].pct_change() * 100
df['co2_growth_rate'] = df.groupby('country')['co2'].pct_change() * 100
df['population_growth_rate'] = df.groupby('country')['population'].pct_change() * 100

# Fill infinite and NaN growth rates
growth_cols = ['energy_growth_rate', 'gdp_growth_rate', 'co2_growth_rate', 'population_growth_rate']
for col in growth_cols:
    df[col] = df[col].replace([np.inf, -np.inf], 0).fillna(0)

# ============================================
# 8. Add Useful Flags
# ============================================
print("🏷️ Adding classification flags...")

# Major Economy Flag (GDP > 1 Trillion)
df['is_major_economy'] = df['gdp'] > 1e12

# High Emitter Flag (CO2 > 100 million tonnes)
df['is_high_emitter'] = df['co2'] > 100

# Renewable Leader Flag (Clean Energy > 50%)
df['is_renewable_leader'] = df['clean_energy_share'] > 50

# Energy Efficient Flag (Energy Intensity < 100)
df['is_energy_efficient'] = df['energy_intensity'] < 100

# ============================================
# 9. Data Quality Checks
# ============================================
print("✅ Running data quality checks...")

# Check for negative values (shouldn't exist)
numeric_cols = df.select_dtypes(include=[np.number]).columns
negative_check = (df[numeric_cols] < 0).any()
if negative_check.any():
    print(f"⚠️ Warning: Negative values found in: {negative_check[negative_check].index.tolist()}")

# Check data completeness by year
completeness = df.groupby('year').agg({
    'country': 'count',
    'primary_energy_consumption': lambda x: (x > 0).sum(),
    'gdp': lambda x: (x > 0).sum()
}).rename(columns={'country': 'total_countries', 
                   'primary_energy_consumption': 'with_energy_data',
                   'gdp': 'with_gdp_data'})

print("\n📋 Data Completeness Summary:")
print(completeness.tail())

# ============================================
# 10. Save Processed Data
# ============================================
print("\n💾 Saving processed data...")
df.to_csv('cleaned_data.csv', index=False)

# Also save a summary statistics file
summary = df.groupby('year').agg({
    'primary_energy_consumption': ['sum', 'mean'],
    'co2': ['sum', 'mean'],
    'clean_energy_share': 'mean',
    'energy_per_capita': 'mean'
}).round(2)

summary.to_csv('summary_statistics.csv')

print(f"\n✅ Processing complete!")
print(f"   Final dataset: {len(df)} rows, {len(df.columns)} columns")
print(f"   Countries: {df['country'].nunique()}")
print(f"   Year range: {df['year'].min()} - {df['year'].max()}")
print(f"   Files created: cleaned_data.csv, summary_statistics.csv")

# Display new columns added
new_cols = ['continent', 'region', 'clean_energy_share', 'fossil_fuel_share', 
            'energy_intensity', 'energy_per_capita', 'co2_per_capita', 
            'gdp_per_capita', 'income_level', 'energy_growth_rate', 
            'gdp_growth_rate', 'is_major_economy', 'is_renewable_leader']

print(f"\n📌 New columns added ({len(new_cols)}):")
for col in new_cols:
    print(f"   - {col}")