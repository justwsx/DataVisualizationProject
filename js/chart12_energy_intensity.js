class EnergyIntensityChart {
    constructor(data) {
        this.data = data;
        this.elementId = 'chart-energy-intensity';

        this.countries = [
            'United States',
            'China',
            'Germany',
            'India'
        ];

        this.colors = {
            'United States': '#2b0dc2',
            'China': '#ff3300',
            'Germany': '#22c55e',
            'India': '#ffa200'
        };

        // Initialize Tooltip
        this.tooltip = d3.select("body").selectAll(".d3-tooltip").data([0]).join("div")
            .attr("class", "d3-tooltip")
            .style("opacity", 0);

        window.addEventListener('resize', () => this.draw());
    }

    update() {
        this.draw();
    }

    draw() {
        const container = document.getElementById(this.elementId);
        if (!container) return;

        // --- Container Setup (Force Height) ---
        container.style.height = '500px'; 
        container.style.minHeight = '500px';
        container.style.width = '100%';
        container.style.overflow = 'hidden';
        container.innerHTML = '';

        const width = container.offsetWidth || 800;
        const height = 500;
        
        // Right margin is larger (120px) to fit country labels
        const margin = { top: 50, right: 120, bottom: 50, left: 60 };
        const w = width - margin.left - margin.right;
        const h = height - margin.top - margin.bottom;

        // --- Data Processing ---
        // We prepare a dataset grouped by country
        const processedData = this.countries.map(country => {
            const values = this.data
                .filter(d => 
                    d.country === country && 
                    d.gdp > 0 && d.population > 0 && d.primary_energy_consumption > 0
                )
                .sort((a, b) => a.year - b.year)
                .map(d => ({
                    year: d.year,
                    // Replicating your formula: Energy / (GDP / Pop)
                    value: d.primary_energy_consumption / (d.gdp / d.population),
                    original: d // keep ref for tooltip
                }));
            
            return { country, values };
        }).filter(group => group.values.length > 0);

        // --- Scales ---
        // X Domain: Extent of all years
        const allYears = processedData.flatMap(d => d.values.map(v => v.year));
        const x = d3.scaleLinear()
            .domain(d3.extent(allYears))
            .range([0, w]);

        // Y Domain: 0 to Max Value + 10% padding
        const allValues = processedData.flatMap(d => d.values.map(v => v.value));
        const yMax = d3.max(allValues) || 1;
        const y = d3.scaleLinear()
            .domain([0, yMax * 1.1])
            .range([h, 0]);

        // --- SVG ---
        const svg = d3.select(container).append("svg")
            .attr("viewBox", `0 0 ${width} ${height}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .style("width", "100%")
            .style("height", "auto")
            .style("font-family", "Inter, sans-serif")
            .append("g").attr('transform', `translate(${margin.left},${margin.top})`);

        // --- Axes ---
        // X Axis
        svg.append("g").attr("transform", `translate(0,${h})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")).tickSize(-h))
            .call(g => g.selectAll("line").attr("stroke", "#e2e8f0").attr("stroke-dasharray", "2,2"))
            .call(g => g.select(".domain").attr("stroke", "#cbd5e1"))
            .call(g => g.selectAll("text").attr("fill", "#64748b"));

        svg.append("text").attr("x", w/2).attr("y", h + 40)
            .text("Year")
            .attr("fill", "#64748b").attr("text-anchor", "middle").style("font-size", "13px");

        // Y Axis
        svg.append("g")
            .call(d3.axisLeft(y).tickSize(-w))
            .call(g => g.selectAll("line").attr("stroke", "#e2e8f0").attr("stroke-dasharray", "2,2"))
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll("text").attr("fill", "#64748b"));

        svg.append("text").attr("transform", "rotate(-90)").attr("y", -45).attr("x", -h/2)
            .text("Energy Intensity (Indicator)")
            .attr("fill", "#1e293b").attr("text-anchor", "middle").style("font-size", "12px");

        // Title
        svg.append("text").attr("x", w/2).attr("y", -20)
            .text("Energy Intensity over Time")
            .attr("font-weight", "bold").attr("text-anchor", "middle").attr("fill", "#475569").style("font-size", "16px");

        // --- Draw Lines & Labels ---
        const line = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.value));

        processedData.forEach(group => {
            const color = this.colors[group.country];
            const lastPoint = group.values[group.values.length - 1];

            // 1. The Line
            svg.append("path")
                .datum(group.values)
                .attr("fill", "none")
                .attr("stroke", color)
                .attr("stroke-width", 3)
                .attr("d", line);

            // 2. Invisible overlay for easier hovering on the line
            svg.append("path")
                .datum(group.values)
                .attr("fill", "none")
                .attr("stroke", "transparent")
                .attr("stroke-width", 15) // Fat invisible line
                .attr("d", line)
                .on("mouseover", (e) => {
                    this.tooltip.style("opacity", 1)
                        .html(`<b>${group.country}</b>`)
                        .style("left", (e.pageX + 10) + "px").style("top", (e.pageY - 20) + "px");
                })
                .on("mouseout", () => this.tooltip.style("opacity", 0));

            // 3. Dot at the end
            svg.append("circle")
                .attr("cx", x(lastPoint.year))
                .attr("cy", y(lastPoint.value))
                .attr("r", 5)
                .attr("fill", color);

            // 4. Label at the end
            svg.append("text")
                .attr("x", x(lastPoint.year) + 10) // Shift right
                .attr("y", y(lastPoint.value) + 4) // Center vertically
                .text(group.country)
                .attr("fill", color)
                .style("font-size", "12px")
                .style("font-weight", "bold");
        });
    }

    resize() { this.draw(); }
}