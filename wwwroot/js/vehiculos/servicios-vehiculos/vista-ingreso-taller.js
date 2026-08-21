'use strict';

/* ─── Estado global ─────────────────────────────────────────────────────── */
let _vehiculos = [];         // Catálogo de vehículos asignados para select
let _vehiculosTodos = [];    // Catálogo completo de vehículos para historial
let _asignaciones = [];      // Asignaciones activas cargadas una vez
let _empleados = [];         // Catálogo de empleados asignados para select
let _empleadosTodos = [];    // Catálogo completo de empleados para historial
let _talleres = [];          // Catálogo completo de talleres
let _tiposServicio = [];     // Catálogo completo de tipos de servicio
let _formasPago = [];        // Catálogo completo de formas de pago
let _responsables = [];      // Catálogo de encargados autorizadores
let _refaccionesCatalogo = [];// Catálogo de refacciones
let _refaccionesAgregadas = [];// Refacciones agregadas al ticket actual
let _modoCompleto = false;   // true = switch ON (reporte de taller habilitado)
let _listaHistorial = [];    // Datos completos de la tabla de historial
let _filtroEstadoHistorial = 'todos'; // todos | incompletos | completos
let _busquedaHistorial = ''; // Término de búsqueda en tabla

/* ─── Init ─────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', () => {
    setFechaHoy();
    cargarCatalogos();
    cargarHistorial();
    bindSwitch();
    bindCostosChange();
    bindComprobanteUpload();
    bindFormSubmit();
    bindRefaccionesEvents();

    if (typeof setupStatusTabs === 'function') {
        setupStatusTabs('statusTabs', (filterValue) => {
            _filtroEstadoHistorial = filterValue;
            renderTablaHistorial();
        });
    } else {
        document.querySelectorAll('#statusTabs .status-tab').forEach(btn => {
            btn.addEventListener('click', () => {
                document.querySelectorAll('#statusTabs .status-tab').forEach(b => b.classList.remove('active'));
                btn.classList.add('active');
                _filtroEstadoHistorial = btn.getAttribute('data-status-filter') || btn.getAttribute('data-status') || 'todos';
                renderTablaHistorial();
            });
        });
    }

    document.getElementById('tableSearch')?.addEventListener('input', (e) => {
        _busquedaHistorial = e.target.value.trim().toLowerCase();
        renderTablaHistorial();
    });

    const moInput = document.getElementById('mant-mnyCostoManoObra');
    if (moInput) {
        moInput.addEventListener('input', () => formatCurrencyInput(moInput));
    }
    const refInput = document.getElementById('mant-mnyCostoRefacciones');
    if (refInput) {
        refInput.addEventListener('input', () => formatCurrencyInput(refInput));
    }
    const refPrecioInput = document.getElementById('mant-refaccionPrecio');
    if (refPrecioInput) {
        refPrecioInput.addEventListener('input', () => formatCurrencyInput(refPrecioInput));
    }
    const kmInput = document.getElementById('mant-decKilometrajeActual');
    if (kmInput) {
        kmInput.addEventListener('input', () => {
            kmInput.value = kmInput.value.replace(/[^0-9]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        });
    }
});

/* ─── Fecha por defecto = hoy ─────────────────────────────────────────── */
function setFechaHoy() {
    const hoy = new Date().toISOString().split('T')[0];
    const fechaInput = document.getElementById('mant-dteFechaServicio');
    if (fechaInput && !fechaInput.value) {
        fechaInput.value = hoy;
    }
}

/* ─── Switch toggle ───────────────────────────────────────────────────── */
function bindSwitch() {
    const switchEl = document.getElementById('switchServicioConcluido');
    if (!switchEl) return;
    switchEl.addEventListener('change', () => {
        _modoCompleto = switchEl.checked;
        switchEl.setAttribute('aria-checked', _modoCompleto.toString());
        toggleCard2(_modoCompleto);
    });
}

// Función para mostrar u ocultar la sección "Reporte de Taller" según el estado del switch
function toggleCard2(habilitar) {
    // Obtenemos el contenedor de la sección 2 (Reporte de Taller)
    const card2     = document.getElementById('card2');
    // Obtenemos la etiqueta de texto del switch (NO / SÍ)
    const label     = document.getElementById('switchLabel');
    // Obtenemos el texto del botón de guardado
    const btnLabel  = document.getElementById('btnGuardarLabel');
    // Obtenemos todos los elementos interactivos dentro de la sección 2
    const inputs2   = card2?.querySelectorAll('input:not([type=hidden]), select, textarea, button');
    const isEditing = parseInt(document.getElementById('mant-id')?.value || '0', 10) > 0;
    // Si el switch está activado en SÍ
    if (habilitar) {
        // Mostramos la sección 2 en la pantalla
        if (card2) card2.style.display = 'block';
        // Cambiamos el texto del switch a "SÍ"
        if (label) label.textContent = 'SÍ';
        // Actualizamos el texto del botón principal
        if (btnLabel) btnLabel.textContent = isEditing ? 'Actualizar reporte de taller' : 'Guardar reporte de taller';        // Habilitamos los campos internos para captura
        inputs2?.forEach(el => {
            el.disabled = false;
        });
        // Habilitamos la zona de carga de comprobante
        document.getElementById('mantComprobanteArea')?.classList.remove('mant-upload-area--disabled');
    } else {
        // Si el switch está en NO, ocultamos la sección 2 por completo
        if (card2) card2.style.display = 'none';
        // Cambiamos el texto del switch a "NO"
        if (label) label.textContent = 'NO';
        if (btnLabel) btnLabel.textContent = isEditing ? 'Actualizar ingreso a taller' : 'Guardar ingreso a taller';        inputs2?.forEach(el => el.disabled = true);
        // Deshabilitamos la zona de carga de comprobante
        document.getElementById('mantComprobanteArea')?.classList.add('mant-upload-area--disabled');
    }
}

