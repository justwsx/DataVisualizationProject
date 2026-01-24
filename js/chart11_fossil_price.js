class FossilPrice {
    constructor(data, containerId) {
        this.data = data;
        this.containerId = containerId;
        this.currentYear = 2020;
        this.colors = { oil: '#7c2d12', gas: '#facc15', coal: '#000000' };
        this.labels = { oil: 'Oil', gas: 'Natural Gas', coal: 'Coal' };

        // Prepare data once
        this.chartData = this.data
            .map(d => ({ year: d.year, oil: d.oil_price_global, gas: d.gas_price_global, coal: d.coal_price_global }))
            .filter(d => d.year >= 1990 && d.year <= 2022)
            .sort((a, b) => a.year - b.year);

        // Listen for window resize
        window.addEventListener('resize', () => this.draw());
        
        // Initial draw
        this.draw();
    }

    draw() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // 1. Clear container and calculate actual dimensions
        container.innerHTML = ''; 
        const { width: w, height: h } = container.getBoundingClientRect();
        // If container is hidden or height is 0, use default to prevent breakage
        const height = h || 400; 
        const margin = { top: 60, right: 40, bottom: 40, left: 50 };
        const width = w - margin.left - margin.right;
        const chartH = height - margin.top - margin.bottom;

        // 2. Create SVG and Scales
        this.svg = d3.select(container).append('svg')
            .attr('width', w).attr('height', height)
            .style('font-family', 'Inter, sans-serif')
            .append('g').attr('transform', `translate(${margin.left},${margin.top})`);

        this.xScale = d3.scaleLinear()
            .domain(d3.extent(this.chartData, d => d.year))
            .range([0, width]);

        const maxPrice = d3.max(this.chartData, d => Math.max(d.oil||0, d.gas||0, d.coal||0));
        this.yScale = d3.scaleLinear().domain([0, maxPrice * 1.1]).range([chartH, 0]);

        // 3. Draw Axes (X and Y)
        this.svg.append('g').attr('transform', `translate(0,${chartH})`)
            .call(d3.axisBottom(this.xScale).tickFormat(d3.format('d')).ticks(width / 80))
            .call(g => g.selectAll('.domain, line').attr('stroke', '#cbd5e1'))
            .call(g => g.selectAll('text').attr('fill', '#64748b'));

        this.svg.append('g')
            .call(d3.axisLeft(this.yScale).tickSize(-width)) // Horizontal grid lines
            .call(g => g.select('.domain').remove())
            .call(g => g.selectAll('line').attr('stroke', '#e2e8f0'))
            .call(g => g.selectAll('text').attr('fill', '#64748b'));

        // 4. Dotted Line (Year Indicator)
        this.indicator = this.svg.append('line')
            .attr('y1', 0).attr('y2', chartH)
            .attr('stroke', '#64748b').attr('stroke-width', 2).attr('stroke-dasharray', '4,4');

        // 5. Single Loop: Draw Lines, Dots, and Legend for Oil, Gas, Coal
        const keys = ['oil', 'gas', 'coal'];
        const legendStart = (width / 2) - ((keys.length * 100) / 2); // Center legend

        keys.forEach((key, i) => {
            const color = this.colors[key];
            const cleanData = this.chartData.filter(d => d[key] != null);

            // Chart Line
            this.svg.append('path').datum(cleanData)
                .attr('fill', 'none').attr('stroke', color).attr('stroke-width', 3)
                .attr('d', d3.line().x(d => this.xScale(d.year)).y(d => this.yScale(d[key])));

            // Dots (assign class 'dot-oil', 'dot-gas' for later selection)
            this.svg.selectAll(`.dot-${key}`)
                .data(cleanData).enter().append('circle')
                .attr('class', `dot-${key}`)
                .attr('cx', d => this.xScale(d.year)).attr('cy', d => this.yScale(d[key]))
                .attr('r', 4).attr('fill', color);

            // Legend (top)
            const leg = this.svg.append('g').attr('transform', `translate(${legendStart + i * 100}, -30)`);
            leg.append('line').attr('x2', 20).attr('stroke', color).attr('stroke-width', 3);
            leg.append('circle').attr('cx', 10).attr('r', 4).attr('fill', color);
            leg.append('text').attr('x', 25).attr('y', 4).text(this.labels[key]).style('font-size', '12px').attr('fill', '#1e293b');
        });

        // Update initial position
        this.updateVisuals();
    }

    setYear(year) {
        this.currentYear = year;
        this.updateVisuals();
    }

    // Lightweight method to update only dynamic elements (line position and dot size)
    updateVisuals() {
        if (!this.xScale) return;
        
        // Move vertical line
        const x = this.xScale(this.currentYear);
        this.indicator.attr('x1', x).attr('x2', x);

        // Enlarge dots for the current year
        ['oil', 'gas', 'coal'].forEach(key => {
            this.svg.selectAll(`.dot-${key}`)
                .transition().duration(200)
                .attr('r', d => d.year === this.currentYear ? 10 : 4);
        });
    }
    
    // Resize now simply calls draw()
    resize() { this.draw(); }
}