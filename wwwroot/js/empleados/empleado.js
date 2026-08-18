

let maxStepVisited = 1;
let activeStep = 1;

function agregarExperiencia() {
    const container = document.getElementById('experiencias-container');
    const primero = container.querySelector('.experiencia-item');
    const nuevo = primero.cloneNode(true);
    
    // Limpiar los valores de los inputs y sus estados de error
    nuevo.querySelectorAll('input').forEach(i => {
        i.value = '';
        delete i.dataset.touched;
        const group = i.closest('.form-group');
        if (group) {
            group.classList.remove('has-error', 'has-success');
            const errorDiv = group.querySelector('.error-message');
            if (errorDiv) errorDiv.remove();
        }
    });
    
    // Buscar o crear el header
    let header = nuevo.querySelector('.experiencia-header');
    if (!header) {
        header = document.createElement('div');
        header.className = 'experiencia-header';
        const title = document.createElement('span');
        title.className = 'experiencia-title';
        title.textContent = 'Experiencia laboral';
        header.appendChild(title);
        nuevo.insertBefore(header, nuevo.firstChild);
    }
    
    // Limpiar botones de eliminar previos si los hubiera
    const oldBtn = header.querySelector('.btn-eliminar-exp');
    if (oldBtn) {
        oldBtn.remove();
    }
    
    // Crear el botón de eliminar
    const btnEliminar = document.createElement('button');
    btnEliminar.type = 'button';
    btnEliminar.className = 'btn-eliminar-exp';
    btnEliminar.title = 'Eliminar experiencia';
    btnEliminar.innerHTML = '&#x2715; Eliminar';
    btnEliminar.onclick = function () { nuevo.remove(); actualizarNombresDinamicos(); actualizarStepperEmpleado(); };
    
    header.appendChild(btnEliminar);
    container.appendChild(nuevo);
    actualizarNombresDinamicos();
    actualizarStepperEmpleado();
}

function agregarReferencia() {
    const container = document.getElementById('referencias-container');
    const primero = container.querySelector('.referencia-item');
    const nuevo = primero.cloneNode(true);
    
    // Limpiar los valores de los inputs y sus estados de error/touched
    nuevo.querySelectorAll('input').forEach(i => {
        i.value = '';
        delete i.dataset.touched;
        const group = i.closest('.form-group');
        if (group) {
            group.classList.remove('has-error', 'has-success');
            const errorDiv = group.querySelector('.error-message');
            if (errorDiv) errorDiv.remove();
        }
    });
    
    // Buscar o crear el header
    let header = nuevo.querySelector('.experiencia-header');
    if (!header) {
        header = document.createElement('div');
        header.className = 'experiencia-header';
        const title = document.createElement('span');
        title.className = 'experiencia-title';
        title.textContent = 'Referencia personal';
        header.appendChild(title);
        nuevo.insertBefore(header, nuevo.firstChild);
    }
    
    // Limpiar botones de eliminar previos si los hubiera
    const oldBtn = header.querySelector('.btn-eliminar-exp');
    if (oldBtn) {
        oldBtn.remove();
    }
    
    // Crear el botón de eliminar
    const btnEliminar = document.createElement('button');
    btnEliminar.type = 'button';
    btnEliminar.className = 'btn-eliminar-exp';
    btnEliminar.title = 'Eliminar referencia';
    btnEliminar.innerHTML = '&#x2715; Eliminar';
    btnEliminar.onclick = function () { nuevo.remove(); actualizarNombresDinamicos(); actualizarStepperEmpleado(); };
    
    header.appendChild(btnEliminar);
    container.appendChild(nuevo);
    actualizarNombresDinamicos();
    actualizarStepperEmpleado();
}

// Funciones de validación visual
function mostrarError(input, mensaje) {
    if (!input) return;
    
    // Determinar paso correspondiente al input
    const card = input.closest('.empleado-card');
    let shouldMark = input.dataset.touched === "true";
    if (card) {
        const numEl = card.querySelector('.card-num');
        if (numEl) {
            const cardNum = parseInt(numEl.textContent.trim());
            if (cardNum > maxStepVisited) {
                shouldMark = false;
            }
        }
    }
    
    const group = input.closest('.form-group');
    if (!group) return;
    
    group.classList.remove('has-success', 'has-error');
    
    if (shouldMark) {
        group.classList.add('has-error');
        let errorDiv = group.querySelector('.error-message');
        if (!errorDiv) {
            errorDiv = document.createElement('span');
            errorDiv.className = 'error-message';
            group.appendChild(errorDiv);
        }
        errorDiv.textContent = mensaje;
    } else {
        const errorDiv = group.querySelector('.error-message');
        if (errorDiv) errorDiv.remove();
    }
}

function limpiarError(input) {
    if (!input) return;
    
    // Determinar paso correspondiente al input
    const card = input.closest('.empleado-card');
    let shouldMark = input.dataset.touched === "true";
    if (card) {
        const numEl = card.querySelector('.card-num');
        if (numEl) {
            const cardNum = parseInt(numEl.textContent.trim());
            if (cardNum > maxStepVisited) {
                shouldMark = false;
            }
        }
    }
    
    const group = input.closest('.form-group');
    if (!group) return;
    
    group.classList.remove('has-error', 'has-success');
    if (shouldMark) {
        group.classList.add('has-success');
    }
    
    const errorDiv = group.querySelector('.error-message');
    if (errorDiv) {
        errorDiv.remove();
    }
}
// Esta funcion se encarga de calcular la fecha de nacimiento y mostrarla
function calcularEdad(fechaString) {
    if (!fechaString) return '';
    const hoy = new Date();
    const cumpleanos = new Date(fechaString);
    let edad = hoy.getFullYear() - cumpleanos.getFullYear();
    const m = hoy.getMonth() - cumpleanos.getMonth();
    if (m < 0 || (m === 0 && hoy.getDate() < cumpleanos.getDate())) {
        edad--;
    }
    return edad >= 0 ? edad : '';
}

// Esta funcion se encarga de validaciones en los campos de nombre
function validarNombre(input) {
    const valor = input.value.trim();
    if (!valor) {
        if (input.hasAttribute('required')) {
            mostrarError(input, 'Este campo es obligatorio.');
            return false;
        }
        limpiarError(input);
        return true;
    }
    
    const regex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
    if (!regex.test(valor)) {
        mostrarError(input, 'Solo letras y espacios (sin números ni signos).');
        return false;
    }
    
    limpiarError(input);
    return true;
}

function validarCampoTextoGenerico(input) {
    const valor = input.value.trim();
    if (!valor) {
        if (input.hasAttribute('required')) {
            mostrarError(input, 'Este campo es obligatorio.');
            return false;
        }
        limpiarError(input);
        return true;
    }
    // Letras, números, espacios y puntuación básica
    const regex = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ\s.,;:'"()\-]+$/;
    if (!regex.test(valor)) {
        mostrarError(input, 'Caracteres inválidos. No se permiten símbolos especiales.');
        return false;
    }
    limpiarError(input);
    return true;
}

// Esta funcion se encarga que no se coloque una fecha futura o irreal
function validarFechaLogica(input) {
    if (!input.value && input.hasAttribute('required')) {
        mostrarError(input, 'Este campo es obligatorio.');
        return false;
    }
    if (input.value) {
        const dateObj = new Date(input.value);
        const year = dateObj.getFullYear();
        if (year < 1900 || year > 2026) {
            mostrarError(input, 'Ingrese un año válido (entre 1900 y 2026).');
            return false;
        }
    }
    limpiarError(input);
    return true;
}

// Se encarga que los cajas de texto eliga alguna opcion
function validarSelect(input) {
    if (!input.value && input.hasAttribute('required')) {
        mostrarError(input, 'Debe seleccionar una opción.');
        return false;
    }
    limpiarError(input);
    return true;
}

// Esta funcion se encarga de validar que los realmente algun docuemnto este dentro
function validarDropZone(key) {
    const input = document.getElementById('file-' + key);
    const zone = document.getElementById('drop-zone-' + key);
    if (!input || !zone) return true;
    
    let shouldMark = (7 <= maxStepVisited) && (input.dataset.touched === "true");
    
    if (input.hasAttribute('required') && (!input.files || input.files.length === 0)) {
        if (shouldMark) zone.classList.add('has-error');
        return false;
    }
    zone.classList.remove('has-error');
    return true;
}

// Esta funcion se encarga de tener el formato correcto del RFC
function validarRFC(input) {
    const valor = input.value.trim().toUpperCase();
    input.value = valor;
    
    if (!valor) {
        if (input.hasAttribute('required')) {
            mostrarError(input, 'El RFC es obligatorio.');
            return false;
        }
        limpiarError(input);
        return true;
    }
    
    // Soporta tanto 12 (personas morales) como 13 (personas físicas) caracteres
    const regex = /^[A-Z&Ññ]{3,4}[0-9]{6}[A-Z0-9]{3}$/;
    if (!regex.test(valor)) {
        mostrarError(input, 'RFC inválido. Formato esperado: XXXX000000XXX o XXX000000XXX.');
        return false;
    }
    
    limpiarError(input);
    return true;
}

