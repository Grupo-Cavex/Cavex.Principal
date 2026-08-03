using Cavex.Principal.Common;
using Cavex.Principal.Models.VehControlServicio;
using Refit;

namespace Cavex.Principal.ApiClients.VehControlServicio
{
    public interface IVehControlServicioApi
    {
        [Get("/api/v1/VehControlServicio")]
        Task<ResponseWrapper<PagedResponse<VehControlServicioDto>>> GetAllAsync(
            [Query] int? pageIndex = 1,
            [Query] int? pageSize = 1000,
            [Query] string? search = null,
            CancellationToken cancellationToken = default);

        [Get("/api/v1/VehControlServicio/{id}")]
        Task<ResponseWrapper<VehControlServicioDto>> GetByIdAsync(int id, CancellationToken cancellationToken = default);

        [Post("/api/v1/VehControlServicio")]
        Task<ResponseWrapper<VehControlServicioDto>> CreateAsync([Body] RequestWrapper<VehControlServicioSaveDto> dto, CancellationToken cancellationToken = default);

        [Put("/api/v1/VehControlServicio/{id}")]
        Task<ResponseWrapper<VehControlServicioDto>> UpdateAsync(int id, [Body] RequestWrapper<VehControlServicioEditDto> dto, CancellationToken cancellationToken = default);

        [Delete("/api/v1/VehControlServicio/{id}")]
        Task<ResponseWrapper<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default);
    }
}

