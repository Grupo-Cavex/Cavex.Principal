using System.ComponentModel.DataAnnotations;

namespace Cavex.Principal.Models.ServicioAClientes
{
    public class ServicioAClienteDto
    {
        public int Id { get; set; }

        [Required(ErrorMessage = "El valor es obligatorio.")]
        [StringLength(100, ErrorMessage = "El valor no puede superar los 100 caracteres.")]
        public string strValor { get; set; } = string.Empty;

        [Required(ErrorMessage = "La descripcion es obligatoria.")]
        [StringLength(250, ErrorMessage = "La descripcion no puede superar los 250 caracteres.")]
        public string strDescripcion { get; set; } = string.Empty;

        // Campo Agregado para coincidir con back (ejemplo)
        public int IdCatStatus { get; set; } = 1;
    }
}
