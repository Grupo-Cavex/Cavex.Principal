using System.ComponentModel.DataAnnotations;

namespace Cavex.Principal.Models.VehAsignacionVehiculos
{
    public class VehAsignacionVehiculosDto
    {
        public int Id { get; set; }

        public int IdVehDatosGenerales { get; set; }

        [Display(Name = "Vehiculo")]
        public string StrVehDatosGenerales { get; set; } = string.Empty;

        public int IdEmpEmpleado { get; set; }

        [Display(Name = "Empleado")]
        public string StrEmpEmpleado { get; set; } = string.Empty;

        [Display(Name = "Fecha de asignacion")]
        public DateTime DteFechaAsigncion { get; set; }
        [Display(Name = "Fecha de finalizacion")]
        public DateTime? DteFechaFinalizacion { get; set; }

        [Display(Name = "Kilometraje inicial")]
        public decimal DecKilometrajeInicial { get; set; }

        [Display(Name = "Kilometraje final")]
        public decimal? DecKilometrajeFinal { get; set; }

        [Display(Name = "Kilometraje total")]
        public decimal? DecKilometrajeTotal { get; set; }
        public int IdVehCatStatus { get; set; }

        [Display(Name = "Status")]
        public string StrVehCatStatus { get; set; } = string.Empty;
    }
}
