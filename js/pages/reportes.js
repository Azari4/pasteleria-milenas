/* =============================================
   PAGE: Reportes
   ============================================= */
window.Pages = window.Pages || {};

Pages.reportes = {
    render() {
        const stats = this.getStats();
        return `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon pink"><i data-lucide="file-text"></i></div>
                <div class="stat-info"><h3>${stats.totalCot}</h3><p>Cotizaciones</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green"><i data-lucide="check-circle"></i></div>
                <div class="stat-info"><h3>${stats.aceptadas}</h3><p>Aceptadas</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon purple"><i data-lucide="shopping-bag"></i></div>
                <div class="stat-info"><h3>${stats.totalPed}</h3><p>Pedidos</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon blue"><i data-lucide="dollar-sign"></i></div>
                <div class="stat-info"><h3>${App.formatCurrency(stats.ingresos)}</h3><p>Ingresos (aceptadas)</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange"><i data-lucide="trending-up"></i></div>
                <div class="stat-info"><h3>${stats.tasaConversion}%</h3><p>Tasa de conversión</p></div>
            </div>
        </div>
        <div class="charts-grid">
            <div class="chart-card">
                <h3>📊 Cotizaciones por estado</h3>
                <canvas id="chart-estados"></canvas>
            </div>
            <div class="chart-card">
                <h3>🍰 Sabores más populares</h3>
                <canvas id="chart-sabores"></canvas>
            </div>
            <div class="chart-card">
                <h3>📐 Tamaños más solicitados</h3>
                <canvas id="chart-tamanos"></canvas>
            </div>
            <div class="chart-card">
                <h3>💰 Ingresos por cliente (Top 5)</h3>
                <canvas id="chart-clientes"></canvas>
            </div>
        </div>
        <div class="card mt-2">
            <div class="card-header"><span>📋 Actividad reciente</span></div>
            <div class="card-body" style="padding:0;overflow-x:auto;">
                <table class="data-table">
                    <thead><tr><th>Tipo</th><th>Número</th><th>Cliente</th><th>Total</th><th>Fecha</th></tr></thead>
                    <tbody>${this.renderActivity()}</tbody>
                </table>
            </div>
        </div>`;
    },

    getStats() {
        const cots = DB.getAll("SELECT * FROM cotizaciones");
        const peds = DB.getAll("SELECT * FROM pedidos");
        const aceptadas = cots.filter(c=>c.estado==='aceptada');
        return {
            totalCot: cots.length,
            aceptadas: aceptadas.length,
            totalPed: peds.length,
            ingresos: aceptadas.reduce((s,c)=>s+c.total,0),
            tasaConversion: cots.length>0 ? Math.round((aceptadas.length/cots.length)*100) : 0
        };
    },

    renderActivity() {
        const cots = DB.getAll("SELECT 'Cotización' as tipo, numero, cliente_nombre, total, created_at FROM cotizaciones ORDER BY created_at DESC LIMIT 5");
        const peds = DB.getAll("SELECT 'Pedido' as tipo, numero, cliente_nombre, total, created_at FROM pedidos ORDER BY created_at DESC LIMIT 5");
        const all = [...cots,...peds].sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,8);
        return all.map(a=>`<tr><td>${a.tipo}</td><td><strong>${a.numero}</strong></td><td>${a.cliente_nombre||'—'}</td><td><strong>${App.formatCurrency(a.total)}</strong></td><td>${App.formatDate(a.created_at)}</td></tr>`).join('');
    },

    init() {
        this.renderCharts();
    },

    renderCharts() {
        const pink = '#D6336C', purple = '#6D28D9', green = '#10B981', orange = '#F59E0B', blue = '#3B82F6', red = '#EF4444';

        // Estados pie chart
        const estados = DB.getAll("SELECT estado, COUNT(*) as cnt FROM cotizaciones GROUP BY estado");
        const estadoColors = {pendiente:orange, enviada:blue, aceptada:green, rechazada:red};
        const c1 = new Chart(document.getElementById('chart-estados'),{
            type:'doughnut',
            data:{
                labels:estados.map(e=>App.statusLabel(e.estado)),
                datasets:[{data:estados.map(e=>e.cnt),backgroundColor:estados.map(e=>estadoColors[e.estado]||'#ccc'),borderWidth:2,borderColor:'#fff'}]
            },
            options:{responsive:true,plugins:{legend:{position:'bottom',labels:{font:{size:12}}}}}
        });
        App.registerChart(c1);

        // Sabores bar chart
        const sabores = DB.getAll("SELECT sabor, COUNT(*) as cnt FROM cotizaciones GROUP BY sabor ORDER BY cnt DESC");
        const saborColors = [pink,purple,orange,green,blue];
        const c2 = new Chart(document.getElementById('chart-sabores'),{
            type:'bar',
            data:{
                labels:sabores.map(s=>s.sabor),
                datasets:[{label:'Cotizaciones',data:sabores.map(s=>s.cnt),backgroundColor:saborColors.slice(0,sabores.length),borderRadius:8,borderSkipped:false}]
            },
            options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{stepSize:1}},x:{grid:{display:false}}}}
        });
        App.registerChart(c2);

        // Tamaños bar chart
        const tamanos = DB.getAll("SELECT tamano, COUNT(*) as cnt FROM cotizaciones GROUP BY tamano ORDER BY tamano");
        const c3 = new Chart(document.getElementById('chart-tamanos'),{
            type:'bar',
            data:{
                labels:tamanos.map(t=>t.tamano+' porc.'),
                datasets:[{label:'Cotizaciones',data:tamanos.map(t=>t.cnt),backgroundColor:purple,borderRadius:8,borderSkipped:false}]
            },
            options:{responsive:true,plugins:{legend:{display:false}},scales:{y:{beginAtZero:true,ticks:{stepSize:1}},x:{grid:{display:false}}}}
        });
        App.registerChart(c3);

        // Top clients horizontal bar
        const topClients = DB.getAll("SELECT cliente_nombre, SUM(total) as total FROM cotizaciones WHERE estado='aceptada' AND cliente_nombre IS NOT NULL GROUP BY cliente_nombre ORDER BY total DESC LIMIT 5");
        const c4 = new Chart(document.getElementById('chart-clientes'),{
            type:'bar',
            data:{
                labels:topClients.map(c=>c.cliente_nombre),
                datasets:[{label:'Ingresos (Q.)',data:topClients.map(c=>c.total),backgroundColor:[pink,purple,green,orange,blue],borderRadius:8,borderSkipped:false}]
            },
            options:{indexAxis:'y',responsive:true,plugins:{legend:{display:false}},scales:{x:{beginAtZero:true,grid:{display:false}}}}
        });
        App.registerChart(c4);
    }
};
