let dataset = [];
let geoJsonData = null;
const width = 1000;
const height = 600;

Promise.all([
    d3.csv("cleaned_data.csv"),
    fetch("https://raw.githubusercontent.com/vasturiano/globe.gl/master/example/datasets/ne_110m_admin_0_countries.geojson").then(res => res.json())
]).then(([data, geoJson]) => {
    
    dataset = data.map(d => ({
        country: d.country,
        iso_code: d.iso_code,
        year: +d.year,
        population: +d.population || 0,
        gdp: +d.gdp || 0,
        co2: +d.co2 || 0,
        primary_energy_consumption: +d.primary_energy_consumption || 0,
        coal_consumption: +d.coal_consumption || 0,
        oil_consumption: +d.oil_consumption || 0,
        gas_consumption: +d.gas_consumption || 0,
        nuclear_consumption: +d.nuclear_consumption || 0,
        hydro_consumption: +d.hydro_consumption || 0,
        solar_consumption: +d.solar_consumption || 0,
        wind_consumption: +d.wind_consumption || 0,
        other_renewable_consumption: +d.other_renewable_consumption || 0,
        renewables_consumption: +d.renewables_consumption || 0,
        continent: d.continent || 'Other',
        region: d.region || 'Other'
    })).filter(d => d.country !== "World" && d.iso_code);

    geoJsonData = geoJson;

    console.log("Data Loaded:", dataset.length, "rows");

    initGlobe();
    initBubbleChart();
    initStackedAreaChart();
    initDonutChart();
    initParetoChart();
    initHeatmap();
    initRadarChart();
    initTreemap();
    initLineRace();
    initSankey();

}).catch(err => {
    console.error("Error loading data:", err);
    document.body.innerHTML = "<h1 style='color:red;text-align:center;'>Error loading data. Check console.</h1>";
});


function initGlobe() {
    const years = [...new Set(dataset.map(d => d.year))].sort((a,b)=>a-b);
    const yearSelect = d3.select("#yearDropdown");
    yearSelect.selectAll("option").data(years).enter().append("option").text(d=>d).attr("value", d=>d);
    yearSelect.property("value", 2020);

    const colorScale = d3.scaleSequential(d3.interpolateYlOrRd).domain([0, 5000]);

    const world = Globe()
        (document.getElementById('globeViz'))
        .globeImageUrl('https://unpkg.com/three-globe/example/img/earth-night.jpg')
        .backgroundImageUrl('https://unpkg.com/three-globe/example/img/night-sky.png')
        .polygonsData(geoJsonData.features)
        .polygonAltitude(0.06)
        .polygonCapColor(() => 'rgba(200, 0, 0, 0.6)')
        .polygonSideColor(() => 'rgba(0, 100, 0, 0.15)')
        .polygonStrokeColor(() => '#111')
        .polygonLabel(({ properties: d }) => {
            const val = getVal(d.ISO_A3);
            return `
                <div style="background:#222; padding:8px; border-radius:6px; color:white; border:1px solid #555;">
                    <b>${d.ADMIN}</b><br/>
                    Energy: <b>${val.toFixed(1)} TWh</b>
                </div>
            `;
        })
        .onPolygonHover(hoverD => world
            .polygonAltitude(d => d === hoverD ? 0.12 : 0.06)
            .polygonCapColor(d => {
                if (d === hoverD) return 'steelblue';
                const val = getVal(d.properties.ISO_A3);
                return val > 0 ? colorScale(val) : '#333';
            })
        );

    world.controls().autoRotate = true;
    world.controls().autoRotateSpeed = 0.5;

    function getVal(iso) {
        const y = +yearSelect.property("value");
        const row = dataset.find(d => d.iso_code === iso && d.year === y);
        return row ? row.primary_energy_consumption : 0;
    }

    function updateGlobe() {
        world.polygonCapColor(d => {
            const val = getVal(d.properties.ISO_A3);
            return val > 0 ? colorScale(val) : '#333';
        });
    }

    yearSelect.on("change", updateGlobe);
    
    d3.select("#autoRotate").on("change", function() {
        world.controls().autoRotate = this.checked;
    });
    
    updateGlobe();
}


