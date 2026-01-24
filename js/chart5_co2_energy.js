class CO2EnergyChart {
  constructor(data) {
    this.data = data;
    this.elementId = "chart-co2-energy";
    this.year = 2020;

    this.fixedHeight = 500;
    this.margin = { top: 30, right: 130, bottom: 80, left: 60 };

    this.maxR = 45;
    this.clipPad = this.maxR + 2;
    this.domainPadFactor = 1.35;

    this.colorScale = d3.scaleLinear()
      .domain([0, 25, 50, 75, 90, 100])
      .range(["#22c55e", "#84cc16", "#eab308", "#f97316", "#dc2626", "#7f1d1d"])
      .clamp(true);

    this.tooltip = d3.select("body")
      .selectAll(".d3-tooltip")
      .data([0])
      .join("div")
      .attr("class", "d3-tooltip")
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
      .style("z-index", "9999");

    this._computeGlobalDomains();
    this._initOnce();

    const container = document.getElementById(this.elementId);
    if (container) {
      this._lastSize = { w: 0, h: 0 };
      let raf = 0;
      this.observer = new ResizeObserver(entries => {
        for (const entry of entries) {
          const w = Math.round(entry.contentRect.width);
          const h = Math.round(entry.contentRect.height);
          if (w <= 0) return;
          if (w === this._lastSize.w && h === this._lastSize.h) return;
          this._lastSize = { w, h };
          cancelAnimationFrame(raf);
          raf = requestAnimationFrame(() => this.resize());
        }
      });
      this.observer.observe(container);
    }

    this.update(this.year, { duration: 0 });
  }

  update(year, opts = {}) {
    this.year = year;
    const duration = Number.isFinite(opts.duration) ? opts.duration : 350;
    this.draw({ duration });
  }

  resize() {
    this.draw({ duration: 0 });
  }

  destroy() {
    if (this.observer) this.observer.disconnect();
    if (this.root) this.root.selectAll("*").remove();
  }

  _computeGlobalDomains() {
    const energies = this.data
      .map(d => d.primary_energy_consumption)
      .filter(v => Number.isFinite(v) && v > 0);

    const pops = this.data
      .map(d => d.population)
      .filter(v => Number.isFinite(v) && v > 0);

    const minE = energies.length ? d3.min(energies) : 100;
    const maxE = energies.length ? d3.max(energies) : 150000;

    const minPad = Math.max(minE / this.domainPadFactor, minE * 0.25, 1e-6);
    const maxPad = maxE * this.domainPadFactor;

    this.xDomain = [minPad, maxPad];
    this.yDomain = [0, 100];
    this.popDomain = pops.length ? d3.extent(pops) : [1e6, 1e6];

    this.baseXTicks = [10, 50, 100, 500, 1000, 5000, 10000, 50000, 100000, 200000, 500000];
  }

  _initOnce() {
    const container = document.getElementById(this.elementId);
    if (!container) return;

    container.style.width = "100%";
    container.style.height = `${this.fixedHeight}px`;
    container.style.minHeight = `${this.fixedHeight}px`;
    container.style.overflow = "visible";
    container.style.position = "relative";

    this.root = d3.select(container);

    this.svgRoot = this.root.append("svg")
      .style("display", "block")
      .style("font-family", "Inter, system-ui, sans-serif")
      .style("overflow", "visible");

    this.svg = this.svgRoot.append("g");
    this.defs = this.svgRoot.append("defs");

    this.clipId = `${this.elementId}-clip`;
    this.gradientId = `${this.elementId}-intensity-gradient`;

    this.clipPath = this.defs.append("clipPath")
      .attr("id", this.clipId)
      .attr("clipPathUnits", "userSpaceOnUse");

    this.clipRect = this.clipPath.append("rect");

    this.linearGradient = this.defs.append("linearGradient")
      .attr("id", this.gradientId)
      .attr("x1", "0%").attr("y1", "100%")
      .attr("x2", "0%").attr("y2", "0%");

    const stops = [0, 25, 50, 75, 90, 100];
    this.linearGradient.selectAll("stop")
      .data(stops)
      .join("stop")
      .attr("offset", d => `${d}%`)
      .attr("stop-color", d => this.colorScale(d));

    this.gridXG = this.svg.append("g").attr("class", "grid-x");
    this.gridYG = this.svg.append("g").attr("class", "grid-y");

    this.plotG = this.svg.append("g")
      .attr("class", "plot")
      .attr("clip-path", `url(#${this.clipId})`);

    this.bubblesG = this.plotG.append("g").attr("class", "bubbles");

    this.xAxisG = this.svg.append("g").attr("class", "x-axis");
    this.yAxisG = this.svg.append("g").attr("class", "y-axis");

    this.labelsG = this.svg.append("g").attr("class", "labels");
    this.annG = this.svg.append("g").attr("class", "annotations");
    this.legendG = this.svg.append("g").attr("class", "legend");
  }

  _getYearData() {
    const yearData = this.data.filter(
      d => d.year === this.year &&
        Number.isFinite(d.primary_energy_consumption) &&
        d.primary_energy_consumption > 0
    );

    const hasFossilData = yearData.some(
      d => Number.isFinite(d.fossil_fuel_consumption) && d.fossil_fuel_consumption > 0
    );

    return yearData.map(d => {
      let intensity = null;

      if (hasFossilData && d.fossil_fuel_consumption > 0 && d.primary_energy_consumption > 0) {
        intensity = (d.fossil_fuel_consumption / d.primary_energy_consumption) * 100;
      } else {
        const fossil =
          (d.coal_cons_per_capita || 0) +
          (d.gas_energy_per_capita || 0) +
          (d.oil_energy_per_capita || 0);

        const clean =
          (d.renewables_energy_per_capita || 0) +
          (d.hydro_elec_per_capita || 0) +
          (d.low_carbon_energy_per_capita || 0);

        const total = fossil + clean;
        if (total > 0) intensity = (fossil / total) * 100;
      }

      intensity = intensity !== null ? Math.min(Math.max(intensity, 0), 100) : null;

      return {
        country: d.country,
        energy: d.primary_energy_consumption,
        intensity,
        population: d.population
      };
    })
      .filter(d =>
        d.intensity !== null &&
        Number.isFinite(d.energy) && d.energy > 0 &&
        Number.isFinite(d.population) && d.population > 0
      )
      .sort((a, b) => b.population - a.population);
  }

  draw({ duration = 350 } = {}) {
    const container = document.getElementById(this.elementId);
    if (!container || !this.svgRoot) return;

    const rect = container.getBoundingClientRect();
    const width = rect.width > 0 ? rect.width : 800;
    const height = this.fixedHeight;

    const m = this.margin;
    const w = Math.max(10, width - m.left - m.right);
    const h = Math.max(10, height - m.top - m.bottom);

    this.svgRoot.attr("width", width).attr("height", height);
    this.svg.attr("transform", `translate(${m.left},${m.top})`);

    this.clipRect
      .attr("x", -this.clipPad)
      .attr("y", -this.clipPad)
      .attr("width", w + this.clipPad * 2)
      .attr("height", h + this.clipPad * 2);

    const x = d3.scaleLog()
      .domain(this.xDomain)
      .range([0, w]);

    const y = d3.scaleLinear()
      .domain(this.yDomain)
      .range([h, 0]);

    const r = d3.scaleSqrt()
      .domain(this.popDomain)
      .range([3, this.maxR]);

    const traceData = this._getYearData();

    this.bubblesG.selectAll("circle").interrupt();

    const xTicks = (this.baseXTicks || []).filter(v => v >= this.xDomain[0] && v <= this.xDomain[1]);
    const yTicks = [0, 20, 40, 60, 80, 100];

    const formatK = d => (d >= 1000 ? (d / 1000) + "k" : d);

    this.gridXG
      .attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).tickValues(xTicks).tickFormat("").tickSize(-h));

    this.gridXG.selectAll("line").attr("stroke", "#e2e8f0").attr("stroke-dasharray", "2,2");
    this.gridXG.select(".domain").remove();

    this.gridYG
      .call(d3.axisLeft(y).tickValues(yTicks).tickFormat("").tickSize(-w));

    this.gridYG.selectAll("line").attr("stroke", "#e2e8f0").attr("stroke-dasharray", "2,2");
    this.gridYG.select(".domain").remove();

    this.xAxisG
      .attr("transform", `translate(0,${h})`)
      .call(d3.axisBottom(x).tickValues(xTicks).tickFormat(formatK).tickPadding(10));

    this.xAxisG.select(".domain").attr("stroke", "#94a3b8").attr("stroke-width", 1);
    this.xAxisG.selectAll("text").attr("fill", "#1e293b").style("font-size", "11px").style("font-weight", "500");

    this.yAxisG
      .call(d3.axisLeft(y).tickValues(yTicks).tickFormat(d => d + "%"));

    this.yAxisG.select(".domain").remove();
    this.yAxisG.selectAll("text").attr("fill", "#64748b").style("font-size", "11px");

    this.labelsG.selectAll("*").remove();

    this.labelsG.append("text")
      .attr("x", w / 2)
      .attr("y", h + 50)
      .text("Primary Energy Consumption (kWh per capita)")
      .attr("fill", "#64748b")
      .attr("text-anchor", "middle")
      .style("font-size", "13px");

    this.labelsG.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -50)
      .attr("x", -h / 2)
      .text("Carbon Intensity (%)")
      .attr("fill", "#64748b")
      .attr("text-anchor", "middle")
      .style("font-size", "13px");

    this.annG.selectAll("*").remove();

    this.annG.append("text")
      .attr("x", 20)
      .attr("y", -20)
      .text("Bubble size = Population")
      .style("font-size", "11px")
      .attr("fill", "#64748b");

    this.annG.append("text")
      .attr("x", w - 140)
      .attr("y", h - 20)
      .text("Lower % = Cleaner Energy")
      .style("font-size", "11px")
      .attr("fill", "#059669");

    const circles = this.bubblesG
      .selectAll("circle")
      .data(traceData, d => d.country);

    const dur = Math.max(0, duration);

    circles.join(
      enter => enter.append("circle")
        .attr("cx", d => x(d.energy))
        .attr("cy", d => y(d.intensity))
        .attr("r", 0)
        .attr("fill", d => this.colorScale(d.intensity))
        .attr("fill-opacity", 0.85)
        .attr("stroke", "white")
        .attr("stroke-width", 1)
        .on("mouseover", (e, d) => this._onOver(e, d))
        .on("mousemove", (e) => this._onMove(e))
        .on("mouseout", (e) => this._onOut(e))
        .transition()
        .duration(dur)
        .attr("r", d => r(d.population)),
      update => update
        .transition()
        .duration(dur)
        .attr("cx", d => x(d.energy))
        .attr("cy", d => y(d.intensity))
        .attr("r", d => r(d.population))
        .attr("fill", d => this.colorScale(d.intensity)),
      exit => exit
        .transition()
        .duration(dur)
        .attr("r", 0)
        .remove()
    );

    this._drawColorBar(w, h);
  }

  _onOver(e, d) {
    d3.select(e.target).attr("stroke", "#333").attr("stroke-width", 2);
    this.tooltip
      .style("opacity", 1)
      .html(
        `<div style="font-weight:700;margin-bottom:6px;">${d.country}</div>` +
        `<div>Intensity: <b>${d.intensity.toFixed(1)}%</b></div>` +
        `<div>Energy: <b>${d3.format(",.0f")(d.energy)} kWh</b></div>` +
        `<div>Pop: <b>${d3.format(",.0f")(d.population)}</b></div>`
      );
    this._onMove(e);
  }

  _onMove(e) {
    this.tooltip
      .style("left", (e.pageX + 12) + "px")
      .style("top", (e.pageY - 18) + "px");
  }

  _onOut(e) {
    d3.select(e.target).attr("stroke", "white").attr("stroke-width", 1);
    this.tooltip.style("opacity", 0);
  }

  _drawColorBar(w, h) {
    this.legendG.selectAll("*").remove();

    const barWidth = 12;
    const barHeight = h * 0.5;
    const barX = w + 40;
    const barY = h * 0.25;

    const legendG = this.legendG.append("g")
      .attr("transform", `translate(${barX}, ${barY})`);

    legendG.append("text")
      .attr("x", 0)
      .attr("y", -10)
      .text("Intensity")
      .style("font-size", "10px")
      .attr("fill", "#475569")
      .style("font-weight", "bold");

    legendG.append("rect")
      .attr("width", barWidth)
      .attr("height", barHeight)
      .style("fill", `url(#${this.gradientId})`)
      .attr("stroke", "#e2e8f0");

    const legendScale = d3.scaleLinear()
      .domain([0, 100])
      .range([barHeight, 0]);

    const legendAxis = d3.axisRight(legendScale)
      .tickValues([0, 20, 40, 60, 80, 100])
      .tickFormat(d => d + "%");

    legendG.append("g")
      .attr("transform", `translate(${barWidth}, 0)`)
      .call(legendAxis)
      .call(g => g.select(".domain").remove())
      .call(g => g.selectAll("text").style("font-size", "9px").attr("fill", "#64748b"));
  }
}
