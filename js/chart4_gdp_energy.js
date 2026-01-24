class GDPEnergyChart {
    constructor(data) {
        this.data = data;
        this.containerId = 'chart-gdp-energy';

        // Color mapping for regions
        this.regionColors = {
            "Africa": "#dc2626",
            "Asia": "#0891b2",
            "Europe": "#7c3aed",
            "North America": "#ea580c",
            "South America": "#16a34a",
            "Oceania": "#eaa400",
            "Other": "#6b7280"
        };

        // Mapping specific countries to regions
        this.countryRegions = {
            "United States": "North America", "Canada": "North America", "Mexico": "North America",
            "Brazil": "South America", "Argentina": "South America", "Chile": "South America",
            "United Kingdom": "Europe", "Germany": "Europe", "France": "Europe", "Italy": "Europe",
            "Poland": "Europe", "Russia": "Asia", "Turkey": "Asia", "Spain": "Europe",
            "Netherlands": "Europe", "Belgium": "Europe", "Sweden": "Europe", "Norway": "Europe",
            "Switzerland": "Europe", "China": "Asia", "India": "Asia", "Japan": "Asia",
            "South Korea": "Asia", "Indonesia": "Asia", "Thailand": "Asia", "Saudi Arabia": "Asia",
            "Iran": "Asia", "Vietnam": "Asia", "Pakistan": "Asia", "Bangladesh": "Asia",
            "Australia": "Oceania", "South Africa": "Africa", "Egypt": "Africa",
            "Nigeria": "Africa", "Kenya": "Africa", "Morocco": "Africa"
        };

        // Create the tooltip element once (appended to body to avoid overflow issues)
        this.tooltip = d3.select("body").append("div")
            .attr("class", "d3-tooltip")
            .style("opacity", 0)
            .style("position", "absolute")
            .style("background", "rgba(255, 255, 255, 0.95)")
            .style("border", "1px solid #cbd5e1")
            .style("padding", "8px")
            .style("border-radius", "4px")
            .style("pointer-events", "none")
            .style("font-family", "Inter, sans-serif")
            .style("font-size", "12px")
            .style("box-shadow", "0 4px 6px -1px rgba(0, 0, 0, 0.1)");

        // Bind resize event
        window.addEventListener('resize', () => this.draw());
    }

    /**
     * Helper to get region from country name
     */
    getRegion(country) {
        return this.countryRegions[country] || 'Other';
    }

    /**
     * Main update method called by external controller
     */
    update(selectedYear) {
        this.currentYear = selectedYear;
        this.draw();
    }

    /**
     * Renders the chart using D3
     */
    draw() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // 1. Data Processing
        // Filter by year and ensure positive values for Log Scale
        let yearData = this.data.filter(d => d.year === this.currentYear);
        
        // Fallback if no data for selected year (use latest available)
        if (yearData.length === 0) {
            const availableYears = [...new Set(this.data.map(d => d.year))].sort((a, b) => b - a);
            yearData = this.data.filter(d => d.year === availableYears[0]);
        }

        // Filter valid data (Log scale cannot handle <= 0)
        let cleanData = yearData.filter(d => d.primary_energy_consumption > 0 && d.gdp > 0);

        // Sort by population descending so small bubbles appear on top of large ones
        cleanData.sort((a, b) => (b.population || 0) - (a.population || 0));

        // 2. Setup Dimensions
        container.innerHTML = ''; // Clear previous SVG
        const { width: w, height: h } = container.getBoundingClientRect();
        const height = h || 500; // Default height if container is collapsed
        
        // Margins (Bottom needs space for Legend and X Axis)
        const margin = { top: 60, right: 40, bottom: 100, left: 60 };
        const width = w - margin.left - margin.right;
        const chartH = height - margin.top - margin.bottom;

        // 3. Create SVG
        const svg = d3.select(container).append("svg")
            .attr("width", w)
            .attr("height", height)
            .style("font-family", "Inter, sans-serif")
            .append("g")
            .attr("transform", `translate(${margin.left},${margin.top})`);

        // 4. Scales (Logarithmic)
        // X Axis: GDP per Capita (Range matches original: 1k to 300k)
        const xScale = d3.scaleLog()
            .domain([1000, 300000])
            .range([0, width])
            .clamp(true); // Prevent bubbles going off-chart

        // Y Axis: Energy Consumption (Range matches original: 50 to 100k)
        const yScale = d3.scaleLog()
            .domain([50, 300000]) 
            .range([chartH, 0])
            .clamp(true);

        // Bubble Size Scale (Sqrt scale for area representation)
        const rScale = d3.scaleSqrt()
            .domain([0, 1000000000]) // Max population assumption: 1B
            .range([2, 40]); // Min/Max radius pixels

        // 5. Draw Grid and Axes
        // X Axis Grid & Ticks
        const xTickValues = [1000, 5000, 10000, 50000, 100000, 200000];
        const xAxis = d3.axisBottom(xScale)
            .tickValues(xTickValues)
            .tickFormat(d => d >= 1000 ? d / 1000 + 'k' : d)
            .tickSize(-chartH); // Full vertical grid

        svg.append("g")
            .attr("transform", `translate(0,${chartH})`)
            .call(xAxis)
            .call(g => g.select(".domain").attr("stroke", "#cbd5e1"))
            .call(g => g.selectAll("line").attr("stroke", "rgba(226, 232, 240, 0.4)"))
            .call(g => g.selectAll("text").attr("fill", "#64748b"));

        // X Axis Title
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", chartH + 40)
            .attr("text-anchor", "middle")
            .style("fill", "#475569")
            .style("font-size", "13px")
            .text("GDP per Capita ($)");

        // Y Axis Grid & Ticks
        const yTickValues = [100, 500, 1000, 5000, 10000, 50000, 100000];
        const yAxis = d3.axisLeft(yScale)
            .tickValues(yTickValues)
            .tickFormat(d => d >= 1000 ? d / 1000 + 'k' : d)
            .tickSize(-width); // Full horizontal grid

        svg.append("g")
            .call(yAxis)
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll("line").attr("stroke", "rgba(226, 232, 240, 0.4)"))
            .call(g => g.selectAll("text").attr("fill", "#64748b"));

        // Y Axis Title
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -(chartH / 2))
            .attr("y", -40)
            .attr("text-anchor", "middle")
            .style("fill", "#475569")
            .style("font-size", "13px")
            .text("Primary Energy Consumption (kWh)");

        // Chart Title
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", -30)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .style("font-weight", "bold")
            .style("fill", "#1e293b")
            .text("Energy Consumption vs GDP per Capita");

        // 6. Draw Bubbles
        const circles = svg.selectAll("circle")
            .data(cleanData)
            .enter()
            .append("circle")
            // Logic from original: x = gdp / 1e9 (Billions) - Assuming input fits scale
            .attr("cx", d => xScale(d.gdp / 1000000000)) 
            .attr("cy", d => yScale(d.primary_energy_consumption))
            .attr("r", d => {
                // Original logic: Math.sqrt(population) / 80 + 10
                // We adapt slightly for D3 scale consistency, or use pure math
                const size = Math.sqrt(d.population || 1000000) / 80 + 5; 
                return Math.max(size, 3);
            })
            .attr("fill", d => this.regionColors[this.getRegion(d.country)] || '#6b7280')
            .attr("opacity", 0.85)
            .attr("stroke", "white")
            .attr("stroke-width", 1.5)
            // Interaction
            .on("mouseover", (event, d) => {
                d3.select(event.currentTarget).attr("stroke", "#1e293b").attr("stroke-width", 2);
                
                this.tooltip.transition().duration(200).style("opacity", 1);
                this.tooltip.html(`
                    <b>${d.country}</b><br/>
                    GDP: $${d3.format(",.1f")(d.gdp / 1000000000)}B<br/>
                    Energy: ${d3.format(",.0f")(d.primary_energy_consumption)} kWh<br/>
                    Pop: ${d3.format(",.0f")(d.population)}
                `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", (event) => {
                d3.select(event.currentTarget).attr("stroke", "white").attr("stroke-width", 1.5);
                this.tooltip.transition().duration(500).style("opacity", 0);
            });

        // 7. Draw Legend (Bottom centered)
        const regions = Object.keys(this.regionColors);
        const legendItemWidth = 100;
        const itemsPerRow = Math.floor(width / legendItemWidth);
        
        const legendGroup = svg.append("g")
            .attr("transform", `translate(0, ${chartH + 70})`);

        regions.forEach((region, i) => {
            // Simple grid layout for legend
            const row = Math.floor(i / itemsPerRow);
            const col = i % itemsPerRow;
            
            // Center the row
            const itemsInThisRow = Math.min(regions.length - (row * itemsPerRow), itemsPerRow);
            const rowWidth = itemsInThisRow * legendItemWidth;
            const xOffset = (width - rowWidth) / 2;

            const g = legendGroup.append("g")
                .attr("transform", `translate(${xOffset + col * legendItemWidth}, ${row * 20})`);

            g.append("circle")
                .attr("r", 5)
                .attr("fill", this.regionColors[region]);

            g.append("text")
                .attr("x", 10)
                .attr("y", 4)
                .text(region)
                .style("font-size", "12px")
                .style("fill", "#64748b");
        });

        // Annotation "Bubble size = Population"
        svg.append("text")
            .attr("x", 10)
            .attr("y", 10)
            .text("Bubble size = Population")
            .style("font-size", "11px")
            .style("fill", "#64748b")
            .style("font-style", "italic");
    }

    resize() {
        this.draw();
    }
}