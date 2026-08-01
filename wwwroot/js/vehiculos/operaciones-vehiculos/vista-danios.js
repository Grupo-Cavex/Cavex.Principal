"use strict";

let listaDanios = [];
let editModeDanioId = null;
let listaSegurosDanios = [];
// Archivos y evidencias seleccionadas globalmente para daños (declaradas en ámbito global)
let archivosEvidenciaSeleccionados = [];
let evidenciasExistentes = [];

// Inicializador de eventos al cargar el DOM de la vista de daños y accidentes
document.addEventListener("DOMContentLoaded", () => {
    inicializarVistaDanios();
});

// Configura los eventos iniciales, validaciones en tiempo real y el envío simulado del formulario
function inicializarVistaDanios() {
    const form = document.getElementById("danioAccidenteForm");
    if (!form) return;

    cargarCatalogosDanios();
    inicializarSwitchSeguro();
    inicializarCargaEvidencia();
    inicializarContadorObservaciones();

    const montoRep = document.getElementById("danio-mnyMontoReparacion");
    if (montoRep) {
        montoRep.addEventListener("input", () => formatCurrencyInput(montoRep));
    }

    // Eventos de validación en tiempo real para todos los inputs
    form.querySelectorAll("input:not([type='file']):not([type='hidden']), select, textarea").forEach(campo => {
        ["input", "change"].forEach(evento => campo.addEventListener(evento, () => {
            const teniaError = campo.classList.contains("is-invalid");
            limpiarErrorCampo(campo);
            if (teniaError) validarCampoDanio(campo);
        }));

        campo.addEventListener("blur", () => {
            if (campo.type !== "number" && campo.tagName !== "SELECT" && !campo.readOnly) {
                campo.value = campo.value.trim().replace(/\s{2,}/g, " ");
            }
            if (campo.required || campo.value) {
                validarCampoDanio(campo);
            }
        });
    });



    form.addEventListener("submit", async event => {
        event.preventDefault();
        if (!validarFormularioDanio(form)) {
            Swal.fire({
                icon: "warning",
                title: "Formulario incompleto",
                text: "Revisa los campos obligatorios antes de continuar.",
                confirmButtonColor: "var(--teal-cavex)"
            });
            return;
        }

        Swal.fire({
            title: "Registrando daño/accidente...",
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const statusVal = parseInt(document.getElementById("danio-idVehCatStatus").value, 10);
        const seguroInput = document.getElementById("danio-idVehSeguro").value;
        const ubicacionVal = document.getElementById("danio-strUbicacion") ? document.getElementById("danio-strUbicacion").value.trim() : "";
        const tieneEvidencias = (typeof evidenciasExistentes !== "undefined" && evidenciasExistentes.length > 0) ||
            (typeof archivosEvidenciaSeleccionados !== "undefined" && archivosEvidenciaSeleccionados.length > 0);

        // Construir FormData igual que en la creación de vehículos
        const formData = new FormData();
        formData.append("Id", editModeDanioId || 0);
        formData.append("IdVehDatosGenerales", parseInt(document.getElementById("danio-idVehDatosGenerales").value, 10));
        formData.append("IdEmpEmpleado", parseInt(document.getElementById("danio-idEmpEmpleado").value, 10));
        formData.append("DteFechaEvento", document.getElementById("danio-dteFechaEvento").value);
        formData.append("StrDescripcion", document.getElementById("danio-strDescripcion").value);
        formData.append("StrUbicacion", document.getElementById("danio-strUbicacion").value || "");
        formData.append("BitCubiertoPorSeguro", document.getElementById("danio-bitCubiertoPorSeguro").value === "true");
        
        if (seguroInput) {
            formData.append("IdVehSeguro", parseInt(seguroInput, 10));
        }
        
        formData.append("IdVehCatStatus", statusVal);
        formData.append("StrObservaciones", document.getElementById("danio-strObservaciones").value || "");
        
        // Conservar las evidencias anteriores separadas por punto y coma
        formData.append("StrUrlEvidencia", evidenciasExistentes.join(";"));
        
        // Adjuntar los archivos nuevos seleccionados
        archivosEvidenciaSeleccionados.forEach(file => {
            formData.append("EvidenciaArchivos", file);
        });

        try {
            const response = await fetch("/Danios/SaveDanio", {
                method: "POST",
                body: formData
            });

            const result = await response.json();
            Swal.close();

            if (!result.success) {
                Swal.fire({
                    icon: "error",
                    title: "Error al registrar",
                    text: result.message || "No fue posible registrar el daño/accidente.",
                    confirmButtonColor: "var(--teal-cavex)"
                });
                return;
            }

            Swal.fire({
                icon: "success",
                title: editModeDanioId ? "Evento actualizado" : "Evento registrado",
                text: editModeDanioId ? "Los datos del daño/accidente han sido actualizados exitosamente." : "Los datos del daño/accidente han sido registrados exitosamente.",
                confirmButtonColor: "var(--teal-cavex)"
            }).then(() => {
                resetearFormularioDanio();
                cargarDaniosList();
            });
        } catch (err) {
            Swal.close();
            Swal.fire({
                icon: "error",
                title: "Error de conexión",
                text: "No se pudo establecer comunicación con el servidor. ¡Intenta de nuevo!",
                confirmButtonColor: "var(--teal-cavex)"
            });
        }
    });
}

// Datos globales para vinculación vehículo-chofer
let listaVehiculosDanios = [];
let listaEmpleadosDanios = [];
let asignacionesActivasDanios = [];

// Carga asíncronamente los catálogos de vehículos, empleados y pólizas de seguro
async function cargarCatalogosDanios() {
    try {
        const [vehRes, empRes, asigRes, segRes] = await Promise.all([
            fetch("/Vehiculos/GetVehiculos").then(r => r.json()),
            fetch("/Empleado/GetEmpleadosDropdown").then(r => r.json()),
            fetch("/Asignaciones/GetAsignacionesActivas").then(r => r.json()).catch(() => ({ success: false })),
            fetch("/Seguros/GetSeguros").then(r => r.json()).catch(() => ({ success: false }))
        ]);

        if (asigRes.success && asigRes.data) {
            asignacionesActivasDanios = asigRes.data;
        }

        if (segRes.success && segRes.data) {
            listaSegurosDanios = segRes.data;
        }

        const vehIdAsignados = new Set(
            (asignacionesActivasDanios || [])
                .map(a => Number(a.idVehDatosGenerales ?? a.IdVehDatosGenerales))
                .filter(id => !isNaN(id) && id > 0)
        );

        const empIdAsignados = new Set(
            (asignacionesActivasDanios || [])
                .map(a => Number(a.idEmpEmpleado ?? a.IdEmpEmpleado))
                .filter(id => !isNaN(id) && id > 0)
        );

        // 1. Cargar solo vehículos asignados
        const selectVeh = document.getElementById("danio-idVehDatosGenerales");
        if (selectVeh && vehRes.success && vehRes.data) {
            listaVehiculosDanios = vehRes.data;
            selectVeh.innerHTML = '<option value="">Seleccionar vehículo asignado...</option>';
            vehRes.data.forEach(v => {
                const vId = Number(v.id ?? v.Id);
                if (vehIdAsignados.has(vId)) {
                    const opt = document.createElement("option");
                    opt.value = String(vId);
                    opt.textContent = `${v.strPlaca || v.StrPlaca} - ${v.strModelo || v.StrModelo} (${v.intAnio || v.IntAnio})`;
                    selectVeh.appendChild(opt);
                }
            });
        }

        // 2. Cargar solo empleados asignados
        const selectEmp = document.getElementById("danio-idEmpEmpleado");
        if (selectEmp && empRes.success && empRes.data) {
            listaEmpleadosDanios = empRes.data;
            selectEmp.innerHTML = '<option value="">Seleccionar chofer asignado...</option>';
            empRes.data.forEach(e => {
                const eId = Number(e.id ?? e.Id);
                if (empIdAsignados.has(eId)) {
                    const opt = document.createElement("option");
                    opt.value = String(eId);
                    const nom = e.strNombre || e.StrNombre || '';
                    const pat = e.strApellidoPaterno || e.StrApellidoPaterno || '';
                    const mat = e.strApellidoMaterno || e.StrApellidoMaterno || '';
                    const nombreCompleto = `${nom} ${pat} ${mat}`.trim();
                    opt.textContent = nombreCompleto;
                    selectEmp.appendChild(opt);
                }
            });
        }

        // Vinculación bidireccional segura
        let isVinculandoDanio = false;

        selectVeh?.addEventListener("change", () => {
            if (isVinculandoDanio) return;
            isVinculandoDanio = true;
            try {
                const vehId = parseInt(selectVeh.value, 10);
                if (document.getElementById("danioSeguroSwitch")?.checked) {
                    poblarDropdownSeguros(vehId);
                }

                if (editModeDanioId === null) {
                    if (vehId) {
                        const asig = asignacionesActivasDanios.find(a => a.idVehDatosGenerales === vehId);
                        if (asig && selectEmp) {
                            if (selectEmp.value !== String(asig.idEmpEmpleado)) {
                                selectEmp.value = String(asig.idEmpEmpleado);
                                selectEmp.dispatchEvent(new Event("change", { bubbles: true }));
                            }
                            selectEmp.disabled = true;
                        } else if (selectEmp) {
                            selectEmp.disabled = false;
                        }
                    } else if (selectEmp) {
                        if (selectEmp.value !== "") {
                            selectEmp.value = "";
                            selectEmp.dispatchEvent(new Event("change", { bubbles: true }));
                        }
                        selectEmp.disabled = false;
                    }
                } else {
                    const asig = asignacionesActivasDanios.find(a => a.idVehDatosGenerales === vehId);
                    if (asig && selectEmp) {
                        if (selectEmp.value !== String(asig.idEmpEmpleado)) {
                            selectEmp.value = String(asig.idEmpEmpleado);
                            selectEmp.dispatchEvent(new Event("change", { bubbles: true }));
                        }
                    }
                }
            } finally {
                isVinculandoDanio = false;
            }
        });

        selectEmp?.addEventListener("change", () => {
            if (isVinculandoDanio) return;
            isVinculandoDanio = true;
            try {
                const empId = parseInt(selectEmp.value, 10);
                if (editModeDanioId === null) {
                    if (empId) {
                        const asig = asignacionesActivasDanios.find(a => a.idEmpEmpleado === empId);
                        if (asig && selectVeh) {
                            if (selectVeh.value !== String(asig.idVehDatosGenerales)) {
                                selectVeh.value = String(asig.idVehDatosGenerales);
                                selectVeh.dispatchEvent(new Event("change", { bubbles: true }));
                            }
                            selectVeh.disabled = true;
                        } else if (selectVeh) {
                            selectVeh.disabled = false;
                        }
                    } else if (selectVeh) {
                        if (selectVeh.value !== "") {
                            selectVeh.value = "";
                            selectVeh.dispatchEvent(new Event("change", { bubbles: true }));
                        }
                        selectVeh.disabled = false;
                    }
                } else {
                    const asig = asignacionesActivasDanios.find(a => a.idEmpEmpleado === empId);
                    if (asig && selectVeh) {
                        if (selectVeh.value !== String(asig.idVehDatosGenerales)) {
                            selectVeh.value = String(asig.idVehDatosGenerales);
                            selectVeh.dispatchEvent(new Event("change", { bubbles: true }));
                        }
                    }
                }
            } finally {
                isVinculandoDanio = false;
            }
        });
    } catch (err) {
        console.error("Error al cargar catálogos de daños:", err);
    }

    // 3. Cargar estatus de la vista
    fetch("/Vehiculos/GetVehiculoCatalogos")
        .then(res => res.json())
        .then(result => {
            const selectStatus = document.getElementById("danio-idVehCatStatus");
            if (selectStatus && result.success && result.data && result.data.idVehCatStatus) {
                selectStatus.innerHTML = '<option value="">Seleccionar...</option>';
                result.data.idVehCatStatus.forEach(status => {
                    const opt = document.createElement("option");
                    opt.value = String(status.id);
                    opt.textContent = status.strValor || status.strDescripcion;
                    selectStatus.appendChild(opt);
                });
            }
            cargarDaniosList();
        })
        .catch(err => console.error("Error al cargar catálogos:", err));
}

// Pobla el selector de pólizas a partir de la lista de VehSeguro
function poblarDropdownSeguros(vehId = null) {
    const select = document.getElementById("danio-idVehSeguro");
    if (!select) return;

    select.innerHTML = '<option value="">Seleccionar póliza...</option>';

    let segurosFiltrados = listaSegurosDanios || [];
    if (vehId) {
        segurosFiltrados = segurosFiltrados.filter(s => Number(s.idVehDatosGenerales ?? s.IdVehDatosGenerales) === Number(vehId));
    }

    if (segurosFiltrados.length === 0) {
        select.innerHTML = '<option value="">Sin pólizas registradas</option>';
        return;
    }

    segurosFiltrados.forEach(s => {
        const opt = document.createElement("option");
        opt.value = String(s.id ?? s.Id);
        const asegNombre = s.strVehCatAseguradora || s.StrVehCatAseguradora || "Aseguradora";
        const numPoliza = s.strNumeroPoliza || s.StrNumeroPoliza || "S/N";
        opt.textContent = `${asegNombre} - Póliza: ${numPoliza}`;
        select.appendChild(opt);
    });
}

// Configura el switch para habilitar/deshabilitar de forma condicional el selector de pólizas
function inicializarSwitchSeguro() {
    const sw = document.getElementById("danioSeguroSwitch");
    const label = document.getElementById("danioSeguroSwitchLabel");
    const hidden = document.getElementById("danio-bitCubiertoPorSeguro");
    const select = document.getElementById("danio-idVehSeguro");

    if (!sw || !select) return;

    sw.addEventListener("change", () => {
        const cubierto = sw.checked;
        if (label) label.textContent = cubierto ? "Sí" : "No";
        if (hidden) hidden.value = cubierto ? "true" : "false";

        if (cubierto) {
            select.disabled = false;
            select.required = true;
            const vehId = document.getElementById("danio-idVehDatosGenerales")?.value;
            poblarDropdownSeguros(vehId);
        } else {
            select.disabled = true;
            select.required = false;
            select.value = "";
            select.innerHTML = '<option value="">No aplica</option>';
            limpiarErrorCampo(select);
        }
    });
}

// Inicializa el drag and drop (arrastrar y soltar) y selección manual de los archivos de evidencia del accidente
function inicializarCargaEvidencia() {
    const area = document.getElementById("danioEvidenciaArea");
    const input = document.getElementById("danioEvidenciaArchivo");
    if (!area || !input) return;

    input.addEventListener("click", event => {
        event.stopPropagation();
    });
    area.addEventListener("click", event => {
        if (!event.target.closest(".vehiculo-file-actions button")) input.click();
    });

    area.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            input.click();
        }
    });

    // Cambia la clase visual al arrastrar archivos
    area.addEventListener("dragenter", event => {
        event.preventDefault();
        event.stopPropagation();
        area.classList.add("is-drag-over");
    });

    area.addEventListener("dragover", event => {
        event.preventDefault();
        event.stopPropagation();
        area.classList.add("is-drag-over");
    });

    area.addEventListener("dragleave", event => {
        event.preventDefault();
        event.stopPropagation();
        area.classList.remove("is-drag-over");
    });

    // Procesa los archivos al soltarlos
    area.addEventListener("drop", event => {
        event.preventDefault();
        event.stopPropagation();
        area.classList.remove("is-drag-over");
        if (event.dataTransfer.files && event.dataTransfer.files.length > 0) {
            procesarArchivosEvidencia(event.dataTransfer.files);
        }
    });

    // Procesa los archivos al seleccionarlos manualmente
    input.addEventListener("change", () => {
        if (input.files && input.files.length > 0) {
            procesarArchivosEvidencia(input.files);
            input.value = ""; // Limpiar input para permitir seleccionar el mismo archivo
        }
    });
}

