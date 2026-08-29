using FamilyFinance.Application.DTOs;
using FamilyFinance.Application.Interfaces;
using FamilyFinance.Application.Interfaces.Repositories;
using FamilyFinance.Domain.Entities;
using FamilyFinance.Domain.Enums;

namespace FamilyFinance.Application.Services;

public class DashboardService : IDashboardService
{
    private readonly IMovementRepository _movementRepo;
    private readonly IRepository<Account> _accountRepo;
    private readonly IRepository<Venture> _ventureRepo;
    private readonly IRepository<Category> _catRepo;
    private readonly IRepository<Alert> _alertRepo;

    public DashboardService(IMovementRepository movementRepo, IRepository<Account> accountRepo,
        IRepository<Venture> ventureRepo, IRepository<Category> catRepo, IRepository<Alert> alertRepo)
    {
        _movementRepo = movementRepo; _accountRepo = accountRepo;
        _ventureRepo = ventureRepo; _catRepo = catRepo; _alertRepo = alertRepo;
    }

    public async Task<DashboardSummaryDto> GetSummaryAsync(Guid familyId, int? year = null, int? month = null, CancellationToken ct = default)
    {
        var now = DateTime.Today;
        var y = year ?? now.Year;
        var m = month ?? now.Month;
        var from = new DateOnly(y, m, 1);
        var to = from.AddMonths(1).AddDays(-1);

        // Previous month
        var prevFrom = from.AddMonths(-1);
        var prevTo = from.AddDays(-1);

        var totalIncome = await _movementRepo.GetTotalByTypeAsync(familyId, MovementType.Income, from, to, ct);
        var totalExpense = await _movementRepo.GetTotalByTypeAsync(familyId, MovementType.Expense, from, to, ct);
        var prevIncome = await _movementRepo.GetTotalByTypeAsync(familyId, MovementType.Income, prevFrom, prevTo, ct);
        var prevExpense = await _movementRepo.GetTotalByTypeAsync(familyId, MovementType.Expense, prevFrom, prevTo, ct);

        var ventureSummary = await _movementRepo.GetVentureSummaryAsync(familyId, from, to, ct);
        var ventureIncome = ventureSummary.Values.Sum(v => v.Income);
        var ventureExpense = ventureSummary.Values.Sum(v => v.Expense);

        var accounts = await _accountRepo.FindAsync(a => a.FamilyId == familyId && a.IsActive, ct);
        var availableBalance = accounts.Sum(a => a.Balance);

        // Compliance
        var daysElapsed = (now.Year == y && now.Month == m) ? now.Day : to.Day;
        var daysWithRecords = await _movementRepo.GetDaysWithRecordsAsync(familyId, y, m, ct);
        var compliance = daysElapsed > 0 ? Math.Round((decimal)daysWithRecords.Count() / daysElapsed * 100, 1) : 0;

        var unreadAlerts = await _alertRepo.CountAsync(a => a.FamilyId == familyId && a.Status == AlertStatus.Active, ct);

        return new DashboardSummaryDto(
            Year: y, Month: m,
            TotalIncome: totalIncome, TotalExpense: totalExpense,
            NetResult: totalIncome - totalExpense,
            AvailableBalance: availableBalance,
            FamilySavings: Math.Max(0, totalIncome - totalExpense),
            VentureIncome: ventureIncome, VentureExpense: ventureExpense,
            VentureProfit: ventureIncome - ventureExpense,
            ExpenseToIncomeRatio: totalIncome > 0 ? Math.Round(totalExpense / totalIncome * 100, 1) : 0,
            AvgDailyIncome: daysElapsed > 0 ? Math.Round(totalIncome / daysElapsed, 2) : 0,
            AvgDailyExpense: daysElapsed > 0 ? Math.Round(totalExpense / daysElapsed, 2) : 0,
            CompliancePercentage: compliance,
            IncomeGrowth: prevIncome > 0 ? Math.Round((totalIncome - prevIncome) / prevIncome * 100, 1) : null,
            ExpenseGrowth: prevExpense > 0 ? Math.Round((totalExpense - prevExpense) / prevExpense * 100, 1) : null,
            UnreadAlerts: unreadAlerts,
            Accounts: accounts.Select(a => new AccountDto(a.Id, a.FamilyId, a.Name, a.AccountType.ToString(),
                a.Balance, a.Color, a.Icon, a.BankName, a.LastFour, a.IsActive)));
    }

