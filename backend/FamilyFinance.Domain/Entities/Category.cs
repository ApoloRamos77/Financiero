using FamilyFinance.Domain.Enums;

namespace FamilyFinance.Domain.Entities;

public class Category
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public CategoryType Type { get; set; } = CategoryType.Expense;
    public Guid? ParentId { get; set; }
    public string Icon { get; set; } = "tag";
    public string Color { get; set; } = "#6366F1";
    public bool IsActive { get; set; } = true;
    public bool IsSystem { get; set; } = false;
    public int SortOrder { get; set; } = 0;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public Family Family { get; set; } = null!;
    public Category? Parent { get; set; }
    public ICollection<Category> Children { get; set; } = new List<Category>();
    public ICollection<Movement> Movements { get; set; } = new List<Movement>();
}