// Valida y añade múltiples archivos de evidencia
function procesarArchivosEvidencia(files) {
    const limBytes = 5 * 1024 * 1024;
    const extensionesPermitidas = ["jpg", "jpeg", "png", "webp", "pdf"];

    limpiarErrorEvidencia();

    for (let i = 0; i < files.length; i++) {
        const file = files[i];
        const ext = file.name.split('.').pop().toLowerCase();
        if (!extensionesPermitidas.includes(ext)) {
            mostrarErrorEvidencia(`El archivo "${file.name}" debe ser PDF, JPG, PNG o WEBP.`);
            return;
        }
        if (file.size > limBytes) {
            mostrarErrorEvidencia(`El archivo "${file.name}" supera el límite de 5 MB.`);
            return;
        }
        
        // Evitar duplicados por nombre y tamaño
        if (!archivosEvidenciaSeleccionados.some(f => f.name === file.name && f.size === file.size)) {
            archivosEvidenciaSeleccionados.push(file);
        }
    }

    // Sincronizar archivosEvidenciaSeleccionados con el input.files nativo (estilo Nuevo Empleado)
    const input = document.getElementById("danioEvidenciaArchivo");
    if (input) {
        const dataTransfer = new DataTransfer();
        archivosEvidenciaSeleccionados.forEach(file => {
            dataTransfer.items.add(file);
        });
        input.files = dataTransfer.files;
    }

    renderizarPreviaEvidencias();
}

