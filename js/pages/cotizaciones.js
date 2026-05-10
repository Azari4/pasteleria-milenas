/* =============================================
   PAGE: Cotizaciones (Listado)
   ============================================= */
window.Pages = window.Pages || {};

Pages.cotizaciones = {
    currentFilter: 'todas',

    render() {
        const stats = this.getStats();
        const cotizaciones = this.getCotizaciones();

        return `
        <!-- Stats Cards -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon pink"><i data-lucide="file-text"></i></div>
                <div class="stat-info">
                    <h3>${stats.total}</h3>
                    <p>Total cotizaciones</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange"><i data-lucide="clock"></i></div>
                <div class="stat-info">
                    <h3>${stats.pendientes}</h3>
                    <p>Pendientes</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green"><i data-lucide="check-circle"></i></div>
                <div class="stat-info">
                    <h3>${stats.aceptadas}</h3>
                    <p>Aceptadas</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon blue"><i data-lucide="trending-up"></i></div>
                <div class="stat-info">
                    <h3>${App.formatCurrency(stats.totalMonto)}</h3>
                    <p>Monto total</p>
                </div>
            </div>
        </div>

        <!-- Toolbar -->
        <div class="page-toolbar">
            <div class="toolbar-left">
                <div class="filter-pills">
                    <button class="filter-pill active" data-filter="todas">Todas</button>
                    <button class="filter-pill" data-filter="pendiente">Pendientes</button>
                    <button class="filter-pill" data-filter="enviada">Enviadas</button>
                    <button class="filter-pill" data-filter="aceptada">Aceptadas</button>
                    <button class="filter-pill" data-filter="rechazada">Rechazadas</button>
                </div>
            </div>
            <div class="toolbar-right">
                <button class="btn btn-primary btn-sm" onclick="window.location.hash='nueva-cotizacion'">
                    <i data-lucide="plus"></i> Nueva
                </button>
            </div>
        </div>

        <!-- Table -->
        <div class="card">
            <div class="card-body" style="padding:0; overflow-x:auto;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Cliente</th>
                            <th>Tamaño</th>
                            <th>Sabor</th>
                            <th>Diseño</th>
                            <th>Total</th>
                            <th>Estado</th>
                            <th>Fecha</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="cotizaciones-tbody">
                        ${this.renderRows(cotizaciones)}
                    </tbody>
                </table>
            </div>
        </div>`;
    },

    renderRows(cotizaciones) {
        if (cotizaciones.length === 0) {
            return `<tr><td colspan="9" class="text-center text-muted" style="padding:2rem;">No se encontraron cotizaciones</td></tr>`;
        }
        return cotizaciones.map(c => `
            <tr>
                <td><strong>${c.numero}</strong></td>
                <td>
                    ${c.cliente_nombre || '—'}
                    ${c.dni ? `<br><small class="text-muted" style="font-size:0.75rem">DNI: ${c.dni}</small>` : ''}
                </td>
                <td>${c.tamano} porc.</td>
                <td>${c.sabor}</td>
                <td>${c.diseno}</td>
                <td><strong>${App.formatCurrency(c.total)}</strong></td>
                <td><span class="status-badge status-${c.estado}">${App.statusLabel(c.estado)}</span></td>
                <td>${App.formatDate(c.created_at)}</td>
                <td class="actions">
                    <button class="btn btn-sm btn-outline btn-icon" title="Ver detalle" onclick="Pages.cotizaciones.verDetalle(${c.id})">
                        <i data-lucide="eye"></i>
                    </button>
                    <button class="btn btn-sm btn-outline btn-icon" title="Eliminar" onclick="Pages.cotizaciones.eliminar(${c.id})">
                        <i data-lucide="trash-2"></i>
                    </button>
                    ${c.estado !== 'aceptada' && c.estado !== 'rechazada' ? `
                    <button class="btn btn-sm btn-primary btn-icon" title="Aceptar" onclick="Pages.cotizaciones.cambiarEstado(${c.id}, 'aceptada')">
                        <i data-lucide="check"></i>
                    </button>
                    <button class="btn btn-sm btn-outline btn-icon text-danger" title="Rechazar" onclick="if(confirm('¿Marcar cotización como rechazada?')) Pages.cotizaciones.cambiarEstado(${c.id}, 'rechazada')">
                        <i data-lucide="x"></i>
                    </button>` : ''}
                </td>
            </tr>
        `).join('');
    },

    getStats() {
        const all = DB.getAll("SELECT * FROM cotizaciones");
        return {
            total: all.length,
            pendientes: all.filter(c => c.estado === 'pendiente').length,
            aceptadas: all.filter(c => c.estado === 'aceptada').length,
            totalMonto: all.reduce((sum, c) => sum + c.total, 0)
        };
    },

    getCotizaciones(filter) {
        const f = filter || this.currentFilter;
        if (f === 'todas') {
            return DB.getAll("SELECT c.*, cl.dni FROM cotizaciones c LEFT JOIN clientes cl ON c.cliente_id = cl.id ORDER BY c.created_at DESC");
        }
        return DB.getAll("SELECT c.*, cl.dni FROM cotizaciones c LEFT JOIN clientes cl ON c.cliente_id = cl.id WHERE c.estado = ? ORDER BY c.created_at DESC", [f]);
    },

    init() {
        this.currentFilter = 'todas';

        // Filter pills
        document.querySelectorAll('.filter-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                this.currentFilter = pill.dataset.filter;
                const tbody = document.getElementById('cotizaciones-tbody');
                tbody.innerHTML = this.renderRows(this.getCotizaciones());
                if (window.lucide) lucide.createIcons();
            });
        });
    },

    verDetalle(id) {
        const c = DB.getOne("SELECT * FROM cotizaciones WHERE id = ?", [id]);
        if (!c) return;
        
        let extras = [];
        try { extras = JSON.parse(c.extras || '[]'); } catch(e) {}
        
        const extrasHTML = extras.length > 0 
            ? `<h4 style="margin-top:.8rem;font-size:.9rem;">Extras:</h4><ul style="padding-left:1rem;">${extras.map(e => `<li style="font-size:.85rem;">${e.nombre} — ${App.formatCurrency(e.precio)}</li>`).join('')}</ul>` 
            : '';
        
        App.showModal(`Cotización ${c.numero}`, `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem .8rem;font-size:.9rem;">
                <p><strong>Cliente:</strong></p><p>${c.cliente_nombre || '—'}</p>
                <p><strong>Tamaño:</strong></p><p>${c.tamano} porciones</p>
                <p><strong>Sabor:</strong></p><p>${c.sabor}</p>
                <p><strong>Diseño:</strong></p><p>${c.diseno}</p>
                <p><strong>Estado:</strong></p><p><span class="status-badge status-${c.estado}">${App.statusLabel(c.estado)}</span></p>
                <p><strong>Fecha:</strong></p><p>${App.formatDateTime(c.created_at)}</p>
            </div>
            ${extrasHTML}
            ${c.observaciones ? `<p style="margin-top:.8rem;font-size:.85rem;color:var(--text-medium);"><strong>Observaciones:</strong> ${c.observaciones}</p>` : ''}
            <div class="summary-total" style="border-top:2px solid var(--border-color);margin-top:1rem;">
                <span class="label">Total</span>
                <span class="value">${App.formatCurrency(c.total)}</span>
            </div>
        `);
    },

    eliminar(id) {
        if (confirm('¿Estás segura de eliminar esta cotización?')) {
            DB.run("DELETE FROM cotizaciones WHERE id = ?", [id]);
            App.showToast('Cotización eliminada', 'success');
            App.navigateTo('cotizaciones');
        }
    },

    cambiarEstado(id, estado) {
        DB.run("UPDATE cotizaciones SET estado = ? WHERE id = ?", [estado, id]);
        
        if (estado === 'aceptada') {
            const c = DB.getOne("SELECT * FROM cotizaciones WHERE id = ?", [id]);
            if (c) {
                // Verificar si ya existe el pedido
                const existe = DB.getOne("SELECT id FROM pedidos WHERE cotizacion_id = ?", [id]);
                if (!existe) {
                    const countPed = DB.getOne("SELECT COUNT(*) as c FROM pedidos").c + 1;
                    const cNameSafe = (c.cliente_nombre || 'anonimo').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').substring(0, 15);
                    const numeroPed = `PED-${String(countPed).padStart(3, '0')}-${cNameSafe}`;
                    const desc = `Pastel ${c.sabor} ${c.tamano} porc. - ${c.diseno}`;
                    const fecha = new Date();
                    fecha.setDate(fecha.getDate() + 2);
                    const fechaStr = fecha.toISOString().split('T')[0];
                    
                    DB.run(
                        `INSERT INTO pedidos (numero, cotizacion_id, cliente_id, cliente_nombre, descripcion, fecha_entrega, hora_entrega, estado, total, notas)
                         VALUES (?,?,?,?,?,?,?,?,?,?)`,
                        [numeroPed, c.id, c.cliente_id, c.cliente_nombre, desc, fechaStr, '12:00', 'en_preparacion', c.total, c.observaciones]
                    );
                }
            }
        }

        App.showToast(`Estado actualizado a: ${App.statusLabel(estado)}`, 'success');
        App.navigateTo('cotizaciones');
    }
};
