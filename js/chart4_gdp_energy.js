/**
 * class GDPEnergyChart
 * --------------------------------------------------------------------------
 * Renders a Bubble Chart (Scatter Plot) to visualize the correlation between 
 * Economic Output (GDP) and Energy Consumption.
 * * * Visualization Logic:
 * - X-Axis: GDP (Logarithmic Scale).
 * - Y-Axis: Primary Energy Consumption (Logarithmic Scale).
 * - Bubble Area: Population (Square Root Scale).
 * - Color: Geographic Region.
 */
class GDPEnergyChart {
    
    /**
     * Initializes the chart instance.
     * @param {Array} data - The complete parsed CSV dataset.
     */
    constructor(data) {
        this.data = data;
        this.container = "chart-gdp-energy"; // Target DOM element ID

        this.useGdpBillions = true; // Format GDP in Billions for readability
        this.transitionMs = 450;    // Animation duration for year transitions

        // Color mapping for geographic regions
        this.regionColors = {
            "Africa": "#dc2626",
            "Asia": "#0891b2",
            "Europe": "#7c3aed",
            "North America": "#ea580c",
            "South America": "#16a34a",
            "Oceania": "#eaa400",
            "Other": "#6b7280"
        };

        // Manual mapping of Countries to Regions (since dataset lacks this column)
        this.countryRegions = {
            "United States": "North America", "Canada": "North America", "Mexico": "North America",
            "Brazil": "South America", "Argentina": "South America", "Chile": "South America",
            "United Kingdom": "Europe", "Germany": "Europe", "France": "Europe",
            "Italy": "Europe", "Poland": "Europe", "Russia": "Asia",
            "Turkey": "Asia", "Spain": "Europe", "Netherlands": "Europe",
            "Belgium": "Europe", "Sweden": "Europe", "Norway": "Europe",
            "Switzerland": "Europe", "China": "Asia", "India": "Asia",
            "Japan": "Asia", "South Korea": "Asia", "Indonesia": "Asia",
            "Thailand": "Asia", "Saudi Arabia": "Asia", "Iran": "Asia",
            "Vietnam": "Asia", "Pakistan": "Asia", "Bangladesh": "Asia",
            "Australia": "Oceania", "South Africa": "Africa", "Egypt": "Africa",
            "Nigeria": "Africa", "Kenya": "Africa", "Morocco": "Africa"
        };

        // Order of regions in the Legend
        this.allRegionsOrder = [
            "Africa", "Asia", "Europe",
            "North America", "South America",
            "Oceania", "Other"
        ];

        this.margin = { left: 80, right: 30, top: 100, bottom: 190 };

        this._init();
        this._computeGlobalDomains();
    }

    /**
     * One-time setup: Creates SVG structure, groups, and static elements.
     */
    _init() {
        this.root = d3.select(`#${this.container}`);
        this.root.style("position", "relative");

        // 1. Tooltip Container (Hidden by default)
        this.tooltip = this.root
            .append("div")
            .style("position", "absolute")
            .style("pointer-events", "none")
            .style("opacity", 0)
            .style("background", "rgba(255,255,255,0.95)")
            .style("border", "1px solid rgba(226,232,240,0.9)")
            .style("border-radius", "10px")
            .style("padding", "10px 12px")
            .style("font-family", "Inter, system-ui, sans-serif")
            .style("font-size", "12px")
            .style("color", "#0f172a")
            .style("box-shadow", "0 6px 18px rgba(15,23,42,0.12)")
            .style("z-index", "10");

        // 2. Main SVG
        this.svg = this.root.append("svg")
            .attr("role", "img")
            .style("width", "100%")
            .style("height", "100%")
            .style("overflow", "visible")
            .style("background", "transparent");

        this.g = this.svg.append("g");

        // 3. Titles and Labels
        this.title = this.svg.append("text")
            .attr("text-anchor", "middle")
            .style("font-family", "Inter, system-ui, sans-serif")
            .style("font-size", "18px")
            .style("font-weight", "700")
            .style("fill", "#1e293b");

        // 4. Axis Groups
        this.xGridG = this.g.append("g").attr("class", "x-grid");
        this.yGridG = this.g.append("g").attr("class", "y-grid");
        this.xAxisG = this.g.append("g").attr("class", "x-axis");
        this.yAxisG = this.g.append("g").attr("class", "y-axis");

        this.xLabel = this.svg.append("text")
            .attr("text-anchor", "middle")
            .style("font-family", "Inter, system-ui, sans-serif")
            .style("font-size", "13px")
            .style("font-weight", "600")
            .style("fill", "#475569");

        this.yLabel = this.svg.append("text")
            .attr("text-anchor", "middle")
            .style("font-family", "Inter, system-ui, sans-serif")
            .style("font-size", "13px")
            .style("font-weight", "600")
            .style("fill", "#475569")
            .text("Primary Energy Consumption");

        // 5. Bubbles Layer
        this.bubblesG = this.g.append("g").attr("class", "bubbles");

        // 6. Legend Groups (Initialized here to avoid null references during render)
        this.legendG = this.svg.append("g").attr("class", "legend");
        this.legendBg = this.legendG.append("rect");
        this.legendBoxG = this.legendG.append("g").attr("class", "legend-box");

        // 7. Bubble Size Annotation
        this.annotationG = this.svg.append("g").attr("class", "annotation");
        this.annotationBg = this.annotationG.append("rect");
        this.annotationText = this.annotationG.append("text")
            .style("font-family", "Inter, system-ui, sans-serif")
            .style("font-size", "11px")
            .style("fill", "#64748b")
            .text("Bubble size = Population");

        // 8. Responsive Observer
        this.resizeObserver = new ResizeObserver(() => this.resize());
        const node = document.getElementById(this.container);
        if (node) this.resizeObserver.observe(node);
    }

