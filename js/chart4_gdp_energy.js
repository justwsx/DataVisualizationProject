class GDPEnergyChart {
    constructor(data) {
        this.data = data;
        this.container = 'chart-gdp-energy';
        this.countries = [
            "United States", "China", "India", "Japan", "Germany",
            "Russia", "Brazil", "Indonesia", "United Kingdom", "France",
            "Italy", "Canada", "Australia", "South Korea", "Saudi Arabia",
            "Mexico", "Turkey", "South Africa", "Poland", "Thailand"
        ];
        this.regionColors = {
            "Africa": "#ec4899",
            "Asia": "#14b8a6",
            "Europe": "#6366f1",
            "North America": "#f59e0b",
            "South America": "#22c55e",
            "Oceania": "#06b6d4"
        };
        this.countryRegions = {
            "United States": "North America",
            "Canada": "North America",
            "Mexico": "North America",
            "Brazil": "South America",
            "Argentina": "South America",
            "Chile": "South America",
            "United Kingdom": "Europe",
            "Germany": "Europe",
            "France": "Europe",
            "Italy": "Europe",
            "Poland": "Europe",
            "Russia": "Europe",
            "Turkey": "Europe",
            "China": "Asia",
            "India": "Asia",
            "Japan": "Asia",
            "South Korea": "Asia",
            "Indonesia": "Asia",
            "Thailand": "Asia",
            "Australia": "Oceania",
            "South Africa": "Africa"
        };
    }

    update(selectedYear) {
        let yearData = this.data.filter(d => d.year === selectedYear);

        if (yearData.length === 0) {
            const availableYears = [...new Set(this.data.map(d => d.year))].sort((a, b) => b - a);
            yearData = this.data.filter(d => d.year === availableYears[0]);
        }

        yearData = yearData.filter(d => d.primary_energy_consumption > 0 && d.gdp > 0);

        const regions = [...new Set(yearData.map(d => this.getRegion(d.country)).filter(r => r))];

        const traces = regions.map(region => {
            const regionData = yearData.filter(d => this.getRegion(d.country) === region);

            return {
                x: regionData.map(d => d.gdp / 1000000000),
                y: regionData.map(d => d.primary_energy_consumption),
                text: regionData.map(d => d.country),
                mode: 'markers',
                type: 'scatter',
                name: region || 'Other',
                marker: {
                    size: regionData.map(d => Math.sqrt(d.population || 1000000) / 80 + 8),
                    sizemode: 'area',
                    sizeref: 2,
                    color: this.regionColors[region] || '#94a3b8',
                    opacity: 0.7,
                    line: { color: 'white', width: 1 }
                },
                hovertemplate: '<b>%{text}</b><br>GDP: $%{x:,.1f}B<br>Energy: %{y:,.0f} kWh<extra></extra>'
            };
        });

        const majorCountryData = yearData
            .filter(d => this.countries.includes(d.country))
            .sort((a, b) => b.primary_energy_consumption - a.primary_energy_consumption)
            .slice(0, 12);

        const labelTraces = majorCountryData.map(country => {
            return {
                x: [country.gdp / 1000000000],
                y: [country.primary_energy_consumption],
                mode: 'text',
                type: 'scatter',
                text: [country.country],
                textposition: 'top center',
                textfont: {
                    family: 'Inter, sans-serif',
                    size: 9,
                    color: '#1e293b'
                },
                hoverinfo: 'skip',
                showlegend: false
            };
        });

        const layout = {
            title: {
                text: 'Energy Consumption vs GDP (kWh per capita)',
                font: {
                    family: 'Inter, sans-serif',
                    size: 16,
                    color: '#1e293b'
                }
            },
            xaxis: {
                title: 'GDP (Billion USD)',
                type: 'log',
                range: [Math.log10(1000), Math.log10(500000)],
                gridcolor: 'rgba(226, 232, 240, 0.8)',
                showgrid: true,
                zeroline: false,
                tickfont: {
                    family: 'Inter, sans-serif',
                    size: 11,
                    color: '#64748b'
                }
            },
            yaxis: {
                title: 'kWh per capita',
                type: 'log',
                range: [Math.log10(100), Math.log10(200000)],
                gridcolor: 'rgba(226, 232, 240, 0.8)',
                showgrid: true,
                zeroline: false,
                tickfont: {
                    family: 'Inter, sans-serif',
                    size: 11,
                    color: '#64748b'
                }
            },
            margin: { l: 60, r: 20, t: 60, b: 60 },
            hovermode: 'closest',
            showlegend: true,
            legend: {
                orientation: 'h',
                x: 0.5,
                y: -0.25,
                xanchor: 'center',
                bgcolor: 'rgba(255,255,255,0.95)',
                bordercolor: 'rgba(226, 232, 240, 0.8)',
                borderwidth: 1,
                font: {
                    family: 'Inter, sans-serif',
                    size: 10
                }
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            annotations: [
                {
                    x: 0.02,
                    y: 0.98,
                    xref: 'paper',
                    yref: 'paper',
                    text: 'Bubble size = Population',
                    showarrow: false,
                    font: {
                        family: 'Inter, sans-serif',
                        size: 10,
                        color: '#64748b'
                    },
                    bgcolor: 'rgba(255,255,255,0.9)',
                    bordercolor: 'rgba(226, 232, 240, 0.8)',
                    borderwidth: 1,
                    borderpad: 4
                }
            ]
        };

        const config = {
            responsive: true,
            displayModeBar: false
        };

        Plotly.react(this.container, [...traces, ...labelTraces], layout, config);
    }

    getRegion(country) {
        return this.countryRegions[country] || 'Other';
    }

    resize() {
        Plotly.Plots.resize(document.getElementById(this.container));
    }
}