// Esta funcion se encarga de validar el formato el CURP
function validarCURP(input) {
    const valor = input.value.trim().toUpperCase();
    input.value = valor;
    
    if (!valor) {
        if (input.hasAttribute('required')) {
            mostrarError(input, 'La CURP es obligatoria.');
            return false;
        }
        limpiarError(input);
        return true;
    }
    
    const regex = /^[A-Z]{4}[0-9]{6}[HM][A-Z]{5}[A-Z0-9]{2}$/;
    if (!regex.test(valor)) {
        mostrarError(input, 'CURP inválida (Ej: XXXX000000XXXXXX00).');
        return false;
    }
    
    limpiarError(input);
    return true;
}

// Se encarga que solo se coloquen numeros 
function validarCodigoPostal(input) {
    const valor = input.value.trim();
    
    if (!valor) {
        if (input.hasAttribute('required')) {
            mostrarError(input, 'El código postal es obligatorio.');
            return false;
        }
        limpiarError(input);
        return true;
    }
    
    const regex = /^[0-9]{5}$/;
    if (!regex.test(valor)) {
        mostrarError(input, 'Debe tener exactamente 5 dígitos.');
        return false;
    }
    
    limpiarError(input);
    return true;
}

// Se encarga de leer la entrada y si no coincide mostrar el error
function validarCorreo(input) {
    const valor = input.value.trim().toLowerCase();
    if (!valor) {
        if (input.hasAttribute('required')) {
            mostrarError(input, 'El correo electrónico es obligatorio.');
            return false;
        }
        limpiarError(input);
        return true;
    }
    if (!validateEmailDomain(valor)) {
        mostrarError(input, 'Solo se permiten correos de gmail.com, hotmail.com, outlook.com o yahoo.com.');
        return false;
    }
    
    limpiarError(input);
    return true;
}
// Esta funcion se encarga de solo ingresar numeros
function validarTelefono(input, obligatorio = false) {
    const valor = input.value.trim();
    if (!valor) {
        if (obligatorio) {
            mostrarError(input, 'Este teléfono es obligatorio.');
            return false;
        }
        limpiarError(input);
        return true;
    }
    const regex = /^[0-9]{10}$/;
    if (!regex.test(valor)) {
        mostrarError(input, 'Debe tener exactamente 10 dígitos.');
        return false;
    }
    limpiarError(input);
    return true;
}

function validarNSS(input) {
    const valor = input.value.trim();
    if (!valor) {
        if (input.hasAttribute('required')) {
            mostrarError(input, 'El NSS es obligatorio.');
            return false;
        }
        limpiarError(input);
        return true;
    }
    const regex = /^[0-9]{11}$/;
    if (!regex.test(valor)) {
        mostrarError(input, 'El NSS debe tener exactamente 11 dígitos.');
        return false;
    }
    limpiarError(input);
    return true;
}

