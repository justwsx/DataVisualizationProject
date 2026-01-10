function initSankey() {
    const svg = d3.select("#sankey-container").append("svg").attr("width", width).attr("height", 700);
    const yearSel = d3.select("#sankeyYear");
    const years = [...new Set(dataset.map(d => d.year))].sort((a,b)=>b-a);
    yearSel.selectAll("option").data(years).enter().append("option").text(d=>d).attr("value",d=>d);
    yearSel.property("value", 2020);
    
    function update() {
        const yr = +yearSel.property("value");
        const yearData = dataset.filter(d => d.year === yr);
        const sources = ['Coal', 'Oil', 'Gas', 'Nuclear', 'Renewables'];
        const regions = [...new Set(yearData.map(d => d.continent))].filter(r => r !== 'Other');
        const nodes = [...sources, ...regions].map((name, i) => ({ name, id: i }));
        const links = [];
        
        sources.forEach(source => {
            const field = source.toLowerCase() + '_consumption';
            regions.forEach(region => {
                const total = d3.sum(yearData.filter(d => d.continent === region), d => d[field] || 0);
                if (total > 0) links.push({ source: nodes.find(n => n.name === source).id, target: nodes.find(n => n.name === region).id, value: total });
            });
        });
        
        svg.selectAll("*").remove();
        const color = d3.scaleOrdinal(d3.schemeCategory10);
        nodes.forEach((node, i) => {
            node.x = (i < sources.length) ? 50 : width - 70;
            node.y = 50 + (i < sources.length ? i * (600/sources.length) : (i-sources.length) * (600/regions.length));
            node.width = 20; node.height = 40;
        });
        
        svg.append("g").selectAll("path").data(links).enter().append("path")
            .attr("d", d => {
                const s = nodes[d.source], t = nodes[d.target];
                return `M${s.x+20},${s.y+20} C${(s.x+t.x)/2},${s.y+20} ${(s.x+t.x)/2},${t.y+20} ${t.x},${t.y+20}`;
            })
            .attr("fill", "none").attr("stroke", d => color(d.source)).attr("stroke-width", d => Math.max(1, d.value/50)).attr("opacity", 0.4);
        
        svg.append("g").selectAll("rect").data(nodes).enter().append("rect")
            .attr("x", d => d.x).attr("y", d => d.y).attr("width", 20).attr("height", 40).attr("fill", (d,i) => color(i));
        
        svg.append("g").selectAll("text").data(nodes).enter().append("text")
            .attr("x", d => d.x < width/2 ? d.x - 10 : d.x + 30).attr("y", d => d.y + 25)
            .attr("text-anchor", d => d.x < width/2 ? "end" : "start").attr("fill", "#fff").text(d => d.name);
    }
    yearSel.on("change", update); update();
}