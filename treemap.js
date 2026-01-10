function initTreemap() {
    const container = d3.select("#treemap-container");
    const svg = container.append("svg").attr("width", width).attr("height", 600);
    const yearSel = d3.select("#treemapYear");
    const groupSel = d3.select("#treemapGroup");
    
    const years = [...new Set(dataset.map(d => d.year))].sort((a,b)=>b-a);
    yearSel.selectAll("option").data(years).enter().append("option").text(d=>d).attr("value",d=>d);
    yearSel.property("value", 2020);
    
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    
    function update() {
        const yr = +yearSel.property("value");
        const groupBy = groupSel.property("value");
        const yearData = dataset.filter(d => d.year === yr && d.primary_energy_consumption > 0);
        const grouped = d3.group(yearData, d => d[groupBy]);
        const hierarchyData = { name: "World", children: Array.from(grouped, ([key, values]) => ({ name: key, children: values.map(d => ({ name: d.country, value: d.primary_energy_consumption })) })) };
        
        const root = d3.hierarchy(hierarchyData).sum(d => d.value).sort((a, b) => b.value - a.value);
        d3.treemap().size([width, 600]).padding(2)(root);
        
        svg.selectAll("g").remove();
        const leaf = svg.selectAll("g").data(root.leaves()).enter().append("g").attr("transform", d => `translate(${d.x0},${d.y0})`);
        
        leaf.append("rect")
            .attr("width", d => d.x1 - d.x0).attr("height", d => d.y1 - d.y0)
            .attr("fill", d => color(d.parent.data.name)).attr("stroke", "#1a1a1a").style("opacity", 0.8)
            .on("mouseover", function() { d3.select(this).style("opacity", 1).attr("stroke", "#fff"); })
            .on("mouseout", function() { d3.select(this).style("opacity", 0.8).attr("stroke", "#1a1a1a"); });
        
        leaf.append("text").attr("x", 5).attr("y", 18).text(d => (d.x1 - d.x0 > 60) ? d.data.name : "").style("fill", "#fff").style("font-size", "11px");
    }
    yearSel.on("change", update); groupSel.on("change", update); update();
}