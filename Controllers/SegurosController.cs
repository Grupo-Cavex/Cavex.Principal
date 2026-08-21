using Cavex.Principal.Models.VehSeguro;
using Cavex.Principal.Models.VehCatAseguradora;
using Cavex.Principal.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Cavex.Principal.Controllers
{
    public class SegurosController : Controller
    {
        private readonly IVehSeguroService _vehSeguro;
        private readonly IVehCatAseguradoraService _vehCatAseguradora;
        private readonly ICatStatusService _catStatusService;

        public SegurosController(IVehSeguroService vehSeguro, IVehCatAseguradoraService vehCatAseguradora, ICatStatusService catStatusService)
        {
            _vehSeguro = vehSeguro;
            _vehCatAseguradora = vehCatAseguradora;
            _catStatusService = catStatusService;
        }

        [HttpGet("/Seguros/GetStatus")]
        public async Task<JsonResult> GetStatus(CancellationToken cancellationToken)
        {
            var response = await _catStatusService.ObtenerTodosAsync(cancellationToken);
            if (!response.Success || response.Data?.Items == null || !response.Data.Items.Any())
            {
                var fallback = new object[]
                {
                    new { id = 1, strValor = "Activo", strDescripcion = "Activo" },
                    new { id = 2, strValor = "Inactivo", strDescripcion = "Inactivo" }
                };
                return Json(new { success = true, data = fallback });
            }

            return Json(new { success = true, data = response.Data.Items });
        }

        // --- SEGUROS (ASEGURADORAS) ---
        [HttpGet("/Seguros")]
        [HttpGet("/Vehiculos/Seguros")]
        [HttpGet("/Seguros/Seguros")]
        public IActionResult Seguros()
        {
            return View("~/Views/Vehiculos/Seguros/Create.cshtml");
        }

        [HttpGet("/Seguros/GetVehiculoSeguros")]
        public async Task<IActionResult> GetVehiculoSeguros(CancellationToken cancellationToken)
        {
            try
            {
                var response = await _vehSeguro.ObtenerTodosAsync(cancellationToken);
                if (response == null || !response.Success) return Json(new { success = false, message = response?.Message ?? "Error al obtener seguros." });
                return Json(new { success = true, data = response.Data?.Items ?? Enumerable.Empty<VehSeguroDto>() });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("/Seguros/GetSeguros")]
        [HttpGet("/Seguros/Seguros/GetSeguros")]
        public async Task<IActionResult> GetSeguros(int pagina = 1, int pageSize = 1000, string? search = null, int? status = null, CancellationToken cancellationToken = default)
        {
            if (pagina < 1) pagina = 1;
            if (pageSize < 1) pageSize = 1000;

            try
            {
                var response = await _vehCatAseguradora.ObtenerTodosAsync(pagina, pageSize, search, status, cancellationToken);
                if (response == null || !response.Success) return Json(new { success = false, message = response?.Message ?? "Error al obtener catálogo de aseguradoras." });
                var items = response.Data?.Items?.ToList() ?? new List<VehCatAseguradoraDto>();
                var totalCount = response.Data?.TotalCount ?? 0;
                return Json(new { success = true, data = items, totalCount = totalCount });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("/Seguros/SaveSeguro")]
        [HttpPost("/Seguros/Seguros/SaveSeguro")]
        public async Task<IActionResult> SaveSeguro([FromBody] VehCatAseguradoraSaveDto model, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return Json(new { success = false, message = string.Join(" ", errors) });
            }
            try
            {
                var exists = await _vehCatAseguradora.ExistePorNombreAsync(model.StrValor.Trim(), null, cancellationToken);
                if (exists)
                {
                    return Json(new { success = false, message = "El nombre de la aseguradora ya existe." });
                }

                var response = await _vehCatAseguradora.CrearAsync(model, cancellationToken);
                return Json(new { success = response?.Success ?? false, message = response?.Message, data = response?.Data });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("/Seguros/UpdateSeguro")]
        [HttpPost("/Seguros/Seguros/UpdateSeguro")]
        public async Task<IActionResult> UpdateSeguro([FromBody] VehCatAseguradoraEditDto model, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return Json(new { success = false, message = string.Join(" ", errors) });
            }
            try
            {
                var exists = await _vehCatAseguradora.ExistePorNombreAsync(model.StrValor.Trim(), model.Id, cancellationToken);
                if (exists)
                {
                    return Json(new { success = false, message = "El nombre de la aseguradora ya existe." });
                }

                var response = await _vehCatAseguradora.EditarAsync(model, cancellationToken);
                return Json(new { success = response?.Success ?? false, message = response?.Message, data = response?.Data });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("/Seguros/DeleteSeguro")]
        [HttpPost("/Seguros/Seguros/DeleteSeguro")]
        public async Task<IActionResult> DeleteSeguro(int id, CancellationToken cancellationToken)
        {
            try
            {
                var response = await _vehCatAseguradora.EliminarAsync(id, cancellationToken);
                return Json(new { success = response?.Success ?? false, message = response?.Message });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }
    }
}
