/**
 * vista-ingreso-taller.js
 * LÃ³gica para la pantalla "Registro de Ingreso a Taller".
 */

'use strict';

/* â”€â”€â”€ Estado global â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
let _vehiculos = [];         // CatÃ¡logo completo de vehÃ­culos
let _asignaciones = [];      // Asignaciones activas cargadas una vez
let _empleados = [];         // CatÃ¡logo completo de empleados
let _modoCompleto = false;   // true = switch ON (reporte de taller habilitado)
let _listaHistorial = [];    // Datos completos de la tabla de historial
let _filtroEstadoHistorial = 'todos'; // todos | incompletos | completos
let _busquedaHistorial = ''; // TÃ©rmino de bÃºsqueda en tabla

/* â”€â”€â”€ Init â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
document.addEventListener('DOMContentLoaded', () => {
    setFechaHoy();
    cargarCatalogos();
    cargarHistorial();
    bindSwitch();
    bindCostosChange();
    bindComprobanteUpload();
    bindFormSubmit();

    setupStatusTabs('statusTabs', (filterValue) => {
        _filtroEstadoHistorial = filterValue;
        renderTablaHistorial();
    });

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
    const kmInput = document.getElementById('mant-decKilometrajeActual');
    if (kmInput) {
        kmInput.addEventListener('input', () => {
            kmInput.value = kmInput.value.replace(/[^0-9]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        });
    }
});

/* â”€â”€â”€ Fecha por defecto = hoy â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function setFechaHoy() {
    const hoy = new Date().toISOString().split('T')[0];
    document.getElementById('mant-dteFechaServicio').value = hoy;
}

/* â”€â”€â”€ Switch toggle â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function bindSwitch() {
    const switchEl = document.getElementById('switchServicioConcluido');
    if (!switchEl) return;
    switchEl.addEventListener('change', () => {
        _modoCompleto = switchEl.checked;
        switchEl.setAttribute('aria-checked', _modoCompleto.toString());
        toggleCard2(_modoCompleto);
    });
}

// FunciÃ³n para mostrar u ocultar la secciÃ³n "Reporte de Taller" segÃºn el estado del switch
function toggleCard2(habilitar) {
    // Obtenemos el contenedor de la secciÃ³n 2 (Reporte de Taller)
    const card2     = document.getElementById('card2');
    // Obtenemos la etiqueta de texto del switch (NO / SÃ)
    const label     = document.getElementById('switchLabel');
    // Obtenemos el texto del botÃ³n de guardado
    const btnLabel  = document.getElementById('btnGuardarLabel');
    // Obtenemos todos los elementos interactivos dentro de la secciÃ³n 2
    const inputs2   = card2?.querySelectorAll('input:not([type=hidden]), select, textarea');

    // Si el switch estÃ¡ activado en SÃ
    if (habilitar) {
        // Mostramos la secciÃ³n 2 en la pantalla
        if (card2) card2.style.display = 'block';
        // Cambiamos el texto del switch a "SÃ"
        if (label) label.textContent = 'SÃ';
        // Actualizamos el texto del botÃ³n principal
        if (btnLabel) btnLabel.textContent = 'Guardar reporte de taller';
        // Habilitamos los campos internos para captura
        inputs2?.forEach(el => {
            el.disabled = false;
        });
        // Habilitamos la zona de carga de comprobante
        document.getElementById('mantComprobanteArea')?.classList.remove('mant-upload-area--disabled');
    } else {
        // Si el switch estÃ¡ en NO, ocultamos la secciÃ³n 2 por completo
        if (card2) card2.style.display = 'none';
        // Cambiamos el texto del switch a "NO"
        if (label) label.textContent = 'NO';
        // Restauramos el texto del botÃ³n principal
        if (btnLabel) btnLabel.textContent = 'Guardar ingreso a taller';
        // Deshabilitamos los campos de la secciÃ³n 2
        inputs2?.forEach(el => el.disabled = true);
        // Deshabilitamos la zona de carga de comprobante
        document.getElementById('mantComprobanteArea')?.classList.add('mant-upload-area--disabled');
    }
}

/* â”€â”€â”€ Cargar catÃ¡logos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
async function cargarCatalogos() {
    try {
        const [resVehiculos, resCatalogos, resResponsables, resAsignaciones, resEmpleados] = await Promise.all([
            obtenerVehiculosActivosDropdown(),
            fetch('/IngresoTaller/GetIngresoTallerCatalogos').then(r => r.json()),
            fetch('/IngresoTaller/ResponsablesServicio/GetResponsables').then(r => r.json()),
            fetch('/Asignaciones/GetAsignacionesActivas').then(r => r.json()),
            fetch('/Empleado/GetEmpleadosDropdown').then(r => r.json()).catch(() => ({ success: false }))
        ]);

        // Asignaciones activas
        if (resAsignaciones.success) {
            _asignaciones = resAsignaciones.data || [];
        }

        const vehIdAsignados = new Set(
            (_asignaciones || [])
                .filter(a => (a.decKilometrajeFinal == null && a.DecKilometrajeFinal == null) || Number(a.decKilometrajeFinal ?? a.DecKilometrajeFinal) === 0)
                .map(a => Number(a.idVehDatosGenerales ?? a.IdVehDatosGenerales))
                .filter(id => !isNaN(id) && id > 0)
        );

        const empIdAsignados = new Set(
            (_asignaciones || [])
                .filter(a => (a.decKilometrajeFinal == null && a.DecKilometrajeFinal == null) || Number(a.decKilometrajeFinal ?? a.DecKilometrajeFinal) === 0)
                .map(a => Number(a.idEmpEmpleado ?? a.IdEmpEmpleado))
                .filter(id => !isNaN(id) && id > 0)
        );

        // VehÃ­culos solo asignados
        if (resVehiculos.success) {
            _vehiculos = (resVehiculos.data?.items || []).filter(v => vehIdAsignados.has(Number(v.id ?? v.Id)));
            poblarSelect('mant-idVehDatosGenerales', _vehiculos, v => ({
                value: v.id ?? v.Id,
                text: `${v.strPlaca || v.StrPlaca || "-"} - ${v.strMarca || v.StrMarca || ""} ${v.strModelo || v.StrModelo || ""} ${v.intAnio || v.IntAnio || ""}`.trim()
            }));
        }

        // Empleados (Choferes) solo asignados
        if (resEmpleados.success && resEmpleados.data) {
            _empleados = (resEmpleados.data || []).filter(e => empIdAsignados.has(Number(e.id ?? e.Id)));
            poblarSelect('mant-idEmpEmpleadoChofer', _empleados, e => ({
                value: e.id ?? e.Id,
                text: `${e.strNombre || e.StrNombre || ''} ${e.strApellidoPaterno || e.StrApellidoPaterno || ''} ${e.strApellidoMaterno || e.StrApellidoMaterno || ''}`.trim()
            }));
        }

        // CatÃ¡logos de Ingreso a Taller (Tipos de Servicio, Talleres y Formas de Pago)
        if (resCatalogos.success && resCatalogos.data) {
            if (resCatalogos.data.tiposServicio) {
                poblarSelect('mant-idVehCatTipoServicio', resCatalogos.data.tiposServicio, item => ({
                    value: item.id ?? item.Id,
                    text: item.strValor || item.StrValor || ''
                }));
            }
            if (resCatalogos.data.talleres) {
                poblarSelect('mant-idVehCatTaller', resCatalogos.data.talleres, item => ({
                    value: item.id ?? item.Id,
                    text: item.strValor || item.StrValor || ''
                }));
            }
            if (resCatalogos.data.formasPago) {
                poblarSelect('mant-idVehFormaPago', resCatalogos.data.formasPago, item => ({
                    value: item.id ?? item.Id,
                    text: item.strValor || item.StrValor || ''
                }));
            }
        }

        // Encargado Autorizador / Responsables de Servicio
        if (resResponsables && resResponsables.data) {
            const listResp = Array.isArray(resResponsables.data) ? resResponsables.data : (resResponsables.data.items || []);
            poblarSelect('mant-idVehCatResponsableServicio', listResp, item => ({
                value: item.id ?? item.Id,
                text: item.strValor || item.StrValor || ''
            }));
        }

        // Los dropdowns son convertidos automÃ¡ticamente por el componente global custom-select de CAVEX (site.js)
        bindVinculacionVehiculoEmpleado();

    } catch (err) {
        console.error('Error cargando catÃ¡logos:', err);
    }
}

/* â”€â”€â”€ Selector de vehÃ­culo / chofer / kilometraje (VinculaciÃ³n automÃ¡tica) â”€â”€â”€ */
// Bandera para evitar bucles infinitos durante eventos simulados de cambio
let isVinculandoIngresoTaller = false;

