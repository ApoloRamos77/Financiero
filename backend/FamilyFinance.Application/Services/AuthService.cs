using FamilyFinance.Application.DTOs;
using FamilyFinance.Application.Interfaces;
using FamilyFinance.Application.Interfaces.Repositories;
using FamilyFinance.Domain.Entities;
using FamilyFinance.Domain.Enums;
using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Security.Cryptography;
using System.Text;

namespace FamilyFinance.Application.Services;

public class AuthService : IAuthService
{
    private readonly IUserRepository _userRepo;
    private readonly IRepository<Family> _familyRepo;
    private readonly IRepository<RefreshToken> _tokenRepo;
    private readonly IRepository<Category> _categoryRepo;
    private readonly IRepository<Account> _accountRepo;
    private readonly IRepository<AlertConfig> _alertConfigRepo;
    private readonly IConfiguration _config;

    public AuthService(
        IUserRepository userRepo,
        IRepository<Family> familyRepo,
        IRepository<RefreshToken> tokenRepo,
        IRepository<Category> categoryRepo,
        IRepository<Account> accountRepo,
        IRepository<AlertConfig> alertConfigRepo,
        IConfiguration config)
    {
        _userRepo = userRepo;
        _familyRepo = familyRepo;
        _tokenRepo = tokenRepo;
        _categoryRepo = categoryRepo;
        _accountRepo = accountRepo;
        _alertConfigRepo = alertConfigRepo;
        _config = config;
    }

    public async Task<AuthResponseDto> LoginAsync(LoginDto dto, CancellationToken ct = default)
    {
        var user = await _userRepo.GetByEmailAsync(dto.Email.ToLower(), ct)
            ?? throw new UnauthorizedAccessException("Credenciales inválidas.");

        if (!user.IsActive) throw new UnauthorizedAccessException("Usuario inactivo.");
        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("Credenciales inválidas.");

        user.LastLogin = DateTime.UtcNow;
        await _userRepo.UpdateAsync(user, ct);

        return await GenerateAuthResponseAsync(user, ct);
    }

    public async Task<AuthResponseDto> SetupFamilyAsync(SetupFamilyDto dto, CancellationToken ct = default)
    {
        // Check email not taken
        if (await _userRepo.ExistsAsync(u => u.Email == dto.AdminEmail.ToLower(), ct))
            throw new InvalidOperationException("El correo ya está registrado.");

        // Create family
        var family = new Family
        {
            Id = Guid.NewGuid(),
            Name = dto.FamilyName,
            Currency = dto.Currency,
            CurrencySymbol = dto.CurrencySymbol,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _familyRepo.AddAsync(family, ct);

        // Create admin user
        var user = new User
        {
            Id = Guid.NewGuid(),
            FamilyId = family.Id,
            Name = dto.AdminName,
            Email = dto.AdminEmail.ToLower(),
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.AdminPassword),
            Role = UserRole.Admin,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow
        };
        await _userRepo.AddAsync(user, ct);

        // Seed default categories
        await SeedDefaultCategoriesAsync(family.Id, ct);

        // Seed default accounts
        await SeedDefaultAccountsAsync(family.Id, ct);

        // Seed alert configs
        await SeedDefaultAlertConfigsAsync(family.Id, ct);

        return await GenerateAuthResponseAsync(user, ct);
    }

    public async Task<AuthResponseDto> RefreshTokenAsync(string refreshToken, CancellationToken ct = default)
    {
        var token = (await _tokenRepo.FindAsync(t => t.Token == refreshToken && !t.IsRevoked, ct)).FirstOrDefault()
            ?? throw new UnauthorizedAccessException("Token inválido.");

        if (token.ExpiresAt < DateTime.UtcNow)
            throw new UnauthorizedAccessException("Token expirado.");

        // Revoke old token
        token.IsRevoked = true;
        await _tokenRepo.UpdateAsync(token, ct);

        var user = await _userRepo.GetByIdAsync(token.UserId, ct)
            ?? throw new UnauthorizedAccessException("Usuario no encontrado.");

        return await GenerateAuthResponseAsync(user, ct);
    }

    public async Task RevokeTokenAsync(string refreshToken, CancellationToken ct = default)
    {
        var token = (await _tokenRepo.FindAsync(t => t.Token == refreshToken, ct)).FirstOrDefault();
        if (token != null)
        {
            token.IsRevoked = true;
            await _tokenRepo.UpdateAsync(token, ct);
        }
    }

    private async Task<AuthResponseDto> GenerateAuthResponseAsync(User user, CancellationToken ct)
    {
        var (accessToken, expiresAt) = GenerateAccessToken(user);
        var refreshToken = await GenerateRefreshTokenAsync(user.Id, ct);

        return new AuthResponseDto(
            AccessToken: accessToken,
            RefreshToken: refreshToken,
            ExpiresAt: expiresAt,
            User: new UserDto(user.Id, user.FamilyId, user.Name, user.Email,
                              user.Role.ToString(), user.IsActive, user.AvatarColor, user.LastLogin));
    }

