/**
 * class FossilPrice
 * --------------------------------------------------------------------------
 * Renders a Multi-Line Chart tracking the global prices of Oil, Gas, and Coal.
 * * Visualization Logic:
 * - X-Axis: Time (Years 1990-2022).
 * - Y-Axis: Price in USD (Linear Scale).
 * - UX Design: Uses "Direct Labeling" (labels at the end of lines) instead of a legend.
 * - Interaction: Shared tooltip using d3.bisector for nearest-point lookup.
 */
class FossilPrice {
    
    /**
     * Initializes the chart instance.
     * @param {Array} data - The complete dataset.
     * @param {string} containerId - The ID of the DOM element to render into.
     */
    constructor(data, containerId) {
        this.data = data;
        this.containerId = containerId; 
        this.currentYear = 2020;
        
        // Margins: Increased 'right' margin (100px) to accommodate Direct Labels
        this.margin = { top: 40, right: 100, bottom: 50, left: 60 };
        this.width = 0;
        this.height = 0;

        // Color mapping for fossil fuels
        this.colors = {
            oil: '#7c2d12',    // Brown/Red
            gas: '#facc15',    // Yellow/Gold
            coal: '#000000'    // Black
        };

        this.labels = {
            oil: "Oil",
            gas: "Natural Gas",
            coal: "Coal"
        };

        this.init();
        
        // Native window resize listener
        window.addEventListener('resize', () => this.resize());
    }

    /**
     * Sets up the static SVG structure and groups.
     */
    init() {
        const container = d3.select(`#${this.containerId}`);
        if (container.empty()) return;

        this.svg = container.append("svg")
            .style("width", "100%")
            .style("height", "100%")
            .style("overflow", "visible");

        this.g = this.svg.append("g")
            .attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        // Layer Groups (Order determines Z-index)
        this.gridGroup = this.g.append("g").attr("class", "grid-group");
        this.linesGroup = this.g.append("g").attr("class", "lines-group");
        this.markersGroup = this.g.append("g").attr("class", "markers-group");
        this.labelsGroup = this.g.append("g").attr("class", "labels-group"); // Specifically for end-of-line text
        this.axesGroup = this.g.append("g").attr("class", "axes-group");
        this.overlayGroup = this.g.append("g").attr("class", "overlay-group");

        // Tooltip Container
        this.tooltip = container.append("div")
            .attr("class", "fossil-tooltip")
            .style("opacity", 0);
            
        // Vertical indicator line for hover
        this.hoverLine = this.overlayGroup.append("line")
            .attr("class", "hover-line")
            .attr("stroke", "#64748b")
            .attr("stroke-width", 1)
            .attr("stroke-dasharray", "4 4")
            .style("opacity", 0);

        this.update();
    }

    /**
     * Updates the highlighted year marker.
     */
    setYear(year) {
        this.currentYear = year;
        this.update();
    }

