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
                <div class="stat-info"><h3>${stats.cerradas}</h3><p>Cerradas (venta)</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon purple"><i data-lucide="shopping-bag"></i></div>
                <div class="stat-info"><h3>${stats.totalPed}</h3><p>Pedidos</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon blue"><i data-lucide="dollar-sign"></i></div>
                <div class="stat-info"><h3>${App.formatCurrency(stats.ingresos)}</h3><p>Ingresos (ventas)</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange"><i data-lucide="trending-up"></i></div>
                <div class="stat-info"><h3>${stats.tasaConversion}%</h3><p>Conversion</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon pink"><i data-lucide="bar-chart-2"></i></div>
                <div class="stat-info"><h3>${App.formatCurrency(stats.ticketPromedio)}</h3><p>Ticket promedio</p></div>
            </div>
        </div>

        <div class="charts-grid">
            <div class="chart-card">
                <h3>Ventas por vendedora</h3>
                <canvas id="chart-vendedoras"></canvas>
            </div>
            <div class="chart-card">
                <h3>Conversion cotizaciones a ventas</h3>
                <canvas id="chart-conversion"></canvas>
            </div>
        </div>

        <div class="charts-grid">
            <div class="chart-card">
                <h3>Cotizaciones por dia (ultimos 14 dias)</h3>
                <canvas id="chart-cotizaciones-dia"></canvas>
            </div>
            <div class="chart-card">
                <h3>Ventas por dia (ultimos 14 dias)</h3>
                <canvas id="chart-dias"></canvas>
            </div>
        </div>

        <div class="charts-grid">
            <div class="chart-card">
                <h3>Ticket promedio por vendedora</h3>
                <canvas id="chart-ticket"></canvas>
            </div>
            <div class="chart-card">
                <h3>Extras mas vendidos</h3>
                <canvas id="chart-extras"></canvas>
            </div>
        </div>

        <div class="charts-grid">
            <div class="chart-card">
                <h3>Sabores mas populares</h3>
                <canvas id="chart-sabores"></canvas>
            </div>
            <div class="chart-card">
                <h3>Tamanos mas solicitados</h3>
                <canvas id="chart-tamanos"></canvas>
            </div>
        </div>

        <div class="card mt-2">
            <div class="card-header"><span>Actividad reciente</span></div>
            <div class="card-body" style="padding:0;overflow-x:auto;">
                <table class="data-table">
                    <thead><tr><th>Tipo</th><th>Numero</th><th>Cliente</th><th>Total</th><th>Vendedora</th><th>Fecha</th></tr></thead>
                    <tbody>${this.renderActivity()}</tbody>
                </table>
            </div>
        </div>`;
    },

    getStats() {
        const cots = DB.getAll("SELECT * FROM cotizaciones");
        const peds = DB.getAll("SELECT * FROM pedidos");
        const cerradas = cots.filter(c => c.estado === 'Cerrada (venta)');
        const ingresos = cerradas.reduce((s, c) => s + c.total, 0);
        return {
            totalCot: cots.length,
            cerradas: cerradas.length,
            totalPed: peds.length,
            ingresos,
            tasaConversion: cots.length > 0 ? Math.round((cerradas.length / cots.length) * 100) : 0,
            ticketPromedio: cerradas.length > 0 ? ingresos / cerradas.length : 0
        };
    },

    renderActivity() {
        const cots = DB.getAll("SELECT 'Cotizacion' as tipo, numero, cliente_nombre, total, usuario_nombre, created_at FROM cotizaciones ORDER BY created_at DESC LIMIT 5");
        const peds = DB.getAll("SELECT 'Pedido' as tipo, numero, cliente_nombre, total, NULL as usuario_nombre, created_at FROM pedidos ORDER BY created_at DESC LIMIT 5");
        const all = [...cots, ...peds].sort((a, b) => b.created_at.localeCompare(a.created_at)).slice(0, 8);
        return all.map(a => `<tr>
            <td>${a.tipo}</td>
            <td><strong>${a.numero}</strong></td>
            <td>${a.cliente_nombre || '—'}</td>
            <td><strong>${App.formatCurrency(a.total)}</strong></td>
            <td style="font-size:.82rem;color:var(--text-medium);">${a.usuario_nombre || '—'}</td>
            <td>${App.formatDate(a.created_at)}</td>
        </tr>`).join('');
    },

    init() {
        this.renderCharts();
    },

    renderCharts() {
        const pink = '#D6336C', purple = '#6D28D9', green = '#10B981', orange = '#F59E0B', blue = '#3B82F6', red = '#EF4444';
        const symbol = DB.getConfig('moneda_simbolo') || 'Q.';

        const vendedoras = DB.getAll(`
            SELECT usuario_nombre as nombre, COUNT(*) as cantidad, SUM(total) as monto
            FROM cotizaciones
            WHERE estado = 'Cerrada (venta)' AND usuario_nombre IS NOT NULL
            GROUP BY usuario_nombre
            ORDER BY monto DESC
        `);
        const c1 = new Chart(document.getElementById('chart-vendedoras'), {
            type: 'bar',
            data: {
                labels: vendedoras.map(v => v.nombre),
                datasets: [{ label: `Ventas (${symbol})`, data: vendedoras.map(v => v.monto), backgroundColor: [pink, purple, orange, green, blue, red], borderRadius: 8, borderSkipped: false }]
            },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { display: false } }, x: { grid: { display: false } } } }
        });
        App.registerChart(c1);

        const totalCot = DB.getOne("SELECT COUNT(*) as total FROM cotizaciones")?.total || 0;
        const totalVentas = DB.getOne("SELECT COUNT(*) as total FROM cotizaciones WHERE estado = 'Cerrada (venta)'")?.total || 0;
        const cConversion = new Chart(document.getElementById('chart-conversion'), {
            type: 'doughnut',
            data: {
                labels: ['Ventas', 'Sin cerrar'],
                datasets: [{ data: [totalVentas, Math.max(0, totalCot - totalVentas)], backgroundColor: [green, '#E8E8ED'], borderWidth: 2, borderColor: '#fff' }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'bottom' },
                    tooltip: { callbacks: { label: ctx => `${ctx.label}: ${ctx.raw} (${totalCot ? Math.round((ctx.raw / totalCot) * 100) : 0}%)` } }
                }
            }
        });
        App.registerChart(cConversion);

        const dias = [];
        const labels = [];
        const hoy = new Date();
        for (let i = 13; i >= 0; i--) {
            const d = new Date(hoy);
            d.setDate(d.getDate() - i);
            dias.push(d.toISOString().split('T')[0]);
            labels.push(d.toLocaleDateString('es', { day: '2-digit', month: 'short' }));
        }

        const cotPorDia = DB.getAll(`
            SELECT DATE(created_at) as dia, COUNT(*) as total
            FROM cotizaciones
            WHERE DATE(created_at) >= ?
            GROUP BY dia
        `, [dias[0]]);
        const cotMap = {};
        cotPorDia.forEach(r => { cotMap[r.dia] = r.total || 0; });
        const cCotDia = new Chart(document.getElementById('chart-cotizaciones-dia'), {
            type: 'line',
            data: { labels, datasets: [{ label: 'Cotizaciones', data: dias.map(d => cotMap[d] || 0), borderColor: blue, backgroundColor: 'rgba(59,130,246,0.12)', fill: true, tension: 0.35, pointBackgroundColor: blue, pointRadius: 4 }] },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false } } } }
        });
        App.registerChart(cCotDia);

        const ventasPorDia = DB.getAll(`
            SELECT DATE(created_at) as dia, SUM(total) as total
            FROM cotizaciones
            WHERE estado = 'Cerrada (venta)' AND DATE(created_at) >= ?
            GROUP BY dia
        `, [dias[0]]);
        const ventasMap = {};
        ventasPorDia.forEach(r => { ventasMap[r.dia] = r.total || 0; });
        const c4 = new Chart(document.getElementById('chart-dias'), {
            type: 'line',
            data: { labels, datasets: [{ label: `Ventas (${symbol})`, data: dias.map(d => ventasMap[d] || 0), borderColor: pink, backgroundColor: 'rgba(214,51,108,0.1)', fill: true, tension: 0.4, pointBackgroundColor: pink, pointRadius: 4 }] },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, grid: { color: 'rgba(0,0,0,0.04)' } }, x: { grid: { display: false } } } }
        });
        App.registerChart(c4);

        const ticketData = DB.getAll(`
            SELECT usuario_nombre as nombre, AVG(total) as promedio
            FROM cotizaciones
            WHERE estado = 'Cerrada (venta)' AND usuario_nombre IS NOT NULL
            GROUP BY usuario_nombre
            ORDER BY promedio DESC
        `);
        const c2 = new Chart(document.getElementById('chart-ticket'), {
            type: 'bar',
            data: { labels: ticketData.map(v => v.nombre), datasets: [{ label: `Ticket promedio (${symbol})`, data: ticketData.map(v => Math.round(v.promedio * 100) / 100), backgroundColor: purple, borderRadius: 8, borderSkipped: false }] },
            options: { indexAxis: 'y', responsive: true, plugins: { legend: { display: false } }, scales: { x: { beginAtZero: true, grid: { display: false } }, y: { grid: { display: false } } } }
        });
        App.registerChart(c2);

        const todasCot = DB.getAll("SELECT extras FROM cotizaciones WHERE extras IS NOT NULL AND extras != '[]'");
        const extrasCount = {};
        todasCot.forEach(row => {
            try { JSON.parse(row.extras || '[]').forEach(e => { if (e.nombre) extrasCount[e.nombre] = (extrasCount[e.nombre] || 0) + 1; }); } catch (err) { }
        });
        const extrasSorted = Object.entries(extrasCount).sort((a, b) => b[1] - a[1]).slice(0, 8);
        const c3 = new Chart(document.getElementById('chart-extras'), {
            type: 'doughnut',
            data: { labels: extrasSorted.map(e => e[0]), datasets: [{ data: extrasSorted.map(e => e[1]), backgroundColor: [pink, purple, orange, green, blue, red, '#EC4899', '#8B5CF6'], borderWidth: 2, borderColor: '#fff' }] },
            options: { responsive: true, plugins: { legend: { position: 'right', labels: { font: { size: 11 }, boxWidth: 14 } } } }
        });
        App.registerChart(c3);

        const sabores = DB.getAll("SELECT sabor, COUNT(*) as cnt FROM cotizaciones GROUP BY sabor ORDER BY cnt DESC");
        const c5 = new Chart(document.getElementById('chart-sabores'), {
            type: 'bar',
            data: { labels: sabores.map(s => s.sabor), datasets: [{ label: 'Cotizaciones', data: sabores.map(s => s.cnt), backgroundColor: [pink, purple, orange, green, blue], borderRadius: 8, borderSkipped: false }] },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } }, x: { grid: { display: false } } } }
        });
        App.registerChart(c5);

        const tamanos = DB.getAll("SELECT tamano, COUNT(*) as cnt FROM cotizaciones GROUP BY tamano ORDER BY tamano");
        const c6 = new Chart(document.getElementById('chart-tamanos'), {
            type: 'bar',
            data: { labels: tamanos.map(t => t.tamano + ' porc.'), datasets: [{ label: 'Cotizaciones', data: tamanos.map(t => t.cnt), backgroundColor: purple, borderRadius: 8, borderSkipped: false }] },
            options: { responsive: true, plugins: { legend: { display: false } }, scales: { y: { beginAtZero: true, ticks: { stepSize: 1 } }, x: { grid: { display: false } } } }
        });
        App.registerChart(c6);
    }
};