    public async Task<DashboardChartsDto> GetChartsAsync(Guid familyId, int? year = null, int? month = null, CancellationToken ct = default)
    {
        var now = DateTime.Today;
        var y = year ?? now.Year;
        var m = month ?? now.Month;
        var from = new DateOnly(y, m, 1);
        var to = from.AddMonths(1).AddDays(-1);

        // Monthly trend (last 6 months)
        var monthlyTrend = new List<(string, decimal, decimal)>();
        for (int i = 5; i >= 0; i--)
        {
            var mFrom = new DateOnly(y, m, 1).AddMonths(-i);
            var mTo = mFrom.AddMonths(1).AddDays(-1);
            var inc = await _movementRepo.GetTotalByTypeAsync(familyId, MovementType.Income, mFrom, mTo, ct);
            var exp = await _movementRepo.GetTotalByTypeAsync(familyId, MovementType.Expense, mFrom, mTo, ct);
            monthlyTrend.Add((mFrom.ToString("MMM yyyy"), inc, exp));
        }

        // Daily trend (current month)
        var dailyTrend = await _movementRepo.GetDailyTrendAsync(familyId, from, to, ct);

        // Expense by category
        var expByCat = await _movementRepo.GetTotalByCategoryAsync(familyId, MovementType.Expense, from, to, ct);
        var totalExp = expByCat.Values.Sum();
        var categories = await _catRepo.FindAsync(c => c.FamilyId == familyId, ct);
        var expenseByCategory = expByCat.Select(kvp =>
        {
            var cat = categories.FirstOrDefault(c => c.Id == kvp.Key);
            return new CategoryBreakdownDto(
                cat?.Name ?? "Sin categoría", cat?.Color ?? "#6B7280", kvp.Value,
                totalExp > 0 ? Math.Round(kvp.Value / totalExp * 100, 1) : 0);
        }).OrderByDescending(x => x.Amount);

        // Income by source
        var incByCat = await _movementRepo.GetTotalByCategoryAsync(familyId, MovementType.Income, from, to, ct);
        var totalInc = incByCat.Values.Sum();
        var incomeBySource = incByCat.Select(kvp =>
        {
            var cat = categories.FirstOrDefault(c => c.Id == kvp.Key);
            return new CategoryBreakdownDto(
                cat?.Name ?? "Sin categoría", cat?.Color ?? "#10B981", kvp.Value,
                totalInc > 0 ? Math.Round(kvp.Value / totalInc * 100, 1) : 0);
        }).OrderByDescending(x => x.Amount);

        // Venture performance
        var ventureSummary = await _movementRepo.GetVentureSummaryAsync(familyId, from, to, ct);
        var ventures = await _ventureRepo.FindAsync(v => v.FamilyId == familyId, ct);
        var venturePerf = ventureSummary.Select(kvp =>
        {
            var v = ventures.FirstOrDefault(x => x.Id == kvp.Key);
            return new VenturePerformanceDto(v?.Name ?? "Desconocido", v?.Color ?? "#F59E0B",
                kvp.Value.Income, kvp.Value.Expense, kvp.Value.Income - kvp.Value.Expense);
        }).OrderByDescending(x => x.Profit);

        // Balance evolution (daily cumulative)
        var balanceEvo = new List<(DateOnly, decimal)>();
        decimal runningBalance = 0;
        foreach (var day in dailyTrend)
        {
            runningBalance += day.Income - day.Expense;
            balanceEvo.Add((day.Date, runningBalance));
        }

        return new DashboardChartsDto(
            MonthlyTrend: monthlyTrend,
            DailyTrend: dailyTrend,
            ExpenseByCategory: expenseByCategory,
            IncomeBySource: incomeBySource,
            VenturePerformance: venturePerf,
            BalanceEvolution: balanceEvo);
    }
}

public class FamilyService : IFamilyService
{
    private readonly IFamilyRepository _repo;
    public FamilyService(IFamilyRepository repo) => _repo = repo;

    public async Task<FamilyDto> GetAsync(Guid familyId, CancellationToken ct = default)
    {
        var f = await _repo.GetByIdAsync(familyId, ct) ?? throw new KeyNotFoundException("Familia no encontrada.");
        return new FamilyDto(f.Id, f.Name, f.Currency, f.CurrencySymbol, f.Timezone, f.CreatedAt);
    }

    public async Task<FamilyDto> UpdateAsync(Guid familyId, UpdateFamilyDto dto, CancellationToken ct = default)
    {
        var f = await _repo.GetByIdAsync(familyId, ct) ?? throw new KeyNotFoundException("Familia no encontrada.");
        f.Name = dto.Name; f.Currency = dto.Currency; f.CurrencySymbol = dto.CurrencySymbol;
        f.Timezone = dto.Timezone; f.UpdatedAt = DateTime.UtcNow;
        await _repo.UpdateAsync(f, ct);
        return new FamilyDto(f.Id, f.Name, f.Currency, f.CurrencySymbol, f.Timezone, f.CreatedAt);
    }
}

public class ContributorService : IContributorService
{
    private readonly IRepository<Contributor> _repo;
    private readonly IMovementRepository _movementRepo;
    public ContributorService(IRepository<Contributor> repo, IMovementRepository movementRepo)
    { _repo = repo; _movementRepo = movementRepo; }

    public async Task<IEnumerable<ContributorDto>> GetByFamilyAsync(Guid familyId, CancellationToken ct = default)
    {
        var contributors = await _repo.FindAsync(c => c.FamilyId == familyId, ct);
        var now = DateTime.Today;
        var from = new DateOnly(now.Year, now.Month, 1);
        var to = from.AddMonths(1).AddDays(-1);
        var result = new List<ContributorDto>();
        foreach (var c in contributors)
        {
            // Filter by contributorId only (no MovementType in SQL to avoid PostgreSQL enum cast error)
            // then filter Income in-memory
            var movements = await _movementRepo.GetByFamilyAsync(familyId, from, to, null, c.Id, ct: ct);
            var incomeTotal = movements.Where(m => m.Type == MovementType.Income).Sum(m => m.Amount);
            result.Add(Map(c, incomeTotal));
        }
        return result;
    }

