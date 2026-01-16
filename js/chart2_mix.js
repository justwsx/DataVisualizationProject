class MixChart {
    constructor(data) {
        this.data = data;
        this.container = 'chart-mix';
        this.colors = {
            coal: '#374151',
            gas: '#6b7280',
            oil: '#9ca3af',
            hydro: '#3b82f6',
            renewables: '#22c55e',
            nuclear: '#8b5cf6'
        };
    }

    update(selectedYear) {
        let yearData = this.data.filter(d => d.year === selectedYear);

        if (yearData.length === 0) {
            const availableYears = [...new Set(this.data.map(d => d.year))].sort((a, b) => b - a);
            yearData = this.data.filter(d => d.year === availableYears[0]);
        }

        const countryData = {};
        yearData.forEach(d => {
            if (!countryData[d.country]) {
                countryData[d.country] = {
                    country: d.country,
                    coal: 0,
                    gas: 0,
                    oil: 0,
                    hydro: 0,
                    renewables: 0,
                    nuclear: 0,
                    total: 0
                };
            }
            countryData[d.country].coal += d.coal_cons_per_capita || 0;
            countryData[d.country].gas += d.gas_energy_per_capita || 0;
            countryData[d.country].oil += d.oil_energy_per_capita || 0;
            countryData[d.country].hydro += d.hydro_elec_per_capita || 0;
            countryData[d.country].renewables += d.renewables_energy_per_capita || 0;

            const nuclear = (d.low_carbon_energy_per_capita || 0) -
                           (d.renewables_energy_per_capita || 0);
            countryData[d.country].nuclear += Math.max(0, nuclear);

            countryData[d.country].total += d.primary_energy_consumption || 0;
        });

        const sortedCountries = Object.values(countryData)
            .sort((a, b) => b.total - a.total)
            .slice(0, 15)
            .reverse();

        const countries = sortedCountries.map(d => d.country);

        const traces = [
            {
                x: countries,
                y: sortedCountries.map(d => d.coal),
                name: 'Coal',
                type: 'bar',
                marker: { color: this.colors.coal },
                hovertemplate: '<b>%{x}</b><br>Coal: %{y:,.0f} kWh<extra></extra>'
            },
            {
                x: countries,
                y: sortedCountries.map(d => d.gas),
                name: 'Natural Gas',
                type: 'bar',
                marker: { color: this.colors.gas },
                hovertemplate: '<b>%{x}</b><br>Gas: %{y:,.0f} kWh<extra></extra>'
            },
            {
                x: countries,
                y: sortedCountries.map(d => d.oil),
                name: 'Oil',
                type: 'bar',
                marker: { color: this.colors.oil },
                hovertemplate: '<b>%{x}</b><br>Oil: %{y:,.0f} kWh<extra></extra>'
            },
            {
                x: countries,
                y: sortedCountries.map(d => d.hydro),
                name: 'Hydroelectric',
                type: 'bar',
                marker: { color: this.colors.hydro },
                hovertemplate: '<b>%{x}</b><br>Hydro: %{y:,.0f} kWh<extra></extra>'
            },
            {
                x: countries,
                y: sortedCountries.map(d => d.renewables),
                name: 'Renewables',
                type: 'bar',
                marker: { color: this.colors.renewables },
                hovertemplate: '<b>%{x}</b><br>Renewables: %{y:,.0f} kWh<extra></extra>'
            },
            {
                x: countries,
                y: sortedCountries.map(d => d.nuclear),
                name: 'Nuclear',
                type: 'bar',
                marker: { color: this.colors.nuclear },
                hovertemplate: '<b>%{x}</b><br>Nuclear: %{y:,.0f} kWh<extra></extra>'
            }
        ];

        const layout = {
            barmode: 'stack',
            title: {
                text: 'Energy Mix by Source (kWh per capita)',
                font: {
                    family: 'Inter, sans-serif',
                    size: 16,
                    color: '#1e293b'
                }
            },
            xaxis: {
                title: '',
                tickfont: {
                    family: 'Inter, sans-serif',
                    size: 10,
                    color: '#64748b'
                }
            },
            yaxis: {
                title: 'kWh per capita',
                gridcolor: 'rgba(226, 232, 240, 0.8)',
                showgrid: true,
                zeroline: false,
                tickfont: {
                    family: 'Inter, sans-serif',
                    size: 11,
                    color: '#64748b'
                }
            },
            margin: { l: 60, r: 20, t: 60, b: 60 },
            hovermode: 'x unified',
            showlegend: true,
            legend: {
                orientation: 'h',
                x: 0.5,
                y: 1.08,
                xanchor: 'center',
                bgcolor: 'transparent',
                font: {
                    family: 'Inter, sans-serif',
                    size: 10,
                    color: '#64748b'
                }
            },
            paper_bgcolor: 'rgba(0,0,0,0)',
            plot_bgcolor: 'rgba(0,0,0,0)'
        };

        const config = {
            responsive: true,
            displayModeBar: false
        };

        Plotly.react(this.container, traces, layout, config);
    }

    resize() {
        Plotly.Plots.resize(document.getElementById(this.container));
    }
}
