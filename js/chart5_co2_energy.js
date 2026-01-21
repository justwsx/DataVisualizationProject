// ============================================
// Chart 5: Carbon Intensity
// ============================================

class CO2EnergyChart {
    constructor(data) {
        this.data = data;
        this.elementId = 'chart-co2-energy';
    }

    update(year) {
        const container = document.getElementById(this.elementId);
        if (!container) return;

        const yearData = this.data.filter(d => 
            d.year === year && 
            d.primary_energy_consumption > 0
        );

        console.log(`=== Chart 5 - Year ${year} ===`);
        console.log(`Total countries: ${yearData.length}`);

        const hasFossilData = yearData.some(d => d.fossil_fuel_consumption > 0);
        console.log(`Has fossil_fuel_consumption data: ${hasFossilData}`);
        
        const traceData = yearData.map(d => {
            let intensity = null;
            
            if (hasFossilData && d.fossil_fuel_consumption > 0) {
                intensity = (d.fossil_fuel_consumption / d.primary_energy_consumption) * 100;
            } else {
                const coal = d.coal_cons_per_capita || 0;
                const gas = d.gas_energy_per_capita || 0;
                const oil = d.oil_energy_per_capita || 0;
                const renewables = d.renewables_energy_per_capita || 0;
                const hydro = d.hydro_elec_per_capita || 0;
                const lowCarbon = d.low_carbon_energy_per_capita || 0;
                
                const fossilPerCapita = coal + gas + oil;
                const cleanPerCapita = renewables + hydro + lowCarbon;
                const totalPerCapita = fossilPerCapita + cleanPerCapita;
                
                if (totalPerCapita > 0) {
                    intensity = (fossilPerCapita / totalPerCapita) * 100;
                }
            }

            return {
                country: d.country,
                energy: d.primary_energy_consumption,
                intensity: intensity !== null ? Math.min(Math.max(intensity, 0), 100) : null,
                population: d.population
            };
        })
        .filter(d => d.intensity !== null && d.intensity >= 0 && d.intensity <= 100 && d.population > 0);

        if (traceData.length > 0) {
            const intensities = traceData.map(d => d.intensity);
            const minIntensity = Math.min(...intensities).toFixed(1);
            const maxIntensity = Math.max(...intensities).toFixed(1);
            const avgIntensity = (intensities.reduce((a, b) => a + b, 0) / intensities.length).toFixed(1);
            
            console.log(`Intensity range: ${minIntensity}% to ${maxIntensity}%`);
            console.log(`Average intensity: ${avgIntensity}%`);
            console.log(`Valid countries: ${traceData.length}`);
            
            console.log('\nSample data:');
            traceData.sort((a, b) => a.intensity - b.intensity).slice(0, 10).forEach(d => {
                console.log(`  ${d.country}: ${d.intensity.toFixed(1)}%`);
            });
        }

        const bubbleSizes = traceData.map(d => {
            return Math.sqrt(d.population || 1000000) / 80 + 10;
        });

        const trace = {
            x: traceData.map(d => d.energy),
            y: traceData.map(d => d.intensity),
            text: traceData.map(d => d.country),
            mode: 'markers',
            marker: {
                size: bubbleSizes,
                sizemode: 'area',
                sizeref: 2,
                color: traceData.map(d => d.intensity),
                colorscale: [
                    [0, '#22c55e'],
                    [0.25, '#84cc16'],
                    [0.5, '#eab308'],
                    [0.75, '#f97316'],
                    [0.9, '#dc2626'],
                    [1, '#7f1d1d']
                ],
                showscale: true,
                colorbar: {
                    title: {
                        text: 'Carbon Intensity (%)',
                        font: { size: 11, family: 'Inter, sans-serif' }
                    },
                    titleside: 'right',
                    tickfont: { size: 10, family: 'Inter, sans-serif' },
                    thickness: 15,
                    len: 0.5,
                    x: 1.04,
                    y: 0.7,
                    xanchor: 'left',
                    yanchor: 'middle',
                    tickvals: [0, 20, 40, 60, 80, 100],
                    ticktext: ['0', '20', '40', '60', '80', '100']
                },
                opacity: 0.8,
                line: {
                    color: 'white',
                    width: 1
                }
            },
            customdata: traceData.map(d => d.population),
            hovertemplate:
                '<b>%{text}</b><br>' +
                'Carbon Intensity: %{y:.1f}%<br>' +
                'Energy: %{x:,.0f} kWh per capita<br>' +
                'Population: %{customdata:,.0f}<extra></extra>',
            showlegend: false
        };

        const layout = {
            title: {
                text: 'Carbon Intensity of Energy Consumption',
                font: {
                    family: 'Inter, sans-serif',
                    size: 18,
                    color: '#1e293b',
                    weight: 'bold'
                }
            },
            margin: { t: 70, r: 180, b: 100, l: 90 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { family: 'Inter, sans-serif' },
            
            xaxis: {
                title: {
                    text: 'Primary Energy Consumption',
                    font: { size: 13, family: 'Inter, sans-serif', color: '#475569' }
                },
                type: 'log',
                showgrid: true,
                gridcolor: 'rgba(226, 232, 240, 0.4)',
                gridwidth: 1,
                zeroline: false,
                tickmode: 'array',
                tickvals: [100, 500, 1000, 5000, 10000, 50000, 100000],
                ticktext: ['100', '500', '1k', '5k', '10k', '50k', '100k'],
                tickfont: {
                    family: 'Inter, sans-serif',
                    size: 11,
                    color: '#64748b'
                }
            },
            
            yaxis: {
                title: {
                    text: 'Carbon Intensity (%)',
                    font: { size: 13, family: 'Inter, sans-serif', color: '#475569' }
                },
                showgrid: true,
                gridcolor: 'rgba(226, 232, 240, 0.4)',
                gridwidth: 1,
                zeroline: false,
                range: [-5, 108],
                tickmode: 'array',
                tickvals: [0, 20, 40, 60, 80, 100],
                ticktext: ['0%', '20%', '40%', '60%', '80%', '100%'],
                tickfont: {
                    family: 'Inter, sans-serif',
                    size: 11,
                    color: '#64748b'
                }
            },
            
            hovermode: 'closest',
            
            annotations: [
                {
                    x: 0.002,
                    y: 0.098,
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
                },
                {
                    x: 0.98,
                    y: -0.45,
                    xref: 'paper',
                    yref: 'paper',
                    text: 'Lower % = Cleaner Energy',
                    showarrow: false,
                    font: {
                        family: 'Inter, sans-serif',
                        size: 11,
                        color: '#059669'
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

        Plotly.newPlot(this.elementId, [trace], layout, config);
    }

    resize() {
        const container = document.getElementById(this.elementId);
        if (container) {
            Plotly.Plots.resize(container);
        }
    }
}
