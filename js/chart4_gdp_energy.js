class GDPEnergyChart {
    constructor(data) {
        this.data = data;
        this.containerId = 'chart-gdp-energy';
        this.year = 2020;

        this.colors = {
            "Africa": "#dc2626", "Asia": "#0891b2", "Europe": "#7c3aed",
            "North America": "#ea580c", "South America": "#16a34a",
            "Oceania": "#eaa400", "Other": "#6b7280"
        };

        // Tua lista completa delle region
        this.regions = {
            "United States": "North America", "Canada": "North America", "Mexico": "North America",
            "Brazil": "South America", "Argentina": "South America", "Chile": "South America",
            "United Kingdom": "Europe", "Germany": "Europe", "France": "Europe", "Italy": "Europe",
            "Poland": "Europe", "Russia": "Asia", "Turkey": "Asia", "Spain": "Europe",
            "Netherlands": "Europe", "Belgium": "Europe", "Sweden": "Europe", "Norway": "Europe",
            "Switzerland": "Europe", "China": "Asia", "India": "Asia", "Japan": "Asia",
            "South Korea": "Asia", "Indonesia": "Asia", "Thailand": "Asia", "Saudi Arabia": "Asia",
            "Iran": "Asia", "Vietnam": "Asia", "Pakistan": "Asia", "Bangladesh": "Asia",
            "Australia": "Oceania", "South Africa": "Africa", "Egypt": "Africa",
            "Nigeria": "Africa", "Kenya": "Africa", "Morocco": "Africa"
        };

        this.tooltip = d3.select("body").append("div")
            .attr("class", "d3-tooltip")
            .style("opacity", 0);

        window.addEventListener('resize', () => this.draw());
    }

    getRegion(country) {
        return this.regions[country] || 'Other';
    }

    update(year) {
        this.year = year;
        this.draw();
    }

    draw() {
        const container = document.getElementById(this.containerId);
        if (!container) return;
        container.innerHTML = '';

        // --- CAMBIAMENTO CRUCIALE: Dimensioni Logiche Fisse ---
        // Definiamo una tela virtuale comoda dove tutto ci sta sicuro.
        // Il browser poi la ridimensionerà (zoom) per adattarla al div.
        const logicalWidth = 800;
        const logicalHeight = 600; // Abbondiamo in altezza
        const margin = { top: 60, right: 40, bottom: 160, left: 70 }; // Bottom 160px per legenda comoda
        
        const w = logicalWidth - margin.left - margin.right;
        const h = logicalHeight - margin.top - margin.bottom;

        // Filtro Dati
        let dataset = this.data.filter(d => d.year === this.year);
        if (!dataset.length) dataset = this.data.filter(d => d.year === 2020);
        
        dataset = dataset
            .filter(d => d.primary_energy_consumption > 0 && d.gdp > 0)
            .sort((a, b) => (b.population||0) - (a.population||0));

        // Creazione SVG con viewBox (Responsive reale)
        const svg = d3.select(container).append("svg")
            .attr("viewBox", `0 0 ${logicalWidth} ${logicalHeight}`)
            .attr("preserveAspectRatio", "xMidYMid meet")
            .style("width", "100%")
            .style("height", "auto") // Lascia che l'altezza si adatti alla larghezza
            .style("font-family", "Inter, sans-serif")
            .append("g").attr('transform', `translate(${margin.left},${margin.top})`);

        // Scale
        const x = d3.scaleLog().domain([1000, 300000]).range([0, w]).clamp(true);
        const y = d3.scaleLog().domain([50, 100000]).range([h, 0]).clamp(true);
        const r = d3.scaleSqrt().domain([0, 1e9]).range([3, 50]); 

        // Assi
        const formatK = d => d >= 1000 ? d/1000 + 'k' : d;

        svg.append("g").attr("transform", `translate(0,${h})`)
            .call(d3.axisBottom(x).tickValues([1000, 5000, 10000, 50000, 100000]).tickFormat(formatK).tickSize(-h))
            .call(g => g.selectAll("line").attr("stroke", "#e2e8f0"))
            .call(g => g.select(".domain").attr("stroke", "#cbd5e1"));

        svg.append("text").attr("x", w/2).attr("y", h + 45)
            .text("GDP per Capita ($)")
            .attr("fill", "#64748b").attr("text-anchor", "middle").style("font-size", "14px");

        svg.append("g")
            .call(d3.axisLeft(y).tickValues([100, 500, 1000, 5000, 10000, 50000, 100000]).tickFormat(formatK).tickSize(-w))
            .call(g => g.selectAll("line").attr("stroke", "#e2e8f0"))
            .call(g => g.select(".domain").remove());

        svg.append("text").attr("transform", "rotate(-90)").attr("y", -50).attr("x", -h/2)
            .text("Energy Consumption (kWh)")
            .attr("fill", "#64748b").attr("text-anchor", "middle").style("font-size", "14px");

        // Titolo
        svg.append("text").attr("x", w/2).attr("y", -25)
            .text("Energy Consumption vs GDP")
            .attr("font-weight", "bold").attr("text-anchor", "middle").attr("fill", "#1e293b").style("font-size", "18px");

        // Bolle
        svg.selectAll("circle")
            .data(dataset).enter().append("circle")
            .attr("cx", d => x(d.gdp / 1e9)) // Nota: Assicurati che questo calcolo sia coerente con i tuoi dati
            .attr("cy", d => y(d.primary_energy_consumption))
            .attr("r", d => r(d.population || 0))
            .attr("fill", d => this.colors[this.getRegion(d.country)] || '#6b7280')
            .attr("stroke", "white").attr("fill-opacity", 0.85)
            .on("mouseover", (e, d) => {
                d3.select(e.target).attr("stroke", "#333").attr("stroke-width", 2);
                this.tooltip.style("opacity", 1)
                    .html(`<b>${d.country}</b><br>GDP: $${d3.format(",.0f")(d.gdp/1e9)}B<br>Energy: ${d3.format(",.0f")(d.primary_energy_consumption)}`)
                    .style("left", (e.pageX + 10) + "px").style("top", (e.pageY - 20) + "px");
            })
            .on("mouseout", (e) => {
                d3.select(e.target).attr("stroke", "white").attr("stroke-width", 1);
                this.tooltip.style("opacity", 0);
            });

        // Legenda (Ora ha molto spazio sotto)
        const keys = Object.keys(this.colors);
        const itemW = 120; 
        const rowSize = Math.floor(w / itemW);
        
        keys.forEach((key, i) => {
            const row = Math.floor(i / rowSize);
            const col = i % rowSize;
            const rowWidth = Math.min(keys.length - row * rowSize, rowSize) * itemW;
            const xBase = (w - rowWidth) / 2;
            
            // Spostiamo la legenda ben sotto l'asse X (h + 80)
            const g = svg.append("g").attr("transform", `translate(${xBase + col * itemW}, ${h + 80 + row * 25})`);
            g.append("circle").attr("r", 6).attr("fill", this.colors[key]);
            g.append("text").attr("x", 12).attr("y", 5).text(key).style("font-size", "12px").attr("fill", "#64748b");
        });
    }

    resize() { this.draw(); }
}