// Dibuja la lista de archivos seleccionados y guardados anteriormente
function renderizarPreviaEvidencias() {
    const prompt = document.getElementById("danioEvidenciaPrompt");
    const container = document.getElementById("danioFilePreviewList");
    if (!container) return;

    if (archivosEvidenciaSeleccionados.length === 0 && evidenciasExistentes.length === 0) {
        if (prompt) prompt.style.display = "flex";
        container.innerHTML = "";
        return;
    }

    if (prompt) prompt.style.display = "none";
    let html = "";

    // 1. Evidencias preexistentes guardadas
    evidenciasExistentes.forEach((url, idx) => {
        const name = url.split("/").pop();
        html += `
            <div class="d-flex align-items-center justify-content-between p-2 bg-light border rounded mb-2 w-100" style="pointer-events: auto;">
                <div class="file-info text-start">
                    <a href="${url}" target="_blank" class="file-name-text fw-bold text-success text-decoration-none text-truncate d-block" style="max-width: 250px;" title="Ver evidencia guardada">${escapeHtml(name)}</a>
                    <span class="file-size-text text-success">Evidencia guardada</span>
                </div>
                <button type="button" class="btn-quitar-archivo" onclick="quitarEvidenciaExistente(${idx})">Quitar</button>
            </div>
        `;
    });

    // 2. Archivos nuevos seleccionados
    archivosEvidenciaSeleccionados.forEach((file, idx) => {
        html += `
            <div class="d-flex align-items-center justify-content-between p-2 bg-light border rounded mb-2 w-100" style="pointer-events: auto;">
                <div class="file-info text-start">
                    <span class="file-name-text fw-bold text-truncate d-block" style="max-width: 250px;" title="${escapeHtml(file.name)}">${escapeHtml(file.name)}</span>
                    <span class="file-size-text">${(file.size / 1024 / 1024).toFixed(2)} MB</span>
                </div>
                <button type="button" class="btn-quitar-archivo" onclick="quitarArchivoEvidencia(${idx})">Quitar</button>
            </div>
        `;
    });

    container.innerHTML = html;
}

