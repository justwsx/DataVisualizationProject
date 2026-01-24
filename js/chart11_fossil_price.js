class FossilPrice {
    constructor(data, containerId) {
        this.data = data;
        this.containerId = containerId;
        this.currentYear = 2020;
        
        // Save the bound resize function so we can remove it later if needed
        this._resizeHandler = this.resize.bind(this);
        window.addEventListener('resize', this._resizeHandler);

        // Color palette
        this.colors = {
            oil: '#7c2d12',
            gas: '#facc15',
            coal: '#000000'
        };

        // Initialize immediately
        this.init();
    }

    /**
     * Calculates dimensions based on the container's current size
     * and renders the chart.
     */
    init() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // 1. Measure the container
        // If the container has no height (0), we fallback to 400px to prevent errors
        const rect = container.getBoundingClientRect();
        const containerWidth = rect.width || 800; 
        const containerHeight = rect.height > 0 ? rect.height : 400;

        // 2. Clear previous content (crucial for resize)
        container.innerHTML = '';

        // 3. Define dynamic margins based on available space
        this.margin = { top: 60, right: 40, bottom: 40, left: 50 };
        this.width = containerWidth - this.margin.left - this.margin.right;
        this.height = containerHeight - this.margin.top - this.margin.bottom;

        // Process data
        this.processedData = this.data
            .map(d => ({
                year: d.year,
                oil: d.oil_price_global ?? null,
                gas: d.gas_price_global ?? null,
                coal: d.coal_price_global ?? null
            }))
            .filter(d => d.year >= 1990 && d.year <= 2022)
            .sort((a, b) => a.year - b.year);

        // Define Scales based on the measured dimensions
        this.xScale = d3.scaleLinear()
            .domain(d3.extent(this.processedData, d => d.year))
            .range([0, this.width]);

        const maxPrice = d3.max(this.processedData, d => Math.max(d.oil || 0, d.gas || 0, d.coal || 0));
        this.yScale = d3.scaleLinear()
            .domain([0, maxPrice * 1.1])
            .range([this.height, 0]); // SVG Y is inverted

        // Create SVG
        // We use absolute pixel values here to match the container exactly
        this.svg = d3.select(container)
            .append('svg')
            .attr('width', containerWidth)
            .attr('height', containerHeight)
            .style('font-family', 'Inter, sans-serif')
            .append('g')
            .attr('transform', `translate(${this.margin.left},${this.margin.top})`);

        this.drawAxes();
        this.drawLegend(containerWidth); // Pass width to center legend

        // Vertical indicator line
        this.indicatorLine = this.svg.append('line')
            .attr('stroke', '#64748b')
            .attr('stroke-width', 2)
            .attr('stroke-dasharray', '4,4')
            .attr('y1', 0)
            .attr('y2', this.height);

        this.drawSeries();
        this.update();
    }

    drawAxes() {
        // X Axis
        const xAxis = d3.axisBottom(this.xScale)
            .tickFormat(d3.format('d'))
            .ticks(Math.max(this.width / 80, 2)); // Dynamic tick count based on width

        this.svg.append('g')
            .attr('transform', `translate(0,${this.height})`)
            .call(xAxis)
            .call(g => g.select('.domain').attr('stroke', 'rgba(226,232,240,0.6)'))
            .call(g => g.selectAll('.tick line').attr('stroke', 'rgba(226,232,240,0.6)'))
            .call(g => g.selectAll('text').attr('fill', '#64748b').style('font-size', '11px'));

        // Y Axis
        const yAxis = d3.axisLeft(this.yScale)
            .tickSize(-this.width); // Full width grid lines

        this.svg.append('g')
            .call(yAxis)
            .call(g => g.select('.domain').remove())
            .call(g => g.selectAll('.tick line').attr('stroke', 'rgba(226,232,240,0.6)'))
            .call(g => g.selectAll('text').attr('fill', '#64748b').style('font-size', '11px'));

        // Y Axis Label
        this.svg.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('x', -(this.height / 2))
            .attr('y', -35)
            .attr('text-anchor', 'middle')
            .attr('fill', '#64748b')
            .style('font-size', '11px')
            .text('Price (USD)');
    }

    drawLegend(totalWidth) {
        const legendData = [
            { label: 'Oil', color: this.colors.oil },
            { label: 'Natural Gas', color: this.colors.gas },
            { label: 'Coal', color: this.colors.coal }
        ];

        // Position legend above the chart area (negative Y relative to margins)
        const legendGroup = this.svg.append('g')
            .attr('transform', `translate(0, -30)`);

        const itemSpacing = 100;
        const totalLegendWidth = (legendData.length - 1) * itemSpacing;
        
        // Center visually relative to the chart width
        const startX = (this.width / 2) - (totalLegendWidth / 2);

        legendData.forEach((item, i) => {
            const g = legendGroup.append('g')
                .attr('transform', `translate(${startX + i * itemSpacing}, 0)`);

            g.append('line')
                .attr('x1', 0).attr('x2', 20).attr('y1', 0).attr('y2', 0)
                .attr('stroke', item.color).attr('stroke-width', 3);

            g.append('circle')
                .attr('cx', 10).attr('cy', 0).attr('r', 4).attr('fill', item.color);

            g.append('text')
                .attr('x', 25).attr('y', 4)
                .text(item.label)
                .attr('fill', '#1e293b')
                .style('font-size', '12px');
        });
    }

    drawSeries() {
        const categories = ['oil', 'gas', 'coal'];
        
        const lineGenerator = (key) => d3.line()
            .defined(d => d[key] !== null)
            .x(d => this.xScale(d.year))
            .y(d => this.yScale(d[key]));

        categories.forEach(key => {
            this.svg.append('path')
                .datum(this.processedData)
                .attr('fill', 'none')
                .attr('stroke', this.colors[key])
                .attr('stroke-width', 3)
                .attr('d', lineGenerator(key));

            this.svg.selectAll(`.dot-${key}`)
                .data(this.processedData.filter(d => d[key] !== null))
                .enter()
                .append('circle')
                .attr('class', `dot-${key}`)
                .attr('cx', d => this.xScale(d.year))
                .attr('cy', d => this.yScale(d[key]))
                .attr('r', 4)
                .attr('fill', this.colors[key]);
        });
    }

    setYear(year) {
        this.currentYear = year;
        this.update();
    }

    update() {
        if (!this.xScale || !this.svg) return;

        const xPos = this.xScale(this.currentYear);
        
        this.indicatorLine
            .attr('x1', xPos).attr('x2', xPos)
            .style('opacity', 1);

        ['oil', 'gas', 'coal'].forEach(key => {
            this.svg.selectAll(`.dot-${key}`)
                .transition().duration(200)
                .attr('r', d => d.year === this.currentYear ? 10 : 4);
        });
    }

    /**
     * Re-calculates dimensions and re-draws the entire chart.
     * This ensures it fits perfectly in the container on window resize.
     */
    resize() {
        this.init();
    }
}