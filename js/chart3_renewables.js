/**
 * class RenewablesChart
 * --------------------------------------------------------------------------
 * Renders a comparative Line Chart focusing on Renewable Energy growth.
 * * Narrative Focus:
 * - Highlights specific countries (Canada, Australia, Brazil) in color.
 * - Keeps other countries in the background (grey, low opacity) for context.
 * - Features a shared tooltip for comparing values at a specific year.
 */
class RenewablesChart {
    
    /**
     * Initializes the chart instance.
     * @param {Array} data - The full dataset.
     * @param {Array} majorCountries - List of all available countries.
     * @param {Object} countryColors - Map of country names to hex colors.
     */
    constructor(data, majorCountries, countryColors) {
        this.data = data;
        this.countries = majorCountries;
        this.countryColors = countryColors;
        this.container = 'chart-renewables'; // Target DOM element ID
        
        // Margins optimized for axis labels and title space
        this.margin = { left: 70, right: 50, top: 80, bottom: 60 };
        
        // Define the narrative focus
        this.identifyCompetitors();
    }

    /**
     * Sets the specific countries to highlight in the narrative.
     * Canada is the main target; Australia and Brazil are key benchmarks.
     */
    identifyCompetitors() {
        const mainTarget = "Canada";
        const competitor1 = "Australia";
        const competitor2 = "Brazil"; 
        this.highlighted = [mainTarget, competitor1, competitor2];
    }

    /**
     * Main render function.
     * @param {number} currentYear - Used to draw a vertical indicator line (if applicable).
     */
    update(currentYear) {
        // 1. CLEAR PREVIOUS SVG & TOOLTIPS
        const container = d3.select(`#${this.container}`);
        container.selectAll('*').remove();
        d3.select('.tooltip-renewables').remove();

        const containerNode = document.getElementById(this.container);
        if (!containerNode) return;

        // 2. CALCULATE DIMENSIONS (Responsive)
        const width = containerNode.clientWidth || 800;
        const height = containerNode.clientHeight || 500;

        const chartWidth = width - this.margin.left - this.margin.right;
        const chartHeight = height - this.margin.top - this.margin.bottom;

        // 3. CREATE SVG STRUCTURE
        const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height);

        const chartGroup = svg.append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

        // 4. DEFINE SCALES
        // Fixed time range (1991-2022) for consistent historical comparison
        const xScale = d3.scaleLinear()
            .domain([1991, 2022])
            .range([0, chartWidth]);

        // Calculate Max Y based on visible data
        const allValues = this.countries.flatMap(country => 
            this.data.filter(d => d.country === country && d.year >= 1991 && d.year <= 2022)
                .map(d => d.renewables_energy_per_capita || 0)
        );
        const maxY = d3.max(allValues) || 0;

        const yScale = d3.scaleLinear()
            .domain([0, maxY * 1.1]) // Add 10% padding on top
            .range([chartHeight, 0])
            .nice();

        // 5. DRAW GRID LINES
        // Horizontal Grid
        chartGroup.append('g')
            .selectAll('line')
            .data(yScale.ticks(6))
            .join('line')
            .attr('x1', 0)
            .attr('x2', chartWidth)
            .attr('y1', d => yScale(d))
            .attr('y2', d => yScale(d))
            .attr('stroke', 'rgba(226,232,240,0.7)');

        // Vertical Grid
        chartGroup.append('g')
            .selectAll('line')
            .data(xScale.ticks(8))
            .join('line')
            .attr('x1', d => xScale(d))
            .attr('x2', d => xScale(d))
            .attr('y1', 0)
            .attr('y2', chartHeight)
            .attr('stroke', 'rgba(226,232,240,0.6)');

