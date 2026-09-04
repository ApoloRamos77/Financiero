using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FamilyFinance.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RemoveEnumDefaultValues : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "status",
                schema: "ff",
                table: "ventures",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldDefaultValue: "Active");

            migrationBuilder.AlterColumn<string>(
                name: "role",
                schema: "ff",
                table: "users",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldDefaultValue: "Contributor");

            migrationBuilder.AlterColumn<string>(
                name: "payment_method",
                schema: "ff",
                table: "movements",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldDefaultValue: "Cash");

            migrationBuilder.AlterColumn<string>(
                name: "goal_type",
                schema: "ff",
                table: "goals",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldDefaultValue: "Other");

            migrationBuilder.AlterColumn<string>(
                name: "frequency",
                schema: "ff",
                table: "contributors",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldDefaultValue: "Monthly");

            migrationBuilder.AlterColumn<string>(
                name: "contributor_type",
                schema: "ff",
                table: "contributors",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldDefaultValue: "Salary");

            migrationBuilder.AlterColumn<string>(
                name: "type",
                schema: "ff",
                table: "categories",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldDefaultValue: "Expense");

            migrationBuilder.AlterColumn<string>(
                name: "status",
                schema: "ff",
                table: "alerts",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldDefaultValue: "Active");

            migrationBuilder.AlterColumn<string>(
                name: "account_type",
                schema: "ff",
                table: "accounts",
                type: "text",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "text",
                oldDefaultValue: "Cash");

            // FIX BAD DATA PREVIOUSLY SAVED AS DEFAULT DUE TO EF CORE ENUM BUG
            migrationBuilder.Sql(@"
                DO $$
                DECLARE
                    f record;
                    fallback_id uuid;
                BEGIN
                    FOR f IN SELECT id FROM ff.families LOOP
                        SELECT id INTO fallback_id FROM ff.categories WHERE family_id = f.id AND type = 'Income' LIMIT 1;
                        IF fallback_id IS NULL THEN
                            fallback_id := gen_random_uuid();
                            INSERT INTO ff.categories (id, family_id, name, type, icon, color, is_active, is_system, sort_order, created_at, updated_at)
                            VALUES (fallback_id, f.id, 'Ingresos Varios', 'Income', 'plus-circle', '#10B981', true, true, 0, NOW(), NOW());
                        END IF;

                        UPDATE ff.movements
                        SET category_id = fallback_id
                        WHERE family_id = f.id AND type = 'Income' AND (category_id IS NULL OR category_id IN (SELECT id FROM ff.categories WHERE type != 'Income'));
                    END LOOP;
                END $$;
            ");
            migrationBuilder.Sql("UPDATE ff.movements SET payment_method = 'Cash' WHERE payment_method IS NULL;");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<string>(
                name: "status",
                schema: "ff",
                table: "ventures",
                type: "text",
                nullable: false,
                defaultValue: "Active",
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "role",
                schema: "ff",
                table: "users",
                type: "text",
                nullable: false,
                defaultValue: "Contributor",
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "payment_method",
                schema: "ff",
                table: "movements",
                type: "text",
                nullable: false,
                defaultValue: "Cash",
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "goal_type",
                schema: "ff",
                table: "goals",
                type: "text",
                nullable: false,
                defaultValue: "Other",
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "frequency",
                schema: "ff",
                table: "contributors",
                type: "text",
                nullable: false,
                defaultValue: "Monthly",
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "contributor_type",
                schema: "ff",
                table: "contributors",
                type: "text",
                nullable: false,
                defaultValue: "Salary",
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "type",
                schema: "ff",
                table: "categories",
                type: "text",
                nullable: false,
                defaultValue: "Expense",
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "status",
                schema: "ff",
                table: "alerts",
                type: "text",
                nullable: false,
                defaultValue: "Active",
                oldClrType: typeof(string),
                oldType: "text");

            migrationBuilder.AlterColumn<string>(
                name: "account_type",
                schema: "ff",
                table: "accounts",
                type: "text",
                nullable: false,
                defaultValue: "Cash",
                oldClrType: typeof(string),
                oldType: "text");
        }
    }
}
