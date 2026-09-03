using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace FamilyFinance.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class MakeMovementFieldsMandatory : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
                UPDATE ff.movements 
                SET contributor_id = (SELECT id FROM ff.contributors WHERE name ILIKE '%Apolonio Ramos Pinedo%' LIMIT 1)
                WHERE contributor_id IS NULL;
            ");

            migrationBuilder.Sql(@"
                UPDATE ff.movements 
                SET category_id = (SELECT id FROM ff.categories WHERE name ILIKE '%Salario%' LIMIT 1)
                WHERE category_id IS NULL;
            ");

            migrationBuilder.Sql(@"
                UPDATE ff.movements 
                SET account_id = (SELECT id FROM ff.accounts WHERE name ILIKE '%BBVA%' LIMIT 1)
                WHERE account_id IS NULL;
            ");

            migrationBuilder.AlterColumn<Guid>(
                name: "contributor_id",
                schema: "ff",
                table: "movements",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "category_id",
                schema: "ff",
                table: "movements",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);

            migrationBuilder.AlterColumn<Guid>(
                name: "account_id",
                schema: "ff",
                table: "movements",
                type: "uuid",
                nullable: false,
                defaultValue: new Guid("00000000-0000-0000-0000-000000000000"),
                oldClrType: typeof(Guid),
                oldType: "uuid",
                oldNullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AlterColumn<Guid>(
                name: "contributor_id",
                schema: "ff",
                table: "movements",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<Guid>(
                name: "category_id",
                schema: "ff",
                table: "movements",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");

            migrationBuilder.AlterColumn<Guid>(
                name: "account_id",
                schema: "ff",
                table: "movements",
                type: "uuid",
                nullable: true,
                oldClrType: typeof(Guid),
                oldType: "uuid");
        }
    }
}
