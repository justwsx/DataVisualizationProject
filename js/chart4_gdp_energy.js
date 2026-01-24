class GDPEnergyChart {
  constructor(data) {
    this.data = data;
    this.container = "chart-gdp-energy";

    this.useGdpBillions = true;

    this.regionColors = {
      "Africa": "#dc2626",
      "Asia": "#0891b2",
      "Europe": "#7c3aed",
      "North America": "#ea580c",
      "South America": "#16a34a",
      "Oceania": "#eaa400",
      "Other": "#6b7280"
    };

    this.countryRegions = {
      "United States": "North America",
      "Canada": "North America",
      "Mexico": "North America",
      "Brazil": "South America",
      "Argentina": "South America",
      "Chile": "South America",
      "United Kingdom": "Europe",
      "Germany": "Europe",
      "France": "Europe",
      "Italy": "Europe",
      "Poland": "Europe",
      "Russia": "Asia",
      "Turkey": "Asia",
      "Spain": "Europe",
      "Netherlands": "Europe",
      "Belgium": "Europe",
      "Sweden": "Europe",
      "Norway": "Europe",
      "Switzerland": "Europe",
      "China": "Asia",
      "India": "Asia",
      "Japan": "Asia",
      "South Korea": "Asia",
      "Indonesia": "Asia",
      "Thailand": "Asia",
      "Saudi Arabia": "Asia",
      "Iran": "Asia",
      "Vietnam": "Asia",
      "Pakistan": "Asia",
      "Bangladesh": "Asia",
      "Australia": "Oceania",
      "South Africa": "Africa",
      "Egypt": "Africa",
      "Nigeria": "Africa",
      "Kenya": "Africa",
      "Morocco": "Africa"
    };


    this.margin = { left: 80, right: 30, top: 100, bottom: 190 };
    
    this._init();
  }

  _init() {
    this.root = d3.select(`#${this.container}`);
    this.root.style("position", "relative");

    this.tooltip = this.root
      .append("div")
      .style("position", "absolute")
      .style("pointer-events", "none")
      .style("opacity", 0)
      .style("background", "rgba(255,255,255,0.95)")
      .style("border", "1px solid rgba(226,232,240,0.9)")
      .style("border-radius", "10px")
      .style("padding", "10px 12px")
      .style("font-family", "Inter, system-ui, sans-serif")
      .style("font-size", "12px")
      .style("color", "#0f172a")
      .style("box-shadow", "0 6px 18px rgba(15,23,42,0.12)")
      .style("z-index", "10"); // اطمینان از اینکه تولتیپ رو قرار میگیرد

    this.svg = this.root.append("svg")
      .attr("role", "img")
      .style("width", "100%")
      .style("height", "100%")
      .style("overflow", "visible") // اجازه میدهد اگر چیزی کمی بیرون زد دیده شود
      .style("background", "transparent");

    this.g = this.svg.append("g");

    this.title = this.svg.append("text")
      .attr("text-anchor", "middle")
      .style("font-family", "Inter, system-ui, sans-serif")
      .style("font-size", "18px")
      .style("font-weight", "700")
      .style("fill", "#1e293b");

    this.xGridG = this.g.append("g").attr("class", "x-grid");
    this.yGridG = this.g.append("g").attr("class", "y-grid");
    this.xAxisG = this.g.append("g").attr("class", "x-axis");
    this.yAxisG = this.g.append("g").attr("class", "y-axis");

    this.xLabel = this.svg.append("text")
      .attr("text-anchor", "middle")
      .style("font-family", "Inter, system-ui, sans-serif")
      .style("font-size", "13px")
      .style("font-weight", "600")
      .style("fill", "#475569")
      .text("GDP per Capita");

    this.yLabel = this.svg.append("text")
      .attr("text-anchor", "middle")
      .style("font-family", "Inter, system-ui, sans-serif")
      .style("font-size", "13px")
      .style("font-weight", "600")
      .style("fill", "#475569")
      .text("Primary Energy Consumption");

    this.bubblesG = this.g.append("g").attr("class", "bubbles");
    this.legendG = this.svg.append("g").attr("class", "legend");
    this.annotationG = this.svg.append("g").attr("class", "annotation");

    this.resizeObserver = new ResizeObserver(() => this.resize());
    const node = document.getElementById(this.container);
    if (node) this.resizeObserver.observe(node);
  }

  getRegion(country) {
    return this.countryRegions[country] || "Other";
  }

  update(selectedYear) {
    this.currentYear = selectedYear;

    let yearData = this.data.filter(d => d.year === selectedYear);

    if (yearData.length === 0) {
      const availableYears = [...new Set(this.data.map(d => d.year))].sort((a, b) => b - a);
      if (availableYears.length) yearData = this.data.filter(d => d.year === availableYears[0]);
    }

    yearData = yearData
      .filter(d => d.primary_energy_consumption > 0 && d.gdp > 0)
      .map(d => ({ ...d, region: this.getRegion(d.country) }));

    this._render(yearData);
  }

  _render(yearData) {
    const containerNode = document.getElementById(this.container);
    if (!containerNode) return;

    // دریافت ابعاد کانتینر
    const width = containerNode.clientWidth || 900;
    const height = containerNode.clientHeight || 550;

    // محاسبه فضای داخلی نمودار
    const innerW = width - this.margin.left - this.margin.right;
    const innerH = height - this.margin.top - this.margin.bottom;

    // تنظیم ViewBox
    this.svg.attr("viewBox", `0 0 ${width} ${height}`);
    this.g.attr("transform", `translate(${this.margin.left},${this.margin.top})`);

    // موقعیت تایتل (بالای همه چیز)
    this.title.attr("x", width / 2).attr("y", 30);

    // --- تنظیم موقعیت لیبل محور X ---
    // این لیبل حالا پایین‌تر از نمودار و دقیقاً در فضای مارجین پایین قرار می‌گیرد
    this.xLabel
      .attr("x", this.margin.left + innerW / 2)
      .attr("y", this.margin.top + innerH + 50); // فاصله ۵۰ پیکسلی از خط محور

    // تنظیم موقعیت لیبل محور Y
    this.yLabel
      .attr("transform", `translate(20,${this.margin.top + innerH / 2}) rotate(-90)`);

    const xVal = d => this.useGdpBillions ? (d.gdp / 1e9) : d.gdp;
    const yVal = d => d.primary_energy_consumption;

    const xVals = yearData.map(xVal).filter(v => v > 0 && Number.isFinite(v));
    const yVals = yearData.map(yVal).filter(v => v > 0 && Number.isFinite(v));

    if (xVals.length === 0 || yVals.length === 0) {
      this.bubblesG.selectAll("circle").remove();
      this.legendG.selectAll("*").remove();
      this.annotationG.selectAll("*").remove();
      return;
    }

    const padLogDomain = ([mn, mx]) => {
      const a = Math.pow(10, Math.floor(Math.log10(mn)));
      const b = Math.pow(10, Math.ceil(Math.log10(mx)));
      return [a, b];
    };

    const [xMin, xMax] = padLogDomain(d3.extent(xVals));
    const [yMin, yMax] = padLogDomain(d3.extent(yVals));

    this.xScale = d3.scaleLog().domain([xMin, xMax]).range([0, innerW]);
    this.yScale = d3.scaleLog().domain([yMin, yMax]).range([innerH, 0]);

    // Grid Lines
    const xGrid = d3.axisBottom(this.xScale).ticks(6).tickSize(-innerH).tickFormat("");
    const yGrid = d3.axisLeft(this.yScale).ticks(6).tickSize(-innerW).tickFormat("");

    // خطوط گرید باید دقیقاً به اندازه ارتفاع داخلی پایین بیایند
    this.xGridG.attr("transform", `translate(0,${innerH})`).call(xGrid);
    this.yGridG.call(yGrid);

    this.xGridG.selectAll("line").attr("stroke", "rgba(226, 232, 240, 0.4)");
    this.yGridG.selectAll("line").attr("stroke", "rgba(226, 232, 240, 0.4)");
    this.xGridG.selectAll("path").attr("stroke", "none");
    this.yGridG.selectAll("path").attr("stroke", "none");

    // Axes
    const xAxis = d3.axisBottom(this.xScale).ticks(6, "~s");
    const yAxis = d3.axisLeft(this.yScale).ticks(6, "~s");

    // --- نکته مهم: انتقال محور X به پایین ---
    this.xAxisG.attr("transform", `translate(0,${innerH})`).call(xAxis);
    this.yAxisG.call(yAxis);

    // استایل‌دهی به متن محورها
    this.g.selectAll(".x-axis text, .y-axis text")
      .style("font-family", "Inter, system-ui, sans-serif")
      .style("font-size", "11px")
      .style("fill", "#64748b");

    this.g.selectAll(".x-axis path, .y-axis path")
      .attr("stroke", "rgba(226, 232, 240, 0.9)");
    
    this.g.selectAll(".x-axis line, .y-axis line")
      .attr("stroke", "rgba(226, 232, 240, 0.9)");

    // Bubbles logic
    const popVals = yearData
      .map(d => d.population)
      .filter(v => v > 0 && Number.isFinite(v));
    const popExt = popVals.length ? d3.extent(popVals) : [1e6, 1e6];
    const rScale = d3.scaleSqrt().domain(popExt).range([6, 45]);
    const r = d => rScale((d.population && d.population > 0) ? d.population : popExt[0]);

    const circles = this.bubblesG
      .selectAll("circle")
      .data(yearData, d => d.country);

    circles.join(
      enter => enter.append("circle")
        .attr("cx", d => this.xScale(xVal(d)))
        .attr("cy", d => this.yScale(yVal(d)))
        .attr("r", 0)
        .attr("fill", d => this.regionColors[d.region] || "#6b7280")
        .attr("fill-opacity", 0.85)
        .attr("stroke", "white")
        .attr("stroke-width", 1.5)
        .on("mouseenter", (event, d) => this._showTooltip(event, d, xVal(d), yVal(d)))
        .on("mousemove", (event) => this._moveTooltip(event))
        .on("mouseleave", () => this._hideTooltip())
        .call(sel => sel.transition().duration(500).attr("r", d => r(d))),
      update => update
        .on("mouseenter", (event, d) => this._showTooltip(event, d, xVal(d), yVal(d)))
        .on("mousemove", (event) => this._moveTooltip(event))
        .on("mouseleave", () => this._hideTooltip())
        .call(sel => sel.transition().duration(500)
          .attr("cx", d => this.xScale(xVal(d)))
          .attr("cy", d => this.yScale(yVal(d)))
          .attr("r", d => r(d))
          .attr("fill", d => this.regionColors[d.region] || "#6b7280")
        ),
      exit => exit.call(sel => sel.transition().duration(250).attr("r", 0).remove())
    );

    // Annotation (Bubble size explanation)
    this.annotationG.selectAll("*").remove();
    const annX = this.margin.left + 10;
    const annY = this.margin.top + 10;
    const annText = "Bubble size = Population";
    const padX = 10, padY = 6;

    const txt = this.annotationG.append("text")
      .attr("x", annX + padX)
      .attr("y", annY + padY + 10)
      .style("font-family", "Inter, system-ui, sans-serif")
      .style("font-size", "11px")
      .style("fill", "#64748b")
      .text(annText);

    const bbox = txt.node().getBBox();
    this.annotationG.insert("rect", "text")
      .attr("x", bbox.x - padX)
      .attr("y", bbox.y - padY)
      .attr("width", bbox.width + padX * 2)
      .attr("height", bbox.height + padY * 2)
      .attr("rx", 8).attr("ry", 8)
      .attr("fill", "rgba(255,255,255,0.9)")
      .attr("stroke", "rgba(226, 232, 240, 0.8)");

    // Legend Logic (Top center)
    this.legendG.selectAll("*").remove();
    
    // لجند را در بالای نمودار (در فضای margin.top) قرار می‌دهیم
    const legendY = 60; 
    const legendXCenter = width / 2;
    const legendWrapW = width - 40;
    const rowH = 18;
    const gap = 16;
    const regions = [...new Set(yearData.map(d => d.region).filter(Boolean))];

    const legendBoxG = this.legendG.append("g")
      .attr("transform", `translate(${legendXCenter},${legendY})`);

    let xCursor = 0;
    let yCursor = 0;
    
    // یک چیدمان خطی ساده برای محاسبه عرض کل
    const items = legendBoxG.selectAll("g.item")
      .data(regions)
      .enter()
      .append("g")
      .attr("class", "item");

    items.each((region, i, nodes) => {
      const g = d3.select(nodes[i]);
      g.append("rect")
        .attr("x", 0).attr("y", -10).attr("width", 10).attr("height", 10).attr("rx", 3)
        .attr("fill", this.regionColors[region] || "#6b7280");
      
      const t = g.append("text")
        .attr("x", 14).attr("y", -2)
        .style("font-family", "Inter, system-ui, sans-serif")
        .style("font-size", "12px")
        .style("fill", "#0f172a")
        .text(region);
      
      const w = t.node().getBBox().width + 24;
      
      if (xCursor + w > legendWrapW) {
        xCursor = 0;
        yCursor += rowH;
      }
      
      // چیدن آیتم‌ها
      // برای وسط‌چین کردن دقیق، اینجا یک افست تقریبی می‌زنیم
      // (در کدهای واقعی‌تر عرض کل سطر محاسبه و سپس وسط‌چین می‌شود)
      g.attr("transform", `translate(${xCursor - 300},${yCursor})`);
      xCursor += w + gap;
    });

    const legendBBox = legendBoxG.node().getBBox();
    this.legendG.insert("rect", "g")
      .attr("x", legendXCenter + legendBBox.x - 14)
      .attr("y", legendY + legendBBox.y - 10)
      .attr("width", legendBBox.width + 28)
      .attr("height", legendBBox.height + 20)
      .attr("rx", 12).attr("ry", 12)
      .attr("fill", "rgba(255,255,255,0.95)")
      .attr("stroke", "rgba(226, 232, 240, 0.8)");
  }

  _showTooltip(event, d, gx, ey) {
    const gdpText = this.useGdpBillions ? `$${d3.format(",.1f")(gx)}B` : `$${d3.format(",.0f")(gx)}`;
    const energyText = `${d3.format(",.0f")(ey)} kWh per capita`;
    const popText = d3.format(",.0f")(d.population || 0);

    this.tooltip.style("opacity", 1)
      .html(
        `<div style="font-weight:700;margin-bottom:6px;">${d.country}</div>` +
        `<div>GDP: <b>${gdpText}</b></div>` +
        `<div>Energy: <b>${energyText}</b></div>` +
        `<div>Population: <b>${popText}</b></div>`
      );
    this._moveTooltip(event);
  }

  _moveTooltip(event) {
    const [mx, my] = d3.pointer(event, this.root.node());
    this.tooltip.style("left", `${mx + 14}px`).style("top", `${my + 14}px`);
  }

  _hideTooltip() {
    this.tooltip.style("opacity", 0);
  }

  resize() {
    if (this.currentYear != null) this.update(this.currentYear);
  }

  destroy() {
    if (this.resizeObserver) this.resizeObserver.disconnect();
    this.root.selectAll("*").remove();
  }
}
