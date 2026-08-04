document.addEventListener('DOMContentLoaded', () => {
    
    // Determina si un input o textarea debe convertirse a mayúsculas automáticamente
    const shouldUppercase = (element) => {
        // Excluye elementos con clases o atributos de omisión
        if (element.classList.contains('no-uppercase') || element.hasAttribute('data-no-uppercase')) return false;
 
        const name = (element.getAttribute('name') || element.id || '').toLowerCase();
        const type = (element.getAttribute('type') || '').toLowerCase();
 
        // Excluye tipos de datos específicos que no requieren conversión a mayúsculas
        if (['email', 'tel', 'number', 'date', 'time', 'hidden', 'checkbox', 'radio'].includes(type)) return false;
        if (name.includes('correo') || name.includes('telefono') || name.includes('lat') || name.includes('lng')) return false;
        
        // Aplica a campos de texto generales y textareas
        return element.matches('input[type="text"], input:not([type]), textarea, .text-uppercase-input');
    };
 
    // Aplica la conversión automática a mayúsculas en tiempo real preservando el cursor
    document.querySelectorAll('input, textarea').forEach((element) => {
        if (!shouldUppercase(element)) return;
 
        element.classList.add('text-uppercase-input');
        element.addEventListener('input', () => {
            const start = element.selectionStart;
            const end = element.selectionEnd;
            element.value = element.value.toLocaleUpperCase('es-MX');
            if (start !== null && end !== null) element.setSelectionRange(start, end);
        });
    });
 
    // Inicializar selectores de diseño personalizado de forma automática
    initializeCustomSelects();
    cargarMarcasVehiculosGlobales();
});

// ── RESOLUCIÓN GLOBAL DE MARCA DE VEHÍCULOS ──
window.listaMarcasVehiculosGlobal = [];

async function cargarMarcasVehiculosGlobales() {
    if (window.listaMarcasVehiculosGlobal.length > 0) return;
    try {
        const res = await fetch("/Vehiculos/GetVehiculoCatalogos");
        const json = await res.json();
        if (json && json.success && json.data && json.data.idVehCatMarcaVehiculo) {
            window.listaMarcasVehiculosGlobal = json.data.idVehCatMarcaVehiculo;
        }
    } catch (e) {
        console.error("Error al cargar marcas globales:", e);
    }
}

window.obtenerNombreMarcaVehiculo = function(v) {
    if (!v) return "—";
    if (v.strVehCatMarcaVehiculo && v.strVehCatMarcaVehiculo !== "—" && v.strVehCatMarcaVehiculo !== "Desconocida") return v.strVehCatMarcaVehiculo;
    if (v.StrVehCatMarcaVehiculo && v.StrVehCatMarcaVehiculo !== "—" && v.StrVehCatMarcaVehiculo !== "Desconocida") return v.StrVehCatMarcaVehiculo;
    if (v.strMarca && v.strMarca !== "—" && v.strMarca !== "Desconocida") return v.strMarca;
    if (v.StrMarca && v.StrMarca !== "—" && v.StrMarca !== "Desconocida") return v.StrMarca;
    if (v.strMarcaVehiculo && v.strMarcaVehiculo !== "—" && v.strMarcaVehiculo !== "Desconocida") return v.strMarcaVehiculo;

    const marcaId = Number(v.idVehCatMarcaVehiculo ?? v.IdVehCatMarcaVehiculo);
    if (marcaId && window.listaMarcasVehiculosGlobal && window.listaMarcasVehiculosGlobal.length > 0) {
        const m = window.listaMarcasVehiculosGlobal.find(item => Number(item.id ?? item.Id) === marcaId);
        if (m) {
            const nombre = m.strValor || m.StrValor || m.nombre || m.strDescripcion;
            if (nombre) return nombre;
        }
    }
    return "—";
};

// ── FUNCIONES DE LIMPIEZA Y SANITIZACIÓN DE CAMPOS ──

// Elimina emojis del texto usando expresiones regulares
function stripEmojis(val) {
    if (!val) return '';
    return val.replace(/[\p{Emoji_Presentation}\p{Extended_Pictographic}]/gu, '');
}
 
// Deja solo letras y espacios en español (incluye acentos, ñ, ü) y colapsa espacios dobles
function sanitizeLettersOnly(val) {
    let clean = stripEmojis(val);
    clean = clean.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]/g, '');
    return clean.replace(/\s+/g, ' ');
}
 