    /**
     * Main rendering loop.
     */
    update() {
        const container = d3.select(`#${this.containerId}`);
        if (container.empty()) return;

        // 1. DIMENSIONS
        const rect = container.node().getBoundingClientRect();
        this.width = rect.width - this.margin.left - this.margin.right;
        this.height = 400 - this.margin.top - this.margin.bottom;

        this.svg.attr("height", 400);

        // 2. DATA PROCESSING
        // Filter range 1990-2022 and map structure
        const parsedData = this.data
            .filter(d => d.year >= 1990 && d.year <= 2022)
            .map(d => ({
                year: d.year,
                oil: d.oil_price_global ?? null,
                gas: d.gas_price_global ?? null,
                coal: d.coal_price_global ?? null
            }))
            .sort((a, b) => a.year - b.year);

        // 3. SCALES
        const x = d3.scaleLinear()
            .domain(d3.extent(parsedData, d => d.year))
            .range([0, this.width]);

        // Find max value across all three metrics for Y domain
        const maxPrice = d3.max(parsedData, d => Math.max(d.oil || 0, d.gas || 0, d.coal || 0)) || 100;
        const y = d3.scaleLinear()
            .domain([0, maxPrice * 1.1]) 
            .range([this.height, 0]);

        // 4. DRAW AXES
        this.axesGroup.selectAll("*").remove();
        
        // X-Axis
        this.axesGroup.append("g")
            .attr("transform", `translate(0,${this.height})`)
            .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format("d")))
            .attr("font-family", "Inter, sans-serif")
            .attr("font-size", "11px")
            .attr("color", "#64748b")
            .select(".domain").attr("stroke", "#e2e8f0");

        // Y-Axis
        this.axesGroup.append("g")
            .call(d3.axisLeft(y).ticks(5))
            .attr("font-family", "Inter, sans-serif")
            .attr("font-size", "11px")
            .attr("color", "#64748b")
            .select(".domain").remove();

        // Y-Axis Label
        this.axesGroup.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", -45)
            .attr("x", -this.height / 2)
            .attr("text-anchor", "middle")
            .style("fill", "#64748b")
            .style("font-size", "12px")
            .text("Price (USD)");

        // 5. DRAW GRID
        this.gridGroup.selectAll("*").remove();
        this.gridGroup.append("g")
            .call(d3.axisLeft(y).tickSize(-this.width).tickFormat(""))
            .attr("color", "rgba(226,232,240,0.6)")
            .select(".domain").remove();

        // 6. DRAW LINES & DIRECT LABELS
        const createLine = (key) => d3.line()
            .defined(d => d[key] !== null) // Handle missing data gaps
            .x(d => x(d.year))
            .y(d => y(d[key]));

        this.linesGroup.selectAll("*").remove();
        this.labelsGroup.selectAll("*").remove(); // Clear old labels
        
        ['oil', 'gas', 'coal'].forEach(key => {
            // A. Draw Line Path
            this.linesGroup.append("path")
                .datum(parsedData)
                .attr("fill", "none")
                .attr("stroke", this.colors[key])
                .attr("stroke-width", 3)
                .attr("d", createLine(key));

            // B. Direct Labeling Logic
            // Find the last valid data point for this series
            const validData = parsedData.filter(d => d[key] !== null);
            const lastPoint = validData[validData.length - 1];

            if (lastPoint) {
                this.labelsGroup.append("text")
                    .attr("x", x(lastPoint.year) + 8) // Offset to the right (into the margin)
                    .attr("y", y(lastPoint[key]))     // Align Y with the line end
                    .text(this.labels[key])           
                    .attr("fill", this.colors[key])   
                    .attr("alignment-baseline", "middle")
                    .style("font-family", "Inter, sans-serif")
                    .style("font-size", "12px")
                    .style("font-weight", "bold");
            }
        });

        // 7. MARKERS (Dots)
        this.markersGroup.selectAll("*").remove();
        ['oil', 'gas', 'coal'].forEach(key => {
            this.markersGroup.selectAll(`.dot-${key}`)
                .data(parsedData.filter(d => d[key] !== null))
                .join("circle")
                .attr("class", `dot-${key}`)
                .attr("cx", d => x(d.year))
                .attr("cy", d => y(d[key]))
                // Larger dot for current year
                .attr("r", d => d.year === this.currentYear ? 6 : 3)
                .attr("fill", this.colors[key])
                .attr("stroke", "white")
                .attr("stroke-width", 1);
        });

        // Current Year Vertical Line Indicator
        this.linesGroup.append("line")
            .attr("x1", x(this.currentYear))
            .attr("x2", x(this.currentYear))
            .attr("y1", 0)
            .attr("y2", this.height)
            .attr("stroke", "#64748b")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "4 4");

        // NOTE: Legend is removed intentionally in favor of Direct Labeling

        // 8. INTERACTION (Overlay & Bisector)
        const bisect = d3.bisector(d => d.year).center;
        
        this.overlayGroup.selectAll(".overlay-rect").remove();
        this.overlayGroup.append("rect")
            .attr("class", "overlay-rect")
            .attr("width", this.width)
            .attr("height", this.height)
            .style("fill", "none")
            .style("pointer-events", "all")
            .on("mouseover", () => {
                this.tooltip.style("opacity", 1);
                this.hoverLine.style("opacity", 1);
            })
            .on("mouseout", () => {
                this.tooltip.style("opacity", 0);
                this.hoverLine.style("opacity", 0);
            })
            .on("mousemove", (event) => {
                const [mouseX, mouseY] = d3.pointer(event, this.g.node());
                
                // Find nearest data point to mouse X
                const x0 = x.invert(mouseX);
                const i = bisect(parsedData, x0, 1);
                const d0 = parsedData[i - 1];
                const d1 = parsedData[i];
                
                let d = d0;
                if (d0 && d1) {
                    d = (x0 - d0.year > d1.year - x0) ? d1 : d0;
                } else if (!d0) {
                    d = d1;
                }

                if (!d) return;

                // Move hover line
                this.hoverLine
                    .attr("x1", x(d.year))
                    .attr("x2", x(d.year))
                    .attr("y1", 0)
                    .attr("y2", this.height);

                // Build Tooltip HTML
                let htmlContent = `<div style="font-weight:bold; margin-bottom:5px; border-bottom:1px solid #eee; padding-bottom:5px;">Year: ${d.year}</div>`;
                
                const items = [
                    { label: 'Oil', val: d.oil, color: this.colors.oil },
                    { label: 'Gas', val: d.gas, color: this.colors.gas },
                    { label: 'Coal', val: d.coal, color: this.colors.coal }
                ];

                items.forEach(item => {
                    if (item.val !== null) {
                        htmlContent += `
                        <div style="display:flex; justify-content:space-between; align-items:center; margin-top:3px;">
                            <span style="color:${item.color}; font-weight:600;">● ${item.label}:</span>
                            <span style="font-weight:bold;">$${d3.format(".2f")(item.val)}</span>
                        </div>`;
                    }
                });

                // Calculate Tooltip position (prevent overflow on right edge)
                let tooltipX = x(d.year) + this.margin.left + 15;
                let tooltipY = mouseY + this.margin.top;

                if (tooltipX > this.width + this.margin.left - 160) {
                    tooltipX = x(d.year) + this.margin.left - 175;
                }

                this.tooltip
                    .html(htmlContent)
                    .style("left", `${tooltipX}px`)
                    .style("top", `${tooltipY}px`);
            });
    }

    /**
     * Resizes the chart.
     */
    resize() {
        this.update();
    }
}