class EnergyMapChart {
    constructor(data) {
        this.data = data;
        this.elementId = 'chart-map';
    }

    update(year) {
        const container = document.getElementById(this.elementId);
        if (!container) return;

        const yearData = this.data.filter(d => d.year === year);

        const zValues = yearData.map(d => d.primary_energy_consumption);
        const locations = yearData.map(d => d.country);

        const choropleth = {
            type: 'choropleth',
            locationmode: 'country names',
            locations: locations,
            z: zValues,
            text: locations,
            colorscale: [
                [0, '#22c55e'],
                [0.3, '#84cc16'],
                [0.5, '#fbbf24'],
                [0.7, '#f97316'],
                [1, '#dc2626']
            ],
            autocolorscale: false,
            reversescale: false,
            marker: { line: { color: '#ffffff', width: 0.5 } },
            hovertemplate: '<b>%{text}</b><br>Energy: %{z:,.0f} kWh/person<extra></extra>',
            colorbar: {
                title: { text: 'kWh per Capita', font: { family: 'Inter, sans-serif', size: 12 } },
                thickness: 15,
                len: 0.7,
                x: 0.9,
                tickfont: { family: 'Inter, sans-serif', size: 10 },
                ticksuffix: ' kWh'
            }
        };

        const iconMarkers = {
            type: 'scattergeo',
            mode: 'text',
            text: ['🔥', '⚫'],
            lon: [-98.5, 104.2],
            lat: [39.8, 35.9],
            textfont: { size: 28 },
            hoverinfo: 'text',
            hovertext: [
                'United States<br>Dominant Energy Structure: Natural Gas',
                'China<br>Dominant Energy Structure: Coal'
            ],
            showlegend: false
        };

        const layout = {
            title: {
                text: `The Energy Inequality Map<br><span style="font-size:12px;color:#64748b">Intensity of energy usage per person. Darker nations represent higher consumption per capita.</span>`,
                font: { family: 'Inter, sans-serif', size: 18, color: '#1e293b' },
                y: 0.95
            },
            geo: {
                showframe: false,
                showcoastlines: true,
                coastlinecolor: '#e2e8f0',
                projection: { type: 'natural earth' },
                showocean: true,
                oceancolor: '#f8fafc',
                showland: true,
                landcolor: '#ffffff',
                bgcolor: 'rgba(0,0,0,0)',
                lataxis: { range: [-60, 90] },
                lonaxis: { range: [-180, 180] }
            },
            annotations: [
                {
                    x: 0.02,
                    y: 0.05,
                    xref: 'paper',
                    yref: 'paper',
                    text:
                        '<b>Symbol Legend</b><br>' +
                        '🔥 Dominant Natural Gas Structure<br>' +
                        '⚫ Dominant Coal Structure',
                    showarrow: false,
                    align: 'left',
                    font: {
                        family: 'Inter, sans-serif',
                        size: 11,
                        color: '#1e293b'
                    },
                    bgcolor: 'rgba(255,255,255,0.95)',
                    bordercolor: '#e2e8f0',
                    borderwidth: 1,
                    borderpad: 6
                }
            ],
            margin: { t: 90, r: 0, b: 0, l: 0 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)'
        };

        Plotly.newPlot(
            this.elementId,
            [choropleth, iconMarkers],
            layout,
            { responsive: true, displayModeBar: false }
        );
    }

    resize() {
        Plotly.Plots.resize(document.getElementById(this.elementId));
    }
}
