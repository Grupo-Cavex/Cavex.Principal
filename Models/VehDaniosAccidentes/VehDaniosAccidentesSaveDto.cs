using System.ComponentModel.DataAnnotations;

namespace Cavex.Principal.Models.VehDaniosAccidentes
{
    public class VehDaniosAccidentesSaveDto
    {
        [Required(ErrorMessage = "El vehiculo es obligatorio.")]
        [Display(Name = "Vehiculo")]
        public int IdVehDatosGenerales { get; set; }

        [Required(ErrorMessage = "El empleado es obligatorio.")]
        [Display(Name = "Empleado")]
        public int IdEmpEmpleado { get; set; }

        [Required(ErrorMessage = "La fecha del evento es obligatoria.")]
        [Display(Name = "Fecha del evento")]
        public DateTime DteFechaEvento { get; set; }

        [Required(ErrorMessage = "La descripcion es obligatoria.")]
        [StringLength(500, ErrorMessage = "El valor no puede superar los 500 caracteres.")]
        [Display(Name = "Descripcion")]
        public string StrDescripcion { get; set; } = string.Empty;

        [StringLength(300, ErrorMessage = "El valor no puede superar los 300 caracteres.")]
        [Display(Name = "Ubicacion")]
        public string? StrUbicacion { get; set; }

        [Display(Name = "Monto de reparacion")]
        public decimal? MnyMontoReparacion { get; set; }

        [Display(Name = "Cubierto por seguro")]
        public bool BitCubiertoPorSeguro { get; set; } = false;

        [Display(Name = "Seguro")]
        public int? IdVehSeguro { get; set; }

        [Required(ErrorMessage = "El estatus es obligatorio.")]
        [Display(Name = "Estatus")]
        public int IdVehCatStatus { get; set; }

        [StringLength(2048, ErrorMessage = "El valor no puede superar los 2048 caracteres.")]
        [Display(Name = "Evidencia")]
        public string? StrUrlEvidencia { get; set; }

        [StringLength(500, ErrorMessage = "El valor no puede superar los 500 caracteres.")]
        [Display(Name = "Observaciones")]
        public string? StrObservaciones { get; set; }
    }
}
