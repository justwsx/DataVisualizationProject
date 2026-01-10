function initParetoChart() {
    const svg = d3.select("#pareto-chart-container").append("svg")
        .attr("width", width).attr("height", height);
    
    const margin = {top: 20, right: 20, bottom: 120, left: 70};
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    
    const x = d3.scaleBand().range([0, innerWidth]).padding(0.2);
    const y = d3.scaleLinear().range([innerHeight, 0]);
    
    const xAxisGroup = g.append("g").attr("transform", `translate(0,${innerHeight})`);
    const yAxisGroup = g.append("g");
    
    const tooltip = d3.select("#pareto-tooltip");
    const typeSel = d3.select("#consumptionSelect");
    const yearSel = d3.select("#yearSelectPareto");
    
    const years = [...new Set(dataset.map(d => d.year))].sort((a,b)=>b-a);
    yearSel.selectAll("option").data(years).enter()
        .append("option").text(d=>d).attr("value",d=>d);
    yearSel.property("value", 2020);

    function update() {
        const type = typeSel.property("value");
        const yr = +yearSel.property("value");
        
        let data = dataset
            .filter(d => d.year === yr && d[type] > 0)
            .sort((a,b) => b[type] - a[type])
            .slice(0, 20);
            
        x.domain(data.map(d => d.country));
        y.domain([0, d3.max(data, d => d[type]) || 1]);
        
        const bars = g.selectAll(".bar").data(data, d => d.country);
        
        bars.enter().append("rect")
            .attr("class", "bar")
            .attr("fill", "steelblue")
            .attr("x", d => x(d.country))
            .attr("width", x.bandwidth())
            .attr("y", innerHeight)
            .attr("height", 0)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("fill", "#3498db");
                tooltip.style("opacity", 1)
                    .html(`<strong>${d.country}</strong><br/>${type}: ${d[type].toFixed(1)}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).attr("fill", "steelblue");
                tooltip.style("opacity", 0);
            })
            .merge(bars)
            .transition().duration(750)
            .attr("x", d => x(d.country))
            .attr("width", x.bandwidth())
            .attr("y", d => y(d[type]))
            .attr("height", d => innerHeight - y(d[type]));
            
        bars.exit().transition().duration(500).attr("height", 0).attr("y", innerHeight).remove();
        
        xAxisGroup.transition().duration(750).call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end")
            .style("font-size", "11px");
        
        yAxisGroup.transition().duration(750).call(d3.axisLeft(y).ticks(5));
    }
    
    typeSel.on("change", update);
    yearSel.on("change", update);
    update();
}