    using Cavex.Principal.Models.CatSucursal;
    using Cavex.Principal.Services.Interfaces;
    using Microsoft.AspNetCore.Mvc;
    using Microsoft.Extensions.Caching.Memory;

    namespace Cavex.Principal.Controllers
    {
        public class SucursalesController : Controller
        {
            private readonly ISucursalesService _serviceSucursales;
            private readonly ICatStatusService _catStatusService;
            private readonly IMemoryCache _cache;
            private const string StatusCacheKey = "status_list";

            public SucursalesController(ISucursalesService serviceSucursales, ICatStatusService catStatusService, IMemoryCache cache)
            {
                _serviceSucursales = serviceSucursales;
                _catStatusService = catStatusService;
                _cache = cache;
            }

            public IActionResult Index(int pagina = 1)
            {
                ViewBag.PaginaActual = pagina;
                return View(new CatSucursalSaveDto());
            }

            [HttpGet]
            public async Task<JsonResult> GetSucursales(int pagina, string? search, string? status, CancellationToken cancellationToken)
            {
                if (pagina < 1) pagina = 1;
                int? statusVal = null;
                if (int.TryParse(status, out var parsedStatus))
                {
                    statusVal = parsedStatus;
                }

                var countsCacheKey = $"sucursales_counts_{search}";
                if (!_cache.TryGetValue(countsCacheKey, out Dictionary<string, int>? statusCounts))
                {
                    var allCountResponse = await _serviceSucursales.ObtenerTodosAsync(1, 1, search, null, cancellationToken);
                    int totalAllCount = allCountResponse.Success ? (allCountResponse.Data?.TotalCount ?? 0) : 0;

                    var activeCountResponse = await _serviceSucursales.ObtenerTodosAsync(1, 1, search, 1, cancellationToken);
                    int activeCount = activeCountResponse.Success ? (activeCountResponse.Data?.TotalCount ?? 0) : 0;

                    var inactiveCountResponse = await _serviceSucursales.ObtenerTodosAsync(1, 1, search, 2, cancellationToken);
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

                var response = await _serviceSucursales.ObtenerTodosAsync(pagina, 10, search, statusVal, cancellationToken);
                if (!response.Success)
                {
                    return Json(new { success = false, message = response.Message });
                }

                var items = response.Data?.Items?.ToList() ?? new List<CatSucursalDto>();
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

            private static object[] GetDefaultStatusItems() =>
            [
                new { id = 1, strValor = "Activo", strDescripcion = "Activo" },
                new { id = 2, strValor = "Inactivo", strDescripcion = "Inactivo" }
            ];

            [HttpPost]
            public async Task<JsonResult> SaveSucursal([FromBody] CatSucursalSaveDto model, CancellationToken cancellationToken)
            {
                if (!ModelState.IsValid)
                {
                    return Json(new { success = false, message = GetModelStateErrors() });
                }

                var exists = await _serviceSucursales.ExistePorNombreAsync(
                    model.StrValor.Trim(),
                    null,
                    cancellationToken);

                if (exists)
                {
                    return Json(new { success = false, message = "El nombre de la sucursal ya existe." });
                }

                var response = await _serviceSucursales.CrearAsync(model, cancellationToken);
                if (!response.Success)
                {
                    return Json(new { success = false, message = response.Message });
                }

                return Json(new { success = true, data = response.Data });
            }

            [HttpPost]
            public async Task<JsonResult> UpdateSucursal([FromBody] CatSucursalEditDto model, CancellationToken cancellationToken)
            {
                if (!ModelState.IsValid)
                {
                    return Json(new { success = false, message = GetModelStateErrors() });
                }

                var exists = await _serviceSucursales.ExistePorNombreAsync(
                    model.StrValor.Trim(),
                    model.Id,
                    cancellationToken);

                if (exists)
                {
                    return Json(new { success = false, message = "El nombre de la sucursal ya existe." });
                }

                var saveModel = new CatSucursalSaveDto
                {
                    StrValor = model.StrValor,
                    StrDescripcion = model.StrDescripcion,
                    IdCatStatus = model.IdCatStatus
                };

                var response = await _serviceSucursales.ActualizarAsync(model.Id, saveModel, cancellationToken);
                if (!response.Success)
                {
                    return Json(new { success = false, message = response.Message });
                }

                return Json(new { success = true, data = response.Data });
            }

            [HttpPost]
            public async Task<JsonResult> DeleteSucursal(int id, CancellationToken cancellationToken)
            {
                var response = await _serviceSucursales.EliminarAsync(id, cancellationToken);
                if (!response.Success)
                {
                    return Json(new { success = false, message = response.Message });
                }

                return Json(new { success = true, data = response.Data });
            }

            private string GetModelStateErrors()
            {
                return string.Join(" ", ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
            }
        }
    }
