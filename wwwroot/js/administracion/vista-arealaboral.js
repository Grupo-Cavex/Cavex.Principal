let areas = [];
let editingId = null;

// Variables de paginación y filtros
let currentPage = 1;
let pageSize = 10;
let searchQuery = '';
let activeFilter = 'todos';

// Renderizado inicial de la tabla cargando datos del servidor
document.addEventListener('DOMContentLoaded', () => {
    populateStatusDropdown();
    inicializarFiltros();
    loadAreasFromServer();
    
    // Aplicación en tiempo real utilizando las funciones globales de site.js
    const nombreInput = document.getElementById('strNombre');
    const descInput = document.getElementById('strDescripcion');
    
    if (nombreInput) {
        registerSanitizer(nombreInput, sanitizeLettersOnly);
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

async function populateStatusDropdown() {
    await populateSelectOptions("intIdStatus", "/AreaLaboral/GetStatus");
}

function inicializarFiltros() {
    setupStatusTabs('statusTabs', (filter) => {
        activeFilter = filter;
        currentPage = 1;
        renderAreas();
    });
}

// Obtiene la lista de áreas laborales desde el servidor aplicando paginación y búsqueda
function loadAreasFromServer() {
    const url = `/AreaLaboral/GetAreas?pagina=1&pageSize=10&search=${encodeURIComponent(searchQuery)}`;
    fetch(url)
        .then(response => {
            if (!response.ok) {
                throw new Error("HTTP error " + response.status);
            }
            return response.json();
        })
        .then(result => {
            if (result.success) {
                if (result.data && Array.isArray(result.data)) {
                    areas = result.data.map(item => {
                        const stId = item.idCatStatus ?? item.IdCatStatus ?? 1;
                        return {
                            id: item.id ?? item.Id,
                            nombre: item.strValor || item.StrValor || '',
                            descripcion: item.strDescripcion || item.StrDescripcion || '',
                            idCatStatus: Number(stId),
                            strCatStatus: item.strCatStatus || item.StrCatStatus || (Number(stId) === 2 ? 'Inactivo' : 'Activo')
                        };
                    });
                } else {
                    areas = [];
                }
                renderAreas();
            } else {
                console.error("Error al cargar áreas:", result.message);
                areas = [];
                renderAreas();
            }
        })
        .catch(err => {
            console.error("Error en petición de áreas:", err);
            areas = [];
            renderAreas();
        });
}

// Función para renderizar las áreas filtradas
function renderAreas() {
    const tbody = document.getElementById('areasTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    // Actualizar contadores numéricos en pestañas
    const countAll = areas.length;
    const countActive = areas.filter(a => a.idCatStatus !== 2).length;
    const countInactive = areas.filter(a => a.idCatStatus === 2).length;

    const elTodos = document.getElementById('countTodos');
    const elActivos = document.getElementById('countActivos');
    const elInactivos = document.getElementById('countInactivos');
    if (elTodos) elTodos.textContent = countAll;
    if (elActivos) elActivos.textContent = countActive;
    if (elInactivos) elInactivos.textContent = countInactive;

    // Filtrar localmente por estado y búsqueda
    let filtered = areas.filter(a => {
        if (activeFilter === 'activos' && a.idCatStatus === 2) return false;
        if (activeFilter === 'inactivos' && a.idCatStatus !== 2) return false;
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return a.nombre.toLowerCase().includes(query) || (a.descripcion || '').toLowerCase().includes(query);
        }
        return true;
    });

    const totalRecords = filtered.length;
    const totalPages = Math.ceil(totalRecords / pageSize) || 1;

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalRecords);
    const pagedList = filtered.slice(startIndex, endIndex);

    if (pagedList.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-5">
                    <div class="text-muted">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="mb-2 opacity-50"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                        <p class="m-0 font-weight-700">No se encontraron áreas laborales</p>
                        <small>Prueba ajustando los filtros o la búsqueda</small>
                    </div>
                </td>
            </tr>
        `;
    } else {
        pagedList.forEach(a => {
            const tr = document.createElement('tr');
            
            const descText = a.descripcion || 'Sin descripción';
            const truncatedDesc = descText.length > 60 ? `${descText.substring(0, 60)}...` : descText;
            const isInactive = a.idCatStatus === 2;

            tr.innerHTML = `
                <td>
                    <div class="cotizacion-main-text">${escapeHtml(a.nombre)}</div>
                </td>
                <td>
                    <div class="description-text" title="${escapeHtml(descText)}">${escapeHtml(truncatedDesc)}</div>
                </td>
                <td>
                    ${isInactive
                        ? '<span class="badge badge-danger px-2.5 py-1.5 rounded-pill">Inactivo</span>'
                        : '<span class="badge badge-active px-2.5 py-1.5 rounded-pill">Activo</span>'}
                </td>
                <td class="text-end">
                    <div class="dropdown actions-dropdown d-inline-block">
                        <button class="btn-action-trigger btn-sm" type="button" data-bs-toggle="dropdown" data-bs-boundary="viewport" aria-expanded="false">
                            <span>Acciones</span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li>
                                <button class="dropdown-item d-flex align-items-center" type="button" onclick="editArea(${a.id})">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 text-primary"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    Editar
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item d-flex align-items-center ${isInactive ? 'text-success' : 'text-danger'}" type="button" onclick="toggleStatusArea(${a.id})">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 ${isInactive ? 'text-success' : 'text-danger'}"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                                    ${isInactive ? 'Activar' : 'Dar de baja'}
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item d-flex align-items-center text-danger" type="button" onclick="deleteArea(${a.id})">
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
    const infoText = totalRecords > 0 
        ? `Mostrando ${startIndex + 1}-${endIndex} de ${totalRecords} registros`
        : 'Mostrando 0-0 de 0 registros';
    
    const infoElement = document.getElementById('paginationInfo');
    if (infoElement) infoElement.textContent = infoText;

    const countPill = document.querySelector('.table-module .records-pill');
    if (countPill) countPill.textContent = `${totalRecords} áreas`;

    renderPagination(totalPages);

    // Inicializar dropdowns de bootstrap
    document.querySelectorAll('#areasTableBody .btn-action-trigger').forEach(el => {
        new bootstrap.Dropdown(el, {
            popperConfig: (defaultConfig) => ({ ...defaultConfig, strategy: 'fixed' })
        });
    });
}

// Función para renderizar los números de página
function renderPagination(totalPages) {
    const paginationList = document.getElementById('paginationList');
    if (!paginationList) return;

    paginationList.innerHTML = '';
    if (totalPages <= 1) return;

    // Botón Anterior
    const prevLi = document.createElement('li');
    prevLi.className = `page-item ${currentPage === 1 ? 'disabled' : ''}`;
    prevLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(event, ${currentPage - 1})">&laquo;</a>`;
    paginationList.appendChild(prevLi);

    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement('li');
        li.className = `page-item ${i === currentPage ? 'active' : ''}`;
        li.innerHTML = `<a class="page-link" href="#" onclick="changePage(event, ${i})">${i}</a>`;
        paginationList.appendChild(li);
    }

    // Botón Siguiente
    const nextLi = document.createElement('li');
    nextLi.className = `page-item ${currentPage === totalPages ? 'disabled' : ''}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(event, ${currentPage + 1})">&raquo;</a>`;
    paginationList.appendChild(nextLi);
}

function changePage(event, page) {
    if (event) event.preventDefault();
    if (page < 1) return;
    currentPage = page;
    renderAreas();
}

function handleSearch(query) {
    searchQuery = query || '';
    currentPage = 1;
    renderAreas();
}

function handleFormSubmit(e) {
    e.preventDefault();

    const nombreInput = document.getElementById('strNombre');
    const descInput = document.getElementById('strDescripcion');
    const statusSelect = document.getElementById('intIdStatus');

    clearValidation();

    const nombre = nombreInput.value.trim();
    const descripcion = descInput.value.trim();
    const statusVal = statusSelect && statusSelect.value ? parseInt(statusSelect.value) : 1;

    if (!nombre) {
        nombreInput.classList.add('is-invalid');
        const feedback = document.getElementById('nombreFeedback');
        if (feedback) feedback.textContent = 'El nombre del área es obligatorio.';
        nombreInput.focus();
        return;
    }

    // Validar expresión regular: nada de números, emojis o símbolos raros
    const regexLettersOnly = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
    if (!regexLettersOnly.test(nombre)) {
        nombreInput.classList.add('is-invalid');
        const feedback = document.getElementById('nombreFeedback');
        if (feedback) feedback.textContent = 'El nombre solo debe contener letras y espacios (sin números, símbolos ni emojis).';
        nombreInput.focus();
        return;
    }

    // Validar si ya existe otra área con el mismo nombre (ignora mayúsculas/minúsculas)
    const nombreLower = nombre.toLowerCase().trim();
    const existeDuplicado = areas.some(a => a.nombre.toLowerCase().trim() === nombreLower && a.id !== editingId);
    
    if (existeDuplicado) {
        nombreInput.classList.add('is-invalid');
        const feedback = document.getElementById('nombreFeedback');
        if (feedback) feedback.textContent = 'El nombre del área laboral ya existe.';
        nombreInput.focus();
        return;
    }

    // Si todo es válido, aplicar clases de éxito
    nombreInput.classList.add('is-valid');
    if (descripcion) descInput.classList.add('is-valid');

    const url = editingId === null ? '/AreaLaboral/SaveArea' : '/AreaLaboral/UpdateArea';

    const payload = {
        id: editingId || 0,
        strValor: nombre,
        strDescripcion: descripcion,
        idCatStatus: statusVal
    };

    fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
    })
    .then(response => response.json())
    .then(result => {
        if (result.success) {
            Swal.fire({
                icon: 'success',
                title: editingId === null ? '¡Registro exitoso!' : '¡Actualización exitosa!',
                text: editingId === null ? 'Área laboral agregada exitosamente.' : 'Área laboral actualizada exitosamente.',
                confirmButtonColor: 'var(--teal-cavex)'
            });
            resetForm();
            loadAreasFromServer();
        } else {
            nombreInput.classList.add('is-invalid');
            const feedback = document.getElementById('nombreFeedback');
            if (feedback) feedback.textContent = result.message || 'Error al guardar el área laboral.';

            Swal.fire({
                icon: 'error',
                title: 'No se pudo guardar',
                text: result.message || 'El área laboral no se pudo guardar.',
                confirmButtonColor: 'var(--teal-cavex)'
            });
        }
    })
    .catch(err => {
        console.error("Error al guardar el área:", err);
        Swal.fire({
            icon: 'error',
            title: 'Error de conexión',
            text: 'No se pudo procesar la solicitud. ¡Intenta de nuevo!',
            confirmButtonColor: 'var(--teal-cavex)'
        });
    });
}

