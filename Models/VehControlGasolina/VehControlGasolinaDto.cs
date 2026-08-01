using System.ComponentModel.DataAnnotations;

namespace Cavex.Principal.Models.VehControlGasolina
{
    public class VehControlGasolinaDto
    {
        public int Id { get; set; }

        public int IdVehDatosGenerales { get; set; }

        [Display(Name = "Vehiculo")]
        public string StrVehDatosGenerales { get; set; } = string.Empty;

        [Display(Name = "Fecha de carga")]
        public DateTime DteFechaCarga { get; set; }

        [Display(Name = "Monto pagado")]
        public decimal MnyMontoPagado { get; set; }

        [Display(Name = "Precio por litro")]
        public decimal MnyPrecioLitro { get; set; }

        [Display(Name = "Kilometraje actual")]
        public decimal DecKilometrajeActual { get; set; }

        public int IdVehFormaPago { get; set; }

        [Display(Name = "Forma de pago")]
        public string StrVehFormaPago { get; set; } = string.Empty;

        [Display(Name = "Comprobante de pago")]
        public string? StrUrlComprobantePago { get; set; }

        [Display(Name = "Evidencia")]
        public string? StrUrlEvidencia { get; set; }

        public int IdVehCatGasolineras { get; set; }

        [Display(Name = "Gasolinera")]
        public string StrVehCatGasolineras { get; set; } = string.Empty;

        public int IdEmpEmpleado { get; set; }

        [Display(Name = "Empleado")]
        public string StrEmpEmpleado { get; set; } = string.Empty;
    }
}
