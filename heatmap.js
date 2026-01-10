function initHeatmap() {
    const container = d3.select("#heatmap-container");
    const svg = container.append("svg").attr("width", width).attr("height", 500);
    
    const margin = {top: 20, right: 20, bottom: 80, left: 150};
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = 500 - margin.top - margin.bottom;
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    
    const tooltip = d3.select("#heatmap-tooltip");
    const yearSel = d3.select("#heatmapYear");
    
    function update() {
        const range = yearSel.property("value").split("-").map(Number);
        const [startYear, endYear] = range;
        
        const years = d3.range(startYear, endYear + 1);
        const topCountries = [...new Set(
            dataset.filter(d => d.year === endYear && d.primary_energy_consumption > 0)
                .sort((a,b) => b.primary_energy_consumption - a.primary_energy_consumption)
                .slice(0, 20)
                .map(d => d.country)
        )];
        
        const data = [];
        topCountries.forEach(country => {
            years.forEach(year => {
                const row = dataset.find(d => d.country === country && d.year === year);
                if (row) {
                    const intensity = row.gdp > 0 ? (row.primary_energy_consumption / row.gdp) * 1e12 : 0;
                    data.push({ country, year, value: intensity });
                }
            });
        });
        
        const x = d3.scaleBand().range([0, innerWidth]).domain(years).padding(0.05);
        const y = d3.scaleBand().range([0, innerHeight]).domain(topCountries).padding(0.05);
        const color = d3.scaleSequential(d3.interpolateRdYlGn).domain([d3.max(data, d => d.value) || 100, 0]);
        
        g.selectAll("*").remove();
        
        g.selectAll("rect").data(data).enter().append("rect")
            .attr("x", d => x(d.year)).attr("y", d => y(d.country))
            .attr("width", x.bandwidth()).attr("height", y.bandwidth())
            .attr("fill", d => color(d.value))
            .attr("stroke", "#1a1a1a")
            .on("mouseover", function(event, d) {
                d3.select(this).attr("stroke", "#fff").attr("stroke-width", 2);
                tooltip.style("opacity", 1).html(`<strong>${d.country} (${d.year})</strong><br/>Intensity: ${d.value.toFixed(2)}`)
                    .style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", function() { d3.select(this).attr("stroke", "#1a1a1a").attr("stroke-width", 1); tooltip.style("opacity", 0); });
        
        g.append("g").call(d3.axisLeft(y)).selectAll("text").style("font-size", "11px");
        g.append("g").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(x).tickFormat(d3.format("d")))
            .selectAll("text").attr("transform", "rotate(-45)").style("text-anchor", "end");
    }
    yearSel.on("change", update);
    update();
}