using Cavex.Principal.Models.VehCatTaller;
using Cavex.Principal.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace Cavex.Principal.Controllers
{
    public class TalleresController : Controller
    {
        private readonly IVehCatTallerService _service;
        private readonly ICatStatusService _catStatusService;
        private readonly IMemoryCache _cache;
        private const string CacheKey = "talleres_list";
        private const string StatusCacheKey = "talleres_status_list";

        public TalleresController(IVehCatTallerService service, ICatStatusService catStatusService, IMemoryCache cache)
        {
            _service = service;
            _catStatusService = catStatusService;
            _cache = cache;
        }

        public IActionResult Index()
        {
            return View();
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
                statusItems = new object[]
                {
                    new { id = 1, strValor = "Activo", strDescripcion = "Activo" },
                    new { id = 2, strValor = "Inactivo", strDescripcion = "Inactivo" }
                };
                _cache.Set(StatusCacheKey, statusItems, TimeSpan.FromSeconds(30));
                return Json(new { success = true, data = statusItems });
            }

            statusItems = response.Data.Items;
            _cache.Set(StatusCacheKey, statusItems, TimeSpan.FromMinutes(10));
            return Json(new { success = true, data = statusItems });
        }

        [HttpGet]
        public async Task<JsonResult> GetTalleres(int pagina = 1, int pageSize = 1000, string? search = null, int? status = null, CancellationToken cancellationToken = default)
        {
            if (pagina < 1) pagina = 1;
            if (pageSize < 1) pageSize = 1000;

            var response = await _service.ObtenerTodosAsync(pagina, pageSize, search, status, cancellationToken);
            if (!response.Success)
            {
                return Json(new { success = false, message = response.Message });
            }

            var items = response.Data?.Items?.ToList() ?? new List<VehCatTallerDto>();
            var totalCount = response.Data?.TotalCount ?? 0;

            return Json(new { success = true, data = items, totalCount = totalCount });
        }


        [HttpPost]
        public async Task<JsonResult> SaveTaller([FromBody] VehCatTallerSaveDto model, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();

                return Json(new
                {
                    success = false,
                    message = string.Join(" ", errors)
                });
            }

            var exists = await _service.ExistePorNombreAsync(
                model.StrValor.Trim(),
                null,
                cancellationToken);

            if (exists)
            {
                return Json(new
                {
                    success = false,
                    message = "El nombre del taller ya existe."
                });
            }

            var response = await _service.CrearAsync(model, cancellationToken);

            if (!response.Success)
            {
                return Json(new
                {
                    success = false,
                    message = response.Message
                });
            }

            return Json(new
            {
                success = true,
                data = response.Data
            });
        }

        [HttpPost]
        public async Task<JsonResult> UpdateTaller([FromBody] VehCatTallerEditDto model, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values
                    .SelectMany(v => v.Errors)
                    .Select(e => e.ErrorMessage)
                    .ToList();

                return Json(new
                {
                    success = false,
                    message = string.Join(" ", errors)
                });
            }

            var exists = await _service.ExistePorNombreAsync(
                model.StrValor.Trim(),
                model.Id,
                cancellationToken);

            if (exists) {
                return Json(new
                {
                    success = false,
                    message = "El nombre del taller ya existe."
                });
            }

            var response = await _service.EditarAsync(model, cancellationToken);
            if (!response.Success)
            {
                return Json(new { success = false, message = response.Message });
            }

            return Json(new { success = true, data = response.Data });

        }

        [HttpPost]
        public async Task<JsonResult> DeleteTaller(int id, CancellationToken cancellationToken)
        {
            var response = await _service.EliminarAsync(id, cancellationToken);
            if (!response.Success)
            {
                return Json(new { success = false, message = response.Message });
            }

            _cache.Remove(CacheKey);

            return Json(new { success = true, data = response.Data });
        }
    }
}