using Cavex.Principal.Models.VehDaniosAccidentes;
using Cavex.Principal.Models.VehSeguro;
using Cavex.Principal.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Cavex.Principal.Controllers
{
    public class DaniosController : Controller
    {
        private readonly IVehDaniosAccidentesService _vehDaniosAccidentes;
        private readonly IVehSeguroService _vehSeguro;
        private readonly IVehDatosGeneralesService _vehDatosGenerales;
        private readonly IVehCatMarcaVehiculoService _vehCatMarcaVehiculo;
        private readonly IWebHostEnvironment _webHostEnvironment;

        public DaniosController(
            IVehDaniosAccidentesService vehDaniosAccidentes,
            IVehSeguroService vehSeguro,
            IVehDatosGeneralesService vehDatosGenerales,
            IVehCatMarcaVehiculoService vehCatMarcaVehiculo,
            IWebHostEnvironment webHostEnvironment)
        {
            _vehDaniosAccidentes = vehDaniosAccidentes;
            _vehSeguro = vehSeguro;
            _vehDatosGenerales = vehDatosGenerales;
            _vehCatMarcaVehiculo = vehCatMarcaVehiculo;
            _webHostEnvironment = webHostEnvironment;
        }

        // Pantalla frontend de daños y accidentes
        [HttpGet("/Danios")]
        [HttpGet("/Danios/DaniosAccidentes")]
        public IActionResult DaniosAccidentes()
        {
            return View("~/Views/Vehiculos/DaniosAccidentes.cshtml");
        }

        [HttpGet("/Danios/GetDanios")]
        public async Task<IActionResult> GetDanios(CancellationToken cancellationToken)
        {
            try
            {
                var response = await _vehDaniosAccidentes.ObtenerTodosAsync(cancellationToken);
                if (response == null || !response.Success) return Json(new { success = false, message = response?.Message ?? "Error al obtener daños." });
                return Json(new { success = true, data = response.Data?.Items ?? Enumerable.Empty<VehDaniosAccidentesDto>() });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("/Danios/GetSeguros")]
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

        [HttpPost("/Danios/DeleteDanio/{id}")]
        public async Task<IActionResult> DeleteDanio(int id, CancellationToken cancellationToken)
        {
            try
            {
                var response = await _vehDaniosAccidentes.EliminarAsync(id, cancellationToken);
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

        [HttpPost("/Danios/SaveDanio")]
        public async Task<IActionResult> SaveDanio([FromForm] VehDaniosAccidentesEditDto model, List<IFormFile>? EvidenciaArchivos, CancellationToken cancellationToken)
        {
            if (!model.BitCubiertoPorSeguro || model.IdVehSeguro <= 0)
            {
                model.IdVehSeguro = null;
            }

            if (!ModelState.IsValid)
            {
                var errors = ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage).ToList();
                return Json(new { success = false, message = string.Join(" ", errors) });
            }

            try
            {
                // 1. Obtener la marca, modelo y placa del vehículo para estructurar las carpetas físicamente
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

                string relativePath = $"/Vehiculos/{cleanBrand}/{cleanModel}/{cleanPlate}/Danios";
                string physicalPath = Path.Combine(_webHostEnvironment.WebRootPath, "Vehiculos", cleanBrand, cleanModel, cleanPlate, "Danios");

                // Recopilar urls de evidencias existentes (que vienen en model.StrUrlEvidencia)
                List<string> urlFotosList = new List<string>();
                if (!string.IsNullOrWhiteSpace(model.StrUrlEvidencia))
                {
                    urlFotosList.AddRange(model.StrUrlEvidencia.Split(';', StringSplitOptions.RemoveEmptyEntries));
                }

                // 3. Subir nuevos archivos
                if (EvidenciaArchivos != null && EvidenciaArchivos.Count > 0)
                {
                    if (!Directory.Exists(physicalPath))
                    {
                        Directory.CreateDirectory(physicalPath);
                    }

                    foreach (var file in EvidenciaArchivos)
                    {
                        if (file.Length > 0)
                        {
                            string extension = Path.GetExtension(file.FileName);
                            string uniqueFileName = $"{Guid.NewGuid()}{extension}";
                            string physicalFilePath = Path.Combine(physicalPath, uniqueFileName);

                            using (var stream = new FileStream(physicalFilePath, FileMode.Create))
                            {
                                await file.CopyToAsync(stream);
                            }

                            urlFotosList.Add($"{relativePath}/{uniqueFileName}");
                        }
                    }
                }

                if (model.Id > 0 && urlFotosList.Count == 0)
                {
                    var existingResponse = await _vehDaniosAccidentes.ObtenerPorIdAsync(model.Id, cancellationToken);
                    if (existingResponse != null && existingResponse.Success && existingResponse.Data != null && !string.IsNullOrWhiteSpace(existingResponse.Data.StrUrlEvidencia))
                    {
                        model.StrUrlEvidencia = existingResponse.Data.StrUrlEvidencia;
                    }
                    else
                    {
                        model.StrUrlEvidencia = string.Join(";", urlFotosList);
                    }
                }
                else
                {
                    model.StrUrlEvidencia = string.Join(";", urlFotosList);
                }

                if (model.Id > 0)
                {
                    var response = await _vehDaniosAccidentes.EditarAsync(model, cancellationToken);
                    return Json(new { success = response?.Success ?? false, message = response?.Message, data = response?.Data });
                }
                else
                {
                    var response = await _vehDaniosAccidentes.CrearAsync(model, cancellationToken);
                    return Json(new { success = response?.Success ?? false, message = response?.Message, data = response?.Data });
                }
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error al procesar los datos de daño: " + ex.Message });
            }
        }
    }
}
