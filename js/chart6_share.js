class ShareChart {
    constructor(data) {
        this.data = data;
        this.elementId = 'chart-share';
        this.colors = ["#374151", "#8B4513", "#FFD700", "#8b5cf6", "#3b82f6", "#22c55e"];
        this.labels = ["Coal", "Oil", "Natural Gas", "Nuclear", "Hydroelectric", "Renewables"];
    }

    update(year) {
        const containerNode = document.getElementById(this.elementId);
        if (!containerNode) return;

        const yearData = this.data.filter(d => d.year === year);
        if (yearData.length === 0) return;

        // 1. Calculations 
        let coal = 0, oil = 0, gas = 0, hydro = 0, nuclear = 0, renewables = 0;

        yearData.forEach(d => {
            const pop = d.population || 0;
            
            coal += (d.coal_cons_per_capita || 0) * pop;
            oil += (d.oil_energy_per_capita || 0) * pop;
            gas += (d.gas_energy_per_capita || 0) * pop;
            hydro += (d.hydro_elec_per_capita || 0) * pop;

            const totRenewables = (d.renewables_energy_per_capita || 0) * pop;
            const totLowCarbon = (d.low_carbon_energy_per_capita || 0) * pop;

            // Solar/Wind/Other = Total Renewables - Hydro
            const solarWind = Math.max(0, totRenewables - ((d.hydro_elec_per_capita || 0) * pop));
            renewables += solarWind;

            // Nuclear = Low Carbon - Total Renewables
            const nuc = Math.max(0, totLowCarbon - totRenewables);
            nuclear += nuc;
        });

        // Convert kWh to TWh (Divide by 1 billion)
        const rawValues = [coal, oil, gas, nuclear, hydro, renewables].map(v => v / 1000000000);
        const totalTWh = rawValues.reduce((a, b) => a + b, 0);

        // Prepare data for D3
        const chartData = this.labels.map((label, i) => ({
            label: label,
            value: rawValues[i],
            color: this.colors[i],
            percent: totalTWh > 0 ? rawValues[i] / totalTWh : 0
        }));

        // 2. Setup SVG
        const container = d3.select(`#${this.elementId}`);
        container.selectAll('*').remove(); // Clear previous chart
        d3.select('.tooltip-donut').remove(); // Clear previous tooltips

        const width = containerNode.clientWidth || 500;
        const height = containerNode.clientHeight || 400;
        const margin = 40;

        const radius = Math.min(width, height) / 2 - margin;

        const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('background', 'transparent')
            .append('g')
            .attr('transform', `translate(${width / 2}, ${height / 2})`);

        // 3. Generators
        const pie = d3.pie()
            .value(d => d.value)
            .sort(null); // Keep order defined in arrays

        const arc = d3.arc()
            .innerRadius(radius * 0.6) // Hole size (0.6)
            .outerRadius(radius);

        const hoverArc = d3.arc()
            .innerRadius(radius * 0.6)
            .outerRadius(radius + 10); // Expands on hover

        // 4. Tooltip
        const tooltip = d3.select('body').append('div')
            .attr('class', 'tooltip-donut')
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
            .style('box-shadow', '0 4px 6px -1px rgba(0, 0, 0, 0.1)');

        // 5. Draw Slices
        const path = svg.selectAll('path')
            .data(pie(chartData))
            .enter()
            .append('path')
            .attr('d', arc)
            .attr('fill', d => d.data.color)
            .attr('stroke', '#ffffff')
            .attr('stroke-width', '2px')
            .on('mouseover', function(event, d) {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('d', hoverArc);

                tooltip.transition().duration(200).style('opacity', 1);
                
                tooltip.html(`
                    <b>${d.data.label}</b><br/>
                    Energy: ${d3.format(',.2f')(d.data.value)} TWh<br/>
                    Share: ${d3.format('.1%')(d.data.percent)}
                `)
                .style('left', (event.pageX + 15) + 'px')
                .style('top', (event.pageY - 28) + 'px');
            })
            .on('mousemove', function(event) {
                tooltip
                    .style('left', (event.pageX + 15) + 'px')
                    .style('top', (event.pageY - 28) + 'px');
            })
            .on('mouseout', function() {
                d3.select(this)
                    .transition()
                    .duration(200)
                    .attr('d', arc);
                
                tooltip.transition().duration(200).style('opacity', 0);
            });

        // 6. Labels inside slices
        svg.selectAll('text.slice-label')
            .data(pie(chartData))
            .enter()
            .append('text')
            .attr('class', 'slice-label')
            .attr('transform', d => `translate(${arc.centroid(d)})`)
            .style('text-anchor', 'middle')
            .style('font-family', 'Inter, sans-serif')
            .style('font-size', '11px')
            .style('fill', '#ffffff')
            .style('pointer-events', 'none') // Let mouse events pass through to slice
            .text(d => {
                // Only show label if slice is big enough (> 5%)
                if (d.endAngle - d.startAngle < 0.25) return '';
                return d.data.label;
            })
            .append('tspan')
            .attr('x', 0)
            .attr('dy', '1.2em')
            .text(d => {
                if (d.endAngle - d.startAngle < 0.25) return '';
                return d3.format('.0%')(d.data.percent);
            });

        // 7. Center Text (Year)
        const centerGroup = svg.append('g').attr('text-anchor', 'middle');

        centerGroup.append('text')
            .text(year)
            .attr('dy', '0.2em') // Center vertically
            .style('font-family', 'Inter, sans-serif')
            .style('font-size', '24px')
            .style('font-weight', '600')
            .style('fill', '#1e293b');

        centerGroup.append('text')
            .text('Year')
            .attr('dy', '1.5em') // Below the year
            .style('font-family', 'Inter, sans-serif')
            .style('font-size', '12px')
            .style('fill', '#64748b');
            
        // Title (Optional - appended to SVG top left)
        d3.select(`#${this.elementId} svg`)
            .append('text')
            .attr('x', width / 2)
            .attr('y', 25)
            .attr('text-anchor', 'middle')
            .style('font-family', 'Inter, sans-serif')
            .style('font-size', '16px')
            .style('fill', '#1e293b')
            .text('');
    }

    resize() {

        const container = document.getElementById(this.elementId);
        if(container && container.querySelector('g text')) {
             const yearText = container.querySelector('g text').textContent;
             if(yearText) this.update(parseInt(yearText));
        }
    }
}