/* ─── Cargar catálogos ────────────────────────────────────────────────── */
async function cargarCatalogos() {
    try {
        const [vehRes, resCatalogos, resResponsables, resAsignaciones, resEmpleados] = await Promise.all([
            obtenerVehiculosActivosDropdown(),
            fetch('/IngresoTaller/GetIngresoTallerCatalogos').then(r => r.json()).catch(() => ({ success: false })),
            fetch('/IngresoTaller/ResponsablesServicio/GetResponsables').then(r => r.json()).catch(() => ({ success: false })),
            fetch('/Asignaciones/GetAsignacionesActivas').then(r => r.json()).catch(() => ({ success: false })),
            fetch('/Empleado/GetEmpleadosDropdown').then(r => r.json()).catch(() => ({ success: false }))
        ]);

        // Asignaciones activas
        if (resAsignaciones.success) {
            _asignaciones = resAsignaciones.data || [];
        }

        const vehIdAsignados = new Set(
            (_asignaciones || [])
                .map(a => Number(a.idVehDatosGenerales ?? a.IdVehDatosGenerales))
                .filter(id => !isNaN(id) && id > 0)
        );

        const empIdAsignados = new Set(
            (_asignaciones || [])
                .map(a => Number(a.idEmpEmpleado ?? a.IdEmpEmpleado))
                .filter(id => !isNaN(id) && id > 0)
        );

        // Cargar vehículos activos
        if (vehRes && vehRes.success && vehRes.data) {
            _vehiculosTodos = vehRes.data.items || vehRes.data || [];
            _vehiculos = _vehiculosTodos;

            poblarSelect('mant-idVehDatosGenerales', _vehiculos, v => ({
                value: v.id ?? v.Id,
                text: `${v.strPlaca || v.StrPlaca || '—'} · ${v.strVehCatMarcaVehiculo || v.StrVehCatMarcaVehiculo || v.strMarca || v.StrMarca || ''} ${v.strModelo || v.StrModelo || ''} ${v.intAnio || v.IntAnio || ''}`.trim()
            }));
        }

        // Cargar solo choferes asignados (idéntico a vista-infracciones.js)
        if (resEmpleados.success && resEmpleados.data) {
            _empleadosTodos = resEmpleados.data || [];
            _empleados = _empleadosTodos.filter(e => empIdAsignados.has(Number(e.id ?? e.Id)));
            if (!_empleados.length) _empleados = _empleadosTodos;

            poblarSelect('mant-idEmpEmpleadoChofer', _empleados, e => ({
                value: e.id ?? e.Id,
                text: `${e.strNombre || e.StrNombre || ''} ${e.strApellidoPaterno || e.StrApellidoPaterno || ''} ${e.strApellidoMaterno || e.StrApellidoMaterno || ''}`.trim()
            }));
        }

        // Catálogos de Ingreso a Taller (Tipos de Servicio, Talleres, Formas de Pago y Refacciones)
        if (resCatalogos.success && resCatalogos.data) {
            if (resCatalogos.data.tiposServicio) {
                _tiposServicio = resCatalogos.data.tiposServicio;
                poblarSelect('mant-idVehCatTipoServicio', _tiposServicio, item => ({
                    value: item.id ?? item.Id,
                    text: item.strValor || item.StrValor || ''
                }));
            }
            if (resCatalogos.data.talleres) {
                _talleres = resCatalogos.data.talleres;
                poblarSelect('mant-idVehCatTaller', _talleres, item => ({
                    value: item.id ?? item.Id,
                    text: item.strValor || item.StrValor || ''
                }));
            }
            if (resCatalogos.data.formasPago) {
                _formasPago = resCatalogos.data.formasPago;
                poblarSelect('mant-idVehFormaPago', _formasPago, item => ({
                    value: item.id ?? item.Id,
                    text: item.strValor || item.StrValor || ''
                }));
            }
            if (resCatalogos.data.refacciones) {
                _refaccionesCatalogo = resCatalogos.data.refacciones;
                poblarSelectRefacciones();
            }
        }

        // Encargado Autorizador / Responsables de Servicio
        if (resResponsables && resResponsables.data) {
            _responsables = Array.isArray(resResponsables.data) ? resResponsables.data : (resResponsables.data.items || []);
            poblarSelect('mant-idVehCatResponsableServicio', _responsables, item => ({
                value: item.id ?? item.Id,
                text: item.strValor || item.StrValor || ''
            }));
        }

        // Los dropdowns son convertidos automáticamente por el componente global custom-select de CAVEX (site.js)
        bindVinculacionVehiculoEmpleado();
        renderTablaHistorial();

    } catch (err) {
        console.error('Error cargando catálogos:', err);
    }
}

/* ─── Manejo de Refacciones ────────────────────────────────────────────── */
function bindRefaccionesEvents() {
    const nombreInput = document.getElementById('mant-refaccionNombre');
    const precioInput = document.getElementById('mant-refaccionPrecio');
    const btnAdd = document.getElementById('btnAgregarRefaccion');

    setupCustomRefaccionesAutocomplete();

    // Agregar refacción al listado con el botón +
    btnAdd?.addEventListener('click', () => {
        const nombre = nombreInput?.value?.trim() || '';
        if (!nombre) {
            Swal.fire({ icon: 'warning', title: 'Refacción requerida', text: 'Escribe o selecciona el nombre de la refacción.', confirmButtonColor: '#0d233a' });
            return;
        }

        const rawPrecio = (precioInput?.value || '0').replace(/,/g, '');
        const precio = parseFloat(rawPrecio) || 0;
        if (precio <= 0) {
            Swal.fire({ icon: 'warning', title: 'Precio inválido', text: 'Ingresa un precio mayor a $0.00.', confirmButtonColor: '#0d233a' });
            return;
        }

        const foundInCat = _refaccionesCatalogo.find(r => (r.strValor || r.StrValor || '').toLowerCase() === nombre.toLowerCase());

        _refaccionesAgregadas.push({
            idRefaccion: foundInCat ? (foundInCat.id ?? foundInCat.Id) : 0,
            nombre: foundInCat ? (foundInCat.strValor || foundInCat.StrValor) : nombre,
            precio: precio,
            esNueva: !foundInCat
        });

        if (nombreInput) nombreInput.value = '';
        if (precioInput) precioInput.value = '';

        renderTablaRefacciones();
    });
}

