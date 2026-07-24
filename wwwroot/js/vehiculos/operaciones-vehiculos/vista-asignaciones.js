"use strict";

// â”€â”€â”€ State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
// â”€â”€â”€ State â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
let listaVehiculosAsignacion = [];
let listaEmpleadosAsignacion = [];
let asignacionesActivas = [];
let listaMarcasVehiculos = [];
let editModeId = null;

// â”€â”€â”€ Init â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
document.addEventListener("DOMContentLoaded", () => {
    inicializarVistaAsignaciones();
});

function inicializarVistaAsignaciones() {
    const form = document.getElementById("asignacionVehiculoForm");
    if (!form) return;

    cargarCatalogosAsignacion();
    inicializarFechaAsignacion();
    inicializarFormatoKilometraje();

    // ValidaciÃ³n en tiempo real
    form.querySelectorAll("input:not([type='hidden']), select").forEach(campo => {
        ["input", "change"].forEach(evt => campo.addEventListener(evt, () => {
            const teniaError = campo.classList.contains("is-invalid");
            limpiarErrorCampo(campo);
            if (teniaError) validarCampoAsignacion(campo);
            actualizarVistaPreviaAsignacion();
        }));

        campo.addEventListener("blur", () => {
            if (!campo.readOnly && campo.tagName !== "SELECT") {
                campo.value = campo.value.trim();
            }
            if (campo.required || campo.value) {
                validarCampoAsignacion(campo);
            }
            actualizarVistaPreviaAsignacion();
        });
    });

    // Submit
    form.addEventListener("submit", async event => {
        event.preventDefault();

        if (!validarFormularioAsignacion(form)) {
            Swal.fire({
                icon: "warning",
                title: "Formulario incompleto",
                text: "Revisa los campos obligatorios antes de continuar.",
                confirmButtonColor: "var(--teal-cavex)"
            });
            return;
        }

        Swal.fire({
            title: editModeId ? "Actualizando asignaciÃ³n..." : "Registrando asignaciÃ³n...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        const parseKm = id => {
            const raw = document.getElementById(id)?.value || "0";
            return parseFloat(raw.replace(/,/g, "")) || 0;
        };

        const payload = {
            id: editModeId || 0,
            idVehDatosGenerales: parseInt(document.getElementById("asignacion-idVehDatosGenerales").value, 10),
            idEmpEmpleado: parseInt(document.getElementById("asignacion-idEmpEmpleado").value, 10),
            dteFechaAsigncion: document.getElementById("asignacion-dteFechaAsigncion").value,
            decKilometrajeInicial: parseKm("asignacion-decKilometrajeInicial"),
            decKilometrajeFinal: parseKm("asignacion-decKilometrajeFinal") || null,
            decKilometrajeTotal: parseKm("asignacion-decKilometrajeTotal") || null
        };

        try {
            const response = await fetch("/Asignaciones/SaveAsignacion", {
                method: "POST",
                headers: { "Accept": "application/json", "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const result = await response.json();
            Swal.close();

            if (!result.success) {
                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: result.message || "No fue posible guardar la asignaciÃ³n.",
                    confirmButtonColor: "var(--teal-cavex)"
                });
                return;
            }

            Swal.fire({
                icon: "success",
                title: editModeId ? "AsignaciÃ³n actualizada" : "AsignaciÃ³n registrada",
                text: result.message || "Guardado exitoso.",
                confirmButtonColor: "var(--teal-cavex)"
            }).then(() => {
                resetearFormularioAsignacion();
                cargarCatalogosAsignacion();
            });
        } catch (err) {
            Swal.close();
            Swal.fire({
                icon: "error",
                title: "Error de conexiÃ³n",
                text: "No se pudo establecer comunicaciÃ³n con el servidor.",
                confirmButtonColor: "var(--teal-cavex)"
            });
        }
    });

    actualizarVistaPreviaAsignacion();
}

// â”€â”€â”€ Carga de catÃ¡logos â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
async function cargarCatalogosAsignacion() {
    try {
        // Cargar vehÃ­culos, empleados, asignaciones y catÃ¡logos de marcas en paralelo
        const [vehRes, empRes, asigRes, catRes] = await Promise.all([
            obtenerVehiculosActivosDropdown(),
            fetch("/Empleado/GetEmpleadosDropdown").then(r => r.json()),
            fetch("/Asignaciones/GetAsignacionesActivas").then(r => r.json()).catch(() => ({ success: false })),
            fetch("/Vehiculos/GetVehiculoCatalogos").then(r => r.json()).catch(() => ({ success: false }))
        ]);

        // Guardar catÃ¡logos maestros completos para la tabla y vistas previas
        if (vehRes.success && vehRes.data) listaVehiculosAsignacion = vehRes.data.items || [];
        if (empRes.success && empRes.data) listaEmpleadosAsignacion = empRes.data;
        if (asigRes.success && asigRes.data) asignacionesActivas = asigRes.data;
        if (catRes.success && catRes.data && catRes.data.idVehCatMarcaVehiculo) {
            listaMarcasVehiculos = catRes.data.idVehCatMarcaVehiculo;
        }

        // Renderizar la tabla con la informaciÃ³n completa
        renderAsignacionesTable();

        // Poblar los dropdowns con unidades y choferes disponibles
        poblarDropdownVehiculos();
        poblarDropdownEmpleados();

        // Los dropdowns son convertidos automÃ¡ticamente por el componente global custom-select de CAVEX (site.js)

        // Eventos de vinculaciÃ³n bidireccional
        selectVeh?.addEventListener("change", () => {
            mostrarInfoVehiculo();
            vincularChoferDesdeVehiculo("asignacion-idVehDatosGenerales", "asignacion-idEmpEmpleado");
            actualizarVistaPreviaAsignacion();
        });

        selectEmp?.addEventListener("change", () => {
            mostrarInfoEmpleado();
            vincularVehiculoDesdeChofer("asignacion-idEmpEmpleado", "asignacion-idVehDatosGenerales");
            actualizarVistaPreviaAsignacion();
        });
    } catch (err) {
        console.error("Error al cargar catÃ¡logos de asignaciÃ³n:", err);
    }
}

// â”€â”€â”€ Fecha automÃ¡tica â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function inicializarFechaAsignacion() {
    const fechaInput = document.getElementById("asignacion-dteFechaAsigncion");
    const fechaVisual = document.getElementById("asignacionFechaVisual");
    if (!fechaInput) return;

    fechaInput.readOnly = true;
    fechaInput.style.backgroundColor = "#e9ecef";
    fechaInput.style.pointerEvents = "none";

    const hoy = new Date();
    const yyyy = hoy.getFullYear();
    const mm = String(hoy.getMonth() + 1).padStart(2, "0");
    const dd = String(hoy.getDate()).padStart(2, "0");
    fechaInput.value = `${yyyy}-${mm}-${dd}`;

    if (fechaVisual) {
        fechaVisual.textContent = hoy.toLocaleDateString("es-MX", { year: "numeric", month: "long", day: "numeric" });
    }
}

// â”€â”€â”€ Formato comas kilometraje â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function formatoConComas(valor) {
    const clean = String(valor).replace(/[^0-9]/g, "");
    if (!clean) return "";
    return Number(clean).toLocaleString("es-MX");
}

