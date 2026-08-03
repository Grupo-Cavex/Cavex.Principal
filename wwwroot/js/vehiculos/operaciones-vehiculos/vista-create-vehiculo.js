let vehiculoCatalogos = {
    idVehCatMarcaVehiculo: [],
    idVehCatColor: [],
    idVehCatTipoVehiculo: [],
    idVehCatCapacidad: [],
    idVehCatTipoCombustible: [],
    idVehCatTransmision: [],
    idVehCatStatus: []
};

let vehiculoImagenSeleccionadaUrl = "";

document.addEventListener("DOMContentLoaded", async () => {
    await cargarCatalogos();
    inicializarRegistroVehiculo();
    
    const urlParams = new URLSearchParams(window.location.search);
    const vehiculoId = urlParams.get('id');
    if (vehiculoId) {
        await cargarDatosVehiculoParaEditar(vehiculoId);
    }
});

async function cargarCatalogos() {
    try {
        const response = await fetch('/Vehiculos/GetVehiculoCatalogos');
        const result = await response.json();
        if (result.success && result.data) {
            Object.assign(vehiculoCatalogos, result.data);
            
            // Llenar selectores dinámicamente según la respuesta del backend
            Object.entries(vehiculoCatalogos).forEach(([selectId, registros]) => {
                const select = document.getElementById(selectId);
                if (!select) return;
                select.innerHTML = '<option value="">Seleccionar...</option>';
                registros.forEach(registro => {
                    const option = document.createElement("option");
                    option.value = String(registro.id);
                    option.textContent = registro.strValor || registro.strDescripcion || ("Opción " + registro.id);
                    option.title = registro.strDescripcion;
                    select.appendChild(option);
                });
            });
        }
    } catch (error) {
        console.error("Error al cargar catálogos:", error);
    }
}

function formatNumberWithCommas(value) {
    let clean = String(value).replace(/[^0-9]/g, "");
    if (!clean) return "";
    return Number(clean).toLocaleString("es-MX");
}

let formIsDirty = false;

