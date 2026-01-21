class LowCarbonChart {
    constructor(data, majorCountries = [], countryColors = {}) {
        this.data = data;
        this.container = 'chart-low-carbon';

        const availableCountries = [...new Set(data.map(d => d.country))];

        if (majorCountries.length > 0) {
            this.selectedCountries = majorCountries.filter(c => availableCountries.includes(c));
        } else {
            this.selectedCountries = ["United States", "China", "Germany", "Brazil", "Japan"]
                .filter(c => availableCountries.includes(c));
        }
    }

    update(selectedYear) {
        let yearData = this.data.filter(d => d.year === selectedYear);

        if (yearData.length === 0) {
            const availableYears = [...new Set(this.data.map(d => d.year))].sort((a, b) => b - a);
            yearData = this.data.filter(d => d.year === availableYears[0]);
        }

        const countryTotals = {};
        yearData.forEach(d => {
            if (this.selectedCountries.includes(d.country)) {
                if (!countryTotals[d.country]) {
                    countryTotals[d.country] = {
                        country: d.country,
                        hydro: 0,
                        renewables: 0,
                        nuclear: 0
                    };
                }
                countryTotals[d.country].hydro += d.hydro_elec_per_capita || 0;
                countryTotals[d.country].renewables += d.renewables_energy_per_capita || 0;
                const nuclear = (d.low_carbon_energy_per_capita || 0) -
                               (d.hydro_elec_per_capita || 0) -
                               (d.renewables_energy_per_capita || 0);
                countryTotals[d.country].nuclear += Math.max(0, nuclear);
            }
        });

        const countries = Object.keys(countryTotals);
        const chartData = Object.values(countryTotals);

        if (countries.length === 0) return;

        const traces = [
            {
                x: countries,
                y: chartData.map(d => d.hydro),
                name: 'Hydroelectric',
                type: 'bar',
                marker: {
                    color: '#2b75ebff',
                    line: { color: 'rgba(255, 255, 255, 0.5)', width: 1 }
                },
                hovertemplate: '<b>Hydroelectric</b><br>Country: %{x}<br>Value: %{y:,.0f} kWh<extra></extra>'
            },
            {
                x: countries,
                y: chartData.map(d => d.renewables),
                name: 'Renewables (Non-Hydro)',
                type: 'bar',
                marker: {
                    color: '#22c55e', // Changed to Green
                    line: { color: 'rgba(255, 255, 255, 0.5)', width: 1 }
                },
                hovertemplate: '<b>Renewables</b><br>Country: %{x}<br>Value: %{y:,.0f} kWh<extra></extra>'
            },
            {
                x: countries,
                y: chartData.map(d => d.nuclear),
                name: 'Nuclear',
                type: 'bar',
                marker: {
                    color: '#8b5cf6', // Changed to Purple
                    line: { color: 'rgba(255, 255, 255, 0.5)', width: 1 }
                },
                hovertemplate: '<b>Nuclear</b><br>Country: %{x}<br>Value: %{y:,.0f} kWh<extra></extra>'
            }
        ];

        const layout = {
            barmode: 'group',
            title: {
                text: 'Low-Carbon Energy Consumption by Country (kWh per capita)',
                font: {
                    family: 'Inter, sans-serif',
                    size: 16,
                    color: '#1e293b'
                }
            },
            xaxis: {
                title: '',
                tickfont: {
                    family: 'Inter, sans-serif',
                    size: 11,
                    color: '#64748b'
                }
            },
            yaxis: {
                title: 'kWh per capita',
                gridcolor: 'rgba(226, 232, 240, 0.8)',
                showgrid: true,
                zeroline: false,
                tickfont: {
                    family: 'Inter, sans-serif',
                    size: 11,
                    color: '#64748b'
                }
            },
            margin: { l: 60, r: 20, t: 60, b: 50 },
            hovermode: 'closest',
            showlegend: true,
            legend: {
                orientation: 'h',
                x: 0.5,
                y: 1.05,
                xanchor: 'center',
                bgcolor: 'transparent',
                font: {
                    family: 'Inter, sans-serif',
                    size: 10,
                    color: '#64748b'
                }
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)'
        };

        const config = {
            responsive: true,
            displayModeBar: false
        };

        Plotly.react(this.container, traces, layout, config);
    }

    resize() {
        Plotly.Plots.resize(document.getElementById(this.container));
    }
}
