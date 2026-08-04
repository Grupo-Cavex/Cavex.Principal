using Cavex.Principal.Common;
using Cavex.Principal.Models.VehCatResponsableServicio;
using Refit;

namespace Cavex.Principal.ApiClients.VehCatResponsableServicio
{
    public interface IVehCatResponsableServicioApi
    {
        [Get("/api/v1/VehCatResponsableServicio")]
        Task<ResponseWrapper<PagedResponse<VehCatResponsableServicioDto>>> GetAllAsync(
            [Query] int? pageIndex = null,
            [Query] int? pageSize = null,
            [Query] string? search = null,
            [Query] int? status = null,
            CancellationToken cancellationToken = default);

        [Get("/api/v1/VehCatResponsableServicio/{id}")]
        Task<ResponseWrapper<VehCatResponsableServicioDto>> GetByIdAsync(int id, CancellationToken cancellationToken = default);

        [Post("/api/v1/VehCatResponsableServicio")]
        Task<ResponseWrapper<VehCatResponsableServicioDto>> CreateAsync([Body] RequestWrapper<VehCatResponsableServicioSaveDto> request, CancellationToken cancellationToken = default);

        [Put("/api/v1/VehCatResponsableServicio/{id}")]
        Task<ResponseWrapper<VehCatResponsableServicioDto>> UpdateAsync(int id, [Body] RequestWrapper<VehCatResponsableServicioEditDto> request, CancellationToken cancellationToken = default);

        [Delete("/api/v1/VehCatResponsableServicio/{id}")]
        Task<ResponseWrapper<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default);
    }
}
