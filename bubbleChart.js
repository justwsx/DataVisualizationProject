function initBubbleChart() {
    const svg = d3.select("#bc-chart-container").append("svg")
        .attr("width", width).attr("height", height);
    
    const margin = {top: 40, right: 40, bottom: 60, left: 80};
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLog().range([0, innerWidth]).domain([1e9, 2e13]);
    const yScale = d3.scaleLog().range([innerHeight, 0]).domain([10, 50000]);
    const rScale = d3.scaleSqrt().range([4, 40]).domain([0, 1.4e9]);
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const xAxis = g.append("g").attr("transform", `translate(0,${innerHeight})`);
    const yAxis = g.append("g");
    
    xAxis.call(d3.axisBottom(xScale).ticks(5, "~s"));
    yAxis.call(d3.axisLeft(yScale).ticks(5, "~s"));
    
    g.append("text").attr("x", innerWidth/2).attr("y", innerHeight + 45).attr("fill", "#fff").attr("text-anchor", "middle").text("GDP (USD)");
    g.append("text").attr("transform", "rotate(-90)").attr("x", -innerHeight/2).attr("y", -50).attr("fill", "#fff").attr("text-anchor", "middle").text("Primary Energy (TWh)");

    const tooltip = d3.select("#bubble-tooltip");
    const filter = d3.select("#yearFilter");
    const years = [...new Set(dataset.map(d => d.year))].sort((a,b)=>a-b);
    filter.selectAll("option").data(years).enter().append("option").text(d=>d).attr("value", d=>d);
    filter.property("value", 2018);

    function update(yr) {
        const dataYear = dataset.filter(d => d.year === yr && d.gdp > 0 && d.primary_energy_consumption > 0);
        const circles = g.selectAll("circle").data(dataYear, d => d.country);
        
        circles.enter().append("circle")
            .attr("cx", d => xScale(d.gdp))
            .attr("cy", d => yScale(d.primary_energy_consumption))
            .attr("r", 0)
            .attr("fill", d => color(d.country))
            .attr("opacity", 0.7)
            .attr("stroke", "#fff")
            .on("mouseover", function(event, d) {
                d3.select(this).transition().duration(200).attr("opacity", 1).attr("stroke-width", 3);
                tooltip.style("opacity", 1).html(`<strong>${d.country}</strong><br/>GDP: $${(d.gdp/1e12).toFixed(2)}T<br/>Energy: ${d.primary_energy_consumption.toFixed(1)} TWh`).style("left", (event.pageX + 10) + "px").style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).transition().duration(200).attr("opacity", 0.7).attr("stroke-width", 1);
                tooltip.style("opacity", 0);
            })
            .merge(circles)
            .transition().duration(1000)
            .attr("cx", d => xScale(d.gdp))
            .attr("cy", d => yScale(d.primary_energy_consumption))
            .attr("r", d => rScale(d.population));
            
        circles.exit().transition().duration(500).attr("r", 0).remove();
    }

    filter.on("change", function() { update(+this.value); });
    update(2018);
    
    let animating = false;
    d3.select("#btnPlay").on("click", () => {
        if (animating) return;
        animating = true;
        let y = 1990;
        const interval = setInterval(() => {
            if (y > 2020) { clearInterval(interval); animating = false; return; }
            filter.property("value", y); update(y); y++;
        }, 500);
    });
}