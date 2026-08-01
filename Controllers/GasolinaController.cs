using Cavex.Principal.Models.VehControlGasolina;
using Cavex.Principal.Models.VehCatGasolineras;
using Cavex.Principal.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Cavex.Principal.Controllers
{
    public class GasolinaController : Controller
    {
        private readonly IVehControlGasolinaService _vehControlGasolina;
        private readonly IVehCatGasolinerasService _vehCatGasolineras;
        private readonly IVehDatosGeneralesService _vehDatosGenerales;
        private readonly IVehCatMarcaVehiculoService _vehCatMarcaVehiculo;
        private readonly IWebHostEnvironment _webHostEnvironment;

        public GasolinaController(
            IVehControlGasolinaService vehControlGasolina,
            IVehCatGasolinerasService vehCatGasolineras,
            IVehDatosGeneralesService vehDatosGenerales,
            IVehCatMarcaVehiculoService vehCatMarcaVehiculo,
            IWebHostEnvironment webHostEnvironment)
        {
            _vehControlGasolina = vehControlGasolina;
            _vehCatGasolineras = vehCatGasolineras;
            _vehDatosGenerales = vehDatosGenerales;
            _vehCatMarcaVehiculo = vehCatMarcaVehiculo;
            _webHostEnvironment = webHostEnvironment;
        }

        // Pantalla frontend de cargas de combustible
        [HttpGet("/Gasolina")]
        [HttpGet("/Gasolina/Gasolina")]
        public IActionResult Gasolina()
        {
            return View("~/Views/Vehiculos/Gasolina.cshtml");
        }

        // Pantalla de Agregar gasolineras
        [HttpGet("/Gasolina/Gasolineras/{id:int?}")]
        public IActionResult Gasolineras(int? id)
        {
            ViewBag.GasolineraId = id ?? 1;
            return View("~/Views/Vehiculos/Gasolineras.cshtml");
        }

        [HttpGet("/Gasolina/GetGasolinas")]
        public async Task<IActionResult> GetGasolinas(CancellationToken cancellationToken)
        {
            try
            {
                var response = await _vehControlGasolina.ObtenerTodosAsync(cancellationToken);
                if (response == null || !response.Success) return Json(new { success = false, message = response?.Message ?? "Error al obtener gasolina." });
                return Json(new { success = true, data = response.Data?.Items ?? Enumerable.Empty<VehControlGasolinaDto>() });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        private string CleanFolderName(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return "Desconocido";

            char[] invalidChars = Path.GetInvalidFileNameChars();
            string clean = string.Join("_", name.Split(invalidChars, StringSplitOptions.RemoveEmptyEntries));
            clean = clean.Replace(" ", "_").Replace("/", "_").Replace("\\", "_");
            return clean;
        }

        [HttpPost("/Gasolina/SaveGasolina")]
        public async Task<IActionResult> SaveGasolina([FromForm] VehControlGasolinaEditDto model, IFormFile? ComprobanteArchivo, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return Json(new { success = false, message = string.Join(" ", errors) });
            }

            try
            {
                if (ComprobanteArchivo != null && ComprobanteArchivo.Length > 0)
                {
                    // 1. Obtener la marca, modelo y placa del vehículo para estructurar la ruta
                    string brandName = "Desconocida";
                    string modelName = "Desconocido";
                    string plateName = "SinPlaca";

                    var vehResponse = await _vehDatosGenerales.ObtenerPorIdAsync(model.IdVehDatosGenerales, cancellationToken);
                    if (vehResponse != null && vehResponse.Success && vehResponse.Data != null)
                    {
                        modelName = vehResponse.Data.StrModelo;
                        plateName = vehResponse.Data.StrPlaca;

                        var marcaResponse = await _vehCatMarcaVehiculo.ObtenerPorIdAsync(vehResponse.Data.IdVehCatMarcaVehiculo, cancellationToken);
                        if (marcaResponse != null && marcaResponse.Success && marcaResponse.Data != null)
                        {
                            brandName = marcaResponse.Data.StrValor;
                        }
                    }

                    // 2. Sanitizar datos de ruta
                    string cleanBrand = CleanFolderName(brandName);
                    string cleanModel = CleanFolderName(modelName);
                    string cleanPlate = CleanFolderName(plateName);

                    string relativePath = $"/Vehiculos/{cleanBrand}/{cleanModel}/{cleanPlate}/Gasolina";
                    string physicalPath = Path.Combine(_webHostEnvironment.WebRootPath, "Vehiculos", cleanBrand, cleanModel, cleanPlate, "Gasolina");

                    if (!Directory.Exists(physicalPath))
                    {
                        Directory.CreateDirectory(physicalPath);
                    }

                    string extension = Path.GetExtension(ComprobanteArchivo.FileName);
                    string uniqueFileName = $"{Guid.NewGuid()}{extension}";
                    string physicalFilePath = Path.Combine(physicalPath, uniqueFileName);

                    using (var stream = new FileStream(physicalFilePath, FileMode.Create))
                    {
                        await ComprobanteArchivo.CopyToAsync(stream, cancellationToken);
                    }

                    model.StrUrlComprobantePago = $"{relativePath}/{uniqueFileName}";
                }
                else if (model.Id > 0 && string.IsNullOrWhiteSpace(model.StrUrlComprobantePago))
                {
                    var existingResponse = await _vehControlGasolina.ObtenerPorIdAsync(model.Id, cancellationToken);
                    if (existingResponse != null && existingResponse.Success && existingResponse.Data != null)
                    {
                        model.StrUrlComprobantePago = existingResponse.Data.StrUrlComprobantePago;
                    }
                }

                if (model.Id > 0)
                {
                    var response = await _vehControlGasolina.EditarAsync(model, cancellationToken);
                    return Json(new { success = response?.Success ?? false, message = response?.Message, data = response?.Data });
                }
                else
                {
                    var saveDto = new VehControlGasolinaSaveDto
                    {
                        IdVehDatosGenerales = model.IdVehDatosGenerales,
                        DteFechaCarga = model.DteFechaCarga,
                        MnyMontoPagado = model.MnyMontoPagado,
                        MnyPrecioLitro = model.MnyPrecioLitro,
                        DecKilometrajeActual = model.DecKilometrajeActual,
                        IdVehFormaPago = model.IdVehFormaPago,
                        StrUrlComprobantePago = model.StrUrlComprobantePago,
                        IdVehCatGasolineras = model.IdVehCatGasolineras,
                        IdEmpEmpleado = model.IdEmpEmpleado
                    };
                    var response = await _vehControlGasolina.CrearAsync(saveDto, cancellationToken);
                    return Json(new { success = response?.Success ?? false, message = response?.Message, data = response?.Data });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error al procesar gasolina: " + ex.Message });
            }
        }

        [HttpPost("/Gasolina/DeleteGasolina/{id}")]
        public async Task<IActionResult> DeleteGasolina(int id, CancellationToken cancellationToken)
        {
            try
            {
                var response = await _vehControlGasolina.EliminarAsync(id, cancellationToken);
                return Json(new { success = response?.Success ?? false, message = response?.Message });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("/Gasolina/Gasolineras/GetGasolineras")]
        public async Task<IActionResult> GetGasolineras(CancellationToken cancellationToken)
        {
            try
            {
                var response = await _vehCatGasolineras.ObtenerTodosAsync(cancellationToken);
                if (response == null || !response.Success) return Json(new { success = false, message = response?.Message ?? "Error al obtener gasolineras." });
                return Json(new { success = true, data = response.Data?.Items ?? Enumerable.Empty<VehCatGasolinerasDto>() });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("/Gasolina/Gasolineras/SaveGasolinera")]
        [HttpPost("/Gasolina/Gasolineras/Crear")]
        public async Task<IActionResult> SaveGasolinera([FromBody] VehCatGasolinerasSaveDto model, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return Json(new { success = false, message = string.Join(" ", errors) });
            }
            try
            {
                var response = await _vehCatGasolineras.CrearAsync(model, cancellationToken);
                return Json(new { success = response?.Success ?? false, message = response?.Message, data = response?.Data });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("/Gasolina/Gasolineras/UpdateGasolinera")]
        [HttpPost("/Gasolina/Gasolineras/Actualizar")]
        public async Task<IActionResult> UpdateGasolinera([FromBody] VehCatGasolinerasEditDto model, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return Json(new { success = false, message = string.Join(" ", errors) });
            }
            try
            {
                var response = await _vehCatGasolineras.EditarAsync(model, cancellationToken);
                return Json(new { success = response?.Success ?? false, message = response?.Message, data = response?.Data });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("/Gasolina/Gasolineras/DeleteGasolinera")]
        [HttpPost("/Gasolina/Gasolineras/Eliminar/{id?}")]
        public async Task<IActionResult> DeleteGasolinera(int id, CancellationToken cancellationToken)
        {
            try
            {
                var response = await _vehCatGasolineras.EliminarAsync(id, cancellationToken);
                return Json(new { success = response?.Success ?? false, message = response?.Message });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }
    }
}
