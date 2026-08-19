using FamilyFinance.Domain.Enums;

namespace FamilyFinance.Domain.Entities;

public class Alert
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public AlertType AlertType { get; set; }
    public string Title { get; set; } = string.Empty;
    public string Message { get; set; } = string.Empty;
    public AlertStatus Status { get; set; } = AlertStatus.Active;
    public Guid? VentureId { get; set; }
    public DateOnly AlertDate { get; set; }
    public DateTime? ReadAt { get; set; }
    public DateTime CreatedAt { get; set; }

    // Navigation
    public Family Family { get; set; } = null!;
    public Venture? Venture { get; set; }
}

public class AlertConfig
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public AlertType AlertType { get; set; }
    public bool IsActive { get; set; } = true;
    public decimal? Threshold { get; set; }
    public string? Description { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public Family Family { get; set; } = null!;
}
