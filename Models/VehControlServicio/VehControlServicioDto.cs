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
        public int IdEmpEmpleadoChofer { get; set; }

        [Display(Name = "Encargado")]
        public string StrEmpEmpleado { get; set; } = string.Empty;
       
        public int IdVehCatResponsableServicio { get; set; }

        [Display(Name = "Responsable de servicio")]
        public string StrVehCatResponsableServicio { get; set; } = string.Empty;

        public DateOnly DteFechaInicio { get; set; }
        public DateOnly DteFechaServicio { get; set; }

        public int IdVehCatTaller { get; set; }

        [Display(Name = "Taller")]
        public string StrVehCatTaller { get; set; } = string.Empty;

        public long LngKilometrajeActual { get; set; }
        public decimal DecKilometrajeActual { get; set; }

        public int IdVehCatTipoServicio { get; set; }
        public int IdVehServicioDetalle { get; set; }

        [Display(Name = "Detalle del servicio")]
        public string? StrVehServicioDetalle { get; set; }
        public string? StrVehCatTipoServicio { get; set; }

        public int IdVehCatResponsableServicio { get; set; }
        public string? StrVehCatResponsableServicio { get; set; }

        public string? StrDescripcion { get; set; }

        public decimal MnyCostoManoObra { get; set; }
        public decimal MnyCostoRefacciones { get; set; }
        public decimal? MnyCostoTotal { get; set; }

        public int IdVehFormaPago { get; set; }
        public string? StrVehFormaPago { get; set; }

        [Display(Name = "Comprobante de pago")]
        public string? StrUrlComprobantePago { get; set; }

        public int IdVehCatStatus { get; set; }
        [Display(Name = "Status")]
        public string StrVehCatStatus { get; set; } = string.Empty;
    }
}


        