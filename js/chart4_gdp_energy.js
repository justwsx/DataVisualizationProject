class GDPEnergyChart {
    constructor(data) {
        this.data = data;
        this.container = 'chart-gdp-energy';

        this.regionColors = {
            "Africa": "#dc2626",
            "Asia": "#0891b2",
            "Europe": "#7c3aed",
            "North America": "#ea580c",
            "South America": "#16a34a",
            "Oceania": "#eaa400",
            "Other": "#6b7280"
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
            "Russia": "Asia",
            "Turkey": "Asia",
            "Spain": "Europe",
            "Netherlands": "Europe",
            "Belgium": "Europe",
            "Sweden": "Europe",
            "Norway": "Europe",
            "Switzerland": "Europe",
            "China": "Asia",
            "India": "Asia",
            "Japan": "Asia",
            "South Korea": "Asia",
            "Indonesia": "Asia",
            "Thailand": "Asia",
            "Saudi Arabia": "Asia",
            "Iran": "Asia",
            "Vietnam": "Asia",
            "Pakistan": "Asia",
            "Bangladesh": "Asia",
            "Australia": "Oceania",
            "South Africa": "Africa",
            "Egypt": "Africa",
            "Nigeria": "Africa",
            "Kenya": "Africa",
            "Morocco": "Africa"
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
                name: region,
                marker: {
                    size: regionData.map(d => Math.sqrt(d.population || 1000000) / 80 + 10),
                    sizemode: 'area',
                    sizeref: 2,
                    color: this.regionColors[region] || '#6b7280',
                    opacity: 0.85,
                    line: { color: 'white', width: 1.5 }
                },
                customdata: regionData.map(d => d.population),
                hovertemplate: 
                    '<b>%{text}</b><br>' +
                    'GDP: $%{x:,.1f}B<br>' +
                    'Energy: %{y:,.0f} kWh per capita<br>' +
                    'Population: %{customdata:,.0f}<extra></extra>'
            };
        });

        const layout = {
            title: {
                text: 'Energy Consumption vs GDP per Capita',
                font: {
                    family: 'Inter, sans-serif',
                    size: 18,
                    color: '#1e293b',
                    weight: 'bold'
                }
            },
            xaxis: {
                title: {
                    text: 'GDP per Capita',
                    font: { size: 13, family: 'Inter, sans-serif', color: '#475569' }
                },
                type: 'log',
                range: [Math.log10(1000), Math.log10(300000)],
                showgrid: true,
                gridcolor: 'rgba(226, 232, 240, 0.4)',
                gridwidth: 1,
                zeroline: false,
                tickmode: 'array',
                tickvals: [1000, 5000, 10000, 50000, 100000, 200000],
                ticktext: ['1k', '5k', '10k', '50k', '100k', '200k'],
                tickformat: '$,.0f',
                tickfont: {
                    family: 'Inter, sans-serif',
                    size: 11,
                    color: '#64748b'
                }
            },
            yaxis: {
                title: {
                    text: 'Primary Energy Consumption',
                    font: { size: 13, family: 'Inter, sans-serif', color: '#475569' }
                },
                type: 'log',
                range: [Math.log10(50), Math.log10(300000)],
                showgrid: true,
                gridcolor: 'rgba(226, 232, 240, 0.4)',
                gridwidth: 1,
                zeroline: false,
                tickmode: 'array',
                tickvals: [100, 500, 1000, 5000, 10000, 50000, 100000],
                ticktext: ['100', '500', '1k', '5k', '10k', '50k', '100k'],
                tickformat: ',.0f',
                tickfont: {
                    family: 'Inter, sans-serif',
                    size: 11,
                    color: '#64748b'
                }
            },
            margin: { l: 100, r: 20, t: 70, b: 130 },
            hovermode: 'closest',
            showlegend: true,
            legend: {
                orientation: 'h',
                x: 0.5,
                y: -0.5,
                xanchor: 'center',
                bgcolor: 'rgba(255,255,255,0.95)',
                bordercolor: 'rgba(226, 232, 240, 0.8)',
                borderwidth: 1,
                font: {
                    family: 'Inter, sans-serif',
                    size: 12
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
                        size: 11,
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

        Plotly.react(this.container, traces, layout, config);
    }

    getRegion(country) {
        return this.countryRegions[country] || 'Other';
    }

    resize() {
        Plotly.Plots.resize(document.getElementById(this.container));
    }
}
