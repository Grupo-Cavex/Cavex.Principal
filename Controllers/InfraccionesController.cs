using Cavex.Principal.Models.VehInfracciones;
using Cavex.Principal.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Cavex.Principal.Controllers
{
    public class InfraccionesController : Controller
    {
        private readonly IVehInfraccionesService _vehInfracciones;
        private readonly IVehDatosGeneralesService _vehDatosGenerales;
        private readonly IVehCatMarcaVehiculoService _vehCatMarcaVehiculo;
        private readonly IWebHostEnvironment _webHostEnvironment;

        public InfraccionesController(
            IVehInfraccionesService vehInfracciones,
            IVehDatosGeneralesService vehDatosGenerales,
            IVehCatMarcaVehiculoService vehCatMarcaVehiculo,
            IWebHostEnvironment webHostEnvironment)
        {
            _vehInfracciones = vehInfracciones;
            _vehDatosGenerales = vehDatosGenerales;
            _vehCatMarcaVehiculo = vehCatMarcaVehiculo;
            _webHostEnvironment = webHostEnvironment;
        }

        // Pantalla frontend de Infracciones
        [HttpGet("/Infracciones")]
        [HttpGet("/Infracciones/Infracciones")]
        public IActionResult Infracciones()
        {
            return View("~/Views/Vehiculos/Infracciones.cshtml");
        }

        [HttpGet("/Infracciones/GetInfracciones")]
        public async Task<IActionResult> GetInfracciones(CancellationToken cancellationToken)
        {
            try
            {
                var response = await _vehInfracciones.ObtenerTodosAsync(cancellationToken);
                if (response == null || !response.Success) return Json(new { success = false, message = response?.Message ?? "Error al obtener infracciones." });
                return Json(new { success = true, data = response.Data?.Items ?? Enumerable.Empty<VehInfraccionesDto>() });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpPost("/Infracciones/DeleteInfraccion/{id}")]
        public async Task<IActionResult> DeleteInfraccion(int id, CancellationToken cancellationToken)
        {
            try
            {
                var response = await _vehInfracciones.EliminarAsync(id, cancellationToken);
                return Json(new { success = response?.Success ?? false, message = response?.Message });
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

        [HttpPost("/Infracciones/SaveInfraccion")]
        public async Task<IActionResult> SaveInfraccion([FromForm] VehInfraccionesEditDto model, IFormFile? ComprobanteArchivo, CancellationToken cancellationToken)
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
                    string brandName = "Desconocida";
                    string modelName = "Desconocido";
                    string plateName = "SinPlaca";

                    var vehResponse = await _vehDatosGenerales.ObtenerPorIdAsync(model.IdVehDatosGenerales, cancellationToken);
                    if (vehResponse != null && vehResponse.Success && vehResponse.Data != null)
                    {
                        modelName = vehResponse.Data.StrModelo;
                        plateName = vehResponse.Data.StrPlaca;

                        var marcaResponse = await _vehCatMarcaVehiculo.ObtenerPorIdAsync(vehResponse.Data.IdVehCatMarcaVehiculo);
                        if (marcaResponse != null && marcaResponse.Success && marcaResponse.Data != null)
                        {
                            brandName = marcaResponse.Data.StrValor;
                        }
                    }

                    // 2. Sanitizar datos de ruta
                    string cleanBrand = CleanFolderName(brandName);
                    string cleanModel = CleanFolderName(modelName);
                    string cleanPlate = CleanFolderName(plateName);

                    string relativePath = $"/Vehiculos/{cleanBrand}/{cleanModel}/{cleanPlate}/Infracciones";
                    string physicalPath = Path.Combine(_webHostEnvironment.WebRootPath, "Vehiculos", cleanBrand, cleanModel, cleanPlate, "Infracciones");

                    if (!Directory.Exists(physicalPath))
                    {
                        Directory.CreateDirectory(physicalPath);
                    }

                    string extension = Path.GetExtension(ComprobanteArchivo.FileName);
                    string uniqueFileName = $"{Guid.NewGuid()}{extension}";
                    string physicalFilePath = Path.Combine(physicalPath, uniqueFileName);

                    using (var stream = new FileStream(physicalFilePath, FileMode.Create))
                    {
                        await ComprobanteArchivo.CopyToAsync(stream);
                    }

                    model.StrUrlComprobantePago = $"{relativePath}/{uniqueFileName}";
                }
                else if (model.Id > 0 && string.IsNullOrWhiteSpace(model.StrUrlComprobantePago))
                {
                    var existingResponse = await _vehInfracciones.ObtenerPorIdAsync(model.Id, cancellationToken);
                    if (existingResponse != null && existingResponse.Success && existingResponse.Data != null)
                    {
                        model.StrUrlComprobantePago = existingResponse.Data.StrUrlComprobantePago;
                    }
                }

                if (model.Id > 0)
                {
                    var response = await _vehInfracciones.EditarAsync(model, cancellationToken);
                    return Json(new { success = response?.Success ?? false, message = response?.Message, data = response?.Data });
                }
                else
                {
                    var response = await _vehInfracciones.CrearAsync(model, cancellationToken);
                    return Json(new { success = response?.Success ?? false, message = response?.Message, data = response?.Data });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error al procesar infracción: " + ex.Message });
            }
        }
    }
}
