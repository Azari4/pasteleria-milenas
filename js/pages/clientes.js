/* =============================================
   PAGE: Clientes
   ============================================= */
window.Pages = window.Pages || {};

Pages.clientes = {
    render() {
        const clientes = DB.getAll("SELECT * FROM clientes ORDER BY nombre ASC");
        return `
        <div class="stats-grid">
            <div class="stat-card">
                <div class="stat-icon purple"><i data-lucide="users"></i></div>
                <div class="stat-info"><h3>${clientes.length}</h3><p>Total clientes</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon green"><i data-lucide="user-plus"></i></div>
                <div class="stat-info"><h3>${this.getNewClients()}</h3><p>Nuevos este mes</p></div>
            </div>
            <div class="stat-card">
                <div class="stat-icon pink"><i data-lucide="repeat"></i></div>
                <div class="stat-info"><h3>${this.getRepeatClients()}</h3><p>Recurrentes</p></div>
            </div>
        </div>
        <div class="page-toolbar">
            <div class="toolbar-left">
                <div class="search-box" style="min-width:280px;">
                    <i data-lucide="search"></i>
                    <input type="text" id="client-search" placeholder="Buscar por nombre o WhatsApp...">
                </div>
            </div>
            <div class="toolbar-right">
                <button class="btn btn-primary btn-sm" id="btn-add-client"><i data-lucide="user-plus"></i> Nuevo cliente</button>
            </div>
        </div>
        <div class="clients-grid" id="clients-grid">
            ${clientes.map(c => this.renderCard(c)).join('')}
        </div>`;
    },

    renderCard(c) {
        const initials = c.nombre.split(' ').map(n=>n[0]).slice(0,2).join('').toUpperCase();
        const cotCount = DB.getOne("SELECT COUNT(*) as cnt FROM cotizaciones WHERE cliente_id=?",[c.id])?.cnt||0;
        const pedCount = DB.getOne("SELECT COUNT(*) as cnt FROM pedidos WHERE cliente_id=?",[c.id])?.cnt||0;
        const totalG = DB.getOne("SELECT COALESCE(SUM(total),0) as t FROM cotizaciones WHERE cliente_id=? AND estado='aceptada'",[c.id])?.t||0;
        return `<div class="client-card">
            <div class="client-card-header">
                <div class="client-avatar">${initials}</div>
                <div><div class="client-name">${c.nombre}</div><div class="client-meta">Desde ${App.formatDate(c.created_at)}</div></div>
            </div>
            <div class="client-details">
                ${c.whatsapp?`<p><i data-lucide="phone"></i> ${c.whatsapp}</p>`:''}
                ${c.email?`<p><i data-lucide="mail"></i> ${c.email}</p>`:''}
                ${c.direccion?`<p><i data-lucide="map-pin"></i> ${c.direccion}</p>`:''}
            </div>
            <div class="client-card-footer">
                <div class="client-stats"><strong>${cotCount}</strong> cot. · <strong>${pedCount}</strong> ped.<br>Total: <strong class="text-primary">${App.formatCurrency(totalG)}</strong></div>
                <div class="actions">
                    <button class="btn btn-sm btn-outline btn-icon" onclick="Pages.clientes.editar(${c.id})"><i data-lucide="edit-2"></i></button>
                    <button class="btn btn-sm btn-outline btn-icon" onclick="Pages.clientes.eliminar(${c.id})"><i data-lucide="trash-2"></i></button>
                </div>
            </div>
        </div>`;
    },

    getNewClients() { return DB.getOne("SELECT COUNT(*) as c FROM clientes WHERE created_at >= date('now','-30 days')")?.c||0; },
    getRepeatClients() { const r=DB.getAll("SELECT cliente_id FROM cotizaciones GROUP BY cliente_id HAVING COUNT(*)>1"); return r.length; },

    init() {
        document.getElementById('client-search').addEventListener('input', e => {
            const q = e.target.value.toLowerCase();
            const all = DB.getAll("SELECT * FROM clientes ORDER BY nombre ASC");
            const f = q ? all.filter(c=>c.nombre.toLowerCase().includes(q)||(c.whatsapp&&c.whatsapp.includes(q))) : all;
            document.getElementById('clients-grid').innerHTML = f.map(c=>this.renderCard(c)).join('');
            if(window.lucide) lucide.createIcons();
        });
        document.getElementById('btn-add-client').addEventListener('click', ()=>this.showAdd());
    },

    showAdd() {
        App.showModal('Nuevo Cliente', `
            <div class="form-group"><label class="form-label">Nombre *</label><input type="text" id="nc-nombre" class="form-input" placeholder="Nombre"></div>
            <div class="form-group"><label class="form-label">WhatsApp</label><input type="text" id="nc-whatsapp" class="form-input" placeholder="WhatsApp"></div>
            <div class="form-group"><label class="form-label">Email</label><input type="email" id="nc-email" class="form-input" placeholder="Email"></div>
            <div class="form-group"><label class="form-label">Dirección</label><input type="text" id="nc-dir" class="form-input" placeholder="Dirección"></div>
            <div class="form-group"><label class="form-label">Notas</label><textarea id="nc-notas" class="form-textarea" placeholder="Notas"></textarea></div>
        `,`<button class="btn btn-outline" onclick="App.closeModal()">Cancelar</button><button class="btn btn-primary" onclick="Pages.clientes.guardarNuevo()">Guardar</button>`);
    },

    guardarNuevo() {
        const n=document.getElementById('nc-nombre').value.trim();
        if(!n){App.showToast('Nombre requerido','error');return;}
        DB.run("INSERT INTO clientes (nombre,whatsapp,email,direccion,notas) VALUES(?,?,?,?,?)",[n,document.getElementById('nc-whatsapp').value.trim(),document.getElementById('nc-email').value.trim(),document.getElementById('nc-dir').value.trim(),document.getElementById('nc-notas').value.trim()]);
        App.closeModal(); App.showToast('Cliente agregado','success'); App.navigateTo('clientes');
    },

    editar(id) {
        const c=DB.getOne("SELECT * FROM clientes WHERE id=?",[id]); if(!c) return;
        App.showModal('Editar Cliente', `
            <div class="form-group"><label class="form-label">Nombre *</label><input type="text" id="ec-nombre" class="form-input" value="${c.nombre}"></div>
            <div class="form-group"><label class="form-label">WhatsApp</label><input type="text" id="ec-whatsapp" class="form-input" value="${c.whatsapp||''}"></div>
            <div class="form-group"><label class="form-label">Email</label><input type="email" id="ec-email" class="form-input" value="${c.email||''}"></div>
            <div class="form-group"><label class="form-label">Dirección</label><input type="text" id="ec-dir" class="form-input" value="${c.direccion||''}"></div>
            <div class="form-group"><label class="form-label">Notas</label><textarea id="ec-notas" class="form-textarea">${c.notas||''}</textarea></div>
        `,`<button class="btn btn-outline" onclick="App.closeModal()">Cancelar</button><button class="btn btn-primary" onclick="Pages.clientes.guardarEdit(${id})">Guardar</button>`);
    },

    guardarEdit(id) {
        const n=document.getElementById('ec-nombre').value.trim();
        if(!n){App.showToast('Nombre requerido','error');return;}
        DB.run("UPDATE clientes SET nombre=?,whatsapp=?,email=?,direccion=?,notas=? WHERE id=?",[n,document.getElementById('ec-whatsapp').value.trim(),document.getElementById('ec-email').value.trim(),document.getElementById('ec-dir').value.trim(),document.getElementById('ec-notas').value.trim(),id]);
        App.closeModal(); App.showToast('Cliente actualizado','success'); App.navigateTo('clientes');
    },

    eliminar(id) {
        if(confirm('¿Eliminar este cliente?')){DB.run("DELETE FROM clientes WHERE id=?",[id]);App.showToast('Cliente eliminado','success');App.navigateTo('clientes');}
    }
};