// Configuración principal al cargar el DOM
document.addEventListener('DOMContentLoaded', function() {
    const form = document.getElementById('form-empleado');
    const txtNombre = document.getElementById('txtNombre');
    const txtApellidoPaterno = document.getElementById('txtApellidoPaterno');
    const txtApellidoMaterno = document.getElementById('txtApellidoMaterno');
    const txtFechaNacimiento = document.getElementById('txtFechaNacimiento');
    const txtEdad = document.getElementById('txtEdad');
    const txtRFC = document.getElementById('txtRFC');
    const txtCURP = document.getElementById('txtCURP');
    const txtCodigoPostal = document.getElementById('txtCodigoPostal');
    const txtCorreo = document.getElementById('txtCorreo');
    const txtTelefonoFijo = document.getElementById('txtTelefonoFijo');
    const txtTelefonoCelular = document.getElementById('txtTelefonoCelular');
    const txtNSS = document.getElementById('txtNSS');


    // Estas dos funciones se encargan de solo ingresar letras y numeros
    function sanitizeRFCOnly(val) {
        let clean = stripEmojis(val);
        clean = clean.replace(/[^a-zA-Z0-9&ñÑ]/g, '');
        return clean.toUpperCase();
    }

    function sanitizeCURPOnly(val) {
        let clean = stripEmojis(val);
        clean = clean.replace(/[^a-zA-Z0-9]/g, '');
        return clean.toUpperCase();
    }

    // Step by Step en tiempo real
    document.addEventListener('input', (e) => {
        const el = e.target;
        if (!el.matches('input, textarea')) return;

        if (el.id === 'txtSueldoMensual' || el.classList.contains('txtExpSueldo')) {
            let cursorPosition = el.selectionStart;
            let originalLength = el.value.length;
            let value = el.value.replace(/[^0-9.]/g, '');
            let parts = value.split('.');
            if (parts.length > 2) {
                value = parts[0] + '.' + parts.slice(1).join('');
            }
            let formattedValue = formatNumberWithComas(value);
            el.value = formattedValue;
            let newLength = el.value.length;
            cursorPosition = cursorPosition + (newLength - originalLength);
            try {
                el.setSelectionRange(cursorPosition, cursorPosition);
            } catch (err) {}
            return;
        }

        let fn = null;

        if (el.id === 'txtNombre' || el.id === 'txtApellidoPaterno' || el.id === 'txtApellidoMaterno' ||
            el.id === 'txtNivelEstudios' || el.id === 'txtCarrera' || el.id === 'txtEstatus' ||
            el.classList.contains('txtRefNombre') || el.classList.contains('txtRefParentesco') ||
            el.classList.contains('txtExpPuesto') || el.classList.contains('txtExpArea')) {
            fn = sanitizeLettersOnly;
        } else if (el.id === 'txtTelefonoFijo' || el.id === 'txtTelefonoCelular' || el.id === 'txtCodigoPostal' || el.id === 'txtNSS' || el.classList.contains('txtRefTelefono')) {
            fn = sanitizeDigitsOnly;
        } else if (el.id === 'txtRFC') {
            fn = sanitizeRFCOnly;
        } else if (el.id === 'txtCURP') {
            fn = sanitizeCURPOnly;
        } else if (el.id === 'txtNumeroExterior' || el.id === 'txtNumeroInterior' || el.classList.contains('txtExpEmpresa')) {
            fn = sanitizeAlphanumericDash;
        } else if (el.type === 'text' || el.tagName.toLowerCase() === 'textarea') {
            fn = sanitizeGeneralText;
        }

        if (fn) {
            sanitizeInputElement(el, fn);
        }
    });

    document.addEventListener('paste', (e) => {
        const el = e.target;
        if (el.matches('input, textarea')) {
            setTimeout(() => {
                const event = new Event('input', { bubbles: true });
                el.dispatchEvent(event);
            }, 0);
        }
    });

    // Step by Step (al tocar)
    document.addEventListener('blur', (e) => {
        const el = e.target;
        if (el.matches('input, select, textarea')) {
            if (el.id === 'txtSueldoMensual' || el.classList.contains('txtExpSueldo')) {
                let val = el.value.replace(/,/g, '').trim();
                if (val) {
                    let num = parseFloat(val);
                    if (!isNaN(num) && num > 0) {
                        el.value = formatNumberWithComas(num.toFixed(2));
                    } else {
                        el.value = '';
                    }
                }
            }
            el.dataset.touched = "true";
            actualizarStepperEmpleado();
        }
    }, true);

    document.addEventListener('change', (e) => {
        if (e.target.matches('select, input[type="date"], input[type="checkbox"], input[type="file"]')) {
            e.target.dataset.touched = "true";
            actualizarStepperEmpleado();
        }
    });

    // Auto-calculo Edad y límite de 18 años en la fecha de nacimiento
    if (txtFechaNacimiento) {
        const today = new Date();
        const maxYear = today.getFullYear() - 18;
        const maxMonth = String(today.getMonth() + 1).padStart(2, '0');
        const maxDay = String(today.getDate()).padStart(2, '0');
        txtFechaNacimiento.setAttribute('max', `${maxYear}-${maxMonth}-${maxDay}`);

        txtFechaNacimiento.addEventListener('change', () => {
            if (txtFechaNacimiento.value) {
                const dateObj = new Date(txtFechaNacimiento.value);
                const year = dateObj.getFullYear();
                if (year < 1900 || year > maxYear) {
                    mostrarError(txtFechaNacimiento, 'Debe ser mayor de 18 años y una fecha válida (año >= 1900).');
                    if (txtEdad) txtEdad.value = '';
                } else {
                    if (txtEdad) {
                        txtEdad.value = calcularEdad(txtFechaNacimiento.value);
                    }
                    limpiarError(txtFechaNacimiento);
                }
            } else {
                if (txtEdad) txtEdad.value = '';
                mostrarError(txtFechaNacimiento, 'La fecha de nacimiento es obligatoria.');
            }
        });
    }

    // Funciones auxiliares de estado para el stepper
    function obtenerEstadoInput(input, validationFn, isRequired = false) {
        if (!input) return 'valid';
        const val = input.value.trim();
        if (val === '') {
            if (isRequired || input.hasAttribute('required')) {
                validationFn(input); 
                return 'missing';
            }
            limpiarError(input);
            return 'valid';
        }
        const isValid = validationFn(input);
        return isValid ? 'valid' : 'invalid';
    }

    // Validaciones de Pasos individuales
    // Esta pendiente a cada campo y mostrar si esta lleno o vacio
    function validarPasoEmpleado1() {
        const results = [];
        results.push(obtenerEstadoInput(txtNombre, validarNombre, true));
        results.push(obtenerEstadoInput(txtApellidoPaterno, validarNombre, true));
        results.push(obtenerEstadoInput(txtApellidoMaterno, validarNombre, false));
        
        if (!txtFechaNacimiento.value) {
            mostrarError(txtFechaNacimiento, 'La fecha de nacimiento es obligatoria.');
            results.push('missing');
        } else {
            const dateObj = new Date(txtFechaNacimiento.value);
            const year = dateObj.getFullYear();
            const maxYear = new Date().getFullYear() - 18;
            if (year < 1900 || year > maxYear) {
                mostrarError(txtFechaNacimiento, 'Debe ser mayor de 18 años y una fecha válida (año >= 1900).');
                results.push('invalid');
            } else {
                limpiarError(txtFechaNacimiento);
                results.push('valid');
            }
        }
        // Estos son los campos que evalua el paso 1
        results.push(obtenerEstadoInput(txtRFC, validarRFC, true));
        results.push(obtenerEstadoInput(txtCURP, validarCURP, true));
        results.push(obtenerEstadoInput(document.getElementById('idGenero'), validarSelect, true));
        results.push(obtenerEstadoInput(document.getElementById('ddlEstadoCivil'), validarSelect, true));
        results.push(obtenerEstadoInput(document.getElementById('ddlNacionalidad'), validarSelect, true));
        results.push(obtenerEstadoInput(txtCorreo, validarCorreo, true));
        results.push(obtenerEstadoInput(txtTelefonoCelular, (i) => validarTelefono(i, true), true));
        results.push(obtenerEstadoInput(txtTelefonoFijo, (i) => validarTelefono(i, false), false));
        results.push(obtenerEstadoInput(txtNSS, validarNSS, true));

        if (results.includes('invalid')) return 'invalid';
        if (results.includes('missing')) return 'missing';
        return 'valid';
    }

    // Validaciones del paso 2
    function validarPasoEmpleado2() {
        const results = [];
        const ne = document.getElementById('txtNivelEstudios');
        const inst = document.getElementById('txtInstitucion');
        const carr = document.getElementById('txtCarrera');
        const est = document.getElementById('txtEstatus');
        const fi = document.getElementById('txtFechaInicioEstudios');
        const ff = document.getElementById('txtFechaFinEstudios');

        // Estos son los campos que evalua el paso 2
        results.push(obtenerEstadoInput(ne, validarNombre, true));
        results.push(obtenerEstadoInput(inst, validarCampoTextoGenerico, true));
        results.push(obtenerEstadoInput(carr, validarNombre, true));
        results.push(obtenerEstadoInput(est, validarNombre, true));
        results.push(obtenerEstadoInput(fi, validarFechaLogica, true));
        results.push(obtenerEstadoInput(ff, validarFechaLogica, true));

        if (fi && ff && fi.value && ff.value && ff.value < fi.value) {
            mostrarError(ff, 'La fecha de finalización no puede ser anterior a la de inicio.');
            results.push('invalid');
        }

        if (results.includes('invalid')) return 'invalid';
        if (results.includes('missing')) return 'missing';
        return 'valid';
    }
    // Validaciones del paso 3
    function validarPasoEmpleado3() {
        const container = document.getElementById('experiencias-container');
        if (!container) return 'valid';
        const items = container.querySelectorAll('.experiencia-item');
        const results = [];

        items.forEach(item => {
            const emp = item.querySelector('.txtExpEmpresa');
            const puesto = item.querySelector('.txtExpPuesto');
            const area = item.querySelector('.txtExpArea');
            const fi = item.querySelector('.txtExpFechaInicio');
            const ff = item.querySelector('.txtExpFechaFin');
            const sueldo = item.querySelector('.txtExpSueldo');
            const motivo = item.querySelector('.txtExpMotivo');

            // Estos son los campos que evalua el paso 3
            results.push(obtenerEstadoInput(emp, validarCampoTextoGenerico, true));
            results.push(obtenerEstadoInput(puesto, validarNombre, true));
            results.push(obtenerEstadoInput(area, validarNombre, true));
            results.push(obtenerEstadoInput(fi, validarFechaLogica, true));
            results.push(obtenerEstadoInput(ff, validarFechaLogica, true));
            results.push(obtenerEstadoInput(sueldo, (i) => {
                const val = i.value.replace(/,/g, '').trim();
                const num = Number(val);
                const ok = !isNaN(num) && num > 0;
                if (!ok) mostrarError(i, 'Ingrese un sueldo mensual válido.');
                else limpiarError(i);
                return ok;
            }, true));
            results.push(obtenerEstadoInput(motivo, validarCampoTextoGenerico, true));

            if (fi && ff && fi.value && ff.value && ff.value < fi.value) {
                mostrarError(ff, 'La fecha de fin no puede ser anterior a la de inicio.');
                results.push('invalid');
            }
        });

        if (results.includes('invalid')) return 'invalid';
        if (results.includes('missing')) return 'missing';
        return 'valid';
    }

    // Validaciones del paso 4
    function validarPasoEmpleado4() {
        const results = [];
        const colId = document.getElementById('hdnColoniaId');
        const colTxt = document.getElementById('txtColonia');
        const cp = document.getElementById('txtCodigoPostal');
        const ext = document.getElementById('txtNumeroExterior');
        const interior = document.getElementById('txtNumeroInterior');

        // Validar que se haya seleccionado una colonia de la lista de sugerencias
        const hasSelectedColonia = colId && colId.value && colId.value.trim() !== '';
        if (!hasSelectedColonia) {
            mostrarError(colTxt, 'Debe seleccionar una colonia de las sugerencias.');
            results.push('missing');
        } else {
            limpiarError(colTxt);
            results.push('valid');
        }
        // Estos son los campos que evalua el paso 4
        results.push(obtenerEstadoInput(cp, validarCodigoPostal, true));
        results.push(obtenerEstadoInput(ext, (i) => {
            const num = Number(i.value);
            const ok = !isNaN(num) && num > 0;
            if (!ok) mostrarError(i, 'Número exterior inválido.');
            else limpiarError(i);
            return ok;
        }, true));
        results.push(obtenerEstadoInput(interior, validarCampoTextoGenerico, false));

        if (results.includes('invalid')) return 'invalid';
        if (results.includes('missing')) return 'missing';
        return 'valid';
    }

    // Validar los campos del paso 5
    function validarPasoEmpleado5() {
        const results = [];
        const sm = document.getElementById('txtSueldoMensual');
        const al = document.getElementById('ddlAreaLaboral');
        // Estos son los campos que evalua el paso 5
        results.push(obtenerEstadoInput(sm, (i) => {
            const val = i.value.replace(/,/g, '').trim();
            const num = Number(val);
            const ok = !isNaN(num) && num > 0;
            if (!ok) mostrarError(i, 'Ingrese un sueldo mensual válido.');
            else limpiarError(i);
            return ok;
        }, true));
        results.push(obtenerEstadoInput(al, validarSelect, true));

        if (results.includes('invalid')) return 'invalid';
        if (results.includes('missing')) return 'missing';
        return 'valid';
    }

    // Validar los campos de el paso 6
    function validarPasoEmpleado6() {
        const container = document.getElementById('referencias-container');
        if (!container) return 'valid';
        const items = container.querySelectorAll('.referencia-item');
        const results = [];

        items.forEach(item => {
            const nom = item.querySelector('.txtRefNombre');
            const par = item.querySelector('.txtRefParentesco');
            const tel = item.querySelector('.txtRefTelefono');
            // Estos son los campos que evalua el paso 6
            results.push(obtenerEstadoInput(nom, validarNombre, true));
            results.push(obtenerEstadoInput(par, validarNombre, true));
            results.push(obtenerEstadoInput(tel, (i) => validarTelefono(i, true), true));
        });

        if (results.includes('invalid')) return 'invalid';
        if (results.includes('missing')) return 'missing';
        return 'valid';
    }
    // Validar los campos de el paso 7
    function validarPasoEmpleado7() {
        // Estos son los campos de arrastrar y soltar que evalua el paso 7
        const results = [];
        ['identificacion', 'comprobante', 'cv', 'contrato', 'licencia', 'fotoEmpleado'].forEach(key => {
            const ok = validarDropZone(key);
            results.push(ok ? 'valid' : 'missing');
        });

        if (results.includes('invalid')) return 'invalid';
        if (results.includes('missing')) return 'missing';
        return 'valid';
    }

    function validarPasoEmpleado(pasoNum) {
        if (pasoNum === 1) return validarPasoEmpleado1();
        if (pasoNum === 2) return validarPasoEmpleado2();
        if (pasoNum === 3) return validarPasoEmpleado3();
        if (pasoNum === 4) return validarPasoEmpleado4();
        if (pasoNum === 5) return validarPasoEmpleado5();
        if (pasoNum === 6) return validarPasoEmpleado6();
        if (pasoNum === 7) return validarPasoEmpleado7();
        return 'valid';
    }

    // Actualiza el paso depeniendo en el estado que se lleno
    function actualizarStepperEmpleado() {
        const steps = document.querySelectorAll('.stepper .step');
        steps.forEach((step, idx) => {
            const pasoNum = idx + 1;
            const state = validarPasoEmpleado(pasoNum);
            
            step.classList.remove('success', 'warning', 'error');
            if (pasoNum <= maxStepVisited) {
                if (state === 'valid') step.classList.add('success');
                else if (state === 'missing') step.classList.add('warning');
                else if (state === 'invalid') step.classList.add('error');
            }
        });
    }

    function markStepFieldsAsTouched(stepNum) {
        const cards = document.querySelectorAll('.empleado-card');
        const card = cards[stepNum - 1];
        if (card) {
            card.querySelectorAll('input, select, textarea').forEach(el => {
                el.dataset.touched = "true";
            });
        }
    }

    function activarPasoEmpleado(stepNum) {
        if (stepNum > activeStep) {
            markStepFieldsAsTouched(activeStep);
        }
        activeStep = stepNum;
        if (stepNum > maxStepVisited) {
            maxStepVisited = stepNum;
        }

        const steps = document.querySelectorAll('.stepper .step');
        steps.forEach((step, idx) => {
            if (idx + 1 === stepNum) {
                step.classList.add('active');
            } else {
                step.classList.remove('active');
            }
        });
        actualizarStepperEmpleado();
    }

    // Configurar cursor y clics en el stepper para scroll suave
    const steps = document.querySelectorAll('.stepper .step');
    steps.forEach((step, idx) => {
        step.style.cursor = 'pointer';
        step.addEventListener('click', () => {
            const stepNum = idx + 1;
            if (stepNum <= maxStepVisited + 1) {
                activarPasoEmpleado(stepNum);
                const cards = document.querySelectorAll('.empleado-card');
                if (cards[idx]) {
                    cards[idx].scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
            }
        });
    });

    // Cambiar paso activo basado en foco o clics
    document.addEventListener('focusin', (e) => {
        const card = e.target.closest('.empleado-card');
        if (card) {
            const numEl = card.querySelector('.card-num');
            if (numEl) {
                const cardNum = parseInt(numEl.textContent.trim());
                if (cardNum) {
                    activarPasoEmpleado(cardNum);
                }
            }
        }
    });

    document.addEventListener('click', (e) => {
        const card = e.target.closest('.empleado-card');
        if (card) {
            const numEl = card.querySelector('.card-num');
            if (numEl) {
                const cardNum = parseInt(numEl.textContent.trim());
                if (cardNum && cardNum !== activeStep) {
                    activarPasoEmpleado(cardNum);
                }
            }
        }
    });

    // Validación interactiva
    if (form) {
        form.addEventListener('input', actualizarStepperEmpleado);
        form.addEventListener('change', actualizarStepperEmpleado);
    }

    // Interceptar submit
    if (form) {
        form.addEventListener('submit', async function(e) {
            e.preventDefault();
            
            // Forzar que todos los campos de todos los pasos se marquen como touched al enviar
            form.querySelectorAll('input, select, textarea').forEach(el => {
                el.dataset.touched = "true";
            });
            
            maxStepVisited = 7;
            actualizarStepperEmpleado();
            
            let firstInvalidCard = null;
            let isValid = true;
            
            for (let i = 1; i <= 7; i++) {
                const stepState = validarPasoEmpleado(i);
                if (stepState !== 'valid') {
                    isValid = false;
                    if (!firstInvalidCard) {
                        activarPasoEmpleado(i);
                        const cards = document.querySelectorAll('.empleado-card');
                        if (cards[i - 1]) {
                            firstInvalidCard = cards[i - 1];
                        }
                    }
                }
            }
            
            if (!isValid) {
                if (firstInvalidCard) {
                    firstInvalidCard.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }
                Swal.fire({
                    icon: 'warning',
                    title: 'Datos incompletos',
                    text: 'Faltan campos por llenar o contienen errores. Revise los campos marcados en rojo.',
                    confirmButtonColor: 'var(--teal-cavex)'
                });
            } else {
                // Construir JSON payload para EmpEmpleadoSaveDto
                const referencias = [];
                document.querySelectorAll('#referencias-container .referencia-item').forEach(item => {
                    const nom = item.querySelector('.txtRefNombre').value;
                    const par = item.querySelector('.txtRefParentesco').value;
                    const tel = item.querySelector('.txtRefTelefono').value;
                    const telDigits = (tel || '').replace(/[^0-9]/g, '');
                    const telNum = telDigits ? parseInt(telDigits, 10) : 0;
                    referencias.push({
                        strNombreCompleto: nom,
                        strParentezco: par,
                        bigTelefono: telNum,
                        intTelefono: telNum
                    });
                });

                const experienciaLaboral = [];
                document.querySelectorAll('#experiencias-container .experiencia-item').forEach(item => {
                    const emp = item.querySelector('.txtExpEmpresa').value;
                    const puesto = item.querySelector('.txtExpPuesto').value;
                    const area = item.querySelector('.txtExpArea').value;
                    const fi = item.querySelector('.txtExpFechaInicio').value;
                    const ff = item.querySelector('.txtExpFechaFin').value;
                    const sueldo = item.querySelector('.txtExpSueldo').value;
                    const motivo = item.querySelector('.txtExpMotivo').value;
                    experienciaLaboral.push({
                        strEmpresa: emp,
                        strPuesto: puesto,
                        strArea: area,
                        dteFechaIncio: fi,
                        dteFechaFin: ff,
                        mnySueldo: parseFloat(sueldo.replace(/,/g, '')) || 0,
                        strMotivoSalida: motivo
                    });
                });

                const urlParams = new URLSearchParams(window.location.search);
                const empleadoId = urlParams.get('id');
                const isEdit = !!empleadoId;
                const requestUrl = isEdit ? '/Empleado/UpdateEmpleado?id=' + empleadoId : '/Empleado/SaveEmpleado';

                const nssDigits = (document.getElementById('txtNSS').value || '').replace(/[^0-9]/g, '');
                const nssNum = nssDigits ? parseInt(nssDigits, 10) : 0;
                const telFijoDigits = (document.getElementById('txtTelefonoFijo').value || '').replace(/[^0-9]/g, '');
                const telCelDigits = (document.getElementById('txtTelefonoCelular').value || '').replace(/[^0-9]/g, '');

                const payload = {
                    strNombre: document.getElementById('txtNombre').value,
                    strApellidoPaterno: document.getElementById('txtApellidoPaterno').value,
                    strApellidoMaterno: document.getElementById('txtApellidoMaterno').value || null,
                    dteFechaNacimiento: document.getElementById('txtFechaNacimiento').value,
                    strRfc: document.getElementById('txtRFC').value,
                    strCurp: document.getElementById('txtCURP').value,
                    intEdad: parseInt(document.getElementById('txtEdad').value),
                    strCorreoElectronico: document.getElementById('txtCorreo').value,
                    bigNss: nssNum,
                    idEmpCatGenero: parseInt(document.getElementById('idGenero').value),
                    idEmpCatEstadoCivil: parseInt(document.getElementById('ddlEstadoCivil').value),
                    idEmpCatNacionalidad: parseInt(document.getElementById('ddlNacionalidad').value),
                    idEmpCatTipoContratacion: parseInt(document.getElementById('ddlTipoContratacion')?.value || '1', 10),
                    idCatStatus: 1,
                    idEmpCatAreaLaboral: parseInt(document.getElementById('ddlAreaLaboral').value),
                    direccion: {
                        idEmpCatColonia: parseInt(document.getElementById('hdnColoniaId').value),
                        intNumExterior: parseInt(document.getElementById('txtNumeroExterior').value),
                        intNumInterior: parseInt(document.getElementById('txtNumeroInterior').value) || null
                    },
                    datosAcademicos: {
                        strNivelEstudios: document.getElementById('txtNivelEstudios').value,
                        strInstitucion: document.getElementById('txtInstitucion').value,
                        strCarrera: document.getElementById('txtCarrera').value,
                        strEstatus: document.getElementById('txtEstatus').value,
                        dteFechaInicio: document.getElementById('txtFechaInicioEstudios').value,
                        dteFechaFin: document.getElementById('txtFechaFinEstudios').value
                    },
                    documentosLaborales: {
                        strUrlIdentificacionOficial: document.getElementById('file-identificacion').files[0]?.name 
                            ? "/uploads/" + document.getElementById('file-identificacion').files[0].name 
                            : (window.existingDocumentUrls?.identificacion || ""),
                        strUrlComprobanteDomicilio: document.getElementById('file-comprobante').files[0]?.name 
                            ? "/uploads/" + document.getElementById('file-comprobante').files[0].name 
                            : (window.existingDocumentUrls?.comprobante || ""),
                        strUrlCurriculumVitae: document.getElementById('file-cv').files[0]?.name 
                            ? "/uploads/" + document.getElementById('file-cv').files[0].name 
                            : (window.existingDocumentUrls?.cv || ""),
                        strUrlContrato: document.getElementById('file-contrato').files[0]?.name 
                            ? "/uploads/" + document.getElementById('file-contrato').files[0].name 
                            : (window.existingDocumentUrls?.contrato || ""),
                        strUrlLicencia: document.getElementById('file-licencia').files[0]?.name 
                            ? "/uploads/" + document.getElementById('file-licencia').files[0].name 
                            : (window.existingDocumentUrls?.licencia || ""),
                        strUrlFotoEmp: document.getElementById('file-fotoEmpleado').files[0]?.name
                            ? "/uploads/" + document.getElementById('file-fotoEmpleado').files[0].name
                            : (window.existingDocumentUrls?.fotoEmpleado || "")
                    },
                    condicionesLaborales: {
                        bitCercaniaVivienda: document.getElementById('chkVivienda').checked,
                        bitDisponibilidadDeViaje: document.getElementById('chkViaje').checked,
                        mnySueldoMensual: parseFloat(document.getElementById('txtSueldoMensual').value.replace(/,/g, '')) || 0,
                        bitExperienciaEnArea: document.getElementById('chkExp').checked,
                        bitDisponibilidadCambioResidencia: document.getElementById('chkExpPuesto').checked,
                        dteFechaIngreso: new Date().toISOString().split('T')[0]
                    },
                    referencias: referencias,
                    experienciaLaboral: experienciaLaboral,
                    telefonos: [
                        {
                            bigNumeroFijo: telFijoDigits ? parseInt(telFijoDigits, 10) : 0,
                            bigNumeroCelular: telCelDigits ? parseInt(telCelDigits, 10) : 0,
                            strNumeroFijo: document.getElementById('txtTelefonoFijo').value || "",
                            strNumeroCelular: document.getElementById('txtTelefonoCelular').value || ""
                        }
                    ]
                };
                try {
                    Swal.fire({
                        title: 'Guardando empleado...',
                        allowOutsideClick: false,
                        didOpen: () => {
                            Swal.showLoading();
                        }
                    });
                    
                    const formData = new FormData();
                    formData.append("employeeData", JSON.stringify(payload));
                    
                    const fileIdentificacion = document.getElementById('file-identificacion')?.files[0];
                    if (fileIdentificacion) formData.append("Identificacion", fileIdentificacion);
                    
                    const fileComprobante = document.getElementById('file-comprobante')?.files[0];
                    if (fileComprobante) formData.append("Comprobante", fileComprobante);
                    
                    const fileCv = document.getElementById('file-cv')?.files[0];
                    if (fileCv) formData.append("Cv", fileCv);
                    
                    const fileContrato = document.getElementById('file-contrato')?.files[0];
                    if (fileContrato) formData.append("Contrato", fileContrato);
                    
                    const fileLicencia = document.getElementById('file-licencia')?.files[0];
                    if (fileLicencia) formData.append("Licencia", fileLicencia);
                    
                    const fileFotoEmpleado = document.getElementById('file-fotoEmpleado')?.files[0];
                    if (fileFotoEmpleado) formData.append("FotoEmpleado", fileFotoEmpleado);
                    
                    fetch(requestUrl, {
                        method: 'POST',
                        body: formData
                    })
                    .then(response => response.json())
                    .then(result => {
                        if (result.success) {
                            Swal.fire({
                                icon: 'success',
                                title: '¡Éxito!',
                                text: isEdit ? '¡Empleado actualizado exitosamente!' : '¡Empleado guardado exitosamente!',
                                confirmButtonColor: 'var(--teal-cavex)',
                                confirmButtonText: 'Ver listado de empleados'
                            }).then(() => {
                                window.location.href = '/Empleado/Index';
                            });
                        } else {
                            Swal.fire({
                                icon: 'error',
                                title: 'Error al guardar',
                                text: result.message || 'No se pudo guardar el empleado.',
                                confirmButtonColor: 'var(--teal-cavex)'
                            });
                        }
                    })
                    .catch(err => {
                        console.error("Error al registrar:", err);
                        Swal.fire({
                            icon: 'error',
                            title: 'Error de red',
                            text: 'No se pudo contactar con el servidor. Intenta de nuevo.',
                            confirmButtonColor: 'var(--teal-cavex)'
                        });
                    });
                } catch (error) {
                    console.error("Error en try-catch:", error);
                }
            }
        });
    }

    function loadCatalogs() {
        // ── GÉNERO: carga desde /Empleado/GetGeneros ──
        const p1 = fetch('/Empleado/GetGeneros')
            .then(function (response) {
                if (!response.ok) {
                    throw new Error('HTTP error ' + response.status);
                }
                return response.json();
            })
            .then(function (result) {
                if (!result.success) {
                    console.error('[Género] success=false, message:', result.message);
                    return;
                }
                if (!result.data || !Array.isArray(result.data)) {
                    console.error('[Género] data no es un array:', result.data);
                    return;
                }

                var select = document.getElementById('idGenero');
                if (!select) {
                    return;
                }

                // Limpiar y poblar el select
                select.innerHTML = '<option value="" disabled selected>Seleccionar Género</option>';
                result.data.forEach(function (item) {
                    var opt = document.createElement('option');
                    opt.value = item.id;
                    opt.textContent = item.strValor;
                    select.appendChild(opt);
                });
            })
            .catch(function (err) {
                console.error('[Género] ERROR al cargar:', err);
            });

        // ── ESTADO CIVIL ──
        const p2 = fetch('/Empleado/GetEstadosCiviles')
            .then(res => res.json())
            .then(res => {
                if (res.success && res.data) {
                    const select = document.getElementById('ddlEstadoCivil');
                    if (select) {
                        select.innerHTML = '<option value="" disabled selected>Seleccionar estado civil</option>';
                        res.data.forEach(item => {
                            const opt = document.createElement('option');
                            opt.value = item.id;
                            opt.textContent = item.strValor;
                            select.appendChild(opt);
                        });
                    }
                }
            })
            .catch(err => console.error('[EstadoCivil] ERROR:', err));

        // ── NACIONALIDAD ──
        const p3 = fetch('/Empleado/GetNacionalidades')
            .then(res => res.json())
            .then(res => {
                if (res.success && res.data) {
                    const select = document.getElementById('ddlNacionalidad');
                    if (select) {
                        select.innerHTML = '<option value="" disabled selected>Seleccionar nacionalidad</option>';
                        res.data.forEach(item => {
                            const opt = document.createElement('option');
                            opt.value = item.id;
                            opt.textContent = item.strValor;
                            select.appendChild(opt);
                        });
                    }
                }
            })
            .catch(err => console.error('[Nacionalidad] ERROR:', err));

        // ── ÁREA LABORAL ──
        const p4 = fetch('/AreaLaboral/GetAreas?pageSize=100')
            .then(res => res.json())
            .then(res => {
                if (res.success && res.data) {
                    const select = document.getElementById('ddlAreaLaboral');
                    if (select) {
                        select.innerHTML = '<option value="" disabled selected>Seleccionar área</option>';
                        res.data.forEach(item => {
                            const opt = document.createElement('option');
                            opt.value = item.id;
                            opt.textContent = item.strValor;
                            select.appendChild(opt);
                        });
                    }
                }
            })
            .catch(err => console.error('[AreaLaboral] ERROR:', err));

        // ── TIPO DE CONTRATO ──
        const p5 = fetch('/Empleado/GetTiposContratacion')
            .then(res => res.json())
            .then(res => {
                if (res.success && res.data) {
                    const select = document.getElementById('ddlTipoContratacion');
                    if (select) {
                        select.innerHTML = '<option value="" disabled selected>Seleccionar tipo de contrato</option>';
                        res.data.forEach(item => {
                            const opt = document.createElement('option');
                            opt.value = item.id;
                            opt.textContent = item.strValor;
                            select.appendChild(opt);
                        });
                    }
                }
            })
            .catch(err => console.error('[TipoContratacion] ERROR:', err));

        return Promise.all([p1, p2, p3, p4, p5]);
    }

    window.existingDocumentUrls = {};

    function loadEmpleadoData(id) {
        Swal.fire({
            title: 'Cargando datos del empleado...',
            allowOutsideClick: false,
            didOpen: () => {
                Swal.showLoading();
            }
        });

        fetch('/Empleado/GetEmpleado?id=' + id)
            .then(res => res.json())
            .then(result => {
                Swal.close();
                if (result.success && result.data) {
                    const emp = result.data;

                    // Guardar URLs de documentos existentes para preservarlos al guardar edicion
                    const existingDocs = emp.empDocumentosLaborales || emp.EmpDocumentosLaborales || {};
                    window.existingDocumentUrls = {
                        identificacion: existingDocs.strUrlIdentificacionOficial || existingDocs.StrUrlIdentificacionOficial || '',
                        comprobante: existingDocs.strUrlComprobanteDomicilio || existingDocs.StrUrlComprobanteDomicilio || '',
                        cv: existingDocs.strUrlCurriculumVitae || existingDocs.StrUrlCurriculumVitae || '',
                        contrato: existingDocs.strUrlContrato || existingDocs.StrUrlContrato || '',
                        licencia: existingDocs.strUrlLicencia || existingDocs.StrUrlLicencia || '',
                        fotoEmpleado: existingDocs.strUrlFotoEmp || existingDocs.StrUrlFotoEmp || ''
                    };

                    // Mapear campos básicos
                    document.getElementById('txtNombre').value = emp.strNombre || emp.StrNombre || '';
                    document.getElementById('txtApellidoPaterno').value = emp.strApellidoPaterno || emp.StrApellidoPaterno || '';
                    document.getElementById('txtApellidoMaterno').value = emp.strApellidoMaterno || emp.StrApellidoMaterno || '';
                    
                    if (emp.dteFechaNacimiento || emp.DteFechaNacimiento) {
                        const rawFecha = emp.dteFechaNacimiento || emp.DteFechaNacimiento;
                        const fechaStr = String(rawFecha).split('T')[0];
                        document.getElementById('txtFechaNacimiento').value = fechaStr;
                        document.getElementById('txtFechaNacimiento').dispatchEvent(new Event('change'));
                    }

                    document.getElementById('txtRFC').value = emp.strRfc || emp.StrRfc || '';
                    document.getElementById('txtCURP').value = emp.strCurp || emp.StrCurp || '';
                    document.getElementById('txtCorreo').value = emp.strCorreoElectronico || emp.StrCorreoElectronico || '';
                    
                    const rawNss = emp.bigNss || emp.BigNss || '';
                    if (rawNss && rawNss !== 0 && rawNss !== '0') {
                        document.getElementById('txtNSS').value = String(rawNss).padStart(11, '0');
                    } else {
                        document.getElementById('txtNSS').value = '';
                    }

                    document.getElementById('idGenero').value = emp.idEmpCatGenero;
                    document.getElementById('idGenero').dispatchEvent(new Event('change'));
                    
                    document.getElementById('ddlEstadoCivil').value = emp.idEmpCatEstadoCivil;
                    document.getElementById('ddlEstadoCivil').dispatchEvent(new Event('change'));

                    document.getElementById('ddlNacionalidad').value = emp.idEmpCatNacionalidad;
                    document.getElementById('ddlNacionalidad').dispatchEvent(new Event('change'));

                    // Mapear Dirección
                    if (emp.empDireccion) {
                        const colId = emp.empDireccion.idEmpCatColonia;
                        document.getElementById('hdnColoniaId').value = colId;
                        document.getElementById('txtNumeroExterior').value = emp.empDireccion.intNumExterior || '';
                        document.getElementById('txtNumeroInterior').value = emp.empDireccion.intNumInterior || '';
                        
                        if (colId) {
                            fetch('/Empleado/GetColonia?id=' + colId)
                                .then(res => res.json())
                                .then(res => {
                                     if (res.success && res.data) {
                                         const estado = decodeUtf8Mojibake(res.data.strEstado || 'Estado Desconocido');
                                         const municipio = decodeUtf8Mojibake(res.data.strMunicipio || 'Municipio Desconocido');
                                         const cp = String(res.data.intCodigoPostal).padStart(5, '0');
                                         let colTexto = decodeUtf8Mojibake(res.data.strValor);
                                         if (cp) {
                                             colTexto += ', CP ' + cp;
                                         }
                                         if (estado && estado !== 'Estado Desconocido') {
                                             colTexto += ', ' + estado;
                                         }
                                         if (municipio && municipio !== 'Municipio Desconocido') {
                                             colTexto += ', ' + municipio;
                                         }
                                         document.getElementById('txtColonia').value = colTexto;
                                         document.getElementById('txtCodigoPostal').value = cp;
                                     }
                                });
                        }
                    }

                    // Mapear Datos Académicos
                    if (emp.empDatosAcademicos) {
                        document.getElementById('txtNivelEstudios').value = emp.empDatosAcademicos.strNivelEstudios;
                        document.getElementById('txtInstitucion').value = emp.empDatosAcademicos.strInstitucion;
                        document.getElementById('txtCarrera').value = emp.empDatosAcademicos.strCarrera;
                        document.getElementById('txtEstatus').value = emp.empDatosAcademicos.strEstatus;
                        
                        if (emp.empDatosAcademicos.dteFechaInicio) {
                            document.getElementById('txtFechaInicioEstudios').value = emp.empDatosAcademicos.dteFechaInicio.split('T')[0];
                        }
                        if (emp.empDatosAcademicos.dteFechaFin) {
                            document.getElementById('txtFechaFinEstudios').value = emp.empDatosAcademicos.dteFechaFin.split('T')[0];
                        }
                    }

                    // Mapear Condiciones Laborales
                    if (emp.empCondicionesLaborales) {
                        document.getElementById('chkVivienda').checked = emp.empCondicionesLaborales.bitCercaniaVivienda;
                        document.getElementById('chkViaje').checked = emp.empCondicionesLaborales.bitDisponibilidadDeViaje;
                        document.getElementById('txtSueldoMensual').value = formatNumberWithComas(emp.empCondicionesLaborales.mnySueldoMensual.toFixed(2));
                        document.getElementById('chkExp').checked = emp.empCondicionesLaborales.bitExperienciaEnArea;
                        document.getElementById('chkExpPuesto').checked = emp.empCondicionesLaborales.bitDisponibilidadCambioResidencia;
                    }

                    // Mapear Teléfonos
                    if (emp.empTelefonos && emp.empTelefonos.length > 0) {
                        const telefono = emp.empTelefonos[0];
                        const rawFijo = telefono.bigNumeroFijo || telefono.strNumeroFijo || telefono.intNumeroFijo || '';
                        const rawCel = telefono.bigNumeroCelular || telefono.strNumeroCelular || telefono.intNumeroCelular || '';
                        document.getElementById('txtTelefonoFijo').value = (rawFijo && rawFijo !== 0 && rawFijo !== '0') ? String(rawFijo).padStart(10, '0') : '';
                        document.getElementById('txtTelefonoCelular').value = (rawCel && rawCel !== 0 && rawCel !== '0') ? String(rawCel).padStart(10, '0') : '';
                    }

                    // Mapear Área Laboral y Tipo de Contrato
                    let idAreaLaboral = emp.idEmpCatAreaLaboral || emp.IdEmpCatAreaLaboral || null;
                    if (emp.empHistorialAreas && emp.empHistorialAreas.length > 0) {
                        const sortedAreas = [...emp.empHistorialAreas].sort((a, b) => (b.id || 0) - (a.id || 0));
                        idAreaLaboral = sortedAreas[0].idEmpCatAreaLaboral || idAreaLaboral;
                    }

                    if (idAreaLaboral) {
                        const ddlArea = document.getElementById('ddlAreaLaboral');
                        if (ddlArea) {
                            ddlArea.value = idAreaLaboral;
                            ddlArea.dispatchEvent(new Event('change'));
                        }
                    }

                    const idTipoContrato = emp.idEmpCatTipoContratacion || emp.IdEmpCatTipoContratacion;
                    if (idTipoContrato) {
                        const ddlTipo = document.getElementById('ddlTipoContratacion');
                        if (ddlTipo) {
                            ddlTipo.value = idTipoContrato;
                            ddlTipo.dispatchEvent(new Event('change'));
                        }
                    }

                    // Mapear Experiencias Laborales
                    if (emp.empExperiencias && emp.empExperiencias.length > 0) {
                        const container = document.getElementById('experiencias-container');
                        const template = container.querySelector('.experiencia-item');
                        if (container && template) {
                            container.innerHTML = '';
                            emp.empExperiencias.forEach((exp) => {
                                const item = template.cloneNode(true);
                                container.appendChild(item);
                                if (item) {
                                    item.querySelector('.txtExpEmpresa').value = exp.strEmpresa;
                                    item.querySelector('.txtExpPuesto').value = exp.strPuesto;
                                    item.querySelector('.txtExpArea').value = exp.strArea;
                                    if (exp.dteFechaIncio) item.querySelector('.txtExpFechaInicio').value = exp.dteFechaIncio.split('T')[0];
                                    if (exp.dteFechaFin) item.querySelector('.txtExpFechaFin').value = exp.dteFechaFin.split('T')[0];
                                    item.querySelector('.txtExpSueldo').value = formatNumberWithComas(exp.mnySueldo.toFixed(2));
                                    item.querySelector('.txtExpMotivo').value = exp.strMotivoSalida;
                                }
                            });
                            actualizarNombresDinamicos();
                        }
                    }

                    // Mapear Referencias Personales
                    const refs = emp.empReferenciasPersonales || emp.referencias || emp.empReferencias || emp.EmpReferenciasPersonales || [];
                    if (refs && refs.length > 0) {
                        const container = document.getElementById('referencias-container');
                        const template = container ? container.querySelector('.referencia-item') : null;
                        if (container && template) {
                            const itemTemplate = template.cloneNode(true);
                            container.innerHTML = '';
                            refs.forEach((ref) => {
                                const item = itemTemplate.cloneNode(true);
                                container.appendChild(item);
                                if (item) {
                                    const nomEl = item.querySelector('.txtRefNombre');
                                    if (nomEl) nomEl.value = ref.strNombreCompleto || ref.nombreCompleto || ref.strNombre || ref.StrNombreCompleto || '';
                                    
                                    const parEl = item.querySelector('.txtRefParentesco');
                                    if (parEl) parEl.value = ref.strParentezco || ref.strParentesco || ref.parentezco || ref.StrParentezco || '';
                                    
                                    const telEl = item.querySelector('.txtRefTelefono');
                                    if (telEl) {
                                        const rawRefTel = ref.bigTelefono || ref.BigTelefono || '';
                                        if (rawRefTel && rawRefTel !== 0 && rawRefTel !== '0') {
                                            telEl.value = String(rawRefTel).padStart(10, '0');
                                        } else {
                                            telEl.value = '';
                                        }
                                    }
                                }
                            });
                            actualizarNombresDinamicos();
                        }
                    }

                    // Mapear Documentos (Pre-visualizar si existen en DB)
                    if (emp.empDocumentosLaborales) {
                        const docs = emp.empDocumentosLaborales;
                        window.existingDocumentUrls = {
                            identificacion: docs.strUrlIdentificacionOficial,
                            comprobante: docs.strUrlComprobanteDomicilio,
                            cv: docs.strUrlCurriculumVitae,
                            contrato: docs.strUrlContrato,
                            licencia: docs.strUrlLicencia,
                            fotoEmpleado: docs.strUrlFotoEmp
                        };

                        Object.keys(window.existingDocumentUrls).forEach(key => {
                            const url = window.existingDocumentUrls[key];
                            if (url) {
                                const zone = document.getElementById('drop-zone-' + key);
                                if (zone) {
                                    const prompt = zone.querySelector('.drop-zone-prompt');
                                    const preview = zone.querySelector('.file-preview-container');
                                    const nameText = document.getElementById('name-' + key);
                                    
                                    if (prompt) prompt.style.display = 'none';
                                    if (preview) preview.style.display = 'flex';
                                    if (nameText) nameText.textContent = url.split('/').pop() || (key === 'fotoEmpleado' ? 'foto_guardada.jpg' : 'Archivo guardado.pdf');
                                    
                                    zone.classList.add('has-file');
                                    const input = document.getElementById('file-' + key);
                                    if (input) input.removeAttribute('required');
                                }
                            }
                        });
                    }

                    // Cambiar título e info visual de edición
                    const titleText = document.querySelector('.form-header-content h1');
                    if (titleText) titleText.textContent = 'Editar Empleado';
                    
                    const subTitleText = document.querySelector('.form-header-content p');
                    if (subTitleText) subTitleText.textContent = 'Modifica los datos del empleado en el sistema.';

                    maxStepVisited = 7;
                    actualizarStepperEmpleado();
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: result.message || 'No se pudo cargar la información del empleado.'
                    });
                }
            })
            .catch(err => {
                Swal.close();
                console.error("Error al cargar datos del empleado:", err);
            });
    }

    loadCatalogs().then(() => {
        const urlParams = new URLSearchParams(window.location.search);
        const empleadoId = urlParams.get('id');
        if (empleadoId) {
            loadEmpleadoData(empleadoId);
        }
    });

    // Autocompletado de Colonias con Sugerencias y CP Automático
    const txtColonia = document.getElementById('txtColonia');
    const hdnColoniaId = document.getElementById('hdnColoniaId');
    const coloniaSuggestions = document.getElementById('colonia-suggestions');


    function normalizarTextoBusqueda(valor) {
        return String(valor || '')
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .toUpperCase()
            .trim();
    }

    function obtenerValorColonia(item) {
        return item?.strValor || item?.StrValor || item?.nombre || item?.Nombre || item?.valor || item?.Valor || '';
    }

    function obtenerCodigoPostalColonia(item) {
        return item?.intCodigoPostal || item?.IntCodigoPostal || item?.codigoPostal || item?.CodigoPostal || item?.cp || item?.CP || '';
    }

    function obtenerIdColonia(item) {
        return item?.id || item?.Id || item?.idEmpCatColonia || item?.IdEmpCatColonia || '';
    }

    function obtenerListaColonias(res) {
        if (Array.isArray(res?.data)) return res.data;
        if (Array.isArray(res?.Data)) return res.Data;
        if (Array.isArray(res?.data?.items)) return res.data.items;
        if (Array.isArray(res?.Data?.Items)) return res.Data.Items;
        if (Array.isArray(res?.items)) return res.items;
        if (Array.isArray(res?.Items)) return res.Items;
        return [];
    }

    function coincideConBusquedaColonia(item, query) {
        const valor = normalizarTextoBusqueda(obtenerValorColonia(item));
        const busqueda = normalizarTextoBusqueda(query);
        const palabras = busqueda.split(/\s+/).filter(Boolean);

        return palabras.length > 0 && palabras.every(palabra => valor.includes(palabra));
    }

    function mostrarMensajeColonia(mensaje, tipo = 'info') {
        coloniaSuggestions.innerHTML = '';
        const div = document.createElement('div');
        div.className = tipo === 'error' ? 'suggestion-no-results suggestion-error' : 'suggestion-no-results';
        div.textContent = mensaje;
        coloniaSuggestions.appendChild(div);
        coloniaSuggestions.style.display = 'block';
    }

    let debounceTimer;
    if (txtColonia && hdnColoniaId && coloniaSuggestions) {
        txtColonia.addEventListener('input', function() {
            const query = txtColonia.value.trim();
            hdnColoniaId.value = ''; // Resetear el ID si se modifica el texto

            clearTimeout(debounceTimer);
            if (query.length < 3) {
                coloniaSuggestions.innerHTML = '';
                coloniaSuggestions.style.display = 'none';
                return;
            }

            mostrarMensajeColonia('Buscando colonias...');

            debounceTimer = setTimeout(() => {
                fetch('/Empleado/GetColonias?search=' + encodeURIComponent(query), {
                    headers: { 'Accept': 'application/json' }
                })
                    .then(res => {
                        if (!res.ok) {
                            throw new Error('HTTP ' + res.status);
                        }
                        return res.json();
                    })
                    .then(res => {
                        coloniaSuggestions.innerHTML = '';
                        if (res.success === false || res.Success === false) {
                            throw new Error(res.message || res.Message || 'La API no pudo obtener colonias.');
                        }

                        const colonias = obtenerListaColonias(res);
                        const sugerencias = colonias
                            .filter(item => coincideConBusquedaColonia(item, query))
                            .slice(0, 15);

                        if ((res.success === true || res.Success === true || colonias.length > 0) && sugerencias.length > 0) {
                            sugerencias.forEach(item => {
                                const nombreColonia = obtenerValorColonia(item);
                                const codigoPostal = String(obtenerCodigoPostalColonia(item)).padStart(5, '0');
                                const div = document.createElement('div');
                                div.className = 'suggestion-item';
                                const nombreColoniaItem = decodeUtf8Mojibake(item?.strValor || item?.StrValor || item?.colonia || item?.Colonia || 'Colonia Desconocida');
                                const estado = decodeUtf8Mojibake(item?.strEstado || item?.StrEstado || 'Estado Desconocido');
                                const municipio = decodeUtf8Mojibake(item?.strMunicipio || item?.StrMunicipio || 'Municipio Desconocido');
                                div.innerHTML = `<strong>"${nombreColoniaItem}"</strong>, CP ${codigoPostal}, ${estado}, ${municipio}`;
                                div.addEventListener('mousedown', (event) => {
                                    event.preventDefault();
                                    
                                    let colTexto = nombreColoniaItem;
                                    
                                    if (codigoPostal) {
                                        colTexto += ', CP ' + codigoPostal;
                                    }
                                    if (estado && estado !== 'Estado Desconocido') {
                                        colTexto += ', ' + estado;
                                    }
                                    if (municipio && municipio !== 'Municipio Desconocido') {
                                        colTexto += ', ' + municipio;
                                    }
                                    
                                    txtColonia.value = colTexto;
                                    hdnColoniaId.value = obtenerIdColonia(item);
                                    txtCodigoPostal.value = codigoPostal;
                                    
                                    coloniaSuggestions.innerHTML = '';
                                    coloniaSuggestions.style.display = 'none';

                                    // Marcar inputs como interactuados y disparar validaciones
                                    txtColonia.dataset.touched = "true";
                                    txtCodigoPostal.dataset.touched = "true";
                                    limpiarError(txtColonia);
                                    limpiarError(txtCodigoPostal);
                                    actualizarStepperEmpleado();
                                });
                                coloniaSuggestions.appendChild(div);
                            });
                            coloniaSuggestions.style.display = 'block';
                        } else {
                            mostrarMensajeColonia('No se encontraron colonias');
                        }
                    })
                    .catch(err => {
                        console.error('Error fetching colonias:', err);
                        mostrarMensajeColonia('No se pudieron cargar las colonias: ' + err.message, 'error');
                    });
            }, 300);
        });

        // Ocultar sugerencias si se da click fuera del campo
        document.addEventListener('click', function(e) {
            if (e.target !== txtColonia && e.target !== coloniaSuggestions && !coloniaSuggestions.contains(e.target)) {
                coloniaSuggestions.innerHTML = '';
                coloniaSuggestions.style.display = 'none';
            }
        });
    }

    initStepperFloat();
});

