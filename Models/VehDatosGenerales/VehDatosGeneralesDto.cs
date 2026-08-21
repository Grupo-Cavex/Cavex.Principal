using System.ComponentModel.DataAnnotations;

namespace Cavex.Principal.Models.VehDatosGenerales
{
    public class VehDatosGeneralesDto
    {
        public int Id { get; set; }

        [Display(Name = "Numero de serie")]
        public string StrNumSerie { get; set; } = string.Empty;

        public int IdVehCatMarcaVehiculo { get; set; }

        [Display(Name = "Marca")]
        public string StrVehCatMarcaVehiculo { get; set; } = string.Empty;

        [Display(Name = "Modelo")]
        public string StrModelo { get; set; } = string.Empty;

        [Display(Name = "Anio")]
        public int IntAnio { get; set; }

        [Display(Name = "Version")]
        public string? StrVersion { get; set; }

        public int IdVehCatColor { get; set; }

        [Display(Name = "Color")]
        public string StrVehCatColor { get; set; } = string.Empty;

        [Display(Name = "Placa")]
        public string StrPlaca { get; set; } = string.Empty;

        [Display(Name = "Numero de motor")]
        public string? strNumMotor { get; set; }

        public int IdVehCatTipoVehiculo { get; set; }

        [Display(Name = "Tipo de vehiculo")]
        public string StrVehCatTipoVehiculo { get; set; } = string.Empty;

        public int IdVehCatCapacidad { get; set; }

        [Display(Name = "Capacidad")]
        public string StrVehCatCapacidad { get; set; } = string.Empty;

        public int IdVehCatTipoCombustible { get; set; }

        [Display(Name = "Tipo de combustible")]
        public string StrVehCatTipoCombustible { get; set; } = string.Empty;

        [Display(Name = "Kilometraje actual")]
        public decimal DecKilometrajeActual { get; set; }

        public int IdVehCatStatus { get; set; }

        [Display(Name = "Estatus")]
        public string StrVehCatStatus { get; set; } = string.Empty;

        [Display(Name = "Foto")]
        public string? StrUrlFoto { get; set; }

        [Display(Name = "Fecha de asignación")]
        public DateOnly DteFechaAsignacion { get; set; }

        [Display(Name = "Fecha de registro")]
        public DateOnly DteFechaRegistro { get => DteFechaAsignacion; set => DteFechaAsignacion = value; }

        [Display(Name = "Observaciones")]
        public string? StrObservaciones { get; set; }
       
        [Display(Name = "Motor")]
        public string? StrMotor { get; set; }

        [Display(Name = "Último mantenimiento")]
        public DateOnly? DteUltimoMantenimiento { get; set; }

        [Display(Name = "Próximo mantenimiento")]
        public DateOnly? DteProximoMantenimiento { get; set; }

        public int IdVehCatTransmision { get; set; }

        [Display(Name = "Tipo de transmision")]
        public string StrVehCatTransmision { get; set; } = string.Empty;

    }
}
