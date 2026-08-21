using Cavex.Principal.Common;
using Cavex.Principal.Models.VehCatAseguradora;

namespace Cavex.Principal.Services.Interfaces
{
    public interface IVehCatAseguradoraService
    {
        Task<ResponseWrapper<PagedResponse<VehCatAseguradoraDto>>> ObtenerTodosAsync(int pageIndex = 1, int pageSize = 10, string? search = null, int? status = null, CancellationToken cancellationToken = default);

        Task<bool> ExistePorNombreAsync(string nombre, int? excludeId = null, CancellationToken cancellationToken = default);

        Task<ResponseWrapper<VehCatAseguradoraDto>> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default);

        Task<ResponseWrapper<VehCatAseguradoraDto>> CrearAsync(VehCatAseguradoraSaveDto dto, CancellationToken cancellationToken = default);

        Task<ResponseWrapper<VehCatAseguradoraDto>> EditarAsync(VehCatAseguradoraEditDto dto, CancellationToken cancellationToken = default);

        Task<ResponseWrapper<bool>> EliminarAsync(int id, CancellationToken cancellationToken = default);
    }
}
