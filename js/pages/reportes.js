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
            <div class="stat-card">
                <div class="stat-icon pink"><i data-lucide="bar-chart-2"></i></div>
                <div class="stat-info"><h3>${App.formatCurrency(stats.ticketPromedio)}</h3><p>Ticket promedio</p></div>
            </div>
        </div>

        <!-- Gráficos fila 1 -->
        <div class="charts-grid">
            <div class="chart-card">
                <h3>Ventas por vendedora</h3>
                <canvas id="chart-vendedoras"></canvas>
            </div>
            <div class="chart-card">
                <h3>Ticket promedio por vendedora</h3>
                <canvas id="chart-ticket"></canvas>
            </div>
        </div>

        <!-- Gráficos fila 2 -->
        <div class="charts-grid">
            <div class="chart-card">
                <h3>Extras más vendidos</h3>
                <canvas id="chart-extras"></canvas>
            </div>
            <div class="chart-card">
                <h3>Cotizaciones por día (últimos 14 días)</h3>
                <canvas id="chart-dias"></canvas>
            </div>
        </div>

        <!-- Gráficos fila 3 -->
        <div class="charts-grid">
            <div class="chart-card">
                <h3>Sabores más populares</h3>
                <canvas id="chart-sabores"></canvas>
            </div>
            <div class="chart-card">
                <h3>Tamaños más solicitados</h3>
                <canvas id="chart-tamanos"></canvas>
            </div>
        </div>

        <div class="card mt-2">
            <div class="card-header"><span>Actividad reciente</span></div>
            <div class="card-body" style="padding:0;overflow-x:auto;">
                <table class="data-table">
                    <thead><tr><th>Tipo</th><th>Número</th><th>Cliente</th><th>Total</th><th>Vendedora</th><th>Fecha</th></tr></thead>
                    <tbody>${this.renderActivity()}</tbody>
                </table>
            </div>
        </div>`;
    },

    getStats() {
        const cots = DB.getAll("SELECT * FROM cotizaciones");
        const peds = DB.getAll("SELECT * FROM pedidos");
        const aceptadas = cots.filter(c => c.estado === 'aceptada');
        const ingresos = aceptadas.reduce((s, c) => s + c.total, 0);
        return {
            totalCot: cots.length,
            aceptadas: aceptadas.length,
            totalPed: peds.length,
            ingresos,
            tasaConversion: cots.length > 0 ? Math.round((aceptadas.length / cots.length) * 100) : 0,
            ticketPromedio: aceptadas.length > 0 ? ingresos / aceptadas.length : 0
        };
    },

    renderActivity() {
        const cots = DB.getAll("SELECT 'Cotización' as tipo, numero, cliente_nombre, total, usuario_nombre, created_at FROM cotizaciones ORDER BY created_at DESC LIMIT 5");
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

        // ── 1. VENTAS POR VENDEDORA (monto total de cotizaciones aceptadas) ──
        const vendedoras = DB.getAll(`
            SELECT usuario_nombre as nombre, 
                   COUNT(*) as cantidad,
                   SUM(total) as monto
            FROM cotizaciones
            WHERE estado = 'aceptada' AND usuario_nombre IS NOT NULL
            GROUP BY usuario_nombre
            ORDER BY monto DESC
        `);
        const colorsVend = [pink, purple, orange, green, blue, red];
        const c1 = new Chart(document.getElementById('chart-vendedoras'), {
            type: 'bar',
            data: {
                labels: vendedoras.map(v => v.nombre),
                datasets: [{
                    label: `Ventas (${symbol})`,
                    data: vendedoras.map(v => v.monto),
                    backgroundColor: colorsVend.slice(0, vendedoras.length),
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, grid: { display: false } },
                    x: { grid: { display: false } }
                }
            }
        });
        App.registerChart(c1);

        // ── 2. TICKET PROMEDIO POR VENDEDORA ──
        const ticketData = DB.getAll(`
            SELECT usuario_nombre as nombre,
                   AVG(total) as promedio,
                   COUNT(*) as cantidad
            FROM cotizaciones
            WHERE estado = 'aceptada' AND usuario_nombre IS NOT NULL
            GROUP BY usuario_nombre
            ORDER BY promedio DESC
        `);
        const c2 = new Chart(document.getElementById('chart-ticket'), {
            type: 'bar',
            data: {
                labels: ticketData.map(v => v.nombre),
                datasets: [{
                    label: `Ticket promedio (${symbol})`,
                    data: ticketData.map(v => Math.round(v.promedio * 100) / 100),
                    backgroundColor: purple,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    x: { beginAtZero: true, grid: { display: false } },
                    y: { grid: { display: false } }
                }
            }
        });
        App.registerChart(c2);

        // ── 3. EXTRAS MÁS VENDIDOS ──
        // Explotar el campo JSON de extras de todas las cotizaciones
        const todasCot = DB.getAll("SELECT extras FROM cotizaciones WHERE extras IS NOT NULL AND extras != '[]'");
        const extrasCount = {};
        todasCot.forEach(row => {
            try {
                const arr = JSON.parse(row.extras || '[]');
                arr.forEach(e => {
                    if (e.nombre) extrasCount[e.nombre] = (extrasCount[e.nombre] || 0) + 1;
                });
            } catch (err) { }
        });
        const extrasSorted = Object.entries(extrasCount)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 8);
        const extrasColors = [pink, purple, orange, green, blue, red, '#EC4899', '#8B5CF6'];
        const c3 = new Chart(document.getElementById('chart-extras'), {
            type: 'doughnut',
            data: {
                labels: extrasSorted.map(e => e[0]),
                datasets: [{
                    data: extrasSorted.map(e => e[1]),
                    backgroundColor: extrasColors.slice(0, extrasSorted.length),
                    borderWidth: 2,
                    borderColor: '#fff'
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: { position: 'right', labels: { font: { size: 11 }, boxWidth: 14 } }
                }
            }
        });
        App.registerChart(c3);

        // ── 4. COTIZACIONES POR DÍA (últimos 14 días) ──
        const hoy = new Date();
        const dias = [];
        const labels = [];
        for (let i = 13; i >= 0; i--) {
            const d = new Date(hoy);
            d.setDate(d.getDate() - i);
            const iso = d.toISOString().split('T')[0];
            dias.push(iso);
            labels.push(d.toLocaleDateString('es', { day: '2-digit', month: 'short' }));
        }
        const cotsPorDia = DB.getAll(`
            SELECT DATE(created_at) as dia, COUNT(*) as cnt
            FROM cotizaciones
            WHERE DATE(created_at) >= ?
            GROUP BY dia
        `, [dias[0]]);
        const diaMap = {};
        cotsPorDia.forEach(r => { diaMap[r.dia] = r.cnt; });
        const dataDias = dias.map(d => diaMap[d] || 0);

        const c4 = new Chart(document.getElementById('chart-dias'), {
            type: 'line',
            data: {
                labels,
                datasets: [{
                    label: 'Cotizaciones',
                    data: dataDias,
                    borderColor: pink,
                    backgroundColor: 'rgba(214,51,108,0.1)',
                    fill: true,
                    tension: 0.4,
                    pointBackgroundColor: pink,
                    pointRadius: 4
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 }, grid: { color: 'rgba(0,0,0,0.04)' } },
                    x: { grid: { display: false } }
                }
            }
        });
        App.registerChart(c4);

        // ── 5. SABORES MÁS POPULARES ──
        const sabores = DB.getAll("SELECT sabor, COUNT(*) as cnt FROM cotizaciones GROUP BY sabor ORDER BY cnt DESC");
        const saborColors = [pink, purple, orange, green, blue];
        const c5 = new Chart(document.getElementById('chart-sabores'), {
            type: 'bar',
            data: {
                labels: sabores.map(s => s.sabor),
                datasets: [{
                    label: 'Cotizaciones',
                    data: sabores.map(s => s.cnt),
                    backgroundColor: saborColors.slice(0, sabores.length),
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } },
                    x: { grid: { display: false } }
                }
            }
        });
        App.registerChart(c5);

        // ── 6. TAMAÑOS MÁS SOLICITADOS ──
        const tamanos = DB.getAll("SELECT tamano, COUNT(*) as cnt FROM cotizaciones GROUP BY tamano ORDER BY tamano");
        const c6 = new Chart(document.getElementById('chart-tamanos'), {
            type: 'bar',
            data: {
                labels: tamanos.map(t => t.tamano + ' porc.'),
                datasets: [{
                    label: 'Cotizaciones',
                    data: tamanos.map(t => t.cnt),
                    backgroundColor: purple,
                    borderRadius: 8,
                    borderSkipped: false
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    y: { beginAtZero: true, ticks: { stepSize: 1 } },
                    x: { grid: { display: false } }
                }
            }
        });
        App.registerChart(c6);
    }
};