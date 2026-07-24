using Cavex.Principal.Models.VehControlServicio;
using Cavex.Principal.Models.VehCatTaller;
using Cavex.Principal.Models.VehCatTipoServicio;
using Cavex.Principal.Models.VehCatFormaPago;
using Cavex.Principal.Models.VehCatResponsableServicio;
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
        private readonly IWebHostEnvironment _webHostEnvironment;

        public MantenimientoController(
            IVehControlServicioService vehControlServicio,
            IVehCatTallerService vehCatTaller,
            IVehCatTipoServicioService vehCatTipoServicio,
            IVehCatFormaPagoService vehCatFormaPago,
            IVehCatResponsableServicioService vehCatResponsableServicio,
            IWebHostEnvironment webHostEnvironment)
        {
            _vehControlServicio = vehControlServicio;
            _vehCatTaller = vehCatTaller;
            _vehCatTipoServicio = vehCatTipoServicio;
            _vehCatFormaPago = vehCatFormaPago;
            _vehCatResponsableServicio = vehCatResponsableServicio;
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

                return Json(new { success = true, data = response.Data?.Items ?? Enumerable.Empty<VehControlServicioDto>() });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
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

                return Json(new
                {
                    success = true,
                    data = new
                    {
                        talleres      = talleres?.Data?.Items      ?? Enumerable.Empty<VehCatTallerDto>(),
                        tiposServicio = tiposServicio?.Data?.Items ?? Enumerable.Empty<VehCatTipoServicioDto>(),
                        formasPago    = formasPago?.Data?.Items    ?? Enumerable.Empty<VehCatFormaPagoDto>()
                    }
                });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

       /* [HttpPost("/IngresoTaller/SaveIngresoTaller")]
        public async Task<IActionResult> SaveIngresoTaller(
            [FromForm] VehControlServicioSaveDto model,
            IFormFile? ComprobanteArchivo,
            CancellationToken cancellationToken)
        {
            if (model == null)
                return BadRequest(new { success = false, message = "Datos del ingreso a taller no recibidos." });

            try
            {
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

                var result = await _vehControlServicio.CrearAsync(model, cancellationToken);
                if (result != null && (result.Success || result.StatusCode == System.Net.HttpStatusCode.Created))
                    return Ok(new { success = true, message = "Ingreso a taller registrado correctamente." });

                return BadRequest(new { success = false, message = result?.Message ?? "No se pudo guardar el ingreso a taller." });
            }
            catch (Exception ex)
            {
                return BadRequest(new { success = false, message = ex.Message });
            }
        }*/

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
    }
}
