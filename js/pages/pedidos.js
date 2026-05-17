/* =============================================
   PAGE: Pedidos
   ============================================= */
window.Pages = window.Pages || {};

Pages.pedidos = {
    render() {
        const pedidos = DB.getAll("SELECT p.*, COALESCE(p.cliente_whatsapp, cl.whatsapp) as cli_wp FROM pedidos p LEFT JOIN clientes cl ON p.cliente_id = cl.id ORDER BY p.fecha_entrega ASC");
        const enPreparacion = pedidos.filter(p => p.estado === 'en_preparacion');
        const listos = pedidos.filter(p => p.estado === 'listo');
        const entregados = pedidos.filter(p => p.estado === 'entregado');

        // Cálculos de anticipo y saldo
        const totalAnticipado = pedidos.reduce((s, p) => s + (p.anticipo || 0), 0);
        const totalPendiente = pedidos.reduce((s, p) => s + (p.saldo_pendiente || 0), 0);

        return `
        <!-- Stats -->
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon pink"><i data-lucide="shopping-bag"></i></div>
                <div class="stat-info"><h3>${pedidos.length}</h3><p>Total pedidos</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange"><i data-lucide="clock"></i></div>
                <div class="stat-info"><h3>${enPreparacion.length}</h3><p>En preparación</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon blue"><i data-lucide="check-square"></i></div>
                <div class="stat-info"><h3>${listos.length}</h3><p>Listos</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green"><i data-lucide="truck"></i></div>
                <div class="stat-info"><h3>${entregados.length}</h3><p>Entregados</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon purple"><i data-lucide="wallet"></i></div>
                <div class="stat-info"><h3>${App.formatCurrency(totalAnticipado)}</h3><p>Total anticipado</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon orange"><i data-lucide="alert-circle"></i></div>
                <div class="stat-info"><h3>${App.formatCurrency(totalPendiente)}</h3><p>Saldo pendiente</p></div>
            </div>
        </div>

        <!-- Kanban Board -->
        <div class="kanban-board">
            <!-- En preparación -->
            <div class="kanban-column kanban-col-prep" ondragover="event.preventDefault()" ondrop="Pages.pedidos.drop(event, 'en_preparacion')">
                <div class="kanban-column-header">
                    <h3>En preparación</h3>
                    <span class="kanban-count">${enPreparacion.length}</span>
                </div>
                ${enPreparacion.map(p => this.renderKanbanCard(p)).join('')}
                ${enPreparacion.length === 0 ? '<p class="text-muted text-center" style="font-size:.82rem;padding:1rem;">Sin pedidos</p>' : ''}
            </div>

            <!-- Listos -->
            <div class="kanban-column kanban-col-ready" ondragover="event.preventDefault()" ondrop="Pages.pedidos.drop(event, 'listo')">
                <div class="kanban-column-header">
                    <h3>Listo para entrega</h3>
                    <span class="kanban-count">${listos.length}</span>
                </div>
                ${listos.map(p => this.renderKanbanCard(p)).join('')}
                ${listos.length === 0 ? '<p class="text-muted text-center" style="font-size:.82rem;padding:1rem;">Sin pedidos</p>' : ''}
            </div>

            <!-- Entregados -->
            <div class="kanban-column kanban-col-delivered" ondragover="event.preventDefault()" ondrop="Pages.pedidos.drop(event, 'entregado')">
                <div class="kanban-column-header">
                    <h3>Entregados</h3>
                    <span class="kanban-count">${entregados.length}</span>
                </div>
                ${entregados.map(p => this.renderKanbanCard(p)).join('')}
                ${entregados.length === 0 ? '<p class="text-muted text-center" style="font-size:.82rem;padding:1rem;">Sin pedidos</p>' : ''}
            </div>
        </div>

        <!-- Orders Table -->
        <div class="card mt-2">
            <div class="card-header"><span>Todos los pedidos</span></div>
            <div class="card-body" style="padding:0;overflow-x:auto;">
                <table class="data-table">
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Cliente</th>
                            <th>WhatsApp</th>
                            <th>Descripción</th>
                            <th>Entrega</th>
                            <th>Total</th>
                            <th>Anticipo</th>
                            <th>Saldo</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${pedidos.map(p => `
                            <tr>
                                <td><strong>${p.numero}</strong></td>
                                <td>${p.cliente_nombre || '—'}</td>
                                <td style="font-size:.82rem;color:var(--text-medium);">${p.cli_wp || '—'}</td>
                                <td style="max-width:200px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;">${p.descripcion || '—'}</td>
                                <td>${App.formatDate(p.fecha_entrega)} ${p.hora_entrega || ''}</td>
                                <td><strong>${App.formatCurrency(p.total)}</strong></td>
                                <td style="color:var(--success);font-weight:600;">${App.formatCurrency(p.anticipo || 0)}</td>
                                <td style="color:${(p.saldo_pendiente || 0) > 0 ? 'var(--danger)' : 'var(--success)'};font-weight:600;">${App.formatCurrency(p.saldo_pendiente || 0)}</td>
                                <td><span class="status-badge status-${p.estado}">${App.statusLabel(p.estado)}</span></td>
                                <td class="actions">
                                    ${p.estado === 'en_preparacion' ? `<button class="btn btn-sm btn-primary" onclick="Pages.pedidos.cambiarEstado(${p.id},'listo')">Marcar listo</button>` : ''}
                                    ${p.estado === 'listo' ? `<button class="btn btn-sm btn-success" onclick="Pages.pedidos.cambiarEstado(${p.id},'entregado')">Entregar</button>` : ''}
                                    <button class="btn btn-sm btn-outline btn-icon" title="Editar anticipo" onclick="Pages.pedidos.editarAnticipo(${p.id})">
                                        <i data-lucide="wallet"></i>
                                    </button>
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
        const saldo = p.saldo_pendiente || 0;
        const saldoBadge = saldo > 0
            ? `<span style="font-size:.72rem;color:var(--danger);font-weight:600;">Saldo: ${App.formatCurrency(saldo)}</span>`
            : `<span style="font-size:.72rem;color:var(--success);font-weight:600;">✓ Pagado</span>`;

        return `
        <div class="kanban-card" draggable="true" ondragstart="Pages.pedidos.dragStart(event, ${p.id})" onclick="Pages.pedidos.verDetalle(${p.id})">
            <h4>${p.numero} — ${p.cliente_nombre || 'Sin cliente'}</h4>
            <div class="order-info">
                ${p.descripcion || 'Sin descripción'}<br>
                ${App.formatDate(p.fecha_entrega)} ${p.hora_entrega || ''}
            </div>
            <div class="order-footer">
                <span class="order-total">${App.formatCurrency(p.total)}</span>
                ${saldoBadge}
            </div>
        </div>`;
    },

    init() {
        // Events are handled via onclick attributes
    },

    dragStart(event, id) {
        event.dataTransfer.setData('pedido_id', id);
    },

    drop(event, nuevoEstado) {
        event.preventDefault();
        const id = event.dataTransfer.getData('pedido_id');
        if (id) this.cambiarEstado(id, nuevoEstado);
    },

    verDetalle(id) {
        const p = DB.getOne("SELECT p.*, COALESCE(p.cliente_whatsapp, cl.whatsapp) as cli_wp FROM pedidos p LEFT JOIN clientes cl ON p.cliente_id = cl.id WHERE p.id = ?", [id]);
        if (!p) return;

        const saldo = p.saldo_pendiente || 0;
        const anticipo = p.anticipo || 0;

        App.showModal(`Pedido ${p.numero}`, `
            <div style="display:grid;grid-template-columns:1fr 1fr;gap:.5rem .8rem;font-size:.9rem;">
                <p><strong>Cliente:</strong></p><p>${p.cliente_nombre || '—'}</p>
                <p><strong>WhatsApp:</strong></p><p>${p.cli_wp || '—'}</p>
                <p><strong>Descripción:</strong></p><p>${p.descripcion || '—'}</p>
                <p><strong>Fecha entrega:</strong></p><p>${App.formatDate(p.fecha_entrega)} ${p.hora_entrega || ''}</p>
                <p><strong>Estado:</strong></p><p><span class="status-badge status-${p.estado}">${App.statusLabel(p.estado)}</span></p>
                <p><strong>Total:</strong></p><p style="font-size:1.2rem;font-weight:700;color:var(--primary);">${App.formatCurrency(p.total)}</p>
                <p><strong>Anticipo recibido:</strong></p><p style="color:var(--success);font-weight:600;">${App.formatCurrency(anticipo)}</p>
                <p><strong>Saldo pendiente:</strong></p><p style="color:${saldo > 0 ? 'var(--danger)' : 'var(--success)'};font-weight:600;">${App.formatCurrency(saldo)}</p>
            </div>
            ${p.notas ? `<p style="margin-top:.8rem;font-size:.85rem;"><strong>Notas:</strong> ${p.notas}</p>` : ''}
        `, `
            ${p.estado === 'en_preparacion' ? `<button class="btn btn-primary" onclick="Pages.pedidos.cambiarEstado(${p.id},'listo');App.closeModal();">Marcar como listo</button>` : ''}
            ${p.estado === 'en_preparacion' ? `<button class="btn btn-danger" onclick="if(confirm('¿Cancelar este pedido?')){ Pages.pedidos.cambiarEstado(${p.id},'cancelado'); App.closeModal(); }">Cancelar pedido</button>` : ''}
            ${p.estado === 'listo' ? `<button class="btn btn-success" onclick="Pages.pedidos.cambiarEstado(${p.id},'entregado');App.closeModal();">Marcar entregado</button>` : ''}
            <button class="btn btn-outline" onclick="App.closeModal(); setTimeout(()=>Pages.pedidos.editarAnticipo(${p.id}),50);">Editar anticipo</button>
            <button class="btn btn-outline" onclick="App.closeModal()">Cerrar</button>
        `);
    },

    editarAnticipo(id) {
        const p = DB.getOne("SELECT * FROM pedidos WHERE id = ?", [id]);
        if (!p) return;

        App.showModal(`Anticipo — ${p.numero}`,
            `<p style="font-size:.9rem;margin-bottom:.8rem;">Total del pedido: <strong>${App.formatCurrency(p.total)}</strong></p>
            <div class="form-group">
                <label class="form-label">Anticipo recibido</label>
                <input type="number" id="ant-monto" class="form-input" value="${p.anticipo || 0}" min="0" max="${p.total}" step="0.01">
            </div>`,
            `<button class="btn btn-outline" onclick="App.closeModal()">Cancelar</button>
             <button class="btn btn-primary" onclick="Pages.pedidos._guardarAnticipo(${p.id}, ${p.total})">Guardar</button>`
        );
    },

    async _guardarAnticipo(id, total) {
        const monto = parseFloat(document.getElementById('ant-monto').value) || 0;
        if (monto < 0 || monto > total) {
            App.showToast('El anticipo debe estar entre 0 y el total', 'error');
            return;
        }
        const saldo = Math.max(0, total - monto);
        await DB.run("UPDATE pedidos SET anticipo = ?, saldo_pendiente = ? WHERE id = ?", [monto, saldo, id]);
        App.closeModal();
        App.showToast('Anticipo actualizado', 'success');
        App.navigateTo('pedidos');
    },

    async cambiarEstado(id, estado) {
        await DB.run("UPDATE pedidos SET estado = ? WHERE id = ?", [estado, id]);

        if (estado === 'entregado') {
            const p = DB.getOne("SELECT * FROM pedidos WHERE id = ?", [id]);
            if (p && p.cotizacion_id) {
                await DB.run("UPDATE cotizaciones SET estado = 'Cerrada (venta)' WHERE id = ?", [p.cotizacion_id]);
            }
        }

        App.showToast(`Pedido actualizado: ${App.statusLabel(estado)}`, 'success');
        App.navigateTo('pedidos');
    },

    eliminar(id) {
        if (confirm('¿Eliminar este pedido?')) {
            DB.run("DELETE FROM pedidos WHERE id = ?", [id]);
            App.showToast('Pedido eliminado', 'success');
            App.navigateTo('pedidos');
        }
    },

    // Modal para pedir fecha y anticipo al convertir cotización en pedido
    pedirFechaYCrear(datosCallback) {
        const hoy = new Date();
        const defFecha = new Date(hoy);
        defFecha.setDate(hoy.getDate() + 2);
        const defStr = defFecha.toISOString().split('T')[0];

        App.showModal('Fecha de entrega y anticipo',
            `<div class="form-group">
                <label class="form-label">Fecha de entrega *</label>
                <input type="date" id="ped-fecha" class="form-input" value="${defStr}" min="${hoy.toISOString().split('T')[0]}">
            </div>
            <div class="form-group">
                <label class="form-label">Hora de entrega</label>
                <input type="time" id="ped-hora" class="form-input" value="12:00">
            </div>
            <div class="form-group">
                <label class="form-label">Anticipo recibido (opcional)</label>
                <input type="number" id="ped-anticipo" class="form-input" value="0" min="0" step="0.01" placeholder="0.00">
            </div>`,
            `<button class="btn btn-outline" onclick="App.closeModal()">Cancelar</button>
             <button class="btn btn-primary" onclick="Pages.pedidos._confirmarFecha()">Confirmar pedido</button>`
        );
        this._pendingCallback = datosCallback;
    },

    _pendingCallback: null,

    _confirmarFecha() {
        const fecha = document.getElementById('ped-fecha').value;
        const hora = document.getElementById('ped-hora').value || '12:00';
        const anticipo = parseFloat(document.getElementById('ped-anticipo').value) || 0;
        if (!fecha) { App.showToast('La fecha de entrega es requerida', 'error'); return; }
        App.closeModal();
        if (Pages.pedidos._pendingCallback) {
            Pages.pedidos._pendingCallback(fecha, hora, anticipo);
            Pages.pedidos._pendingCallback = null;
        }
    }
};
