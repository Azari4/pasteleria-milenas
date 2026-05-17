/* =============================================
   PAGE: Configuración
   ============================================= */
window.Pages = window.Pages || {};

Pages.configuracion = {
    currentTab: 'tamano',
    currentSection: 'negocio',

    render() {
        const cfg = (k) => DB.getConfig(k) || '';
        
        // Catalogo tabs
        const catalogTabs = [
            {key:'tamano',label:'Tamaños',icon:'📐'},
            {key:'sabor',label:'Sabores',icon:'🍰'},
            {key:'diseno',label:'Diseños',icon:'🎨'},
            {key:'decoracion',label:'Decoración',icon:'✨'},
            {key:'fondant',label:'Fondant',icon:'🧁'},
            {key:'extras',label:'Extras',icon:'🎁'}
        ];

        return `
        <div class="config-layout">
            <nav class="config-nav">
                <div class="config-nav-item ${this.currentSection === 'negocio' ? 'active' : ''}" data-section="negocio"><i data-lucide="building"></i> Negocio</div>
                <div class="config-nav-item" data-section="catalogo"><i data-lucide="cake"></i> Catálogo</div>
                <div class="config-nav-item" data-section="usuarios"><i data-lucide="users"></i> Usuarios</div>
                <div class="config-nav-item" data-section="whatsapp"><i data-lucide="message-circle"></i> WhatsApp</div>
                <div class="config-nav-item" data-section="sistema"><i data-lucide="sliders"></i> Sistema</div>
            </nav>
            <div class="config-content">
                <!-- Negocio -->
                <div class="config-section" id="sec-negocio">
                    <h3><i data-lucide="building"></i> Datos del negocio</h3>
                    <div class="config-grid">
                        <div class="form-group"><label class="form-label">Nombre del negocio</label><input type="text" id="cfg-nombre" class="form-input" value="${cfg('negocio_nombre')}"></div>
                        <div class="form-group"><label class="form-label">Subtítulo</label><input type="text" id="cfg-subtitulo" class="form-input" value="${cfg('negocio_subtitulo')}"></div>
                        <div class="form-group"><label class="form-label">WhatsApp del negocio</label><input type="text" id="cfg-whatsapp" class="form-input" value="${cfg('negocio_whatsapp')}"></div>
                    </div>
                    <div class="form-group"><label class="form-label">Dirección</label><input type="text" id="cfg-direccion" class="form-input" value="${cfg('negocio_direccion')}"></div>
                    <button class="btn btn-primary mt-1" id="btn-save-negocio"><i data-lucide="save"></i> Guardar cambios</button>
                </div>

                <!-- Catálogo -->
                <div class="config-section" id="sec-catalogo" style="display:none;">
                    <div class="page-toolbar" style="margin-bottom: 1rem; padding-bottom: 0; border: none;">
                        <div class="toolbar-left"><h3 style="margin:0;"><i data-lucide="cake"></i> Productos y servicios</h3></div>
                        <div class="toolbar-right">
                            <button class="btn btn-primary btn-sm" id="btn-add-product"><i data-lucide="plus"></i> Nuevo producto</button>
                        </div>
                    </div>
                    <div class="catalog-tabs">
                        ${catalogTabs.map(t=>`<button class="catalog-tab ${t.key===this.currentTab?'active':''}" data-tab="${t.key}">${t.icon} ${t.label}</button>`).join('')}
                    </div>
                    <div class="catalog-grid" id="catalog-grid">
                        ${this.renderProducts(this.currentTab)}
                    </div>
                </div>

                <!-- Usuarios -->
                <div class="config-section" id="sec-usuarios" style="display:none;">
                    <div class="page-toolbar" style="margin-bottom: 1rem; padding-bottom: 0; border: none;">
                        <div class="toolbar-left"><h3 style="margin:0;"><i data-lucide="users"></i> Gestión de Usuarios</h3></div>
                        <div class="toolbar-right">
                            <button class="btn btn-primary btn-sm" id="btn-new-user"><i data-lucide="plus"></i> Nuevo Usuario</button>
                        </div>
                    </div>
                    <div class="card">
                        <div class="card-body" style="padding:0;overflow-x:auto;">
                            <table class="data-table" id="users-table">
                                <thead>
                                    <tr>
                                        <th>Nombre</th>
                                        <th>Usuario</th>
                                        <th>Contraseña</th>
                                        <th>Rol</th>
                                        <th>Estado</th>
                                        <th>Acciones</th>
                                    </tr>
                                </thead>
                                <tbody id="users-tbody">
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                <!-- WhatsApp -->
                <div class="config-section" id="sec-whatsapp" style="display:none;">
                    <h3><i data-lucide="message-circle"></i> Mensaje de WhatsApp</h3>
                    <div class="form-group">
                        <label class="form-label">Mensaje de saludo para cotizaciones</label>
                        <textarea id="cfg-wa-msg" class="form-textarea" style="min-height:120px;">${cfg('whatsapp_mensaje')}</textarea>
                    </div>
                    <p class="text-muted" style="font-size:.8rem;margin-bottom:1rem;">Este mensaje se enviará como encabezado cuando compartas una cotización por WhatsApp.</p>
                    <button class="btn btn-primary" id="btn-save-wa"><i data-lucide="save"></i> Guardar mensaje</button>
                </div>

                <!-- Sistema -->
                <div class="config-section" id="sec-sistema" style="display:none;">
                    <h3><i data-lucide="sliders"></i> Sistema</h3>
                    <div class="config-grid">
                        <div class="form-group">
                            <label class="form-label">Moneda</label>
                            <select id="cfg-moneda-select" class="form-input">
                                <option value="Q.|Quetzal" ${cfg('moneda_simbolo') === 'Q.' ? 'selected' : ''}>Q. (Quetzal)</option>
                                <option value="$|Dólar" ${cfg('moneda_simbolo') === '$' ? 'selected' : ''}>$ (Dólar)</option>
                                <option value="€|Euro" ${cfg('moneda_simbolo') === '€' ? 'selected' : ''}>€ (Euro)</option>
                                <option value="MXN|Peso Mexicano" ${cfg('moneda_simbolo') === 'MXN' ? 'selected' : ''}>MXN (Peso Mexicano)</option>
                                <option value="COP|Peso Colombiano" ${cfg('moneda_simbolo') === 'COP' ? 'selected' : ''}>COP (Peso Colombiano)</option>
                            </select>
                        </div>
                    </div>
                    <button class="btn btn-primary mt-1" id="btn-save-sistema"><i data-lucide="save"></i> Guardar</button>
                    <div style="margin-top:2rem;padding-top:1.5rem;border-top:2px solid var(--danger-light);">
                        <h4 style="color:var(--danger);font-size:.95rem;margin-bottom:.5rem;">⚠️ Zona peligrosa</h4>
                        <p class="text-muted" style="font-size:.82rem;margin-bottom:.8rem;">Esto eliminará todos los datos y restaurará los valores de ejemplo.</p>
                        <button class="btn btn-danger btn-sm" id="btn-reset-db"><i data-lucide="refresh-cw"></i> Restaurar datos de ejemplo</button>
                    </div>
                </div>
            </div>
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
                        <input type="checkbox" ${item.activo?'checked':''} onchange="Pages.configuracion.toggleActive(${item.id},this.checked)">
                        <span class="toggle-slider"></span>
                    </label>
                    <div class="actions">
                        <button class="btn btn-sm btn-outline btn-icon" onclick="Pages.configuracion.editarProducto(${item.id})"><i data-lucide="edit-2"></i></button>
                        <button class="btn btn-sm btn-outline btn-icon" onclick="Pages.configuracion.eliminarProducto(${item.id})"><i data-lucide="trash-2"></i></button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    init() {
        // Init users
        this.loadUsers();
        document.getElementById('btn-new-user').addEventListener('click', () => this.showUserModal());

        // Nav items
        document.querySelectorAll('.config-nav-item').forEach(item=>{
            item.addEventListener('click',()=>{
                document.querySelectorAll('.config-nav-item').forEach(i=>i.classList.remove('active'));
                item.classList.add('active');
                const sec = item.dataset.section;
                this.currentSection = sec;
                this.switchSection(sec);
            });
        });

        // Catalog tabs
        document.querySelectorAll('.catalog-tab').forEach(tab=>{
            tab.addEventListener('click',()=>{
                document.querySelectorAll('.catalog-tab').forEach(t=>t.classList.remove('active'));
                tab.classList.add('active');
                this.currentTab = tab.dataset.tab;
                document.getElementById('catalog-grid').innerHTML = this.renderProducts(this.currentTab);
                if(window.lucide) lucide.createIcons();
            });
        });

        // Add Product
        const btnAdd = document.getElementById('btn-add-product');
        if (btnAdd) {
            btnAdd.addEventListener('click',()=>this.showAddProduct());
        }

        // Save negocio
        document.getElementById('btn-save-negocio').addEventListener('click',()=>{
            DB.setConfig('negocio_nombre', document.getElementById('cfg-nombre').value);
            DB.setConfig('negocio_subtitulo', document.getElementById('cfg-subtitulo').value);
            DB.setConfig('negocio_whatsapp', document.getElementById('cfg-whatsapp').value);
            DB.setConfig('negocio_direccion', document.getElementById('cfg-direccion').value);
            App.showToast('Datos del negocio guardados','success');
        });

        // Save WhatsApp
        document.getElementById('btn-save-wa').addEventListener('click',()=>{
            DB.setConfig('whatsapp_mensaje', document.getElementById('cfg-wa-msg').value);
            App.showToast('Mensaje de WhatsApp guardado','success');
        });

        // Save sistema
        document.getElementById('btn-save-sistema').addEventListener('click',()=>{
            const monedaVal = document.getElementById('cfg-moneda-select').value.split('|');
            if(monedaVal.length === 2) {
                DB.setConfig('moneda_simbolo', monedaVal[0]);
                DB.setConfig('moneda_nombre', monedaVal[1]);
            }
            App.showToast('Configuración guardada','success');
            this.refreshCatalogGrid(); // Actualizar la vista en tiempo real
        });

        // Reset DB
        document.getElementById('btn-reset-db').addEventListener('click',()=>{
            if(confirm('¿Estás segura? Se perderán todos los datos actuales.')){
                DB.reset();
            }
        });
        this.switchSection(this.currentSection);
    },

    switchSection(section) {
        this.currentSection = section || 'negocio';
        document.querySelectorAll('.config-nav-item').forEach(item => {
            item.classList.toggle('active', item.dataset.section === this.currentSection);
        });
        document.querySelectorAll('.config-section').forEach(sec => {
            sec.style.display = sec.id === `sec-${this.currentSection}` ? 'block' : 'none';
        });
    },

    showAddProduct() {
        App.showModal('Nuevo Producto',`
            <div class="form-group"><label class="form-label">Categoría</label>
                <select id="np-cat" class="form-input">
                    <option value="tamano" ${this.currentTab === 'tamano' ? 'selected' : ''}>Tamaño</option>
                    <option value="sabor" ${this.currentTab === 'sabor' ? 'selected' : ''}>Sabor</option>
                    <option value="diseno" ${this.currentTab === 'diseno' ? 'selected' : ''}>Diseño</option>
                    <option value="decoracion" ${this.currentTab === 'decoracion' ? 'selected' : ''}>Decoración</option>
                    <option value="fondant" ${this.currentTab === 'fondant' ? 'selected' : ''}>Fondant</option>
                    <option value="extras" ${this.currentTab === 'extras' ? 'selected' : ''}>Extra</option>
                </select></div>
            <div class="form-group"><label class="form-label">Nombre *</label><input type="text" id="np-nombre" class="form-input"></div>
            <div class="form-group"><label class="form-label">Precio</label><input type="number" id="np-precio" class="form-input" step="0.01" value="0"></div>
            <div class="form-group"><label class="form-label">Descripción</label><input type="text" id="np-desc" class="form-input"></div>
            <div class="form-group"><label class="form-label">Emoji</label><input type="text" id="np-emoji" class="form-input" value="🎂"></div>
        `,`<button class="btn btn-outline" onclick="App.closeModal()">Cancelar</button><button class="btn btn-primary" onclick="Pages.configuracion.guardarNuevoProducto()">Guardar</button>`);
    },

    async guardarNuevoProducto() {
        const n=document.getElementById('np-nombre').value.trim();
        if(!n){App.showToast('Nombre requerido','error');return;}
        const categoria = document.getElementById('np-cat').value;
        const exists = DB.getOne("SELECT id FROM catalogo WHERE categoria=? AND lower(nombre)=lower(?)", [categoria, n]);
        if(exists){App.showToast('Ya existe un producto con ese nombre en esta categoria','error');return;}
        await DB.run("INSERT INTO catalogo (categoria,nombre,precio,descripcion,emoji) VALUES(?,?,?,?,?)",[
            categoria, n,
            parseFloat(document.getElementById('np-precio').value)||0,
            document.getElementById('np-desc').value.trim(),
            document.getElementById('np-emoji').value.trim()||'🎂'
        ]);
        App.closeModal(); 
        App.showToast('Producto agregado','success');
        this.currentTab = document.getElementById('np-cat').value;
        this.refreshCatalogGrid();
    },

    editarProducto(id) {
        const p=DB.getOne("SELECT * FROM catalogo WHERE id=?",[id]); if(!p)return;
        App.showModal('Editar Producto',`
            <div class="form-group"><label class="form-label">Nombre *</label><input type="text" id="ep-nombre" class="form-input" value="${p.nombre}"></div>
            <div class="form-group"><label class="form-label">Precio</label><input type="number" id="ep-precio" class="form-input" step="0.01" value="${p.precio}"></div>
            <div class="form-group"><label class="form-label">Descripción</label><input type="text" id="ep-desc" class="form-input" value="${p.descripcion||''}"></div>
            <div class="form-group"><label class="form-label">Emoji</label><input type="text" id="ep-emoji" class="form-input" value="${p.emoji||'🎂'}"></div>
        `,`<button class="btn btn-outline" onclick="App.closeModal()">Cancelar</button><button class="btn btn-primary" onclick="Pages.configuracion.guardarEditProducto(${id})">Guardar</button>`);
    },

    async guardarEditProducto(id) {
        const n=document.getElementById('ep-nombre').value.trim();
        if(!n){App.showToast('Nombre requerido','error');return;}
        const current = DB.getOne("SELECT categoria FROM catalogo WHERE id=?", [id]);
        const exists = current ? DB.getOne("SELECT id FROM catalogo WHERE categoria=? AND lower(nombre)=lower(?) AND id<>?", [current.categoria, n, id]) : null;
        if(exists){App.showToast('Ya existe un producto con ese nombre en esta categoria','error');return;}
        await DB.run("UPDATE catalogo SET nombre=?,precio=?,descripcion=?,emoji=? WHERE id=?",[n,parseFloat(document.getElementById('ep-precio').value)||0,document.getElementById('ep-desc').value.trim(),document.getElementById('ep-emoji').value.trim()||'🎂',id]);
        App.closeModal(); 
        App.showToast('Producto actualizado','success'); 
        this.refreshCatalogGrid();
    },

    toggleActive(id,active) {
        DB.run("UPDATE catalogo SET activo=? WHERE id=?",[active?1:0,id]);
        App.showToast(active?'Producto activado':'Producto desactivado','info');
    },

    eliminarProducto(id) {
        if(confirm('¿Eliminar este producto?')){
            DB.run("DELETE FROM catalogo WHERE id=?",[id]);
            App.showToast('Producto eliminado','success');
            this.refreshCatalogGrid();
        }
    },

    refreshCatalogGrid() {
        document.getElementById('catalog-grid').innerHTML = this.renderProducts(this.currentTab);
        if(window.lucide) lucide.createIcons();
    },

    handleDataRefresh(table) {
        if (table === 'catalogo') {
            this.refreshCatalogGrid();
            return;
        }
        if (table === 'usuarios') {
            this.loadUsers();
            return;
        }
        if (table === 'configuracion') {
            this.switchSection(this.currentSection);
        }
    },

    loadUsers() {
        const users = DB.getAll("SELECT * FROM usuarios ORDER BY id DESC");
        const tbody = document.getElementById('users-tbody');
        if (!tbody) return;
        
        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="6" class="text-center text-muted py-3">No hay usuarios registrados</td></tr>`;
            return;
        }

        tbody.innerHTML = users.map(u => `
            <tr>
                <td class="fw-bold">${u.nombre}</td>
                <td>${u.usuario || ''}</td>
                <td><code>${u.password || ''}</code></td>
                <td>
                    <span class="status-badge" style="background:var(--purple-mid);color:white;">
                        ${u.rol.toUpperCase()}
                    </span>
                </td>
                <td>
                    <span class="status-badge status-${u.activo ? 'activo' : 'inactivo'}">
                        ${u.activo ? 'Activo' : 'Inactivo'}
                    </span>
                </td>
                <td>
                    <div class="actions">
                        <button class="btn btn-outline btn-icon" onclick="Pages.configuracion.showUserModal('${u.id}')" title="Editar">
                            <i data-lucide="edit-2"></i>
                        </button>
                        ${u.rol !== 'admin' ? `
                        <button class="btn btn-outline btn-icon text-warning" onclick="Pages.configuracion.toggleStatus('${u.id}', ${u.activo})" title="${u.activo ? 'Desactivar' : 'Activar'}">
                            <i data-lucide="power"></i>
                        </button>
                        <button class="btn btn-outline btn-icon text-danger" onclick="Pages.configuracion.deleteUser('${u.id}')" title="Eliminar">
                            <i data-lucide="trash-2"></i>
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
        if(window.lucide) lucide.createIcons();
    },

    async showUserModal(id = null) {
        let u = { id: '', nombre: '', usuario: '', password: '', rol: 'vendedor', activo: 1 };
        let isEdit = false;
        if (id) {
            u = DB.getOne("SELECT * FROM usuarios WHERE id = ?", [id]) ||
                DB.getAll("SELECT * FROM usuarios").find(user => String(user.id) === String(id));
            if (!u && DB.client) {
                await DB.loadFromSupabase();
                u = DB.getOne("SELECT * FROM usuarios WHERE id = ?", [id]) ||
                    DB.getAll("SELECT * FROM usuarios").find(user => String(user.id) === String(id));
            }
            if (!u) {
                App.showToast('No se encontro ese usuario. Recarga la lista e intenta de nuevo.', 'error');
                this.loadUsers();
                return;
            }
            isEdit = true;
        }

        const body = `
            <form id="user-form" autocomplete="off">
                <input type="hidden" id="u-id" value="${id || ''}">
                <div class="form-group">
                    <label class="form-label">Nombre completo</label>
                    <input type="text" id="u-nombre" class="form-input" required value="${u.nombre}" autocomplete="off" readonly onfocus="this.removeAttribute('readonly');">
                </div>
                <div class="form-group">
                    <label class="form-label">Usuario de acceso</label>
                    <input type="text" id="u-usuario" class="form-input" required value="${u.usuario || ''}" autocomplete="new-user-name" readonly onfocus="this.removeAttribute('readonly');">
                </div>
                <div class="form-group">
                    <label class="form-label">Rol</label>
                    <select id="u-rol" class="form-select" required>
                        <option value="admin" ${u.rol === 'admin' ? 'selected' : ''}>Administrador (Acceso total)</option>
                        <option value="vendedor" ${u.rol === 'vendedor' ? 'selected' : ''}>Vendedor (Solo ventas)</option>
                        <option value="decorador" ${u.rol === 'decorador' ? 'selected' : ''}>Decorador (Pedidos)</option>
                        <option value="pastelero" ${u.rol === 'pastelero' ? 'selected' : ''}>Pastelero (Pedidos)</option>
                    </select>
                </div>
                <div class="form-group">
                    <label class="form-label">Contraseña</label>
                    <div style="display:flex;gap:.5rem;align-items:center;">
                        <input type="text" id="u-password" class="form-input" required autocomplete="new-password" value="${u.password || ''}" placeholder="Minimo 6 caracteres" readonly onfocus="this.removeAttribute('readonly');">
                        <button type="button" class="btn btn-outline btn-icon" onclick="Pages.configuracion.fillGeneratedPassword()" title="Generar contraseña">
                            <i data-lucide="refresh-cw"></i>
                        </button>
                    </div>
                </div>
            </form>
        `;
        const footer = `
            <button class="btn btn-outline" onclick="App.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="Pages.configuracion.saveUser()">Guardar</button>
        `;
        App.showModal(isEdit ? 'Editar Usuario' : 'Nuevo Usuario', body, footer);
        const passwordInput = document.getElementById('u-password');
        if (passwordInput) {
            passwordInput.required = true;
            passwordInput.value = u.password || '';
            passwordInput.placeholder = 'Minimo 6 caracteres';
        }
        if(window.lucide) lucide.createIcons();
    },

    generatePassword() {
        const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%';
        const bytes = new Uint32Array(12);
        crypto.getRandomValues(bytes);
        return Array.from(bytes, n => chars[n % chars.length]).join('');
    },

    fillGeneratedPassword() {
        const input = document.getElementById('u-password');
        if (input) {
            input.value = this.generatePassword();
            input.focus();
            input.select();
        }
    },

    async saveUser() {
        const id = document.getElementById('u-id').value;
        const nombre = document.getElementById('u-nombre').value.trim();
        const usuario = document.getElementById('u-usuario').value.trim();
        const rol = document.getElementById('u-rol').value;
        const passwordInput = document.getElementById('u-password');
        const password = passwordInput ? passwordInput.value.trim() : '';

        if (!nombre || !usuario || !password) {
            App.showToast('Por favor completa todos los campos', 'error');
            return;
        }
        if (password.length < 6) {
            App.showToast('La contraseña debe tener al menos 6 caracteres', 'error');
            return;
        }

        try {
            if (id) {
                const exists = DB.getOne("SELECT id FROM usuarios WHERE lower(usuario) = lower(?) AND id <> ?", [usuario, id]);
                if (exists) {
                    App.showToast('Ese usuario ya existe', 'error');
                    return;
                }
                await DB.run("UPDATE usuarios SET nombre = ?, usuario = ?, password = ?, rol = ? WHERE id = ?", [nombre, usuario, password, rol, id]);
            } else {
                const exists = DB.getOne("SELECT id FROM usuarios WHERE lower(usuario) = lower(?)", [usuario]);
                if (exists) {
                    App.showToast('Ese usuario ya existe', 'error');
                    return;
                }
                const localId = crypto.randomUUID ? crypto.randomUUID() : `local-${Date.now()}`;
                await DB.run("INSERT INTO usuarios (id, nombre, usuario, password, rol, activo) VALUES (?,?,?,?,?,1)", [localId, nombre, usuario, password, rol]);
            }

            App.showToast(id ? 'Usuario actualizado' : 'Usuario creado', 'success');
            App.closeModal();
            this.loadUsers();
        } catch (err) {
            console.error('User save error:', err);
            App.showToast(err.message || 'No se pudo guardar el usuario', 'error');
        }
    },

    async toggleStatus(id, currentStatus) {
        const newStatus = currentStatus ? 0 : 1;
        try {
            await DB.run("UPDATE usuarios SET activo = ? WHERE id = ?", [newStatus, id]);
            App.showToast(`Usuario ${newStatus ? 'activado' : 'desactivado'}`, 'success');
            this.loadUsers();
        } catch (err) {
            console.error('User status error:', err);
            App.showToast(err.message || 'No se pudo cambiar el estado', 'error');
        }
    },

    async deleteUser(id) {
        if (confirm('¿Estás seguro de que deseas eliminar este usuario? Esta acción no se puede deshacer.')) {
            try {
                await DB.run("DELETE FROM usuarios WHERE id = ?", [id]);
                App.showToast('Usuario eliminado', 'success');
                this.loadUsers();
            } catch (err) {
                console.error('User delete error:', err);
                App.showToast(err.message || 'No se pudo eliminar el usuario', 'error');
            }
        }
    }
};
