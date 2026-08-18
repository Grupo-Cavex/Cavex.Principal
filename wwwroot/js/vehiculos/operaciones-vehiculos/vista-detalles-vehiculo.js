"use strict";

$(document).ready(function() {

    function formatFechaEsMX(rawDateStr) {
        if (!rawDateStr) return "—";
        const str = String(rawDateStr);
        if (str.startsWith("0001-01-01") || str.startsWith("0001")) return "—";
        const cleanStr = str.split("T")[0];
        const parts = cleanStr.split("-");
        if (parts.length === 3) {
            const year = parseInt(parts[0], 10);
            const month = parseInt(parts[1], 10) - 1;
            const day = parseInt(parts[2], 10);
            if (year <= 1) return "—";
            const dateObj = new Date(year, month, day);
            return isNaN(dateObj.getTime()) ? "—" : dateObj.toLocaleDateString("es-MX");
        }
        const parsed = new Date(rawDateStr);
        return isNaN(parsed.getTime()) ? "—" : parsed.toLocaleDateString("es-MX");
    }

    const vehiculosDetalles = {};

    const pathParts = window.location.pathname.split('/');
    const lastPathSegment = pathParts[pathParts.length - 1];
    const pathId = parseInt(lastPathSegment);
    const urlParams = new URLSearchParams(window.location.search);
    const queryId = parseInt(urlParams.get('id'));
    const vehiculoId = (!isNaN(queryId) && queryId > 0) ? queryId : (!isNaN(pathId) && pathId > 0) ? pathId : (window.vehiculoId || 1);
    
    let vehiculo = {
        id: vehiculoId,
        nombre: "",
        placa: "",
        estatus: "",
        foto: null,
        vin: "",
        tipo: "",
        combustible: "",
        capacidad: "",
        anio: "",
        color: "",
        motor: "",
        transmision: "",
        kilometraje: "",
        garantia: "",
        resumen: {
            proximoFecha: "",
            proximoKm: "",
            ultimoTipo: "",
            ultimoFecha: "",
            ultimoKm: "",
            saludPct: 100,
            saludLabel: "",
            saludDesc: "",
            seguroProvider: "",
            seguroPoliza: "",
            seguroCobertura: "",
            seguroVigencia: "",
            seguroRestante: "",
            infraccionesCount: 0,
            infraccionesMonto: "$0.00",
            alertas: []
        },
        mantenimientoStats: {
            totalCost: "$0.00 MXN",
            totalCount: "0 Servicios",
            totalKm: "0 km"
        },
        mantenimientos: [],
        revision: {
            aprobados: 0,
            total: 0,
            status: "",
            pct: 0,
            categorias: []
        },
        llantas: [],
        seguro: {
            proveedor: "",
            statusBadge: "",
            statusDays: "",
            detalles: [],
            coberturasHelp: [],
            siniestros: []
        },
        infraccionesTotal: "$0.00",
        infracciones: [],
        documentos: [],
        historial: [],
        chartData: {
            real: [0, 0, 0, 0, 0],
            estimado: [0, 0, 0, 0, 0]
        }
    };

    vehiculosDetalles[vehiculoId] = vehiculo;

    // --- 1. FUNCIONES DE RENDERIZADO GENERAL Y LLENADO DE DATOS ---

    // Llena los elementos visuales de la cabecera (placa, foto, estatus) y la tarjeta de información técnica del vehículo
    function poblarCabeceraYDatosGenerales() {
        let fotoUrl = vehiculo.foto;
        if (!fotoUrl) {
            fotoUrl = "/svg/vista-detalles-vehiculos/car.svg";
        }
        $('#det-foto').attr('src', fotoUrl);
        $('#det-nombre').text(vehiculo.nombre);
        $('#det-placa').text(vehiculo.placa);
        $('#det-estatus').text(vehiculo.estatus);
        
        if (vehiculo.estatus === "Activo") {
            $('#det-estatus').attr('class', 'badge-status-active');
        } else {
            $('#det-estatus').attr('class', 'badge-status-inactive');
        }

        $('#det-vin').text(vehiculo.vin);
        $('#det-tipo').text(vehiculo.tipo || '—');
        $('#det-combustible').text(vehiculo.combustible || '—');
        $('#det-capacidad').text(vehiculo.capacidad || '—');
        $('#det-anio').text(vehiculo.anio);
        $('#det-color').text(vehiculo.color);
        $('#det-motor').text(vehiculo.motor);
        $('#det-transmision').text(vehiculo.transmision);
        $('#det-kilometraje').text(vehiculo.kilometraje);
        $('#det-garantia').text(vehiculo.garantia);
    }

    // Devuelve un bloque HTML diseñado para alertar que una sección específica no cuenta con registros
    function renderPlaceholderVacio(seccionNombre) {
        return `
            <div class="empty-section-banner text-center py-5" style="width: 100%; border: 2px dashed #cbd5e1; border-radius: 14px; background: #f8fafc; margin: 15px 0;">
                <img src="/svg/vista-detalles-vehiculos/folder.svg" width="48" height="48" style="opacity: 0.3; margin-bottom: 12px;" />
                <h5 class="text-muted font-weight-bold">Sin registros aún</h5>
                <p class="small text-muted mb-0">No se encontraron registros de ${seccionNombre} para este vehículo.</p>
            </div>
        `;
    }

    function renderFilaTablaVacia(colspan, seccionNombre) {
        return `
            <tr>
                <td colspan="${colspan}" class="text-center py-5 text-muted">
                    <div style="display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;">
                        <img src="/svg/vista-detalles-vehiculos/folder.svg" width="40" height="40" style="opacity: 0.3;" />
                        <div>
                            <span class="font-weight-bold d-block" style="color: var(--gris-oscuro);">Sin registros aún</span>
                            <span class="small text-muted">No se encontraron registros de ${seccionNombre} para este vehículo.</span>
                        </div>
                    </div>
                </td>
            </tr>
        `;
    }

    function renderAlertasResumen() {
        const container = $('#resumen-alertas-lista');
        container.empty();
        if (!vehiculo.resumen.alertas || vehiculo.resumen.alertas.length === 0) {
            container.html('<div class="alert-item text-muted text-center py-2"><span class="small font-weight-bold">Sin registros aún</span></div>');
            return;
        }

        vehiculo.resumen.alertas.forEach(a => {
            const dotClass = a.tipo === "danger" ? "alert-dot-danger" : "alert-dot-warning";
            const html = `
                <div class="alert-item">
                    <div class="alert-left">
                        <span class="alert-dot ${dotClass}" title="${a.tipo === "danger" ? "Urgente" : "Próximo"}"></span>
                        <span class="alert-msg">${a.msg}</span>
                    </div>
                    <span class="alert-meta">${a.meta}</span>
                </div>
            `;
            container.append(html);
        });
    }

    function renderMantenimientoResumen() {
        const container = $('#resumen-mantenimiento-lista');
        container.empty();
        
        container.append(`
            <div class="maint-item-header">
                <span>Servicio</span>
                <span>Fecha</span>
                <span>Kilometraje</span>
                <span style="text-align: right;">Estado</span>
            </div>
        `);

        if (!vehiculo.mantenimientos || vehiculo.mantenimientos.length === 0) {
            container.append('<div class="p-3 text-center text-muted small font-weight-bold">Sin registros aún</div>');
            return;
        }

        const itemsToShow = vehiculo.mantenimientos.slice(0, 4);
        itemsToShow.forEach(m => {
            let iconSrc = "/svg/vista-detalles-vehiculos/wrench.svg";
            let colorClass = "maint-icon-yellow";
            if (m.concepto.toLowerCase().includes("aceite")) {
                iconSrc = "/svg/vista-detalles-vehiculos/dollar.svg";
                colorClass = "maint-icon-orange";
            } else if (m.concepto.toLowerCase().includes("rotación") || m.concepto.toLowerCase().includes("llanta")) {
                iconSrc = "/svg/vista-detalles-vehiculos/speedometer.svg";
                colorClass = "maint-icon-blue";
            }

            const html = `
                <div class="maint-item">
                    <div class="maint-left">
                        <span class="maint-icon ${colorClass}">
                            <img src="${iconSrc}" width="11" height="11" alt="Icono" />
                        </span>
                        <span class="maint-name">${m.concepto}</span>
                    </div>
                    <span class="maint-date">${m.fecha}</span>
                    <span class="maint-km">${m.km}</span>
                    <div class="maint-status">
                        <span class="badge-status-completed">${m.estado}</span>
                    </div>
                </div>
            `;
            container.append(html);
        });
    }

    function renderRevisionResumen() {
        $('#resumen-salud-pct').text(`${vehiculo.resumen.saludPct}%`);
        $('#resumen-salud-label').text(vehiculo.resumen.saludLabel);
        $('#resumen-salud-footer').text(vehiculo.resumen.saludDesc);

        let color = "var(--exito)";
        if (vehiculo.resumen.saludPct < 50) color = "var(--error)";
        else if (vehiculo.resumen.saludPct < 90) color = "#f59e0b";
        $('.progress-ring-gauge-68').css('background', `conic-gradient(${color} ${vehiculo.resumen.saludPct}%, #e2e8f0 0)`);

        $('#resumen-revision-num').text(`${vehiculo.revision.aprobados}/${vehiculo.revision.total}`);
        $('#resumen-revision-status').text(vehiculo.revision.status);
        $('.progress-ring-gauge-110').css('background', `conic-gradient(${color} ${vehiculo.revision.pct}%, #e2e8f0 0)`);

        const checklist = $('#resumen-revision-checklist');
        checklist.empty();

        if (!vehiculo.revision.categorias || vehiculo.revision.categorias.length === 0) {
            checklist.append('<div class="p-3 text-center text-muted small font-weight-bold">Sin registros aún</div>');
            return;
        }

        let count = 0;
        vehiculo.revision.categorias.forEach(cat => {
            cat.items.forEach(item => {
                if (count < 5 && item.approved) {
                    const html = `
                        <div class="check-item">
                            <span class="check-icon">
                                <img src="/svg/vista-detalles-vehiculos/check.svg" width="12" height="12" alt="Aprobado" />
                            </span>
                            <span>${item.name}</span>
                        </div>
                    `;
                    checklist.append(html);
                    count++;
                }
            });
        });
        if (vehiculo.revision.aprobados > 5) {
            checklist.append(`<div class="check-more">... y ${vehiculo.revision.aprobados - 5} puntos más</div>`);
        }
    }

    function renderSeguroResumen() {
        $('#resumen-seguro-provider').text(vehiculo.resumen.seguroProvider);
        $('#resumen-seguro-poliza').html(`Póliza: <span>${vehiculo.resumen.seguroPoliza}</span>`);
        $('#resumen-seguro-cobertura').html(`Cobertura: <span>${vehiculo.resumen.seguroCobertura}</span>`);
        $('#resumen-seguro-vigencia').html(`Vigencia: <span>${vehiculo.resumen.seguroVigencia}</span>`);
        
        const restanteEl = $('#resumen-seguro-restante');
        restanteEl.text(vehiculo.resumen.seguroRestante);
        
        if (vehiculo.resumen.seguroRestante.includes("Vigente")) {
            restanteEl.attr('class', 'badge-seguro-vigente');
        } else {
            restanteEl.attr('class', 'badge-seguro-vencido');
        }
    }

    function renderInfraccionesResumen() {
        $('#resumen-infracciones-count').text(vehiculo.resumen.infraccionesCount);
        $('#resumen-infracciones-monto').html(`Total adeudado: <span>${vehiculo.resumen.infraccionesMonto}</span>`);
    }

    function renderDocumentosResumen() {
        const container = $('#resumen-documentos-lista');
        container.empty();

        if (!vehiculo.documentos || vehiculo.documentos.length === 0) {
            container.append('<div class="p-3 text-center text-muted small font-weight-bold">Sin registros aún</div>');
            return;
        }

        const docsToShow = vehiculo.documentos.slice(0, 3);
        docsToShow.forEach(d => {
            const dateStr = d.info.includes("Expira") || d.info.includes("Subido") || d.info.includes("Vence") ? d.info.split(": ")[1] : "—";
            const html = `
                <div class="doc-item">
                    <div class="doc-left">
                        <span class="doc-icon">
                            <img src="/svg/vista-detalles-vehiculos/file-pdf.svg" width="16" height="16" alt="PDF" />
                        </span>
                        <span>${d.name}</span>
                    </div>
                    <div class="doc-meta">
                        <span class="doc-type">${d.type}</span>
                        <span class="doc-date">${dateStr}</span>
                        <a href="#" class="doc-download-btn" title="Descargar">
                            <img src="/svg/vista-detalles-vehiculos/download.svg" width="14" height="14" alt="Descargar" />
                        </a>
                    </div>
                </div>
            `;
            container.append(html);
        });
    }

    function renderResumenTab() {
        // Próximo Servicio
        const proximoBody = $('#resumen-proximo-body');
        proximoBody.empty();
        if (!vehiculo.resumen.proximoFecha || vehiculo.resumen.proximoFecha.trim() === "") {
            proximoBody.html('<div class="text-center text-muted py-3"><span class="small font-weight-bold">Sin registros aún</span></div>');
        } else {
            proximoBody.html(`
                <span class="metric-card-label">Servicio Programado</span>
                <span class="metric-card-value">${vehiculo.resumen.proximoFecha}</span>
                <span class="metric-card-subtext">${vehiculo.resumen.proximoKm}</span>
            `);
        }

        // Último Servicio
        const ultimoBody = $('#resumen-ultimo-body');
        ultimoBody.empty();
        if (!vehiculo.resumen.ultimoFecha || vehiculo.resumen.ultimoFecha.trim() === "") {
            ultimoBody.html('<div class="text-center text-muted py-3"><span class="small font-weight-bold">Sin registros aún</span></div>');
        } else {
            ultimoBody.html(`
                <span class="metric-card-label">${vehiculo.resumen.ultimoTipo}</span>
                <span class="metric-card-value">${vehiculo.resumen.ultimoFecha}</span>
                <span class="metric-card-subtext">${vehiculo.resumen.ultimoKm}</span>
            `);
        }

        // Kilometraje (sin promedio)
        $('#resumen-km-actual').text(vehiculo.kilometraje || "0 km");

        renderAlertasResumen();
        renderMantenimientoResumen();
        renderRevisionResumen();
        renderSeguroResumen();
        renderInfraccionesResumen();
        renderDocumentosResumen();
    }

    function renderMantenimientoTab() {
        $('#maint-total-cost').text(vehiculo.mantenimientoStats.totalCost);
        $('#maint-total-count').text(vehiculo.mantenimientoStats.totalCount);
        $('#maint-total-km').text(vehiculo.mantenimientoStats.totalKm);

        const tableBody = $('#mantenimiento-tabla-body');
        tableBody.empty();

        if (!vehiculo.mantenimientos || vehiculo.mantenimientos.length === 0) {
            tableBody.html(renderFilaTablaVacia(10, "Mantenimientos"));
            return;
        }

        vehiculo.mantenimientos.forEach(m => {
            const html = `
                <tr>
                    <td>${m.fecha}</td>
                    <td class="cell-folio">${m.folio}</td>
                    <td><strong>${m.concepto}</strong></td>
                    <td><span class="table-details-list">${m.detalles}</span></td>
                    <td class="cell-mileage">${m.km}</td>
                    <td>${m.taller}</td>
                    <td>${m.tecnico}</td>
                    <td class="cell-amount">${m.costo}</td>
                    <td><span class="badge-cavex completed">${m.estado}</span></td>
                    <td class="cell-actions">
                        <a href="#" class="doc-download-btn" title="Descargar Factura PDF">
                            <img src="/svg/vista-detalles-vehiculos/folder.svg" width="14" height="14" alt="Ver" />
                        </a>
                    </td>
                </tr>
            `;
            tableBody.append(html);
        });
    }

    function renderRevisionTab() {
        const total = vehiculo.revision.total;
        const aprobados = vehiculo.revision.aprobados;
        const statusText = vehiculo.revision.status;
        const pct = vehiculo.revision.pct;
        
        let badgeBg = 'rgba(16, 185, 129, 0.1)';
        let badgeColor = 'var(--exito)';
        if (pct < 50) {
            badgeBg = 'rgba(239, 68, 68, 0.1)';
            badgeColor = 'var(--error)';
        } else if (pct < 90) {
            badgeBg = 'rgba(245, 158, 11, 0.1)';
            badgeColor = '#f59e0b';
        }

        $('#revision-status-badge')
            .text(`Estatus: ${aprobados}/${total} Aprobados (${statusText})`)
            .css({ 'background-color': badgeBg, 'color': badgeColor });

        const grid = $('#revision-cats-grid');
        grid.empty();

        if (!vehiculo.revision.categorias || vehiculo.revision.categorias.length === 0) {
            grid.html(renderPlaceholderVacio("Revisión de 24 Puntos"));
            return;
        }

        vehiculo.revision.categorias.forEach(cat => {
            let catItemsHtml = "";
            cat.items.forEach((item, idx) => {
                const isNoBorder = (idx === cat.items.length - 1) ? "no-border" : "";
                const statusClass = item.approved ? "status-approved" : "status-failed";
                const statusSymbol = item.approved ? "✓ Aprobado" : "✗ Falla";
                
                catItemsHtml += `
                    <div class="check-item-row ${isNoBorder}">
                        <span>• ${item.name}</span>
                        <span class="${statusClass}">${statusSymbol}</span>
                    </div>
                `;
            });

            let iconPath = `/svg/vista-detalles-vehiculos/${cat.icon}.svg`;
            const catHtml = `
                <div class="checklist-cat-card">
                    <h4 class="checklist-cat-title">
                        <img src="${iconPath}" width="16" height="16" alt="Icono" />
                        ${cat.name}
                    </h4>
                    <div class="check-items-list">
                        ${catItemsHtml}
                    </div>
                </div>
            `;
            grid.append(catHtml);
        });

        // Click interactivo
        $('.check-item-row').css('cursor', 'pointer').click(function() {
            let statusSpan = $(this).find('.status-approved, .status-failed');
            if (statusSpan.length === 0) return;

            if (statusSpan.hasClass('status-approved')) {
                statusSpan.removeClass('status-approved').addClass('status-failed');
                statusSpan.text('✗ Falla');
            } else {
                statusSpan.removeClass('status-failed').addClass('status-approved');
                statusSpan.text('✓ Aprobado');
            }

            let totalItems = $('.check-item-row').length;
            let approvedItems = 0;
            $('.check-item-row').each(function() {
                let text = $(this).find('.status-approved, .status-failed').text().trim();
                if (text.indexOf('✓') !== -1) {
                    approvedItems++;
                }
            });
            let newPct = totalItems > 0 ? Math.round((approvedItems / totalItems) * 100) : 0;
            
            $('.progress-ring-text-68').text(`${newPct}%`);
            $('#resumen-revision-num').text(`${approvedItems}/${totalItems}`);
            
            let healthLabel = 'Excelente';
            let newColor = 'var(--exito)';
            if (newPct < 50) {
                healthLabel = 'Atención';
                newColor = 'var(--error)';
            } else if (newPct < 90) {
                healthLabel = 'Bueno';
                newColor = '#f59e0b';
            }
            $('#resumen-salud-label').text(healthLabel);
            $('#resumen-revision-status').text(healthLabel);
            
            $('.progress-ring-gauge-68').css('background', `conic-gradient(${newColor} ${newPct}%, #e2e8f0 0)`);
            $('.progress-ring-gauge-110').css('background', `conic-gradient(${newColor} ${newPct}%, #e2e8f0 0)`);
            
            let newBadgeBg = 'rgba(16, 185, 129, 0.1)';
            if (newPct < 50) newBadgeBg = 'rgba(239, 68, 68, 0.1)';
            else if (newPct < 90) newBadgeBg = 'rgba(245, 158, 11, 0.1)';

            $('#revision-status-badge')
                .text(`Estatus: ${approvedItems}/${totalItems} Aprobados (${healthLabel})`)
                .css({ 'background-color': newBadgeBg, 'color': newColor });
        });
    }

    function renderLlantasTab() {
        const grid = $('#llantas-grid');
        grid.empty();

        if (!vehiculo.llantas || vehiculo.llantas.length === 0) {
            grid.html(renderPlaceholderVacio("Neumáticos"));
            return;
        }

        vehiculo.llantas.forEach(ll => {
            const indicatorClass = ll.statusClass || "success";
            const cardRefClass = ll.pos === "REF" ? "refaccion-card" : "";
            const html = `
                <div class="llanta-card ${cardRefClass}">
                    <div class="llanta-indicator ${indicatorClass}">${ll.pos}</div>
                    <div class="llanta-info">
                        <span class="llanta-title">${ll.name}</span>
                        <span><strong>Modelo:</strong> ${ll.modelo}</span>
                        <span><strong>Presión:</strong> ${ll.presion}</span>
                        <span><strong>Vida Útil:</strong> ${ll.vida}</span>
                    </div>
                </div>
            `;
            grid.append(html);
        });
    }

    function renderSeguroTab() {
        $('#seguro-proveedor').text(vehiculo.seguro.proveedor);
        
        const detailsList = $('#seguro-detalles-lista');
        detailsList.empty();
        
        if (vehiculo.seguro.detalles.length === 0) {
            detailsList.append('<div class="p-3 text-muted text-center small font-weight-bold">Sin registros aún</div>');
        } else {
            vehiculo.seguro.detalles.forEach(d => {
                detailsList.append(`<div><span>${d.label}:</span> <strong>${d.val}</strong></div>`);
            });
        }

        const badgeEl = $('#seguro-status-badge');
        const daysEl = $('#seguro-status-days');
        
        badgeEl.text(vehiculo.seguro.statusBadge);
        daysEl.text(vehiculo.seguro.statusDays);

        if (vehiculo.seguro.statusBadge === "VIGENTE") {
            badgeEl.attr('class', 'policy-status-badge');
            badgeEl.css({'background-color': 'rgba(16, 185, 129, 0.1)', 'color': 'var(--exito)'});
        } else {
            badgeEl.attr('class', 'policy-status-badge venc');
            badgeEl.css({'background-color': 'rgba(239, 68, 68, 0.1)', 'color': 'var(--error)'});
        }

        const helpList = $('#seguro-help-detalles');
        helpList.empty();
        
        if (vehiculo.seguro.coberturasHelp.length === 0) {
            helpList.append('<div class="text-muted small font-weight-bold">Sin registros aún</div>');
        } else {
            vehiculo.seguro.coberturasHelp.forEach(c => {
                helpList.append(`<div><strong>${c.label}:</strong> ${c.val}</div>`);
            });
        }

        const tableBody = $('#siniestros-tabla-body');
        tableBody.empty();

        if (!vehiculo.seguro.siniestros || vehiculo.seguro.siniestros.length === 0) {
            tableBody.html(renderFilaTablaVacia(6, "Siniestros"));
            return;
        }

        vehiculo.seguro.siniestros.forEach(s => {
            const html = `
                <tr>
                    <td>${s.fecha}</td>
                    <td>${s.folio}</td>
                    <td>${s.tipo}</td>
                    <td>${s.ajustador}</td>
                    <td>${s.deducible}</td>
                    <td><span style="background-color: #f1f5f9; color: var(--gris); font-size: 11.5px; font-weight: 700; padding: 4px 8px; border-radius: 4px;">${s.estado}</span></td>
                </tr>
            `;
            tableBody.append(html);
        });
    }

    function renderInfraccionesTab() {
        $('#infracciones-total-badge').text(vehiculo.infraccionesTotal);

        const tableBody = $('#infracciones-tabla-body');
        tableBody.empty();

        if (!vehiculo.infracciones || vehiculo.infracciones.length === 0) {
            tableBody.html(renderFilaTablaVacia(7, "Infracciones"));
            return;
        }

        vehiculo.infracciones.forEach(inf => {
            const statusClass = inf.isPending ? "badge-cavex pending" : "badge-cavex completed";
            const actionHtml = inf.isPending 
                ? `<a href="#" class="btn-action-primary small">Pagar Multa</a>` 
                : `<span class="cell-info-italic">${inf.info || "Completado"}</span>`;

            const html = `
                <tr>
                    <td>${inf.fecha}</td>
                    <td class="cell-folio">${inf.folio}</td>
                    <td>${inf.motivo}</td>
                    <td>${inf.lugar}</td>
                    <td class="cell-amount error">${inf.monto}</td>
                    <td><span class="${statusClass}">${inf.estatus}</span></td>
                    <td class="cell-actions text-right">${actionHtml}</td>
                </tr>
            `;
            tableBody.append(html);
        });
    }

    function renderDocumentosTab() {
        const grid = $('#documentos-grid');
        grid.empty();

        if (!vehiculo.documentos || vehiculo.documentos.length === 0) {
            grid.html(renderPlaceholderVacio("Documentos"));
            return;
        }

        vehiculo.documentos.forEach(d => {
            let actionHtml = "";
            let leftIconOpacity = "1";
            let statusPillHtml = "";

            if (d.status === "Faltante") {
                leftIconOpacity = "0.5";
                statusPillHtml = `<div><span class="badge-status-missing">Faltante</span></div>`;
                actionHtml = `<a href="#" class="btn-doc-action">Subir</a>`;
            } else if (d.status === "Por Actualizar") {
                leftIconOpacity = "0.7";
                statusPillHtml = `<div><span class="badge-status-pending">Por Actualizar</span></div>`;
                actionHtml = `<a href="#" class="btn-doc-action warning">Actualizar</a>`;
            } else {
                actionHtml = `
                    <span class="doc-type">${d.type}</span>
                    <a href="#" class="doc-download-btn" title="Descargar">
                        <img src="/svg/vista-detalles-vehiculos/download.svg" width="14" height="14" alt="Descargar" />
                    </a>
                `;
            }

            const html = `
                <div class="doc-item">
                    <div class="doc-left">
                        <span class="doc-icon">
                            <img src="/svg/vista-detalles-vehiculos/file-pdf.svg" width="18" height="18" alt="PDF" style="opacity: ${leftIconOpacity};" />
                        </span>
                        <div>
                            <span class="doc-name">${d.name}</span>
                            ${statusPillHtml || `<span class="doc-info">${d.info}</span>`}
                        </div>
                    </div>
                    <div class="doc-meta">
                        ${actionHtml}
                    </div>
                </div>
            `;
            grid.append(html);
        });
    }

    function renderHistorialTab() {
        const container = $('#historial-timeline-list');
        container.empty();

        if (!vehiculo.historial || vehiculo.historial.length === 0) {
            container.html(renderPlaceholderVacio("Historial de Actividades"));
            return;
        }

        vehiculo.historial.forEach(h => {
            const dotClass = h.dotClass || "";
            const html = `
                <div class="timeline-item">
                    <span class="timeline-dot ${dotClass}"></span>
                    <div class="timeline-header">
                        <span class="timeline-title">${h.title}</span>
                        <span class="timeline-date">${h.fecha}</span>
                    </div>
                    <div class="timeline-desc">
                        ${h.desc}
                    </div>
                </div>
            `;
            container.append(html);
        });
    }

    // Cargar catálogos vehiculares dinámicos y luego los detalles
    const vehiculoCatalogos = {
        idVehCatMarcaVehiculo: [],
        idVehCatColor: [],
        idVehCatTipoVehiculo: [],
        idVehCatCapacidad: [],
        idVehCatTipoCombustible: [],
        idVehCatStatus: [],
        idVehCatTransmision: []
    };

    fetch('/Vehiculos/GetVehiculoCatalogos')
        .then(res => res.json())
        .then(catalogResult => {
            if (catalogResult.success && catalogResult.data) {
                Object.assign(vehiculoCatalogos, catalogResult.data);
            }

            return fetch(`/Vehiculos/GetVehiculo?id=${vehiculoId}`);
        })
        .then(res => res.json())
        .then(res => {
            if (res.success && res.data) {
                const v = res.data;

                const strMarca = vehiculoCatalogos.idVehCatMarcaVehiculo?.find(item => item.id == v.idVehCatMarcaVehiculo)?.strValor || v.strVehCatMarcaVehiculo || "";
                const strColor = vehiculoCatalogos.idVehCatColor?.find(item => item.id == v.idVehCatColor)?.strValor || v.strVehCatColor || "";
                const strTipoVehiculo = vehiculoCatalogos.idVehCatTipoVehiculo?.find(item => item.id == v.idVehCatTipoVehiculo)?.strValor || v.strVehCatTipoVehiculo || "";
                const strCapacidad = vehiculoCatalogos.idVehCatCapacidad?.find(item => item.id == v.idVehCatCapacidad)?.strValor || v.strVehCatCapacidad || "—";
                const strTipoCombustible = vehiculoCatalogos.idVehCatTipoCombustible?.find(item => item.id == v.idVehCatTipoCombustible)?.strValor || v.strVehCatTipoCombustible || "—";
                const strTransmision = v.strVehCatTransmision || vehiculoCatalogos.idVehCatTransmision?.find(item => item.id == v.idVehCatTransmision)?.strValor || "—";
                const strStatus = vehiculoCatalogos.idVehCatStatus?.find(item => item.id == v.idVehCatStatus)?.strValor || v.strVehCatStatus || "Activo";

                const fechaReg = formatFechaEsMX(v.dteFechaAsignacion || v.dteFechaRegistro || v.dtFechaCompra);
                const currentKmNum = Number(v.decKilometrajeActual || 0);

                // 1. Mantenimientos de BD
                const dbServicios = res.servicios || [];
                const mantenimientosList = dbServicios.map((s, idx) => {
                    const rawFecha = s.dteFechaServicio || s.dteFechaInicio || s.DteFechaServicio || s.DteFechaInicio;
                    const fechaServ = formatFechaEsMX(rawFecha);
                    const kmServ = Number(s.decKilometrajeActual || s.lngKilometrajeActual || s.bigKilometrajeActual || s.DecKilometrajeActual || 0);
                    const costoServ = Number(s.mnyCostoTotal || s.MnyCostoTotal || (Number(s.mnyCostoManoObra || s.MnyCostoManoObra || 0) + Number(s.mnyCostoRefacciones || s.MnyCostoRefacciones || 0)));
                    const folioId = s.id || s.Id;
                    return {
                        id: folioId,
                        fecha: fechaServ,
                        folio: folioId ? `MNT-${folioId}` : `MNT-${idx+1}`,
                        concepto: s.strVehCatTipoServicio || s.StrVehCatTipoServicio || s.strDescripcion || s.StrDescripcion || "Servicio registrado",
                        detalles: s.strDescripcion || s.StrDescripcion || s.strVehServicioDetalle || s.StrVehServicioDetalle || "Sin observaciones",
                        km: kmServ > 0 ? `${kmServ.toLocaleString("es-MX")} km` : "0 km",
                        taller: s.strVehCatTaller || s.StrVehCatTaller || "Taller asignado",
                        tecnico: s.strEmpEmpleado || s.StrEmpEmpleado || s.strVehCatResponsableServicio || s.StrVehCatResponsableServicio || "Técnico de servicio",
                        costo: `$${costoServ.toLocaleString("es-MX", {minimumFractionDigits: 2})} MXN`,
                        estado: s.strVehCatStatus || s.StrVehCatStatus || "Completado"
                    };
                });

                let totalMaintCostNum = 0;
                dbServicios.forEach(s => {
                    totalMaintCostNum += Number(s.mnyCostoTotal || (s.mnyCostoManoObra || 0) + (s.mnyCostoRefacciones || 0));
                });

                // 2. Infracciones de BD
                const dbInfracciones = res.infracciones || [];
                const infraccionesList = dbInfracciones.map((inf, idx) => {
                    const fechaInf = formatFechaEsMX(inf.dteFechaInfraccion);
                    const montoInf = Number(inf.mnyMontoPagado || 0);
                    const estatusStr = inf.strVehCatStatus || (inf.dteFechaPago ? "Pagada" : "Pendiente");
                    const isPagada = estatusStr.toLowerCase().includes("pagada");
                    return {
                        fecha: fechaInf,
                        folio: inf.id ? `INF-${inf.id}` : `INF-${idx+1}`,
                        motivo: inf.strMotivo || "Sin motivo especificado",
                        lugar: inf.strObservaciones || "Sin observaciones",
                        monto: `$${montoInf.toLocaleString("es-MX", {minimumFractionDigits: 2})} MXN`,
                        estatus: estatusStr,
                        isPending: !isPagada,
                        info: inf.dteFechaPago ? `Pagado el ${formatFechaEsMX(inf.dteFechaPago)}` : (isPagada ? "Pagada" : "Pendiente de Pago")
                    };
                });

                let infraccionesPendingMonto = 0;
                dbInfracciones.forEach(inf => {
                    const estatusStr = inf.strVehCatStatus || "";
                    if (!estatusStr.toLowerCase().includes("pagada") && !inf.dteFechaPago) {
                        infraccionesPendingMonto += Number(inf.mnyMontoPagado || 0);
                    }
                });

                // 3. Seguro y Siniestros de BD
                const dbSeguros = res.seguros || [];
                const activeSeguro = dbSeguros.length > 0 ? dbSeguros[0] : null;
                const dbDanios = res.danios || [];

                const siniestrosList = dbDanios.map((d, idx) => {
                    const fechaDanio = formatFechaEsMX(d.dteFechaEvento);
                    const montoRep = Number(d.mnyMontoReparacion || 0);
                    return {
                        fecha: fechaDanio,
                        folio: d.id ? `SIN-${d.id}` : `SIN-${idx+1}`,
                        tipo: d.strDescripcion || "Sin descripción",
                        ajustador: d.strUbicacion ? `Ubicación: ${d.strUbicacion}` : "Sin datos de ubicación",
                        deducible: `$${montoRep.toLocaleString("es-MX", {minimumFractionDigits: 2})} MXN`,
                        estado: d.strObservaciones || "Sin observaciones"
                    };
                });

                const seguroObj = {
                    proveedor: activeSeguro?.strVehCatAseguradora || "Sin aseguradora",
                    statusBadge: activeSeguro ? (activeSeguro.strVehCatStatus || "VIGENTE").toUpperCase() : "SIN SEGURO",
                    statusDays: activeSeguro ? (activeSeguro.dteFechaVencimiento ? `Vence el ${formatFechaEsMX(activeSeguro.dteFechaVencimiento)}` : "Sin fecha de vencimiento") : "Sin póliza registrada",
                    detalles: [
                        { label: "Póliza No.", val: activeSeguro?.strNumeroPoliza || "—" },
                        { label: "Aseguradora", val: activeSeguro?.strVehCatAseguradora || "—" },
                        { label: "Vigencia", val: activeSeguro ? `${formatFechaEsMX(activeSeguro.dteFechaInicio)} - ${formatFechaEsMX(activeSeguro.dteFechaVencimiento)}` : "N/A" },
                        { label: "Tipo Cobertura", val: activeSeguro?.strVehCatTipoCobertura || "—" },
                        { label: "Monto Cobertura", val: activeSeguro ? `$${Number(activeSeguro.mnyMontoCoberura || 0).toLocaleString("es-MX")} MXN` : "$0.00" }
                    ],
                    coberturasHelp: activeSeguro ? ["Póliza registrada en base de datos"] : [],
                    siniestros: siniestrosList
                };

                // 4. Llantas de BD
                const dbLlantas = res.llantas || [];
                const llantasList = dbLlantas.map((ll, idx) => {
                    let posCode = "DD";
                    let posStr = ll.strVehCatPosicionLlanta || "";
                    if (posStr.includes("izquierda")) posCode = posStr.includes("Delantera") ? "DI" : "TI";
                    else if (posStr.includes("derecha")) posCode = posStr.includes("Delantera") ? "DD" : "TD";
                    else if (posStr.includes("Refac")) posCode = "REF";
                    else posCode = idx === 0 ? "DD" : (idx === 1 ? "DI" : "TD");

                    const marcaModelo = `${ll.strVehCatMarcaLlanta || ""} ${ll.strModelo || ""} ${ll.strMedida || ""}`.trim();

                    return {
                        pos: posCode,
                        name: ll.strVehCatPosicionLlanta || `Neumático ${idx+1}`,
                        modelo: marcaModelo || "Neumático sin especificación",
                        presion: ll.decPresionActual ? `${ll.decPresionActual} PSI` : (ll.decPresionRecomendada ? `${ll.decPresionRecomendada} PSI` : "—"),
                        vida: ll.intProfundidadActual ? `${ll.intProfundidadActual} mm` : "—",
                        statusClass: "success"
                    };
                });

                // 5. Documentos de BD
                const documentosList = [];
                (res.tarjetasCirculacion || []).forEach(t => {
                    documentosList.push({
                        name: t.strNumeroTarjeta ? `Tarjeta de Circulación (${t.strNumeroTarjeta})` : "Tarjeta de Circulación",
                        type: "PDF",
                        info: t.dteFechaVencimiento ? `Vigente hasta ${new Date(t.dteFechaVencimiento).toLocaleDateString("es-MX")}` : "Sin fecha de vencimiento",
                        status: t.strVehCatStatus || "Activo"
                    });
                });
                (res.tenencias || []).forEach(t => {
                    documentosList.push({
                        name: `Tenencia Vehicular ${t.intAnio || ""} ${t.strFolioPago ? `(Folio: ${t.strFolioPago})` : ""}`.trim(),
                        type: "PDF",
                        info: t.dteFechaPago ? `Pagado el ${new Date(t.dteFechaPago).toLocaleDateString("es-MX")}` : "Sin fecha de pago",
                        status: t.strVehCatStatus || "Activo"
                    });
                });
                (res.verificaciones || []).forEach(v => {
                    documentosList.push({
                        name: `Verificación Vehicular ${v.strFolioVerificacion ? `(Folio: ${v.strFolioVerificacion})` : ""}`.trim(),
                        type: "PDF",
                        info: v.dteFechaVencimiento ? `Vigente hasta ${new Date(v.dteFechaVencimiento).toLocaleDateString("es-MX")}` : "Sin fecha de vencimiento",
                        status: v.strVehCatStatus || "Activo"
                    });
                });
                (res.permisosTransporte || []).forEach(p => {
                    documentosList.push({
                        name: `Permiso Especial de Transporte ${p.strNumeroPermiso ? `(${p.strNumeroPermiso})` : ""}`.trim(),
                        type: "PDF",
                        info: p.dteFechaVencimiento ? `Vencimiento: ${new Date(p.dteFechaVencimiento).toLocaleDateString("es-MX")}` : "Sin fecha de vencimiento",
                        status: p.strVehCatStatus || "Por Actualizar"
                    });
                });

                // 7. Revistas Vehiculares (Salud / Inspección)
                const dbRevistas = res.revistas || [];
                const latestRevista = dbRevistas.length > 0 ? dbRevistas[0] : null;

                const revisionObj = {
                    aprobados: latestRevista ? 24 : 0,
                    total: 24,
                    status: latestRevista ? (latestRevista.strResultado || "Aprobado") : "Sin inspección",
                    pct: latestRevista ? 100 : 0,
                    inspector: latestRevista?.strInspector || "Sin inspector asignado",
                    folio: latestRevista?.strFolioRevista || "—",
                    fecha: latestRevista?.dteFechaRevista ? new Date(latestRevista.dteFechaRevista).toLocaleDateString("es-MX") : "—",
                    proxima: latestRevista?.dteProximaRevista ? new Date(latestRevista.dteProximaRevista).toLocaleDateString("es-MX") : "—",
                    categorias: latestRevista ? [
                        {
                            name: "Motor y Fluidos",
                            icon: "engine",
                            items: [
                                { name: "Nivel de aceite de motor", approved: true },
                                { name: "Nivel de líquido de frenos", approved: true },
                                { name: "Líquido anticongelante / refrigerante", approved: true },
                                { name: "Estado y carga de batería", approved: true },
                                { name: "Filtro de aire y mangueras", approved: true }
                            ]
                        },
                        {
                            name: "Sistema de Frenos",
                            icon: "brakes",
                            items: [
                                { name: "Balatas delanteras (Grosor > 7mm)", approved: true },
                                { name: "Balatas traseras (Grosor > 6mm)", approved: true },
                                { name: "Discos y tambores de freno", approved: true },
                                { name: "Freno de mano y ajuste de chicote", approved: true }
                            ]
                        },
                        {
                            name: "Luces y Sistema Eléctrico",
                            icon: "electric",
                            items: [
                                { name: "Faros delanteros (Altas y Bajas)", approved: true },
                                { name: "Luces de freno, reversa y placa", approved: true },
                                { name: "Luces direccionales e intermitentes", approved: true },
                                { name: "Limpiaparabrisas y plumas", approved: true },
                                { name: "Claxon y bocinas de alerta", approved: true }
                            ]
                        },
                        {
                            name: "Llantas y Suspensión",
                            icon: "tire",
                            items: [
                                { name: "Presión de inflado en 4 ruedas", approved: true },
                                { name: "Profundidad de huella (Prof. > 4mm)", approved: true },
                                { name: "Amortiguadores y bujes", approved: true },
                                { name: "Alineación y balanceo", approved: true },
                                { name: "Llanta de refacción y kit de gato", approved: true }
                            ]
                        },
                        {
                            name: "Carrocería e Interior",
                            icon: "car-check",
                            items: [
                                { name: "Hojalatería y pintura (Sin abolladuras/daños)", approved: true },
                                { name: "Cristales, parabrisas y espejos", approved: true },
                                { name: "Cinturones de seguridad (5 puntos)", approved: true },
                                { name: "Sistema de aire acondicionado", approved: true },
                                { name: "Vestiduras y tapicería limpia", approved: true }
                            ]
                        }
                    ] : []
                };

                // 8. Gasolina y Kilometraje Histórico de BD
                const dbGasolina = res.gasolina || [];
                const kmsGasolina = dbGasolina.map(g => Number(g.decKilometrajeActual || 0)).filter(k => k > 0);

                // 9. Bitácora de Historial
                const historialList = [
                    ...mantenimientosList.map(m => ({ fecha: m.fecha, titulo: `Servicio de Mantenimiento`, desc: `${m.concepto} - ${m.km} (${m.costo})`, tipo: "mantenimiento" })),
                    ...infraccionesList.map(i => ({ fecha: i.fecha, titulo: `Infracción de Tránsito`, desc: `${i.motivo} (${i.monto})`, tipo: "infraccion" })),
                    ...documentosList.map(d => ({ fecha: d.vencimiento, titulo: `Documento: ${d.name}`, desc: `Folio: ${d.folio} - Estado: ${d.status}`, tipo: "documento" }))
                ];

                // Construcción de la entidad vehiculo mediante Object.assign para mantener la referencia global
                Object.assign(vehiculo, {
                    id: v.id,
                    nombre: `${strMarca} ${v.strModelo || ""} ${v.intAnio || ""}`.trim() || "—",
                    placa: v.strPlaca || "—",
                    estatus: strStatus || "Activo",
                    foto: v.strUrlFoto || null,
                    vin: v.strNumSerie || "—",
                    tipo: strTipoVehiculo || "—",
                    combustible: strTipoCombustible || "—",
                    capacidad: strCapacidad || "—",
                    anio: v.intAnio || "—",
                    color: strColor || "—",
                    motor: v.strMotor || v.strNumMotor || "—",
                    transmision: strTransmision || "—",
                    kilometraje: `${currentKmNum > 0 ? currentKmNum.toLocaleString("es-MX") : "0"} km`,
                    garantia: v.strObservaciones || "Sin observaciones",
                    resumen: {
                        proximoFecha: formatFechaEsMX(v.dteProximoMantenimiento) !== "—" ? formatFechaEsMX(v.dteProximoMantenimiento) : (mantenimientosList.length > 1 ? mantenimientosList[1].fecha : "—"),
                        proximoKm: mantenimientosList.length > 1 ? mantenimientosList[1].km : `${(currentKmNum + 5000).toLocaleString("es-MX")} km`,
                        ultimoTipo: mantenimientosList.length > 0 ? mantenimientosList[0].concepto : "Mantenimiento Preventivo",
                        ultimoFecha: formatFechaEsMX(v.dteUltimoMantenimiento) !== "—" ? formatFechaEsMX(v.dteUltimoMantenimiento) : (mantenimientosList.length > 0 ? mantenimientosList[0].fecha : "—"),
                        ultimoKm: mantenimientosList.length > 0 ? mantenimientosList[0].km : `${currentKmNum.toLocaleString("es-MX")} km`,
                        saludPct: latestRevista ? 100 : 0,
                        saludLabel: latestRevista ? (latestRevista.strResultado || "Excelente") : "Sin inspección",
                        saludDesc: latestRevista ? `Inspección por ${latestRevista.strInspector || "Inspector"}` : "Sin revista vehicular registrada",
                        seguroProvider: seguroObj.proveedor,
                        seguroPoliza: activeSeguro?.strNumeroPoliza || "—",
                        seguroCobertura: activeSeguro?.strVehCatTipoCobertura || "—",
                        seguroVigencia: activeSeguro ? `${activeSeguro.dteFechaInicio ? new Date(activeSeguro.dteFechaInicio).toLocaleDateString("es-MX") : '—'} - ${activeSeguro.dteFechaVencimiento ? new Date(activeSeguro.dteFechaVencimiento).toLocaleDateString("es-MX") : '—'}` : "Sin seguro",
                        seguroRestante: activeSeguro ? (activeSeguro.strVehCatStatus || "Registrado") : "Sin seguro",
                        infraccionesCount: infraccionesList.length,
                        infraccionesMonto: `$${infraccionesPendingMonto.toLocaleString("es-MX", {minimumFractionDigits: 2})}`,
                        alertas: documentosList.filter(d => d.status === "Por Actualizar" || d.status === "Vencido").map(d => ({ tipo: "warning", msg: `${d.name} está por actualizar`, meta: "Documento" }))
                    },
                    mantenimientoStats: {
                        totalCost: `$${totalMaintCostNum.toLocaleString("es-MX", {minimumFractionDigits: 2})} MXN`,
                        totalCount: `${mantenimientosList.length} Servicios`,
                        totalKm: `${currentKmNum.toLocaleString("es-MX")} km`
                    },
                    mantenimientos: mantenimientosList,
                    revision: revisionObj,
                    llantas: llantasList,
                    seguro: seguroObj,
                    infraccionesTotal: `Pendiente: $${infraccionesPendingMonto.toLocaleString("es-MX", {minimumFractionDigits: 2})}`,
                    infracciones: infraccionesList,
                    documentos: documentosList,
                    historial: historialList,
                    chartData: {
                        real: kmsGasolina.length > 0 ? kmsGasolina : [0, currentKmNum],
                        estimado: kmsGasolina.length > 0 ? kmsGasolina.map(k => Math.round(k * 1.05)) : [0, currentKmNum]
                    }
                });

                vehiculosDetalles[vehiculoId] = vehiculo;

                poblarCabeceraYDatosGenerales();
                renderResumenTab();
                renderMantenimientoTab();
                renderRevisionTab();
                renderLlantasTab();
                renderSeguroTab();
                renderInfraccionesTab();
                renderDocumentosTab();
                renderHistorialTab();
            }

            $('#skeleton-wrapper').hide();
            $('#data-wrapper').show();

            try {
                initMileageChart();
            } catch (chartErr) {
                console.warn("Chart init non-fatal error:", chartErr);
            }
        })
        .catch(err => {
            console.error("Error al obtener vehículo:", err);
            poblarCabeceraYDatosGenerales();
            renderResumenTab();
            renderMantenimientoTab();
            renderRevisionTab();
            renderLlantasTab();
            renderSeguroTab();
            renderInfraccionesTab();
            renderDocumentosTab();
            renderHistorialTab();

            $('#skeleton-wrapper').hide();
            $('#data-wrapper').show();
        });

    // --- 5. MANEJADOR DE CAMBIO DE PESTAÑAS (TABS REACTIVOS) ---
    $('.tab-btn').click(function() {
        if ($(this).hasClass('active')) return;

        $('.tab-btn').removeClass('active');
        $(this).addClass('active');

        const targetTab = $(this).attr('data-tab');
        $('.tab-content').hide();
        $(`#tab-${targetTab}`).fadeIn(150);
    });

    // Manejador para enlaces de acceso rápido con atributo data-tab-nav
    $(document).on('click', '[data-tab-nav]', function(e) {
        e.preventDefault();
        const targetTab = $(this).attr('data-tab-nav');
        if (targetTab) {
            const $targetBtn = $(`.tab-btn[data-tab="${targetTab.toLowerCase()}"]`);
            if ($targetBtn.length) {
                $targetBtn.click();
                $('html, body').animate({
                    scrollTop: $('.tabs-container').offset().top - 80
                }, 200);
            }
        }
    });

    // Detectar pestaña inicial desde la URL (ej. ?tab=mantenimiento)
    const requestedTab = urlParams.get('tab') || urlParams.get('seccion');
    if (requestedTab) {
        const $targetBtn = $(`.tab-btn[data-tab="${requestedTab.toLowerCase()}"]`);
        if ($targetBtn.length) {
            setTimeout(function() {
                $targetBtn.click();
            }, 100);
        }
    }

    // --- 7. GRÁFICA COMPARATIVA DE KILOMETRAJE (Chart.js) ---
    function initMileageChart() {
        if (typeof Chart === 'undefined') return;
        const ctx = document.getElementById('mileageChart');
        const placeholder = document.getElementById('mileageChartPlaceholder');
        if (!ctx) return;

        // Si no hay datos de kilometraje, ocultar canvas y mostrar placeholder
        if (!vehiculo.chartData || !vehiculo.chartData.real || vehiculo.chartData.real.length === 0) {
            ctx.style.display = 'none';
            if (placeholder) placeholder.style.display = 'flex';
            return;
        }

        ctx.style.display = 'block';
        if (placeholder) placeholder.style.display = 'none';

        if (typeof ChartDataLabels !== 'undefined') {
            Chart.register(ChartDataLabels);
        }

        const labels = ['Firma', 'Viaje 1', 'Viaje 2', 'Viaje 3', 'Viaje 4', 'Viaje 5', 'Viaje 6'];
        
        ctx.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Kilometraje Real',
                        data: vehiculo.chartData.real,
                        borderColor: '#10b981',
                        backgroundColor: 'rgba(16, 185, 129, 0.05)',
                        borderWidth: 2.5,
                        pointBackgroundColor: '#10b981',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 2,
                        pointRadius: 5,
                        pointHoverRadius: 7,
                        fill: false,
                        tension: 0.15
                    },
                    {
                        label: 'Kilometraje Contratado (Est.)',
                        data: vehiculo.chartData.estimado,
                        borderColor: '#64748b',
                        borderDash: [5, 5],
                        borderWidth: 1.5,
                        pointBackgroundColor: '#64748b',
                        pointBorderColor: '#ffffff',
                        pointBorderWidth: 1.5,
                        pointRadius: 4,
                        pointHoverRadius: 6,
                        fill: false,
                        tension: 0.15
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: true,
                        position: 'top',
                        labels: {
                            boxWidth: 12,
                            font: {
                                size: 11,
                                weight: '600'
                            }
                        }
                    },
                    tooltip: {
                        backgroundColor: '#061B3A',
                        titleColor: '#ffffff',
                        bodyColor: '#ffffff',
                        padding: 10,
                        cornerRadius: 8,
                        callbacks: {
                            label: function(context) {
                                return ` ${context.dataset.label}: ${context.parsed.y.toLocaleString()} km`;
                            }
                        }
                    },
                    datalabels: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        ticks: {
                            callback: function(value) {
                                return value.toLocaleString() + ' km';
                            },
                            color: '#64748b',
                            font: {
                                size: 11,
                                weight: '500'
                            }
                        },
                        grid: {
                            color: '#e2e8f0',
                            borderDash: [5, 5],
                            drawBorder: false
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: '#64748b',
                            font: {
                                size: 11,
                                weight: '500'
                            }
                        }
                    }
                }
            }
        });
    }
});