// Funciones de Drag & Drop y Subida de Archivos
function handleDragOver(e) {
    e.preventDefault();
    e.stopPropagation();
    const zone = e.currentTarget;
    zone.classList.add('drag-over');
}

function handleDragLeave(e) {
    e.preventDefault();
    e.stopPropagation();
    const zone = e.currentTarget;
    zone.classList.remove('drag-over');
}

function handleDrop(e, key) {
    e.preventDefault();
    e.stopPropagation();
    const zone = e.currentTarget;
    zone.classList.remove('drag-over');
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
        const file = e.dataTransfer.files[0];
        procesarArchivo(file, key);
    }
}

function handleFileSelect(e, key) {
    if (e.target.files && e.target.files.length > 0) {
        const file = e.target.files[0];
        procesarArchivo(file, key);
    }
}

function procesarArchivo(file, key) {
    const input = document.getElementById('file-' + key);
    const zone = document.getElementById('drop-zone-' + key);
    if (!input || !zone) return;
    
    // Para fotos de empleado: convertir a JPG si es necesario
    if (key === 'fotoEmpleado') {
        procesarImagenComoJPG(file, input, zone, key);
        return;
    }
    
    // Para otros documentos: validar que sean PDF
    const ext = file.name.substring(file.name.lastIndexOf('.')).toLowerCase();
    
    if (ext !== '.pdf' || file.type !== 'application/pdf') {
        Swal.fire({
            icon: 'warning',
            title: 'Archivo no permitido',
            text: 'Formato de archivo no permitido. Solo se aceptan archivos PDF reales.',
            confirmButtonColor: 'var(--teal-cavex)'
        });
        return;
    }
    
    // Asignar el archivo al input
    const dataTransfer = new DataTransfer();
    dataTransfer.items.add(file);
    input.files = dataTransfer.files;
    input.dataset.touched = "true";
    
    // Actualizar UI
    const prompt = zone.querySelector('.drop-zone-prompt');
    const preview = zone.querySelector('.file-preview-container');
    const nameText = document.getElementById('name-' + key);
    const sizeText = document.getElementById('size-' + key);
    
    if (prompt) prompt.style.display = 'none';
    if (preview) preview.style.display = 'flex';
    if (nameText) nameText.textContent = file.name;
    if (sizeText) {
        const sizeKB = (file.size / 1024).toFixed(1);
        sizeText.textContent = sizeKB + ' KB';
    }
    
    zone.classList.remove('has-error');
    zone.classList.add('has-file');
    
    // Disparar evento change en el formulario para actualizar el stepper
    const form = document.getElementById('form-empleado');
    if (form) {
        const event = new Event('change', { bubbles: true });
        form.dispatchEvent(event);
    }
}

