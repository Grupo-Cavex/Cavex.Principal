using System.ComponentModel.DataAnnotations;

namespace Cavex.Principal.Models.VehInfracciones
{
    public class VehInfraccionesDto
    {
        public int Id { get; set; }

        public int IdVehDatosGenerales { get; set; }

        [Display(Name = "Vehiculo")]
        public string StrVehDatosGenerales { get; set; } = string.Empty;

        public int IdEmpEmpleado { get; set; }

        [Display(Name = "Empleado")]
        public string StrEmpEmpleado { get; set; } = string.Empty;

        [Display(Name = "Fecha de infraccion")]
        public DateTime DteFechaInfraccion { get; set; }

        [Display(Name = "Motivo")]
        public string StrMotivo { get; set; } = string.Empty;

        [Display(Name = "Monto pagado")]
        public decimal? MnyMontoPagado { get; set; }

        public int IdVehCatStatus { get; set; }

        [Display(Name = "Estatus")]
        public string StrVehCatStatus { get; set; } = string.Empty;

        [Display(Name = "Fecha de pago")]
        public DateOnly? DteFechaPago { get; set; }

        public int? IdVehFormaPago { get; set; }

        [Display(Name = "Forma de pago")]
        public string? StrVehFormaPago { get; set; }

        [Display(Name = "Comprobante de pago")]
        public string? StrUrlComprobantePago { get; set; }
        [Display(Name = "Evidencia")]
        public string? StrUrlEvidencia { get; set; }


        [Display(Name = "Observaciones")]
        public string? StrObservaciones { get; set; }
    }
}
