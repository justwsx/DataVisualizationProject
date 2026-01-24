class TopConsumersChart {
    constructor(data) {
        this.data = data;
        this.containerId = 'chart-top-consumers';
        this.year = 2020; // Default

        this.regionColors = {
            "Asia": "#3b82f6",
            "North America": "#6366f1",
            "Europe": "#22c55e",
            "South America": "#f59e0b",
            "Africa": "#ec4899",
            "Oceania": "#14b8a6"
        };

        this.countryRegions = {
            "China": "Asia", "India": "Asia", "United States": "North America",
            "Russia": "Asia", "Japan": "Asia", "Germany": "Europe",
            "Brazil": "South America", "Canada": "North America",
            "United Kingdom": "Europe", "France": "Europe", "Italy": "Europe",
            "Australia": "Oceania", "South Korea": "Asia", "Saudi Arabia": "Asia",
            "Mexico": "North America", "Indonesia": "Asia", "Iran": "Asia",
            "South Africa": "Africa", "Egypt": "Africa", "Nigeria": "Africa",
            "Spain": "Europe", "Poland": "Europe", "Turkey": "Asia",
            "Thailand": "Asia", "Vietnam": "Asia", "Pakistan": "Asia",
            "Argentina": "South America"
        };

        // Tooltip
        this.tooltip = d3.select("body").selectAll(".d3-tooltip").data([0]).join("div")
            .attr("class", "d3-tooltip")
            .style("opacity", 0);

        // Observer per ridimensionamento
        const container = document.getElementById(this.containerId);
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

    getRegion(country) {
        return this.countryRegions[country] || null;
    }

    formatNumber(num) {
        if (num >= 1e12) return (num / 1e12).toFixed(1) + 'T';
        if (num >= 1e9) return (num / 1e9).toFixed(1) + 'B';
        if (num >= 1e6) return (num / 1e6).toFixed(1) + 'M';
        if (num >= 1e3) return (num / 1e3).toFixed(1) + 'K';
        return num.toString();
    }

    update(selectedYear) {
        this.year = selectedYear;
        this.draw();
    }

    draw() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // 1. SETUP DIMENSIONI FISSE
        const fixedHeight = 600; // Spazio sufficiente per 15 barre
        container.style.width = '100%';
        container.style.height = `${fixedHeight}px`;
        container.style.minHeight = `${fixedHeight}px`;
        container.style.position = 'relative';
        container.innerHTML = '';

        const rect = container.getBoundingClientRect();
        const width = rect.width > 0 ? rect.width : 800;
        const height = fixedHeight;

        // Margine destro ampio per la Legenda
        const margin = { top: 40, right: 150, bottom: 50, left: 140 }; // Left ampio per nomi paesi lunghi
        const w = width - margin.left - margin.right;
        const h = height - margin.top - margin.bottom;

        // 2. PREPARAZIONE DATI
        let yearData = this.data.filter(d => d.year === this.year);
        if (yearData.length === 0) {
            // Fallback all'anno più recente se vuoto
            const availableYears = [...new Set(this.data.map(d => d.year))].sort((a, b) => b - a);
            yearData = this.data.filter(d => d.year === availableYears[0]);
        }

        // Aggregazione dati (simile al codice originale)
        const countryMap = {};
        yearData.forEach(d => {
            if (!countryMap[d.country]) {
                countryMap[d.country] = {
                    country: d.country,
                    energy: 0,
                    population: 0,
                    region: this.getRegion(d.country)
                };
            }
            countryMap[d.country].energy += d.primary_energy_consumption || 0;
            countryMap[d.country].population += d.population || 0;
        });

        // Sort e Top 15
        const sortedData = Object.values(countryMap)
            .filter(d => d.region !== null)
            .sort((a, b) => b.energy - a.energy) // Decrescente
            .slice(0, 15);

        // 3. SCALE
        const y = d3.scaleBand()
            .domain(sortedData.map(d => d.country))
            .range([0, h])
            .padding(0.2);

        const xMax = d3.max(sortedData, d => d.energy) || 100;
        const x = d3.scaleLinear()
            .domain([0, xMax * 1.1]) // +10% spazio per le etichette
            .range([0, w]);

        // 4. SVG
        const svg = d3.select(container).append("svg")
            .attr("width", width)
            .attr("height", height)
            .style("display", "block")
            .style("font-family", "Inter, sans-serif")
            .append("g").attr('transform', `translate(${margin.left},${margin.top})`);

        // 5. GRIGLIA VERTICALE
        svg.append("g")
            .attr("transform", `translate(0,${h})`)
            .call(d3.axisBottom(x).ticks(5).tickSize(-h).tickFormat(""))
            .call(g => g.selectAll("line").attr("stroke", "#e2e8f0").attr("stroke-dasharray", "2,2"))
            .call(g => g.select(".domain").remove());

        // 6. BARRE
        svg.selectAll(".bar")
            .data(sortedData)
            .enter().append("rect")
            .attr("class", "bar")
            .attr("y", d => y(d.country))
            .attr("x", 0)
            .attr("height", y.bandwidth())
            .attr("width", d => x(d.energy))
            .attr("fill", d => this.regionColors[d.region] || '#ccc')
            .attr("rx", 3) // Angoli arrotondati
            .attr("opacity", 0.9)
            .on("mouseover", (e, d) => {
                d3.select(e.target).attr("opacity", 1).attr("stroke", "#333").attr("stroke-width", 1);
                this.tooltip.style("opacity", 1)
                    .html(`<b>${d.country}</b><br>
                           Region: ${d.region}<br>
                           Per Capita: ${d3.format(",.0f")(d.energy)} kWh<br>
                           Pop: ${this.formatNumber(d.population)}`)
                    .style("left", (e.pageX + 10) + "px").style("top", (e.pageY - 20) + "px");
            })
            .on("mouseout", (e) => {
                d3.select(e.target).attr("opacity", 0.9).attr("stroke", "none");
                this.tooltip.style("opacity", 0);
            });

        // 7. ETICHETTE VALORI (Accanto alle barre)
        svg.selectAll(".label")
            .data(sortedData)
            .enter().append("text")
            .attr("y", d => y(d.country) + y.bandwidth() / 2 + 4)
            .attr("x", d => x(d.energy) + 5)
            .text(d => this.formatNumber(d.energy))
            .attr("fill", "#1e293b")
            .style("font-size", "11px")
            .style("font-weight", "600");

        // 8. ASSI
        // Asse Y (Nomi Paesi)
        svg.append("g")
            .call(d3.axisLeft(y).tickSize(0))
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll("text")
                .style("font-size", "11px")
                .style("font-weight", "500")
                .attr("fill", "#1e293b"));

        // Asse X (Valori in basso)
        svg.append("g")
            .attr("transform", `translate(0,${h})`)
            .call(d3.axisBottom(x).ticks(5).tickFormat(d3.format(",.0f")))
            .call(g => g.select(".domain").attr("stroke", "#cbd5e1"))
            .call(g => g.selectAll("text").attr("fill", "#64748b"));

        svg.append("text")
            .attr("x", w / 2)
            .attr("y", h + 40)
            .text("kWh per capita")
            .attr("fill", "#64748b")
            .attr("text-anchor", "middle")
            .style("font-size", "13px");

        // 9. LEGENDA (Manuale a destra)
        const regions = Object.keys(this.regionColors);
        const legendG = svg.append("g")
            .attr("transform", `translate(${w + 30}, 0)`);

        legendG.append("text")
            .attr("x", 0).attr("y", -10)
            .text("Region")
            .style("font-weight", "bold").style("font-size", "12px").attr("fill", "#1e293b");

        regions.forEach((region, i) => {
            const g = legendG.append("g").attr("transform", `translate(0, ${i * 20})`);
            
            g.append("rect")
                .attr("width", 12).attr("height", 12)
                .attr("fill", this.regionColors[region])
                .attr("rx", 2);

            g.append("text")
                .attr("x", 18).attr("y", 10)
                .text(region)
                .style("font-size", "11px").attr("fill", "#64748b");
        });

        // 10. ANNOTAZIONI
        svg.append("text")
            .attr("x", w / 2)
            .attr("y", -10)
            .text("Top 15 Countries by Energy Consumption")
            .attr("text-anchor", "middle")
            .style("font-size", "14px").style("font-weight", "bold").attr("fill", "#1e293b");
    }
}