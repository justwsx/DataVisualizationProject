function initLineRace() {
    const svg = d3.select("#linerace-container").append("svg").attr("width", width).attr("height", 600);
    const margin = {top: 30, right: 180, bottom: 50, left: 60};
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = 600 - margin.top - margin.bottom;
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    
    const years = [...new Set(dataset.map(d => d.year))].sort((a,b)=>a-b);
    const topCountries = [...new Set(dataset.filter(d => d.year === 2020).sort((a,b) => b.primary_energy_consumption - a.primary_energy_consumption).slice(0, 10).map(d => d.country))];
    
    const x = d3.scaleLinear().domain([years[0], years[years.length-1]]).range([0, innerWidth]);
    const y = d3.scaleLinear().range([innerHeight, 0]);
    const color = d3.scaleOrdinal(d3.schemeCategory10).domain(topCountries);
    const line = d3.line().x(d => x(d.year)).y(d => y(d.value)).curve(d3.curveMonotoneX);
    
    g.append("g").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(x).tickFormat(d3.format("d")));
    const yAxis = g.append("g");
    const paths = g.append("g");
    const labels = g.append("g");
    
    let currentYear = years[0];
    let animationInterval = null;
    
    function update(maxYear) {
        const data = topCountries.map(country => ({ country, values: dataset.filter(d => d.country === country && d.year <= maxYear).map(d => ({ year: d.year, value: d.primary_energy_consumption })).sort((a,b) => a.year - b.year) }));
        y.domain([0, d3.max(data, d => d3.max(d.values, v => v.value)) || 1]);
        yAxis.transition().duration(300).call(d3.axisLeft(y).ticks(5));
        
        const ps = paths.selectAll("path").data(data, d => d.country);
        ps.enter().append("path").attr("fill", "none").attr("stroke", d => color(d.country)).attr("stroke-width", 3).attr("opacity", 0.8)
            .merge(ps).transition().duration(300).attr("d", d => line(d.values));
        
        const ls = labels.selectAll("text").data(data, d => d.country);
        ls.enter().append("text").attr("fill", d => color(d.country)).style("font-weight", "bold")
            .merge(ls).transition().duration(300).attr("x", innerWidth + 10).attr("y", d => d.values.length ? y(d.values[d.values.length-1].value) + 5 : 0).text(d => d.country);
        
        svg.selectAll(".year-label").remove();
        svg.append("text").attr("class", "year-label").attr("x", width - 100).attr("y", 40).attr("fill", "#89CFF0").style("font-size", "32px").text(maxYear);
    }
    
    d3.select("#btnLineRacePlay").on("click", () => {
        if (animationInterval) return;
        animationInterval = setInterval(() => { update(currentYear); currentYear++; if (currentYear > years[years.length-1]) clearInterval(animationInterval); }, 400);
    });
    d3.select("#btnLineRaceReset").on("click", () => { clearInterval(animationInterval); animationInterval = null; currentYear = years[0]; update(currentYear); });
    update(years[0]);
}