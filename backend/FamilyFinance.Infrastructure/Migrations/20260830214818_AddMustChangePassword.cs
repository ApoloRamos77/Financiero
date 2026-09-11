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
            // NOTA: Usamos SQL con IF NOT EXISTS para que esta migración sea idempotente.
            // Esto permite que funcione tanto en una base de datos nueva como en una
            // que ya tiene las tablas creadas manualmente (caso de producción en EasyPanel).
            migrationBuilder.Sql(@"
                CREATE SCHEMA IF NOT EXISTS ff;

                CREATE EXTENSION IF NOT EXISTS ""uuid-ossp"";

                CREATE TABLE IF NOT EXISTS ff.families (
                    id uuid NOT NULL DEFAULT (uuid_generate_v4()),
                    name character varying(150) NOT NULL,
                    currency character varying(10) NOT NULL DEFAULT 'PEN',
                    currency_symbol character varying(5) NOT NULL DEFAULT 'S/',
                    timezone character varying(50) NOT NULL DEFAULT 'America/Lima',
                    created_at timestamp with time zone NOT NULL DEFAULT (NOW()),
                    updated_at timestamp with time zone NOT NULL DEFAULT (NOW()),
                    CONSTRAINT ""PK_families"" PRIMARY KEY (id)
                );

                CREATE TABLE IF NOT EXISTS ff.accounts (
                    id uuid NOT NULL DEFAULT (uuid_generate_v4()),
                    family_id uuid NOT NULL,
                    name character varying(100) NOT NULL,
                    account_type text NOT NULL DEFAULT 'Cash',
                    balance numeric(15,2) NOT NULL DEFAULT 0,
                    color character varying(7) NOT NULL DEFAULT '#6366F1',
                    icon character varying(50) NOT NULL DEFAULT 'wallet',
                    bank_name character varying(100),
                    last_four character varying(4),
                    is_active boolean NOT NULL DEFAULT true,
                    created_at timestamp with time zone NOT NULL DEFAULT (NOW()),
                    updated_at timestamp with time zone NOT NULL DEFAULT (NOW()),
                    CONSTRAINT ""PK_accounts"" PRIMARY KEY (id),
                    CONSTRAINT ""FK_accounts_families_family_id"" FOREIGN KEY (family_id) REFERENCES ff.families(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS ff.alert_configs (
                    id uuid NOT NULL DEFAULT (uuid_generate_v4()),
                    family_id uuid NOT NULL,
                    alert_type text NOT NULL,
                    is_active boolean NOT NULL DEFAULT true,
                    threshold numeric(10,4),
                    description character varying(500),
                    created_at timestamp with time zone NOT NULL DEFAULT (NOW()),
                    updated_at timestamp with time zone NOT NULL DEFAULT (NOW()),
                    CONSTRAINT ""PK_alert_configs"" PRIMARY KEY (id),
                    CONSTRAINT ""FK_alert_configs_families_family_id"" FOREIGN KEY (family_id) REFERENCES ff.families(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS ff.categories (
                    id uuid NOT NULL DEFAULT (uuid_generate_v4()),
                    family_id uuid NOT NULL,
                    name character varying(100) NOT NULL,
                    type text NOT NULL DEFAULT 'Expense',
                    parent_id uuid,
                    icon character varying(50) NOT NULL DEFAULT 'tag',
                    color character varying(7) NOT NULL DEFAULT '#6366F1',
                    is_active boolean NOT NULL DEFAULT true,
                    is_system boolean NOT NULL DEFAULT false,
                    sort_order integer NOT NULL DEFAULT 0,
                    created_at timestamp with time zone NOT NULL DEFAULT (NOW()),
                    updated_at timestamp with time zone NOT NULL DEFAULT (NOW()),
                    CONSTRAINT ""PK_categories"" PRIMARY KEY (id),
                    CONSTRAINT ""FK_categories_families_family_id"" FOREIGN KEY (family_id) REFERENCES ff.families(id) ON DELETE CASCADE,
                    CONSTRAINT ""FK_categories_categories_parent_id"" FOREIGN KEY (parent_id) REFERENCES ff.categories(id) ON DELETE SET NULL
                );

                CREATE TABLE IF NOT EXISTS ff.goals (
                    id uuid NOT NULL DEFAULT (uuid_generate_v4()),
                    family_id uuid NOT NULL,
                    name character varying(150) NOT NULL,
                    goal_type text NOT NULL DEFAULT 'Other',
                    target_amount numeric(15,2) NOT NULL,
                    current_amount numeric(15,2) NOT NULL DEFAULT 0,
                    target_date date,
                    monthly_contribution numeric(15,2) NOT NULL DEFAULT 0,
                    icon character varying(50) NOT NULL DEFAULT 'target',
                    color character varying(7) NOT NULL DEFAULT '#3B82F6',
                    is_achieved boolean NOT NULL DEFAULT false,
                    is_active boolean NOT NULL DEFAULT true,
                    notes text,
                    created_at timestamp with time zone NOT NULL DEFAULT (NOW()),
                    updated_at timestamp with time zone NOT NULL DEFAULT (NOW()),
                    CONSTRAINT ""PK_goals"" PRIMARY KEY (id),
                    CONSTRAINT ""FK_goals_families_family_id"" FOREIGN KEY (family_id) REFERENCES ff.families(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS ff.users (
                    id uuid NOT NULL DEFAULT (uuid_generate_v4()),
                    family_id uuid NOT NULL,
                    name character varying(150) NOT NULL,
                    email character varying(255) NOT NULL,
                    password_hash character varying(500) NOT NULL,
                    role text NOT NULL DEFAULT 'Contributor',
                    is_active boolean NOT NULL DEFAULT true,
                    must_change_password boolean NOT NULL DEFAULT false,
                    avatar_color character varying(7) NOT NULL DEFAULT '#6366F1',
                    last_login timestamp with time zone,
                    created_at timestamp with time zone NOT NULL DEFAULT (NOW()),
                    updated_at timestamp with time zone NOT NULL DEFAULT (NOW()),
                    CONSTRAINT ""PK_users"" PRIMARY KEY (id),
                    CONSTRAINT ""FK_users_families_family_id"" FOREIGN KEY (family_id) REFERENCES ff.families(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS ff.contributors (
                    id uuid NOT NULL DEFAULT (uuid_generate_v4()),
                    family_id uuid NOT NULL,
                    user_id uuid,
                    name character varying(150) NOT NULL,
                    contributor_type text NOT NULL DEFAULT 'Salary',
                    fixed_income numeric(15,2) NOT NULL DEFAULT 0,
                    frequency text NOT NULL DEFAULT 'Monthly',
                    payment_day integer,
                    income_source character varying(255),
                    is_active boolean NOT NULL DEFAULT true,
                    notes text,
                    created_at timestamp with time zone NOT NULL DEFAULT (NOW()),
                    updated_at timestamp with time zone NOT NULL DEFAULT (NOW()),
                    CONSTRAINT ""PK_contributors"" PRIMARY KEY (id),
                    CONSTRAINT ""FK_contributors_families_family_id"" FOREIGN KEY (family_id) REFERENCES ff.families(id) ON DELETE CASCADE,
                    CONSTRAINT ""FK_contributors_users_user_id"" FOREIGN KEY (user_id) REFERENCES ff.users(id) ON DELETE SET NULL
                );

                CREATE TABLE IF NOT EXISTS ff.refresh_tokens (
                    id uuid NOT NULL DEFAULT (uuid_generate_v4()),
                    user_id uuid NOT NULL,
                    token character varying(500) NOT NULL,
                    expires_at timestamp with time zone NOT NULL,
                    is_revoked boolean NOT NULL DEFAULT false,
                    created_at timestamp with time zone NOT NULL DEFAULT (NOW()),
                    CONSTRAINT ""PK_refresh_tokens"" PRIMARY KEY (id),
                    CONSTRAINT ""FK_refresh_tokens_users_user_id"" FOREIGN KEY (user_id) REFERENCES ff.users(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS ff.ventures (
                    id uuid NOT NULL DEFAULT (uuid_generate_v4()),
                    family_id uuid NOT NULL,
                    name character varying(150) NOT NULL,
                    description text,
                    responsible_id uuid,
                    status text NOT NULL DEFAULT 'Active',
                    start_date date,
                    icon character varying(50) NOT NULL DEFAULT 'briefcase',
                    color character varying(7) NOT NULL DEFAULT '#F59E0B',
                    created_at timestamp with time zone NOT NULL DEFAULT (NOW()),
                    updated_at timestamp with time zone NOT NULL DEFAULT (NOW()),
                    CONSTRAINT ""PK_ventures"" PRIMARY KEY (id),
                    CONSTRAINT ""FK_ventures_families_family_id"" FOREIGN KEY (family_id) REFERENCES ff.families(id) ON DELETE CASCADE,
                    CONSTRAINT ""FK_ventures_users_responsible_id"" FOREIGN KEY (responsible_id) REFERENCES ff.users(id) ON DELETE SET NULL
                );

                CREATE TABLE IF NOT EXISTS ff.alerts (
                    id uuid NOT NULL DEFAULT (uuid_generate_v4()),
                    family_id uuid NOT NULL,
                    alert_type text NOT NULL,
                    title character varying(200) NOT NULL,
                    message text NOT NULL,
                    status text NOT NULL DEFAULT 'Active',
                    venture_id uuid,
                    alert_date date NOT NULL DEFAULT CURRENT_DATE,
                    read_at timestamp with time zone,
                    created_at timestamp with time zone NOT NULL DEFAULT (NOW()),
                    CONSTRAINT ""PK_alerts"" PRIMARY KEY (id),
                    CONSTRAINT ""FK_alerts_families_family_id"" FOREIGN KEY (family_id) REFERENCES ff.families(id) ON DELETE CASCADE,
                    CONSTRAINT ""FK_alerts_ventures_venture_id"" FOREIGN KEY (venture_id) REFERENCES ff.ventures(id) ON DELETE SET NULL
                );

                CREATE TABLE IF NOT EXISTS ff.movements (
                    id uuid NOT NULL DEFAULT (uuid_generate_v4()),
                    family_id uuid NOT NULL,
                    movement_date date NOT NULL,
                    type text NOT NULL,
                    amount numeric(15,2) NOT NULL,
                    concept character varying(500) NOT NULL,
                    contributor_id uuid,
                    category_id uuid,
                    venture_id uuid,
                    account_id uuid,
                    payment_method text NOT NULL DEFAULT 'Cash',
                    notes text,
                    is_deleted boolean NOT NULL DEFAULT false,
                    created_by uuid,
                    updated_by uuid,
                    created_at timestamp with time zone NOT NULL DEFAULT (NOW()),
                    updated_at timestamp with time zone NOT NULL DEFAULT (NOW()),
                    CONSTRAINT ""PK_movements"" PRIMARY KEY (id),
                    CONSTRAINT ""FK_movements_families_family_id"" FOREIGN KEY (family_id) REFERENCES ff.families(id) ON DELETE CASCADE,
                    CONSTRAINT ""FK_movements_accounts_account_id"" FOREIGN KEY (account_id) REFERENCES ff.accounts(id) ON DELETE SET NULL,
                    CONSTRAINT ""FK_movements_categories_category_id"" FOREIGN KEY (category_id) REFERENCES ff.categories(id) ON DELETE SET NULL,
                    CONSTRAINT ""FK_movements_contributors_contributor_id"" FOREIGN KEY (contributor_id) REFERENCES ff.contributors(id) ON DELETE SET NULL,
                    CONSTRAINT ""FK_movements_ventures_venture_id"" FOREIGN KEY (venture_id) REFERENCES ff.ventures(id) ON DELETE SET NULL
                );

                -- Indexes idempotentes
                CREATE INDEX IF NOT EXISTS ""IX_accounts_family_id"" ON ff.accounts(family_id);
                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_alert_configs_family_id_alert_type"" ON ff.alert_configs(family_id, alert_type);
                CREATE INDEX IF NOT EXISTS ""IX_alerts_family_id"" ON ff.alerts(family_id);
                CREATE INDEX IF NOT EXISTS ""IX_alerts_venture_id"" ON ff.alerts(venture_id);
                CREATE INDEX IF NOT EXISTS ""IX_categories_family_id"" ON ff.categories(family_id);
                CREATE INDEX IF NOT EXISTS ""IX_categories_parent_id"" ON ff.categories(parent_id);
                CREATE INDEX IF NOT EXISTS ""IX_contributors_family_id"" ON ff.contributors(family_id);
                CREATE INDEX IF NOT EXISTS ""IX_contributors_user_id"" ON ff.contributors(user_id);
                CREATE INDEX IF NOT EXISTS ""IX_goals_family_id"" ON ff.goals(family_id);
                CREATE INDEX IF NOT EXISTS ""IX_movements_account_id"" ON ff.movements(account_id);
                CREATE INDEX IF NOT EXISTS ""IX_movements_category_id"" ON ff.movements(category_id);
                CREATE INDEX IF NOT EXISTS ""IX_movements_contributor_id"" ON ff.movements(contributor_id);
                CREATE INDEX IF NOT EXISTS ""IX_movements_family_id"" ON ff.movements(family_id);
                CREATE INDEX IF NOT EXISTS ""IX_movements_venture_id"" ON ff.movements(venture_id);
                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_refresh_tokens_token"" ON ff.refresh_tokens(token);
                CREATE INDEX IF NOT EXISTS ""IX_refresh_tokens_user_id"" ON ff.refresh_tokens(user_id);
                CREATE UNIQUE INDEX IF NOT EXISTS ""IX_users_email"" ON ff.users(email);
                CREATE INDEX IF NOT EXISTS ""IX_users_family_id"" ON ff.users(family_id);
                CREATE INDEX IF NOT EXISTS ""IX_ventures_family_id"" ON ff.ventures(family_id);
                CREATE INDEX IF NOT EXISTS ""IX_ventures_responsible_id"" ON ff.ventures(responsible_id);

                -- Columna must_change_password idempotente
                DO $$ BEGIN
                    ALTER TABLE ff.users ADD COLUMN must_change_password boolean NOT NULL DEFAULT false;
                EXCEPTION WHEN duplicate_column THEN
                END; $$;
            ");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(name: "alert_configs", schema: "ff");
            migrationBuilder.DropTable(name: "alerts", schema: "ff");
            migrationBuilder.DropTable(name: "goals", schema: "ff");
            migrationBuilder.DropTable(name: "movements", schema: "ff");
            migrationBuilder.DropTable(name: "refresh_tokens", schema: "ff");
            migrationBuilder.DropTable(name: "accounts", schema: "ff");
            migrationBuilder.DropTable(name: "categories", schema: "ff");
            migrationBuilder.DropTable(name: "contributors", schema: "ff");
            migrationBuilder.DropTable(name: "ventures", schema: "ff");
            migrationBuilder.DropTable(name: "users", schema: "ff");
            migrationBuilder.DropTable(name: "families", schema: "ff");
        }
    }
}
