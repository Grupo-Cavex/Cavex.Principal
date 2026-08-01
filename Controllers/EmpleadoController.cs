using Cavex.Principal.Models.EmpEmpleado;
using Cavex.Principal.Services.Interfaces;
using Cavex.Principal.ViewModels;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Caching.Memory;
using Microsoft.AspNetCore.Hosting;
using System.Text.Json;
using Microsoft.AspNetCore.Http;
using System.Threading.Tasks;
using System.Linq;
using System.IO;
using System;

namespace Cavex.Principal.Controllers
{
    public class EmpleadoController : Controller
    {
        private readonly IEmpEmpleadoService _service;
        private readonly Cavex.Principal.ApiClients.EmpCatColonia.IEmpCatColoniaApi _coloniaApi;
        private readonly Cavex.Principal.ApiClients.ICavexGeneralCatalogApi _catalogApi;
        private readonly ICatStatusService _statusService;
        private readonly IMemoryCache _cache;
        private readonly IWebHostEnvironment _webHostEnvironment;

        public EmpleadoController(
            IEmpEmpleadoService service,
            Cavex.Principal.ApiClients.EmpCatColonia.IEmpCatColoniaApi coloniaApi,
            Cavex.Principal.ApiClients.ICavexGeneralCatalogApi catalogApi,
            ICatStatusService statusService,
            IMemoryCache cache,
            IWebHostEnvironment webHostEnvironment)
        {
            _service = service;
            _coloniaApi = coloniaApi;
            _catalogApi = catalogApi;
            _statusService = statusService;
            _cache = cache;
            _webHostEnvironment = webHostEnvironment;
        }

