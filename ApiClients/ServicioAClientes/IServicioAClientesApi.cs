using Cavex.Principal.Common;
using Cavex.Principal.Models.ServicioAClientes;
using Refit;

namespace Cavex.Principal.ApiClients.ServicioAClientes
{
    public interface IServicioAClientesApi
    {

        [Get("/api/v1/CatServicios")]  
        Task<ResponseWrapper<PagedResponse<ServicioAClienteDto>>> GetAllAsync(CancellationToken cancellationToken = default);

        // Recordar
        [Get("/api/v1/CatServicios/{id}")]
        Task<ResponseWrapper<ServicioAClienteDto>> GetByIdAsync(int id, CancellationToken cancellationToken = default);

        [Post("/api/v1/CatServicios")]
        Task<ResponseWrapper<ServicioAClienteDto>> CreateAsync([Body] RequestWrapper<ServicioAClienteDto> request, CancellationToken cancellationToken = default);

        [Put("/api/v1/CatServicios/{id}")]
        Task<ResponseWrapper<ServicioAClienteDto>> UpdateAsync(int id, [Body] RequestWrapper<ServicioAClienteDto> request, CancellationToken cancellationToken = default);

        [Delete("/api/v1/CatServicios/{id}")]
        Task<ResponseWrapper<bool>> DeleteAsync(int id, CancellationToken cancellationToken = default); 
    }
}
