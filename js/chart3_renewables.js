class RenewablesChart {
    constructor(data, majorCountries, countryColors) {
        this.data = data;
        this.countries = majorCountries;
        this.countryColors = countryColors;
        this.container = 'chart-renewables';
        this.identifyCompetitors();
    }

    identifyCompetitors() {
        const mainTarget = "Canada";
        const competitor1 = "Australia";
        const competitor2 = "Brazil"; 
        this.highlighted = [mainTarget, competitor1, competitor2];
    }

    update(currentYear) {
        const mainTarget = "Canada";
        
        const traces = this.countries.map(country => {
            const countryData = this.data
                .filter(d => d.country === country && d.year <= 2022)
                .sort((a, b) => a.year - b.year);

            if (countryData.length === 0) return null;

            const isHighlighted = this.highlighted.includes(country);
            let color = '#e2e8f0'; 
            let lineWidth = 1.2;
            let opacity = 0.3;

            if (isHighlighted) {
                color = this.countryColors[country] || '#64748b';
                lineWidth = 3.5;
                opacity = 1;
                if (country === mainTarget) lineWidth = 4.5;
            }

            return {
                x: countryData.map(d => d.year),
                y: countryData.map(d => d.renewables_energy_per_capita || 0),
                mode: 'lines',
                name: country,
                line: { color: color, width: lineWidth, shape: 'spline' },
                opacity: opacity,
                hoverinfo: isHighlighted ? 'all' : 'skip',
                hovertemplate: isHighlighted ? `<b>${country}</b>: %{y:,.0f} kWh<extra></extra>` : null,
                showlegend: false
            };
        }).filter(trace => trace !== null);

        // Position labels at year 2007 above the lines as requested
        const labels = this.highlighted.map(country => {
            const targetYear = 2009; 
            const countryDataAtYear = this.data.find(d => d.country === country && d.year === targetYear);
            
            if (!countryDataAtYear) return null;

            return {
                type: 'scatter', 
                mode: 'text',
                x: [targetYear], 
                y: [countryDataAtYear.renewables_energy_per_capita],
                text: [`<b>${country}</b>`], 
                textposition: 'top center',
                yshift: 25, // Shifts text upward from the line
                textfont: { 
                    family: 'Inter, sans-serif', 
                    size: 12, 
                    color: this.countryColors[country], 
                    weight: 'bold' 
                },
                showlegend: false, 
                hoverinfo: 'skip'
            };
        }).filter(l => l !== null);

        const layout = {
            title: {
                text: `<b>Renewables Growth Trajectory</b>`,
                font: { family: 'Inter, sans-serif', size: 17, color: '#1e293b' }, 
                x: 0.05
            },
            xaxis: { 
                range: [1990, 2022.8],
                gridcolor: 'rgba(226, 232, 240, 0.6)', 
                tickfont: { size: 11, color: '#64748b' } 
            },
            yaxis: { 
                ticksuffix: ' kWh', 
                gridcolor: 'rgba(226, 232, 240, 0.6)', 
                tickfont: { size: 11, color: '#64748b' } 
            },
            margin: { l: 60, r: 40, t: 80, b: 50 }, 
            hovermode: 'x unified',
            showlegend: false,
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            shapes: [{
                type: 'line', x0: currentYear, x1: currentYear, y0: 0, y1: 1,
                xref: 'x', yref: 'paper',
                line: { color: '#22c55e', width: 1, dash: 'dot' }
            }]
        };

        Plotly.react(this.container, [...traces, ...labels], layout, { responsive: true, displayModeBar: false });
    }

    resize() {
        Plotly.Plots.resize(document.getElementById(this.container));
    }
}