    public async Task<ContributorDto> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var c = await _repo.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Aportante no encontrado.");
        return Map(c, null);
    }

    public async Task<ContributorDto> CreateAsync(Guid familyId, CreateContributorDto dto, CancellationToken ct = default)
    {
        var c = new Contributor
        {
            Id = Guid.NewGuid(), FamilyId = familyId, UserId = dto.UserId, Name = dto.Name,
            ContributorType = Enum.Parse<ContributorType>(dto.ContributorType, true),
            FixedIncome = dto.FixedIncome, Frequency = Enum.Parse<FrequencyType>(dto.Frequency, true),
            PaymentDay = dto.PaymentDay, IncomeSource = dto.IncomeSource, Notes = dto.Notes,
            IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
        };
        await _repo.AddAsync(c, ct);
        return Map(c, null);
    }

    public async Task<ContributorDto> UpdateAsync(Guid id, UpdateContributorDto dto, CancellationToken ct = default)
    {
        var c = await _repo.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Aportante no encontrado.");
        c.Name = dto.Name; c.ContributorType = Enum.Parse<ContributorType>(dto.ContributorType, true);
        c.FixedIncome = dto.FixedIncome; c.Frequency = Enum.Parse<FrequencyType>(dto.Frequency, true);
        c.PaymentDay = dto.PaymentDay; c.IncomeSource = dto.IncomeSource;
        c.IsActive = dto.IsActive; c.Notes = dto.Notes; c.UpdatedAt = DateTime.UtcNow;
        await _repo.UpdateAsync(c, ct);
        return Map(c, null);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var c = await _repo.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Aportante no encontrado.");
        c.IsActive = false; c.UpdatedAt = DateTime.UtcNow;
        await _repo.UpdateAsync(c, ct);
    }

    private static ContributorDto Map(Contributor c, decimal? currentMonthIncome) => new(
        c.Id, c.FamilyId, c.UserId, c.Name, c.ContributorType.ToString(),
        c.FixedIncome, c.Frequency.ToString(), c.PaymentDay, c.IncomeSource,
        c.IsActive, c.Notes, currentMonthIncome);
}

public class VentureService : IVentureService
{
    private readonly IRepository<Venture> _repo;
    private readonly IMovementRepository _movementRepo;
    public VentureService(IRepository<Venture> repo, IMovementRepository movementRepo)
    { _repo = repo; _movementRepo = movementRepo; }

    public async Task<IEnumerable<VentureDto>> GetByFamilyAsync(Guid familyId, CancellationToken ct = default)
    {
        var ventures = await _repo.FindAsync(v => v.FamilyId == familyId, ct);
        return ventures.Select(v => Map(v));
    }

    public async Task<VentureSummaryDto> GetSummaryAsync(Guid id, CancellationToken ct = default)
    {
        var v = await _repo.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Emprendimiento no encontrado.");
        var movements = await _movementRepo.GetByFamilyAsync(v.FamilyId, ventureId: id, ct: ct);
        var list = movements.ToList();
        var totalIncome = list.Where(m => m.Type == MovementType.Income).Sum(m => m.Amount);
        var totalExpense = list.Where(m => m.Type == MovementType.Expense).Sum(m => m.Amount);
        var recent = list.Take(10).Select(m => new MovementDto(m.Id, m.FamilyId, m.MovementDate,
            m.Type.ToString(), m.Amount, m.Concept, m.ContributorId, m.Contributor?.Name,
            m.CategoryId, m.Category?.Name, m.Category?.Color, m.VentureId, v.Name,
            m.AccountId, m.Account?.Name, m.PaymentMethod.ToString(), m.Notes, m.CreatedAt));
        return new VentureSummaryDto(v.Id, v.Name, v.Status.ToString(), totalIncome, totalExpense,
            totalIncome - totalExpense, list.Count, recent);
    }

    public async Task<VentureDto> CreateAsync(Guid familyId, CreateVentureDto dto, CancellationToken ct = default)
    {
        var v = new Venture
        {
            Id = Guid.NewGuid(), FamilyId = familyId, Name = dto.Name, Description = dto.Description,
            ResponsibleId = dto.ResponsibleId, StartDate = dto.StartDate,
            Icon = dto.Icon ?? "briefcase", Color = dto.Color ?? "#F59E0B",
            Status = VentureStatus.Active, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
        };
        await _repo.AddAsync(v, ct);
        return Map(v);
    }

    public async Task<VentureDto> UpdateAsync(Guid id, UpdateVentureDto dto, CancellationToken ct = default)
    {
        var v = await _repo.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Emprendimiento no encontrado.");
        v.Name = dto.Name; v.Description = dto.Description; v.ResponsibleId = dto.ResponsibleId;
        v.Status = Enum.Parse<VentureStatus>(dto.Status, true); v.StartDate = dto.StartDate;
        v.Icon = dto.Icon ?? v.Icon; v.Color = dto.Color ?? v.Color; v.UpdatedAt = DateTime.UtcNow;
        await _repo.UpdateAsync(v, ct);
        return Map(v);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var v = await _repo.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Emprendimiento no encontrado.");
        v.Status = VentureStatus.Inactive; v.UpdatedAt = DateTime.UtcNow;
        await _repo.UpdateAsync(v, ct);
    }

    private static VentureDto Map(Venture v) => new(v.Id, v.FamilyId, v.Name, v.Description,
        v.ResponsibleId, v.Responsible?.Name, v.Status.ToString(), v.StartDate, v.Icon, v.Color);
}

public class CategoryService : ICategoryService
{
    private readonly IRepository<Category> _repo;
    public CategoryService(IRepository<Category> repo) => _repo = repo;

    public async Task<IEnumerable<CategoryDto>> GetByFamilyAsync(Guid familyId, CancellationToken ct = default)
    {
        var cats = await _repo.FindAsync(c => c.FamilyId == familyId, ct);
        var roots = cats.Where(c => c.ParentId == null)
                        .OrderBy(c => c.SortOrder)
                        .Select(c => Map(c, cats));
        return roots;
    }

    public async Task<CategoryDto> CreateAsync(Guid familyId, CreateCategoryDto dto, CancellationToken ct = default)
    {
        var c = new Category
        {
            Id = Guid.NewGuid(), FamilyId = familyId, Name = dto.Name,
            Type = Enum.Parse<CategoryType>(dto.Type, true), ParentId = dto.ParentId,
            Icon = dto.Icon ?? "tag", Color = dto.Color ?? "#6366F1",
            IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
        };
        await _repo.AddAsync(c, ct);
        return new CategoryDto(c.Id, c.FamilyId, c.Name, c.Type.ToString(), c.ParentId, null, c.Icon, c.Color, c.IsActive, c.IsSystem, null);
    }

