using Cavex.Principal.Common;
using Cavex.Principal.Models.VehiculoListado;
using Refit;

namespace Cavex.Principal.Services.Interfaces
{
    public interface IVehiculoListadoService
    {
        Task<ResponseWrapper<PagedResponse<VehiculoListadoDto>>> ObtenerTodosAsync(
            int pageIndex = 1,
            int pageSize = 10,
            string? search = null,
            int? idVehCatStatus = null,
            CancellationToken cancellationToken = default);

        Task<ResponseWrapper<VehiculoListadoDto>> ObtenerPorIdAsync(
            int id,
            CancellationToken cancellationToken = default);
    }
}