/* =============================================
   PAGE: Usuarios (Admin)
   ============================================= */
window.Pages = window.Pages || {};

Pages.usuarios = {
    render() {
        return `
        <div class="page-toolbar">
            <div class="toolbar-left">
                <h2>Gestión de Usuarios</h2>
            </div>
            <div class="toolbar-right">
                <button class="btn btn-primary" id="btn-new-user">
                    <i data-lucide="plus"></i> Nuevo Usuario
                </button>
            </div>
        </div>

        <div class="card">
            <div class="card-body" style="padding:0;">
                <table class="data-table" id="users-table">
                    <thead>
                        <tr>
                            <th>Nombre</th>
                            <th>Usuario</th>
                            <th>Rol</th>
                            <th>Estado</th>
                            <th>Acciones</th>
                        </tr>
                    </thead>
                    <tbody id="users-tbody">
                        <!-- Llenado por JS -->
                    </tbody>
                </table>
            </div>
        </div>
        `;
    },

    init() {
        this.loadUsers();
        document.getElementById('btn-new-user').addEventListener('click', () => this.showUserModal());
    },

    loadUsers() {
        const users = DB.getAll("SELECT * FROM usuarios ORDER BY id DESC");
        const tbody = document.getElementById('users-tbody');
        
        if (users.length === 0) {
            tbody.innerHTML = `<tr><td colspan="5" class="text-center text-muted py-3">No hay usuarios registrados</td></tr>`;
            return;
        }

        tbody.innerHTML = users.map(u => `
            <tr>
                <td class="fw-bold">${u.nombre}</td>
                <td>${u.usuario}</td>
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
                        <button class="btn btn-outline btn-icon" onclick="Pages.usuarios.showUserModal(${u.id})" title="Editar">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path></svg>
                        </button>
                        ${u.id !== App.currentUser.id ? `
                        <button class="btn btn-outline btn-icon text-danger" onclick="Pages.usuarios.toggleStatus(${u.id}, ${u.activo})" title="${u.activo ? 'Desactivar' : 'Activar'}">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18.36 6.64a9 9 0 1 1-12.73 0"></path><line x1="12" y1="2" x2="12" y2="12"></line></svg>
                        </button>
                        ` : ''}
                    </div>
                </td>
            </tr>
        `).join('');
    },

    showUserModal(id = null) {
        let u = { nombre: '', usuario: '', password: '', rol: 'vendedor' };
        let isEdit = false;
        
        if (id) {
            u = DB.getOne("SELECT * FROM usuarios WHERE id = ?", [id]);
            isEdit = true;
        }

        const body = `
            <form id="user-form">
                <input type="hidden" id="u-id" value="${id || ''}">
                <div class="form-group">
                    <label class="form-label">Nombre completo</label>
                    <input type="text" id="u-nombre" class="form-input" required value="${u.nombre}">
                </div>
                <div class="form-group">
                    <label class="form-label">Usuario de acceso</label>
                    <input type="text" id="u-usuario" class="form-input" required value="${u.usuario}" ${isEdit ? 'readonly style="background:#f5f5f5;"' : ''}>
                </div>
                <div class="form-group">
                    <label class="form-label">Contraseña</label>
                    <input type="text" id="u-password" class="form-input" required value="${u.password}">
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
            </form>
        `;
        
        const footer = `
            <button class="btn btn-outline" onclick="App.closeModal()">Cancelar</button>
            <button class="btn btn-primary" onclick="Pages.usuarios.saveUser()">Guardar</button>
        `;

        App.showModal(isEdit ? 'Editar Usuario' : 'Nuevo Usuario', body, footer);
    },

    saveUser() {
        const id = document.getElementById('u-id').value;
        const nombre = document.getElementById('u-nombre').value.trim();
        const usuario = document.getElementById('u-usuario').value.trim();
        const password = document.getElementById('u-password').value.trim();
        const rol = document.getElementById('u-rol').value;

        if (!nombre || !usuario || !password) {
            App.showToast('Por favor completa todos los campos', 'error');
            return;
        }

        if (id) {
            DB.run("UPDATE usuarios SET nombre = ?, password = ?, rol = ? WHERE id = ?", [nombre, password, rol, id]);
            App.showToast('Usuario actualizado', 'success');
        } else {
            // Check if exists
            const exists = DB.getOne("SELECT id FROM usuarios WHERE usuario = ?", [usuario]);
            if (exists) {
                App.showToast('Ese nombre de usuario ya existe', 'error');
                return;
            }
            DB.run("INSERT INTO usuarios (nombre, usuario, password, rol) VALUES (?,?,?,?)", [nombre, usuario, password, rol]);
            App.showToast('Usuario creado', 'success');
        }

        App.closeModal();
        this.loadUsers();
    },

    toggleStatus(id, currentStatus) {
        const newStatus = currentStatus ? 0 : 1;
        DB.run("UPDATE usuarios SET activo = ? WHERE id = ?", [newStatus, id]);
        App.showToast(`Usuario ${newStatus ? 'activado' : 'desactivado'}`, 'success');
        this.loadUsers();
    }
};
