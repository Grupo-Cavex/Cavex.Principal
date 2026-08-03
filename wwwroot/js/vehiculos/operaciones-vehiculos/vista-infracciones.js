"use strict";

document.addEventListener("DOMContentLoaded", () => {
    inicializarVistaInfracciones();
});

// Arreglo temporal de vehículos cargado desde la BD para la vista previa lateral
let listaVehiculosInfracciones = [];
// Variable global para almacenar el comprobante de infracción seleccionado
let comprobanteArchivoSeleccionado = null;
let evidenciaArchivoSeleccionadoInfraccion = null;

// Inicializa la configuración de la pantalla de infracciones
function inicializarVistaInfracciones() {
    const form = document.getElementById("infraccionVehiculoForm");
    if (!form) return;

    cargarCatalogosInfracciones();
    inicializarEstatusInfraccion();
    inicializarCargaComprobante();
    inicializarCargaEvidencia();
    
    const montoInf = document.getElementById("infraccion-mnyMontoPagado");
    if (montoInf) {
        montoInf.addEventListener("input", () => formatCurrencyInput(montoInf));
    }
    
    inicializarContadores();

    // Eventos de validación en tiempo real para todos los inputs
    form.querySelectorAll("input:not([type='file']):not([type='hidden']), select, textarea").forEach(campo => {
        ["input", "change"].forEach(evento => campo.addEventListener(evento, () => {
            const teniaError = campo.classList.contains("is-invalid");
            limpiarErrorCampo(campo);
            if (teniaError) validarCampoInfraccion(campo);
            actualizarVistaPreviaInfraccion();
        }));

        campo.addEventListener("blur", () => {
            if (campo.type !== "number" && campo.tagName !== "SELECT" && !campo.readOnly) {
                campo.value = campo.value.trim().replace(/\s{2,}/g, " ");
            }
            if (campo.required || campo.value) {
                validarCampoInfraccion(campo);
            }
            actualizarVistaPreviaInfraccion();
        });
    });


    // Envío del formulario al backend para registrar la infracción
    form.addEventListener("submit", async event => {
        event.preventDefault();
        
        if (!validarFormularioInfraccion(form)) {
            Swal.fire({
                icon: "warning",
                title: "Formulario incompleto",
                text: "Revisa los campos obligatorios antes de continuar.",
                confirmButtonColor: "var(--teal-cavex)"
            });
            return;
        }

        Swal.fire({
            title: "Registrando infracción...",
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const selectStatus = document.getElementById("infraccion-idVehCatStatus");
        const statusVal = parseInt(selectStatus.value, 10);
        const selectedStatusText = selectStatus.options[selectStatus.selectedIndex]?.text.toLowerCase() || "";
        const isPaid = selectedStatusText.includes("pagada");
        const montoInput = document.getElementById("infraccion-mnyMontoPagado").value;
        const fechaPagoInput = document.getElementById("infraccion-dteFechaPago").value;
        const formaPagoInput = document.getElementById("infraccion-idVehFormaPago").value;

        // Construcción con FormData para soportar multipart upload del archivo comprobante
        const formData = new FormData();
        formData.append("Id", editModeInfraccionId || 0);
        formData.append("IdVehDatosGenerales", parseInt(document.getElementById("infraccion-idVehDatosGenerales").value, 10));
        formData.append("IdEmpEmpleado", parseInt(document.getElementById("infraccion-idEmpEmpleado").value, 10));
        formData.append("DteFechaInfraccion", document.getElementById("infraccion-dteFechaInfraccion").value);
        formData.append("StrMotivo", document.getElementById("infraccion-strMotivo").value);
        formData.append("IdVehCatStatus", statusVal);
        
        if (isPaid && montoInput) {
            formData.append("MnyMontoPagado", parseFloat(montoInput.replace(/,/g, "")));
        }
        if (isPaid && fechaPagoInput) {
            formData.append("DteFechaPago", fechaPagoInput);
        }
        if (isPaid && formaPagoInput) {
            formData.append("IdVehFormaPago", parseInt(formaPagoInput, 10));
        }
        
        formData.append("StrUrlComprobantePago", document.getElementById("infraccion-strUrlComprobantePago").value || "");
        formData.append("StrUrlEvidencia", document.getElementById("infraccion-strUrlEvidencia")?.value || "");
        formData.append("StrObservaciones", document.getElementById("infraccion-strObservaciones").value || "");

        const fileInput = document.getElementById("infraccionComprobanteArchivo");
        if (isPaid && fileInput && fileInput.files.length > 0) {
            formData.append("ComprobanteArchivo", fileInput.files[0]);
        }
        const evidenciaInput = document.getElementById("infraccionEvidenciaArchivo");
        if (evidenciaInput && evidenciaInput.files.length > 0) {
            formData.append("EvidenciaArchivo", evidenciaInput.files[0]);
        }

        try {
            const response = await fetch("/Infracciones/SaveInfraccion", {
                method: "POST",
                body: formData
            });

            const result = await response.json();
            Swal.close();

            if (!result.success) {
                Swal.fire({
                    icon: "error",
                    title: "Error al registrar",
                    text: result.message || "No fue posible registrar la infracción.",
                    confirmButtonColor: "var(--teal-cavex)"
                });
                return;
            }

            Swal.fire({
                icon: "success",
                title: editModeInfraccionId ? "Infracción actualizada" : "Infracción registrada",
                text: editModeInfraccionId ? "Los datos de la infracción han sido actualizados exitosamente." : "Los datos de la infracción han sido registrados exitosamente.",
                confirmButtonColor: "var(--teal-cavex)"
            }).then(() => {
                resetearFormularioInfraccion();
                cargarInfraccionesList();
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

    actualizarVistaPreviaInfraccion();
}

// Datos globales para vinculación vehículo-chofer
let listaEmpleadosInfracciones = [];
let asignacionesActivasInfracciones = [];

// Carga catálogos de vehículos, empleados, formas de pago y estatus del servidor
async function cargarCatalogosInfracciones() {
    try {
        const [vehRes, empRes, asigRes] = await Promise.all([
            obtenerVehiculosActivosDropdown(),
            fetch("/Empleado/GetEmpleadosDropdown").then(r => r.json()),
            fetch("/Asignaciones/GetAsignacionesActivas").then(r => r.json()).catch(() => ({ success: false }))
        ]);

        // Asignaciones activas para vinculación y filtrado
        if (asigRes.success && asigRes.data) {
            asignacionesActivasInfracciones = asigRes.data;
        }

        const vehIdAsignados = new Set(
            (asignacionesActivasInfracciones || [])
                .map(a => Number(a.idVehDatosGenerales ?? a.IdVehDatosGenerales))
                .filter(id => !isNaN(id) && id > 0)
        );

        const empIdAsignados = new Set(
            (asignacionesActivasInfracciones || [])
                .map(a => Number(a.idEmpEmpleado ?? a.IdEmpEmpleado))
                .filter(id => !isNaN(id) && id > 0)
        );

        // 1. Cargar solo vehículos asignados
        const selectVeh = document.getElementById("infraccion-idVehDatosGenerales");
        if (selectVeh && vehRes.success && vehRes.data) {
            listaVehiculosInfracciones = vehRes.data.items || [];
            selectVeh.innerHTML = '<option value="">Seleccionar vehículo asignado...</option>';
            listaVehiculosInfracciones.forEach(v => {
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
        const selectEmp = document.getElementById("infraccion-idEmpEmpleado");
        if (selectEmp && empRes.success && empRes.data) {
            listaEmpleadosInfracciones = empRes.data;
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
        let isVinculandoInfraccion = false;

        selectVeh?.addEventListener("change", () => {
            if (isVinculandoInfraccion) return;
            isVinculandoInfraccion = true;
            try {
                const vehId = parseInt(selectVeh.value, 10);
                if (editModeInfraccionId === null) {
                    if (vehId) {
                        const asig = asignacionesActivasInfracciones.find(a => a.idVehDatosGenerales === vehId);
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
                    const asig = asignacionesActivasInfracciones.find(a => a.idVehDatosGenerales === vehId);
                    if (asig && selectEmp) {
                        if (selectEmp.value !== String(asig.idEmpEmpleado)) {
                            selectEmp.value = String(asig.idEmpEmpleado);
                            selectEmp.dispatchEvent(new Event("change", { bubbles: true }));
                        }
                    }
                }
            } finally {
                isVinculandoInfraccion = false;
            }
            actualizarVistaPreviaInfraccion();
        });

        selectEmp?.addEventListener("change", () => {
            if (isVinculandoInfraccion) return;
            isVinculandoInfraccion = true;
            try {
                const empId = parseInt(selectEmp.value, 10);
                if (editModeInfraccionId === null) {
                    if (empId) {
                        const asig = asignacionesActivasInfracciones.find(a => a.idEmpEmpleado === empId);
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
                    const asig = asignacionesActivasInfracciones.find(a => a.idEmpEmpleado === empId);
                    if (asig && selectVeh) {
                        if (selectVeh.value !== String(asig.idVehDatosGenerales)) {
                            selectVeh.value = String(asig.idVehDatosGenerales);
                            selectVeh.dispatchEvent(new Event("change", { bubbles: true }));
                        }
                    }
                }
            } finally {
                isVinculandoInfraccion = false;
            }
            actualizarVistaPreviaInfraccion();
        });
    } catch (err) {
        console.error("Error al cargar catálogos de infracciones:", err);
    }

    // 3. Cargar catálogos (Forma de pago, Estatus)
    fetch("/Vehiculos/GetVehiculoCatalogos")
        .then(res => res.json())
        .then(result => {
            if (result.success && result.data) {
                // Formas de pago
                const selectPago = document.getElementById("infraccion-idVehFormaPago");
                const formasList = result.data.idVehCatFormaPago || result.data.idVehFormaPago;
                if (selectPago && formasList) {
                    selectPago.innerHTML = '<option value="">Seleccionar...</option>';
                    formasList.forEach(item => {
                        const opt = document.createElement("option");
                        opt.value = String(item.id);
                        opt.textContent = item.strValor || item.strDescripcion;
                        selectPago.appendChild(opt);
                    });
                }

                // Estatus de la infracción
                const selectStatus = document.getElementById("infraccion-idVehCatStatus");
                if (selectStatus && result.data.idVehCatStatus) {
                    selectStatus.innerHTML = '<option value="">Seleccionar...</option>';
                    result.data.idVehCatStatus.forEach(item => {
                        const name = (item.strValor || "").toLowerCase();
                        if (name === "pendiente" || name === "pagada") {
                            const opt = document.createElement("option");
                            opt.value = String(item.id);
                            opt.textContent = item.strValor || item.strDescripcion;
                            selectStatus.appendChild(opt);
                        }
                    });
                    
                    // Seleccionar "Pendiente" por defecto
                    for (let i = 0; i < selectStatus.options.length; i++) {
                        if (selectStatus.options[i].text.toLowerCase().includes("pendiente")) {
                            selectStatus.selectedIndex = i;
                            break;
                        }
                    }
                    toggleCamposPago(false);
                    actualizarVistaPreviaInfraccion();
                }
            }
            // Cargar registros de infracciones
            cargarInfraccionesList();
        })
        .catch(() => {});
}

// Vincula el evento change del select de Estatus
function inicializarEstatusInfraccion() {
    const selectStatus = document.getElementById("infraccion-idVehCatStatus");
    if (!selectStatus) return;

    selectStatus.addEventListener("change", () => {
        const text = selectStatus.options[selectStatus.selectedIndex]?.text.toLowerCase() || "";
        const esPagada = text.includes("pagada");
        toggleCamposPago(esPagada);
        actualizarVistaPreviaInfraccion();
    });
}

// Habilita o deshabilita los campos de pago según el estatus de la infracción
function toggleCamposPago(requerido) {
    const monto = document.getElementById("infraccion-mnyMontoPagado");
    const fecha = document.getElementById("infraccion-dteFechaPago");
    const forma = document.getElementById("infraccion-idVehFormaPago");
    const uploadArea = document.getElementById("infraccionComprobanteArea");
    const fileInput = document.getElementById("infraccionComprobanteArchivo");

    const campos = [monto, fecha, forma];

    campos.forEach(c => {
        if (!c) return;
        c.disabled = !requerido;
        c.required = requerido;
        if (!requerido) {
            c.value = "";
            limpiarErrorCampo(c);
        }
    });

    if (!requerido) {
        limpiarComprobante();
        if (fileInput) fileInput.disabled = true;
        if (uploadArea) {
            uploadArea.style.opacity = "0.6";
            uploadArea.style.pointerEvents = "none";
        }
    } else {
        if (fileInput) fileInput.disabled = false;
        if (uploadArea) {
            uploadArea.style.opacity = "1";
            uploadArea.style.pointerEvents = "auto";
        }
    }
}

// Configura el cargador del archivo comprobante (Drag & Drop + Selección manual)
function inicializarCargaComprobante() {
    const area = document.getElementById("infraccionComprobanteArea");
    const input = document.getElementById("infraccionComprobanteArchivo");
    if (!area || !input) return;

    input.addEventListener("click", event => {
        event.stopPropagation();
    });

    // Al hacer clic en el área, abre el explorador de archivos si no está deshabilitado y no se clica en Quitar
    area.addEventListener("click", event => {
        if (input.disabled) return;
        if (event.target.closest("#btnQuitarComprobanteInfraccion")) {
            return;
        }
        input.click();
    });

    document.getElementById("btnQuitarComprobanteInfraccion")?.addEventListener("click", event => {
        event.stopPropagation();
        limpiarComprobante();
    });

    // Permite abrir el explorador de archivos con Enter o Espacio
    area.addEventListener("keydown", event => {
        if (input.disabled) return;
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            input.click();
        }
    });

    // Añade clase visual al arrastrar archivos sobre el área
    area.addEventListener("dragover", event => {
        if (input.disabled) return;
        event.preventDefault();
        event.stopPropagation();
        area.classList.add("is-drag-over");
    });
    area.addEventListener("dragenter", event => {
        event.preventDefault();
        event.stopPropagation();
        area.classList.add("is-drag-over");
    });
    area.addEventListener("dragleave", event => {
        event.preventDefault();
        event.stopPropagation();
        area.classList.remove("is-drag-over");
    });

    // Procesa el archivo soltado en el área
    area.addEventListener("drop", event => {
        if (input.disabled) return;
        event.preventDefault();
        event.stopPropagation();
        area.classList.remove("is-drag-over");
        const archivo = event.dataTransfer.files?.[0];
        if (archivo) procesarArchivoComprobante(archivo);
    });

    // Procesa el archivo cuando es seleccionado manualmente
    input.addEventListener("change", () => {
        const archivo = input.files?.[0];
        if (archivo) procesarArchivoComprobante(archivo);
    });
}

// Valida el formato y tamaño del archivo comprobante (por extensión)
function procesarArchivoComprobante(archivo) {
    const limBytes = 5 * 1024 * 1024;
    const extensionesPermitidas = ["jpg", "jpeg", "png", "webp", "pdf"];

    limpiarErrorComprobante();

    // Extrae y valida la extensión del archivo para máxima compatibilidad
    const ext = archivo.name.split('.').pop().toLowerCase();
    if (!extensionesPermitidas.includes(ext)) {
        mostrarErrorComprobante("El archivo debe ser PDF, JPG, PNG o WEBP.");
        return;
    }
    if (archivo.size > limBytes) {
        mostrarErrorComprobante("El archivo supera el límite de 5 MB.");
        return;
    }

    // Asignar el archivo al input usando DataTransfer (estilo Nuevo Empleado)
    const input = document.getElementById("infraccionComprobanteArchivo");
    if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(archivo);
        input.files = dataTransfer.files;
    }

    comprobanteArchivoSeleccionado = archivo;
    renderizarPreviaComprobante();
    actualizarVistaPreviaInfraccion();
}

function renderizarPreviaComprobante() {
    const prompt = document.getElementById("infraccionComprobantePrompt");
    const preview = document.getElementById("infraccionFilePreview");
    const hidden = document.getElementById("infraccion-strUrlComprobantePago");
    if (!prompt || !preview) return;

    const urlExistente = hidden ? hidden.value : "";

    if (!comprobanteArchivoSeleccionado && !urlExistente) {
        prompt.style.display = "flex";
        preview.style.display = "none";
        return;
    }

    prompt.style.display = "none";
    preview.style.display = "flex";

    const nameText = document.getElementById("infraccionFileName");
    const sizeText = document.getElementById("infraccionFileSize");

    if (urlExistente) {
        const name = urlExistente.split("/").pop();
        if (nameText) nameText.textContent = name;
        if (sizeText) sizeText.textContent = "Comprobante guardado";
    } else if (comprobanteArchivoSeleccionado) {
        if (nameText) nameText.textContent = comprobanteArchivoSeleccionado.name;
        if (sizeText) sizeText.textContent = (comprobanteArchivoSeleccionado.size / 1024 / 1024).toFixed(2) + " MB";
    }
}

window.quitarComprobanteExistenteInfraccion = function() {
    const hidden = document.getElementById("infraccion-strUrlComprobantePago");
    if (hidden) hidden.value = "";
    limpiarErrorComprobante();
    renderizarPreviaComprobante();
}

function inicializarCargaEvidencia() {
    const area = document.getElementById("infraccionEvidenciaArea");
    const input = document.getElementById("infraccionEvidenciaArchivo");
    if (!area || !input) return;

    input.addEventListener("click", event => {
        event.stopPropagation();
    });

    area.addEventListener("click", event => {
        if (input.disabled) return;
        if (event.target.closest("#btnQuitarEvidenciaInfraccion")) return;
        input.click();
    });

    document.getElementById("btnQuitarEvidenciaInfraccion")?.addEventListener("click", event => {
        event.stopPropagation();
        limpiarEvidenciaInfraccion();
    });

    area.addEventListener("keydown", event => {
        if (input.disabled) return;
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            input.click();
        }
    });

    area.addEventListener("dragover", event => {
        if (input.disabled) return;
        event.preventDefault();
        event.stopPropagation();
        area.classList.add("is-drag-over");
    });
    area.addEventListener("dragenter", event => {
        if (input.disabled) return;
        event.preventDefault();
        event.stopPropagation();
        area.classList.add("is-drag-over");
    });
    area.addEventListener("dragleave", event => {
        event.preventDefault();
        event.stopPropagation();
        area.classList.remove("is-drag-over");
    });

    area.addEventListener("drop", event => {
        if (input.disabled) return;
        event.preventDefault();
        event.stopPropagation();
        area.classList.remove("is-drag-over");
        const archivo = event.dataTransfer.files?.[0];
        if (archivo) procesarArchivoEvidenciaInfraccion(archivo);
    });

    input.addEventListener("change", () => {
        const archivo = input.files?.[0];
        if (archivo) procesarArchivoEvidenciaInfraccion(archivo);
    });
}

function procesarArchivoEvidenciaInfraccion(archivo) {
    const limBytes = 5 * 1024 * 1024;
    const extensionesPermitidas = ["jpg", "jpeg", "png", "webp", "pdf"];
    limpiarErrorEvidenciaInfraccion();

    const ext = archivo.name.split('.').pop().toLowerCase();
    if (!extensionesPermitidas.includes(ext)) {
        mostrarErrorEvidenciaInfraccion("El archivo debe ser PDF, JPG, PNG o WEBP.");
        return;
    }
    if (archivo.size > limBytes) {
        mostrarErrorEvidenciaInfraccion("El archivo supera el l�mite de 5 MB.");
        return;
    }

    const input = document.getElementById("infraccionEvidenciaArchivo");
    if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(archivo);
        input.files = dataTransfer.files;
    }

    evidenciaArchivoSeleccionadoInfraccion = archivo;
    renderizarPreviaEvidenciaInfraccion();
}

function renderizarPreviaEvidenciaInfraccion() {
    const prompt = document.getElementById("infraccionEvidenciaPrompt");
    const preview = document.getElementById("infraccionEvidenciaFilePreview");
    const hidden = document.getElementById("infraccion-strUrlEvidencia");
    if (!prompt || !preview) return;

    const urlExistente = hidden ? hidden.value : "";

    if (!evidenciaArchivoSeleccionadoInfraccion && !urlExistente) {
        prompt.style.display = "flex";
        preview.style.display = "none";
        return;
    }

    prompt.style.display = "none";
    preview.style.display = "flex";

    const nameText = document.getElementById("infraccionEvidenciaFileName");
    const sizeText = document.getElementById("infraccionEvidenciaFileSize");

    if (urlExistente) {
        const name = urlExistente.split("/").pop();
        if (nameText) nameText.textContent = name;
        if (sizeText) sizeText.textContent = "Evidencia guardada";
    } else if (evidenciaArchivoSeleccionadoInfraccion) {
        if (nameText) nameText.textContent = evidenciaArchivoSeleccionadoInfraccion.name;
        if (sizeText) sizeText.textContent = (evidenciaArchivoSeleccionadoInfraccion.size / 1024 / 1024).toFixed(2) + " MB";
    }
}

function limpiarEvidenciaInfraccion() {
    evidenciaArchivoSeleccionadoInfraccion = null;
    const input = document.getElementById("infraccionEvidenciaArchivo");
    if (input) input.value = "";
    const hidden = document.getElementById("infraccion-strUrlEvidencia");
    if (hidden) hidden.value = "";
    limpiarErrorEvidenciaInfraccion();
    renderizarPreviaEvidenciaInfraccion();
}

function mostrarErrorEvidenciaInfraccion(msg) {
    const err = document.getElementById("infraccionEvidenciaArchivoError");
    if (err) {
        err.textContent = msg;
        err.style.display = "block";
    }
}

function limpiarErrorEvidenciaInfraccion() {
    const err = document.getElementById("infraccionEvidenciaArchivoError");
    if (err) {
        err.textContent = "";
        err.style.display = "none";
    }
}

window.quitarArchivoComprobanteInfraccion = function() {
    comprobanteArchivoSeleccionado = null;
    const input = document.getElementById("infraccionComprobanteArchivo");
    if (input) input.value = "";
    renderizarPreviaComprobante();
    actualizarVistaPreviaInfraccion();
};

// Limpia el estado del comprobante
function limpiarComprobante() {
    comprobanteArchivoSeleccionado = null;
    const input = document.getElementById("infraccionComprobanteArchivo");
    if (input) input.value = "";
    const hidden = document.getElementById("infraccion-strUrlComprobantePago");
    if (hidden) hidden.value = "";
    
    const prompt = document.getElementById("infraccionComprobantePrompt");
    const preview = document.getElementById("infraccionFilePreview");
    if (prompt) prompt.style.display = "flex";
    if (preview) preview.style.display = "none";
    
    limpiarErrorComprobante();
    actualizarVistaPreviaInfraccion();
}

function mostrarErrorComprobante(mensaje) {
    document.getElementById("infraccionComprobanteArea")?.classList.add("is-invalid");
    const error = document.getElementById("infraccionComprobanteArchivoError");
    if (error) { error.textContent = mensaje; error.classList.add("d-block"); }
}

function limpiarErrorComprobante() {
    document.getElementById("infraccionComprobanteArea")?.classList.remove("is-invalid");
    const error = document.getElementById("infraccionComprobanteArchivoError");
    if (error) { error.textContent = ""; error.classList.remove("d-block"); }
}

// Configura contadores de caracteres para los campos textarea
function inicializarContadores() {
    const motivo = document.getElementById("infraccion-strMotivo");
    const counterMotivo = document.getElementById("infraccionMotivoCounter");
    if (motivo && counterMotivo) {
        motivo.addEventListener("input", () => {
            counterMotivo.textContent = String(motivo.value.length);
        });
    }

    const obs = document.getElementById("infraccion-strObservaciones");
    const counterObs = document.getElementById("infraccionObservacionesCounter");
    if (obs && counterObs) {
        obs.addEventListener("input", () => {
            counterObs.textContent = String(obs.value.length);
        });
    }
}

// Mapea y actualiza la tarjeta lateral de Vista Previa con los valores del formulario
function actualizarVistaPreviaInfraccion() {
    const val = id => document.getElementById(id)?.value?.trim() || "";
    const txt = id => {
        const sel = document.getElementById(id);
        const opt = sel?.selectedOptions?.[0];
        return opt?.value ? opt.textContent.trim() : "";
    };

    const selectStatus = document.getElementById("infraccion-idVehCatStatus");
    const statusValText = selectStatus ? (selectStatus.options[selectStatus.selectedIndex]?.text.toLowerCase() || "") : "";
    const isPaid = statusValText.includes("pagada");
    const statusText = isPaid ? "Pagada" : "Pendiente";

    const elStatus = document.getElementById("previewInfraccionStatus");
    if (elStatus) {
        elStatus.textContent = statusText;
        elStatus.className = "infraccion-status " + (isPaid ? "infraccion-status-paid" : "infraccion-status-pending");
    }

    // Buscar placa
    const vehId = val("infraccion-idVehDatosGenerales");
    const veh = listaVehiculosInfracciones.find(v => String(v.id) === vehId);
    const placaText = veh ? veh.strPlaca : "Desconocida";

    const setText = (id, str) => {
        const el = document.getElementById(id);
        if (el) el.textContent = str || "Desconocida";
    };

    setText("previewInfraccionVehiculo", txt("infraccion-idVehDatosGenerales") || "Sin seleccionar");
    setText("previewInfraccionPlaca", placaText);
    setText("previewInfraccionEmpleado", txt("infraccion-idEmpEmpleado") || "Sin seleccionar");
    const fechaInfVal = val("infraccion-dteFechaInfraccion");
    let fechaInfFmt = "-";
    if (fechaInfVal) {
        const dInf = new Date(fechaInfVal);
        fechaInfFmt = isNaN(dInf) ? fechaInfVal : dInf.toLocaleString("es-MX", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false });
    }
    setText("previewInfraccionFecha", fechaInfFmt);
    setText("previewInfraccionMotivo", val("infraccion-strMotivo") || "Sin capturar");

    const montoVal = parseFloat(val("infraccion-mnyMontoPagado")) || 0;
    setText("previewInfraccionMonto", montoVal > 0 ? `$${montoVal.toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "$0.00");
    setText("previewInfraccionFechaPago", val("infraccion-dteFechaPago") || "No registrada");
    setText("previewInfraccionFormaPago", txt("infraccion-idVehFormaPago") || "Sin seleccionar");

    const hasFile = comprobanteArchivoSeleccionado || document.getElementById("infraccion-strUrlComprobantePago")?.value;
    const name = comprobanteArchivoSeleccionado ? comprobanteArchivoSeleccionado.name : (document.getElementById("infraccion-strUrlComprobantePago")?.value.split("/").pop() || "Archivo cargado");
    setText("previewInfraccionComprobante", hasFile ? name : "Sin archivo");
}

// Realiza validación de campos obligatorios requeridos
function validarFormularioInfraccion(form) {
    const obligatorios = ["infraccion-idVehDatosGenerales", "infraccion-idEmpEmpleado", "infraccion-dteFechaInfraccion", "infraccion-idVehCatStatus", "infraccion-strMotivo"];
    
    const selectStatus = document.getElementById("infraccion-idVehCatStatus");
    const isPaid = selectStatus ? (selectStatus.options[selectStatus.selectedIndex]?.text.toLowerCase() || "").includes("pagada") : false;
    if (isPaid) {
        obligatorios.push("infraccion-mnyMontoPagado", "infraccion-dteFechaPago", "infraccion-idVehFormaPago");
    }

    let valido = true;
    obligatorios.forEach(id => {
        const campo = document.getElementById(id);
        if (campo && !validarCampoInfraccion(campo)) valido = false;
    });

    const primerError = form.querySelector(".is-invalid");
    if (primerError) {
        primerError.scrollIntoView({ behavior: "smooth", block: "center" });
        if (typeof primerError.focus === "function") primerError.focus({ preventScroll: true });
    }
    return valido;
}

// Realiza validación lógica individual por campo
function validarCampoInfraccion(campo) {
    const original = String(campo.value || "");
    const valor = original.trim();
    let mensaje = "";

    if (campo.required && !valor) {
        mensaje = campo.tagName === "SELECT" ? "Selecciona una opción." : "Este campo es obligatorio.";
    }

    if (!mensaje) {
        switch (campo.id) {
            case "infraccion-strMotivo":
                if (valor.length > 500) mensaje = "El motivo no debe superar 500 caracteres.";
                break;
            case "infraccion-mnyMontoPagado": {
                const rawVal = valor.replace(/,/g, "");
                const num = Number(rawVal);
                if (isNaN(num) || num < 0 || num > 999999) {
                    mensaje = "Monto pagado no válido.";
                }
                break;
            }
            case "infraccion-strObservaciones":
                if (original.length > 500) mensaje = "Las observaciones no deben superar 500 caracteres.";
                break;
        }
    }

    if (mensaje) {
        campo.classList.remove("is-valid");
        campo.classList.add("is-invalid");
        campo.setAttribute("aria-invalid", "true");
        const error = document.getElementById(`${campo.id}Error`);
        if (error) error.textContent = mensaje;
        return false;
    }

    limpiarErrorCampo(campo);
    if (campo.required && !campo.readOnly) campo.classList.add("is-valid");
    return true;
}

// Limpia el estado de error de un input/select
function limpiarErrorCampo(campo) {
    campo.classList.remove("is-invalid", "is-valid");
    campo.removeAttribute("aria-invalid");
    const error = document.getElementById(`${campo.id}Error`);
    if (error) {
        error.textContent = "";
        error.classList.remove("d-block");
    }
}

// �"?�"?�"? CRUD Actions y Renderizado �"?�"?�"?
let listaInfracciones = [];
let editModeInfraccionId = null;

async function cargarInfraccionesList() {
    try {
        const response = await fetch("/Infracciones/GetInfracciones");
        const result = await response.json();
        if (result.success && result.data) {
            listaInfracciones = result.data;
        } else {
            listaInfracciones = [];
        }
        renderInfraccionesTable();
    } catch (err) {
        console.error("Error al cargar infracciones:", err);
        listaInfracciones = [];
        renderInfraccionesTable();
    }
}

function renderInfraccionesTable() {
    const tbody = document.getElementById("infraccionesTableBody");
    if (!tbody) return;

    if (!listaInfracciones || listaInfracciones.length === 0) {
        tbody.innerHTML = '<tr><td colspan="6" class="text-center text-muted py-4">No se encontraron infracciones registradas.</td></tr>';
        return;
    }

    tbody.innerHTML = listaInfracciones.map(inf => {
        const vehIdTarget = Number(inf.idVehDatosGenerales ?? inf.IdVehDatosGenerales);
        const v = listaVehiculosInfracciones.find(veh => Number(veh.id ?? veh.Id) === vehIdTarget);
        const marca = (window.obtenerNombreMarcaVehiculo && v) ? window.obtenerNombreMarcaVehiculo(v) : (v ? (v.strVehCatMarcaVehiculo || v.StrVehCatMarcaVehiculo || v.strMarca || "Desconocida") : "Desconocida");
        const modelo = v ? (v.strModelo || v.StrModelo || "Desconocido") : "Desconocido";
        const placa = v ? (v.strPlaca || v.StrPlaca || "Desconocida") : "Desconocida";
        const brandModel = `${marca} ${modelo}`;

        const empIdTarget = Number(inf.idEmpEmpleado ?? inf.IdEmpEmpleado);
        const emp = listaEmpleadosInfracciones.find(e => Number(e.id ?? e.Id) === empIdTarget);
        const empleadoName = emp ? ((emp.strNombre || emp.StrNombre || "") + " " + (emp.strApellidoPaterno || emp.StrApellidoPaterno || "") + ((emp.strApellidoMaterno || emp.StrApellidoMaterno) ? " " + (emp.strApellidoMaterno || emp.StrApellidoMaterno) : "")).trim() : (inf.strEmpEmpleado || "Desconocido");

        const motivo = inf.strMotivo || "";
        const smallMotivo = motivo.length > 40 ? motivo.substring(0, 40) + "..." : motivo;

        // Estatus basado en texto
        const isPaid = (inf.strVehCatStatus || "").toLowerCase() === "pagada";
        const statusBadge = isPaid
            ? '<span class="badge bg-success">Pagada</span>'
            : '<span class="badge bg-warning text-dark">Pendiente</span>';

        return `
            <tr>
                <td>${escapeHtml(brandModel)}</td>
                <td><span class="badge bg-light text-dark border">${escapeHtml(placa)}</span></td>
                <td>${escapeHtml(empleadoName)}</td>
                <td title="${escapeHtml(motivo)}">${escapeHtml(smallMotivo)}</td>
                <td>${statusBadge}</td>
                <td class="text-end">
                    <div class="dropdown actions-dropdown d-inline-block">
                        <button class="btn-action-trigger btn-sm" type="button" data-bs-toggle="dropdown" data-bs-boundary="viewport" aria-expanded="false">
                            <span>Acciones</span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li>
                                <button class="dropdown-item d-flex align-items-center" type="button" onclick="verDetalleInfraccion(${inf.id})">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 text-info"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                    Ver detalles
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item d-flex align-items-center" type="button" onclick="editarInfraccion(${inf.id})">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 text-primary"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    Editar
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item d-flex align-items-center text-danger" type="button" onclick="eliminarInfraccion(${inf.id})">
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

function verDetalleInfraccion(id) {
    const inf = listaInfracciones.find(item => item.id === id);
    if (!inf) return;

    const v = listaVehiculosInfracciones.find(veh => veh.id === inf.idVehDatosGenerales);
    const emp = listaEmpleadosInfracciones.find(e => e.id === inf.idEmpEmpleado);
    const empleadoName = emp ? (emp.strNombre + " " + emp.strApellidoPaterno + (emp.strApellidoMaterno ? " " + emp.strApellidoMaterno : "")) : (inf.strEmpEmpleado || "Desconocido");

    const statusText = inf.strVehCatStatus || "Pendiente";

    let comprobanteHtml = '<span class="text-muted small">No registrado</span>';
    if (inf.strUrlComprobantePago) {
        const isPdf = inf.strUrlComprobantePago.toLowerCase().endsWith(".pdf");
        const filename = inf.strUrlComprobantePago.split("/").pop();
        if (isPdf) {
            comprobanteHtml = `<a href="${inf.strUrlComprobantePago}" target="_blank" class="text-teal-cavex fw-semibold small" style="text-decoration: underline;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                ${escapeHtml(filename)}
                               </a>`;
        } else {
            comprobanteHtml = `<a href="${inf.strUrlComprobantePago}" target="_blank" class="d-inline-block border rounded p-1">
                                <img src="${inf.strUrlComprobantePago}" style="max-height: 80px; object-fit: contain;" />
                               </a>`;
        }
    }

    const decode = window.decodeUtf8Mojibake || (s => s || '');
    const motivoText = decode(inf.strMotivo);
    const obsText = decode(inf.strObservaciones) || "Ninguna";
    const empNameDec = decode(empleadoName);

    Swal.fire({
        title: "Detalle de Infracción",
        html: `
            <div class="text-start fs-6" style="line-height: 1.6;">
                <p><strong>Vehículo:</strong> ${v ? `${decode(v.strModelo)} (${v.intAnio})` : "Desconocido"}</p>
                <p><strong>Placa:</strong> ${v ? decode(v.strPlaca) : "Desconocida"}</p>
                <p><strong>Chofer Responsable:</strong> ${empNameDec}</p>
                <p><strong>Fecha Infracción:</strong> ${inf.dteFechaInfraccion ? (isNaN(new Date(inf.dteFechaInfraccion)) ? inf.dteFechaInfraccion : new Date(inf.dteFechaInfraccion).toLocaleString("es-MX", { year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hour12: false })) : "-"}</p>
                <p><strong>Estatus:</strong> <span class="badge ${inf.idVehCatStatus === 2 ? "bg-success" : "bg-warning text-dark"}">${decode(statusText)}</span></p>
                <p><strong>Motivo:</strong> ${escapeHtml(motivoText)}</p>
                <p><strong>Monto Pagado:</strong> ${inf.mnyMontoPagado ? `$${Number(inf.mnyMontoPagado).toLocaleString("es-MX", { minimumFractionDigits: 2 })}` : "$0.00"}</p>
                <p><strong>Fecha Pago:</strong> ${inf.dteFechaPago ? new Date(inf.dteFechaPago).toLocaleDateString("es-MX") : "No registrada"}</p>
                <p><strong>Forma Pago:</strong> ${escapeHtml(decode(inf.strVehFormaPago) || "Sin seleccionar")}</p>
                <p><strong>Comprobante:</strong></p>
                <div class="mb-3">${comprobanteHtml}</div>
                <p><strong>Observaciones:</strong> ${escapeHtml(obsText)}</p>
            </div>
        `,
        confirmButtonColor: "var(--teal-cavex)"
    });
}

function editarInfraccion(id) {
    const inf = listaInfracciones.find(item => item.id === id);
    if (!inf) return;

    editModeInfraccionId = id;

    const selectVeh = document.getElementById("infraccion-idVehDatosGenerales");
    const selectEmp = document.getElementById("infraccion-idEmpEmpleado");
    if (selectVeh) selectVeh.disabled = false;
    if (selectEmp) selectEmp.disabled = false;

    if (selectVeh) {
        selectVeh.value = inf.idVehDatosGenerales;
        selectVeh.dispatchEvent(new Event("change"));
    }

    if (selectEmp) {
        selectEmp.value = inf.idEmpEmpleado;
    }
    
    if (inf.dteFechaInfraccion) {
        const d = new Date(inf.dteFechaInfraccion);
        if (!isNaN(d)) {
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, "0");
            const dd = String(d.getDate()).padStart(2, "0");
            const hh = String(d.getHours()).padStart(2, "0");
            const min = String(d.getMinutes()).padStart(2, "0");
            document.getElementById("infraccion-dteFechaInfraccion").value = `${yyyy}-${mm}-${dd}T${hh}:${min}`;
        }
    }
    
    document.getElementById("infraccion-idVehCatStatus").value = inf.idVehCatStatus;
    document.getElementById("infraccion-idVehCatStatus").dispatchEvent(new Event("change"));

    document.getElementById("infraccion-strMotivo").value = inf.strMotivo || "";
    document.getElementById("infraccion-strMotivo").dispatchEvent(new Event("input"));

    const montoEl = document.getElementById("infraccion-mnyMontoPagado");
    if (montoEl) {
        montoEl.value = inf.mnyMontoPagado || "";
        if (montoEl.value) formatCurrencyInput(montoEl);
    }
    if (inf.dteFechaPago) {
        document.getElementById("infraccion-dteFechaPago").value = inf.dteFechaPago.split("T")[0];
    } else {
        document.getElementById("infraccion-dteFechaPago").value = "";
    }
    document.getElementById("infraccion-idVehFormaPago").value = inf.idVehFormaPago || "";
    if (inf.strUrlEvidencia) {
        document.getElementById("infraccion-strUrlEvidencia").value = inf.strUrlEvidencia;
    } else {
        document.getElementById("infraccion-strUrlEvidencia").value = "";
    }
    evidenciaArchivoSeleccionadoInfraccion = null;
    renderizarPreviaEvidenciaInfraccion();

    document.getElementById("infraccion-strObservaciones").value = inf.strObservaciones || "";
    document.getElementById("infraccion-strObservaciones").dispatchEvent(new Event("input"));

    if (inf.strUrlComprobantePago) {
        document.getElementById("infraccion-strUrlComprobantePago").value = inf.strUrlComprobantePago;
    } else {
        document.getElementById("infraccion-strUrlComprobantePago").value = "";
    }
    comprobanteArchivoSeleccionado = null;
    renderizarPreviaComprobante();

    actualizarVistaPreviaInfraccion();

    document.getElementById("infraccionVehiculoForm").scrollIntoView({ behavior: "smooth" });
}

function eliminarInfraccion(id) {
    Swal.fire({
        title: "¿Estás seguro?",
        text: "Este registro de infracción será eliminado permanentemente.",
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
                const response = await fetch(`/Infracciones/DeleteInfraccion/${id}`, { method: "POST" });
                const res = await response.json();
                Swal.close();
                if (res.success) {
                    Swal.fire("Eliminado", "La infracción ha sido eliminada.", "success");
                    cargarInfraccionesList();
                } else {
                    Swal.fire("Error", res.message || "No se pudo eliminar la infracción.", "error");
                }
            } catch (err) {
                Swal.close();
                Swal.fire("Error", "Error de red al intentar eliminar.", "error");
            }
        }
    });
}

function resetearFormularioInfraccion() {
    editModeInfraccionId = null;
    const selectVeh = document.getElementById("infraccion-idVehDatosGenerales");
    const selectEmp = document.getElementById("infraccion-idEmpEmpleado");
    if (selectVeh) selectVeh.disabled = false;
    if (selectEmp) selectEmp.disabled = false;

    const form = document.getElementById("infraccionVehiculoForm");
    if (form) {
        form.reset();
        form.querySelectorAll(".is-valid, .is-invalid").forEach(el => el.classList.remove("is-valid", "is-valid"));
        
        // Por defecto: Pendiente
        const statusSelect = document.getElementById("infraccion-idVehCatStatus");
        if (statusSelect) {
            for (let i = 0; i < statusSelect.options.length; i++) {
                if (statusSelect.options[i].text.toLowerCase().includes("pendiente")) {
                    statusSelect.selectedIndex = i;
                    break;
                }
            }
            statusSelect.dispatchEvent(new Event("change"));
        }
    }
    limpiarComprobante();
    limpiarEvidenciaInfraccion();
    actualizarVistaPreviaInfraccion();
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


