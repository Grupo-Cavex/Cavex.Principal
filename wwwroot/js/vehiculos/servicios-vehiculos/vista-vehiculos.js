let vehiculoCatalogos = {
    idVehCatMarcaVehiculo: [],
    idVehCatColor: [],
    idVehCatTipoVehiculo: [],
    idVehCatCapacidad: [],
    idVehCatTipoCombustible: [],
    idVehCatStatus: [],
    idVehCatTransmision: []
};

let vehiculosDemo = [];
let vehiculosCurrentPage = 1;
const vehiculosPageSize = 10;
let vehiculosSearchQuery = "";
let vehiculosStatusFilter = "todos";

document.addEventListener("DOMContentLoaded", () => {
    inicializarVehiculosIndex();
});

function cargarCatalogos() {
    return fetch('/Vehiculos/GetVehiculoCatalogos')
        .then(res => res.json())
        .then(result => {
            if (result.success && result.data) {
                Object.assign(vehiculoCatalogos, result.data);
            }
        });
}

function inicializarVehiculosIndex() {
    if (!document.getElementById("vehiculosTableBody")) return;
    
    sessionStorage.removeItem("vehiculosDemo_cache");
    sessionStorage.removeItem("vehiculoCatalogos_cache");

    document.getElementById("vehiculosTableSearch")?.addEventListener("input", event => {
        vehiculosSearchQuery = event.target.value.trim().toLowerCase();
        vehiculosCurrentPage = 1;
        renderVehiculosTable();
    });
    
    document.querySelectorAll("[data-vehiculo-filter]").forEach(button => button.addEventListener("click", () => {
        vehiculosStatusFilter = button.dataset.vehiculoFilter || "todos";
        vehiculosCurrentPage = 1;
        document.querySelectorAll("[data-vehiculo-filter]").forEach(item => item.classList.remove("active"));
        button.classList.add("active");
        renderVehiculosTable();
    }));

    Swal.fire({
        title: 'Cargando vehículos...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    cargarCatalogos().then(() => {
        fetch('/Vehiculos/GetVehiculos')
            .then(res => res.json())
            .then(result => {
                Swal.close();
                if (result.success && result.data) {
                    vehiculosDemo = result.data.map(v => {
                        const strMarca = v.strVehCatMarcaVehiculo || v.StrVehCatMarcaVehiculo || vehiculoCatalogos.idVehCatMarcaVehiculo.find(item => (item.id ?? item.Id) === (v.idVehCatMarcaVehiculo ?? v.IdVehCatMarcaVehiculo))?.strValor || "Desconocida";
                        const strColor = v.strVehCatColor || v.StrVehCatColor || vehiculoCatalogos.idVehCatColor.find(item => (item.id ?? item.Id) === (v.idVehCatColor ?? v.IdVehCatColor))?.strValor || "Desconocido";
                        const strTipoVehiculo = v.strVehCatTipoVehiculo || v.StrVehCatTipoVehiculo || vehiculoCatalogos.idVehCatTipoVehiculo.find(item => (item.id ?? item.Id) === (v.idVehCatTipoVehiculo ?? v.IdVehCatTipoVehiculo))?.strValor || "Desconocido";
                        const strCapacidad = v.strVehCatCapacidad || v.StrVehCatCapacidad || vehiculoCatalogos.idVehCatCapacidad.find(item => (item.id ?? item.Id) === (v.idVehCatCapacidad ?? v.IdVehCatCapacidad))?.strValor || "";
                        const strTipoCombustible = v.strVehCatTipoCombustible || v.StrVehCatTipoCombustible || vehiculoCatalogos.idVehCatTipoCombustible.find(item => (item.id ?? item.Id) === (v.idVehCatTipoCombustible ?? v.IdVehCatTipoCombustible))?.strValor || "";
                        const strStatus = v.strVehCatStatus || v.StrVehCatStatus || vehiculoCatalogos.idVehCatStatus.find(item => (item.id ?? item.Id) === (v.idVehCatStatus ?? v.IdVehCatStatus))?.strValor || "Activo";

                        return {
                            id: v.id,
                            strNumSerie: v.strNumSerie,
                            idVehCatMarcaVehiculo: v.idVehCatMarcaVehiculo,
                            strMarca: strMarca,
                            strModelo: v.strModelo,
                            intAnio: v.intAnio,
                            strVersion: v.strVersion,
                            idVehCatColor: v.idVehCatColor,
                            strColor: strColor,
                            strPlaca: v.strPlaca,
                            intNumMotor: v.strNumMotor || v.intNumMotor,
                            idVehCatTipoVehiculo: v.idVehCatTipoVehiculo,
                            strTipoVehiculo: strTipoVehiculo,
                            idVehCatCapacidad: v.idVehCatCapacidad,
                            strCapacidad: strCapacidad,
                            idVehCatTipoCombustible: v.idVehCatTipoCombustible,
                            strTipoCombustible: strTipoCombustible,
                            decKilometrajeActual: v.decKilometrajeActual,
                            idVehCatStatus: v.idVehCatStatus,
                            strStatus: strStatus,
                            strUrlFoto: v.strUrlFoto,
                            dteFechaRegistro: v.dteFechaRegistro,
                            strObservaciones: v.strObservaciones
                        };
                    });
                } else {
                    vehiculosDemo = [];
                }
                renderVehiculosTable();
            })
            .catch(err => {
                Swal.close();
                console.error("Error al cargar vehículos:", err);
                vehiculosDemo = [];
                renderVehiculosTable();
            });
    }).catch(err => {
        Swal.close();
        console.error("Error al cargar catálogos:", err);
        renderVehiculosTable();
    });
}

