/**
 * class EnergyIntensityChart
 * --------------------------------------------------------------------------
 * Renders a Multi-Line Chart comparing Energy Intensity over time.
 * * Visualization Logic:
 * - Metric: Primary Energy Consumption divided by GDP per Capita.
 * - Layout: Responsive SVG using ResizeObserver.
 * - Interaction: Tooltip and direct labeling for countries.
 */
class EnergyIntensityChart {
    
    /**
     * Initializes the chart instance.
     * @param {Array} data - The complete dataset.
     */
    constructor(data) {
        this.data = data;
        this.elementId = 'chart-energy-intensity'; // Target DOM ID

        // Selected countries for comparison
        this.countries = [
            'United States',
            'China',
            'Germany',
            'India'
        ];

        // Specific color mapping
        this.colors = {
            'United States': '#2b0dc2', // Blue
            'China': '#ff3300',         // Red
            'Germany': '#22c55e',       // Green
            'India': '#ffa200'          // Orange
        };

        // Initialize Tooltip (Singleton pattern for this chart)
        this.tooltip = d3.select("body").selectAll(".d3-tooltip").data([0]).join("div")
            .attr("class", "d3-tooltip")
            .style("opacity", 0);

        // --- RESIZE OBSERVER SETUP ---
        // Watches the container size changes directly for robust responsiveness.
        // This replaces the standard 'window.resize' event listener.
        const container = document.getElementById(this.elementId);
        if (container) {
            this.observer = new ResizeObserver(entries => {
                for (let entry of entries) {
                    // Use requestAnimationFrame to avoid "ResizeObserver loop limit exceeded" errors
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

    /**
     * Updates the chart (can be extended for data filtering).
     */
    update() {
        this.draw();
    }

    /**
     * Main rendering logic.
     * Handles DOM sizing, Data processing, and SVG drawing.
     */
    draw() {
        const container = document.getElementById(this.elementId);
        if (!container) return;

        // 1. CONTAINER STYLING
        // Apply fixed height to prevent layout collapse before rendering
        const fixedHeight = 500;
        container.style.width = '100%';
        container.style.height = `${fixedHeight}px`;
        container.style.minHeight = `${fixedHeight}px`;
        container.style.position = 'relative'; // Helps with absolute positioning of internal elements
        container.innerHTML = ''; // Clear previous SVG

        // 2. DIMENSION CALCULATION
        const rect = container.getBoundingClientRect();
        // Fallback to 800px if rendering hasn't finished yet
        const width = rect.width > 0 ? rect.width : 800;
        const height = fixedHeight;

        // 3. MARGINS
        // Right margin is larger to accommodate country labels
        const margin = { top: 50, right: 130, bottom: 50, left: 60 };
        const w = width - margin.left - margin.right;
        const h = height - margin.top - margin.bottom;

        // 4. SVG INITIALIZATION
        // Create SVG with EXACT pixel dimensions to avoid viewBox scaling artifacts
        const svg = d3.select(container).append("svg")
            .attr("width", width)
            .attr("height", height)
            .style("display", "block")
            .style("font-family", "Inter, sans-serif")
            .append("g").attr('transform', `translate(${margin.left},${margin.top})`);

        // 5. DATA PROCESSING
        const processedData = this.countries.map(country => {
            const values = this.data
                .filter(d => 
                    d.country === country && 
                    d.gdp > 0 && d.population > 0 && d.primary_energy_consumption > 0
                )
                .sort((a, b) => a.year - b.year)
                .map(d => ({
                    year: d.year,
                    // Metric Calculation: Energy / (GDP per Capita)
                    value: d.primary_energy_consumption / (d.gdp / d.population),
                }));
            return { country, values };
        }).filter(group => group.values.length > 0);

        // 6. SCALES
        // Recalculated on every draw to fit the full width
        const allYears = processedData.flatMap(d => d.values.map(v => v.year));
        const x = d3.scaleLinear()
            .domain(d3.extent(allYears))
            .range([0, w]);

        const allValues = processedData.flatMap(d => d.values.map(v => v.value));
        const yMax = d3.max(allValues) || 1;
        const y = d3.scaleLinear()
            .domain([0, yMax * 1.1]) // Add 10% padding on top
            .range([h, 0]);

        // 7. DRAW AXES
        // X-Axis
        svg.append("g").attr("transform", `translate(0,${h})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")).tickSize(-h)) // Full-height grid lines
            .call(g => g.selectAll("line").attr("stroke", "#e2e8f0").attr("stroke-dasharray", "2,2"))
            .call(g => g.select(".domain").attr("stroke", "#cbd5e1"))
            .call(g => g.selectAll("text").attr("fill", "#64748b"));

        // X-Axis Label
        svg.append("text").attr("x", w/2).attr("y", h + 40)
            .text("Year")
            .attr("fill", "#64748b").attr("text-anchor", "middle").style("font-size", "13px");

        // Y-Axis
        svg.append("g")
            .call(d3.axisLeft(y).tickSize(-w)) // Full-width grid lines
            .call(g => g.selectAll("line").attr("stroke", "#e2e8f0").attr("stroke-dasharray", "2,2"))
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll("text").attr("fill", "#64748b"));

        // Y-Axis Label
        svg.append("text").attr("transform", "rotate(-90)").attr("y", -45).attr("x", -h/2)
            .text("Energy Intensity (Indicator)")
            .attr("fill", "#1e293b").attr("text-anchor", "middle").style("font-size", "12px");

        // Chart Title
        svg.append("text").attr("x", w/2).attr("y", -20)
            .text("Energy Intensity over Time")
            .attr("font-weight", "bold").attr("text-anchor", "middle").attr("fill", "#475569").style("font-size", "16px");

        // 8. DRAW LINES
        const line = d3.line()
            .x(d => x(d.year))
            .y(d => y(d.value));

        processedData.forEach(group => {
            const color = this.colors[group.country];
            const lastPoint = group.values[group.values.length - 1];

            // A. Visible Path
            svg.append("path").datum(group.values)
                .attr("fill", "none")
                .attr("stroke", color)
                .attr("stroke-width", 3)
                .attr("d", line);

            // B. Invisible Interaction Path (Thicker stroke for easier hovering)
            svg.append("path").datum(group.values)
                .attr("fill", "none")
                .attr("stroke", "transparent")
                .attr("stroke-width", 20)
                .attr("d", line)
                .on("mouseover", (e) => {
                    this.tooltip.style("opacity", 1)
                        .html(`<b>${group.country}</b>`)
                        .style("left", (e.pageX + 10) + "px")
                        .style("top", (e.pageY - 20) + "px");
                })
                .on("mouseout", () => this.tooltip.style("opacity", 0));

            // C. End of Line Marker (Dot)
            svg.append("circle")
                .attr("cx", x(lastPoint.year))
                .attr("cy", y(lastPoint.value))
                .attr("r", 5)
                .attr("fill", color);

            // D. Direct Label (Right of the line)
            svg.append("text")
                .attr("x", x(lastPoint.year) + 10)
                .attr("y", y(lastPoint.value) + 4)
                .text(group.country)
                .attr("fill", color)
                .style("font-size", "12px")
                .style("font-weight", "bold");
        });
    }

    /**
     * Cleanup method to disconnect observers and prevent memory leaks.
     */
    destroy() {
        if (this.observer) {
            this.observer.disconnect();
        }
    }
}