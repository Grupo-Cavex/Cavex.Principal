using Cavex.Principal.ApiClients.CatStatus;
using Cavex.Principal.ApiClients.EmpCatAreaLaboral;
using Cavex.Principal.ApiClients.EmpEmpleado;
using Cavex.Principal.ApiClients.EmpCatColonia;
using Cavex.Principal.ApiClients.ServicioAClientes;
using Cavex.Principal.ApiClients.Sucursales;
using Cavex.Principal.ApiClients.VehCatTransmision;
using Cavex.Principal.Models.VehCatTransmision;
using Cavex.Principal.Infrastructure.Policies;
using Cavex.Principal.Infrastructure.Settings;
using Cavex.Principal.Services.Implementations;
using Cavex.Principal.Services.Interfaces;
using Microsoft.Extensions.Options;
using Refit;
using System.Text.Json;
using Cavex.Principal.ApiClients.VehDatosGenerales;
using Cavex.Principal.ApiClients.VehDocumentosVehiculo;
using Cavex.Principal.ApiClients.VehTarjetaCirculacion;
using Cavex.Principal.ApiClients.VehTenencia;
using Cavex.Principal.ApiClients.VehVerificacion;
using Cavex.Principal.ApiClients.VehSeguro;
using Cavex.Principal.ApiClients.VehPermisoTransporte;
using Cavex.Principal.ApiClients.VehRevistaVehicular;
using Cavex.Principal.ApiClients.VehContratoArrendamiento;
using Cavex.Principal.ApiClients.VehPlacas;
using Cavex.Principal.ApiClients.VehControlGasolina;
using Cavex.Principal.ApiClients.VehAsignacionVehiculos;
using Cavex.Principal.ApiClients.VehControlLlanta;
using Cavex.Principal.ApiClients.VehControlServicio;
using Cavex.Principal.ApiClients.VehRefaccionesUsadas;
using Cavex.Principal.ApiClients.VehInfracciones;
using Cavex.Principal.ApiClients.VehDaniosAccidentes;
using Cavex.Principal.ApiClients.VehCatMarcaVehiculo;
using Cavex.Principal.ApiClients.VehCatTipoVehiculo;
using Cavex.Principal.ApiClients.VehCatColor;
using Cavex.Principal.ApiClients.VehCatCapacidad;
using Cavex.Principal.ApiClients.VehCatTipoCombustible;
using Cavex.Principal.ApiClients.VehCatTipoServicio;
using Cavex.Principal.ApiClients.VehCatFormaPago;
using Cavex.Principal.ApiClients.VehCatStatus;
using Cavex.Principal.ApiClients.VehCatArrendatario;
using Cavex.Principal.ApiClients.VehCatTipoPermiso;
using Cavex.Principal.ApiClients.VehCatAseguradora;
using Cavex.Principal.ApiClients.VehCatTipoCobertura;
using Cavex.Principal.ApiClients.VehCatHolograma;
using Cavex.Principal.ApiClients.VehCatPosicionLlanta;
using Cavex.Principal.ApiClients.VehCatMarcaLlanta;
using Cavex.Principal.ApiClients.VehCatResponsableServicio;
using Cavex.Principal.ApiClients.VehCatTaller;
using Cavex.Principal.ApiClients.VehCatRefacciones;
using Cavex.Principal.ApiClients.VehCatGasolineras;
using Cavex.Principal.ApiClients.VehiculoListado;