function inicializarFormatoKilometraje() {
    const kmInicial = document.getElementById("asignacion-decKilometrajeInicial");
    const kmFinal = document.getElementById("asignacion-decKilometrajeFinal");

    [kmInicial, kmFinal].forEach(input => {
        if (!input) return;
        input.addEventListener("input", () => {
            const cursorPos = input.selectionStart;
            const originalLen = input.value.length;
            input.value = formatoConComas(input.value);
            const newLen = input.value.length;
            const diff = newLen - originalLen;
            input.setSelectionRange(cursorPos + diff, cursorPos + diff);
            calcularKilometrajeTotal();
            actualizarVistaPreviaAsignacion();
        });
    });
}

function calcularKilometrajeTotal() {
    const rawInicial = (document.getElementById("asignacion-decKilometrajeInicial")?.value || "0").replace(/,/g, "");
    const rawFinal = (document.getElementById("asignacion-decKilometrajeFinal")?.value || "0").replace(/,/g, "");
    const inicial = parseFloat(rawInicial) || 0;
    const final = parseFloat(rawFinal) || 0;
    const totalInput = document.getElementById("asignacion-decKilometrajeTotal");

    if (final > 0 && final >= inicial) {
        const total = final - inicial;
        if (totalInput) totalInput.value = formatoConComas(String(total));
    } else {
        if (totalInput) totalInput.value = "";
    }
}

