using System.ComponentModel.DataAnnotations;

namespace Cavex.Principal.Models.VehCatMarcaLlanta
{

    public class VehServicioDetalleDto
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
    }
        public class VehRefaccionesUsadasCreateApiDto
    {
            
        public int IdVehCatRefacciones { get; set; } // FK a la refaccion usada
        public int IdVehServicioDetalle { get; set; } // FK al servicio detalle ya creado
        
        }




    }
    




