"use strict";

let vehiculosCurrentPage = 1;
const vehiculosPageSize = 10;
let vehiculosSearchQuery = "";
let vehiculosStatusFilter = "todos";
let vehiculosPagedData = crearPagedDataVacio();

const vehiculoStatusFilterMap = {
    todos: null,
    activos: 1,
    mantenimiento: 2
};

const vehiculoStatusDisplayMap = {
    1: { text: "Activo", className: "badge-active" },
    2: { text: "Mantenimiento", className: "badge-maintenance" },
    3: { text: "Vendido", className: "badge-muted" }
};

document.addEventListener("DOMContentLoaded", () => {
    inicializarVehiculosIndex();
});

function inicializarVehiculosIndex() {
    if (!document.getElementById("vehiculosTableBody")) return;

    registrarEventosListado();
    cargarVehiculosListado();
}

function registrarEventosListado() {
    document.getElementById("vehiculosTableSearch")?.addEventListener("input", debounce(event => {
        vehiculosSearchQuery = event.target.value.trim();
        vehiculosCurrentPage = 1;
        cargarVehiculosListado();
    }, 350));

    document.querySelectorAll("[data-vehiculo-filter]").forEach(button => {
        button.addEventListener("click", () => {
            vehiculosStatusFilter = button.dataset.vehiculoFilter || "todos";
            vehiculosCurrentPage = 1;

            document.querySelectorAll("[data-vehiculo-filter]").forEach(item => item.classList.remove("active"));
            button.classList.add("active");

            cargarVehiculosListado();
        });
    });
}

async function cargarVehiculosListado() {
    mostrarCargaVehiculos();

    try {
        const params = construirParametrosListado();
        const response = await fetch(`/Vehiculos/GetVehiculoListado?${params.toString()}`);
        const result = await response.json();

        if (!result.success) {
            throw new Error(result.message || "No fue posible obtener el listado de vehiculos.");
        }

        vehiculosPagedData = normalizarPagedData(result.data);
        renderVehiculosTable();
        await cargarContadoresVehiculos();
    } catch (error) {
        console.error("Error al cargar vehiculos:", error);

        vehiculosPagedData = crearPagedDataVacio();
        renderVehiculosTable();

        Swal.fire({
            icon: "error",
            title: "Error",
            text: error.message || "No se pudo conectar con el servidor.",
            confirmButtonColor: "var(--teal-cavex)"
        });
    }
}

function construirParametrosListado(extra = {}) {
    const params = new URLSearchParams({
        pageIndex: String(extra.pageIndex ?? vehiculosCurrentPage),
        pageSize: String(extra.pageSize ?? vehiculosPageSize)
    });

    const search = extra.search ?? vehiculosSearchQuery;
    if (search) params.set("search", search);

    const statusId = extra.idVehCatStatus ?? vehiculoStatusFilterMap[vehiculosStatusFilter];
    if (statusId) params.set("idVehCatStatus", String(statusId));

    return params;
}

function normalizarPagedData(data) {
    return {
        pageIndex: Number(data?.pageIndex || 1),
        pageSize: Number(data?.pageSize || vehiculosPageSize),
        totalCount: Number(data?.totalCount || 0),
        items: Array.isArray(data?.items) ? data.items : []
    };
}

function renderVehiculosTable() {
    const body = document.getElementById("vehiculosTableBody");
    if (!body) return;

    const items = vehiculosPagedData.items;
    const inicio = vehiculosPagedData.totalCount === 0
        ? 0
        : ((vehiculosPagedData.pageIndex - 1) * vehiculosPagedData.pageSize) + 1;

    const fin = Math.min(inicio + items.length - 1, vehiculosPagedData.totalCount);

    body.innerHTML = items.length
        ? items.map(renderVehiculoRow).join("")
        : '<tr><td colspan="8" class="text-center py-5 text-muted">No se encontraron vehiculos.</td></tr>';

    setText("vehiculosPaginationInfo", `Mostrando ${inicio}-${fin} de ${vehiculosPagedData.totalCount} registros`);

    renderVehiculosPagination();
    inicializarDropdownsVehiculos();
}

function renderVehiculoRow(vehiculo) {
    const status = vehiculoStatusDisplayMap[vehiculo.idVehCatStatus] || {
        text: `Estatus ${vehiculo.idVehCatStatus || "-"}`,
        className: "badge-muted"
    };

    return `
        <tr>
            <td>
                <div class="description-text font-weight-700">${escapeHtml(vehiculo.strPlaca)}</div>
                <div class="vehicle-muted-line">${escapeHtml(vehiculo.strNumSerie)}</div>
            </td>
            <td>${escapeHtml(vehiculo.strMarca)}</td>
            <td>
                <div class="description-text">${escapeHtml(vehiculo.strModelo)}</div>
                <div class="vehicle-muted-line">${escapeHtml(vehiculo.strVersion || "Sin version")}</div>
            </td>
            <td>${escapeHtml(vehiculo.intAnio)}</td>
            <td>${escapeHtml(vehiculo.strColor)}</td>
            <td>${Number(vehiculo.decKilometrajeActual || 0).toLocaleString("es-MX")} km</td>
            <td>${renderVehiculoBadge(status)}</td>
            <td class="text-end">
                <div class="dropdown actions-dropdown d-inline-block">
                    <button class="btn-action-trigger btn-sm" type="button" data-bs-toggle="dropdown" data-bs-boundary="viewport" aria-expanded="false">
                        <span>Acciones</span>
                    </button>
                    <ul class="dropdown-menu dropdown-menu-end">
                        <li>
                            <button class="dropdown-item" type="button" onclick="editarVehiculo(${vehiculo.id})">
                                Editar
                            </button>
                        </li>
                        <li>
                            <a class="dropdown-item" href="/Vehiculos/Detalle/${vehiculo.id}">
                                Ver detalles
                            </a>
                        </li>
                        <li>
                            <button class="dropdown-item text-danger" type="button" onclick="eliminarVehiculo(${vehiculo.id})">
                                Eliminar
                            </button>
                        </li>
                    </ul>
                </div>
            </td>
        </tr>`;
}

