using System.ComponentModel.DataAnnotations;

namespace Cavex.Principal.Models.VehDaniosAccidentes
{
    public class VehDaniosAccidentesDto
    {
        public int Id { get; set; }

        public int IdVehDatosGenerales { get; set; }

        [Display(Name = "Vehiculo")]
        public string StrVehDatosGenerales { get; set; } = string.Empty;

        public int IdEmpEmpleado { get; set; }

        [Display(Name = "Empleado")]
        public string StrEmpEmpleado { get; set; } = string.Empty;

        [Display(Name = "Fecha del evento")]
        public DateTime DteFechaEvento { get; set; }

        [Display(Name = "Descripcion")]
        public string StrDescripcion { get; set; } = string.Empty;

        [Display(Name = "Ubicacion")]
        public string? StrUbicacion { get; set; }

        [Display(Name = "Monto de reparacion")]
        public decimal? MnyMontoReparacion { get; set; }

        [Display(Name = "Cubierto por seguro")]
        public bool BitCubiertoPorSeguro { get; set; }

        public int? IdVehSeguro { get; set; }

        [Display(Name = "Seguro")]
        public string? StrVehSeguro { get; set; }

        public int IdVehCatStatus { get; set; }

        [Display(Name = "Estatus")]
        public string StrVehCatStatus { get; set; } = string.Empty;

        [Display(Name = "Evidencia")]
        public string? StrUrlEvidencia { get; set; }

        [Display(Name = "Observaciones")]
        public string? StrObservaciones { get; set; }
    }
}
