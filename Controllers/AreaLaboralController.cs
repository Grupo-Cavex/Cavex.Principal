using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Cavex.Principal.Services.Interfaces;
using Cavex.Principal.Models.EmpCatAreaLaboral;

namespace Cavex.Principal.Controllers
{
    public class AreaLaboralController : Controller
    {
        private readonly IEmpCatAreaLaboralService _serviceAreaLaboral;
        private readonly ICatStatusService _catStatusService;
        private readonly IMemoryCache _cache;
        private const string StatusCacheKey = "status_list";

        public AreaLaboralController(IEmpCatAreaLaboralService serviceAreaLaboral, ICatStatusService catStatusService, IMemoryCache cache)
        {
            _serviceAreaLaboral = serviceAreaLaboral;
            _catStatusService = catStatusService;
            _cache = cache;
        }

        // Muestra la vista principal del catálogo
        public IActionResult Index(int pagina = 1)
        {
            ViewBag.PaginaActual = pagina;
            return View(new EmpCatAreaLaboralSaveDto());
        }

        [HttpGet]
        public async Task<JsonResult> GetStatus(CancellationToken cancellationToken)
        {
            var statusItems = _cache.Get<object>(StatusCacheKey);
            if (statusItems != null)
            {
                return Json(new { success = true, data = statusItems });
            }

            var response = await _catStatusService.ObtenerTodosAsync(cancellationToken);
            if (!response.Success || response.Data?.Items == null || !response.Data.Items.Any())
            {
                statusItems = GetDefaultStatusItems();
                _cache.Set(StatusCacheKey, statusItems, TimeSpan.FromSeconds(30));
                return Json(new { success = true, data = statusItems });
            }

            statusItems = response.Data.Items;
            _cache.Set(StatusCacheKey, statusItems, TimeSpan.FromMinutes(10));

            return Json(new { success = true, data = statusItems });
        }

        // Obtiene las áreas laborales paginadas con opción de filtrado/búsqueda
        [HttpGet]
        public async Task<JsonResult> GetAreasLaborales(int pagina, string? search, string? status, CancellationToken cancellationToken)
        {
            if (pagina < 1) pagina = 1;
            int? statusVal = null;
            if (int.TryParse(status, out var parsedStatus))
            {
                statusVal = parsedStatus;
            }

            var countsCacheKey = $"areaslaborales_counts_{search}";
            if (!_cache.TryGetValue(countsCacheKey, out Dictionary<string, int>? statusCounts))
            {
                var allCountResponse = await _serviceAreaLaboral.ObtenerTodosAsync(1, 1, search, null, cancellationToken);
                int totalAllCount = allCountResponse.Success ? (allCountResponse.Data?.TotalCount ?? 0) : 0;

                var activeCountResponse = await _serviceAreaLaboral.ObtenerTodosAsync(1, 1, search, 1, cancellationToken);
                int activeCount = activeCountResponse.Success ? (activeCountResponse.Data?.TotalCount ?? 0) : 0;

                var inactiveCountResponse = await _serviceAreaLaboral.ObtenerTodosAsync(1, 1, search, 2, cancellationToken);
                int inactiveCount = inactiveCountResponse.Success ? (inactiveCountResponse.Data?.TotalCount ?? 0) : 0;

                statusCounts = new Dictionary<string, int>
                {
                    { "1", activeCount },
                    { "2", inactiveCount },
                    { "total", totalAllCount }
                };

                _cache.Set(countsCacheKey, statusCounts, TimeSpan.FromSeconds(10));
            }

            int totalAllCountVal = statusCounts["total"];

            var response = await _serviceAreaLaboral.ObtenerTodosAsync(pagina, 10, search, statusVal, cancellationToken);
            if (!response.Success)
            {
                return Json(new { success = false, message = response.Message });
            }

            var items = response.Data?.Items?.ToList() ?? new List<EmpCatAreaLaboralDto>();
            int totalCount = response.Data?.TotalCount ?? 0;

            return Json(new { 
                success = true, 
                data = items, 
                totalCount = totalCount,
                pageIndex = pagina,
                pageSize = 10,
                statusCounts = statusCounts,
                totalAllCount = totalAllCountVal
            });
        }

        private static object[] GetDefaultStatusItems() =>
        [
            new { id = 1, strValor = "Activo", strDescripcion = "Activo" },
            new { id = 2, strValor = "Inactivo", strDescripcion = "Inactivo" }
        ];

        // Registra una nueva área laboral verificando primero que el nombre no esté duplicado
        [HttpPost]
        public async Task<JsonResult> SaveAreaLaboral([FromBody] EmpCatAreaLaboralSaveDto model, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return Json(new { success = false, message = GetModelStateErrors() });
            }

            var exists = await _serviceAreaLaboral.ExistePorNombreAsync(
                model.StrValor.Trim(),
                null,
                cancellationToken);

            if (exists)
            {
                return Json(new { success = false, message = "El nombre del área laboral ya existe." });
            }

            var response = await _serviceAreaLaboral.CrearAsync(model, cancellationToken);
            if (!response.Success)
            {
                return Json(new { success = false, message = response.Message });
            }

            ClearCountsCache();
            return Json(new { success = true, data = response.Data });
        }

        // Actualiza un área laboral existente validando duplicidad con otros registros distintos del actual
        [HttpPost]
        public async Task<JsonResult> UpdateAreaLaboral([FromBody] EmpCatAreaLaboralEditDto model, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return Json(new { success = false, message = GetModelStateErrors() });
            }

            var exists = await _serviceAreaLaboral.ExistePorNombreAsync(
                model.StrValor.Trim(),
                model.Id,
                cancellationToken);

            if (exists)
            {
                return Json(new { success = false, message = "El nombre del área laboral ya existe." });
            }

            var saveModel = new EmpCatAreaLaboralSaveDto
            {
                StrValor = model.StrValor,
                StrDescripcion = model.StrDescripcion,
                IdCatStatus = model.IdCatStatus
            };

            var response = await _serviceAreaLaboral.ActualizarAsync(model.Id, saveModel, cancellationToken);
            if (!response.Success)
            {
                return Json(new { success = false, message = response.Message });
            }

            ClearCountsCache();
            return Json(new { success = true, data = response.Data });
        }

        // Elimina lógicamente/físicamente el área por ID y limpia la caché asociada
        [HttpPost]
        public async Task<JsonResult> DeleteAreaLaboral(int id, CancellationToken cancellationToken)
        {
            var response = await _serviceAreaLaboral.EliminarAsync(id, cancellationToken);
            if (!response.Success)
            {
                return Json(new { success = false, message = response.Message });
            }

            ClearCountsCache();
            return Json(new { success = true, data = response.Data });
        }

        private string GetModelStateErrors()
        {
            return string.Join(" ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
        }

        private void ClearCountsCache()
        {
            _cache.Remove("areaslaborales_counts_null");
            _cache.Remove("areaslaborales_counts_");
        }
    }
}
