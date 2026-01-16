class GDPEnergyChart {
    constructor(data) {
        // Initialize data and target container
        this.data = data;
        this.container = 'chart-gdp-energy';

        // List of specific countries (previously used for labels, kept for reference or future logic)
        this.countries = [
            "United States", "China", "India", "Japan", "Germany",
            "Russia", "Brazil", "Indonesia", "United Kingdom", "France",
            "Italy", "Canada", "Australia", "South Korea", "Saudi Arabia",
            "Mexico", "Turkey", "South Africa", "Poland", "Thailand"
        ];

        // Define colors for each region to ensure visual consistency
        this.regionColors = {
            "Africa": "#ec4899",
            "Asia": "#14b8a6",
            "Europe": "#6366f1",
            "North America": "#f59e0b",
            "South America": "#22c55e",
            "Oceania": "#06b6d4"
        };

        // Map specific countries to their respective regions
        this.countryRegions = {
            "United States": "North America",
            "Canada": "North America",
            "Mexico": "North America",
            "Brazil": "South America",
            "Argentina": "South America",
            "Chile": "South America",
            "United Kingdom": "Europe",
            "Germany": "Europe",
            "France": "Europe",
            "Italy": "Europe",
            "Poland": "Europe",
            "Russia": "Europe",
            "Turkey": "Europe",
            "China": "Asia",
            "India": "Asia",
            "Japan": "Asia",
            "South Korea": "Asia",
            "Indonesia": "Asia",
            "Thailand": "Asia",
            "Australia": "Oceania",
            "South Africa": "Africa"
        };
    }

    update(selectedYear) {
        // --- 1. DATA PREPARATION ---

        // Filter the dataset to get only records for the selected year
        let yearData = this.data.filter(d => d.year === selectedYear);

        // Fallback: If no data exists for the selected year, use the most recent available year
        if (yearData.length === 0) {
            const availableYears = [...new Set(this.data.map(d => d.year))].sort((a, b) => b - a);
            yearData = this.data.filter(d => d.year === availableYears[0]);
        }

        // Clean data: Remove entries with missing or zero values for GDP or Energy
        yearData = yearData.filter(d => d.primary_energy_consumption > 0 && d.gdp > 0);

        // Identify which regions exist in the current filtered dataset
        const regions = [...new Set(yearData.map(d => this.getRegion(d.country)).filter(r => r))];

        // --- 2. TRACE GENERATION (BUBBLES ONLY) ---

        // Create a scatter plot trace for each region.
        // This groups countries by region so they can have the same color and appear in the legend.
        const traces = regions.map(region => {
            // Get all countries belonging to this specific region
            const regionData = yearData.filter(d => this.getRegion(d.country) === region);

            return {
                // X-Axis: GDP in Billions (converted from raw value)
                x: regionData.map(d => d.gdp / 1000000000),
                
                // Y-Axis: Primary Energy Consumption (kWh per capita)
                y: regionData.map(d => d.primary_energy_consumption),
                
                // Text data for hover information
                text: regionData.map(d => d.country),
                
                mode: 'markers', // 'markers' means we draw bubbles, not lines
                type: 'scatter',
                name: region || 'Other', // Label for the legend
                
                // Marker (Bubble) styling
                marker: {
                    // Size is proportional to population (sqrt used to scale area correctly)
                    size: regionData.map(d => Math.sqrt(d.population || 1000000) / 80 + 8),
                    sizemode: 'area',
                    sizeref: 2,
                    color: this.regionColors[region] || '#94a3b8', // Use the region color map
                    opacity: 0.7,
                    line: { color: 'white', width: 1 } // Thin white border around bubbles
                },
                
                // Hover Tooltip Configuration
                // This is what shows the country name when you mouse over!
                hovertemplate: '<b>%{text}</b><br>GDP: $%{x:,.1f}B<br>Energy: %{y:,.0f} kWh<extra></extra>'
            };
        });

        /* REMOVED CODE:
           I have removed the 'majorCountryData' and 'labelTraces' logic here.
           Previously, that code created a second set of scatter plots with mode: 'text'
           to force static labels onto the chart. By removing it, the chart is cleaner.
        */

        // --- 3. LAYOUT CONFIGURATION ---

        const layout = {
            title: {
                text: 'Energy Consumption vs GDP (kWh per capita)',
                font: {
                    family: 'Inter, sans-serif',
                    size: 16,
                    color: '#1e293b'
                }
            },
            xaxis: {
                title: 'GDP (Billion USD)',
                type: 'log', // Logarithmic scale because GDP varies massively between countries
                range: [Math.log10(1000), Math.log10(500000)], // Set fixed range for stability
                gridcolor: 'rgba(226, 232, 240, 0.8)',
                showgrid: true,
                zeroline: false,
                tickfont: {
                    family: 'Inter, sans-serif',
                    size: 11,
                    color: '#64748b'
                }
            },
            yaxis: {
                title: 'kWh per capita',
                type: 'log', // Logarithmic scale for energy consumption as well
                range: [Math.log10(100), Math.log10(200000)],
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
            hovermode: 'closest', // Highlights the nearest point to the mouse cursor
            showlegend: true,
            legend: {
                orientation: 'h', // Horizontal legend
                x: 0.5,
                y: -0.25,
                xanchor: 'center',
                bgcolor: 'rgba(255,255,255,0.95)',
                bordercolor: 'rgba(226, 232, 240, 0.8)',
                borderwidth: 1,
                font: {
                    family: 'Inter, sans-serif',
                    size: 10
                }
            },
            paper_bgcolor: 'rgba(0,0,0,0)', // Transparent background
            plot_bgcolor: 'rgba(0,0,0,0)',
            annotations: [
                {
                    x: 0.02,
                    y: 0.98,
                    xref: 'paper',
                    yref: 'paper',
                    text: 'Bubble size = Population',
                    showarrow: false,
                    font: {
                        family: 'Inter, sans-serif',
                        size: 10,
                        color: '#64748b'
                    },
                    bgcolor: 'rgba(255,255,255,0.9)',
                    bordercolor: 'rgba(226, 232, 240, 0.8)',
                    borderwidth: 1,
                    borderpad: 4
                }
            ]
        };

        const config = {
            responsive: true,
            displayModeBar: false // Hides the Plotly toolbar for a cleaner look
        };

        // Render the chart ONLY with the 'traces' (bubbles), excluding labels
        Plotly.react(this.container, traces, layout, config);
    }

    // Helper method to determine the region of a country
    getRegion(country) {
        return this.countryRegions[country] || 'Other';
    }

    // Method to handle window resize events
    resize() {
        Plotly.Plots.resize(document.getElementById(this.container));
    }
}
