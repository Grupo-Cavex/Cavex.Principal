using System.ComponentModel.DataAnnotations;

namespace Cavex.Principal.Models.VehCatGasolineras
{
    public class VehCatGasolinerasSaveDto
    {
        [Required(ErrorMessage = "El nombre es obligatorio.")]
        [StringLength(100, ErrorMessage = "El valor no puede superar los 100 caracteres.")]
        [Display(Name = "Nombre")]
        public string StrValor { get; set; } = string.Empty;


        [StringLength(500, ErrorMessage = "El valor no puede superar los 500 caracteres.")]
        [Display(Name = "Descripcion")]
        public string? StrDescripcion { get; set; } = string.Empty;

        [Required(ErrorMessage = "El estatus es obligatorio.")]
        public int IdCatStatus { get; set; } = 1;

        public int IdVehCatStatus
        {
            get => IdCatStatus;
            set => IdCatStatus = value;
        }
    }
}
