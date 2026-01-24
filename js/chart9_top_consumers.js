/**
 * class TopConsumersChart
 * --------------------------------------------------------------------------
 * Renders a Horizontal Bar Chart displaying the top energy-consuming countries.
 * * Visualization Logic:
 * - Y-Axis: Countries (Categorical).
 * - X-Axis: Energy Consumption (Linear).
 * - Color: Geographic Region (using a manual mapping).
 * - Interaction: Tooltip with detailed stats.
 */
class TopConsumersChart {
    
    /**
     * Initializes the chart instance.
     * @param {Array} data - The complete dataset.
     */
    constructor(data) {
        this.data = data;
        this.containerId = 'chart-top-consumers'; // Target DOM ID
        this.year = 2020; // Default year

        // Color Palette by Region
        this.regionColors = {
            "Asia": "#3b82f6",          // Blue
            "North America": "#6366f1", // Indigo
            "Europe": "#22c55e",        // Green
            "South America": "#f59e0b", // Amber
            "Africa": "#ec4899",        // Pink
            "Oceania": "#14b8a6"        // Teal
        };

        // Manual Mapping: Country Name -> Region
        // (Required because the raw dataset might not have a 'Region' column)
        this.countryRegions = {
            "China": "Asia", "India": "Asia", "United States": "North America",
            "Russia": "Asia", "Japan": "Asia", "Germany": "Europe",
            "Brazil": "South America", "Canada": "North America",
            "United Kingdom": "Europe", "France": "Europe", "Italy": "Europe",
            "Australia": "Oceania", "South Korea": "Asia", "Saudi Arabia": "Asia",
            "Mexico": "North America", "Indonesia": "Asia", "Iran": "Asia",
            "South Africa": "Africa", "Egypt": "Africa", "Nigeria": "Africa",
            "Spain": "Europe", "Poland": "Europe", "Turkey": "Asia",
            "Thailand": "Asia", "Vietnam": "Asia", "Pakistan": "Asia",
            "Argentina": "South America"
        };

        // Initialize Tooltip
        this.tooltip = d3.select("body").selectAll(".d3-tooltip")
            .data([0])
            .join("div")
            .attr("class", "d3-tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background", "rgba(255, 255, 255, 0.95)")
            .style("border", "1px solid #e2e8f0")
            .style("padding", "8px 12px")
            .style("border-radius", "6px")
            .style("pointer-events", "none")
            .style("font-family", "Inter, sans-serif")
            .style("font-size", "12px")
            .style("box-shadow", "0 4px 6px -1px rgba(0,0,0,0.1)");

        // Setup Resize Observer
        const container = document.getElementById(this.containerId);
        if (container) {
            this.observer = new ResizeObserver(entries => {
                for (let entry of entries) {
                    if (entry.contentRect.width > 0) {
                        requestAnimationFrame(() => this.draw());
                    }
                }
            });
            this.observer.observe(container);
        }

        // Initial Render
        this.draw();
    }

    /**
     * Helper to lookup region from country name.
     */
    getRegion(country) {
        return this.countryRegions[country] || null;
    }

    /**
     * Helper to format large numbers (e.g., 1000 -> 1K).
     */
    formatNumber(num) {
        if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return num.toString();
    }

    /**
     * Updates the chart to the selected year.
     * @param {number} selectedYear 
     */
    update(selectedYear) {
        this.year = selectedYear;
        this.draw();
    }

    /**
     * Main rendering logic.
     */
    draw() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // 1. DIMENSIONS & SETUP
        const fixedHeight = 600; // Fixed height to accommodate 15 bars comfortably
        container.style.width = '100%';
        container.style.height = `${fixedHeight}px`;
        container.style.minHeight = `${fixedHeight}px`;
        container.style.position = 'relative';
        container.innerHTML = ''; // Clear previous SVG

        const rect = container.getBoundingClientRect();
        const width = rect.width > 0 ? rect.width : 800;
        const height = fixedHeight;

        // Margins: Left is large for long country names, Right for Legend
        const margin = { top: 40, right: 150, bottom: 50, left: 140 }; 
        const w = width - margin.left - margin.right;
        const h = height - margin.top - margin.bottom;

        // 2. DATA PREPARATION
        let yearData = this.data.filter(d => d.year === this.year);
        
        // Fallback: Use latest year if data is missing for selected year
        if (yearData.length === 0) {
            const availableYears = [...new Set(this.data.map(d => d.year))].sort((a, b) => b - a);
            yearData = this.data.filter(d => d.year === availableYears[0]);
        }

        // Aggregate Data (Safety step, though typically 1 row per country per year)
        const countryMap = {};
        yearData.forEach(d => {
            if (!countryMap[d.country]) {
                countryMap[d.country] = {
                    country: d.country,
                    energy: 0,
                    population: 0,
                    region: this.getRegion(d.country)
                };
            }
            countryMap[d.country].energy += d.primary_energy_consumption || 0;
            countryMap[d.country].population += d.population || 0;
        });