    public async Task<CategoryDto> UpdateAsync(Guid id, UpdateCategoryDto dto, CancellationToken ct = default)
    {
        var c = await _repo.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Categoría no encontrada.");
        c.Name = dto.Name; c.Type = Enum.Parse<CategoryType>(dto.Type, true); c.ParentId = dto.ParentId;
        c.Icon = dto.Icon ?? c.Icon; c.Color = dto.Color ?? c.Color; c.IsActive = dto.IsActive;
        c.UpdatedAt = DateTime.UtcNow;
        await _repo.UpdateAsync(c, ct);
        return new CategoryDto(c.Id, c.FamilyId, c.Name, c.Type.ToString(), c.ParentId, null, c.Icon, c.Color, c.IsActive, c.IsSystem, null);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var c = await _repo.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Categoría no encontrada.");
        if (c.IsSystem) throw new InvalidOperationException("No se puede eliminar una categoría del sistema.");
        c.IsActive = false; c.UpdatedAt = DateTime.UtcNow;
        await _repo.UpdateAsync(c, ct);
    }

    private static CategoryDto Map(Category c, IEnumerable<Category> all)
    {
        var children = all.Where(x => x.ParentId == c.Id).Select(x => Map(x, all));
        return new CategoryDto(c.Id, c.FamilyId, c.Name, c.Type.ToString(), c.ParentId,
            null, c.Icon, c.Color, c.IsActive, c.IsSystem, children);
    }
}

public record SortOrder(int Order);

public class AccountService : IAccountService
{
    private readonly IRepository<Account> _repo;
    public AccountService(IRepository<Account> repo) => _repo = repo;

    public async Task<IEnumerable<AccountDto>> GetByFamilyAsync(Guid familyId, CancellationToken ct = default)
    {
        var accounts = await _repo.FindAsync(a => a.FamilyId == familyId, ct);
        return accounts.Select(Map);
    }

    public async Task<AccountDto> CreateAsync(Guid familyId, CreateAccountDto dto, CancellationToken ct = default)
    {
        var a = new Account
        {
            Id = Guid.NewGuid(), FamilyId = familyId, Name = dto.Name,
            AccountType = Enum.Parse<AccountType>(dto.AccountType, true),
            Balance = dto.InitialBalance ?? 0, Color = dto.Color ?? "#6366F1",
            Icon = dto.Icon ?? "wallet", BankName = dto.BankName, LastFour = dto.LastFour,
            IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
        };
        await _repo.AddAsync(a, ct);
        return Map(a);
    }

    public async Task<AccountDto> UpdateAsync(Guid id, UpdateAccountDto dto, CancellationToken ct = default)
    {
        var a = await _repo.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Cuenta no encontrada.");
        a.Name = dto.Name; a.AccountType = Enum.Parse<AccountType>(dto.AccountType, true);
        a.Color = dto.Color ?? a.Color; a.Icon = dto.Icon ?? a.Icon;
        a.BankName = dto.BankName; a.LastFour = dto.LastFour; a.IsActive = dto.IsActive;
        a.UpdatedAt = DateTime.UtcNow;
        await _repo.UpdateAsync(a, ct);
        return Map(a);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var a = await _repo.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Cuenta no encontrada.");
        a.IsActive = false; a.UpdatedAt = DateTime.UtcNow;
        await _repo.UpdateAsync(a, ct);
    }

    private static AccountDto Map(Account a) => new(a.Id, a.FamilyId, a.Name, a.AccountType.ToString(),
        a.Balance, a.Color, a.Icon, a.BankName, a.LastFour, a.IsActive);
}

public class GoalService : IGoalService
{
    private readonly IRepository<Goal> _repo;
    public GoalService(IRepository<Goal> repo) => _repo = repo;

    public async Task<IEnumerable<GoalDto>> GetByFamilyAsync(Guid familyId, CancellationToken ct = default)
    {
        var goals = await _repo.FindAsync(g => g.FamilyId == familyId && g.IsActive, ct);
        return goals.Select(Map);
    }

    public async Task<GoalDto> CreateAsync(Guid familyId, CreateGoalDto dto, CancellationToken ct = default)
    {
        var g = new Goal
        {
            Id = Guid.NewGuid(), FamilyId = familyId, Name = dto.Name,
            GoalType = Enum.Parse<GoalType>(dto.GoalType, true), TargetAmount = dto.TargetAmount,
            TargetDate = dto.TargetDate, MonthlyContribution = dto.MonthlyContribution ?? 0,
            Icon = dto.Icon ?? "target", Color = dto.Color ?? "#3B82F6", Notes = dto.Notes,
            IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
        };
        await _repo.AddAsync(g, ct);
        return Map(g);
    }

    public async Task<GoalDto> UpdateAsync(Guid id, UpdateGoalDto dto, CancellationToken ct = default)
    {
        var g = await _repo.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Meta no encontrada.");
        g.Name = dto.Name; g.GoalType = Enum.Parse<GoalType>(dto.GoalType, true);
        g.TargetAmount = dto.TargetAmount; g.TargetDate = dto.TargetDate;
        g.MonthlyContribution = dto.MonthlyContribution ?? g.MonthlyContribution;
        g.Icon = dto.Icon ?? g.Icon; g.Color = dto.Color ?? g.Color;
        g.IsActive = dto.IsActive; g.Notes = dto.Notes; g.UpdatedAt = DateTime.UtcNow;
        await _repo.UpdateAsync(g, ct);
        return Map(g);
    }

    public async Task<GoalDto> UpdateAmountAsync(Guid id, decimal amount, CancellationToken ct = default)
    {
        var g = await _repo.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Meta no encontrada.");
        g.CurrentAmount = amount;
        g.IsAchieved = g.CurrentAmount >= g.TargetAmount;
        g.UpdatedAt = DateTime.UtcNow;
        await _repo.UpdateAsync(g, ct);
        return Map(g);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var g = await _repo.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Meta no encontrada.");
        g.IsActive = false; g.UpdatedAt = DateTime.UtcNow;
        await _repo.UpdateAsync(g, ct);
    }

