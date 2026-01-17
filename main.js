const Dashboard = {
    // --- STATE VARIABLES ---
    // Tracks the currently displayed year in the dashboard
    currentYear: 2020,
    // Holds the raw and processed data loaded from the CSV
    data: {},
    // Stores instances of the chart objects (Consumption, Mix, etc.)
    charts: {},
    // Boolean flag to check if the time-lapse animation is running
    isPlaying: false,
    // Reference to the setTimeout timer for the animation loop
    animationTimer: null,
    // Tracks the current visualization mode for the main chart ('lines' or 'area')
    viewMode: 'lines',
    // Currently selected geographic filter (defaults to 'World')
    selectedCountry: 'World',
    // Date range boundaries (will be calculated dynamically from data)
    minYear: 1990,
    maxYear: 2022,
    
    // --- CONFIGURATION ---
    // List of specific countries to highlight in charts
    majorCountries: [
        "United States", "China", "India", "Japan", 
        "Germany", "Russia", "Brazil", "Canada", 
        "United Kingdom", "France", "Australia", "South Korea"
    ],
    
    // Color mapping for consistency across all charts
    countryColors: {
        "United States": "#6366f1",
        "China": "#ec4899",
        "India": "#14b8a6",
        "Japan": "#f59e0b",
        "Germany": "#22c55e",
        "Russia": "#06b6d4",
        "Brazil": "#8b5cf6",
        "Canada": "#f97316",
        "United Kingdom": "#0ea5e9",
        "France": "#84cc16",
        "Australia": "#f43f5e",
        "South Korea": "#a855f7"
    },

    /**
     * Main entry point of the application.
     * Orchestrates the flow: Load Data -> Initialize Charts -> Setup UI -> Show KPIs
     */
    async init() {
        // Wait for data to load before proceeding
        await this.loadData();
        
        // If data loaded successfully, start the dashboard
        if (this.data.energy && this.data.energy.length > 0) {
            this.initializeCharts();
            this.setupEventListeners();
            this.updateKPIs();
            console.log("Dashboard initialized successfully");
            console.log("Data loaded:", this.data.energy.length, "records");
        } else {
            console.error("No data loaded. Please check the CSV file.");
        }
    },

    /**
     * Asynchronously loads the CSV file using D3.js
     * Cleans and formats raw strings into numbers.
     */
    async loadData() {
        try {
            console.log("Loading energy dataset...");
            
            // Fetch the CSV file
            const rawData = await d3.csv("data/world_clean_dataset.csv");
            
            // Safety check for empty data
            if (!rawData || rawData.length === 0) {
                console.error("Failed to load data or empty dataset");
                return;
            }
            
            // Process raw data: convert strings to numbers (+)
            this.data.energy = rawData.map(d => ({
                country: d.country,
                year: +d.year, // Convert "1990" string to 1990 number
                gdp: +d.gdp,
                population: +d.population,
                primary_energy_consumption: +d.primary_energy_consumption,
                coal_cons_per_capita: +d.coal_cons_per_capita,
                gas_energy_per_capita: +d.gas_energy_per_capita,
                hydro_elec_per_capita: +d.hydro_elec_per_capita,
                low_carbon_energy_per_capita: +d.low_carbon_energy_per_capita,
                oil_energy_per_capita: +d.oil_energy_per_capita,
                renewables_energy_per_capita: +d.renewables_energy_per_capita,
                renewables_consumption: +d.renewables_consumption,
                fossil_fuel_consumption: +d.fossil_fuel_consumption
            })).filter(d => 
                // Filter out invalid rows (missing country, year, or consumption data)
                d.country && 
                !isNaN(d.year) &&
                !isNaN(d.primary_energy_consumption)
            );
            
            // Calculate the minimum and maximum years present in the dataset
            const years = [...new Set(this.data.energy.map(d => d.year))].sort((a, b) => a - b);
            this.minYear = years[0];
            this.maxYear = years[years.length - 1];
            
            console.log(`Data loaded: ${this.data.energy.length} records from ${this.minYear} to ${this.maxYear}`);
            
        } catch (error) {
            console.error("Error loading data:", error);
        }
    },

    /**
     * Instantiates the specific chart classes.
     * Checks if the class exists (is loaded) before creating `new` instances.
     */
    initializeCharts() {
        console.log("Initializing charts...");
        
        // 1. Global Consumption Chart
        if (typeof ConsumptionChart !== 'undefined') {
            this.charts.consumption = new ConsumptionChart(this.data.energy, this.majorCountries, this.countryColors);
        }
        
        // 2. Energy Mix Chart
        if (typeof MixChart !== 'undefined') {
            this.charts.mix = new MixChart(this.data.energy);
        }
        
        // 3. Renewables Trend Chart
        if (typeof RenewablesChart !== 'undefined') {
            this.charts.renewables = new RenewablesChart(this.data.energy, this.majorCountries, this.countryColors);
        }
        
        // 4. GDP vs Energy Scatter Plot
        if (typeof GDPEnergyChart !== 'undefined') {
            this.charts.gdpEnergy = new GDPEnergyChart(this.data.energy);
        }
        
        // 5. CO2 Intensity Chart
        if (typeof CO2EnergyChart !== 'undefined') {
            this.charts.co2Energy = new CO2EnergyChart(this.data.energy);
        }
        
        // 6. Market Share Chart
        if (typeof ShareChart !== 'undefined') {
            this.charts.share = new ShareChart(this.data.energy);
        }
        
        // 7. Regional Evolution Chart
        if (typeof EvolutionChart !== 'undefined') {
            this.charts.evolution = new EvolutionChart(this.data.energy, this.majorCountries, this.countryColors);
        }
        
        // 8. Low Carbon Tech Chart
        if (typeof LowCarbonChart !== 'undefined') {
            this.charts.lowCarbon = new LowCarbonChart(this.data.energy);
        }
        
        // 9. Top Consumers Bar Chart
        if (typeof TopConsumersChart !== 'undefined') {
            this.charts.topConsumers = new TopConsumersChart(this.data.energy);
        }
        
        // 10. Choropleth Map
        if (typeof EnergyMapChart !== 'undefined') {
            this.charts.map = new EnergyMapChart(this.data.energy);
        }
        
        // Perform the initial render for all charts
        this.updateAllCharts();
    },

    /**
     * Sets up interactions for Sliders, Buttons, and Window Resize.
     */
    setupEventListeners() {
        // --- YEAR SLIDER LOGIC ---
        const slider = document.getElementById('yearSlider');
        const yearDisplay = document.getElementById('currentYearDisplay');
        
        if (slider) {
            // Set slider bounds based on data
            slider.min = this.minYear;
            slider.max = this.maxYear;
            slider.value = this.currentYear;
            
            // Listen for user dragging the slider
            slider.addEventListener('input', (e) => {
                this.currentYear = +e.target.value; // Update state
                if (yearDisplay) yearDisplay.textContent = this.currentYear; // Update text
                this.updateAllCharts(); // Redraw charts
                this.updateKPIs(); // Recalculate numbers
            });
        }
        
        // --- PLAY BUTTON LOGIC ---
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.addEventListener('click', () => this.toggleAnimation());
        }
        
        // --- VIEW MODE SWITCHER (Lines vs Area) ---
        const viewBtns = document.querySelectorAll('.chart-btn[data-view]');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                // UI Toggle: remove active class from all, add to clicked
                viewBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                
                // Logic Update
                this.viewMode = e.target.dataset.view;
                this.updateChart1View();
            });
        });
        
        // --- GEOGRAPHIC FOCUS SELECTOR ---
        const countrySelect = document.getElementById('countrySelect');
        if (countrySelect) {
            // Get unique countries list
            const countries = [...new Set(this.data.energy.map(d => d.country))].sort();
            
            // Populate the dropdown menu
            countries.forEach(country => {
                const option = document.createElement('option');
                option.value = country;
                option.textContent = country;
                // Only add "World" and major countries defined in config
                if (country === "World" || this.majorCountries.includes(country)) {
                    countrySelect.appendChild(option);
                }
            });
            
            // Listen for changes
            countrySelect.addEventListener('change', (e) => {
                this.selectedCountry = e.target.value;
                this.updateAllCharts(); // Charts will filter based on this.selectedCountry
            });
        }
        
        // --- RESPONSIVE RESIZE ---
        // When window size changes, trigger the resize method of every chart
        window.addEventListener('resize', () => {
            Object.values(this.charts).forEach(chart => {
                if (chart && typeof chart.resize === 'function') {
                    chart.resize();
                }
            });
        });
    },

    /**
     * Specific helper to handle the "Lines vs Area" toggle for the first chart.
     */
    updateChart1View() {
        if (this.charts.consumption && typeof this.charts.consumption.setViewMode === 'function') {
            this.charts.consumption.setViewMode(this.viewMode);
            this.charts.consumption.update(this.currentYear);
        }
    },

    /**
     * Toggles the automated time-lapse animation on or off.
     */
    toggleAnimation() {
        this.isPlaying = !this.isPlaying; // Switch boolean state
        const playBtn = document.getElementById('playBtn');
        const playIcon = playBtn.querySelector('.material-icons-outlined');
        
        if (this.isPlaying) {
            // If playing: change icon to Pause and start loop
            playIcon.textContent = 'pause';
            this.animateYear();
        } else {
            // If stopped: change icon to Play and clear timer
            playIcon.textContent = 'play_arrow';
            if (this.animationTimer) clearTimeout(this.animationTimer);
        }
    },

    /**
     * Recursive function that increments the year every second.
     */
    animateYear() {
        if (!this.isPlaying) return; // Stop if paused
        
        this.currentYear++; // Increment year
        // Loop back to start if we reach the end
        if (this.currentYear > this.maxYear) this.currentYear = this.minYear;
        
        // Update UI elements (slider position and text)
        const slider = document.getElementById('yearSlider');
        const display = document.getElementById('currentYearDisplay');
        if (slider) slider.value = this.currentYear;
        if (display) display.textContent = this.currentYear;
        
        // Update data visualizations
        this.updateAllCharts();
        this.updateKPIs();
        
        // Schedule next frame in 1000ms (1 second)
        this.animationTimer = setTimeout(() => this.animateYear(), 1000);
    },

    /**
     * Centralized function to trigger the .update() method of all active charts.
     */
    updateAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.update === 'function') {
                chart.update(this.currentYear);
            }
        });
    },

    /**
     * Calculates and updates the 4 Big Number Cards (KPIs) at the top.
     * Filters data for the current year and sums up values.
     */
    updateKPIs() {
        // Filter dataset for current year only
        const yearData = this.data.energy.filter(d => d.year === this.currentYear);
        
        if (yearData.length > 0) {
            // 1. Total Primary Energy
            const totalEnergy = yearData.reduce((sum, d) => sum + (d.primary_energy_consumption || 0), 0);
            const kpiTotal = document.getElementById('kpiTotalEnergy');
            if (kpiTotal) {
                // Convert to 'k' format (thousands)
                kpiTotal.textContent = (totalEnergy / 1000).toFixed(1) + 'k';
            }
            
            // 2. Fossil Fuel Consumption
            const totalFossil = yearData.reduce((sum, d) => sum + (d.fossil_fuel_consumption || 0), 0);
            const kpiFossil = document.getElementById('kpiFossil');
            if (kpiFossil) {
                kpiFossil.textContent = (totalFossil / 1000).toFixed(1) + 'k';
            }
            
            // 3. Renewables Consumption
            const totalRenewables = yearData.reduce((sum, d) => sum + (d.renewables_consumption || 0), 0);
            const kpiRenewables = document.getElementById('kpiRenewables');
            if (kpiRenewables) {
                kpiRenewables.textContent = (totalRenewables / 1000).toFixed(1) + 'k';
            }
            
            // 4. Average GDP per capita
            const avgGDP = yearData.reduce((sum, d) => sum + (d.gdp || 0), 0) / yearData.length;
            const kpiGDP = document.getElementById('kpiGDP');
            if (kpiGDP) {
                kpiGDP.textContent = '$' + (avgGDP / 1000).toFixed(0) + 'k';
            }
        }
    }
};

// --- INITIALIZATION ---
// Start the app only when the DOM is fully loaded to avoid errors
document.addEventListener('DOMContentLoaded', () => {
    Dashboard.init();
});