class RenewablesChart {
    constructor(data, majorCountries, countryColors) {
        this.data = data;
        this.countries = majorCountries;
        this.countryColors = countryColors;
        this.container = 'chart-renewables';
        
        this.identifyKeyCompetitors();
    }

    identifyKeyCompetitors() {
        const startYear = 1990;
        const endYear = 2022;
        const target = "Canada";
        const globalBenchmark = "Norway";

        // Find 2nd place in 1990
        const data1990 = this.data.filter(d => d.year === startYear && d.country !== target && this.countries.includes(d.country));
        this.rival1990 = data1990.sort((a, b) => b.renewables_energy_per_capita - a.renewables_energy_per_capita)[0]?.country;

        // Find 2nd place in 2022
        const data2022 = this.data.filter(d => d.year === endYear && d.country !== target && this.countries.includes(d.country));
        this.rival2022 = data2022.sort((a, b) => b.renewables_energy_per_capita - a.renewables_energy_per_capita)[0]?.country;

        this.highlighted = ["Canada", this.rival1990, this.rival2022, globalBenchmark];
    }

    update(currentYear) {
        const main = "Canada";
        const traces = this.countries.map(country => {
            const countryData = this.data
                .filter(d => d.country === country && d.year <= 2022)
                .sort((a, b) => a.year - b.year);

            if (countryData.length === 0) return null;

            const isHighlighted = this.highlighted.includes(country);
            return {
                x: countryData.map(d => d.year),
                y: countryData.map(d => d.renewables_energy_per_capita || 0),
                mode: 'lines',
                line: {
                    color: isHighlighted ? this.countryColors[country] : '#e2e8f0',
                    width: isHighlighted ? 4 : 1.5,
                    shape: 'spline'
                },
                hoverinfo: isHighlighted ? 'all' : 'skip',
                showlegend: false
            };
        }).filter(t => t !== null);

        // Get values for GAP calculation
        const yearData = this.data.filter(d => d.year === currentYear);
        const canVal = yearData.find(d => d.country === main)?.renewables_energy_per_capita || 0;
        const riv1990Val = yearData.find(d => d.country === this.rival1990)?.renewables_energy_per_capita || 0;

        const gap1990 = Math.abs(canVal - riv1990Val);

        const layout = {
            title: { text: `<b>Renewables Gap Analysis: Canada vs ${this.rival1990}</b>`, x: 0.05 },
            xaxis: { range: [1989.5, 2023.5], gridcolor: 'rgba(226, 232, 240, 0.6)' },
            yaxis: { ticksuffix: ' kWh', gridcolor: 'rgba(226, 232, 240, 0.6)' },
            margin: { l: 60, r: 150, t: 80, b: 50 },
            hovermode: 'x unified',
            showlegend: false,
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)',
            annotations: [
                {
                    x: currentYear, y: (canVal + riv1990Val) / 2, xref: 'x', yref: 'y',
                    text: `Gap to 1990 Leader:<br><b>${gap1990.toLocaleString()}</b> kWh`,
                    showarrow: true, arrowhead: 0, ax: -70, ay: 0,
                    font: { size: 11, color: '#475569' },
                    bgcolor: 'white', bordercolor: '#94a3b8', borderwidth: 1, borderpad: 5
                }
            ],
            shapes: [
                {
                    type: 'line',
                    x0: currentYear, x1: currentYear, y0: canVal, y1: riv1990Val,
                    xref: 'x', yref: 'y',
                    line: { color: '#94a3b8', width: 2, dash: 'solid' }
                },
                {
                    type: 'line', x0: currentYear, x1: currentYear, y0: 0, y1: 1, xref: 'x', yref: 'paper',
                    line: { color: '#22c55e', width: 1, dash: 'dot' }
                }
            ]
        };

        Plotly.react(this.container, traces, layout, { responsive: true, displayModeBar: false });
    }

    resize() {
        Plotly.Plots.resize(document.getElementById(this.container));
    }
}
