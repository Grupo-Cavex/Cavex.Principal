let empleados = [];

// Variables de paginación y filtros
let currentPage = 1;
let pageSize = 10;
let statusFilter = 'todos';
let searchQuery = '';

// Al cargar el DOM se inicia la obtención de la lista del servidor
document.addEventListener('DOMContentLoaded', () => {
    loadEmpleadosFromServer();
});

// Obtiene los datos paginados de empleados desde la base de datos aplicando filtros de estado y búsqueda en tiempo real
function loadEmpleadosFromServer() {
    // Construye la URL de la API con los parámetros de paginación, búsqueda (sanitizada) y filtro de estado
    const url = `/Empleado/GetEmpleados?pagina=${currentPage}&search=${encodeURIComponent(searchQuery)}&status=${encodeURIComponent(statusFilter)}`;
    
    // Realiza la petición asíncrona (AJAX) al controlador utilizando Fetch API
    fetch(url)
        .then(response => {
            // Verifica que la respuesta HTTP del servidor sea correcta (status 200-299)
            if (!response.ok) {
                throw new Error("HTTP error " + response.status);
            }
            // Convierte la respuesta recibida a formato JSON
            return response.json();
        })
        .then(result => {
            // Si la respuesta del servidor indica éxito
            if (result.success) {
                if (result.pageIndex && typeof result.pageIndex === 'number') {
                    currentPage = result.pageIndex;
                }

                const rawItems = Array.isArray(result.data) 
                    ? result.data 
                    : (result.data?.items || result.data?.Items || []);

                if (rawItems.length > 0) {
                    empleados = rawItems.map(item => {
                        try {
                            const nom = item.strNombre || item.StrNombre || '';
                            const pat = item.strApellidoPaterno || item.StrApellidoPaterno || '';
                            const mat = item.strApellidoMaterno || item.StrApellidoMaterno || '';
                            const rawFullName = (nom + ' ' + pat + (mat ? ' ' + mat : '')).trim();
                            const stId = item.idCatStatus ?? item.IdCatStatus ?? 1;

                            let areaStr = 'Sin Condiciones Laborales';
                            if (item.strEmpCondicionesLaborales && typeof item.strEmpCondicionesLaborales === 'string' && item.strEmpCondicionesLaborales.trim() !== '') {
                                areaStr = item.strEmpCondicionesLaborales;
                            } else if (item.StrEmpCondicionesLaborales && typeof item.StrEmpCondicionesLaborales === 'string' && item.StrEmpCondicionesLaborales.trim() !== '') {
                                areaStr = item.StrEmpCondicionesLaborales;
                            } else if (item.empCondicionesLaborales?.strValor) {
                                areaStr = item.empCondicionesLaborales.strValor;
                            } else if (item.EmpCondicionesLaborales?.StrValor) {
                                areaStr = item.EmpCondicionesLaborales.StrValor;
                            }

                            let puestoStr = 'Sin Tipo de Contratación';
                            if (item.strEmpCatTipoContratacion && typeof item.strEmpCatTipoContratacion === 'string' && item.strEmpCatTipoContratacion.trim() !== '') {
                                puestoStr = item.strEmpCatTipoContratacion;
                            } else if (item.StrEmpCatTipoContratacion && typeof item.StrEmpCatTipoContratacion === 'string' && item.StrEmpCatTipoContratacion.trim() !== '') {
                                puestoStr = item.StrEmpCatTipoContratacion;
                            } else if (item.empCatTipoContratacion?.strValor) {
                                puestoStr = item.empCatTipoContratacion.strValor;
                            } else if (item.EmpCatTipoContratacion?.StrValor) {
                                puestoStr = item.EmpCatTipoContratacion.StrValor;
                            }
                            
                            let telStr = '—';
                            const tels = item.empTelefonos || item.EmpTelefonos;
                            if (Array.isArray(tels) && tels.length > 0) {
                                const t = tels[0];
                                telStr = t.bigNumeroCelular || t.BigNumeroCelular || t.bigNumeroFijo || t.BigNumeroFijo || t.strNumeroCelular || t.StrNumeroCelular || t.strNumeroFijo || t.StrNumeroFijo || '—';
                            }

                            const formattedNombre = typeof window.toTitleCase === 'function' ? window.toTitleCase(rawFullName) : rawFullName;

                            return {
                                id: item.id ?? item.Id,
                                nombre: formattedNombre || 'Sin nombre',
                                curp: item.strCurp || item.StrCurp || '—',
                                rfc: item.strRfc || item.StrRfc || '—',
                                area: areaStr,
                                puesto: puestoStr,
                                correo: item.strCorreoElectronico || item.StrCorreoElectronico || '—',
                                telefono: telStr,
                                activo: Number(stId) !== 2
                            };
                        } catch (err) {
                            console.error("Error al mapear empleado:", item, err);
                            return null;
                        }
                    }).filter(Boolean);
                } else {
                    empleados = [];
                }
                
                // Obtiene las referencias a los elementos DOM que muestran las cantidades totales en cada tab
                const elTodos = document.getElementById('countTodos');
                const elActivos = document.getElementById('countActivos');
                const elBaja = document.getElementById('countBaja');
                
                // Actualiza dinámicamente los contadores en las pestañas con los valores provistos por la API
                if (elTodos) elTodos.textContent = result.totalAllCount ?? 0;
                if (elActivos) elActivos.textContent = result.activeCount ?? 0;
                if (elBaja) elBaja.textContent = result.inactiveCount ?? 0;

                // Obtiene la cantidad total de registros coincidentes para calcular la paginación y renderiza
                const totalCount = result.totalCount ?? 0;
                renderEmpleados(totalCount);
            } else {
                empleados = [];
                renderEmpleados(0);
            }
        })
        .catch(err => {
            console.error("Error al cargar empleados desde el servidor:", err);
            empleados = [];
            renderEmpleados(0);
        });
}

