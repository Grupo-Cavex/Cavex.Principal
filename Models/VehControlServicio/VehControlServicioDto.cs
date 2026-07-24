using System.ComponentModel.DataAnnotations;

namespace Cavex.Principal.Models.VehControlServicio
{
    public class VehControlServicioDto
    {
        public int Id { get; set; }

        public int IdVehDatosGenerales { get; set; }

        [Display(Name = "Vehiculo")]
        public string StrVehDatosGenerales { get; set; } = string.Empty;

        public int IdEmpEmpleado { get; set; }
        [Display(Name = "Encargado")]
        public string StrEmpEmpleado { get; set; } = string.Empty;
       
        public int IdVehCatResponsableServicio { get; set; }

        [Display(Name = "Responsable de servicio")]
        public string StrVehCatResponsableServicio { get; set; } = string.Empty;


        [Display(Name = "Fecha de servicio")]
        public DateTime DteFechaInicio { get; set; }

        public int IdVehCatTaller { get; set; }

        [Display(Name = "Taller")]
        public string StrVehCatTaller { get; set; } = string.Empty;

        [Display(Name ="Kilometraje Actual")]
        public long LngKilometrajeActual { get; set; }

        public int IdVehServicioDetalle { get; set; }
        [Display (Name ="Detalle del servicio")]

        public string? StrVehServicioDetalle { get; set; }


        [Display(Name = "Descripcion")]
        public string? StrDescripcion { get; set; }

        public int IdVehCatStatus { get; set; }
        [Display(Name = "Status")]
        public string StrVehCatStatus { get; set; } = string.Empty ;

    }
}

        