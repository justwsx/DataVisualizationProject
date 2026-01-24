class FossilPrice {
    constructor(data, containerId) {
        this.data = data;
        this.containerId = containerId;
        this.currentYear = 2020;

        // Configuration for dimensions and margins
        this.margin = { top: 80, right: 30, bottom: 50, left: 60 };
        this.width = 800; // Base width for viewBox
        this.height = 400; // Base height for viewBox

        // Color palette matching the previous design
        this.colors = {
            oil: '#7c2d12',
            gas: '#facc15',
            coal: '#000000'
        };

        // Initialize the chart
        this.init();
    }

    /**
     * Initializes the SVG, scales, and static elements.
     * This runs only once to improve performance.
     */
    init() {
        const container = document.getElementById(this.containerId);
        container.innerHTML = ''; // Clear previous content

        // Process data: Filter and Sort once
        this.processedData = this.data
            .map(d => ({
                year: d.year,
                oil: d.oil_price_global ?? null,
                gas: d.gas_price_global ?? null,
                coal: d.coal_price_global ?? null
            }))
            .filter(d => d.year >= 1990 && d.year <= 2022)
            .sort((a, b) => a.year - b.year);

        // Define Scales
        // X Scale: Linear for years
        this.xScale = d3.scaleLinear()
            .domain(d3.extent(this.processedData, d => d.year))
            .range([this.margin.left, this.width - this.margin.right]);

        // Y Scale: Linear for price, based on the max value across all categories
        const maxPrice = d3.max(this.processedData, d => Math.max(d.oil || 0, d.gas || 0, d.coal || 0));
        this.yScale = d3.scaleLinear()
            .domain([0, maxPrice * 1.1]) // Add 10% padding on top
            .range([this.height - this.margin.bottom, this.margin.top]);

        // Create SVG container with responsive viewBox
        this.svg = d3.select(container)
            .append('svg')
            .attr('viewBox', `0 0 ${this.width} ${this.height}`)
            .attr('preserveAspectRatio', 'xMidYMid meet')
            .style('width', '100%')
            .style('height', 'auto')
            .style('font-family', 'Inter, sans-serif');

        // Draw Axes
        this.drawAxes();

        // Draw Legend
        this.drawLegend();

        // Draw the vertical indicator line (initially hidden or at default pos)
        this.indicatorLine = this.svg.append('line')
            .attr('stroke', '#64748b')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '4,4') // Dotted line style
            .attr('y1', this.margin.top)
            .attr('y2', this.height - this.margin.bottom);

        // Draw the data lines and store references to circle groups
        this.drawSeries();

        // Perform initial update to set positions based on default year
        this.update();
    }

    /**
     * Renders X and Y axes with custom grid lines.
     */
    drawAxes() {
        // X Axis
        const xAxis = d3.axisBottom(this.xScale)
            .tickFormat(d3.format('d')) // Remove comma from years (e.g. 2,020 -> 2020)
            .ticks(Math.floor((2022 - 1990) / 5)); // Similar to dtick: 5

        this.svg.append('g')
            .attr('transform', `translate(0,${this.height - this.margin.bottom})`)
            .call(xAxis)
            .call(g => g.select('.domain').attr('stroke', 'rgba(226,232,240,0.6)'))
            .call(g => g.selectAll('.tick line').attr('stroke', 'rgba(226,232,240,0.6)'))
            .call(g => g.selectAll('text').attr('fill', '#64748b').style('font-size', '11px'));

        // X Axis Label
        this.svg.append('text')
            .attr('x', this.width / 2)
            .attr('y', this.height - 10)
            .attr('text-anchor', 'middle')
            .attr('fill', '#64748b')
            .style('font-size', '11px')
            .text('Year');

        // Y Axis
        const yAxis = d3.axisLeft(this.yScale)
            .tickSize(-(this.width - this.margin.left - this.margin.right)); // Full width grid lines

        this.svg.append('g')
            .attr('transform', `translate(${this.margin.left},0)`)
            .call(yAxis)
            .call(g => g.select('.domain').remove()) // Hide Y axis line
            .call(g => g.selectAll('.tick line').attr('stroke', 'rgba(226,232,240,0.6)'))
            .call(g => g.selectAll('text').attr('fill', '#64748b').style('font-size', '11px'));

        // Y Axis Label
        this.svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -(this.height / 2))
            .attr('y', 20)
            .attr('text-anchor', 'middle')
            .attr('fill', '#64748b')
            .style('font-size', '11px')
            .text('Price (USD)');
    }

    /**
     * Renders the top legend.
     */
    drawLegend() {
        const legendData = [
            { label: 'Oil', color: this.colors.oil },
            { label: 'Natural Gas', color: this.colors.gas },
            { label: 'Coal', color: this.colors.coal }
        ];

        const legendGroup = this.svg.append('g')
            .attr('transform', `translate(${this.width / 2}, 30)`); // Top center

        let currentX = 0;
        
        // Calculate total width to center it properly
        // Note: Simple estimation. For precise centering, we'd need to measure text nodes.
        const itemSpacing = 100; 
        const totalWidth = (legendData.length - 1) * itemSpacing;
        
        legendGroup.attr('transform', `translate(${this.width / 2 - totalWidth / 2}, 30)`);

        legendData.forEach((item, i) => {
            const g = legendGroup.append('g')
                .attr('transform', `translate(${i * itemSpacing}, 0)`);

            g.append('line')
                .attr('x1', 0).attr('x2', 20)
                .attr('y1', 0).attr('y2', 0)
                .attr('stroke', item.color)
                .attr('stroke-width', 3);

            g.append('circle')
                .attr('cx', 10).attr('cy', 0).attr('r', 4)
                .attr('fill', item.color);

            g.append('text')
                .attr('x', 25)
                .attr('y', 4)
                .text(item.label)
                .attr('fill', '#1e293b')
                .style('font-size', '12px')
                .style('font-family', 'Inter, sans-serif');
        });
    }

    /**
     * Draws the lines and initializes the circles for data points.
     */
    drawSeries() {
        const categories = ['oil', 'gas', 'coal'];
        
        // Line generator
        const lineGenerator = (key) => d3.line()
            .defined(d => d[key] !== null) // Skip null values
            .x(d => this.xScale(d.year))
            .y(d => this.yScale(d[key]));

        categories.forEach(key => {
            // Draw Line
            this.svg.append('path')
                .datum(this.processedData)
                .attr('fill', 'none')
                .attr('stroke', this.colors[key])
                .attr('stroke-width', 3)
                .attr('d', lineGenerator(key));

            // Create a group for circles of this category
            // We select them later by class name during update
            this.svg.selectAll(`.dot-${key}`)
                .data(this.processedData.filter(d => d[key] !== null))
                .enter()
                .append('circle')
                .attr('class', `dot-${key}`)
                .attr('cx', d => this.xScale(d.year))
                .attr('cy', d => this.yScale(d[key]))
                .attr('r', 4) // Default radius
                .attr('fill', this.colors[key]);
        });
    }

    /**
     * Public method to change year and trigger visual update.
     */
    setYear(year) {
        this.currentYear = year;
        this.update();
    }

    /**
     * Updates dynamic visual elements based on this.currentYear.
     * Moves the vertical line and resizes dots.
     */
    update() {
        // 1. Move the vertical indicator line
        const xPos = this.xScale(this.currentYear);
        
        this.indicatorLine
            .attr('x1', xPos)
            .attr('x2', xPos)
            .style('opacity', 1); // Ensure it's visible

        // 2. Update circle sizes (Active vs Inactive)
        const categories = ['oil', 'gas', 'coal'];

        categories.forEach(key => {
            this.svg.selectAll(`.dot-${key}`)
                .transition() // Add smooth animation
                .duration(200)
                .attr('r', d => d.year === this.currentYear ? 10 : 4);
        });
    }

    /**
     * Handles resize if necessary (mostly handled by viewBox/CSS).
     */
    resize() {
        // With SVG viewBox, explicit resize logic is often unnecessary 
        // if the container is styled with CSS (width: 100%).
        // But if we needed to re-calculate scales (e.g., changing aspect ratio),
        // we would re-run init() here.
    }
}