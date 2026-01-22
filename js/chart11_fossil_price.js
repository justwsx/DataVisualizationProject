class FossilPrice {
    constructor(data, containerId) {
        this.data = data;
        this.container = containerId;
        this.currentYear = 2020;
    }

    setYear(year) {
        this.currentYear = year;
        this.update();
    }

    update() {
        const yearly = {};

        this.data.forEach(d => {
            if (!yearly[d.year]) {
                yearly[d.year] = {
                    year: d.year,
                    oil: d.oil_price_global ?? null,
                    gas: d.gas_price_global ?? null,
                    coal: d.coal_price_global ?? null
                };
            }
        });

        const series = Object.values(yearly)
            .filter(d => d.year >= 1990 && d.year <= 2022)
            .sort((a, b) => a.year - b.year);

        const years = series.map(d => d.year);

        const oil = series.map(d => d.oil);
        const gas = series.map(d => d.gas);
        const coal = series.map(d => d.coal);

        const isActive = series.map(d => d.year === this.currentYear);

        const oilTrace = {
            x: years,
            y: oil,
            name: 'Oil',
            mode: 'lines+markers',
            line: { color: '#7c2d12', width: 3 },
            marker: {
                size: isActive.map(a => a ? 10 : 4),
                color: '#7c2d12'
            }
        };

        const gasTrace = {
            x: years,
            y: gas,
            name: 'Natural Gas',
            mode: 'lines+markers',
            line: { color: '#facc15', width: 3 },
            marker: {
                size: isActive.map(a => a ? 10 : 4),
                color: '#facc15'
            }
        };

        const coalTrace = {
            x: years,
            y: coal,
            name: 'Coal',
            mode: 'lines+markers',
            line: { color: '#000000', width: 3 },
            marker: {
                size: isActive.map(a => a ? 10 : 4),
                color: '#000000'
            }
        };

        const layout = {
            title: {
                text: '',
                font: { family: 'Inter, sans-serif', size: 18, color: '#1e293b' },
                x: 0.05
            },
            xaxis: {
                title: 'Year',
                tickmode: 'linear',
                dtick: 5,
                tickfont: { family: 'Inter, sans-serif', size: 11, color: '#64748b' },
                gridcolor: 'rgba(226,232,240,0.6)'
            },
            yaxis: {
                title: 'Price (USD)',
                tickfont: { family: 'Inter, sans-serif', size: 11, color: '#64748b' },
                gridcolor: 'rgba(226,232,240,0.6)'
            },
            font: {
                family: 'Inter, sans-serif'
            },
            hovermode: 'x unified',
            shapes: [
                {
                    type: 'line',
                    x0: this.currentYear,
                    x1: this.currentYear,
                    y0: 0,
                    y1: 1,
                    xref: 'x',
                    yref: 'paper',
                    line: {
                        color: '#64748b',
                        width: 2,
                        dash: 'dot'
                    }
                }
            ],
            legend: {
                orientation: 'h',
                x: 0.5,
                xanchor: 'center',
                y: 1.15
            },
            margin: { t: 80, l: 60, r: 30, b: 50 },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)'
        };

        Plotly.react(
            this.container,
            [oilTrace, gasTrace, coalTrace],
            layout,
            { responsive: true, displayModeBar: false }
        );
    }

    resize() {
        Plotly.Plots.resize(document.getElementById(this.container));
    }
}
