/* =============================================
   APP — Router & Main Logic
   ============================================= */
window.Pages = window.Pages || {};

const App = {
    currentUser: null,
    currentPage: null,
    chartInstances: [],

    async init() {
        // Show loading
        document.getElementById('loading-screen').style.display = 'flex';
        document.getElementById('app').style.display = 'none';

        try {
            // Initialize database
            await DB.init();

            // Hide loading, show app
            document.getElementById('loading-screen').style.display = 'none';
            document.getElementById('app').style.display = 'flex';

            // Initialize lucide icons
            if (window.lucide) lucide.createIcons();

            // Check session
            const session = localStorage.getItem('milenas_session');
            if (session) {
                this.currentUser = JSON.parse(session);
                this.updateUIForRole();
                document.getElementById('app').style.display = 'flex';
                // Setup and Navigate
                this.setupRouter();
                this.setupSidebar();
                this.setupHeader();
                const hash = window.location.hash.slice(1) || 'nueva-cotizacion';
                this.navigateTo(hash);
            } else {
                // Show login
                document.getElementById('login-screen').style.display = 'flex';
                this.setupLogin();
            }
        } catch (err) {
            console.error('Error initializing app:', err);
            document.getElementById('loading-screen').innerHTML = `
                <div class="loader">
                    <div class="loader-icon">⚠️</div>
                    <p class="loader-text">Error al cargar. Intenta recargar la página.</p>
                    <button onclick="location.reload()" style="margin-top:1rem;padding:.5rem 1.5rem;border-radius:8px;background:white;color:#D6336C;font-weight:600;border:none;cursor:pointer;">Recargar</button>
                </div>`;
        }
    },

    setupRouter() {
        window.addEventListener('hashchange', () => {
            if (!this.currentUser) return;
            const page = window.location.hash.slice(1) || 'nueva-cotizacion';
            this.navigateTo(page);
        });
    },

    setupLogin() {
        const form = document.getElementById('login-form');
        form.addEventListener('submit', (e) => {
            e.preventDefault();
            const user = document.getElementById('login-usuario').value.trim();
            const pass = document.getElementById('login-password').value.trim();
            
            const dbUser = DB.getOne("SELECT * FROM usuarios WHERE usuario = ? AND password = ? AND activo = 1", [user, pass]);
            
            if (dbUser) {
                this.currentUser = dbUser;
                localStorage.setItem('milenas_session', JSON.stringify(dbUser));
                document.getElementById('login-error').style.display = 'none';
                document.getElementById('login-screen').style.display = 'none';
                document.getElementById('app').style.display = 'flex';
                
                this.updateUIForRole();
                this.setupRouter();
                this.setupSidebar();
                this.setupHeader();
                
                // Redirigir a inicio si no es admin y quiere entrar a algo prohibido
                const hash = window.location.hash.slice(1) || 'nueva-cotizacion';
                this.navigateTo(hash);
                
                this.showToast(`Bienvenido ${dbUser.nombre}`, 'success');
            } else {
                document.getElementById('login-error').style.display = 'block';
            }
        });
    },

    updateUIForRole() {
        // Update header user info
        if (this.currentUser) {
            document.getElementById('header-user-name').textContent = this.currentUser.nombre;
            document.getElementById('header-user-role').textContent = this.currentUser.rol.charAt(0).toUpperCase() + this.currentUser.rol.slice(1);
            const avatarLetter = this.currentUser.nombre.substring(0, 2).toUpperCase();
            document.querySelector('.user-avatar').textContent = avatarLetter;
        }

        // Hide sidebar elements based on role
        const isAdmin = this.currentUser && this.currentUser.rol === 'admin';
        document.querySelectorAll('.nav-item[data-role="admin"]').forEach(el => {
            el.style.display = isAdmin ? 'flex' : 'none';
        });
    },

    setupSidebar() {
        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const page = item.dataset.page;
                window.location.hash = page;
            });
        });

        // Logout button
        document.getElementById('btn-logout').addEventListener('click', (e) => {
            e.preventDefault();
            this.currentUser = null;
            localStorage.removeItem('milenas_session');
            document.getElementById('app').style.display = 'none';
            document.getElementById('login-screen').style.display = 'flex';
            
            // Clean inputs
            document.getElementById('login-usuario').value = '';
            document.getElementById('login-password').value = '';
            
            this.showToast('Sesión cerrada', 'info');
        });
    },

    setupHeader() {
        // Notifications button
        document.getElementById('btn-notifications').addEventListener('click', () => {
            const target = new Date();
            target.setDate(target.getDate() + 2);
            const limitStr = target.toISOString().split('T')[0];
            const urgentes = DB.getAll("SELECT * FROM pedidos WHERE estado = 'en_preparacion' AND fecha_entrega <= ? ORDER BY fecha_entrega ASC", [limitStr]);
            if (urgentes.length === 0) {
                this.showToast('No hay notificaciones nuevas', 'info');
            } else {
                let body = `<div style="max-height:50vh;overflow-y:auto;">`;
                body += `<p style="font-size:.85rem;color:var(--text-medium);margin-bottom:.8rem;">Pedidos con entrega en las próximas 48 horas:</p>`;
                urgentes.forEach(p => {
                    body += `<div style="padding:.6rem;background:var(--bg-main);border-radius:8px;margin-bottom:.5rem;font-size:.85rem;">
                        <strong>${p.numero}</strong> — ${p.cliente_nombre || 'Sin cliente'}<br>
                        <span style="color:var(--danger);">📅 Entrega: ${this.formatDate(p.fecha_entrega)} ${p.hora_entrega || ''}</span>
                    </div>`;
                });
                body += `</div>`;
                this.showModal('🔔 Notificaciones', body, `<button class="btn btn-outline" onclick="App.closeModal()">Cerrar</button>`);
            }
        });
        
        // Update notification count
        this.updateNotifications();

    },

    updateNotifications() {
        const target = new Date();
        target.setDate(target.getDate() + 2);
        const limitStr = target.toISOString().split('T')[0];
        const count = DB.getOne("SELECT COUNT(*) as c FROM pedidos WHERE estado = 'en_preparacion' AND fecha_entrega <= ?", [limitStr]);
        const badge = document.getElementById('notification-badge');
        if (badge) {
            const n = count ? count.c : 0;
            badge.textContent = n;
            badge.style.display = n > 0 ? 'flex' : 'none';
        }
    },

    navigateTo(page) {
        // Destroy existing charts
        this.destroyCharts();

        // Update sidebar active
        document.querySelectorAll('.nav-item[data-page]').forEach(item => {
            item.classList.toggle('active', item.dataset.page === page);
        });

        // Page titles
        const titles = {
            'nueva-cotizacion': 'Nueva cotización',
            'cotizaciones': 'Cotizaciones',
            'pedidos': 'Pedidos',
            'clientes': 'Clientes',
            'reportes': 'Reportes',
            'configuracion': 'Configuración'
        };
        document.getElementById('page-title').textContent = titles[page] || "Milena's";

        // Page key mapping
        const pageKeys = {
            'nueva-cotizacion': 'nuevaCotizacion',
            'cotizaciones': 'cotizaciones',
            'pedidos': 'pedidos',
            'clientes': 'clientes',
            'reportes': 'reportes',
            'configuracion': 'configuracion'
        };

        const pageKey = pageKeys[page];
        
        // Authorization check
        const adminPages = ['reportes', 'configuracion'];
        if (adminPages.includes(page) && this.currentUser && this.currentUser.rol !== 'admin') {
            this.showToast('No tienes permiso para acceder a esta página', 'error');
            this.navigateTo('nueva-cotizacion');
            return;
        }

        const pageModule = Pages[pageKey];

        if (pageModule) {
            const content = document.getElementById('main-content');
            content.innerHTML = `<div class="page-enter">${pageModule.render()}</div>`;
            
            // Re-create icons
            if (window.lucide) lucide.createIcons();

            // Initialize page
            if (pageModule.init) pageModule.init();
            
            this.currentPage = page;
            
            // Update notifications count
            this.updateNotifications();
        }
    },

    destroyCharts() {
        this.chartInstances.forEach(c => {
            try { c.destroy(); } catch(e) {}
        });
        this.chartInstances = [];
    },

    registerChart(chart) {
        this.chartInstances.push(chart);
    },

    // Toast notification
    showToast(message, type = 'info') {
        const container = document.getElementById('toast-container');
        const toast = document.createElement('div');
        toast.className = `toast toast-${type}`;
        
        const icons = { success: '✓', error: '✕', info: 'ℹ', warning: '⚠' };
        toast.innerHTML = `<span>${icons[type] || 'ℹ'}</span><span>${message}</span>`;
        container.appendChild(toast);

        setTimeout(() => {
            toast.classList.add('hiding');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    },

    // Modal
    showModal(title, body, footer = '') {
        const overlay = document.getElementById('modal-overlay');
        const content = document.getElementById('modal-content');
        content.innerHTML = `
            <div class="modal-header">
                <h3>${title}</h3>
                <button class="modal-close" onclick="App.closeModal()">✕</button>
            </div>
            <div class="modal-body">${body}</div>
            ${footer ? `<div class="modal-footer">${footer}</div>` : ''}
        `;
        overlay.style.display = 'flex';
        overlay.onclick = (e) => { if (e.target === overlay) this.closeModal(); };
    },

    closeModal() {
        document.getElementById('modal-overlay').style.display = 'none';
    },

    // Format currency
    formatCurrency(amount) {
        const symbol = DB.getConfig('moneda_simbolo') || 'Q.';
        return `${symbol}${Number(amount).toFixed(2)}`;
    },

    // Format date
    formatDate(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric' });
    },

    formatDateTime(dateStr) {
        if (!dateStr) return '—';
        const d = new Date(dateStr);
        return d.toLocaleDateString('es-GT', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
    },

    // Status label mapping
    statusLabel(status) {
        const labels = {
            'pendiente': 'Pendiente',
            'enviada': 'Enviada',
            'aceptada': 'Aceptada',
            'rechazada': 'Rechazada',
            'en_preparacion': 'En preparación',
            'listo': 'Listo',
            'entregado': 'Entregado',
            'cancelado': 'Cancelado'
        };
        return labels[status] || status;
    }
};

// Initialize app when DOM ready
document.addEventListener('DOMContentLoaded', () => App.init());
