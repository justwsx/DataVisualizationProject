class ShareChart {
    constructor(data) {
        this.data = data;
        this.elementId = 'chart-share';
    }

    update(year) {
        const container = document.getElementById(this.elementId);
        if (!container) return;

        const yearData = this.data.filter(d => d.year === year);
        if (yearData.length === 0) return;

        let coal = 0, oil = 0, gas = 0, hydro = 0, nuclear = 0, renewables = 0;

        yearData.forEach(d => {
            const pop = d.population || 0;
            // Summing up kWh
            coal += (d.coal_cons_per_capita || 0) * pop;
            oil += (d.oil_energy_per_capita || 0) * pop;
            gas += (d.gas_energy_per_capita || 0) * pop;
            hydro += (d.hydro_elec_per_capita || 0) * pop;

            const totRenewables = (d.renewables_energy_per_capita || 0) * pop;
            const totLowCarbon = (d.low_carbon_energy_per_capita || 0) * pop;

            const solarWind = Math.max(0, totRenewables - ((d.hydro_elec_per_capita || 0) * pop));
            renewables += solarWind;

            const nuc = Math.max(0, totLowCarbon - totRenewables);
            nuclear += nuc;
        });

        // CONVERSION: Divide by 1,000,000,000 to convert kWh to TWh
        const values = [coal, oil, gas, nuclear, hydro, renewables].map(v => v / 1000000000);
        
        const labels = ["Coal", "Oil", "Natural Gas", "Nuclear", "Hydroelectric", "Renewables"];
        const colors = ["#374151", "#8B4513", "#FFD700", "#8b5cf6", "#3b82f6", "#22c55e"];

        const trace = {
            values: values,
            labels: labels,
            type: 'pie',
            hole: 0.6,
            textinfo: 'label+percent',
            textposition: 'inside', 
            automargin: true,
            marker: {
                colors: colors,
                line: { color: '#ffffff', width: 2 }
            },
            insidetextfont: {
                family: 'Inter, sans-serif',
                size: 12,
                color: '#ffffff'
            },
            hoverinfo: 'label+value+percent',
            hovertemplate:
                '<b>%{label}</b><br>' +
                'Energy: %{value:,.2f} TWh<br>' + // Displaying with 2 decimal places and commas
                'Share: %{percent}<br>' +
                '<extra></extra>'
        };

        const layout = {
            title: {
                text: 'Global Energy Mix by Source',
                font: { family: 'Inter, sans-serif', size: 16, color: '#1e293b' }
            },
            annotations: [
                {
                    font: { size: 24, family: 'Inter, sans-serif', weight: 600 },
                    showarrow: false,
                    text: `${year}`,
                    x: 0.5,
                    y: 0.5
                },
                {
                    font: { size: 12, color: '#64748b', family: 'Inter, sans-serif' },
                    showarrow: false,
                    text: 'Year',
                    x: 0.5,
                    y: 0.4
                }
            ],
            showlegend: false, 
            margin: { t: 80, r: 40, b: 80, l: 40 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            font: { family: 'Inter, sans-serif' }
        };

        const config = { responsive: true, displayModeBar: false };
        Plotly.newPlot(this.elementId, [trace], layout, config);
    }

    resize() {
        const container = document.getElementById(this.elementId);
        if (container) {
            Plotly.Plots.resize(container);
        }
    }
}
