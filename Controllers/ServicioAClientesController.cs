using Cavex.Principal.Models.ServicioAClientes;
using Cavex.Principal.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace Cavex.Principal.Controllers
{
    public class ServicioAClientesController : Controller
    {
        private readonly IServicioAClientesService _service;

        public ServicioAClientesController(IServicioAClientesService service)
        {
            _service = service;
        }

        public async Task<IActionResult> Index(CancellationToken cancellationToken)
        {
            var response = await _service.ObtenerTodosAsync(cancellationToken);

            if (!response.Success)
            {
                TempData["ErrorMessage"] = response.Message;
            }

            return View(response.Data?.Items ?? []);
        }

        public async Task<IActionResult> Details(int id, CancellationToken cancellationToken)
        {
            var response = await _service.ObtenerPorIdAsync(id, cancellationToken);

            if (!response.Success || response.Data is null)
            {
                TempData["ErrorMessage"] = response.Message;
                return RedirectToAction(nameof(Index));
            }

            return View(response.Data);
        }

        public IActionResult Create()
        {
            return View();
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Create(ServicioAClienteDto model, CancellationToken cancellationToken)
        {
            if (!ModelState.IsValid)
            {
                return View(model);
            }

            var response = await _service.CrearAsync(model, cancellationToken);

            if (!response.Success)
            {
                ModelState.AddModelError(string.Empty, response.Message ?? "No fue posible crear el servicio a cliente.");
                return View(model);
            }

            TempData["SuccessMessage"] = response.Message;

            return RedirectToAction(nameof(Index));
        }

        public async Task<IActionResult> Edit(int id, CancellationToken cancellationToken)
        {
            var response = await _service.ObtenerPorIdAsync(id, cancellationToken);

            if (!response.Success || response.Data is null)
            {
                TempData["ErrorMessage"] = response.Message;
                return RedirectToAction(nameof(Index));
            }

            return View(response.Data);
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> Edit(int id, ServicioAClienteDto model, CancellationToken cancellationToken)
        {
            if (id != model.Id)
            {
                return NotFound();
            }

            if (!ModelState.IsValid)
            {
                return View(model);
            }

            var response = await _service.ActualizarAsync(id, model, cancellationToken);

            if (!response.Success)
            {
                ModelState.AddModelError(string.Empty, response.Message ?? "No fue posible actualizar el servicio a cliente.");
                return View(model);
            }

            TempData["SuccessMessage"] = response.Message;

            return RedirectToAction(nameof(Index));
        }

        public async Task<IActionResult> Delete(int id, CancellationToken cancellationToken)
        {
            var response = await _service.ObtenerPorIdAsync(id, cancellationToken);

            if (!response.Success || response.Data is null)
            {
                TempData["ErrorMessage"] = response.Message;
                return RedirectToAction(nameof(Index));
            }

            return View(response.Data);
        }

        [HttpPost, ActionName("Delete")]
        [ValidateAntiForgeryToken]
        public async Task<IActionResult> DeleteConfirmed(int id, CancellationToken cancellationToken)
        {
            var response = await _service.EliminarAsync(id, cancellationToken);

            TempData[response.Success ? "SuccessMessage" : "ErrorMessage"] = response.Message;

            return RedirectToAction(nameof(Index));
        }
    }
}
