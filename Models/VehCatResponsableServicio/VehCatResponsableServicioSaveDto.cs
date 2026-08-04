using System.ComponentModel.DataAnnotations;

namespace Cavex.Principal.Models.VehCatResponsableServicio
{
    public class VehCatResponsableServicioSaveDto
    {
        [Required(ErrorMessage = "El nombre completo es obligatorio.")]
        [StringLength(100, ErrorMessage = "El valor no puede superar los 100 caracteres.")]
        [Display(Name = "Nombre Completo")]
        public string StrValor { get; set; } = string.Empty;


        [StringLength(500, ErrorMessage = "El valor no puede superar los 500 caracteres.")]
        [Display(Name = "Descripcion")]
        public string? StrDescripcion { get; set; } = string.Empty;

        [Required(ErrorMessage = "El estatus es obligatorio.")]
        public int IdVehCatStatus { get; set; } = 1;
    }
}