// Controla la bandera de vinculaciÃ³n activa para prevenir loops infinitos
let isVinculandoAsignacion = false;

function vincularChoferDesdeVehiculo(vehSelectId, empSelectId) {
    if (isVinculandoAsignacion) return;
    isVinculandoAsignacion = true;
    try {
        const vehSelect = document.getElementById(vehSelectId);
        const empSelect = document.getElementById(empSelectId);
        if (!vehSelect || !empSelect || !asignacionesActivas || !asignacionesActivas.length) return;

        const vehId = parseInt(vehSelect.value, 10);
        if (!vehId) return;

        const asignacion = asignacionesActivas.find(a => a.idVehDatosGenerales === vehId);
        if (asignacion && empSelect.value !== String(asignacion.idEmpEmpleado)) {
            empSelect.value = String(asignacion.idEmpEmpleado);
            empSelect.dispatchEvent(new Event("change", { bubbles: true }));
        }
    } finally {
        isVinculandoAsignacion = false;
    }
}

function vincularVehiculoDesdeChofer(empSelectId, vehSelectId) {
    if (isVinculandoAsignacion) return;
    isVinculandoAsignacion = true;
    try {
        const empSelect = document.getElementById(empSelectId);
        const vehSelect = document.getElementById(vehSelectId);
        if (!empSelect || !vehSelect || !asignacionesActivas || !asignacionesActivas.length) return;

        const empId = parseInt(empSelect.value, 10);
        if (!empId) return;

        const asignacion = asignacionesActivas.find(a => a.idEmpEmpleado === empId);
        if (asignacion && vehSelect.value !== String(asignacion.idVehDatosGenerales)) {
            vehSelect.value = String(asignacion.idVehDatosGenerales);
            vehSelect.dispatchEvent(new Event("change", { bubbles: true }));
        }
    } finally {
        isVinculandoAsignacion = false;
    }
}

// â”€â”€â”€ Info Cards â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function mostrarInfoVehiculo() {
    // No longer displaying vehicle mini-card details
}

function mostrarInfoEmpleado() {
    // No longer displaying employee mini-card details
}

// â”€â”€â”€ Vista previa lateral â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function actualizarVistaPreviaAsignacion() {
    const vehId = parseInt(document.getElementById("asignacion-idVehDatosGenerales")?.value, 10);
    const empId = parseInt(document.getElementById("asignacion-idEmpEmpleado")?.value, 10);

    const v = listaVehiculosAsignacion.find(v => Number(v.id ?? v.Id) === vehId);
    const e = listaEmpleadosAsignacion.find(e => Number(e.id ?? e.Id) === empId);

    setText("previewAsignacionVehiculo", v ? `${v.strModelo || v.StrModelo || "Vehiculo"} (${v.intAnio || v.IntAnio || ""})` : "Sin seleccionar");
    setText("previewAsignacionPlaca", v ? (v.strPlaca || v.StrPlaca || "-") : "-");

    if (e) {
        const nombre = `${e.strNombre || e.StrNombre || ""} ${e.strApellidoPaterno || e.StrApellidoPaterno || ""} ${e.strApellidoMaterno || e.StrApellidoMaterno || ""}`.trim();
        setText("previewAsignacionEmpleado", nombre || "Sin seleccionar");
        setText("previewAsignacionArea", e.strAreaLaboral || e.StrAreaLaboral || e.empAreaLaboral?.strNombre || "-");
    } else {
        setText("previewAsignacionEmpleado", "Sin seleccionar");
        setText("previewAsignacionArea", "-");
    }

    const fecha = document.getElementById("asignacion-dteFechaAsigncion")?.value;
    setText("previewAsignacionFecha", fecha ? new Date(fecha + "T00:00:00").toLocaleDateString("es-MX", { year: "numeric", month: "short", day: "numeric" }) : "-");

    const kmInicial = (document.getElementById("asignacion-decKilometrajeInicial")?.value || "0").replace(/,/g, "");
    const kmFinal = (document.getElementById("asignacion-decKilometrajeFinal")?.value || "").replace(/,/g, "");
    const kmTotal = (document.getElementById("asignacion-decKilometrajeTotal")?.value || "0").replace(/,/g, "");

    setText("previewAsignacionKmInicial", (parseFloat(kmInicial) || 0).toLocaleString("es-MX") + " km");
    setText("previewAsignacionKmFinal", kmFinal ? parseFloat(kmFinal).toLocaleString("es-MX") + " km" : "Sin capturar");
    setText("previewAsignacionKmTotal", (parseFloat(kmTotal) || 0).toLocaleString("es-MX") + " km");
}

