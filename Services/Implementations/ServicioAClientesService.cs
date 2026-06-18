using Cavex.Principal.ApiClients.ServicioAClientes;
using Cavex.Principal.Common;
using Cavex.Principal.Models.ServicioAClientes;
using Cavex.Principal.Services.Interfaces;
using Refit;
using System.Net;

namespace Cavex.Principal.Services.Implementations
{
    public class ServicioAClientesService : IServicioAClientesService
    {
        private readonly IServicioAClientesApi _servicioAClientesApi;
        private readonly ILogger<ServicioAClientesService> _logger;

        public ServicioAClientesService(
            IServicioAClientesApi servicioAClientesApi,
            ILogger<ServicioAClientesService> logger)
        {
            _servicioAClientesApi = servicioAClientesApi;
            _logger = logger;
        }

        public async Task<ResponseWrapper<PagedResponse<ServicioAClienteDto>>> ObtenerTodosAsync(CancellationToken cancellationToken = default)
        {
            return await ExecuteAsync(
                () => _servicioAClientesApi.GetAllAsync(cancellationToken),
                "No fue posible obtener los servicios a clientes.");
        }

        public async Task<ResponseWrapper<ServicioAClienteDto>> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default)
        {
            return await ExecuteAsync(
                () => _servicioAClientesApi.GetByIdAsync(id, cancellationToken),
                "No fue posible obtener el servicio a cliente solicitado.");
        }

        public async Task<ResponseWrapper<ServicioAClienteDto>> CrearAsync(
            ServicioAClienteDto request,
            CancellationToken cancellationToken = default)
        {
            return await ExecuteAsync(
                () => _servicioAClientesApi.CreateAsync(RequestWrapper<ServicioAClienteDto>.Create(request), cancellationToken),
                "No fue posible crear el servicio a cliente.");
        }

        public async Task<ResponseWrapper<ServicioAClienteDto>> ActualizarAsync(
            int id,
            ServicioAClienteDto request,
            CancellationToken cancellationToken = default)
        {
            return await ExecuteAsync(
                () => _servicioAClientesApi.UpdateAsync(id, RequestWrapper<ServicioAClienteDto>.Create(request), cancellationToken),
                "No fue posible actualizar el servicio a cliente.");
        }

        public async Task<ResponseWrapper<bool>> EliminarAsync(int id, CancellationToken cancellationToken = default)
        {
            return await ExecuteAsync(
                () => _servicioAClientesApi.DeleteAsync(id, cancellationToken),
                "No fue posible eliminar el servicio a cliente.");
        }

        private async Task<ResponseWrapper<T>> ExecuteAsync<T>(
            Func<Task<ResponseWrapper<T>>> apiCall,
            string fallbackMessage)
        {
            try
            {
                var response = await apiCall();

                return response.Success
                    ? response
                    : new ResponseWrapper<T>
                    {
                        StatusCode = response.StatusCode,
                        Message = string.IsNullOrWhiteSpace(response.Message) ? fallbackMessage : response.Message,
                        Data = response.Data
                    };
            }
            catch (ApiException exception)
            {
                _logger.LogError(exception, "API error while consuming ServicioAClientes. StatusCode: {StatusCode}", exception.StatusCode);

                return new ResponseWrapper<T>
                {
                    StatusCode = exception.StatusCode,
                    Message = !string.IsNullOrWhiteSpace(exception.Content) ? exception.Content : fallbackMessage
                };
            }
            catch (OperationCanceledException exception)
            {
                _logger.LogError(exception, "Timeout while consuming ServicioAClientes.");

                return new ResponseWrapper<T>
                {
                    StatusCode = HttpStatusCode.GatewayTimeout,
                    Message = fallbackMessage
                };
            }
            catch (Exception exception)
            {
                _logger.LogError(exception, "Unexpected error while consuming ServicioAClientes.");

                return new ResponseWrapper<T>
                {
                    StatusCode = HttpStatusCode.InternalServerError,
                    Message = fallbackMessage
                };
            }
        }
    }
}
