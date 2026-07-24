namespace Cavex.Principal.Models.VehiculoListado
{
    public class VehiculoListadoDto
    {
        public int Id { get; set; }

        public string StrPlaca { get; set; } = string.Empty;
        public string StrNumSerie { get; set; } = string.Empty;

        public int IdVehCatMarcaVehiculo { get; set; }
        public string StrMarca { get; set; } = string.Empty;

        public string StrModelo { get; set; } = string.Empty;
        public int IntAnio { get; set; }
        public string? StrVersion { get; set; }

        public int IdVehCatColor { get; set; }
        public string StrColor { get; set; } = string.Empty;

        public decimal DecKilometrajeActual { get; set; }
        public int IdVehCatStatus { get; set; }
    }
}