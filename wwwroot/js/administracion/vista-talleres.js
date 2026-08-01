let talleres = [];
let editingId = null;

// Variables de paginación y filtros
let currentPage = 1;
let pageSize = 10;
let searchQuery = '';

// Renderizado inicial de la tabla cargando datos del servidor
document.addEventListener('DOMContentLoaded', () => {
    loadTalleresFromServer();
    
    // Aplicación en tiempo real utilizando las funciones globales de site.js
    const nombreInput = document.getElementById('strNombre');
    const descInput = document.getElementById('strDescripcion');
    
    if (nombreInput) {
        registerSanitizer(nombreInput, sanitizeGeneralText);
        nombreInput.addEventListener('input', () => {
            nombreInput.classList.remove('is-invalid', 'is-valid');
        });
    }
    
    if (descInput) {
        registerSanitizer(descInput, sanitizeGeneralText);
        descInput.addEventListener('input', () => {
            descInput.classList.remove('is-invalid', 'is-valid');
        });
    }
});

function loadTalleresFromServer() {
    const url = `/Talleres/GetTalleres?pagina=${currentPage}&search=${encodeURIComponent(searchQuery)}`;
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error("HTTP error " + response.status);
            }
            return response.json();
        })
        .then(result => {
            console.log("Respuesta de GetTalleres:", result);
            if (result.success) {
                if (result.data && Array.isArray(result.data)) {
                    talleres = result.data.map(item => ({
                        id: item.id ?? item.Id,
                        nombre: item.strValor ?? item.StrValor ?? '',
                        descripcion: item.strDescripcion ?? item.StrDescripcion ?? ''
                    }));
                } else {
                    talleres = [];
                }
                const totalCount = result.totalCount ?? 0;
                renderTalleres(totalCount);
            } else {
                console.error("Error al cargar talleres desde base de datos:", result.message);
                Swal.fire({
                    icon: 'error',
                    title: '¡Ups!',
                    text: 'No se pudieron obtener los datos de los talleres. ¡Intenta de nuevo!',
                    confirmButtonColor: 'var(--teal-cavex)'
                });
                talleres = [];
                renderTalleres(0);
            }
        })
        .catch(err => {
            console.error("Error en petición:", err);
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudieron obtener los datos. ¡Intenta de nuevo!',
                confirmButtonColor: 'var(--teal-cavex)'
            });
            talleres = [];
            renderTalleres(0);
        });
}

