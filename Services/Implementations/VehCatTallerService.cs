using Cavex.Principal.ApiClients.VehCatTaller;
using Cavex.Principal.Common;
using Cavex.Principal.Models.VehCatTaller;
using Cavex.Principal.Services.Interfaces;
using Refit;
using System.Net;

namespace Cavex.Principal.Services.Implementations
{
    public class VehCatTallerService : IVehCatTallerService
    {
        private readonly IVehCatTallerApi _vehCatTallerApi;
        private readonly ILogger<VehCatTallerService> _logger;

        public VehCatTallerService(IVehCatTallerApi vehCatTallerApi, ILogger<VehCatTallerService> logger)
        {
            _vehCatTallerApi = vehCatTallerApi;
            _logger = logger;
        }

        public Task<ResponseWrapper<PagedResponse<VehCatTallerDto>>> ObtenerTodosAsync(
            int pageIndex = 1,
            int pageSize = 10,
            string? search = null,
            int? status = null,
            CancellationToken cancellationToken = default) =>
            ExecuteAsync(() => _vehCatTallerApi.GetAllAsync(pageIndex, pageSize, search, status, cancellationToken), "No fue posible obtener los registros de VehCatTaller.");

        public async Task<bool> ExistePorNombreAsync(string nombre, int? excludeId = null, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(nombre)) return false;
            var response = await ObtenerTodosAsync(1, 10, nombre, cancellationToken);
            if (response.Success && response.Data?.Items != null)
            {
                return response.Data.Items.Any(x => 
                    x.StrValor.Trim().Equals(nombre.Trim(), StringComparison.OrdinalIgnoreCase) 
                    && (!excludeId.HasValue || x.Id != excludeId.Value));
            }
            return false;
        }

        public Task<ResponseWrapper<VehCatTallerDto>> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default) =>
            ExecuteAsync(() => _vehCatTallerApi.GetByIdAsync(id, cancellationToken), "No fue posible obtener el registro de VehCatTaller.");

        public Task<ResponseWrapper<VehCatTallerDto>> CrearAsync(VehCatTallerSaveDto dto, CancellationToken cancellationToken = default) =>
            ExecuteAsync(() => _vehCatTallerApi.CreateAsync(RequestWrapper<VehCatTallerSaveDto>.Create(dto), cancellationToken), "No fue posible crear el registro de VehCatTaller.");

        public Task<ResponseWrapper<VehCatTallerDto>> EditarAsync(VehCatTallerEditDto dto, CancellationToken cancellationToken = default) =>
            ExecuteAsync(() => _vehCatTallerApi.UpdateAsync(dto.Id, RequestWrapper<VehCatTallerEditDto>.Create(dto), cancellationToken), "No fue posible editar el registro de VehCatTaller.");

        public Task<ResponseWrapper<bool>> EliminarAsync(int id, CancellationToken cancellationToken = default) =>
            ExecuteAsync(() => _vehCatTallerApi.DeleteAsync(id, cancellationToken), "No fue posible eliminar el registro de VehCatTaller.");

        private async Task<ResponseWrapper<T>> ExecuteAsync<T>(Func<Task<ResponseWrapper<T>>> apiCall, string fallbackMessage)
        {
            try
            {
                var response = await apiCall();
                return response.Success ? response : ResponseWrapper<T>.Fail(response.Message ?? fallbackMessage, response.StatusCode);
            }
            catch (ApiException ex)
            {
                _logger.LogError(ex, "API error while consuming VehCatTaller.");
                return ResponseWrapper<T>.Fail(!string.IsNullOrWhiteSpace(ex.Content) ? ex.Content : fallbackMessage, ex.StatusCode);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while consuming VehCatTaller.");
                return ResponseWrapper<T>.Fail(fallbackMessage, HttpStatusCode.InternalServerError);
            }
        }
    }
}