        // Filter valid regions, Sort Descending, Take Top 15
        const sortedData = Object.values(countryMap)
            .filter(d => d.region !== null) // Exclude unmapped countries
            .sort((a, b) => b.energy - a.energy) 
            .slice(0, 15);

        // 3. SCALES
        // Y-Axis: Band scale for countries
        const y = d3.scaleBand()
            .domain(sortedData.map(d => d.country))
            .range([0, h])
            .padding(0.2); // Spacing between bars

        // X-Axis: Linear scale for energy values
        const xMax = d3.max(sortedData, d => d.energy) || 100;
        const x = d3.scaleLinear()
            .domain([0, xMax * 1.1]) // Add 10% padding for labels
            .range([0, w]);

        // 4. SVG INITIALIZATION
        const svg = d3.select(container).append("svg")
            .attr("width", width)
            .attr("height", height)
            .style("display", "block")
            .style("font-family", "Inter, sans-serif")
            .append("g").attr('transform', `translate(${margin.left},${margin.top})`);

        // 5. VERTICAL GRID LINES
        svg.append("g")
            .attr("transform", `translate(0,${h})`)
            .call(d3.axisBottom(x).ticks(5).tickSize(-h).tickFormat(""))
            .call(g => g.selectAll("line").attr("stroke", "#e2e8f0").attr("stroke-dasharray", "2,2"))
            .call(g => g.select(".domain").remove());

        // 6. DRAW BARS
        svg.selectAll(".bar")
            .data(sortedData)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("y", d => y(d.country))
            .attr("x", 0)
            .attr("height", y.bandwidth())
            .attr("width", d => x(d.energy))
            .attr("fill", d => this.regionColors[d.region] || '#ccc')
            .attr("rx", 3) // Rounded corners
            .attr("opacity", 0.9)
            // Interaction
            .on("mouseover", (e, d) => {
                d3.select(e.target).attr("opacity", 1).attr("stroke", "#333").attr("stroke-width", 1);
                this.tooltip.style("opacity", 1)
                    .html(`<b>${d.country}</b><br>
                           Region: ${d.region}<br>
                           Per Capita: ${d3.format(",.0f")(d.energy)} kWh<br>
                           Pop: ${this.formatNumber(d.population)}`)
                    .style("left", (e.pageX + 10) + "px").style("top", (e.pageY - 20) + "px");
            })
            .on("mouseout", (e) => {
                d3.select(e.target).attr("opacity", 0.9).attr("stroke", "none");
                this.tooltip.style("opacity", 0);
            });

        // 7. VALUE LABELS (Right of bars)
        svg.selectAll(".label")
            .data(sortedData)
            .enter().append("text")
            .attr("y", d => y(d.country) + y.bandwidth() / 2 + 4) // Centered vertically
            .attr("x", d => x(d.energy) + 5) // Offset right
            .text(d => this.formatNumber(d.energy))
            .attr("fill", "#1e293b")
            .style("font-size", "11px")
            .style("font-weight", "600");

        // 8. AXES
        // Y-Axis (Country Names)
        svg.append("g")
            .call(d3.axisLeft(y).tickSize(0))
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll("text")
                .style("font-size", "11px")
                .style("font-weight", "500")
                .attr("fill", "#1e293b"));

        // X-Axis (Values at bottom)
        svg.append("g")
            .attr("transform", `translate(0,${h})`)
            .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(",.0f")))
            .call(g => g.select(".domain").attr("stroke", "#cbd5e1"))
            .call(g => g.selectAll("text").attr("fill", "#64748b"));

        // X-Axis Title
        svg.append("text")
            .attr("x", w / 2)
            .attr("y", h + 40)
            .text("kWh per capita")
            .attr("fill", "#64748b")
            .attr("text-anchor", "middle")
            .style("font-size", "13px");

        // 9. LEGEND (Right Side)
        const regions = Object.keys(this.regionColors);
        const legendG = svg.append("g")
            .attr("transform", `translate(${w + 30}, 0)`);

        legendG.append("text")
            .attr("x", 0).attr("y", -10)
            .text("Region")
            .style("font-weight", "bold").style("font-size", "12px").attr("fill", "#1e293b");

        regions.forEach((region, i) => {
            const g = legendG.append("g").attr("transform", `translate(0, ${i * 20})`);
            
            // Legend Color Box
            g.append("rect")
                .attr("width", 12).attr("height", 12)
                .attr("fill", this.regionColors[region])
                .attr("rx", 2);

            // Legend Text
            g.append("text")
                .attr("x", 18).attr("y", 10)
                .text(region)
                .style("font-size", "11px").attr("fill", "#64748b");
        });

        // 10. TITLE ANNOTATION
        svg.append("text")
            .attr("x", w / 2)
            .attr("y", -10)
            .text("Top 15 Countries by Energy Consumption")
            .attr("text-anchor", "middle")
            .style("font-size", "14px").style("font-weight", "bold").attr("fill", "#1e293b");
    }
}