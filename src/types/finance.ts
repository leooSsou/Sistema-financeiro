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
  investimentos?: boolean;
  metas?: boolean;
  visaoAnual?: boolean;
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
  monthlyNotes?: Record<string, string>; // Observações de cada mês (ex: "2026-11": "Texto das notas...")
  appSettings: AppSettings;
}