function initBubbleChart() {
    const svg = d3.select("#bc-chart-container").append("svg")
        .attr("width", width).attr("height", height);
    
    const margin = {top: 40, right: 40, bottom: 60, left: 80};
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);

    const xScale = d3.scaleLog().range([0, innerWidth]).domain([1e9, 2e13]);
    const yScale = d3.scaleLog().range([innerHeight, 0]).domain([10, 50000]);
    const rScale = d3.scaleSqrt().range([4, 40]).domain([0, 1.4e9]);
    const color = d3.scaleOrdinal(d3.schemeCategory10);

    const xAxis = g.append("g").attr("transform", `translate(0,${innerHeight})`);
    const yAxis = g.append("g");
    
    xAxis.call(d3.axisBottom(xScale).ticks(5, "~s"));
    yAxis.call(d3.axisLeft(yScale).ticks(5, "~s"));
    
    g.append("text")
        .attr("x", innerWidth/2).attr("y", innerHeight + 45)
        .attr("fill", "#fff").attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("GDP (USD)");
    
    g.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -innerHeight/2).attr("y", -50)
        .attr("fill", "#fff").attr("text-anchor", "middle")
        .style("font-size", "14px")
        .text("Primary Energy (TWh)");

    const tooltip = d3.select("#bubble-tooltip");

    const years = [...new Set(dataset.map(d => d.year))].sort((a,b)=>a-b);
    const filter = d3.select("#yearFilter");
    filter.selectAll("option").data(years).enter().append("option").text(d=>d).attr("value", d=>d);
    filter.property("value", 2018);

    function update(yr) {
        const dataYear = dataset.filter(d => 
            d.year === yr && d.gdp > 0 && d.primary_energy_consumption > 0
        );
        
        const circles = g.selectAll("circle").data(dataYear, d => d.country);
        
        circles.enter().append("circle")
            .attr("cx", d => xScale(d.gdp))
            .attr("cy", d => yScale(d.primary_energy_consumption))
            .attr("r", 0)
            .attr("fill", d => color(d.country))
            .attr("opacity", 0.7)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .on("mouseover", function(event, d) {
                d3.select(this)
                    .transition().duration(200)
                    .attr("opacity", 1)
                    .attr("stroke-width", 3);
                
                tooltip
                    .style("opacity", 1)
                    .html(`<strong>${d.country}</strong><br/>
                           GDP: $${(d.gdp/1e12).toFixed(2)}T<br/>
                           Energy: ${d.primary_energy_consumption.toFixed(1)} TWh<br/>
                           Pop: ${(d.population/1e6).toFixed(1)}M`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", function() {
                d3.select(this)
                    .transition().duration(200)
                    .attr("opacity", 0.7)
                    .attr("stroke-width", 1);
                tooltip.style("opacity", 0);
            })
            .merge(circles)
            .transition().duration(1000)
            .attr("cx", d => xScale(d.gdp))
            .attr("cy", d => yScale(d.primary_energy_consumption))
            .attr("r", d => rScale(d.population));
            
        circles.exit()
            .transition().duration(500)
            .attr("r", 0)
            .remove();
    }

    filter.on("change", function() { update(+this.value); });
    update(2018);
    
    let animating = false;
    d3.select("#btnPlay").on("click", () => {
        if (animating) return;
        animating = true;
        let y = 1990;
        const interval = setInterval(() => {
            if (y > 2020) {
                clearInterval(interval);
                animating = false;
                return;
            }
            filter.property("value", y);
            update(y);
            y++;
        }, 500);
    });
}


