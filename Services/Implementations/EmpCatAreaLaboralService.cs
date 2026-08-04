using Cavex.Principal.ApiClients.EmpCatAreaLaboral;
using Cavex.Principal.Common;
using Cavex.Principal.Models.EmpCatAreaLaboral;
using Cavex.Principal.Services.Interfaces;
using Refit;
using System.Net;

namespace Cavex.Principal.Services.Implementations
{
    public class EmpCatAreaLaboralService : IEmpCatAreaLaboralService
    {
        private readonly IEmpCatAreaLaboralApi _apiAreaLaboral;
        private readonly ILogger<EmpCatAreaLaboralService> _logger;

        public EmpCatAreaLaboralService(IEmpCatAreaLaboralApi apiAreaLaboral, ILogger<EmpCatAreaLaboralService> logger)
        {
            _apiAreaLaboral = apiAreaLaboral;
            _logger = logger;
        }

        public Task<ResponseWrapper<PagedResponse<EmpCatAreaLaboralDto>>> ObtenerTodosAsync(
            int pageIndex = 1,
            int pageSize = 10,
            string? search = null,
            int? status = null,
            CancellationToken cancellationToken = default) =>
            ExecuteAsync(() => _apiAreaLaboral.GetAllAsync(pageIndex, pageSize, search, status, cancellationToken), "No fue posible obtener las areas laborales.");

        public async Task<bool> ExistePorNombreAsync(string nombre, int? excludeId = null, CancellationToken cancellationToken = default)
        {
            if (string.IsNullOrWhiteSpace(nombre)) 
            return false;
            var response = await ObtenerTodosAsync(1, 10, nombre, null, cancellationToken);
            if (response.Success && response.Data?.Items != null)
            {
                return response.Data.Items.Any(x => 
                    x.StrValor.Trim().Equals(nombre.Trim(), StringComparison.OrdinalIgnoreCase) 
                    && (!excludeId.HasValue || x.Id != excludeId.Value));
            }
            return false;
        }

        public Task<ResponseWrapper<EmpCatAreaLaboralDto>> CrearAsync(EmpCatAreaLaboralSaveDto request, CancellationToken cancellationToken = default) =>
            ExecuteAsync(() => _apiAreaLaboral.CreateAsync(RequestWrapper<EmpCatAreaLaboralSaveDto>.Create(request), cancellationToken), "No fue posible crear el área laboral.");

        public Task<ResponseWrapper<EmpCatAreaLaboralDto>> ActualizarAsync(int id, EmpCatAreaLaboralSaveDto request, CancellationToken cancellationToken = default) =>
            ExecuteAsync(() => _apiAreaLaboral.UpdateAsync(id, RequestWrapper<EmpCatAreaLaboralSaveDto>.Create(request), cancellationToken), "No fue posible actualizar el área laboral.");

        public Task<ResponseWrapper<bool>> EliminarAsync(int id, CancellationToken cancellationToken = default) =>
            ExecuteAsync(() => _apiAreaLaboral.DeleteAsync(id, cancellationToken), "No fue posible eliminar el área laboral.");

        private async Task<ResponseWrapper<T>> ExecuteAsync<T>(Func<Task<ResponseWrapper<T>>> apiCall, string fallbackMessage)
        {
            try
            {
                var response = await apiCall();
                return response.Success ? response : ResponseWrapper<T>.Fail(response.Message ?? fallbackMessage, response.StatusCode);
            }
            catch (ApiException ex)
            {
                _logger.LogError(ex, "API error while consuming EmpCatAreaLaboral.");
                return ResponseWrapper<T>.Fail(!string.IsNullOrWhiteSpace(ex.Content) ? ex.Content : fallbackMessage, ex.StatusCode);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Unexpected error while consuming EmpCatAreaLaboral.");
                return ResponseWrapper<T>.Fail(fallbackMessage, HttpStatusCode.InternalServerError);
            }
        }

    }
}
