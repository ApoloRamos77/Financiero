using FamilyFinance.Application.Interfaces.Repositories;
using FamilyFinance.Domain.Entities;
using FamilyFinance.Domain.Enums;
using FamilyFinance.Infrastructure.Data;
using Microsoft.EntityFrameworkCore;

namespace FamilyFinance.Infrastructure.Repositories;

public class MovementRepository : Repository<Movement>, IMovementRepository
{
    public MovementRepository(AppDbContext ctx) : base(ctx) { }

    public async Task<IEnumerable<Movement>> GetByFamilyAsync(
        Guid familyId, DateOnly? from = null, DateOnly? to = null,
        MovementType? type = null, Guid? contributorId = null, Guid? categoryId = null,
        Guid? ventureId = null, Guid? accountId = null, decimal? minAmount = null, decimal? maxAmount = null,
        CancellationToken ct = default)
    {
        var query = _ctx.Movements
            .Include(m => m.Contributor)
            .Include(m => m.Category)
            .Include(m => m.Venture)
            .Include(m => m.Account)
            .Where(m => m.FamilyId == familyId && !m.IsDeleted);

        if (from.HasValue) query = query.Where(m => m.MovementDate >= from.Value);
        if (to.HasValue) query = query.Where(m => m.MovementDate <= to.Value);
        if (type.HasValue) query = query.Where(m => m.Type == type.Value);
        if (contributorId.HasValue) query = query.Where(m => m.ContributorId == contributorId.Value);
        if (categoryId.HasValue) query = query.Where(m => m.CategoryId == categoryId.Value);
        if (ventureId.HasValue) query = query.Where(m => m.VentureId == ventureId.Value);
        if (accountId.HasValue) query = query.Where(m => m.AccountId == accountId.Value);
        if (minAmount.HasValue) query = query.Where(m => m.Amount >= minAmount.Value);
        if (maxAmount.HasValue) query = query.Where(m => m.Amount <= maxAmount.Value);

        return await query.OrderByDescending(m => m.MovementDate).ThenByDescending(m => m.CreatedAt).ToListAsync(ct);
    }

    public async Task<IEnumerable<DateOnly>> GetDaysWithRecordsAsync(Guid familyId, int year, int month, CancellationToken ct = default)
        => await _ctx.Movements
            .Where(m => m.FamilyId == familyId && !m.IsDeleted
                     && m.MovementDate.Year == year && m.MovementDate.Month == month)
            .Select(m => m.MovementDate)
            .Distinct()
            .ToListAsync(ct);

    public async Task<decimal> GetTotalByTypeAsync(Guid familyId, MovementType type, DateOnly from, DateOnly to, CancellationToken ct = default)
        => await _ctx.Movements
            .Where(m => m.FamilyId == familyId && !m.IsDeleted && m.Type == type
                     && m.MovementDate >= from && m.MovementDate <= to)
            .SumAsync(m => m.Amount, ct);

    public async Task<Dictionary<Guid, decimal>> GetTotalByCategoryAsync(Guid familyId, MovementType type, DateOnly from, DateOnly to, CancellationToken ct = default)
        => await _ctx.Movements
            .Where(m => m.FamilyId == familyId && !m.IsDeleted && m.Type == type
                     && m.MovementDate >= from && m.MovementDate <= to)
            .GroupBy(m => m.CategoryId)
            .ToDictionaryAsync(g => g.Key, g => g.Sum(m => m.Amount), ct);

    public async Task<Dictionary<Guid, (decimal Income, decimal Expense)>> GetVentureSummaryAsync(Guid familyId, DateOnly from, DateOnly to, CancellationToken ct = default)
    {
        var data = await _ctx.Movements
            .Where(m => m.FamilyId == familyId && !m.IsDeleted && m.VentureId != null
                     && m.MovementDate >= from && m.MovementDate <= to)
            .GroupBy(m => new { m.VentureId, m.Type })
            .Select(g => new { g.Key.VentureId, g.Key.Type, Total = g.Sum(m => m.Amount) })
            .ToListAsync(ct);

        return data.GroupBy(x => x.VentureId!.Value)
                   .ToDictionary(g => g.Key, g => (
                       Income: g.FirstOrDefault(x => x.Type == MovementType.Income)?.Total ?? 0,
                       Expense: g.FirstOrDefault(x => x.Type == MovementType.Expense)?.Total ?? 0));
    }

