-- ============================================================
-- FamilyFinance Pro - Schema PostgreSQL
-- Versión: 1.0.0
-- ============================================================

-- Extensiones
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- ============================================================
-- SCHEMA
-- ============================================================
CREATE SCHEMA IF NOT EXISTS ff;

SET search_path TO ff, public;

-- ============================================================
-- ENUMS
-- ============================================================
CREATE TYPE movement_type AS ENUM ('income', 'expense');
CREATE TYPE contributor_type AS ENUM ('salary', 'freelance', 'business', 'investment', 'other');
CREATE TYPE frequency_type AS ENUM ('daily', 'weekly', 'biweekly', 'monthly', 'annual', 'variable');
CREATE TYPE venture_status AS ENUM ('active', 'inactive', 'suspended');
CREATE TYPE category_type AS ENUM ('income', 'expense', 'both');
CREATE TYPE account_type AS ENUM ('cash', 'bank_account', 'credit_card', 'debit_card', 'digital_wallet', 'other');
CREATE TYPE payment_method AS ENUM ('cash', 'bank_transfer', 'credit_card', 'debit_card', 'yape', 'plin', 'other');
CREATE TYPE goal_type AS ENUM ('emergency_fund', 'vehicle', 'travel', 'education', 'housing', 'investment', 'other');
CREATE TYPE user_role AS ENUM ('admin', 'contributor', 'viewer');
CREATE TYPE alert_type AS ENUM ('high_expense', 'deficit', 'no_records', 'venture_loss', 'low_savings', 'goal_deadline', 'custom');
CREATE TYPE alert_status AS ENUM ('active', 'read', 'dismissed');

