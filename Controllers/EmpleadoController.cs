using Microsoft.AspNetCore.Mvc;

namespace Cavex.Principal.Controllers
{
    public class EmpleadoController : Controller
    {
        [HttpGet]
        public IActionResult CrearEmpleado()
        {
            return View("~/Views/Empleado/Create.cshtml");
        }
    }
}