    private (string Token, DateTime ExpiresAt) GenerateAccessToken(User user)
    {
        var jwtSettings = _config.GetSection("JwtSettings");
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSettings["SecretKey"]!));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var expiresAt = DateTime.UtcNow.AddMinutes(int.Parse(jwtSettings["AccessTokenExpirationMinutes"]!));

        var claims = new[]
        {
            new Claim(JwtRegisteredClaimNames.Sub, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Email, user.Email),
            new Claim("familyId", user.FamilyId.ToString()),
            new Claim(ClaimTypes.Role, user.Role.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(
            issuer: jwtSettings["Issuer"],
            audience: jwtSettings["Audience"],
            claims: claims,
            expires: expiresAt,
            signingCredentials: creds);

        return (new JwtSecurityTokenHandler().WriteToken(token), expiresAt);
    }

    private async Task<string> GenerateRefreshTokenAsync(Guid userId, CancellationToken ct)
    {
        var jwtSettings = _config.GetSection("JwtSettings");
        var tokenValue = Convert.ToBase64String(RandomNumberGenerator.GetBytes(64));
        var refreshToken = new RefreshToken
        {
            Id = Guid.NewGuid(),
            UserId = userId,
            Token = tokenValue,
            ExpiresAt = DateTime.UtcNow.AddDays(int.Parse(jwtSettings["RefreshTokenExpirationDays"]!)),
            CreatedAt = DateTime.UtcNow
        };
        await _tokenRepo.AddAsync(refreshToken, ct);
        return tokenValue;
    }

    private async Task SeedDefaultCategoriesAsync(Guid familyId, CancellationToken ct)
    {
        var categories = new List<Category>
        {
            // Income categories
            NewCat(familyId, "Salario", CategoryType.Income, "#10B981", "briefcase"),
            NewCat(familyId, "Bonificación", CategoryType.Income, "#10B981", "gift"),
            NewCat(familyId, "Freelance", CategoryType.Income, "#10B981", "laptop"),
            NewCat(familyId, "Emprendimiento", CategoryType.Income, "#F59E0B", "store"),
            NewCat(familyId, "Inversión", CategoryType.Income, "#3B82F6", "trending-up"),
            NewCat(familyId, "Otro ingreso", CategoryType.Income, "#6366F1", "plus-circle"),
            // Expense categories
            NewCat(familyId, "Alimentación", CategoryType.Expense, "#EF4444", "shopping-cart"),
            NewCat(familyId, "Vivienda", CategoryType.Expense, "#EF4444", "home"),
            NewCat(familyId, "Transporte", CategoryType.Expense, "#F59E0B", "car"),
            NewCat(familyId, "Educación", CategoryType.Expense, "#3B82F6", "book-open"),
            NewCat(familyId, "Salud", CategoryType.Expense, "#EC4899", "heart"),
            NewCat(familyId, "Entretenimiento", CategoryType.Expense, "#8B5CF6", "music"),
            NewCat(familyId, "Servicios", CategoryType.Expense, "#6366F1", "zap"),
            NewCat(familyId, "Ropa", CategoryType.Expense, "#F59E0B", "shopping-bag"),
            NewCat(familyId, "Deudas", CategoryType.Expense, "#EF4444", "credit-card"),
            NewCat(familyId, "Emprendimiento", CategoryType.Expense, "#F59E0B", "store"),
            NewCat(familyId, "Otros gastos", CategoryType.Expense, "#6B7280", "more-horizontal"),
        };

        foreach (var cat in categories)
            await _categoryRepo.AddAsync(cat, ct);
    }

    private async Task SeedDefaultAccountsAsync(Guid familyId, CancellationToken ct)
    {
        var accounts = new List<Account>
        {
            new() { Id = Guid.NewGuid(), FamilyId = familyId, Name = "Efectivo", AccountType = AccountType.Cash, Icon = "banknotes", Color = "#10B981", Balance = 0, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), FamilyId = familyId, Name = "Cuenta Bancaria", AccountType = AccountType.BankAccount, Icon = "building-library", Color = "#3B82F6", Balance = 0, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
            new() { Id = Guid.NewGuid(), FamilyId = familyId, Name = "Yape", AccountType = AccountType.DigitalWallet, Icon = "device-phone-mobile", Color = "#8B5CF6", Balance = 0, IsActive = true, CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow },
        };
        foreach (var acc in accounts)
            await _accountRepo.AddAsync(acc, ct);
    }

    private async Task SeedDefaultAlertConfigsAsync(Guid familyId, CancellationToken ct)
    {
        var configs = Enum.GetValues<AlertType>().Select(t => new AlertConfig
        {
            Id = Guid.NewGuid(), FamilyId = familyId, AlertType = t,
            IsActive = true, Threshold = t == AlertType.HighExpense ? 0.25m : t == AlertType.LowSavings ? 0.10m : null,
            CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
        });
        foreach (var cfg in configs)
            await _alertConfigRepo.AddAsync(cfg, ct);
    }

    private static Category NewCat(Guid familyId, string name, CategoryType type, string color, string icon) => new()
    {
        Id = Guid.NewGuid(), FamilyId = familyId, Name = name, Type = type,
        Color = color, Icon = icon, IsSystem = true, IsActive = true,
        CreatedAt = DateTime.UtcNow, UpdatedAt = DateTime.UtcNow
    };
}
