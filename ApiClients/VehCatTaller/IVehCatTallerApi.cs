using Cavex.Principal.Common;
using Cavex.Principal.Models.VehCatTaller;
using Refit;

namespace Cavex.Principal.ApiClients.VehCatTaller
{
    public interface IVehCatTallerApi
    {
        [Get("/api/v1/VehCatTaller")]
        Task<ResponseWrapper<PagedResponse<VehCatTallerDto>>> GetAllAsync(
            [Query] int? pageIndex = null,
            [Query] int? pageSize = null,
            [Query] string? search = null,
            [Query] int? status = null,
            CancellationToken cancellationToken = default);

        [Get("/api/v1/VehCatTaller/{id}")]
        Task<ResponseWrapper<VehCatTallerDto>> GetByIdAsync(int id, CancellationToken cancellationToken = default);

        [Post("/api/v1/VehCatTaller")]
        Task<ResponseWrapper<VehCatTallerDto>> CreateAsync([Body] RequestWrapper<VehCatTallerSaveDto> dto, CancellationToken cancellationToken = default);

        [Put("/api/v1/VehCatTaller/{id}")]
        Task<ResponseWrapper<VehCatTallerDto>> UpdateAsync(int id, [Body] RequestWrapper<VehCatTallerEditDto> dto, CancellationToken cancellationToken = default);

        [Delete("/api/v1/VehCatTaller/{id}")]
        Task<ResponseWrapper<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default);
    }
}
