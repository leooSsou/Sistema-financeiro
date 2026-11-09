export type TransactionType = 'entrada' | 'saida' | 'transferencia';
export type PaymentStatus = 'pago' | 'pendente';

export interface CreditCardItem {
  id: string;
  name: string; // Apelido (ex: "Nubank Principal", "Itaú Click")
  lastFourDigits: string; // Final do cartão (ex: "4821")
  limit: number; // Limite total (R$)
  color?: string; // Cor do cartão
}

export type BankAccountType = 'corrente' | 'poupanca' | 'investimento' | 'carteira' | 'outros';

export interface BankAccount {
  id: string;
  name: string; // ex: "Nubank", "Itaú", "Carteira / Espécie"
  type: BankAccountType;
  initialBalance: number;
  color?: string;
  agency?: string;
  accountNumber?: string;
}

export interface Transaction {
  id: string;
  date: string; // YYYY-MM-DD
  description: string;
  type: TransactionType;
  amount: number;
  category: string;
  paymentMethod: string;
  creditCardId?: string; // ID do cartão caso forma de pagamento seja Cartão de Crédito
  bankAccountId?: string; // ID da conta bancária de origem / movimentação
  destinationAccountId?: string; // ID da conta bancária destino (para transferências)
  status: PaymentStatus;
  notes?: string;
  isRecurring?: boolean; // Para despesas fixas recorrentes
  externalId?: string; // ID único importado do banco (ex: FITID no OFX) para evitar duplicatas
}

export interface CategoryBudget {
  category: string;
  monthlyLimit: number; // Teto mensal planejado (R$)
}

export interface RecurringTransaction {
  id: string;
  description: string;
  amount: number;
  type: 'entrada' | 'saida';
  category: string;
  paymentMethod: string;
  bankAccountId?: string;
  creditCardId?: string;
  dayOfMonth: number; // 1 a 31
  active: boolean;
  notes?: string;
}

export interface ObraEntry {
  id: string;
  referenceMonth: string; // YYYY-MM
  amount: number;
  evolutionPercent: number; // e.g. 45.5 for 45.5%
  dueDate: string; // YYYY-MM-DD
  status: PaymentStatus;
  notes?: string;
}

export interface HouseInstallment {
  id: string;
  title: string;
  category: string;
  supplier: string;
  totalAmount: number;
  installmentValue: number;
  totalInstallments: number;
  paidInstallments: number;
  dueDay: number; // e.g. 10
  startDate: string; // YYYY-MM-DD
  notes?: string;
}

export interface EnabledModules {
  dashboard: boolean;
  movimentacoes: boolean;
  contas: boolean;
  cartoes: boolean;
  obra: boolean;
  casa: boolean;
  orcamento?: boolean;
  veiculos?: boolean;
  amortizacao?: boolean;
  investimentos?: boolean;
  metas?: boolean;
  visaoAnual?: boolean;
}

export type VehicleExpenseType =
  | 'abastecimento'
  | 'manutencao'
  | 'ipva'
  | 'seguro'
  | 'licenciamento'
  | 'multa'
  | 'lavagem'
  | 'outros';

export interface VehicleExpense {
  id: string;
  vehicleId: string;
  type: VehicleExpenseType;
  date: string; // YYYY-MM-DD
  amount: number;
  currentKm?: number;
  // Abastecimento
  liters?: number;
  pricePerLiter?: number;
  fuelType?: 'gasolina' | 'etanol' | 'diesel' | 'gnv';
  isFullTank?: boolean;
  // Manutenção
  serviceDescription?: string;
  nextServiceKm?: number;
  nextServiceDate?: string;
  workshop?: string;
  notes?: string;
}

export interface Vehicle {
  id: string;
  name: string; // ex: "Civic Touring" ou "HB20 Confort"
  brand: string; // ex: "Honda"
  model: string; // ex: "Civic"
  year: number; // ex: 2022
  plate?: string; // ex: "ABC-1D23"
  color?: string; // ex: "#3b82f6"
  currentKm: number;
  fuelTypeDefault?: 'flex' | 'gasolina' | 'etanol' | 'diesel';
  insuranceDueDate?: string; // YYYY-MM-DD
  licenseDueDate?: string; // YYYY-MM-DD
  notes?: string;
}

export interface OneTimeAmortization {
  id: string;
  monthIndex: number; // Mês do aporte (ex: mês 12, 24)
  amount: number;
  description?: string;
}

export interface AmortizationSimulation {
  id: string;
  title: string; // ex: "Financiamento Imobiliário Caixa"
  financingType: 'SAC' | 'PRICE';
  financedAmount: number; // Saldo devedor ou valor financiado
  annualInterestRate: number; // % ao ano (ex: 9.9)
  totalMonths: number; // Prazo original em meses (ex: 360)
  monthlyExtraAmortization: number; // Aporte extra todo mês (ex: 500)
  amortizationStrategy: 'prazo' | 'parcela'; // Reduzir prazo ou valor da parcela
  startDate?: string; // YYYY-MM
  oneTimeAmortizations?: OneTimeAmortization[];
  notes?: string;
}

export interface AppSettings {
  userName: string;
  systemTitle: string;
  currency: string;
  theme: 'light' | 'dark';
  lastSaved?: string;
  avatarUrl?: string;
  houseDeliveryDate?: string; // Data prevista para entrega das chaves (YYYY-MM ou YYYY-MM-DD)
  enabledModules: EnabledModules;
}

export interface AppData {
  transactions: Transaction[];
  obraEntries: ObraEntry[];
  houseInstallments: HouseInstallment[];
  categories: string[];
  creditCards?: CreditCardItem[];
  bankAccounts?: BankAccount[];
  categoryBudgets?: CategoryBudget[];
  recurringTransactions?: RecurringTransaction[];
  vehicles?: Vehicle[];
  vehicleExpenses?: VehicleExpense[];
  amortizationSimulations?: AmortizationSimulation[];
  monthlyNotes?: Record<string, string>; // Observações de cada mês (ex: "2026-11": "Texto das notas...")
  appSettings: AppSettings;
}
