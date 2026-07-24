using Cavex.Principal.ApiClients.VehiculoListado;
using Cavex.Principal.Common;
using Cavex.Principal.Models.VehiculoListado;
using Cavex.Principal.Services.Interfaces;
using Refit;
using System.Net;

namespace Cavex.Principal.Services.Implementations
{
    public class VehiculoListadoService : IVehiculoListadoService
    {
        private readonly IVehiculoListadoApi _api;
        private readonly ILogger<VehiculoListadoService> _logger;

        public VehiculoListadoService(
            IVehiculoListadoApi api,
            ILogger<VehiculoListadoService> logger)
        {
            _api = api;
            _logger = logger;
        }

        public Task<ResponseWrapper<PagedResponse<VehiculoListadoDto>>> ObtenerTodosAsync(
            int pageIndex = 1,
            int pageSize = 10,
            string? search = null,
            int? idVehCatStatus = null,
            CancellationToken cancellationToken = default) =>
            ExecuteAsync(
                () => _api.GetAllAsync(pageIndex, pageSize, search, idVehCatStatus, cancellationToken),
                "No fue posible obtener el listado de vehiculos.");

        public Task<ResponseWrapper<VehiculoListadoDto>> ObtenerPorIdAsync(
            int id,
            CancellationToken cancellationToken = default) =>
            ExecuteAsync(
                () => _api.GetByIdAsync(id, cancellationToken),
                "No fue posible obtener el vehiculo solicitado.");

        private async Task<ResponseWrapper<T>> ExecuteAsync<T>(
            Func<Task<ResponseWrapper<T>>> apiCall,
            string fallbackMessage)
        {
            try
            {
                var response = await apiCall();

                return response.Success
                    ? response
                    : ResponseWrapper<T>.Fail(response.Message ?? fallbackMessage, response.StatusCode);
            }
            catch (ApiException ex)
            {
                _logger.LogError(ex, "API error while consuming VehiculoListado.");

                return ResponseWrapper<T>.Fail(
                    !string.IsNullOrWhiteSpace(ex.Content) ? ex.Content : fallbackMessage,
                    ex.StatusCode);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while consuming VehiculoListado.");

                return ResponseWrapper<T>.Fail(
                    fallbackMessage,
                    HttpStatusCode.InternalServerError);
            }
        }
    }
}