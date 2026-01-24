class CO2EnergyChart {
    constructor(data) {
        this.data = data;
        this.elementId = 'chart-co2-energy';
        this.year = 2020;

        // Scala colori personalizzata (Verde -> Giallo -> Rosso)
        this.colorScale = d3.scaleLinear()
            .domain([0, 25, 50, 75, 90, 100])
            .range(['#22c55e', '#84cc16', '#eab308', '#f97316', '#dc2626', '#7f1d1d'])
            .clamp(true);

        // Tooltip
        this.tooltip = d3.select("body").selectAll(".d3-tooltip").data([0]).join("div")
            .attr("class", "d3-tooltip")
            .style("opacity", 0);

        // Observer per ridimensionamento
        const container = document.getElementById(this.elementId);
        if (container) {
            this.observer = new ResizeObserver(entries => {
                for (let entry of entries) {
                    if (entry.contentRect.width > 0) {
                        requestAnimationFrame(() => this.draw());
                    }
                }
            });
            this.observer.observe(container);
        }

        this.draw();
    }

    update(year) {
        this.year = year;
        this.draw();
    }

    draw() {
        const container = document.getElementById(this.elementId);
        if (!container) return;

        // 1. DIMENSIONI FISSE
        const fixedHeight = 600;
        container.style.width = '100%';
        container.style.height = `${fixedHeight}px`;
        container.style.minHeight = `${fixedHeight}px`;
        container.style.position = 'relative';
        container.innerHTML = '';

        const rect = container.getBoundingClientRect();
        const width = rect.width > 0 ? rect.width : 800;
        const height = fixedHeight;

        // Margini: Top ridotto (no titolo), Bottom aumentato (per asse X)
        const margin = { top: 20, right: 120, bottom: 100, left: 70 };
        const w = width - margin.left - margin.right;
        const h = height - margin.top - margin.bottom;

        // 2. DATI
        const yearData = this.data.filter(d => d.year === this.year && d.primary_energy_consumption > 0);
        const hasFossilData = yearData.some(d => d.fossil_fuel_consumption > 0);

        let traceData = yearData.map(d => {
            let intensity = null;
            if (hasFossilData && d.fossil_fuel_consumption > 0) {
                intensity = (d.fossil_fuel_consumption / d.primary_energy_consumption) * 100;
            } else {
                const fossil = (d.coal_cons_per_capita||0) + (d.gas_energy_per_capita||0) + (d.oil_energy_per_capita||0);
                const clean = (d.renewables_energy_per_capita||0) + (d.hydro_elec_per_capita||0) + (d.low_carbon_energy_per_capita||0);
                const total = fossil + clean;
                if (total > 0) intensity = (fossil / total) * 100;
            }
            return {
                country: d.country,
                energy: d.primary_energy_consumption,
                intensity: intensity !== null ? Math.min(Math.max(intensity, 0), 100) : null,
                population: d.population
            };
        })
        .filter(d => d.intensity !== null && d.intensity >= 0 && d.intensity <= 100 && d.population > 0)
        .sort((a, b) => b.population - a.population);

        // 3. SCALE
        const x = d3.scaleLog()
            .domain([100, 150000])
            .range([0, w])
            .clamp(true);

        const y = d3.scaleLinear()
            .domain([-5, 105])
            .range([h, 0]);

        const r = d3.scaleSqrt()
            .domain([0, 1.4e9])
            .range([4, 50]);

        // 4. SVG
        const svg = d3.select(container).append("svg")
            .attr("width", width)
            .attr("height", height)
            .style("display", "block")
            .style("font-family", "Inter, sans-serif")
            .append("g").attr('transform', `translate(${margin.left},${margin.top})`);

        // 5. ASSI
        const formatK = d => d >= 1000 ? d/1000 + 'k' : d;
        const xTicks = [100, 500, 1000, 5000, 10000, 50000, 100000];

        // Griglia X (Verticale)
        svg.append("g").attr("transform", `translate(0,${h})`)
            .call(d3.axisBottom(x).tickValues(xTicks).tickFormat("").tickSize(-h))
            .call(g => g.selectAll("line").attr("stroke", "#e2e8f0").attr("stroke-dasharray", "2,2"))
            .call(g => g.select(".domain").remove());

        // Griglia Y (Orizzontale)
        svg.append("g")
            .call(d3.axisLeft(y).tickValues([0, 20, 40, 60, 80, 100]).tickFormat("").tickSize(-w))
            .call(g => g.selectAll("line").attr("stroke", "#e2e8f0").attr("stroke-dasharray", "2,2"))
            .call(g => g.select(".domain").remove());

        // ASSE X (Etichette e Linea)
        svg.append("g").attr("transform", `translate(0,${h})`)
            .call(d3.axisBottom(x).tickValues(xTicks).tickFormat(formatK))
            .call(g => g.select(".domain").attr("stroke", "#cbd5e1").attr("stroke-width", 1)) // Linea asse visibile
            .call(g => g.selectAll("text").attr("fill", "#64748b").style("font-size", "11px").attr("dy", "10px")); // Spazio extra per le etichette

        svg.append("text").attr("x", w/2).attr("y", h + 45)
            .text("Primary Energy Consumption (kWh per capita)")
            .attr("fill", "#64748b").attr("text-anchor", "middle").style("font-size", "13px");

        // ASSE Y (Etichette)
        svg.append("g")
            .call(d3.axisLeft(y).tickValues([0, 20, 40, 60, 80, 100]).tickFormat(d => d + "%"))
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll("text").attr("fill", "#64748b").style("font-size", "11px"));

        svg.append("text").attr("transform", "rotate(-90)").attr("y", -50).attr("x", -h/2)
            .text("Carbon Intensity (%)").attr("fill", "#64748b").attr("text-anchor", "middle").style("font-size", "13px");

        // 6. BOLLE
        svg.selectAll("circle")
            .data(traceData).enter().append("circle")
            .attr("cx", d => x(d.energy))
            .attr("cy", d => y(d.intensity))
            .attr("r", d => r(d.population))
            .attr("fill", d => this.colorScale(d.intensity))
            .attr("fill-opacity", 0.85)
            .attr("stroke", "white").attr("stroke-width", 1)
            .on("mouseover", (e, d) => {
                d3.select(e.target).attr("stroke", "#333").attr("stroke-width", 2);
                this.tooltip.style("opacity", 1)
                    .html(`<b>${d.country}</b><br>
                           Intensity: ${d.intensity.toFixed(1)}%<br>
                           Energy: ${d3.format(",.0f")(d.energy)} kWh<br>
                           Pop: ${d3.format(",.0f")(d.population)}`)
                    .style("left", (e.pageX + 10) + "px").style("top", (e.pageY - 20) + "px");
            })
            .on("mouseout", (e) => {
                d3.select(e.target).attr("stroke", "white").attr("stroke-width", 1);
                this.tooltip.style("opacity", 0);
            });

        // 7. ANNOTAZIONI
        svg.append("rect").attr("x", 10).attr("y", 10).attr("width", 140).attr("height", 24).attr("fill", "rgba(255,255,255,0.9)").attr("stroke", "#e2e8f0");
        svg.append("text").attr("x", 20).attr("y", 26).text("Bubble size = Population").style("font-size", "11px").attr("fill", "#64748b");

        svg.append("rect").attr("x", w - 150).attr("y", h - 40).attr("width", 150).attr("height", 24).attr("fill", "rgba(255,255,255,0.9)").attr("stroke", "#e2e8f0");
        svg.append("text").attr("x", w - 140).attr("y", h - 24).text("Lower % = Cleaner Energy").style("font-size", "11px").attr("fill", "#059669");

        // 8. LEGENDA COLORBAR
        this.drawColorBar(svg, w, h);
    }

    drawColorBar(svg, w, h) {
        const defs = svg.append("defs");
        const linearGradient = defs.append("linearGradient")
            .attr("id", "intensity-gradient")
            .attr("x1", "0%").attr("y1", "100%")
            .attr("x2", "0%").attr("y2", "0%");

        const stops = [0, 25, 50, 75, 90, 100];
        stops.forEach(s => {
            linearGradient.append("stop").attr("offset", `${s}%`).attr("stop-color", this.colorScale(s));
        });

        const barWidth = 15;
        const barHeight = h * 0.6;
        const barX = w + 40;
        const barY = h * 0.2;

        const legendG = svg.append("g").attr("transform", `translate(${barX}, ${barY})`);

        legendG.append("text").attr("x", 0).attr("y", -10).text("Intensity").style("font-size", "11px").attr("fill", "#475569").style("font-weight", "bold");
        legendG.append("rect").attr("width", barWidth).attr("height", barHeight).style("fill", "url(#intensity-gradient)").attr("stroke", "#e2e8f0");

        const legendScale = d3.scaleLinear().domain([0, 100]).range([barHeight, 0]);
        const legendAxis = d3.axisRight(legendScale).tickValues([0, 20, 40, 60, 80, 100]).tickFormat(d => d + "%");

        legendG.append("g").attr("transform", `translate(${barWidth}, 0)`)
            .call(legendAxis).call(g => g.select(".domain").remove())
            .call(g => g.selectAll("text").style("font-size", "10px").attr("fill", "#64748b"));
    }

    resize() { this.draw(); }
}