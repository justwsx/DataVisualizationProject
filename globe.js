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