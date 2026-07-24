using System.ComponentModel.DataAnnotations;

namespace Cavex.Principal.Models.VehControlGasolina
{
    public class VehControlGasolinaSaveDto
    {
        [Required(ErrorMessage = "El vehiculo es obligatorio.")]
        [Display(Name = "Vehiculo")]
        public int IdVehDatosGenerales { get; set; }

        [Required(ErrorMessage = "La fecha de carga es obligatoria.")]
        [Display(Name = "Fecha de carga")]
        public DateTime DteFechaCarga { get; set; }

        [Required(ErrorMessage = "El monto pagado es obligatorio.")]
        [Display(Name = "Monto pagado")]
        public decimal MnyMontoPagado { get; set; }

        [Required(ErrorMessage = "El precio por litro es obligatorio.")]
        [Display(Name = "Precio por litro")]
        public decimal MnyPrecioLitro { get; set; }

        [Required(ErrorMessage = "El kilometraje actual es obligatorio.")]
        [Display(Name = "Kilometraje actual")]
        public decimal DecKilometrajeActual { get; set; }

        [Required(ErrorMessage = "La forma de pago es obligatoria.")]
        [Display(Name = "Forma de pago")]
        public int IdVehFormaPago { get; set; }

        [StringLength(2048, ErrorMessage = "El valor no puede superar los 2048 caracteres.")]
        [Display(Name = "Comprobante de pago")]
        public string? StrUrlComprobantePago { get; set; }

        [StringLength(2048, ErrorMessage = "El valor no puede superar los 2048 caracteres.")]
        [Display(Name = "Evidencia")]
        public string? StrUrlEvidencia { get; set; }

        [Required(ErrorMessage = "La gasolinera es obligatoria.")]
        [Display(Name = "Gasolinera")]
        public int IdVehCatGasolineras { get; set; }

        [Required(ErrorMessage = "El empleado es obligatorio.")]
        [Display(Name = "Empleado")]
        public int IdEmpEmpleado { get; set; }
    }
}
