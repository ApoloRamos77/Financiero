using FamilyFinance.Domain.Enums;

namespace FamilyFinance.Domain.Entities;

public class Movement
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public DateOnly MovementDate { get; set; }
    public MovementType Type { get; set; }
    public decimal Amount { get; set; }
    public string Concept { get; set; } = string.Empty;
    public Guid? ContributorId { get; set; }
    public Guid? CategoryId { get; set; }
    public Guid? VentureId { get; set; }
    public Guid? AccountId { get; set; }
    public PaymentMethod PaymentMethod { get; set; } = PaymentMethod.Cash;
    public string? Notes { get; set; }
    public bool IsDeleted { get; set; } = false;
    public Guid? CreatedBy { get; set; }
    public Guid? UpdatedBy { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public Family Family { get; set; } = null!;
    public Contributor? Contributor { get; set; }
    public Category? Category { get; set; }
    public Venture? Venture { get; set; }
    public Account? Account { get; set; }
}
