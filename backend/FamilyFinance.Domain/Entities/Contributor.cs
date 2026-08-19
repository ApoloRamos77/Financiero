using FamilyFinance.Domain.Enums;

namespace FamilyFinance.Domain.Entities;

public class Contributor
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public Guid? UserId { get; set; }
    public string Name { get; set; } = string.Empty;
    public ContributorType ContributorType { get; set; } = ContributorType.Salary;
    public decimal FixedIncome { get; set; }
    public FrequencyType Frequency { get; set; } = FrequencyType.Monthly;
    public int? PaymentDay { get; set; }
    public string? IncomeSource { get; set; }
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public Family Family { get; set; } = null!;
    public User? User { get; set; }
    public ICollection<Movement> Movements { get; set; } = new List<Movement>();
}
