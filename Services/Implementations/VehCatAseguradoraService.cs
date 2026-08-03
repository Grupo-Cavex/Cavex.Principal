using Cavex.Principal.ApiClients.VehCatAseguradora;
using Cavex.Principal.Common;
using Cavex.Principal.Models.VehCatAseguradora;
using Cavex.Principal.Services.Interfaces;
using Refit;
using System.Net;

namespace Cavex.Principal.Services.Implementations
{
    public class VehCatAseguradoraService : IVehCatAseguradoraService
    {
        private readonly IVehCatAseguradoraApi _vehCatAseguradoraApi;
        private readonly ILogger<VehCatAseguradoraService> _logger;

        public VehCatAseguradoraService(IVehCatAseguradoraApi vehCatAseguradoraApi, ILogger<VehCatAseguradoraService> logger)
        {
            _vehCatAseguradoraApi = vehCatAseguradoraApi;
            _logger = logger;
        }

        public Task<ResponseWrapper<PagedResponse<VehCatAseguradoraDto>>> ObtenerTodosAsync(
            int pageIndex = 1,
            int pageSize = 10,
            string? search = null,
            int? status = null,
            CancellationToken cancellationToken = default) =>
            ExecuteAsync(() => _vehCatAseguradoraApi.GetAllAsync(pageIndex, pageSize, search, status, cancellationToken), "No fue posible obtener los registros de VehCatAseguradora.");

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

        public Task<ResponseWrapper<VehCatAseguradoraDto>> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default) =>
            ExecuteAsync(() => _vehCatAseguradoraApi.GetByIdAsync(id, cancellationToken), "No fue posible obtener el registro de VehCatAseguradora.");

        public Task<ResponseWrapper<VehCatAseguradoraDto>> CrearAsync(VehCatAseguradoraSaveDto dto, CancellationToken cancellationToken = default) =>
            ExecuteAsync(() => _vehCatAseguradoraApi.CreateAsync(dto, cancellationToken), "No fue posible crear el registro de VehCatAseguradora.");

        public Task<ResponseWrapper<VehCatAseguradoraDto>> EditarAsync(VehCatAseguradoraEditDto dto, CancellationToken cancellationToken = default) =>
            ExecuteAsync(() => _vehCatAseguradoraApi.UpdateAsync(dto, cancellationToken), "No fue posible editar el registro de VehCatAseguradora.");

        public Task<ResponseWrapper<bool>> EliminarAsync(int id, CancellationToken cancellationToken = default) =>
            ExecuteAsync(() => _vehCatAseguradoraApi.DeleteAsync(id, cancellationToken), "No fue posible eliminar el registro de VehCatAseguradora.");

        private async Task<ResponseWrapper<T>> ExecuteAsync<T>(Func<Task<ResponseWrapper<T>>> apiCall, string fallbackMessage)
        {
            try
            {
                var response = await apiCall();
                return response.Success ? response : ResponseWrapper<T>.Fail(response.Message ?? fallbackMessage, response.StatusCode);
            }
            catch (ApiException ex)
            {
                _logger.LogError(ex, "API error while consuming VehCatAseguradora.");
                return ResponseWrapper<T>.Fail(!string.IsNullOrWhiteSpace(ex.Content) ? ex.Content : fallbackMessage, ex.StatusCode);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while consuming VehCatAseguradora.");
                return ResponseWrapper<T>.Fail(fallbackMessage, HttpStatusCode.InternalServerError);
            }
        }
    }
}
