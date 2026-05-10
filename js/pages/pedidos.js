/* =============================================
   PAGE: Pedidos
   ============================================= */
window.Pages = window.Pages || {};

Pages.pedidos = {
    render() {
        const pedidos = DB.getAll("SELECT * FROM pedidos ORDER BY fecha_entrega ASC");
        const enPreparacion = pedidos.filter(p => p.estado === 'en_preparacion');
        const listos = pedidos.filter(p => p.estado === 'listo');
        const entregados = pedidos.filter(p => p.estado === 'entregado');

        return `
        <!-- Stats -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon pink"><i data-lucide="shopping-bag"></i></div>
                <div class="stat-info">
                    <h3>${pedidos.length}</h3>
                    <p>Total pedidos</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange"><i data-lucide="clock"></i></div>
                <div class="stat-info">
                    <h3>${enPreparacion.length}</h3>
                    <p>En preparación</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon blue"><i data-lucide="check-square"></i></div>
                <div class="stat-info">
                    <h3>${listos.length}</h3>
                    <p>Listos</p>
                </div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green"><i data-lucide="truck"></i></div>
                <div class="stat-info">
                    <h3>${entregados.length}</h3>
                    <p>Entregados</p>
                </div>
            </div>
        </div>

        <!-- Kanban Board -->
        <div class="kanban-board">
            <!-- En preparación -->
            <div class="kanban-column kanban-col-prep">
                <div class="kanban-column-header">
                    <h3>🔥 En preparación</h3>
                    <span class="kanban-count">${enPreparacion.length}</span>
                </div>
                ${enPreparacion.map(p => this.renderKanbanCard(p)).join('')}
                ${enPreparacion.length === 0 ? '<p class="text-muted text-center" style="font-size:.82rem;padding:1rem;">Sin pedidos</p>' : ''}
            </div>

            <!-- Listos -->
            <div class="kanban-column kanban-col-ready">
                <div class="kanban-column-header">
                    <h3>✅ Listo para entrega</h3>
                    <span class="kanban-count">${listos.length}</span>
                </div>
                ${listos.map(p => this.renderKanbanCard(p)).join('')}
                ${listos.length === 0 ? '<p class="text-muted text-center" style="font-size:.82rem;padding:1rem;">Sin pedidos</p>' : ''}
            </div>

            <!-- Entregados -->
            <div class="kanban-column kanban-col-delivered">
                <div class="kanban-column-header">
                    <h3>📦 Entregados</h3>
                    <span class="kanban-count">${entregados.length}</span>
                </div>
                ${entregados.map(p => this.renderKanbanCard(p)).join('')}
                ${entregados.length === 0 ? '<p class="text-muted text-center" style="font-size:.82rem;padding:1rem;">Sin pedidos</p>' : ''}
            </div>
        </div>

        <!-- Orders Table -->
        <div class="card mt-2">
            <div class="card-header">
                <span>📋 Todos los pedidos</span>
            </div>
            <div class="card-body" style="padding:0;overflow-x:auto;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Cliente</th>
                            <th>Descripción</th>
                            <th>Entrega</th>
                            <th>Total</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pedidos.map(p => `
                            <tr>
                                <td><strong>${p.numero}</strong></td>
                                <td>${p.cliente_nombre || '—'}</td>
                                <td style="max-width:250px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.descripcion || '—'}</td>
                                <td>${App.formatDate(p.fecha_entrega)} ${p.hora_entrega || ''}</td>
                                <td><strong>${App.formatCurrency(p.total)}</strong></td>
                                <td><span class="status-badge status-${p.estado}">${App.statusLabel(p.estado)}</span></td>
                                <td class="actions">
                                    ${p.estado === 'en_preparacion' ? `<button class="btn btn-sm btn-primary" onclick="Pages.pedidos.cambiarEstado(${p.id},'listo')">Marcar listo</button>` : ''}
                                    ${p.estado === 'listo' ? `<button class="btn btn-sm btn-success" onclick="Pages.pedidos.cambiarEstado(${p.id},'entregado')">Entregar</button>` : ''}
                                    <button class="btn btn-sm btn-outline btn-icon" title="Eliminar" onclick="Pages.pedidos.eliminar(${p.id})">
                                        <i data-lucide="trash-2"></i>
                                    </button>
                                </td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>`;
    },

    renderKanbanCard(p) {
        return `
        <div class="kanban-card" onclick="Pages.pedidos.verDetalle(${p.id})">
            <h4>${p.numero} — ${p.cliente_nombre || 'Sin cliente'}</h4>
            <div class="order-info">
                ${p.descripcion || 'Sin descripción'}<br>
                📅 ${App.formatDate(p.fecha_entrega)} ${p.hora_entrega || ''}
            </div>
            <div class="order-footer">
                <span class="order-total">${App.formatCurrency(p.total)}</span>
                <span class="order-date">${App.formatDate(p.created_at)}</span>
            </div>
        </div>`;
    },

    init() {
        // Events are handled via onclick attributes
    },

    verDetalle(id) {
        const p = DB.getOne("SELECT * FROM pedidos WHERE id = ?", [id]);
        if (!p) return;

        App.showModal(`Pedido ${p.numero}`, `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem .8rem;font-size:.9rem;">
                <p><strong>Cliente:</strong></p><p>${p.cliente_nombre || '—'}</p>
                <p><strong>Descripción:</strong></p><p>${p.descripcion || '—'}</p>
                <p><strong>Fecha entrega:</strong></p><p>${App.formatDate(p.fecha_entrega)} ${p.hora_entrega || ''}</p>
                <p><strong>Estado:</strong></p><p><span class="status-badge status-${p.estado}">${App.statusLabel(p.estado)}</span></p>
                <p><strong>Total:</strong></p><p style="font-size:1.2rem;font-weight:700;color:var(--primary);">${App.formatCurrency(p.total)}</p>
            </div>
            ${p.notas ? `<p style="margin-top:.8rem;font-size:.85rem;"><strong>Notas:</strong> ${p.notas}</p>` : ''}
        `, `
            ${p.estado === 'en_preparacion' ? `<button class="btn btn-primary" onclick="Pages.pedidos.cambiarEstado(${p.id},'listo');App.closeModal();">Marcar como listo</button>` : ''}
            ${p.estado === 'listo' ? `<button class="btn btn-success" onclick="Pages.pedidos.cambiarEstado(${p.id},'entregado');App.closeModal();">Marcar entregado</button>` : ''}
            <button class="btn btn-outline" onclick="App.closeModal()">Cerrar</button>
        `);
    },

    cambiarEstado(id, estado) {
        DB.run("UPDATE pedidos SET estado = ? WHERE id = ?", [estado, id]);
        App.showToast(`Pedido actualizado: ${App.statusLabel(estado)}`, 'success');
        App.navigateTo('pedidos');
    },

    eliminar(id) {
        if (confirm('¿Eliminar este pedido?')) {
            DB.run("DELETE FROM pedidos WHERE id = ?", [id]);
            App.showToast('Pedido eliminado', 'success');
            App.navigateTo('pedidos');
        }
    }
};
