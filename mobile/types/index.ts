// ============================================================
// FamilyFinance Pro - TypeScript Types
// ============================================================

export interface Family {
  id: string;
  name: string;
  currency: string;
  currencySymbol: string;
  timezone: string;
  createdAt: string;
}

export interface User {
  id: string;
  familyId: string;
  name: string;
  email: string;
  role: 'Admin' | 'Contributor' | 'Viewer';
  isActive: boolean;
  mustChangePassword?: boolean;
  avatarColor: string;
  lastLogin?: string;
  familyName?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresAt: string;
  user: User;
}

export interface Contributor {
  id: string;
  familyId: string;
  userId?: string;
  name: string;
  contributorType: string;
  fixedIncome: number;
  frequency: string;
  paymentDay?: number;
  incomeSource?: string;
  isActive: boolean;
  notes?: string;
  totalIncomeCurrentMonth?: number;
}

export interface Venture {
  id: string;
  familyId: string;
  name: string;
  description?: string;
  responsibleId?: string;
  responsibleName?: string;
  status: 'Active' | 'Inactive' | 'Suspended';
  startDate?: string;
  icon: string;
  color: string;
}

export interface VentureSummary extends Venture {
  totalIncome: number;
  totalExpense: number;
  netProfit: number;
  totalMovements: number;
  recentMovements: Movement[];
}

export interface Category {
  id: string;
  familyId: string;
  name: string;
  type: 'Income' | 'Expense' | 'Both';
  parentId?: string;
  parentName?: string;
  icon: string;
  color: string;
  isActive: boolean;
  isSystem: boolean;
  children?: Category[];
}

export interface Account {
  id: string;
  familyId: string;
  name: string;
  accountType: string;
  balance: number;
  color: string;
  icon: string;
  bankName?: string;
  lastFour?: string;
  isActive: boolean;
}

export interface Movement {
  id: string;
  familyId: string;
  movementDate: string;
  type: 'Income' | 'Expense';
  amount: number;
  concept: string;
  contributorId?: string;
  contributorName?: string;
  categoryId?: string;
  categoryName?: string;
  categoryColor?: string;
  ventureId?: string;
  ventureName?: string;
  accountId?: string;
  accountName?: string;
  paymentMethod: string;
  notes?: string;
  createdAt: string;
}

export interface CreateMovement {
  movementDate: string;
  type: 'Income' | 'Expense';
  amount: number;
  concept: string;
  contributorId?: string;
  categoryId?: string;
  ventureId?: string;
  accountId?: string;
  paymentMethod?: string;
  notes?: string;
}

export interface MovementFilter {
  from?: string;
  to?: string;
  type?: string;
  contributorId?: string;
  categoryId?: string;
  ventureId?: string;
  accountId?: string;
  minAmount?: number;
  maxAmount?: number;
  page?: number;
  pageSize?: number;
}

export interface PagedResult<T> {
  items: T[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export interface CalendarDay {
  date: string;
  hasRecords: boolean;
  hasIncome: boolean;
  hasExpense: boolean;
  dailyIncome: number;
  dailyExpense: number;
  movementCount: number;
}

export interface CalendarMonth {
  year: number;
  month: number;
  days: CalendarDay[];
}

export interface Compliance {
  year: number;
  month: number;
  totalDays: number;
  daysElapsed: number;
  daysWithRecords: number;
  daysWithoutRecords: number;
  compliancePercentage: number;
}

export interface Goal {
  id: string;
  familyId: string;
  name: string;
  goalType: string;
  targetAmount: number;
  currentAmount: number;
  progressPercentage: number;
  remainingAmount: number;
  monthsToAchieve?: number;
  targetDate?: string;
  monthlyContribution: number;
  icon: string;
  color: string;
  isAchieved: boolean;
  isActive: boolean;
  notes?: string;
}

export interface Alert {
  id: string;
  alertType: string;
  title: string;
  message: string;
  status: 'Active' | 'Read' | 'Dismissed';
  ventureId?: string;
  ventureName?: string;
  alertDate: string;
  readAt?: string;
  createdAt: string;
}

export interface AlertConfig {
  id: string;
  alertType: string;
  isActive: boolean;
  threshold?: number;
  description?: string;
}

export interface CategoryBreakdown {
  categoryName: string;
  color: string;
  amount: number;
  percentage: number;
}

export interface VenturePerformance {
  ventureName: string;
  color: string;
  income: number;
  expense: number;
  profit: number;
}

export interface DashboardSummary {
  year: number;
  month: number;
  totalIncome: number;
  totalExpense: number;
  netResult: number;
  availableBalance: number;
  familySavings: number;
  ventureIncome: number;
  ventureExpense: number;
  ventureProfit: number;
  expenseToIncomeRatio: number;
  avgDailyIncome: number;
  avgDailyExpense: number;
  compliancePercentage: number;
  incomeGrowth?: number;
  expenseGrowth?: number;
  unreadAlerts: number;
  accounts: Account[];
}

export interface DashboardCharts {
  monthlyTrend: Array<{ item1: string; item2: number; item3: number }>;
  dailyTrend: Array<{ item1: string; item2: number; item3: number }>;
  expenseByCategory: CategoryBreakdown[];
  incomeBySource: CategoryBreakdown[];
  venturePerformance: VenturePerformance[];
  balanceEvolution: Array<{ item1: string; item2: number }>;
}

export interface MonthlyReport {
  year: number;
  month: number;
  totalIncome: number;
  totalExpense: number;
  netResult: number;
  savings: number;
  expenseByCategory: CategoryBreakdown[];
  incomeBySource: CategoryBreakdown[];
  ventureResults: VenturePerformance[];
  previousMonthIncome?: number;
  previousMonthExpense?: number;
  compliance: Compliance;
}

export interface Insight {
  type: string;
  title: string;
  message: string;
  icon?: string;
}

export interface AnalysisInsights {
  insights: Insight[];
  topExpenseCategory?: string;
  topIncomeSource?: string;
  topVenture?: string;
  savingsRate: number;
  expenseGrowthRate: number;
  isInDeficit: boolean;
  recommendations: string[];
}