// Cargar datos en el formulario para edición
function editArea(id) {
    const area = areas.find(a => a.id === id);
    if (!area) return;

    clearValidation();
    editingId = id;
    document.getElementById('strNombre').value = area.nombre;
    document.getElementById('strDescripcion').value = area.descripcion || '';

    const statusSelect = document.getElementById('intIdStatus');
    const statusContainer = document.getElementById('statusContainer');
    if (statusSelect) statusSelect.value = String(area.idCatStatus);
    if (statusContainer) statusContainer.style.display = 'block';

    document.getElementById('formTitle').textContent = 'Editar área laboral';
    document.getElementById('formSubtitle').textContent = 'Modifica los detalles del área laboral seleccionada.';
    document.getElementById('btnSubmit').textContent = 'Guardar cambios';
    document.getElementById('btnCancel').style.display = 'inline-block';

    // Desplazar suavemente al formulario y enfocar el campo principal
    document.querySelector('.filter-card').scrollIntoView({ behavior: 'smooth' });
    document.getElementById('strNombre').focus();
}

function toggleStatusArea(id) {
    const area = areas.find(a => a.id === id);
    if (!area) return;

    const isActive = area.idCatStatus !== 2;
    const confirmButtonText = isActive ? 'Sí, dar de baja' : 'Sí, activar';
    const confirmButtonColor = isActive ? '#ef4444' : '#10b981';

    Swal.fire({
        title: '¿Estás seguro?',
        text: `El estado del área laboral cambiará a ${isActive ? 'Inactivo' : 'Activo'}.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: confirmButtonColor,
        cancelButtonColor: '#6b7280',
        confirmButtonText: confirmButtonText,
        cancelButtonText: 'Cancelar'
    }).then(async result => {
        if (!result.isConfirmed) return;

        const payload = {
            id: area.id,
            strValor: area.nombre,
            strDescripcion: area.descripcion,
            idCatStatus: isActive ? 2 : 1
        };

        try {
            const response = await fetch('/AreaLaboral/UpdateArea', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            const res = await response.json();
            if (res.success) {
                Swal.fire({
                    icon: 'success',
                    title: '¡Estatus actualizado!',
                    text: `El área laboral fue ${isActive ? 'dada de baja' : 'activada'} exitosamente.`,
                    confirmButtonColor: 'var(--teal-cavex)'
                });
                loadAreasFromServer();
            } else {
                Swal.fire({
                    icon: 'error',
                    title: 'Error',
                    text: res.message || 'No se pudo actualizar el estatus.',
                    confirmButtonColor: 'var(--teal-cavex)'
                });
            }
        } catch (err) {
            console.error('Error al cambiar estatus:', err);
            Swal.fire({
                icon: 'error',
                title: 'Error de conexión',
                text: 'No se pudo procesar la solicitud.',
                confirmButtonColor: 'var(--teal-cavex)'
            });
        }
    });
}

// Eliminar área
function deleteArea(id) {
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
            fetch('/AreaLaboral/DeleteArea?id=' + id, {
                method: 'POST'
            })
            .then(response => response.json())
            .then(result => {
                if (result.success) {
                    Swal.fire({
                        icon: 'success',
                        title: '¡Eliminado!',
                        text: 'El área laboral ha sido eliminada exitosamente.',
                        confirmButtonColor: 'var(--teal-cavex)'
                    });
                    if (editingId === id) {
                        resetForm();
                    }
                    loadAreasFromServer();
                } else {
                    let errorText = result.message || 'Inténtalo de nuevo más tarde.';
                    if (errorText.toLowerCase().includes("empleado")) {
                        errorText = 'No se puede eliminar el área laboral porque está asociada a uno o más empleados activos.';
                    }
                    Swal.fire({
                        icon: 'error',
                        title: 'No se pudo eliminar',
                        text: errorText,
                        confirmButtonColor: 'var(--teal-cavex)'
                    });
                }
            })
            .catch(err => {
                console.error("Error al eliminar el área:", err);
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
    document.getElementById('formArea').reset();

    const statusSelect = document.getElementById('intIdStatus');
    const statusContainer = document.getElementById('statusContainer');
    if (statusSelect) statusSelect.value = '1';
    if (statusContainer) statusContainer.style.display = 'none';

    document.getElementById('formTitle').textContent = 'Registrar área laboral';
    document.getElementById('formSubtitle').textContent = 'Ingresa el nombre y la descripción para registrar el área laboral.';
    document.getElementById('btnSubmit').textContent = 'Guardar área laboral';
    document.getElementById('btnCancel').style.display = 'none';
}

function clearValidation() {
    const inputs = document.querySelectorAll('#formArea .form-control, #formArea .form-select');
    inputs.forEach(input => {
        input.classList.remove('is-invalid', 'is-valid');
    });
}

function escapeHtml(text) {
    if (text === null || text === undefined) return '';
    return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}