// Deja únicamente dígitos numéricos en la cadena
function sanitizeDigitsOnly(val) {
    if (!val) return '';
    return val.replace(/\D/g, '');
}
 
// Permite solo números y un único punto decimal
function sanitizeDecimalOnly(val) {
    let clean = stripEmojis(val);
    clean = clean.replace(/[^0-9.]/g, '');
    const parts = clean.split('.');
    // Si hay más de un punto decimal, une el primero y remueve el resto
    if (parts.length > 2) {
        clean = parts[0] + '.' + parts.slice(1).join('');
    }
    return clean;
}

// Formatea inputs numéricos como moneda con separador de millares en tiempo real
window.formatCurrencyInput = function(input) {
    if (!input) return;
    let value = input.value.replace(/[^0-9.]/g, "");
    const parts = value.split(".");
    if (parts.length > 2) {
        value = parts[0] + "." + parts.slice(1).join("");
    }
    let integerPart = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    let decimalPart = parts[1];
    if (decimalPart !== undefined) {
        input.value = integerPart + "." + decimalPart.substring(0, 2);
    } else {
        input.value = integerPart;
    }
};
 
// Permite caracteres alfanuméricos, espacios, guiones y diagonales
function sanitizeAlphanumericDash(val) {
    let clean = stripEmojis(val);
    clean = clean.replace(/[^a-zA-Z0-9\s\-/]/g, '');
    return clean.replace(/\s+/g, ' ');
}
 
