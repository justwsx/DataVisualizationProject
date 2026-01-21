class EvolutionChart {
    constructor(data, majorCountries, countryColors) {
        this.data = data;
        this.countries = majorCountries;
        this.countryColors = countryColors;
        this.container = 'chart-evolution';
    }

    update(currentYear) {
        const traces = this.countries.map(country => {
            const countryData = this.data
                .filter(d => d.country === country)
                .sort((a, b) => a.year - b.year);

            if (countryData.length === 0) return null;

            return {
                x: countryData.map(d => d.year),
                y: countryData.map(d => d.primary_energy_consumption),
                mode: 'lines',
                stackgroup: 'one',
                fillcolor: this.hexToRgba(this.countryColors[country] || '#6366f1', 0.15),
                line: {
                    color: this.countryColors[country] || '#6366f1',
                    width: country === "United States" || country === "China" ? 3 : 1.5,
                    shape: 'spline'
                },
                name: country,
                hovertemplate: `<b>${country}</b><br>Year: %{x}<br>Energy: %{y:,.0f} kWh/person<extra></extra>`
            };
        }).filter(trace => trace !== null);

        const layout = {
            title: {
                text: '',
                font: { family: 'Inter, sans-serif', size: 0 }
            },
            xaxis: {
                title: '',
                range: [1991, 2022],
                tickmode: 'linear',
                dtick: 5,
                gridcolor: 'rgba(226, 232, 240, 0.4)',
                showgrid: true,
                zeroline: false,
                tickfont: { family: 'Inter, sans-serif', size: 11, color: '#64748b' }
            },
            yaxis: {
                title: 'kWh per capita',
                gridcolor: 'rgba(226, 232, 240, 0.4)',
                showgrid: true,
                zeroline: false,
                tickfont: { family: 'Inter, sans-serif', size: 11, color: '#64748b' },
                tickformat: ',.0f'
            },
            margin: { l: 70, r: 20, t: 20, b: 50 },
            hovermode: false,
            showlegend: true,
            legend: {
                orientation: 'h',
                x: 0.5,
                y: -0.25,
                xanchor: 'center',
                bgcolor: 'transparent',
                font: { family: 'Inter, sans-serif', size: 10, color: '#64748b' }
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            shapes: [{
                type: 'line',
                x0: currentYear,
                x1: currentYear,
                y0: 0,
                y1: 1,
                xref: 'x',
                yref: 'paper',
                line: { color: '#6366f1', width: 2, dash: 'dot' }
            }],
            annotations: [{
                x: currentYear,
                y: 0.98,
                xref: 'x',
                yref: 'paper',
                text: currentYear.toString(),
                showarrow: true,
                arrowhead: 2,
                arrowwidth: 2,
                arrowcolor: '#6366f1',
                font: { family: 'Inter, sans-serif', size: 12, color: '#6366f1' },
                bgcolor: 'rgba(255,255,255,0.9)',
                bordercolor: '#e2e8f0',
                borderwidth: 1,
                borderpad: 4
            }]
        };

        const config = {
            responsive: true,
            displayModeBar: false
        };

        Plotly.react(this.container, traces, layout, config);
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    resize() {
        Plotly.Plots.resize(document.getElementById(this.container));
    }
}