// Dibuja las filas de la tabla de empleados en la interfaz de usuario, controlando estados vacíos y badges
function renderEmpleados(totalCount) {
    const tbody = document.getElementById('employeesTableBody');
    if (!tbody) return;
    tbody.innerHTML = '';

    const totalPages = Math.ceil(totalCount / pageSize) || 1;
    
    if (currentPage > totalPages) {
        currentPage = totalPages;
    }
    if (currentPage < 1) {
        currentPage = 1;
    }

    // Renderizar vacío si no hay registros
    if (empleados.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="5" class="text-center py-5">
                    <div class="text-muted">
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" class="me-2 opacity-50"><path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/></svg>
                        <p class="m-0 font-weight-700">No se encontraron empleados</p>
                        <small>Prueba ajustando los filtros o la búsqueda</small>
                    </div>
                </td>
            </tr>
        `;
    } else {
        empleados.forEach(e => {
            const tr = document.createElement('tr');
            
            // Badge de Estado
            const statusBadge = e.activo 
                ? '<span class="badge-active">Activo</span>' 
                : '<span class="badge-danger">Baja</span>';

            // Acción cambiar estado (Dar de baja / Activar)
            const labelAccionBaja = e.activo ? 'Dar de baja' : 'Activar';
            const iconAccionBaja = e.activo 
                ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 text-danger"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>'
                : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 text-success"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>';

            tr.innerHTML = `
                <td>
                    <div class="cotizacion-main-text">${escapeHtml(e.nombre)}</div>
                    <div class="small text-muted font-weight-500">${escapeHtml(e.curp)}</div>
                </td>
                <td>
                    <div class="description-text font-weight-700">${escapeHtml(e.area)}</div>
                </td>
                <td>
                    <div class="description-text">${escapeHtml(e.correo)}</div>
                    <div class="small text-muted font-weight-500">${escapeHtml(e.telefono)}</div>
                </td>
                <td>
                    ${statusBadge}
                </td>
                <td class="text-end">
                    <div class="dropdown actions-dropdown d-inline-block">
                        <button class="btn-action-trigger btn-sm" type="button" data-bs-toggle="dropdown" data-bs-boundary="viewport" aria-expanded="false">
                            <span>Acciones</span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li>
                                <button class="dropdown-item d-flex align-items-center" type="button" onclick="window.location.href='/Empleado/Details/${e.id}'">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 text-info"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                    Ver detalle
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item d-flex align-items-center" type="button" onclick="editEmpleado(${e.id})">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 text-primary"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    Editar
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item d-flex align-items-center text-danger" type="button" onclick="toggleBajaEmpleado(${e.id})">
                                    ${iconAccionBaja}
                                    <span>${labelAccionBaja}</span>
                                </button>
                            </li>
                        </ul>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    // Actualizar contadores en barra inferior
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + empleados.length, totalCount);
    const infoText = totalCount > 0 
        ? `Mostrando ${startIndex + 1}-${endIndex} de ${totalCount} registros`
        : `Mostrando 0-0 de 0 registros`;
    const elInfo = document.getElementById('paginationInfo');
    if (elInfo) elInfo.textContent = infoText;

    // Renderizar botones de paginación
    renderPagination(totalPages);

    // Actualizar contadores en la cabecera de la tabla
    const countPill = document.querySelector('.table-module .records-pill');
    if (countPill) {
        countPill.textContent = `${totalCount} empleados`;
    }

    const extraPill = document.querySelector('.table-module .records-pill-soft');
    if (extraPill) {
        extraPill.textContent = `Página ${currentPage} de ${totalPages}`;
    }
}

