using Cavex.Principal.Enums;
using Cavex.Principal.Models.VehiculoListado;
using Cavex.Principal.Models.VehCatColor;
using Cavex.Principal.Models.VehCatCapacidad;
using Cavex.Principal.Models.VehCatMarcaVehiculo;
using Cavex.Principal.Models.VehCatTipoCombustible;
using Cavex.Principal.Models.VehCatTipoVehiculo;
using Cavex.Principal.Models.VehCatTransmision;
using Cavex.Principal.Models.VehDatosGenerales;
using Cavex.Principal.Models.Vehiculo;
using Cavex.Principal.Models.VehCatStatus;
using Cavex.Principal.Models.VehCatAseguradora;
using Cavex.Principal.Models.VehCatGasolineras;
using Cavex.Principal.Models.VehCatFormaPago;
using Cavex.Principal.Models.VehCatMarcaLlanta;
using Cavex.Principal.Models.VehCatPosicionLlanta;
using Cavex.Principal.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;

namespace Cavex.Principal.Controllers
{
    public class VehiculosController : Controller
    {
        private readonly IVehiculoListadoService _vehiculoListadoService;
        private readonly IVehCatColorService _vehCatColorService;
        private readonly IVehCatMarcaVehiculoService _vehCatMarcaVehiculo;
        private readonly IVehCatTipoVehiculoService _vehCatTipoVehiculo;
        private readonly IVehCatCapacidadService _vehCatCapacidad;
        private readonly IVehCatTipoCombustibleService _vehCatTipoCombustible;
        private readonly IVehCatTransmisionService _vehCatTransmisionService;
        private readonly IVehCatStatusService _vehCatStatusService;
        private readonly IVehDatosGeneralesService _vehDatosGenerales;
        private readonly IVehCatGasolinerasService _vehCatGasolineras;
        private readonly IVehCatAseguradoraService _vehCatAseguradora;
        private readonly IVehCatFormaPagoService _vehCatFormaPago;
        private readonly IVehCatMarcaLlantaService _vehCatMarcaLlanta;
        private readonly IVehCatPosicionLlantaService _vehCatPosicionLlanta;
        private readonly IWebHostEnvironment _webHostEnvironment;
        private readonly Microsoft.Extensions.Caching.Memory.IMemoryCache _cache;
        private const string VehiculosCacheKey = "vehiculos_list_cache";
        private const string VehiculosCatalogosCacheKey = "vehiculos_catalogos_cache";

        public VehiculosController(
            IVehiculoListadoService vehiculoListadoService,
            IVehCatMarcaVehiculoService vehCatMarcaVehiculo, 
            IVehCatColorService vehCatColorService, 
            IVehCatTipoVehiculoService vehCatTipoVehiculo, 
            IVehCatCapacidadService vehCatCapacidad, 
            IVehCatTipoCombustibleService vehCatTipoCombustible, 
            IVehCatTransmisionService vehCatTransmisionService,
            IVehCatStatusService vehCatStatusService,
            IVehDatosGeneralesService vehDatosGenerales,
            IVehCatGasolinerasService vehCatGasolineras,
            IVehCatAseguradoraService vehCatAseguradora,
            IVehCatFormaPagoService vehCatFormaPago,
            IVehCatMarcaLlantaService vehCatMarcaLlanta,
            IVehCatPosicionLlantaService vehCatPosicionLlanta,
            IWebHostEnvironment webHostEnvironment,
            Microsoft.Extensions.Caching.Memory.IMemoryCache cache)
        {
            _vehiculoListadoService = vehiculoListadoService;
            _vehCatMarcaVehiculo = vehCatMarcaVehiculo;
            _vehCatColorService = vehCatColorService;
            _vehCatTipoVehiculo = vehCatTipoVehiculo;
            _vehCatCapacidad = vehCatCapacidad;
            _vehCatTipoCombustible = vehCatTipoCombustible;
            _vehCatTransmisionService = vehCatTransmisionService;
            _vehCatStatusService = vehCatStatusService;
            _vehDatosGenerales = vehDatosGenerales;
            _vehCatGasolineras = vehCatGasolineras;
            _vehCatAseguradora = vehCatAseguradora;
            _vehCatFormaPago = vehCatFormaPago;
            _vehCatMarcaLlanta = vehCatMarcaLlanta;
            _vehCatPosicionLlanta = vehCatPosicionLlanta;
            _webHostEnvironment = webHostEnvironment;
            _cache = cache;
        }

