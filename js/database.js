/* =============================================
   DATABASE — sql.js (SQLite en WebAssembly)
   ============================================= */
window.DB = {
    db: null,
    
    async init() {
        const SQL = await initSqlJs({
            locateFile: file => `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`
        });
        
        const saved = localStorage.getItem('milenas_v3_db');
        if (saved) {
            try {
                const buf = Uint8Array.from(atob(saved), c => c.charCodeAt(0));
                this.db = new SQL.Database(buf);
            } catch(e) {
                console.warn('BD corrupta, recreando...', e);
                localStorage.removeItem('milenas_v3_db');
                this.db = new SQL.Database();
                this.createSchema();
                this.seedData();
                this.save();
            }
        } else {
            this.db = new SQL.Database();
            this.createSchema();
            this.seedData();
            this.save();
        }
        return this.db;
    },

    save() {
        try {
            const data = this.db.export();
            // Convertir en bloques para evitar stack overflow con arrays grandes
            let binary = '';
            const chunkSize = 8192;
            for (let i = 0; i < data.length; i += chunkSize) {
                binary += String.fromCharCode.apply(null, data.subarray(i, i + chunkSize));
            }
            const b64 = btoa(binary);
            localStorage.setItem('milenas_v3_db', b64);
        } catch(e) {
            console.warn('No se pudo guardar en localStorage:', e);
        }
    },

    exec(sql, params = []) {
        const result = this.db.exec(sql, params);
        return result;
    },

    run(sql, params = []) {
        this.db.run(sql, params);
        this.save();
    },

    getAll(sql, params = []) {
        const stmt = this.db.prepare(sql);
        if (params.length) stmt.bind(params);
        const rows = [];
        while (stmt.step()) {
            rows.push(stmt.getAsObject());
        }
        stmt.free();
        return rows;
    },

    getOne(sql, params = []) {
        const rows = this.getAll(sql, params);
        return rows.length > 0 ? rows[0] : null;
    },

    createSchema() {
        this.db.run(`
            CREATE TABLE IF NOT EXISTS clientes (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                dni TEXT,
                whatsapp TEXT,
                email TEXT,
                direccion TEXT,
                notas TEXT,
                created_at TEXT DEFAULT (datetime('now','localtime'))
            );
        `);

        this.db.run(`
            CREATE TABLE IF NOT EXISTS usuarios (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                nombre TEXT NOT NULL,
                usuario TEXT UNIQUE NOT NULL,
                password TEXT NOT NULL,
                rol TEXT NOT NULL,
                activo INTEGER DEFAULT 1,
                created_at TEXT DEFAULT (datetime('now','localtime'))
            );
        `);

        this.db.run(`
            CREATE TABLE IF NOT EXISTS cotizaciones (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                numero TEXT UNIQUE NOT NULL,
                cliente_id INTEGER,
                cliente_nombre TEXT,
                tamano INTEGER NOT NULL,
                precio_tamano REAL NOT NULL,
                sabor TEXT NOT NULL,
                precio_sabor REAL DEFAULT 0,
                diseno TEXT NOT NULL,
                precio_diseno REAL DEFAULT 0,
                extras TEXT DEFAULT '[]',
                observaciones TEXT,
                total REAL NOT NULL,
                estado TEXT DEFAULT 'pendiente',
                created_at TEXT DEFAULT (datetime('now','localtime')),
                FOREIGN KEY (cliente_id) REFERENCES clientes(id)
            );
        `);

        this.db.run(`
            CREATE TABLE IF NOT EXISTS pedidos (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                numero TEXT UNIQUE NOT NULL,
                cotizacion_id INTEGER,
                cliente_id INTEGER,
                cliente_nombre TEXT,
                descripcion TEXT,
                fecha_entrega TEXT,
                hora_entrega TEXT,
                estado TEXT DEFAULT 'en_preparacion',
                total REAL NOT NULL,
                notas TEXT,
                created_at TEXT DEFAULT (datetime('now','localtime')),
                FOREIGN KEY (cotizacion_id) REFERENCES cotizaciones(id),
                FOREIGN KEY (cliente_id) REFERENCES clientes(id)
            );
        `);

        this.db.run(`
            CREATE TABLE IF NOT EXISTS catalogo (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                categoria TEXT NOT NULL,
                nombre TEXT NOT NULL,
                precio REAL NOT NULL,
                descripcion TEXT,
                emoji TEXT DEFAULT '🎂',
                activo INTEGER DEFAULT 1
            );
        `);

        this.db.run(`
            CREATE TABLE IF NOT EXISTS configuracion (
                clave TEXT PRIMARY KEY,
                valor TEXT NOT NULL
            );
        `);
    },

    seedData() {
        // === CLIENTES ===
        const clientes = [
            ["María García López", "1234567-8", "5551234001", "maria.garcia@email.com", "Zona 10, Ciudad de Guatemala", "Cliente frecuente, prefiere chocolate"],
            ["Carlos Hernández", "2345678-9", "5551234002", "carlos.h@email.com", "Zona 14, Ciudad de Guatemala", ""],
            ["Ana Sofía López", "3456789-0", "5551234003", "ana.lopez@email.com", "Mixco, Guatemala", "Alérgica a nueces"],
            ["Roberto Martínez", "4567890-1", "5551234004", "rob.martinez@email.com", "Zona 15, Ciudad de Guatemala", ""],
            ["Valentina Castillo", "5678901-2", "5551234005", "vale.castillo@email.com", "Antigua Guatemala", "Prefiere diseños temáticos"],
            ["Diego Morales Pérez", "6789012-3", "5551234006", "diego.m@email.com", "Zona 1, Ciudad de Guatemala", ""],
            ["Luisa Fernanda Ramírez", "7890123-4", "5551234007", "luisa.r@email.com", "Zona 7, Ciudad de Guatemala", "Corporativa - Empresa ABC"],
            ["Fernando Pérez", "8901234-5", "5551234008", "fernando.p@email.com", "Villa Nueva, Guatemala", ""]
        ];
        clientes.forEach(c => {
            this.db.run(
                "INSERT INTO clientes (nombre, dni, whatsapp, email, direccion, notas) VALUES (?,?,?,?,?,?)", c
            );
        });

        // === USUARIOS ===
        const usuarios = [
            ["Administrador General", "admin", "admin123", "admin"],
            ["Ana Martínez", "vendedor", "vend123", "vendedor"],
            ["Carlos Decorador", "carlos", "dec123", "decorador"],
            ["Luis Pastelero", "luis", "pas123", "pastelero"]
        ];
        usuarios.forEach(u => {
            this.db.run(
                "INSERT INTO usuarios (nombre, usuario, password, rol) VALUES (?,?,?,?)", u
            );
        });

        // === COTIZACIONES ===
        const cotizaciones = [
            ["COT-001", 1, "María García López", 10, 120, "Vainilla", 0, "Básico", 0, 
             JSON.stringify([{nombre:"Hoja de arroz impresa",precio:35},{nombre:"Perlas",precio:10},{nombre:"Figura fondant pequeña",precio:30},{nombre:"Nombre personalizado",precio:10}]),
             "Pastel para cumpleaños de Sofía, 5 años", 205, "aceptada", "2026-04-20 10:30:00"],
            ["COT-002", 2, "Carlos Hernández", 20, 180, "Chocolate", 0, "Personalizado", 30,
             JSON.stringify([{nombre:"Topper acrílico",precio:15},{nombre:"Velas especiales",precio:10}]),
             "Aniversario de bodas", 235, "pendiente", "2026-04-22 14:15:00"],
            ["COT-003", 3, "Ana Sofía López", 15, 150, "Red Velvet", 20, "Temático", 50,
             JSON.stringify([{nombre:"Flores de crema",precio:15},{nombre:"Figura fondant mediana",precio:50},{nombre:"Nombre personalizado",precio:10}]),
             "Baby shower, tema: unicornios", 295, "enviada", "2026-04-23 09:00:00"],
            ["COT-004", 5, "Valentina Castillo", 30, 230, "Tres leches", 20, "Temático", 50,
             JSON.stringify([{nombre:"Hoja de arroz impresa",precio:35},{nombre:"Figura fondant grande",precio:80},{nombre:"Perlas",precio:10},{nombre:"Entrega urgente",precio:30}]),
             "Fiesta de XV años, tema: Cenicienta", 455, "aceptada", "2026-04-18 11:00:00"],
            ["COT-005", 4, "Roberto Martínez", 10, 120, "Marmoleado", 0, "Básico", 0,
             JSON.stringify([{nombre:"Chispas de colores",precio:10},{nombre:"Número",precio:15}]),
             "", 145, "rechazada", "2026-04-15 16:30:00"],
            ["COT-006", 6, "Diego Morales Pérez", 50, 320, "Chocolate", 0, "Personalizado", 30,
             JSON.stringify([{nombre:"Hoja de arroz impresa",precio:35},{nombre:"Perlas",precio:10},{nombre:"Flores de crema",precio:15},{nombre:"Figura fondant mediana",precio:50},{nombre:"Nombre personalizado",precio:10}]),
             "Graduación universitaria USAC", 470, "aceptada", "2026-04-19 08:00:00"],
            ["COT-007", 7, "Luisa Fernanda Ramírez", 20, 180, "Vainilla", 0, "Personalizado", 30,
             JSON.stringify([{nombre:"Topper acrílico",precio:15},{nombre:"Nombre personalizado",precio:10}]),
             "Evento corporativo Empresa ABC", 235, "enviada", "2026-04-24 10:00:00"],
            ["COT-008", 1, "María García López", 15, 150, "Chocolate", 0, "Temático", 50,
             JSON.stringify([{nombre:"Figura fondant pequeña",precio:30},{nombre:"Nombre personalizado",precio:10},{nombre:"Velas especiales",precio:10}]),
             "Cumpleaños de Daniela", 250, "pendiente", "2026-04-25 15:00:00"],
            ["COT-009", 8, "Fernando Pérez", 10, 120, "Vainilla", 0, "Básico", 0,
             JSON.stringify([]), "", 120, "pendiente", "2026-04-25 17:30:00"],
            ["COT-010", 3, "Ana Sofía López", 20, 180, "Tres leches", 20, "Personalizado", 30,
             JSON.stringify([{nombre:"Perlas",precio:10},{nombre:"Flores de crema",precio:15}]),
             "Cumpleaños de mamá", 255, "aceptada", "2026-04-16 09:30:00"],
            ["COT-011", 5, "Valentina Castillo", 15, 150, "Marmoleado", 0, "Básico", 0,
             JSON.stringify([{nombre:"Chispas de colores",precio:10}]),
             "Pedido pequeño para reunión", 160, "aceptada", "2026-04-21 13:00:00"],
            ["COT-012", 2, "Carlos Hernández", 30, 230, "Red Velvet", 20, "Temático", 50,
             JSON.stringify([{nombre:"Hoja de arroz impresa",precio:35},{nombre:"Figura fondant grande",precio:80},{nombre:"Entrega urgente",precio:30}]),
             "Fiesta sorpresa para esposa", 445, "pendiente", "2026-04-26 10:00:00"]
        ];
        cotizaciones.forEach(c => {
            this.db.run(
                `INSERT INTO cotizaciones (numero, cliente_id, cliente_nombre, tamano, precio_tamano, sabor, precio_sabor, diseno, precio_diseno, extras, observaciones, total, estado, created_at) 
                 VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?)`, c
            );
        });

        // === PEDIDOS ===
        const pedidos = [
            ["PED-001", 1, 1, "María García López", "Pastel Vainilla 10 porc. - Básico - Cumpleaños Sofía", "2026-04-28", "14:00", "en_preparacion", 205, "Decorar con tema princesas", "2026-04-20 11:00:00"],
            ["PED-002", 4, 5, "Valentina Castillo", "Pastel Tres Leches 30 porc. - Temático Cenicienta - XV años", "2026-04-27", "10:00", "en_preparacion", 455, "Incluye castillo de fondant", "2026-04-18 12:00:00"],
            ["PED-003", 6, 6, "Diego Morales Pérez", "Pastel Chocolate 50 porc. - Personalizado - Graduación USAC", "2026-04-29", "16:00", "en_preparacion", 470, "Logo USAC en hoja de arroz", "2026-04-19 09:00:00"],
            ["PED-004", 10, 3, "Ana Sofía López", "Pastel Tres Leches 20 porc. - Personalizado - Cumpleaños mamá", "2026-04-26", "12:00", "listo", 255, "", "2026-04-16 10:00:00"],
            ["PED-005", 11, 5, "Valentina Castillo", "Pastel Marmoleado 15 porc. - Básico - Reunión", "2026-04-26", "09:00", "entregado", 160, "Entregado en Antigua", "2026-04-21 14:00:00"],
            ["PED-006", null, 7, "Luisa Fernanda Ramírez", "Pastel Vainilla 20 porc. - Personalizado - Evento corporativo", "2026-04-30", "08:00", "en_preparacion", 235, "Necesita factura", "2026-04-24 11:00:00"]
        ];
        pedidos.forEach(p => {
            this.db.run(
                `INSERT INTO pedidos (numero, cotizacion_id, cliente_id, cliente_nombre, descripcion, fecha_entrega, hora_entrega, estado, total, notas, created_at)
                 VALUES (?,?,?,?,?,?,?,?,?,?,?)`, p
            );
        });

        // === CATÁLOGO ===
        const catalogo = [
            ["tamano", "10 porciones", 120, "Pastel para 10 personas", "🎂", 1],
            ["tamano", "15 porciones", 150, "Pastel para 15 personas", "🎂", 1],
            ["tamano", "20 porciones", 180, "Pastel para 20 personas", "🎂", 1],
            ["tamano", "30 porciones", 230, "Pastel para 30 personas", "🎂", 1],
            ["tamano", "50 porciones", 320, "Pastel para 50 personas", "🎂", 1],
            ["sabor", "Vainilla", 0, "Sabor clásico de vainilla", "🍦", 1],
            ["sabor", "Chocolate", 0, "Rico chocolate belga", "🍫", 1],
            ["sabor", "Marmoleado", 0, "Mezcla de vainilla y chocolate", "🍰", 1],
            ["sabor", "Tres leches", 20, "Suave pastel de tres leches", "🥛", 1],
            ["sabor", "Red Velvet", 20, "Elegante red velvet con frosting", "🔴", 1],
            ["diseno", "Básico", 0, "Decoración básica incluida", "⭐", 1],
            ["diseno", "Personalizado", 30, "Diseño personalizado a tu gusto", "🎨", 1],
            ["diseno", "Temático", 50, "Diseño con temática especial", "🎭", 1],
            ["decoracion", "Hoja de arroz impresa", 35, "Imagen comestible impresa", "🖼️", 1],
            ["decoracion", "Perlas", 10, "Perlas de azúcar decorativas", "✨", 1],
            ["decoracion", "Flores de crema", 15, "Flores de crema batida", "🌸", 1],
            ["decoracion", "Topper acrílico", 15, "Topper personalizado en acrílico", "🏷️", 1],
            ["decoracion", "Chispas de colores", 10, "Chispas de azúcar multicolor", "🌈", 1],
            ["fondant", "Pequeña (1 figura)", 30, "Figura de fondant pequeña", "🧁", 1],
            ["fondant", "Mediana (1 figura)", 50, "Figura de fondant mediana", "🎀", 1],
            ["fondant", "Grande (1 figura)", 80, "Figura de fondant grande detallada", "👑", 1],
            ["fondant", "Figura adicional", 30, "Cada figura adicional", "➕", 1],
            ["extras", "Nombre personalizado", 10, "Nombre del homenajeado en el pastel", "📝", 1],
            ["extras", "Número", 15, "Número decorativo de edad", "🔢", 1],
            ["extras", "Velas especiales", 10, "Juego de velas especiales", "🕯️", 1],
            ["extras", "Entrega urgente", 30, "Entrega en menos de 24 horas", "🚀", 1]
        ];
        catalogo.forEach(c => {
            this.db.run(
                "INSERT INTO catalogo (categoria, nombre, precio, descripcion, emoji, activo) VALUES (?,?,?,?,?,?)", c
            );
        });

        // === CONFIGURACIÓN ===
        const config = [
            ["negocio_nombre", "Milena's"],
            ["negocio_subtitulo", "Pastelería"],
            ["negocio_whatsapp", "50212345678"],
            ["negocio_email", "info@dulcearte.com"],
            ["negocio_direccion", "Zona 10, Ciudad de Guatemala"],
            ["moneda_simbolo", "Q."],
            ["moneda_nombre", "Quetzales"],
            ["whatsapp_mensaje", "¡Hola! Te envío la cotización de tu pastel de Milena's Pastelería:"]
        ];
        config.forEach(c => {
            this.db.run(
                "INSERT INTO configuracion (clave, valor) VALUES (?,?)", c
            );
        });
    },

    // Helper: Get config value
    getConfig(key) {
        const row = this.getOne("SELECT valor FROM configuracion WHERE clave = ?", [key]);
        return row ? row.valor : null;
    },

    // Helper: Set config value
    setConfig(key, value) {
        this.run("INSERT OR REPLACE INTO configuracion (clave, valor) VALUES (?,?)", [key, value]);
    },

    // Helper: Next order/quote number
    nextNumber(prefix) {
        const row = this.getOne(`SELECT MAX(CAST(SUBSTR(numero, ${prefix.length + 2}) AS INTEGER)) as max_num FROM ${prefix === 'COT' ? 'cotizaciones' : 'pedidos'}`);
        const next = (row && row.max_num ? row.max_num : 0) + 1;
        return `${prefix}-${String(next).padStart(3, '0')}`;
    },

    // Reset database
    reset() {
        localStorage.removeItem('milenas_v3_db');
        location.reload();
    }
};
