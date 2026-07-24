using System.ComponentModel.DataAnnotations;

namespace Cavex.Principal.Models.VehControlServicio
{
    public class VehControlServicioSaveDto
    {
    
        [Required(ErrorMessage = "El vehiculo es obligatorio.")]
        [Display(Name = "Vehiculo")]
        public int IdVehDatosGenerales { get; set; }


        [Required(ErrorMessage = "La fecha de servicio es obligatoria.")]
        [Display(Name = "Fecha de servicio")]
        public DateTime DteFechaServicio { get; set; }

        [Required(ErrorMessage = "El kilometraje actual es obligatorio.")]
        [Display(Name = "Kilometraje actual")]
        public decimal DecKilometrajeActual { get; set; }

        [Required(ErrorMessage = "El taller es obligatorio.")]
        [Display(Name = "Taller")]
        public int IdVehCatTaller { get; set; }

        [Required(ErrorMessage = "El encargado es obligatorio.")]
        [Display(Name = "Encargado")]
        public int IdEmpEmpleado { get; set; } = 0;

        [StringLength(500, ErrorMessage = "El valor no puede superar los 500 caracteres.")]
        [Display(Name = "Descripcion")]
        public string? StrDescripcion { get; set; }

        [Required(ErrorMessage = "El encargado es obligatorio.")]
        [Display(Name = "Encargado")]
        public int IdVehCatResponsable { get; set; } = 0;

        [Required(ErrorMessage = "El estatus es obligatorio.")]
        [Display(Name = "Status")]
        public int IdVehCatStatus { get; set; } = 0;
    }
}

        