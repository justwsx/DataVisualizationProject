/**
 * MAIN DASHBOARD CONTROLLER
 * --------------------------------------------------------------------------
 * Acts as the central orchestrator for the application.
 * Responsibilities:
 * 1. Data Loading & Parsing (D3.js).
 * 2. Global State Management (Year, Data, UI State).
 * 3. Component Initialization (Charts).
 * 4. Event Handling (Interactions, Resize, Animation).
 */

const Dashboard = {
    // ----------------------------------------------------------------------
    // 1. STATE VARIABLES
    // ----------------------------------------------------------------------
    currentYear: 2020,
    data: {},            // Holds the raw and processed datasets
    charts: {},          // Registry of initialized chart instances
    isPlaying: false,    // Animation state toggle
    animationTimer: null,// Reference to the animation interval
    viewMode: 'lines',   // Default view for Consumption Chart
    selectedCountry: 'World', // Global filter
    minYear: 1990,
    maxYear: 2022,

    // ----------------------------------------------------------------------
    // 2. CONFIGURATION
    // ----------------------------------------------------------------------
    // Major economies to focus on for specific charts
    majorCountries: [
        "United States", "China", "India", "Japan",
        "Germany", "Russia", "Brazil", "Canada",
        "United Kingdom", "France", "Australia", "South Korea"
    ],

    // Consistent color mapping across all charts
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
     * Application Entry Point.
     * Loads data first, then initializes UI components.
     */
    async init() {
        await this.loadData();
        
        // Ensure data is loaded before rendering
        if (this.data.energy && this.data.energy.length > 0) {
            this.initializeCharts();
            this.setupEventListeners();
            this.updateKPIs();
            console.log("Dashboard initialized successfully");
        } else {
            console.error("No data loaded. Please check the CSV file path.");
        }
    },

    /**
     * Fetches and parses the CSV dataset using D3.js.
     * Converts string values to numbers and filters invalid entries.
     */
    async loadData() {
        try {
            console.log("Loading energy dataset...");
            const rawData = await d3.csv("data/world_energy_cleaned_final.csv");

            if (!rawData || rawData.length === 0) {
                console.error("Failed to load data or empty dataset");
                return;
            }

            // Data Cleaning & Type Conversion
            this.data.energy = rawData.map(d => ({
                country: d.country,
                year: +d.year,
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
                fossil_fuel_consumption: +d.fossil_fuel_consumption,
                oil_price_global: +d.oil_price_global,
                gas_price_global: +d.gas_price_global,
                coal_price_global: +d.coal_price_global
            })).filter(d => d.country && !isNaN(d.year) && !isNaN(d.primary_energy_consumption));

            // Dynamic Date Range Detection
            const years = [...new Set(this.data.energy.map(d => d.year))].sort((a, b) => a - b);
            this.minYear = years[0];
            this.maxYear = years[years.length - 1];

            console.log(`Data loaded: ${this.data.energy.length} records`);

        } catch (error) {
            console.error("Error loading data:", error);
        }
    },

    /**
     * Instantiates all Chart classes if they are defined in the global scope.
     * Passes necessary data and configuration to each instance.
     */
    initializeCharts() {
        console.log("Initializing charts...");
        
        // Defensive checks to ensure classes exist before instantiation
        if (typeof ConsumptionChart !== 'undefined') this.charts.consumption = new ConsumptionChart(this.data.energy, this.majorCountries, this.countryColors);
        if (typeof MixChart !== 'undefined') this.charts.mix = new MixChart(this.data.energy);
        if (typeof RenewablesChart !== 'undefined') this.charts.renewables = new RenewablesChart(this.data.energy, this.majorCountries, this.countryColors);
        if (typeof GDPEnergyChart !== 'undefined') this.charts.gdpEnergy = new GDPEnergyChart(this.data.energy);
        if (typeof CO2EnergyChart !== 'undefined') this.charts.co2Energy = new CO2EnergyChart(this.data.energy);
        if (typeof ShareChart !== 'undefined') this.charts.share = new ShareChart(this.data.energy);
        if (typeof EvolutionChart !== 'undefined') this.charts.evolution = new EvolutionChart(this.data.energy, this.majorCountries, this.countryColors);
        if (typeof LowCarbonChart !== 'undefined') this.charts.lowCarbon = new LowCarbonChart(this.data.energy);
        if (typeof TopConsumersChart !== 'undefined') this.charts.topConsumers = new TopConsumersChart(this.data.energy);
        if (typeof EnergyMapChart !== 'undefined') this.charts.map = new EnergyMapChart(this.data.energy);
        if (typeof FossilPrice !== 'undefined') this.charts.fossilPrice = new FossilPrice(this.data.energy, 'chart-fossilPrice');
        if (typeof EnergyIntensityChart !== 'undefined') this.charts.energyIntensity = new EnergyIntensityChart(this.data.energy);
        
        this.updateAllCharts();
    },

    /**
     * Sets up DOM Event Listeners for UI interactivity.
     * Handles: Slider, Play Button, View Toggles, Resize.
     */
    setupEventListeners() {
        // 1. Time Slider
        const slider = document.getElementById('yearSlider');
        const yearDisplay = document.getElementById('currentYearDisplay');

        if (slider) {
            slider.min = this.minYear;
            slider.max = this.maxYear;
            slider.value = this.currentYear;

            slider.addEventListener('input', (e) => {
                this.currentYear = +e.target.value;
                if (yearDisplay) yearDisplay.textContent = this.currentYear;
                this.updateAllCharts();
                this.updateKPIs();
            });
        }

        // 2. Play/Pause Animation Button
        const playBtn = document.getElementById('playBtn');
        if (playBtn) playBtn.addEventListener('click', () => this.toggleAnimation());

        // 3. View Mode Toggles (e.g., Line vs Area)
        const viewBtns = document.querySelectorAll('.chart-btn[data-view]');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                viewBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.viewMode = e.target.dataset.view;
                this.updateChart1View();
            });
        });

        // 4. Global Window Resize (Responsive Charts)
        window.addEventListener('resize', () => {
            Object.values(this.charts).forEach(chart => {
                if (chart && typeof chart.resize === 'function') chart.resize();
            });
        });
    },

    /**
     * Specific update logic for the Consumption Chart view toggle.
     */
    updateChart1View() {
        if (this.charts.consumption && typeof this.charts.consumption.setViewMode === 'function') {
            this.charts.consumption.setViewMode(this.viewMode);
            this.charts.consumption.update(this.currentYear);
        }
    },

    /**
     * Handles the Play/Pause logic for the time-lapse animation.
     */
    toggleAnimation() {
        this.isPlaying = !this.isPlaying;
        const playBtn = document.getElementById('playBtn');
        const playIcon = playBtn.querySelector('.material-icons-outlined');

        if (this.isPlaying) {
            playIcon.textContent = 'pause';
            this.animateYear();
        } else {
            playIcon.textContent = 'play_arrow';
            if (this.animationTimer) clearTimeout(this.animationTimer);
        }
    },

    /**
     * Recursive function to advance the year automatically.
     */
    animateYear() {
        if (!this.isPlaying) return;

        this.currentYear++;
        if (this.currentYear > this.maxYear) this.currentYear = this.minYear; // Loop back to start

        // Update UI Controls
        const slider = document.getElementById('yearSlider');
        const display = document.getElementById('currentYearDisplay');
        if (slider) slider.value = this.currentYear;
        if (display) display.textContent = this.currentYear;

        // Render Updates
        this.updateAllCharts();
        this.updateKPIs();

        // Recursion loop (1 second interval)
        this.animationTimer = setTimeout(() => this.animateYear(), 1000);
    },

    /**
     * Triggers the .update() method on all registered chart instances.
     */
    updateAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.update === 'function') {
                chart.update(this.currentYear);
            }
        });
    },

    /**
     * Calculates and updates the Key Performance Indicators (KPIs) 
     * displayed at the top of the dashboard.
     */
    updateKPIs() {
        let yearData = this.data.energy.filter(d => d.year === this.currentYear);

        // Apply country filter if selected (currently defaults to 'World')
        if (this.selectedCountry !== 'World') {
            yearData = yearData.filter(d => d.country === this.selectedCountry);
        }

        if (yearData.length > 0) {
            // Aggregate values
            const totalEnergy = yearData.reduce((sum, d) => sum + (d.primary_energy_consumption || 0), 0);
            const totalFossil = yearData.reduce((sum, d) => sum + (d.fossil_fuel_consumption || 0), 0);
            const totalRenewables = yearData.reduce((sum, d) => sum + (d.renewables_consumption || 0), 0);
            const totalGDP = yearData.reduce((sum, d) => sum + (d.gdp || 0), 0);
            const totalPop = yearData.reduce((sum, d) => sum + (d.population || 0), 0);

            // Derived metrics
            const gdpPerCapita = totalPop > 0 ? (totalGDP / totalPop) : 0;

            // DOM Updates
            const kpiTotal = document.getElementById('kpiTotalEnergy');
            if (kpiTotal) kpiTotal.textContent = (totalEnergy / 1000).toFixed(1) + 'k';

            const kpiFossil = document.getElementById('kpiFossil');
            if (kpiFossil) kpiFossil.textContent = (totalFossil / 1000).toFixed(1) + 'k';

            const kpiRenewables = document.getElementById('kpiRenewables');
            if (kpiRenewables) kpiRenewables.textContent = (totalRenewables / 1000).toFixed(1) + 'k';

            const kpiGDP = document.getElementById('kpiGDP');
            if (kpiGDP) {
                kpiGDP.textContent = '$' + (gdpPerCapita / 1000).toFixed(1) + 'k';
            }
        } else {
            // Fallback for missing data
            ['kpiTotalEnergy', 'kpiFossil', 'kpiRenewables', 'kpiGDP'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = '-';
            });
        }
    }
};

// --------------------------------------------------------------------------
// 3. INITIALIZATION
// --------------------------------------------------------------------------

// Initialize Dashboard when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    Dashboard.init();
});

// --------------------------------------------------------------------------
// 4. MOBILE SIDEBAR LOGIC
// --------------------------------------------------------------------------
document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');

    if (toggleBtn) {
        // Toggle Sidebar visibility on mobile
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('mobile-active');
            
            // Switch Icon (Menu <-> Close)
            const icon = toggleBtn.querySelector('span');
            icon.textContent = sidebar.classList.contains('mobile-active') ? 'close' : 'menu';
        });
    }

    // Close sidebar when clicking outside
    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('mobile-active') && !sidebar.contains(e.target)) {
            sidebar.classList.remove('mobile-active');
            toggleBtn.querySelector('span').textContent = 'menu';
        }
    });
});