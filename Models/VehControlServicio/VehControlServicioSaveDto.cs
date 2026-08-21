using System.ComponentModel.DataAnnotations;

namespace Cavex.Principal.Models.VehControlServicio
{
    public class VehControlServicioSaveDto
    {
        public int Id { get; set; }

        public string? StrUrlComprobantePago { get; set; }

        [Required(ErrorMessage = "El vehiculo es obligatorio.")]
        [Display(Name = "Vehiculo")]
        public int IdVehDatosGenerales { get; set; }

        [Required(ErrorMessage = "La fecha de servicio es obligatoria.")]
        [Display(Name = "Fecha de servicio")]
        public DateOnly DteFechaServicio { get; set; }

        [Required(ErrorMessage = "El kilometraje actual es obligatorio.")]
        [Display(Name = "Kilometraje actual")]
        public decimal DecKilometrajeActual { get; set; }

        [Required(ErrorMessage = "El taller es obligatorio.")]
        [Display(Name = "Taller")]
        public int IdVehCatTaller { get; set; }

        public int IdVehCatTipoServicio { get; set; }

        [StringLength(500, ErrorMessage = "El valor no puede superar los 500 caracteres.")]
        [Display(Name = "Descripcion")]
        public string? StrDescripcion { get; set; }

        public decimal MnyCostoManoObra { get; set; }

        public decimal MnyCostoRefacciones { get; set; }

        public int IdVehFormaPago { get; set; } = 1;

        public int IdVehCatResponsableServicio { get; set; }

        public int IdVehCatResponsable { get; set; } = 0;

        public int IdEmpEmpleadoChofer { get; set; }

        public int IdEmpEmpleado { get; set; } = 0;

        public int? IntProximoServicioPorKm { get; set; }

        public DateOnly? DteProximoServicioPorFecha { get; set; }

        public int IdVehCatStatus { get; set; } = 0;
    }
}


        