    private static GoalDto Map(Goal g) => new(g.Id, g.FamilyId, g.Name, g.GoalType.ToString(),
        g.TargetAmount, g.CurrentAmount, g.ProgressPercentage, g.RemainingAmount, g.MonthsToAchieve,
        g.TargetDate, g.MonthlyContribution, g.Icon, g.Color, g.IsAchieved, g.IsActive, g.Notes);
}

public class AlertService : IAlertService
{
    private readonly IRepository<Alert> _alertRepo;
    private readonly IRepository<AlertConfig> _configRepo;
    private readonly IMovementRepository _movementRepo;
    private readonly IRepository<Venture> _ventureRepo;

    public AlertService(IRepository<Alert> alertRepo, IRepository<AlertConfig> configRepo,
        IMovementRepository movementRepo, IRepository<Venture> ventureRepo)
    {
        _alertRepo = alertRepo; _configRepo = configRepo;
        _movementRepo = movementRepo; _ventureRepo = ventureRepo;
    }

    public async Task<IEnumerable<AlertDto>> GetByFamilyAsync(Guid familyId, CancellationToken ct = default)
    {
        var alerts = await _alertRepo.FindAsync(a => a.FamilyId == familyId, ct);
        return alerts.OrderByDescending(a => a.CreatedAt).Select(Map);
    }

    public async Task MarkAsReadAsync(Guid id, CancellationToken ct = default)
    {
        var a = await _alertRepo.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Alerta no encontrada.");
        a.Status = AlertStatus.Read; a.ReadAt = DateTime.UtcNow;
        await _alertRepo.UpdateAsync(a, ct);
    }

    public async Task DismissAsync(Guid id, CancellationToken ct = default)
    {
        var a = await _alertRepo.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Alerta no encontrada.");
        a.Status = AlertStatus.Dismissed;
        await _alertRepo.UpdateAsync(a, ct);
    }

    public async Task<IEnumerable<AlertConfigDto>> GetConfigsAsync(Guid familyId, CancellationToken ct = default)
    {
        var configs = await _configRepo.FindAsync(c => c.FamilyId == familyId, ct);
        return configs.Select(c => new AlertConfigDto(c.Id, c.AlertType.ToString(), c.IsActive, c.Threshold, c.Description));
    }

    public async Task UpdateConfigAsync(Guid id, UpdateAlertConfigDto dto, CancellationToken ct = default)
    {
        var c = await _configRepo.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Configuración no encontrada.");
        c.IsActive = dto.IsActive; c.Threshold = dto.Threshold; c.UpdatedAt = DateTime.UtcNow;
        await _configRepo.UpdateAsync(c, ct);
    }

    public async Task GenerateAlertsAsync(Guid familyId, CancellationToken ct = default)
    {
        var configs = await _configRepo.FindAsync(c => c.FamilyId == familyId && c.IsActive, ct);
        var now = DateTime.Today;
        var from = new DateOnly(now.Year, now.Month, 1);
        var to = new DateOnly(now.Year, now.Month, DateTime.DaysInMonth(now.Year, now.Month));

        var totalIncome = await _movementRepo.GetTotalByTypeAsync(familyId, MovementType.Income, from, to, ct);
        var totalExpense = await _movementRepo.GetTotalByTypeAsync(familyId, MovementType.Expense, from, to, ct);
        var daysWithRecords = await _movementRepo.GetDaysWithRecordsAsync(familyId, now.Year, now.Month, ct);
        var today = DateOnly.FromDateTime(now);
        var yesterday = today.AddDays(-1);
        var hasYesterday = daysWithRecords.Contains(yesterday);

        foreach (var config in configs)
        {
            string? title = null, message = null;
            Guid? ventureId = null;

            switch (config.AlertType)
            {
                case AlertType.Deficit when totalExpense > totalIncome:
                    title = "⚠️ Déficit detectado";
                    message = $"Los gastos acumulados (S/ {totalExpense:N2}) superan los ingresos del mes (S/ {totalIncome:N2}).";
                    break;
                case AlertType.NoRecords when !hasYesterday && today.Day > 1:
                    title = "📋 Sin registros";
                    message = "No se registraron movimientos financieros ayer. Recuerda registrar tus movimientos diariamente.";
                    break;
                case AlertType.LowSavings when totalIncome > 0:
                    var savingsRate = (totalIncome - totalExpense) / totalIncome;
                    if (savingsRate < (config.Threshold ?? 0.10m))
                    {
                        title = "💰 Ahorro bajo";
                        message = $"Tu ahorro este mes representa solo el {savingsRate * 100:N1}% de tus ingresos.";
                    }
                    break;
                case AlertType.VentureLoss:
                    var ventures = await _ventureRepo.FindAsync(v => v.FamilyId == familyId && v.Status == VentureStatus.Active, ct);
                    var ventureSummary = await _movementRepo.GetVentureSummaryAsync(familyId, from, to, ct);
                    foreach (var vs in ventureSummary.Where(x => x.Value.Expense > x.Value.Income))
                    {
                        var venture = ventures.FirstOrDefault(v => v.Id == vs.Key);
                        if (venture != null)
                        {
                            var lossAlert = new Alert
                            {
                                Id = Guid.NewGuid(), FamilyId = familyId, AlertType = AlertType.VentureLoss,
                                Title = $"🔴 Pérdida en {venture.Name}",
                                Message = $"El emprendimiento '{venture.Name}' presenta gastos (S/ {vs.Value.Expense:N2}) superiores a sus ingresos (S/ {vs.Value.Income:N2}).",
                                VentureId = vs.Key, AlertDate = today, Status = AlertStatus.Active, CreatedAt = DateTime.UtcNow
                            };
                            if (!await _alertRepo.ExistsAsync(a => a.FamilyId == familyId && a.VentureId == vs.Key
                                && a.AlertType == AlertType.VentureLoss && a.AlertDate == today, ct))
                                await _alertRepo.AddAsync(lossAlert, ct);
                        }
                    }
                    continue;
            }

            if (title != null && !await _alertRepo.ExistsAsync(a => a.FamilyId == familyId
                && a.AlertType == config.AlertType && a.AlertDate == today, ct))
            {
                await _alertRepo.AddAsync(new Alert
                {
                    Id = Guid.NewGuid(), FamilyId = familyId, AlertType = config.AlertType,
                    Title = title, Message = message!, VentureId = ventureId,
                    AlertDate = today, Status = AlertStatus.Active, CreatedAt = DateTime.UtcNow
                }, ct);
            }
        }
    }

