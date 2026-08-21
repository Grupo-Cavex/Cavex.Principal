let marcas = [];
let editingId = null;
let currentPage = 1;
let pageSize = 10;
let searchQuery = "";

document.addEventListener("DOMContentLoaded", async () => {
    wireFormInputs();
    await loadMarcasFromServer();
    resetForm();
});

async function loadMarcasFromServer() {
    try {
        const response = await fetch("/Marcas/MarcasLlantas/GetMarcas", {
            method: "GET",
            headers: { "Accept": "application/json" }
        });

        const result = await response.json();

        if (!result.success) {
            showError(result.message || "No fue posible cargar las marcas.");
            return;
        }

        marcas = (result.data || []).map(item => ({
            id: item.id,
            nombre: item.strValor || item.StrValor || "",
            descripcion: item.strDescripcion || item.StrDescripcion || ""
        }));

        renderMarcas();
    } catch (error) {
        console.error(error);
        showError("Ocurrio un error al cargar las marcas.");
    }
}

function wireFormInputs() {
    const nombreInput = document.getElementById("strNombreMarca");
    const descInput = document.getElementById("strDescripcionMarca");

    if (nombreInput) {
        nombreInput.addEventListener("input", () => {
            const originalVal = nombreInput.value;
            const cleanedVal = typeof sanitizeLettersOnly === "function"
                ? sanitizeLettersOnly(originalVal)
                : originalVal.replace(/[^a-zA-Z0-9#.\-\s]/g, "");

            if (originalVal !== cleanedVal) {
                const start = nombreInput.selectionStart;
                const end = nombreInput.selectionEnd;
                nombreInput.value = cleanedVal;
                try {
                    nombreInput.setSelectionRange(start, end);
                } catch (err) { }
            }

            nombreInput.classList.remove("is-invalid", "is-valid");
        });

        nombreInput.addEventListener("blur", () => {
            nombreInput.value = nombreInput.value.trim();
        });
    }

    if (descInput) {
        descInput.addEventListener("input", () => {
            const originalVal = descInput.value;
            const cleanedVal = typeof sanitizeGeneralText === "function"
                ? sanitizeGeneralText(originalVal)
                : originalVal.replace(/[^a-zA-Z0-9#.,_()\/\-\s]/g, "");

            if (originalVal !== cleanedVal) {
                const start = descInput.selectionStart;
                const end = descInput.selectionEnd;
                descInput.value = cleanedVal;
                try {
                    descInput.setSelectionRange(start, end);
                } catch (err) { }
            }

            descInput.classList.remove("is-invalid", "is-valid");
        });

        descInput.addEventListener("blur", () => {
            descInput.value = descInput.value.trim();
        });
    }
}

function renderMarcas() {
    const tbody = document.getElementById("marcasTableBody");
    if (!tbody) return;

    tbody.innerHTML = "";

    const filtered = marcas.filter(m => {
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            return m.nombre.toLowerCase().includes(query)
                || (m.descripcion || "").toLowerCase().includes(query);
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
                        <p class="m-0 font-weight-700">No se encontraron marcas</p>
                        <small>Prueba ajustando la busqueda</small>
                    </div>
                </td>
            </tr>`;
    } else {
        pagedList.forEach(m => {
            const tr = document.createElement("tr");
            const descText = m.descripcion || "Sin descripcion";
            const truncatedDesc = descText.length > 60 ? `${descText.substring(0, 60)}...` : descText;

            tr.innerHTML = `
                <td>
                    <div class="cotizacion-main-text">${escapeHtml(m.nombre)}</div>
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
                                <button class="dropdown-item d-flex align-items-center" type="button" onclick="editMarca(${m.id})">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 text-primary"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    Editar
                                </button>
                            </li>
                            <li>
                                <button class="dropdown-item d-flex align-items-center text-danger" type="button" onclick="eliminarMarca(${m.id})">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 text-danger"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                    Eliminar
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
    if (countPill) countPill.textContent = `${totalRecords} marcas`;

    const extraPill = document.querySelector(".table-module .records-pill-soft");
    if (extraPill) extraPill.textContent = `Pagina ${currentPage} de ${totalPages}`;

    renderPagination(totalPages);

    // Inicializar dropdowns de acciones con estrategia 'fixed' para prevenir recortes
    document.querySelectorAll('#marcasTableBody .btn-action-trigger').forEach(el => {
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
    li.innerHTML = `<a class="page-link" href="#" onclick="changePage(event, ${page})">${text}</a>`;
    return li;
}

function changePage(event, page) {
    if (event) event.preventDefault();
    currentPage = page;
    renderMarcas();
}

function handleSearch(query) {
    searchQuery = query || "";
    currentPage = 1;
    renderMarcas();
}

async function handleFormSubmit(e) {
    e.preventDefault();

    const nombreInput = document.getElementById("strNombreMarca");
    const descInput = document.getElementById("strDescripcionMarca");

    if (!nombreInput) return;

    const nombre = nombreInput.value.trim();
    const descripcion = descInput ? descInput.value.trim() : "";

    if (!nombre) {
        nombreInput.classList.add("is-invalid");
        nombreInput.classList.remove("is-valid");
        const feedback = document.getElementById("nombreFeedback");
        if (feedback) feedback.textContent = "El nombre de la marca es obligatorio.";
        nombreInput.focus();
        return;
    }

    const nombreLower = nombre.toLowerCase().trim();
    const existeDuplicado = marcas.some(m => m.nombre.toLowerCase().trim() === nombreLower && m.id !== editingId);

    if (existeDuplicado) {
        nombreInput.classList.add("is-invalid");
        nombreInput.classList.remove("is-valid");
        const feedback = document.getElementById("nombreFeedback");
        if (feedback) feedback.textContent = "El nombre de la marca ya existe.";
        nombreInput.focus();
        return;
    }

    const payload = {
        strValor: nombre,
        strDescripcion: descripcion
    };

    if (editingId !== null) {
        payload.id = editingId;
    }

    const url = editingId === null
        ? "/Marcas/MarcasLlantas/SaveMarca"
        : "/Marcas/MarcasLlantas/UpdateMarca";

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
            showError(result.message || "No fue posible guardar la marca.");
            return;
        }

        Swal.fire({
            icon: "success",
            title: editingId === null ? "Registro exitoso" : "Actualizacion exitosa",
            text: editingId === null ? "Marca agregada exitosamente." : "Marca actualizada exitosamente.",
            confirmButtonColor: "var(--teal-cavex)"
        });

        resetForm();
        await loadMarcasFromServer();
    } catch (error) {
        console.error(error);
        showError("Ocurrio un error al guardar la marca.");
    }
}

function editMarca(id) {
    const marca = marcas.find(m => m.id === id);
    if (!marca) return;

    clearValidation();
    editingId = id;

    document.getElementById("strNombreMarca").value = marca.nombre;

    const descInput = document.getElementById("strDescripcionMarca");
    if (descInput) descInput.value = marca.descripcion || "";

    setText("formTitle", "Editar marca de llanta");
    setText("formSubtitle", "Modifica los detalles de la marca de llanta seleccionada.");
    setText("btnSubmit", "Guardar cambios");

    const btnCancel = document.getElementById("btnCancel");
    if (btnCancel) btnCancel.style.display = "inline-block";

    const formCard = document.querySelector(".filter-card");
    if (formCard) formCard.scrollIntoView({ behavior: "smooth" });

    document.getElementById("strNombreMarca").focus();
}

function resetForm() {
    editingId = null;
    clearValidation();

    const form = document.getElementById("formMarcaLlanta");
    if (form) form.reset();

    setText("formTitle", "Registrar marca de llanta");
    setText("formSubtitle", "Ingresa el nombre y la descripcion para registrar la marca de llanta.");
    setText("btnSubmit", "Guardar marca");

    const btnCancel = document.getElementById("btnCancel");
    if (btnCancel) btnCancel.style.display = "none";
}

function clearValidation() {
    document.getElementById("strNombreMarca")?.classList.remove("is-invalid", "is-valid");
    document.getElementById("strDescripcionMarca")?.classList.remove("is-invalid", "is-valid");
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