function renderVehiculosPagination() {
    const lista = document.getElementById("vehiculosPaginationList");
    if (!lista) return;

    const totalPaginas = Math.ceil(vehiculosPagedData.totalCount / vehiculosPagedData.pageSize) || 1;

    vehiculosCurrentPage = Math.min(vehiculosCurrentPage, totalPaginas);
    lista.innerHTML = "";

    if (totalPaginas <= 1) return;

    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
        const item = document.createElement("li");
        item.className = `page-item ${pagina === vehiculosCurrentPage ? "active" : ""}`;
        item.innerHTML = `<a class="page-link" href="#">${pagina}</a>`;

        item.addEventListener("click", event => {
            event.preventDefault();
            vehiculosCurrentPage = pagina;
            cargarVehiculosListado();
        });

        lista.appendChild(item);
    }
}

async function cargarContadoresVehiculos() {
    const [todos, activos, mantenimiento] = await Promise.all([
        obtenerTotalVehiculosPorStatus(null),
        obtenerTotalVehiculosPorStatus(vehiculoStatusFilterMap.activos),
        obtenerTotalVehiculosPorStatus(vehiculoStatusFilterMap.mantenimiento)
    ]);

    setText("vehiculosCountTodos", String(todos));
    setText("vehiculosCountActivos", String(activos));
    setText("vehiculosCountMantenimiento", String(mantenimiento));
}

async function obtenerTotalVehiculosPorStatus(idVehCatStatus) {
    const params = construirParametrosListado({
        pageIndex: 1,
        pageSize: 1,
        idVehCatStatus
    });

    const response = await fetch(`/Vehiculos/GetVehiculoListado?${params.toString()}`);
    const result = await response.json();

    return result.success ? Number(result.data?.totalCount || 0) : 0;
}

function renderVehiculoBadge(status) {
    return `<span class="${status.className}">${escapeHtml(status.text)}</span>`;
}

function editarVehiculo(id) {
    window.location.href = `/Vehiculos/Create?id=${id}`;
}

function eliminarVehiculo(id) {
    const vehiculo = vehiculosPagedData.items.find(item => item.id === id);
    const placa = vehiculo?.strPlaca || `ID ${id}`;

    Swal.fire({
        title: "Confirmar eliminacion",
        text: `El vehiculo ${placa} sera eliminado del sistema.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Si, eliminar",
        cancelButtonText: "Cancelar"
    }).then(result => {
        if (!result.isConfirmed) return;

        Swal.fire({
            title: "Eliminando vehiculo...",
            allowOutsideClick: false,
            didOpen: () => Swal.showLoading()
        });

        fetch(`/Vehiculos/DeleteVehiculo?id=${id}`, { method: "POST" })
            .then(response => response.json())
            .then(result => {
                Swal.close();

                if (!result.success) {
                    throw new Error(result.message || "No se pudo eliminar el vehiculo.");
                }

                Swal.fire({
                    icon: "success",
                    title: "Listo",
                    text: "El vehiculo fue eliminado correctamente.",
                    confirmButtonColor: "var(--teal-cavex)"
                }).then(() => cargarVehiculosListado());
            })
            .catch(error => {
                Swal.close();
                console.error("Error al eliminar vehiculo:", error);

                Swal.fire({
                    icon: "error",
                    title: "Error",
                    text: error.message || "No se pudo conectar con el servidor.",
                    confirmButtonColor: "var(--teal-cavex)"
                });
            });
    });
}

function mostrarCargaVehiculos() {
    const body = document.getElementById("vehiculosTableBody");

    if (body) {
        body.innerHTML = '<tr><td colspan="8" class="text-center py-5 text-muted">Cargando vehiculos...</td></tr>';
    }
}

function crearPagedDataVacio() {
    return {
        pageIndex: 1,
        pageSize: vehiculosPageSize,
        totalCount: 0,
        items: []
    };
}

function inicializarDropdownsVehiculos() {
    document.querySelectorAll("#vehiculosTableBody .btn-action-trigger").forEach(element => {
        new bootstrap.Dropdown(element, {
            popperConfig: defaultConfig => ({
                ...defaultConfig,
                strategy: "fixed"
            })
        });
    });
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function escapeHtml(text) {
    return String(text ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

function debounce(callback, wait) {
    let timeoutId;

    return (...args) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => callback.apply(null, args), wait);
    };
}