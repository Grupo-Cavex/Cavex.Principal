using System.ComponentModel.DataAnnotations;

namespace Cavex.Principal.Models.VehCatRefacciones
{
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
