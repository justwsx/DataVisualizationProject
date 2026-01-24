/**
 * class ConsumptionChart
 * --------------------------------------------------------------------------
 * Manages the "Primary Energy Consumption per Capita" chart using D3.js.
 * Features:
 * - Line and Area visualization modes.
 * - Dynamic highlighting of specific countries (China, USA, Selected).
 * - Responsive resizing.
 */
class ConsumptionChart {
    
    /**
     * Initializes the chart instance.
     * @param {Array} data - The full dataset (CSV parsed).
     * @param {Array} majorCountries - List of countries to include in the visualization.
     * @param {Object} countryColors - Map of country names to hex colors.
     */
    constructor(data, majorCountries, countryColors) {
        this.data = data;
        this.countries = majorCountries;
        this.countryColors = countryColors;
        this.container = 'chart-consumption'; // ID of the HTML container
        this.viewMode = 'lines'; // Default view: 'lines' or 'area'
        this.selectedCountry = null; // Stores the user-selected country for highlighting
        
        // Define margins for axes and labels
        this.margin = { left: 90, right: 160, top: 110, bottom: 70 };
    }

    /**
     * Toggles between Line and Area chart modes.
     * @param {string} mode - 'lines' or 'area'
     */
    setViewMode(mode) {
        this.viewMode = mode;
        this.update(); // Re-render the chart
    }

    /**
     * Updates the currently highlighted country from external interactions (e.g., Sidebar).
     * @param {string} country - The country name
     */
    setSelectedCountry(country) {
        this.selectedCountry = country;
        this.update(); // Re-render to update opacity/styles
    }

    /**
     * Main rendering method.
     * Clears the container and redraws the SVG based on current state.
     */
    update(currentYear) {
        // 1. SELECT CONTAINER & CLEAR PREVIOUS SVG
        const container = d3.select(`#${this.container}`);
        container.selectAll('*').remove();

        const containerNode = document.getElementById(this.container);
        if (!containerNode) return;

        // 2. CALCULATE DIMENSIONS
        // Uses clientWidth/Height for responsiveness
        const width = containerNode.clientWidth || 800;
        const height = containerNode.clientHeight || 500;

        const chartWidth = width - this.margin.left - this.margin.right;
        const chartHeight = height - this.margin.top - this.margin.bottom;

        // 3. CREATE SVG STRUCTURE
        const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height);

        // Group for the chart content (offset by margins)
        const chartGroup = svg.append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

        // 4. DEFINE SCALES
        const minYear = d3.min(this.data, d => d.year);
        const maxYear = d3.max(this.data, d => d.year);

        // X-Axis Scale (Time)
        const xScale = d3.scaleLinear()
            .domain([minYear, maxYear])
            .range([0, chartWidth]);

