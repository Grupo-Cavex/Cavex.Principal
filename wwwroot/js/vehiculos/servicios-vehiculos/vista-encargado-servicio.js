let responsables = [];
let editingId = null;
let currentPage = 1;
let pageSize = 10;
let searchQuery = "";

document.addEventListener("DOMContentLoaded", async () => {
    wireFormInputs();
    await loadResponsablesFromServer();
    resetForm();
});

async function loadResponsablesFromServer() {
    try {
        const response = await fetch("/IngresoTaller/ResponsablesServicio/GetResponsables", {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

        const result = await response.json();

        if (!result.success) {
            showError(result.message || "No fue posible cargar los responsables.");
            return;
        }

        responsables = (result.data || []).map(item => {
            return {
                id: item.id,
                nombre: item.strValor || item.StrValor || "",
                descripcion: item.strDescripcion || item.StrDescripcion || ""
            };
        });

        renderResponsables();
    } catch (error) {
        console.error(error);
        showError("Ocurrió un error al cargar los responsables.");
    }
}

function wireFormInputs() {
    const nombreInput = document.getElementById("strNombre");
    const descInput = document.getElementById("strDescripcion");

    if (nombreInput) {
        if (typeof registerSanitizer === "function" && typeof sanitizeLettersOnly === "function") {
            registerSanitizer(nombreInput, sanitizeLettersOnly);
        }
        nombreInput.addEventListener("input", () => {
            nombreInput.classList.remove("is-invalid", "is-valid");
        });
    }

    if (descInput) {
        if (typeof registerSanitizer === "function" && typeof sanitizeGeneralText === "function") {
            registerSanitizer(descInput, sanitizeGeneralText);
        }
        descInput.addEventListener("input", () => {
            descInput.classList.remove("is-invalid", "is-valid");
        });
    }
}

function renderResponsables() {
    const tbody = document.getElementById("responsablesTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const filtered = responsables.filter(r => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return r.nombre.toLowerCase().includes(query)
                || (r.descripcion || "").toLowerCase().includes(query);
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
                <td colspan="3" class="text-center py-5">
                    <div class="text-muted">
                        <p class="m-0 font-weight-700">No se encontraron responsables</p>
                        <small>Prueba ajustando la búsqueda</small>
                    </div>
                </td>
            </tr>`;
    } else {
        pagedList.forEach(r => {
            const tr = document.createElement("tr");
            const descText = r.descripcion || "Sin descripción";
            const truncatedDesc = descText.length > 80 ? `${descText.substring(0, 80)}...` : descText;

            tr.innerHTML = `
                <td>
                    <div class="cotizacion-main-text">${escapeHtml(r.nombre)}</div>
                </td>
                <td>
                    <div class="description-text" title="${escapeHtml(descText)}">${escapeHtml(truncatedDesc)}</div>
                </td>
                <td class="text-end">
                    <div class="dropdown actions-dropdown d-inline-block">
                        <button class="btn-action-trigger btn-sm" type="button" data-bs-toggle="dropdown" data-bs-boundary="viewport" aria-expanded="false">
                            <span>Acciones</span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li>
                                <button class="dropdown-item d-flex align-items-center" type="button" onclick="editResponsable(${r.id})">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 text-primary"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    Editar
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item d-flex align-items-center text-danger" type="button" onclick="deleteResponsable(${r.id})">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 text-danger"><circle cx="12" cy="12" r="10"/><line x1="8" y1="12" x2="16" y2="12"/></svg>
                                    Eliminar
                                </button>
                            </li>
                        </ul>
                    </div>
                </td>
            `;
            tbody.appendChild(tr);
        });
    }

    const startIndexText = totalRecords > 0 ? startIndex + 1 : 0;
    setText("paginationInfo", `Mostrando ${startIndexText}-${endIndex} de ${totalRecords} registros`);
    
    const countPill = document.querySelector(".table-module .records-pill");
    if (countPill) countPill.textContent = `${totalRecords} encargados`;

    renderPagination(totalPages);

    // Inicializar dropdowns de acciones con estrategia 'fixed' para prevenir recortes
    document.querySelectorAll('#responsablesTableBody .btn-action-trigger').forEach(el => {
        new bootstrap.Dropdown(el, {
            popperConfig: (defaultConfig) => ({ ...defaultConfig, strategy: 'fixed' })
        });
    });
}

function renderPagination(totalPages) {
    const paginationList = document.getElementById("paginationList");
    if (!paginationList) return;

    paginationList.innerHTML = "";
    if (totalPages <= 1) return;

    const prevLi = document.createElement("li");
    prevLi.className = `page-item ${currentPage === 1 ? "disabled" : ""}`;
    prevLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(event, ${currentPage - 1})">&laquo;</a>`;
    paginationList.appendChild(prevLi);

    for (let i = 1; i <= totalPages; i++) {
        const li = document.createElement("li");
        li.className = `page-item ${i === currentPage ? "active" : ""}`;
        li.innerHTML = `<a class="page-link" href="#" onclick="changePage(event, ${i})">${i}</a>`;
        paginationList.appendChild(li);
    }

    const nextLi = document.createElement("li");
    nextLi.className = `page-item ${currentPage === totalPages ? "disabled" : ""}`;
    nextLi.innerHTML = `<a class="page-link" href="#" onclick="changePage(event, ${currentPage + 1})">&raquo;</a>`;
    paginationList.appendChild(nextLi);
}

function changePage(e, page) {
    if (e) e.preventDefault();
    if (page < 1) return;
    currentPage = page;
    renderResponsables();
}

function handleSearch(val) {
    searchQuery = val || "";
    currentPage = 1;
    renderResponsables();
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const nombreInput = document.getElementById("strNombre");
    const descInput = document.getElementById("strDescripcion");

    clearValidation();

    const nombreVal = nombreInput ? nombreInput.value.trim() : "";
    const descVal = descInput ? descInput.value.trim() : "";

    if (!nombreVal) {
        if (nombreInput) {
            nombreInput.classList.add("is-invalid");
            nombreInput.focus();
        }
        return;
    }

    const regexLettersOnly = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s]+$/;
    if (!regexLettersOnly.test(nombreVal)) {
        if (nombreInput) {
            nombreInput.classList.add("is-invalid");
            const feedback = document.getElementById("nombreFeedback");
            if (feedback) feedback.textContent = "El nombre solo debe contener letras y espacios.";
            nombreInput.focus();
        }
        return;
    }

    const nombreLower = nombreVal.toLowerCase();
    const duplicate = responsables.some(r => r.nombre.toLowerCase() === nombreLower && r.id !== editingId);
    if (duplicate) {
        if (nombreInput) {
            nombreInput.classList.add("is-invalid");
            const feedback = document.getElementById("nombreFeedback");
            if (feedback) feedback.textContent = "El nombre del encargado ya existe.";
            nombreInput.focus();
        }
        return;
    }

    if (nombreInput) nombreInput.classList.add("is-valid");

    const isEdit = editingId !== null;
    const url = isEdit ? "/IngresoTaller/ResponsablesServicio/Actualizar" : "/IngresoTaller/ResponsablesServicio/Crear";

    const payload = {
        Id: editingId || 0,
        StrValor: nombreVal,
        StrDescripcion: descVal
    };

    try {
        const response = await fetch(url, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (result.success) {
            Swal.fire({
                icon: "success",
                title: "Éxito",
                text: isEdit ? "Encargado actualizado correctamente." : "Encargado guardado correctamente.",
                confirmButtonColor: "var(--teal-cavex)"
            });

            resetForm();
            await loadResponsablesFromServer();
        } else {
            showError(result.message || "No se pudo guardar la información.");
        }
    } catch (error) {
        console.error(error);
        showError("Ocurrió un error al guardar el encargado de servicio.");
    }
}

function editResponsable(id) {
    const item = responsables.find(r => r.id === id);
    if (!item) return;

    clearValidation();
    editingId = id;

    const nombreInput = document.getElementById("strNombre");
    const descInput = document.getElementById("strDescripcion");
    const formTitle = document.getElementById("formTitle");
    const formSub = document.getElementById("formSubtitle");
    const btnSubmit = document.getElementById("btnSubmit");
    const btnCancel = document.getElementById("btnCancel");

    if (nombreInput) nombreInput.value = item.nombre;
    if (descInput) descInput.value = item.descripcion || "";

    if (formTitle) formTitle.textContent = "Editar encargado de servicio";
    if (formSub) formSub.textContent = "Modifica los campos del encargado de servicio.";
    if (btnSubmit) btnSubmit.textContent = "Guardar cambios";
    if (btnCancel) btnCancel.style.display = "inline-block";

    document.querySelector('.filter-card').scrollIntoView({ behavior: 'smooth' });
    if (nombreInput) nombreInput.focus();
}

function deleteResponsable(id) {
    Swal.fire({
        title: "¿Deseas eliminar este encargado?",
        text: "Esta acción no se puede deshacer.",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
    }).then(async (res) => {
        if (res.isConfirmed) {
            try {
                const response = await fetch(`/IngresoTaller/ResponsablesServicio/Eliminar/${id}`, {
                    method: "POST"
                });
                const result = await response.json();

                if (result.success) {
                    Swal.fire({
                        icon: "success",
                        title: "Eliminado",
                        text: "Encargado de servicio eliminado correctamente.",
                        confirmButtonColor: "var(--teal-cavex)"
                    });
                    if (editingId === id) resetForm();
                    await loadResponsablesFromServer();
                } else {
                    showError(result.message || "No fue posible eliminar el registro.");
                }
            } catch (err) {
                console.error(err);
                showError("Ocurrió un error al intentar eliminar.");
            }
        }
    });
}

function resetForm() {
    editingId = null;
    clearValidation();

    const form = document.getElementById("formResponsableServicio");
    if (form) form.reset();

    const formTitle = document.getElementById("formTitle");
    const formSub = document.getElementById("formSubtitle");
    const btnSubmit = document.getElementById("btnSubmit");
    const btnCancel = document.getElementById("btnCancel");

    if (formTitle) formTitle.textContent = "Registrar encargado de servicio";
    if (formSub) formSub.textContent = "Ingresa el nombre y la descripción para registrar el encargado de servicio.";
    if (btnSubmit) btnSubmit.textContent = "Guardar encargado";
    if (btnCancel) btnCancel.style.display = "none";
}

function clearValidation() {
    const inputs = document.querySelectorAll("#formResponsableServicio .form-control");
    inputs.forEach(input => {
        input.classList.remove("is-invalid", "is-valid");
    });
}

function setText(id, text) {
    const el = document.getElementById(id);
    if (el) el.textContent = text;
}

function showError(msg) {
    Swal.fire({
        icon: "error",
        title: "Error",
        text: msg,
        confirmButtonColor: "var(--teal-cavex)"
    });
}

function escapeHtml(str) {
    if (str === null || str === undefined) return "";
    return String(str)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;");
}
