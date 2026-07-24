using System.ComponentModel.DataAnnotations;

namespace Cavex.Principal.Models.VehServicioDetalle
{
    public class VehServicioDetalleSaveDto
    {
        [StringLength(500, ErrorMessage = "El valor no puede superar los 500 caracteres.")]
        [Display(Name = "Descripcion")]
        public string? StrDescripcion { get; set; }

        
        [Display(Name = "Costo mano de obra")]
        public decimal? MnyCostoManoObra { get; set; }

       
        [Display(Name = "Costo refacciones")]
        public decimal? MnyCostoRefacciones { get; set; }

        [Display(Name = "Proximo servicio por km")]
        public long? LngProximoServicioPorKm { get; set; }

        [Display(Name = "Proximo servicio por fecha")]
        public DateTime? DteProximoServicioPorFecha { get; set; }

        [Required(ErrorMessage = "La forma de pago es obligatoria.")]
        [Display(Name = "Forma de pago")]
        public int IdVehFormaPago { get; set; }

        [StringLength(2048, ErrorMessage = "El valor no puede superar los 2048 caracteres.")]
        [Display(Name = "Comprobante de pago")]
        public string? StrUrlComprobantePago { get; set; }

        [Required(ErrorMessage = "El responsable de servicio es obligatorio.")]
        [Display(Name = "Responsable de servicio")]
        public int IdVehCatResponsableServicio { get; set; }

        [Display(Name = "Refacciones usadas")]
        public List<VehRefaccionesUsadasSaveDto> RefaccionesUsadas { get; set; } = new();

        [Display(Name = "Tipo de servicio")]
        public int IdVehCatTipoServicio { get; set; }

        [Display(Name = "Detalle del servicio")]
        public string? StrVehServicioDetalle { get; set; }

        [Display(Name= "Fecha y hora de finalizacion")]
        public DateTime DteFechaFin { get; set; }
    }

    public class VehRefaccionesUsadasSaveDto
    {
        [Required(ErrorMessage = "La refaccion es obligatoria.")]
        [Display(Name = "Refaccion")]
        public int IdVehCatRefacciones { get; set; }
    }
    public class VehCatRefaccionesSaveDto
    {
        [Required(ErrorMessage = "El nombre es obligatorio.")]
        [StringLength(100, ErrorMessage = "El valor no puede superar los 100 caracteres.")]
        [Display(Name = "Nombre")]
        public string StrValor { get; set; } = string.Empty;


        [Required(ErrorMessage = "El costo de la refaccion de obra es obligatorio.")]
        [Display(Name = "Costo Refaccion")]
        public decimal MnyPrecio { get; set; }
    }

}

    