// Función para renderizar los talleres
function renderTalleres(totalCount) {
    const tbody = document.getElementById('talleresTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }
    if (currentPage < 1) {
        currentPage = 1;
    }

    if (talleres.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="3" class="text-center py-5">
                    <div class="text-muted">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mb-2 opacity-50"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                        <p class="m-0 font-weight-700">No se encontraron talleres</p>
                        <small>Prueba ajustando los filtros o la búsqueda</small>
                    </div>
                </td>
            </tr>
        `;
    } else {
        talleres.forEach(t => {
            const tr = document.createElement('tr');
            
            const descText = t.descripcion || 'Sin descripción';
            const truncatedDesc = t.descripcion && t.descripcion.length > 50 
                ? t.descripcion.substring(0, 50) + '...' 
                : descText;
            const descTitle = t.descripcion ? `title="${escapeHtml(t.descripcion)}"` : '';

            tr.innerHTML = `
                <td>
                    <div class="cotizacion-main-text">${escapeHtml(t.nombre)}</div>
                </td>
                <td>
                    <div class="description-text" ${descTitle}>${escapeHtml(truncatedDesc)}</div>
                </td>
                <td class="text-end">
                    <div class="dropdown actions-dropdown d-inline-block">
                        <button class="btn-action-trigger btn-sm" type="button" data-bs-toggle="dropdown" data-bs-boundary="viewport" aria-expanded="false">
                            <span>Acciones</span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li>
                                <button class="dropdown-item d-flex align-items-center" type="button" onclick="editTaller(${t.id})">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 text-primary"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    Editar
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item d-flex align-items-center text-danger" type="button" onclick="deleteTaller(${t.id})">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 text-danger"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                    <span>Eliminar</span>
                                </button>
                            </li>
                        </ul>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Actualizar contadores e información en barra inferior
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + talleres.length, totalCount);
    const infoText = totalCount > 0 
        ? `Mostrando ${startIndex + 1}-${endIndex} de ${totalCount} registros`
        : `Mostrando 0-0 de 0 registros`;
    const infoEl = document.getElementById('paginationInfo');
    if (infoEl) infoEl.textContent = infoText;

    // Renderizar botones de paginación
    renderPagination(totalPages);

    // Actualizar contadores en la cabecera de la tabla
    const countPill = document.querySelector('.table-module .records-pill');
    if (countPill) {
        countPill.textContent = `${totalCount} talleres`;
    }

    const extraPill = document.querySelector('.table-module .records-pill-soft');
    if (extraPill) {
        extraPill.textContent = `Página ${currentPage} de ${totalPages}`;
    }

    // Inicializar dropdowns de acciones con estrategia 'fixed' para prevenir recortes
    document.querySelectorAll('#talleresTableBody .btn-action-trigger').forEach(el => {
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

// Función para renderizar los números de página
function renderPagination(totalPages) {
    const paginationList = document.getElementById('paginationList');
    if (!paginationList) return;
    paginationList.innerHTML = '';

    if (totalPages <= 1) return;

    paginationList.appendChild(createPageItem("Anterior", currentPage - 1, currentPage === 1));

    if (totalPages <= 10) {
        for (let i = 1; i <= totalPages; i++) {
            paginationList.appendChild(createPageItem(String(i), i, false, currentPage === i));
        }
    } else {
        // dynamic sliding window for pages 11 to N
        let startPage = 1;
        let endPage = 10;

        if (currentPage > 10) {
            startPage = currentPage - 5;
            endPage = currentPage + 4;
            if (endPage > totalPages) {
                endPage = totalPages;
                startPage = totalPages - 9;
            }
        }

        if (startPage > 1) {
            paginationList.appendChild(createPageItem("1", 1, false, currentPage === 1));
            if (startPage > 2) {
                const li = document.createElement("li");
                li.className = "page-item disabled";
                li.innerHTML = '<span class="page-link">...</span>';
                paginationList.appendChild(li);
            }
        }

        for (let i = startPage; i <= endPage; i++) {
            paginationList.appendChild(createPageItem(String(i), i, false, currentPage === i));
        }

        if (endPage < totalPages) {
            if (endPage < totalPages - 1) {
                const li = document.createElement("li");
                li.className = "page-item disabled";
                li.innerHTML = '<span class="page-link">...</span>';
                paginationList.appendChild(li);
            }
            paginationList.appendChild(createPageItem(String(totalPages), totalPages, false, currentPage === totalPages));
        }
    }

    paginationList.appendChild(createPageItem("Siguiente", currentPage + 1, currentPage === totalPages));
}

function createPageItem(text, page, disabled, active) {
    const li = document.createElement("li");
    li.className = `page-item ${disabled ? "disabled" : ""} ${active ? "active" : ""}`;
    
    let innerContent = text;
    let ariaLabel = "";
    if (text === "Anterior") {
        innerContent = `<span aria-hidden="true">&laquo;</span>`;
        ariaLabel = `aria-label="Anterior"`;
    } else if (text === "Siguiente") {
        innerContent = `<span aria-hidden="true">&raquo;</span>`;
        ariaLabel = `aria-label="Siguiente"`;
    }
    
    li.innerHTML = `<a class="page-link" href="#" onclick="changePage(event, ${page})" ${ariaLabel}>${innerContent}</a>`;
    return li;
}

// Cambiar página
function changePage(event, page) {
    if (event) event.preventDefault();
    if (page < 1) return;
    currentPage = page;
    loadTalleresFromServer();
}

// Manejar búsqueda de texto
function handleSearch(query) {
    searchQuery = query;
    currentPage = 1;
    loadTalleresFromServer();
}

// Limpiar errores de validación
function clearValidation() {
    const nombreInput = document.getElementById('strNombre');
    if (nombreInput) {
        nombreInput.classList.remove('is-invalid', 'is-valid');
    }
    const descInput = document.getElementById('strDescripcion');
    if (descInput) {
        descInput.classList.remove('is-invalid', 'is-valid');
    }
}

// Manejar el submit del formulario (Guardar o Actualizar)
function handleFormSubmit(e) {
    e.preventDefault();
    const nombreInput = document.getElementById('strNombre');
    const descInput = document.getElementById('strDescripcion');

    const nombre = nombreInput.value.trim();
    const descripcion = descInput.value.trim();

    if (!nombre) {
        nombreInput.classList.add('is-invalid');
        nombreInput.classList.remove('is-valid');
        const feedback = document.getElementById('nombreFeedback');
        if (feedback) {
            feedback.textContent = 'El nombre del taller es obligatorio.';
        }
        Swal.fire({ icon: "warning", title: "Campo requerido", text: "El nombre del taller es obligatorio.", confirmButtonColor: "var(--teal-cavex)" });
        nombreInput.focus();
        return;
    }

    if (nombre.length < 3) {
        nombreInput.classList.add('is-invalid');
        nombreInput.classList.remove('is-valid');
        const feedback = document.getElementById('nombreFeedback');
        if (feedback) {
            feedback.textContent = 'El nombre del taller debe tener al menos 3 caracteres.';
        }
        Swal.fire({ icon: "warning", title: "Longitud insuficiente", text: "El nombre del taller debe tener al menos 3 caracteres.", confirmButtonColor: "var(--teal-cavex)" });
        nombreInput.focus();
        return;
    }

    // Validar expresión regular que permite letras, números y caracteres de dirección comunes
    const regexAlphanumeric = /^[a-zA-Z0-9áéíóúÁÉÍÓÚñÑüÜ#.,_()\/\-\s]+$/;
    const regexHasLetter = /[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ]/;
    if (!regexAlphanumeric.test(nombre) || !regexHasLetter.test(nombre)) {
        nombreInput.classList.add('is-invalid');
        nombreInput.classList.remove('is-valid');
        const feedback = document.getElementById('nombreFeedback');
        if (feedback) {
            feedback.textContent = 'El nombre contiene caracteres no válidos o no contiene letras.';
        }
        Swal.fire({ icon: "warning", title: "Caracteres no válidos", text: "El nombre contiene caracteres no válidos o no contiene letras.", confirmButtonColor: "var(--teal-cavex)" });
        nombreInput.focus();
        return;
    }

    // Validar si ya existe otro taller con el mismo nombre (ignora mayúsculas/minúsculas)
    const nombreLower = nombre.toLowerCase().trim();
    const existeDuplicado = talleres.some(t => t.nombre.toLowerCase().trim() === nombreLower && t.id !== editingId);
    
    if (existeDuplicado) {
        nombreInput.classList.add('is-invalid');
        nombreInput.classList.remove('is-valid');
        const feedback = document.getElementById('nombreFeedback');
        if (feedback) {
            feedback.textContent = 'El nombre del taller ya existe.';
        }
        Swal.fire({ icon: "error", title: "Registro duplicado", text: "El nombre del taller ya existe.", confirmButtonColor: "var(--teal-cavex)" });
        nombreInput.focus();
        return;
    }

    // Si todo es válido
    nombreInput.classList.add('is-valid');
    if (descripcion) {
        descInput.classList.add('is-valid');
    }

    const url = editingId === null ? '/Talleres/SaveTaller' : '/Talleres/UpdateTaller';

    const payload = {
        Id: editingId || 0,
        StrValor: nombre,
        StrDescripcion: descripcion
    };

    fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            Swal.fire({
                icon: 'success',
                title: editingId === null ? '¡Registro exitoso!' : '¡Actualización exitosa!',
                text: editingId === null ? 'Taller agregado exitosamente.' : 'Taller actualizado exitosamente.',
                confirmButtonColor: 'var(--teal-cavex)'
            });
            resetForm();
            loadTalleresFromServer();
        } else {
            nombreInput.classList.add('is-invalid');
            nombreInput.classList.remove('is-valid');
            const feedback = document.getElementById('nombreFeedback');
            if (feedback) {
                feedback.textContent = result.message || 'Error al guardar el taller.';
            }

            let errorText = result.message || "";
            const isTechnicalError = errorText.toLowerCase().includes("database") || 
                                     errorText.toLowerCase().includes("db") || 
                                     errorText.toLowerCase().includes("sql") || 
                                     errorText.toLowerCase().includes("conexion") || 
                                     errorText.toLowerCase().includes("connection");

            if (!errorText || isTechnicalError) {
                errorText = editingId === null 
                    ? 'El taller no se pudo agregar exitosamente.' 
                    : 'El taller no se pudo actualizar exitosamente.';
            }

            Swal.fire({
                icon: 'error',
                title: 'No se pudo guardar',
                text: errorText,
                confirmButtonColor: 'var(--teal-cavex)'
            });
        }
    })
    .catch(err => {
        console.error("Error al guardar el taller:", err);
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: editingId === null 
                ? 'El taller no se pudo agregar exitosamente. ¡Intenta de nuevo!' 
                : 'El taller no se pudo actualizar exitosamente. ¡Intenta de nuevo!',
            confirmButtonColor: 'var(--teal-cavex)'
        });
    });
}

