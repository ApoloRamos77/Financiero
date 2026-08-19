using FamilyFinance.Domain.Enums;

namespace FamilyFinance.Domain.Entities;

public class Venture
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public Guid? ResponsibleId { get; set; }
    public VentureStatus Status { get; set; } = VentureStatus.Active;
    public DateOnly? StartDate { get; set; }
    public string Icon { get; set; } = "briefcase";
    public string Color { get; set; } = "#F59E0B";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public Family Family { get; set; } = null!;
    public User? Responsible { get; set; }
    public ICollection<Movement> Movements { get; set; } = new List<Movement>();

    // Calculated (not mapped)
    public decimal TotalIncome => Movements.Where(m => m.Type == MovementType.Income && !m.IsDeleted).Sum(m => m.Amount);
    public decimal TotalExpense => Movements.Where(m => m.Type == MovementType.Expense && !m.IsDeleted).Sum(m => m.Amount);
    public decimal NetProfit => TotalIncome - TotalExpense;
}
