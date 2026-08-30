using FamilyFinance.Domain.Enums;

namespace FamilyFinance.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public Guid FamilyId { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string PasswordHash { get; set; } = string.Empty;
    public UserRole Role { get; set; } = UserRole.Contributor;
    public bool IsActive { get; set; } = true;
    public bool MustChangePassword { get; set; } = false;
    public string AvatarColor { get; set; } = "#6366F1";
    public DateTime? LastLogin { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }

    // Navigation
    public Family Family { get; set; } = null!;
    public ICollection<RefreshToken> RefreshTokens { get; set; } = new List<RefreshToken>();
}

public class RefreshToken
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string Token { get; set; } = string.Empty;
    public DateTime ExpiresAt { get; set; }
    public bool IsRevoked { get; set; } = false;
    public DateTime CreatedAt { get; set; }

    public User User { get; set; } = null!;
}
