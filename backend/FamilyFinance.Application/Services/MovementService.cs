using FamilyFinance.Application.DTOs;
using FamilyFinance.Application.Interfaces;
using FamilyFinance.Application.Interfaces.Repositories;
using FamilyFinance.Domain.Entities;
using FamilyFinance.Domain.Enums;

namespace FamilyFinance.Application.Services;

public class MovementService : IMovementService
{
    private readonly IMovementRepository _repo;
    private readonly IRepository<Category> _catRepo;
    private readonly IRepository<Contributor> _contribRepo;
    private readonly IRepository<Venture> _ventureRepo;

    public MovementService(IMovementRepository repo, IRepository<Category> catRepo,
        IRepository<Contributor> contribRepo, IRepository<Venture> ventureRepo)
    {
        _repo = repo; _catRepo = catRepo; _contribRepo = contribRepo;
        _ventureRepo = ventureRepo;
    }


    public async Task<PagedResultDto<MovementDto>> GetByFamilyAsync(Guid familyId, MovementFilterDto filter, CancellationToken ct = default)
    {
        MovementType? type = filter.Type != null ? Enum.Parse<MovementType>(filter.Type, true) : null;
        var all = await _repo.GetByFamilyAsync(familyId, filter.From, filter.To, type,
            filter.ContributorId, filter.CategoryId, filter.VentureId, filter.AccountId,
            filter.MinAmount, filter.MaxAmount, ct);

        var total = all.Count();
        var items = all.Skip((filter.Page - 1) * filter.PageSize).Take(filter.PageSize).Select(MapToDto);
        return new PagedResultDto<MovementDto>(items, total, filter.Page, filter.PageSize,
            (int)Math.Ceiling((double)total / filter.PageSize));
    }

    public async Task<MovementDto> GetByIdAsync(Guid id, CancellationToken ct = default)
    {
        var m = await _repo.GetByIdAsync(id, ct) ?? throw new KeyNotFoundException($"Movimiento {id} no encontrado.");
        return MapToDto(m);
    }

    public async Task<MovementDto> CreateAsync(Guid familyId, Guid userId, CreateMovementDto dto, CancellationToken ct = default)
    {
        if (dto.Amount <= 0) throw new ArgumentException("El monto debe ser mayor a cero.");

        var movementType = Enum.Parse<MovementType>(dto.Type, true);
        var movement = new Movement
        {
            Id = Guid.NewGuid(),
            FamilyId = familyId,
            MovementDate = dto.MovementDate,
            Type = movementType,
            Amount = dto.Amount,
            Concept = dto.Concept,
            ContributorId = dto.ContributorId,
            CategoryId = dto.CategoryId,
            VentureId = dto.VentureId,
            AccountId = dto.AccountId,
            PaymentMethod = dto.PaymentMethod != null ? Enum.Parse<PaymentMethod>(dto.PaymentMethod, true) : PaymentMethod.Cash,
            Notes = dto.Notes,
            CreatedBy = userId,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };

        // Calcular delta del balance: positivo para ingresos, negativo para gastos
        var balanceDelta = dto.AccountId.HasValue
            ? (movementType == MovementType.Income ? dto.Amount : -dto.Amount)
            : 0;

        // Operación atómica: inserta el movimiento y actualiza el balance en un solo SaveChanges
        var created = await _repo.AddWithAccountBalanceAsync(movement, dto.AccountId, balanceDelta, ct);
        return MapToDto(created);
    }

