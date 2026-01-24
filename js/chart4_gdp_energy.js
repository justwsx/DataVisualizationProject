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

        // Tooltip
        this.tooltip = d3.select("body").selectAll(".d3-tooltip").data([0]).join("div")
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

        // --- FIX ALTEZZA (Maniere forti) ---
        container.style.height = '600px'; 
        container.style.minHeight = '600px';
        container.style.width = '100%';
        container.style.overflow = 'hidden';
        container.innerHTML = '';

        const width = container.offsetWidth || 800;
        const height = 600; 
        
        const margin = { top: 50, right: 30, bottom: 150, left: 70 };
        const w = width - margin.left - margin.right;
        const h = height - margin.top - margin.bottom;

        // Filtro dati
        let dataset = this.data.filter(d => d.year === this.year);
        if (!dataset.length) dataset = this.data.filter(d => d.year === 2020);
        
        dataset = dataset
            .filter(d => d.primary_energy_consumption > 0 && d.gdp > 0)
            .sort((a, b) => (b.population||0) - (a.population||0));

        const svg = d3.select(container).append("svg")
            .attr("width", width).attr("height", height)
            .style("font-family", "Inter, sans-serif")
            .append("g").attr('transform', `translate(${margin.left},${margin.top})`);

        // --- FIX CLUSTERING (Scale Logaritmiche) ---
        // Ho abbassato drasticamente i minimi dei domini (da 500/50 a 1)
        // per dare spazio ai valori piccoli invece di schiacciarli sugli assi.
        // Ho anche aumentato leggermente i massimi per sicurezza.
        const x = d3.scaleLog().domain([1, 300000]).range([0, w]).clamp(true);
        const y = d3.scaleLog().domain([1, 150000]).range([h, 0]).clamp(true);
        const r = d3.scaleSqrt().domain([0, 1e9]).range([2, 30]); 

        // Formattatore per le etichette degli assi
        const formatAxis = d => {
            if (d >= 1000) return d/1000 + 'k';
            return d; // Mostra il numero normale per valori < 1000 (es. 1, 10, 100)
        };

        // Asse X (Aggiunti tick per 1, 10, 100)
        svg.append("g").attr("transform", `translate(0,${h})`)
            .call(d3.axisBottom(x)
                .tickValues([1, 10, 100, 1000, 10000, 100000]) // Nuovi valori tick
                .tickFormat(formatAxis)
                .tickSize(-h))
            .call(g => g.selectAll("line").attr("stroke", "#e2e8f0").attr("stroke-dasharray", "2,2"))
            .call(g => g.select(".domain").attr("stroke", "#cbd5e1"));

        svg.append("text").attr("x", w/2).attr("y", h + 40)
            .text("GDP per Capita ($)")
            .attr("fill", "#64748b").attr("text-anchor", "middle").style("font-size", "13px");

        // Asse Y (Aggiunti tick per 1, 10)
        svg.append("g")
            .call(d3.axisLeft(y)
                .tickValues([1, 10, 100, 1000, 5000, 10000, 50000, 100000])
                .tickFormat(formatAxis)
                .tickSize(-w))
            .call(g => g.selectAll("line").attr("stroke", "#e2e8f0").attr("stroke-dasharray", "2,2"))
            .call(g => g.select(".domain").remove());

        svg.append("text").attr("transform", "rotate(-90)").attr("y", -50).attr("x", -h/2)
            .text("Energy Consumption (kWh)")
            .attr("fill", "#64748b").attr("text-anchor", "middle").style("font-size", "13px");

        // Titolo
        svg.append("text").attr("x", w/2).attr("y", -20)
            .text("Energy Consumption vs GDP")
            .attr("font-weight", "bold").attr("text-anchor", "middle").attr("fill", "#1e293b").style("font-size", "16px");

        // Bolle
        svg.selectAll("circle")
            .data(dataset).enter().append("circle")
            .attr("cx", d => x(d.gdp / 1e9)) 
            .attr("cy", d => y(d.primary_energy_consumption))
            .attr("r", d => r(d.population || 0))
            .attr("fill", d => this.colors[this.getRegion(d.country)] || '#6b7280')
            .attr("stroke", "white").attr("fill-opacity", 0.85)
            .on("mouseover", (e, d) => {
                d3.select(e.target).attr("stroke", "#333").attr("stroke-width", 2);
                this.tooltip.style("opacity", 1)
                    .html(`<b>${d.country}</b><br>GDP: $${d3.format(",.1f")(d.gdp/1e9)}B<br>Energy: ${d3.format(",.0f")(d.primary_energy_consumption)}`)
                    .style("left", (e.pageX + 10) + "px").style("top", (e.pageY - 20) + "px");
            })
            .on("mouseout", (e) => {
                d3.select(e.target).attr("stroke", "white").attr("stroke-width", 1);
                this.tooltip.style("opacity", 0);
            });

        // Legenda
        const keys = Object.keys(this.colors);
        const itemW = 110; 
        const rowSize = Math.floor(w / itemW);
        const legendContainer = svg.append("g").attr("transform", `translate(0, ${h + 60})`);

        keys.forEach((key, i) => {
            const row = Math.floor(i / rowSize);
            const col = i % rowSize;
            const xOffset = (w - (Math.min(keys.length - row * rowSize, rowSize) * itemW)) / 2;
            
            const g = legendContainer.append("g")
                .attr("transform", `translate(${xOffset + col * itemW}, ${row * 25})`);

            g.append("circle").attr("r", 5).attr("fill", this.colors[key]);
            g.append("text").attr("x", 12).attr("y", 4).text(key).style("font-size", "12px").attr("fill", "#64748b");
        });
    }

    resize() { this.draw(); }
}