function inicializarRegistroVehiculo() {
    const form = document.getElementById("vehiculoForm");
    if (!form) return;

    inicializarFechaRegistro();
    configurarSanitizadores();
    inicializarContadorObservaciones();
    inicializarCargaImagen();

    // Confirmación al presionar "Cancelar / Volver"
    const cancelBtn = document.querySelector(".vehiculo-action-bar a.btn-outline-cavex");
    if (cancelBtn) {
        cancelBtn.addEventListener("click", event => {
            if (formIsDirty) {
                event.preventDefault();
                const targetUrl = cancelBtn.href;
                Swal.fire({
                    title: "¿Deseas salir del formulario?",
                    text: "Tienes cambios sin guardar. Si continúas, los datos ingresados se borrarán.",
                    icon: "warning",
                    showCancelButton: true,
                    confirmButtonColor: "#ef4444",
                    cancelButtonColor: "#6b7280",
                    confirmButtonText: "Sí, salir y borrar",
                    cancelButtonText: "Permanecer aquí"
                }).then(result => {
                    if (result.isConfirmed) {
                        formIsDirty = false;
                        window.location.href = targetUrl;
                    }
                });
            }
        });
    }

    // Advertencia nativa del navegador al recargar o cerrar la pestaña si hay cambios sin guardar
    window.addEventListener("beforeunload", event => {
        if (formIsDirty) {
            event.preventDefault();
            event.returnValue = "";
        }
    });

    // Eventos de cambios e inputs en los controles
    form.querySelectorAll("input:not([type='file']):not([type='hidden']), select, textarea").forEach(campo => {
        campo.addEventListener("input", () => {
            formIsDirty = true;
            validarCampoVehiculoEnTyping(campo);
            actualizarVistaPrevia();
        });

        campo.addEventListener("change", () => {
            formIsDirty = true;
            validarCampoVehiculo(campo);
            actualizarVistaPrevia();
        });

        campo.addEventListener("blur", () => {
            if (campo.type !== "number" && campo.id !== "decKilometrajeActual" && campo.tagName !== "SELECT" && !campo.readOnly) {
                campo.value = campo.value.trim().replace(/\s{2,}/g, " ");
            }
            validarCampoVehiculo(campo);
            actualizarVistaPrevia();
        });
    });

    // Formateador en tiempo real para el kilometraje actual
    const kilometrajeInput = document.getElementById("decKilometrajeActual");
    kilometrajeInput?.addEventListener("input", () => {
        const cursorPosition = kilometrajeInput.selectionStart;
        const originalLength = kilometrajeInput.value.length;
        const formatted = formatNumberWithCommas(kilometrajeInput.value);
        
        kilometrajeInput.value = formatted;
        
        const newLength = formatted.length;
        const diff = newLength - originalLength;
        kilometrajeInput.setSelectionRange(cursorPosition + diff, cursorPosition + diff);
        actualizarVistaPrevia();
    });

    form.addEventListener("submit", event => {
        event.preventDefault();
        
        const isFormValid = validarFormularioVehiculo(form);
        const isImageValid = validarCampoImagen();

        if (!isFormValid || !isImageValid) {
            Swal.fire({ 
                icon: "warning", 
                title: "Formulario incompleto", 
                text: "Revisa los campos marcados y asegúrate de cargar la foto obligatoria.", 
                confirmButtonColor: "var(--teal-cavex)" 
            });
            return;
        }

        // Crear FormData para enviar campos y archivo multipart
        const formData = new FormData();
        const idInput = document.getElementById("editVehiculoId");
        if (idInput && idInput.value) {
            formData.append("Id", parseInt(idInput.value));
        }
        formData.append("StrNumeroSerie", document.getElementById("strNumSerie").value);
        formData.append("VehCatMarcaVehiculo.Id", parseInt(document.getElementById("idVehCatMarcaVehiculo").value));
        formData.append("StrModelo", document.getElementById("strModelo").value);
        formData.append("IntAnio", parseInt(document.getElementById("intAnio").value));
        formData.append("StrVersion", document.getElementById("strVersion").value || "");
        formData.append("VehCatColorDto.Id", parseInt(document.getElementById("idVehCatColor").value));
        formData.append("StrPlaca", document.getElementById("strPlaca").value);
        formData.append("StrNumMotor", document.getElementById("strNumMotor").value);
        formData.append("DteUltimoMantenimiento", document.getElementById("dteUltimoMantenimiento")?.value || "");
        formData.append("DteProximoMantenimiento", document.getElementById("dteProximoMantenimiento")?.value || "");
        formData.append("VehCatTipoVehiculo.Id", parseInt(document.getElementById("idVehCatTipoVehiculo").value));
        formData.append("VehCatCapacidad.Id", parseInt(document.getElementById("idVehCatCapacidad").value));
        formData.append("VehCatTipoCombustibleDto.Id", parseInt(document.getElementById("idVehCatTipoCombustible").value));
        formData.append("VehCatTransmisionDto.Id", parseInt(document.getElementById("idVehCatTransmision").value));
        
        const kilometrajeRaw = document.getElementById("decKilometrajeActual").value.replace(/,/g, '');
        formData.append("DecKilometrajeActual", Number(kilometrajeRaw));
        formData.append("StrDescripcion", document.getElementById("strObservaciones").value || "");

        const fileInput = document.getElementById("vehiculoFotoArchivo");
        if (fileInput.files.length > 0) {
            formData.append("FotoArchivo", fileInput.files[0]);
        }

        Swal.fire({
            title: 'Guardando vehículo...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        fetch('/Vehiculos/SaveVehiculo', {
            method: 'POST',
            body: formData
        })
        .then(res => res.json().then(data => ({ status: res.status, ok: res.ok, body: data })))
        .then(result => {
            Swal.close();
            if (result.ok && result.body.success) {
                Swal.fire({
                    icon: "success",
                    title: "Vehículo guardado",
                    text: "El vehículo se ha registrado exitosamente.",
                    confirmButtonColor: "var(--teal-cavex)",
                    confirmButtonText: "Ver listado de vehículos"
                }).then(() => {
                    formIsDirty = false;
                    sessionStorage.removeItem("vehiculosDemo_cache");
                    window.location.href = '/Vehiculos/Index';
                });
            } else {
                Swal.fire({
                    icon: "error",
                    title: "Error al guardar",
                    text: result.body.message || "No se pudo guardar el vehículo.",
                    confirmButtonColor: "var(--teal-cavex)"
                });
            }
        })
        .catch(err => {
            Swal.close();
            console.error("Error al registrar vehículo:", err);
            Swal.fire({
                icon: "error",
                title: "Error de red",
                text: "No se pudo conectar con el servidor.",
                confirmButtonColor: "var(--teal-cavex)"
            });
        });
    });

    actualizarVistaPrevia();
}