    getRegion(country) {
        return this.countryRegions[country] || "Other";
    }

    /**
     * Calculates global min/max domains across ALL years.
     * This ensures the axes don't "jump" when the animation plays.
     * Uses Log Scale logic (must be > 0).
     */
    _computeGlobalDomains() {
        const xVal = d => this.useGdpBillions ? (d.gdp / 1e9) : d.gdp;
        const yVal = d => d.primary_energy_consumption;

        const xs = this.data.map(xVal).filter(v => v > 0 && Number.isFinite(v));
        const ys = this.data.map(yVal).filter(v => v > 0 && Number.isFinite(v));
        const ps = this.data.map(d => d.population).filter(v => v > 0 && Number.isFinite(v));

        // Helper to pad log domains to nearest power of 10 for clean axis starts
        const padLogDomain = ([mn, mx]) => {
            const a = Math.pow(10, Math.floor(Math.log10(mn)));
            const b = Math.pow(10, Math.ceil(Math.log10(mx)));
            return [a, b];
        };

        this.xDomain = xs.length ? padLogDomain(d3.extent(xs)) : [1, 10];
        this.yDomain = ys.length ? padLogDomain(d3.extent(ys)) : [1, 10];
        this.popDomain = ps.length ? d3.extent(ps) : [1e6, 1e6];
    }

    /**
     * Updates the chart for a specific year.
     * Filters data and calls the render function.
     */
    update(selectedYear, opts = {}) {
        this.currentYear = selectedYear;
        // Allow overriding transition speed (0 for resize, 450 for animation)
        this.transitionMs = Number.isFinite(opts.duration) ? opts.duration : this.transitionMs;

        let yearData = this.data.filter(d => d.year === selectedYear);

        // Fallback: If no data for year, use most recent
        if (yearData.length === 0) {
            const availableYears = [...new Set(this.data.map(d => d.year))].sort((a, b) => b - a);
            if (availableYears.length) yearData = this.data.filter(d => d.year === availableYears[0]);
        }

        // Prepare data with Regions
        yearData = yearData
            .filter(d => d.primary_energy_consumption > 0 && d.gdp > 0)
            .map(d => ({ ...d, region: this.getRegion(d.country) }));

        this._render(yearData);
    }

