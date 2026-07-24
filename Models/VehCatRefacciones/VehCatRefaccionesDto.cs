using System.ComponentModel.DataAnnotations;

namespace Cavex.Principal.Models.VehCatRefacciones
{
    public class VehCatRefaccionesDto
    {
        public int Id { get; set; }

        [Display(Name = "Nombre")]
        public required string StrValor { get; set; }

        [Display(Name = "Precio")]
        public decimal MnyPrecio { get; set; }
    }
}
