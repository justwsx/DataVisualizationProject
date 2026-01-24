class MixChart {
    constructor(data) {
        this.data = data;
        this.container = 'chart-mix';
        this.margin = { left: 60, right: 20, top: 40, bottom: 140 };
        
        this.colors = {
            coal: '#374151',
            gas: '#FFD700',
            oil: '#8B4513',
            hydro: '#3b82f6',
            renewables: '#22c55e',
            nuclear: '#8b5cf6'
        };

        this.sourceNames = {
            coal: 'Coal',
            gas: 'Natural Gas',
            oil: 'Oil',
            hydro: 'Hydroelectric',
            renewables: 'Renewables',
            nuclear: 'Nuclear'
        };
    }

    update(selectedYear) {
        let yearData = this.data.filter(d => d.year === selectedYear);

        if (yearData.length === 0) {
            const availableYears = [...new Set(this.data.map(d => d.year))].sort((a, b) => b - a);
            yearData = this.data.filter(d => d.year === availableYears[0]);
        }

        const countryData = {};
        yearData.forEach(d => {
            if (!countryData[d.country]) {
                countryData[d.country] = {
                    country: d.country,
                    coal: 0,
                    gas: 0,
                    oil: 0,
                    hydro: 0,
                    renewables: 0,
                    nuclear: 0,
                    total: 0
                };
            }
            countryData[d.country].coal += d.coal_cons_per_capita || 0;
            countryData[d.country].gas += d.gas_energy_per_capita || 0;
            countryData[d.country].oil += d.oil_energy_per_capita || 0;
            countryData[d.country].hydro += d.hydro_elec_per_capita || 0;
            countryData[d.country].renewables += d.renewables_energy_per_capita || 0;

            const nuclear = (d.low_carbon_energy_per_capita || 0) -
                           (d.renewables_energy_per_capita || 0);
            countryData[d.country].nuclear += Math.max(0, nuclear);

            countryData[d.country].total += d.primary_energy_consumption || 0;
        });

        const sortedCountries = Object.values(countryData)
            .sort((a, b) => b.total - a.total)
            .slice(0, 15)
            .reverse();

        const container = d3.select(`#${this.container}`);
        container.selectAll('*').remove();
        
        d3.select('.tooltip-d3').remove();

        const containerNode = document.getElementById(this.container);
        const width = containerNode.clientWidth || 800;
        const height = containerNode.clientHeight || 500;
        
        const chartWidth = width - this.margin.left - this.margin.right;
        const chartHeight = height - this.margin.top - this.margin.bottom;

        const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('background', 'transparent');

        const chartGroup = svg.append('g')
            .attr('transform', `translate(${this.margin.left}, ${this.margin.top})`);

        const countries = sortedCountries.map(d => d.country);
        const sources = ['coal', 'gas', 'oil', 'hydro', 'renewables', 'nuclear'];

        const xScale = d3.scaleBand()
            .domain(countries)
            .range([0, chartWidth])
            .padding(0.2);

        const maxTotal = d3.max(sortedCountries, d => 
            d.coal + d.gas + d.oil + d.hydro + d.renewables + d.nuclear
        );

        const yScale = d3.scaleLinear()
            .domain([0, maxTotal * 1.05])
            .range([chartHeight, 0])
            .nice();

        chartGroup.append('g')
            .attr('class', 'grid-y')
            .selectAll('line')
            .data(yScale.ticks())
            .join('line')
            .attr('x1', 0)
            .attr('x2', chartWidth)
            .attr('y1', d => yScale(d))
            .attr('y2', d => yScale(d))
            .attr('stroke', 'rgba(226, 232, 240, 0.8)')
            .attr('stroke-width', 1);

        const stack = d3.stack()
            .keys(sources)
            .order(d3.stackOrderNone)
            .offset(d3.stackOffsetNone);

        const stackedData = stack(sortedCountries);

        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip-d3')
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
            .style('z-index', 9999)
            .style('box-shadow', '0 2px 8px rgba(0,0,0,0.1)');

        stackedData.forEach((layer) => {
            const source = layer.key;
            
            chartGroup.append('g')
                .selectAll('rect')
                .data(layer)
                .join('rect')
                .attr('x', d => xScale(d.data.country))
                .attr('y', d => yScale(d[1]))
                .attr('height', d => yScale(d[0]) - yScale(d[1]))
                .attr('width', xScale.bandwidth())
                .attr('fill', this.colors[source])
                .on('mouseover', (event, d) => {
                    const value = d[1] - d[0];
                    tooltip
                        .html(`${this.sourceNames[source]}: ${d3.format(',')(Math.round(value))} kWh`)
                        .style('opacity', 1)
                        .style('left', `${event.pageX + 10}px`)
                        .style('top', `${event.pageY - 20}px`);
                })
                .on('mousemove', (event) => {
                    tooltip
                        .style('left', `${event.pageX + 10}px`)
                        .style('top', `${event.pageY - 20}px`);
                })
                .on('mouseout', () => {
                    tooltip.style('opacity', 0);
                });
        });

        // X Axis
        const xAxis = d3.axisBottom(xScale);
        chartGroup.append('g')
            .attr('transform', `translate(0, ${chartHeight})`)
            .call(xAxis)
            .call(g => g.select('.domain').attr('stroke', '#e2e8f0'))
            .call(g => g.selectAll('.tick line').attr('stroke', '#e2e8f0'))
            .call(g => g.selectAll('.tick text')
                .attr('transform', 'rotate(-45)')
                .style('text-anchor', 'end')
                .attr('dx', '-0.5em')
                .attr('dy', '0.5em')
                .attr('font-family', 'Inter, sans-serif')
                .attr('font-size', '11px')
                .attr('fill', '#1e293b'));

        // Y Axis
        const yAxis = d3.axisLeft(yScale)
            .ticks(6)
            .tickFormat(d3.format("~s"));

        chartGroup.append('g')
            .call(yAxis)
            .call(g => g.select('.domain').remove())
            .call(g => g.selectAll('.tick line').remove())
            .call(g => g.selectAll('.tick text')
                .attr('font-family', 'Inter, sans-serif')
                .attr('font-size', '11px')
                .attr('fill', '#64748b'));

        // Vertical Y-Axis Label
        chartGroup.append('text')
            .attr('transform', 'rotate(-90)')
            .attr('y', 0 - this.margin.left + 15)
            .attr('x', 0 - (chartHeight / 2))
            .attr('dy', '1em')
            .style('text-anchor', 'middle')
            .style('font-family', 'Inter, sans-serif')
            .style('font-size', '12px')
            .style('fill', '#64748b')
            .text('kWh per capita');
    }

    resize() {
        this.update();
    }
}
