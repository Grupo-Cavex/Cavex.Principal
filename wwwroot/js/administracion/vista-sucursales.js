let sucursales = [];
let statusCatalog = [];
let editingId = null;
let currentPage = 1;
let pageSize = 10;
let statusFilter = "";
let searchQuery = "";

document.addEventListener("DOMContentLoaded", async () => {
    wireFormInputs();
    await loadStatusOptions();
    await loadSucursalesFromServer();
    resetForm();
});

async function loadStatusOptions() {
    const statusField = document.getElementById("intIdStatusSucursal");
    if (statusField) {
        statusField.innerHTML = '<option value="">-- Seleccionar Estado --</option>';
    }

    try {
        const response = await fetch("/Sucursales/GetStatus", {
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
            id: status.id,
            nombre: status.strValor || status.StrValor || `Estatus ${status.id}`,
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

async function loadSucursalesFromServer() {
    try {
        const response = await fetch("/Sucursales/GetSucursales", {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

        const result = await response.json();

        if (!result.success) {
            showError(result.message || "No fue posible cargar las sucursales.");
            return;
        }

        sucursales = (result.data || []).map(item => {
            const idCatStatus = item.idCatStatus ?? item.IdCatStatus;

            return {
                id: item.id,
                nombre: item.strValor || item.StrValor || "",
                descripcion: item.strDescripcion || item.StrDescripcion || "",
                idCatStatus: (idCatStatus === null || idCatStatus === undefined || idCatStatus === 0 || idCatStatus === "0") ? "1" : String(idCatStatus),
                strCatStatus: item.strCatStatus || item.StrCatStatus || ""
            };
        });

        renderStatusTabs();
        renderSucursales();
    } catch (error) {
        console.error(error);
        showError("Ocurrio un error al cargar las sucursales.");
    }
}

function wireFormInputs() {
    const nombreInput = document.getElementById("strNombreSucursal");
    const descInput = document.getElementById("strDescripcionSucursal");
    const statusField = document.getElementById("intIdStatusSucursal");

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

function renderStatusTabs() {
    const tabsContainer = document.getElementById("statusTabs");
    if (!tabsContainer) return;

    tabsContainer.innerHTML = "";
    tabsContainer.appendChild(createStatusTab("", "Todos", sucursales.length));

    statusCatalog.forEach(status => {
        const count = sucursales.filter(s => s.idCatStatus === String(status.id)).length;
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

function renderSucursales() {
    const tbody = document.getElementById("sucursalesTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const filtered = sucursales.filter(s => {
        if (statusFilter && s.idCatStatus !== statusFilter) return false;

        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return s.nombre.toLowerCase().includes(query)
                || (s.descripcion || "").toLowerCase().includes(query)
                || getStatusName(s).toLowerCase().includes(query);
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
                        <p class="m-0 font-weight-700">No se encontraron sucursales</p>
                        <small>Prueba ajustando los filtros o la busqueda</small>
                    </div>
                </td>
            </tr>`;
    } else {
        pagedList.forEach(s => {
            const tr = document.createElement("tr");
            const statusName = getStatusName(s);
            const descText = s.descripcion || "Sin descripcion";
            const truncatedDesc = descText.length > 60 ? `${descText.substring(0, 60)}...` : descText;

            tr.innerHTML = `
                <td>
                    <div class="cotizacion-main-text">${escapeHtml(s.nombre)}</div>
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
                                <button class="dropdown-item d-flex align-items-center" type="button" onclick="editSucursal(${s.id})">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 text-primary"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    Editar
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item d-flex align-items-center ${s.idCatStatus !== '2' ? 'text-danger' : 'text-success'}" type="button" onclick="toggleStatusSucursal(${s.id})">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 ${s.idCatStatus !== '2' ? 'text-danger' : 'text-success'}"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                                    ${s.idCatStatus !== '2' ? 'Dar de baja' : 'Activar'}
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item d-flex align-items-center text-danger" type="button" onclick="deleteSucursal(${s.id})">
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

    setText(
        "paginationInfo",
        totalRecords > 0
            ? `Mostrando ${startIndex + 1}-${endIndex} de ${totalRecords} registros`
            : "Mostrando 0-0 de 0 registros"
    );

    const countPill = document.querySelector(".table-module .records-pill");
    if (countPill) countPill.textContent = `${totalRecords} sucursales`;

    const extraPill = document.querySelector(".table-module .records-pill-soft");
    if (extraPill) extraPill.textContent = `Pagina ${currentPage} de ${totalPages}`;

    renderPagination(totalPages);

    // Inicializar dropdowns de acciones con estrategia 'fixed' para prevenir recortes
    document.querySelectorAll('#sucursalesTableBody .btn-action-trigger').forEach(el => {
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

    for (let i = 1; i <= totalPages; i++) {
        paginationList.appendChild(createPageItem(String(i), i, false, currentPage === i));
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
    currentPage = page;
    renderSucursales();
}

function setStatusFilter(statusId) {
    statusFilter = statusId || "";
    currentPage = 1;
    renderStatusTabs();
    renderSucursales();
}

function handleSearch(query) {
    searchQuery = query || "";
    currentPage = 1;
    renderSucursales();
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const nombreInput = document.getElementById("strNombreSucursal");
    const descInput = document.getElementById("strDescripcionSucursal");
    const statusField = document.getElementById("intIdStatusSucursal");

    if (!nombreInput) return;

    const nombre = nombreInput.value.trim();
    const descripcion = descInput ? descInput.value.trim() : "";
    const statusVal = statusField ? statusField.value : "";

    if (!nombre) {
        nombreInput.classList.add("is-invalid");
        nombreInput.classList.remove("is-valid");
        const feedback = document.getElementById("nombreFeedback");
        if (feedback) feedback.textContent = "El nombre de la sucursal es obligatorio.";
        nombreInput.focus();
        return;
    }

    if (editingId !== null && !statusVal) {
        statusField.classList.add("is-invalid");
        const feedback = document.getElementById("statusFeedback");
        if (feedback) feedback.textContent = "Selecciona un estatus.";
        statusField.focus();
        return;
    }

    const nombreLower = nombre.toLowerCase().trim();
    const existeDuplicado = sucursales.some(s => s.nombre.toLowerCase().trim() === nombreLower && s.id !== editingId);

    if (existeDuplicado) {
        nombreInput.classList.add("is-invalid");
        nombreInput.classList.remove("is-valid");
        const feedback = document.getElementById("nombreFeedback");
        if (feedback) feedback.textContent = "El nombre de la sucursal ya existe.";
        nombreInput.focus();
        return;
    }

    const payload = {
        strValor: nombre,
        strDescripcion: descripcion,
        idCatStatus: editingId === null ? 1 : Number.parseInt(statusVal, 10)
    };

    if (editingId !== null) {
        payload.id = editingId;
    }

    const url = editingId === null
        ? "/Sucursales/SaveSucursal"
        : "/Sucursales/UpdateSucursal";

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
            showError(result.message || "No fue posible guardar la sucursal.");
            return;
        }

        Swal.fire({
            icon: "success",
            title: editingId === null ? "Registro exitoso" : "Actualizacion exitosa",
            text: editingId === null ? "Sucursal agregada exitosamente." : "Sucursal actualizada exitosamente.",
            confirmButtonColor: "var(--teal-cavex)"
        });

        resetForm();
        await loadSucursalesFromServer();
    } catch (error) {
        console.error(error);
        showError("Ocurrio un error al guardar la sucursal.");
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

function editSucursal(id) {
    const sucursal = sucursales.find(s => s.id === id);
    if (!sucursal) return;

    clearValidation();
    editingId = id;

    document.getElementById("strNombreSucursal").value = sucursal.nombre;

    const descInput = document.getElementById("strDescripcionSucursal");
    if (descInput) descInput.value = sucursal.descripcion || "";

    const statusContainer = document.getElementById("statusContainer");
    if (statusContainer) statusContainer.style.display = "block";

    const statusField = document.getElementById("intIdStatusSucursal");
    if (statusField) {
        ensureStatusOption(statusField, sucursal.idCatStatus, getStatusName(sucursal));
        statusField.value = sucursal.idCatStatus || "1";
        statusField.dispatchEvent(new Event("change"));
    }

    setText("formTitle", "Editar sucursal");
    setText("formSubtitle", "Modifica los detalles de la sucursal seleccionada.");
    setText("btnSubmit", "Guardar cambios");

    const btnCancel = document.getElementById("btnCancel");
    if (btnCancel) btnCancel.style.display = "inline-block";

    const formCard = document.querySelector(".filter-card");
    if (formCard) formCard.scrollIntoView({ behavior: "smooth" });

    document.getElementById("strNombreSucursal").focus();
}

function toggleStatusSucursal(id) {
    const sucursal = sucursales.find(s => s.id === id);
    if (!sucursal) return;

    const isActive = sucursal.idCatStatus !== '2';
    const actionText = isActive ? 'dar de baja' : 'activar';
    const confirmButtonText = isActive ? 'Sí, dar de baja' : 'Sí, activar';
    const confirmButtonColor = isActive ? '#ef4444' : '#10b981';

    Swal.fire({
        title: "¿Estás seguro?",
        text: `El estado de la sucursal cambiará a ${isActive ? 'Inactivo' : 'Activo'}.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: confirmButtonColor,
        cancelButtonColor: "#6b7280",
        confirmButtonText: confirmButtonText,
        cancelButtonText: "Cancelar"
    }).then(async result => {
        if (!result.isConfirmed) return;

        const payload = {
            id: sucursal.id,
            strValor: sucursal.nombre,
            strDescripcion: sucursal.descripcion,
            idCatStatus: isActive ? 2 : 1
        };

        try {
            const response = await fetch("/Sucursales/UpdateSucursal", {
                method: "POST",
                headers: {
                    "Accept": "application/json",
                    "Content-Type": "application/json"
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();

            if (!data.success) {
                showError(data.message || `No fue posible ${actionText} la sucursal.`);
                return;
            }

            Swal.fire({
                icon: "success",
                title: isActive ? "Dada de baja" : "Activada",
                text: `La sucursal ha sido ${isActive ? 'dada de baja' : 'activada'} exitosamente.`,
                confirmButtonColor: "var(--teal-cavex)"
            });

            if (editingId === id) resetForm();
            await loadSucursalesFromServer();
        } catch (error) {
            console.error(error);
            showError(`Ocurrio un error al ${actionText} la sucursal.`);
        }
    });
}

function deleteSucursal(id) {
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
            const response = await fetch(`/Sucursales/DeleteSucursal?id=${id}`, {
                method: "POST",
                headers: { "Accept": "application/json" }
            });

            const data = await response.json();

            if (!data.success) {
                showError(data.message || "No fue posible eliminar la sucursal.");
                return;
            }

            Swal.fire({
                icon: "success",
                title: "Eliminado",
                text: "La sucursal ha sido eliminada exitosamente.",
                confirmButtonColor: "var(--teal-cavex)"
            });

            if (editingId === id) resetForm();
            await loadSucursalesFromServer();
        } catch (error) {
            console.error(error);
            showError("Ocurrio un error al eliminar la sucursal.");
        }
    });
}

function resetForm() {
    editingId = null;
    clearValidation();

    const form = document.getElementById("formSucursal");
    if (form) form.reset();

    setText("formTitle", "Registrar sucursal");
    setText("formSubtitle", "Ingresa el nombre y la descripcion para registrar la sucursal.");
    setText("btnSubmit", "Guardar sucursal");

    const btnCancel = document.getElementById("btnCancel");
    if (btnCancel) btnCancel.style.display = "none";

    const statusContainer = document.getElementById("statusContainer");
    if (statusContainer) statusContainer.style.display = "none";
}

function clearValidation() {
    document.getElementById("strNombreSucursal")?.classList.remove("is-invalid", "is-valid");
    document.getElementById("strDescripcionSucursal")?.classList.remove("is-invalid", "is-valid");
    document.getElementById("intIdStatusSucursal")?.classList.remove("is-invalid", "is-valid");
}

function getStatusName(sucursal) {
    if (sucursal.strCatStatus) return sucursal.strCatStatus;

    const status = statusCatalog.find(item => String(item.id) === sucursal.idCatStatus);
    if (status) return status.nombre;

    if (sucursal.idCatStatus === "2") return "Inactivo";
    return "Activo";
}

function getStatusBadgeClass(statusName) {
    const normalized = (statusName || "").toLowerCase();
    return normalized.includes("baja") || normalized.includes("inactivo") || normalized.includes("cancel")
        ? "badge-danger"
        : "badge-active";
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
