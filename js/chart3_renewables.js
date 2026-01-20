class RenewablesChart {
    constructor(data, majorCountries, countryColors) {
        this.data = data;
        this.countries = majorCountries;
        this.countryColors = countryColors;
        this.container = 'chart-renewables';
        
        // Define the specific country to always highlight as a benchmark
        this.benchmark = "Norway"; 
        
        this.identifyKeyCompetitors();
    }

    /**
     * Identifies which countries should be highlighted in the chart
     * based on historical performance and predefined benchmarks.
     */
    identifyKeyCompetitors() {
        const startYear = 1990;
        const endYear = 2022;
        const target = "Canada";

        // Find the top performer in 1990 (excluding the target country)
        const data1990 = this.data.filter(d => 
            d.year === startYear && 
            d.country !== target && 
            this.countries.includes(d.country)
        );
        this.rival1990 = data1990.sort((a, b) => b.renewables_energy_per_capita - a.renewables_energy_per_capita)[0]?.country || "1990 Leader";

        // Find the top performer in 2022 (excluding the target country)
        const data2022 = this.data.filter(d => 
            d.year === endYear && 
            d.country !== target && 
            this.countries.includes(d.country)
        );
        this.rival2022 = data2022.sort((a, b) => b.renewables_energy_per_capita - a.renewables_energy_per_capita)[0]?.country || "2022 Leader";

        // Aggregate all countries that need to be visually emphasized
        // Using a Set ensures we don't have duplicates if a country fits multiple criteria
        this.highlighted = [...new Set(["Canada", this.rival1990, this.rival2022, this.benchmark])];
    }

    /**
     * Updates the Plotly chart based on the selected year
     * @param {number} currentYear - The year to calculate the gap and position annotations
     */
    update(currentYear) {
        const main = "Canada";
        
        // Generate traces for all countries
        const traces = this.countries.map(country => {
            const countryData = this.data
                .filter(d => d.country === country && d.year <= 2022)
                .sort((a, b) => a.year - b.year);

            if (countryData.length === 0) return null;

            const isHighlighted = this.highlighted.includes(country);
            
            return {
                x: countryData.map(d => d.year),
                y: countryData.map(d => d.renewables_energy_per_capita || 0),
                name: country,
                mode: 'lines',
                line: {
                    // Use specific color if highlighted, otherwise use a muted gray
                    color: isHighlighted ? (this.countryColors[country] || '#64748b') : '#e2e8f0',
                    width: isHighlighted ? 4 : 1.5,
                    shape: 'spline'
                },
                // Only show hover labels for highlighted countries to keep the UI clean
                hoverinfo: isHighlighted ? 'all' : 'skip',
                showlegend: false
            };
        }).filter(t => t !== null);

        // Calculate values for the Gap Analysis (Canada vs 1990 Leader)
        const yearData = this.data.filter(d => d.year === currentYear);
        const canVal = yearData.find(d => d.country === main)?.renewables_energy_per_capita || 0;
        const riv1990Val = yearData.find(d => d.country === this.rival1990)?.renewables_energy_per_capita || 0;

        const gap1990 = Math.abs(canVal - riv1990Val);

        const layout = {
            // Updated title to include the main rivals and avoid 'undefined'
            title: { 
                text: `<b>Renewables Gap: ${main} vs ${this.rival1990} & ${this.benchmark}</b>`, 
                x: 0.05,
                font: { size: 18, color: '#1e293b' }
            },
            xaxis: { 
                range: [1989.5, 2023.5], 
                gridcolor: 'rgba(226, 232, 240, 0.6)',
                title: 'Year'
            },
            yaxis: { 
                ticksuffix: ' kWh', 
                gridcolor: 'rgba(226, 232, 240, 0.6)',
                title: 'Energy per capita'
            },
            margin: { l: 70, r: 50, t: 80, b: 50 },
            hovermode: 'x unified',
            showlegend: false,
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            annotations: [
                {
                    x: currentYear, 
                    y: (canVal + riv1990Val) / 2, 
                    xref: 'x', 
                    yref: 'y',
                    text: `Gap to ${this.rival1990}:<br><b>${gap1990.toLocaleString()}</b> kWh`,
                    showarrow: true, 
                    arrowhead: 0, 
                    ax: -80, 
                    ay: 0,
                    font: { size: 11, color: '#475569' },
                    bgcolor: 'white', 
                    bordercolor: '#94a3b8', 
                    borderwidth: 1, 
                    borderpad: 5
                }
            ],
            shapes: [
                // Vertical gap line between Canada and the 1990 rival
                {
                    type: 'line',
                    x0: currentYear, x1: currentYear, 
                    y0: canVal, y1: riv1990Val,
                    xref: 'x', yref: 'y',
                    line: { color: '#94a3b8', width: 2, dash: 'solid' }
                },
                // Timeline indicator (green dotted line)
                {
                    type: 'line', 
                    x0: currentYear, x1: currentYear, 
                    y0: 0, y1: 1, 
                    xref: 'x', yref: 'paper',
                    line: { color: '#22c55e', width: 1, dash: 'dot' }
                }
            ]
        };

        Plotly.react(this.container, traces, layout, { 
            responsive: true, 
            displayModeBar: false 
        });
    }

    /**
     * Triggers Plotly's resize method to ensure the chart fits its container
     */
    resize() {
        const containerElem = document.getElementById(this.container);
        if (containerElem) {
            Plotly.Plots.resize(containerElem);
        }
    }
}