    /**
     * Core rendering logic.
     * Handles Scales, Axes, Bubble Drawing, and Legend Positioning.
     */
    _render(yearData) {
        const containerNode = document.getElementById(this.container);
        if (!containerNode) return;

        // 1. Calculate Dimensions
        const width = containerNode.clientWidth || 900;
        const height = containerNode.clientHeight || 550;

        const innerW = width - this.margin.left - this.margin.right;
        const innerH = height - this.margin.top - this.margin.bottom;

        // Update ViewBox
        this.svg.attr("viewBox", `0 0 ${width} ${height}`);
        this.g.attr("transform", `translate(${this.margin.left},${this.margin.top})`);

        // Update Text Positions
        this.title.attr("x", width / 2).attr("y", 30).text("");
        this.xLabel
            .attr("x", this.margin.left + innerW / 2)
            .attr("y", this.margin.top + innerH + 50)
            .text(this.useGdpBillions ? "GDP (Billions USD)" : "GDP");
        this.yLabel.attr("transform", `translate(20,${this.margin.top + innerH / 2}) rotate(-90)`);

        const xVal = d => this.useGdpBillions ? (d.gdp / 1e9) : d.gdp;
        const yVal = d => d.primary_energy_consumption;

        // Interrupt active transitions to prevent UI glitches
        this.svg.interrupt();
        this.g.interrupt();
        this.bubblesG.selectAll("circle").interrupt();
        this.xAxisG.interrupt();
        this.yAxisG.interrupt();
        this.xGridG.interrupt();
        this.yGridG.interrupt();

        if (!yearData.length) {
            this.bubblesG.selectAll("circle").remove();
            return;
        }

        // 2. Define Scales
        // Log scales for X/Y, Sqrt scale for Radius (Bubble size)
        this.xScale = d3.scaleLog().domain(this.xDomain).range([0, innerW]).clamp(true);
        this.yScale = d3.scaleLog().domain(this.yDomain).range([innerH, 0]).clamp(true);
        const rScale = d3.scaleSqrt().domain(this.popDomain).range([6, 45]);
        const r = d => rScale((d.population && d.population > 0) ? d.population : this.popDomain[0]);

        const t = this.svg.transition().duration(this.transitionMs);

        // 3. Draw Grids
        const xGrid = d3.axisBottom(this.xScale).ticks(6).tickSize(-innerH).tickFormat("");
        const yGrid = d3.axisLeft(this.yScale).ticks(6).tickSize(-innerW).tickFormat("");

        this.xGridG.attr("transform", `translate(0,${innerH})`).transition(t).call(xGrid);
        this.yGridG.transition(t).call(yGrid);

        // Style Grids
        this.xGridG.selectAll("line").attr("stroke", "rgba(226, 232, 240, 0.4)");
        this.yGridG.selectAll("line").attr("stroke", "rgba(226, 232, 240, 0.4)");
        this.xGridG.selectAll("path").attr("stroke", "none");
        this.yGridG.selectAll("path").attr("stroke", "none");

        // 4. Draw Axes
        const xAxis = d3.axisBottom(this.xScale).ticks(6, "~s");
        const yAxis = d3.axisLeft(this.yScale).ticks(6, "~s");

        this.xAxisG.attr("transform", `translate(0,${innerH})`).transition(t).call(xAxis);
        this.yAxisG.transition(t).call(yAxis);

        this.g.selectAll(".x-axis text, .y-axis text")
            .style("font-family", "Inter, system-ui, sans-serif")
            .style("font-size", "11px")
            .style("fill", "#64748b");

        this.g.selectAll(".x-axis path, .y-axis path")
            .attr("stroke", "rgba(226, 232, 240, 0.9)");

        this.g.selectAll(".x-axis line, .y-axis line")
            .attr("stroke", "rgba(226, 232, 240, 0.9)");

        // 5. DRAW BUBBLES (D3 Join Pattern)
        const circles = this.bubblesG
            .selectAll("circle")
            .data(yearData, d => d.country);

        circles.join(
            // ENTER: Start small
            enter => enter.append("circle")
                .attr("cx", d => this.xScale(xVal(d)))
                .attr("cy", d => this.yScale(yVal(d)))
                .attr("r", 0)
                .attr("fill", d => this.regionColors[d.region] || "#6b7280")
                .attr("fill-opacity", 0.85)
                .attr("stroke", "white")
                .attr("stroke-width", 1.5)
                .on("mouseenter", (event, d) => this._showTooltip(event, d, xVal(d), yVal(d)))
                .on("mousemove", (event) => this._moveTooltip(event))
                .on("mouseleave", () => this._hideTooltip())
                .transition(t)
                .attr("r", d => r(d)),
            // UPDATE: Move and resize
            update => update
                .on("mouseenter", (event, d) => this._showTooltip(event, d, xVal(d), yVal(d)))
                .on("mousemove", (event) => this._moveTooltip(event))
                .on("mouseleave", () => this._hideTooltip())
                .transition(t)
                .attr("cx", d => this.xScale(xVal(d)))
                .attr("cy", d => this.yScale(yVal(d)))
                .attr("r", d => r(d))
                .attr("fill", d => this.regionColors[d.region] || "#6b7280"),
            // EXIT: Shrink and remove
            exit => exit.transition(t).attr("r", 0).remove()
        );

        // 6. Annotation Positioning
        const annX = this.margin.left + 10;
        const annY = this.margin.top + 10;
        const padX = 10, padY = 6;

        this.annotationText
            .attr("x", annX + padX)
            .attr("y", annY + padY + 10);

        const annBBox = this.annotationText.node().getBBox();
        this.annotationBg
            .attr("x", annBBox.x - padX)
            .attr("y", annBBox.y - padY)
            .attr("width", annBBox.width + padX * 2)
            .attr("height", annBBox.height + padY * 2)
            .attr("rx", 8).attr("ry", 8)
            .attr("fill", "rgba(255,255,255,0.9)")
            .attr("stroke", "rgba(226, 232, 240, 0.8)");

        this._renderLegend(width);
    }

