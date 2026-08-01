using System.ComponentModel.DataAnnotations;

namespace Cavex.Principal.Models.VehControlLlanta
{
    public class VehControlLlantaDto
    {
        public int Id { get; set; }

        public int IdVehDatosGenerales { get; set; }

        [Display(Name = "Vehiculo")]
        public string StrVehDatosGenerales { get; set; } = string.Empty;

        public int IdVehCatMarcaLlanta { get; set; }

        [Display(Name = "Marca de llanta")]
        public string StrVehCatMarcaLlanta { get; set; } = string.Empty;
        public int IdVehCatFormaPago { get; set; }

        [Display(Name = "Forma de Pago")]
        public string StrVehCatFormaPago { get; set; } = string.Empty;

        [Display(Name = "Modelo")]
        public string StrModelo { get; set; } = string.Empty;

        [Display(Name = "Medida")]
        public string StrMedida { get; set; } = string.Empty;

        [Display(Name = "Fecha de compra")]
        public DateTime DteFechaCompra { get; set; }

        [Display(Name = "Costo")]
        public decimal MnyCosto { get; set; }

        public int IdVehCatPosicionLlanta { get; set; }

        [Display(Name = "Posicion de llanta")]
        public string StrVehCatPosicionLlanta { get; set; } = string.Empty;

        [Display(Name = "Kilometraje actual")]
        public decimal DecKilometrajeActual { get; set; }

        [Display(Name = "Fecha fin de vida estimada")]
        public DateTime? DteFechaFinVidaEstimada { get; set; }

        [Display(Name = "Fecha de rotacion")]
        public DateTime? DteFechaRotacion { get; set; }

        [Display(Name = "Fecha siguiente rotacion")]
        public DateTime? DteFechaSiguienteRotacion { get; set; }

        [Display(Name = "Evidencia")]
        public string? StrUrlEvidencia { get; set; }
        
        [Display(Name = "Comprobante de Pago")]
        public string? StrUrlComptobantePago { get; set; }




        public int IdVehCatStatus { get; set; }

        [Display(Name = "Estatus")]
        public string StrVehCatStatus { get; set; } = string.Empty;
    }
}