        // 6. DEFINE LINE GENERATOR
        const lineGenerator = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScale(d.renewables_energy_per_capita || 0))
            .curve(d3.curveMonotoneX); // Smooth interpolation

        // 7. SEPARATE DATA GROUPS
        // Context countries (Grey) vs Highlighted countries (Colored)
        const backgroundCountries = this.countries.filter(c => !this.highlighted.includes(c));
        const highlightedCountries = this.countries.filter(c => this.highlighted.includes(c));

        /**
         * Helper to draw a batch of lines
         * @param {Array} countryList - List of countries to draw
         * @param {boolean} isHighlight - Whether to apply bold styling
         */
        const drawLine = (countryList, isHighlight) => {
            countryList.forEach(country => {
                const countryData = this.data
                    .filter(d => d.country === country && d.year >= 1991 && d.year <= 2022)
                    .sort((a, b) => a.year - b.year);

                if (!countryData.length) return;

                const color = this.countryColors[country] || '#64748b';
                const isMainTarget = country === "Canada";

                // Draw Path
                chartGroup.append('path')
                    .datum(countryData)
                    .attr('d', lineGenerator)
                    .attr('fill', 'none')
                    .attr('stroke', isHighlight ? color : '#cbd5e1') // Color vs Grey
                    // Thickness logic: Canada (4.5) > Highlighted (3.5) > Background (1.5)
                    .attr('stroke-width', isHighlight ? (isMainTarget ? 4.5 : 3.5) : 1.5)
                    .style('opacity', isHighlight ? 1 : 0.4)
                    .attr('stroke-linecap', 'round');

                // Add Labels directly on the line (at year 2009 for visibility)
                if (isHighlight) {
                    const labelData = countryData.find(d => d.year === 2009);
                    if (labelData) {
                        chartGroup.append('text')
                            .attr('x', xScale(2009))
                            .attr('y', yScale(labelData.renewables_energy_per_capita) - 25)
                            .attr('text-anchor', 'middle')
                            .text(country)
                            .style('font-family', 'Inter, sans-serif')
                            .style('font-size', '12px')
                            .style('font-weight', 'bold')
                            .style('fill', color);
                    }
                }
            });
        };

        // Render Background first (so they are behind), then Highlights
        drawLine(backgroundCountries, false);
        drawLine(highlightedCountries, true);

        // 8. DRAW AXES
        // X-Axis
        chartGroup.append('g')
            .attr('transform', `translate(0,${chartHeight})`)
            .call(d3.axisBottom(xScale).ticks(8).tickFormat(d3.format('d')))
            .call(g => g.selectAll('text')
                .style('font-family', 'Inter')
                .style('font-size', '11px')
                .style('fill', '#64748b'))
            .call(g => g.select('.domain').attr('stroke', '#cbd5e1'));

        // Y-Axis
        chartGroup.append('g')
            .call(
                d3.axisLeft(yScale)
                    .ticks(6)
                    .tickFormat(d3.format("~s")) 
            )
            .call(g => g.select('.domain').attr('stroke', 'transparent'))
            .call(g => g.selectAll('.tick line').remove())
            .call(g => g.selectAll('text')
                .attr('x', -10)
                .style('font-family', 'Inter')
                .style('font-size', '11px')
                .style('fill', '#64748b'));

        // 9. TITLES & LABELS
        // (Main title left empty intentionally, handled by HTML)
        svg.append('text')
            .attr('x', this.margin.left)
            .attr('y', 40)
            .text('') 
            .style('font-family', 'Inter, sans-serif')
            .style('font-size', '18px')
            .style('font-weight', '700')
            .style('fill', '#0f172a');

        // Y-Axis Label (Rotated)
        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -(this.margin.top + chartHeight / 2))
            .attr('y', 20)
            .text('Renewable Energy (kWh per capita)')
            .style('text-anchor', 'middle')
            .style('font-family', 'Inter')
            .style('font-size', '12px')
            .style('fill', '#94a3b8');

        // 10. CURRENT YEAR INDICATOR
        // Draws a dashed green line if the selected year is within range
        if (currentYear >= 1991 && currentYear <= 2022) {
             chartGroup.append('line')
                .attr('x1', xScale(currentYear))
                .attr('x2', xScale(currentYear))
                .attr('y1', 0)
                .attr('y2', chartHeight)
                .attr('stroke', '#22c55e')
                .attr('stroke-width', 1.5)
                .attr('stroke-dasharray', '4 4');
        }

        // 11. INITIALIZE INTERACTIVITY
        this.addTooltip(svg, chartGroup, xScale, width, height, chartWidth, chartHeight);
    }

    /**
     * Adds an interactive tooltip that follows the mouse X-position.
     * Shows values for all highlighted countries simultaneously.
     */
    addTooltip(svg, chartGroup, xScale, width, height, chartWidth, chartHeight) {
        // Create tooltip container (hidden by default)
        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip-renewables')
            .style('position', 'absolute')
            .style('background', 'rgba(255, 255, 255, 0.98)')
            .style('border', '1px solid #e2e8f0')
            .style('border-radius', '6px')
            .style('padding', '10px')
            .style('font-family', 'Inter, sans-serif')
            .style('font-size', '12px')
            .style('color', '#1e293b')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('z-index', 1000)
            .style('box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1)');

        // Vertical hover line
        const hoverLine = chartGroup.append('line')
            .attr('stroke', '#94a3b8')
            .attr('stroke-width', 1)
            .attr('stroke-dasharray', '3 3')
            .style('opacity', 0)
            .attr('y1', 0)
            .attr('y2', chartHeight);

        // Transparent overlay to capture mouse events over the entire chart area
        chartGroup.append('rect')
            .attr('width', chartWidth)
            .attr('height', chartHeight)
            .attr('fill', 'transparent')
            .on('mousemove', (event) => {
                const [mouseX] = d3.pointer(event);
                // Invert scale to get the year from X coordinate
                const year = Math.round(xScale.invert(mouseX));

                if (year < 1991 || year > 2022) return;

                // Move vertical line
                hoverLine
                    .attr('x1', xScale(year))
                    .attr('x2', xScale(year))
                    .style('opacity', 1);

                // Build Tooltip HTML
                let htmlContent = `<div style="font-weight:bold; margin-bottom:5px; color:#64748b">${year}</div>`;
                
                // Iterate through highlighted countries to show their values
                this.highlighted.forEach(country => {
                    const countryData = this.data.find(d => d.country === country && d.year === year);
                    if (countryData) {
                        const val = d3.format(",.0f")(countryData.renewables_energy_per_capita);
                        const color = this.countryColors[country];
                        htmlContent += `
                            <div style="display:flex; align-items:center; gap:8px; margin-bottom:3px;">
                                <span style="width:8px; height:8px; background:${color}; border-radius:50%"></span>
                                <span style="font-weight:600">${country}:</span>
                                <span style="margin-left:auto">${val}</span>
                            </div>`;
                    }
                });

                // Position and show tooltip
                tooltip
                    .html(htmlContent)
                    .style('opacity', 1)
                    .style('left', (event.pageX + 15) + 'px')
                    .style('top', (event.pageY - 20) + 'px');
            })
            .on('mouseout', () => {
                hoverLine.style('opacity', 0);
                tooltip.style('opacity', 0);
            });
    }

    /**
     * Resizes the chart (redraws with 2022 as default year context).
     */
    resize() {
        this.update(2022);
    }
}