window.quitarEvidenciaExistente = function(idx) {
    evidenciasExistentes.splice(idx, 1);
    renderizarPreviaEvidencias();
};

window.quitarArchivoEvidencia = function(idx) {
    archivosEvidenciaSeleccionados.splice(idx, 1);
    
    // Mantener sincronizado el input nativo tras remover un archivo
    const input = document.getElementById("danioEvidenciaArchivo");
    if (input) {
        const dataTransfer = new DataTransfer();
        archivosEvidenciaSeleccionados.forEach(file => {
            dataTransfer.items.add(file);
        });
        input.files = dataTransfer.files;
    }
    
    renderizarPreviaEvidencias();
};

function limpiarEvidencia() {
    archivosEvidenciaSeleccionados = [];
    evidenciasExistentes = [];
    const input = document.getElementById("danioEvidenciaArchivo");
    if (input) input.value = "";
    const hidden = document.getElementById("danio-strUrlEvidencia");
    if (hidden) hidden.value = "";
    const prompt = document.getElementById("danioEvidenciaPrompt");
    if (prompt) prompt.style.display = "flex";
    const container = document.getElementById("danioFilePreviewList");
    if (container) container.innerHTML = "";
    limpiarErrorEvidencia();
}

function mostrarErrorEvidencia(mensaje) {
    document.getElementById("danioEvidenciaArea")?.classList.add("is-invalid");
    const error = document.getElementById("danioEvidenciaArchivoError");
    if (error) { error.textContent = mensaje; error.classList.add("d-block"); }
}

