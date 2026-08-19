namespace FamilyFinance.Domain.Enums;

public enum MovementType { Income, Expense }
public enum ContributorType { Salary, Freelance, Business, Investment, Other }
public enum FrequencyType { Daily, Weekly, Biweekly, Monthly, Annual, Variable }
public enum VentureStatus { Active, Inactive, Suspended }
public enum CategoryType { Income, Expense, Both }
public enum AccountType { Cash, BankAccount, CreditCard, DebitCard, DigitalWallet, Other }
public enum PaymentMethod { Cash, BankTransfer, CreditCard, DebitCard, Yape, Plin, Other }
public enum GoalType { EmergencyFund, Vehicle, Travel, Education, Housing, Investment, Other }
public enum UserRole { Admin, Contributor, Viewer }
public enum AlertType { HighExpense, Deficit, NoRecords, VentureLoss, LowSavings, GoalDeadline, Custom }
public enum AlertStatus { Active, Read, Dismissed }
