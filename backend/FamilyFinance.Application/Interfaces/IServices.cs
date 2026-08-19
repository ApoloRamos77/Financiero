using FamilyFinance.Application.DTOs;

namespace FamilyFinance.Application.Interfaces;

public interface IAuthService
{
    Task<AuthResponseDto> LoginAsync(LoginDto dto, CancellationToken ct = default);
    Task<AuthResponseDto> RefreshTokenAsync(string refreshToken, CancellationToken ct = default);
    Task<AuthResponseDto> SetupFamilyAsync(SetupFamilyDto dto, CancellationToken ct = default);
    Task RevokeTokenAsync(string refreshToken, CancellationToken ct = default);
}

public interface IFamilyService
{
    Task<FamilyDto> GetAsync(Guid familyId, CancellationToken ct = default);
    Task<FamilyDto> UpdateAsync(Guid familyId, UpdateFamilyDto dto, CancellationToken ct = default);
}

public interface IUserService
{
    Task<IEnumerable<UserDto>> GetByFamilyAsync(Guid familyId, CancellationToken ct = default);
    Task<UserDto> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<UserDto> CreateAsync(Guid familyId, CreateUserDto dto, CancellationToken ct = default);
    Task<UserDto> UpdateAsync(Guid id, UpdateUserDto dto, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}

public interface IContributorService
{
    Task<IEnumerable<ContributorDto>> GetByFamilyAsync(Guid familyId, CancellationToken ct = default);
    Task<ContributorDto> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<ContributorDto> CreateAsync(Guid familyId, CreateContributorDto dto, CancellationToken ct = default);
    Task<ContributorDto> UpdateAsync(Guid id, UpdateContributorDto dto, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}

public interface IVentureService
{
    Task<IEnumerable<VentureDto>> GetByFamilyAsync(Guid familyId, CancellationToken ct = default);
    Task<VentureSummaryDto> GetSummaryAsync(Guid id, CancellationToken ct = default);
    Task<VentureDto> CreateAsync(Guid familyId, CreateVentureDto dto, CancellationToken ct = default);
    Task<VentureDto> UpdateAsync(Guid id, UpdateVentureDto dto, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}

public interface IMovementService
{
    Task<PagedResultDto<MovementDto>> GetByFamilyAsync(Guid familyId, MovementFilterDto filter, CancellationToken ct = default);
    Task<MovementDto> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<MovementDto> CreateAsync(Guid familyId, Guid userId, CreateMovementDto dto, CancellationToken ct = default);
    Task<MovementDto> UpdateAsync(Guid id, Guid userId, UpdateMovementDto dto, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
    Task<CalendarMonthDto> GetCalendarAsync(Guid familyId, int year, int month, CancellationToken ct = default);
    Task<ComplianceDto> GetComplianceAsync(Guid familyId, int year, int month, CancellationToken ct = default);
}

public interface ICategoryService
{
    Task<IEnumerable<CategoryDto>> GetByFamilyAsync(Guid familyId, CancellationToken ct = default);
    Task<CategoryDto> CreateAsync(Guid familyId, CreateCategoryDto dto, CancellationToken ct = default);
    Task<CategoryDto> UpdateAsync(Guid id, UpdateCategoryDto dto, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}

public interface IAccountService
{
    Task<IEnumerable<AccountDto>> GetByFamilyAsync(Guid familyId, CancellationToken ct = default);
    Task<AccountDto> CreateAsync(Guid familyId, CreateAccountDto dto, CancellationToken ct = default);
    Task<AccountDto> UpdateAsync(Guid id, UpdateAccountDto dto, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}

public interface IGoalService
{
    Task<IEnumerable<GoalDto>> GetByFamilyAsync(Guid familyId, CancellationToken ct = default);
    Task<GoalDto> CreateAsync(Guid familyId, CreateGoalDto dto, CancellationToken ct = default);
    Task<GoalDto> UpdateAsync(Guid id, UpdateGoalDto dto, CancellationToken ct = default);
    Task<GoalDto> UpdateAmountAsync(Guid id, decimal amount, CancellationToken ct = default);
    Task DeleteAsync(Guid id, CancellationToken ct = default);
}

public interface IAlertService
{
    Task<IEnumerable<AlertDto>> GetByFamilyAsync(Guid familyId, CancellationToken ct = default);
    Task MarkAsReadAsync(Guid id, CancellationToken ct = default);
    Task DismissAsync(Guid id, CancellationToken ct = default);
    Task<IEnumerable<AlertConfigDto>> GetConfigsAsync(Guid familyId, CancellationToken ct = default);
    Task UpdateConfigAsync(Guid id, UpdateAlertConfigDto dto, CancellationToken ct = default);
    Task GenerateAlertsAsync(Guid familyId, CancellationToken ct = default);
}

public interface IDashboardService
{
    Task<DashboardSummaryDto> GetSummaryAsync(Guid familyId, int? year = null, int? month = null, CancellationToken ct = default);
    Task<DashboardChartsDto> GetChartsAsync(Guid familyId, int? year = null, int? month = null, CancellationToken ct = default);
}

public interface IReportService
{
    Task<MonthlyReportDto> GetMonthlyAsync(Guid familyId, int year, int month, CancellationToken ct = default);
    Task<AnnualReportDto> GetAnnualAsync(Guid familyId, int year, CancellationToken ct = default);
    Task<byte[]> ExportPdfAsync(Guid familyId, int year, int month, CancellationToken ct = default);
    Task<byte[]> ExportCsvAsync(Guid familyId, MovementFilterDto filter, CancellationToken ct = default);
}

public interface IAnalysisService
{
    Task<AnalysisInsightsDto> GetInsightsAsync(Guid familyId, CancellationToken ct = default);
}
