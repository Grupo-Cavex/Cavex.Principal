using Cavex.Principal.Models.VehCatCapacidad;
using Cavex.Principal.Models.VehCatColor;
using Cavex.Principal.Models.VehCatMarcaVehiculo;
using Cavex.Principal.Models.VehCatTipoCombustible;
using Cavex.Principal.Models.VehCatTipoVehiculo;
using Cavex.Principal.Models.VehCatTransmision;
using System.ComponentModel.DataAnnotations;

namespace Cavex.Principal.Models.Vehiculo
{
    public class VehiculoManagerSaveDto
    {
        public int? Id { get; set; }

        //nos llevamos la entidad de la marca del vehiculo
        public VehCatMarcaVehiculoDto? VehCatMarcaVehiculo { get; set; }

        [Display(Name = "Modelo")]
        public string StrModelo { get; set; } = string.Empty;
        
        [Display(Name ="Numero de Serie")]
        public string? StrNumeroSerie { get; set; }

        [Display(Name = "Anio")]
        public int IntAnio { get; set; }

        [Display(Name = "Version")]
        public string? StrVersion { get; set; }

        [Display(Name = "Placa")]
        public string StrPlaca { get; set; } = string.Empty;

        public string StrNumMotor { get; set; } = string.Empty;

        [Display(Name = "Kilometraje actual")]
        public decimal DecKilometrajeActual { get; set; }

        public VehCatColorDto? VehCatColorDto { get; set; }

        public VehCatTipoVehiculoDto? VehCatTipoVehiculo { get; set; }

        public VehCatCapacidadDto? VehCatCapacidad { get; set; }

        public VehCatTipoCombustibleDto? VehCatTipoCombustibleDto { get; set; }

        public VehCatTransmisionDto? VehCatTransmisionDto { get; set; }

        public DateOnly? DteUltimoMantenimiento { get; set; }

        public DateOnly? DteProximoMantenimiento { get; set; }

        public string? StrDescripcion { get; set; }
    }
}