    private static AlertDto Map(Alert a) => new(a.Id, a.AlertType.ToString(), a.Title, a.Message,
        a.Status.ToString(), a.VentureId, a.Venture?.Name, a.AlertDate, a.ReadAt, a.CreatedAt);
}

public class AnalysisService : IAnalysisService
{
    private readonly IMovementRepository _movementRepo;
    private readonly IRepository<Category> _catRepo;
    private readonly IRepository<Venture> _ventureRepo;

    public AnalysisService(IMovementRepository movementRepo, IRepository<Category> catRepo, IRepository<Venture> ventureRepo)
    { _movementRepo = movementRepo; _catRepo = catRepo; _ventureRepo = ventureRepo; }

    public async Task<AnalysisInsightsDto> GetInsightsAsync(Guid familyId, CancellationToken ct = default)
    {
        var now = DateTime.Today;
        var from = new DateOnly(now.Year, now.Month, 1);
        var to = from.AddMonths(1).AddDays(-1);
        var prevFrom = from.AddMonths(-1);
        var prevTo = from.AddDays(-1);

        var totalIncome = await _movementRepo.GetTotalByTypeAsync(familyId, MovementType.Income, from, to, ct);
        var totalExpense = await _movementRepo.GetTotalByTypeAsync(familyId, MovementType.Expense, from, to, ct);
        var prevIncome = await _movementRepo.GetTotalByTypeAsync(familyId, MovementType.Income, prevFrom, prevTo, ct);
        var prevExpense = await _movementRepo.GetTotalByTypeAsync(familyId, MovementType.Expense, prevFrom, prevTo, ct);

        var expByCat = await _movementRepo.GetTotalByCategoryAsync(familyId, MovementType.Expense, from, to, ct);
        var incByCat = await _movementRepo.GetTotalByCategoryAsync(familyId, MovementType.Income, from, to, ct);
        var ventureSummary = await _movementRepo.GetVentureSummaryAsync(familyId, from, to, ct);

        var categories = await _catRepo.FindAsync(c => c.FamilyId == familyId, ct);
        var ventures = await _ventureRepo.FindAsync(v => v.FamilyId == familyId, ct);

        // Top expense category
        var topExpCatId = expByCat.OrderByDescending(x => x.Value).FirstOrDefault().Key;
        var topExpCat = categories.FirstOrDefault(c => c.Id == topExpCatId)?.Name;

        // Top income source
        var topIncCatId = incByCat.OrderByDescending(x => x.Value).FirstOrDefault().Key;
        var topIncSource = categories.FirstOrDefault(c => c.Id == topIncCatId)?.Name;

        // Top venture
        var topVentureId = ventureSummary.OrderByDescending(x => x.Value.Income - x.Value.Expense).FirstOrDefault().Key;
        var topVenture = ventures.FirstOrDefault(v => v.Id == topVentureId)?.Name;

        var savingsRate = totalIncome > 0 ? (totalIncome - totalExpense) / totalIncome * 100 : 0;
        var expenseGrowth = prevExpense > 0 ? (totalExpense - prevExpense) / prevExpense * 100 : 0;

        var insights = new List<InsightDto>();

        // Top expense category insight
        if (topExpCatId != Guid.Empty && expByCat.TryGetValue(topExpCatId, out var topExpAmt) && totalExpense > 0)
        {
            var pct = topExpAmt / totalExpense * 100;
            insights.Add(new InsightDto("expense", $"Mayor gasto: {topExpCat}",
                $"La categoría '{topExpCat}' representa el {pct:N1}% de tus gastos totales este mes.", "trending-up"));
        }

        // Expense growth
        if (expenseGrowth > 10)
            insights.Add(new InsightDto("warning", "Gastos en aumento",
                $"Tus gastos aumentaron {expenseGrowth:N1}% respecto al mes anterior.", "alert-triangle"));
        else if (expenseGrowth < -5)
            insights.Add(new InsightDto("success", "Gastos en control",
                $"¡Excelente! Tus gastos disminuyeron {Math.Abs(expenseGrowth):N1}% respecto al mes anterior.", "trending-down"));

        // Savings rate
        if (savingsRate < 10 && totalIncome > 0)
            insights.Add(new InsightDto("warning", "Ahorro bajo",
                $"Tu tasa de ahorro es solo {savingsRate:N1}%. Se recomienda ahorrar al menos el 20% de tus ingresos.", "piggy-bank"));
        else if (savingsRate >= 20)
            insights.Add(new InsightDto("success", "Buen ahorro",
                $"¡Muy bien! Estás ahorrando el {savingsRate:N1}% de tus ingresos.", "check-circle"));

        // Top venture
        if (!string.IsNullOrEmpty(topVenture))
            insights.Add(new InsightDto("venture", $"Emprendimiento destacado",
                $"'{topVenture}' es tu emprendimiento más rentable este mes.", "award"));

        // Deficit
        if (totalExpense > totalIncome)
            insights.Add(new InsightDto("danger", "Déficit financiero",
                $"Tus gastos superan tus ingresos en S/ {totalExpense - totalIncome:N2}. Revisa tus categorías de mayor gasto.", "x-circle"));

        var recommendations = new List<string>();
        if (savingsRate < 20) recommendations.Add("Intenta reducir gastos no esenciales para alcanzar el 20% de ahorro mensual.");
        if (expenseGrowth > 15) recommendations.Add("Revisa las categorías con mayor crecimiento de gasto.");
        if (totalExpense > totalIncome) recommendations.Add("Busca fuentes adicionales de ingreso o reduce gastos variables.");

        return new AnalysisInsightsDto(insights, topExpCat, topIncSource, topVenture,
            Math.Round(savingsRate, 1), Math.Round(expenseGrowth, 1), totalExpense > totalIncome, recommendations);
    }
}