function inicializarFechaRegistro() {
    const fechaInput = document.getElementById("dteFechaRegistro");
    const fechaVisual = document.getElementById("fechaRegistroVisual");
    if (!fechaInput) return;
    const hoy = new Date();
    const isoDate = new Date(hoy.getTime() - hoy.getTimezoneOffset() * 60000).toISOString().split("T")[0];
    fechaInput.value = isoDate;
    
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    if (fechaVisual) {
        fechaVisual.textContent = hoy.toLocaleDateString('es-MX', options);
    }
}

function configurarSanitizadores() {
    const serie = document.getElementById("strNumSerie");
    const placa = document.getElementById("strPlaca");
    const motor = document.getElementById("strNumMotor");

    serie?.addEventListener("input", () => { serie.value = serie.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); });
    placa?.addEventListener("input", () => { placa.value = placa.value.toUpperCase().replace(/[^A-Z0-9-]/g, ""); });
    motor?.addEventListener("input", () => { motor.value = motor.value.toUpperCase().replace(/[^A-Z0-9]/g, ""); });
}

function inicializarContadorObservaciones() {
    const campo = document.getElementById("strObservaciones");
    const contador = document.getElementById("observacionesCounter");
    if (!campo || !contador) return;
    const actualizar = () => {
        contador.textContent = String(campo.value.length);
        contador.parentElement?.classList.toggle("is-near-limit", campo.value.length >= 450);
    };
    campo.addEventListener("input", actualizar);
    actualizar();
}

function inicializarCargaImagen() {
    const area = document.getElementById("vehiculoUploadArea");
    const input = document.getElementById("vehiculoFotoArchivo");
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
    area.addEventListener("dragenter", event => {
        event.preventDefault();
        event.stopPropagation();
        area.classList.add("is-drag-over");
    });
    area.addEventListener("dragover", event => { event.preventDefault(); area.classList.add("is-drag-over"); });
    area.addEventListener("dragleave", () => area.classList.remove("is-drag-over"));
    area.addEventListener("drop", event => {
        event.preventDefault();
        area.classList.remove("is-drag-over");
        const archivo = event.dataTransfer.files?.[0];
        if (archivo) procesarImagenVehiculo(archivo);
    });
    input.addEventListener("change", () => {
        const archivo = input.files?.[0];
        if (archivo) procesarImagenVehiculo(archivo);
    });
    document.getElementById("btnCambiarImagen")?.addEventListener("click", event => { event.stopPropagation(); input.click(); });
    document.getElementById("btnQuitarImagen")?.addEventListener("click", event => {
        event.stopPropagation();
        limpiarImagenVehiculo();
    });
}