        // Y-Axis Scale (Consumption)
        // Extract all values to determine the max Y value
        const allValues = this.countries.flatMap(country =>
            this.data.filter(d => d.country === country)
                .map(d => d.primary_energy_consumption)
        );

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(allValues) * 1.05]) // Add 5% padding at top
            .range([chartHeight, 0])
            .nice(8); // Rounds the domain to nice values

        // 5. DRAW GRID LINES
        // Horizontal Grid
        chartGroup.append('g')
            .selectAll('line')
            .data(yScale.ticks(8))
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

        // 6. DEFINE PATH GENERATORS
        const line = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScale(d.primary_energy_consumption))
            .curve(d3.curveMonotoneX); // Smooth curves

        const area = d3.area()
            .x(d => xScale(d.year))
            .y0(chartHeight) // Area goes down to the bottom axis
            .y1(d => yScale(d.primary_energy_consumption))
            .curve(d3.curveMonotoneX);

        // 7. DRAW DATA PATHS (LOOP COUNTRIES)
        this.countries.forEach(country => {
            const countryData = this.data
                .filter(d => d.country === country)
                .sort((a, b) => a.year - b.year);

            if (!countryData.length) return;

            // Determine if this country should be highlighted
            const isTarget = country === 'United States' || country === 'China';
            const isSelected = country === this.selectedCountry;
            const color = this.countryColors[country] || '#6366f1';

            // Draw Area (Only if viewMode is 'area')
            if (this.viewMode === 'area') {
                chartGroup.append('path')
                    .datum(countryData)
                    .attr('d', area)
                    .attr('fill', this.hexToRgba(color, 0.12));
            }

            // Draw Line
            chartGroup.append('path')
                .datum(countryData)
                .attr('d', line)
                .attr('fill', 'none')
                .attr('stroke', isTarget || isSelected ? color : '#cbd5e1') // Grey for non-highlighted
                .attr('stroke-width', isTarget || isSelected ? 3 : 1.5)      // Thicker for highlighted
                .style('opacity', isTarget || isSelected ? 1 : 0.4);         // Fade non-highlighted
        });

        // 8. DIRECT LABELS (For USA & China)
        ['United States', 'China'].forEach(country => {
            // Find the last data point to position the label
            const d = this.data.filter(x => x.country === country).sort((a, b) => a.year - b.year).pop();
            if (!d) return;

            chartGroup.append('text')
                .attr('x', xScale(d.year) + 8) // Offset to the right
                .attr('y', yScale(d.primary_energy_consumption))
                .attr('dy', '0.35em') // Vertical center alignment
                .text(country)
                .attr('fill', this.countryColors[country])
                .style('font-family', 'Inter, sans-serif')
                .style('font-size', '13px')
                .style('font-weight', '700');
        });

        // 9. DRAW AXES
        // X-Axis
        chartGroup.append('g')
            .attr('transform', `translate(0,${chartHeight})`)
            .call(d3.axisBottom(xScale).ticks(8).tickFormat(d3.format('d'))) // Format as integer (year)
            .call(g => g.selectAll('text')
                .style('font-family', 'Inter')
                .style('font-size', '11px')
                .style('fill', '#64748b'));

        // Y-Axis
        chartGroup.append('g')
            .call(
                d3.axisLeft(yScale)
                    .ticks(8)
                    .tickFormat(d => d === 0 ? '0' : `${d / 1000}k`) // Format: 0, 20k, 40k...
            )
            .call(g => g.selectAll('text')
                .style('font-family', 'Inter')
                .style('font-size', '11px')
                .style('fill', '#64748b'));

        // 10. ADD TITLES & LABELS
        // Main Title
        svg.append('text')
            .attr('x', this.margin.left)
            .attr('y', 32)
            .text('Primary Energy Consumption per Capita')
            .style('font-family', 'Inter, sans-serif')
            .style('font-size', '20px')
            .style('font-weight', '800')
            .style('fill', '#0f172a');

        // Subtitle
        svg.append('text')
            .attr('x', this.margin.left)
            .attr('y', 54)
            .text('Average energy consumption per person over time (kWh per capita)')
            .style('font-family', 'Inter, sans-serif')
            .style('font-size', '13px')
            .style('fill', '#64748b');

        // X-Axis Label
        svg.append('text')
            .attr('x', this.margin.left + chartWidth / 2)
            .attr('y', height - 20)
            .text('Year')
            .style('text-anchor', 'middle')
            .style('font-family', 'Inter')
            .style('font-size', '12px')
            .style('fill', '#94a3b8');

        // Y-Axis Label (Rotated)
        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -(this.margin.top + chartHeight / 2))
            .attr('y', 25)
            .text('Energy Consumption (kWh per capita)')
            .style('text-anchor', 'middle')
            .style('font-family', 'Inter')
            .style('font-size', '12px')
            .style('fill', '#94a3b8');
    }

    /**
     * Helper to convert Hex color to RGBA for transparency.
     */
    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    /**
     * Resizes the chart when the window size changes.
     */
    resize() {
        this.update();
    }
}