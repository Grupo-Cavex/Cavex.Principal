using Polly;
using Polly.Extensions.Http;

namespace Cavex.Principal.Infrastructure.Policies
{
    public static class PollyPolicies
    {
        public static IAsyncPolicy<HttpResponseMessage> RetryPolicy()
        {
            return HttpPolicyExtensions
                .HandleTransientHttpError()
                .WaitAndRetryAsync(
                    2,
                    retryAttempt => TimeSpan.FromMilliseconds(200 * retryAttempt));
        }

        public static IAsyncPolicy<HttpResponseMessage> TimeoutPolicy(int seconds = 30)
        {
            return Policy.TimeoutAsync<HttpResponseMessage>(TimeSpan.FromSeconds(seconds));
        }

        public static IAsyncPolicy<HttpResponseMessage> CircuitBreakerPolicy()
        {
            // Ajustado para entorno local/desarrollo: tolera más fallos consecutivos (100) y reduce el tiempo de bloqueo (1 seg)
            return HttpPolicyExtensions
                .HandleTransientHttpError()
                .CircuitBreakerAsync(100, TimeSpan.FromSeconds(1));
        }
    }
}