function procesarImagenVehiculo(archivo) {
    const tipos = ["image/jpeg", "image/png", "image/webp"];
    const extensiones = [".jpg", ".jpeg", ".png", ".webp"];
    limpiarErrorImagen();

    if (!tipos.includes(archivo.type) || !extensiones.some(extension => archivo.name.toLowerCase().endsWith(extension))) {
        limpiarImagenVehiculo();
        mostrarErrorImagen("Solo se permiten imágenes JPG, JPEG, PNG o WEBP.");
        return;
    }
    if (archivo.size > 5 * 1024 * 1024) {
        limpiarImagenVehiculo();
        mostrarErrorImagen("La imagen no debe superar 5 MB.");
        return;
    }

    const input = document.getElementById("vehiculoFotoArchivo");
    if (input && window.DataTransfer) {
        const transferencia = new DataTransfer();
        transferencia.items.add(archivo);
        input.files = transferencia.files;
    }
    if (vehiculoImagenSeleccionadaUrl) URL.revokeObjectURL(vehiculoImagenSeleccionadaUrl);
    vehiculoImagenSeleccionadaUrl = URL.createObjectURL(archivo);
    
    document.getElementById("vehiculoUploadPrompt").hidden = true;
    document.getElementById("vehiculoFilePreview").hidden = false;
    document.getElementById("vehiculoUploadImage").src = vehiculoImagenSeleccionadaUrl;
    setText("vehiculoFileName", archivo.name);
    
    validarCampoImagen();
}

function limpiarImagenVehiculo() {
    if (vehiculoImagenSeleccionadaUrl) URL.revokeObjectURL(vehiculoImagenSeleccionadaUrl);
    vehiculoImagenSeleccionadaUrl = "";
    const input = document.getElementById("vehiculoFotoArchivo");
    if (input) input.value = "";
    
    document.getElementById("vehiculoUploadPrompt").hidden = false;
    document.getElementById("vehiculoFilePreview").hidden = true;
    document.getElementById("vehiculoUploadImage")?.removeAttribute("src");
    
    const area = document.getElementById("vehiculoUploadArea");
    area?.classList.remove("is-valid");
    
    validarCampoImagen();
}

function mostrarErrorImagen(mensaje) {
    const area = document.getElementById("vehiculoUploadArea");
    area?.classList.remove("is-valid");
    area?.classList.add("is-invalid");
    const error = document.getElementById("vehiculoFotoArchivoError");
    if (error) { 
        error.textContent = mensaje; 
        error.classList.remove("d-none");
        error.classList.add("d-block"); 
    }
}

function limpiarErrorImagen() {
    document.getElementById("vehiculoUploadArea")?.classList.remove("is-invalid");
    const error = document.getElementById("vehiculoFotoArchivoError");
    if (error) { 
        error.textContent = ""; 
        error.classList.remove("d-block");
        error.classList.add("d-none"); 
    }
}

function validarCampoImagen() {
    const input = document.getElementById("vehiculoFotoArchivo");
    const area = document.getElementById("vehiculoUploadArea");
    if (!input || (input.files.length === 0 && !vehiculoImagenSeleccionadaUrl)) {
        mostrarErrorImagen("La foto del vehículo es obligatoria.");
        return false;
    }
    limpiarErrorImagen();
    area?.classList.add("is-valid");
    return true;
}

function validarFormularioVehiculo(form) {
    const obligatorios = ["strNumSerie", "idVehCatMarcaVehiculo", "strModelo", "intAnio", "idVehCatColor", "strPlaca", "strNumMotor", "idVehCatTipoVehiculo", "idVehCatCapacidad", "idVehCatTipoCombustible", "idVehCatTransmision", "decKilometrajeActual"];
    const opcionales = ["strVersion", "strObservaciones", "dteUltimoMantenimiento", "dteProximoMantenimiento"];
    let valido = true;
    [...obligatorios, ...opcionales].forEach(id => {
        const campo = document.getElementById(id);
        if (campo && !validarCampoVehiculo(campo)) valido = false;
    });

    const primerError = form.querySelector(".is-invalid");
    if (primerError) {
        primerError.scrollIntoView({ behavior: "smooth", block: "center" });
        if (typeof primerError.focus === "function") primerError.focus({ preventScroll: true });
    }
    return valido;
}