public class UserService : IUserService
{
    private readonly IUserRepository _repo;
    public UserService(IUserRepository repo) => _repo = repo;

    public async Task<IEnumerable<UserDto>> GetByFamilyAsync(Guid familyId, CancellationToken ct = default)
    {
        var users = await _repo.GetByFamilyAsync(familyId, ct);
        return users.Select(Map);
    }

    public async Task<UserDto> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var u = await _repo.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Usuario no encontrado.");
        return Map(u);
    }

    public async Task<UserDto> CreateAsync(Guid familyId, CreateUserDto dto, CancellationToken ct = default)
    {
        if (await _repo.ExistsAsync(u => u.Email == dto.Email.ToLower(), ct))
            throw new InvalidOperationException("El correo ya está registrado.");
        var u = new User
        {
            Id = Guid.NewGuid(), FamilyId = familyId, Name = dto.Name,
            Email = dto.Email.ToLower(), PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = Enum.Parse<UserRole>(dto.Role, true), AvatarColor = dto.AvatarColor ?? "#6366F1",
            IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
        };
        await _repo.AddAsync(u, ct);
        return Map(u);
    }

    public async Task<UserDto> UpdateAsync(Guid id, UpdateUserDto dto, CancellationToken ct = default)
    {
        var u = await _repo.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Usuario no encontrado.");
        u.Name = dto.Name; u.Role = Enum.Parse<UserRole>(dto.Role, true);
        u.IsActive = dto.IsActive; u.AvatarColor = dto.AvatarColor ?? u.AvatarColor;
        if (!string.IsNullOrEmpty(dto.Password)) u.PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password);
        u.UpdatedAt = DateTime.UtcNow;
        await _repo.UpdateAsync(u, ct);
        return Map(u);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var u = await _repo.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException("Usuario no encontrado.");
        u.IsActive = false; u.UpdatedAt = DateTime.UtcNow;
        await _repo.UpdateAsync(u, ct);
    }

    private static UserDto Map(User u) => new(u.Id, u.FamilyId, u.Name, u.Email, u.Role.ToString(), u.IsActive, u.AvatarColor, u.LastLogin);
}

public class ReportService : IReportService
{
    private readonly IMovementRepository _movementRepo;
    private readonly IRepository<Category> _catRepo;
    private readonly IRepository<Venture> _ventureRepo;

    public ReportService(IMovementRepository movementRepo, IRepository<Category> catRepo, IRepository<Venture> ventureRepo)
    { _movementRepo = movementRepo; _catRepo = catRepo; _ventureRepo = ventureRepo; }

    public async Task<MonthlyReportDto> GetMonthlyAsync(Guid familyId, int year, int month, CancellationToken ct = default)
    {
        var from = new DateOnly(year, month, 1);
        var to = from.AddMonths(1).AddDays(-1);
        var prevFrom = from.AddMonths(-1);
        var prevTo = from.AddDays(-1);

        var totalIncome = await _movementRepo.GetTotalByTypeAsync(familyId, MovementType.Income, from, to, ct);
        var totalExpense = await _movementRepo.GetTotalByTypeAsync(familyId, MovementType.Expense, from, to, ct);
        var prevIncome = await _movementRepo.GetTotalByTypeAsync(familyId, MovementType.Income, prevFrom, prevTo, ct);
        var prevExpense = await _movementRepo.GetTotalByTypeAsync(familyId, MovementType.Expense, prevFrom, prevTo, ct);

        var expByCat = await _movementRepo.GetTotalByCategoryAsync(familyId, MovementType.Expense, from, to, ct);
        var incByCat = await _movementRepo.GetTotalByCategoryAsync(familyId, MovementType.Income, from, to, ct);
        var ventureSummary = await _movementRepo.GetVentureSummaryAsync(familyId, from, to, ct);

        var categories = await _catRepo.FindAsync(c => c.FamilyId == familyId, ct);
        var ventures = await _ventureRepo.FindAsync(v => v.FamilyId == familyId, ct);

        var now = DateTime.Today;
        var daysWithRecords = await _movementRepo.GetDaysWithRecordsAsync(familyId, year, month, ct);
        var daysElapsed = (now.Year == year && now.Month == month) ? now.Day : to.Day;

        var expBreakdown = expByCat.Select(kvp =>
        {
            var cat = categories.FirstOrDefault(c => c.Id == kvp.Key);
            return new CategoryBreakdownDto(cat?.Name ?? "Sin cat.", cat?.Color ?? "#6B7280", kvp.Value,
                totalExpense > 0 ? Math.Round(kvp.Value / totalExpense * 100, 1) : 0);
        }).OrderByDescending(x => x.Amount);

        var incBreakdown = incByCat.Select(kvp =>
        {
            var cat = categories.FirstOrDefault(c => c.Id == kvp.Key);
            return new CategoryBreakdownDto(cat?.Name ?? "Sin cat.", cat?.Color ?? "#10B981", kvp.Value,
                totalIncome > 0 ? Math.Round(kvp.Value / totalIncome * 100, 1) : 0);
        }).OrderByDescending(x => x.Amount);

        var ventureResults = ventureSummary.Select(kvp =>
        {
            var v = ventures.FirstOrDefault(x => x.Id == kvp.Key);
            return new VenturePerformanceDto(v?.Name ?? "Desconocido", v?.Color ?? "#F59E0B",
                kvp.Value.Income, kvp.Value.Expense, kvp.Value.Income - kvp.Value.Expense);
        });

        var compliance = new ComplianceDto(year, month, to.Day, daysElapsed, daysWithRecords.Count(),
            Math.Max(0, daysElapsed - daysWithRecords.Count()),
            daysElapsed > 0 ? Math.Round((decimal)daysWithRecords.Count() / daysElapsed * 100, 1) : 0);

        return new MonthlyReportDto(year, month, totalIncome, totalExpense, totalIncome - totalExpense,
            Math.Max(0, totalIncome - totalExpense), expBreakdown, incBreakdown, ventureResults,
            prevIncome > 0 ? prevIncome : null, prevExpense > 0 ? prevExpense : null, compliance);
    }

