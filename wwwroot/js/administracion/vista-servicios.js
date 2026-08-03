"use strict";

let services = [];
let statusCatalog = [];
let editingId = null;
let currentPage = 1;
let pageSize = 10;
let statusFilter = "";
let searchQuery = "";

document.addEventListener("DOMContentLoaded", async () => {
    wireFormInputs();
    await loadStatusOptions();
    await loadServicesFromServer();
    resetForm();
});

async function loadStatusOptions() {
    const statusField = document.getElementById("intIdStatus");
    if (statusField) {
        statusField.innerHTML = '<option value="">-- Seleccionar Estado --</option>';
    }

    try {
        const response = await fetch("/Servicios/GetStatus", {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

        const result = await response.json();

        if (!result.success) {
            showError(result.message || "No fue posible cargar los estatus.");
            renderStatusTabs();
            return;
        }

        statusCatalog = (result.data || []).map(status => ({
            id: status.id ?? status.Id,
            nombre: status.strValor || status.StrValor || `Estatus ${status.id ?? status.Id}`,
            descripcion: status.strDescripcion || status.StrDescripcion || ""
        }));

        if (statusField) {
            statusCatalog.forEach(status => {
                const option = document.createElement("option");
                option.value = String(status.id);
                option.textContent = status.nombre;
                statusField.appendChild(option);
            });
        }

        renderStatusTabs();
    } catch (error) {
        console.error(error);
        showError("Ocurrio un error al cargar los estatus.");
        renderStatusTabs();
    }
}

async function loadServicesFromServer() {
    try {
        const url = `/Servicios/GetServices?pagina=${currentPage}&search=${encodeURIComponent(searchQuery)}&status=${encodeURIComponent(statusFilter)}`;
        const response = await fetch(url, {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

        const result = await response.json();

        if (!result.success) {
            showError(result.message || "No fue posible cargar los servicios.");
            services = [];
            renderStatusTabs();
            renderServices(0);
            return;
        }

        services = (result.data || []).map(item => {
            const idCatStatus = item.idCatStatus ?? item.IdCatStatus;

            return {
                id: item.id ?? item.Id,
                nombre: item.strValor || item.StrValor || "",
                descripcion: item.strDescripcion || item.StrDescripcion || "",
                idCatStatus: (idCatStatus === null || idCatStatus === undefined || idCatStatus === 0 || idCatStatus === "0") ? "1" : String(idCatStatus),
                strCatStatus: item.strCatStatus || item.StrCatStatus || ""
            };
        });

        const totalCount = result.totalCount ?? 0;
        renderStatusTabs(result.statusCounts, result.totalAllCount);
        renderServices(totalCount);
    } catch (error) {
        console.error(error);
        showError("Ocurrio un error al cargar los servicios.");
        services = [];
        renderStatusTabs();
        renderServices(0);
    }
}

function wireFormInputs() {
    const nombreInput = document.getElementById("strNombre");
    const descInput = document.getElementById("strDescripcion");
    const statusField = document.getElementById("intIdStatus");

    if (nombreInput) {
        registerSanitizer(nombreInput, sanitizeLettersOnly);
        nombreInput.addEventListener("input", () => {
            nombreInput.classList.remove("is-invalid", "is-valid");
        });
    }
 
    if (descInput) {
        registerSanitizer(descInput, sanitizeGeneralText);
        descInput.addEventListener("input", () => {
            descInput.classList.remove("is-invalid", "is-valid");
        });
    }

    if (statusField) {
        statusField.addEventListener("change", () => {
            statusField.classList.remove("is-invalid", "is-valid");
        });
    }
}

function renderStatusTabs(statusCounts, totalAllCount) {
    const tabsContainer = document.getElementById("statusTabs");
    if (!tabsContainer) return;

    tabsContainer.innerHTML = "";
    tabsContainer.appendChild(createStatusTab("", "Todos", totalAllCount ?? 0));

    statusCatalog.forEach(status => {
        const count = (statusCounts && statusCounts[String(status.id)]) ?? 0;
        tabsContainer.appendChild(createStatusTab(String(status.id), status.nombre, count));
    });
}

function createStatusTab(value, text, count) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `tab-item ${statusFilter === value ? "active" : ""}`;
    button.onclick = () => setStatusFilter(value);
    button.innerHTML = `${escapeHtml(text)} <span class="tab-count count-all">${count}</span>`;
    return button;
}

function renderServices(totalCount) {
    const tbody = document.getElementById("servicesTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const totalPages = Math.ceil(totalCount / pageSize) || 1;

    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    if (services.length === 0) {
        tbody.innerHTML = `
            <tr>
                <td colspan="4" class="text-center py-5">
                    <div class="text-muted">
                        <p class="m-0 font-weight-700">No se encontraron servicios</p>
                        <small>Prueba ajustando los filtros o la busqueda</small>
                    </div>
                </td>
            </tr>`;
    } else {
        services.forEach(service => {
            const tr = document.createElement("tr");
            const statusName = getStatusName(service);
            const descText = service.descripcion || "Sin descripcion";
            const truncatedDesc = descText.length > 60 ? `${descText.substring(0, 60)}...` : descText;

            tr.innerHTML = `
                <td>
                    <div class="cotizacion-main-text">${escapeHtml(service.nombre)}</div>
                </td>
                <td>
                    <div class="description-text" title="${escapeHtml(descText)}">${escapeHtml(truncatedDesc)}</div>
                </td>
                <td>
                    <span class="${getStatusBadgeClass(statusName)}">${escapeHtml(statusName)}</span>
                </td>
                <td class="text-end">
                    <div class="dropdown actions-dropdown d-inline-block">
                        <button class="btn-action-trigger btn-sm" type="button" data-bs-toggle="dropdown" data-bs-boundary="viewport" aria-expanded="false">
                            <span>Acciones</span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li>
                                <button class="dropdown-item d-flex align-items-center" type="button" onclick="editService(${service.id})">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 text-primary"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    Editar
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item d-flex align-items-center ${service.idCatStatus !== '2' ? 'text-danger' : 'text-success'}" type="button" onclick="toggleStatusService(${service.id})">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 ${service.idCatStatus !== '2' ? 'text-danger' : 'text-success'}"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                                    ${service.idCatStatus !== '2' ? 'Dar de baja' : 'Activar'}
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item d-flex align-items-center text-danger" type="button" onclick="deleteService(${service.id})">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 text-danger"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path><line x1="10" y1="11" x2="10" y2="17"></line><line x1="14" y1="11" x2="14" y2="17"></line></svg>
                                    <span>Eliminar</span>
                                </button>
                            </li>
                        </ul>
                    </div>
                </td>`;

            tbody.appendChild(tr);
        });
    }

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + services.length, totalCount);
    setText(
        "paginationInfo",
        totalCount > 0
            ? `Mostrando ${startIndex + 1}-${endIndex} de ${totalCount} registros`
            : "Mostrando 0-0 de 0 registros"
    );

    const countPill = document.querySelector(".table-module .records-pill");
    if (countPill) countPill.textContent = `${totalCount} servicios`;

    const extraPill = document.querySelector(".table-module .records-pill-soft");
    if (extraPill) extraPill.textContent = `Pagina ${currentPage} de ${totalPages}`;

    renderPagination(totalPages);

    // Inicializar dropdowns de acciones con estrategia 'fixed' para prevenir recortes
    document.querySelectorAll('#servicesTableBody .btn-action-trigger').forEach(el => {
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

function renderPagination(totalPages) {
    const paginationList = document.getElementById("paginationList");
    if (!paginationList) return;

    paginationList.innerHTML = "";
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

function changePage(event, page) {
    if (event) event.preventDefault();
    if (page < 1) return;
    currentPage = page;
    loadServicesFromServer();
}

function setStatusFilter(statusId) {
    statusFilter = statusId || "";
    currentPage = 1;
    loadServicesFromServer();
}

function handleSearch(query) {
    searchQuery = query || "";
    currentPage = 1;
    loadServicesFromServer();
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const nombreInput = document.getElementById("strNombre");
    const descInput = document.getElementById("strDescripcion");
    const statusField = document.getElementById("intIdStatus");

    if (!nombreInput) return;

    const nombre = nombreInput.value.trim();
    const descripcion = descInput ? descInput.value.trim() : "";
    const statusVal = statusField ? statusField.value : "";

    if (!nombre) {
        nombreInput.classList.add("is-invalid");
        nombreInput.classList.remove("is-valid");
        setText("nombreFeedback", "El nombre del servicio es obligatorio.");
        nombreInput.focus();
        return;
    }

    if (editingId !== null && !statusVal) {
        statusField.classList.add("is-invalid");
        setText("statusFeedback", "Selecciona un estatus.");
        statusField.focus();
        return;
    }

    const nombreLower = nombre.toLowerCase().trim();
    const existeDuplicado = services.some(s => s.nombre.toLowerCase().trim() === nombreLower && s.id !== editingId);

    if (existeDuplicado) {
        nombreInput.classList.add("is-invalid");
        nombreInput.classList.remove("is-valid");
        setText("nombreFeedback", "El nombre del servicio ya existe.");
        nombreInput.focus();
        return;
    }

    const payload = {
        id: editingId || 0,
        strValor: nombre,
        strDescripcion: descripcion,
        idCatStatus: editingId === null ? 1 : Number.parseInt(statusVal, 10)
    };

    const url = editingId === null
        ? "/Servicios/SaveService"
        : "/Servicios/UpdateService";

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (!result.success) {
            showError(result.message || "No fue posible guardar el servicio.");
            return;
        }

        Swal.fire({
            icon: "success",
            title: editingId === null ? "Registro exitoso" : "Actualizacion exitosa",
            text: editingId === null ? "Servicio agregado exitosamente." : "Servicio actualizado exitosamente.",
            confirmButtonColor: "var(--teal-cavex)"
        });

        resetForm();
        await loadServicesFromServer();
    } catch (error) {
        console.error(error);
        showError("Ocurrio un error al guardar el servicio.");
    }
}

function getDefaultStatusName(idCatStatus) {
    if (String(idCatStatus) === "2") return "Inactivo";
    return "Activo";
}

function ensureStatusOption(select, idCatStatus, statusName) {
    if (!select || !idCatStatus) return;

    const value = String(idCatStatus);
    const exists = Array.from(select.options).some(option => option.value === value);
    if (exists) return;

    const option = document.createElement("option");
    option.value = value;
    option.textContent = statusName || getDefaultStatusName(value);
    select.appendChild(option);
}

function editService(id) {
    const service = services.find(s => s.id === id);
    if (!service) return;

    clearValidation();
    editingId = id;

    document.getElementById("strNombre").value = service.nombre;

    const descInput = document.getElementById("strDescripcion");
    if (descInput) descInput.value = service.descripcion || "";

    const statusContainer = document.getElementById("statusContainer");
    if (statusContainer) statusContainer.style.display = "block";

    const statusField = document.getElementById("intIdStatus");
    if (statusField) {
        ensureStatusOption(statusField, service.idCatStatus, getStatusName(service));
        statusField.value = service.idCatStatus || "1";
        statusField.dispatchEvent(new Event("change"));
    }

    setText("formTitle", "Editar servicio");
    setText("formSubtitle", "Modifica los detalles del servicio seleccionado.");
    setText("btnSubmit", "Guardar cambios");

    const btnCancel = document.getElementById("btnCancel");
    if (btnCancel) btnCancel.style.display = "inline-block";

    const formCard = document.querySelector(".filter-card");
    if (formCard) formCard.scrollIntoView({ behavior: "smooth" });

    document.getElementById("strNombre").focus();
}

function toggleStatusService(id) {
    const service = services.find(s => s.id === id);
    if (!service) return;

    const isActive = service.idCatStatus !== '2';
    const actionText = isActive ? 'dar de baja' : 'activar';
    const confirmButtonText = isActive ? 'Sí, dar de baja' : 'Sí, activar';
    const confirmButtonColor = isActive ? '#ef4444' : '#10b981';

    Swal.fire({
        title: "¿Estás seguro?",
        text: `El estado del servicio cambiará a ${isActive ? 'Inactivo' : 'Activo'}.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: confirmButtonColor,
        cancelButtonColor: "#6b7280",
        confirmButtonText: confirmButtonText,
        cancelButtonText: "Cancelar"
    }).then(async result => {
        if (!result.isConfirmed) return;

        const payload = {
            id: service.id,
            strValor: service.nombre,
            strDescripcion: service.descripcion,
            idCatStatus: isActive ? 2 : 1
        };

        try {
            const response = await fetch("/Servicios/UpdateService", {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!data.success) {
                showError(data.message || `No fue posible ${actionText} el servicio.`);
                return;
            }

            Swal.fire({
                icon: "success",
                title: isActive ? "Dado de baja" : "Activado",
                text: `El servicio ha sido ${isActive ? 'dado de baja' : 'activado'} exitosamente.`,
                confirmButtonColor: "var(--teal-cavex)"
            });

            if (editingId === id) resetForm();
            await loadServicesFromServer();
        } catch (error) {
            console.error(error);
            showError(`Ocurrio un error al ${actionText} el servicio.`);
        }
    });
}

function deleteService(id) {
    Swal.fire({
        title: "¿Estás seguro?",
        text: "¡No podrás revertir esta acción!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
    }).then(async result => {
        if (!result.isConfirmed) return;

        try {
            const response = await fetch(`/Servicios/DeleteService?id=${id}`, {
                method: "POST",
                headers: { "Accept": "application/json" }
            });

            const data = await response.json();

            if (!data.success) {
                showError(data.message || "No fue posible eliminar el servicio.");
                return;
            }

            Swal.fire({
                icon: "success",
                title: "Eliminado",
                text: "El servicio ha sido eliminado exitosamente.",
                confirmButtonColor: "var(--teal-cavex)"
            });

            if (editingId === id) resetForm();
            await loadServicesFromServer();
        } catch (error) {
            console.error(error);
            showError("Ocurrio un error al eliminar el servicio.");
        }
    });
}

function resetForm() {
    editingId = null;
    clearValidation();

    const form = document.getElementById("formServicio");
    if (form) form.reset();

    const statusField = document.getElementById("intIdStatus");
    if (statusField) statusField.value = "1";

    setText("formTitle", "Registrar servicio");
    setText("formSubtitle", "Ingresa el nombre y la descripcion para registrar el servicio.");
    setText("btnSubmit", "Guardar servicio");

    const btnCancel = document.getElementById("btnCancel");
    if (btnCancel) btnCancel.style.display = "none";

    const statusContainer = document.getElementById("statusContainer");
    if (statusContainer) statusContainer.style.display = "none";
}

function clearValidation() {
    document.getElementById("strNombre")?.classList.remove("is-invalid", "is-valid");
    document.getElementById("strDescripcion")?.classList.remove("is-invalid", "is-valid");
    document.getElementById("intIdStatus")?.classList.remove("is-invalid", "is-valid");
}

function getStatusName(service) {
    if (service.strCatStatus) return service.strCatStatus;

    const status = statusCatalog.find(item => String(item.id) === service.idCatStatus);
    if (status) return status.nombre;

    if (service.idCatStatus === "2") return "Inactivo";
    return "Activo";
}

function getStatusBadgeClass(statusName) {
    const normalized = (statusName || "").toLowerCase();
    return normalized.includes("baja") || normalized.includes("inactivo") || normalized.includes("cancel")
        ? "badge badge-danger px-2.5 py-1.5 rounded-pill"
        : "badge badge-active px-2.5 py-1.5 rounded-pill";
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function showError(message) {
    Swal.fire({
        icon: "error",
        title: "Error",
        text: message,
        confirmButtonColor: "var(--teal-cavex)"
    });
}

function escapeHtml(text) {
    if (text === null || text === undefined) return "";
    return String(text)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}
