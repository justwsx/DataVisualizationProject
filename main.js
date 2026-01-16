const Dashboard = {
    currentYear: 2020,
    data: {},
    charts: {},
    isPlaying: false,
    animationTimer: null,
    viewMode: 'lines',
    selectedCountry: 'World', // Default view
    minYear: 1990,
    maxYear: 2022,
    
    // Configurazione colori e paesi principali
    majorCountries: [
        "United States", "China", "India", "Japan", 
        "Germany", "Russia", "Brazil", "Canada", 
        "United Kingdom", "France", "Australia", "South Korea", "Italy"
    ],
    
    countryColors: {
        "World": "#3b82f6",
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
        "South Korea": "#a855f7",
        "Italy": "#10b981"
    },

    async init() {
        await this.loadData();
        if (this.data.energy && this.data.energy.length > 0) {
            this.initializeCharts();
            this.setupEventListeners();
            this.updateKPIs(); // Calcola i KPI iniziali
            console.log("Dashboard initialized. Mode: Narrative");
        } else {
            console.error("No data loaded.");
        }
    },

    async loadData() {
        try {
            // Assicurati che il percorso del file sia corretto
            const rawData = await d3.csv("data/world_clean_dataset.csv");
            
            if (!rawData || rawData.length === 0) return;
            
            // Parsing dei dati
            this.data.energy = rawData.map(d => ({
                country: d.country,
                year: +d.year,
                gdp: +d.gdp,
                population: +d.population,
                primary_energy_consumption: +d.primary_energy_consumption, // TWh
                coal_cons_per_capita: +d.coal_cons_per_capita,
                gas_energy_per_capita: +d.gas_energy_per_capita,
                hydro_elec_per_capita: +d.hydro_elec_per_capita,
                low_carbon_energy_per_capita: +d.low_carbon_energy_per_capita,
                oil_energy_per_capita: +d.oil_energy_per_capita,
                renewables_energy_per_capita: +d.renewables_energy_per_capita,
                renewables_consumption: +d.renewables_consumption, // TWh
                fossil_fuel_consumption: +d.fossil_fuel_consumption // TWh
            })).filter(d => d.country && !isNaN(d.year));
            
            // Determina range anni
            const years = [...new Set(this.data.energy.map(d => d.year))].sort((a, b) => a - b);
            this.minYear = years[0];
            this.maxYear = years[years.length - 1];
            
            // Aggiorna slider HTML
            const slider = document.getElementById('yearSlider');
            if (slider) {
                slider.min = this.minYear;
                slider.max = this.maxYear;
            }
            
        } catch (error) {
            console.error("Error loading data:", error);
        }
    },

    initializeCharts() {
        // Inizializza i grafici solo se le classi esistono
        // Chart 1: Consumption
        if (typeof ConsumptionChart !== 'undefined') 
            this.charts.consumption = new ConsumptionChart(this.data.energy, this.majorCountries, this.countryColors);
        
        // Chart 2: Mix
        if (typeof MixChart !== 'undefined') 
            this.charts.mix = new MixChart(this.data.energy);
        
        // Chart 3: Renewables
        if (typeof RenewablesChart !== 'undefined') 
            this.charts.renewables = new RenewablesChart(this.data.energy, this.majorCountries, this.countryColors);
        
        // Chart 4: GDP vs Energy
        if (typeof GDPEnergyChart !== 'undefined') 
            this.charts.gdpEnergy = new GDPEnergyChart(this.data.energy);
        
        // Chart 5: CO2
        if (typeof CO2EnergyChart !== 'undefined') 
            this.charts.co2Energy = new CO2EnergyChart(this.data.energy);
        
        // Chart 6: Share
        if (typeof ShareChart !== 'undefined') 
            this.charts.share = new ShareChart(this.data.energy);
        
        // Chart 7: Evolution
        if (typeof EvolutionChart !== 'undefined') 
            this.charts.evolution = new EvolutionChart(this.data.energy, this.majorCountries, this.countryColors);
        
        // Chart 8: Low Carbon
        if (typeof LowCarbonChart !== 'undefined') 
            this.charts.lowCarbon = new LowCarbonChart(this.data.energy);
        
        // Chart 9: Top Consumers
        if (typeof TopConsumersChart !== 'undefined') 
            this.charts.topConsumers = new TopConsumersChart(this.data.energy);
        
        // Chart 10: Map
        if (typeof EnergyMapChart !== 'undefined') 
            this.charts.map = new EnergyMapChart(this.data.energy);
        
        this.updateAllCharts();
    },

    setupEventListeners() {
        // 1. Time Travel Slider
        const slider = document.getElementById('yearSlider');
        const yearDisplay = document.getElementById('currentYearDisplay');
        
        if (slider) {
            slider.addEventListener('input', (e) => {
                this.currentYear = +e.target.value;
                if (yearDisplay) yearDisplay.textContent = this.currentYear;
                this.updateAllCharts();
                this.updateKPIs();
            });
        }
        
        // 2. Play Button
        const playBtn = document.getElementById('playBtn');
        if (playBtn) {
            playBtn.addEventListener('click', () => this.toggleAnimation());
        }
        
        // 3. View Mode Buttons (Lines/Area)
        const viewBtns = document.querySelectorAll('.chart-btn[data-view]');
        viewBtns.forEach(btn => {
            btn.addEventListener('click', (e) => {
                viewBtns.forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.viewMode = e.target.dataset.view;
                this.updateChart1View();
            });
        });
        
        // 4. Country Selector
        const countrySelect = document.getElementById('countrySelect');
        if (countrySelect) {
            // Popoliamo dinamicamente solo se non ci sono già opzioni (tranne World)
            if (countrySelect.options.length <= 1) {
                const countries = [...new Set(this.data.energy.map(d => d.country))].sort();
                countries.forEach(country => {
                    if (country !== "World") { // World è già hardcoded
                        const option = document.createElement('option');
                        option.value = country;
                        option.textContent = country;
                        countrySelect.appendChild(option);
                    }
                });
            }
            
            countrySelect.addEventListener('change', (e) => {
                this.selectedCountry = e.target.value;
                this.updateAllCharts();
                this.updateKPIs(); // Importante: aggiorna i numeri in alto quando cambia il paese
            });
        }
        
        // 5. Resize Handler
        window.addEventListener('resize', () => {
            Object.values(this.charts).forEach(chart => {
                if (chart && typeof chart.resize === 'function') chart.resize();
            });
        });
    },

    updateChart1View() {
        if (this.charts.consumption) {
            this.charts.consumption.setViewMode(this.viewMode);
            this.charts.consumption.update(this.currentYear);
        }
    },

    toggleAnimation() {
        this.isPlaying = !this.isPlaying;
        const playBtn = document.getElementById('playBtn');
        const playIcon = playBtn.querySelector('.material-icons-outlined');
        const playText = playBtn.querySelector('span:last-child');
        
        if (this.isPlaying) {
            playIcon.textContent = 'pause_circle';
            playText.textContent = 'Pause';
            this.animateYear();
        } else {
            playIcon.textContent = 'play_circle';
            playText.textContent = 'Visualize';
            if (this.animationTimer) clearTimeout(this.animationTimer);
        }
    },

    animateYear() {
        if (!this.isPlaying) return;
        
        this.currentYear++;
        if (this.currentYear > this.maxYear) this.currentYear = this.minYear;
        
        // Sync UI
        const slider = document.getElementById('yearSlider');
        const display = document.getElementById('currentYearDisplay');
        if (slider) slider.value = this.currentYear;
        if (display) display.textContent = this.currentYear;
        
        this.updateAllCharts();
        this.updateKPIs();
        
        this.animationTimer = setTimeout(() => this.animateYear(), 800); // Velocità animazione
    },

    updateAllCharts() {
        Object.values(this.charts).forEach(chart => {
            if (chart && typeof chart.update === 'function') {
                // Passiamo sia anno che paese selezionato ai grafici
                chart.update(this.currentYear, this.selectedCountry);
            }
        });
    },

    // --- LOGICA KPI DINAMICA ---
    updateKPIs() {
        // 1. Trova i dati per l'anno corrente e il paese selezionato
        let currentData = this.data.energy.find(d => d.year === this.currentYear && d.country === this.selectedCountry);
        
        // 2. Trova i dati dell'anno precedente (per il calcolo del trend)
        let prevData = this.data.energy.find(d => d.year === (this.currentYear - 1) && d.country === this.selectedCountry);

        // Funzione helper per aggiornare una singola card
        const updateCard = (elementId, value, prevValue, unit = '', isCurrency = false) => {
            const elValue = document.getElementById(elementId);
            if (!elValue) return;

            // Aggiorna Valore Principale
            elValue.innerText = formatNumberCompact(value, isCurrency) + (unit ? ' ' + unit : '');

            // Aggiorna Trend (Percentuale)
            const card = elValue.closest('.kpi-card');
            const trendDiv = card ? card.querySelector('.kpi-trend') : null;
            
            if (trendDiv && prevValue) {
                const diff = value - prevValue;
                const pct = (diff / prevValue) * 100;
                const isPositive = diff >= 0;
                
                // Rimuovi classi vecchie
                trendDiv.classList.remove('positive', 'negative');
                
                // Logica colore:
                // Per Energia Totale, GDP, Rinnovabili -> Verde se cresce (+)
                // Per Fossili -> Verde se decresce (-) (Opzionale, ma manteniamo standard "Verde = Crescita" per coerenza visiva o "Verde = Bene"?)
                // Per ora uso: Verde = Crescita numerica, Rosa = Decrescita numerica.
                trendDiv.classList.add(isPositive ? 'positive' : 'negative');
                
                const icon = trendDiv.querySelector('.material-icons-outlined');
                const text = trendDiv.querySelector('span:last-child');
                
                if (icon) icon.textContent = isPositive ? 'trending_up' : 'trending_down';
                if (text) text.textContent = `${isPositive ? '+' : ''}${pct.toFixed(1)}% vs prev.`;
            } else if (trendDiv) {
                trendDiv.innerHTML = '<span>Data n/a</span>';
            }
        };

        if (currentData) {
            updateCard('kpiTotalEnergy', currentData.primary_energy_consumption, prevData?.primary_energy_consumption, 'TWh');
            updateCard('kpiFossil', currentData.fossil_fuel_consumption, prevData?.fossil_fuel_consumption, 'TWh');
            updateCard('kpiRenewables', currentData.renewables_consumption, prevData?.renewables_consumption, 'TWh');
            updateCard('kpiGDP', currentData.gdp, prevData?.gdp, '', true);
        } else {
            // Se non ci sono dati per quel paese/anno
            ['kpiTotalEnergy', 'kpiFossil', 'kpiRenewables', 'kpiGDP'].forEach(id => {
                const el = document.getElementById(id);
                if(el) el.innerText = '--';
            });
        }
    }
};

// --- HELPER FUNCTION PER FORMATTAZIONE NUMERI (Es. 1.5k, 20M) ---
function formatNumberCompact(num, isCurrency = false) {
    if (num === undefined || num === null || isNaN(num)) return '--';
    
    let n = parseFloat(num);
    
    // Gestione numeri molto piccoli (es. 0)
    if (n === 0) return isCurrency ? '$0' : '0';

    const lookup = [
        { value: 1, symbol: "" },
        { value: 1e3, symbol: "k" },
        { value: 1e6, symbol: "M" },
        { value: 1e9, symbol: "B" }, // Billions
        { value: 1e12, symbol: "T" } // Trillions
    ];
    
    const rx = /\.0+$|(\.[0-9]*[1-9])0+$/;
    
    // Trova il suffisso corretto
    var item = lookup.slice().reverse().find(function(item) {
        return n >= item.value;
    });
    
    let formatted = item ? (n / item.value).toFixed(1).replace(rx, "$1") + item.symbol : "0";
    
    return isCurrency ? "$" + formatted : formatted;
}

// Avvio
document.addEventListener('DOMContentLoaded', () => {
    Dashboard.init();
});