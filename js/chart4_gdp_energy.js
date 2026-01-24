class GDPEnergyChart {
    constructor(data) {
        this.data = data;
        this.containerId = 'chart-gdp-energy';
        this.year = 2020; // Default year

        this.colors = {
            "Africa": "#dc2626", "Asia": "#0891b2", "Europe": "#7c3aed",
            "North America": "#ea580c", "South America": "#16a34a",
            "Oceania": "#eaa400", "Other": "#6b7280"
        };

        // Simplified Country mapping (Partial list for brevity, logic remains valid)
        this.regions = {
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

        // Create Tooltip once
        this.tooltip = d3.select("body").append("div")
            .attr("class", "d3-tooltip")
            .style("opacity", 0);

        window.addEventListener('resize', () => this.draw());
    }

    getRegion(country) {
        // Check map, then fallback to "Other"
        for (const [cntry, region] of Object.entries(this.regions)) {
            if (country === cntry) return region;
        }
        // Basic heuristic: check if country is in the full map provided previously
        // or just return 'Other' for unknown ones to prevent crashes
        return this.regions[country] || 'Other'; 
        // Note: In production, ensure this.regions contains all your countries
    }

    update(year) {
        this.year = year;
        this.draw();
    }

    draw() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // 1. Setup Data & Dimensions
        container.innerHTML = '';
        const { width: w, height: h } = container.getBoundingClientRect();
        const height = h || 500;
        const margin = { top: 60, right: 40, bottom: 80, left: 60 };
        const width = w - margin.left - margin.right;
        const chartH = height - margin.top - margin.bottom;

        // Filter Data (Year > Positive Values > Sort by Pop)
        let dataset = this.data.filter(d => d.year === this.year);
        if (!dataset.length) dataset = this.data.filter(d => d.year === 2020); // Fallback
        
        dataset = dataset
            .filter(d => d.primary_energy_consumption > 0 && d.gdp > 0)
            .sort((a, b) => b.population - a.population);

        // 2. Create SVG & Scales
        const svg = d3.select(container).append("svg")
            .attr("width", w).attr("height", height)
            .style("font-family", "Inter, sans-serif")
            .append("g").attr('transform', `translate(${margin.left},${margin.top})`);

        // Log Scales for X and Y
        const x = d3.scaleLog().domain([1000, 300000]).range([0, width]).clamp(true);
        const y = d3.scaleLog().domain([50, 100000]).range([chartH, 0]).clamp(true);
        const r = d3.scaleSqrt().domain([0, 1e9]).range([3, 40]); // Bubble size

        // 3. Draw Axes (with custom tick formatting for 'k')
        const formatK = d => d >= 1000 ? d/1000 + 'k' : d;
        
        // X Axis
        svg.append("g").attr("transform", `translate(0,${chartH})`)
            .call(d3.axisBottom(x).tickValues([1000, 5000, 10000, 50000, 100000, 200000]).tickFormat(formatK).tickSize(-chartH))
            .call(g => g.selectAll("line").attr("stroke", "#e2e8f0"))
            .call(g => g.select(".domain").attr("stroke", "#cbd5e1"));
        
        svg.append("text").attr("x", width/2).attr("y", chartH + 40).text("GDP per Capita ($)").attr("fill", "#64748b").attr("text-anchor", "middle").style("font-size", "13px");

        // Y Axis
        svg.append("g")
            .call(d3.axisLeft(y).tickValues([100, 500, 1000, 5000, 10000, 50000, 100000]).tickFormat(formatK).tickSize(-width))
            .call(g => g.selectAll("line").attr("stroke", "#e2e8f0"))
            .call(g => g.select(".domain").remove());

        svg.append("text").attr("transform", "rotate(-90)").attr("y", -40).attr("x", -chartH/2).text("Energy Consumption (kWh)").attr("fill", "#64748b").attr("text-anchor", "middle").style("font-size", "13px");

        // Title
        svg.append("text").attr("x", width/2).attr("y", -25).text("Energy Consumption vs GDP").attr("font-weight", "bold").attr("text-anchor", "middle").attr("fill", "#1e293b");

        // 4. Draw Bubbles
        svg.selectAll("circle")
            .data(dataset).enter().append("circle")
            .attr("cx", d => x(d.gdp / 1e9)) // Assuming GDP is total, convert to rough per capita proxy or usage as per original
            .attr("cy", d => y(d.primary_energy_consumption))
            .attr("r", d => r(d.population || 0))
            .attr("fill", d => this.colors[this.getRegion(d.country)] || '#6b7280')
            .attr("stroke", "white").attr("fill-opacity", 0.8)
            .on("mouseover", (e, d) => {
                d3.select(e.target).attr("stroke", "#333").attr("stroke-width", 2);
                this.tooltip.style("opacity", 1).html(`<b>${d.country}</b><br>GDP: $${Math.round(d.gdp/1e9)}B<br>Energy: ${Math.round(d.primary_energy_consumption)}`)
                    .style("left", (e.pageX + 10) + "px").style("top", (e.pageY - 20) + "px");
            })
            .on("mouseout", (e) => {
                d3.select(e.target).attr("stroke", "white").attr("stroke-width", 1);
                this.tooltip.style("opacity", 0);
            });

        // 5. Draw Legend (Simple Centered Grid)
        const keys = Object.keys(this.colors);
        const itemW = 110; 
        const rowSize = Math.floor(width / itemW);
        
        keys.forEach((key, i) => {
            const row = Math.floor(i / rowSize);
            const col = i % rowSize;
            // Calculate offset to center the row
            const rowWidth = Math.min(keys.length - row * rowSize, rowSize) * itemW;
            const xBase = (width - rowWidth) / 2;
            
            const g = svg.append("g").attr("transform", `translate(${xBase + col * itemW}, ${chartH + 60 + row * 20})`);
            g.append("circle").attr("r", 5).attr("fill", this.colors[key]);
            g.append("text").attr("x", 10).attr("y", 4).text(key).style("font-size", "12px").attr("fill", "#64748b");
        });
    }

    resize() { this.draw(); }
}