using Cavex.Principal.Common;
using Cavex.Principal.Models.VehCatAseguradora;
using Refit;

namespace Cavex.Principal.ApiClients.VehCatAseguradora
{
    public interface IVehCatAseguradoraApi
    {
        [Get("/api/v1/VehCatAseguradora")]
        Task<ResponseWrapper<PagedResponse<VehCatAseguradoraDto>>> GetAllAsync(
            [Query] int? pageIndex = null,
            [Query] int? pageSize = null,
            [Query] string? search = null,
            [Query] int? status = null,
            CancellationToken cancellationToken = default);

        [Get("/api/v1/VehCatAseguradora/{id}")]
        Task<ResponseWrapper<VehCatAseguradoraDto>> GetByIdAsync(int id, CancellationToken cancellationToken = default);

        [Post("/api/v1/VehCatAseguradora")]
        Task<ResponseWrapper<VehCatAseguradoraDto>> CreateAsync([Body] VehCatAseguradoraSaveDto dto, CancellationToken cancellationToken = default);

        [Put("/api/v1/VehCatAseguradora")]
        Task<ResponseWrapper<VehCatAseguradoraDto>> UpdateAsync([Body] VehCatAseguradoraEditDto dto, CancellationToken cancellationToken = default);

        [Delete("/api/v1/VehCatAseguradora/{id}")]
        Task<ResponseWrapper<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default);
    }
}