// â”€â”€â”€ ValidaciÃ³n â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function validarFormularioAsignacion(form) {
    const ids = ["asignacion-idVehDatosGenerales", "asignacion-idEmpEmpleado", "asignacion-decKilometrajeInicial"];
    let valido = true;
    ids.forEach(id => {
        const campo = document.getElementById(id);
        if (campo && !validarCampoAsignacion(campo)) valido = false;
    });

    const primerError = form.querySelector(".is-invalid");
    if (primerError) {
        primerError.scrollIntoView({ behavior: "smooth", block: "center" });
    }
    return valido;
}

function validarCampoAsignacion(campo) {
    const valor = String(campo.value || "").trim();
    let mensaje = "";

    if (campo.required && !valor) {
        mensaje = campo.tagName === "SELECT" ? "Selecciona una opciÃ³n." : "Este campo es obligatorio.";
    }

    if (!mensaje && valor && campo.id.includes("Kilometraje") && !campo.readOnly) {
        const num = parseFloat(valor.replace(/,/g, ""));
        if (isNaN(num) || num < 0) mensaje = "Captura un kilometraje vÃ¡lido.";
    }

    if (mensaje) {
        campo.classList.remove("is-valid");
        campo.classList.add("is-invalid");
        const error = document.getElementById(`${campo.id}Error`);
        if (error) {
            error.textContent = mensaje;
            error.classList.remove("d-none");
            error.classList.add("d-block");
        }
        return false;
    }

    limpiarErrorCampo(campo);
    if (valor && !campo.readOnly) campo.classList.add("is-valid");
    return true;
}

// â”€â”€â”€ Helpers â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
function setText(id, value) {
    const el = document.getElementById(id);
    if (el) el.textContent = value;
}

function limpiarErrorCampo(campo) {
    campo.classList.remove("is-invalid", "is-valid");
    campo.removeAttribute("aria-invalid");
    const error = document.getElementById(`${campo.id}Error`);
    if (error) {
        error.textContent = "";
        error.classList.remove("d-block");
        error.classList.add("d-none");
    }
}

function obtenerNombreMarca(v) {
    if (!v) return "-";
    if (v.strVehCatMarcaVehiculo && v.strVehCatMarcaVehiculo !== "-") return v.strVehCatMarcaVehiculo;
    if (v.StrVehCatMarcaVehiculo && v.StrVehCatMarcaVehiculo !== "-") return v.StrVehCatMarcaVehiculo;
    if (v.strMarca && v.strMarca !== "-") return v.strMarca;
    if (v.StrMarca && v.StrMarca !== "-") return v.StrMarca;
    if (v.strMarcaVehiculo && v.strMarcaVehiculo !== "-") return v.strMarcaVehiculo;
    if (v.StrMarcaVehiculo && v.StrMarcaVehiculo !== "-") return v.StrMarcaVehiculo;
    if (v.idVehCatMarcaVehiculo && listaMarcasVehiculos.length > 0) {
        const m = listaMarcasVehiculos.find(item => Number(item.id ?? item.Id) === Number(v.idVehCatMarcaVehiculo));
        if (m && (m.strValor || m.StrValor || m.nombre)) return m.strValor || m.StrValor || m.nombre;
    }
    return "-";
}

