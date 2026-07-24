"use strict";

// Variable global para almacenar el archivo comprobante de gasolina seleccionado
let comprobanteArchivoSeleccionado = null;
// Datos globales para vinculación vehículo-chofer
let listaVehiculosGasolina = [];
let listaEmpleadosGasolina = [];
let asignacionesActivasGasolina = [];

// Inicializador de eventos al cargar el DOM
document.addEventListener("DOMContentLoaded", () => {
    inicializarVistaGasolina();
});

// Inicializa validaciones, carga de catálogos y el envío de datos de cargas de gasolina
function inicializarVistaGasolina() {
    const form = document.getElementById("gasolinaVehiculoForm");
    if (!form) return;

    cargarCatalogosGasolina();
    inicializarCalculoLitros();
    inicializarCargaComprobante();

    const montoG = document.getElementById("gasolina-mnyMontoPagado");
    if (montoG) {
        montoG.addEventListener("input", () => formatCurrencyInput(montoG));
    }
    const precioG = document.getElementById("gasolina-mnyPrecioLitro");
    if (precioG) {
        precioG.addEventListener("input", () => formatCurrencyInput(precioG));
    }
    const kmG = document.getElementById("gasolina-decKilometrajeActual");
    if (kmG) {
        kmG.addEventListener("input", () => {
            kmG.value = kmG.value.replace(/[^0-9]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        });
    }

    // Eventos de validación en tiempo real para todos los inputs/selects obligatorios
    form.querySelectorAll("input:not([type='file']):not([type='hidden']), select").forEach(campo => {
        ["input", "change"].forEach(evento => campo.addEventListener(evento, () => {
            const teniaError = campo.classList.contains("is-invalid");
            limpiarErrorCampo(campo);
            if (teniaError) validarCampoGasolina(campo);
        }));

        campo.addEventListener("blur", () => {
            if (campo.type !== "number" && campo.tagName !== "SELECT" && !campo.readOnly) {
                campo.value = campo.value.trim().replace(/\s{2,}/g, " ");
            }
            if (campo.required || campo.value) {
                validarCampoGasolina(campo);
            }
        });
    });


    // Envío del formulario al backend para registrar la carga de combustible
    form.addEventListener("submit", async event => {
        event.preventDefault();
        
        if (!validarFormularioGasolina(form)) {
            Swal.fire({
                icon: "warning",
                title: "Formulario incompleto",
                text: "Revisa los campos obligatorios antes de continuar.",
                confirmButtonColor: "var(--teal-cavex)"
            });
            return;
        }

        Swal.fire({
            title: "Registrando carga...",
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        // Construcción de FormData para soportar multipart upload del archivo comprobante
        const formData = new FormData();
        formData.append("Id", editModeGasolinaId || 0);
        formData.append("IdVehDatosGenerales", parseInt(document.getElementById("gasolina-idVehDatosGenerales").value, 10));
        formData.append("DteFechaCarga", document.getElementById("gasolina-dteFechaCarga").value);
        formData.append("MnyMontoPagado", parseFloat(document.getElementById("gasolina-mnyMontoPagado").value.replace(/,/g, "")));
        formData.append("MnyPrecioLitro", parseFloat(document.getElementById("gasolina-mnyPrecioLitro").value.replace(/,/g, "")));
        formData.append("DecKilometrajeActual", parseFloat(document.getElementById("gasolina-decKilometrajeActual").value.replace(/,/g, "")));
        formData.append("IdVehFormaPago", parseInt(document.getElementById("gasolina-idVehFormaPago").value, 10));
        formData.append("StrUrlComprobantePago", document.getElementById("gasolina-strUrlComprobantePago").value || "");
        formData.append("IdVehCatGasolineras", parseInt(document.getElementById("gasolina-idVehCatGasolineras").value, 10));
        formData.append("IdEmpEmpleado", parseInt(document.getElementById("gasolina-idEmpEmpleado").value, 10));

        const fileInput = document.getElementById("gasolinaComprobanteArchivo");
        if (fileInput && fileInput.files.length > 0) {
            formData.append("ComprobanteArchivo", fileInput.files[0]);
        }

        try {
            const response = await fetch("/Gasolina/SaveGasolina", {
                method: "POST",
                body: formData
            });

            const result = await response.json();
            Swal.close();

            if (!result.success) {
                Swal.fire({
                    icon: "error",
                    title: "Error al registrar",
                    text: result.message || "No fue posible registrar la carga de combustible.",
                    confirmButtonColor: "var(--teal-cavex)"
                });
                return;
            }

            Swal.fire({
                icon: "success",
                title: editModeGasolinaId ? "Carga actualizada" : "Carga registrada",
                text: editModeGasolinaId ? "Los datos de la carga de combustible han sido actualizados exitosamente." : "Los datos de la carga de combustible han sido registrados exitosamente.",
                confirmButtonColor: "var(--teal-cavex)"
            }).then(() => {
                resetearFormularioGasolina();
                cargarGasolinaList();
            });
        } catch (err) {
            Swal.close();
            Swal.fire({
                icon: "error",
                title: "Error de conexión",
                text: "No se pudo establecer. ¡Intenta de nuevo!",
                confirmButtonColor: "var(--teal-cavex)"
            });
        }
    });
}

// Carga los catálogos de vehículos, empleados, gasolineras y formas de pago desde la base de datos
async function cargarCatalogosGasolina() {
    try {
        const [vehRes, empRes, asigRes] = await Promise.all([
            obtenerVehiculosActivosDropdown(),
            fetch("/Empleado/GetEmpleadosDropdown").then(r => r.json()),
            fetch("/Asignaciones/GetAsignacionesActivas").then(r => r.json()).catch(() => ({ success: false }))
        ]);

        // Asignaciones activas para vinculación y filtrado
        if (asigRes.success && asigRes.data) {
            asignacionesActivasGasolina = asigRes.data;
        }

        const vehIdAsignados = new Set(
            (asignacionesActivasGasolina || [])
                .map(a => Number(a.idVehDatosGenerales ?? a.IdVehDatosGenerales))
                .filter(id => !isNaN(id) && id > 0)
        );

        const empIdAsignados = new Set(
            (asignacionesActivasGasolina || [])
                .map(a => Number(a.idEmpEmpleado ?? a.IdEmpEmpleado))
                .filter(id => !isNaN(id) && id > 0)
        );

        // 1. Cargar solo vehículos asignados
        const selectVeh = document.getElementById("gasolina-idVehDatosGenerales");

        if (selectVeh && vehRes.success && vehRes.data) {
            listaVehiculosGasolina = vehRes.data.items || [];

            selectVeh.innerHTML = '<option value="">Seleccionar vehículo asignado...</option>';

            listaVehiculosGasolina.forEach(v => {
                const vId = Number(v.id ?? v.Id);

                if (vehIdAsignados.has(vId)) {
                    const opt = document.createElement("option");
                    opt.value = String(vId);
                    opt.textContent = `${v.strPlaca || v.StrPlaca} - ${v.strMarca || v.StrMarca} ${v.strModelo || v.StrModelo} (${v.intAnio || v.IntAnio})`;
                    selectVeh.appendChild(opt);
                }
            });
        }

        // 2. Cargar solo empleados asignados
        const selectEmp = document.getElementById("gasolina-idEmpEmpleado");
        if (selectEmp && empRes.success && empRes.data) {
            listaEmpleadosGasolina = empRes.data;
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
        let isVinculandoGasolina = false;

        selectVeh?.addEventListener("change", () => {
            if (isVinculandoGasolina) return;
            isVinculandoGasolina = true;
            try {
                const vehId = parseInt(selectVeh.value, 10);
                if (editModeGasolinaId === null) {
                    if (vehId) {
                        const asig = asignacionesActivasGasolina.find(a => a.idVehDatosGenerales === vehId);
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
                    const asig = asignacionesActivasGasolina.find(a => a.idVehDatosGenerales === vehId);
                    if (asig && selectEmp) {
                        if (selectEmp.value !== String(asig.idEmpEmpleado)) {
                            selectEmp.value = String(asig.idEmpEmpleado);
                            selectEmp.dispatchEvent(new Event("change", { bubbles: true }));
                        }
                    }
                }
            } finally {
                isVinculandoGasolina = false;
            }
        });

        selectEmp?.addEventListener("change", () => {
            if (isVinculandoGasolina) return;
            isVinculandoGasolina = true;
            try {
                const empId = parseInt(selectEmp.value, 10);
                if (editModeGasolinaId === null) {
                    if (empId) {
                        const asig = asignacionesActivasGasolina.find(a => a.idEmpEmpleado === empId);
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
                    const asig = asignacionesActivasGasolina.find(a => a.idEmpEmpleado === empId);
                    if (asig && selectVeh) {
                        if (selectVeh.value !== String(asig.idVehDatosGenerales)) {
                            selectVeh.value = String(asig.idVehDatosGenerales);
                            selectVeh.dispatchEvent(new Event("change", { bubbles: true }));
                        }
                    }
                }
            } finally {
                isVinculandoGasolina = false;
            }
        });
    } catch (err) {
        console.error("Error al cargar catálogos de gasolina:", err);
    }

    // 3. Cargar catálogos de gasolineras y formas de pago
    fetch("/Vehiculos/GetVehiculoCatalogos")
        .then(res => res.json())
        .then(result => {
            if (result.success && result.data) {
                // Gasolineras
                const selectGas = document.getElementById("gasolina-idVehCatGasolineras");
                if (selectGas && result.data.idVehCatGasolineras) {
                    selectGas.innerHTML = '<option value="">Seleccionar...</option>';
                    result.data.idVehCatGasolineras.forEach(item => {
                        const opt = document.createElement("option");
                        opt.value = String(item.id);
                        opt.textContent = item.strValor || item.strDescripcion;
                        selectGas.appendChild(opt);
                    });
                }

                // Formas de pago
                const selectPago = document.getElementById("gasolina-idVehFormaPago");
                if (selectPago && result.data.idVehCatFormaPago) {
                    selectPago.innerHTML = '<option value="">Seleccionar...</option>';
                    result.data.idVehCatFormaPago.forEach(item => {
                        const opt = document.createElement("option");
                        opt.value = String(item.id);
                        opt.textContent = item.strValor || item.strDescripcion;
                        selectPago.appendChild(opt);
                    });
                }
            }
            // Cargar registros de gasolina
            cargarGasolinaList();
        })
        .catch(() => {});
}

// Calcula dinámicamente los litros estimados basados en Monto / Precio por litro
function inicializarCalculoLitros() {
    const monto = document.getElementById("gasolina-mnyMontoPagado");
    const precio = document.getElementById("gasolina-mnyPrecioLitro");
    const litros = document.getElementById("gasolinaLitrosEstimados");

    if (!monto || !precio || !litros) return;

    const calcular = () => {
        const valMonto = parseFloat(monto.value.replace(/,/g, "")) || 0;
        const valPrecio = parseFloat(precio.value.replace(/,/g, "")) || 0;
        if (valMonto > 0 && valPrecio > 0) {
            litros.textContent = (valMonto / valPrecio).toFixed(2) + " L";
        } else {
            litros.textContent = "0.00 L";
        }
    };

    monto.addEventListener("input", calcular);
    precio.addEventListener("input", calcular);
}

// Configura el área de Drag & Drop y la selección manual del archivo de comprobante de gasolina
function inicializarCargaComprobante() {
    const area = document.getElementById("gasolinaComprobanteArea");
    const input = document.getElementById("gasolinaComprobanteArchivo");
    if (!area || !input) return;

    input.addEventListener("click", event => {
        event.stopPropagation();
    });

    // Al hacer clic en el área, abre el selector de archivos nativo (evitando el botón Quitar)
    area.addEventListener("click", event => {
        if (event.target.closest("#btnQuitarComprobanteGasolina")) {
            return;
        }
        input.click();
    });

    document.getElementById("btnQuitarComprobanteGasolina")?.addEventListener("click", event => {
        event.stopPropagation();
        limpiarComprobante();
    });

    // Permite abrir el selector al presionar Enter o Espacio estando enfocados
    area.addEventListener("keydown", event => {
        if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            input.click();
        }
    });

    // Cambia la clase visual del área al arrastrar un archivo sobre ella
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

    // Procesa el archivo soltado en el área
    area.addEventListener("drop", event => {
        event.preventDefault();
        event.stopPropagation();
        area.classList.remove("is-drag-over");
        const archivo = event.dataTransfer.files?.[0];
        if (archivo) procesarArchivoComprobante(archivo);
    });

    // Procesa el archivo cuando es seleccionado manualmente a través del explorador
    input.addEventListener("change", () => {
        const archivo = input.files?.[0];
        if (archivo) procesarArchivoComprobante(archivo);
    });
}

// Valida el formato y tamaño del archivo de comprobante de gasolina (usando la extensión del nombre)
function procesarArchivoComprobante(archivo) {
    const limBytes = 5 * 1024 * 1024;
    const extensionesPermitidas = ["jpg", "jpeg", "png", "webp", "pdf"];

    limpiarErrorComprobante();

    // Extrae y valida la extensión del archivo para mayor compatibilidad en Windows
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
    const input = document.getElementById("gasolinaComprobanteArchivo");
    if (input) {
        const dataTransfer = new DataTransfer();
        dataTransfer.items.add(archivo);
        input.files = dataTransfer.files;
    }

    comprobanteArchivoSeleccionado = archivo;
    renderizarPreviaComprobante();
}

function renderizarPreviaComprobante() {
    const prompt = document.getElementById("gasolinaComprobantePrompt");
    const preview = document.getElementById("gasolinaFilePreview");
    const hidden = document.getElementById("gasolina-strUrlComprobantePago");
    if (!prompt || !preview) return;

    const urlExistente = hidden ? hidden.value : "";

    if (!comprobanteArchivoSeleccionado && !urlExistente) {
        prompt.style.display = "flex";
        preview.style.display = "none";
        return;
    }

    prompt.style.display = "none";
    preview.style.display = "flex";

    const nameText = document.getElementById("gasolinaFileName");
    const sizeText = document.getElementById("gasolinaFileSize");

    if (urlExistente) {
        const name = urlExistente.split("/").pop();
        if (nameText) nameText.textContent = name;
        if (sizeText) sizeText.textContent = "Comprobante guardado";
    } else if (comprobanteArchivoSeleccionado) {
        if (nameText) nameText.textContent = comprobanteArchivoSeleccionado.name;
        if (sizeText) sizeText.textContent = (comprobanteArchivoSeleccionado.size / 1024 / 1024).toFixed(2) + " MB";
    }
}

window.quitarComprobanteExistenteGasolina = function() {
    const hidden = document.getElementById("gasolina-strUrlComprobantePago");
    if (hidden) hidden.value = "";
    renderizarPreviaComprobante();
};

window.quitarArchivoComprobanteGasolina = function() {
    comprobanteArchivoSeleccionado = null;
    const input = document.getElementById("gasolinaComprobanteArchivo");
    if (input) input.value = "";
    renderizarPreviaComprobante();
};

// Limpia el input del comprobante de pago cargado
function limpiarComprobante() {
    comprobanteArchivoSeleccionado = null;
    const input = document.getElementById("gasolinaComprobanteArchivo");
    if (input) input.value = "";
    const hidden = document.getElementById("gasolina-strUrlComprobantePago");
    if (hidden) hidden.value = "";
    
    const prompt = document.getElementById("gasolinaComprobantePrompt");
    const preview = document.getElementById("gasolinaFilePreview");
    if (prompt) prompt.style.display = "flex";
    if (preview) preview.style.display = "none";
    limpiarErrorComprobante();
}

function mostrarErrorComprobante(mensaje) {
    document.getElementById("gasolinaComprobanteArea")?.classList.add("is-invalid");
    const error = document.getElementById("gasolinaComprobanteArchivoError");
    if (error) { error.textContent = mensaje; error.classList.add("d-block"); }
}

function limpiarErrorComprobante() {
    document.getElementById("gasolinaComprobanteArea")?.classList.remove("is-invalid");
    const error = document.getElementById("gasolinaComprobanteArchivoError");
    if (error) { error.textContent = ""; error.classList.remove("d-block"); }
}

// Realiza la validación del conjunto de campos requeridos del formulario
function validarFormularioGasolina(form) {
    const obligatorios = [
        "gasolina-idVehDatosGenerales", "gasolina-dteFechaCarga", "gasolina-decKilometrajeActual",
        "gasolina-idVehCatGasolineras", "gasolina-mnyMontoPagado", "gasolina-mnyPrecioLitro",
        "gasolina-idVehFormaPago", "gasolina-idEmpEmpleado"
    ];
    let valido = true;
    obligatorios.forEach(id => {
        const campo = document.getElementById(id);
        if (campo && !validarCampoGasolina(campo)) valido = false;
    });

    const primerError = form.querySelector(".is-invalid");
    if (primerError) {
        primerError.scrollIntoView({ behavior: "smooth", block: "center" });
        if (typeof primerError.focus === "function") primerError.focus({ preventScroll: true });
    }
    return valido;
}

// Ejecuta la validación lógica y de rango para campos específicos
function validarCampoGasolina(campo) {
    const original = String(campo.value || "");
    const valor = original.trim();
    let mensaje = "";

    if (campo.required && !valor) {
        mensaje = campo.tagName === "SELECT" ? "Selecciona una opción." : "Este campo es obligatorio.";
    }

    if (!mensaje) {
        switch (campo.id) {
            case "gasolina-decKilometrajeActual": {
                const rawVal = valor.replace(/,/g, "");
                const num = Number(rawVal);
                if (isNaN(num) || num < 0 || num > 999999) {
                    mensaje = "Kilometraje no válido.";
                }
                break;
            }
            case "gasolina-mnyMontoPagado": {
                const rawVal = valor.replace(/,/g, "");
                const num = Number(rawVal);
                if (isNaN(num) || num <= 0 || num > 999999) {
                    mensaje = "Monto pagado no válido (debe ser mayor a 0).";
                }
                break;
            }
            case "gasolina-mnyPrecioLitro": {
                const rawVal = valor.replace(/,/g, "");
                const num = Number(rawVal);
                if (isNaN(num) || num <= 0 || num > 999) {
                    mensaje = "Precio por litro no válido (debe ser mayor a 0).";
                }
                break;
            }
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

// Restablece el estado de error de un input
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
let listaGasolinas = [];
let editModeGasolinaId = null;

async function cargarGasolinaList() {
    try {
        const response = await fetch("/Gasolina/GetGasolinas");
        const result = await response.json();
        if (result.success && result.data) {
            listaGasolinas = result.data;
        } else {
            listaGasolinas = [];
        }
        renderGasolinaTable();
    } catch (err) {
        console.error("Error al cargar gasolina:", err);
        listaGasolinas = [];
        renderGasolinaTable();
    }
}

function renderGasolinaTable() {
    const tbody = document.getElementById("gasolinaTableBody");
    if (!tbody) return;

    if (!listaGasolinas || listaGasolinas.length === 0) {
        tbody.innerHTML = '<tr><td colspan="4" class="text-center text-muted py-4">No se encontraron cargas de gasolina registradas.</td></tr>';
        return;
    }

    tbody.innerHTML = listaGasolinas.map(g => {
        const vehIdTarget = Number(g.idVehDatosGenerales ?? g.IdVehDatosGenerales);
        const v = listaVehiculosGasolina.find(veh => Number(veh.id ?? veh.Id) === vehIdTarget);
        const marca = (window.obtenerNombreMarcaVehiculo && v) ? window.obtenerNombreMarcaVehiculo(v) : (v ? (v.strVehCatMarcaVehiculo || v.StrVehCatMarcaVehiculo || v.strMarca || "Desconocida") : "Desconocida");
        const modelo = v ? (v.strModelo || v.StrModelo || "Desconocido") : "Desconocido";
        const placa = v ? (v.strPlaca || v.StrPlaca || "—") : "—";
        const brandModel = `${marca} ${modelo}`;

        const empIdTarget = Number(g.idEmpEmpleado ?? g.IdEmpEmpleado);
        const emp = listaEmpleadosGasolina.find(e => Number(e.id ?? e.Id) === empIdTarget);
        const empleadoName = emp ? ((emp.strNombre || emp.StrNombre || "") + " " + (emp.strApellidoPaterno || emp.StrApellidoPaterno || "") + ((emp.strApellidoMaterno || emp.StrApellidoMaterno) ? " " + (emp.strApellidoMaterno || emp.StrApellidoMaterno) : "")).trim() : (g.strEmpEmpleado || "Desconocido");

        return `
            <tr>
                <td>${escapeHtml(brandModel)}</td>
                <td><span class="badge bg-light text-dark border">${escapeHtml(placa)}</span></td>
                <td>${escapeHtml(empleadoName)}</td>
                <td class="text-end">
                    <div class="dropdown actions-dropdown d-inline-block">
                        <button class="btn-action-trigger btn-sm" type="button" data-bs-toggle="dropdown" data-bs-boundary="viewport" aria-expanded="false">
                            <span>Acciones</span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li>
                                <button class="dropdown-item d-flex align-items-center" type="button" onclick="verDetalleGasolina(${g.id})">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 text-info"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                    Ver detalles
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item d-flex align-items-center" type="button" onclick="editarGasolina(${g.id})">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 text-primary"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    Editar
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item d-flex align-items-center text-danger" type="button" onclick="eliminarGasolina(${g.id})">
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

function verDetalleGasolina(id) {
    const g = listaGasolinas.find(item => item.id === id);
    if (!g) return;

    const v = listaVehiculosGasolina.find(veh => veh.id === g.idVehDatosGenerales);
    const emp = listaEmpleadosGasolina.find(e => e.id === g.idEmpEmpleado);
    const empleadoName = emp ? (emp.strNombre + " " + emp.strApellidoPaterno + (emp.strApellidoMaterno ? " " + emp.strApellidoMaterno : "")) : (g.strEmpEmpleado || "Desconocido");

    const litros = g.mnyPrecioLitro > 0 ? (g.mnyMontoPagado / g.mnyPrecioLitro).toFixed(2) : "0.00";
    let comprobanteHtml = '<span class="text-muted small">No registrado</span>';
    if (g.strUrlComprobantePago) {
        const isPdf = g.strUrlComprobantePago.toLowerCase().endsWith(".pdf");
        const filename = g.strUrlComprobantePago.split("/").pop();
        if (isPdf) {
            comprobanteHtml = `<a href="${g.strUrlComprobantePago}" target="_blank" class="text-teal-cavex fw-semibold small" style="text-decoration: underline;">
                                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-1"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                                ${escapeHtml(filename)}
                               </a>`;
        } else {
            comprobanteHtml = `<a href="${g.strUrlComprobantePago}" target="_blank" class="d-inline-block border rounded p-1">
                                <img src="${g.strUrlComprobantePago}" style="max-height: 80px; object-fit: contain;" />
                               </a>`;
        }
    }

    Swal.fire({
        title: "Detalle de Carga de Gasolina",
        html: `
            <div class="text-start fs-6" style="line-height: 1.6;">
                <p><strong>Vehículo:</strong> ${v ? `${v.strModelo} (${v.intAnio})` : "Desconocido"}</p>
                <p><strong>Placa:</strong> ${v ? v.strPlaca : "—"}</p>
                <p><strong>Chofer Responsable:</strong> ${empleadoName}</p>
                <p><strong>Fecha de Carga:</strong> ${g.dteFechaCarga ? new Date(g.dteFechaCarga).toLocaleDateString("es-MX") : "—"}</p>
                <p><strong>Gasolinera:</strong> ${escapeHtml(g.strVehCatGasolineras)}</p>
                <p><strong>Monto Pagado:</strong> $${Number(g.mnyMontoPagado).toLocaleString("es-MX", { minimumFractionDigits: 2 })}</p>
                <p><strong>Precio por Litro:</strong> $${Number(g.mnyPrecioLitro).toLocaleString("es-MX", { minimumFractionDigits: 2 })} / L</p>
                <p><strong>Litros Cargados (Aprox):</strong> ${litros} L</p>
                <p><strong>Kilometraje al Cargar:</strong> ${Number(g.decKilometrajeActual).toLocaleString("es-MX")} km</p>
                <p><strong>Forma de Pago:</strong> ${escapeHtml(g.strVehFormaPago)}</p>
                <p><strong>Comprobante:</strong></p>
                <div class="mb-3">${comprobanteHtml}</div>
            </div>
        `,
        confirmButtonColor: "var(--teal-cavex)"
    });
}

function editarGasolina(id) {
    const g = listaGasolinas.find(item => item.id === id);
    if (!g) return;

    editModeGasolinaId = id;

    const selectVeh = document.getElementById("gasolina-idVehDatosGenerales");
    const selectEmp = document.getElementById("gasolina-idEmpEmpleado");
    if (selectVeh) selectVeh.disabled = false;
    if (selectEmp) selectEmp.disabled = false;

    if (selectVeh) {
        selectVeh.value = String(g.idVehDatosGenerales);
        selectVeh.dispatchEvent(new Event("change", { bubbles: true }));
    }

    const kmEl = document.getElementById("gasolina-decKilometrajeActual");
    if (kmEl) {
        kmEl.value = g.decKilometrajeActual;
        if (kmEl.value) kmEl.value = kmEl.value.replace(/[^0-9]/g, "").replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
    
    if (g.dteFechaCarga) {
        document.getElementById("gasolina-dteFechaCarga").value = g.dteFechaCarga.split("T")[0];
    }
    
    document.getElementById("gasolina-idVehCatGasolineras").value = g.idVehCatGasolineras;
    if (selectEmp) {
        selectEmp.value = String(g.idEmpEmpleado);
        selectEmp.dispatchEvent(new Event("change", { bubbles: true }));
    }
    const montoEl = document.getElementById("gasolina-mnyMontoPagado");
    if (montoEl) {
        montoEl.value = g.mnyMontoPagado;
        if (montoEl.value) formatCurrencyInput(montoEl);
    }
    const precioEl = document.getElementById("gasolina-mnyPrecioLitro");
    if (precioEl) {
        precioEl.value = g.mnyPrecioLitro;
        if (precioEl.value) formatCurrencyInput(precioEl);
    }
    document.getElementById("gasolina-idVehFormaPago").value = g.idVehFormaPago;

    if (g.strUrlComprobantePago) {
        document.getElementById("gasolina-strUrlComprobantePago").value = g.strUrlComprobantePago;
    } else {
        document.getElementById("gasolina-strUrlComprobantePago").value = "";
    }
    comprobanteArchivoSeleccionado = null;
    renderizarPreviaComprobante();

    // Trigger calculation
    document.getElementById("gasolina-mnyMontoPagado").dispatchEvent(new Event("input"));

    document.getElementById("gasolinaVehiculoForm").scrollIntoView({ behavior: "smooth" });
}

function eliminarGasolina(id) {
    Swal.fire({
        title: "¿Estás seguro?",
        text: "Este registro de carga de combustible será eliminado permanentemente.",
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
                const response = await fetch(`/Gasolina/DeleteGasolina/${id}`, { method: "POST" });
                const res = await response.json();
                Swal.close();
                if (res.success) {
                    Swal.fire("Eliminado", "La carga ha sido eliminada.", "success");
                    cargarGasolinaList();
                } else {
                    Swal.fire("Error", res.message || "No se pudo eliminar la carga.", "error");
                }
            } catch (err) {
                Swal.close();
                Swal.fire("Error", "Error de red al intentar eliminar.", "error");
            }
        }
    });
}

function resetearFormularioGasolina() {
    editModeGasolinaId = null;
    const form = document.getElementById("gasolinaVehiculoForm");
    if (form) {
        form.reset();
        form.querySelectorAll(".is-valid, .is-invalid").forEach(el => el.classList.remove("is-valid", "is-invalid"));
    }
    limpiarComprobante();
    // Reset calculations
    const litros = document.getElementById("gasolinaLitrosEstimados");
    if (litros) litros.textContent = "0.00 L";
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
