/* =============================================
   PAGE: Nueva Cotización
   ============================================= */
window.Pages = window.Pages || {};

Pages.nuevaCotizacion = {
    state: {
        tamano: 10,
        precioTamano: 120,
        sabor: 'Vainilla',
        precioSabor: 0,
        diseno: 'Básico',
        precioDiseno: 0,
        extras: [],
        observaciones: '',
        clienteNombre: '',
        clienteDni: '',
        clienteWhatsapp: ''
    },

    render() {
        const s = this.state;
        return `
        <div class="cotizacion-layout">
            <!-- LEFT: Form -->
            <div class="cotizacion-form">
                <!-- 1. Tamaño -->
                <div class="card">
                    <div class="card-body">
                        <div class="section-title">
                            <span class="section-number">1</span> Tamaño (porciones)
                        </div>
                        <div class="size-options">
                            ${this.renderSizeCards()}
                        </div>
                    </div>
                </div>

                <!-- 2. Sabor -->
                <div class="card">
                    <div class="card-body">
                        <div class="section-title">
                            <span class="section-number">2</span> Sabor
                        </div>
                        <div class="flavor-options">
                            ${this.renderFlavorBtns()}
                        </div>
                    </div>
                </div>

                <!-- 3. Diseño -->
                <div class="card">
                    <div class="card-body">
                        <div class="section-title">
                            <span class="section-number">3</span> Diseño
                        </div>
                        <div class="design-options">
                            ${this.renderDesignCards()}
                        </div>
                    </div>
                </div>

                <!-- 4. Extras -->
                <div class="card">
                    <div class="card-body">
                        <div class="section-title">
                            <span class="section-number">4</span> Extras y decoraciones
                        </div>
                        <div class="extras-grid">
                            <div class="extras-column">
                                <h4>Decoración</h4>
                                ${this.renderExtras('decoracion')}
                            </div>
                            <div class="extras-column">
                                <h4>Figuras fondant</h4>
                                ${this.renderExtras('fondant')}
                            </div>
                            <div class="extras-column">
                                <h4>Otros extras</h4>
                                ${this.renderExtras('extras')}
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Observaciones -->
                <div class="card">
                    <div class="card-body observations-section">
                        <div class="section-title" style="color:var(--text-dark);">
                            Observaciones adicionales (opcional)
                        </div>
                        <textarea id="cot-observaciones" class="form-textarea" 
                            placeholder="Escribe aquí alguna indicación especial del cliente...">${s.observaciones}</textarea>
                    </div>
                </div>

                <p class="text-center text-muted" style="font-size:.8rem; padding:.5rem; background:var(--warning-light); border-radius:var(--radius-sm);">
                    La cotización quedará registrada y podrás darle seguimiento desde el módulo de cotizaciones.
                </p>
            </div>

            <!-- RIGHT: Summary Panel -->
            <div class="summary-panel">
                <div class="summary-header">
                    <h3>Resumen de cotización</h3>
                    <img src="assets/cake-summary.png" alt="Pastel" class="summary-cake-img" 
                         onerror="this.style.display='none'">
                </div>
                <div class="summary-body" id="summary-body">
                    ${this.renderSummary()}
                </div>
                <div class="summary-actions">
                    <button class="btn btn-primary btn-block" id="btn-guardar-cot">
                        <i data-lucide="save"></i> Guardar cotización
                    </button>
                    <button class="btn btn-success btn-block" id="btn-whatsapp">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.025.504 3.935 1.393 5.608L0 24l6.564-1.376A11.933 11.933 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-1.82 0-3.56-.474-5.1-1.37l-.36-.22-3.896.817.854-3.789-.237-.374A9.93 9.93 0 012 12c0-5.514 4.486-10 10-10s10 4.486 10 10-4.486 10-10 10z"/></svg>
                        Enviar por WhatsApp
                    </button>
                    <button class="btn btn-purple btn-block" id="btn-convertir-pedido">
                        <i data-lucide="shopping-bag"></i> Convertir en pedido
                    </button>
                    <button class="btn btn-outline btn-block" id="btn-cancelar-cot">
                        ✕ Cancelar
                    </button>
                </div>
            </div>
        </div>`;
    },

    renderSizeCards() {
        const items = DB.getAll("SELECT * FROM catalogo WHERE categoria='tamano' AND activo=1 ORDER BY precio ASC");
        if(items.length === 0) return '<p class="text-muted">No hay tamaños configurados.</p>';
        
        return items.map(s => {
            const sizeNum = parseInt(s.nombre);
            const isSelected = this.state.tamano === sizeNum;
            // if first render and no state, maybe we should select the first one in init(), but let's just match
            return `
            <div class="size-card ${isSelected ? 'selected' : ''}" 
                 data-size="${sizeNum}" data-price="${s.precio}">
                <div class="size-cake" style="font-size:${1.5 + (sizeNum/50)*1.2}rem">${s.emoji || '🎂'}</div>
                <div class="size-portions">${sizeNum}</div>
                <div class="size-label">porciones</div>
                <div class="size-price">Q.${s.precio.toFixed(2)}</div>
            </div>
            `;
        }).join('');
    },

    renderFlavorBtns() {
        const items = DB.getAll("SELECT * FROM catalogo WHERE categoria='sabor' AND activo=1 ORDER BY precio ASC");
        if(items.length === 0) return '<p class="text-muted">No hay sabores configurados.</p>';

        return items.map(f => `
            <button class="flavor-btn ${this.state.sabor === f.nombre ? 'selected' : ''}"
                    data-flavor="${f.nombre}" data-price="${f.precio}">
                ${f.nombre}
                ${f.precio > 0 ? `<span class="extra-price">+ Q.${f.precio.toFixed(2)}</span>` : ''}
            </button>
        `).join('');
    },

    renderDesignCards() {
        const items = DB.getAll("SELECT * FROM catalogo WHERE categoria='diseno' AND activo=1 ORDER BY precio ASC");
        if(items.length === 0) return '<p class="text-muted">No hay diseños configurados.</p>';

        return items.map(d => {
            const label = d.precio === 0 ? 'Incluido' : `+ Q.${d.precio.toFixed(2)}`;
            return `
            <div class="design-card ${this.state.diseno === d.nombre ? 'selected' : ''}"
                 data-design="${d.nombre}" data-price="${d.precio}">
                <div class="design-name">${d.nombre}</div>
                <div class="design-price">${label}</div>
            </div>
            `;
        }).join('');
    },

    renderExtras(category) {
        const items = DB.getAll(
            "SELECT * FROM catalogo WHERE categoria = ? AND activo = 1", [category]
        );
        return items.map(item => {
            const isChecked = this.state.extras.some(e => e.nombre === item.nombre);
            return `
                <label class="checkbox-item">
                    <input type="checkbox" ${isChecked ? 'checked' : ''}
                           data-extra-name="${item.nombre}" data-extra-price="${item.precio}">
                    <span class="checkbox-mark"></span>
                    <span class="checkbox-label">${item.nombre}</span>
                    <span class="checkbox-price">+ Q.${Number(item.precio).toFixed(2)}</span>
                </label>
            `;
        }).join('');
    },

    renderSummary() {
        const s = this.state;
        const total = this.calcTotal();
        const extrasHTML = s.extras.length > 0 ? `
            <div class="summary-extras">
                <div class="extras-title">Extras:</div>
                <ul>
                    ${s.extras.map(e => `<li><span>${e.nombre}</span><span>Q.${Number(e.precio).toFixed(2)}</span></li>`).join('')}
                </ul>
            </div>
        ` : '';
        
        return `
            <div class="summary-line">
                <span class="label">Tamaño:</span>
                <span class="value">${s.tamano} porciones</span>
            </div>
            <div class="summary-line">
                <span class="label"></span>
                <span class="value">Q.${s.precioTamano.toFixed(2)}</span>
            </div>
            <div class="summary-line">
                <span class="label">Sabor:</span>
                <span class="value">${s.sabor}</span>
            </div>
            <div class="summary-line">
                <span class="label"></span>
                <span class="value">Q.${s.precioSabor.toFixed(2)}</span>
            </div>
            <div class="summary-line">
                <span class="label">Diseño:</span>
                <span class="value">${s.diseno}</span>
            </div>
            <div class="summary-line">
                <span class="label"></span>
                <span class="value">Q.${s.precioDiseno.toFixed(2)}</span>
            </div>
            ${extrasHTML}
            <div class="summary-total">
                <span class="label">Total</span>
                <span class="value">Q.${total.toFixed(2)}</span>
            </div>
            <div class="summary-divider"></div>
            <div class="summary-client">
                <h4>Datos del cliente (opcional)</h4>
                <div class="client-input-group">
                    <span class="input-icon">🆔</span>
                    <input type="text" id="cot-cliente-dni" placeholder="DNI / Identificación" value="${s.clienteDni}">
                </div>
                <div class="client-input-group">
                    <span class="input-icon">👤</span>
                    <input type="text" id="cot-cliente-nombre" placeholder="Nombre" value="${s.clienteNombre}">
                </div>
                <div class="client-input-group">
                    <span class="input-icon">📱</span>
                    <input type="text" id="cot-cliente-whatsapp" placeholder="WhatsApp" value="${s.clienteWhatsapp}">
                </div>
                <p id="cot-cliente-found" style="font-size:.78rem; color:var(--success); display:none; margin-top:.3rem;"></p>
            </div>
        `;
    },

    calcTotal() {
        const s = this.state;
        let total = s.precioTamano + s.precioSabor + s.precioDiseno;
        s.extras.forEach(e => total += e.precio);
        return total;
    },

    updateSummary() {
        const body = document.getElementById('summary-body');
        if (body) body.innerHTML = this.renderSummary();
        
        // Re-bind client inputs
        this.bindClientInputs();
    },

    bindClientInputs() {
        const dniInput = document.getElementById('cot-cliente-dni');
        const nameInput = document.getElementById('cot-cliente-nombre');
        const wpInput = document.getElementById('cot-cliente-whatsapp');
        if (dniInput) {
            dniInput.addEventListener('input', (e) => {
                this.state.clienteDni = e.target.value;
            });
            dniInput.addEventListener('blur', () => {
                const dni = this.state.clienteDni.trim();
                if (!dni) return;
                const found = DB.getOne("SELECT * FROM clientes WHERE dni = ?", [dni]);
                const msg = document.getElementById('cot-cliente-found');
                if (found) {
                    this.state.clienteNombre = found.nombre;
                    this.state.clienteWhatsapp = found.whatsapp || '';
                    if (nameInput) nameInput.value = found.nombre;
                    if (wpInput) wpInput.value = found.whatsapp || '';
                    if (msg) { msg.textContent = `✅ Cliente encontrado: ${found.nombre}`; msg.style.display = 'block'; }
                } else {
                    if (msg) { msg.textContent = ''; msg.style.display = 'none'; }
                }
            });
        }
        if (nameInput) {
            nameInput.addEventListener('input', (e) => { this.state.clienteNombre = e.target.value; });
        }
        if (wpInput) {
            wpInput.addEventListener('input', (e) => { this.state.clienteWhatsapp = e.target.value; });
        }
    },

    init() {
        // Reset state
        // Set initial state safely by fetching first items
        const firstSize = DB.getOne("SELECT * FROM catalogo WHERE categoria='tamano' AND activo=1 ORDER BY precio ASC");
        const firstFlavor = DB.getOne("SELECT * FROM catalogo WHERE categoria='sabor' AND activo=1 ORDER BY precio ASC");
        const firstDesign = DB.getOne("SELECT * FROM catalogo WHERE categoria='diseno' AND activo=1 ORDER BY precio ASC");

        this.state = {
            tamano: firstSize ? parseInt(firstSize.nombre) : 10,
            precioTamano: firstSize ? firstSize.precio : 120,
            sabor: firstFlavor ? firstFlavor.nombre : 'Vainilla',
            precioSabor: firstFlavor ? firstFlavor.precio : 0,
            diseno: firstDesign ? firstDesign.nombre : 'Básico',
            precioDiseno: firstDesign ? firstDesign.precio : 0,
            extras: [], observaciones: '',
            clienteNombre: '', clienteDni: '', clienteWhatsapp: ''
        };

        // Size cards
        document.querySelectorAll('.size-card').forEach(card => {
            card.addEventListener('click', () => {
                this.state.tamano = parseInt(card.dataset.size);
                this.state.precioTamano = parseFloat(card.dataset.price);
                document.querySelectorAll('.size-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.updateSummary();
            });
        });

        // Flavor buttons
        document.querySelectorAll('.flavor-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                this.state.sabor = btn.dataset.flavor;
                this.state.precioSabor = parseFloat(btn.dataset.price);
                document.querySelectorAll('.flavor-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                this.updateSummary();
            });
        });

        // Design cards
        document.querySelectorAll('.design-card').forEach(card => {
            card.addEventListener('click', () => {
                this.state.diseno = card.dataset.design;
                this.state.precioDiseno = parseFloat(card.dataset.price);
                document.querySelectorAll('.design-card').forEach(c => c.classList.remove('selected'));
                card.classList.add('selected');
                this.updateSummary();
            });
        });

        // Extras checkboxes
        document.querySelectorAll('input[data-extra-name]').forEach(cb => {
            cb.addEventListener('change', () => {
                const name = cb.dataset.extraName;
                const price = parseFloat(cb.dataset.extraPrice);
                if (cb.checked) {
                    this.state.extras.push({ nombre: name, precio: price });
                } else {
                    this.state.extras = this.state.extras.filter(e => e.nombre !== name);
                }
                this.updateSummary();
            });
        });

        // Observations
        const obs = document.getElementById('cot-observaciones');
        if (obs) obs.addEventListener('input', (e) => { this.state.observaciones = e.target.value; });

        // Client inputs
        this.bindClientInputs();

        // Guardar cotización
        document.getElementById('btn-guardar-cot').addEventListener('click', () => this.guardarCotizacion());

        // WhatsApp
        document.getElementById('btn-whatsapp').addEventListener('click', () => this.enviarWhatsApp());

        // Convertir en pedido
        document.getElementById('btn-convertir-pedido').addEventListener('click', () => this.convertirPedido());

        // Cancelar
        document.getElementById('btn-cancelar-cot').addEventListener('click', () => this.resetForm());
    },

    guardarCotizacion() {
        const s = this.state;
        const total = this.calcTotal();
        
        const count = DB.getOne("SELECT COUNT(*) as c FROM cotizaciones").c + 1;
        const cNameSafe = (s.clienteNombre || 'anonimo').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').substring(0, 15);
        const numero = `COT-${String(count).padStart(3, '0')}-${cNameSafe}`;
        
        // Find or create client
        let clienteId = null;
        if (s.clienteDni) {
            const existing = DB.getOne("SELECT id FROM clientes WHERE dni = ?", [s.clienteDni]);
            if (existing) {
                clienteId = existing.id;
            } else if (s.clienteNombre.trim()) {
                DB.run("INSERT INTO clientes (nombre, dni, whatsapp) VALUES (?,?,?)", 
                    [s.clienteNombre, s.clienteDni, s.clienteWhatsapp]);
                clienteId = DB.getOne("SELECT last_insert_rowid() as id").id;
            }
        } else if (s.clienteNombre) {
            const existing = DB.getOne("SELECT id FROM clientes WHERE nombre = ?", [s.clienteNombre]);
            if (existing) {
                clienteId = existing.id;
            } else if (s.clienteNombre.trim()) {
                DB.run("INSERT INTO clientes (nombre, whatsapp) VALUES (?,?)", 
                    [s.clienteNombre, s.clienteWhatsapp]);
                clienteId = DB.getOne("SELECT last_insert_rowid() as id").id;
            }
        }

        DB.run(
            `INSERT INTO cotizaciones (numero, cliente_id, cliente_nombre, tamano, precio_tamano, sabor, precio_sabor, diseno, precio_diseno, extras, observaciones, total, estado)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [numero, clienteId, s.clienteNombre || 'Sin nombre', s.tamano, s.precioTamano,
             s.sabor, s.precioSabor, s.diseno, s.precioDiseno,
             JSON.stringify(s.extras), s.observaciones, total, 'pendiente']
        );

        App.showToast(`Cotización ${numero} guardada exitosamente`, 'success');
        this.resetForm();
    },

    enviarWhatsApp() {
        const s = this.state;
        const total = this.calcTotal();
        const config = DB.getConfig('whatsapp_mensaje') || "¡Hola! Tu cotización de Milena's:";
        
        let msg = `${config}\n\n`;
        msg += `🎂 *Cotización Milena's Pastelería*\n\n`;
        msg += `📐 Tamaño: ${s.tamano} porciones - Q.${s.precioTamano.toFixed(2)}\n`;
        msg += `🍰 Sabor: ${s.sabor}`;
        if (s.precioSabor > 0) msg += ` - Q.${s.precioSabor.toFixed(2)}`;
        msg += `\n`;
        msg += `🎨 Diseño: ${s.diseno}`;
        if (s.precioDiseno > 0) msg += ` - Q.${s.precioDiseno.toFixed(2)}`;
        msg += `\n`;
        
        if (s.extras.length > 0) {
            msg += `\n✨ Extras:\n`;
            s.extras.forEach(e => { msg += `  • ${e.nombre} - Q.${e.precio.toFixed(2)}\n`; });
        }
        msg += `\n💰 *Total: Q.${total.toFixed(2)}*`;
        
        if (s.observaciones) msg += `\n\n📝 Nota: ${s.observaciones}`;

        const phone = s.clienteWhatsapp || '';
        const url = `https://wa.me/${phone}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
        
        // Also save the quotation
        this.guardarCotizacion();
    },

    convertirPedido() {
        const s = this.state;
        const total = this.calcTotal();
        
        const countCot = DB.getOne("SELECT COUNT(*) as c FROM cotizaciones").c + 1;
        const countPed = DB.getOne("SELECT COUNT(*) as c FROM pedidos").c + 1;
        const cNameSafe = (s.clienteNombre || 'anonimo').toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').substring(0, 15);
        
        const numeroCot = `COT-${String(countCot).padStart(3, '0')}-${cNameSafe}`;
        const numeroPed = `PED-${String(countPed).padStart(3, '0')}-${cNameSafe}`;
        
        // Manejar cliente igual que en guardar
        let clienteId = null;
        if (s.clienteDni) {
            const exists = DB.getOne("SELECT id FROM clientes WHERE dni = ?", [s.clienteDni]);
            if (exists) {
                clienteId = exists.id;
            } else if (s.clienteNombre.trim()) {
                DB.run("INSERT INTO clientes (nombre, dni, whatsapp) VALUES (?,?,?)", [s.clienteNombre, s.clienteDni, s.clienteWhatsapp]);
                clienteId = DB.getOne("SELECT last_insert_rowid() as id").id;
            }
        } else if (s.clienteNombre && s.clienteWhatsapp) {
            const exists = DB.getOne("SELECT id FROM clientes WHERE whatsapp = ?", [s.clienteWhatsapp]);
            if (exists) {
                clienteId = exists.id;
            } else {
                DB.run("INSERT INTO clientes (nombre, whatsapp) VALUES (?,?)", [s.clienteNombre, s.clienteWhatsapp]);
                clienteId = DB.getOne("SELECT last_insert_rowid() as id").id;
            }
        }

        // Insertar la cotización como aceptada
        DB.run(
            `INSERT INTO cotizaciones (numero, cliente_id, cliente_nombre, tamano, precio_tamano, sabor, precio_sabor, diseno, precio_diseno, extras, observaciones, total, estado)
             VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)`,
            [numeroCot, clienteId, s.clienteNombre || 'Sin nombre', s.tamano, s.precioTamano,
             s.sabor, s.precioSabor, s.diseno, s.precioDiseno,
             JSON.stringify(s.extras), s.observaciones, total, 'aceptada']
        );

        // Obtener el ID de la cotización recién creada
        const cot = DB.getOne("SELECT id FROM cotizaciones WHERE numero = ?", [numeroCot]);

        // Insertar el pedido en preparación
        const desc = `Pastel ${s.sabor} ${s.tamano} porc. - ${s.diseno}`;
        // Como no pedimos fecha en la cotización, ponemos la de hoy + 2 días como placeholder
        const fecha = new Date();
        fecha.setDate(fecha.getDate() + 2);
        const fechaStr = fecha.toISOString().split('T')[0];

        DB.run(
            `INSERT INTO pedidos (numero, cotizacion_id, cliente_id, cliente_nombre, descripcion, fecha_entrega, hora_entrega, estado, total, notas)
             VALUES (?,?,?,?,?,?,?,?,?,?)`,
            [numeroPed, cot ? cot.id : null, clienteId, s.clienteNombre || 'Sin nombre', desc, fechaStr, '12:00', 'en_preparacion', total, s.observaciones]
        );

        App.showToast('Cotización guardada y pedido creado en Preparación', 'success');
        
        // Navigate to pedidos
        setTimeout(() => { window.location.hash = 'pedidos'; }, 500);
    },

    resetForm() {
        const firstSize = DB.getOne("SELECT * FROM catalogo WHERE categoria='tamano' AND activo=1 ORDER BY precio ASC");
        const firstFlavor = DB.getOne("SELECT * FROM catalogo WHERE categoria='sabor' AND activo=1 ORDER BY precio ASC");
        const firstDesign = DB.getOne("SELECT * FROM catalogo WHERE categoria='diseno' AND activo=1 ORDER BY precio ASC");

        this.state = {
            tamano: firstSize ? parseInt(firstSize.nombre) : 10,
            precioTamano: firstSize ? firstSize.precio : 120,
            sabor: firstFlavor ? firstFlavor.nombre : 'Vainilla',
            precioSabor: firstFlavor ? firstFlavor.precio : 0,
            diseno: firstDesign ? firstDesign.nombre : 'Básico',
            precioDiseno: firstDesign ? firstDesign.precio : 0,
            extras: [], observaciones: '',
            clienteNombre: '', clienteDni: '', clienteWhatsapp: ''
        };
        // Re-render
        App.navigateTo('nueva-cotizacion');
    }
};
