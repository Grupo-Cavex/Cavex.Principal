using System.ComponentModel.DataAnnotations;

namespace Cavex.Principal.Models.VehInfracciones
{
    public class VehInfraccionesSaveDto
    {
        [Required(ErrorMessage = "El vehiculo es obligatorio.")]
        [Display(Name = "Vehiculo")]
        public int IdVehDatosGenerales { get; set; }

        [Required(ErrorMessage = "El empleado es obligatorio.")]
        [Display(Name = "Empleado")]
        public int IdEmpEmpleado { get; set; }

        [Required(ErrorMessage = "La fecha de infraccion es obligatoria.")]
        [Display(Name = "Fecha de infraccion")]
        public DateTime DteFechaInfraccion { get; set; }

        [Required(ErrorMessage = "El motivo es obligatorio.")]
        [StringLength(500, ErrorMessage = "El valor no puede superar los 500 caracteres.")]
        [Display(Name = "Motivo")]
        public string StrMotivo { get; set; } = string.Empty;

        [Display(Name = "Monto pagado")]
        public decimal? MnyMontoPagado { get; set; }

        [Required(ErrorMessage = "El estatus es obligatorio.")]
        [Display(Name = "Estatus")]
        public int IdVehCatStatus { get; set; }

        [Display(Name = "Fecha de pago")]
        public DateOnly? DteFechaPago { get; set; }

        [Display(Name = "Forma de pago")]
        public int? IdVehFormaPago { get; set; }

        [StringLength(2048, ErrorMessage = "El valor no puede superar los 2048 caracteres.")]
        [Display(Name = "Comprobante de pago")]
        public string? StrUrlComprobantePago { get; set; }
        
        [StringLength(2048, ErrorMessage = "El valor no puede superar los 2048 caracteres.")]
        [Display(Name = "Evidencia")]
        public string? StrUrlEvidencia { get; set; }


        [StringLength(2048, ErrorMessage = "El valor no puede superar los 2048 caracteres.")]
        [Display(Name = "Evidencias")]
        public string? StrUrlEvidencia { get; set; }

        [StringLength(500, ErrorMessage = "El valor no puede superar los 500 caracteres.")]
        [Display(Name = "Observaciones")]
        public string? StrObservaciones { get; set; }
    }
}
