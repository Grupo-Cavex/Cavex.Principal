using Cavex.Principal.ApiClients.VehCatResponsableServicio;
using Cavex.Principal.Common;
using Cavex.Principal.Models.VehCatResponsableServicio;
using Cavex.Principal.Services.Interfaces;
using Refit;
using System.Net;

namespace Cavex.Principal.Services.Implementations
{
    public class VehCatResponsableServicioService : IVehCatResponsableServicioService
    {
        private readonly IVehCatResponsableServicioApi _vehCatResponsableServicioApi;
        private readonly ILogger<VehCatResponsableServicioService> _logger;

        public VehCatResponsableServicioService(IVehCatResponsableServicioApi vehCatResponsableServicioApi, ILogger<VehCatResponsableServicioService> logger)
        {
            _vehCatResponsableServicioApi = vehCatResponsableServicioApi;
            _logger = logger;
        }

        public Task<ResponseWrapper<PagedResponse<VehCatResponsableServicioDto>>> ObtenerTodosAsync(
            int pageIndex = 1,
            int pageSize = 10,
            string? search = null,
            int? status = null,
            CancellationToken cancellationToken = default) =>
            ExecuteAsync(() => _vehCatResponsableServicioApi.GetAllAsync(pageIndex, pageSize, search, status, cancellationToken), "No fue posible obtener los registros de VehCatResponsableServicio.");

        public async Task<bool> ExistePorNombreAsync(string nombre, int? excludeId = null, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(nombre)) return false;
            var response = await ObtenerTodosAsync(1, 10, nombre, null, cancellationToken);
            if (response.Success && response.Data?.Items != null)
            {
                return response.Data.Items.Any(x => 
                    x.StrValor.Trim().Equals(nombre.Trim(), StringComparison.OrdinalIgnoreCase) 
                    && (!excludeId.HasValue || x.Id != excludeId.Value));
            }
            return false;
        }

        public Task<ResponseWrapper<VehCatResponsableServicioDto>> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default) =>
            ExecuteAsync(() => _vehCatResponsableServicioApi.GetByIdAsync(id, cancellationToken), "No fue posible obtener el registro de VehCatResponsableServicio.");

        public Task<ResponseWrapper<VehCatResponsableServicioDto>> CrearAsync(VehCatResponsableServicioSaveDto dto, CancellationToken cancellationToken = default) =>
            ExecuteAsync(() => _vehCatResponsableServicioApi.CreateAsync(new RequestWrapper<VehCatResponsableServicioSaveDto> { Body = dto }, cancellationToken), "No fue posible crear el registro de VehCatResponsableServicio.");

        public Task<ResponseWrapper<VehCatResponsableServicioDto>> EditarAsync(VehCatResponsableServicioEditDto dto, CancellationToken cancellationToken = default) =>
            ExecuteAsync(() => _vehCatResponsableServicioApi.UpdateAsync(dto.Id, new RequestWrapper<VehCatResponsableServicioEditDto> { Body = dto }, cancellationToken), "No fue posible editar el registro de VehCatResponsableServicio.");

        public Task<ResponseWrapper<bool>> EliminarAsync(int id, CancellationToken cancellationToken = default) =>
            ExecuteAsync(() => _vehCatResponsableServicioApi.DeleteAsync(id, cancellationToken), "No fue posible eliminar el registro de VehCatResponsableServicio.");

        private async Task<ResponseWrapper<T>> ExecuteAsync<T>(Func<Task<ResponseWrapper<T>>> apiCall, string fallbackMessage)
        {
            try
            {
                var response = await apiCall();
                return response.Success ? response : ResponseWrapper<T>.Fail(response.Message ?? fallbackMessage, response.StatusCode);
            }
            catch (ApiException ex)
            {
                _logger.LogError(ex, "API error while consuming VehCatResponsableServicio.");
                return ResponseWrapper<T>.Fail(!string.IsNullOrWhiteSpace(ex.Content) ? ex.Content : fallbackMessage, ex.StatusCode);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while consuming VehCatResponsableServicio.");
                return ResponseWrapper<T>.Fail(fallbackMessage, HttpStatusCode.InternalServerError);
            }
        }
    }
}
