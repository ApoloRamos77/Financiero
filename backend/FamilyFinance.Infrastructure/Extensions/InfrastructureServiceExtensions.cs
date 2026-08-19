using FamilyFinance.Infrastructure.Data;
using FamilyFinance.Infrastructure.Repositories;
using FamilyFinance.Application.Interfaces.Repositories;
using Microsoft.Extensions.DependencyInjection;

namespace FamilyFinance.Infrastructure.Extensions;

public static class InfrastructureServiceExtensions
{
    public static IServiceCollection AddInfrastructureServices(this IServiceCollection services)
    {
        // Repositories
        services.AddScoped(typeof(IRepository<>), typeof(Repository<>));
        services.AddScoped<IMovementRepository, MovementRepository>();
        services.AddScoped<IUserRepository, UserRepository>();
        services.AddScoped<IFamilyRepository, FamilyRepository>();

        return services;
    }
}