        [HttpGet]
        public async Task<IActionResult> GetColonias(string? search, CancellationToken cancellationToken)
        {
            try
            {
                var pageSize = string.IsNullOrWhiteSpace(search) ? 15 : 100;
                var response = await _coloniaApi.GetAllAsync(1, pageSize, search, cancellationToken);
                if (response == null || !response.Success)
                {
                    return Json(new { success = false, message = response?.Message ?? "No se pudieron obtener las colonias." });
                }
                return Json(new { success = true, data = response.Data?.Items });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetColonia(int id, CancellationToken cancellationToken)
        {
            try
            {
                var response = await _coloniaApi.GetByIdAsync(id, cancellationToken);
                if (response == null || !response.Success)
                {
                    return Json(new { success = false, message = response?.Message ?? "No se pudo obtener la colonia." });
                }
                return Json(new { success = true, data = response.Data });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetGeneros(CancellationToken cancellationToken)
        {
            try
            {
                var response = await _catalogApi.GetGenerosAsync(1, 100, cancellationToken);
                if (response == null || !response.Success)
                {
                    return Json(new { success = false, message = response?.Message ?? "No se pudieron obtener los géneros." });
                }
                return Json(new { success = true, data = response.Data?.Items });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetEstadosCiviles(CancellationToken cancellationToken)
        {
            try
            {
                var response = await _catalogApi.GetEstadosCivilesAsync(1, 100, cancellationToken);
                if (response == null || !response.Success)
                {
                    return Json(new { success = false, message = response?.Message ?? "No se pudieron obtener los estados civiles." });
                }
                return Json(new { success = true, data = response.Data?.Items });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetNacionalidades(CancellationToken cancellationToken)
        {
            try
            {
                var response = await _catalogApi.GetNacionalidadesAsync(1, 100, cancellationToken);
                if (response == null || !response.Success)
                {
                    return Json(new { success = false, message = response?.Message ?? "No se pudieron obtener las nacionalidades." });
                }
                return Json(new { success = true, data = response.Data?.Items });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public async Task<IActionResult> GetStatus(CancellationToken cancellationToken)
        {
            var response = await _statusService.ObtenerTodosAsync(cancellationToken);
            if (!response.Success)
            {
                return Json(new { success = false, message = response.Message });
            }
            return Json(new { success = true, data = response.Data?.Items });
        }

        public IActionResult Index(int pagina = 1)
        {
            ViewBag.PaginaActual = pagina;
            return View();
        }

        [HttpGet]
        public IActionResult Details(int id)
        {
            ViewBag.EmpleadoId = id;
            return View();
        }

        [HttpGet]
        public IActionResult Create()
        {
            return View(new CreateViewModel());
        }

        [HttpGet]
        public async Task<IActionResult> GetEmpleados(int pagina, string? search, string? status, CancellationToken cancellationToken)
        {
            if (pagina < 1) pagina = 1;
            if (string.IsNullOrWhiteSpace(search)) search = null;

            int? statusVal = null;
            if (status == "activos") statusVal = 1;
            else if (status == "inactivos" || status == "baja") statusVal = 2;

            var countsCacheKey = $"empleados_counts_{search}";
            if (!_cache.TryGetValue(countsCacheKey, out Dictionary<string, int>? statusCounts))
            {
                var allCountResponse = await _service.ObtenerTodosAsync(1, 1, search, null, cancellationToken);
                int totalAllCount = allCountResponse.Success ? (allCountResponse.Data?.TotalCount ?? 0) : 0;

                var activeCountResponse = await _service.ObtenerTodosAsync(1, 1, search, 1, cancellationToken);
                int activeCount = activeCountResponse.Success ? (activeCountResponse.Data?.TotalCount ?? 0) : 0;

                var inactiveCountResponse = await _service.ObtenerTodosAsync(1, 1, search, 2, cancellationToken);
                int inactiveCount = inactiveCountResponse.Success ? (inactiveCountResponse.Data?.TotalCount ?? 0) : 0;

                statusCounts = new Dictionary<string, int>
                {
                    { "total", totalAllCount },
                    { "active", activeCount },
                    { "inactive", inactiveCount }
                };

                _cache.Set(countsCacheKey, statusCounts, TimeSpan.FromSeconds(10));
            }

            int totalAllCountVal = statusCounts["total"];
            int activeCountVal = statusCounts["active"];
            int inactiveCountVal = statusCounts["inactive"];

            var response = await _service.ObtenerTodosAsync(pagina, 10, search, statusVal, cancellationToken);
            if (!response.Success)
            {
                return Json(new { success = false, message = response.Message });
            }

            var itemsList = response.Data?.Items?.ToList() ?? new List<EmpEmpleadoDto>();
            int totalCountVal = response.Data?.TotalCount ?? itemsList.Count;

            // Si la página solicitada excede los registros existentes y devuelve 0 elementos pero hay registros, recuperar página 1
            if (pagina > 1 && itemsList.Count == 0 && totalCountVal > 0)
            {
                pagina = 1;
                var pageOneResponse = await _service.ObtenerTodosAsync(1, 10, search, statusVal, cancellationToken);
                if (pageOneResponse.Success && pageOneResponse.Data != null)
                {
                    itemsList = pageOneResponse.Data.Items?.ToList() ?? new List<EmpEmpleadoDto>();
                    totalCountVal = pageOneResponse.Data.TotalCount;
                }
            }

            return Json(new { 
                success = true, 
                data = itemsList, 
                totalCount = totalCountVal,
                pageIndex = pagina,
                pageSize = 10,
                totalAllCount = totalAllCountVal,
                activeCount = activeCountVal,
                inactiveCount = inactiveCountVal
            });
        }

        /// <summary>
        /// Obtiene el listado general de empleados con un límite ampliado (1000 registros) 
        /// para poblar selectores (dropdowns) en el frontend sin paginación restrictiva.
        /// </summary>
        /// <param name="cancellationToken">Token de cancelación de la operación.</param>
        /// <returns>Resultado JSON con el listado de empleados obtenidos.</returns>
        [HttpGet("/Empleado/GetEmpleadosDropdown")]
        public async Task<IActionResult> GetEmpleadosDropdown(CancellationToken cancellationToken)
        {
            var response = await _service.ObtenerTodosAsync(1, 1000, null, 1, cancellationToken);
            if (!response.Success)
            {
                return Json(new { success = false, message = response.Message });
            }
            return Json(new { success = true, data = response.Data?.Items });
        }

        [HttpGet]
        public async Task<IActionResult> GetEmpleado(int id, CancellationToken cancellationToken)
        {
            var response = await _service.ObtenerPorIdAsync(id, cancellationToken);
            if (!response.Success)
            {
                return Json(new { success = false, message = response.Message });
            }

            if (response.Data != null)
            {
                string? photoUrl = response.Data.EmpDocumentosLaborales?.StrUrlFotoEmp;
                if (string.IsNullOrWhiteSpace(photoUrl) || photoUrl == "N/D" || photoUrl == "Foto Empleado")
                {
                    string curp = CleanFolderName(response.Data.StrCurp);
                    string photoFolder = Path.Combine(_webHostEnvironment.WebRootPath, "uploads", "empleados", curp, "foto");
                    if (Directory.Exists(photoFolder))
                    {
                        var files = Directory.GetFiles(photoFolder)
                            .OrderByDescending(f => System.IO.File.GetLastWriteTime(f))
                            .ToList();
                        if (files.Any())
                        {
                            string latestFile = Path.GetFileName(files.First());
                            string relPath = $"/uploads/empleados/{curp}/foto/{latestFile}";
                            if (response.Data.EmpDocumentosLaborales == null)
                            {
                                response.Data.EmpDocumentosLaborales = new Models.EmpDocumentosLaborales.EmpDocumentosLaboralesDto();
                            }
                            response.Data.EmpDocumentosLaborales.StrUrlFotoEmp = relPath;
                        }
                    }
                }
            }

            return Json(new { success = true, data = response.Data });
        }

        private string CleanFolderName(string name)
        {
            if (string.IsNullOrWhiteSpace(name)) return "General";
            return string.Concat(name.Split(Path.GetInvalidFileNameChars())).Replace(" ", "_").Trim();
        }

        private async Task<string> SaveFileAsync(IFormFile file, string folder, string filePrefix)
        {
            var uploadsFolder = Path.Combine(_webHostEnvironment.WebRootPath, folder);
            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }
            var extension = Path.GetExtension(file.FileName);
            var uniqueFileName = $"{filePrefix}_{Guid.NewGuid()}{extension}";
            var filePath = Path.Combine(uploadsFolder, uniqueFileName);
            using (var fileStream = new FileStream(filePath, FileMode.Create))
            {
                await file.CopyToAsync(fileStream);
            }
            return $"/{folder}/{uniqueFileName}".Replace("//", "/");
        }

        [HttpPost]
        public async Task<IActionResult> SaveEmpleado(
            [FromForm] string employeeData, 
            IFormFile? Identificacion, 
            IFormFile? Comprobante, 
            IFormFile? Cv, 
            IFormFile? Contrato, 
            IFormFile? Licencia, 
            IFormFile? FotoEmpleado,
            CancellationToken cancellationToken)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(employeeData))
                {
                    return Json(new { success = false, message = "No se recibieron los datos del empleado." });
                }

                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var model = JsonSerializer.Deserialize<EmpEmpleadoSaveDto>(employeeData, options);
                if (model == null)
                {
                    return Json(new { success = false, message = "Datos del empleado inválidos." });
                }

                if (model.DocumentosLaborales == null)
                {
                    model.DocumentosLaborales = new EmpDocumentosLaboralesSaveDto();
                }

                string curp = CleanFolderName(model.StrCurp);
                string docsFolder = $"uploads/empleados/{curp}/documentos";
                string photoFolder = $"uploads/empleados/{curp}/foto";

                // Guardar los archivos si se subieron nuevos
                if (Identificacion != null && Identificacion.Length > 0)
                {
                    model.DocumentosLaborales.StrUrlIdentificacionOficial = await SaveFileAsync(Identificacion, docsFolder, "identificacion");
                }
                if (Comprobante != null && Comprobante.Length > 0)
                {
                    model.DocumentosLaborales.StrUrlComprobanteDomicilio = await SaveFileAsync(Comprobante, docsFolder, "comprobante");
                }
                if (Cv != null && Cv.Length > 0)
                {
                    model.DocumentosLaborales.StrUrlCurriculumVitae = await SaveFileAsync(Cv, docsFolder, "cv");
                }
                if (Contrato != null && Contrato.Length > 0)
                {
                    model.DocumentosLaborales.StrUrlContrato = await SaveFileAsync(Contrato, docsFolder, "contrato");
                }
                if (Licencia != null && Licencia.Length > 0)
                {
                    model.DocumentosLaborales.StrUrlLicencia = await SaveFileAsync(Licencia, docsFolder, "licencia");
                }
                if (FotoEmpleado != null && FotoEmpleado.Length > 0)
                {
                    model.DocumentosLaborales.StrUrlFotoEmp = await SaveFileAsync(FotoEmpleado, photoFolder, "foto");
                }

                // Limpiar ModelState anterior y forzar validación del nuevo modelo
                ModelState.Clear();
                if (!TryValidateModel(model))
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();
                    return Json(new { success = false, message = string.Join(" ", errors) });
                }

                var response = await _service.CrearAsync(model, cancellationToken);
                if (!response.Success)
                {
                    return Json(new { success = false, message = response.Message });
                }
                return Json(new { success = true, data = response.Data });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error al procesar el guardado: " + ex.Message });
            }
        }

        [HttpPost]
        public async Task<IActionResult> UpdateEmpleado(
            int id,
            [FromForm] string employeeData, 
            IFormFile? Identificacion, 
            IFormFile? Comprobante, 
            IFormFile? Cv, 
            IFormFile? Contrato, 
            IFormFile? Licencia, 
            IFormFile? FotoEmpleado,
            CancellationToken cancellationToken)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(employeeData))
                {
                    return Json(new { success = false, message = "No se recibieron los datos del empleado." });
                }

                var options = new JsonSerializerOptions { PropertyNameCaseInsensitive = true };
                var model = JsonSerializer.Deserialize<EmpEmpleadoSaveDto>(employeeData, options);
                if (model == null)
                {
                    return Json(new { success = false, message = "Datos del empleado inválidos." });
                }

                if (model.DocumentosLaborales == null)
                {
                    model.DocumentosLaborales = new EmpDocumentosLaboralesSaveDto();
                }

                string curp = CleanFolderName(model.StrCurp);
                string docsFolder = $"uploads/empleados/{curp}/documentos";
                string photoFolder = $"uploads/empleados/{curp}/foto";

                // Obtener documentos del empleado existente para preservar las versiones anteriores si no se subieron nuevos archivos
                var existingEmpResponse = await _service.ObtenerPorIdAsync(id, cancellationToken);
                var existingDocs = existingEmpResponse?.Success == true ? existingEmpResponse.Data?.EmpDocumentosLaborales : null;

                // Guardar los archivos si se subieron nuevos o conservar la versión existente
                if (Identificacion != null && Identificacion.Length > 0)
                {
                    model.DocumentosLaborales.StrUrlIdentificacionOficial = await SaveFileAsync(Identificacion, docsFolder, "identificacion");
                }
                else if (string.IsNullOrWhiteSpace(model.DocumentosLaborales.StrUrlIdentificacionOficial) || model.DocumentosLaborales.StrUrlIdentificacionOficial.Contains("/uploads/identificacion.pdf"))
                {
                    model.DocumentosLaborales.StrUrlIdentificacionOficial = existingDocs?.StrUrlIdentificacionOficial ?? string.Empty;
                }

                if (Comprobante != null && Comprobante.Length > 0)
                {
                    model.DocumentosLaborales.StrUrlComprobanteDomicilio = await SaveFileAsync(Comprobante, docsFolder, "comprobante");
                }
                else if (string.IsNullOrWhiteSpace(model.DocumentosLaborales.StrUrlComprobanteDomicilio) || model.DocumentosLaborales.StrUrlComprobanteDomicilio.Contains("/uploads/comprobante.pdf"))
                {
                    model.DocumentosLaborales.StrUrlComprobanteDomicilio = existingDocs?.StrUrlComprobanteDomicilio ?? string.Empty;
                }

                if (Cv != null && Cv.Length > 0)
                {
                    model.DocumentosLaborales.StrUrlCurriculumVitae = await SaveFileAsync(Cv, docsFolder, "cv");
                }
                else if (string.IsNullOrWhiteSpace(model.DocumentosLaborales.StrUrlCurriculumVitae) || model.DocumentosLaborales.StrUrlCurriculumVitae.Contains("/uploads/cv.pdf"))
                {
                    model.DocumentosLaborales.StrUrlCurriculumVitae = existingDocs?.StrUrlCurriculumVitae ?? string.Empty;
                }

                if (Contrato != null && Contrato.Length > 0)
                {
                    model.DocumentosLaborales.StrUrlContrato = await SaveFileAsync(Contrato, docsFolder, "contrato");
                }
                else if (string.IsNullOrWhiteSpace(model.DocumentosLaborales.StrUrlContrato) || model.DocumentosLaborales.StrUrlContrato.Contains("/uploads/contrato.pdf"))
                {
                    model.DocumentosLaborales.StrUrlContrato = existingDocs?.StrUrlContrato ?? string.Empty;
                }

                if (Licencia != null && Licencia.Length > 0)
                {
                    model.DocumentosLaborales.StrUrlLicencia = await SaveFileAsync(Licencia, docsFolder, "licencia");
                }
                else if (string.IsNullOrWhiteSpace(model.DocumentosLaborales.StrUrlLicencia) || model.DocumentosLaborales.StrUrlLicencia.Contains("/uploads/licencia.pdf"))
                {
                    model.DocumentosLaborales.StrUrlLicencia = existingDocs?.StrUrlLicencia ?? string.Empty;
                }

                if (FotoEmpleado != null && FotoEmpleado.Length > 0)
                {
                    model.DocumentosLaborales.StrUrlFotoEmp = await SaveFileAsync(FotoEmpleado, photoFolder, "foto");
                }
                else if (string.IsNullOrWhiteSpace(model.DocumentosLaborales.StrUrlFotoEmp))
                {
                    model.DocumentosLaborales.StrUrlFotoEmp = existingDocs?.StrUrlFotoEmp ?? string.Empty;
                }

                // Limpiar ModelState anterior y forzar validación del nuevo modelo
                ModelState.Clear();
                if (!TryValidateModel(model))
                {
                    var errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList();
                    return Json(new { success = false, message = string.Join(" ", errors) });
                }

                var response = await _service.ActualizarAsync(id, model, cancellationToken);
                if (!response.Success)
                {
                    return Json(new { success = false, message = response.Message });
                }
                return Json(new { success = true, data = response.Data });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error al procesar la actualización: " + ex.Message });
            }
        }


        [HttpPost]
        public async Task<IActionResult> DeleteEmpleado(int id, CancellationToken cancellationToken)
        {
            var response = await _service.EliminarAsync(id, cancellationToken);
            if (!response.Success)
            {
                return Json(new { success = false, message = response.Message });
            }
            return Json(new { success = true, data = response.Data });
        }

        [HttpPost]
        public async Task<IActionResult> DeactivateEmpleado(int id, CancellationToken cancellationToken)
        {
            var responseGet = await _service.ObtenerPorIdAsync(id, cancellationToken);
            if (!responseGet.Success || responseGet.Data == null)
            {
                return Json(new { success = false, message = responseGet.Message ?? "Empleado no encontrado." });
            }

            var emp = responseGet.Data;

            var saveModel = new EmpEmpleadoSaveDto
            {
                StrNombre = emp.StrNombre,
                StrApellidoPaterno = emp.StrApellidoPaterno,
                StrApellidoMaterno = emp.StrApellidoMaterno,
                DteFechaNacimiento = emp.DteFechaNacimiento,
                StrRfc = emp.StrRfc,
                StrCurp = emp.StrCurp,
                IntEdad = emp.IntEdad,
                StrCorreoElectronico = emp.StrCorreoElectronico,
                BigNss = emp.BigNss,
                IdEmpCatGenero = emp.IdEmpCatGenero,
                IdEmpCatEstadoCivil = emp.IdEmpCatEstadoCivil,
                IdEmpCatNacionalidad = emp.IdEmpCatNacionalidad,
                IdEmpCatTipoContratacion = emp.IdEmpCatTipoContratacion,
                IdCatStatus = emp.IdCatStatus == 1 ? 2 : 1,

                Direccion = new EmpDireccionSaveDto
                {
                    IdEmpCatColonia = emp.EmpDireccion?.IdEmpCatColonia ?? 1,
                    IntNumExterior = emp.EmpDireccion?.IntNumExterior,
                    IntNumInterior = emp.EmpDireccion?.IntNumInterior
                },

                DatosAcademicos = new EmpDatosAcademicosSaveDto
                {
                    StrNivelEstudios = string.IsNullOrEmpty(emp.EmpDatosAcademicos?.StrNivelEstudios) ? "N/D" : emp.EmpDatosAcademicos.StrNivelEstudios,
                    StrInstitucion = string.IsNullOrEmpty(emp.EmpDatosAcademicos?.StrInstitucion) ? "N/D" : emp.EmpDatosAcademicos.StrInstitucion,
                    StrCarrera = emp.EmpDatosAcademicos?.StrCarrera,
                    StrEstatus = string.IsNullOrEmpty(emp.EmpDatosAcademicos?.StrEstatus) ? "N/D" : emp.EmpDatosAcademicos.StrEstatus,
                    DteFechaInicio = emp.EmpDatosAcademicos?.DteFechaInicio ?? DateOnly.FromDateTime(DateTime.Today),
                    DteFechaFin = emp.EmpDatosAcademicos?.DteFechaFin ?? DateOnly.FromDateTime(DateTime.Today)
                },

                DocumentosLaborales = new EmpDocumentosLaboralesSaveDto
                {
                    StrUrlIdentificacionOficial = string.IsNullOrEmpty(emp.EmpDocumentosLaborales?.StrUrlIdentificacionOficial) ? "N/D" : emp.EmpDocumentosLaborales.StrUrlIdentificacionOficial,
                    StrUrlComprobanteDomicilio = string.IsNullOrEmpty(emp.EmpDocumentosLaborales?.StrUrlComprobanteDomicilio) ? "N/D" : emp.EmpDocumentosLaborales.StrUrlComprobanteDomicilio,
                    StrUrlCurriculumVitae = string.IsNullOrEmpty(emp.EmpDocumentosLaborales?.StrUrlCurriculumVitae) ? "N/D" : emp.EmpDocumentosLaborales.StrUrlCurriculumVitae,
                    StrUrlContrato = string.IsNullOrEmpty(emp.EmpDocumentosLaborales?.StrUrlContrato) ? "N/D" : emp.EmpDocumentosLaborales.StrUrlContrato,
                    StrUrlLicencia = string.IsNullOrEmpty(emp.EmpDocumentosLaborales?.StrUrlLicencia) ? "N/D" : emp.EmpDocumentosLaborales.StrUrlLicencia,
                    StrUrlFotoEmp = emp.EmpDocumentosLaborales?.StrUrlFotoEmp ?? string.Empty
                },

                CondicionesLaborales = new EmpCondicionesLaboralesSaveDto
                {
                    BitCercaniaVivienda = emp.EmpCondicionesLaborales?.BitCercaniaVivienda ?? false,
                    BitDisponibilidadDeViaje = emp.EmpCondicionesLaborales?.BitDisponibilidadDeViaje ?? false,
                    MnySueldoMensual = emp.EmpCondicionesLaborales?.MnySueldoMensual ?? 0m,
                    BitExperienciaEnArea = emp.EmpCondicionesLaborales?.BitExperienciaEnArea ?? false,
                    BitDisponibilidadCambioResidencia = emp.EmpCondicionesLaborales?.BitDisponibilidadCambioResidencia ?? false,
                    DteFechaIngreso = emp.EmpCondicionesLaborales?.DteFechaIngreso ?? DateOnly.FromDateTime(DateTime.Today)
                },

                Referencias = emp.EmpReferenciasPersonales?.Select(rf => new EmpReferenciaSaveDto
                {
                    StrNombreCompleto = rf.StrNombreCompleto,
                    StrParentezco = rf.StrParentezco,
                    BigTelefono = rf.BigTelefono
                }).ToList() ?? new List<EmpReferenciaSaveDto>(),

                ExperienciaLaboral = emp.EmpExperiencias?.Select(exp => new EmpExperienciaLaboralSaveDto
                {
                    StrEmpresa = exp.StrEmpresa,
                    StrPuesto = exp.StrPuesto,
                    StrArea = exp.StrArea,
                    DteFechaIncio = exp.DteFechaIncio,
                    DteFechaFin = exp.DteFechaFin,
                    MnySueldo = exp.MnySueldo,
                    StrMotivoSalida = exp.StrMotivoSalida
                }).ToList() ?? new List<EmpExperienciaLaboralSaveDto>(),

                IdEmpCatAreaLaboral = emp.EmpHistorialAreas?.OrderByDescending(x => x.Id).FirstOrDefault()?.IdEmpCatAreaLaboral ?? 1,

                Telefonos = emp.EmpTelefonos?.Select(t => new Cavex.Principal.Models.EmpTelefono.EmpTelefonoSaveDto
                {
                    BigNumeroFijo = t.BigNumeroFijo,
                    BigNumeroCelular = t.BigNumeroCelular,
                    IdEmpEmpleado = id
                }).ToList() ?? new List<Cavex.Principal.Models.EmpTelefono.EmpTelefonoSaveDto>()
            };

            var responseUpdate = await _service.ActualizarAsync(id, saveModel, cancellationToken);
            if (!responseUpdate.Success)
            {
                return Json(new { success = false, message = responseUpdate.Message ?? "No fue posible actualizar el estado del empleado." });
            }

            return Json(new { success = true, message = saveModel.IdCatStatus == 2 ? "Empleado dado de baja exitosamente." : "Empleado activado exitosamente." });
        }

        [HttpGet("/Empleado/GetHistorialDocumentos")]
        public async Task<IActionResult> GetHistorialDocumentos(int id, CancellationToken cancellationToken)
        {
            try
            {
                var empResponse = await _service.ObtenerPorIdAsync(id, cancellationToken);
                if (empResponse == null || !empResponse.Success || empResponse.Data == null)
                {
                    return Json(new { success = false, message = "Empleado no encontrado." });
                }

                var emp = empResponse.Data;
                string curp = CleanFolderName(emp.StrCurp);
                string docsFolder = Path.Combine(_webHostEnvironment.WebRootPath, "uploads", "empleados", curp, "documentos");
                string photoFolder = Path.Combine(_webHostEnvironment.WebRootPath, "uploads", "empleados", curp, "foto");

                var list = new List<object>();

                Action<string, string> scanFolder = (folderPath, relativePrefix) =>
                {
                    if (Directory.Exists(folderPath))
                    {
                        var files = new DirectoryInfo(folderPath).GetFiles("*.*", SearchOption.AllDirectories)
                            .OrderByDescending(f => f.LastWriteTime);

                        foreach (var file in files)
                        {
                            string relUrl = "/" + Path.Combine(relativePrefix, file.Name).Replace("\\", "/");
                            string fileLower = file.Name.ToLower();

                            string docType = "Documento General";
                            if (fileLower.StartsWith("identificacion")) docType = "Identificación Oficial";
                            else if (fileLower.StartsWith("comprobante")) docType = "Comprobante de Domicilio";
                            else if (fileLower.StartsWith("cv") || fileLower.StartsWith("curriculum")) docType = "Curriculum Vitae (CV)";
                            else if (fileLower.StartsWith("contrato")) docType = "Contrato Laboral";
                            else if (fileLower.StartsWith("licencia")) docType = "Licencia de Conducir";
                            else if (fileLower.StartsWith("foto")) docType = "Fotografía de Empleado";

                            bool esActual = false;
                            if (emp.EmpDocumentosLaborales != null)
                            {
                                var d = emp.EmpDocumentosLaborales;
                                if (relUrl.Equals(d.StrUrlIdentificacionOficial, StringComparison.OrdinalIgnoreCase) ||
                                    relUrl.Equals(d.StrUrlComprobanteDomicilio, StringComparison.OrdinalIgnoreCase) ||
                                    relUrl.Equals(d.StrUrlCurriculumVitae, StringComparison.OrdinalIgnoreCase) ||
                                    relUrl.Equals(d.StrUrlContrato, StringComparison.OrdinalIgnoreCase) ||
                                    relUrl.Equals(d.StrUrlLicencia, StringComparison.OrdinalIgnoreCase) ||
                                    relUrl.Equals(d.StrUrlFotoEmp, StringComparison.OrdinalIgnoreCase))
                                {
                                    esActual = true;
                                }
                            }

                            list.Add(new
                            {
                                tipo = docType,
                                nombreArchivo = file.Name,
                                url = relUrl,
                                fecha = file.LastWriteTime.ToString("yyyy-MM-dd HH:mm"),
                                tamanoMb = (file.Length / 1024.0 / 1024.0).ToString("F2") + " MB",
                                esActual = esActual
                            });
                        }
                    }
                };

                scanFolder(docsFolder, $"uploads/empleados/{curp}/documentos");
                scanFolder(photoFolder, $"uploads/empleados/{curp}/foto");

                // Si no se encontraron archivos físicos en carpeta pero existen URLs registradas en DB
                if (list.Count == 0 && emp.EmpDocumentosLaborales != null)
                {
                    var docs = emp.EmpDocumentosLaborales;
                    var dbDocs = new[]
                    {
                        new { Tipo = "Identificación Oficial", Url = docs.StrUrlIdentificacionOficial },
                        new { Tipo = "Comprobante de Domicilio", Url = docs.StrUrlComprobanteDomicilio },
                        new { Tipo = "Curriculum Vitae (CV)", Url = docs.StrUrlCurriculumVitae },
                        new { Tipo = "Contrato Laboral", Url = docs.StrUrlContrato },
                        new { Tipo = "Licencia de Conducir", Url = docs.StrUrlLicencia },
                        new { Tipo = "Fotografía de Empleado", Url = docs.StrUrlFotoEmp }
                    };

                    foreach (var d in dbDocs)
                    {
                        if (!string.IsNullOrWhiteSpace(d.Url) && d.Url != "N/D")
                        {
                            list.Add(new
                            {
                                tipo = d.Tipo,
                                nombreArchivo = Path.GetFileName(d.Url),
                                url = d.Url,
                                fecha = "Fecha de registro",
                                tamanoMb = "—",
                                esActual = true
                            });
                        }
                    }
                }

                return Json(new { success = true, data = list });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = "Error al obtener el historial de documentos: " + ex.Message });
            }
        }
    }
}

    