// Función para convertir cualquier imagen a JPG
function procesarImagenComoJPG(file, input, zone, key) {
    const maxSize = 5 * 1024 * 1024; // 5 MB
    
    if (file.size > maxSize) {
        Swal.fire({
            icon: 'warning',
            title: 'Archivo muy grande',
            text: 'La imagen no debe superar 5 MB.',
            confirmButtonColor: 'var(--teal-cavex)'
        });
        return;
    }
    
    // Validar que sea una imagen
    if (!file.type.startsWith('image/')) {
        Swal.fire({
            icon: 'warning',
            title: 'Archivo no válido',
            text: 'Por favor selecciona una imagen (JPG, PNG, WEBP).',
            confirmButtonColor: 'var(--teal-cavex)'
        });
        return;
    }
    
    const reader = new FileReader();
    reader.onload = function(e) {
        const img = new Image();
        img.onload = function() {
            // Crear canvas y convertir a JPG
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            ctx.fillStyle = '#FFF';
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            ctx.drawImage(img, 0, 0);
            
            // Convertir a blob JPG
            canvas.toBlob(function(blob) {
                // Generar nombre de archivo con extensión .jpg
                const originalName = file.name.substring(0, file.name.lastIndexOf('.'));
                const newFileName = originalName + '.jpg';
                const jpgFile = new File([blob], newFileName, { type: 'image/jpeg' });
                
                // Asignar archivo JPG al input
                const dataTransfer = new DataTransfer();
                dataTransfer.items.add(jpgFile);
                input.files = dataTransfer.files;
                input.dataset.touched = "true";
                
                // Actualizar UI
                const prompt = zone.querySelector('.drop-zone-prompt');
                const preview = zone.querySelector('.file-preview-container');
                const nameText = document.getElementById('name-' + key);
                const sizeText = document.getElementById('size-' + key);
                
                if (prompt) prompt.style.display = 'none';
                if (preview) preview.style.display = 'flex';
                if (nameText) nameText.textContent = newFileName + ' (Convertida a JPG)';
                if (sizeText) {
                    const sizeKB = (blob.size / 1024).toFixed(1);
                    sizeText.textContent = sizeKB + ' KB';
                }
                
                zone.classList.remove('has-error');
                zone.classList.add('has-file');
                
                // Disparar evento change en el formulario
                const form = document.getElementById('form-empleado');
                if (form) {
                    const event = new Event('change', { bubbles: true });
                    form.dispatchEvent(event);
                }
            }, 'image/jpeg', 0.92);
        };
        img.onerror = function() {
            Swal.fire({
                icon: 'error',
                title: 'Error al procesar imagen',
                text: 'No se pudo procesar la imagen. Verifica que sea un archivo válido.',
                confirmButtonColor: 'var(--teal-cavex)'
            });
        };
        img.src = e.target.result;
    };
    reader.onerror = function() {
        Swal.fire({
            icon: 'error',
            title: 'Error al leer archivo',
            text: 'No se pudo leer el archivo seleccionado.',
            confirmButtonColor: 'var(--teal-cavex)'
        });
    };
    reader.readAsDataURL(file);
}

