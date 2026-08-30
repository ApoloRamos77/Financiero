using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FamilyFinance.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddMustChangePassword : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.EnsureSchema(
                name: "ff");

            migrationBuilder.CreateTable(
                name: "families",
                schema: "ff",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "uuid_generate_v4()"),
                    name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    currency = table.Column<string>(type: "character varying(10)", maxLength: 10, nullable: false, defaultValue: "PEN"),
                    currency_symbol = table.Column<string>(type: "character varying(5)", maxLength: 5, nullable: false, defaultValue: "S/"),
                    timezone = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "America/Lima"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_families", x => x.id);
                });

            migrationBuilder.CreateTable(
                name: "accounts",
                schema: "ff",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "uuid_generate_v4()"),
                    family_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    account_type = table.Column<string>(type: "text", nullable: false, defaultValue: "Cash"),
                    balance = table.Column<decimal>(type: "numeric(15,2)", nullable: false, defaultValue: 0m),
                    color = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false, defaultValue: "#6366F1"),
                    icon = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "wallet"),
                    bank_name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: true),
                    last_four = table.Column<string>(type: "character varying(4)", maxLength: 4, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_accounts", x => x.id);
                    table.ForeignKey(
                        name: "FK_accounts_families_family_id",
                        column: x => x.family_id,
                        principalSchema: "ff",
                        principalTable: "families",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "alert_configs",
                schema: "ff",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "uuid_generate_v4()"),
                    family_id = table.Column<Guid>(type: "uuid", nullable: false),
                    alert_type = table.Column<string>(type: "text", nullable: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    threshold = table.Column<decimal>(type: "numeric(10,4)", nullable: true),
                    description = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_alert_configs", x => x.id);
                    table.ForeignKey(
                        name: "FK_alert_configs_families_family_id",
                        column: x => x.family_id,
                        principalSchema: "ff",
                        principalTable: "families",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "categories",
                schema: "ff",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "uuid_generate_v4()"),
                    family_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    type = table.Column<string>(type: "text", nullable: false, defaultValue: "Expense"),
                    parent_id = table.Column<Guid>(type: "uuid", nullable: true),
                    icon = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "tag"),
                    color = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false, defaultValue: "#6366F1"),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    is_system = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    sort_order = table.Column<int>(type: "integer", nullable: false, defaultValue: 0),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_categories", x => x.id);
                    table.ForeignKey(
                        name: "FK_categories_categories_parent_id",
                        column: x => x.parent_id,
                        principalSchema: "ff",
                        principalTable: "categories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_categories_families_family_id",
                        column: x => x.family_id,
                        principalSchema: "ff",
                        principalTable: "families",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "goals",
                schema: "ff",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "uuid_generate_v4()"),
                    family_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    goal_type = table.Column<string>(type: "text", nullable: false, defaultValue: "Other"),
                    target_amount = table.Column<decimal>(type: "numeric(15,2)", nullable: false),
                    current_amount = table.Column<decimal>(type: "numeric(15,2)", nullable: false, defaultValue: 0m),
                    target_date = table.Column<DateOnly>(type: "date", nullable: true),
                    monthly_contribution = table.Column<decimal>(type: "numeric(15,2)", nullable: false, defaultValue: 0m),
                    icon = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "target"),
                    color = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false, defaultValue: "#3B82F6"),
                    is_achieved = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_goals", x => x.id);
                    table.ForeignKey(
                        name: "FK_goals_families_family_id",
                        column: x => x.family_id,
                        principalSchema: "ff",
                        principalTable: "families",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "users",
                schema: "ff",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "uuid_generate_v4()"),
                    family_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    email = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: false),
                    password_hash = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    role = table.Column<string>(type: "text", nullable: false, defaultValue: "Contributor"),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    must_change_password = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    avatar_color = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false, defaultValue: "#6366F1"),
                    last_login = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_users", x => x.id);
                    table.ForeignKey(
                        name: "FK_users_families_family_id",
                        column: x => x.family_id,
                        principalSchema: "ff",
                        principalTable: "families",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "contributors",
                schema: "ff",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "uuid_generate_v4()"),
                    family_id = table.Column<Guid>(type: "uuid", nullable: false),
                    user_id = table.Column<Guid>(type: "uuid", nullable: true),
                    name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    contributor_type = table.Column<string>(type: "text", nullable: false, defaultValue: "Salary"),
                    fixed_income = table.Column<decimal>(type: "numeric(15,2)", nullable: false, defaultValue: 0m),
                    frequency = table.Column<string>(type: "text", nullable: false, defaultValue: "Monthly"),
                    payment_day = table.Column<int>(type: "integer", nullable: true),
                    income_source = table.Column<string>(type: "character varying(255)", maxLength: 255, nullable: true),
                    is_active = table.Column<bool>(type: "boolean", nullable: false, defaultValue: true),
                    notes = table.Column<string>(type: "text", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_contributors", x => x.id);
                    table.ForeignKey(
                        name: "FK_contributors_families_family_id",
                        column: x => x.family_id,
                        principalSchema: "ff",
                        principalTable: "families",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_contributors_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "ff",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "refresh_tokens",
                schema: "ff",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "uuid_generate_v4()"),
                    user_id = table.Column<Guid>(type: "uuid", nullable: false),
                    token = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    expires_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    is_revoked = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_refresh_tokens", x => x.id);
                    table.ForeignKey(
                        name: "FK_refresh_tokens_users_user_id",
                        column: x => x.user_id,
                        principalSchema: "ff",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "ventures",
                schema: "ff",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "uuid_generate_v4()"),
                    family_id = table.Column<Guid>(type: "uuid", nullable: false),
                    name = table.Column<string>(type: "character varying(150)", maxLength: 150, nullable: false),
                    description = table.Column<string>(type: "text", nullable: true),
                    responsible_id = table.Column<Guid>(type: "uuid", nullable: true),
                    status = table.Column<string>(type: "text", nullable: false, defaultValue: "Active"),
                    start_date = table.Column<DateOnly>(type: "date", nullable: true),
                    icon = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false, defaultValue: "briefcase"),
                    color = table.Column<string>(type: "character varying(7)", maxLength: 7, nullable: false, defaultValue: "#F59E0B"),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ventures", x => x.id);
                    table.ForeignKey(
                        name: "FK_ventures_families_family_id",
                        column: x => x.family_id,
                        principalSchema: "ff",
                        principalTable: "families",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_ventures_users_responsible_id",
                        column: x => x.responsible_id,
                        principalSchema: "ff",
                        principalTable: "users",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "alerts",
                schema: "ff",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "uuid_generate_v4()"),
                    family_id = table.Column<Guid>(type: "uuid", nullable: false),
                    alert_type = table.Column<string>(type: "text", nullable: false),
                    title = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    message = table.Column<string>(type: "text", nullable: false),
                    status = table.Column<string>(type: "text", nullable: false, defaultValue: "Active"),
                    venture_id = table.Column<Guid>(type: "uuid", nullable: true),
                    alert_date = table.Column<DateOnly>(type: "date", nullable: false, defaultValueSql: "CURRENT_DATE"),
                    read_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_alerts", x => x.id);
                    table.ForeignKey(
                        name: "FK_alerts_families_family_id",
                        column: x => x.family_id,
                        principalSchema: "ff",
                        principalTable: "families",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_alerts_ventures_venture_id",
                        column: x => x.venture_id,
                        principalSchema: "ff",
                        principalTable: "ventures",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateTable(
                name: "movements",
                schema: "ff",
                columns: table => new
                {
                    id = table.Column<Guid>(type: "uuid", nullable: false, defaultValueSql: "uuid_generate_v4()"),
                    family_id = table.Column<Guid>(type: "uuid", nullable: false),
                    movement_date = table.Column<DateOnly>(type: "date", nullable: false),
                    type = table.Column<string>(type: "text", nullable: false),
                    amount = table.Column<decimal>(type: "numeric(15,2)", nullable: false),
                    concept = table.Column<string>(type: "character varying(500)", maxLength: 500, nullable: false),
                    contributor_id = table.Column<Guid>(type: "uuid", nullable: true),
                    category_id = table.Column<Guid>(type: "uuid", nullable: true),
                    venture_id = table.Column<Guid>(type: "uuid", nullable: true),
                    account_id = table.Column<Guid>(type: "uuid", nullable: true),
                    payment_method = table.Column<string>(type: "text", nullable: false, defaultValue: "Cash"),
                    notes = table.Column<string>(type: "text", nullable: true),
                    is_deleted = table.Column<bool>(type: "boolean", nullable: false, defaultValue: false),
                    created_by = table.Column<Guid>(type: "uuid", nullable: true),
                    updated_by = table.Column<Guid>(type: "uuid", nullable: true),
                    created_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()"),
                    updated_at = table.Column<DateTime>(type: "timestamp with time zone", nullable: false, defaultValueSql: "NOW()")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_movements", x => x.id);
                    table.ForeignKey(
                        name: "FK_movements_accounts_account_id",
                        column: x => x.account_id,
                        principalSchema: "ff",
                        principalTable: "accounts",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_movements_categories_category_id",
                        column: x => x.category_id,
                        principalSchema: "ff",
                        principalTable: "categories",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_movements_contributors_contributor_id",
                        column: x => x.contributor_id,
                        principalSchema: "ff",
                        principalTable: "contributors",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                    table.ForeignKey(
                        name: "FK_movements_families_family_id",
                        column: x => x.family_id,
                        principalSchema: "ff",
                        principalTable: "families",
                        principalColumn: "id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_movements_ventures_venture_id",
                        column: x => x.venture_id,
                        principalSchema: "ff",
                        principalTable: "ventures",
                        principalColumn: "id",
                        onDelete: ReferentialAction.SetNull);
                });

            migrationBuilder.CreateIndex(
                name: "IX_accounts_family_id",
                schema: "ff",
                table: "accounts",
                column: "family_id");

            migrationBuilder.CreateIndex(
                name: "IX_alert_configs_family_id_alert_type",
                schema: "ff",
                table: "alert_configs",
                columns: new[] { "family_id", "alert_type" },
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_alerts_family_id",
                schema: "ff",
                table: "alerts",
                column: "family_id");

            migrationBuilder.CreateIndex(
                name: "IX_alerts_venture_id",
                schema: "ff",
                table: "alerts",
                column: "venture_id");

            migrationBuilder.CreateIndex(
                name: "IX_categories_family_id",
                schema: "ff",
                table: "categories",
                column: "family_id");

            migrationBuilder.CreateIndex(
                name: "IX_categories_parent_id",
                schema: "ff",
                table: "categories",
                column: "parent_id");

            migrationBuilder.CreateIndex(
                name: "IX_contributors_family_id",
                schema: "ff",
                table: "contributors",
                column: "family_id");

            migrationBuilder.CreateIndex(
                name: "IX_contributors_user_id",
                schema: "ff",
                table: "contributors",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_goals_family_id",
                schema: "ff",
                table: "goals",
                column: "family_id");

            migrationBuilder.CreateIndex(
                name: "IX_movements_account_id",
                schema: "ff",
                table: "movements",
                column: "account_id");

            migrationBuilder.CreateIndex(
                name: "IX_movements_category_id",
                schema: "ff",
                table: "movements",
                column: "category_id");

            migrationBuilder.CreateIndex(
                name: "IX_movements_contributor_id",
                schema: "ff",
                table: "movements",
                column: "contributor_id");

            migrationBuilder.CreateIndex(
                name: "IX_movements_family_id",
                schema: "ff",
                table: "movements",
                column: "family_id");

            migrationBuilder.CreateIndex(
                name: "IX_movements_venture_id",
                schema: "ff",
                table: "movements",
                column: "venture_id");

            migrationBuilder.CreateIndex(
                name: "IX_refresh_tokens_token",
                schema: "ff",
                table: "refresh_tokens",
                column: "token",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_refresh_tokens_user_id",
                schema: "ff",
                table: "refresh_tokens",
                column: "user_id");

            migrationBuilder.CreateIndex(
                name: "IX_users_email",
                schema: "ff",
                table: "users",
                column: "email",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_users_family_id",
                schema: "ff",
                table: "users",
                column: "family_id");

            migrationBuilder.CreateIndex(
                name: "IX_ventures_family_id",
                schema: "ff",
                table: "ventures",
                column: "family_id");

            migrationBuilder.CreateIndex(
                name: "IX_ventures_responsible_id",
                schema: "ff",
                table: "ventures",
                column: "responsible_id");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "alert_configs",
                schema: "ff");

            migrationBuilder.DropTable(
                name: "alerts",
                schema: "ff");

            migrationBuilder.DropTable(
                name: "goals",
                schema: "ff");

            migrationBuilder.DropTable(
                name: "movements",
                schema: "ff");

            migrationBuilder.DropTable(
                name: "refresh_tokens",
                schema: "ff");

            migrationBuilder.DropTable(
                name: "accounts",
                schema: "ff");

            migrationBuilder.DropTable(
                name: "categories",
                schema: "ff");

            migrationBuilder.DropTable(
                name: "contributors",
                schema: "ff");

            migrationBuilder.DropTable(
                name: "ventures",
                schema: "ff");

            migrationBuilder.DropTable(
                name: "users",
                schema: "ff");

            migrationBuilder.DropTable(
                name: "families",
                schema: "ff");
        }
    }
}
