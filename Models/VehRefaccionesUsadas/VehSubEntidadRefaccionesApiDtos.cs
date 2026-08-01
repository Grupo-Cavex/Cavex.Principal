using System.ComponentModel.DataAnnotations;

namespace Cavex.Principal.Models.VehRefaccionesUsadas
{
    public class VehSubEntidadRefaccionesApiDtos
    {

        public int Id { get; set; }


    }
        public class VehServicioDetalleCreateApiDto
        {
        public int Id { get; set; }

        public int IdVehCatTipoServicio { get; set; }

        public string? StrDescripcion { get; set; }


        public decimal? MnyCostoManoObra { get; set; }


        public decimal? MnyCostoRefacciones { get; set; }


        public decimal MnyCostoTotal { get; set; }


        public long? LngProximoServicioPorKm { get; set; }


        public DateTime? DteProximoServicioPorFecha { get; set; }

        public int IdVehFormaPago { get; set; }


        public string StrVehFormaPago { get; set; } = string.Empty;


        public string? StrUrlComprobantePago { get; set; }

        public int IdVehCatResponsableServicio { get; set; }

        public DateTime DteFechaFin { get; set; }

        public int IdVehCatRefacciones { get; set; } 
        public int IdVehServicioDetalle { get; set; } 

    }

    public class VehCatRefaccionesCreateApiDto
    {
        public int Id { get; set; }

        public required string StrValor { get; set; }

        public decimal MnyPrecio { get; set; }
    }

    public class VehRefaccionesUsadasCreateApiDto
        {
        public int IdVehServicioDetalle { get; set; }
        public int IdVehCatRefacciones { get; set; }

       

    }
}
    

