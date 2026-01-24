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

        // Create tooltip once
        this.tooltip = d3.select("body").selectAll(".d3-tooltip").data([0]).join("div")
            .attr("class", "d3-tooltip")
            .style("opacity", 0);

        // --- NEW: ResizeObserver for robust full-screen handling ---
        // This watches the container size changes directly
        const container = document.getElementById(this.elementId);
        if (container) {
            this.observer = new ResizeObserver(entries => {
                for (let entry of entries) {
                    // Use requestAnimationFrame to avoid "ResizeObserver loop limit exceeded"
                    requestAnimationFrame(() => {
                        // Only redraw if width actually changed and is valid
                        if (entry.contentRect.width > 0) {
                            this.draw();
                        }
                    });
                }
            });
            this.observer.observe(container);
        }
        
        // Initial draw
        this.draw();
    }

    update() {
        this.draw();
    }

    draw() {
        const container = document.getElementById(this.elementId);
        if (!container) return;

        // 1. Force container styles to ensure visibility
        const fixedHeight = 500;
        container.style.width = '100%';
        container.style.height = `${fixedHeight}px`;
        container.style.minHeight = `${fixedHeight}px`;
        container.style.position = 'relative'; // Helps with layout stability
        container.innerHTML = '';

        // 2. Get exact current pixel width
        const rect = container.getBoundingClientRect();
        // Fallback to 800 if rendering hasn't finished yet, to avoid crash
        const width = rect.width > 0 ? rect.width : 800;
        const height = fixedHeight;

        // 3. Define dynamic margins
        const margin = { top: 50, right: 130, bottom: 50, left: 60 };
        const w = width - margin.left - margin.right;
        const h = height - margin.top - margin.bottom;

        // 4. Create SVG with EXACT pixel dimensions (No viewBox scaling issues)
        const svg = d3.select(container).append("svg")
            .attr("width", width)
            .attr("height", height)
            .style("display", "block")
            .style("font-family", "Inter, sans-serif")
            .append("g").attr('transform', `translate(${margin.left},${margin.top})`);

        // 5. Data Processing
        const processedData = this.countries.map(country => {
            const values = this.data
                .filter(d => 
                    d.country === country && 
                    d.gdp > 0 && d.population > 0 && d.primary_energy_consumption > 0
                )
                .sort((a, b) => a.year - b.year)
                .map(d => ({
                    year: d.year,
                    value: d.primary_energy_consumption / (d.gdp / d.population),
                }));
            return { country, values };
        }).filter(group => group.values.length > 0);

        // 6. Scales (Recalculated on every draw for full width)
        const allYears = processedData.flatMap(d => d.values.map(v => v.year));
        const x = d3.scaleLinear().domain(d3.extent(allYears)).range([0, w]);

        const allValues = processedData.flatMap(d => d.values.map(v => v.value));
        const yMax = d3.max(allValues) || 1;
        const y = d3.scaleLinear().domain([0, yMax * 1.1]).range([h, 0]);

        // 7. Draw Axes
        svg.append("g").attr("transform", `translate(0,${h})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")).tickSize(-h)) // Grid lines
            .call(g => g.selectAll("line").attr("stroke", "#e2e8f0").attr("stroke-dasharray", "2,2"))
            .call(g => g.select(".domain").attr("stroke", "#cbd5e1"))
            .call(g => g.selectAll("text").attr("fill", "#64748b"));

        svg.append("text").attr("x", w/2).attr("y", h + 40)
            .text("Year").attr("fill", "#64748b").attr("text-anchor", "middle").style("font-size", "13px");

        svg.append("g")
            .call(d3.axisLeft(y).tickSize(-w)) // Grid lines full width
            .call(g => g.selectAll("line").attr("stroke", "#e2e8f0").attr("stroke-dasharray", "2,2"))
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll("text").attr("fill", "#64748b"));

        svg.append("text").attr("transform", "rotate(-90)").attr("y", -45).attr("x", -h/2)
            .text("Energy Intensity (Indicator)").attr("fill", "#1e293b").attr("text-anchor", "middle").style("font-size", "12px");

        svg.append("text").attr("x", w/2).attr("y", -20)
            .text("Energy Intensity over Time").attr("font-weight", "bold").attr("text-anchor", "middle").attr("fill", "#475569").style("font-size", "16px");

        // 8. Draw Lines
        const line = d3.line().x(d => x(d.year)).y(d => y(d.value));

        processedData.forEach(group => {
            const color = this.colors[group.country];
            const lastPoint = group.values[group.values.length - 1];

            // Visible Line
            svg.append("path").datum(group.values)
                .attr("fill", "none").attr("stroke", color).attr("stroke-width", 3).attr("d", line);

            // Invisible Interaction Line (Thicker)
            svg.append("path").datum(group.values)
                .attr("fill", "none").attr("stroke", "transparent").attr("stroke-width", 20).attr("d", line)
                .on("mouseover", (e) => {
                    this.tooltip.style("opacity", 1).html(`<b>${group.country}</b>`)
                        .style("left", (e.pageX + 10) + "px").style("top", (e.pageY - 20) + "px");
                })
                .on("mouseout", () => this.tooltip.style("opacity", 0));

            // End Dot
            svg.append("circle").attr("cx", x(lastPoint.year)).attr("cy", y(lastPoint.value))
                .attr("r", 5).attr("fill", color);

            // Label
            svg.append("text").attr("x", x(lastPoint.year) + 10).attr("y", y(lastPoint.value) + 4)
                .text(group.country).attr("fill", color).style("font-size", "12px").style("font-weight", "bold");
        });
    }

    // Cleanup method if you ever destroy the chart (optional but good practice)
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}