function setupCustomRefaccionesAutocomplete() {
    const input = document.getElementById('mant-refaccionNombre');
    const dropdown = document.getElementById('cavexRefaccionesDropdown');
    const precioInput = document.getElementById('mant-refaccionPrecio');
    if (!input || !dropdown) return;

    const renderDropdownOptions = (query = '') => {
        const cleanQuery = query.trim().toLowerCase();
        const filtered = _refaccionesCatalogo.filter(r => {
            const name = (r.strValor || r.StrValor || '').toLowerCase();
            return !cleanQuery || name.includes(cleanQuery);
        });

        if (!filtered.length) {
            dropdown.innerHTML = '<div class="p-2 text-muted small text-center">Sin sugerencias coincidentes</div>';
            dropdown.classList.add('is-open');
            return;
        }

        dropdown.innerHTML = filtered.map(item => {
            const nombre = item.strValor || item.StrValor || '';
            const precio = item.decPrecioSugerido ?? item.decPrecio ?? item.precio ?? 0;
            const precioFmt = precio > 0 ? `$${precio.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '';
            return `
                <div class="cavex-autocomplete-item" data-nombre="${escapeHtml(nombre)}" data-precio="${precio}">
                    <span>${escapeHtml(nombre)}</span>
                    ${precioFmt ? `<span class="item-price">${precioFmt}</span>` : ''}
                </div>
            `;
        }).join('');

        dropdown.querySelectorAll('.cavex-autocomplete-item').forEach(itemEl => {
            itemEl.addEventListener('click', () => {
                const nombre = itemEl.getAttribute('data-nombre');
                const precio = parseFloat(itemEl.getAttribute('data-precio') || '0');
                input.value = nombre;
                if (precio > 0 && precioInput) {
                    precioInput.value = precio.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
                }
                dropdown.classList.remove('is-open');
            });
        });

        dropdown.classList.add('is-open');
    };

    input.addEventListener('focus', () => renderDropdownOptions(input.value));
    input.addEventListener('input', () => renderDropdownOptions(input.value));

    document.addEventListener('click', (e) => {
        if (!input.contains(e.target) && !dropdown.contains(e.target)) {
            dropdown.classList.remove('is-open');
        }
    });
}

function poblarSelectRefacciones() {
    // Mantener la compatibilidad por si se requiere actualizar catálogos
}

function renderTablaRefacciones() {
    const container = document.getElementById('listaRefaccionesAgregadas');
    if (!container) return;

    if (!_refaccionesAgregadas || _refaccionesAgregadas.length === 0) {
        container.innerHTML = `
            <div class="text-muted small py-2 px-3 text-center" id="refaccionesVaciasPrompt" style="background: #F8FAFC; border: 1px dashed var(--borde-cavex); border-radius: 10px;">
                No hay refacciones agregadas a este reporte.
            </div>`;
        actualizarCostoRefaccionesTotal(0);
        return;
    }

    let totalRef = 0;
    container.innerHTML = _refaccionesAgregadas.map((r, index) => {
        totalRef += r.precio;
        return `
            <div class="d-flex justify-content-between align-items-center p-2 px-3 rounded bg-white border" style="border-color: var(--borde-cavex)!important; box-shadow: 0 2px 6px rgba(6,27,58,0.03);">
                <div class="d-flex align-items-center gap-2">
                    <span class="fw-semibold text-dark">${escapeHtml(r.nombre)}</span>
                    ${r.esNueva ? '<span class="badge bg-info-subtle text-info border border-info-subtle px-2 py-0" style="font-size: 0.72rem;">Nueva</span>' : ''}
                </div>
                <div class="d-flex align-items-center gap-3">
                    <span class="fw-bold text-success" style="font-size: 0.95rem;">$${r.precio.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                    <button type="button" class="btn btn-link text-danger p-0 border-0 ms-2" onclick="quitarRefaccion(${index})" title="Eliminar refacci—n">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    </button>
                </div>
            </div>
        `;
    }).join('');

    actualizarCostoRefaccionesTotal(totalRef);
}

function quitarRefaccion(index) {
    if (index >= 0 && index < _refaccionesAgregadas.length) {
        _refaccionesAgregadas.splice(index, 1);
        renderTablaRefacciones();
    }
}

function actualizarCostoRefaccionesTotal(total) {
    const refInput = document.getElementById('mant-mnyCostoRefacciones');
    if (refInput) {
        refInput.value = total > 0 ? total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '0.00';
    }
    calcularTotal();
}

/* ─── Selector de vehículo / chofer / kilometraje (Vinculación automática) ─── */
// Bandera para evitar bucles infinitos durante eventos simulados de cambio
let isVinculandoIngresoTaller = false;

// Función para inicializar la vinculación automática de campos
function bindVinculacionVehiculoEmpleado() {
    // Referencia al select de vehículo
    const selectVeh = document.getElementById('mant-idVehDatosGenerales');
    // Referencia al select de chofer (empleado)
    const selectEmp = document.getElementById('mant-idEmpEmpleadoChofer');

    // Evento al cambiar el vehículo seleccionado
    selectVeh?.addEventListener('change', () => {
        // Si la vinculación está en proceso, prevenimos reentradas
        if (isVinculandoIngresoTaller) return;
        // Activamos la bandera de bloqueo temporal
        isVinculandoIngresoTaller = true;
        try {
            // Obtenemos el ID numérico del vehículo elegido
            const vehId = parseInt(selectVeh.value, 10);
            // Referencia al campo donde se ingresa el kilometraje actual
            const kmInput = document.getElementById('mant-decKilometrajeActual');
            
            // Si se seleccionó un vehículo válido
            if (vehId) {
                const veh = _vehiculos.find(v => Number(v.id ?? v.Id) === vehId);
                if (veh && kmInput && !kmInput.value) {                    const kmVal = veh.decKilometrajeActual ?? veh.DecKilometrajeActual ?? 0;
                    // Escribimos el valor formateado con comas en el campo de texto
                    kmInput.value = Number(kmVal).toLocaleString('es-MX');
                }

                const asig = _asignaciones.find(a => Number(a.idVehDatosGenerales ?? a.IdVehDatosGenerales) === vehId);
                if (asig && selectEmp) {
                    const empIdAsig = String(asig.idEmpEmpleado ?? asig.IdEmpEmpleado);
                    if (selectEmp.value !== empIdAsig) {
                        selectEmp.value = empIdAsig;
                        selectEmp.dispatchEvent(new Event('change', { bubbles: true }));
                    }                }
            }
        } finally {
            // Liberamos la bandera para futuros eventos de usuario
            isVinculandoIngresoTaller = false;
        }
    });

    // Evento al cambiar manualmente el chofer seleccionado
    selectEmp?.addEventListener('change', () => {
        // Prevenimos bucles de eventos entre vehículo y chofer
        if (isVinculandoIngresoTaller) return;
        // Activamos la bandera de bloqueo temporal
        isVinculandoIngresoTaller = true;
        try {
            // Obtenemos el ID numérico del empleado elegido
            const empId = parseInt(selectEmp.value, 10);
            // Si se seleccionó un empleado
            if (empId) {
                const asig = _asignaciones.find(a => Number(a.idEmpEmpleado ?? a.IdEmpEmpleado) === empId);
                if (asig && selectVeh) {
                    const vehIdAsig = String(asig.idVehDatosGenerales ?? asig.IdVehDatosGenerales);
                    if (selectVeh.value !== vehIdAsig) {
                        selectVeh.value = vehIdAsig;
                        selectVeh.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            }
        } finally {
            // Liberamos la bandera al finalizar la operación
            isVinculandoIngresoTaller = false;
        }
    });
}

/* ─── Cálculo en vivo: Total = Mano de Obra + Refacciones ────────────── */
function bindCostosChange() {
    ['mant-mnyCostoManoObra', 'mant-mnyCostoRefacciones'].forEach(id => {
        document.getElementById(id)?.addEventListener('input', calcularTotal);
    });
}

function calcularTotal() {
    const moStr = document.getElementById('mant-mnyCostoManoObra')?.value || '';
    const refStr = document.getElementById('mant-mnyCostoRefacciones')?.value || '';
    const mo  = parseFloat(moStr.replace(/,/g, '')) || 0;
    const ref = parseFloat(refStr.replace(/,/g, '')) || 0;
    const total = mo + ref;
    const totalEl = document.getElementById('mant-mnyCostoTotal');
    if (totalEl) {
        totalEl.value = (mo > 0 || ref > 0) ? total.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
    }
}

/* ─── Upload comprobante ──────────────────────────────────────────────── */
function bindComprobanteUpload() {
    const area    = document.getElementById('mantComprobanteArea');
    const input   = document.getElementById('mantComprobanteArchivo');
    const preview = document.getElementById('mantFilePreview');
    const prompt  = document.getElementById('mantComprobantePrompt');
    const btnQuit = document.getElementById('btnQuitarComprobanteMant');

    if (!area || !input) return;

    input.addEventListener('click', e => {
        e.stopPropagation();
    });
    area.addEventListener('click', () => { if (!input.disabled) input.click(); });

    area.addEventListener('dragenter', e => {
        e.preventDefault();
        e.stopPropagation();
        if (!input.disabled) area.classList.add('dragover');
    });
    area.addEventListener('dragover', e => { e.preventDefault(); if (!input.disabled) area.classList.add('dragover'); });
    area.addEventListener('dragleave', () => area.classList.remove('dragover'));
    area.addEventListener('drop', e => {
        e.preventDefault();
        area.classList.remove('dragover');
        if (!input.disabled && e.dataTransfer.files.length) {
            input.files = e.dataTransfer.files;
            input.dispatchEvent(new Event('change'));
        }
    });

    input.addEventListener('change', () => {
        const file = input.files[0];
        if (!file) return;
        if (file.size > 5 * 1024 * 1024) {
            Swal.fire({ icon: 'warning', title: 'Archivo muy grande', text: 'El comprobante no debe superar 5 MB.', confirmButtonColor: '#0d233a' });
            input.value = '';
            return;
        }
        document.getElementById('mantFileName').textContent = file.name;
        document.getElementById('mantFileSize').textContent = formatBytes(file.size);
        if (prompt) prompt.style.display = 'none';
        if (preview) preview.style.display = 'flex';
    });

    btnQuit?.addEventListener('click', () => {
        input.value = '';
        const hiddenUrl = document.getElementById('mant-strUrlComprobantePago');
        if (hiddenUrl) hiddenUrl.value = '';
        if (preview) preview.style.display = 'none';
        if (prompt) prompt.style.display  = '';
    });
}

function formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/* Submit del formulario */
function bindFormSubmit() {
    document.getElementById('formIngresoTaller')?.addEventListener('submit', async e => {
        e.preventDefault();
        e.stopPropagation();

        const form = e.target;
        if (!form.checkValidity()) {
            if (_modoCompleto) {
                const fp = document.getElementById('mant-idVehFormaPago');
                if (fp && !fp.value) { fp.classList.add('is-invalid'); return; }
            }
            form.classList.add('was-validated');
            return;
        }
        form.classList.add('was-validated');

        await guardarIngresoTaller();
    });
}

async function guardarIngresoTaller() {
    const btn = document.getElementById('btnGuardarIngresoTaller');
    btn.disabled = true;
    btn.innerHTML = '<span class="spinner-border spinner-border-sm me-2"></span>Guardando...';

    const editingId = parseInt(document.getElementById('mant-id')?.value || '0', 10);

    try {
        const formData = new FormData();
        if (editingId > 0) {
            formData.append('id', editingId.toString());
        }

        formData.append('idVehDatosGenerales',          document.getElementById('mant-idVehDatosGenerales').value);
        formData.append('idEmpEmpleadoChofer',          document.getElementById('mant-idEmpEmpleadoChofer').value);
        formData.append('idEmpEmpleado',                document.getElementById('mant-idEmpEmpleadoChofer').value);
        formData.append('idVehCatTipoServicio',         document.getElementById('mant-idVehCatTipoServicio').value);
        formData.append('dteFechaServicio',             document.getElementById('mant-dteFechaServicio').value);
        formData.append('decKilometrajeActual',         document.getElementById('mant-decKilometrajeActual').value.replace(/,/g, ''));
        formData.append('idVehCatTaller',               document.getElementById('mant-idVehCatTaller').value);
        formData.append('strDescripcion',               document.getElementById('mant-strDescripcion').value);
        formData.append('idVehCatResponsableServicio',  document.getElementById('mant-idVehCatResponsableServicio').value);

        if (_modoCompleto) {
            formData.append('mnyCostoManoObra',    (document.getElementById('mant-mnyCostoManoObra').value || '0').replace(/,/g, ''));
            formData.append('mnyCostoRefacciones', (document.getElementById('mant-mnyCostoRefacciones').value || '0').replace(/,/g, ''));
            formData.append('idVehFormaPago',      document.getElementById('mant-idVehFormaPago').value || '1');

            // Guardar refacciones ingresadas manualmente en la base de datos
            if (_refaccionesAgregadas.length > 0) {
                for (const r of _refaccionesAgregadas) {
                    if (r.esNueva || !r.idRefaccion) {
                        try {
                            const resRef = await fetch('/IngresoTaller/SaveRefaccionCatalog', {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ strValor: r.nombre, strDescripcion: 'Refacción agregada desde reporte de taller' })
                            });
                            const dataRef = await resRef.json();
                            if (dataRef.success && dataRef.data) {
                                r.idRefaccion = dataRef.data.id ?? dataRef.data.Id;
                                r.esNueva = false;
                            }
                        } catch (e) {
                            console.error('Error al guardar nueva refacción desde el ingreso a taller:', e);
                        }
                    }
                }
            }

            const archivo = document.getElementById('mantComprobanteArchivo').files[0];
            if (archivo) formData.append('ComprobanteArchivo', archivo);
            const hiddenUrl = document.getElementById('mant-strUrlComprobantePago')?.value;
            if (hiddenUrl) formData.append('strUrlComprobantePago', hiddenUrl);
        } else {
            formData.append('mnyCostoManoObra',    '0');
            formData.append('mnyCostoRefacciones', '0');
            formData.append('idVehFormaPago',      '1');
        }

        const res  = await fetch('/IngresoTaller/SaveIngresoTaller', { method: 'POST', body: formData });
        const data = await res.json();

        if (data.success) {
            await Swal.fire({
                icon: 'success',
                title: editingId > 0 ? '—Registro actualizado!' : '—Registro guardado!',
                text: data.message || (editingId > 0 ? 'El registro se actualizó correctamente.' : 'El ingreso a taller se registró correctamente.'),                confirmButtonColor: '#0d233a'
            });
            resetForm();
            cargarHistorial();
        } else {
            Swal.fire({ icon: 'error', title: 'Error', text: data.message || 'No se pudo guardar el registro.', confirmButtonColor: '#0d233a' });
        }

    } catch (err) {
        console.error('SaveIngresoTaller error:', err);
        Swal.fire({ icon: 'error', title: 'Error de red', text: 'No se pudo contactar con el servidor. Intenta de nuevo.', confirmButtonColor: '#0d233a' });
    } finally {
        btn.disabled = false;
        const isEditing = parseInt(document.getElementById('mant-id')?.value || '0', 10) > 0;
        const textoBtn = _modoCompleto 
            ? (isEditing ? 'Actualizar reporte de taller' : 'Guardar reporte de taller')
            : (isEditing ? 'Actualizar ingreso a taller' : 'Guardar ingreso a taller');
        btn.innerHTML = `<span id="btnGuardarLabel">${textoBtn}</span>`;
    }
}

function resetForm() {
    const form = document.getElementById('formIngresoTaller');
    if (form) {
        form.reset();
        form.classList.remove('was-validated');
    }
    const hiddenId = document.getElementById('mant-id');
    if (hiddenId) hiddenId.value = '0';

    // Reset switch
    const sw = document.getElementById('switchServicioConcluido');
    if (sw) sw.checked = false;
    _modoCompleto = false;
    toggleCard2(false);

    // Reset comprobante
    const preview = document.getElementById('mantFilePreview');
    const prompt = document.getElementById('mantComprobantePrompt');
    const totalInput = document.getElementById('mant-mnyCostoTotal');
    const hiddenUrl = document.getElementById('mant-strUrlComprobantePago');
    if (hiddenUrl) hiddenUrl.value = '';
    if (preview) preview.style.display = 'none';
    if (prompt) prompt.style.display = '';
    if (totalInput) totalInput.value = '0.00';

    _refaccionesAgregadas = [];
    renderTablaRefacciones();
    actualizarCostoRefaccionesTotal(0);

    // Reset label del botón de guardado y ocultar botón de cancelar edición
    const btnLabel = document.getElementById('btnGuardarLabel');
    if (btnLabel) btnLabel.textContent = 'Guardar ingreso a taller';
    const btnCancel = document.getElementById('btnCancelarEdicion');
    if (btnCancel) btnCancel.style.display = 'none';

    // Disparar eventos change para actualizar custom selects
    ['mant-idVehDatosGenerales', 'mant-idEmpEmpleadoChofer', 'mant-idVehCatTipoServicio', 'mant-idVehCatTaller', 'mant-idVehFormaPago', 'mant-idVehCatResponsableServicio'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.dispatchEvent(new Event('change', { bubbles: true }));
    });

    setFechaHoy();
}

window.resetForm = resetForm;

/* ─── Historial de ingresos a taller ───────────────────────────────────── */
async function cargarHistorial() {
    const tbody = document.getElementById('ingresoTallerTableBody');
    if (tbody) tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4"><span class="spinner-border spinner-border-sm me-2"></span>Cargando...</td></tr>';

    try {
        const res  = await fetch('/IngresoTaller/GetIngresoTaller');
        const data = await res.json();

        if (data.success && Array.isArray(data.data)) {
            _listaHistorial = data.data;
        } else {
            _listaHistorial = [];
        }
        renderTablaHistorial();
    } catch (err) {
        console.error("Error al cargar historial:", err);
        if (tbody) tbody.innerHTML = '<tr><td colspan="9" class="text-center text-danger py-4">Error al cargar los registros.</td></tr>';
    }
}

function esTicketCompleto(m) {
    const total = m.mnyCostoTotal ?? ((m.mnyCostoManoObra || 0) + (m.mnyCostoRefacciones || 0));
    return Boolean(m.bitServicioConcluido || m.bolConcluido || (total > 0 && m.strUrlComprobantePago));
}

/* Helper functions to resolve text labels from IDs */
function getVehiculoLabel(m) {
    if (m.StrVehDatosGenerales) return m.StrVehDatosGenerales;
    if (m.strMarca || m.strModelo) return `${m.strMarca || ''} ${m.strModelo || ''}`.trim();
    const vehId = Number(m.idVehDatosGenerales ?? m.IdVehDatosGenerales ?? 0);
    if (vehId > 0) {
        const list = _vehiculosTodos.length ? _vehiculosTodos : _vehiculos;
        const v = list.find(x => Number(x.id ?? x.Id) === vehId);
        if (v) {
            const marca = v.strVehCatMarcaVehiculo || v.StrVehCatMarcaVehiculo || v.strMarca || v.StrMarca || '';
            const modelo = v.strModelo || v.StrModelo || '';
            const placa = v.strPlaca || v.StrPlaca || '';
            return `${placa} · ${marca} ${modelo}`.trim().replace(/^·\s*/, '');
        }
    }
    return '-';
}

function getTallerLabel(m) {
    const nombre = m.strVehCatTaller || m.StrVehCatTaller || m.strTaller || m.StrTaller;
    if (nombre) return nombre;

    const talId = Number(m.idVehCatTaller ?? m.IdVehCatTaller ?? 0);
    if (talId > 0) {
        const t = _talleres.find(x => Number(x.id ?? x.Id) === talId);
        if (t) return t.strValor || t.StrValor || '-';
    }
    return '-';
}

function getTipoServicioLabel(m) {
    const nombre = m.strVehCatTipoServicio || m.StrVehCatTipoServicio || m.strVehServicioDetalle || m.StrVehServicioDetalle || m.strTipoServicio || m.StrTipoServicio;
    if (nombre) return nombre;

    const tipoId = Number(m.idVehCatTipoServicio ?? m.IdVehCatTipoServicio ?? 0);
    if (tipoId > 0) {
        const ts = _tiposServicio.find(x => Number(x.id ?? x.Id) === tipoId);
        if (ts) return ts.strValor || ts.StrValor || '-';
    }
    return '-';
}

function getEncargadoLabel(m) {
    const nombre = m.strVehCatResponsableServicio || m.StrVehCatResponsableServicio || m.strEmpEmpleado || m.StrEmpEmpleado || m.strEncargado || m.StrEncargado;
    if (nombre) return nombre;

    const empId = Number(m.idEmpEmpleadoChofer ?? m.idEmpEmpleado ?? m.IdEmpEmpleado ?? 0);
    if (empId > 0) {
        const list = _empleadosTodos.length ? _empleadosTodos : _empleados;
        const emp = list.find(x => Number(x.id ?? x.Id) === empId);
        if (emp) return `${emp.strNombre || emp.StrNombre || ''} ${emp.strApellidoPaterno || emp.StrApellidoPaterno || ''}`.trim();
    }
    const respId = Number(m.idVehCatResponsableServicio ?? m.IdVehCatResponsableServicio ?? 0);
    if (respId > 0) {
        const r = _responsables.find(x => Number(x.id ?? x.Id) === respId);
        if (r) return r.strValor || r.StrValor || '-';
    }
    return '-';
}

function renderTablaHistorial() {
    const tbody = document.getElementById('ingresoTallerTableBody');
    if (!tbody) return;

    // Actualizar contadores de pestañas
    const totalCount = _listaHistorial.length;
    const incompletosCount = _listaHistorial.filter(m => !esTicketCompleto(m)).length;
    const completosCount = _listaHistorial.filter(m => esTicketCompleto(m)).length;

    const elTodos = document.getElementById('countTodos');
    const elIncompletos = document.getElementById('countIncompletos');
    const elCompletos = document.getElementById('countCompletos');
    if (elTodos) elTodos.textContent = totalCount;
    if (elIncompletos) elIncompletos.textContent = incompletosCount;
    if (elCompletos) elCompletos.textContent = completosCount;

    // Filtrar lista
    let filtrados = _listaHistorial;

    if (_filtroEstadoHistorial === 'incompletos') {
        filtrados = filtrados.filter(m => !esTicketCompleto(m));
    } else if (_filtroEstadoHistorial === 'completos') {
        filtrados = filtrados.filter(m => esTicketCompleto(m));
    }

    if (_busquedaHistorial) {
        filtrados = filtrados.filter(m => {
            const strVeh = getVehiculoLabel(m).toLowerCase();
            const strTaller = getTallerLabel(m).toLowerCase();
            const strTipo = getTipoServicioLabel(m).toLowerCase();
            const strEnc = getEncargadoLabel(m).toLowerCase();
            return strVeh.includes(_busquedaHistorial) ||
                   strTaller.includes(_busquedaHistorial) ||
                   strTipo.includes(_busquedaHistorial) ||
                   strEnc.includes(_busquedaHistorial);
        });
    }

    if (!filtrados.length) {
        tbody.innerHTML = '<tr><td colspan="9" class="text-center text-muted py-4">Sin registros.</td></tr>';
        return;
    }

    tbody.innerHTML = filtrados.map(m => {
        const total = m.mnyCostoTotal ?? ((m.mnyCostoManoObra || 0) + (m.mnyCostoRefacciones || 0));
        const completo = esTicketCompleto(m);
        const estadoBadge = completo
            ? '<span class="badge bg-success text-white fw-bold px-3 py-1" style="border-radius: 8px;">Reporte Completo</span>'
            : '<span class="badge bg-warning text-dark fw-bold px-3 py-1" style="border-radius: 8px;">Ticket Incompleto</span>';

        const kmVal = Number(m.decKilometrajeActual ?? m.lngKilometrajeActual ?? 0);
        const fechaVal = formatFecha(m.dteFechaServicio || m.dteFechaInicio);

        const labelVeh = getVehiculoLabel(m);
        const labelTaller = getTallerLabel(m);
        const labelTipo = getTipoServicioLabel(m);
        const labelEnc = getEncargadoLabel(m);

        return `
        <tr>
            <td>
                <div class="fw-bold">${escapeHtml(labelVeh)}</div>
            </td>
            <td>${escapeHtml(labelTaller)}</td>
            <td>${escapeHtml(labelTipo)}</td>
            <td>${escapeHtml(labelEnc)}</td>            
            <td>${fechaVal}</td>
            <td>${kmVal > 0 ? kmVal.toLocaleString('es-MX') + ' km' : '—'}</td>
            <td><div class="fw-bold">$${Number(total || 0).toFixed(2)}</div></td>
            <td>${estadoBadge}</td>
            <td class="text-end">
                <div class="dropdown actions-dropdown d-inline-block">
                    <button class="btn-action-trigger btn-sm" type="button" data-bs-toggle="dropdown" data-bs-boundary="viewport" aria-expanded="false">
                        <span>Acciones</span>
                        <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li>
                            <button class="dropdown-item d-flex align-items-center" type="button" onclick="verDetalleIngresoTaller(${m.id})">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 text-info"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                Ver detalles
                            </button>
                        </li>
                        <li>
                            <button class="dropdown-item d-flex align-items-center" type="button" onclick="editarIngresoTaller(${m.id})">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 text-primary"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                Editar
                            </button>
                        </li>
                        <li>
                            <button class="dropdown-item d-flex align-items-center text-danger" type="button" onclick="eliminarIngresoTaller(${m.id})">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 text-danger"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                Eliminar
                            </button>
                        </li>
                    </ul>
                </div>
            </td>
        </tr>`;
    }).join('');

    // Inicializar dropdowns de acciones con estrategia 'fixed' para prevenir recortes
    document.querySelectorAll('#ingresoTallerTableBody .btn-action-trigger').forEach(el => {
        new bootstrap.Dropdown(el, {
            popperConfig: (defaultConfig) => {
                return {
                    ...defaultConfig,
                    strategy: 'fixed'
                };
            }
        });
    });
}

/* ─── Ver Detalles ─────────────────────────────────────────────────────── */
async function verDetalleIngresoTaller(id) {
    let item = _listaHistorial.find(m => m.id === id);
    if (!item) {
        try {
            const res = await fetch(`/IngresoTaller/GetIngresoTallerById?id=${id}`);
            const data = await res.json();
            if (data.success && data.data) item = data.data;
        } catch (e) {
            console.error("Error al obtener detalle:", e);
        }
    }
    if (!item) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar la información del registro.', confirmButtonColor: '#0d233a' });
        return;
    }

    const vehLabel = getVehiculoLabel(item);
    const tallerLabel = getTallerLabel(item);
    const tipoLabel = getTipoServicioLabel(item);
    const encLabel = getEncargadoLabel(item);
    const fecha = formatFecha(item.dteFechaServicio || item.dteFechaInicio);
    const km = Number(item.decKilometrajeActual ?? item.lngKilometrajeActual ?? 0);
    const mo = Number(item.mnyCostoManoObra || 0);
    const ref = Number(item.mnyCostoRefacciones || 0);
    const total = item.mnyCostoTotal ?? (mo + ref);
    const completo = esTicketCompleto(item);

    const fpId = item.idVehFormaPago ?? item.IdVehFormaPago;
    const fpObj = _formasPago.find(f => Number(f.id ?? f.Id) === Number(fpId));
    const fpText = item.strVehFormaPago || (fpObj ? (fpObj.strValor || fpObj.StrValor) : 'Efectivo');

    const htmlContent = `
        <div class="text-start" style="font-size: 0.95rem;">
            <div class="d-flex justify-content-between align-items-center mb-3 pb-2 border-bottom">
                <span class="badge ${completo ? 'bg-success' : 'bg-warning text-dark'} fs-6 px-3 py-2">
                    ${completo ? 'Reporte Completo' : 'Ticket Incompleto'}
                </span>
                <span class="text-muted fw-bold">Fecha: ${fecha}</span>
            </div>

            <div class="row g-3">
                <div class="col-md-6">
                    <small class="text-muted d-block text-uppercase fw-bold">Vehículo</small>
                    <span class="fw-semibold text-dark">${escapeHtml(vehLabel)}</span>
                </div>
                <div class="col-md-6">
                    <small class="text-muted d-block text-uppercase fw-bold">Taller de Destino</small>
                    <span class="fw-semibold text-dark">${escapeHtml(tallerLabel)}</span>
                </div>
                <div class="col-md-6">
                    <small class="text-muted d-block text-uppercase fw-bold">Tipo de Servicio</small>
                    <span class="fw-semibold text-dark">${escapeHtml(tipoLabel)}</span>
                </div>
                <div class="col-md-6">
                    <small class="text-muted d-block text-uppercase fw-bold">Encargado Responsable</small>
                    <span class="fw-semibold text-dark">${escapeHtml(encLabel)}</span>
                </div>
                <div class="col-md-6">
                    <small class="text-muted d-block text-uppercase fw-bold">Kilometraje Actual</small>
                    <span class="fw-semibold text-dark">${km > 0 ? km.toLocaleString('es-MX') + ' km' : '-'}</span>
                </div>
                <div class="col-md-6">
                    <small class="text-muted d-block text-uppercase fw-bold">Forma de Pago</small>
                    <span class="fw-semibold text-dark">${escapeHtml(fpText)}</span>
                </div>

                ${item.strDescripcion ? `
                <div class="col-12 mt-2">
                    <small class="text-muted d-block text-uppercase fw-bold">Observaciones</small>
                    <div class="p-2 bg-light rounded border text-muted small">${escapeHtml(item.strDescripcion)}</div>
                </div>` : ''}
            </div>

            <div class="mt-4 p-3 rounded" style="background-color: #f8fafc; border: 1px dashed #cbd5e1;">
                <h6 class="fw-bold mb-2 text-primary">Desglose Financiero</h6>
                <div class="d-flex justify-content-between mb-1">
                    <span>Mano de Obra:</span>
                    <strong class="text-dark">$${mo.toLocaleString('es-MX', {minimumFractionDigits:2, maximumFractionDigits:2})}</strong>
                </div>
                <div class="d-flex justify-content-between mb-2">
                    <span>Refacciones:</span>
                    <strong class="text-dark">$${ref.toLocaleString('es-MX', {minimumFractionDigits:2, maximumFractionDigits:2})}</strong>
                </div>
                <div class="d-flex justify-content-between pt-2 border-top fs-5 fw-bold text-success">
                    <span>TOTAL GENERAL:</span>
                    <span>$${Number(total || 0).toLocaleString('es-MX', {minimumFractionDigits:2, maximumFractionDigits:2})}</span>
                </div>
            </div>

            ${item.strUrlComprobantePago ? `
            <div class="mt-3 text-center">
                <a href="${item.strUrlComprobantePago}" target="_blank" class="btn btn-outline-primary btn-sm rounded-pill px-3">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                    Ver Comprobante de Pago Adjunto
                </a>
            </div>` : ''}
        </div>
    `;

    Swal.fire({
        title: 'Detalles del Reporte de Taller',
        html: htmlContent,
        width: 650,
        confirmButtonText: 'Cerrar',
        confirmButtonColor: '#0d233a'
    });
}

/* ─── Editar ───────────────────────────────────────────────────────────── */
async function editarIngresoTaller(id) {
    let item = _listaHistorial.find(m => m.id === id);
    if (!item) {
        try {
            const res = await fetch(`/IngresoTaller/GetIngresoTallerById?id=${id}`);
            const data = await res.json();
            if (data.success && data.data) item = data.data;
        } catch (e) {
            console.error("Error al obtener detalle para edición:", e);
        }
    }
    if (!item) {
        Swal.fire({ icon: 'error', title: 'Error', text: 'No se pudo cargar la información para editar.', confirmButtonColor: '#0d233a' });
        return;
    }

    // Set hidden ID
    const hiddenId = document.getElementById('mant-id');
    if (hiddenId) hiddenId.value = item.id;

    // Llenar campos principales
    const selVeh = document.getElementById('mant-idVehDatosGenerales');
    if (selVeh) {
        selVeh.value = item.idVehDatosGenerales || '';
        selVeh.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const selEmp = document.getElementById('mant-idEmpEmpleadoChofer');
    if (selEmp) {
        selEmp.value = item.idEmpEmpleadoChofer || item.idEmpEmpleado || '';
        selEmp.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const selResp = document.getElementById('mant-idVehCatResponsableServicio');
    if (selResp) {
        selResp.value = item.idVehCatResponsableServicio || '';
        selResp.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const inputFecha = document.getElementById('mant-dteFechaServicio');
    if (inputFecha) {
        const rawDate = item.dteFechaServicio || item.dteFechaInicio;
        if (rawDate) {
            inputFecha.value = new Date(rawDate).toISOString().split('T')[0];
        }
    }

    const selTipo = document.getElementById('mant-idVehCatTipoServicio');
    if (selTipo) {
        selTipo.value = item.idVehCatTipoServicio || '';
        selTipo.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const selTaller = document.getElementById('mant-idVehCatTaller');
    if (selTaller) {
        selTaller.value = item.idVehCatTaller || '';
        selTaller.dispatchEvent(new Event('change', { bubbles: true }));
    }

    const kmInput = document.getElementById('mant-decKilometrajeActual');
    if (kmInput) {
        const kmVal = item.decKilometrajeActual ?? item.lngKilometrajeActual ?? 0;
        kmInput.value = Number(kmVal).toLocaleString('es-MX');
    }

    const descInput = document.getElementById('mant-strDescripcion');
    if (descInput) {
        descInput.value = item.strDescripcion || '';
    }

    // Llenar reporte financiero
    const moInput = document.getElementById('mant-mnyCostoManoObra');
    if (moInput) {
        const mo = Number(item.mnyCostoManoObra || 0);
        moInput.value = mo > 0 ? mo.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
    }

    const refInput = document.getElementById('mant-mnyCostoRefacciones');
    if (refInput) {
        const ref = Number(item.mnyCostoRefacciones || 0);
        refInput.value = ref > 0 ? ref.toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '';
    }

    calcularTotal();

    const fpInput = document.getElementById('mant-idVehFormaPago');
    if (fpInput) {
        fpInput.value = item.idVehFormaPago || '1';
        fpInput.dispatchEvent(new Event('change', { bubbles: true }));
    }

    // Comprobante
    const hiddenUrl = document.getElementById('mant-strUrlComprobantePago');
    const preview = document.getElementById('mantFilePreview');
    const prompt = document.getElementById('mantComprobantePrompt');
    if (item.strUrlComprobantePago) {
        if (hiddenUrl) hiddenUrl.value = item.strUrlComprobantePago;
        const fileName = item.strUrlComprobantePago.split('/').pop() || 'Comprobante_registrado';
        document.getElementById('mantFileName').textContent = fileName;
        document.getElementById('mantFileSize').textContent = 'Adjunto';
        if (prompt) prompt.style.display = 'none';
        if (preview) preview.style.display = 'flex';
    } else {
        if (hiddenUrl) hiddenUrl.value = '';
        if (preview) preview.style.display = 'none';
        if (prompt) prompt.style.display = '';
    }

    // Activar switch si el reporte ya tiene datos o concluyó
    const tieneReporte = esTicketCompleto(item);
    const switchEl = document.getElementById('switchServicioConcluido');
    if (switchEl) {
        switchEl.checked = tieneReporte;
        _modoCompleto = tieneReporte;
        toggleCard2(tieneReporte);
    }

    // Actualizar etiqueta del botón y mostrar botón de cancelar edición
    const btnLabel = document.getElementById('btnGuardarLabel');
    if (btnLabel) {
        btnLabel.textContent = tieneReporte ? 'Actualizar reporte de taller' : 'Actualizar ingreso a taller';
    }
    const btnCancel = document.getElementById('btnCancelarEdicion');
    if (btnCancel) btnCancel.style.display = 'inline-block';

    // Desplazar suavemente a la tarjeta de edición
    document.getElementById('card1')?.scrollIntoView({ behavior: 'smooth' });
}

async function eliminarIngresoTaller(id) {
    const confirm = await Swal.fire({
        icon: 'warning',
        title: '¿Eliminar registro?',
        text: 'Esta acción no se puede deshacer.',
        showCancelButton: true,
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar',
        confirmButtonColor: '#c0392b',
        cancelButtonColor: '#0d233a'
    });
    if (!confirm.isConfirmed) return;

    const res  = await fetch(`/IngresoTaller/DeleteIngresoTaller?id=${id}`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
        Swal.fire({ icon: 'success', title: 'Eliminado', timer: 1500, showConfirmButton: false });
        cargarHistorial();
    } else {
        Swal.fire({ icon: 'error', title: 'Error', text: data.message, confirmButtonColor: '#0d233a' });
    }
}

function poblarSelect(selectId, items, mapFn) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    const current = sel.value;
    while (sel.options.length > 1) sel.remove(1);
    items.forEach(item => {
        const { value, text } = mapFn(item);
        if (value != null && text) {
            const opt = new Option(text, value);
            sel.add(opt);
        }
    });
    if (current) sel.value = current;

    // Disparar evento para actualizar custom select
    sel.dispatchEvent(new Event('change', { bubbles: true }));
}

function formatFecha(val) {
    if (!val || val === '0001-01-01T00:00:00' || String(val).startsWith('0001-01-01')) return '—';
    const d = new Date(val);
    if (isNaN(d) || d.getFullYear() <= 1900) return '—';
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

function formatFechaHora(val) {
    if (!val || val === '0001-01-01T00:00:00' || String(val).startsWith('0001-01-01')) return '-';
    const d = new Date(val);
    if (isNaN(d) || d.getFullYear() <= 1900) return '-';
    return d.toLocaleString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false });
}

function escapeHtml(str) {
    if (!str) return '';
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
}

function formatCurrencyInput(input) {
    let value = input.value.replace(/[^0-9.]/g, "");
    const parts = value.split(".");
    if (parts.length > 2) {
        value = parts[0] + "." + parts.slice(1).join("");
    }
    let integerPart = parts[0];
    let decimalPart = parts[1];
    integerPart = integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    if (decimalPart !== undefined) {
        decimalPart = decimalPart.substring(0, 2);
        input.value = integerPart + "." + decimalPart;
    } else {
        input.value = integerPart;
    }
}