using Cavex.Principal.Common;
using Cavex.Principal.Models.VehCatGasolineras;
using Refit;

namespace Cavex.Principal.ApiClients.VehCatGasolineras
{
    public interface IVehCatGasolinerasApi
    {
        [Get("/api/v1/VehCatGasolineras")]
        Task<ResponseWrapper<PagedResponse<VehCatGasolinerasDto>>> GetAllAsync(
            [Query] int? pageIndex = null,
            [Query] int? pageSize = null,
            [Query] string? search = null,
            [Query] int? status = null,
            CancellationToken cancellationToken = default);

        [Get("/api/v1/VehCatGasolineras/{id}")]
        Task<ResponseWrapper<VehCatGasolinerasDto>> GetByIdAsync(int id, CancellationToken cancellationToken = default);

        [Post("/api/v1/VehCatGasolineras")]
        Task<ResponseWrapper<VehCatGasolinerasDto>> CreateAsync([Body] RequestWrapper<VehCatGasolinerasSaveDto> request, CancellationToken cancellationToken = default);

        [Put("/api/v1/VehCatGasolineras/{id}")]
        Task<ResponseWrapper<VehCatGasolinerasDto>> UpdateAsync(int id, [Body] RequestWrapper<VehCatGasolinerasEditDto> request, CancellationToken cancellationToken = default);

        [Delete("/api/v1/VehCatGasolineras/{id}")]
        Task<ResponseWrapper<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default);
    }
}
