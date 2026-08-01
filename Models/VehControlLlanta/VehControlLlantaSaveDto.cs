using System.ComponentModel.DataAnnotations;

namespace Cavex.Principal.Models.VehControlLlanta
{
    public class VehControlLlantaSaveDto
    {
        [Required(ErrorMessage = "El vehiculo es obligatorio.")]
        [Display(Name = "Vehiculo")]
        public int IdVehDatosGenerales { get; set; }

        [Required(ErrorMessage = "La marca de llanta es obligatoria.")]
        [Display(Name = "Marca de llanta")]
        public int IdVehCatMarcaLlanta { get; set; }

        [Required(ErrorMessage = "El modelo es obligatorio.")]
        [StringLength(50, ErrorMessage = "El valor no puede superar los 50 caracteres.")]
        [Display(Name = "Modelo")]
        public string StrModelo { get; set; } = string.Empty;

        [Required(ErrorMessage = "La medida es obligatoria.")]
        [StringLength(50, ErrorMessage = "El valor no puede superar los 50 caracteres.")]
        [Display(Name = "Medida")]
        public string StrMedida { get; set; } = string.Empty;

        [Required(ErrorMessage = "La fecha de compra es obligatoria.")]
        [Display(Name = "Fecha de compra")]
        public DateTime DteFechaCompra { get; set; }

        [Required(ErrorMessage = "El costo es obligatorio.")]
        [Display(Name = "Costo")]
        public decimal MnyCosto { get; set; }

        [Required(ErrorMessage = "La posicion de llanta es obligatoria.")]
        [Display(Name = "Posicion de llanta")]
        public int IdVehCatPosicionLlanta { get; set; }

        [Required(ErrorMessage = "El kilometraje actual es obligatorio.")]
        [Display(Name = "Kilometraje actual")]
        public decimal DecKilometrajeActual { get; set; }

        [Display(Name = "Fecha fin de vida estimada")]
        public DateTime? DteFechaFinVidaEstimada { get; set; }

        [Display(Name = "Fecha de rotacion")]
        public DateTime? DteFechaRotacion { get; set; }

        [Display(Name = "Fecha siguiente rotacion")]
        public DateTime? DteFechaSiguienteRotacion { get; set; }

        [StringLength(2048, ErrorMessage = "El valor no puede superar los 2048 caracteres.")]
        [Display(Name = "Evidencia")]
        public string? StrUrlEvidencia { get; set; }

        [Display(Name = "Forma de pago")]
        public int? IdVehFormaPago { get; set; }

        [StringLength(2048, ErrorMessage = "El valor no puede superar los 2048 caracteres.")]
        [Display(Name = "Comprobante de pago")]
        public string? StrUrlComprobantePago { get; set; }

        [Required(ErrorMessage = "El estatus es obligatorio.")]
        [Display(Name = "Estatus")]
        public int IdVehCatStatus { get; set; } = 1;
    }
}