function renderVehiculosTable() {
    const body = document.getElementById("vehiculosTableBody");
    if (!body) return;
    const filtrados = vehiculosDemo.filter(v => {
        if (vehiculosStatusFilter === "activos" && v.strStatus !== "Activo") return false;
        if (vehiculosStatusFilter === "mantenimiento" && v.strStatus !== "En mantenimiento") return false;
        const texto = [v.strPlaca, v.strMarca, v.strModelo, v.strColor, v.strStatus].join(" ").toLowerCase();
        return !vehiculosSearchQuery || texto.includes(vehiculosSearchQuery);
    });
    const totalPaginas = Math.ceil(filtrados.length / vehiculosPageSize) || 1;
    vehiculosCurrentPage = Math.min(vehiculosCurrentPage, totalPaginas);
    const inicio = (vehiculosCurrentPage - 1) * vehiculosPageSize;
    const pagina = filtrados.slice(inicio, inicio + vehiculosPageSize);

    body.innerHTML = pagina.length ? pagina.map(v => `
        <tr>
            <td><div class="description-text font-weight-700"><span class="badge bg-light text-dark border">${escapeHtml(v.strPlaca)}</span></div><div class="vehicle-muted-line">${escapeHtml(v.strNumSerie)}</div></td>
            <td>${escapeHtml(v.strMarca)}</td>
            <td><div class="description-text">${escapeHtml(v.strModelo)}</div><div class="vehicle-muted-line">${escapeHtml(v.strVersion || "Sin versión")}</div></td>
            <td>${v.intAnio}</td>
            <td>${escapeHtml(v.strColor)}</td>
            <td>${renderVehiculoBadge(v.strStatus)}</td>
            <td class="text-end">
                    <div class="dropdown actions-dropdown d-inline-block">
                        <button class="btn-action-trigger btn-sm" type="button" data-bs-toggle="dropdown" data-bs-boundary="viewport" aria-expanded="false">
                            <span>Acciones</span>
                            <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                        </button>
                        <ul class="dropdown-menu dropdown-menu-end">
                            <li>
                                <button class="dropdown-item d-flex align-items-center" type="button" onclick="editarVehiculoDemo(${v.id})">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 text-primary"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 1 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                                    Editar
                                </button>
                            </li>
                            <li>
                                <a class="dropdown-item d-flex align-items-center" href="/Vehiculos/Detalle/${v.id}">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 text-info"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>
                                    Ver detalles
                                </a>
                            </li>
                            <li>
                                <button class="dropdown-item d-flex align-items-center text-danger" type="button" onclick="eliminarVehiculo(${v.id})">
                                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" class="me-2 text-danger"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><line x1="10" y1="11" x2="10" y2="17"/><line x1="14" y1="11" x2="14" y2="17"/></svg>
                                    Eliminar
                                </button>
                            </li>
                        </ul>
                    </div>
                </td>
        </tr>`).join("") : '<tr><td colspan="7" class="text-center py-5 text-muted">No se encontraron vehículos.</td></tr>';

    setText("vehiculosCountTodos", String(vehiculosDemo.length));
    setText("vehiculosCountActivos", String(vehiculosDemo.filter(v => v.strStatus === "Activo").length));
    setText("vehiculosCountMantenimiento", String(vehiculosDemo.filter(v => v.strStatus === "En mantenimiento").length));
    setText("vehiculosPaginationInfo", filtrados.length ? `Mostrando ${inicio + 1}-${inicio + pagina.length} de ${filtrados.length} registros` : "Mostrando 0-0 de 0 registros");
    
    const headerPill = document.querySelector('.vehiculo-module-table .records-pill');
    if (headerPill) {
        headerPill.textContent = `${vehiculosDemo.length} vehículos`;
    }
    
    renderVehiculosPagination(totalPaginas);

    document.querySelectorAll('#vehiculosTableBody .btn-action-trigger').forEach(el => {
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

function renderVehiculosPagination(totalPaginas) {
    const lista = document.getElementById("vehiculosPaginationList");
    if (!lista) return;
    lista.innerHTML = "";
    if (totalPaginas <= 1) return;
    for (let pagina = 1; pagina <= totalPaginas; pagina++) {
        const item = document.createElement("li");
        item.className = `page-item ${pagina === vehiculosCurrentPage ? "active" : ""}`;
        item.innerHTML = `<a class="page-link" href="#">${pagina}</a>`;
        item.addEventListener("click", event => { event.preventDefault(); vehiculosCurrentPage = pagina; renderVehiculosTable(); });
        lista.appendChild(item);
    }
}

function renderVehiculoBadge(status) {
    const clase = status === "Activo" ? "badge-active" : status === "En mantenimiento" ? "badge-maintenance" : status === "Vendido" ? "badge-muted" : "badge-danger";
    return `<span class="${clase}">${escapeHtml(status)}</span>`;
}

function editarVehiculoDemo(id) {
    window.location.href = `/Vehiculos/Create?id=${id}`;
}

function eliminarVehiculo(id) {
    const vehiculo = vehiculosDemo.find(v => v.id === id);
    if (!vehiculo) return;

    Swal.fire({
        title: "¿Estás seguro de que deseas eliminar este vehículo?",
        text: `El vehículo con placa ${vehiculo.strPlaca} será eliminado del sistema de forma permanente.`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        cancelButtonColor: "#6b7280",
        confirmButtonText: "Sí, eliminar",
        cancelButtonText: "Cancelar"
    }).then((result) => {
        if (result.isConfirmed) {
            Swal.fire({
                title: 'Eliminando vehículo...',
                allowOutsideClick: false,
                didOpen: () => {
                    Swal.showLoading();
                }
            });

            fetch('/Vehiculos/DeleteVehiculo?id=' + id, {
                method: 'POST'
            })
            .then(res => res.json())
            .then(result => {
                Swal.close();
                if (result.success) {
                    Swal.fire({
                        icon: 'success',
                        title: '¡Éxito!',
                        text: 'El vehículo ha sido eliminado exitosamente.',
                        confirmButtonColor: 'var(--teal-cavex)'
                     }).then(() => {
                        sessionStorage.removeItem("vehiculosDemo_cache");
                        window.location.reload();
                    });
                } else {
                    Swal.fire({
                        icon: 'error',
                        title: 'Error',
                        text: result.message || 'No se pudo eliminar el vehículo.',
                        confirmButtonColor: 'var(--teal-cavex)'
                    });
                }
            })
            .catch(err => {
                Swal.close();
                console.error("Error al eliminar vehículo:", err);
                Swal.fire({
                    icon: 'error',
                    title: 'Error de red',
                    text: 'No se pudo conectar con el servidor.',
                    confirmButtonColor: 'var(--teal-cavex)'
                });
            });
        }
    });
}

function vehicleIcon() {
    return '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9L18 10l-2-4H8l-2 4-2.5 1.1C2.7 11.4 2 12.1 2 13v3c0 .6.4 1 1 1h2"/><circle cx="7" cy="17" r="2"/><circle cx="17" cy="17" r="2"/></svg>';
}

function setText(id, value) {
    const element = document.getElementById(id);
    if (element) element.textContent = value;
}

function escapeHtml(text) {
    return String(text || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

function cambiarStatusVehiculo(id, statusId, statusValor) {
    Swal.fire({
        title: 'Actualizando estatus...',
        allowOutsideClick: false,
        didOpen: () => {
            Swal.showLoading();
        }
    });

    fetch(`/Vehiculos/UpdateVehiculoStatus?id=${id}&idStatus=${statusId}`, {
        method: 'POST'
    })
    .then(res => res.json())
    .then(result => {
        Swal.close();
        if (result.success) {
            Swal.fire({
                icon: 'success',
                title: '¡Éxito!',
                text: `El estatus del vehículo ha sido actualizado a "${statusValor}".`,
                confirmButtonColor: 'var(--teal-cavex)'
            }).then(() => {
                sessionStorage.removeItem("vehiculosDemo_cache");
                window.location.reload();
            });
        } else {
            Swal.fire({
                icon: 'error',
                title: 'Error',
                text: result.message || 'No se pudo actualizar el estatus.',
                confirmButtonColor: 'var(--teal-cavex)'
            });
        }
    })
    .catch(err => {
        Swal.close();
        console.error("Error al actualizar estatus:", err);
        Swal.fire({
            icon: 'error',
            title: 'Error de red',
            text: 'No se pudo conectar con el servidor.',
            confirmButtonColor: 'var(--teal-cavex)'
        });
    });
}