// Cargar datos en el formulario para edición
function editTaller(id) {
    const taller = talleres.find(t => t.id === id);
    if (!taller) return;

    clearValidation();
    editingId = id;
    document.getElementById('strNombre').value = taller.nombre;
    document.getElementById('strDescripcion').value = taller.descripcion || '';

    // Cambiar estados del formulario
    document.getElementById('formTitle').textContent = 'Editar taller';
    document.getElementById('formSubtitle').textContent = 'Modifica los detalles del taller seleccionado.';
    document.getElementById('btnSubmit').textContent = 'Guardar cambios';
    document.getElementById('btnCancel').style.display = 'inline-block';

    // Desplazar suavemente al formulario y enfocar el campo principal
    document.querySelector('.filter-card').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('strNombre').focus();
}

// Eliminar taller
function deleteTaller(id) {
    Swal.fire({
        title: '¿Estás seguro?',
        text: "¡No podrás revertir esta acción!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444',
        cancelButtonColor: '#6b7280',
        confirmButtonText: 'Sí, eliminar',
        cancelButtonText: 'Cancelar'
    }).then((result) => {
        if (result.isConfirmed) {
            fetch('/Talleres/DeleteTaller?id=' + id, {
                method: 'POST'
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    Swal.fire({
                        icon: 'success',
                        title: '¡Eliminado!',
                        text: 'El taller ha sido eliminado exitosamente.',
                        confirmButtonColor: 'var(--teal-cavex)'
                    });
                    if (editingId === id) {
                        resetForm();
                    }
                    loadTalleresFromServer();
                } else {
                    let errorText = result.message || 'Inténtalo de nuevo más tarde.';
                    Swal.fire({
                        icon: 'error',
                        title: 'No se pudo eliminar',
                        text: errorText,
                        confirmButtonColor: 'var(--teal-cavex)'
                    });
                }
            })
            .catch(err => {
                console.error("Error al eliminar el taller:", err);
                Swal.fire({
                    icon: 'error',
                    title: 'Error de conexión',
                    text: 'No se pudo procesar la solicitud. ¡Intenta de nuevo!',
                    confirmButtonColor: 'var(--teal-cavex)'
                });
            });
        }
    });
}

// Restablecer el formulario
function resetForm() {
    editingId = null;
    clearValidation();
    document.getElementById('formTaller').reset();

    // Restaurar textos originales
    document.getElementById('formTitle').textContent = 'Registrar taller';
    document.getElementById('formSubtitle').textContent = 'Ingresa el nombre y la descripción del taller.';
    document.getElementById('btnSubmit').textContent = 'Guardar taller';
    document.getElementById('btnCancel').style.display = 'none';
}

// Escape de caracteres HTML para seguridad
function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