    public async Task<AnnualReportDto> GetAnnualAsync(Guid familyId, int year, CancellationToken ct = default)
    {
        decimal totalIncome = 0, totalExpense = 0;
        var monthlyBreakdown = new List<(string, decimal, decimal)>();

        for (int m = 1; m <= 12; m++)
        {
            var from = new DateOnly(year, m, 1);
            var to = from.AddMonths(1).AddDays(-1);
            var inc = await _movementRepo.GetTotalByTypeAsync(familyId, MovementType.Income, from, to, ct);
            var exp = await _movementRepo.GetTotalByTypeAsync(familyId, MovementType.Expense, from, to, ct);
            totalIncome += inc; totalExpense += exp;
            monthlyBreakdown.Add((from.ToString("MMM"), inc, exp));
        }

        var annualFrom = new DateOnly(year, 1, 1);
        var annualTo = new DateOnly(year, 12, 31);
        var expByCat = await _movementRepo.GetTotalByCategoryAsync(familyId, MovementType.Expense, annualFrom, annualTo, ct);
        var ventureSummary = await _movementRepo.GetVentureSummaryAsync(familyId, annualFrom, annualTo, ct);
        var categories = await _catRepo.FindAsync(c => c.FamilyId == familyId, ct);
        var ventures = await _ventureRepo.FindAsync(v => v.FamilyId == familyId, ct);

        var topExp = expByCat.OrderByDescending(x => x.Value).Take(5).Select(kvp =>
        {
            var cat = categories.FirstOrDefault(c => c.Id == kvp.Key);
            return new CategoryBreakdownDto(cat?.Name ?? "Sin cat.", cat?.Color ?? "#6B7280", kvp.Value,
                totalExpense > 0 ? Math.Round(kvp.Value / totalExpense * 100, 1) : 0);
        });

        var ventureResults = ventureSummary.Select(kvp =>
        {
            var v = ventures.FirstOrDefault(x => x.Id == kvp.Key);
            return new VenturePerformanceDto(v?.Name ?? "Desconocido", v?.Color ?? "#F59E0B",
                kvp.Value.Income, kvp.Value.Expense, kvp.Value.Income - kvp.Value.Expense);
        });

        return new AnnualReportDto(year, totalIncome, totalExpense, totalIncome - totalExpense,
            monthlyBreakdown, topExp, ventureResults);
    }

    public async Task<byte[]> ExportCsvAsync(Guid familyId, MovementFilterDto filter, CancellationToken ct = default)
    {
        MovementType? type = filter.Type != null ? Enum.Parse<MovementType>(filter.Type, true) : null;
        var movements = await _movementRepo.GetByFamilyAsync(familyId, filter.From, filter.To, type,
            filter.ContributorId, filter.CategoryId, filter.VentureId, filter.AccountId,
            filter.MinAmount, filter.MaxAmount, ct);

        var sb = new System.Text.StringBuilder();
        sb.AppendLine("Fecha,Tipo,Monto,Concepto,Responsable,Categoría,Emprendimiento,Cuenta,Medio de Pago,Notas");
        foreach (var m in movements)
            sb.AppendLine($"{m.MovementDate},{m.Type},{m.Amount:N2},\"{m.Concept}\",\"{m.Contributor?.Name ?? ""}\",\"{m.Category?.Name ?? ""}\",\"{m.Venture?.Name ?? ""}\",\"{m.Account?.Name ?? ""}\",{m.PaymentMethod},\"{m.Notes ?? ""}\"");

        return System.Text.Encoding.UTF8.GetBytes(sb.ToString());
    }

    public async Task<byte[]> ExportPdfAsync(Guid familyId, int year, int month, CancellationToken ct = default)
    {
        // PDF generation requires a PDF library; returning CSV as placeholder
        // In production, integrate iTextSharp or QuestPDF
        var report = await GetMonthlyAsync(familyId, year, month, ct);
        var content = $"FamilyFinance Pro - Reporte Mensual\n{new string('=', 50)}\n" +
                      $"Período: {month}/{year}\n" +
                      $"Ingresos: {report.TotalIncome:N2}\n" +
                      $"Gastos: {report.TotalExpense:N2}\n" +
                      $"Resultado Neto: {report.NetResult:N2}\n" +
                      $"Ahorro: {report.Savings:N2}\n" +
                      $"Cumplimiento: {report.Compliance.CompliancePercentage}%";
        return System.Text.Encoding.UTF8.GetBytes(content);
    }
}
