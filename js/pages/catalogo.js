/* =============================================
   PAGE: Catálogo
   ============================================= */
window.Pages = window.Pages || {};

Pages.catalogo = {
    currentTab: 'tamano',

    render() {
        const tabs = [
            {key:'tamano',label:'Tamaños',icon:'📐'},
            {key:'sabor',label:'Sabores',icon:'🍰'},
            {key:'diseno',label:'Diseños',icon:'🎨'},
            {key:'decoracion',label:'Decoración',icon:'✨'},
            {key:'fondant',label:'Fondant',icon:'🧁'},
            {key:'extras',label:'Extras',icon:'🎁'}
        ];
        return `
        <div class="page-toolbar">
            <div class="toolbar-left"><h2 style="font-size:1rem;font-weight:600;">Productos y servicios</h2></div>
            <div class="toolbar-right">
                <button class="btn btn-primary btn-sm" id="btn-add-product"><i data-lucide="plus"></i> Nuevo producto</button>
            </div>
        </div>
        <div class="catalog-tabs">
            ${tabs.map(t=>`<button class="catalog-tab ${t.key===this.currentTab?'active':''}" data-tab="${t.key}">${t.icon} ${t.label}</button>`).join('')}
        </div>
        <div class="catalog-grid" id="catalog-grid">
            ${this.renderProducts(this.currentTab)}
        </div>`;
    },

    renderProducts(cat) {
        const items = DB.getAll("SELECT * FROM catalogo WHERE categoria=? ORDER BY nombre",[cat]);
        if(!items.length) return '<div class="empty-state"><div class="empty-icon">📦</div><h3>Sin productos</h3><p>Agrega productos a esta categoría</p></div>';
        return items.map(item=>`
            <div class="catalog-card">
                <div class="catalog-card-img">${item.emoji||'🎂'}</div>
                <div class="catalog-card-body">
                    <h4>${item.nombre}</h4>
                    <p>${item.descripcion||''}</p>
                    <div class="catalog-price">${item.precio>0?App.formatCurrency(item.precio):'Incluido'}</div>
                </div>
                <div class="catalog-card-footer">
                    <label class="toggle-switch">
                        <input type="checkbox" ${item.activo?'checked':''} onchange="Pages.catalogo.toggleActive(${item.id},this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                    <div class="actions">
                        <button class="btn btn-sm btn-outline btn-icon" onclick="Pages.catalogo.editar(${item.id})"><i data-lucide="edit-2"></i></button>
                        <button class="btn btn-sm btn-outline btn-icon" onclick="Pages.catalogo.eliminar(${item.id})"><i data-lucide="trash-2"></i></button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    init() {
        document.querySelectorAll('.catalog-tab').forEach(tab=>{
            tab.addEventListener('click',()=>{
                document.querySelectorAll('.catalog-tab').forEach(t=>t.classList.remove('active'));
                tab.classList.add('active');
                this.currentTab = tab.dataset.tab;
                document.getElementById('catalog-grid').innerHTML = this.renderProducts(this.currentTab);
                if(window.lucide) lucide.createIcons();
            });
        });
        document.getElementById('btn-add-product').addEventListener('click',()=>this.showAdd());
    },

    showAdd() {
        App.showModal('Nuevo Producto',`
            <div class="form-group"><label class="form-label">Categoría</label>
                <select id="np-cat" class="form-input"><option value="tamano">Tamaño</option><option value="sabor">Sabor</option><option value="diseno">Diseño</option><option value="decoracion">Decoración</option><option value="fondant">Fondant</option><option value="extras">Extra</option></select></div>
            <div class="form-group"><label class="form-label">Nombre *</label><input type="text" id="np-nombre" class="form-input"></div>
            <div class="form-group"><label class="form-label">Precio (Q.)</label><input type="number" id="np-precio" class="form-input" step="0.01" value="0"></div>
            <div class="form-group"><label class="form-label">Descripción</label><input type="text" id="np-desc" class="form-input"></div>
            <div class="form-group"><label class="form-label">Emoji</label><input type="text" id="np-emoji" class="form-input" value="🎂"></div>
        `,`<button class="btn btn-outline" onclick="App.closeModal()">Cancelar</button><button class="btn btn-primary" onclick="Pages.catalogo.guardarNuevo()">Guardar</button>`);
    },

    guardarNuevo() {
        const n=document.getElementById('np-nombre').value.trim();
        if(!n){App.showToast('Nombre requerido','error');return;}
        DB.run("INSERT INTO catalogo (categoria,nombre,precio,descripcion,emoji) VALUES(?,?,?,?,?)",[
            document.getElementById('np-cat').value, n,
            parseFloat(document.getElementById('np-precio').value)||0,
            document.getElementById('np-desc').value.trim(),
            document.getElementById('np-emoji').value.trim()||'🎂'
        ]);
        App.closeModal(); App.showToast('Producto agregado','success'); App.navigateTo('catalogo');
    },

    editar(id) {
        const p=DB.getOne("SELECT * FROM catalogo WHERE id=?",[id]); if(!p)return;
        App.showModal('Editar Producto',`
            <div class="form-group"><label class="form-label">Nombre *</label><input type="text" id="ep-nombre" class="form-input" value="${p.nombre}"></div>
            <div class="form-group"><label class="form-label">Precio (Q.)</label><input type="number" id="ep-precio" class="form-input" step="0.01" value="${p.precio}"></div>
            <div class="form-group"><label class="form-label">Descripción</label><input type="text" id="ep-desc" class="form-input" value="${p.descripcion||''}"></div>
            <div class="form-group"><label class="form-label">Emoji</label><input type="text" id="ep-emoji" class="form-input" value="${p.emoji||'🎂'}"></div>
        `,`<button class="btn btn-outline" onclick="App.closeModal()">Cancelar</button><button class="btn btn-primary" onclick="Pages.catalogo.guardarEdit(${id})">Guardar</button>`);
    },

    guardarEdit(id) {
        const n=document.getElementById('ep-nombre').value.trim();
        if(!n){App.showToast('Nombre requerido','error');return;}
        DB.run("UPDATE catalogo SET nombre=?,precio=?,descripcion=?,emoji=? WHERE id=?",[n,parseFloat(document.getElementById('ep-precio').value)||0,document.getElementById('ep-desc').value.trim(),document.getElementById('ep-emoji').value.trim()||'🎂',id]);
        App.closeModal(); App.showToast('Producto actualizado','success'); App.navigateTo('catalogo');
    },

    toggleActive(id,active) {
        DB.run("UPDATE catalogo SET activo=? WHERE id=?",[active?1:0,id]);
        App.showToast(active?'Producto activado':'Producto desactivado','info');
    },

    eliminar(id) {
        if(confirm('¿Eliminar este producto?')){DB.run("DELETE FROM catalogo WHERE id=?",[id]);App.showToast('Producto eliminado','success');App.navigateTo('catalogo');}
    }
};
