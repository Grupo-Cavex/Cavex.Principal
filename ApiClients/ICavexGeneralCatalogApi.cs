using Cavex.Principal.Common;
using Cavex.Principal.Models.EmpCatGenero;
using Cavex.Principal.Models.EmpCatEstadoCivil;
using Cavex.Principal.Models.EmpCatNacionalidad;
using Cavex.Principal.Models.EmpCatTipoContratacion;
using Refit;

namespace Cavex.Principal.ApiClients
{
    public interface ICavexGeneralCatalogApi
    {
        [Get("/api/v1/EmpCatGenero")]
        Task<ResponseWrapper<PagedResponse<EmpCatGeneroDto>>> GetGenerosAsync([Query] int pageIndex, [Query] int pageSize, CancellationToken cancellationToken = default);

        [Get("/api/v1/EmpCatEstadoCivil")]
        Task<ResponseWrapper<PagedResponse<EmpCatEstadoCivilDto>>> GetEstadosCivilesAsync([Query] int pageIndex, [Query] int pageSize, CancellationToken cancellationToken = default);

        [Get("/api/v1/EmpCatNacionalidad")]
        Task<ResponseWrapper<PagedResponse<EmpCatNacionalidadDto>>> GetNacionalidadesAsync([Query] int pageIndex, [Query] int pageSize, CancellationToken cancellationToken = default);

        [Get("/api/v1/EmpCatTipoContratacion")]
        Task<ResponseWrapper<PagedResponse<EmpCatTipoContratacionDto>>> GetTiposContratacionAsync([Query] int pageIndex, [Query] int pageSize, CancellationToken cancellationToken = default);
    }
}
