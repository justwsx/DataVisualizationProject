function initRadarChart() {
    const countries = [...new Set(dataset.filter(d => d.primary_energy_consumption > 0).map(d => d.country))].sort();
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
            datasets: [{ label: 'Country 1', data: [0,0,0,0,0], backgroundColor: 'rgba(54, 162, 235, 0.3)', borderColor: 'rgb(54, 162, 235)', borderWidth: 2 },
                       { label: 'Country 2', data: [0,0,0,0,0], backgroundColor: 'rgba(255, 99, 132, 0.3)', borderColor: 'rgb(255, 99, 132)', borderWidth: 2 }]
        },
        options: {
            responsive: true, maintainAspectRatio: false,
            scales: { r: { beginAtZero: true, ticks: { color: '#fff' }, grid: { color: '#444' }, pointLabels: { color: '#fff' } } },
            plugins: { legend: { labels: { color: '#fff' } } }
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
        radarChart.data.datasets[0].data = r1 ? [r1.coal_consumption, r1.oil_consumption, r1.gas_consumption, r1.nuclear_consumption, r1.renewables_consumption] : [0,0,0,0,0];
        radarChart.data.datasets[1].data = r2 ? [r2.coal_consumption, r2.oil_consumption, r2.gas_consumption, r2.nuclear_consumption, r2.renewables_consumption] : [0,0,0,0,0];
        radarChart.update();
    }
    c1Sel.on("change", update); c2Sel.on("change", update); ySel.on("change", update); update();
}