function validarCampoVehiculo(campo) {
    const original = String(campo.value || "");
    const valor = original.trim();
    const anioMaximo = new Date().getFullYear() + 1;
    let mensaje = "";

    if (campo.required && !valor) {
        mensaje = campo.tagName === "SELECT" ? "Selecciona una opción." : "Este campo es obligatorio.";
    }
    if (!mensaje && valor) {
        switch (campo.id) {
            case "strNumSerie":
                if (original !== valor) mensaje = "La serie no debe iniciar ni terminar con espacios.";
                else if (valor.length > 20) mensaje = "La serie no debe superar 20 caracteres.";
                else if (!/^[A-Z0-9]+$/.test(valor)) mensaje = "La serie solo permite letras y números.";
                break;
            case "strModelo":
            case "strVersion":
                if (valor.length > 250) mensaje = "El valor no debe superar 250 caracteres.";
                break;
            case "intAnio": {
                const numero = Number(valor);
                if (!Number.isInteger(numero) || numero < 1990 || numero > anioMaximo) {
                    mensaje = `El año debe ser un entero entre 1990 y ${anioMaximo}.`;
                }
                break;
            }
            case "strPlaca":
                if (original !== valor) mensaje = "La placa no debe iniciar ni terminar con espacios.";
                else if (valor.length > 20) mensaje = "La placa no debe superar 20 caracteres.";
                else if (!/^[A-Z0-9-]+$/.test(valor)) mensaje = "La placa solo permite letras, números y guiones.";
                break;
            case "strNumMotor":
                if (original !== valor) mensaje = "El número de motor no debe iniciar ni terminar con espacios.";
                else if (!/^[A-Z0-9]+$/.test(valor)) mensaje = "El número de motor solo permite letras y números.";
                else if (valor.length < 11 || valor.length > 17) mensaje = "El número de motor debe tener entre 11 y 17 caracteres.";
                break;
            case "decKilometrajeActual": {
                const rawVal = valor.replace(/,/g, "");
                const numero = Number(rawVal);
                if (isNaN(numero) || numero < 0) {
                    mensaje = "El kilometraje debe ser un número mayor o igual a 0.";
                }
                break;
            }
            case "strObservaciones":
                if (original.length > 500) mensaje = "Las observaciones no deben superar 500 caracteres.";
                break;
        }
    }

    if (mensaje) {
        campo.classList.remove("is-valid");
        campo.classList.add("is-invalid");
        campo.setAttribute("aria-invalid", "true");
        const error = document.getElementById(`${campo.id}Error`);
        if (error) {
            error.textContent = mensaje;
            error.classList.remove("d-none");
            error.classList.add("d-block");
        }
        return false;
    }

    limpiarErrorCampo(campo);
    if (valor || campo.required) {
        if (!campo.readOnly) {
            campo.classList.add("is-valid");
        }
    }
    return true;
}

