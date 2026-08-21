using Cavex.Principal.Common;
using Cavex.Principal.Models.VehiculoListado;
using Refit;

namespace Cavex.Principal.ApiClients.VehiculoListado
{
    public interface IVehiculoListadoApi
    {
        [Get("/api/v1/VehDatosGenerales")]
        Task<ResponseWrapper<PagedResponse<VehiculoListadoDto>>> GetAllAsync(
            [Query] int pageIndex = 1,
            [Query] int pageSize = 10,
            [Query] string? search = null,
            [Query] int? idVehCatStatus = null,
            CancellationToken cancellationToken = default);

        [Get("/api/v1/VehDatosGenerales/{id}")]
        Task<ResponseWrapper<VehiculoListadoDto>> GetByIdAsync(
            int id,
            CancellationToken cancellationToken = default);
    }
}