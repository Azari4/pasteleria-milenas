/* =============================================
   PAGE: Cotizaciones (Listado)
   ============================================= */
window.Pages = window.Pages || {};

Pages.cotizaciones = {
    currentFilter: 'todas',
    currentSort: 'fecha_desc',
    searchQuery: '',
    fechaInicio: '',
    fechaFin: '',
    vendedoraFilter: 'todas',

    render() {
        const stats = this.getStats();
        const vendedoras = this._getVendedoras();

        return `
        <!-- Stats Cards -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon pink"><i data-lucide="file-text"></i></div>
                <div class="stat-info">
                    <h3 id="stat-total">${stats.total}</h3>
                    <p>Total cotizaciones</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange"><i data-lucide="clock"></i></div>
                <div class="stat-info">
                    <h3 id="stat-pendientes">${stats.pendientes}</h3>
                    <p>Pendientes</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green"><i data-lucide="check-circle"></i></div>
                <div class="stat-info">
                    <h3 id="stat-aceptadas">${stats.aceptadas}</h3>
                    <p>Aceptadas</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon blue"><i data-lucide="trending-up"></i></div>
                <div class="stat-info">
                    <h3 id="stat-monto">${App.formatCurrency(stats.totalMonto)}</h3>
                    <p>Monto total</p>
                </div>
            </div>
        </div>

        <!-- Toolbar con filtros, búsqueda y ordenamiento -->
        <div class="card" style="margin-bottom:1rem;">
            <div class="card-body" style="padding:.8rem 1rem;">
                <!-- Fila 1: Filtros de estado + Nueva -->
                <div style="display:flex; align-items:center; gap:.5rem; flex-wrap:wrap; margin-bottom:.6rem;">
                    <div class="filter-pills" style="flex:1; flex-wrap:wrap;">
                        <button class="filter-pill ${this.currentFilter === 'todas' ? 'active' : ''}" data-filter="todas">Todas</button>
                        <button class="filter-pill ${this.currentFilter === 'pendiente' ? 'active' : ''}" data-filter="pendiente">Pendientes</button>
                        <button class="filter-pill ${this.currentFilter === 'enviada' ? 'active' : ''}" data-filter="enviada">Enviadas</button>
                        <button class="filter-pill ${this.currentFilter === 'aceptada' ? 'active' : ''}" data-filter="aceptada">Aceptadas</button>
                        <button class="filter-pill ${this.currentFilter === 'rechazada' ? 'active' : ''}" data-filter="rechazada">Rechazadas</button>
                    </div>
                    <button class="btn btn-primary btn-sm" onclick="window.location.hash='nueva-cotizacion'">
                        <i data-lucide="plus"></i> Nueva
                    </button>
                </div>
                <!-- Fila 2: Búsqueda, fechas, vendedora y ordenamiento -->
                <div style="display:flex; align-items:center; gap:.5rem; flex-wrap:wrap;">
                    <div style="position:relative; flex:1; min-width:160px;">
                        <i data-lucide="search" style="position:absolute;left:.6rem;top:50%;transform:translateY(-50%);width:15px;height:15px;color:var(--text-light);pointer-events:none;"></i>
                        <input type="text" id="cot-search" class="form-input" 
                               style="padding-left:2rem; height:36px; font-size:.85rem;"
                               placeholder="Buscar por nombre o DNI..." value="${this.searchQuery}">
                    </div>
                    <input type="date" id="cot-fecha-ini" class="form-input" 
                           style="height:36px; font-size:.82rem; width:140px;" value="${this.fechaInicio}" title="Fecha desde">
                    <input type="date" id="cot-fecha-fin" class="form-input" 
                           style="height:36px; font-size:.82rem; width:140px;" value="${this.fechaFin}" title="Fecha hasta">
                    <select id="cot-vendedora" class="form-input" style="height:36px; font-size:.82rem; min-width:150px;">
                        <option value="todas" ${this.vendedoraFilter === 'todas' ? 'selected' : ''}>👤 Todas las vendedoras</option>
                        ${vendedoras.map(v => `<option value="${v.usuario_nombre}" ${this.vendedoraFilter === v.usuario_nombre ? 'selected' : ''}>${v.usuario_nombre}</option>`).join('')}
                    </select>
                    <select id="cot-sort" class="form-input" style="height:36px; font-size:.82rem; width:160px;">
                        <option value="fecha_desc" ${this.currentSort === 'fecha_desc' ? 'selected' : ''}>📅 Más recientes</option>
                        <option value="fecha_asc" ${this.currentSort === 'fecha_asc' ? 'selected' : ''}>📅 Más antiguas</option>
                        <option value="estado" ${this.currentSort === 'estado' ? 'selected' : ''}>🏷 Por estado</option>
                        <option value="total_desc" ${this.currentSort === 'total_desc' ? 'selected' : ''}>💰 Mayor monto</option>
                        <option value="total_asc" ${this.currentSort === 'total_asc' ? 'selected' : ''}>💰 Menor monto</option>
                    </select>
                    <button class="btn btn-outline btn-sm" id="btn-clear-filters" title="Limpiar filtros">
                        <i data-lucide="x"></i>
                    </button>
                </div>
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
                            <th>DNI</th>
                            <th>Tamaño</th>
                            <th>Sabor</th>
                            <th>Diseño</th>
                            <th>Total</th>
                            <th>Estado</th>
                            <th>Vendedora</th>
                            <th>Fecha</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="cotizaciones-tbody">
                        ${this.renderRows(this.getCotizaciones())}
                    </tbody>
                </table>
            </div>
        </div>`;
    },

    _getVendedoras() {
        return DB.getAll("SELECT DISTINCT usuario_nombre FROM cotizaciones WHERE usuario_nombre IS NOT NULL ORDER BY usuario_nombre ASC");
    },

    renderRows(cotizaciones) {
        if (cotizaciones.length === 0) {
            return `<tr><td colspan="11" class="text-center text-muted" style="padding:2rem;">No se encontraron cotizaciones</td></tr>`;
        }
        return cotizaciones.map(c => `
            <tr>
                <td><strong>${c.numero}</strong></td>
                <td>${c.cliente_nombre || '—'}</td>
                <td style="font-size:.82rem; color:var(--text-medium);">${c.dni || '—'}</td>
                <td>${c.tamano} porc.</td>
                <td>${c.sabor}</td>
                <td>${c.diseno}</td>
                <td><strong>${App.formatCurrency(c.total)}</strong></td>
                <td><span class="status-badge status-${c.estado}">${App.statusLabel(c.estado)}</span></td>
                <td style="font-size:.82rem;color:var(--text-medium);">${c.usuario_nombre || '—'}</td>
                <td style="font-size:.82rem;">${App.formatDate(c.created_at)}</td>
                <td>
                    <div class="actions">
                        <button class="btn btn-sm btn-outline btn-icon" title="Ver detalle" onclick="Pages.cotizaciones.verDetalle(${c.id})">
                            <i data-lucide="eye"></i>
                        </button>
                        <button class="btn btn-sm btn-outline btn-icon" title="Editar" onclick="Pages.cotizaciones.editarCotizacion(${c.id})">
                            <i data-lucide="edit-2"></i>
                        </button>
                        ${c.estado !== 'aceptada' && c.estado !== 'rechazada' ? `
                        <button class="btn btn-sm btn-primary btn-icon" title="Aceptar" onclick="Pages.cotizaciones.cambiarEstado(${c.id}, 'aceptada')">
                            <i data-lucide="check"></i>
                        </button>
                        <button class="btn btn-sm btn-outline btn-icon text-danger" title="Rechazar" onclick="if(confirm('¿Marcar cotización como rechazada?')) Pages.cotizaciones.cambiarEstado(${c.id}, 'rechazada')">
                            <i data-lucide="x"></i>
                        </button>` : ''}
                        <button class="btn btn-sm btn-outline btn-icon text-danger" title="Eliminar" onclick="Pages.cotizaciones.eliminar(${c.id})">
                            <i data-lucide="trash-2"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `).join('');
    },

    getStats(vendedora) {
        let all = DB.getAll("SELECT * FROM cotizaciones");
        if (vendedora && vendedora !== 'todas') {
            all = all.filter(c => (c.usuario_nombre || '') === vendedora);
        }
        return {
            total: all.length,
            pendientes: all.filter(c => c.estado === 'pendiente').length,
            aceptadas: all.filter(c => c.estado === 'aceptada').length,
            totalMonto: all.reduce((sum, c) => sum + c.total, 0)
        };
    },

    getCotizaciones() {
        let sql = `SELECT c.*, cl.dni FROM cotizaciones c 
                   LEFT JOIN clientes cl ON c.cliente_id = cl.id`;
        const params = [];

        if (this.currentFilter !== 'todas') {
            sql += ` WHERE c.estado = ?`;
            params.push(this.currentFilter);
        }

        const orderMap = {
            'fecha_desc': 'c.created_at DESC',
            'fecha_asc': 'c.created_at ASC',
            'estado': 'c.estado ASC, c.created_at DESC',
            'total_desc': 'c.total DESC',
            'total_asc': 'c.total ASC'
        };
        sql += ` ORDER BY ${orderMap[this.currentSort] || 'c.created_at DESC'}`;

        let rows = DB.getAll(sql, params);

        // Filtro de búsqueda en memoria
        const q = (this.searchQuery || '').toLowerCase().trim();
        if (q) {
            rows = rows.filter(r =>
                (r.cliente_nombre || '').toLowerCase().includes(q) ||
                (r.dni || '').toLowerCase().includes(q)
            );
        }

        // Filtro por rango de fechas
        if (this.fechaInicio) {
            rows = rows.filter(r => r.created_at >= this.fechaInicio);
        }
        if (this.fechaFin) {
            rows = rows.filter(r => r.created_at.substring(0, 10) <= this.fechaFin);
        }

        // Filtro por vendedora
        if (this.vendedoraFilter && this.vendedoraFilter !== 'todas') {
            rows = rows.filter(r => (r.usuario_nombre || '') === this.vendedoraFilter);
        }

        return rows;
    },

    refreshTable() {
        const tbody = document.getElementById('cotizaciones-tbody');
        if (tbody) {
            tbody.innerHTML = this.renderRows(this.getCotizaciones());
            if (window.lucide) lucide.createIcons();
        }
        // Actualizar stats según vendedora seleccionada
        const stats = this.getStats(this.vendedoraFilter);
        const elTotal = document.getElementById('stat-total');
        const elPend = document.getElementById('stat-pendientes');
        const elAcep = document.getElementById('stat-aceptadas');
        const elMonto = document.getElementById('stat-monto');
        if (elTotal) elTotal.textContent = stats.total;
        if (elPend) elPend.textContent = stats.pendientes;
        if (elAcep) elAcep.textContent = stats.aceptadas;
        if (elMonto) elMonto.textContent = App.formatCurrency(stats.totalMonto);
    },

    init() {
        this.currentFilter = 'todas';
        this.currentSort = 'fecha_desc';
        this.searchQuery = '';
        this.fechaInicio = '';
        this.fechaFin = '';
        this.vendedoraFilter = 'todas';

        // Filtros de estado
        document.querySelectorAll('.filter-pill').forEach(pill => {
            pill.addEventListener('click', () => {
                document.querySelectorAll('.filter-pill').forEach(p => p.classList.remove('active'));
                pill.classList.add('active');
                this.currentFilter = pill.dataset.filter;
                this.refreshTable();
            });
        });

        // Búsqueda de texto
        const searchInput = document.getElementById('cot-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                this.searchQuery = e.target.value;
                this.refreshTable();
            });
        }

        // Fechas
        const fechaIni = document.getElementById('cot-fecha-ini');
        const fechaFin = document.getElementById('cot-fecha-fin');
        if (fechaIni) fechaIni.addEventListener('change', (e) => { this.fechaInicio = e.target.value; this.refreshTable(); });
        if (fechaFin) fechaFin.addEventListener('change', (e) => { this.fechaFin = e.target.value; this.refreshTable(); });

        // Filtro por vendedora
        const vendedoraSel = document.getElementById('cot-vendedora');
        if (vendedoraSel) vendedoraSel.addEventListener('change', (e) => { this.vendedoraFilter = e.target.value; this.refreshTable(); });

        // Ordenamiento
        const sortSel = document.getElementById('cot-sort');
        if (sortSel) sortSel.addEventListener('change', (e) => { this.currentSort = e.target.value; this.refreshTable(); });

        // Limpiar filtros
        const btnClear = document.getElementById('btn-clear-filters');
        if (btnClear) {
            btnClear.addEventListener('click', () => {
                this.searchQuery = '';
                this.fechaInicio = '';
                this.fechaFin = '';
                this.currentFilter = 'todas';
                this.currentSort = 'fecha_desc';
                this.vendedoraFilter = 'todas';
                App.navigateTo('cotizaciones');
            });
        }
    },

    editarCotizacion(id) {
        const c = DB.getOne("SELECT c.*, cl.dni, cl.whatsapp as cli_wp FROM cotizaciones c LEFT JOIN clientes cl ON c.cliente_id = cl.id WHERE c.id = ?", [id]);
        if (!c) return;

        let extras = [];
        try { extras = JSON.parse(c.extras || '[]'); } catch (e) { }

        const tamanoItem = DB.getOne("SELECT precio FROM catalogo WHERE categoria='tamano' AND CAST(nombre AS INTEGER)=?", [c.tamano]);
        const saborItem = DB.getOne("SELECT precio FROM catalogo WHERE categoria='sabor' AND nombre=?", [c.sabor]);
        const disenoItem = DB.getOne("SELECT precio FROM catalogo WHERE categoria='diseno' AND nombre=?", [c.diseno]);

        Pages.nuevaCotizacion.state = {
            tamano: c.tamano,
            precioTamano: c.precio_tamano || (tamanoItem ? tamanoItem.precio : 0),
            sabor: c.sabor,
            precioSabor: c.precio_sabor || (saborItem ? saborItem.precio : 0),
            diseno: c.diseno,
            precioDiseno: c.precio_diseno || (disenoItem ? disenoItem.precio : 0),
            extras: extras,
            observaciones: c.observaciones || '',
            clienteNombre: c.cliente_nombre || '',
            clienteDni: c.dni || '',
            clienteWhatsapp: c.cli_wp || '',
            guardarCliente: false,
            editingId: c.id
        };

        App.navigateTo('nueva-cotizacion');
    },

    verDetalle(id) {
        const c = DB.getOne("SELECT c.*, cl.dni FROM cotizaciones c LEFT JOIN clientes cl ON c.cliente_id = cl.id WHERE c.id = ?", [id]);
        if (!c) return;

        let extras = [];
        try { extras = JSON.parse(c.extras || '[]'); } catch (e) { }

        const extrasHTML = extras.length > 0
            ? `<h4 style="margin-top:.8rem;font-size:.9rem;">Extras:</h4><ul style="padding-left:1rem;">${extras.map(e => `<li style="font-size:.85rem;">${e.nombre} — ${App.formatCurrency(e.precio)}</li>`).join('')}</ul>`
            : '';

        App.showModal(`Cotización ${c.numero}`, `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem .8rem;font-size:.9rem;">
                <p><strong>Cliente:</strong></p><p>${c.cliente_nombre || '—'}</p>
                <p><strong>DNI:</strong></p><p>${c.dni || '—'}</p>
                <p><strong>Tamaño:</strong></p><p>${c.tamano} porciones</p>
                <p><strong>Sabor:</strong></p><p>${c.sabor}</p>
                <p><strong>Diseño:</strong></p><p>${c.diseno}</p>
                <p><strong>Estado:</strong></p><p><span class="status-badge status-${c.estado}">${App.statusLabel(c.estado)}</span></p>
                <p><strong>Vendedora:</strong></p><p>${c.usuario_nombre || '—'}</p>
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
        if (estado === 'aceptada') {
            Pages.pedidos.pedirFechaYCrear((fecha, hora, anticipo) => {
                DB.run("UPDATE cotizaciones SET estado = ? WHERE id = ?", [estado, id]);
                const c = DB.getOne("SELECT * FROM cotizaciones WHERE id = ?", [id]);
                if (c) {
                    const count = DB.getOne("SELECT COUNT(*) as c FROM pedidos").c + 1;
                    const numeroPed = `PED-${String(count).padStart(3, '0')}`;
                    const desc = `Pastel ${c.sabor} ${c.tamano} porc. - ${c.diseno}`;
                    const anticipoNum = parseFloat(anticipo) || 0;
                    const saldoPendiente = Math.max(0, c.total - anticipoNum);
                    DB.run(
                        `INSERT INTO pedidos (numero, cotizacion_id, cliente_id, cliente_nombre, descripcion, fecha_entrega, hora_entrega, estado, total, anticipo, saldo_pendiente, notas)
                         VALUES (?,?,?,?,?,?,?,?,?,?,?,?)`,
                        [numeroPed, c.id, c.cliente_id, c.cliente_nombre, desc, fecha, hora, 'en_preparacion', c.total, anticipoNum, saldoPendiente, c.observaciones || '']
                    );
                    App.showToast(`Cotización aceptada. Pedido ${numeroPed} para el ${App.formatDate(fecha)}`, 'success');
                }
                this.refreshTable();
            });
        } else {
            DB.run("UPDATE cotizaciones SET estado = ? WHERE id = ?", [estado, id]);
            App.showToast('Estado actualizado', 'success');
            this.refreshTable();
        }
    }
};