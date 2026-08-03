using Cavex.Principal.Common;
using Cavex.Principal.Models.VehCatGasolineras;

namespace Cavex.Principal.Services.Interfaces
{
    public interface IVehCatGasolinerasService
    {
        Task<ResponseWrapper<PagedResponse<VehCatGasolinerasDto>>> ObtenerTodosAsync(int pageIndex = 1, int pageSize = 10, string? search = null, int? status = null, CancellationToken cancellationToken = default);

        Task<bool> ExistePorNombreAsync(string nombre, int? excludeId = null, CancellationToken cancellationToken = default);

        Task<ResponseWrapper<VehCatGasolinerasDto>> ObtenerPorIdAsync(int id, CancellationToken cancellationToken = default);

        Task<ResponseWrapper<VehCatGasolinerasDto>> CrearAsync(VehCatGasolinerasSaveDto dto, CancellationToken cancellationToken = default);

        Task<ResponseWrapper<VehCatGasolinerasDto>> EditarAsync(VehCatGasolinerasEditDto dto, CancellationToken cancellationToken = default);

        Task<ResponseWrapper<bool>> EliminarAsync(int id, CancellationToken cancellationToken = default);
    }
}
