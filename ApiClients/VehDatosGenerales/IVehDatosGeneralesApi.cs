using Cavex.Principal.Common;
using Cavex.Principal.Models.VehDatosGenerales;
using Refit;

namespace Cavex.Principal.ApiClients.VehDatosGenerales
{
    public interface IVehDatosGeneralesApi
    {
        [Get("/api/v1/VehDatosGenerales")]
        Task<ResponseWrapper<PagedResponse<VehDatosGeneralesDto>>> GetAllAsync(CancellationToken cancellationToken = default);

        [Get("/api/v1/VehDatosGenerales/{id}")]
        Task<ResponseWrapper<VehDatosGeneralesDto>> GetByIdAsync(int id, CancellationToken cancellationToken = default);

        [Post("/api/v1/VehDatosGenerales")]
        Task<ResponseWrapper<VehDatosGeneralesDto>> CreateAsync([Body] RequestWrapper<VehDatosGeneralesSaveDto> dto, CancellationToken cancellationToken = default);

        [Put("/api/v1/VehDatosGenerales/{id}")]
        Task<ResponseWrapper<VehDatosGeneralesDto>> UpdateAsync(int id, [Body] RequestWrapper<VehDatosGeneralesEditDto> dto, CancellationToken cancellationToken = default);

        [Delete("/api/v1/VehDatosGenerales/{id}")]
        Task<ResponseWrapper<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default);
    }
}
