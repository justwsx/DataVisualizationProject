class TopConsumersChart {
    constructor(data) {
        this.data = data;
        this.container = 'chart-top-consumers';
        
        this.regionColors = {
            "Asia": "#3b82f6",
            "North America": "#6366f1",
            "Europe": "#22c55e",
            "South America": "#f59e0b",
            "Africa": "#ec4899",
            "Oceania": "#14b8a6"
        };

        this.countryRegions = {
            "China": "Asia", "India": "Asia", "United States": "North America",
            "Russia": "Europe", "Japan": "Asia", "Germany": "Europe",
            "Brazil": "South America", "Canada": "North America",
            "United Kingdom": "Europe", "France": "Europe", "Italy": "Europe",
            "Australia": "Oceania", "South Korea": "Asia", "Saudi Arabia": "Asia",
            "Mexico": "North America", "Indonesia": "Asia", "Iran": "Asia",
            "South Africa": "Africa", "Egypt": "Africa", "Nigeria": "Africa",
            "Spain": "Europe", "Poland": "Europe", "Turkey": "Asia",
            "Thailand": "Asia", "Vietnam": "Asia", "Pakistan": "Asia",
            "Argentina": "South America"
        };
    }

    getRegion(country) {
        return this.countryRegions[country] || null;
    }

    formatNumber(num) {
        if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return num.toString();
    }

    update(selectedYear) {
        let yearData = this.data.filter(d => d.year === selectedYear);

        if (yearData.length === 0) {
            const availableYears = [...new Set(this.data.map(d => d.year))].sort((a, b) => b - a);
            yearData = this.data.filter(d => d.year === availableYears[0]);
        }

        const countryData = {};
        yearData.forEach(d => {
            if (!countryData[d.country]) {
                countryData[d.country] = {
                    country: d.country,
                    energy: 0,
                    population: 0,
                    region: this.getRegion(d.country)
                };
            }
            countryData[d.country].energy += d.primary_energy_consumption || 0;
            countryData[d.country].population += d.population || 0;
        });

        const sortedCountries = Object.values(countryData)
            .filter(d => d.region !== null)  // Only countries with known regions
            .sort((a, b) => b.energy - a.energy)
            .slice(0, 15)
            .reverse();

        const countries = sortedCountries.map(d => d.country);
        const energyValues = sortedCountries.map(d => d.energy);
        const regions = sortedCountries.map(d => d.region);
        const populations = sortedCountries.map(d => d.population);

        // Group countries by region for separate traces
        const regionGroups = {};
        const allRegions = Object.keys(this.regionColors);
        
        allRegions.forEach(region => {
            regionGroups[region] = {
                countries: [],
                energies: [],
                populations: []
            };
        });

        sortedCountries.forEach((d, idx) => {
            const region = d.region;
            if (regionGroups[region]) {
                regionGroups[region].countries.push(d.country);
                regionGroups[region].energies.push(d.energy);
                regionGroups[region].populations.push(d.population);
            }
        });

        // Create separate trace for each region
        const traces = allRegions
            .filter(region => regionGroups[region].countries.length > 0)
            .map(region => {
                const group = regionGroups[region];
                
                return {
                    x: group.energies,
                    y: group.countries,
                    type: 'bar',
                    orientation: 'h',
                    name: region,
                    marker: {
                        color: this.regionColors[region],
                        line: {
                            color: 'rgba(255, 255, 255, 0.8)',
                            width: 1.5
                        },
                        opacity: 0.9
                    },
                    text: group.energies.map(v => this.formatNumber(v)),
                    textposition: 'outside',
                    textfont: {
                        family: 'Inter, sans-serif',
                        size: 10,
                        color: '#1e293b',
                        weight: '600'
                    },
                    customdata: group.populations,
                    hovertemplate:
                        '<b>%{y}</b><br>' +
                        'Per Capita: %{x:,.0f} kWh<br>' +
                        'Population: %{customdata:,.0f}<extra></extra>'
                };
            });

        const layout = {
            title: {
                text: '',
                font: { family: 'Inter, sans-serif', size: 0 }
            },
            xaxis: {
                title: 'kWh per capita',
                gridcolor: 'rgba(226, 232, 240, 0.6)',
                showgrid: true,
                zeroline: false,
                tickformat: ',.0f',
                tickfont: { family: 'Inter, sans-serif', size: 11, color: '#64748b' }
            },
            yaxis: {
                title: '',
                automargin: true,
                tickfont: { family: 'Inter, sans-serif', size: 11, color: '#1e293b' }
            },
            margin: { l: 120, r: 100, t: 20, b: 60 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            showlegend: true,
            legend: {
                orientation: 'v',
                x: 1.02,
                y: 0.5,
                xanchor: 'left',
                bgcolor: 'rgba(255,255,255,0.95)',
                bordercolor: 'rgba(226, 232, 240, 0.8)',
                borderwidth: 1,
                font: { family: 'Inter, sans-serif', size: 11, color: '#64748b' },
                title: {
                    text: 'Region',
                    font: { family: 'Inter, sans-serif', size: 12, color: '#1e293b' }
                }
            },
            annotations: [
                {
                    x: 0.5,
                    y: -0.15,
                    xref: 'paper',
                    yref: 'paper',
                    text: 'Colors indicate geographic region | Labels show consumption (T/B/M)',
                    showarrow: false,
                    font: {
                        family: 'Inter, sans-serif',
                        size: 10,
                        color: '#64748b'
                    }
                }
            ]
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
