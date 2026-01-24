class ConsumptionChart {
    constructor(data, majorCountries, countryColors) {
        this.data = data;
        this.countries = majorCountries;
        this.countryColors = countryColors;
        this.container = 'chart-consumption';
        this.viewMode = 'lines';
        this.selectedCountry = null;
        this.margin = { left: 90, right: 160, top: 110, bottom: 70 };
    }

    setViewMode(mode) {
        this.viewMode = mode;
        this.update();
    }

    setSelectedCountry(country) {
        this.selectedCountry = country;
        this.update();
    }

    update(currentYear) {
        const container = d3.select(`#${this.container}`);
        container.selectAll('*').remove();

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

        const minYear = d3.min(this.data, d => d.year);
        const maxYear = d3.max(this.data, d => d.year);

        const xScale = d3.scaleLinear()
            .domain([minYear, maxYear])
            .range([0, chartWidth]);

        const allValues = this.countries.flatMap(country =>
            this.data.filter(d => d.country === country)
                .map(d => d.primary_energy_consumption)
        );

        const yScale = d3.scaleLinear()
            .domain([0, d3.max(allValues) * 1.05])
            .range([chartHeight, 0])
            .nice(8);

        chartGroup.append('g')
            .selectAll('line')
            .data(yScale.ticks(8))
            .join('line')
            .attr('x1', 0)
            .attr('x2', chartWidth)
            .attr('y1', d => yScale(d))
            .attr('y2', d => yScale(d))
            .attr('stroke', 'rgba(226,232,240,0.7)');

        chartGroup.append('g')
            .selectAll('line')
            .data(xScale.ticks(8))
            .join('line')
            .attr('x1', d => xScale(d))
            .attr('x2', d => xScale(d))
            .attr('y1', 0)
            .attr('y2', chartHeight)
            .attr('stroke', 'rgba(226,232,240,0.6)');

        const line = d3.line()
            .x(d => xScale(d.year))
            .y(d => yScale(d.primary_energy_consumption))
            .curve(d3.curveMonotoneX);

        const area = d3.area()
            .x(d => xScale(d.year))
            .y0(chartHeight)
            .y1(d => yScale(d.primary_energy_consumption))
            .curve(d3.curveMonotoneX);

        this.countries.forEach(country => {
            const countryData = this.data
                .filter(d => d.country === country)
                .sort((a, b) => a.year - b.year);

            if (!countryData.length) return;

            const isTarget = country === 'United States' || country === 'China';
            const isSelected = country === this.selectedCountry;
            const color = this.countryColors[country] || '#6366f1';

            if (this.viewMode === 'area') {
                chartGroup.append('path')
                    .datum(countryData)
                    .attr('d', area)
                    .attr('fill', this.hexToRgba(color, 0.12));
            }

            chartGroup.append('path')
                .datum(countryData)
                .attr('d', line)
                .attr('fill', 'none')
                .attr('stroke', isTarget || isSelected ? color : '#cbd5e1')
                .attr('stroke-width', isTarget || isSelected ? 3 : 1.5)
                .style('opacity', isTarget || isSelected ? 1 : 0.4);
        });

        ['United States', 'China'].forEach(country => {
            const d = this.data.filter(x => x.country === country).sort((a, b) => a.year - b.year).pop();
            if (!d) return;

            chartGroup.append('text')
                .attr('x', xScale(d.year) + 8)
                .attr('y', yScale(d.primary_energy_consumption))
                .attr('dy', '0.35em')
                .text(country)
                .attr('fill', this.countryColors[country])
                .style('font-family', 'Inter, sans-serif')
                .style('font-size', '13px')
                .style('font-weight', '700');
        });

        chartGroup.append('g')
            .attr('transform', `translate(0,${chartHeight})`)
            .call(d3.axisBottom(xScale).ticks(8).tickFormat(d3.format('d')))
            .call(g => g.selectAll('text')
                .style('font-family', 'Inter')
                .style('font-size', '11px')
                .style('fill', '#64748b'));

        chartGroup.append('g')
            .call(
                d3.axisLeft(yScale)
                    .ticks(8)
                    .tickFormat(d => d === 0 ? '0' : `${d / 1000}k`)
            )
            .call(g => g.selectAll('text')
                .style('font-family', 'Inter')
                .style('font-size', '11px')
                .style('fill', '#64748b'));

        svg.append('text')
            .attr('x', this.margin.left)
            .attr('y', 32)
            .text('Primary Energy Consumption per Capita')
            .style('font-family', 'Inter, sans-serif')
            .style('font-size', '20px')
            .style('font-weight', '800')
            .style('fill', '#0f172a');

        svg.append('text')
            .attr('x', this.margin.left)
            .attr('y', 54)
            .text('Average energy consumption per person over time (kWh per capita)')
            .style('font-family', 'Inter, sans-serif')
            .style('font-size', '13px')
            .style('fill', '#64748b');

        svg.append('text')
            .attr('x', this.margin.left + chartWidth / 2)
            .attr('y', height - 20)
            .text('Year')
            .style('text-anchor', 'middle')
            .style('font-family', 'Inter')
            .style('font-size', '12px')
            .style('fill', '#94a3b8');

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

    hexToRgba(hex, alpha) {
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r},${g},${b},${alpha})`;
    }

    resize() {
        this.update();
    }
}