        [HttpGet("/Vehiculos")]
        [HttpGet("/Vehiculos/Index")]
        public IActionResult Index()
        {
            return View();
        }

        [HttpGet]
        public IActionResult Create()
        {
            return View();
        }

        // Pantalla de detalle de vehículo
        [HttpGet("/Vehiculos/Detalle/{id:int?}")]
        public IActionResult Detalle(int? id)
        {
            ViewBag.VehiculoId = id ?? 1;
            return View();
        }

        #region endpoints de consumo general para la vista (vehiculos y catalogos)

        [HttpGet("/Vehiculos/GetVehiculoListado")]
        public async Task<IActionResult> GetVehiculoListado(
        int pageIndex = 1,
        int pageSize = 10,
        string? search = null,
        int? idVehCatStatus = null,
        CancellationToken cancellationToken = default)
        {
            try
            {
                var response = await _vehiculoListadoService.ObtenerTodosAsync(
                    pageIndex,
                    pageSize,
                    search,
                    idVehCatStatus,
                    cancellationToken);

                if (response == null || !response.Success)
                {
                    return Json(new
                    {
                        success = false,
                        message = response?.Message ?? "No fue posible obtener el listado de vehiculos."
                    });
                }

                return Json(new { success = true, data = response.Data });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpGet("/Vehiculos/GetVehiculosDropdown")]
        public async Task<IActionResult> GetVehiculosDropdown(
        int pageIndex = 1,
        int pageSize = 10,
        string? search = null,
        int? idVehCatStatus = null,
        CancellationToken cancellationToken = default)
        {
            var response = await _vehiculoListadoService.ObtenerTodosAsync(
                pageIndex,
                pageSize,
                search,
                idVehCatStatus,
                cancellationToken);

            if (response == null || !response.Success || response.Data == null)
            {
                return Json(new
                {
                    success = false,
                    message = response?.Message ?? "No fue posible obtener vehiculos."
                });
            }

            return Json(new
            {
                success = true,
                data = response.Data
            });
        }

        [HttpGet("/Vehiculos/GetVehiculoListado/{id:int}")]
        public async Task<IActionResult> GetVehiculoListadoById(
            int id,
            CancellationToken cancellationToken)
        {
            var response = await _vehiculoListadoService.ObtenerPorIdAsync(id, cancellationToken);

            if (response == null || !response.Success || response.Data == null)
            {
                return Json(new
                {
                    success = false,
                    message = response?.Message ?? "No fue posible obtener el vehiculo."
                });
            }

            return Json(new
            {
                success = true,
                data = response.Data
            });
        }

        [HttpPost("/Vehiculos/DeleteVehiculo")]
        public async Task<IActionResult> DeleteVehiculo(int id, CancellationToken cancellationToken)
        {
            var response = await _vehDatosGenerales.EliminarAsync(id, cancellationToken);
            if (!response.Success)
            {
                return Json(new { success = false, message = response.Message });
            }
            _cache.Remove(VehiculosCacheKey);
            return Json(new { success = true });
        }

        [HttpPost("/Vehiculos/UpdateVehiculoStatus")]
        public async Task<IActionResult> UpdateVehiculoStatus(int id, int idStatus, CancellationToken cancellationToken)
        {
            var existingResponse = await _vehDatosGenerales.ObtenerPorIdAsync(id, cancellationToken);
            if (!existingResponse.Success || existingResponse.Data == null)
            {
                return Json(new { success = false, message = "No se encontró el vehículo." });
            }
            var v = existingResponse.Data;
            VehDatosGeneralesEditDto editDto = new VehDatosGeneralesEditDto
            {
                Id = v.Id,
                StrNumSerie = v.StrNumSerie,
                IdVehCatMarcaVehiculo = v.IdVehCatMarcaVehiculo,
                StrModelo = v.StrModelo,
                IntAnio = v.IntAnio,
                StrVersion = v.StrVersion,
                IdVehCatColor = v.IdVehCatColor,
                StrPlaca = v.StrPlaca,
                StrNumMotor = v.strNumMotor,
                IdVehCatTipoVehiculo = v.IdVehCatTipoVehiculo,
                IdVehCatCapacidad = v.IdVehCatCapacidad,
                IdVehCatTipoCombustible = v.IdVehCatTipoCombustible,
                DecKilometrajeActual = v.DecKilometrajeActual,
                IdVehCatStatus = idStatus,
                StrUrlFoto = v.StrUrlFoto,
                DteFechaAsignacion = v.DteFechaAsignacion,
                StrObservaciones = v.StrObservaciones,
                StrMotor = v.StrMotor,
                IdVehCatTransmision = v.IdVehCatTransmision
            };
            var apiResult = await _vehDatosGenerales.EditarAsync(editDto, cancellationToken);
            if (apiResult.Success)
            {
                _cache.Remove(VehiculosCacheKey);
                return Json(new { success = true });
            }
            return Json(new { success = false, message = apiResult.Message ?? "No se pudo actualizar el estatus." });
        }

        /// <summary>
        /// Obtiene y consolida todos los catálogos satélite vehiculares (marcas, colores, tipos, capacidades, 
        /// combustibles, transmisiones, aseguradoras, gasolineras, formas de pago y llantas) en un solo
        /// endpoint consolidado para optimizar las peticiones de inicialización del frontend.
        /// </summary>
        /// <param name="cancellationToken">Token de cancelación de la operación.</param>
        /// <returns>Resultado JSON consolidado de todos los catálogos vehiculares.</returns>
        [HttpGet("/Vehiculos/GetVehiculoCatalogos")]
        public async Task<IActionResult> GetVehiculoCatalogos(CancellationToken cancellationToken)
        {
            try
            {
                if (!_cache.TryGetValue(VehiculosCatalogosCacheKey, out object? cachedCatalogos) || cachedCatalogos == null)
                {
                    var marcas = await _vehCatMarcaVehiculo.ObtenerTodosAsync(1, 100, null, cancellationToken);
                    var colors = await _vehCatColorService.ObtenerTodosAsync(1, 100, null, cancellationToken);
                    var tipos = await _vehCatTipoVehiculo.ObtenerTodosAsync(1, 100, null, cancellationToken);
                    var capacidades = await _vehCatCapacidad.ObtenerTodosAsync(1, 100, null, cancellationToken);
                    var combustibles = await _vehCatTipoCombustible.ObtenerTodosAsync(1, 100, null, cancellationToken);
                    var transmisiones = await _vehCatTransmisionService.ObtenerTodosAsync(1, 100, null, cancellationToken);
                    var aseguradoras = await _vehCatAseguradora.ObtenerTodosAsync(cancellationToken);
                    var gasolineras = await _vehCatGasolineras.ObtenerTodosAsync(cancellationToken);
                    var formasPago = await _vehCatFormaPago.ObtenerTodosAsync(cancellationToken);
                    var marcasLlanta = await _vehCatMarcaLlanta.ObtenerTodosAsync(cancellationToken);
                    var posicionesLlanta = await _vehCatPosicionLlanta.ObtenerTodosAsync(cancellationToken);
                    var statusList = await _vehCatStatusService.ObtenerTodosAsync(cancellationToken);

                    cachedCatalogos = new
                    {
                        idVehCatMarcaVehiculo = marcas?.Data?.Items ?? Enumerable.Empty<VehCatMarcaVehiculoDto>(),
                        idVehCatColor = colors?.Data?.Items ?? Enumerable.Empty<VehCatColorDto>(),
                        idVehCatTipoVehiculo = tipos?.Data?.Items ?? Enumerable.Empty<VehCatTipoVehiculoDto>(),
                        idVehCatCapacidad = capacidades?.Data?.Items ?? Enumerable.Empty<VehCatCapacidadDto>(),
                        idVehCatTipoCombustible = combustibles?.Data?.Items ?? Enumerable.Empty<VehCatTipoCombustibleDto>(),
                        idVehCatTransmision = transmisiones?.Data?.Items ?? Enumerable.Empty<VehCatTransmisionDto>(),
                        idVehCatStatus = statusList?.Data?.Items ?? Enumerable.Empty<VehCatStatusDto>(),
                        idVehCatAseguradora = aseguradoras?.Data?.Items ?? Enumerable.Empty<VehCatAseguradoraDto>(),
                        idVehCatGasolineras = gasolineras?.Data?.Items ?? Enumerable.Empty<VehCatGasolinerasDto>(),
                        idVehCatFormaPago = formasPago?.Data?.Items ?? Enumerable.Empty<VehCatFormaPagoDto>(),
                        idVehCatMarcaLlanta = marcasLlanta?.Data?.Items ?? Enumerable.Empty<VehCatMarcaLlantaDto>(),
                        idVehCatPosicionLlanta = (IEnumerable<VehCatPosicionLlantaDto>?)posicionesLlanta?.Data?.Items ?? Enumerable.Empty<VehCatPosicionLlantaDto>(),
                    };

                    _cache.Set(VehiculosCatalogosCacheKey, cachedCatalogos, TimeSpan.FromMinutes(30));
                }

                return Json(new { success = true, data = cachedCatalogos });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        #endregion

        #region Insertar datos del formulario con subida física de imagen
        
        private string CleanFolderName(string name)
        {
            if (string.IsNullOrWhiteSpace(name))
                return "Desconocido";

            char[] invalidChars = Path.GetInvalidFileNameChars();
            string clean = string.Join("_", name.Split(invalidChars, StringSplitOptions.RemoveEmptyEntries));
            clean = clean.Replace(" ", "_").Replace("/", "_").Replace("\\", "_");
            return clean;
        }

        [HttpPost("/Vehiculos/SaveVehiculo")]
        public async Task<IActionResult> SaveVehiculo([FromForm] VehiculoManagerSaveDto managerSaveDto, IFormFile? FotoArchivo, CancellationToken cancellationToken)
        {
            if (managerSaveDto != null)
            {
                bool isEdit = managerSaveDto.Id.HasValue && managerSaveDto.Id.Value > 0;
                VehDatosGeneralesDto? existingVehiculo = null;

                if (isEdit)
                {
                    var existingResponse = await _vehDatosGenerales.ObtenerPorIdAsync(managerSaveDto.Id.Value, cancellationToken);
                    if (!existingResponse.Success || existingResponse.Data == null)
                    {
                        return NotFound(new { success = false, message = "No se encontró el vehículo a editar." });
                    }
                    existingVehiculo = existingResponse.Data;
                }

                // 1. Obtener la marca textual para la carpeta
                string brandName = "Desconocida";
                if (managerSaveDto.VehCatMarcaVehiculo != null)
                {
                    var marcaResponse = await _vehCatMarcaVehiculo.ObtenerPorIdAsync(managerSaveDto.VehCatMarcaVehiculo.Id);
                    if (marcaResponse.Success && marcaResponse.Data != null)
                    {
                        brandName = marcaResponse.Data.StrValor;
                    }
                }

                // 2. Sanitizar datos de ruta
                string cleanBrand = CleanFolderName(brandName);
                string cleanModel = CleanFolderName(managerSaveDto.StrModelo);
                string cleanPlate = CleanFolderName(managerSaveDto.StrPlaca);

                string relativePath = $"/Vehiculos/{cleanBrand}/{cleanModel}/{cleanPlate}";
                string physicalPath = Path.Combine(_webHostEnvironment.WebRootPath, "Vehiculos", cleanBrand, cleanModel, cleanPlate);

                string urlFoto = string.Empty;

                // 3. Subir archivo
                if (FotoArchivo != null && FotoArchivo.Length > 0)
                {
                    if (!Directory.Exists(physicalPath))
                    {
                        Directory.CreateDirectory(physicalPath);
                    }

                    string extension = Path.GetExtension(FotoArchivo.FileName);
                    string uniqueFileName = $"{Guid.NewGuid()}{extension}";
                    string physicalFilePath = Path.Combine(physicalPath, uniqueFileName);

                    using (var stream = new FileStream(physicalFilePath, FileMode.Create))
                    {
                        await FotoArchivo.CopyToAsync(stream);
                    }

                    urlFoto = $"{relativePath}/{uniqueFileName}";

                    // Si es edición, eliminar la foto anterior para no dejar basura
                    if (isEdit && existingVehiculo != null && !string.IsNullOrWhiteSpace(existingVehiculo.StrUrlFoto))
                    {
                        string oldPhysicalPath = Path.Combine(_webHostEnvironment.WebRootPath, existingVehiculo.StrUrlFoto.TrimStart('/'));
                        if (System.IO.File.Exists(oldPhysicalPath))
                        {
                            try { System.IO.File.Delete(oldPhysicalPath); } catch { }
                        }
                    }
                }
                else
                {
                    if (isEdit && existingVehiculo != null)
                    {
                        urlFoto = existingVehiculo.StrUrlFoto;
                    }
                    else
                    {
                        return BadRequest(new { success = false, message = "La foto del vehículo es obligatoria." });
                    }
                }

                // 4. Guardar o Actualizar en BD
                if (isEdit && existingVehiculo != null)
                {
                    VehDatosGeneralesEditDto editDto = new VehDatosGeneralesEditDto
                    {
                        Id = managerSaveDto.Id.Value,
                        StrNumSerie = managerSaveDto.StrNumeroSerie ?? string.Empty,
                        IdVehCatMarcaVehiculo = managerSaveDto.VehCatMarcaVehiculo?.Id ?? 0,
                        StrModelo = managerSaveDto.StrModelo,
                        IntAnio = managerSaveDto.IntAnio,
                        StrVersion = managerSaveDto.StrVersion,
                        IdVehCatColor = managerSaveDto.VehCatColorDto?.Id ?? 0,
                        StrPlaca = managerSaveDto.StrPlaca,
                        StrNumMotor = managerSaveDto.StrNumMotor,
                        IdVehCatTipoVehiculo = managerSaveDto.VehCatTipoVehiculo?.Id ?? 0,
                        IdVehCatCapacidad = managerSaveDto.VehCatCapacidad?.Id ?? 0,
                        IdVehCatTipoCombustible = managerSaveDto.VehCatTipoCombustibleDto?.Id ?? 0,
                        DecKilometrajeActual = managerSaveDto.DecKilometrajeActual,
                        IdVehCatStatus = existingVehiculo.IdVehCatStatus, // Conserva el estatus actual
                        StrUrlFoto = urlFoto,
                        DteFechaAsignacion = existingVehiculo.DteFechaAsignacion, // Conserva la fecha de registro original
                        StrObservaciones = managerSaveDto.StrDescripcion,
                        StrMotor = managerSaveDto.StrNumMotor,
                        IdVehCatTransmision = managerSaveDto.VehCatTransmisionDto?.Id ?? 0
                    };

                    var apiResult = await _vehDatosGenerales.EditarAsync(editDto, cancellationToken);
                    if (apiResult.Success)
                    {
                        _cache.Remove(VehiculosCacheKey);
                        return Ok(new { success = true, message = "Vehículo actualizado correctamente." });
                    }
                    else
                    {
                        return BadRequest(new { success = false, message = apiResult.Message ?? "No se pudieron actualizar los datos." });
                    }
                }
                else
                {
                    VehDatosGeneralesSaveDto saveDto = new VehDatosGeneralesSaveDto
                    {
                        StrNumSerie = managerSaveDto.StrNumeroSerie ?? string.Empty,
                        IdVehCatMarcaVehiculo = managerSaveDto.VehCatMarcaVehiculo?.Id ?? 0,
                        StrModelo = managerSaveDto.StrModelo,
                        IntAnio = managerSaveDto.IntAnio,
                        StrVersion = managerSaveDto.StrVersion,
                        IdVehCatColor = managerSaveDto.VehCatColorDto?.Id ?? 0,
                        StrPlaca = managerSaveDto.StrPlaca,
                        StrNumMotor = managerSaveDto.StrNumMotor,
                        IdVehCatTipoVehiculo = managerSaveDto.VehCatTipoVehiculo?.Id ?? 0,
                        IdVehCatCapacidad = managerSaveDto.VehCatCapacidad?.Id ?? 0,
                        IdVehCatTipoCombustible = managerSaveDto.VehCatTipoCombustibleDto?.Id ?? 0,
                        DecKilometrajeActual = managerSaveDto.DecKilometrajeActual,
                        IdVehCatStatus = (int)EnumStatus.Activo,
                        StrUrlFoto = urlFoto,
                        DteFechaAsignacion = DateOnly.FromDateTime(DateTime.Now),
                        StrObservaciones = managerSaveDto.StrDescripcion,
                        StrMotor = managerSaveDto.StrNumMotor,
                        IdVehCatTransmision = managerSaveDto.VehCatTransmisionDto?.Id ?? 0
                    };

                    var apiResult = await _vehDatosGenerales.CrearAsync(saveDto, cancellationToken);
                    if (apiResult.Success || apiResult.StatusCode == System.Net.HttpStatusCode.Created)
                    {
                        _cache.Remove(VehiculosCacheKey);
                        return Ok(new { success = true, message = "Vehículo guardado correctamente." });
                    }
                    else
                    {
                        // Si falló, eliminar archivo subido
                        if (!string.IsNullOrEmpty(urlFoto) && System.IO.File.Exists(Path.Combine(physicalPath, Path.GetFileName(urlFoto))))
                        {
                            try { System.IO.File.Delete(Path.Combine(physicalPath, Path.GetFileName(urlFoto))); } catch { }
                        }
                        return BadRequest(new { success = false, message = apiResult.Message ?? "No se pudieron guardar los datos." });
                    }
                }
            }

            return BadRequest(new { success = false, message = "No se pudieron guardar los datos de forma correcta." });
        }

        #endregion
    }
}
