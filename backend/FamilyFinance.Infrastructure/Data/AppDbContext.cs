using FamilyFinance.Domain.Entities;
using FamilyFinance.Domain.Enums;
using Microsoft.EntityFrameworkCore;

namespace FamilyFinance.Infrastructure.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Family> Families => Set<Family>();
    public DbSet<User> Users => Set<User>();
    public DbSet<RefreshToken> RefreshTokens => Set<RefreshToken>();
    public DbSet<Contributor> Contributors => Set<Contributor>();
    public DbSet<Venture> Ventures => Set<Venture>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<Movement> Movements => Set<Movement>();
    public DbSet<Goal> Goals => Set<Goal>();
    public DbSet<Alert> Alerts => Set<Alert>();
    public DbSet<AlertConfig> AlertConfigs => Set<AlertConfig>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Schema
        modelBuilder.HasDefaultSchema("ff");

        // ─── Family ─────────────────────────────────────────────
        modelBuilder.Entity<Family>(e =>
        {
            e.ToTable("families");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(150).IsRequired();
            e.Property(x => x.Currency).HasColumnName("currency").HasMaxLength(10).HasDefaultValue("PEN");
            e.Property(x => x.CurrencySymbol).HasColumnName("currency_symbol").HasMaxLength(5).HasDefaultValue("S/");
            e.Property(x => x.Timezone).HasColumnName("timezone").HasMaxLength(50).HasDefaultValue("America/Lima");
            e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("NOW()");
        });

        // ─── User ────────────────────────────────────────────────
        modelBuilder.Entity<User>(e =>
        {
            e.ToTable("users");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            e.Property(x => x.FamilyId).HasColumnName("family_id");
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(150).IsRequired();
            e.Property(x => x.Email).HasColumnName("email").HasMaxLength(255).IsRequired();
            e.Property(x => x.PasswordHash).HasColumnName("password_hash").HasMaxLength(500).IsRequired();
            e.Property(x => x.Role).HasColumnName("role").HasConversion<string>().HasDefaultValue(UserRole.Contributor);
            e.Property(x => x.IsActive).HasColumnName("is_active").HasDefaultValue(true);
            e.Property(x => x.AvatarColor).HasColumnName("avatar_color").HasMaxLength(7).HasDefaultValue("#6366F1");
            e.Property(x => x.LastLogin).HasColumnName("last_login");
            e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("NOW()");
            e.HasIndex(x => x.Email).IsUnique();
            e.HasOne(x => x.Family).WithMany(f => f.Users).HasForeignKey(x => x.FamilyId).OnDelete(DeleteBehavior.Cascade);
        });

        // ─── RefreshToken ────────────────────────────────────────
        modelBuilder.Entity<RefreshToken>(e =>
        {
            e.ToTable("refresh_tokens");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.Token).HasColumnName("token").HasMaxLength(500).IsRequired();
            e.Property(x => x.ExpiresAt).HasColumnName("expires_at");
            e.Property(x => x.IsRevoked).HasColumnName("is_revoked").HasDefaultValue(false);
            e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
            e.HasIndex(x => x.Token).IsUnique();
            e.HasOne(x => x.User).WithMany(u => u.RefreshTokens).HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.Cascade);
        });

        // ─── Contributor ─────────────────────────────────────────
        modelBuilder.Entity<Contributor>(e =>
        {
            e.ToTable("contributors");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            e.Property(x => x.FamilyId).HasColumnName("family_id");
            e.Property(x => x.UserId).HasColumnName("user_id");
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(150).IsRequired();
            e.Property(x => x.ContributorType).HasColumnName("contributor_type").HasConversion<string>().HasDefaultValue(ContributorType.Salary);
            e.Property(x => x.FixedIncome).HasColumnName("fixed_income").HasColumnType("decimal(15,2)").HasDefaultValue(0);
            e.Property(x => x.Frequency).HasColumnName("frequency").HasConversion<string>().HasDefaultValue(FrequencyType.Monthly);
            e.Property(x => x.PaymentDay).HasColumnName("payment_day");
            e.Property(x => x.IncomeSource).HasColumnName("income_source").HasMaxLength(255);
            e.Property(x => x.IsActive).HasColumnName("is_active").HasDefaultValue(true);
            e.Property(x => x.Notes).HasColumnName("notes");
            e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("NOW()");
            e.HasOne(x => x.Family).WithMany(f => f.Contributors).HasForeignKey(x => x.FamilyId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.User).WithMany().HasForeignKey(x => x.UserId).OnDelete(DeleteBehavior.SetNull);
        });

        // ─── Venture ─────────────────────────────────────────────
        modelBuilder.Entity<Venture>(e =>
        {
            e.ToTable("ventures");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            e.Property(x => x.FamilyId).HasColumnName("family_id");
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(150).IsRequired();
            e.Property(x => x.Description).HasColumnName("description");
            e.Property(x => x.ResponsibleId).HasColumnName("responsible_id");
            e.Property(x => x.Status).HasColumnName("status").HasConversion<string>().HasDefaultValue(VentureStatus.Active);
            e.Property(x => x.StartDate).HasColumnName("start_date");
            e.Property(x => x.Icon).HasColumnName("icon").HasMaxLength(50).HasDefaultValue("briefcase");
            e.Property(x => x.Color).HasColumnName("color").HasMaxLength(7).HasDefaultValue("#F59E0B");
            e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("NOW()");
            e.Ignore(x => x.TotalIncome);
            e.Ignore(x => x.TotalExpense);
            e.Ignore(x => x.NetProfit);
            e.HasOne(x => x.Family).WithMany(f => f.Ventures).HasForeignKey(x => x.FamilyId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Responsible).WithMany().HasForeignKey(x => x.ResponsibleId).OnDelete(DeleteBehavior.SetNull);
        });

        // ─── Category ────────────────────────────────────────────
        modelBuilder.Entity<Category>(e =>
        {
            e.ToTable("categories");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            e.Property(x => x.FamilyId).HasColumnName("family_id");
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
            e.Property(x => x.Type).HasColumnName("type").HasConversion<string>().HasDefaultValue(CategoryType.Expense);
            e.Property(x => x.ParentId).HasColumnName("parent_id");
            e.Property(x => x.Icon).HasColumnName("icon").HasMaxLength(50).HasDefaultValue("tag");
            e.Property(x => x.Color).HasColumnName("color").HasMaxLength(7).HasDefaultValue("#6366F1");
            e.Property(x => x.IsActive).HasColumnName("is_active").HasDefaultValue(true);
            e.Property(x => x.IsSystem).HasColumnName("is_system").HasDefaultValue(false);
            e.Property(x => x.SortOrder).HasColumnName("sort_order").HasDefaultValue(0);
            e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("NOW()");
            e.HasOne(x => x.Family).WithMany(f => f.Categories).HasForeignKey(x => x.FamilyId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Parent).WithMany(c => c.Children).HasForeignKey(x => x.ParentId).OnDelete(DeleteBehavior.SetNull);
        });

        // ─── Account ─────────────────────────────────────────────
        modelBuilder.Entity<Account>(e =>
        {
            e.ToTable("accounts");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            e.Property(x => x.FamilyId).HasColumnName("family_id");
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(100).IsRequired();
            e.Property(x => x.AccountType).HasColumnName("account_type").HasConversion<string>().HasDefaultValue(AccountType.Cash);
            e.Property(x => x.Balance).HasColumnName("balance").HasColumnType("decimal(15,2)").HasDefaultValue(0);
            e.Property(x => x.Color).HasColumnName("color").HasMaxLength(7).HasDefaultValue("#6366F1");
            e.Property(x => x.Icon).HasColumnName("icon").HasMaxLength(50).HasDefaultValue("wallet");
            e.Property(x => x.BankName).HasColumnName("bank_name").HasMaxLength(100);
            e.Property(x => x.LastFour).HasColumnName("last_four").HasMaxLength(4);
            e.Property(x => x.IsActive).HasColumnName("is_active").HasDefaultValue(true);
            e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("NOW()");
            e.HasOne(x => x.Family).WithMany(f => f.Accounts).HasForeignKey(x => x.FamilyId).OnDelete(DeleteBehavior.Cascade);
        });

        // ─── Movement ────────────────────────────────────────────
        modelBuilder.Entity<Movement>(e =>
        {
            e.ToTable("movements");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            e.Property(x => x.FamilyId).HasColumnName("family_id");
            e.Property(x => x.MovementDate).HasColumnName("movement_date");
            e.Property(x => x.Type).HasColumnName("type").HasConversion<string>();
            e.Property(x => x.Amount).HasColumnName("amount").HasColumnType("decimal(15,2)");
            e.Property(x => x.Concept).HasColumnName("concept").HasMaxLength(500).IsRequired();
            e.Property(x => x.ContributorId).HasColumnName("contributor_id");
            e.Property(x => x.CategoryId).HasColumnName("category_id");
            e.Property(x => x.VentureId).HasColumnName("venture_id");
            e.Property(x => x.AccountId).HasColumnName("account_id");
            e.Property(x => x.PaymentMethod).HasColumnName("payment_method").HasConversion<string>().HasDefaultValue(PaymentMethod.Cash);
            e.Property(x => x.Notes).HasColumnName("notes");
            e.Property(x => x.IsDeleted).HasColumnName("is_deleted").HasDefaultValue(false);
            e.Property(x => x.CreatedBy).HasColumnName("created_by");
            e.Property(x => x.UpdatedBy).HasColumnName("updated_by");
            e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("NOW()");
            e.HasOne(x => x.Family).WithMany(f => f.Movements).HasForeignKey(x => x.FamilyId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Contributor).WithMany(c => c.Movements).HasForeignKey(x => x.ContributorId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.Category).WithMany(c => c.Movements).HasForeignKey(x => x.CategoryId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.Venture).WithMany(v => v.Movements).HasForeignKey(x => x.VentureId).OnDelete(DeleteBehavior.SetNull);
            e.HasOne(x => x.Account).WithMany(a => a.Movements).HasForeignKey(x => x.AccountId).OnDelete(DeleteBehavior.SetNull);
        });

        // ─── Goal ────────────────────────────────────────────────
        modelBuilder.Entity<Goal>(e =>
        {
            e.ToTable("goals");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            e.Property(x => x.FamilyId).HasColumnName("family_id");
            e.Property(x => x.Name).HasColumnName("name").HasMaxLength(150).IsRequired();
            e.Property(x => x.GoalType).HasColumnName("goal_type").HasConversion<string>().HasDefaultValue(GoalType.Other);
            e.Property(x => x.TargetAmount).HasColumnName("target_amount").HasColumnType("decimal(15,2)");
            e.Property(x => x.CurrentAmount).HasColumnName("current_amount").HasColumnType("decimal(15,2)").HasDefaultValue(0);
            e.Property(x => x.TargetDate).HasColumnName("target_date");
            e.Property(x => x.MonthlyContribution).HasColumnName("monthly_contribution").HasColumnType("decimal(15,2)").HasDefaultValue(0);
            e.Property(x => x.Icon).HasColumnName("icon").HasMaxLength(50).HasDefaultValue("target");
            e.Property(x => x.Color).HasColumnName("color").HasMaxLength(7).HasDefaultValue("#3B82F6");
            e.Property(x => x.IsAchieved).HasColumnName("is_achieved").HasDefaultValue(false);
            e.Property(x => x.IsActive).HasColumnName("is_active").HasDefaultValue(true);
            e.Property(x => x.Notes).HasColumnName("notes");
            e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("NOW()");
            e.Ignore(x => x.ProgressPercentage);
            e.Ignore(x => x.RemainingAmount);
            e.Ignore(x => x.MonthsToAchieve);
            e.HasOne(x => x.Family).WithMany(f => f.Goals).HasForeignKey(x => x.FamilyId).OnDelete(DeleteBehavior.Cascade);
        });

        // ─── Alert ───────────────────────────────────────────────
        modelBuilder.Entity<Alert>(e =>
        {
            e.ToTable("alerts");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            e.Property(x => x.FamilyId).HasColumnName("family_id");
            e.Property(x => x.AlertType).HasColumnName("alert_type").HasConversion<string>();
            e.Property(x => x.Title).HasColumnName("title").HasMaxLength(200).IsRequired();
            e.Property(x => x.Message).HasColumnName("message").IsRequired();
            e.Property(x => x.Status).HasColumnName("status").HasConversion<string>().HasDefaultValue(AlertStatus.Active);
            e.Property(x => x.VentureId).HasColumnName("venture_id");
            e.Property(x => x.AlertDate).HasColumnName("alert_date").HasDefaultValueSql("CURRENT_DATE");
            e.Property(x => x.ReadAt).HasColumnName("read_at");
            e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
            e.HasOne(x => x.Family).WithMany(f => f.Alerts).HasForeignKey(x => x.FamilyId).OnDelete(DeleteBehavior.Cascade);
            e.HasOne(x => x.Venture).WithMany().HasForeignKey(x => x.VentureId).OnDelete(DeleteBehavior.SetNull);
        });

        // ─── AlertConfig ─────────────────────────────────────────
        modelBuilder.Entity<AlertConfig>(e =>
        {
            e.ToTable("alert_configs");
            e.HasKey(x => x.Id);
            e.Property(x => x.Id).HasColumnName("id").HasDefaultValueSql("uuid_generate_v4()");
            e.Property(x => x.FamilyId).HasColumnName("family_id");
            e.Property(x => x.AlertType).HasColumnName("alert_type").HasConversion<string>();
            e.Property(x => x.IsActive).HasColumnName("is_active").HasDefaultValue(true);
            e.Property(x => x.Threshold).HasColumnName("threshold").HasColumnType("decimal(10,4)");
            e.Property(x => x.Description).HasColumnName("description").HasMaxLength(500);
            e.Property(x => x.CreatedAt).HasColumnName("created_at").HasDefaultValueSql("NOW()");
            e.Property(x => x.UpdatedAt).HasColumnName("updated_at").HasDefaultValueSql("NOW()");
            e.HasIndex(x => new { x.FamilyId, x.AlertType }).IsUnique();
            e.HasOne(x => x.Family).WithMany().HasForeignKey(x => x.FamilyId).OnDelete(DeleteBehavior.Cascade);
        });
    }
}
