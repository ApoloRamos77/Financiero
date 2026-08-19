using FamilyFinance.Application.Interfaces;
using FamilyFinance.Application.Services;
using Microsoft.Extensions.DependencyInjection;

namespace FamilyFinance.Application.Extensions;

public static class ApplicationServiceExtensions
{
    public static IServiceCollection AddApplicationServices(this IServiceCollection services)
    {
        services.AddScoped<IAuthService, AuthService>();
        services.AddScoped<IFamilyService, FamilyService>();
        services.AddScoped<IUserService, UserService>();
        services.AddScoped<IContributorService, ContributorService>();
        services.AddScoped<IVentureService, VentureService>();
        services.AddScoped<IMovementService, MovementService>();
        services.AddScoped<ICategoryService, CategoryService>();
        services.AddScoped<IAccountService, AccountService>();
        services.AddScoped<IGoalService, GoalService>();
        services.AddScoped<IAlertService, AlertService>();
        services.AddScoped<IDashboardService, DashboardService>();
        services.AddScoped<IReportService, ReportService>();
        services.AddScoped<IAnalysisService, AnalysisService>();
        return services;
    }
}
