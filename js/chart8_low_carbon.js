/**
 * class LowCarbonChart
 * --------------------------------------------------------------------------
 * Renders a Grouped Bar Chart to break down the composition of low-carbon sources.
 * * Visualization Logic:
 * - Compares three specific categories: Hydroelectric, Renewables, and Nuclear.
 * - Uses nested scales (x0 for Country, x1 for Energy Type).
 * - Derives 'Nuclear' data mathematically from the dataset totals.
 */
class LowCarbonChart {
    
    /**
     * Initializes the chart instance.
     * @param {Array} data - The complete dataset.
     * @param {Array} majorCountries - Optional list of countries to filter (defaults to Top 5).
     */
    constructor(data, majorCountries = []) {
        this.data = data;
        this.container = 'chart-low-carbon'; // Target DOM ID
        
        this.margin = { left: 70, right: 30, top: 90, bottom: 50 };

        // Determine which countries to display
        const availableCountries = [...new Set(data.map(d => d.country))];

        if (majorCountries.length > 0) {
            this.selectedCountries = majorCountries.filter(c => availableCountries.includes(c));
        } else {
            // Default set if none provided
            this.selectedCountries = ["United States", "China", "Germany", "Brazil", "Japan"]
                .filter(c => availableCountries.includes(c));
        }

        // Color Palette for specific sources
        this.colors = {
            hydro: '#2b75eb',      // Blue
            renewables: '#22c55e', // Green
            nuclear: '#8b5cf6'     // Purple
        };

        // Human-readable labels
        this.labels = {
            hydro: 'Hydroelectric',
            renewables: 'Renewables (Non-Hydro)',
            nuclear: 'Nuclear'
        };

        this.currentYear = null;
    }

    /**
     * Updates the chart for the selected year.
     * Handles data derivation and rendering.
     * @param {number} selectedYear - The year to visualize.
     */
    update(selectedYear) {
        this.currentYear = selectedYear;
        
        // 1. DATA FILTERING
        let yearData = this.data.filter(d => d.year === selectedYear);

        // Fallback: If no data for year, use the most recent available
        if (yearData.length === 0) {
            const availableYears = [...new Set(this.data.map(d => d.year))].sort((a, b) => b - a);
            yearData = this.data.filter(d => d.year === availableYears[0]);
        }

        // 2. DATA TRANSFORMATION
        const chartData = [];
        this.selectedCountries.forEach(country => {
            const d = yearData.find(item => item.country === country);
            if (d) {
                const hydro = d.hydro_elec_per_capita || 0;
                const renewables = d.renewables_energy_per_capita || 0;
                
                // MATH: Nuclear is often aggregated in 'Low Carbon'. 
                // We derive it: Total Low Carbon - (Hydro + Renewables)
                const nuclearCalc = (d.low_carbon_energy_per_capita || 0) - hydro - renewables;
                const nuclear = Math.max(0, nuclearCalc); // Prevent negative values due to rounding errors

                chartData.push({
                    country: country,
                    hydro: hydro,
                    renewables: renewables,
                    nuclear: nuclear
                });
            }
        });

        if (chartData.length === 0) return;

        // 3. SVG SETUP
        const container = d3.select(`#${this.container}`);
        container.selectAll('*').remove();
        d3.select('.tooltip-low-carbon').remove();

        const containerNode = document.getElementById(this.container);
        if (!containerNode) return;

        const width = containerNode.clientWidth || 800;
        const height = containerNode.clientHeight || 500;

        const chartWidth = width - this.margin.left - this.margin.right;
        const chartHeight = height - this.margin.top - this.margin.bottom;

        const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height);

        const chartGroup = svg.append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

        // 4. SCALES (NESTED)
        const keys = ['hydro', 'renewables', 'nuclear'];

        // x0: Main groups (Countries)
        const x0Scale = d3.scaleBand()
            .domain(chartData.map(d => d.country))
            .range([0, chartWidth])
            .padding(0.2);

        // x1: Sub-bars (Energy Sources within a country)
        const x1Scale = d3.scaleBand()
            .domain(keys)
            .range([0, x0Scale.bandwidth()])
            .padding(0.05);

        const maxY = d3.max(chartData, d => Math.max(d.hydro, d.renewables, d.nuclear)) || 0;

        const yScale = d3.scaleLinear()
            .domain([0, maxY * 1.1])
            .range([chartHeight, 0])
            .nice();

        // 5. DRAW GRID
        chartGroup.append('g')
            .attr('class', 'grid-y')
            .selectAll('line')
            .data(yScale.ticks(6))
            .join('line')
            .attr('x1', 0)
            .attr('x2', chartWidth)
            .attr('y1', d => yScale(d))
            .attr('y2', d => yScale(d))
            .attr('stroke', 'rgba(226, 232, 240, 0.7)');

        // 6. DRAW BARS
        const countryGroups = chartGroup.selectAll('.country-group')
            .data(chartData)
            .join('g')
            .attr('class', 'country-group')
            .attr('transform', d => `translate(${x0Scale(d.country)},0)`);