    public async Task<MovementDto> UpdateAsync(Guid id, Guid userId, UpdateMovementDto dto, CancellationToken ct = default)
    {
        var movement = await _repo.GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Movimiento {id} no encontrado.");

        // Delta para revertir el balance anterior
        var oldBalanceDelta = movement.AccountId.HasValue
            ? (movement.Type == MovementType.Income ? -movement.Amount : movement.Amount)
            : 0;

        movement.MovementDate = dto.MovementDate;
        movement.Amount = dto.Amount;
        movement.Concept = dto.Concept;
        movement.ContributorId = dto.ContributorId;
        movement.CategoryId = dto.CategoryId;
        movement.VentureId = dto.VentureId;
        movement.AccountId = dto.AccountId;
        movement.PaymentMethod = dto.PaymentMethod != null ? Enum.Parse<PaymentMethod>(dto.PaymentMethod, true) : PaymentMethod.Cash;
        movement.Notes = dto.Notes;
        movement.UpdatedBy = userId;
        movement.UpdatedAt = DateTime.UtcNow;

        // Delta para aplicar el nuevo balance
        var newBalanceDelta = dto.AccountId.HasValue
            ? (movement.Type == MovementType.Income ? dto.Amount : -dto.Amount)
            : 0;

        // Operación atómica: actualiza el movimiento y ajusta ambos balances en un solo SaveChanges
        await _repo.UpdateWithAccountBalanceAsync(movement,
            oldAccountId: movement.AccountId, oldBalanceDelta: oldBalanceDelta,
            newAccountId: dto.AccountId, newBalanceDelta: newBalanceDelta, ct);
        return MapToDto(movement);
    }

    public async Task DeleteAsync(Guid id, CancellationToken ct = default)
    {
        var movement = await _repo.GetByIdAsync(id, ct)
            ?? throw new KeyNotFoundException($"Movimiento {id} no encontrado.");

        // Delta para revertir el balance al eliminar
        var balanceDelta = movement.AccountId.HasValue
            ? (movement.Type == MovementType.Income ? -movement.Amount : movement.Amount)
            : 0;

        movement.IsDeleted = true;
        movement.UpdatedAt = DateTime.UtcNow;

        // Operación atómica: marca como eliminado y revierte el balance en un solo SaveChanges
        await _repo.DeleteWithAccountBalanceAsync(movement, movement.AccountId, balanceDelta, ct);
    }


    public async Task<CalendarMonthDto> GetCalendarAsync(Guid familyId, int year, int month, CancellationToken ct = default)
    {
        var from = new DateOnly(year, month, 1);
        var to = from.AddMonths(1).AddDays(-1);
        var movements = await _repo.GetByFamilyAsync(familyId, from, to, ct: ct);

        var grouped = movements.GroupBy(m => m.MovementDate);
        var days = new List<CalendarDayDto>();
        for (var d = from; d <= to; d = d.AddDays(1))
        {
            var dayMovements = grouped.FirstOrDefault(g => g.Key == d)?.ToList() ?? new();
            days.Add(new CalendarDayDto(
                Date: d,
                HasRecords: dayMovements.Any(),
                HasIncome: dayMovements.Any(m => m.Type == MovementType.Income),
                HasExpense: dayMovements.Any(m => m.Type == MovementType.Expense),
                DailyIncome: dayMovements.Where(m => m.Type == MovementType.Income).Sum(m => m.Amount),
                DailyExpense: dayMovements.Where(m => m.Type == MovementType.Expense).Sum(m => m.Amount),
                MovementCount: dayMovements.Count));
        }

        return new CalendarMonthDto(year, month, days);
    }

    public async Task<ComplianceDto> GetComplianceAsync(Guid familyId, int year, int month, CancellationToken ct = default)
    {
        var today = DateOnly.FromDateTime(DateTime.Today);
        var from = new DateOnly(year, month, 1);
        var to = from.AddMonths(1).AddDays(-1);
        var daysElapsed = today >= to ? to.Day : (today.Year == year && today.Month == month ? today.Day : 0);

        var daysWithRecords = await _repo.GetDaysWithRecordsAsync(familyId, year, month, ct);
        var withRecords = daysWithRecords.Count();

        return new ComplianceDto(
            Year: year,
            Month: month,
            TotalDays: to.Day,
            DaysElapsed: daysElapsed,
            DaysWithRecords: withRecords,
            DaysWithoutRecords: Math.Max(0, daysElapsed - withRecords),
            CompliancePercentage: daysElapsed > 0 ? Math.Round((decimal)withRecords / daysElapsed * 100, 1) : 0);
    }

    private static MovementDto MapToDto(Movement m) => new(
        m.Id, m.FamilyId, m.MovementDate, m.Type.ToString(), m.Amount, m.Concept,
        m.ContributorId, m.Contributor?.Name,
        m.CategoryId, m.Category?.Name, m.Category?.Color,
        m.VentureId, m.Venture?.Name,
        m.AccountId, m.Account?.Name,
        m.PaymentMethod.ToString(), m.Notes, m.CreatedAt);
}
