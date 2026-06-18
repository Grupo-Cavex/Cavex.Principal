using Cavex.Principal.Common;
using Cavex.Principal.Models.ServicioAClientes;
namespace Cavex.Principal.Services.Interfaces
{
    public interface IServicioAClientesService
    {
        Task<ResponseWrapper<PagedResponse<ServicioAClienteDto>>> ObtenerTodosAsync(CancellationToken cancellationToken = default);

        Task<ResponseWrapper<ServicioAClienteDto>> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default);

        Task<ResponseWrapper<ServicioAClienteDto>> CrearAsync(ServicioAClienteDto request, CancellationToken cancellationToken = default);

        Task<ResponseWrapper<ServicioAClienteDto>> ActualizarAsync(int id, ServicioAClienteDto request, CancellationToken cancellationToken = default);

        Task<ResponseWrapper<bool>> EliminarAsync(int id, CancellationToken cancellationToken = default);
    }
}
