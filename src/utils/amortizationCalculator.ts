export interface MonthlyScheduleRow {
  month: number;
  date?: string;
  installment: number; // Parcela do mês
  amortization: number; // Parte que reduz a dívida
  interest: number; // Parte que vai para o banco
  extraAmortization: number; // Aporte extra
  remainingBalance: number; // Saldo devedor final
}

export interface SimulationResult {
  strategy: 'prazo' | 'parcela';
  originalTotalMonths: number;
  actualMonths: number;
  monthsSaved: number;
  originalTotalInterest: number;
  actualTotalInterest: number;
  totalInterestSaved: number;
  originalTotalPaid: number;
  actualTotalPaid: number;
  totalExtraInvested: number;
  schedule: MonthlyScheduleRow[];
}

export function calculateAmortization(
  financedAmount: number,
  annualInterestRate: number,
  totalMonths: number,
  financingType: 'SAC' | 'PRICE',
  monthlyExtra: number = 0,
  strategy: 'prazo' | 'parcela' = 'prazo',
  oneTimeAmortizations: { monthIndex: number; amount: number }[] = []
): { standard: SimulationResult; accelerated: SimulationResult } {
  // Monthly interest rate (Caixa / Brazilian banks use annual nominal / 12)
  const monthlyRate = (annualInterestRate / 100) / 12;

  // 1. Calculate Standard (No extra aportes)
  const standard = simulate(
    financedAmount,
    monthlyRate,
    totalMonths,
    financingType,
    0,
    'prazo',
    []
  );

  // 2. Calculate Accelerated (With extra aportes)
  const accelerated = simulate(
    financedAmount,
    monthlyRate,
    totalMonths,
    financingType,
    monthlyExtra,
    strategy,
    oneTimeAmortizations
  );

  // Compare results
  accelerated.monthsSaved = Math.max(0, standard.actualMonths - accelerated.actualMonths);
  accelerated.totalInterestSaved = Math.max(0, standard.actualTotalInterest - accelerated.actualTotalInterest);

  return { standard, accelerated };
}

function simulate(
  principal: number,
  monthlyRate: number,
  totalMonths: number,
  type: 'SAC' | 'PRICE',
  monthlyExtra: number,
  strategy: 'prazo' | 'parcela',
  oneTimes: { monthIndex: number; amount: number }[]
): SimulationResult {
  const schedule: MonthlyScheduleRow[] = [];
  let balance = principal;
  let remainingMonths = totalMonths;
  let totalInterest = 0;
  let totalPaid = 0;
  let totalExtra = 0;

  // For PRICE initial PMT
  let pricePMT =
    monthlyRate > 0
      ? (principal * (monthlyRate * Math.pow(1 + monthlyRate, totalMonths))) /
        (Math.pow(1 + monthlyRate, totalMonths) - 1)
      : principal / totalMonths;

  // For SAC fixed amortization
  let sacAmortization = principal / totalMonths;

  for (let m = 1; m <= totalMonths && balance > 0.01; m++) {
    const interest = balance * monthlyRate;

    // Check one-time extra for this month
    const oneTimeForMonth = oneTimes
      .filter((o) => o.monthIndex === m)
      .reduce((sum, o) => sum + o.amount, 0);

    const extra = monthlyExtra + oneTimeForMonth;

    let baseAmortization = 0;
    let installment = 0;

    if (type === 'SAC') {
      if (strategy === 'parcela' && m > 1) {
        // Recalculate SAC amortization on new remaining balance
        sacAmortization = balance / remainingMonths;
      }
      baseAmortization = Math.min(balance, sacAmortization);
      installment = baseAmortization + interest;
    } else {
      // PRICE
      if (strategy === 'parcela' && m > 1) {
        // Recalculate PRICE PMT on new balance
        pricePMT =
          monthlyRate > 0
            ? (balance * (monthlyRate * Math.pow(1 + monthlyRate, remainingMonths))) /
              (Math.pow(1 + monthlyRate, remainingMonths) - 1)
            : balance / remainingMonths;
      }
      installment = Math.min(balance + interest, pricePMT);
      baseAmortization = Math.max(0, installment - interest);
    }

    const appliedExtra = Math.min(Math.max(0, balance - baseAmortization), extra);
    const totalMonthAmortization = baseAmortization + appliedExtra;

    balance = Math.max(0, balance - totalMonthAmortization);
    remainingMonths--;

    totalInterest += interest;
    totalPaid += installment + appliedExtra;
    totalExtra += appliedExtra;

    schedule.push({
      month: m,
      installment,
      amortization: baseAmortization,
      interest,
      extraAmortization: appliedExtra,
      remainingBalance: balance,
    });

    if (balance <= 0) break;
  }

  return {
    strategy,
    originalTotalMonths: totalMonths,
    actualMonths: schedule.length,
    monthsSaved: 0,
    originalTotalInterest: totalInterest,
    actualTotalInterest: totalInterest,
    totalInterestSaved: 0,
    originalTotalPaid: totalPaid,
    actualTotalPaid: totalPaid,
    totalExtraInvested: totalExtra,
    schedule,
  };
}
