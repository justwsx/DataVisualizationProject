function initDonutChart() {
    const countriesWithData = [...new Set(dataset.filter(d => d.primary_energy_consumption > 0).map(d => d.country))].sort();
    const cSel = d3.select("#countrySelectDonut");
    cSel.selectAll("option").data(countriesWithData).enter().append("option").text(d=>d).attr("value",d=>d);
    cSel.property("value", "China");
    
    const years = [...new Set(dataset.map(d => d.year))].sort((a,b)=>b-a);
    const ySel = d3.select("#yearSelectDonut");
    ySel.selectAll("option").data(years).enter().append("option").text(d=>d).attr("value",d=>d);
    
    const ctx = document.getElementById('donutCanvas').getContext('2d');
    let myChart = new Chart(ctx, {
        type: 'doughnut',
        data: {
            labels: ['Coal', 'Oil', 'Gas', 'Nuclear', 'Renewables'],
            datasets: [{
                data: [0,0,0,0,0],
                backgroundColor: ["#555", "#c0392b", "#e67e22", "#8e44ad", "#27ae60"],
                borderWidth: 2, borderColor: '#1a1a1a'
            }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            plugins: { legend: { labels: { color: '#fff' } } }
        }
    });

    function update() {
        const c = cSel.property("value");
        const yr = +ySel.property("value");
        const row = dataset.find(d => d.country === c && d.year === yr);
        if(row && row.primary_energy_consumption > 0) {
            myChart.data.datasets[0].data = [row.coal_consumption, row.oil_consumption, row.gas_consumption, row.nuclear_consumption, row.renewables_consumption];
            myChart.update();
            d3.select("#donut-info").html(`Total Energy: <strong>${row.primary_energy_consumption.toFixed(1)} TWh</strong>`);
        } else {
            myChart.data.datasets[0].data = [0,0,0,0,0]; myChart.update();
            d3.select("#donut-info").html(`<span style="color:#f39c12;">No data available</span>`);
        }
    }
    cSel.on("change", update); ySel.on("change", update); update();
}