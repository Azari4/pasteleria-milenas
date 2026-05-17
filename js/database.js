/* =============================================
   DATABASE - Supabase + SQL cache
   ============================================= */

const SUPABASE_URL = window.MILENAS_SUPABASE_URL || 'https://vtyvdbgywecrreeogeop.supabase.co';
const SUPABASE_KEY = window.MILENAS_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZ0eXZkYmd5d2VjcnJlZW9nZW9wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3Nzg5NTYwNjEsImV4cCI6MjA5NDUzMjA2MX0.6pDmjXlA2dkWXB2eOQTdHD9sdvleExzAhvdiFxTXA3E';

const COTIZACION_ESTADOS = {
    NUEVA: 'Nueva',
    SEGUIMIENTO: 'En seguimiento',
    CERRADA: 'Cerrada (venta)',
    PERDIDA: 'Perdida'
};

window.COTIZACION_ESTADOS = COTIZACION_ESTADOS;

const DB = {
    db: null,
    client: null,
    realtimeChannel: null,
    ready: false,
    tables: ['configuracion', 'usuarios', 'catalogo', 'clientes', 'cotizaciones', 'pedidos'],

    async init() {
        const SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
        });

        this.db = new SQL.Database();
        this.createSchema();

        if (this.hasSupabaseConfig()) {
            this.client = window.supabase.createClient(SUPABASE_URL, SUPABASE_KEY, {
                auth: {
                    persistSession: false,
                    autoRefreshToken: false,
                    detectSessionInUrl: false
                },
                realtime: {
                    params: { eventsPerSecond: 10 }
                }
            });
            await this.loadFromSupabase();
            this.setupRealtime();
        } else {
            console.warn('Supabase no configurado. Se cargan datos de ejemplo solo en memoria.');
            this.seedDemoData();
        }

        this.migrateCotizacionEstados();
        this.ready = true;
        return this.db;
    },

    hasSupabaseConfig() {
        return window.supabase &&
            SUPABASE_URL &&
            SUPABASE_KEY &&
            !SUPABASE_URL.includes('TU-PROYECTO') &&
            !SUPABASE_KEY.includes('TU-ANON-KEY');
    },

    createSchema() {
        this.db.run(`
            CREATE TABLE IF NOT EXISTS configuracion (
                clave TEXT PRIMARY KEY,
                valor TEXT
            );
            CREATE TABLE IF NOT EXISTS usuarios (
                id TEXT PRIMARY KEY,
                nombre TEXT NOT NULL,
                usuario TEXT UNIQUE,
                password TEXT NOT NULL DEFAULT '',
                rol TEXT NOT NULL DEFAULT 'vendedor',
                activo INTEGER DEFAULT 1,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS catalogo (
                id INTEGER PRIMARY KEY,
                categoria TEXT NOT NULL,
                nombre TEXT NOT NULL,
                precio REAL DEFAULT 0,
                descripcion TEXT,
                emoji TEXT,
                activo INTEGER DEFAULT 1,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS clientes (
                id INTEGER PRIMARY KEY,
                nombre TEXT NOT NULL,
                whatsapp TEXT NOT NULL UNIQUE,
                direccion TEXT,
                notas TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS cotizaciones (
                id INTEGER PRIMARY KEY,
                numero TEXT NOT NULL,
                cliente_id INTEGER,
                cliente_nombre TEXT,
                cliente_whatsapp TEXT,
                tamano INTEGER,
                precio_tamano REAL DEFAULT 0,
                sabor TEXT,
                precio_sabor REAL DEFAULT 0,
                diseno TEXT,
                precio_diseno REAL DEFAULT 0,
                extras TEXT,
                observaciones TEXT,
                total REAL DEFAULT 0,
                estado TEXT DEFAULT 'Nueva',
                usuario_id TEXT,
                usuario_nombre TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
            CREATE TABLE IF NOT EXISTS pedidos (
                id INTEGER PRIMARY KEY,
                numero TEXT NOT NULL,
                cotizacion_id INTEGER,
                cliente_id INTEGER,
                cliente_nombre TEXT,
                cliente_whatsapp TEXT,
                descripcion TEXT,
                fecha_entrega TEXT,
                hora_entrega TEXT,
                estado TEXT DEFAULT 'en_preparacion',
                total REAL DEFAULT 0,
                anticipo REAL DEFAULT 0,
                saldo_pendiente REAL DEFAULT 0,
                notas TEXT,
                created_at TEXT DEFAULT CURRENT_TIMESTAMP
            );
        `);
    },

    async getSession() {
        const userId = localStorage.getItem('milenas_session_user_id') || sessionStorage.getItem('milenas_session_user_id');
        if (!userId) return null;
        const user = this.getOne("SELECT * FROM usuarios WHERE id = ? AND activo = 1", [userId]);
        return user ? { user } : null;
    },

    async signIn(login, password, remember = false) {
        if (this.client) {
            await this.loadFromSupabase();
        }

        const normalized = login.trim().toLowerCase();
        const user = this.getOne(
            "SELECT * FROM usuarios WHERE activo = 1 AND password = ? AND lower(usuario) = ? LIMIT 1",
            [password, normalized]
        );

        if (!user) throw new Error('Usuario o contrasena incorrectos');
        localStorage.removeItem('milenas_session_user_id');
        sessionStorage.removeItem('milenas_session_user_id');
        const storage = remember ? localStorage : sessionStorage;
        storage.setItem('milenas_session_user_id', user.id);
        return this.getUserProfile(user);
    },

    async signOut() {
        localStorage.removeItem('milenas_session_user_id');
        sessionStorage.removeItem('milenas_session_user_id');
        if (this.realtimeChannel) {
            this.client.removeChannel(this.realtimeChannel);
            this.realtimeChannel = null;
        }
    },

    getUserProfile(user) {
        if (!user) return null;
        return {
            ...user,
            usuario: user.usuario
        };
    },

    async loadAuthenticatedData() {
        if (!this.client) return;
        await this.loadFromSupabase();
        this.migrateCotizacionEstados();
        this.setupRealtime();
    },

    async loadFromSupabase() {
        for (const table of this.tables) {
            const { data, error } = await this.client.from(table).select('*');
            if (error) {
                console.error(`No se pudo cargar ${table}:`, error.message);
                continue;
            }
            this.replaceTable(table, data || []);
        }

        const users = this.getAll("SELECT * FROM usuarios");
        if (!users.length) console.warn('No hay perfiles visibles para el usuario autenticado.');
    },

    replaceTable(table, rows) {
        this.db.run(`DELETE FROM ${table}`);
        rows.forEach(row => this.insertLocal(table, row, true));
    },

    setupRealtime() {
        if (!this.client || this.realtimeChannel) return;
        this.realtimeChannel = this.client.channel('milenas-realtime');
        this.tables.forEach(table => {
            this.realtimeChannel.on(
                'postgres_changes',
                { event: '*', schema: 'public', table },
                payload => this.handleRealtime(table, payload)
            );
        });
        this.realtimeChannel.subscribe(status => {
            if (status === 'CHANNEL_ERROR') {
                console.error('No se pudo conectar realtime. Revisa RLS y la publicacion supabase_realtime.');
            }
        });
    },

    handleRealtime(table, payload) {
        if (payload.eventType === 'DELETE') {
            this.db.run(`DELETE FROM ${table} WHERE id = ?`, [payload.old.id]);
        } else {
            this.deleteLocalById(table, payload.new.id);
            this.insertLocal(table, payload.new, true);
            if (table === 'cotizaciones') this.migrateCotizacionEstados();
        }
        this.refreshCurrentPage(table);
    },

    refreshCurrentPage(table) {
        if (!window.App || !App.currentPage) return;
        if (App.currentPage === 'configuracion' && window.Pages?.configuracion?.handleDataRefresh) {
            Pages.configuracion.handleDataRefresh(table);
            return;
        }
        const pageTables = {
            'nueva-cotizacion': ['catalogo', 'clientes', 'configuracion'],
            'cotizaciones': ['cotizaciones', 'clientes', 'pedidos'],
            'pedidos': ['pedidos', 'cotizaciones', 'clientes'],
            'clientes': ['clientes', 'cotizaciones', 'pedidos'],
            'reportes': ['cotizaciones', 'pedidos'],
            'configuracion': ['configuracion', 'catalogo', 'usuarios']
        };
        if ((pageTables[App.currentPage] || []).includes(table)) {
            App.navigateTo(App.currentPage);
        }
    },

    migrateCotizacionEstados() {
        const replacements = {
            pendiente: COTIZACION_ESTADOS.NUEVA,
            enviada: COTIZACION_ESTADOS.SEGUIMIENTO,
            aceptada: COTIZACION_ESTADOS.CERRADA,
            rechazada: COTIZACION_ESTADOS.PERDIDA
        };
        Object.entries(replacements).forEach(([oldValue, newValue]) => {
            this.db.run("UPDATE cotizaciones SET estado = ? WHERE estado = ?", [newValue, oldValue]);
            if (this.client) {
                this.client.from('cotizaciones').update({ estado: newValue }).eq('estado', oldValue);
            }
        });
    },

    getAll(sql, params = []) {
        try {
            const stmt = this.db.prepare(sql);
            stmt.bind(params);
            const rows = [];
            while (stmt.step()) rows.push(stmt.getAsObject());
            stmt.free();
            return rows;
        } catch (err) {
            console.error('DB.getAll error:', err, sql, params);
            return [];
        }
    },

    getOne(sql, params = []) {
        return this.getAll(sql, params)[0] || null;
    },

    getConfig(key) {
        const row = this.getOne("SELECT valor FROM configuracion WHERE clave = ?", [key]);
        return row ? row.valor : null;
    },

    setConfig(key, value) {
        this.db.run(
            "INSERT OR REPLACE INTO configuracion (clave, valor) VALUES (?, ?)",
            [key, value]
        );
        if (this.client) {
            this.client.from('configuracion')
                .upsert({ clave: key, valor: value }, { onConflict: 'clave' })
                .then(({ error }) => { if (error) console.error(error.message); });
        }
    },

    run(sql, params = []) {
        try {
            this.db.run(sql, params);
            const sync = this.syncMutation(sql, params).catch(err => {
                this.reportSyncError(err);
                return false;
            });
            return sync;
        } catch (err) {
            console.error('DB.run error:', err, sql, params);
            throw err;
        }
    },

    async syncMutation(sql, params) {
        if (!this.client) return;
        const normalized = sql.replace(/\s+/g, ' ').trim();
        const table = this.extractTable(normalized);
        if (!table) return;

        if (/^INSERT INTO/i.test(normalized)) {
            const row = this.getInsertedRow(normalized, table, params);
            if (row) {
                const { error } = await this.client
                    .from(table)
                    .upsert(this.cleanRow(row), { onConflict: 'id' });
                if (error) throw error;
            }
        } else if (/^UPDATE/i.test(normalized)) {
            const id = params[params.length - 1];
            const row = this.getOne(`SELECT * FROM ${table} WHERE id = ?`, [id]);
            if (row) {
                const { error } = await this.client
                    .from(table)
                    .upsert(this.cleanRow(row), { onConflict: 'id' });
                if (error) throw error;
            }
        } else if (/^DELETE FROM/i.test(normalized)) {
            const id = params[0];
            const { error } = await this.client.from(table).delete().eq('id', id);
            if (error) throw error;
        }
    },

    getInsertedRow(sql, table, params) {
        const columnsMatch = sql.match(/^INSERT INTO\s+[a-z_]+\s*\(([^)]+)\)/i);
        if (columnsMatch) {
            const columns = columnsMatch[1].split(',').map(col => col.trim());
            const idIndex = columns.indexOf('id');
            if (idIndex >= 0 && params[idIndex] !== undefined) {
                return this.getOne(`SELECT * FROM ${table} WHERE id = ?`, [params[idIndex]]);
            }
        }
        return this.getOne(`SELECT * FROM ${table} ORDER BY id DESC LIMIT 1`);
    },

    reportSyncError(error) {
        console.error('Supabase sync error:', error.message || error);
        if (window.App && App.showToast) {
            App.showToast(`No se pudo sincronizar con Supabase: ${error.message || error}`, 'error');
        }
    },

    extractTable(sql) {
        const insert = sql.match(/^INSERT INTO\s+([a-z_]+)/i);
        const update = sql.match(/^UPDATE\s+([a-z_]+)/i);
        const del = sql.match(/^DELETE FROM\s+([a-z_]+)/i);
        return (insert || update || del || [])[1] || null;
    },

    cleanRow(row) {
        const cleaned = {};
        Object.entries(row).forEach(([key, value]) => {
            cleaned[key] = value === undefined ? null : value;
        });
        return cleaned;
    },

    insertLocal(table, row) {
        if (table === 'clientes' && (!row.whatsapp || String(row.whatsapp).trim() === '')) {
            row = { ...row, whatsapp: `sin-whatsapp-${row.id || Date.now()}` };
        }
        const allowed = this.getTableColumns(table);
        const keys = Object.keys(row).filter(key => allowed.has(key));
        const placeholders = keys.map(() => '?').join(',');
        const numericColumns = new Set([
            'id', 'cliente_id', 'cotizacion_id', 'tamano',
            'precio_tamano', 'precio_sabor', 'precio_diseno', 'precio',
            'total', 'anticipo', 'saldo_pendiente', 'activo'
        ]);
        const values = keys.map(k => {
            if (numericColumns.has(k) && row[k] !== null && row[k] !== undefined && row[k] !== '') {
                const num = Number(row[k]);
                if (!isNaN(num)) {
                    return num;
                }
            }
            return row[k];
        });
        this.db.run(
            `INSERT OR REPLACE INTO ${table} (${keys.join(',')}) VALUES (${placeholders})`,
            values
        );
    },

    getTableColumns(table) {
        const info = this.getAll(`PRAGMA table_info(${table})`);
        return new Set(info.map(col => col.name));
    },

    deleteLocalById(table, id) {
        if (id !== undefined && id !== null) this.db.run(`DELETE FROM ${table} WHERE id = ?`, [id]);
    },

    seedDemoData() {
        const now = new Date().toISOString();
        const config = [
            ['negocio_nombre', "Milena's Pasteleria"],
            ['negocio_subtitulo', 'Pasteles personalizados'],
            ['negocio_whatsapp', '50200000000'],
            ['negocio_direccion', 'Ciudad de Guatemala'],
            ['moneda_simbolo', 'Q.'],
            ['moneda_nombre', 'Quetzal'],
            ['whatsapp_mensaje', "Hola, te comparto la cotizacion de tu pedido:"]
        ];
        config.forEach(c => this.db.run("INSERT OR IGNORE INTO configuracion (clave, valor) VALUES (?, ?)", c));

        this.db.run("INSERT OR IGNORE INTO usuarios (id,nombre,usuario,password,rol,activo,created_at) VALUES ('demo-admin','Admin Milena','admin','admin123','admin',1,?)", [now]);
        this.db.run("INSERT OR IGNORE INTO usuarios (id,nombre,usuario,password,rol,activo,created_at) VALUES ('demo-ventas','Vendedora','ventas','ventas123','vendedor',1,?)", [now]);

        const products = [
            ['tamano', '10', 120, '10 porciones', 'cake'],
            ['tamano', '20', 220, '20 porciones', 'cake'],
            ['tamano', '30', 320, '30 porciones', 'cake'],
            ['sabor', 'Vainilla', 0, '', ''],
            ['sabor', 'Chocolate', 15, '', ''],
            ['sabor', 'Red velvet', 25, '', ''],
            ['diseno', 'Basico', 0, '', ''],
            ['diseno', 'Personalizado', 60, '', ''],
            ['decoracion', 'Topper', 25, '', ''],
            ['fondant', 'Figura simple', 45, '', ''],
            ['extras', 'Relleno extra', 30, '', '']
        ];
        products.forEach((p, i) => {
            this.db.run(
                "INSERT OR IGNORE INTO catalogo (id,categoria,nombre,precio,descripcion,emoji,activo,created_at) VALUES (?,?,?,?,?,?,1,?)",
                [i + 1, ...p, now]
            );
        });
    },

    reset() {
        if (!confirm('Esto solo reinicia los datos locales en memoria. Para limpiar Supabase usa el panel SQL.')) return;
        this.tables.forEach(t => this.db.run(`DELETE FROM ${t}`));
        this.seedDemoData();
        App.navigateTo(App.currentPage || 'nueva-cotizacion');
    }
};

window.DB = DB;
