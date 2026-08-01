    "use strict";

let listaLlantas = [];
let editModeLlantaId = null;
let listaVehiculosLlantas = [];
let listaEmpleadosLlantas = [];
let asignacionesActivasLlantas = [];
let catalogoFormasPagoLlantas = [];
let comprobanteArchivoSeleccionadoLlanta = null;

// Inicializador de eventos al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
    inicializarVistaLlantas();
});

// Inicializa las validaciones, Drag & Drop y catálogos de la vista de Llantas
function inicializarVistaLlantas() {
    const form = document.getElementById("llantaVehiculoForm");
    if (!form) return;

    cargarCatalogosLlantas();
    inicializarCargaEvidencia();
    inicializarCargaComprobante();

    const montoLlanta = document.getElementById("llanta-mnyCosto");
    if (montoLlanta) {
        montoLlanta.addEventListener("input", () => formatCurrencyInput(montoLlanta));
    }
    const kmLlanta = document.getElementById("llanta-decKilometrajeActual");
    if (kmLlanta) {
        kmLlanta.addEventListener("input", () => {
            kmLlanta.value = kmLlanta.value.replace(/[^0-9]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        });
    }

    // Eventos de validación en tiempo real para todos los inputs/selects obligatorios
    form.querySelectorAll("input:not([type='file']):not([type='hidden']), select").forEach(campo => {
        ["input", "change"].forEach(evento => campo.addEventListener(evento, () => {
            const teniaError = campo.classList.contains("is-invalid");
            limpiarErrorCampo(campo);
            if (teniaError) validarCampoLlanta(campo);
        }));

        campo.addEventListener("blur", () => {
            if (campo.type !== "number" && campo.tagName !== "SELECT" && !campo.readOnly) {
                campo.value = campo.value.trim().replace(/\s{2,}/g, " ");
            }
            if (campo.required || campo.value) {
                validarCampoLlanta(campo);
            }
        });
    });

    // Envío asíncrono de los datos de la llanta a guardar en la base de datos
    form.addEventListener("submit", async event => {
        event.preventDefault();
        
        if (!validarFormularioLlanta(form)) {
            Swal.fire({
                icon: "warning",
                title: "Formulario incompleto",
                text: "Revisa los campos obligatorios antes de continuar.",
                confirmButtonColor: "var(--teal-cavex)"
            });
            return;
        }

        Swal.fire({
            title: editModeLlantaId ? "Actualizando llanta..." : "Registrando llanta...",
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const finVidaInput = document.getElementById("llanta-dteFechaFinVidaEstimada").value;
        const rotacionInput = document.getElementById("llanta-dteFechaRotacion").value;
        const sigRotacionInput = document.getElementById("llanta-dteFechaSiguienteRotacion").value;
        const formaPagoVal = document.getElementById("llanta-idVehFormaPago")?.value;

        // Construcción del FormData para soportar la subida física de archivos
        const formData = new FormData();
        formData.append("Id", editModeLlantaId || 0);
        formData.append("IdVehDatosGenerales", parseInt(document.getElementById("llanta-idVehDatosGenerales").value, 10));
        formData.append("IdVehCatMarcaLlanta", parseInt(document.getElementById("llanta-idVehCatMarcaLlanta").value, 10));
        formData.append("StrModelo", document.getElementById("llanta-strModelo").value);
        formData.append("StrMedida", document.getElementById("llanta-strMedida").value);
        formData.append("DteFechaCompra", document.getElementById("llanta-dteFechaCompra").value);
        formData.append("MnyCosto", parseFloat(document.getElementById("llanta-mnyCosto").value.replace(/,/g, "")));
        formData.append("IdVehCatPosicionLlanta", parseInt(document.getElementById("llanta-idVehCatPosicionLlanta").value, 10));
        formData.append("DecKilometrajeActual", parseFloat(document.getElementById("llanta-decKilometrajeActual").value.replace(/,/g, "")));
        
        if (formaPagoVal) formData.append("IdVehFormaPago", parseInt(formaPagoVal, 10));
        if (finVidaInput) formData.append("DteFechaFinVidaEstimada", finVidaInput);
        if (rotacionInput) formData.append("DteFechaRotacion", rotacionInput);
        if (sigRotacionInput) formData.append("DteFechaSiguienteRotacion", sigRotacionInput);
        
        formData.append("StrUrlEvidencia", document.getElementById("llanta-strUrlEvidencia").value || "");
        formData.append("StrUrlComprobantePago", document.getElementById("llanta-strUrlComprobantePago").value || "");
        formData.append("IdVehCatStatus", parseInt(document.getElementById("llanta-idVehCatStatus").value, 10));

        const evidenciaFileInput = document.getElementById("llantaEvidenciaArchivo");
        if (evidenciaFileInput && evidenciaFileInput.files.length > 0) {
            formData.append("EvidenciaArchivo", evidenciaFileInput.files[0]);
        }

        const comprobanteFileInput = document.getElementById("llantaComprobanteArchivo");
        if (comprobanteFileInput && comprobanteFileInput.files.length > 0) {
            formData.append("ComprobanteArchivo", comprobanteFileInput.files[0]);
        }

        try {
            const response = await fetch("/Llantas/SaveLlanta", {
                method: "POST",
                body: formData
            });

            const result = await response.json();
            Swal.close();

            if (!result.success) {
                Swal.fire({
                    icon: "error",
                    title: "Error al registrar",
                    text: result.message || "No fue posible registrar la llanta.",
                    confirmButtonColor: "var(--teal-cavex)"
                });
                return;
            }

            Swal.fire({
                icon: "success",
                title: editModeLlantaId ? "Llanta actualizada" : "Llanta registrada",
                text: editModeLlantaId ? "Los datos de la llanta han sido actualizados exitosamente." : "Los datos de la llanta han sido registrados exitosamente.",
                confirmButtonColor: "var(--teal-cavex)"
            }).then(() => {
                resetearFormularioLlanta();
                cargarLlantasList();
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

// Carga catálogos de vehículos, marcas de llantas, posiciones, formas de pago y estados
async function cargarCatalogosLlantas() {
    try {
        const [vehRes, empRes, asigRes] = await Promise.all([
            fetch("/Vehiculos/GetVehiculos").then(r => r.json()),
            fetch("/Empleado/GetEmpleadosDropdown").then(r => r.json()),
            fetch("/Asignaciones/GetAsignacionesActivas").then(r => r.json()).catch(() => ({ success: false }))
        ]);

        // Empleados y asignaciones
        if (empRes.success && empRes.data) {
            listaEmpleadosLlantas = empRes.data;
        }
        if (asigRes.success && asigRes.data) {
            asignacionesActivasLlantas = asigRes.data;
        }

        const vehIdAsignados = new Set(
            (asignacionesActivasLlantas || [])
                .filter(a => (a.decKilometrajeFinal == null && a.DecKilometrajeFinal == null) || Number(a.decKilometrajeFinal ?? a.DecKilometrajeFinal) === 0)
                .map(a => Number(a.idVehDatosGenerales ?? a.IdVehDatosGenerales))
                .filter(id => !isNaN(id) && id > 0)
        );

        // 1. Cargar solo vehículos asignados
        const select = document.getElementById("llanta-idVehDatosGenerales");
        if (select && vehRes.success && vehRes.data) {
            listaVehiculosLlantas = vehRes.data;
            select.innerHTML = '<option value="">Seleccionar vehículo asignado...</option>';
            vehRes.data.forEach(v => {
                const vId = Number(v.id ?? v.Id);
                if (vehIdAsignados.has(vId)) {
                    const opt = document.createElement("option");
                    opt.value = String(vId);
                    const marcaNombre = (window.obtenerNombreMarcaVehiculo && v) ? window.obtenerNombreMarcaVehiculo(v) : (v.strVehCatMarcaVehiculo || v.StrVehCatMarcaVehiculo || v.strMarca || "");
                    const marcaDisplay = marcaNombre && marcaNombre !== "—" ? marcaNombre + " " : "";
                    opt.textContent = `${v.strPlaca || v.StrPlaca} - ${marcaDisplay}${v.strModelo || v.StrModelo} (${v.intAnio || v.IntAnio})`;
                    select.appendChild(opt);
                }
            });

            select.addEventListener("change", () => {
                const vId = Number(select.value);
                const v = listaVehiculosLlantas.find(veh => Number(veh.id ?? veh.Id) === vId);
                const kmInput = document.getElementById("llanta-decKilometrajeActual");
                if (kmInput) {
                    if (v && (v.decKilometrajeActual != null || v.DecKilometrajeActual != null)) {
                        const km = v.decKilometrajeActual ?? v.DecKilometrajeActual;
                        kmInput.value = Number(km).toLocaleString("es-MX");
                        kmInput.readOnly = true;
                        kmInput.style.backgroundColor = "#e9ecef";
                    } else {
                        kmInput.value = "";
                        kmInput.readOnly = false;
                        kmInput.style.backgroundColor = "";
                    }
                }
            });
        }

    } catch (err) {
        console.error("Error al cargar catálogos base de llantas:", err);
    }

    // Cargar catálogos de llantas (marcas, posiciones, formas de pago, estatus)
    fetch("/Vehiculos/GetVehiculoCatalogos")
        .then(res => res.json())
        .then(result => {
            if (result.success && result.data) {
                // Marcas de llantas
                const selectMarca = document.getElementById("llanta-idVehCatMarcaLlanta");
                if (selectMarca && result.data.idVehCatMarcaLlanta) {
                    selectMarca.innerHTML = '<option value="">Seleccionar...</option>';
                    result.data.idVehCatMarcaLlanta.forEach(item => {
                        const opt = document.createElement("option");
                        opt.value = String(item.id);
                        opt.textContent = item.strValor || item.strDescripcion;
                        selectMarca.appendChild(opt);
                    });
                }

                // Posiciones
                const selectPos = document.getElementById("llanta-idVehCatPosicionLlanta");
                if (selectPos && result.data.idVehCatPosicionLlanta) {
                    selectPos.innerHTML = '<option value="">Seleccionar...</option>';
                    result.data.idVehCatPosicionLlanta.forEach(item => {
                        const opt = document.createElement("option");
                        opt.value = String(item.id);
                        opt.textContent = item.strValor || item.strDescripcion;
                        selectPos.appendChild(opt);
                    });
                }

                // Formas de pago
                const selectFormaPago = document.getElementById("llanta-idVehFormaPago");
                if (selectFormaPago && result.data.idVehCatFormaPago) {
                    catalogoFormasPagoLlantas = result.data.idVehCatFormaPago;
                    selectFormaPago.innerHTML = '<option value="">Seleccionar...</option>';
                    result.data.idVehCatFormaPago.forEach(item => {
                        const opt = document.createElement("option");
                        opt.value = String(item.id);
                        opt.textContent = item.strValor || item.strDescripcion;
                        selectFormaPago.appendChild(opt);
                    });
                }

                // Estatus de la llanta
                const selectStatus = document.getElementById("llanta-idVehCatStatus");
                if (selectStatus && result.data.idVehCatStatus) {
                    selectStatus.innerHTML = '<option value="">Seleccionar...</option>';
                    result.data.idVehCatStatus.forEach(item => {
                        const opt = document.createElement("option");
                        opt.value = String(item.id);
                        opt.textContent = item.strValor || item.strDescripcion;
                        selectStatus.appendChild(opt);
                    });
                    selectStatus.value = "1";
                }
            }
            // Cargar registros de llantas
            cargarLlantasList();
        })
        .catch(() => {});
}

// Configura el Drag & Drop e input de selección de archivo para la Evidencia
function inicializarCargaEvidencia() {
    const area = document.getElementById("llantaEvidenciaArea");
    const input = document.getElementById("llantaEvidenciaArchivo");
    if (!area || !input) return;

    input.addEventListener("click", event => event.stopPropagation());
    area.addEventListener("click", event => {
        if (!event.target.closest(".llanta-file-actions button")) input.click();
    });
    document.getElementById("btnQuitarEvidenciaLlanta")?.addEventListener("click", event => {
        event.stopPropagation();
        limpiarEvidencia();
    });
    area.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            input.click();
        }
    });
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
    area.addEventListener("drop", event => {
        event.preventDefault();
        event.stopPropagation();
        area.classList.remove("is-drag-over");
        const archivo = event.dataTransfer.files?.[0];
        if (archivo) procesarArchivoEvidencia(archivo);
    });
    input.addEventListener("change", () => {
        const archivo = input.files?.[0];
        if (archivo) procesarArchivoEvidencia(archivo);
    });
}

// Configura el Drag & Drop e input para el Comprobante de Pago
function inicializarCargaComprobante() {
    const area = document.getElementById("llantaComprobanteArea");
    const input = document.getElementById("llantaComprobanteArchivo");
    if (!area || !input) return;

    input.addEventListener("click", event => event.stopPropagation());
    area.addEventListener("click", event => {
        if (!event.target.closest(".llanta-file-actions button")) input.click();
    });
    document.getElementById("btnQuitarComprobanteLlanta")?.addEventListener("click", event => {
        event.stopPropagation();
        limpiarComprobante();
    });
    area.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            input.click();
        }
    });
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
    area.addEventListener("drop", event => {
        event.preventDefault();
        event.stopPropagation();
        area.classList.remove("is-drag-over");
        const archivo = event.dataTransfer.files?.[0];
        if (archivo) procesarArchivoComprobante(archivo);
    });
    input.addEventListener("change", () => {
        const archivo = input.files?.[0];
        if (archivo) procesarArchivoComprobante(archivo);
    });
}

function procesarArchivoEvidencia(archivo) {
    const limBytes = 5 * 1024 * 1024;
    const extensionesPermitidas = ["jpg", "jpeg", "png", "webp", "pdf"];

    limpiarErrorEvidencia();
    const ext = archivo.name.split('.').pop().toLowerCase();
    if (!extensionesPermitidas.includes(ext)) {
        mostrarErrorEvidencia("El archivo debe ser PDF, JPG, PNG o WEBP.");
        return;
    }
    if (archivo.size > limBytes) {
        mostrarErrorEvidencia("El archivo supera el límite de 5 MB.");
        return;
    }

    // Sincronizar el archivo con el input nativo usando DataTransfer
    const input = document.getElementById("llantaEvidenciaArchivo");
    if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(archivo);
        input.files = dataTransfer.files;
    }

    const prompt = document.getElementById("llantaEvidenciaPrompt");
    const preview = document.getElementById("llantaFilePreview");
    if (prompt) prompt.style.display = "none";
    if (preview) preview.style.display = "flex";

    document.getElementById("llantaFileName").textContent = archivo.name;
    document.getElementById("llantaFileSize").textContent = (archivo.size / 1024 / 1024).toFixed(2) + " MB";
    document.getElementById("llanta-strUrlEvidencia").value = archivo.name;
}

function procesarArchivoComprobante(archivo) {
    const limBytes = 5 * 1024 * 1024;
    const extensionesPermitidas = ["jpg", "jpeg", "png", "webp", "pdf"];

    limpiarErrorComprobante();
    const ext = archivo.name.split('.').pop().toLowerCase();
    if (!extensionesPermitidas.includes(ext)) {
        mostrarErrorComprobante("El archivo debe ser PDF, JPG, PNG o WEBP.");
        return;
    }
    if (archivo.size > limBytes) {
        mostrarErrorComprobante("El archivo supera el límite de 5 MB.");
        return;
    }

    const input = document.getElementById("llantaComprobanteArchivo");
    if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(archivo);
        input.files = dataTransfer.files;
    }

    comprobanteArchivoSeleccionadoLlanta = archivo;
    const prompt = document.getElementById("llantaComprobantePrompt");
    const preview = document.getElementById("llantaComprobanteFilePreview");
    if (prompt) prompt.style.display = "none";
    if (preview) preview.style.display = "flex";

    document.getElementById("llantaComprobanteFileName").textContent = archivo.name;
    document.getElementById("llantaComprobanteFileSize").textContent = (archivo.size / 1024 / 1024).toFixed(2) + " MB";
    document.getElementById("llanta-strUrlComprobantePago").value = archivo.name;
}

function limpiarEvidencia() {
    const input = document.getElementById("llantaEvidenciaArchivo");
    if (input) input.value = "";
    const hidden = document.getElementById("llanta-strUrlEvidencia");
    if (hidden) hidden.value = "";
    
    const prompt = document.getElementById("llantaEvidenciaPrompt");
    const preview = document.getElementById("llantaFilePreview");
    if (prompt) prompt.style.display = "flex";
    if (preview) preview.style.display = "none";
    
    limpiarErrorEvidencia();
}

function limpiarComprobante() {
    comprobanteArchivoSeleccionadoLlanta = null;
    const input = document.getElementById("llantaComprobanteArchivo");
    if (input) input.value = "";
    const hidden = document.getElementById("llanta-strUrlComprobantePago");
    if (hidden) hidden.value = "";
    
    const prompt = document.getElementById("llantaComprobantePrompt");
    const preview = document.getElementById("llantaComprobanteFilePreview");
    if (prompt) prompt.style.display = "flex";
    if (preview) preview.style.display = "none";
    
    limpiarErrorComprobante();
}

function mostrarErrorEvidencia(mensaje) {
    document.getElementById("llantaEvidenciaArea")?.classList.add("is-invalid");
    const error = document.getElementById("llantaEvidenciaArchivoError");
    if (error) { error.textContent = mensaje; error.classList.add("d-block"); }
}

function limpiarErrorEvidencia() {
    document.getElementById("llantaEvidenciaArea")?.classList.remove("is-invalid");
    const error = document.getElementById("llantaEvidenciaArchivoError");
    if (error) { error.textContent = ""; error.classList.remove("d-block"); }
}

function mostrarErrorComprobante(mensaje) {
    document.getElementById("llantaComprobanteArea")?.classList.add("is-invalid");
    const error = document.getElementById("llantaComprobanteArchivoError");
    if (error) { error.textContent = mensaje; error.classList.add("d-block"); }
}

function limpiarErrorComprobante() {
    document.getElementById("llantaComprobanteArea")?.classList.remove("is-invalid");
    const error = document.getElementById("llantaComprobanteArchivoError");
    if (error) { error.textContent = ""; error.classList.remove("d-block"); }
}

// Realiza validación lógica del formulario
function validarFormularioLlanta(form) {
    const obligatorios = [
        "llanta-idVehDatosGenerales", "llanta-idVehCatMarcaLlanta", "llanta-strModelo",
        "llanta-strMedida", "llanta-idVehCatPosicionLlanta", "llanta-dteFechaCompra",
        "llanta-mnyCosto", "llanta-decKilometrajeActual", "llanta-idVehCatStatus"
    ];
    let valido = true;
    obligatorios.forEach(id => {
        const campo = document.getElementById(id);
        if (campo && !validarCampoLlanta(campo)) valido = false;
    });

    // Validaciones de fechas cruzadas
    const compra = document.getElementById("llanta-dteFechaCompra")?.value;
    const vida = document.getElementById("llanta-dteFechaFinVidaEstimada");
    const rot = document.getElementById("llanta-dteFechaRotacion");
    const sig = document.getElementById("llanta-dteFechaSiguienteRotacion");

    if (compra) {
        if (vida && vida.value && vida.value < compra) {
            mensajeCampo(vida, "La fecha de vida estimada debe ser igual o posterior a la compra.");
            valido = false;
        }
        if (rot && rot.value && rot.value < compra) {
            mensajeCampo(rot, "La fecha de rotación debe ser igual o posterior a la compra.");
            valido = false;
        }
        if (sig && sig.value && sig.value < compra) {
            mensajeCampo(sig, "La siguiente rotación debe ser igual o posterior a la compra.");
            valido = false;
        }
    }

    const primerError = form.querySelector(".is-invalid");
    if (primerError) {
        primerError.scrollIntoView({ behavior: "smooth", block: "center" });
        if (typeof primerError.focus === "function") primerError.focus({ preventScroll: true });
    }
    return valido;
}

function mensajeCampo(campo, msg) {
    campo.classList.remove("is-valid");
    campo.classList.add("is-invalid");
    campo.setAttribute("aria-invalid", "true");
    const error = document.getElementById(`${campo.id}Error`);
    if (error) error.textContent = msg;
}

// Valida valores individuales e intervalos válidos
function validarCampoLlanta(campo) {
    const original = String(campo.value || "");
    const valor = original.trim();
    let mensaje = "";

    if (campo.required && !valor) {
        mensaje = campo.tagName === "SELECT" ? "Selecciona una opción." : "Este campo es obligatorio.";
    }

    if (!mensaje) {
        switch (campo.id) {
            case "llanta-strModelo":
                if (valor.length > 50) mensaje = "El modelo no debe superar 50 caracteres.";
                break;
            case "llanta-strMedida":
                if (valor.length > 50) mensaje = "La medida no debe superar 50 caracteres.";
                break;
            case "llanta-mnyCosto": {
                const rawVal = valor.replace(/,/g, "");
                const num = Number(rawVal);
                if (isNaN(num) || num < 0 || num > 999999) {
                    mensaje = "Monto del costo no válido.";
                }
                break;
            }
            case "llanta-decKilometrajeActual": {
                const rawVal = valor.replace(/,/g, "");
                const num = Number(rawVal);
                if (isNaN(num) || num < 0 || num > 999999) {
                    mensaje = "Kilometraje no válido.";
                }
                break;
            }
        }
    }

    if (mensaje) {
        mensajeCampo(campo, mensaje);
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

// ─── CRUD Actions y Renderizado ───

async function cargarLlantasList() {
    try {
        const response = await fetch("/Marcas/GetLlantas");
        const result = await response.json();
        if (result.success && result.data) {
            listaLlantas = result.data;
        } else {
            listaLlantas = [];
        }
        renderLlantasTable();
    } catch (err) {
        console.error("Error al cargar llantas:", err);
        listaLlantas = [];
        renderLlantasTable();
    }
}

// Dibuja la tabla de llantas registradas en pantalla
function renderLlantasTable() {
    const tbody = document.getElementById("llantasTableBody");
    if (!tbody) return;

    // Si la lista está vacía, mostramos un renglón informativo con colspan 5
    if (!listaLlantas || listaLlantas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="5" class="text-center text-muted py-4">No se encontraron llantas registradas.</td></tr>';
        return;
    }

    // Mapeamos cada llanta a un renglón (tr) de la tabla
    tbody.innerHTML = listaLlantas.map(ll => {
        // Buscamos los datos completos del vehículo vinculado
        const vehIdTarget = Number(ll.idVehDatosGenerales ?? ll.IdVehDatosGenerales);
        const v = listaVehiculosLlantas.find(veh => Number(veh.id ?? veh.Id) === vehIdTarget);
        const marcaNombre = (window.obtenerNombreMarcaVehiculo && v) ? window.obtenerNombreMarcaVehiculo(v) : (v ? (v.strVehCatMarcaVehiculo || v.StrVehCatMarcaVehiculo || v.strMarca || "Desconocida") : "Desconocida");
        const modelo = v ? (v.strModelo || v.StrModelo || "Desconocido") : "Desconocido";
        const placa = v ? (v.strPlaca || v.StrPlaca || "—") : "—";
        const brandModel = `${marcaNombre} ${modelo}`;

        // Buscamos el chofer asignado actualmente a este vehículo
        const asig = asignacionesActivasLlantas.find(a => Number(a.idVehDatosGenerales ?? a.IdVehDatosGenerales) === vehIdTarget);
        let responsableName = "Sin chofer asignado";
        if (asig) {
            const empIdTarget = Number(asig.idEmpEmpleado ?? asig.IdEmpEmpleado);
            const emp = listaEmpleadosLlantas.find(e => Number(e.id ?? e.Id) === empIdTarget);
            responsableName = emp ? ((emp.strNombre || emp.StrNombre || "") + " " + (emp.strApellidoPaterno || emp.StrApellidoPaterno || "") + ((emp.strApellidoMaterno || emp.StrApellidoMaterno) ? " " + (emp.strApellidoMaterno || emp.StrApellidoMaterno) : "")).trim() : "Chofer asignado";
        }

        const statusNombre = ll.strVehCatStatus || ll.StrVehCatStatus || "Activa";

        // Retornamos el HTML del renglón con las 5 columnas correspondientes
        return `
            <tr>
                <td>${escapeHtml(brandModel)}</td>
                <td><span class="badge bg-light text-dark border">${escapeHtml(placa)}</span></td>
                <td>${escapeHtml(responsableName)}</td>
                <td><span class="badge bg-secondary">${escapeHtml(statusNombre)}</span></td>
                <td class="text-end">
                    <div class="dropdown actions-dropdown d-inline-block">
                        <button class="btn-action-trigger btn-sm" type="button" data-bs-toggle="dropdown" aria-expanded="false">
                            <span>Acciones</span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li>
                                <button class="dropdown-item d-flex align-items-center" type="button" onclick="verDetalleLlanta(${ll.id})">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 text-info"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                    Ver detalles
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item d-flex align-items-center" type="button" onclick="editarLlanta(${ll.id})">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 text-primary"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    Editar
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item d-flex align-items-center text-danger" type="button" onclick="eliminarLlanta(${ll.id})">
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
        new bootstrap.Dropdown(el);
    });
}

function verDetalleLlanta(id) {
    const ll = listaLlantas.find(item => item.id === id);
    if (!ll) return;

    const v = listaVehiculosLlantas.find(veh => veh.id === ll.idVehDatosGenerales);
    
    // Obtener chofer asignado actualmente a este vehículo
    const asig = asignacionesActivasLlantas.find(a => a.idVehDatosGenerales === ll.idVehDatosGenerales);
    let responsableName = "Sin chofer asignado";
    if (asig) {
        const emp = listaEmpleadosLlantas.find(e => e.id === asig.idEmpEmpleado);
        responsableName = emp ? (emp.strNombre + " " + emp.strApellidoPaterno + (emp.strApellidoMaterno ? " " + emp.strApellidoMaterno : "")) : "Chofer asignado";
    }

    const formaPagoObj = catalogoFormasPagoLlantas.find(fp => Number(fp.id) === Number(ll.idVehFormaPago));
    const formaPagoNombre = ll.strVehCatFormaPago || (formaPagoObj ? (formaPagoObj.strValor || formaPagoObj.strDescripcion) : "No especificada");

    const comprobanteLink = ll.strUrlComprobantePago 
        ? `<a href="${escapeHtml(ll.strUrlComprobantePago)}" target="_blank" class="text-cavex text-decoration-none fw-semibold">Ver comprobante</a>`
        : "Sin comprobante";
    const evidenciaLink = ll.strUrlEvidencia
        ? `<a href="${escapeHtml(ll.strUrlEvidencia)}" target="_blank" class="text-cavex text-decoration-none fw-semibold">Ver evidencia</a>`
        : "Sin evidencia";

    Swal.fire({
        title: "Detalle de Registro de Llanta",
        html: `
            <div class="text-start fs-6" style="line-height: 1.6;">
                <p><strong>Vehículo:</strong> ${v ? `${v.strModelo} (${v.intAnio})` : "Desconocido"}</p>
                <p><strong>Placa:</strong> ${v ? v.strPlaca : "—"}</p>
                <p><strong>Chofer Responsable:</strong> ${responsableName}</p>
                <p><strong>Marca de Llanta:</strong> ${escapeHtml(ll.strVehCatMarcaLlanta)}</p>
                <p><strong>Modelo de Llanta:</strong> ${escapeHtml(ll.strModelo)}</p>
                <p><strong>Medida:</strong> ${escapeHtml(ll.strMedida)}</p>
                <p><strong>Posición:</strong> ${escapeHtml(ll.strVehCatPosicionLlanta)}</p>
                <p><strong>Estatus:</strong> <span class="badge bg-secondary">${escapeHtml(ll.strVehCatStatus)}</span></p>
                <p><strong>Kilometraje Actual:</strong> ${Number(ll.decKilometrajeActual).toLocaleString("es-MX")} km</p>
                <p><strong>Costo:</strong> $${Number(ll.mnyCosto).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
                <p><strong>Forma de Pago:</strong> ${escapeHtml(formaPagoNombre)}</p>
                <p><strong>Comprobante de Pago:</strong> ${comprobanteLink}</p>
                <p><strong>Evidencia:</strong> ${evidenciaLink}</p>
                <p><strong>Fecha Compra:</strong> ${ll.dteFechaCompra ? new Date(ll.dteFechaCompra).toLocaleDateString("es-MX") : "—"}</p>
                <p><strong>Vida Estimada:</strong> ${ll.dteFechaFinVidaEstimada ? new Date(ll.dteFechaFinVidaEstimada).toLocaleDateString("es-MX") : "No especificada"}</p>
                <p><strong>Última Rotación:</strong> ${ll.dteFechaRotacion ? new Date(ll.dteFechaRotacion).toLocaleDateString("es-MX") : "No especificada"}</p>
                <p><strong>Siguiente Rotación:</strong> ${ll.dteFechaSiguienteRotacion ? new Date(ll.dteFechaSiguienteRotacion).toLocaleDateString("es-MX") : "No especificada"}</p>
            </div>
        `,
        confirmButtonColor: "var(--teal-cavex)"
    });
}

function editarLlanta(id) {
    const ll = listaLlantas.find(item => item.id === id);
    if (!ll) return;

    editModeLlantaId = id;

    document.getElementById("llanta-idVehDatosGenerales").value = ll.idVehDatosGenerales;
    const kmEl = document.getElementById("llanta-decKilometrajeActual");
    if (kmEl) {
        kmEl.value = ll.decKilometrajeActual;
        if (kmEl.value) kmEl.value = kmEl.value.replace(/[^0-9]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    document.getElementById("llanta-idVehCatMarcaLlanta").value = ll.idVehCatMarcaLlanta;
    document.getElementById("llanta-strModelo").value = ll.strModelo;
    document.getElementById("llanta-strMedida").value = ll.strMedida;
    document.getElementById("llanta-dteFechaCompra").value = ll.dteFechaCompra ? ll.dteFechaCompra.split("T")[0] : "";
    const costEl = document.getElementById("llanta-mnyCosto");
    if (costEl) {
        costEl.value = ll.mnyCosto;
        if (costEl.value) formatCurrencyInput(costEl);
    }
    document.getElementById("llanta-idVehCatPosicionLlanta").value = ll.idVehCatPosicionLlanta;
    
    const formaPagoEl = document.getElementById("llanta-idVehFormaPago");
    if (formaPagoEl && ll.idVehFormaPago) formaPagoEl.value = String(ll.idVehFormaPago);

    document.getElementById("llanta-idVehCatStatus").value = ll.idVehCatStatus;

    document.getElementById("llanta-dteFechaFinVidaEstimada").value = ll.dteFechaFinVidaEstimada ? ll.dteFechaFinVidaEstimada.split("T")[0] : "";
    document.getElementById("llanta-dteFechaRotacion").value = ll.dteFechaRotacion ? ll.dteFechaRotacion.split("T")[0] : "";
    document.getElementById("llanta-dteFechaSiguienteRotacion").value = ll.dteFechaSiguienteRotacion ? ll.dteFechaSiguienteRotacion.split("T")[0] : "";

    // Cargar Previa de Evidencia
    if (ll.strUrlEvidencia) {
        document.getElementById("llanta-strUrlEvidencia").value = ll.strUrlEvidencia;
        const prompt = document.getElementById("llantaEvidenciaPrompt");
        const preview = document.getElementById("llantaFilePreview");
        if (prompt) prompt.style.display = "none";
        if (preview) preview.style.display = "flex";
        document.getElementById("llantaFileName").textContent = ll.strUrlEvidencia.split("/").pop();
        document.getElementById("llantaFileSize").textContent = "Evidencia guardada";
    } else {
        limpiarEvidencia();
    }

    // Cargar Previa de Comprobante
    if (ll.strUrlComprobantePago) {
        document.getElementById("llanta-strUrlComprobantePago").value = ll.strUrlComprobantePago;
        const promptComp = document.getElementById("llantaComprobantePrompt");
        const previewComp = document.getElementById("llantaComprobanteFilePreview");
        if (promptComp) promptComp.style.display = "none";
        if (previewComp) previewComp.style.display = "flex";
        document.getElementById("llantaComprobanteFileName").textContent = ll.strUrlComprobantePago.split("/").pop();
        document.getElementById("llantaComprobanteFileSize").textContent = "Comprobante guardado";
    } else {
        limpiarComprobante();
    }

    document.getElementById("llantaVehiculoForm").scrollIntoView({ behavior: "smooth" });
}

function eliminarLlanta(id) {
    Swal.fire({
        title: "¿Estás seguro?",
        text: "Este registro de llanta será eliminado permanentemente.",
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
                const response = await fetch(`/Llantas/DeleteLlanta/${id}`, { method: "POST" });
                const res = await response.json();
                Swal.close();
                if (res.success) {
                    Swal.fire("Eliminado", "El registro ha sido eliminado.", "success");
                    cargarLlantasList();
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

function resetearFormularioLlanta() {
    editModeLlantaId = null;
    const form = document.getElementById("llantaVehiculoForm");
    if (form) {
        form.reset();
        form.querySelectorAll(".is-valid, .is-invalid").forEach(el => el.classList.remove("is-valid", "is-invalid"));
        
        // Por defecto: Activo (1)
        const statusSelect = document.getElementById("llanta-idVehCatStatus");
        if (statusSelect) statusSelect.value = "1";
    }
    limpiarEvidencia();
    limpiarComprobante();
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

function escapeHtml(text) {
    return String(text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}
