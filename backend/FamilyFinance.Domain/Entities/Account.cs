using FamilyFinance.Domain.Enums;

namespace FamilyFinance.Domain.Entities;

public class Account
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public AccountType AccountType { get; set; } = AccountType.Cash;
    public decimal Balance { get; set; } = 0;
    public string Color { get; set; } = "#6366F1";
    public string Icon { get; set; } = "wallet";
    public string? BankName { get; set; }
    public string? LastFour { get; set; }
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public Family Family { get; set; } = null!;
    public ICollection<Movement> Movements { get; set; } = new List<Movement>();
}
