function initStackedAreaChart() {
    const countriesWithData = [...new Set(dataset.filter(d => d.primary_energy_consumption > 0).map(d => d.country))].sort();
    const sel = d3.select("#countrySelectSAC");
    sel.selectAll("option").data(countriesWithData).enter().append("option").text(d=>d).attr("value",d=>d);
    sel.property("value", "United States");

    const svg = d3.select("#sac-chart-container").append("svg").attr("width", width).attr("height", height);
    const margin = {top: 20, right: 150, bottom: 50, left: 60};
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    
    const keys = ["coal_consumption", "oil_consumption", "gas_consumption", "nuclear_consumption", "renewables_consumption"];
    const colors = d3.scaleOrdinal().domain(keys).range(["#555", "#c0392b", "#e67e22", "#8e44ad", "#27ae60"]);
    
    const x = d3.scaleLinear().range([0, innerWidth]);
    const y = d3.scaleLinear().range([innerHeight, 0]);
    const xAxis = g.append("g").attr("transform", `translate(0,${innerHeight})`);
    const yAxis = g.append("g");
    const area = d3.area().x(d => x(d.data.year)).y0(d => y(d[0])).y1(d => y(d[1])).curve(d3.curveMonotoneX);
    const tooltip = d3.select("#sac-tooltip");

    function update(cntry) {
        const data = dataset.filter(d => d.country === cntry).sort((a,b)=>a.year - b.year);
        if (data.length === 0) { g.selectAll("path").remove(); return; }
        
        const stackedData = d3.stack().keys(keys)(data);
        x.domain(d3.extent(data, d => d.year));
        y.domain([0, d3.max(stackedData[stackedData.length-1], d => d[1]) || 1]);
        
        xAxis.transition().duration(750).call(d3.axisBottom(x).tickFormat(d3.format("d")));
        yAxis.transition().duration(750).call(d3.axisLeft(y).ticks(5));
        
        const paths = g.selectAll("path").data(stackedData);
        paths.enter().append("path")
            .attr("fill", d => colors(d.key))
            .attr("opacity", 0.8)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("opacity", 1);
                tooltip.style("opacity", 1).html(`<strong>${d.key.replace("_consumption", "").toUpperCase()}</strong>`)
                    .style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", function() { d3.select(this).attr("opacity", 0.8); tooltip.style("opacity", 0); })
            .merge(paths).transition().duration(1000).attr("d", area);
        paths.exit().remove();
        
        // Legenda
        svg.selectAll(".legend").remove();
        const legend = svg.selectAll(".legend").data(keys).enter().append("g").attr("class", "legend")
            .attr("transform", (d,i) => `translate(${width - 140}, ${i*25 + 30})`);
        legend.append("rect").attr("width", 15).attr("height", 15).attr("fill", d => colors(d));
        legend.append("text").attr("x", 20).attr("y", 12).text(d => d.replace("_consumption", "")).attr("fill", "white").style("font-size", "12px");
    }
    sel.on("change", function() { update(this.value); });
    update("United States");
}