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

        // Mappatura Paesi (Incolla qui la tua lista completa se ne hai una più lunga)
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

        // Tooltip (Assicurati di avere il CSS aggiunto prima)
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
        const rect = container.getBoundingClientRect();
        
        // FIX: Impostiamo un'altezza minima di 500px se il container è troppo piccolo o collassato
        const height = Math.max(rect.height || 500, 500); 
        const width = rect.width || 800;

        // FIX: Aumentato bottom a 140 per far stare Asse X, Titolo asse e Legenda
        const margin = { top: 60, right: 40, bottom: 140, left: 60 };
        const w = width - margin.left - margin.right;
        const h = height - margin.top - margin.bottom;

        // Filtro Dati
        let dataset = this.data.filter(d => d.year === this.year);
        if (!dataset.length) dataset = this.data.filter(d => d.year === 2020);
        
        dataset = dataset
            .filter(d => d.primary_energy_consumption > 0 && d.gdp > 0)
            .sort((a, b) => (b.population||0) - (a.population||0)); // Bolle grandi sotto

        // SVG e Scale
        const svg = d3.select(container).append("svg")
            .attr("width", width).attr("height", height)
            .style("font-family", "Inter, sans-serif")
            .append("g").attr('transform', `translate(${margin.left},${margin.top})`);

        const x = d3.scaleLog().domain([1000, 300000]).range([0, w]).clamp(true);
        const y = d3.scaleLog().domain([50, 100000]).range([h, 0]).clamp(true);
        const r = d3.scaleSqrt().domain([0, 1e9]).range([3, 50]); 

        // Assi
        const formatK = d => d >= 1000 ? d/1000 + 'k' : d;

        // Asse X
        svg.append("g").attr("transform", `translate(0,${h})`)
            .call(d3.axisBottom(x).tickValues([1000, 5000, 10000, 50000, 100000]).tickFormat(formatK).tickSize(-h))
            .call(g => g.selectAll("line").attr("stroke", "#e2e8f0"))
            .call(g => g.select(".domain").attr("stroke", "#cbd5e1"));

        // Etichetta Asse X
        svg.append("text")
            .attr("x", w/2).attr("y", h + 40)
            .text("GDP per Capita ($)")
            .attr("fill", "#64748b").attr("text-anchor", "middle").style("font-size", "13px");

        // Asse Y
        svg.append("g")
            .call(d3.axisLeft(y).tickValues([100, 500, 1000, 5000, 10000, 50000, 100000]).tickFormat(formatK).tickSize(-w))
            .call(g => g.selectAll("line").attr("stroke", "#e2e8f0"))
            .call(g => g.select(".domain").remove());

        // Etichetta Asse Y
        svg.append("text")
            .attr("transform", "rotate(-90)").attr("y", -40).attr("x", -h/2)
            .text("Energy Consumption (kWh)")
            .attr("fill", "#64748b").attr("text-anchor", "middle").style("font-size", "13px");

        // Titolo
        svg.append("text")
            .attr("x", w/2).attr("y", -25)
            .text("Energy Consumption vs GDP")
            .attr("font-weight", "bold").attr("text-anchor", "middle").attr("fill", "#1e293b");

        // Bolle
        svg.selectAll("circle")
            .data(dataset).enter().append("circle")
            .attr("cx", d => x(d.gdp / 1e9)) // Assumendo GDP totale nel dataset originale
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

        // Legenda (Centrata in basso)
        const keys = Object.keys(this.colors);
        const itemW = 110; 
        const rowSize = Math.floor(w / itemW); // Quanti item per riga
        
        keys.forEach((key, i) => {
            const row = Math.floor(i / rowSize);
            const col = i % rowSize;
            const rowWidth = Math.min(keys.length - row * rowSize, rowSize) * itemW;
            const xBase = (w - rowWidth) / 2;
            
            // Posiziona la legenda più in basso (h + 70)
            const g = svg.append("g").attr("transform", `translate(${xBase + col * itemW}, ${h + 70 + row * 20})`);
            g.append("circle").attr("r", 5).attr("fill", this.colors[key]);
            g.append("text").attr("x", 10).attr("y", 4).text(key).style("font-size", "12px").attr("fill", "#64748b");
        });
    }

    resize() { this.draw(); }
}