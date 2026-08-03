using System.ComponentModel.DataAnnotations;

namespace Cavex.Principal.Models.VehDatosGenerales
{
    public class VehDatosGeneralesSaveDto
    {
        [Required(ErrorMessage = "El numero de serie es obligatorio.")]
        [StringLength(20, ErrorMessage = "El valor no puede superar los 20 caracteres.")]
        [Display(Name = "Numero de serie")]
        public string StrNumSerie { get; set; } = string.Empty;

        [Required(ErrorMessage = "La marca es obligatoria.")]
        [Display(Name = "Marca")]
        public int IdVehCatMarcaVehiculo { get; set; }

        [Required(ErrorMessage = "El modelo es obligatorio.")]
        [StringLength(250, ErrorMessage = "El valor no puede superar los 250 caracteres.")]
        [Display(Name = "Modelo")]
        public string StrModelo { get; set; } = string.Empty;

        [Required(ErrorMessage = "El anio es obligatorio.")]
        [Display(Name = "Anio")]
        public int IntAnio { get; set; }

        [StringLength(250, ErrorMessage = "El valor no puede superar los 250 caracteres.")]
        [Display(Name = "Version")]
        public string? StrVersion { get; set; }

        [Required(ErrorMessage = "El color es obligatorio.")]
        [Display(Name = "Color")]
        public int IdVehCatColor { get; set; }

        [Required(ErrorMessage = "La placa es obligatoria.")]
        [StringLength(20, ErrorMessage = "El valor no puede superar los 20 caracteres.")]
        [Display(Name = "Placa")]
        public string StrPlaca { get; set; } = string.Empty;


        [StringLength(17, MinimumLength = 11, ErrorMessage = "El número de motor debe tener entre 11 y 17 caracteres.")]
        [Display(Name = "Numero de motor")]
        public string? StrNumMotor { get; set; }

        [Required(ErrorMessage = "El tipo de vehiculo es obligatorio.")]
        [Display(Name = "Tipo de vehiculo")]
        public int IdVehCatTipoVehiculo { get; set; }

        [Required(ErrorMessage = "La capacidad es obligatoria.")]
        [Display(Name = "Capacidad")]
        public int IdVehCatCapacidad { get; set; }

        [Required(ErrorMessage = "El tipo de combustible es obligatorio.")]
        [Display(Name = "Tipo de combustible")]
        public int IdVehCatTipoCombustible { get; set; }

        [Display(Name = "Kilometraje actual")]
        public decimal DecKilometrajeActual { get; set; } = 0;

        [Required(ErrorMessage = "El estatus es obligatorio.")]
        [Display(Name = "Estatus")]
        public int IdVehCatStatus { get; set; }

        [StringLength(2048, ErrorMessage = "El valor no puede superar los 2048 caracteres.")]
        [Display(Name = "Foto")]
        public string? StrUrlFoto { get; set; }

        [Required(ErrorMessage = "La fecha de asignación es obligatoria.")]
        [Display(Name = "Fecha de asignación")]
        public DateOnly DteFechaAsignacion { get; set; } 

        [StringLength(500, ErrorMessage = "El valor no puede superar los 500 caracteres.")]
        [Display(Name = "Observaciones")]
        public string? StrObservaciones { get; set; }

        [StringLength(500, ErrorMessage = "El valor no puede superar los 500 caracteres.")]
        [Display(Name = "Motor")]
        public string? StrMotor { get; set; }

        [Display(Name = "Último mantenimiento")]
        public DateOnly? DteUltimoMantenimiento { get; set; }

        [Display(Name = "Próximo mantenimiento")]
        public DateOnly? DteProximoMantenimiento { get; set; }

        [Required(ErrorMessage = "La transmision es obligatoria.")]
        [Display(Name = "Tipo de Transmision")]
        public int IdVehCatTransmision { get; set; }
    }
}