function limpiarErrorEvidencia() {
    document.getElementById("danioEvidenciaArea")?.classList.remove("is-invalid");
    const error = document.getElementById("danioEvidenciaArchivoError");
    if (error) { error.textContent = ""; error.classList.remove("d-block"); }
}

// Muestra dinámicamente los caracteres escritos sobre el límite de 500 para observaciones
function inicializarContadorObservaciones() {
    const campo = document.getElementById("danio-strObservaciones");
    const contador = document.getElementById("danioObservacionesContador");
    if (!campo || !contador) return;

    const actualizar = () => {
        contador.textContent = `${campo.value.length}/500`;
    };
    campo.addEventListener("input", actualizar);
    actualizar();
}

// Ejecuta la validación lógica completa de todos los campos obligatorios del formulario antes del submit
function validarFormularioDanio(form) {
    const obligatorios = ["danio-idVehDatosGenerales", "danio-idEmpEmpleado", "danio-dteFechaEvento", "danio-strDescripcion", "danio-idVehCatStatus"];
    if (document.getElementById("danioSeguroSwitch")?.checked) {
        obligatorios.push("danio-idVehSeguro");
    }
    let valido = true;
    obligatorios.forEach(id => {
        const campo = document.getElementById(id);
        if (campo && !validarCampoDanio(campo)) valido = false;
    });

    // Validar monto
    const monto = document.getElementById("danio-mnyMontoReparacion");
    if (monto && monto.value) {
        if (!validarCampoDanio(monto)) valido = false;
    }

    const primerError = form.querySelector(".is-invalid");
    if (primerError) {
        primerError.scrollIntoView({ behavior: "smooth", block: "center" });
        if (typeof primerError.focus === "function") primerError.focus({ preventScroll: true });
    }
    return valido;
}

