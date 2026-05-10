/* =============================================
   PAGE: Configuración
   ============================================= */
window.Pages = window.Pages || {};

Pages.configuracion = {
    render() {
        const cfg = (k) => DB.getConfig(k) || '';
        return `
        <div class="config-layout">
            <nav class="config-nav">
                <div class="config-nav-item active" data-section="negocio"><i data-lucide="building"></i> Negocio</div>
                <div class="config-nav-item" data-section="precios"><i data-lucide="tag"></i> Precios</div>
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
                        <div class="form-group"><label class="form-label">Email</label><input type="email" id="cfg-email" class="form-input" value="${cfg('negocio_email')}"></div>
                        <div class="form-group"><label class="form-label">WhatsApp del negocio</label><input type="text" id="cfg-whatsapp" class="form-input" value="${cfg('negocio_whatsapp')}"></div>
                    </div>
                    <div class="form-group"><label class="form-label">Dirección</label><input type="text" id="cfg-direccion" class="form-input" value="${cfg('negocio_direccion')}"></div>
                    <button class="btn btn-primary mt-1" id="btn-save-negocio"><i data-lucide="save"></i> Guardar cambios</button>
                </div>

                <!-- Precios -->
                <div class="config-section" id="sec-precios">
                    <h3><i data-lucide="tag"></i> Precios base</h3>
                    <h4 style="font-size:.9rem;margin:1rem 0 .5rem;">Tamaños</h4>
                    <table class="price-table" id="price-table-tamano">
                        <thead><tr><th>Producto</th><th>Precio (Q.)</th><th>Estado</th></tr></thead>
                        <tbody>${this.renderPriceRows('tamano')}</tbody>
                    </table>
                    <h4 style="font-size:.9rem;margin:1rem 0 .5rem;">Sabores</h4>
                    <table class="price-table" id="price-table-sabor">
                        <thead><tr><th>Producto</th><th>Precio extra (Q.)</th><th>Estado</th></tr></thead>
                        <tbody>${this.renderPriceRows('sabor')}</tbody>
                    </table>
                    <h4 style="font-size:.9rem;margin:1rem 0 .5rem;">Diseños</h4>
                    <table class="price-table" id="price-table-diseno">
                        <thead><tr><th>Producto</th><th>Precio extra (Q.)</th><th>Estado</th></tr></thead>
                        <tbody>${this.renderPriceRows('diseno')}</tbody>
                    </table>
                    <h4 style="font-size:.9rem;margin:1rem 0 .5rem;">Decoraciones y extras</h4>
                    <table class="price-table" id="price-table-extras">
                        <thead><tr><th>Producto</th><th>Precio (Q.)</th><th>Estado</th></tr></thead>
                        <tbody>${this.renderPriceRows('decoracion')}${this.renderPriceRows('fondant')}${this.renderPriceRows('extras')}</tbody>
                    </table>
                    <button class="btn btn-primary mt-2" id="btn-save-precios"><i data-lucide="save"></i> Guardar precios</button>
                </div>

                <!-- WhatsApp -->
                <div class="config-section" id="sec-whatsapp">
                    <h3><i data-lucide="message-circle"></i> Mensaje de WhatsApp</h3>
                    <div class="form-group">
                        <label class="form-label">Mensaje de saludo para cotizaciones</label>
                        <textarea id="cfg-wa-msg" class="form-textarea" style="min-height:120px;">${cfg('whatsapp_mensaje')}</textarea>
                    </div>
                    <p class="text-muted" style="font-size:.8rem;margin-bottom:1rem;">Este mensaje se enviará como encabezado cuando compartas una cotización por WhatsApp.</p>
                    <button class="btn btn-primary" id="btn-save-wa"><i data-lucide="save"></i> Guardar mensaje</button>
                </div>

                <!-- Sistema -->
                <div class="config-section" id="sec-sistema">
                    <h3><i data-lucide="sliders"></i> Sistema</h3>
                    <div class="config-grid">
                        <div class="form-group"><label class="form-label">Símbolo de moneda</label><input type="text" id="cfg-moneda" class="form-input" value="${cfg('moneda_simbolo')}"></div>
                        <div class="form-group"><label class="form-label">Nombre de moneda</label><input type="text" id="cfg-moneda-nombre" class="form-input" value="${cfg('moneda_nombre')}"></div>
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

    renderPriceRows(cat) {
        const items = DB.getAll("SELECT * FROM catalogo WHERE categoria=? ORDER BY nombre",[cat]);
        return items.map(item=>`
            <tr>
                <td>${item.nombre}</td>
                <td><input type="number" step="0.01" value="${item.precio}" data-id="${item.id}" class="price-input"></td>
                <td><span class="status-badge ${item.activo?'status-activo':'status-inactivo'}">${item.activo?'Activo':'Inactivo'}</span></td>
            </tr>
        `).join('');
    },

    init() {
        // Nav items
        document.querySelectorAll('.config-nav-item').forEach(item=>{
            item.addEventListener('click',()=>{
                document.querySelectorAll('.config-nav-item').forEach(i=>i.classList.remove('active'));
                item.classList.add('active');
                const sec = item.dataset.section;
                document.querySelectorAll('.config-section').forEach(s=>{s.style.display='none';});
                document.getElementById('sec-'+sec).style.display='block';
            });
        });

        // Save negocio
        document.getElementById('btn-save-negocio').addEventListener('click',()=>{
            DB.setConfig('negocio_nombre', document.getElementById('cfg-nombre').value);
            DB.setConfig('negocio_subtitulo', document.getElementById('cfg-subtitulo').value);
            DB.setConfig('negocio_email', document.getElementById('cfg-email').value);
            DB.setConfig('negocio_whatsapp', document.getElementById('cfg-whatsapp').value);
            DB.setConfig('negocio_direccion', document.getElementById('cfg-direccion').value);
            App.showToast('Datos del negocio guardados','success');
        });

        // Save precios
        document.getElementById('btn-save-precios').addEventListener('click',()=>{
            document.querySelectorAll('.price-input').forEach(inp=>{
                const id=inp.dataset.id;
                const val=parseFloat(inp.value)||0;
                DB.run("UPDATE catalogo SET precio=? WHERE id=?",[val,id]);
            });
            App.showToast('Precios actualizados','success');
        });

        // Save WhatsApp
        document.getElementById('btn-save-wa').addEventListener('click',()=>{
            DB.setConfig('whatsapp_mensaje', document.getElementById('cfg-wa-msg').value);
            App.showToast('Mensaje de WhatsApp guardado','success');
        });

        // Save sistema
        document.getElementById('btn-save-sistema').addEventListener('click',()=>{
            DB.setConfig('moneda_simbolo', document.getElementById('cfg-moneda').value);
            DB.setConfig('moneda_nombre', document.getElementById('cfg-moneda-nombre').value);
            App.showToast('Configuración guardada','success');
        });

        // Reset DB
        document.getElementById('btn-reset-db').addEventListener('click',()=>{
            if(confirm('¿Estás segura? Se perderán todos los datos actuales.')){
                DB.reset();
            }
        });
    }
};
