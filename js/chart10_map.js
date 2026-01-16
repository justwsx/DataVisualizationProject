
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
        const text = yearData.map(d => d.country);

      const trace = {
            type: 'choropleth',
            locationmode: 'country names',
            locations: locations,
            z: zValues,
            text: text,
            colorscale: [
                [0, '#22c55e'],      // Green -Low consumption (good)
                [0.3, '#84cc16'],    // Light green
                [0.5, '#fbbf24'],    // Yellow/Orange - Medium consumption
                [0.7, '#f97316'],    // Orange
                [1, '#dc2626']       // Red - High consumption (warning)
            ],
            autocolorscale: false,
            reversescale: false,
            marker: {
                line: {
                    color: '#ffffff',
                    width: 0.5
                }
            },
            hoverinfo: 'text+z',
            hoverlabel: {
                bgcolor: '#1e293b',
                bordercolor: '#ffffff',
                font: { family: 'Inter, sans-serif', size: 14, color: '#ffffff' },
                align: 'left'
            },
            hovertemplate:
                '<b>%{text}</b><br>' +
                'Consumption: %{z:,.0f} TWh<br>' +
                '<extra></extra>',
            colorbar: {
                title: {
                    text: 'Energy (TWh)',
                    font: { family: 'Inter, sans-serif', size: 12 }
                },
                thickness: 12,
                len: 0.6,
                x: 0.98,
                tickfont: { family: 'Inter, sans-serif', size: 10 },
                // Add custom tick labels to show the meaning of colors
                ticksuffix: ' TWh'
            }
        };

        const layout = {
            title: {
                text: `Global Energy Consumption (${year})`,
                font: { family: 'Inter, sans-serif', size: 14 },
                y: 0.98
            },
            geo: {
                showframe: false,
                showcoastlines: false,
                projection: {
                    type: 'natural earth'
                },
                showocean: true,
                oceancolor: '#f8fafc',
                showland: true,
                landcolor: '#f1f5f9',
                showlakes: true,
                lakecolor: '#f8fafc',
                bgcolor: 'rgba(0,0,0,0)',
                lataxis: { range: [-60, 90] },
                lonaxis: { range: [-180, 180] }
            },
            margin: { t: 40, r: 0, b: 0, l: 0 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { family: 'Inter, sans-serif' },
            dragmode: 'pan'
        };

        const config = {
            responsive: true,
            displayModeBar: false,
            scrollZoom: true
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