namespace Cavex.Principal.Infrastructure.Extensions
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddApplicationServices(this IServiceCollection services)
        {
            services.AddScoped<IServicioAClientesService, ServicioAClientesService>();
            services.AddScoped<IEmpCatAreaLaboralService, EmpCatAreaLaboralService>();
            services.AddScoped<IEmpEmpleadoService, EmpEmpleadoService>();
            services.AddScoped<ISucursalesService, SucursalesService>();
            services.AddScoped<ICatStatusService, CatStatusService>();

            
            services.AddScoped<IVehDatosGeneralesService, VehDatosGeneralesService>();
            services.AddScoped<IVehiculoListadoService, VehiculoListadoService>();

            services.AddScoped<IVehDocumentosVehiculoService, VehDocumentosVehiculoService>();
            services.AddScoped<IVehTarjetaCirculacionService, VehTarjetaCirculacionService>();
            services.AddScoped<IVehTenenciaService, VehTenenciaService>();
            services.AddScoped<IVehVerificacionService, VehVerificacionService>();
            services.AddScoped<IVehSeguroService, VehSeguroService>();
            services.AddScoped<IVehPermisoTransporteService, VehPermisoTransporteService>();
            services.AddScoped<IVehRevistaVehicularService, VehRevistaVehicularService>();
            services.AddScoped<IVehContratoArrendamientoService, VehContratoArrendamientoService>();
            services.AddScoped<IVehPlacasService, VehPlacasService>();
            services.AddScoped<IVehControlGasolinaService, VehControlGasolinaService>();
            services.AddScoped<IVehAsignacionVehiculosService, VehAsignacionVehiculosService>();
            services.AddScoped<IVehControlLlantaService, VehControlLlantaService>();
            services.AddScoped<IVehControlServicioService, VehControlServicioService>();
            services.AddScoped<IVehRefaccionesUsadasService, VehRefaccionesUsadasService>();
            services.AddScoped<IVehInfraccionesService, VehInfraccionesService>();
            services.AddScoped<IVehDaniosAccidentesService, VehDaniosAccidentesService>();
            services.AddScoped<IVehCatMarcaVehiculoService, VehCatMarcaVehiculoService>();
            services.AddScoped<IVehCatTipoVehiculoService, VehCatTipoVehiculoService>();
            services.AddScoped<IVehCatColorService, VehCatColorService>();
            services.AddScoped<IVehCatCapacidadService, VehCatCapacidadService>();
            services.AddScoped<IVehCatTipoCombustibleService, VehCatTipoCombustibleService>();
            services.AddScoped<IVehCatTipoServicioService, VehCatTipoServicioService>();
            services.AddScoped<IVehCatFormaPagoService, VehCatFormaPagoService>();
            services.AddScoped<IVehCatStatusService, VehCatStatusService>();
            services.AddScoped<IVehCatArrendatarioService, VehCatArrendatarioService>();
            services.AddScoped<IVehCatTipoPermisoService, VehCatTipoPermisoService>();
            services.AddScoped<IVehCatAseguradoraService, VehCatAseguradoraService>();
            services.AddScoped<IVehCatTipoCoberturaService, VehCatTipoCoberturaService>();
            services.AddScoped<IVehCatHologramaService, VehCatHologramaService>();
            services.AddScoped<IVehCatPosicionLlantaService, VehCatPosicionLlantaService>();
            services.AddScoped<IVehCatMarcaLlantaService, VehCatMarcaLlantaService>();
            services.AddScoped<IVehCatResponsableServicioService, VehCatResponsableServicioService>();
            services.AddScoped<IVehCatTallerService, VehCatTallerService>();
            services.AddScoped<IVehCatRefaccionesService, VehCatRefaccionesService>();
            services.AddScoped<IVehCatGasolinerasService, VehCatGasolinerasService>();
            services.AddScoped<IVehCatTransmisionService, VehCatTransmisionService>();


            return services;
        }

        public static IServiceCollection AddApiClients(this IServiceCollection services, IConfiguration configuration)
        {
            services.AddOptions<ApiSettings>()
                .Bind(configuration.GetSection(ApiSettings.SectionName))
                .Validate(settings => !string.IsNullOrWhiteSpace(settings.BaseUrl), "ApiSettings:BaseUrl is required.")
                .Validate(settings => Uri.TryCreate(settings.BaseUrl, UriKind.Absolute, out _), "ApiSettings:BaseUrl must be an absolute URL.")
                .ValidateOnStart();

            var refitSettings = new RefitSettings
            {
                ContentSerializer = new SystemTextJsonContentSerializer(new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true,
                    PropertyNamingPolicy = JsonNamingPolicy.CamelCase
                })
            };

            services.AddRefitClient<IServicioAClientesApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IEmpCatAreaLaboralApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<ISucursalesApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<ICatStatusApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services
                .AddRefitClient<IEmpEmpleadoApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            // Veh�culos

            services.AddRefitClient<IVehDatosGeneralesApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            //Esta es la Api que se utiliza para mostrar el listado de vehiculos en la vista de Vehiculos/Index
            services.AddRefitClient<IVehiculoListadoApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehDocumentosVehiculoApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehTarjetaCirculacionApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehTenenciaApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehVerificacionApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehSeguroApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehPermisoTransporteApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehRevistaVehicularApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehContratoArrendamientoApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehPlacasApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehControlGasolinaApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehAsignacionVehiculosApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehControlLlantaApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehControlServicioApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehRefaccionesUsadasApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehInfraccionesApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehDaniosAccidentesApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehCatTransmisionApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehCatMarcaVehiculoApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehCatTipoVehiculoApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehCatColorApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehCatCapacidadApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehCatTipoCombustibleApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehCatTipoServicioApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehCatFormaPagoApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehCatStatusApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehCatArrendatarioApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehCatTipoPermisoApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehCatAseguradoraApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehCatTipoCoberturaApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehCatHologramaApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehCatPosicionLlantaApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehCatMarcaLlantaApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehCatResponsableServicioApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehCatTallerApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehCatRefaccionesApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services.AddRefitClient<IVehCatGasolinerasApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                    var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                    client.BaseAddress = new Uri(settings.BaseUrl);
                    client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services
                .AddRefitClient<IEmpCatColoniaApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                   var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                   client.BaseAddress = new Uri(settings.BaseUrl);
                   client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            services
                .AddRefitClient<Cavex.Principal.ApiClients.ICavexGeneralCatalogApi>(refitSettings)
                .ConfigureHttpClient((sp, client) =>
                {
                   var settings = sp.GetRequiredService<IOptions<ApiSettings>>().Value;
                   client.BaseAddress = new Uri(settings.BaseUrl);
                   client.Timeout = TimeSpan.FromSeconds(settings.TimeoutSeconds);
                })
                .AddPolicyHandler(PollyPolicies.RetryPolicy())
                .AddPolicyHandler(PollyPolicies.TimeoutPolicy())
                .AddPolicyHandler(PollyPolicies.CircuitBreakerPolicy());

            return services;
        }
    }
}