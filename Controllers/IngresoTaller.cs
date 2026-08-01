using Cavex.Principal.Models.VehControlServicio;
using Cavex.Principal.Models.VehCatTaller;
using Cavex.Principal.Models.VehCatTipoServicio;
using Cavex.Principal.Models.VehCatFormaPago;
using Cavex.Principal.Models.VehCatResponsableServicio;
using Cavex.Principal.Models.VehCatRefacciones;
using Cavex.Principal.Models.VehDatosGenerales;
using Cavex.Principal.Models.EmpEmpleado;
using Cavex.Principal.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Cavex.Principal.Controllers
{
    public class MantenimientoController : Controller
    {
        private readonly IVehControlServicioService _vehControlServicio;
        private readonly IVehCatTallerService _vehCatTaller;
        private readonly IVehCatTipoServicioService _vehCatTipoServicio;
        private readonly IVehCatFormaPagoService _vehCatFormaPago;
        private readonly IVehCatResponsableServicioService _vehCatResponsableServicio;
        private readonly IVehDatosGeneralesService _vehDatosGenerales;
        private readonly IEmpEmpleadoService _empEmpleado;
        private readonly IVehCatRefaccionesService _vehCatRefacciones;
        private readonly IWebHostEnvironment _webHostEnvironment;

        public MantenimientoController(
            IVehControlServicioService vehControlServicio,
            IVehCatTallerService vehCatTaller,
            IVehCatTipoServicioService vehCatTipoServicio,
            IVehCatFormaPagoService vehCatFormaPago,
            IVehCatResponsableServicioService vehCatResponsableServicio,
            IVehDatosGeneralesService vehDatosGenerales,
            IEmpEmpleadoService empEmpleado,
            IVehCatRefaccionesService vehCatRefacciones,
            IWebHostEnvironment webHostEnvironment)
        {
            _vehControlServicio = vehControlServicio;
            _vehCatTaller = vehCatTaller;
            _vehCatTipoServicio = vehCatTipoServicio;
            _vehCatFormaPago = vehCatFormaPago;
            _vehCatResponsableServicio = vehCatResponsableServicio;
            _vehDatosGenerales = vehDatosGenerales;
            _empEmpleado = empEmpleado;
            _vehCatRefacciones = vehCatRefacciones;
            _webHostEnvironment = webHostEnvironment;
        }

        // Pantalla frontend de Mantenimiento vehicular
        [HttpGet("/IngresoTaller")]
        [HttpGet("/IngresoTaller/IngresoTaller")]
        public IActionResult IngresoTaller()
        {
            return View("~/Views/Vehiculos/IngresoTaller.cshtml");
        }

        // Pantalla de Agregar responsables de servicio
        [HttpGet("/IngresoTaller/ResponsableServicio")]
        [HttpGet("/IngresoTaller/ResponsableServicio/Index")]
        public IActionResult ResponsableServicio()
        {
            return View("~/Views/Vehiculos/ResponsableServicio.cshtml");
        }

        [HttpGet("/IngresoTaller/GetIngresoTaller")]
        [HttpGet("/IngresoTaller/GetIngresosTaller")]
        public async Task<IActionResult> GetIngresosTaller(CancellationToken cancellationToken)
        {
            try
            {
                var response = await _vehControlServicio.ObtenerTodosAsync(cancellationToken);
                if (response == null || !response.Success)
                    return Json(new { success = false, message = response?.Message ?? "Error al obtener mantenimientos." });

                var items = response.Data?.Items?.ToList() ?? new List<VehControlServicioDto>();

                await EnriquecerListaIngresos(items, cancellationToken);

                return Json(new { success = true, data = items });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("/IngresoTaller/GetIngresoTallerById")]
        public async Task<IActionResult> GetIngresoTallerById(int id, CancellationToken cancellationToken)
        {
            try
            {
                var response = await _vehControlServicio.ObtenerPorIdAsync(id, cancellationToken);
                if (response == null || !response.Success || response.Data == null)
                    return Json(new { success = false, message = response?.Message ?? "No se encontró el registro de ingreso a taller." });

                var list = new List<VehControlServicioDto> { response.Data };
                await EnriquecerListaIngresos(list, cancellationToken);

                return Json(new { success = true, data = response.Data });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        private async Task EnriquecerListaIngresos(List<VehControlServicioDto> items, CancellationToken cancellationToken)
        {
            if (!items.Any()) return;

            var vehMap  = new Dictionary<int, VehDatosGeneralesDto>();
            var talMap  = new Dictionary<int, VehCatTallerDto>();
            var tipMap  = new Dictionary<int, VehCatTipoServicioDto>();
            var respMap = new Dictionary<int, VehCatResponsableServicioDto>();
            var empMap  = new Dictionary<int, EmpEmpleadoDto>();

            try
            {
                var vehRes = await _vehDatosGenerales.ObtenerTodosAsync(cancellationToken);
                if (vehRes?.Success == true && vehRes.Data?.Items != null)
                    vehMap = vehRes.Data.Items.ToDictionary(v => v.Id);
            }
            catch { }

            try
            {
                var talRes = await _vehCatTaller.ObtenerTodosAsync(1, 200, null, cancellationToken);
                if (talRes?.Success == true && talRes.Data?.Items != null)
                    talMap = talRes.Data.Items.ToDictionary(t => t.Id);
            }
            catch { }

            try
            {
                var tipRes = await _vehCatTipoServicio.ObtenerTodosAsync(cancellationToken);
                if (tipRes?.Success == true && tipRes.Data?.Items != null)
                    tipMap = tipRes.Data.Items.ToDictionary(t => t.Id);
            }
            catch { }

            try
            {
                var respRes = await _vehCatResponsableServicio.ObtenerTodosAsync(cancellationToken);
                if (respRes?.Success == true && respRes.Data?.Items != null)
                    respMap = respRes.Data.Items.ToDictionary(r => r.Id);
            }
            catch { }

            try
            {
                var empRes = await _empEmpleado.ObtenerTodosAsync(1, 200, null, null, cancellationToken);
                if (empRes?.Success == true && empRes.Data?.Items != null)
                    empMap = empRes.Data.Items.ToDictionary(e => e.Id);
            }
            catch { }

            foreach (var item in items)
            {
                if (string.IsNullOrWhiteSpace(item.StrVehDatosGenerales) && vehMap.TryGetValue(item.IdVehDatosGenerales, out var v))
                {
                    item.StrVehDatosGenerales = $"{v.StrPlaca} · {v.StrVehCatMarcaVehiculo} {v.StrModelo}".Trim();
                }

                if (string.IsNullOrWhiteSpace(item.StrVehCatTaller) && talMap.TryGetValue(item.IdVehCatTaller, out var t))
                {
                    item.StrVehCatTaller = t.StrValor;
                }

                if (string.IsNullOrWhiteSpace(item.StrVehCatTipoServicio) && tipMap.TryGetValue(item.IdVehCatTipoServicio, out var tip))
                {
                    item.StrVehCatTipoServicio = tip.StrValor;
                    if (string.IsNullOrWhiteSpace(item.StrVehServicioDetalle)) item.StrVehServicioDetalle = tip.StrValor;
                }

                if (string.IsNullOrWhiteSpace(item.StrVehCatResponsableServicio) && respMap.TryGetValue(item.IdVehCatResponsableServicio, out var r))
                {
                    item.StrVehCatResponsableServicio = r.StrValor;
                }

                int empId = item.IdEmpEmpleadoChofer > 0 ? item.IdEmpEmpleadoChofer : item.IdEmpEmpleado;
                if (string.IsNullOrWhiteSpace(item.StrEmpEmpleado) && empId > 0 && empMap.TryGetValue(empId, out var emp))
                {
                    item.StrEmpEmpleado = $"{emp.StrNombre} {emp.StrApellidoPaterno}".Trim();
                }
            }
        }

        [HttpGet("/IngresoTaller/GetIngresoTallerCatalogos")]
        public async Task<IActionResult> GetIngresoTallerCatalogos(CancellationToken cancellationToken)
        {
            try
            {
                var talleres      = await _vehCatTaller.ObtenerTodosAsync(1, 100, null, cancellationToken);
                var tiposServicio = await _vehCatTipoServicio.ObtenerTodosAsync(cancellationToken);
                var formasPago    = await _vehCatFormaPago.ObtenerTodosAsync(cancellationToken);
                var refacciones   = await _vehCatRefacciones.ObtenerTodosAsync(cancellationToken);

                var listTalleres = talleres?.Data?.Items?.ToList() ?? new List<VehCatTallerDto>();
                if (!listTalleres.Any())
                {
                    listTalleres.Add(new VehCatTallerDto { Id = 1, StrValor = "Taller Autorizado", StrDescripcion = "Taller principal" });
                }

                return Json(new
                {
                    success = true,
                    data = new
                    {
                        talleres      = listTalleres,
                        tiposServicio = tiposServicio?.Data?.Items ?? Enumerable.Empty<VehCatTipoServicioDto>(),
                        formasPago    = formasPago?.Data?.Items    ?? Enumerable.Empty<VehCatFormaPagoDto>(),
                        refacciones   = refacciones?.Data?.Items   ?? Enumerable.Empty<Cavex.Principal.Models.VehCatRefacciones.VehCatRefaccionesDto>()
                    }
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("/IngresoTaller/CrearRefaccion")]
        public async Task<IActionResult> CrearRefaccion([FromBody] Cavex.Principal.Models.VehCatRefacciones.VehCatRefaccionesSaveDto dto, CancellationToken cancellationToken)
        {
            if (dto == null || string.IsNullOrWhiteSpace(dto.StrValor))
                return BadRequest(new { success = false, message = "El nombre de la refacción es requerido." });

            var result = await _vehCatRefacciones.CrearAsync(dto, cancellationToken);
            if (result != null && result.Success && result.Data != null)
                return Json(new { success = true, data = result.Data });

            return Json(new { success = false, message = result?.Message ?? "No se pudo crear la refacción en el catálogo." });
        }

        [HttpPost("/IngresoTaller/SaveIngresoTaller")]
        public async Task<IActionResult> SaveIngresoTaller(
            [FromForm] VehControlServicioSaveDto model,
            IFormFile? ComprobanteArchivo,
            CancellationToken cancellationToken)
        {
            if (model == null)
                return BadRequest(new { success = false, message = "Datos del ingreso a taller no recibidos." });

            try
            {
                // Sincronizar campo de chofer / empleado y catálogos requeridos si se recibe solo el ticket (sección 1)
                if (model.IdEmpEmpleado <= 0 && model.IdEmpEmpleadoChofer > 0)
                    model.IdEmpEmpleado = model.IdEmpEmpleadoChofer;
                if (model.IdVehCatTipoServicio <= 0)
                    model.IdVehCatTipoServicio = 1;
                if (model.IdVehFormaPago <= 0)
                    model.IdVehFormaPago = 1;

                // Guardar comprobante si se adjuntó
                if (ComprobanteArchivo != null && ComprobanteArchivo.Length > 0)
                {
                    string folder   = Path.Combine(_webHostEnvironment.WebRootPath, "uploads", "mantenimientos");
                    if (!Directory.Exists(folder)) Directory.CreateDirectory(folder);

                    string ext      = Path.GetExtension(ComprobanteArchivo.FileName);
                    string fileName = $"comprobante_{Guid.NewGuid()}{ext}";
                    string filePath = Path.Combine(folder, fileName);

                    using (var stream = new FileStream(filePath, FileMode.Create))
                        await ComprobanteArchivo.CopyToAsync(stream);

                    model.StrUrlComprobantePago = $"/uploads/mantenimientos/{fileName}";
                }
                else if (model.Id > 0 && string.IsNullOrWhiteSpace(model.StrUrlComprobantePago))
                {
                    var existingResponse = await _vehControlServicio.ObtenerPorIdAsync(model.Id, cancellationToken);
                    if (existingResponse != null && existingResponse.Success && existingResponse.Data != null)
                    {
                        model.StrUrlComprobantePago = existingResponse.Data.StrUrlComprobantePago;
                    }
                }

                if (model.Id > 0)
                {
                    var editDto = new VehControlServicioEditDto
                    {
                        Id = model.Id,
                        IdVehDatosGenerales = model.IdVehDatosGenerales,
                        IdVehCatTipoServicio = model.IdVehCatTipoServicio,
                        DteFechaServicio = model.DteFechaServicio,
                        DecKilometrajeActual = model.DecKilometrajeActual,
                        IdVehCatTaller = model.IdVehCatTaller,
                        StrDescripcion = model.StrDescripcion,
                        MnyCostoManoObra = model.MnyCostoManoObra,
                        MnyCostoRefacciones = model.MnyCostoRefacciones,
                        IdVehFormaPago = model.IdVehFormaPago,
                        StrUrlComprobantePago = model.StrUrlComprobantePago,
                        IdVehCatResponsableServicio = model.IdVehCatResponsableServicio,
                        IdEmpEmpleadoChofer = model.IdEmpEmpleadoChofer,
                        IdEmpEmpleado = model.IdEmpEmpleado,
                        IntProximoServicioPorKm = model.IntProximoServicioPorKm,
                        DteProximoServicioPorFecha = model.DteProximoServicioPorFecha
                    };

                    var editResult = await _vehControlServicio.EditarAsync(editDto, cancellationToken);
                    if (editResult != null && editResult.Success)
                        return Ok(new { success = true, message = "Ingreso a taller actualizado correctamente." });

                    return BadRequest(new { success = false, message = editResult?.Message ?? "No se pudo actualizar el ingreso a taller." });
                }
                else
                {
                    var result = await _vehControlServicio.CrearAsync(model, cancellationToken);
                    if (result != null && (result.Success || result.StatusCode == System.Net.HttpStatusCode.Created))
                        return Ok(new { success = true, message = "Ingreso a taller registrado correctamente." });

                    return BadRequest(new { success = false, message = result?.Message ?? "No se pudo guardar el ingreso a taller." });
                }
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("/IngresoTaller/DeleteIngresoTaller")]
        public async Task<IActionResult> DeleteIngresoTaller(int id, CancellationToken cancellationToken)
        {
            try
            {
                var result = await _vehControlServicio.EliminarAsync(id, cancellationToken);
                if (result == null || !result.Success)
                    return Json(new { success = false, message = result?.Message ?? "Error al eliminar ingreso a taller." });

                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("/IngresoTaller/ResponsablesServicio/GetResponsables")]
        public async Task<IActionResult> GetResponsables(CancellationToken cancellationToken)
        {
            try
            {
                var response = await _vehCatResponsableServicio.ObtenerTodosAsync(cancellationToken);
                if (response == null || !response.Success) return Json(new { success = false, message = response?.Message ?? "Error al obtener responsables." });
                return Json(new { success = true, data = response.Data?.Items ?? Enumerable.Empty<VehCatResponsableServicioDto>() });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("/IngresoTaller/ResponsablesServicio/SaveResponsable")]
        [HttpPost("/IngresoTaller/ResponsablesServicio/Crear")]
        public async Task<IActionResult> SaveResponsable([FromBody] VehCatResponsableServicioSaveDto model, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return Json(new { success = false, message = string.Join(" ", errors) });
            }
            try
            {
                var response = await _vehCatResponsableServicio.CrearAsync(model, cancellationToken);
                return Json(new { success = response?.Success ?? false, message = response?.Message, data = response?.Data });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("/IngresoTaller/ResponsablesServicio/UpdateResponsable")]
        [HttpPost("/IngresoTaller/ResponsablesServicio/Actualizar")]
        public async Task<IActionResult> UpdateResponsable([FromBody] VehCatResponsableServicioEditDto model, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return Json(new { success = false, message = string.Join(" ", errors) });
            }
            try
            {
                var response = await _vehCatResponsableServicio.EditarAsync(model, cancellationToken);
                return Json(new { success = response?.Success ?? false, message = response?.Message, data = response?.Data });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("/IngresoTaller/ResponsablesServicio/DeleteResponsable")]
        [HttpPost("/IngresoTaller/ResponsablesServicio/Eliminar/{id?}")]
        public async Task<IActionResult> DeleteResponsable(int id, CancellationToken cancellationToken)
        {
            try
            {
                var response = await _vehCatResponsableServicio.EliminarAsync(id, cancellationToken);
                return Json(new { success = response?.Success ?? false, message = response?.Message });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("/IngresoTaller/GetRefacciones")]
        public async Task<IActionResult> GetRefacciones(CancellationToken cancellationToken)
        {
            try
            {
                var response = await _vehCatRefacciones.ObtenerTodosAsync(cancellationToken);
                if (response == null || !response.Success)
                    return Json(new { success = false, message = response?.Message ?? "Error al obtener catálogo de refacciones." });

                var items = response.Data?.Items?.ToList() ?? new List<VehCatRefaccionesDto>();
                return Json(new { success = true, data = items });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("/IngresoTaller/SaveRefaccionCatalog")]
        public async Task<IActionResult> SaveRefaccionCatalog([FromBody] VehCatRefaccionesSaveDto model, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return Json(new { success = false, message = string.Join(" ", errors) });
            }
            try
            {
                var response = await _vehCatRefacciones.CrearAsync(model, cancellationToken);
                return Json(new { success = response?.Success ?? false, message = response?.Message, data = response?.Data });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }
    }
}