// Renderizar la paginación
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
    loadEmpleadosFromServer();
}

// Filtro de estado
function setStatusFilter(status) {
    statusFilter = status;
    
    document.querySelectorAll('.custom-tabs-container .tab-item').forEach(btn => {
        btn.classList.remove('active');
    });

    const elTodos = document.getElementById('tabTodos');
    const elActivos = document.getElementById('tabActivos');
    const elBaja = document.getElementById('tabBaja');

    if (status === 'todos' && elTodos) elTodos.classList.add('active');
    if (status === 'activos' && elActivos) elActivos.classList.add('active');
    if (status === 'baja' && elBaja) elBaja.classList.add('active');

    currentPage = 1;
    loadEmpleadosFromServer();
}

// Búsqueda en tiempo real
function handleSearch(query) {
    searchQuery = query;
    currentPage = 1;
    loadEmpleadosFromServer();
}

// Acción: Editar empleado
function editEmpleado(id) {
    if (!id) return;
    window.location.href = '/Empleado/Create?id=' + id;
}

// Cambia de forma lógica el estado activo/inactivo (alta/baja) de un empleado enviando una petición POST
function toggleBajaEmpleado(id) {
    const emp = empleados.find(e => e.id === id);
    if (!emp) return;

    const actionText = emp.activo ? 'dar de baja' : 'activar';
    const confirmButtonText = emp.activo ? 'Sí, dar de baja' : 'Sí, activar';
    const confirmButtonColor = emp.activo ? '#ef4444' : '#10b981';

    Swal.fire({
        title: `¿Estás seguro de que deseas ${actionText} a este empleado?`,
        text: `El estado del empleado cambiará a ${emp.activo ? 'Baja' : 'Activo'}.`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: confirmButtonColor,
        cancelButtonColor: '#6b7280',
        confirmButtonText: confirmButtonText,
        cancelButtonText: 'Cancelar'
    }).then(async (result) => {
        if (result.isConfirmed) {
            try {
                const response = await fetch(`/Empleado/DeactivateEmpleado?id=${id}`, {
                    method: 'POST',
                    headers: { 'Accept': 'application/json' }
                });

                const data = await response.json();

                if (!data.success) {
                    Swal.fire({
                        icon: 'error',
                        title: '¡Ups!',
                        text: data.message || `No fue posible ${actionText} al empleado.`,
                        confirmButtonColor: 'var(--teal-cavex)'
                    });
                    return;
                }

                Swal.fire({
                    icon: 'success',
                    title: '¡Actualizado!',
                    text: `El empleado ha sido ${emp.activo ? 'dado de baja' : 'activado'} exitosamente.`,
                    confirmButtonColor: 'var(--teal-cavex)'
                });

                await loadEmpleadosFromServer();
            } catch (error) {
                console.error(error);
                Swal.fire({
                    icon: 'error',
                    title: '¡Ups!',
                    text: `Ocurrió un error al ${actionText} al empleado.`,
                    confirmButtonColor: 'var(--teal-cavex)'
                });
            }
        }
    });
}