function validarCampoDanio(campo) {
    const original = String(campo.value || "");
    const valor = original.trim();
    let mensaje = "";

    if (campo.required && !valor) {
        mensaje = campo.tagName === "SELECT" ? "Selecciona una opción." : "Este campo es obligatorio.";
    }

    if (!mensaje) {
        switch (campo.id) {
            case "danio-strDescripcion":
                if (valor.length > 500) mensaje = "La descripción no debe superar 500 caracteres.";
                break;
            case "danio-strUbicacion":
                if (valor.length > 300) mensaje = "La ubicación no debe superar 300 caracteres.";
                break;
            case "danio-mnyMontoReparacion": {
                const rawVal = valor.replace(/,/g, "");
                const num = Number(rawVal);
                if (isNaN(num) || num < 0 || num > 999999) {
                    mensaje = "Monto de reparación no válido.";
                }
                break;
            }
            case "danio-strObservaciones":
                if (original.length > 500) mensaje = "Las observaciones no deben superar 500 caracteres.";
                break;
        }
    }

    if (mensaje) {
        campo.classList.remove("is-valid");
        campo.classList.add("is-invalid");
        campo.setAttribute("aria-invalid", "true");
        const wrapper = campo.closest(".custom-select-wrapper");
        if (wrapper) {
            wrapper.classList.add("is-invalid");
            wrapper.querySelector(".custom-select-trigger")?.classList.add("is-invalid");
        }
        const error = document.getElementById(`${campo.id}Error`);
        if (error) error.textContent = mensaje;
        return false;
    }

    limpiarErrorCampo(campo);
    if (campo.required && !campo.readOnly) campo.classList.add("is-valid");
    return true;
}

function limpiarErrorCampo(campo) {
    campo.classList.remove("is-invalid", "is-valid");
    campo.removeAttribute("aria-invalid");
    const wrapper = campo.closest(".custom-select-wrapper");
    if (wrapper) {
        wrapper.classList.remove("is-invalid", "is-valid");
        wrapper.querySelector(".custom-select-trigger")?.classList.remove("is-invalid", "is-valid");
    }
    const error = document.getElementById(`${campo.id}Error`);
    if (error) {
        error.textContent = "";
        error.classList.remove("d-block");
    }
}

// ─── CRUD Actions y Renderizado ───
async function cargarDaniosList() {
    try {
        const response = await fetch("/Danios/GetDanios");
        const result = await response.json();
        if (result.success && result.data) {
            listaDanios = result.data;
        } else {
            listaDanios = [];
        }
        renderDaniosTable();
    } catch (err) {
        console.error("Error al cargar daños:", err);
        listaDanios = [];
        renderDaniosTable();
    }
}