    /**
     * Renders a responsive legend that wraps items to new lines if needed.
     */
    _renderLegend(width) {
        const legendY = 60;
        const legendWrapW = width - 40;
        const rowH = 18;
        const gap = 16;

        const regions = this.allRegionsOrder;

        const items = this.legendBoxG.selectAll("g.item")
            .data(regions, d => d);

        const itemsEnter = items.enter().append("g").attr("class", "item");

        itemsEnter.append("rect")
            .attr("x", 0).attr("y", -10)
            .attr("width", 10).attr("height", 10)
            .attr("rx", 3);

        itemsEnter.append("text")
            .attr("x", 14).attr("y", -2)
            .style("font-family", "Inter, system-ui, sans-serif")
            .style("font-size", "12px")
            .style("fill", "#0f172a");

        const itemsAll = itemsEnter.merge(items);

        itemsAll.select("rect")
            .attr("fill", d => this.regionColors[d] || "#6b7280");

        itemsAll.select("text")
            .text(d => d);

        // Manual Layout for wrapping
        let xCursor = 0;
        let yCursor = 0;

        itemsAll.each((region, i, nodes) => {
            const g = d3.select(nodes[i]);
            const t = g.select("text").node();
            const w = (t ? t.getBBox().width : 0) + 24;

            if (xCursor + w > legendWrapW) {
                xCursor = 0;
                yCursor += rowH;
            }

            g.attr("transform", `translate(${xCursor},${yCursor})`);
            xCursor += w + gap;
        });

        items.exit().remove();

        // Center the Legend Box
        const bbox = this.legendBoxG.node().getBBox();
        const boxX = (width / 2) - (bbox.width / 2);
        const boxY = legendY;

        this.legendBoxG.attr("transform", `translate(${boxX - bbox.x},${boxY - bbox.y})`);

        // Draw background for legend
        const bbox2 = this.legendBoxG.node().getBBox();
        this.legendBg
            .attr("x", bbox2.x - 14)
            .attr("y", bbox2.y - 10)
            .attr("width", bbox2.width + 28)
            .attr("height", bbox2.height + 20)
            .attr("rx", 12).attr("ry", 12)
            .attr("fill", "rgba(255,255,255,0.95)")
            .attr("stroke", "rgba(226, 232, 240, 0.8)");
    }

    _showTooltip(event, d, gx, ey) {
        const gdpText = this.useGdpBillions ? `$${d3.format(",.1f")(gx)}B` : `$${d3.format(",.0f")(gx)}`;
        const energyText = `${d3.format(",.0f")(ey)} kWh per capita`;
        const popText = d3.format(",.0f")(d.population || 0);

        this.tooltip.style("opacity", 1)
            .html(
                `<div style="font-weight:700;margin-bottom:6px;">${d.country}</div>` +
                `<div>GDP: <b>${gdpText}</b></div>` +
                `<div>Energy: <b>${energyText}</b></div>` +
                `<div>Population: <b>${popText}</b></div>`
            );

        this._moveTooltip(event);
    }

    _moveTooltip(event) {
        const [mx, my] = d3.pointer(event, this.root.node());
        this.tooltip.style("left", `${mx + 14}px`).style("top", `${my + 14}px`);
    }

    _hideTooltip() {
        this.tooltip.style("opacity", 0);
    }

    resize() {
        if (this.currentYear != null) this.update(this.currentYear, { duration: 0 });
    }

    destroy() {
        if (this.resizeObserver) this.resizeObserver.disconnect();
        this.root.selectAll("*").remove();
    }
}