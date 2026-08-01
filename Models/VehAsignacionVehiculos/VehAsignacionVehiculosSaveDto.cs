using System.ComponentModel.DataAnnotations;

namespace Cavex.Principal.Models.VehAsignacionVehiculos
{
    public class VehAsignacionVehiculosSaveDto
    {
        [Required(ErrorMessage = "El vehiculo es obligatorio.")]
        [Display(Name = "Vehiculo")]
        public int IdVehDatosGenerales { get; set; }

        [Required(ErrorMessage = "El empleado es obligatorio.")]
        [Display(Name = "Empleado")]
        public int IdEmpEmpleado { get; set; }

        [Required(ErrorMessage = "La fecha de asignacion es obligatoria.")]
        [Display(Name = "Fecha de asignacion")]
        public DateTime DteFechaAsigncion { get; set; }

        [Display(Name = "Fecha de finalizacion")]
        public DateTime? DteFechaFinalizacion { get; set; }

        [Required(ErrorMessage = "El kilometraje inicial es obligatorio.")]
        [Display(Name = "Kilometraje inicial")]
        public decimal DecKilometrajeInicial { get; set; }

        [Display(Name = "Kilometraje final")]
        public decimal? DecKilometrajeFinal { get; set; }

        [Display(Name = "Kilometraje total")]
        public decimal? DecKilometrajeTotal { get; set; }
    }
}
