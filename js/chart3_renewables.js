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
            let opacity = 0.4;

            if (isHighlighted) {
                color = this.countryColors[country] || '#64748b';
                lineWidth = 3.5;
                opacity = 1;

                if (country === mainTarget) {
                    lineWidth = 4.5;
                }
            }

            return {
                x: countryData.map(d => d.year),
                y: countryData.map(d => d.renewables_energy_per_capita || 0),
                mode: 'lines',
                name: country,
                line: {
                    color: color,
                    width: lineWidth,
                    shape: 'spline'
                },
                opacity: opacity,
                hoverinfo: isHighlighted ? 'all' : 'skip',
                hovertemplate: isHighlighted ? `<b>${country}</b>: %{y:,.0f} kWh<extra></extra>` : null,
                showlegend: false
            };
        }).filter(trace => trace !== null);

        // Labels with AGGRESSIVE spacing to prevent any overlap
        const labels = this.highlighted.map(country => {
            const countryData = this.data.filter(d => d.country === country && d.year <= 2022).sort((a, b) => a.year - b.year);
            if (countryData.length === 0) return null;
            const lastPoint = countryData[countryData.length - 1];
            
            let labelText = `<b>${country}</b>`;
            
            // Aggressive Y-axis shifts:
            // 1. Brazil (Top): Move WAY UP (+25)
            // 2. Australia (Middle): Move DOWN (-10)
            // 3. Canada (Bottom): Move WAY DOWN (-40)
            let yShiftValue = 0;
            
            if (country === "Brazil") {
                yShiftValue = 25;    // Significant push UP
            } else if (country === "Australia") {
                yShiftValue = -10;   // Small push DOWN
            } else if (country === "Canada") {
                yShiftValue = -40;   // Large push DOWN
            }
            
            return {
                type: 'scatter', 
                mode: 'text+markers',
                x: [lastPoint.year], 
                y: [lastPoint.renewables_energy_per_capita],
                text: [labelText], 
                textposition: 'middle right',
                yshift: yShiftValue, // Applying the aggressive shift
                textfont: { 
                    family: 'Inter, sans-serif', 
                    size: 11, 
                    color: this.countryColors[country], 
                    weight: 'bold' 
                },
                marker: { size: 6, color: this.countryColors[country] },
                showlegend: false, 
                hoverinfo: 'skip'
            };
        }).filter(l => l !== null);

        const layout = {
            title: {
                text: `<b>Renewables Growth: Canada, Australia & Brazil</b>`,
                font: { family: 'Inter, sans-serif', size: 17, color: '#1e293b' }, 
                x: 0.05
            },
            xaxis: { 
                range: [1989.5, 2024], 
                gridcolor: 'rgba(226, 232, 240, 0.6)', 
                tickfont: { size: 11, color: '#64748b' } 
            },
            yaxis: { 
                ticksuffix: ' kWh', 
                gridcolor: 'rgba(226, 232, 240, 0.6)', 
                tickfont: { size: 11, color: '#64748b' } 
            },
            margin: { l: 65, r: 180, t: 80, b: 50 },
            hovermode: 'x unified',
            showlegend: false,
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            shapes: [
                {
                    type: 'line',
                    x0: currentYear, x1: currentYear, y0: 0, y1: 1,
                    xref: 'x', yref: 'paper',
                    line: { color: '#22c55e', width: 1, dash: 'dot' }
                }
            ]
        };

        Plotly.react(this.container, [...traces, ...labels], layout, { responsive: true, displayModeBar: false });
    }

    resize() {
        Plotly.Plots.resize(document.getElementById(this.container));
    }
}
