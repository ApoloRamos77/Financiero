namespace FamilyFinance.Domain.Entities;

public class Family
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Currency { get; set; } = "PEN";
    public string CurrencySymbol { get; set; } = "S/";
    public string Timezone { get; set; } = "America/Lima";
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public ICollection<User> Users { get; set; } = new List<User>();
    public ICollection<Contributor> Contributors { get; set; } = new List<Contributor>();
    public ICollection<Venture> Ventures { get; set; } = new List<Venture>();
    public ICollection<Category> Categories { get; set; } = new List<Category>();
    public ICollection<Account> Accounts { get; set; } = new List<Account>();
    public ICollection<Movement> Movements { get; set; } = new List<Movement>();
    public ICollection<Goal> Goals { get; set; } = new List<Goal>();
    public ICollection<Alert> Alerts { get; set; } = new List<Alert>();
}