    public async Task<IEnumerable<(DateOnly Date, decimal Income, decimal Expense)>> GetDailyTrendAsync(Guid familyId, DateOnly from, DateOnly to, CancellationToken ct = default)
    {
        var data = await _ctx.Movements
            .Where(m => m.FamilyId == familyId && !m.IsDeleted
                     && m.MovementDate >= from && m.MovementDate <= to)
            .GroupBy(m => new { m.MovementDate, m.Type })
            .Select(g => new { g.Key.MovementDate, g.Key.Type, Total = g.Sum(m => m.Amount) })
            .ToListAsync(ct);

        return data.GroupBy(x => x.MovementDate)
                   .Select(g => (
                       Date: g.Key,
                       Income: g.FirstOrDefault(x => x.Type == MovementType.Income)?.Total ?? 0,
                       Expense: g.FirstOrDefault(x => x.Type == MovementType.Expense)?.Total ?? 0))
                   .OrderBy(x => x.Date);
    }

    // ─── Métodos atómicos: movimiento + balance de cuenta en una sola transacción ───

    public async Task<Movement> AddWithAccountBalanceAsync(Movement movement, Guid? accountId, decimal balanceDelta, CancellationToken ct = default)
    {
        // Actualizar el balance de la cuenta directamente en BD (sin cargar la entidad)
        if (accountId.HasValue && balanceDelta != 0)
        {
            await _ctx.Database.ExecuteSqlRawAsync(
                "UPDATE ff.accounts SET balance = balance + {0}, updated_at = NOW() WHERE id = {1}",
                balanceDelta, accountId.Value);
        }

        var entry = await _set.AddAsync(movement, ct);
        await _ctx.SaveChangesAsync(ct);
        return entry.Entity;
    }

    public async Task UpdateWithAccountBalanceAsync(Movement movement, Guid? oldAccountId, decimal oldBalanceDelta, Guid? newAccountId, decimal newBalanceDelta, CancellationToken ct = default)
    {
        // Revertir balance anterior
        if (oldAccountId.HasValue && oldBalanceDelta != 0)
        {
            await _ctx.Database.ExecuteSqlRawAsync(
                "UPDATE ff.accounts SET balance = balance + {0}, updated_at = NOW() WHERE id = {1}",
                oldBalanceDelta, oldAccountId.Value);
        }

        // Aplicar nuevo balance
        if (newAccountId.HasValue && newBalanceDelta != 0)
        {
            await _ctx.Database.ExecuteSqlRawAsync(
                "UPDATE ff.accounts SET balance = balance + {0}, updated_at = NOW() WHERE id = {1}",
                newBalanceDelta, newAccountId.Value);
        }

        _set.Update(movement);
        await _ctx.SaveChangesAsync(ct);
    }

    public async Task DeleteWithAccountBalanceAsync(Movement movement, Guid? accountId, decimal balanceDelta, CancellationToken ct = default)
    {
        // Revertir balance
        if (accountId.HasValue && balanceDelta != 0)
        {
            await _ctx.Database.ExecuteSqlRawAsync(
                "UPDATE ff.accounts SET balance = balance + {0}, updated_at = NOW() WHERE id = {1}",
                balanceDelta, accountId.Value);
        }

        _set.Update(movement);
        await _ctx.SaveChangesAsync(ct);
    }
}

public class UserRepository : Repository<User>, IUserRepository
{
    public UserRepository(AppDbContext ctx) : base(ctx) { }

    public async Task<User?> GetByEmailAsync(string email, CancellationToken ct = default)
        => await _ctx.Users.FirstOrDefaultAsync(u => u.Email == email.ToLower(), ct);

    public async Task<IEnumerable<User>> GetByFamilyAsync(Guid familyId, CancellationToken ct = default)
        => await _ctx.Users.Where(u => u.FamilyId == familyId).ToListAsync(ct);
}

public class FamilyRepository : Repository<Family>, IFamilyRepository
{
    public FamilyRepository(AppDbContext ctx) : base(ctx) { }

    public async Task<Family?> GetWithDetailsAsync(Guid familyId, CancellationToken ct = default)
        => await _ctx.Families
            .Include(f => f.Users)
            .Include(f => f.Contributors)
            .Include(f => f.Ventures)
            .Include(f => f.Accounts)
            .FirstOrDefaultAsync(f => f.Id == familyId, ct);
}