-- ============================================================
-- TABLA: families
-- ============================================================
CREATE TABLE families (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name            VARCHAR(150) NOT NULL,
    currency        VARCHAR(10) NOT NULL DEFAULT 'PEN',
    currency_symbol VARCHAR(5) NOT NULL DEFAULT 'S/',
    timezone        VARCHAR(50) NOT NULL DEFAULT 'America/Lima',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- TABLA: users
-- ============================================================
CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id       UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name            VARCHAR(150) NOT NULL,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(500) NOT NULL,
    role            user_role NOT NULL DEFAULT 'contributor',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    avatar_color    VARCHAR(7) DEFAULT '#6366F1',
    last_login      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_family ON users(family_id);
CREATE INDEX idx_users_email ON users(email);

-- ============================================================
-- TABLA: contributors (aportantes)
-- ============================================================
CREATE TABLE contributors (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id       UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL,
    name            VARCHAR(150) NOT NULL,
    contributor_type contributor_type NOT NULL DEFAULT 'salary',
    fixed_income    DECIMAL(15,2) NOT NULL DEFAULT 0,
    frequency       frequency_type NOT NULL DEFAULT 'monthly',
    payment_day     INTEGER CHECK (payment_day BETWEEN 1 AND 31),
    income_source   VARCHAR(255),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_contributors_family ON contributors(family_id);

-- ============================================================
-- TABLA: ventures (emprendimientos)
-- ============================================================
CREATE TABLE ventures (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id       UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    responsible_id  UUID REFERENCES users(id) ON DELETE SET NULL,
    status          venture_status NOT NULL DEFAULT 'active',
    start_date      DATE,
    icon            VARCHAR(50) DEFAULT 'briefcase',
    color           VARCHAR(7) DEFAULT '#F59E0B',
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_ventures_family ON ventures(family_id);

-- ============================================================
-- TABLA: categories
-- ============================================================
CREATE TABLE categories (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id       UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    type            category_type NOT NULL DEFAULT 'expense',
    parent_id       UUID REFERENCES categories(id) ON DELETE SET NULL,
    icon            VARCHAR(50) DEFAULT 'tag',
    color           VARCHAR(7) DEFAULT '#6366F1',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    is_system       BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order      INTEGER DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_categories_family ON categories(family_id);
CREATE INDEX idx_categories_parent ON categories(parent_id);

-- ============================================================
-- TABLA: accounts (cuentas / medios de pago)
-- ============================================================
CREATE TABLE accounts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id       UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name            VARCHAR(100) NOT NULL,
    account_type    account_type NOT NULL DEFAULT 'cash',
    balance         DECIMAL(15,2) NOT NULL DEFAULT 0,
    color           VARCHAR(7) DEFAULT '#6366F1',
    icon            VARCHAR(50) DEFAULT 'wallet',
    bank_name       VARCHAR(100),
    last_four       VARCHAR(4),
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_accounts_family ON accounts(family_id);

-- ============================================================
-- TABLA: movements (movimientos - tabla central)
-- ============================================================
CREATE TABLE movements (
    id                  UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id           UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    movement_date       DATE NOT NULL,
    type                movement_type NOT NULL,
    amount              DECIMAL(15,2) NOT NULL CHECK (amount > 0),
    concept             VARCHAR(500) NOT NULL,
    contributor_id      UUID REFERENCES contributors(id) ON DELETE SET NULL,
    category_id         UUID REFERENCES categories(id) ON DELETE SET NULL,
    venture_id          UUID REFERENCES ventures(id) ON DELETE SET NULL,
    account_id          UUID REFERENCES accounts(id) ON DELETE SET NULL,
    payment_method      payment_method DEFAULT 'cash',
    notes               TEXT,
    is_deleted          BOOLEAN NOT NULL DEFAULT FALSE,
    created_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    updated_by          UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_movements_family ON movements(family_id);
CREATE INDEX idx_movements_date ON movements(movement_date);
CREATE INDEX idx_movements_type ON movements(type);
CREATE INDEX idx_movements_venture ON movements(venture_id);
CREATE INDEX idx_movements_category ON movements(category_id);
CREATE INDEX idx_movements_contributor ON movements(contributor_id);
CREATE INDEX idx_movements_family_date ON movements(family_id, movement_date);
CREATE INDEX idx_movements_not_deleted ON movements(family_id, is_deleted) WHERE is_deleted = FALSE;

-- ============================================================
-- TABLA: goals (metas financieras)
-- ============================================================
CREATE TABLE goals (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id       UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    name            VARCHAR(150) NOT NULL,
    goal_type       goal_type NOT NULL DEFAULT 'other',
    target_amount   DECIMAL(15,2) NOT NULL CHECK (target_amount > 0),
    current_amount  DECIMAL(15,2) NOT NULL DEFAULT 0,
    target_date     DATE,
    monthly_contribution DECIMAL(15,2) DEFAULT 0,
    icon            VARCHAR(50) DEFAULT 'target',
    color           VARCHAR(7) DEFAULT '#3B82F6',
    is_achieved     BOOLEAN NOT NULL DEFAULT FALSE,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    notes           TEXT,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_goals_family ON goals(family_id);

-- ============================================================
-- TABLA: alert_configs (configuración de alertas)
-- ============================================================
CREATE TABLE alert_configs (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id       UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    alert_type      alert_type NOT NULL,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    threshold       DECIMAL(10,4),
    description     VARCHAR(500),
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(family_id, alert_type)
);

-- ============================================================
-- TABLA: alerts (alertas generadas)
-- ============================================================
CREATE TABLE alerts (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    family_id       UUID NOT NULL REFERENCES families(id) ON DELETE CASCADE,
    alert_type      alert_type NOT NULL,
    title           VARCHAR(200) NOT NULL,
    message         TEXT NOT NULL,
    status          alert_status NOT NULL DEFAULT 'active',
    venture_id      UUID REFERENCES ventures(id) ON DELETE SET NULL,
    alert_date      DATE NOT NULL DEFAULT CURRENT_DATE,
    read_at         TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_alerts_family ON alerts(family_id);
CREATE INDEX idx_alerts_status ON alerts(family_id, status);

-- ============================================================
-- TABLA: movement_audit (historial de cambios)
-- ============================================================
CREATE TABLE movement_audit (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    movement_id     UUID NOT NULL,
    action          VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
    old_data        JSONB,
    new_data        JSONB,
    changed_by      UUID REFERENCES users(id),
    changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_movement ON movement_audit(movement_id);

-- ============================================================
-- TABLA: refresh_tokens
-- ============================================================
CREATE TABLE refresh_tokens (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id         UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token           VARCHAR(500) NOT NULL UNIQUE,
    expires_at      TIMESTAMPTZ NOT NULL,
    is_revoked      BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_refresh_tokens_user ON refresh_tokens(user_id);
CREATE INDEX idx_refresh_tokens_token ON refresh_tokens(token);

-- ============================================================
-- VISTAS CALCULADAS
-- ============================================================

-- Vista: resumen por emprendimiento
CREATE OR REPLACE VIEW v_venture_summary AS
SELECT
    v.id AS venture_id,
    v.family_id,
    v.name AS venture_name,
    v.status,
    COALESCE(SUM(CASE WHEN m.type = 'income' AND m.is_deleted = FALSE THEN m.amount ELSE 0 END), 0) AS total_income,
    COALESCE(SUM(CASE WHEN m.type = 'expense' AND m.is_deleted = FALSE THEN m.amount ELSE 0 END), 0) AS total_expense,
    COALESCE(SUM(CASE WHEN m.type = 'income' AND m.is_deleted = FALSE THEN m.amount ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN m.type = 'expense' AND m.is_deleted = FALSE THEN m.amount ELSE 0 END), 0) AS net_profit,
    COUNT(CASE WHEN m.is_deleted = FALSE THEN 1 END) AS total_movements
FROM ventures v
LEFT JOIN movements m ON m.venture_id = v.id
GROUP BY v.id, v.family_id, v.name, v.status;

-- Vista: resumen mensual familiar
CREATE OR REPLACE VIEW v_monthly_family_summary AS
SELECT
    family_id,
    DATE_TRUNC('month', movement_date) AS month,
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS total_income,
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS total_expense,
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) -
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS net_result,
    COUNT(DISTINCT movement_date) AS days_with_records,
    COUNT(*) AS total_movements
FROM movements
WHERE is_deleted = FALSE
GROUP BY family_id, DATE_TRUNC('month', movement_date);

-- Vista: resumen diario
CREATE OR REPLACE VIEW v_daily_summary AS
SELECT
    family_id,
    movement_date,
    COALESCE(SUM(CASE WHEN type = 'income' THEN amount ELSE 0 END), 0) AS daily_income,
    COALESCE(SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END), 0) AS daily_expense,
    COUNT(*) AS movement_count,
    BOOL_OR(type = 'income') AS has_income,
    BOOL_OR(type = 'expense') AS has_expense
FROM movements
WHERE is_deleted = FALSE
GROUP BY family_id, movement_date;

-- Vista: gastos por categoría (mes actual)
CREATE OR REPLACE VIEW v_category_expense_current_month AS
SELECT
    m.family_id,
    c.id AS category_id,
    c.name AS category_name,
    c.color,
    c.icon,
    COALESCE(SUM(m.amount), 0) AS total_amount,
    COUNT(*) AS movement_count
FROM movements m
JOIN categories c ON c.id = m.category_id
WHERE m.is_deleted = FALSE
  AND m.type = 'expense'
  AND DATE_TRUNC('month', m.movement_date) = DATE_TRUNC('month', CURRENT_DATE)
GROUP BY m.family_id, c.id, c.name, c.color, c.icon;

-- ============================================================
-- FUNCIÓN: updated_at automático
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers updated_at
CREATE TRIGGER trg_families_updated_at BEFORE UPDATE ON families FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_contributors_updated_at BEFORE UPDATE ON contributors FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_ventures_updated_at BEFORE UPDATE ON ventures FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_accounts_updated_at BEFORE UPDATE ON accounts FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_movements_updated_at BEFORE UPDATE ON movements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER trg_goals_updated_at BEFORE UPDATE ON goals FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