function removeFile(key) {
    const input = document.getElementById('file-' + key);
    const zone = document.getElementById('drop-zone-' + key);
    if (!input || !zone) return;
    
    input.value = '';
    input.dataset.touched = "true";
    
    const prompt = zone.querySelector('.drop-zone-prompt');
    const preview = zone.querySelector('.file-preview-container');
    
    if (prompt) prompt.style.display = 'block';
    if (preview) preview.style.display = 'none';
    
    zone.classList.remove('has-file');
    
    // Disparar evento en el formulario para actualizar el stepper
    const form = document.getElementById('form-empleado');
    if (form) {
        const event = new Event('change', { bubbles: true });
        form.dispatchEvent(event);
    }
}

function actualizarNombresDinamicos() {
    // Experiencias
    const expItems = document.querySelectorAll('#experiencias-container .experiencia-item');
    expItems.forEach((item, idx) => {
        const empresa = item.querySelector('.txtExpEmpresa');
        if (empresa) empresa.name = `Experiencias[${idx}].Empresa`;
        
        const puesto = item.querySelector('.txtExpPuesto');
        if (puesto) puesto.name = `Experiencias[${idx}].Puesto`;
        
        const area = item.querySelector('.txtExpArea');
        if (area) area.name = `Experiencias[${idx}].Area`;
        
        const fechaInicio = item.querySelector('.txtExpFechaInicio');
        if (fechaInicio) fechaInicio.name = `Experiencias[${idx}].FechaInicio`;
        
        const fechaFin = item.querySelector('.txtExpFechaFin');
        if (fechaFin) fechaFin.name = `Experiencias[${idx}].FechaFin`;
        
        const sueldo = item.querySelector('.txtExpSueldo');
        if (sueldo) sueldo.name = `Experiencias[${idx}].Sueldo`;
        
        const motivo = item.querySelector('.txtExpMotivo');
        if (motivo) motivo.name = `Experiencias[${idx}].MotivoSalida`;
    });

    // Referencias
    const refItems = document.querySelectorAll('#referencias-container .referencia-item');
    refItems.forEach((item, idx) => {
        const nombre = item.querySelector('.txtRefNombre');
        if (nombre) nombre.name = `Referencias[${idx}].NombreCompleto`;
        
        const parentesco = item.querySelector('.txtRefParentesco');
        if (parentesco) parentesco.name = `Referencias[${idx}].Parentesco`;
        
        const telefono = item.querySelector('.txtRefTelefono');
        if (telefono) telefono.name = `Referencias[${idx}].TelefonoCelular`;
    });
}

// ─── Fin de Lógica de Edición de Empleado ───