function validarCampoVehiculoEnTyping(campo) {
    if (campo.tagName === "SELECT") {
        validarCampoVehiculo(campo);
        return;
    }

    const original = String(campo.value || "");
    const valor = original.trim();
    const anioMaximo = new Date().getFullYear() + 1;
    let mensaje = "";

    // Si ya tiene error visual previo, validamos por completo en tiempo real
    if (campo.classList.contains("is-invalid")) {
        validarCampoVehiculo(campo);
        return;
    }

    // Validar silenciosamente para ver si ya es válido
    if (campo.required && !valor) {
        mensaje = "Requerido";
    }
    if (!mensaje && valor) {
        switch (campo.id) {
            case "strNumSerie":
                if (original !== valor || valor.length > 20 || !/^[A-Z0-9]+$/.test(valor)) mensaje = "Invalido";
                break;
            case "strModelo":
            case "strVersion":
                if (valor.length > 250) mensaje = "Invalido";
                break;
            case "intAnio": {
                const numero = Number(valor);
                if (!Number.isInteger(numero) || numero < 1990 || numero > anioMaximo) mensaje = "Invalido";
                break;
            }
            case "strPlaca":
                if (original !== valor || valor.length > 20 || !/^[A-Z0-9-]+$/.test(valor)) mensaje = "Invalido";
                break;
            case "strNumMotor":
                if (original !== valor || !/^[A-Z0-9]+$/.test(valor) || valor.length < 11 || valor.length > 17) mensaje = "Invalido";
                break;
            case "decKilometrajeActual": {
                const rawVal = valor.replace(/,/g, "");
                const numero = Number(rawVal);
                if (isNaN(numero) || numero < 0) mensaje = "Invalido";
                break;
            }
            case "strObservaciones":
                if (original.length > 500) mensaje = "Invalido";
                break;
        }
    }

    if (!mensaje && (valor || campo.required)) {
        if (!campo.readOnly) {
            campo.classList.add("is-valid");
        }
    } else {
        campo.classList.remove("is-valid");
    }
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

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function actualizarVistaPrevia() {
    const valor = id => document.getElementById(id)?.value?.trim() || "";
    const texto = id => {
        const option = document.getElementById(id)?.selectedOptions?.[0];
        return option?.value ? option.textContent.trim() : "";
    };
    setText("previewUnidad", [texto("idVehCatMarcaVehiculo"), valor("strModelo"), valor("intAnio")].filter(Boolean).join(" ") || "Sin datos");
    setText("previewVersion", valor("strVersion") || "No especificada");
    setText("previewSerie", valor("strNumSerie") || "Sin serie");
    setText("previewPlaca", valor("strPlaca") || "Sin placa");
    setText("previewColor", texto("idVehCatColor") || "Sin seleccionar");
    setText("previewTipoVehiculo", texto("idVehCatTipoVehiculo") || "Sin seleccionar");
    setText("previewCapacidad", texto("idVehCatCapacidad") || "Sin seleccionar");
    setText("previewCombustible", texto("idVehCatTipoCombustible") || "Sin seleccionar");
    setText("previewTransmision", texto("idVehCatTransmision") || "Sin seleccionar");
    
    const kilometrajeRaw = valor("decKilometrajeActual").replace(/,/g, '');
    const kilometraje = Number(kilometrajeRaw || 0);
    setText("previewKilometraje", `${kilometraje.toLocaleString("es-MX")} km`);
}

async function cargarDatosVehiculoParaEditar(id) {
    try {
        const headerTitle = document.querySelector(".header-title") || document.querySelector("h1");
        if (headerTitle) headerTitle.textContent = "Editar vehículo";
        
        const subtitle = document.querySelector(".header-subtitle");
        if (subtitle) subtitle.textContent = "Modifica los datos del vehículo y guarda los cambios en el sistema.";

        const submitBtn = document.querySelector("#vehiculoForm button[type='submit']");
        if (submitBtn) submitBtn.textContent = "Guardar cambios";

        Swal.fire({
            title: 'Cargando datos del vehículo...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        const response = await fetch(`/Vehiculos/GetVehiculoById?id=${id}`);
        const result = await response.json();
        Swal.close();

        if (result.success && result.data) {
            const v = result.data;

            const form = document.getElementById("vehiculoForm");
            let idInput = document.getElementById("editVehiculoId");
            if (!idInput) {
                idInput = document.createElement("input");
                idInput.type = "hidden";
                idInput.id = "editVehiculoId";
                idInput.name = "Id";
                form.appendChild(idInput);
            }
            idInput.value = id;

            // Función helper para obtener valores de propiedades tolerando variaciones entre camelCase y PascalCase
            const getVal = (propCamel, propPascal) => {
                if (v[propCamel] !== undefined && v[propCamel] !== null) return String(v[propCamel]);
                if (v[propPascal] !== undefined && v[propPascal] !== null) return String(v[propPascal]);
                return "";
            };
 
            // Asigna los datos a los inputs de texto y texto enriquecido
            document.getElementById("strNumSerie").value = getVal("strNumSerie", "StrNumSerie");
            document.getElementById("strModelo").value = getVal("strModelo", "StrModelo");
            document.getElementById("intAnio").value = getVal("intAnio", "IntAnio");
            document.getElementById("strVersion").value = getVal("strVersion", "StrVersion");
            document.getElementById("strPlaca").value = getVal("strPlaca", "StrPlaca");
            document.getElementById("strNumMotor").value = getVal("strNumMotor", "StrNumMotor") || getVal("strMotor", "StrMotor");
            const ultMant = getVal("dteUltimoMantenimiento", "DteUltimoMantenimiento");
            if (ultMant && document.getElementById("dteUltimoMantenimiento")) document.getElementById("dteUltimoMantenimiento").value = ultMant.split("T")[0];
            const proxMant = getVal("dteProximoMantenimiento", "DteProximoMantenimiento");
            if (proxMant && document.getElementById("dteProximoMantenimiento")) document.getElementById("dteProximoMantenimiento").value = proxMant.split("T")[0];
            document.getElementById("decKilometrajeActual").value = formatNumberWithCommas(getVal("decKilometrajeActual", "DecKilometrajeActual") || 0);
            document.getElementById("strObservaciones").value = getVal("strObservaciones", "StrObservaciones");
 
            // Restaura y selecciona correctamente las opciones de los dropdowns usando fallbacks de propiedades
            document.getElementById("idVehCatMarcaVehiculo").value = getVal("idVehCatMarcaVehiculo", "IdVehCatMarcaVehiculo");
            document.getElementById("idVehCatColor").value = getVal("idVehCatColor", "IdVehCatColor");
            document.getElementById("idVehCatTipoVehiculo").value = getVal("idVehCatTipoVehiculo", "IdVehCatTipoVehiculo");
            document.getElementById("idVehCatCapacidad").value = getVal("idVehCatCapacidad", "IdVehCatCapacidad");
            document.getElementById("idVehCatTipoCombustible").value = getVal("idVehCatTipoCombustible", "IdVehCatTipoCombustible");
            document.getElementById("idVehCatTransmision").value = getVal("idVehCatTransmision", "IdVehCatTransmision");

            if (v.dteFechaRegistro) {
                const fechaInput = document.getElementById("dteFechaRegistro");
                const fechaVisual = document.getElementById("fechaRegistroVisual");
                
                fechaInput.value = v.dteFechaRegistro;
                
                const parts = v.dteFechaRegistro.split("-");
                if (parts.length === 3) {
                    const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
                    const options = { year: 'numeric', month: 'long', day: 'numeric' };
                    if (fechaVisual) fechaVisual.textContent = dateObj.toLocaleDateString('es-MX', options);
                }
            }

            if (v.strUrlFoto) {
                vehiculoImagenSeleccionadaUrl = v.strUrlFoto;
                
                document.getElementById("vehiculoUploadPrompt").hidden = true;
                document.getElementById("vehiculoFilePreview").hidden = false;
                document.getElementById("vehiculoUploadImage").src = v.strUrlFoto;
                
                const fileNameSpan = document.getElementById("vehiculoFileName");
                if (fileNameSpan) fileNameSpan.textContent = "Foto_actual.jpg";
                
                const area = document.getElementById("vehiculoUploadArea");
                area?.classList.add("is-valid");
            }

            form.querySelectorAll("input:not([type='file']):not([type='hidden']), select, textarea").forEach(campo => {
                validarCampoVehiculo(campo);
            });

            actualizarVistaPrevia();
        } else {
            Swal.fire({
                icon: "error",
                title: "Error al cargar",
                text: result.message || "No se pudieron obtener los datos del vehículo.",
                confirmButtonColor: "var(--teal-cavex)"
            }).then(() => {
                window.location.href = '/Vehiculos/Index';
            });
        }
    } catch (error) {
        console.error("Error al cargar datos del vehículo:", error);
        Swal.fire({
            icon: "error",
            title: "Error",
            text: "No se pudo conectar con el servidor.",
            confirmButtonColor: "var(--teal-cavex)"
        });
    }
}