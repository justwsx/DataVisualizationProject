class EnergyIntensityChart {
    constructor(data) {
        this.data = data;
        this.elementId = 'chart-energy-intensity';

        this.countries = [
            'United States',
            'China',
            'Germany',
            'India'
        ];

        this.colors = {
            'United States': '#2b0dc2',
            'China': '#ff3300',
            'Germany': '#22c55e',
            'India': '#ffa200'
        };

        this.tooltip = d3.select("body").selectAll(".d3-tooltip").data([0]).join("div")
            .attr("class", "d3-tooltip")
            .style("opacity", 0);

        window.addEventListener('resize', () => this.draw());
    }

    update() {
        this.draw();
    }

    draw() {
        const container = document.getElementById(this.elementId);
        if (!container) return;

        // --- FIX VISIBILITÀ: Dimensioni Logiche Fisse ---
        // Invece di chiedere al browser quanto è largo (che spesso sbaglia o cambia),
        // definiamo noi una dimensione interna fissa. Il viewBox farà il resto.
        const logicalWidth = 800;
        const logicalHeight = 500;
        
        const margin = { top: 50, right: 120, bottom: 50, left: 60 };
        const w = logicalWidth - margin.left - margin.right;
        const h = logicalHeight - margin.top - margin.bottom;

        // Reset contenitore HTML
        container.style.width = '100%';
        container.style.height = 'auto'; // Lascia adattare l'altezza
        container.style.minHeight = '400px'; // Sicurezza
        container.innerHTML = '';

        // Dati
        const processedData = this.countries.map(country => {
            const values = this.data
                .filter(d => 
                    d.country === country && 
                    d.gdp > 0 && d.population > 0 && d.primary_energy_consumption > 0
                )
                .sort((a, b) => a.year - b.year)
                .map(d => ({
                    year: d.year,
                    value: d.primary_energy_consumption / (d.gdp / d.population),
                    original: d 
                }));
            return { country, values };
        }).filter(group => group.values.length > 0);

        // Scale (basate sulle dimensioni logiche fisse)
        const allYears = processedData.flatMap(d => d.values.map(v => v.year));
        const x = d3.scaleLinear().domain(d3.extent(allYears)).range([0, w]);

        const allValues = processedData.flatMap(d => d.values.map(v => v.value));
        const yMax = d3.max(allValues) || 1;
        const y = d3.scaleLinear().domain([0, yMax * 1.1]).range([h, 0]);

        // --- SVG con ViewBox ---
        // Qui avviene la magia: viewBox definisce le coordinate interne (800x500),
        // ma style width/height dicono al browser di occupare tutto lo spazio del div.
        const svg = d3.select(container).append("svg")
            .attr("viewBox", `0 0 ${logicalWidth} ${logicalHeight}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .style("width", "100%")
            .style("height", "100%") // Occupa tutto il div padre
            .style("max-height", "600px") // Limite per non diventare enorme su schermi giganti
            .style("font-family", "Inter, sans-serif")
            .append("g").attr('transform', `translate(${margin.left},${margin.top})`);

        // Assi
        svg.append("g").attr("transform", `translate(0,${h})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")).tickSize(-h))
            .call(g => g.selectAll("line").attr("stroke", "#e2e8f0").attr("stroke-dasharray", "2,2"))
            .call(g => g.select(".domain").attr("stroke", "#cbd5e1"))
            .call(g => g.selectAll("text").attr("fill", "#64748b"));

        svg.append("text").attr("x", w/2).attr("y", h + 40)
            .text("Year").attr("fill", "#64748b").attr("text-anchor", "middle").style("font-size", "13px");

        svg.append("g")
            .call(d3.axisLeft(y).tickSize(-w))
            .call(g => g.selectAll("line").attr("stroke", "#e2e8f0").attr("stroke-dasharray", "2,2"))
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll("text").attr("fill", "#64748b"));

        svg.append("text").attr("transform", "rotate(-90)").attr("y", -45).attr("x", -h/2)
            .text("Energy Intensity (Indicator)").attr("fill", "#1e293b").attr("text-anchor", "middle").style("font-size", "12px");

        svg.append("text").attr("x", w/2).attr("y", -20)
            .text("Energy Intensity over Time").attr("font-weight", "bold").attr("text-anchor", "middle").attr("fill", "#475569").style("font-size", "16px");

        // Linee
        const line = d3.line().x(d => x(d.year)).y(d => y(d.value));

        processedData.forEach(group => {
            const color = this.colors[group.country];
            const lastPoint = group.values[group.values.length - 1];

            // Linea visibile
            svg.append("path").datum(group.values)
                .attr("fill", "none").attr("stroke", color).attr("stroke-width", 3).attr("d", line);

            // Linea invisibile per hover facile
            svg.append("path").datum(group.values)
                .attr("fill", "none").attr("stroke", "transparent").attr("stroke-width", 15).attr("d", line)
                .on("mouseover", (e) => {
                    this.tooltip.style("opacity", 1).html(`<b>${group.country}</b>`)
                        .style("left", (e.pageX + 10) + "px").style("top", (e.pageY - 20) + "px");
                })
                .on("mouseout", () => this.tooltip.style("opacity", 0));

            // Punto finale
            svg.append("circle").attr("cx", x(lastPoint.year)).attr("cy", y(lastPoint.value))
                .attr("r", 5).attr("fill", color);

            // Etichetta
            svg.append("text").attr("x", x(lastPoint.year) + 10).attr("y", y(lastPoint.value) + 4)
                .text(group.country).attr("fill", color).style("font-size", "12px").style("font-weight", "bold");
        });
    }

    resize() { this.draw(); }
}