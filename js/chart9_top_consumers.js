class TopConsumersChart {
    constructor(data) {
        this.data = data;
        this.container = 'chart-top-consumers';
        this.colors = [
            '#6366f1', '#818cf8', '#a5b4fc', '#c7d2fe',
            '#ec4899', '#f472b6', '#f9a8d4', '#fbcfe8',
            '#14b8a6', '#2dd4bf', '#5eead4', '#99f6e4',
            '#f59e0b', '#fbbf24', '#fcd34d', '#fde68a',
            '#22c55e', '#4ade80', '#86efac', '#bbf7d0'
        ];
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
                    population: 0
                };
            }
            countryData[d.country].energy += d.primary_energy_consumption || 0;
            countryData[d.country].population += d.population || 0;
        });

        const sortedCountries = Object.values(countryData)
            .sort((a, b) => b.energy - a.energy)
            .slice(0, 20)
            .reverse();

        const countries = sortedCountries.map(d => d.country);
        const energyValues = sortedCountries.map(d => d.energy);
        const totalEnergy = sortedCountries.map(d => (d.energy * d.population / 1000000).toFixed(1));

        const trace = {
            x: energyValues,
            y: countries,
            type: 'bar',
            orientation: 'h',
            marker: {
                color: energyValues.map((_, i) => this.colors[i % this.colors.length]),
                line: {
                    color: 'rgba(255, 255, 255, 0.5)',
                    width: 1
                }
            },
            hovertemplate: '<b>%{y}</b><br>Per Capita: %{x:,.0f} kWh<br>Total: %{text} MWh<extra></extra>',
            text: totalEnergy
        };

        const layout = {
            title: {
                text: 'Top 20 Energy Consumers (kWh per capita)',
                font: {
                    family: 'Inter, sans-serif',
                    size: 16,
                    color: '#1e293b'
                }
            },
            xaxis: {
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
            yaxis: {
                title: '',
                automargin: true,
                tickfont: {
                    family: 'Inter, sans-serif',
                    size: 11,
                    color: '#64748b'
                }
            },
            margin: { l: 140, r: 20, t: 60, b: 40 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            showlegend: false
        };

        const config = {
            responsive: true,
            displayModeBar: false
        };

        Plotly.react(this.container, [trace], layout, config);
    }

    resize() {
        Plotly.Plots.resize(document.getElementById(this.container));
    }
}
