using FamilyFinance.Domain.Entities;
using FamilyFinance.Domain.Enums;

namespace FamilyFinance.Application.Interfaces.Repositories;

public interface IMovementRepository : IRepository<Movement>
{
    Task<IEnumerable<Movement>> GetByFamilyAsync(Guid familyId, DateOnly? from = null, DateOnly? to = null,
        MovementType? type = null, Guid? contributorId = null, Guid? categoryId = null,
        Guid? ventureId = null, Guid? accountId = null, decimal? minAmount = null, decimal? maxAmount = null,
        CancellationToken ct = default);

    Task<IEnumerable<DateOnly>> GetDaysWithRecordsAsync(Guid familyId, int year, int month, CancellationToken ct = default);
    Task<decimal> GetTotalByTypeAsync(Guid familyId, MovementType type, DateOnly from, DateOnly to, CancellationToken ct = default);
    Task<Dictionary<Guid, decimal>> GetTotalByCategoryAsync(Guid familyId, MovementType type, DateOnly from, DateOnly to, CancellationToken ct = default);
    Task<Dictionary<Guid, (decimal Income, decimal Expense)>> GetVentureSummaryAsync(Guid familyId, DateOnly from, DateOnly to, CancellationToken ct = default);
    Task<IEnumerable<(DateOnly Date, decimal Income, decimal Expense)>> GetDailyTrendAsync(Guid familyId, DateOnly from, DateOnly to, CancellationToken ct = default);

    /// <summary>Inserta el movimiento y actualiza el balance de la cuenta en una sola transacción.</summary>
    Task<Movement> AddWithAccountBalanceAsync(Movement movement, Guid? accountId, decimal balanceDelta, CancellationToken ct = default);

    /// <summary>Actualiza el movimiento, revierte el balance antiguo y aplica el nuevo, todo en una sola transacción.</summary>
    Task UpdateWithAccountBalanceAsync(Movement movement, Guid? oldAccountId, decimal oldBalanceDelta, Guid? newAccountId, decimal newBalanceDelta, CancellationToken ct = default);

    /// <summary>Marca el movimiento como eliminado y revierte el balance de la cuenta en una sola transacción.</summary>
    Task DeleteWithAccountBalanceAsync(Movement movement, Guid? accountId, decimal balanceDelta, CancellationToken ct = default);
}

public interface IUserRepository : IRepository<User>
{
    Task<User?> GetByEmailAsync(string email, CancellationToken ct = default);
    Task<IEnumerable<User>> GetByFamilyAsync(Guid familyId, CancellationToken ct = default);
}

public interface IFamilyRepository : IRepository<Family>
{
    Task<Family?> GetWithDetailsAsync(Guid familyId, CancellationToken ct = default);
}