// FunciÃ³n para inicializar la vinculaciÃ³n automÃ¡tica de campos
function bindVinculacionVehiculoEmpleado() {
    // Referencia al select de vehÃ­culo
    const selectVeh = document.getElementById('mant-idVehDatosGenerales');
    // Referencia al select de chofer (empleado)
    const selectEmp = document.getElementById('mant-idEmpEmpleadoChofer');

    // Evento al cambiar el vehÃ­culo seleccionado
    selectVeh?.addEventListener('change', () => {
        // Si la vinculaciÃ³n estÃ¡ en proceso, prevenimos reentradas
        if (isVinculandoIngresoTaller) return;
        // Activamos la bandera de bloqueo temporal
        isVinculandoIngresoTaller = true;
        try {
            // Obtenemos el ID numÃ©rico del vehÃ­culo elegido
            const vehId = parseInt(selectVeh.value, 10);
            // Referencia al campo donde se ingresa el kilometraje actual
            const kmInput = document.getElementById('mant-decKilometrajeActual');
            
            // Si se seleccionÃ³ un vehÃ­culo vÃ¡lido
            if (vehId) {
                // Buscamos el objeto del vehÃ­culo dentro de la lista cargada
                const veh = _vehiculos.find(v => Number(v.id) === vehId);
                // Si se encuentra el vehÃ­culo y existe el input de kilometraje
                if (veh && kmInput) {
                    // Extraemos su kilometraje registrado actual
                    const kmVal = veh.decKilometrajeActual ?? veh.DecKilometrajeActual ?? 0;
                    // Escribimos el valor formateado con comas en el campo de texto
                    kmInput.value = Number(kmVal).toLocaleString('es-MX');
                }

                // Buscamos si existe una asignaciÃ³n activa asociada al vehÃ­culo
                const asig = _asignaciones.find(a => Number(a.idVehDatosGenerales) === vehId);
                // Si encontramos asignaciÃ³n activa y existe el select de chofer
                if (asig && selectEmp) {
                    // Si el chofer seleccionado no coincide con el chofer asignado
                    if (selectEmp.value !== String(asig.idEmpEmpleado)) {
                        // Seleccionamos al chofer correspondiente automÃ¡ticamente
                        selectEmp.value = String(asig.idEmpEmpleado);
                        // Notificamos el cambio a posibles escuchadores
                        selectEmp.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    // Deshabilitamos el select del chofer para evitar cambios no autorizados
                    selectEmp.disabled = true;
                } else if (selectEmp) {
                    // Si el vehÃ­culo no tiene asignaciÃ³n activa, permitimos elegir chofer libremente
                    selectEmp.disabled = false;
                }
            } else {
                // Si se deselecciona el vehÃ­culo, vaciamos el kilometraje
                if (kmInput) kmInput.value = '';
                // Si existe el select del chofer, lo reiniciamos
                if (selectEmp) {
                    if (selectEmp.value !== '') {
                        selectEmp.value = '';
                        selectEmp.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                    // Habilitamos la selecciÃ³n manual
                    selectEmp.disabled = false;
                }
            }
        } finally {
            // Liberamos la bandera para futuros eventos de usuario
            isVinculandoIngresoTaller = false;
        }
    });

    // Evento al cambiar manualmente el chofer seleccionado
    selectEmp?.addEventListener('change', () => {
        // Prevenimos bucles de eventos entre vehÃ­culo y chofer
        if (isVinculandoIngresoTaller) return;
        // Activamos la bandera de bloqueo temporal
        isVinculandoIngresoTaller = true;
        try {
            // Obtenemos el ID numÃ©rico del empleado elegido
            const empId = parseInt(selectEmp.value, 10);
            // Si se seleccionÃ³ un empleado
            if (empId) {
                // Buscamos si dicho empleado tiene un vehÃ­culo asignado
                const asig = _asignaciones.find(a => a.idEmpEmpleado === empId);
                // Si encontramos la asignaciÃ³n activa y existe el select de vehÃ­culo
                if (asig && selectVeh) {
                    // Si el vehÃ­culo no estÃ¡ seleccionado
                    if (selectVeh.value !== String(asig.idVehDatosGenerales)) {
                        // Seleccionamos automÃ¡ticamente el vehÃ­culo del chofer
                        selectVeh.value = String(asig.idVehDatosGenerales);
                        // Disparamos el evento para que cargue tambiÃ©n su kilometraje
                        selectVeh.dispatchEvent(new Event('change', { bubbles: true }));
                    }
                }
            }
        } finally {
            // Liberamos la bandera al finalizar la operaciÃ³n
            isVinculandoIngresoTaller = false;
        }
    });
}

/* â”€â”€â”€ CÃ¡lculo en vivo: Total = Mano de Obra + Refacciones â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€â”€ Upload comprobante â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

/* â”€â”€â”€ Submit del formulario â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

    try {
        const formData = new FormData();
        formData.append('idVehDatosGenerales',          document.getElementById('mant-idVehDatosGenerales').value);
        formData.append('idEmpEmpleadoChofer',          document.getElementById('mant-idEmpEmpleadoChofer').value);
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

            const archivo = document.getElementById('mantComprobanteArchivo').files[0];
            if (archivo) formData.append('ComprobanteArchivo', archivo);
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
                title: 'Â¡Registro guardado!',
                text: data.message || 'El ingreso a taller se registrÃ³ correctamente.',
                confirmButtonColor: '#0d233a'
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
        const textoBtn = _modoCompleto ? 'Guardar reporte de taller' : 'Guardar ingreso a taller';
        btn.innerHTML = `<span id="btnGuardarLabel">${textoBtn}</span>`;
    }
}

function resetForm() {
    const form = document.getElementById('formIngresoTaller');
    if (form) {
        form.reset();
        form.classList.remove('was-validated');
    }
    // Reset switch
    const sw = document.getElementById('switchServicioConcluido');
    if (sw) sw.checked = false;
    _modoCompleto = false;
    toggleCard2(false);

    // Reset comprobante
    const preview = document.getElementById('mantFilePreview');
    const prompt = document.getElementById('mantComprobantePrompt');
    const totalInput = document.getElementById('mant-mnyCostoTotal');
    if (preview) preview.style.display = 'none';
    if (prompt) prompt.style.display = '';
    if (totalInput) totalInput.value = '0.00';
    setFechaHoy();
}

/* â”€â”€â”€ Historial de ingresos a taller â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
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

function renderTablaHistorial() {
    const tbody = document.getElementById('ingresoTallerTableBody');
    if (!tbody) return;

    // Actualizar contadores de pestaÃ±as
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
            const strVeh = `${m.strMarca || ''} ${m.strModelo || ''}`.toLowerCase();
            const strTaller = (m.strTaller || '').toLowerCase();
            const strTipo = (m.strTipoServicio || '').toLowerCase();
            const strEnc = (m.strEncargado || '').toLowerCase();
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
            ? '<span class="badge bg-success-subtle text-success border border-success-subtle px-2 py-1">Reporte Completo</span>'
            : '<span class="badge bg-warning-subtle text-warning border border-warning-subtle px-2 py-1">Ticket Incompleto</span>';

        const kmVal = Number(m.decKilometrajeActual ?? m.lngKilometrajeActual ?? 0);
        const fechaVal = formatFecha(m.dteFechaServicio || m.dteFechaInicio);

        return `
        <tr>
            <td>
                <div class="fw-bold">${escapeHtml(m.strMarca || 'â€”')} ${escapeHtml(m.strModelo || '')}</div>
            </td>
            <td>${escapeHtml(m.strTaller || 'â€”')}</td>
            <td>${escapeHtml(m.strTipoServicio || 'â€”')}</td>
            <td>${escapeHtml(m.strEncargado || 'â€”')}</td>
            <td>${fechaVal}</td>
            <td>${kmVal > 0 ? kmVal.toLocaleString('es-MX') + ' km' : 'â€”'}</td>
            <td><div class="fw-bold">$${Number(total || 0).toFixed(2)}</div></td>
            <td>${estadoBadge}</td>
            <td class="text-end">
                <div class="dropdown actions-dropdown d-inline-block">
                    <button class="btn-action-trigger btn-sm" type="button" data-bs-toggle="dropdown" data-bs-boundary="viewport" data-bs-popper-config='{"strategy":"fixed"}' aria-expanded="false">
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
}

async function eliminarIngresoTaller(id) {
    const confirm = await Swal.fire({
        icon: 'warning',
        title: 'Â¿Eliminar registro?',
        text: 'Esta acciÃ³n no se puede deshacer.',
        showCancelButton: true,
        confirmButtonText: 'SÃ­, eliminar',
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

/* â”€â”€â”€ Utilidades â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€ */
function poblarSelect(selectId, items, mapFn) {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    const current = sel.value;
    while (sel.options.length > 1) sel.remove(1);
    items.forEach(item => {
        const { value, text } = mapFn(item);
        const opt = new Option(text, value);
        sel.add(opt);
    });
    if (current) sel.value = current;
}

function formatFecha(val) {
    if (!val || val === '0001-01-01T00:00:00' || String(val).startsWith('0001-01-01')) return 'â€”';
    const d = new Date(val);
    if (isNaN(d) || d.getFullYear() <= 1900) return 'â€”';
    return d.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

/**
 * Formatea en tiempo real un input de tipo moneda, permitiendo solo un punto decimal
 * e insertando comas para separar los miles mientras el usuario escribe.
 * @param {HTMLInputElement} input - El elemento input a formatear.
 */
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





