// Variabili globali accessibili da tutti i moduli
let dataset = [];
let geoJsonData = null;
const width = 1000;
const height = 600;

Promise.all([
    d3.csv("cleaned_data.csv"),
    fetch("https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson").then(res => res.json())
]).then(([data, geoJson]) => {
    
    dataset = data.map(d => ({
        country: d.country,
        iso_code: d.iso_code,
        year: +d.year,
        population: +d.population || 0,
        gdp: +d.gdp || 0,
        co2: +d.co2 || 0,
        primary_energy_consumption: +d.primary_energy_consumption || 0,
        coal_consumption: +d.coal_consumption || 0,
        oil_consumption: +d.oil_consumption || 0,
        gas_consumption: +d.gas_consumption || 0,
        nuclear_consumption: +d.nuclear_consumption || 0,
        hydro_consumption: +d.hydro_consumption || 0,
        solar_consumption: +d.solar_consumption || 0,
        wind_consumption: +d.wind_consumption || 0,
        other_renewable_consumption: +d.other_renewable_consumption || 0,
        renewables_consumption: +d.renewables_consumption || 0,
        continent: d.continent || 'Other',
        region: d.region || 'Other'
    })).filter(d => d.country !== "World" && d.iso_code);

    geoJsonData = geoJson;

    console.log("Data Loaded:", dataset.length, "rows");

    // Inizializzazione di tutti i moduli
    initGlobe();
    initBubbleChart();
    initStackedAreaChart();
    initDonutChart();
    initParetoChart();
    initHeatmap();
    initRadarChart();
    initTreemap();
    initLineRace();
    initSankey();

}).catch(err => {
    console.error("Error loading data:", err);
    document.body.innerHTML = "<h1 style='color:red;text-align:center;'>Error loading data. Check console.</h1>";
});