// Dibuja la tabla de asignaciones de vehÃ­culos en pantalla
function renderAsignacionesTable() {
    const tbody = document.getElementById("asignacionesTableBody");
    if (!tbody) return;

    // Si la lista estÃ¡ vacÃ­a, mostramos un renglÃ³n informativo con colspan 6
    if (!asignacionesActivas || asignacionesActivas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No se encontraron asignaciones registradas.</td></tr>';
        return;
    }

    // Mapeamos cada asignaciÃ³n a un renglÃ³n (tr) de la tabla
    tbody.innerHTML = asignacionesActivas.map(a => {
        // Buscamos los datos completos del vehÃ­culo vinculado
        const v = listaVehiculosAsignacion.find(veh => Number(veh.id) === Number(a.idVehDatosGenerales));
        let marca = v ? obtenerNombreMarca(v) : "â€”";
        if (marca === "â€”" && a.strVehDatosGenerales) {
            const parts = a.strVehDatosGenerales.split(/[Â·\-]/);
            if (parts.length > 0 && parts[0].trim()) marca = parts[0].trim();
        }
        const modelo = v ? (v.strModelo || "â€”") : (a.strVehDatosGenerales || "â€”");
        const anio = v ? String(v.intAnio || "â€”") : "â€”";
        const placa = v ? (v.strPlaca || "â€”") : "â€”";
        
        // Buscamos los datos completos del empleado vinculado
        const emp = listaEmpleadosAsignacion.find(e => Number(e.id) === Number(a.idEmpEmpleado));
        const empleadoName = emp ? (emp.strNombre + " " + emp.strApellidoPaterno + (emp.strApellidoMaterno ? " " + emp.strApellidoMaterno : "")).trim() : (a.strEmpEmpleado || "â€”");

        // Construimos el HTML del renglÃ³n con las 6 columnas solicitadas
        return `
            <tr>
                <td>${escapeHtml(marca)}</td>
                <td>${escapeHtml(modelo)}</td>
                <td>${escapeHtml(anio)}</td>
                <td><span class="badge bg-light text-dark border">${escapeHtml(placa)}</span></td>
                <td>${escapeHtml(empleadoName)}</td>
                <td class="text-end">
                    <!-- BotÃ³n de Acciones dropdown estÃ¡ndar -->
                    <div class="dropdown actions-dropdown d-inline-block">
                        <button class="btn-action-trigger btn-sm" type="button" data-bs-toggle="dropdown" data-bs-boundary="viewport" aria-expanded="false">
                            <span>Acciones</span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li>
                                <button class="dropdown-item d-flex align-items-center" type="button" onclick="verDetalleAsignacion(${a.id})">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 text-info"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                    Ver detalles
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item d-flex align-items-center" type="button" onclick="editarAsignacion(${a.id})">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 text-primary"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    Editar
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item d-flex align-items-center text-danger" type="button" onclick="eliminarAsignacion(${a.id})">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 text-danger"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                    Eliminar
                                </button>
                            </li>
                        </ul>
                    </div>
                </td>
            </tr>
        `;
    }).join("");

    // Inicializamos dinÃ¡micamente cada trigger de dropdown mediante Bootstrap Popper
    tbody.querySelectorAll('.btn-action-trigger').forEach(el => {
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

function verDetalleAsignacion(id) {
    const a = asignacionesActivas.find(item => item.id === id);
    if (!a) return;

    const v = listaVehiculosAsignacion.find(veh => veh.id === a.idVehDatosGenerales);
    const emp = listaEmpleadosAsignacion.find(e => e.id === a.idEmpEmpleado);
    const empleadoName = emp ? (emp.strNombre + " " + emp.strApellidoPaterno + (emp.strApellidoMaterno ? " " + emp.strApellidoMaterno : "")) : (a.strEmpEmpleado || "Desconocido");
    const marcaNombre = obtenerNombreMarca(v);

    Swal.fire({
        title: "Detalle de AsignaciÃ³n",
        html: `
            <div class="text-start fs-6" style="line-height: 1.6;">
                <p><strong>Marca:</strong> ${marcaNombre}</p>
                <p><strong>VehÃ­culo:</strong> ${v ? `${v.strModelo} (${v.intAnio})` : "Desconocido"}</p>
                <p><strong>Placa:</strong> ${v ? v.strPlaca : "â€”"}</p>
                <p><strong>Empleado Responsable:</strong> ${empleadoName}</p>
                <p><strong>Fecha de AsignaciÃ³n:</strong> ${a.dteFechaAsigncion ? new Date(a.dteFechaAsigncion).toLocaleDateString("es-MX") : "â€”"}</p>
                <p><strong>Kilometraje Inicial:</strong> ${Number(a.decKilometrajeInicial).toLocaleString("es-MX")} km</p>
                <p><strong>Kilometraje Final:</strong> ${a.decKilometrajeFinal ? Number(a.decKilometrajeFinal).toLocaleString("es-MX") + " km" : "Sin cerrar"}</p>
                <p><strong>Kilometraje Total Recorrido:</strong> ${a.decKilometrajeTotal ? Number(a.decKilometrajeTotal).toLocaleString("es-MX") + " km" : "En curso"}</p>
            </div>
        `,
        confirmButtonColor: "var(--teal-cavex)"
    });
}

function poblarDropdownVehiculos(currentVehId = null) {
    const selectVeh = document.getElementById("asignacion-idVehDatosGenerales");
    if (!selectVeh || !listaVehiculosAsignacion) return;

    const vehIdAsignados = new Set(
        (asignacionesActivas || [])
            .map(a => Number(a.idVehDatosGenerales ?? a.IdVehDatosGenerales))
            .filter(id => !isNaN(id) && id > 0)
    );

    selectVeh.innerHTML = '<option value="">Seleccionar vehiculo disponible...</option>';
    let totalDisponibles = 0;

    listaVehiculosAsignacion.forEach(v => {
        const vId = Number(v.id ?? v.Id);
        const isAssigned = vehIdAsignados.has(vId);
        const isCurrentSelected = currentVehId && vId === Number(currentVehId);

        if (!isAssigned || isCurrentSelected) {
            const opt = document.createElement("option");
            opt.value = String(vId);
            const marcaNombre = obtenerNombreMarca(v);
            const marcaDisplay = marcaNombre !== "-" ? marcaNombre + " " : "";
            opt.textContent = `${v.strPlaca || v.StrPlaca || "-"} - ${marcaDisplay}${v.strModelo || v.StrModelo || ""} (${v.intAnio || v.IntAnio || ""})`.trim();
            selectVeh.appendChild(opt);
            totalDisponibles += 1;
        }
    });

    if (totalDisponibles === 0) {
        const opt = document.createElement("option");
        opt.value = "__no_disponibles";
        opt.textContent = "No hay vehiculos disponibles";
        opt.disabled = true;
        selectVeh.appendChild(opt);
    }

    selectVeh.addEventListener("change", () => {
        const vId = Number(selectVeh.value);
        const v = listaVehiculosAsignacion.find(veh => Number(veh.id ?? veh.Id) === vId);
        const kmInicialInput = document.getElementById("asignacion-decKilometrajeInicial");
        if (kmInicialInput) {
            if (v && (v.decKilometrajeActual != null || v.DecKilometrajeActual != null)) {
                const km = v.decKilometrajeActual ?? v.DecKilometrajeActual;
                kmInicialInput.value = formatoConComas(km);
                kmInicialInput.readOnly = true;
                kmInicialInput.style.backgroundColor = "#e9ecef";
            } else {
                kmInicialInput.readOnly = false;
                kmInicialInput.style.backgroundColor = "";
            }
        }
    });
}

function poblarDropdownEmpleados(currentEmpId = null) {
    const selectEmp = document.getElementById("asignacion-idEmpEmpleado");
    if (!selectEmp || !listaEmpleadosAsignacion) return;

    const empIdAsignados = new Set(
        (asignacionesActivas || [])
            .map(a => Number(a.idEmpEmpleado ?? a.IdEmpEmpleado))
            .filter(id => !isNaN(id) && id > 0)
    );

    selectEmp.innerHTML = '<option value="">Seleccionar chofer disponible...</option>';
    listaEmpleadosAsignacion.forEach(e => {
        const eId = Number(e.id ?? e.Id);
        const isAssigned = empIdAsignados.has(eId);
        const isCurrentSelected = currentEmpId && eId === Number(currentEmpId);

        if (!isAssigned || isCurrentSelected) {
            const opt = document.createElement("option");
            opt.value = String(eId);
            const nom = e.strNombre || e.StrNombre || '';
            const pat = e.strApellidoPaterno || e.StrApellidoPaterno || '';
            const mat = e.strApellidoMaterno || e.StrApellidoMaterno || '';
            const nombre = `${nom} ${pat} ${mat}`.trim();
            opt.textContent = nombre;
            selectEmp.appendChild(opt);
        }
    });
    selectEmp.dispatchEvent(new Event("change", { bubbles: true }));
}

function editarAsignacion(id) {
    const a = asignacionesActivas.find(item => item.id === id);
    if (!a) return;

    editModeId = id;

    // Repoblar los dropdowns permitiendo el vehÃ­culo y chofer asignados a esta asignaciÃ³n que se edita
    poblarDropdownVehiculos(a.idVehDatosGenerales);
    poblarDropdownEmpleados(a.idEmpEmpleado);

    const selectVeh = document.getElementById("asignacion-idVehDatosGenerales");
    const selectEmp = document.getElementById("asignacion-idEmpEmpleado");
    if (selectVeh) {
        selectVeh.value = String(a.idVehDatosGenerales);
        selectVeh.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (selectEmp) {
        selectEmp.value = String(a.idEmpEmpleado);
        selectEmp.dispatchEvent(new Event("change", { bubbles: true }));
    }
    
    if (a.dteFechaAsigncion) {
        document.getElementById("asignacion-dteFechaAsigncion").value = a.dteFechaAsigncion.split("T")[0];
    }
    
    document.getElementById("asignacion-decKilometrajeInicial").value = formatoConComas(a.decKilometrajeInicial);
    document.getElementById("asignacion-decKilometrajeFinal").value = a.decKilometrajeFinal ? formatoConComas(a.decKilometrajeFinal) : "";
    document.getElementById("asignacion-decKilometrajeTotal").value = a.decKilometrajeTotal ? formatoConComas(a.decKilometrajeTotal) : "";

    actualizarVistaPreviaAsignacion();
    document.getElementById("asignacionVehiculoForm").scrollIntoView({ behavior: "smooth" });
}

function eliminarAsignacion(id) {
    Swal.fire({
        title: "Â¿EstÃ¡s seguro?",
        text: "Esta asignaciÃ³n de vehÃ­culo serÃ¡ eliminada permanentemente.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "SÃ­, eliminar",
        cancelButtonText: "Cancelar"
    }).then(async (result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: "Eliminando...",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });
            try {
                const response = await fetch(`/Asignaciones/DeleteAsignacion/${id}`, { method: "POST" });
                const res = await response.json();
                Swal.close();
                if (res.success) {
                    Swal.fire("Eliminado", "La asignaciÃ³n ha sido eliminada.", "success");
                    cargarCatalogosAsignacion();
                } else {
                    Swal.fire("Error", res.message || "No se pudo eliminar la asignaciÃ³n.", "error");
                }
            } catch (err) {
                Swal.close();
                Swal.fire("Error", "Error de red al intentar eliminar.", "error");
            }
        }
    });
}

function resetearFormularioAsignacion() {
    editModeId = null;
    poblarDropdownVehiculos();
    poblarDropdownEmpleados();

    const form = document.getElementById("asignacionVehiculoForm");
    if (form) {
        form.reset();
        form.querySelectorAll(".is-valid, .is-invalid").forEach(el => el.classList.remove("is-valid", "is-invalid"));
    }
    inicializarFechaAsignacion();
    actualizarVistaPreviaAsignacion();
}

function escapeHtml(text) {
    return String(text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}





