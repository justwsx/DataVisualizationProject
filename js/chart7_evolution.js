/**
 * class EvolutionChart
 * --------------------------------------------------------------------------
 * Renders a Multi-Series Area/Line Chart to visualize the evolution of 
 * energy consumption over time for selected major countries.
 * * Visualization Logic:
 * - X-Axis: Time (Years).
 * - Y-Axis: Energy Consumption (Linear Scale).
 * - Visuals: Semi-transparent filled areas with solid stroke lines.
 * - Interaction: Tooltip on hover, dynamic current-year indicator.
 */
class EvolutionChart {
    
    /**
     * Initializes the chart instance.
     * @param {Array} data - The complete dataset.
     * @param {Array} majorCountries - List of country names to display.
     * @param {Object} countryColors - Map of country names to hex colors.
     */
    constructor(data, majorCountries, countryColors) {
        this.data = data;
        this.countries = majorCountries;
        this.countryColors = countryColors;
        this.containerId = 'chart-evolution'; // Target DOM ID
        this.currentYear = 2022; // Default starting year

        // Initialize Tooltip (Appended to body to avoid overflow issues)
        this.tooltip = d3.select("body").selectAll(".d3-tooltip")
            .data([0])
            .join("div")
            .attr("class", "d3-tooltip")
            .style("position", "absolute")
            .style("opacity", 0)
            .style("background", "rgba(255,255,255,0.95)")
            .style("border", "1px solid #e2e8f0")
            .style("padding", "8px 12px")
            .style("border-radius", "8px")
            .style("pointer-events", "none")
            .style("font-family", "Inter, sans-serif")
            .style("font-size", "12px")
            .style("box-shadow", "0 4px 6px -1px rgba(0,0,0,0.1)");

        // Setup Resize Observer for responsiveness
        const container = document.getElementById(this.containerId);
        if (container) {
            this.observer = new ResizeObserver(entries => {
                for (let entry of entries) {
                    if (entry.contentRect.width > 0) {
                        // Debounce redraw via requestAnimationFrame
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
     * Utility to convert Hex color to RGBA for transparent area fills.
     * @param {string} hex - The hex color code.
     * @param {number} alpha - Opacity (0 to 1).
     */
    hexToRgba(hex, alpha) {
        if (!hex) return `rgba(99, 102, 241, ${alpha})`; // Fallback color
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    /**
     * Public method to update the chart state (e.g., from a slider).
     * @param {number} currentYear - The year to highlight.
     */
    update(currentYear) {
        this.currentYear = currentYear;
        this.draw();
    }

    /**
     * Main drawing logic.
     * Clears the container and re-renders the SVG.
     */
    draw() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // 1. SETUP & DIMENSIONS
        const fixedHeight = 500;
        container.style.width = '100%';
        container.style.height = `${fixedHeight}px`;
        container.style.minHeight = `${fixedHeight}px`;
        container.style.position = 'relative';
        container.innerHTML = ''; // Clear previous SVG

        const rect = container.getBoundingClientRect();
        const width = rect.width > 0 ? rect.width : 800;
        const height = fixedHeight;

        const margin = { top: 40, right: 30, bottom: 80, left: 60 };
        const w = width - margin.left - margin.right;
        const h = height - margin.top - margin.bottom;

        // 2. SVG INITIALIZATION
        const svg = d3.select(container).append("svg")
            .attr("width", width)
            .attr("height", height)
            .style("display", "block")
            .style("font-family", "Inter, sans-serif")
            .append("g").attr('transform', `translate(${margin.left},${margin.top})`);

        // 3. DATA PREPARATION
        // Filter and structure data for the selected major countries
        const dataset = this.countries.map(country => {
            const values = this.data
                .filter(d => d.country === country)
                .sort((a, b) => a.year - b.year)
                .map(d => ({
                    year: d.year,
                    value: d.primary_energy_consumption,
                    country: country // Reference for tooltip
                }));
            return { country, values };
        }).filter(g => g.values.length > 0);

        // 4. SCALES
        // X-Axis: Time (1991 - 2022)
        const x = d3.scaleLinear()
            .domain([1991, 2022])
            .range([0, w]);

        // Y-Axis: Energy (Linear, maxed at global peak + padding)
        const globalMax = d3.max(dataset.flatMap(d => d.values.map(v => v.value))) || 100;
        const y = d3.scaleLinear()
            .domain([0, globalMax * 1.1])
            .range([h, 0]);

        // 5. LINE & AREA GENERATORS
        // 'curveMonotoneX' creates smooth curves (splines)
        const area = d3.area()
            .curve(d3.curveMonotoneX)
            .x(d => x(d.year))
            .y0(h)
            .y1(d => y(d.value));

        const line = d3.line()
            .curve(d3.curveMonotoneX)
            .x(d => x(d.year))
            .y(d => y(d.value));

        // 6. DRAW AXES
        // X-Axis
        svg.append("g").attr("transform", `translate(0,${h})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(10).tickSize(-h))
            .call(g => g.selectAll("line").attr("stroke", "#e2e8f0").attr("stroke-dasharray", "2,2"))
            .call(g => g.select(".domain").attr("stroke", "#cbd5e1"))
            .call(g => g.selectAll("text").attr("fill", "#64748b"));

        // Y-Axis
        svg.append("g")
            .call(d3.axisLeft(y).tickFormat(d3.format(",.0f")).tickSize(-w))
            .call(g => g.selectAll("line").attr("stroke", "#e2e8f0").attr("stroke-dasharray", "2,2"))
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll("text").attr("fill", "#64748b"));

        // Y-Axis Label
        svg.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -45)
            .attr("x", -h/2)
            .text("kWh per capita")
            .attr("fill", "#64748b")
            .attr("text-anchor", "middle")
            .style("font-size", "12px");

        // 7. RENDER SERIES (Area + Line for each country)
        dataset.forEach(group => {
            const color = this.countryColors[group.country] || '#6366f1';
            // Highlight US and China with thicker lines
            const isHighlighted = group.country === "United States" || group.country === "China";
            const strokeWidth = isHighlighted ? 3 : 1.5;

            // Draw Filled Area
            svg.append("path")
                .datum(group.values)
                .attr("fill", this.hexToRgba(color, 0.15)) // Low opacity fill
                .attr("d", area);

            // Draw Stroke Line
            svg.append("path")
                .datum(group.values)
                .attr("fill", "none")
                .attr("stroke", color)
                .attr("stroke-width", strokeWidth)
                .attr("d", line);

            // Draw Invisible "Hit Area" (Thicker line for easier hovering)
            svg.append("path")
                .datum(group.values)
                .attr("fill", "none")
                .attr("stroke", "transparent")
                .attr("stroke-width", 20)
                .attr("d", line)
                .on("mouseover", (e, d) => {
                    const mouseX = d3.pointer(e)[0];
                    const yearVal = Math.round(x.invert(mouseX));
                    
                    // Find closest data point to mouse X
                    const point = d.find(v => v.year === yearVal) || d[d.length-1];
                    
                    this.tooltip.style("opacity", 1)
                        .html(`
                            <div style="font-weight:bold; color:${color}">${group.country}</div>
                            <div>Year: ${point.year}</div>
                            <div>Energy: ${Math.round(point.value).toLocaleString()}</div>
                        `)
                        .style("left", (e.pageX + 10) + "px")
                        .style("top", (e.pageY - 20) + "px");
                })
                .on("mouseout", () => this.tooltip.style("opacity", 0));
        });

        // 8. CURRENT YEAR INDICATOR
        const xYear = x(this.currentYear);
        const indicatorGroup = svg.append("g");
        
        // Vertical dashed line
        indicatorGroup.append("line")
            .attr("x1", xYear).attr("x2", xYear)
            .attr("y1", 0).attr("y2", h)
            .attr("stroke", "#6366f1")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "4,4");

        // Label Box at top
        const boxWidth = 50;
        const boxHeight = 24;
        
        indicatorGroup.append("rect")
            .attr("x", xYear - boxWidth/2).attr("y", -10)
            .attr("width", boxWidth).attr("height", boxHeight)
            .attr("fill", "rgba(255,255,255,0.9)")
            .attr("stroke", "#e2e8f0")
            .attr("rx", 4);

        indicatorGroup.append("text")
            .attr("x", xYear).attr("y", 6)
            .text(this.currentYear)
            .attr("text-anchor", "middle")
            .attr("fill", "#6366f1")
            .style("font-size", "12px")
            .style("font-weight", "bold");

        // 9. LEGEND (Centered at bottom)
        const keys = this.countries;
        const itemW = 120; // Width of each legend item
        const rowSize = Math.floor(w / itemW); // Items per row
        const legendContainer = svg.append("g").attr("transform", `translate(0, ${h + 50})`);

        keys.forEach((key, i) => {
            const row = Math.floor(i / rowSize);
            const col = i % rowSize;
            
            // Calculate centering offset
            const itemsInRow = Math.min(keys.length - row * rowSize, rowSize);
            const rowWidth = itemsInRow * itemW;
            const xBase = (w - rowWidth) / 2;

            const g = legendContainer.append("g")
                .attr("transform", `translate(${xBase + col * itemW}, ${row * 20})`);

            // Legend Line color
            g.append("line")
                .attr("x1", 0).attr("x2", 20).attr("y1", 0).attr("y2", 0)
                .attr("stroke", this.countryColors[key] || '#999')
                .attr("stroke-width", 3);

            // Legend Text
            g.append("text")
                .attr("x", 25).attr("y", 4)
                .text(key)
                .style("font-family", "Inter, sans-serif")
                .style("font-size", "11px")
                .attr("fill", "#64748b");
        });
    }

    /**
     * Resizes the chart.
     */
    resize() { this.draw(); }
}