using Cavex.Principal.Models.VehAsignacionVehiculos;
using Cavex.Principal.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Cavex.Principal.Controllers
{
    public class AsignacionesController : Controller
    {
        private readonly IVehAsignacionVehiculosService _vehAsignacionVehiculos;

        public AsignacionesController(IVehAsignacionVehiculosService vehAsignacionVehiculos)
        {
            _vehAsignacionVehiculos = vehAsignacionVehiculos;
        }

        // Pantalla frontend de asignaciones
        [HttpGet("/Asignaciones")]
        [HttpGet("/Asignaciones/Asignaciones")]
        [HttpGet("/Vehiculos/Asignaciones")]
        public IActionResult Asignaciones()
        {
            return View("~/Views/Vehiculos/Asignaciones/Create.cshtml");
        }

        [HttpPost("/Asignaciones/SaveAsignacion")]
        [HttpPost("/Vehiculos/SaveAsignacion")]
        public async Task<IActionResult> SaveAsignacion([FromBody] VehAsignacionVehiculosEditDto model, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();
                return Json(new { success = false, message = string.Join(" ", errors) });
            }

            try
            {
                if (model.Id > 0)
                {
                    var response = await _vehAsignacionVehiculos.EditarAsync(model, cancellationToken);
                    if (response == null || !response.Success) return Json(new { success = false, message = response?.Message ?? "Error al actualizar asignación." });
                    return Json(new { success = true, message = "Asignación actualizada correctamente.", data = response.Data });
                }
                else
                {
                    var response = await _vehAsignacionVehiculos.CrearAsync(model, cancellationToken);
                    if (response == null || !response.Success) return Json(new { success = false, message = response?.Message ?? "Error al crear asignación." });
                    return Json(new { success = true, message = "Asignación creada correctamente.", data = response.Data });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("/Asignaciones/GetAsignacionesActivas")]
        [HttpGet("/Vehiculos/GetAsignacionesActivas")]
        public async Task<IActionResult> GetAsignacionesActivas(CancellationToken cancellationToken)
        {
            try
            {
                var response = await _vehAsignacionVehiculos.ObtenerTodosAsync(cancellationToken);
                if (response == null || !response.Success)
                {
                    return Json(new { success = false, message = response?.Message ?? "No se pudieron obtener las asignaciones activas." });
                }
                return Json(new { success = true, data = response.Data?.Items ?? Enumerable.Empty<VehAsignacionVehiculosDto>() });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("/Asignaciones/DeleteAsignacion/{id}")]
        [HttpPost("/Vehiculos/DeleteAsignacion/{id}")]
        public async Task<IActionResult> DeleteAsignacion(int id, CancellationToken cancellationToken)
        {
            try
            {
                var response = await _vehAsignacionVehiculos.EliminarAsync(id, cancellationToken);
                return Json(new { success = response?.Success ?? false, message = response?.Message });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }
    }
}
