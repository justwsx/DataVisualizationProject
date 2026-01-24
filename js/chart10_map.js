class EnergyMapChart {
    constructor(data) {
        this.data = data;
        this.container = 'chart-map';
        this.geoData = null; // Stores the GeoJSON data after first load
        
        // Color palette matching the original design
        this.colorRange = ['#22c55e', '#84cc16', '#fbbf24', '#f97316', '#dc2626'];

        // Inject necessary CSS for the tooltip
        this.injectStyles();
    }

    injectStyles() {
        const styleId = 'energy-map-styles';
        if (!document.getElementById(styleId)) {
            const style = document.createElement('style');
            style.id = styleId;
            style.textContent = `
                .tooltip-map {
                    position: absolute;
                    background: rgba(255, 255, 255, 0.98);
                    border: 1px solid #e2e8f0;
                    border-radius: 6px;
                    padding: 8px 12px;
                    font-family: 'Inter', sans-serif;
                    font-size: 12px;
                    color: #1e293b;
                    pointer-events: none;
                    opacity: 0;
                    transition: opacity 0.2s;
                    box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
                    z-index: 1000;
                    min-width: 150px;
                }
            `;
            document.head.appendChild(style);
        }
    }

    async update(year) {
        const container = d3.select(`#${this.container}`);
        const containerNode = document.getElementById(this.container);
        
        if (!containerNode) return;

        // Clear previous chart
        container.selectAll('*').remove();

        const width = containerNode.clientWidth || 800;
        const height = containerNode.clientHeight || 500;

        // --- 1. Load GeoJSON (Singleton Pattern) ---
        if (!this.geoData) {
            try {
                // Fetching world map topology
                this.geoData = await d3.json('https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson');
            } catch (e) {
                console.error("Failed to load map data", e);
                container.append('div').text('Error loading map data. Please check internet connection.').style('color', 'red');
                return;
            }
        }

        const svg = container.append('svg')
            .attr('width', width)
            .attr('height', height)
            .style('background', 'transparent');

        // --- 2. Process Data ---
        const yearData = this.data.filter(d => d.year === year);
        
        // Map: Country Name -> Energy Value
        const dataMap = new Map();
        yearData.forEach(d => {
            let countryName = d.country;
            
            // Name Normalization (Map data vs Source data)
            if (countryName === "United States") countryName = "USA";
            if (countryName === "United Kingdom") countryName = "England";
            // Add more mappings here if specific countries remain gray
            
            dataMap.set(countryName, d.primary_energy_consumption);
        });

        const maxVal = d3.max(yearData, d => d.primary_energy_consumption) || 100000;

        // --- 3. Projection & Path ---
        // 'fitSize' automatically scales the map to fit the container
        const projection = d3.geoNaturalEarth1()
            .fitSize([width, height], this.geoData);

        const pathGenerator = d3.geoPath().projection(projection);

        // --- 4. Color Scale ---
        const colorScale = d3.scaleLinear()
            .domain([0, maxVal * 0.3, maxVal * 0.5, maxVal * 0.7, maxVal])
            .range(this.colorRange);

        // --- 5. Tooltip Element ---
        const tooltip = container.append('div')
            .attr('class', 'tooltip-map');

        // --- 6. Draw Map ---
        const mapGroup = svg.append('g');

        mapGroup.selectAll('path')
            .data(this.geoData.features)
            .join('path')
            .attr('d', pathGenerator)
            .attr('fill', d => {
                const value = dataMap.get(d.properties.name);
                return value ? colorScale(value) : '#f1f5f9'; // Gray for no data
            })
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 0.5)
            .style('cursor', 'pointer')
            // --- Hover Events ---
            .on('mousemove', (event, d) => {
                const countryName = d.properties.name;
                const value = dataMap.get(countryName);

                if (value !== undefined) {
                    tooltip.html(`
                        <div style="font-weight: 700; margin-bottom: 4px;">${countryName}</div>
                        <div style="display: flex; align-items: center; gap: 6px;">
                            <span style="width: 8px; height: 8px; background-color: ${colorScale(value)}; border-radius: 50%;"></span>
                            <span>Energy: <b>${d3.format(',.0f')(value)}</b> kWh/person</span>
                        </div>
                    `)
                    .style('opacity', 1)
                    .style('left', `${event.pageX + 10}px`)
                    .style('top', `${event.pageY - 20}px`);

                    // Highlight border
                    d3.select(event.currentTarget)
                        .attr('stroke', '#334155')
                        .attr('stroke-width', 1.5);
                }
            })
            .on('mouseout', function() {
                tooltip.style('opacity', 0);
                d3.select(this)
                    .attr('stroke', '#ffffff')
                    .attr('stroke-width', 0.5);
            });

        // --- 7. Special Markers (US & China) ---
        const markers = [
            { long: -98.5, lat: 39.8, icon: '🔥', label: 'United States', sub: 'Natural Gas Dominant' },
            { long: 104.2, lat: 35.9, icon: '⚫', label: 'China', sub: 'Coal Dominant' }
        ];

        markers.forEach(m => {
            const coords = projection([m.long, m.lat]);
            if (coords) {
                svg.append('text')
                    .attr('x', coords[0])
                    .attr('y', coords[1])
                    .attr('text-anchor', 'middle')
                    .attr('dominant-baseline', 'middle')
                    .attr('font-size', '20px')
                    .text(m.icon)
                    .style('cursor', 'help')
                    .on('mousemove', (event) => {
                        tooltip.html(`
                            <div style="font-weight: 700; margin-bottom: 4px;">${m.label}</div>
                            <div style="font-size: 11px; color: #64748b;">${m.sub}</div>
                        `)
                        .style('opacity', 1)
                        .style('left', `${event.pageX + 10}px`)
                        .style('top', `${event.pageY - 20}px`);
                    })
                    .on('mouseout', () => tooltip.style('opacity', 0));
            }
        });

        // --- 8. Legend ---
        this.drawLegend(svg, width, height, maxVal);

        // --- 9. Title ---
        svg.append('text')
            .attr('x', 20)
            .attr('y', 30)
            .attr('font-family', 'Inter, sans-serif')
            .attr('font-size', '18px')
            .attr('font-weight', 'bold')
            .attr('fill', '#1e293b')
            

        svg.append('text')
            .attr('x', 20)
            .attr('y', 50)
            .attr('font-family', 'Inter, sans-serif')
            .attr('font-size', '12px')
            .attr('fill', '#64748b')
           
    }
    drawLegend(svg, width, height, max) {
        const legendWidth = 12;
        const legendHeight = 150;
        const legendMarginRight = 30;
        
        const legendX = width - legendWidth - legendMarginRight;
        const legendY = (height - legendHeight) / 2;

        let defs = svg.select('defs');
        if (defs.empty()) defs = svg.append('defs');
        
        // Rimuovi vecchi gradienti per evitare conflitti
        defs.select('#map-legend-gradient').remove();

        // Gradiente Verticale (y1=100% -> y2=0%)
        const linearGradient = defs.append('linearGradient')
            .attr('id', 'map-legend-gradient')
            .attr('x1', '0%')
            .attr('y1', '100%')
            .attr('x2', '0%')
            .attr('y2', '0%');

        const stops = [0, 25, 50, 75, 100];
        this.colorRange.forEach((color, i) => {
            linearGradient.append('stop')
                .attr('offset', `${stops[i]}%`)
                .attr('stop-color', color);
        });

        const legendGroup = svg.append('g')
            .attr('transform', `translate(${legendX}, ${legendY})`);

        // Barra
        legendGroup.append('rect')
            .attr('width', legendWidth)
            .attr('height', legendHeight)
            .style('fill', 'url(#map-legend-gradient)')
            .style('rx', 3);

        // Titolo
        legendGroup.append('text')
            .attr('x', legendWidth / 2)
            .attr('y', -10)
            .text('kWh/Capita')
            .attr('text-anchor', 'middle')
            .attr('font-family', 'Inter, sans-serif')
            .attr('font-size', '11px')
            .attr('font-weight', '600')
            .attr('fill', '#64748b');

        // Valore Min (Basso)
        legendGroup.append('text')
            .attr('x', -6)
            .attr('y', legendHeight)
            .attr('text-anchor', 'end')
            .attr('dominant-baseline', 'middle')
            .text('0')
            .attr('font-family', 'Inter, sans-serif')
            .attr('font-size', '10px')
            .attr('fill', '#64748b');

        // Valore Max (Alto)
        legendGroup.append('text')
            .attr('x', -6)
            .attr('y', 0)
            .attr('text-anchor', 'end')
            .attr('dominant-baseline', 'middle')
            .text(d3.format('.2s')(max))
            .attr('font-family', 'Inter, sans-serif')
            .attr('font-size', '10px')
            .attr('fill', '#64748b');
    }

    resize() {
        // Redraw with current data if window resizes
      
    }
}

