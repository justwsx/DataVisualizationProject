class EnergyIntensityChart {
    constructor(data) {
        this.data = data;
        this.elementId = 'chart-energy-intensity';

        this.countries = [
            'United States',
            'China',
            'Germany',
            'India'
        ];

        this.colors = {
            'United States': '#2b0dc2',
            'China': '#ff3300',
            'Germany': '#22c55e',
            'India': '#ffa200'
        };
    }

    update() {
        const container = document.getElementById(this.elementId);
        if (!container) return;

        const traces = [];

        this.countries.forEach(country => {
            const countryData = this.data
                .filter(d =>
                    d.country === country &&
                    d.gdp > 0 &&
                    d.population > 0 &&
                    d.primary_energy_consumption > 0
                )
                .sort((a, b) => a.year - b.year);

            if (countryData.length === 0) return;

            const years = countryData.map(d => d.year);
            const intensity = countryData.map(d =>
                d.primary_energy_consumption / (d.gdp / d.population)
            );

            // --- main line ---
            traces.push({
                x: years,
                y: intensity,
                type: 'scatter',
                mode: 'lines',
                line: {
                    width: 3,
                    color: this.colors[country]
                },
                hovertemplate:
                    `<b>${country}</b><br>` +
                    `Year: %{x}<br>` +
                    `Energy Intensity: %{y:.4f}<extra></extra>`,
                showlegend: false
            });

            // --- country label at last point ---
            const lastIndex = years.length - 1;

            traces.push({
                x: [years[lastIndex]],
                y: [intensity[lastIndex]],
                type: 'scatter',
                mode: 'markers+text',
                marker: {
                    size: 8,
                    color: this.colors[country]
                },
                text: [country],
                textposition: 'right',
                textfont: {
                    size: 12,
                    color: this.colors[country],
                    family: 'Inter, sans-serif'
                },
                hoverinfo: 'skip',
                showlegend: false
            });
        });

        const layout = {

            title: {
                text: 'Energy Intensity over Time',
                font: {
                    size: 13,
                    family: 'Inter, sans-serif',
                    color: '#475569'
                }
            },
            xaxis: {
                title: 'Year',
                showgrid: true,
                zeroline: false
            },
            yaxis: {
                title: {
                    text: 'Energy Intensity (Efficiency Indicator)',
                    font: {
                        family: 'Inter, sans-serif',
                        size: 11,
                        color: '#1e293b'
                    }
                },
                showgrid: true,
                zeroline: false
            },
            margin: {
                t: 50,
                l: 60,
                r: 150,
                b: 60
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)'
        };

        Plotly.newPlot(this.elementId, traces, layout, {
            responsive: true,
            displayModeBar: false
        });
    }

    resize() {
        const el = document.getElementById(this.elementId);
        if (el) Plotly.Plots.resize(el);
    }
}