function initStackedAreaChart() {
    const countriesWithData = [...new Set(dataset
        .filter(d => d.primary_energy_consumption > 0)
        .map(d => d.country))].sort();
    
    const sel = d3.select("#countrySelectSAC");
    sel.selectAll("option").data(countriesWithData).enter()
        .append("option").text(d=>d).attr("value",d=>d);
    sel.property("value", "United States");

    const svg = d3.select("#sac-chart-container").append("svg")
        .attr("width", width).attr("height", height);
    
    const margin = {top: 20, right: 150, bottom: 50, left: 60};
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    
    const keys = ["coal_consumption", "oil_consumption", "gas_consumption", "nuclear_consumption", "renewables_consumption"];
    const colors = d3.scaleOrdinal()
        .domain(keys)
        .range(["#555", "#c0392b", "#e67e22", "#8e44ad", "#27ae60"]);
    
    const x = d3.scaleLinear().range([0, innerWidth]);
    const y = d3.scaleLinear().range([innerHeight, 0]);
    
    const xAxis = g.append("g").attr("transform", `translate(0,${innerHeight})`);
    const yAxis = g.append("g");
    
    const area = d3.area()
        .x(d => x(d.data.year))
        .y0(d => y(d[0]))
        .y1(d => y(d[1]))
        .curve(d3.curveMonotoneX);

    const tooltip = d3.select("#sac-tooltip");

    function update(cntry) {
        const data = dataset
            .filter(d => d.country === cntry)
            .sort((a,b)=>a.year - b.year);
        
        if (data.length === 0) {
            g.selectAll("path").remove();
            return;
        }
        
        const stackedData = d3.stack().keys(keys)(data);
        
        x.domain(d3.extent(data, d => d.year));
        y.domain([0, d3.max(stackedData[stackedData.length-1], d => d[1]) || 1]);
        
        xAxis.transition().duration(750).call(d3.axisBottom(x).tickFormat(d3.format("d")));
        yAxis.transition().duration(750).call(d3.axisLeft(y).ticks(5));
        
        const paths = g.selectAll("path").data(stackedData);
        
        paths.enter()
            .append("path")
            .attr("fill", d => colors(d.key))
            .attr("opacity", 0.8)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("opacity", 1);
                const key = d.key.replace("_consumption", "");
                tooltip.style("opacity", 1)
                    .html(`<strong>${key.toUpperCase()}</strong>`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).attr("opacity", 0.8);
                tooltip.style("opacity", 0);
            })
            .merge(paths)
            .transition().duration(1000)
            .attr("d", area);
            
        paths.exit().remove();
        
        svg.selectAll(".legend").remove();
        const legend = svg.selectAll(".legend").data(keys).enter()
            .append("g")
            .attr("class", "legend")
            .attr("transform", (d,i) => `translate(${width - 140}, ${i*25 + 30})`);
            
        legend.append("rect")
            .attr("width", 15).attr("height", 15)
            .attr("fill", d => colors(d));
        
        legend.append("text")
            .attr("x", 20).attr("y", 12)
            .text(d => d.replace("_consumption", ""))
            .attr("fill", "white")
            .style("font-size", "12px");
    }

    sel.on("change", function() { update(this.value); });
    update("United States");
}

function initDonutChart() {
    const countriesWithData = [...new Set(dataset
        .filter(d => d.primary_energy_consumption > 0)
        .map(d => d.country))].sort();
    
    const cSel = d3.select("#countrySelectDonut");
    cSel.selectAll("option").data(countriesWithData).enter()
        .append("option").text(d=>d).attr("value",d=>d);
    cSel.property("value", "China");
    
    const years = [...new Set(dataset.map(d => d.year))].sort((a,b)=>b-a);
    const ySel = d3.select("#yearSelectDonut");
    ySel.selectAll("option").data(years).enter()
        .append("option").text(d=>d).attr("value",d=>d);
    
    const ctx = document.getElementById('donutCanvas').getContext('2d');
    let myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Coal', 'Oil', 'Gas', 'Nuclear', 'Renewables'],
            datasets: [{
                data: [0,0,0,0,0],
                backgroundColor: ["#555", "#c0392b", "#e67e22", "#8e44ad", "#27ae60"],
                borderWidth: 2,
                borderColor: '#1a1a1a'
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
                legend: {
                    labels: { color: '#fff', font: { size: 13 } }
                },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            const label = context.label || '';
                            const value = context.parsed || 0;
                            const total = context.dataset.data.reduce((a,b)=>a+b, 0);
                            const pct = total > 0 ? ((value/total)*100).toFixed(1) : 0;
                            return `${label}: ${value.toFixed(1)} TWh (${pct}%)`;
                        }
                    }
                }
            }
        }
    });

    const infoDiv = d3.select("#donut-info");

    function update() {
        const c = cSel.property("value");
        const yr = +ySel.property("value");
        const row = dataset.find(d => d.country === c && d.year === yr);
        
        if(row && row.primary_energy_consumption > 0) {
            myChart.data.datasets[0].data = [
                row.coal_consumption, 
                row.oil_consumption, 
                row.gas_consumption, 
                row.nuclear_consumption, 
                row.renewables_consumption
            ];
            myChart.update('active');
            infoDiv.html(`Total Energy: <strong>${row.primary_energy_consumption.toFixed(1)} TWh</strong>`);
        } else {
            myChart.data.datasets[0].data = [0,0,0,0,0];
            myChart.update();
            infoDiv.html(`<span style="color:#f39c12;">No data available for ${c} in ${yr}</span>`);
        }
    }
    
    cSel.on("change", update);
    ySel.on("change", update);
    update();
}