// Elimina caracteres comúnmente utilizados en inyecciones de código (XSS, HTML)
function sanitizeGeneralText(val) {
    let clean = stripEmojis(val);
    clean = clean.replace(/[<>[\]{}$%^*+=|\\~`]/g, '');
    return clean;
}
 
// Valida que el correo tenga formato correcto y pertenezca a dominios comerciales conocidos
function validateEmailDomain(email) {
    const val = email.trim().toLowerCase();
    if (!val) return true;
    const regex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!regex.test(val)) return false;
    
    const allowedEmailDomains = ['gmail.com', 'hotmail.com', 'outlook.com', 'yahoo.com'];
    const domain = val.split('@')[1];
    return allowedEmailDomains.includes(domain);
}
 
// ── EFECTO DE STEPPER FLOTANTE / PEGAJOSO (STICKY) ──

// Hace que el indicador de pasos (stepper) flote dinámicamente debajo del navbar
function initStepperFloat(stepperSelector = '.stepper') {
    const stepper = document.querySelector(stepperSelector);
    if (!stepper) return;
 
    const navbar = document.querySelector('.cavex-navbar');
    const NAVBAR_H = navbar ? navbar.offsetHeight : 92;
    document.documentElement.style.setProperty('--navbar-h', NAVBAR_H + 'px');
    let stepperNaturalTop = 0;
    let stepperH = 0;
    let floating = false;
 
    // Crea un contenedor invisible (placeholder) para evitar el salto brusco del contenido al flotar
    let placeholder = stepper.parentNode.querySelector('.stepper-placeholder');
    if (!placeholder) {
        placeholder = document.createElement('div');
        placeholder.className = 'stepper-placeholder';
        stepper.parentNode.insertBefore(placeholder, stepper.nextSibling);
    }
 
    // Recalcula la posición original del stepper en el documento
    function recalculate() {
        if (!floating) {
            stepperNaturalTop = stepper.getBoundingClientRect().top + window.scrollY;
            stepperH = stepper.offsetHeight;
        }
    }
 
    // Evalúa si corresponde aplicar o quitar la clase de flotación según el scroll del usuario
    function onScroll() {
        const scrollY = window.scrollY || document.documentElement.scrollTop;
        const shouldFloat = scrollY + NAVBAR_H > stepperNaturalTop;
 
        if (shouldFloat && !floating) {
            floating = true;
            placeholder.style.height = stepperH + 'px';
            placeholder.classList.add('visible');
            stepper.classList.add('is-floating');
        } else if (!shouldFloat && floating) {
            floating = false;
            placeholder.classList.remove('visible');
            stepper.classList.remove('is-floating');
        }
    }
 
    requestAnimationFrame(() => {
        recalculate();
        onScroll();
    });
 
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', () => { floating = false; stepper.classList.remove('is-floating'); recalculate(); }, { passive: true });
}
 
// ── COMPONENTE DROPDOWN (SELECT) PERSONALIZADO ──

// Transforma los selects HTML nativos en elementos estilizados y dinámicos
function initializeCustomSelects() {
    document.querySelectorAll('.form-group select, select.form-select').forEach(select => {
        if (select.dataset.customSelectInitialized) return;
        select.dataset.customSelectInitialized = "true";
 
        // Envuelve el select original para controlarlo
        const wrapper = document.createElement('div');
        wrapper.className = 'custom-select-wrapper';
        
        select.parentNode.insertBefore(wrapper, select);
        wrapper.appendChild(select);
        select.style.setProperty('display', 'none', 'important'); // Oculta el select nativo de forma estricta
        select.setAttribute('hidden', 'hidden');

        // Crea el disparador visual del dropdown (el botón que se muestra)
        const trigger = document.createElement('div');
        trigger.className = 'custom-select-trigger';
        
        const triggerText = document.createElement('span');
        triggerText.className = 'custom-select-trigger-text';
        triggerText.textContent = select.options[select.selectedIndex] ? select.options[select.selectedIndex].textContent : 'Seleccionar...';
        trigger.appendChild(triggerText);
 
        const arrow = document.createElement('span');
        arrow.className = 'custom-select-arrow';
        arrow.innerHTML = `<svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="transition: transform 0.2s;"><polyline points="6 9 12 15 18 9"></polyline></svg>`;
        trigger.appendChild(arrow);
        wrapper.appendChild(trigger);
 
        // Crea el contenedor que contendrá las opciones customizadas
        const optionsContainer = document.createElement('div');
        optionsContainer.className = 'custom-select-options';

        // Barra de búsqueda con ícono SVG (CERO EMOJIS)
        const searchContainer = document.createElement('div');
        searchContainer.className = 'custom-select-search-container';
        searchContainer.innerHTML = `
            <div class="custom-select-search-box">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#008C95" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                    <circle cx="11" cy="11" r="8"></circle>
                    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                </svg>
                <input type="text" class="custom-select-search-input" placeholder="Buscar en catálogo..." />
            </div>
        `;
        const searchInput = searchContainer.querySelector('.custom-select-search-input');
        searchContainer.addEventListener('click', (e) => e.stopPropagation());

        const itemsList = document.createElement('div');
        itemsList.className = 'custom-select-items-list';

        optionsContainer.appendChild(searchContainer);
        optionsContainer.appendChild(itemsList);
 
        // Regenera la lista de opciones customizadas basándose en el select nativo
        const rebuildOptions = (filterTerm = '') => {
            select.style.setProperty('display', 'none', 'important');
            select.setAttribute('hidden', 'hidden');

            if (select.disabled) {
                wrapper.classList.add('disabled');
                trigger.classList.add('disabled');
            } else {
                wrapper.classList.remove('disabled');
                trigger.classList.remove('disabled');
            }

            if (select.classList.contains('is-invalid')) {
                wrapper.classList.add('is-invalid');
                trigger.classList.add('is-invalid');
            } else {
                wrapper.classList.remove('is-invalid');
                trigger.classList.remove('is-invalid');
            }

            if (select.classList.contains('is-valid')) {
                wrapper.classList.add('is-valid');
                trigger.classList.add('is-valid');
            } else {
                wrapper.classList.remove('is-valid');
                trigger.classList.remove('is-valid');
            }

            itemsList.innerHTML = '';
            const term = filterTerm.toLowerCase().trim();
            let matchCount = 0;
 
            Array.from(select.options).forEach((opt, idx) => {
                if (!opt.value && select.options.length > 1) return;
                const text = opt.textContent;
                if (term && !text.toLowerCase().includes(term)) return;
                
                matchCount++;
                const optDiv = document.createElement('div');
                optDiv.className = 'custom-select-option' + (opt.selected ? ' selected' : '');
                optDiv.textContent = text;
                optDiv.dataset.value = opt.value;
                optDiv.dataset.index = idx;
 
                // Controla la opción deshabilitada
                if (opt.disabled) {
                    optDiv.classList.add('disabled');
                    optDiv.style.opacity = '0.5';
                    optDiv.style.cursor = 'not-allowed';
                }
 
                // Evento click al elegir una opción customizada
                optDiv.addEventListener('click', (e) => {
                    if (opt.disabled || select.disabled) return;
                    e.stopPropagation();
 
                    // Sincroniza la selección en el select oculto nativo
                    select.selectedIndex = idx;
                    triggerText.textContent = opt.textContent;
 
                    optionsContainer.classList.remove('show');
                    trigger.classList.remove('active');
 
                    // Dispara el evento change nativo para que reaccionen otras funciones JS vinculadas
                    select.dispatchEvent(new Event('change', { bubbles: true }));
                });
 
                itemsList.appendChild(optDiv);
            });
            
            if (matchCount === 0) {
                const empty = document.createElement('div');
                empty.className = 'text-muted p-2 text-center small fst-italic';
                empty.textContent = 'No hay coincidencias';
                itemsList.appendChild(empty);
            }
        };

        searchInput.addEventListener('input', () => rebuildOptions(searchInput.value));
 
        rebuildOptions();
        wrapper.appendChild(optionsContainer);
 
        // Evento para abrir y cerrar el dropdown
        trigger.addEventListener('click', (e) => {
            if (select.disabled) return;
            e.stopPropagation();
            // Cierra cualquier otro custom select que esté abierto
            document.querySelectorAll('.custom-select-options.show').forEach(openContainer => {
                if (openContainer !== optionsContainer) {
                    openContainer.classList.remove('show');
                    if (openContainer.previousSibling) openContainer.previousSibling.classList.remove('active');
                }
            });
 
            rebuildOptions();
            optionsContainer.classList.toggle('show');
            trigger.classList.toggle('active');

            if (optionsContainer.classList.contains('show')) {
                searchInput.value = '';
                setTimeout(() => searchInput.focus(), 50);
            }
        });
 
        // MutationObserver para reconstruir las opciones cuando el select original cambie dinámicamente o se deshabilite
        const observer = new MutationObserver(() => {
            select.style.setProperty('display', 'none', 'important');
            select.setAttribute('hidden', 'hidden');
            rebuildOptions();
            const currentSelOpt = select.options[select.selectedIndex];
            triggerText.textContent = currentSelOpt ? currentSelOpt.textContent : 'Seleccionar...';
        });
        observer.observe(select, { childList: true, subtree: true, attributes: true, attributeFilter: ['disabled', 'style', 'class'] });
 
        // Escucha cambios manuales sobre el select nativo para mantener actualizada la UI personalizada
        select.addEventListener('change', () => {
            rebuildOptions();
            const currentSelOpt = select.options[select.selectedIndex];
            triggerText.textContent = currentSelOpt ? currentSelOpt.textContent : 'Seleccionar...';
            itemsList.querySelectorAll('.custom-select-option').forEach((el, index) => {
                if (index === select.selectedIndex) {
                    el.classList.add('selected');
                } else {
                    el.classList.remove('selected');
                }
            });
        });
    });
}
 
// Cierra todos los selectores personalizados y dropdowns de acciones cuando el usuario hace click o scroll fuera de ellos
function closeAllOpenDropdowns(e) {
    if (e && e.type === 'scroll') {
        const target = e.target;
        if (target && target.nodeType === 1) {
            if (
                target.classList.contains('custom-select-items-list') ||
                target.classList.contains('custom-select-options') ||
                target.classList.contains('cavex-select-options-list') ||
                target.classList.contains('cavex-select-dropdown') ||
                target.classList.contains('dropdown-menu') ||
                (typeof target.closest === 'function' && (
                    target.closest('.custom-select-options') ||
                    target.closest('.cavex-select-dropdown') ||
                    target.closest('.dropdown-menu')
                ))
            ) {
                return; // Ignorar evento scroll interno para permitir desplazamiento del desplegable
            }
        }
    }

    if (e && e.type === 'click') {
        const clickedWrapper = e.target.closest('.custom-select-wrapper, .cavex-select-control');

        document.querySelectorAll('.custom-select-options.show, .cavex-select-dropdown.is-open').forEach(container => {
            if (!clickedWrapper || !clickedWrapper.contains(container)) {
                container.classList.remove('show', 'is-open');

                if (container.previousSibling && container.previousSibling.classList) {
                    container.previousSibling.classList.remove('active', 'is-open');
                }
            }
        });

        return;
    }

    document.querySelectorAll('.custom-select-options.show').forEach(container => {
        container.classList.remove('show');

        if (container.previousSibling && container.previousSibling.classList) {
            container.previousSibling.classList.remove('active');
        }
    });

    document.querySelectorAll('.dropdown-menu.show').forEach(menu => {
        menu.classList.remove('show');

        const toggleBtn = menu.closest('.dropdown')?.querySelector('[data-bs-toggle="dropdown"].show');

        if (toggleBtn) {
            toggleBtn.classList.remove('show');
            toggleBtn.setAttribute('aria-expanded', 'false');
        }
    });
}

document.addEventListener('click', closeAllOpenDropdowns);
window.addEventListener('scroll', closeAllOpenDropdowns, true);

// Asegura que todos los desplegables de acciones dentro de tablas utilicen la estrategia 'fixed' de Popper
// para evitar que se recorten detrás del contenedor scrollable (.table-responsive / overflow)
document.addEventListener('pointerdown', (e) => {
    const trigger = e.target.closest('[data-bs-toggle="dropdown"]');
    if (trigger && (trigger.classList.contains('btn-action-trigger') || trigger.closest('.table-responsive, table, .table-cavex-compact'))) {
        if (!trigger.hasAttribute('data-bs-popper-config')) {
            trigger.setAttribute('data-bs-popper-config', '{"strategy":"fixed"}');
        }
    }
}, { capture: true });

// Exporta la función globalmente para inicializar selects que carguen dinámicamente
window.initializeCustomSelects = initializeCustomSelects;

// Sanitiza el valor de un elemento de entrada usando la función provista, preservando la posición del cursor
function sanitizeInputElement(el, fn) {
    if (!el) return;
    const originalVal = el.value;
    const cleanedVal = fn(originalVal);
    if (originalVal !== cleanedVal) {
        const selectionStart = el.selectionStart;
        const selectionEnd = el.selectionEnd;
        el.value = cleanedVal;
        try {
            el.setSelectionRange(selectionStart, selectionEnd);
        } catch (err) {}
    }
}
window.sanitizeInputElement = sanitizeInputElement;

// Registra manejadores de eventos (input, paste, blur) para sanitizar automáticamente un elemento de entrada
function registerSanitizer(el, fn) {
    if (!el) return;
    const handler = () => sanitizeInputElement(el, fn);
    el.addEventListener('input', handler);
    el.addEventListener('paste', () => setTimeout(handler, 0));
    el.addEventListener('blur', () => {
        el.value = el.value.trim();
        handler();
    });
}
window.registerSanitizer = registerSanitizer;

// Escapa caracteres especiales de HTML para prevenir inyecciones de código (XSS)
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
window.escapeHtml = escapeHtml;

// Decodifica cadenas con problemas de mojibake (caracteres extraños por codificación incorrecta UTF-8)
function decodeUtf8Mojibake(str) {
    if (!str) return '';
    try {
        return decodeURIComponent(escape(str));
    } catch (e) {
        return str;
    }
}
window.decodeUtf8Mojibake = decodeUtf8Mojibake;

// Convierte un texto a formato de título (Capitalización Primera Letra), conservando CURP/RFC originales
function toTitleCase(str) {
    if (!str || str === '—') return '—';
    const decoded = decodeUtf8Mojibake(str).trim();
    if (!decoded) return '—';
    
    // Si coincide con patrón de CURP o RFC o es completamente numérico, mantener en mayúsculas u original
    if (/^[A-Z]{4}\d{6}[A-Z\d]{8}$/i.test(decoded)) return decoded.toUpperCase();
    if (/^[A-Z]{3,4}\d{6}[A-Z\d]{3}$/i.test(decoded)) return decoded.toUpperCase();
    if (/^\d+$/.test(decoded)) return decoded;
    
    return decoded
        .toLowerCase()
        .split(/\s+/)
        .map(word => {
            if (!word) return '';
            return word.charAt(0).toUpperCase() + word.slice(1);
        })
        .join(' ');
}
window.toTitleCase = toTitleCase;

// Formatea un número agregándole comas como separadores de miles
function formatNumberWithComas(val) {
    if (val === null || val === undefined) return '';
    let clean = val.toString().replace(/,/g, '');
    let parts = clean.split('.');
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join('.');
}
window.formatNumberWithComas = formatNumberWithComas;

/**
 * Configura los eventos de clic de pestañas de filtro de estado (Todos, Activo, Inactivo)
 * @param {string} containerId - ID del contenedor de pestañas
 * @param {function} onFilterChange - Callback llamado con el valor del filtro ('todos', 'activo', 'inactivo')
 */
function setupStatusTabs(containerId, onFilterChange) {
    const container = document.getElementById(containerId);
    if (!container) return;
    const buttons = container.querySelectorAll('[data-status-filter]');
    buttons.forEach(btn => {
        btn.addEventListener('click', () => {
            buttons.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            const filterValue = btn.getAttribute('data-status-filter');
            if (typeof onFilterChange === 'function') {
                onFilterChange(filterValue);
            }
        });
    });
}
window.setupStatusTabs = setupStatusTabs;

/**
 * Carga dinámicamente opciones en un select desde un endpoint URL
 * @param {string} selectId - ID del elemento select
 * @param {string} url - Endpoint para obtener los datos JSON
 * @param {string} valueField - Nombre de la propiedad del id (default: 'id')
 * @param {string} textField - Nombre de la propiedad del texto (default: 'strValor')
 */
async function populateSelectOptions(selectId, url, valueField = 'id', textField = 'strValor') {
    const sel = document.getElementById(selectId);
    if (!sel) return;
    try {
        const response = await fetch(url);
        const res = await response.json();
        if (res.success && res.data) {
            sel.innerHTML = "";
            res.data.forEach(item => {
                const val = item[valueField] ?? item.id ?? item.Id;
                const txt = item[textField] ?? item.strValor ?? item.StrValor ?? "";
                sel.add(new Option(txt, val));
            });
        }
    } catch (err) {
        console.error("Error al cargar opciones select:", selectId, err);
    }
}
window.populateSelectOptions = populateSelectOptions;

// ── PREVENCIÓN GLOBAL DE PÉRDIDA DE DATOS EN FORMULARIOS ──


// Helper comun para dropdowns de vehiculos activos.
// Consume el endpoint nuevo basado en VehiculoListadoDto y pagina en bloques de 10
// para respetar la regla del backend sin regresar a los servicios anteriores.
async function obtenerVehiculosActivosDropdown(options = {}) {
    const pageSize = Math.min(Math.max(Number(options.pageSize) || 10, 1), 10);
    const items = [];
    let pageIndex = 1;
    let totalCount = null;

    while (totalCount === null || items.length < totalCount) {
        const params = new URLSearchParams({
            pageIndex: pageIndex.toString(),
            pageSize: pageSize.toString(),
            idVehCatStatus: "1"
        });

        const response = await fetch(`/Vehiculos/GetVehiculosDropdown?${params}`);
        const result = await response.json();

        if (!result.success) {
            return {
                success: false,
                message: result.message || "No fue posible cargar el catalogo de vehiculos.",
                data: { items }
            };
        }

        const data = result.data || {};
        const pageItems = Array.isArray(data.items) ? data.items : [];
        items.push(...pageItems);
        totalCount = Number(data.totalCount ?? items.length);

        if (pageItems.length === 0) break;
        pageIndex += 1;
    }

    return {
        success: true,
        data: {
            pageIndex: 1,
            pageSize,
            totalCount: totalCount ?? items.length,
            items
        }
    };
}
window.obtenerVehiculosActivosDropdown = obtenerVehiculosActivosDropdown;
window.globalFormIsDirty = false;

document.addEventListener('DOMContentLoaded', () => {
    // Escuchar cambios e inputs en todos los formularios
    document.addEventListener('input', (event) => {
        if (event.target.closest('form')) {
            window.globalFormIsDirty = true;
        }
    });

    document.addEventListener('change', (event) => {
        if (event.target.closest('form')) {
            window.globalFormIsDirty = true;
        }
    });

    // Resetear la bandera cuando cualquier formulario sea enviado
    document.addEventListener('submit', (event) => {
        
window.globalFormIsDirty = false;
    });

    // Interceptar clic en enlaces "Cancelar", "Volver" o botones con clase cancel-trigger/btn-outline-cavex
    document.addEventListener('click', (event) => {
        const link = event.target.closest('a');
        if (!link) return;

        const text = (link.textContent || '').toLowerCase();
        const isCancel = text.includes('cancelar') || text.includes('volver') || link.classList.contains('btn-cancelar');

        if (isCancel && window.globalFormIsDirty) {
            event.preventDefault();
            const targetUrl = link.href;
            if (typeof Swal !== 'undefined') {
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
                        
window.globalFormIsDirty = false;
                        window.location.href = targetUrl;
                    }
                });
            } else if (confirm("Tienes cambios sin guardar. ¿Estás seguro de que deseas salir? Los datos ingresados se borrarán.")) {
                
window.globalFormIsDirty = false;
                window.location.href = targetUrl;
            }
        }
    });

    // Alerta nativa antes de recargar (F5/Ctrl+R) o cerrar la pestaña si hay datos modificados
    window.addEventListener('beforeunload', (event) => {
        if (window.globalFormIsDirty) {
            event.preventDefault();
            event.returnValue = "Tienes cambios sin guardar. Si recargas o sales de la página, los datos se borrarán.";
            return event.returnValue;
        }
    });
});

