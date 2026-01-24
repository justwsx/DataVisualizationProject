class EvolutionChart {
    constructor(data, majorCountries, countryColors) {
        this.data = data;
        this.countries = majorCountries; // Array di nomi paesi
        this.countryColors = countryColors; // Oggetto { "Country": "#hex" }
        this.containerId = 'chart-evolution';
        this.currentYear = 2022; // Default

        // Tooltip
        this.tooltip = d3.select("body").selectAll(".d3-tooltip").data([0]).join("div")
            .attr("class", "d3-tooltip")
            .style("opacity", 0);

        // Observer per ridimensionamento robusto
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

        // Primo render
        this.draw();
    }

    // Helper per convertire HEX in RGBA (per le aree trasparenti)
    hexToRgba(hex, alpha) {
        if (!hex) return `rgba(99, 102, 241, ${alpha})`; // Fallback color
        const r = parseInt(hex.slice(1, 3), 16);
        const g = parseInt(hex.slice(3, 5), 16);
        const b = parseInt(hex.slice(5, 7), 16);
        return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    }

    update(currentYear) {
        this.currentYear = currentYear;
        this.draw();
    }

    draw() {
        const container = document.getElementById(this.containerId);
        if (!container) return;

        // 1. SETUP DIMENSIONI FISSE
        const fixedHeight = 500;
        container.style.width = '100%';
        container.style.height = `${fixedHeight}px`;
        container.style.minHeight = `${fixedHeight}px`;
        container.style.position = 'relative';
        container.innerHTML = '';

        const rect = container.getBoundingClientRect();
        const width = rect.width > 0 ? rect.width : 800;
        const height = fixedHeight;

        const margin = { top: 40, right: 30, bottom: 80, left: 60 };
        const w = width - margin.left - margin.right;
        const h = height - margin.top - margin.bottom;

        // 2. SVG
        const svg = d3.select(container).append("svg")
            .attr("width", width)
            .attr("height", height)
            .style("display", "block")
            .style("font-family", "Inter, sans-serif")
            .append("g").attr('transform', `translate(${margin.left},${margin.top})`);

        // 3. PREPARAZIONE DATI
        // Filtriamo i dati solo per i paesi richiesti
        const dataset = this.countries.map(country => {
            const values = this.data
                .filter(d => d.country === country)
                .sort((a, b) => a.year - b.year)
                .map(d => ({
                    year: d.year,
                    value: d.primary_energy_consumption,
                    country: country // Ref per tooltip
                }));
            return { country, values };
        }).filter(g => g.values.length > 0);

        // 4. SCALE
        // X: Anni (1991 - 2022 come da codice originale)
        const x = d3.scaleLinear()
            .domain([1991, 2022])
            .range([0, w]);

        // Y: Energy (0 al Max globale)
        const globalMax = d3.max(dataset.flatMap(d => d.values.map(v => v.value))) || 100;
        const y = d3.scaleLinear()
            .domain([0, globalMax * 1.1])
            .range([h, 0]);

        // 5. GENERATORI LINEE E AREE
        // curveMonotoneX rende la linea curva (spline) come in Plotly
        const area = d3.area()
            .curve(d3.curveMonotoneX)
            .x(d => x(d.year))
            .y0(h)
            .y1(d => y(d.value));

        const line = d3.line()
            .curve(d3.curveMonotoneX)
            .x(d => x(d.year))
            .y(d => y(d.value));

        // 6. ASSI
        svg.append("g").attr("transform", `translate(0,${h})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")).ticks(10).tickSize(-h))
            .call(g => g.selectAll("line").attr("stroke", "#e2e8f0").attr("stroke-dasharray", "2,2"))
            .call(g => g.select(".domain").attr("stroke", "#cbd5e1"))
            .call(g => g.selectAll("text").attr("fill", "#64748b"));

        svg.append("g")
            .call(d3.axisLeft(y).tickFormat(d3.format(",.0f")).tickSize(-w))
            .call(g => g.selectAll("line").attr("stroke", "#e2e8f0").attr("stroke-dasharray", "2,2"))
            .call(g => g.select(".domain").remove())
            .call(g => g.selectAll("text").attr("fill", "#64748b"));

        svg.append("text").attr("transform", "rotate(-90)").attr("y", -45).attr("x", -h/2)
            .text("kWh per capita").attr("fill", "#64748b").attr("text-anchor", "middle").style("font-size", "12px");

        // 7. DISEGNO GRAFICI (Area e Linea per ogni paese)
        dataset.forEach(group => {
            const color = this.countryColors[group.country] || '#6366f1';
            const isHighlighted = group.country === "United States" || group.country === "China";
            const strokeWidth = isHighlighted ? 3 : 1.5;

            // Area (Sfondo trasparente)
            svg.append("path")
                .datum(group.values)
                .attr("fill", this.hexToRgba(color, 0.15))
                .attr("d", area);

            // Linea (Bordo solido)
            svg.append("path")
                .datum(group.values)
                .attr("fill", "none")
                .attr("stroke", color)
                .attr("stroke-width", strokeWidth)
                .attr("d", line);

            // Linea invisibile per interaction
            svg.append("path")
                .datum(group.values)
                .attr("fill", "none")
                .attr("stroke", "transparent")
                .attr("stroke-width", 20)
                .attr("d", line)
                .on("mouseover", (e, d) => {
                    const yearVal = Math.round(x.invert(d3.pointer(e)[0]));
                    // Trova il valore più vicino all'anno hoverato
                    const point = d.find(v => v.year === yearVal) || d[d.length-1];
                    
                    this.tooltip.style("opacity", 1)
                        .html(`<b>${group.country}</b><br>Year: ${point.year}<br>Energy: ${Math.round(point.value)}`)
                        .style("left", (e.pageX + 10) + "px").style("top", (e.pageY - 20) + "px");
                })
                .on("mouseout", () => this.tooltip.style("opacity", 0));
        });

        // 8. INDICATORE ANNO CORRENTE (Linea tratteggiata)
        const xYear = x(this.currentYear);
        
        // Linea verticale
        const indicatorGroup = svg.append("g");
        
        indicatorGroup.append("line")
            .attr("x1", xYear).attr("x2", xYear)
            .attr("y1", 0).attr("y2", h)
            .attr("stroke", "#6366f1")
            .attr("stroke-width", 2)
            .attr("stroke-dasharray", "4,4");

        // Box Annotazione in alto
        const boxWidth = 50;
        const boxHeight = 24;
        
        // Sfondo bianco etichetta
        indicatorGroup.append("rect")
            .attr("x", xYear - boxWidth/2).attr("y", -10)
            .attr("width", boxWidth).attr("height", boxHeight)
            .attr("fill", "rgba(255,255,255,0.9)")
            .attr("stroke", "#e2e8f0")
            .attr("rx", 4);

        // Testo Anno
        indicatorGroup.append("text")
            .attr("x", xYear).attr("y", 6)
            .text(this.currentYear)
            .attr("text-anchor", "middle")
            .attr("fill", "#6366f1")
            .style("font-size", "12px")
            .style("font-weight", "bold");

        // 9. LEGENDA (In basso centrata)
        const keys = this.countries;
        const itemW = 120;
        const rowSize = Math.floor(w / itemW); // Quanti item per riga
        const legendContainer = svg.append("g").attr("transform", `translate(0, ${h + 50})`);

        keys.forEach((key, i) => {
            const row = Math.floor(i / rowSize);
            const col = i % rowSize;
            
            // Centratura riga
            const itemsInRow = Math.min(keys.length - row * rowSize, rowSize);
            const rowWidth = itemsInRow * itemW;
            const xBase = (w - rowWidth) / 2;

            const g = legendContainer.append("g")
                .attr("transform", `translate(${xBase + col * itemW}, ${row * 20})`);

            g.append("line")
                .attr("x1", 0).attr("x2", 20).attr("y1", 0).attr("y2", 0)
                .attr("stroke", this.countryColors[key] || '#999')
                .attr("stroke-width", 3);

            g.append("text")
                .attr("x", 25).attr("y", 4)
                .text(key)
                .style("font-size", "11px").attr("fill", "#64748b");
        });
    }

    resize() { this.draw(); }
}