// Dibuja la tabla de registros de daños y accidentes en pantalla
function renderDaniosTable() {
    const tbody = document.getElementById("daniosTableBody");
    if (!tbody) return;

    if (!listaDanios || listaDanios.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No se encontraron daños o accidentes registrados.</td></tr>';
        return;
    }

    // Mapeamos cada daño/accidente a un renglón (tr) de la tabla
    tbody.innerHTML = listaDanios.map(d => {
        // Buscamos los datos del vehículo asignado
        const vehIdTarget = Number(d.idVehDatosGenerales ?? d.IdVehDatosGenerales);
        const v = listaVehiculosDanios.find(veh => Number(veh.id ?? veh.Id) === vehIdTarget);
        const marca = (window.obtenerNombreMarcaVehiculo && v) ? window.obtenerNombreMarcaVehiculo(v) : (v ? (v.strVehCatMarcaVehiculo || v.StrVehCatMarcaVehiculo || v.strMarca || "Desconocida") : "Desconocida");
        const modelo = v ? (v.strModelo || v.StrModelo || "Desconocido") : "Desconocido";
        const placa = v ? (v.strPlaca || v.StrPlaca || "—") : "—";
        const brandModel = `${marca} ${modelo}`;

        // Buscamos los datos del empleado responsable
        const empIdTarget = Number(d.idEmpEmpleado ?? d.IdEmpEmpleado);
        const emp = listaEmpleadosDanios.find(e => Number(e.id ?? e.Id) === empIdTarget);
        const empleadoName = emp ? ((emp.strNombre || emp.StrNombre || "") + " " + (emp.strApellidoPaterno || emp.StrApellidoPaterno || "") + ((emp.strApellidoMaterno || emp.StrApellidoMaterno) ? " " + (emp.strApellidoMaterno || emp.StrApellidoMaterno) : "")).trim() : (d.strEmpEmpleado || "Desconocido");

        // Obtenemos una versión corta de la descripción para no deformar la tabla
        const desc = d.strDescripcion || "";
        const smallDesc = desc.length > 50 ? desc.substring(0, 50) + "..." : desc;

        // Retornamos el HTML del renglón con las 5 columnas correspondientes
        return `
            <tr>
                <td>${escapeHtml(brandModel)}</td>
                <td><span class="badge bg-light text-dark border">${escapeHtml(placa)}</span></td>
                <td>${escapeHtml(empleadoName)}</td>
                <td title="${escapeHtml(desc)}">${escapeHtml(smallDesc)}</td>
                <td class="text-end">
                    <!-- Botón de Acciones dropdown estándar -->
                    <div class="dropdown actions-dropdown d-inline-block">
                        <button class="btn-action-trigger btn-sm" type="button" data-bs-toggle="dropdown" data-bs-boundary="viewport" aria-expanded="false">
                            <span>Acciones</span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li>
                                <button class="dropdown-item d-flex align-items-center" type="button" onclick="verDetalleDanio(${d.id})">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 text-info"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                    Ver detalles
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item d-flex align-items-center" type="button" onclick="editarDanio(${d.id})">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 text-primary"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    Editar
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item d-flex align-items-center text-danger" type="button" onclick="eliminarDanio(${d.id})">
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

    // Inicializamos dinámicamente cada trigger de dropdown mediante Bootstrap Popper
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

function verDetalleDanio(id) {
    const d = listaDanios.find(item => item.id === id);
    if (!d) return;

    const v = listaVehiculosDanios.find(veh => veh.id === d.idVehDatosGenerales);
    const emp = listaEmpleadosDanios.find(e => e.id === d.idEmpEmpleado);
    const empleadoName = emp ? (emp.strNombre + " " + emp.strApellidoPaterno + (emp.strApellidoMaterno ? " " + emp.strApellidoMaterno : "")) : (d.strEmpEmpleado || "Desconocido");

    let evidenciaHtml = '<span class="text-muted small">Ninguna evidencia adjunta</span>';
    if (d.strUrlEvidencia) {
        const urls = d.strUrlEvidencia.split(";").filter(x => x);
        evidenciaHtml = urls.map(url => {
            const isPdf = url.toLowerCase().endsWith(".pdf");
            const filename = url.split("/").pop();
            if (isPdf) {
                return `<a href="${url}" target="_blank" class="d-block text-truncate text-teal-cavex mb-2 small fw-semibold" style="text-decoration: underline;">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                            ${escapeHtml(filename)}
                        </a>`;
            } else {
                return `<div class="d-inline-block me-2 mb-2 text-center align-top" style="width: 80px;">
                            <a href="${url}" target="_blank" class="d-block">
                                <img src="${url}" class="rounded border" style="width: 80px; height: 60px; object-fit: cover;" />
                            </a>
                            <span class="d-block text-truncate text-muted small mt-1" style="font-size: 10px;" title="${escapeHtml(filename)}">${escapeHtml(filename)}</span>
                        </div>`;
            }
        }).join("");
    }

    Swal.fire({
        title: "Detalle de Daño / Accidente",
        html: `
            <div class="text-start fs-6" style="line-height: 1.6;">
                <p><strong>Vehículo:</strong> ${v ? `${v.strModelo} (${v.intAnio})` : "Desconocido"}</p>
                <p><strong>Placa:</strong> ${v ? v.strPlaca : "—"}</p>
                <p><strong>Empleado Responsable:</strong> ${empleadoName}</p>
                <p><strong>Fecha del Evento:</strong> ${d.dteFechaEvento ? new Date(d.dteFechaEvento).toLocaleString("es-MX", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false }) : "—"}</p>
                <p><strong>Ubicación:</strong> ${escapeHtml(d.strUbicacion || "No registrada")}</p>
                <p><strong>Monto Reparación:</strong> ${d.mnyMontoReparacion ? `$${Number(d.mnyMontoReparacion).toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "No especificado"}</p>
                <p><strong>Cubierto por seguro:</strong> ${d.bitCubiertoPorSeguro ? "Sí" : "No"}</p>
                <p><strong>Póliza/Aseguradora:</strong> ${escapeHtml(d.strVehSeguro || "No aplica")}</p>
                <p><strong>Estatus:</strong> <span class="badge bg-secondary">${escapeHtml(d.strVehCatStatus)}</span></p>
                <p><strong>Descripción:</strong> ${escapeHtml(d.strDescripcion)}</p>
                <p><strong>Evidencias:</strong></p>
                <div class="mb-3">${evidenciaHtml}</div>
                <p><strong>Observaciones:</strong> ${escapeHtml(d.strObservaciones || "Ninguna")}</p>
            </div>
        `,
        confirmButtonColor: "var(--teal-cavex)"
    });
}

