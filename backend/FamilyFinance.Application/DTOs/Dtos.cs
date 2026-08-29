using FamilyFinance.Domain.Enums;

namespace FamilyFinance.Application.DTOs;

// ─── Auth ──────────────────────────────────────────────────
public record LoginDto(string Email, string Password);

public record SetupFamilyDto(
    string FamilyName,
    string Currency,
    string CurrencySymbol,
    string AdminName,
    string AdminEmail,
    string AdminPassword);

public record AuthResponseDto(
    string AccessToken,
    string RefreshToken,
    DateTime ExpiresAt,
    UserDto User);

// ─── Family ────────────────────────────────────────────────
public record FamilyDto(
    Guid Id,
    string Name,
    string Currency,
    string CurrencySymbol,
    string Timezone,
    DateTime CreatedAt);

public record UpdateFamilyDto(string Name, string Currency, string CurrencySymbol, string Timezone);

// ─── User ──────────────────────────────────────────────────
public record UserDto(
    Guid Id,
    Guid FamilyId,
    string Name,
    string Email,
    string Role,
    bool IsActive,
    string AvatarColor,
    DateTime? LastLogin,
    string? FamilyName = null);

public record CreateUserDto(string Name, string Email, string Password, string Role, string? AvatarColor);
public record UpdateUserDto(string Name, string? Email, string? Password, string Role, bool IsActive, string? AvatarColor);

// ─── Contributor ───────────────────────────────────────────
public record ContributorDto(
    Guid Id,
    Guid FamilyId,
    Guid? UserId,
    string Name,
    string ContributorType,
    decimal FixedIncome,
    string Frequency,
    int? PaymentDay,
    string? IncomeSource,
    bool IsActive,
    string? Notes,
    decimal? TotalIncomeCurrentMonth);

public record CreateContributorDto(
    Guid? UserId, string Name, string ContributorType, decimal FixedIncome,
    string Frequency, int? PaymentDay, string? IncomeSource, string? Notes);

public record UpdateContributorDto(
    string Name, string ContributorType, decimal FixedIncome,
    string Frequency, int? PaymentDay, string? IncomeSource, bool IsActive, string? Notes);

// ─── Venture ───────────────────────────────────────────────
public record VentureDto(
    Guid Id,
    Guid FamilyId,
    string Name,
    string? Description,
    Guid? ResponsibleId,
    string? ResponsibleName,
    string Status,
    DateOnly? StartDate,
    string Icon,
    string Color);

public record VentureSummaryDto(
    Guid Id,
    string Name,
    string Status,
    decimal TotalIncome,
    decimal TotalExpense,
    decimal NetProfit,
    int TotalMovements,
    IEnumerable<MovementDto> RecentMovements);

public record CreateVentureDto(
    string Name, string? Description, Guid? ResponsibleId,
    DateOnly? StartDate, string? Icon, string? Color);

public record UpdateVentureDto(
    string Name, string? Description, Guid? ResponsibleId,
    string Status, DateOnly? StartDate, string? Icon, string? Color);

// ─── Movement ──────────────────────────────────────────────
public record MovementDto(
    Guid Id,
    Guid FamilyId,
    DateOnly MovementDate,
    string Type,
    decimal Amount,
    string Concept,
    Guid? ContributorId,
    string? ContributorName,
    Guid? CategoryId,
    string? CategoryName,
    string? CategoryColor,
    Guid? VentureId,
    string? VentureName,
    Guid? AccountId,
    string? AccountName,
    string PaymentMethod,
    string? Notes,
    DateTime CreatedAt);

public record CreateMovementDto(
    DateOnly MovementDate,
    string Type,
    decimal Amount,
    string Concept,
    Guid? ContributorId,
    Guid? CategoryId,
    Guid? VentureId,
    Guid? AccountId,
    string? PaymentMethod,
    string? Notes);

public record UpdateMovementDto(
    DateOnly MovementDate,
    decimal Amount,
    string Concept,
    Guid? ContributorId,
    Guid? CategoryId,
    Guid? VentureId,
    Guid? AccountId,
    string? PaymentMethod,
    string? Notes);

public record MovementFilterDto(
    DateOnly? From = null,
    DateOnly? To = null,
    string? Type = null,
    Guid? ContributorId = null,
    Guid? CategoryId = null,
    Guid? VentureId = null,
    Guid? AccountId = null,
    decimal? MinAmount = null,
    decimal? MaxAmount = null,
    int Page = 1,
    int PageSize = 20);

public record PagedResultDto<T>(IEnumerable<T> Items, int TotalCount, int Page, int PageSize, int TotalPages);

// ─── Calendar ──────────────────────────────────────────────
public record CalendarDayDto(
    DateOnly Date,
    bool HasRecords,
    bool HasIncome,
    bool HasExpense,
    decimal DailyIncome,
    decimal DailyExpense,
    int MovementCount);

public record CalendarMonthDto(
    int Year,
    int Month,
    IEnumerable<CalendarDayDto> Days);

public record ComplianceDto(
    int Year,
    int Month,
    int TotalDays,
    int DaysElapsed,
    int DaysWithRecords,
    int DaysWithoutRecords,
    decimal CompliancePercentage);

