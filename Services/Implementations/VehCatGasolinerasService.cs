using Cavex.Principal.ApiClients.CatStatus;
using Cavex.Principal.ApiClients.VehCatGasolineras;
using Cavex.Principal.Common;
using Cavex.Principal.Models.VehCatGasolineras;
using Cavex.Principal.Services.Interfaces;
using Refit;
using System.Net;

namespace Cavex.Principal.Services.Implementations
{
    public class VehCatGasolinerasService : IVehCatGasolinerasService
    {
        private readonly IVehCatGasolinerasApi _vehCatGasolinerasApi;
        private readonly ILogger<VehCatGasolinerasService> _logger;

        public VehCatGasolinerasService(IVehCatGasolinerasApi vehCatGasolinerasApi, ILogger<VehCatGasolinerasService> logger)
        {
            _vehCatGasolinerasApi = vehCatGasolinerasApi;
            _logger = logger;
        }

        public Task<ResponseWrapper<PagedResponse<VehCatGasolinerasDto>>> ObtenerTodosAsync(
            int pageIndex = 1,
            int pageSize = 10,
            string? search = null,
            int? status = null,
            CancellationToken cancellationToken = default) =>
            ExecuteAsync(() => _vehCatGasolinerasApi.GetAllAsync(pageIndex, pageSize, search, status, cancellationToken), "No fue posible obtener los registros de VehCatGasolineras.");

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

        public Task<ResponseWrapper<VehCatGasolinerasDto>> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default) =>
            ExecuteAsync(() => _vehCatGasolinerasApi.GetByIdAsync(id, cancellationToken), "No fue posible obtener el registro de VehCatGasolineras.");

        public Task<ResponseWrapper<VehCatGasolinerasDto>> CrearAsync(VehCatGasolinerasSaveDto dto, CancellationToken cancellationToken = default) =>
            ExecuteAsync(() => _vehCatGasolinerasApi.CreateAsync(new RequestWrapper<VehCatGasolinerasSaveDto> { Body = dto }, cancellationToken), "No fue posible crear el registro de VehCatGasolineras.");

        public Task<ResponseWrapper<VehCatGasolinerasDto>> EditarAsync(VehCatGasolinerasEditDto dto, CancellationToken cancellationToken = default) =>
            ExecuteAsync(() => _vehCatGasolinerasApi.UpdateAsync(dto.Id, new RequestWrapper<VehCatGasolinerasEditDto> { Body = dto }, cancellationToken), "No fue posible editar el registro de VehCatGasolineras.");

        public Task<ResponseWrapper<bool>> EliminarAsync(int id, CancellationToken cancellationToken = default) =>
            ExecuteAsync(() => _vehCatGasolinerasApi.DeleteAsync(id, cancellationToken), "No fue posible eliminar el registro de VehCatGasolineras.");

        private async Task<ResponseWrapper<T>> ExecuteAsync<T>(Func<Task<ResponseWrapper<T>>> apiCall, string fallbackMessage)
        {
            try
            {
                var response = await apiCall();
                return response.Success ? response : ResponseWrapper<T>.Fail(response.Message ?? fallbackMessage, response.StatusCode);
            }
            catch (ApiException ex)
            {
                _logger.LogError(ex, "API error while consuming VehCatGasolineras.");
                return ResponseWrapper<T>.Fail(!string.IsNullOrWhiteSpace(ex.Content) ? ex.Content : fallbackMessage, ex.StatusCode);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while consuming VehCatGasolineras.");
                return ResponseWrapper<T>.Fail(fallbackMessage, HttpStatusCode.InternalServerError);
            }
        }
    }
}