function editarDanio(id) {
    const d = listaDanios.find(item => item.id === id);
    if (!d) return;

    editModeDanioId = id;

    const selectVeh = document.getElementById("danio-idVehDatosGenerales");
    const selectEmp = document.getElementById("danio-idEmpEmpleado");
    if (selectVeh) selectVeh.disabled = false;
    if (selectEmp) selectEmp.disabled = false;

    if (selectVeh) {
        selectVeh.value = d.idVehDatosGenerales;
        selectVeh.dispatchEvent(new Event("change"));
    }

    if (selectEmp) {
        selectEmp.value = d.idEmpEmpleado;
    }
    
    if (d.dteFechaEvento) {
        const dateEv = new Date(d.dteFechaEvento);
        if (!isNaN(dateEv)) {
            const yyyy = dateEv.getFullYear();
            const mm = String(dateEv.getMonth() + 1).padStart(2, "0");
            const dd = String(dateEv.getDate()).padStart(2, "0");
            const hh = String(dateEv.getHours()).padStart(2, "0");
            const min = String(dateEv.getMinutes()).padStart(2, "0");
            document.getElementById("danio-dteFechaEvento").value = `${yyyy}-${mm}-${dd}T${hh}:${min}`;
        }
    }
    
    document.getElementById("danio-idVehCatStatus").value = d.idVehCatStatus;
    document.getElementById("danio-strDescripcion").value = d.strDescripcion || "";
    document.getElementById("danio-strUbicacion").value = d.strUbicacion || "";

    const sw = document.getElementById("danioSeguroSwitch");
    if (sw) {
        sw.checked = d.bitCubiertoPorSeguro;
        sw.dispatchEvent(new Event("change"));
        setTimeout(() => {
            if (d.idVehSeguro) {
                document.getElementById("danio-idVehSeguro").value = d.idVehSeguro;
            }
        }, 150);
    }

    document.getElementById("danio-strObservaciones").value = d.strObservaciones || "";

    if (d.strUrlEvidencia) {
        evidenciasExistentes = d.strUrlEvidencia.split(";").filter(x => x);
    } else {
        evidenciasExistentes = [];
    }
    archivosEvidenciaSeleccionados = [];
    renderizarPreviaEvidencias();

    document.getElementById("danioAccidenteForm").scrollIntoView({ behavior: "smooth" });
}

function eliminarDanio(id) {
    Swal.fire({
        title: "¿Estás seguro?",
        text: "Este registro de daño o accidente será eliminado permanentemente.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
    }).then(async (result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: "Eliminando...",
                allowOutsideClick: false,
                didOpen: () => Swal.showLoading()
            });
            try {
                const response = await fetch(`/Danios/DeleteDanio/${id}`, { method: "POST" });
                const res = await response.json();
                Swal.close();
                if (res.success) {
                    Swal.fire("Eliminado", "El registro ha sido eliminado.", "success");
                    cargarDaniosList();
                } else {
                    Swal.fire("Error", res.message || "No se pudo eliminar el registro.", "error");
                }
            } catch (err) {
                Swal.close();
                Swal.fire("Error", "Error de red al intentar eliminar.", "error");
            }
        }
    });
}

function resetearFormularioDanio() {
    editModeDanioId = null;
    const selectVeh = document.getElementById("danio-idVehDatosGenerales");
    const selectEmp = document.getElementById("danio-idEmpEmpleado");
    if (selectVeh) selectVeh.disabled = false;
    if (selectEmp) selectEmp.disabled = false;

    const form = document.getElementById("danioAccidenteForm");
    if (form) {
        form.reset();
        form.querySelectorAll(".is-valid, .is-invalid").forEach(el => el.classList.remove("is-valid", "is-invalid"));
    }
    const sw = document.getElementById("danioSeguroSwitch");
    if (sw) {
        sw.checked = false;
        sw.dispatchEvent(new Event("change"));
    }
    limpiarEvidencia();
}

function escapeHtml(text) {
    return String(text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
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

