using Cavex.Principal.ApiClients.VehDatosGenerales;
using Cavex.Principal.Common;
using Cavex.Principal.Models.CatSucursal;
using Cavex.Principal.Models.VehDatosGenerales;
using Cavex.Principal.Services.Interfaces;
using Refit;
using System.Net;

namespace Cavex.Principal.Services.Implementations
{
    public class VehDatosGeneralesService : IVehDatosGeneralesService
    {
        private readonly IVehDatosGeneralesApi _vehDatosGeneralesApi;
        private readonly ILogger<VehDatosGeneralesService> _logger;

        public VehDatosGeneralesService(IVehDatosGeneralesApi vehDatosGeneralesApi, ILogger<VehDatosGeneralesService> logger)
        {
            _vehDatosGeneralesApi = vehDatosGeneralesApi;
            _logger = logger;
        }

        public Task<ResponseWrapper<PagedResponse<VehDatosGeneralesDto>>> ObtenerTodosAsync(CancellationToken cancellationToken = default) =>
            ExecuteAsync(() => _vehDatosGeneralesApi.GetAllAsync(cancellationToken), "No fue posible obtener los registros de VehDatosGenerales.");

        public Task<ResponseWrapper<VehDatosGeneralesDto>> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default) =>
            ExecuteAsync(() => _vehDatosGeneralesApi.GetByIdAsync(id, cancellationToken), "No fue posible obtener el registro de VehDatosGenerales.");

        public Task<ResponseWrapper<VehDatosGeneralesDto>> CrearAsync(VehDatosGeneralesSaveDto request, CancellationToken cancellationToken = default) =>
            ExecuteAsync(() => _vehDatosGeneralesApi.CreateAsync(RequestWrapper<VehDatosGeneralesSaveDto>.Create(request), cancellationToken), "No fue posible crear el registro de VehDatosGenerales.");

        public Task<ResponseWrapper<VehDatosGeneralesDto>> EditarAsync(VehDatosGeneralesEditDto dto, CancellationToken cancellationToken = default) =>
            ExecuteAsync(() => _vehDatosGeneralesApi.UpdateAsync(dto.Id, RequestWrapper<VehDatosGeneralesEditDto>.Create(dto), cancellationToken), "No fue posible editar el registro de VehDatosGenerales.");

        public Task<ResponseWrapper<bool>> EliminarAsync(int id, CancellationToken cancellationToken = default) =>
            ExecuteAsync(() => _vehDatosGeneralesApi.DeleteAsync(id, cancellationToken), "No fue posible eliminar el registro de VehDatosGenerales.");

        private async Task<ResponseWrapper<T>> ExecuteAsync<T>(Func<Task<ResponseWrapper<T>>> apiCall, string fallbackMessage)
        {
            try
            {
                var response = await apiCall();
                return response.Success ? response : ResponseWrapper<T>.Fail(response.Message ?? fallbackMessage, response.StatusCode);
            }
            catch (ApiException ex)
            {
                _logger.LogError(ex, "API error while consuming VehDatosGenerales.");
                return ResponseWrapper<T>.Fail(!string.IsNullOrWhiteSpace(ex.Content) ? ex.Content : fallbackMessage, ex.StatusCode);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while consuming VehDatosGenerales.");
                return ResponseWrapper<T>.Fail(fallbackMessage, HttpStatusCode.InternalServerError);
            }
        }
    }
}