        countryGroups.selectAll('rect')
            .data(d => keys.map(key => ({ key: key, value: d[key], country: d.country })))
            .join('rect')
            .attr('x', d => x1Scale(d.key))
            .attr('y', d => yScale(d.value))
            .attr('width', x1Scale.bandwidth())
            .attr('height', d => chartHeight - yScale(d.value))
            .attr('fill', d => this.colors[d.key])
            .attr('stroke', 'rgba(255, 255, 255, 0.5)')
            .attr('stroke-width', 1)
            // Interactions
            .on('mouseover', (event, d) => this.showTooltip(event, d))
            .on('mousemove', (event) => this.moveTooltip(event))
            .on('mouseout', () => this.hideTooltip());

        // 7. DRAW AXES
        chartGroup.append('g')
            .attr('transform', `translate(0, ${chartHeight})`)
            .call(d3.axisBottom(x0Scale))
            .call(g => g.select('.domain').attr('stroke', '#cbd5e1'))
            .call(g => g.selectAll('.tick line').remove())
            .call(g => g.selectAll('text')
                .style('font-family', 'Inter, sans-serif')
                .style('font-size', '11px')
                .style('fill', '#64748b'));

        chartGroup.append('g')
            .call(d3.axisLeft(yScale).ticks(6).tickFormat(d3.format("~s")))
            .call(g => g.select('.domain').remove())
            .call(g => g.selectAll('.tick line').remove())
            .call(g => g.selectAll('text')
                .style('font-family', 'Inter, sans-serif')
                .style('font-size', '11px')
                .style('fill', '#64748b'));

        // Titles & Labels
        svg.append('text')
            .attr('x', this.margin.left)
            .attr('y', 30)
            .text('')
            .style('font-family', 'Inter, sans-serif')
            .style('font-size', '16px')
            .style('font-weight', '700')
            .style('fill', '#1e293b');
        
        svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -(this.margin.top + chartHeight / 2))
            .attr('y', 20)
            .text('kWh per capita')
            .style('text-anchor', 'middle')
            .style('font-family', 'Inter, sans-serif')
            .style('font-size', '11px')
            .style('fill', '#64748b');

        // 8. DYNAMIC LEGEND (Calculated layout to prevent overlap)
        
        const legendGroup = svg.append('g')
            .attr('transform', `translate(${this.margin.left}, 55)`); 

        let currentX = 0;

        keys.forEach((key) => {
            const labelText = this.labels[key];
            
            const legendItem = legendGroup.append('g')
                .attr('transform', `translate(${currentX}, 0)`);

            // Legend Color Box
            legendItem.append('rect')
                .attr('width', 10)
                .attr('height', 10)
                .attr('rx', 2)
                .attr('fill', this.colors[key]);

            // Legend Label
            const textNode = legendItem.append('text')
                .attr('x', 15)
                .attr('y', 9)
                .text(labelText)
                .style('font-family', 'Inter, sans-serif')
                .style('font-size', '11px') 
                .style('font-weight', '500')
                .style('fill', '#64748b');

            // Calculate width for next item placement
            // Approx 7px per char + icon width + padding
            const approxTextWidth = labelText.length * 7; 
            const itemWidth = 15 + approxTextWidth + 24;

            currentX += itemWidth;
        });

        // 9. TOOLTIP INITIALIZATION
        this.tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip-low-carbon')
            .style('position', 'absolute')
            .style('background', 'rgba(255, 255, 255, 0.98)')
            .style('border', '1px solid #e2e8f0')
            .style('border-radius', '6px')
            .style('padding', '8px 12px')
            .style('font-family', 'Inter, sans-serif')
            .style('font-size', '12px')
            .style('color', '#1e293b')
            .style('pointer-events', 'none')
            .style('opacity', 0)
            .style('z-index', 1000)
            .style('box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1)');
    }

    /**
     * Tooltip Interaction Handlers
     */
    showTooltip(event, d) {
        const valueFormatted = d3.format(",.0f")(d.value);
        this.tooltip.html(`
            <div style="font-weight:bold; color:${this.colors[d.key]}; margin-bottom:4px;">${this.labels[d.key]}</div>
            <div>Country: <span style="font-weight:600">${d.country}</span></div>
            <div>Value: <span style="font-weight:600">${valueFormatted} kWh</span></div>
        `)
        .style('opacity', 1)
        .style('left', (event.pageX + 10) + 'px')
        .style('top', (event.pageY - 20) + 'px');
        
        d3.select(event.currentTarget).style('opacity', 0.8);
    }

    moveTooltip(event) {
        this.tooltip
            .style('left', (event.pageX + 10) + 'px')
            .style('top', (event.pageY - 20) + 'px');
    }

    hideTooltip() {
        this.tooltip.style('opacity', 0);
        d3.selectAll('rect').style('opacity', 1);
    }

    /**
     * Resizes the chart by re-rendering the current year.
     */
    resize() {
        if (this.currentYear) {
            this.update(this.currentYear);
        }
    }
}