function initParetoChart() {
    const svg = d3.select("#pareto-chart-container").append("svg")
        .attr("width", width).attr("height", height);
    
    const margin = {top: 20, right: 20, bottom: 120, left: 70};
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    
    const x = d3.scaleBand().range([0, innerWidth]).padding(0.2);
    const y = d3.scaleLinear().range([innerHeight, 0]);
    
    const xAxisGroup = g.append("g").attr("transform", `translate(0,${innerHeight})`);
    const yAxisGroup = g.append("g");
    
    const tooltip = d3.select("#pareto-tooltip");
    
    const typeSel = d3.select("#consumptionSelect");
    const yearSel = d3.select("#yearSelectPareto");
    
    const years = [...new Set(dataset.map(d => d.year))].sort((a,b)=>b-a);
    yearSel.selectAll("option").data(years).enter()
        .append("option").text(d=>d).attr("value",d=>d);
    yearSel.property("value", 2020);

    function update() {
        const type = typeSel.property("value");
        const yr = +yearSel.property("value");
        
        let data = dataset
            .filter(d => d.year === yr && d[type] > 0)
            .sort((a,b) => b[type] - a[type])
            .slice(0, 20);
            
        x.domain(data.map(d => d.country));
        y.domain([0, d3.max(data, d => d[type]) || 1]);
        
        const bars = g.selectAll(".bar").data(data, d => d.country);
        
        bars.enter().append("rect")
            .attr("class", "bar")
            .attr("fill", "steelblue")
            .attr("x", d => x(d.country))
            .attr("width", x.bandwidth())
            .attr("y", innerHeight)
            .attr("height", 0)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("fill", "#3498db");
                tooltip.style("opacity", 1)
                    .html(`<strong>${d.country}</strong><br/>${type}: ${d[type].toFixed(1)}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).attr("fill", "steelblue");
                tooltip.style("opacity", 0);
            })
            .merge(bars)
            .transition().duration(750)
            .attr("x", d => x(d.country))
            .attr("width", x.bandwidth())
            .attr("y", d => y(d[type]))
            .attr("height", d => innerHeight - y(d[type]));
            
        bars.exit().transition().duration(500).attr("height", 0).attr("y", innerHeight).remove();
        
        xAxisGroup.transition().duration(750).call(d3.axisBottom(x))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end")
            .style("font-size", "11px");
        
        yAxisGroup.transition().duration(750).call(d3.axisLeft(y).ticks(5));
    }
    
    typeSel.on("change", update);
    yearSel.on("change", update);
    update();
}


function initHeatmap() {
    const container = d3.select("#heatmap-container");
    const svg = container.append("svg").attr("width", width).attr("height", 500);
    
    const margin = {top: 20, right: 20, bottom: 80, left: 150};
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = 500 - margin.top - margin.bottom;
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    
    const tooltip = d3.select("#heatmap-tooltip");
    const yearSel = d3.select("#heatmapYear");
    
    function update() {
        const range = yearSel.property("value").split("-").map(Number);
        const [startYear, endYear] = range;
        
        const years = d3.range(startYear, endYear + 1);
        const topCountries = [...new Set(
            dataset.filter(d => d.year === endYear && d.primary_energy_consumption > 0)
                .sort((a,b) => b.primary_energy_consumption - a.primary_energy_consumption)
                .slice(0, 20)
                .map(d => d.country)
        )];
        
        const data = [];
        topCountries.forEach(country => {
            years.forEach(year => {
                const row = dataset.find(d => d.country === country && d.year === year);
                if (row) {
                    const intensity = row.gdp > 0 ? 
                        (row.primary_energy_consumption / row.gdp) * 1e12 : 0;
                    data.push({ country, year, value: intensity });
                }
            });
        });
        
        const x = d3.scaleBand().range([0, innerWidth]).domain(years).padding(0.05);
        const y = d3.scaleBand().range([0, innerHeight]).domain(topCountries).padding(0.05);
        const color = d3.scaleSequential(d3.interpolateRdYlGn)
            .domain([d3.max(data, d => d.value) || 100, 0]);
        
        g.selectAll("*").remove();
        
        g.selectAll("rect")
            .data(data)
            .enter().append("rect")
            .attr("x", d => x(d.year))
            .attr("y", d => y(d.country))
            .attr("width", x.bandwidth())
            .attr("height", y.bandwidth())
            .attr("fill", d => color(d.value))
            .attr("stroke", "#1a1a1a")
            .attr("stroke-width", 1)
            .on("mouseover", function(event, d) {
                d3.select(this).attr("stroke", "#fff").attr("stroke-width", 2);
                tooltip.style("opacity", 1)
                    .html(`<strong>${d.country} (${d.year})</strong><br/>Intensity: ${d.value.toFixed(2)}`)
                    .style("left", (event.pageX + 10) + "px")
                    .style("top", (event.pageY - 20) + "px");
            })
            .on("mouseout", function() {
                d3.select(this).attr("stroke", "#1a1a1a").attr("stroke-width", 1);
                tooltip.style("opacity", 0);
            });
        
        g.append("g").call(d3.axisLeft(y)).selectAll("text").style("font-size", "11px");
        g.append("g").attr("transform", `translate(0,${innerHeight})`)
            .call(d3.axisBottom(x).tickFormat(d3.format("d")))
            .selectAll("text")
            .attr("transform", "rotate(-45)")
            .style("text-anchor", "end");
    }
    
    yearSel.on("change", update);
    update();
}


function initRadarChart() {
    const countries = [...new Set(dataset
        .filter(d => d.primary_energy_consumption > 0)
        .map(d => d.country))].sort();
    
    const c1Sel = d3.select("#radarCountry1");
    const c2Sel = d3.select("#radarCountry2");
    const ySel = d3.select("#radarYear");
    
    c1Sel.selectAll("option").data(countries).enter().append("option").text(d=>d).attr("value",d=>d);
    c2Sel.selectAll("option").data(countries).enter().append("option").text(d=>d).attr("value",d=>d);
    
    c1Sel.property("value", "United States");
    c2Sel.property("value", "China");
    
    const years = [...new Set(dataset.map(d => d.year))].sort((a,b)=>b-a);
    ySel.selectAll("option").data(years).enter().append("option").text(d=>d).attr("value",d=>d);
    ySel.property("value", 2020);
    
    const ctx = document.getElementById('radarCanvas').getContext('2d');
    let radarChart = new Chart(ctx, {
        type: 'radar',
        data: {
            labels: ['Coal', 'Oil', 'Gas', 'Nuclear', 'Renewables'],
            datasets: [{
                label: 'Country 1',
                data: [0,0,0,0,0],
                backgroundColor: 'rgba(54, 162, 235, 0.3)',
                borderColor: 'rgb(54, 162, 235)',
                borderWidth: 2
            }, {
                label: 'Country 2',
                data: [0,0,0,0,0],
                backgroundColor: 'rgba(255, 99, 132, 0.3)',
                borderColor: 'rgb(255, 99, 132)',
                borderWidth: 2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                r: {
                    beginAtZero: true,
                    ticks: { color: '#fff' },
                    grid: { color: '#444' },
                    pointLabels: { color: '#fff', font: { size: 12 } }
                }
            },
            plugins: {
                legend: { labels: { color: '#fff', font: { size: 13 } } }
            }
        }
    });
    
    function update() {
        const c1 = c1Sel.property("value");
        const c2 = c2Sel.property("value");
        const yr = +ySel.property("value");
        
        const r1 = dataset.find(d => d.country === c1 && d.year === yr);
        const r2 = dataset.find(d => d.country === c2 && d.year === yr);
        
        radarChart.data.datasets[0].label = c1;
        radarChart.data.datasets[1].label = c2;
        
        if (r1) {
            radarChart.data.datasets[0].data = [
                r1.coal_consumption, r1.oil_consumption, r1.gas_consumption,
                r1.nuclear_consumption, r1.renewables_consumption
            ];
        } else {
            radarChart.data.datasets[0].data = [0,0,0,0,0];
        }
        
        if (r2) {
            radarChart.data.datasets[1].data = [
                r2.coal_consumption, r2.oil_consumption, r2.gas_consumption,
                r2.nuclear_consumption, r2.renewables_consumption
            ];
        } else {
            radarChart.data.datasets[1].data = [0,0,0,0,0];
        }
        
        radarChart.update();
    }
    
    c1Sel.on("change", update);
    c2Sel.on("change", update);
    ySel.on("change", update);
    update();
}


function initTreemap() {
    const container = d3.select("#treemap-container");
    const svg = container.append("svg").attr("width", width).attr("height", 600);
    
    const yearSel = d3.select("#treemapYear");
    const groupSel = d3.select("#treemapGroup");
    
    const years = [...new Set(dataset.map(d => d.year))].sort((a,b)=>b-a);
    yearSel.selectAll("option").data(years).enter().append("option").text(d=>d).attr("value",d=>d);
    yearSel.property("value", 2020);
    
    const color = d3.scaleOrdinal(d3.schemeCategory10);
    
    function update() {
        const yr = +yearSel.property("value");
        const groupBy = groupSel.property("value");
        
        const yearData = dataset.filter(d => d.year === yr && d.primary_energy_consumption > 0);
        
        const grouped = d3.group(yearData, d => d[groupBy]);
        const hierarchyData = {
            name: "World",
            children: Array.from(grouped, ([key, values]) => ({
                name: key,
                children: values.map(d => ({
                    name: d.country,
                    value: d.primary_energy_consumption
                }))
            }))
        };
        
        const root = d3.hierarchy(hierarchyData)
            .sum(d => d.value)
            .sort((a, b) => b.value - a.value);
        
        d3.treemap()
            .size([width, 600])
            .padding(2)
            (root);
        
        svg.selectAll("g").remove();
        
        const leaf = svg.selectAll("g")
            .data(root.leaves())
            .enter().append("g")
            .attr("transform", d => `translate(${d.x0},${d.y0})`);
        
        leaf.append("rect")
            .attr("width", d => d.x1 - d.x0)
            .attr("height", d => d.y1 - d.y0)
            .attr("fill", d => color(d.parent.data.name))
            .attr("stroke", "#1a1a1a")
            .attr("stroke-width", 2)
            .style("opacity", 0.8)
            .on("mouseover", function() {
                d3.select(this).style("opacity", 1).attr("stroke", "#fff");
            })
            .on("mouseout", function() {
                d3.select(this).style("opacity", 0.8).attr("stroke", "#1a1a1a");
            });
        
        leaf.append("text")
            .attr("x", 5)
            .attr("y", 18)
            .text(d => {
                const w = d.x1 - d.x0;
                return w > 60 ? d.data.name : "";
            })
            .style("fill", "#fff")
            .style("font-size", "11px")
            .style("font-weight", "bold");
        
        leaf.append("text")
            .attr("x", 5)
            .attr("y", 32)
            .text(d => {
                const w = d.x1 - d.x0;
                return w > 60 ? `${d.value.toFixed(0)} TWh` : "";
            })
            .style("fill", "#ddd")
            .style("font-size", "10px");
    }
    
    yearSel.on("change", update);
    groupSel.on("change", update);
    update();
}


function initLineRace() {
    const svg = d3.select("#linerace-container").append("svg")
        .attr("width", width).attr("height", 600);
    
    const margin = {top: 30, right: 180, bottom: 50, left: 60};
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = 600 - margin.top - margin.bottom;
    const g = svg.append("g").attr("transform", `translate(${margin.left},${margin.top})`);
    
    const years = [...new Set(dataset.map(d => d.year))].sort((a,b)=>a-b);
    const topCountries = [...new Set(
        dataset.filter(d => d.year === 2020)
            .sort((a,b) => b.primary_energy_consumption - a.primary_energy_consumption)
            .slice(0, 10)
            .map(d => d.country)
    )];
    
    const x = d3.scaleLinear().domain([years[0], years[years.length-1]]).range([0, innerWidth]);
    const y = d3.scaleLinear().range([innerHeight, 0]);
    const color = d3.scaleOrdinal(d3.schemeCategory10).domain(topCountries);
    
    const line = d3.line()
        .x(d => x(d.year))
        .y(d => y(d.value))
        .curve(d3.curveMonotoneX);
    
    g.append("g").attr("transform", `translate(0,${innerHeight})`).call(d3.axisBottom(x).tickFormat(d3.format("d")));
    const yAxis = g.append("g");
    
    const paths = g.append("g");
    const labels = g.append("g");
    
    let currentYear = years[0];
    let animationInterval = null;
    
    function update(maxYear) {
        const data = topCountries.map(country => {
            const values = dataset
                .filter(d => d.country === country && d.year <= maxYear)
                .map(d => ({ year: d.year, value: d.primary_energy_consumption }))
                .sort((a,b) => a.year - b.year);
            return { country, values };
        });
        
        const maxVal = d3.max(data, d => d3.max(d.values, v => v.value)) || 1;
        y.domain([0, maxVal]);
        yAxis.transition().duration(300).call(d3.axisLeft(y).ticks(5));
        
        const pathsSelection = paths.selectAll("path").data(data, d => d.country);
        
        pathsSelection.enter()
            .append("path")
            .attr("fill", "none")
            .attr("stroke", d => color(d.country))
            .attr("stroke-width", 3)
            .attr("opacity", 0.8)
            .merge(pathsSelection)
            .transition().duration(300)
            .attr("d", d => line(d.values));
        
        pathsSelection.exit().remove();
        
        const labelsSelection = labels.selectAll("text").data(data, d => d.country);
        
        labelsSelection.enter()
            .append("text")
            .attr("fill", d => color(d.country))
            .attr("font-size", "12px")
            .attr("font-weight", "bold")
            .merge(labelsSelection)
            .transition().duration(300)
            .attr("x", innerWidth + 10)
            .attr("y", d => {
                const last = d.values[d.values.length - 1];
                return last ? y(last.value) + 5 : 0;
            })
            .text(d => d.country);
        
        labelsSelection.exit().remove();
        
        svg.selectAll(".year-label").remove();
        svg.append("text")
            .attr("class", "year-label")
            .attr("x", width - 100)
            .attr("y", 40)
            .attr("fill", "#89CFF0")
            .attr("font-size", "32px")
            .attr("font-weight", "bold")
            .text(maxYear);
    }
    
    d3.select("#btnLineRacePlay").on("click", () => {
        if (animationInterval) return;
        currentYear = years[0];
        animationInterval = setInterval(() => {
            update(currentYear);
            currentYear++;
            if (currentYear > years[years.length-1]) {
                clearInterval(animationInterval);
                animationInterval = null;
            }
        }, 400);
    });
    
    d3.select("#btnLineRaceReset").on("click", () => {
        if (animationInterval) {
            clearInterval(animationInterval);
            animationInterval = null;
        }
        currentYear = years[0];
        update(currentYear);
    });
    
    update(years[0]);
}


function initSankey() {
    const svg = d3.select("#sankey-container").append("svg")
        .attr("width", width).attr("height", 700);
    
    const yearSel = d3.select("#sankeyYear");
    const years = [...new Set(dataset.map(d => d.year))].sort((a,b)=>b-a);
    yearSel.selectAll("option").data(years).enter().append("option").text(d=>d).attr("value",d=>d);
    yearSel.property("value", 2020);
    
    function update() {
        const yr = +yearSel.property("value");
        const yearData = dataset.filter(d => d.year === yr);
        
        const sources = ['Coal', 'Oil', 'Gas', 'Nuclear', 'Renewables'];
        const regions = [...new Set(yearData.map(d => d.continent))].filter(r => r !== 'Other');
        
        const nodes = [...sources, ...regions].map((name, i) => ({ name, id: i }));
        
        const links = [];
        sources.forEach(source => {
            const field = source.toLowerCase() + '_consumption';
            regions.forEach(region => {
                const total = d3.sum(
                    yearData.filter(d => d.continent === region),
                    d => d[field] || 0
                );
                if (total > 0) {
                    const sourceNode = nodes.find(n => n.name === source);
                    const targetNode = nodes.find(n => n.name === region);
                    links.push({
                        source: sourceNode.id,
                        target: targetNode.id,
                        value: total
                    });
                }
            });
        });
        
        svg.selectAll("*").remove();
        
        const margin = 50;
        const nodeWidth = 20;
        const nodePadding = 30;
        
        const x0 = margin;
        const x1 = width - margin;
        const y0 = margin;
        const y1 = 700 - margin;
        
        nodes.forEach((node, i) => {
            if (i < sources.length) {
                node.x = x0;
                node.y = y0 + (i * (y1 - y0) / sources.length);
            } else {
                node.x = x1 - nodeWidth;
                node.y = y0 + ((i - sources.length) * (y1 - y0) / regions.length);
            }
            node.width = nodeWidth;
            node.height = 40;
        });
        
        const color = d3.scaleOrdinal(d3.schemeCategory10);
        
        const linkPaths = svg.append("g")
            .selectAll("path")
            .data(links)
            .enter().append("path")
            .attr("d", d => {
                const src = nodes[d.source];
                const tgt = nodes[d.target];
                const x0 = src.x + src.width;
                const x1 = tgt.x;
                const xi = d3.interpolateNumber(x0, x1);
                const x2 = xi(0.5);
                const y0 = src.y + src.height/2;
                const y1 = tgt.y + tgt.height/2;
                return `M${x0},${y0} C${x2},${y0} ${x2},${y1} ${x1},${y1}`;
            })
            .attr("fill", "none")
            .attr("stroke", d => color(d.source))
            .attr("stroke-width", d => Math.max(1, d.value / 50))
            .attr("opacity", 0.4)
            .on("mouseover", function() {
                d3.select(this).attr("opacity", 0.7).attr("stroke-width", d => Math.max(3, d.value / 30));
            })
            .on("mouseout", function() {
                d3.select(this).attr("opacity", 0.4).attr("stroke-width", d => Math.max(1, d.value / 50));
            });
        
        const nodeRects = svg.append("g")
            .selectAll("rect")
            .data(nodes)
            .enter().append("rect")
            .attr("x", d => d.x)
            .attr("y", d => d.y)
            .attr("width", d => d.width)
            .attr("height", d => d.height)
            .attr("fill", (d,i) => color(i))
            .attr("stroke", "#fff")
            .attr("stroke-width", 2);
        
        const nodeLabels = svg.append("g")
            .selectAll("text")
            .data(nodes)
            .enter().append("text")
            .attr("x", d => d.x < width/2 ? d.x - 10 : d.x + d.width + 10)
            .attr("y", d => d.y + d.height/2 + 5)
            .attr("text-anchor", d => d.x < width/2 ? "end" : "start")
            .attr("fill", "#fff")
            .attr("font-size", "13px")
            .attr("font-weight", "bold")
            .text(d => d.name);
    }
    
    yearSel.on("change", update);
    update();
}