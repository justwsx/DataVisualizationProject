class ConsumptionChart {
    constructor(data, majorCountries, countryColors) {
        this.data = data;
        this.countries = majorCountries;
        this.countryColors = countryColors;
        this.container = 'chart-consumption';
        this.viewMode = 'lines';
        this.selectedCountry = null;
    }

    setViewMode(mode) {
        this.viewMode = mode;
    }

    setSelectedCountry(country) {
        this.selectedCountry = country;
    }

    update(currentYear) {
        const traces = this.countries.map(country => {
            const countryData = this.data
                .filter(d => d.country === country)
                .sort((a, b) => a.year - b.year);

            if (countryData.length === 0) return null;

            const isTarget = country === "United States" || country === "China";
            const isSelected = country === this.selectedCountry;
            const color = this.countryColors[country] || '#6366f1';

            return {
                x: countryData.map(d => d.year),
                y: countryData.map(d => d.primary_energy_consumption),
                mode: 'lines',
                name: country,
                line: {
                    color: isTarget || isSelected ? color : '#e2e8f0',
                    width: isTarget ? 3.5 : (isSelected ? 3.5 : 1.5),
                    shape: 'spline'
                },
                hoverinfo: isTarget ? 'all' : 'skip',
                hovertemplate: isTarget ? `<b>${country}</b>: %{y:,.0f} kWh<extra></extra>` : null,
                fill: this.viewMode === 'area' ? 'tonexty' : 'none',
                fillcolor: this.viewMode === 'area' ? this.hexToRgba(color, 0.12) : null
            };
        }).filter(trace => trace !== null);

        const countryLabels = this.countries
            .filter(country => country === "United States" || country === "China")
            .map((country) => {
                const countryData = this.data.filter(d => d.country === country).sort((a, b) => a.year - b.year);
                if (countryData.length === 0) return null;
                const lastPoint = countryData[countryData.length - 1];
                
                return {
                    type: 'scatter',
                    mode: 'text',
                    x: [lastPoint.year], 
                    y: [lastPoint.primary_energy_consumption],
                    text: [country],
                    textposition: 'middle right',
                    cliponaxis: false,
                    textfont: { 
                        family: 'Inter, sans-serif', 
                        size: 13, 
                        color: this.countryColors[country], 
                        weight: 700 
                    },
                    hoverinfo: 'skip',
                    showlegend: false
                };
            }).filter(label => label !== null);

        const layout = {
            title: {
                text: '<b>Primary Energy Consumption per Capita</b><br><span style="font-size: 13px; color: #64748b;">Average energy consumption per person over time (kWh per capita)</span>',
                align: 'left',
                x: 0,
                y: 0.95,
                font: { family: 'Inter, sans-serif', size: 18, color: '#1e293b' }
            },
            xaxis: {
                range: [1990.8, 2022.2],
                tickmode: 'linear',
                dtick: 5,
                gridcolor: 'rgba(226, 232, 240, 0.6)',
                showspikes: true,
                spikemode: 'across',
                spikedash: 'dot',
                spikecolor: '#94a3b8',
                spikethickness: 1.5,
                tickfont: { family: 'Inter, sans-serif', size: 11, color: '#64748b' }
            },
            yaxis: {
                ticksuffix: ' kWh',
                nticks: 8,
                gridcolor: 'rgba(226, 232, 240, 0.6)',
                tickfont: { family: 'Inter, sans-serif', size: 11, color: '#64748b' }
            },
            margin: { l: 80, r: 160, t: 100, b: 50 },
            hovermode: 'x unified',
            hoverlabel: {
                bgcolor: 'rgba(255, 255, 255, 0.98)',
                bordercolor: '#e2e8f0',
                font: { family: 'Inter, sans-serif', size: 12, color: '#1e293b' }
            },
            showlegend: false,
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)'
        };

        const config = {
            responsive: true,
            displayModeBar: false
        };

        Plotly.react(this.container, [...traces, ...countryLabels], layout, config);
    }

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16), 
              g = parseInt(hex.slice(3, 5), 16), 
              b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    resize() {
        Plotly.Plots.resize(document.getElementById(this.container));
    }
}
