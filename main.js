const Dashboard = {
    // --- STATE VARIABLES ---
    currentYear: 2020,
    data: {},
    charts: {},
    isPlaying: false,
    animationTimer: null,
    viewMode: 'lines',
    selectedCountry: 'World',
    minYear: 1990,
    maxYear: 2022,

    // --- CONFIGURATION ---
    majorCountries: [
        "United States", "China", "India", "Japan",
        "Germany", "Russia", "Brazil", "Canada",
        "United Kingdom", "France", "Australia", "South Korea"
    ],

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

    async init() {
        await this.loadData();
        if (this.data.energy && this.data.energy.length > 0) {
            this.initializeCharts();
            this.setupEventListeners();
            this.updateKPIs();
            console.log("Dashboard initialized successfully");
        } else {
            console.error("No data loaded. Please check the CSV file.");
        }
    },

    async loadData() {
        try {
            console.log("Loading energy dataset...");
            const rawData = await d3.csv("data/world_energy_cleaned_final.csv");

            if (!rawData || rawData.length === 0) {
                console.error("Failed to load data or empty dataset");
                return;
            }

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

            const years = [...new Set(this.data.energy.map(d => d.year))].sort((a, b) => a - b);
            this.minYear = years[0];
            this.maxYear = years[years.length - 1];

            console.log(`Data loaded: ${this.data.energy.length} records`);

        } catch (error) {
            console.error("Error loading data:", error);
        }
    },

    initializeCharts() {
        console.log("Initializing charts...");
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
        if (typeof EnergyIntensityChart !== 'undefined') { this.charts.energyIntensity = new EnergyIntensityChart(this.data.energy); }
        this.updateAllCharts();
    },

    setupEventListeners() {
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

        const playBtn = document.getElementById('playBtn');
        if (playBtn) playBtn.addEventListener('click', () => this.toggleAnimation());

        const viewBtns = document.querySelectorAll('.chart-btn[data-view]');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                viewBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.viewMode = e.target.dataset.view;
                this.updateChart1View();
            });
        });

        const countrySelect = document.getElementById('countrySelect');
        if (countrySelect) {
            const countries = [...new Set(this.data.energy.map(d => d.country))].sort();
            countries.forEach(country => {
                const option = document.createElement('option');
                option.value = country;
                option.textContent = country;
                if (country === "World" || this.majorCountries.includes(country)) {
                    countrySelect.appendChild(option);
                }
            });

            countrySelect.addEventListener('change', (e) => {
                this.selectedCountry = e.target.value;
                this.updateAllCharts();
                this.updateKPIs();
            });
        }

        window.addEventListener('resize', () => {
            Object.values(this.charts).forEach(chart => {
                if (chart && typeof chart.resize === 'function') chart.resize();
            });
        });
    },

    updateChart1View() {
        if (this.charts.consumption && typeof this.charts.consumption.setViewMode === 'function') {
            this.charts.consumption.setViewMode(this.viewMode);
            this.charts.consumption.update(this.currentYear);
        }
    },

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

    animateYear() {
        if (!this.isPlaying) return;

        this.currentYear++;
        if (this.currentYear > this.maxYear) this.currentYear = this.minYear;

        const slider = document.getElementById('yearSlider');
        const display = document.getElementById('currentYearDisplay');
        if (slider) slider.value = this.currentYear;
        if (display) display.textContent = this.currentYear;

        this.updateAllCharts();
        this.updateKPIs();

        this.animationTimer = setTimeout(() => this.animateYear(), 1000);
    },

    updateAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.update === 'function') {
                chart.update(this.currentYear);
            }
        });
    },


    updateKPIs() {

        let yearData = this.data.energy.filter(d => d.year === this.currentYear);

        if (this.selectedCountry !== 'World') {
            yearData = yearData.filter(d => d.country === this.selectedCountry);
        }

        if (yearData.length > 0) {

            const totalEnergy = yearData.reduce((sum, d) => sum + (d.primary_energy_consumption || 0), 0);
            const totalFossil = yearData.reduce((sum, d) => sum + (d.fossil_fuel_consumption || 0), 0);
            const totalRenewables = yearData.reduce((sum, d) => sum + (d.renewables_consumption || 0), 0);


            const totalGDP = yearData.reduce((sum, d) => sum + (d.gdp || 0), 0);
            const totalPop = yearData.reduce((sum, d) => sum + (d.population || 0), 0);

            const gdpPerCapita = totalPop > 0 ? (totalGDP / totalPop) : 0;


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

            ['kpiTotalEnergy', 'kpiFossil', 'kpiRenewables', 'kpiGDP'].forEach(id => {
                const el = document.getElementById(id);
                if (el) el.textContent = '-';
            });
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    Dashboard.init();
});

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const toggleBtn = document.getElementById('sidebarToggle');

    if (toggleBtn) {
        toggleBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            sidebar.classList.toggle('mobile-active');
            const icon = toggleBtn.querySelector('span');
            icon.textContent = sidebar.classList.contains('mobile-active') ? 'close' : 'menu';
        });
    }

    document.addEventListener('click', (e) => {
        if (sidebar.classList.contains('mobile-active') && !sidebar.contains(e.target)) {
            sidebar.classList.remove('mobile-active');
            toggleBtn.querySelector('span').textContent = 'menu';
        }
    });
});

