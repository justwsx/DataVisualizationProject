class CO2EnergyChart {
    constructor(data) {
        this.data = data;
        this.elementId = 'chart-co2-energy';
    }

    update(year) {
        const container = document.getElementById(this.elementId);
        if (!container) return;

        // --- 1. DATA PROCESSING ---

        // Filter data for the selected year and ensure valid energy consumption
        const yearData = this.data.filter(d => d.year === year && d.primary_energy_consumption > 0);

        // Map data to calculate Carbon Intensity
        const traceData = yearData.map(d => {
            // Formula: (Fossil Fuel / Primary Energy) * 100
            // This represents how "dirty" the energy mix is percentage-wise
            const intensity = d.primary_energy_consumption > 0
                ? (d.fossil_fuel_consumption / d.primary_energy_consumption) * 100
                : 0;

            return {
                country: d.country,
                energy: d.primary_energy_consumption,
                intensity: Math.min(intensity, 100), // Cap at 100% to avoid data errors
                population: d.population
            };
        }).filter(d => d.intensity > 0); // Exclude 0 values

        /* REMOVED LOGIC:
           I removed the 'textLabels' block that was previously here.
           It used to force static text for countries with intensity > 88%.
        */

        // Calculate bubble sizes based on intensity (higher intensity = slightly larger bubble)
        const bubbleSizes = traceData.map(d => {
            return 5 + (d.intensity * 0.2);
        });

        // --- 2. TRACE CONFIGURATION ---

        const trace = {
            // X-Axis: Total Energy Consumption
            x: traceData.map(d => d.energy),
            // Y-Axis: Carbon Intensity (%)
            y: traceData.map(d => d.intensity),
            
            // Text for hover (previously distinct from static labels, now unified)
            text: traceData.map(d => d.country),
            
            // Mode: 'markers' ONLY (Removed '+text' to hide static labels)
            mode: 'markers',
            
            // Marker styling
            marker: {
                size: bubbleSizes,
                sizemode: 'diameter',
                
                // Color mapping: Red (dirty) to Green (clean)
                color: traceData.map(d => d.intensity),
                colorscale: 'RdYlGn',
                reversescale: true, // Reverse so Red is high intensity (bad)
                showscale: true,
                
                // Legend/Colorbar styling
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
            
            // Tooltip configuration using the 'text' property defined above
            hovertemplate:
                '<b>%{text}</b><br>' +
                'Intensity: %{y:.1f}%<br>' +
                'Energy: %{x:.1f} TWh<br>' +
                '<extra></extra>',
            
            showlegend: false
        };

        // --- 3. LAYOUT CONFIGURATION ---

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
            paper_bgcolor: 'rgba(0,0,0,0)', // Transparent
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { family: 'Inter, sans-serif' },
            xaxis: {
                title: 'Primary Energy Consumption (TWh)',
                gridcolor: '#e2e8f0',
                zerolinecolor: '#e2e8f0',
                type: 'log' // Log scale for wide range of energy consumption
            },
            yaxis: {
                title: 'Carbon Intensity (%)',
                gridcolor: '#e2e8f0',
                zerolinecolor: '#e2e8f0',
                range: [0, 110] // Fixed range 0-100% (plus padding)
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