// ─── Category ──────────────────────────────────────────────
public record CategoryDto(
    Guid Id,
    Guid FamilyId,
    string Name,
    string Type,
    Guid? ParentId,
    string? ParentName,
    string Icon,
    string Color,
    bool IsActive,
    bool IsSystem,
    IEnumerable<CategoryDto>? Children);

public record CreateCategoryDto(string Name, string Type, Guid? ParentId, string? Icon, string? Color);
public record UpdateCategoryDto(string Name, string Type, Guid? ParentId, string? Icon, string? Color, bool IsActive);

// ─── Account ───────────────────────────────────────────────
public record AccountDto(
    Guid Id,
    Guid FamilyId,
    string Name,
    string AccountType,
    decimal Balance,
    string Color,
    string Icon,
    string? BankName,
    string? LastFour,
    bool IsActive);

public record CreateAccountDto(string Name, string AccountType, decimal? InitialBalance, string? Color, string? Icon, string? BankName, string? LastFour);
public record UpdateAccountDto(string Name, string AccountType, string? Color, string? Icon, string? BankName, string? LastFour, bool IsActive);

// ─── Goal ──────────────────────────────────────────────────
public record GoalDto(
    Guid Id,
    Guid FamilyId,
    string Name,
    string GoalType,
    decimal TargetAmount,
    decimal CurrentAmount,
    decimal ProgressPercentage,
    decimal RemainingAmount,
    int? MonthsToAchieve,
    DateOnly? TargetDate,
    decimal MonthlyContribution,
    string Icon,
    string Color,
    bool IsAchieved,
    bool IsActive,
    string? Notes);

public record CreateGoalDto(string Name, string GoalType, decimal TargetAmount, DateOnly? TargetDate, decimal? MonthlyContribution, string? Icon, string? Color, string? Notes);
public record UpdateGoalDto(string Name, string GoalType, decimal TargetAmount, DateOnly? TargetDate, decimal? MonthlyContribution, string? Icon, string? Color, bool IsActive, string? Notes);

// ─── Alert ─────────────────────────────────────────────────
public record AlertDto(
    Guid Id,
    string AlertType,
    string Title,
    string Message,
    string Status,
    Guid? VentureId,
    string? VentureName,
    DateOnly AlertDate,
    DateTime? ReadAt,
    DateTime CreatedAt);

public record AlertConfigDto(
    Guid Id,
    string AlertType,
    bool IsActive,
    decimal? Threshold,
    string? Description);

public record UpdateAlertConfigDto(bool IsActive, decimal? Threshold);

// ─── Dashboard ─────────────────────────────────────────────
public record DashboardSummaryDto(
    int Year,
    int Month,
    decimal TotalIncome,
    decimal TotalExpense,
    decimal NetResult,
    decimal AvailableBalance,
    decimal FamilySavings,
    decimal VentureIncome,
    decimal VentureExpense,
    decimal VentureProfit,
    decimal ExpenseToIncomeRatio,
    decimal AvgDailyIncome,
    decimal AvgDailyExpense,
    decimal CompliancePercentage,
    decimal? IncomeGrowth,
    decimal? ExpenseGrowth,
    int UnreadAlerts,
    IEnumerable<AccountDto> Accounts);

public record CategoryBreakdownDto(string CategoryName, string Color, decimal Amount, decimal Percentage);
public record VenturePerformanceDto(string VentureName, string Color, decimal Income, decimal Expense, decimal Profit);

public record DashboardChartsDto(
    IEnumerable<(string Label, decimal Income, decimal Expense)> MonthlyTrend,
    IEnumerable<(DateOnly Date, decimal Income, decimal Expense)> DailyTrend,
    IEnumerable<CategoryBreakdownDto> ExpenseByCategory,
    IEnumerable<CategoryBreakdownDto> IncomeBySource,
    IEnumerable<VenturePerformanceDto> VenturePerformance,
    IEnumerable<(DateOnly Date, decimal Balance)> BalanceEvolution);

// ─── Reports ───────────────────────────────────────────────
public record MonthlyReportDto(
    int Year,
    int Month,
    decimal TotalIncome,
    decimal TotalExpense,
    decimal NetResult,
    decimal Savings,
    IEnumerable<CategoryBreakdownDto> ExpenseByCategory,
    IEnumerable<CategoryBreakdownDto> IncomeBySource,
    IEnumerable<VenturePerformanceDto> VentureResults,
    decimal? PreviousMonthIncome,
    decimal? PreviousMonthExpense,
    ComplianceDto Compliance);

public record AnnualReportDto(
    int Year,
    decimal TotalIncome,
    decimal TotalExpense,
    decimal NetResult,
    IEnumerable<(string Month, decimal Income, decimal Expense)> MonthlyBreakdown,
    IEnumerable<CategoryBreakdownDto> TopExpenseCategories,
    IEnumerable<VenturePerformanceDto> VentureResults);

// ─── Analysis ──────────────────────────────────────────────
public record InsightDto(string Type, string Title, string Message, string? Icon);

public record AnalysisInsightsDto(
    IEnumerable<InsightDto> Insights,
    string? TopExpenseCategory,
    string? TopIncomeSource,
    string? TopVenture,
    decimal SavingsRate,
    decimal ExpenseGrowthRate,
    bool IsInDeficit,
    IEnumerable<string> Recommendations);
