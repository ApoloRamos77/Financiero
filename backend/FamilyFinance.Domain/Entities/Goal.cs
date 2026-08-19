using FamilyFinance.Domain.Enums;

namespace FamilyFinance.Domain.Entities;

public class Goal
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public GoalType GoalType { get; set; } = GoalType.Other;
    public decimal TargetAmount { get; set; }
    public decimal CurrentAmount { get; set; } = 0;
    public DateOnly? TargetDate { get; set; }
    public decimal MonthlyContribution { get; set; } = 0;
    public string Icon { get; set; } = "target";
    public string Color { get; set; } = "#3B82F6";
    public bool IsAchieved { get; set; } = false;
    public bool IsActive { get; set; } = true;
    public string? Notes { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Calculated
    public decimal ProgressPercentage => TargetAmount > 0 ? Math.Min(100, (CurrentAmount / TargetAmount) * 100) : 0;
    public decimal RemainingAmount => Math.Max(0, TargetAmount - CurrentAmount);
    public int? MonthsToAchieve => MonthlyContribution > 0 && RemainingAmount > 0
        ? (int)Math.Ceiling(RemainingAmount / MonthlyContribution) : null;

    // Navigation
    public Family Family { get; set; } = null!;
}
