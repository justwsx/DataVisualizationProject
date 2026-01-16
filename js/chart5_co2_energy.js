class CO2EnergyChart {
    constructor(data) {
        this.data = data;
        this.elementId = 'chart-co2-energy';
    }

    update(year) {
        const container = document.getElementById(this.elementId);
        if (!container) return;

        const yearData = this.data.filter(d => d.year === year && d.primary_energy_consumption > 0);

        const traceData = yearData.map(d => {
            const intensity = d.primary_energy_consumption > 0
                ? (d.fossil_fuel_consumption / d.primary_energy_consumption) * 100
                : 0;

            return {
                country: d.country,
                energy: d.primary_energy_consumption,
                intensity: Math.min(intensity, 100),
                population: d.population
            };
        }).filter(d => d.intensity > 0);

        const textLabels = traceData.map(d => {
            if (d.intensity > 88 && d.energy > 200) {
                return d.country;
            }
            return "";
        });

        const bubbleSizes = traceData.map(d => {
            return 5 + (d.intensity * 0.2);
        });

        const trace = {
            x: traceData.map(d => d.energy),
            y: traceData.map(d => d.intensity),
            text: textLabels,
            hovertext: traceData.map(d => d.country),
            mode: 'markers+text',
            textposition: 'top center',
            textfont: {
                family: 'Inter, sans-serif',
                size: 10,
                color: '#334155',
                weight: 600
            },
            marker: {
                size: bubbleSizes,
                sizemode: 'diameter',
                color: traceData.map(d => d.intensity),
                colorscale: 'RdYlGn',
                reversescale: true,
                showscale: true,
                colorbar: {
                    title: 'Carbon Intensity (%)',
                    titleside: 'right',
                    titlefont: { size: 11, family: 'Inter, sans-serif' },
                    tickfont: { size: 10, family: 'Inter, sans-serif' },
                    thickness: 12,
                    len: 0.8,
                    x: 1.02,
                    xanchor: 'left',
                    yanchor: 'middle'
                },
                opacity: 0.9,
                line: {
                    color: 'white',
                    width: 0.5
                }
            },
            hovertemplate:
                '<b>%{hovertext}</b><br>' +
                'Intensity: %{y:.1f}%<br>' +
                'Energy: %{x:.1f} TWh<br>' +
                '<extra></extra>',
            showlegend: false
        };

        const layout = {
            title: {
                text: 'Carbon Intensity of Energy Consumption (%)',
                font: {
                    family: 'Inter, sans-serif',
                    size: 16,
                    color: '#1e293b'
                }
            },
            margin: { t: 60, r: 100, b: 60, l: 60 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { family: 'Inter, sans-serif' },
            xaxis: {
                title: 'Primary Energy Consumption (TWh)',
                gridcolor: '#e2e8f0',
                zerolinecolor: '#e2e8f0',
                type: 'log'
            },
            yaxis: {
                title: 'Carbon Intensity (%)',
                gridcolor: '#e2e8f0',
                zerolinecolor: '#e2e8f0',
                range: [0, 110]
            },
            hovermode: 'closest'
        };

        const config = {
            responsive: true,
            displayModeBar: false
        };

        Plotly.newPlot(this.elementId, [trace], layout, config);
    }

    resize() {
        const container = document.getElementById(this.elementId);
        if (container) {
            Plotly.Plots.resize(container);
        }
    }
}