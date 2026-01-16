class RenewablesChart {
    constructor(data, majorCountries, countryColors) {
        this.data = data;
        this.countries = majorCountries;
        this.countryColors = countryColors;
        this.container = 'chart-renewables';
    }

    update(currentYear) {
        const traces = this.countries.map(country => {
            const countryData = this.data
                .filter(d => d.country === country)
                .sort((a, b) => a.year - b.year);

            if (countryData.length === 0) return null;

            return {
                x: countryData.map(d => d.year),
                y: countryData.map(d => d.renewables_consumption || 0),
                mode: 'lines',
                fill: 'tonexty',
                fillcolor: this.hexToRgba(this.countryColors[country] || '#6366f1', 0.1),
                name: country,
                line: {
                    color: this.countryColors[country] || '#6366f1',
                    width: country === "China" || country === "United States" ? 3 : 2,
                    shape: 'spline'
                },
                hovertemplate: `<b>${country}</b><br>Year: %{x}<br>Renewables: %{y:,.0f} TWh<extra></extra>`
            };
        }).filter(trace => trace !== null);

        const layout = {
            title: {
                text: 'Renewable Energy Consumption Growth (TWh)',
                font: {
                    family: 'Inter, sans-serif',
                    size: 16,
                    color: '#1e293b'
                }
            },
            xaxis: {
                title: '',
                range: [1991, 2022],
                tickmode: 'linear',
                dtick: 5,
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
                title: 'TWh',
                gridcolor: 'rgba(226, 232, 240, 0.8)',
                showgrid: true,
                zeroline: false,
                tickfont: {
                    family: 'Inter, sans-serif',
                    size: 11,
                    color: '#64748b'
                }
            },
            margin: { l: 60, r: 20, t: 60, b: 40 },
            hovermode: 'x unified',
            showlegend: true,
            legend: {
                orientation: 'h',
                x: 0.5,
                y: -0.15,
                xanchor: 'center',
                bgcolor: 'transparent',
                font: {
                    family: 'Inter, sans-serif',
                    size: 10,
                    color: '#64748b'
                }
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
                line: {
                    color: '#22c55e',
                    width: 2,
                    dash: 'dot'
                }
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
                arrowcolor: '#22c55e',
                font: {
                    family: 'Inter, sans-serif',
                    size: 12,
                    color: '#22c55e'
                },
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
