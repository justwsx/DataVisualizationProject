class EnergyMapChart {
    constructor(data) {
        this.data = data;
        this.elementId = '#chart-map';
        this.width = 0;
        this.height = 0;
        this.svg = null;
        this.g = null;
        this.currentYear = null;
        this.countriesGeo = null;

        this.markersData = [
            { text: '🔥', lon: -98.5, lat: 39.8, label: 'United States<br>Dominant Energy Structure: Natural Gas' },
            { text: '⚫', lon: 104.2, lat: 35.9, label: 'China<br>Dominant Energy Structure: Coal' }
        ];

        window.addEventListener('resize', () => this.resize());
        
        this.init();
    }

    async init() {
        const container = d3.select(this.elementId);
        if (container.empty()) return;

        const node = container.node();
        this.width = node.getBoundingClientRect().width;
        this.height = 600;

        this.svg = container.append("svg")
            .attr("width", this.width)
            .attr("height", this.height)
            .attr("viewBox", [0, 0, this.width, this.height])
            .style("max-width", "100%")
            .style("height", "auto")
            .style("font-family", "Inter, sans-serif");

        const defs = this.svg.append("defs");
        const linearGradient = defs.append("linearGradient")
            .attr("id", "linear-gradient");

        const colors = ['#22c55e', '#84cc16', '#fbbf24', '#f97316', '#dc2626'];
        
        linearGradient.selectAll("stop")
            .data([
                {offset: "0%", color: colors[0]},
                {offset: "30%", color: colors[1]},
                {offset: "50%", color: colors[2]},
                {offset: "70%", color: colors[3]},
                {offset: "100%", color: colors[4]}
            ])
            .enter().append("stop")
            .attr("offset", d => d.offset)
            .attr("stop-color", d => d.color);

        this.g = this.svg.append("g");

        // FIX: Append tooltip to body to avoid overflow issues
        this.tooltip = d3.select("body").append("div")
            .attr("class", "map-tooltip")
            .style("position", "absolute")
            .style("background", "rgba(255, 255, 255, 0.95)")
            .style("padding", "8px 12px")
            .style("border", "1px solid #e2e8f0")
            .style("border-radius", "4px")
            .style("pointer-events", "none")
            .style("font-family", "Inter, sans-serif")
            .style("font-size", "12px")
            .style("box-shadow", "0 4px 6px -1px rgba(0, 0, 0, 0.1)")
            .style("z-index", "9999")
            .style("opacity", 0);

        try {
            const world = await d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json");
            this.countriesGeo = topojson.feature(world, world.objects.countries);
            
            if (this.currentYear) {
                this.update(this.currentYear);
            }
        } catch (error) {
            console.error("Error loading map data:", error);
        }
    }

    update(year) {
        this.currentYear = year;
        
        if (!this.countriesGeo) {
            setTimeout(() => this.update(year), 500);
            return;
        }

        let yearData = this.data.filter(d => d.year === year);

        yearData.sort((a, b) => b.primary_energy_consumption - a.primary_energy_consumption);
        const top50Data = yearData.slice(0, 50);

        const dataMap = new Map();
        top50Data.forEach(d => {
            dataMap.set(d.country, d.primary_energy_consumption);
        });

        const projection = d3.geoNaturalEarth1()
            .fitSize([this.width, this.height], this.countriesGeo);
        
        const path = d3.geoPath().projection(projection);

        const values = top50Data.map(d => d.primary_energy_consumption);
        const minVal = d3.min(values) || 0;
        const maxVal = d3.max(values) || 100000;

        const colorScale = d3.scaleLinear()
            .domain([
                minVal,
                minVal + 0.3 * (maxVal - minVal),
                minVal + 0.5 * (maxVal - minVal),
                minVal + 0.7 * (maxVal - minVal),
                maxVal
            ])
            .range(['#22c55e', '#84cc16', '#fbbf24', '#f97316', '#dc2626'])
            .clamp(true);

        this.g.selectAll("path.country")
            .data(this.countriesGeo.features)
            .join("path")
            .attr("class", "country")
            .attr("d", path)
            .attr("fill", d => {
                const countryName = d.properties.name;
                let value = dataMap.get(countryName);
                
                if (value === undefined) {
                     const fuzzyMatch = top50Data.find(row => row.country.includes(countryName) || countryName.includes(row.country));
                     if(fuzzyMatch) value = fuzzyMatch.primary_energy_consumption;
                }

                return value ? colorScale(value) : "#f1f5f9";
            })
            .attr("stroke", "#ffffff")
            .attr("stroke-width", 0.5)
            .on("mouseover", (event, d) => {
                const countryName = d.properties.name;
                let val = dataMap.get(countryName);
                
                if (val === undefined) {
                     const fuzzyMatch = top50Data.find(row => row.country.includes(countryName) || countryName.includes(row.country));
                     if(fuzzyMatch) val = fuzzyMatch.primary_energy_consumption;
                }

                d3.select(event.currentTarget)
                    .attr("stroke", "#333")
                    .attr("stroke-width", 1);
                
                const valText = val ? `${d3.format(".2s")(val)} kWh/person` : "Not in Top 50";

                this.tooltip.style("opacity", 1)
                    .html(`<b>${countryName}</b><br>Energy: ${valText}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", (event) => {
                d3.select(event.currentTarget)
                    .attr("stroke", "#ffffff")
                    .attr("stroke-width", 0.5);
                this.tooltip.style("opacity", 0);
            });

        this.g.selectAll("text.marker-icon")
            .data(this.markersData)
            .join("text")
            .attr("class", "marker-icon")
            .attr("x", d => projection([d.lon, d.lat])[0])
            .attr("y", d => projection([d.lon, d.lat])[1])
            .text(d => d.text)
            .attr("font-size", "24px")
            .attr("text-anchor", "middle")
            .attr("dominant-baseline", "middle")
            .style("cursor", "pointer")
            .on("mouseover", (event, d) => {
                this.tooltip.style("opacity", 1)
                    .html(d.label)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", () => this.tooltip.style("opacity", 0));

        this.addTitle(year);
        this.updateLegends(minVal, maxVal);
    }

    updateLegends(min, max) {
        this.svg.selectAll(".legend-group").remove();

        const legendWidth = 200;
        const legendHeight = 15;
        
        const legendX = this.width - legendWidth - 30;
        const legendY = this.height - 100; 

        const legendGroup = this.svg.append("g")
            .attr("class", "legend-group")
            .attr("transform", `translate(${legendX}, ${legendY})`);

        legendGroup.append("rect")
            .attr("width", legendWidth)
            .attr("height", legendHeight)
            .style("fill", "url(#linear-gradient)");

        legendGroup.append("text")
            .attr("x", 0)
            .attr("y", -10)
            .text("kWh per Capita")
            .style("font-size", "12px")
            .style("font-weight", "bold")
            .style("fill", "#333");

        const legendScale = d3.scaleLinear()
            .domain([min, max])
            .range([0, legendWidth]);

        const legendAxis = d3.axisBottom(legendScale)
            .ticks(4)
            .tickFormat(d3.format(".2s"))
            .tickSize(6);

        legendGroup.append("g")
            .attr("transform", `translate(0, ${legendHeight})`)
            .call(legendAxis)
            .select(".domain").remove();

        const symbolGroup = this.svg.append("g")
            .attr("class", "legend-group")
            .attr("transform", `translate(20, ${this.height - 140})`);
            
        symbolGroup.append("rect")
            .attr("width", 220)
            .attr("height", 85)
            .attr("fill", "rgba(255,255,255,0.85)")
            .attr("rx", 5)
            .style("stroke", "#e2e8f0")
            .style("stroke-width", "1px");

        symbolGroup.append("text")
            .attr("x", 10)
            .attr("y", 25)
            .text("Symbol Legend")
            .style("font-weight", "bold")
            .style("font-size", "13px")
            .style("fill", "#1e293b");

        symbolGroup.append("text").attr("x", 15).attr("y", 50).text("🔥").style("font-size", "16px");
        symbolGroup.append("text").attr("x", 40).attr("y", 50).text("Natural Gas Dominant")
            .style("font-size", "12px").style("alignment-baseline", "middle").style("fill", "#334155");

        symbolGroup.append("text").attr("x", 15).attr("y", 75).text("⚫").style("font-size", "16px");
        symbolGroup.append("text").attr("x", 40).attr("y", 75).text("Coal Dominant")
            .style("font-size", "12px").style("alignment-baseline", "middle").style("fill", "#334155");
    }

    addTitle(year) {
        this.svg.selectAll(".chart-title").remove();
        this.svg.append("text")
            .attr("class", "chart-title")
            .attr("x", this.width / 2)
            .attr("y", 30)
            .attr("text-anchor", "middle")
            .style("font-size", "18px")
            .style("fill", "#b8cff3")
            .style("font-weight", "bold")
            .text(` (${year})`);
    }

    resize() {
        const container = d3.select(this.elementId);
        if (container.empty()) return;

        const node = container.node();
        this.width = node.getBoundingClientRect().width;
        
        this.svg
            .attr("width", this.width)
            .attr("viewBox", [0, 0, this.width, this.height]);

        if (this.currentYear) {
            this.update(this.currentYear);
        }
    }
}
