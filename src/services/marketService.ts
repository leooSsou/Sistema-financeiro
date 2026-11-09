export interface StockHistoryPoint {
  date: string;
  price: number;
  volume: number;
}

export interface StockQuote {
  symbol: string;
  longName: string;
  currency: string;
  price: number;
  change: number;
  changePercent: number;
  dayHigh?: number;
  dayLow?: number;
  fiftyTwoWeekHigh?: number;
  fiftyTwoWeekLow?: number;
  volume: number;
  history: StockHistoryPoint[];
  error?: string;
}

export interface MarketIndicators {
  dolar: number;
  dolarChange: number;
  bitcoin: number;
  bitcoinChange: number;
  selic: number;
  cdi: number;
  ipca: number;
  poupanca: number;
}

export interface CuratedAssetOpportunity {
  ticker: string;
  name: string;
  sector: string;
  type: 'acoes' | 'fiis' | 'renda_fixa';
  category: 'dividendo' | 'crescimento' | 'valor' | 'reserva';
  tag: string;
  description: string;
  bullCase: string; // Por que comprar para longo prazo
  riskLevel: 'Baixo' | 'Médio' | 'Alto';
  targetHorizon: string; // Ex: '5+ anos'
  referenceYield: number; // Dividend Yield anual estimado (%)
  expectedAnnualReturn: number; // Retorno médio esperado anual (%)
}

export const CURATED_OPPORTUNITIES: CuratedAssetOpportunity[] = [
  {
    ticker: 'WEGE3',
    name: 'WEG S.A.',
    sector: 'Motores & Automação Industrial',
    type: 'acoes',
    category: 'crescimento',
    tag: '🚀 Crescimento & Qualidade',
    description: 'Multinacional brasileira de motores elétricos, automação e energia limpa.',
    bullCase: 'Histórico de valorização impecável há mais de 20 anos, ROE de 30% e 50%+ da receita em moeda forte (dólar/euro).',
    riskLevel: 'Baixo',
    targetHorizon: '5 a 10 anos',
    referenceYield: 2.1,
    expectedAnnualReturn: 16.5,
  },
  {
    ticker: 'BBAS3',
    name: 'Banco do Brasil',
    sector: 'Financeiro & Bancário',
    type: 'acoes',
    category: 'dividendo',
    tag: '🥛 Vaca Leiteira (Dividendos)',
    description: 'Líder histórico no crédito ao agronegócio e forte retorno aos acionistas.',
    bullCase: 'Preço sobre Lucro (P/L) muito baixo (~4,5x), dividend yield de dois dígitos e rentabilidade equiparada aos bancos privados.',
    riskLevel: 'Médio',
    targetHorizon: '3 a 7 anos',
    referenceYield: 9.8,
    expectedAnnualReturn: 14.0,
  },
  {
    ticker: 'ITUB4',
    name: 'Itaú Unibanco',
    sector: 'Financeiro & Bancário',
    type: 'acoes',
    category: 'crescimento',
    tag: '💎 Blue Chip Resiliente',
    description: 'Maior banco privado da América Latina, com governança e tecnologia de ponta.',
    bullCase: 'Inadimplência controlada, ROE acima de 21% de forma sustentada e histórico de dividendos e bonificações crescentes.',
    riskLevel: 'Baixo',
    targetHorizon: '5+ anos',
    referenceYield: 6.8,
    expectedAnnualReturn: 13.5,
  },
  {
    ticker: 'TAEE11',
    name: 'Taesa Transmissora',
    sector: 'Energia Elétrica',
    type: 'acoes',
    category: 'dividendo',
    tag: '⚡ Renda Previsível & Dividendos',
    description: 'Concessionária de linhas de transmissão com contratos de longo prazo (RAP).',
    bullCase: 'Receitas blindadas contra crises econômicas e indexadas à inflação (IPCA/IGP-M). Foco quase total em payout de dividendos.',
    riskLevel: 'Baixo',
    targetHorizon: '3 a 8 anos',
    referenceYield: 8.5,
    expectedAnnualReturn: 12.0,
  },
  {
    ticker: 'VALE3',
    name: 'Vale S.A.',
    sector: 'Mineração & Siderurgia',
    type: 'acoes',
    category: 'valor',
    tag: '⛏️ Commodity Global & Desconto',
    description: 'Uma das maiores produtoras globais de minério de ferro e níquel para baterias.',
    bullCase: 'Negociada com forte desconto histórico em relação ao seu patrimônio líquido, gerando fluxo de caixa bilionário e recompras de ações.',
    riskLevel: 'Médio',
    targetHorizon: '3 a 5 anos',
    referenceYield: 7.9,
    expectedAnnualReturn: 13.0,
  },
  {
    ticker: 'PETR4',
    name: 'Petrobras',
    sector: 'Petróleo & Energia',
    type: 'acoes',
    category: 'valor',
    tag: '🛢️ Geração Brutal de Caixa',
    description: 'Exploração e produção do pré-sal brasileiro com custo de extração líder mundial.',
    bullCase: 'Campos do pré-sal produzem petróleo a baixo custo, gerando dividendos expressivos e margem operacional robusta.',
    riskLevel: 'Alto',
    targetHorizon: '2 a 5 anos',
    referenceYield: 14.5,
    expectedAnnualReturn: 15.0,
  },
  {
    ticker: 'MXRF11',
    name: 'Maxi Renda FII',
    sector: 'Fundos Imobiliários (CRIs)',
    type: 'fiis',
    category: 'dividendo',
    tag: '🏢 Renda Mensal Isenta de IR',
    description: 'Maior fundo imobiliário do país em número de investidores, focado em títulos imobiliários.',
    bullCase: 'Distribui rendimentos todos os meses diretamente na conta corrente, isentos de Imposto de Renda para pessoa física.',
    riskLevel: 'Baixo',
    targetHorizon: 'Indefinido (Aposentadoria)',
    referenceYield: 11.2,
    expectedAnnualReturn: 11.5,
  },
  {
    ticker: 'HGLG11',
    name: 'CSHG Logística FII',
    sector: 'Fundos Imobiliários (Logística)',
    type: 'fiis',
    category: 'crescimento',
    tag: '🚚 Galpões Logísticos Prime',
    description: 'Portfólio de galpões logísticos de alto padrão alugados para grandes operadores (Mercado Livre, Ambev, etc.).',
    bullCase: 'Imóveis físicos de alta qualidade, vacância historicamente baixa e reajuste anual de aluguéis pela inflação.',
    riskLevel: 'Baixo',
    targetHorizon: '5+ anos',
    referenceYield: 8.8,
    expectedAnnualReturn: 12.0,
  },
];

// Fallback benchmarks if offline
const FALLBACK_INDICATORS: MarketIndicators = {
  dolar: 5.51,
  dolarChange: 0.16,
  bitcoin: 412800,
  bitcoinChange: -2.4,
  selic: 11.25,
  cdi: 11.15,
  ipca: 4.10,
  poupanca: 6.17,
};

export const marketService = {
  async fetchQuote(ticker: string, range = '1mo'): Promise<StockQuote> {
    if (!ticker) {
      return { symbol: '', longName: '', currency: 'BRL', price: 0, change: 0, changePercent: 0, volume: 0, history: [], error: 'Ticker vazio' };
    }

    // Try Electron IPC first
    if (window.electronAPI?.fetchMarketQuote) {
      try {
        const res = await window.electronAPI.fetchMarketQuote(ticker, range);
        if (res && res.success) {
          return res;
        }
        if (res?.error) {
          console.warn('[MarketService] Erro IPC:', res.error);
        }
      } catch (err) {
        console.warn('[MarketService] Erro ao chamar IPC:', err);
      }
    }

    // Direct fetch fallback
    try {
      let symbol = ticker.trim().toUpperCase();
      if (!symbol.includes('.')) symbol = `${symbol}.SA`;

      const response = await fetch(
        `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=${encodeURIComponent(range)}`
      );

      if (response.ok) {
        const data = await response.json();
        const result = data?.chart?.result?.[0];
        if (result) {
          const meta = result.meta || {};
          const timestamps = result.timestamp || [];
          const quote = result.indicators?.quote?.[0] || {};
          const closes = quote.close || [];
          const volumes = quote.volume || [];

          const history: StockHistoryPoint[] = [];
          for (let i = 0; i < timestamps.length; i++) {
            if (closes[i] !== null && closes[i] !== undefined) {
              const d = new Date(timestamps[i] * 1000);
              history.push({
                date: d.toISOString().slice(0, 10),
                price: Number(closes[i].toFixed(2)),
                volume: volumes[i] || 0,
              });
            }
          }

          const price = meta.regularMarketPrice || (history.length > 0 ? history[history.length - 1].price : 0);
          const changePercent = meta.regularMarketChangePercent !== undefined
            ? Number(meta.regularMarketChangePercent.toFixed(2))
            : 0;

          return {
            symbol: meta.symbol ? meta.symbol.replace('.SA', '') : ticker.toUpperCase(),
            longName: meta.longName || meta.shortName || ticker.toUpperCase(),
            currency: meta.currency || 'BRL',
            price: Number(price.toFixed(2)),
            change: Number(((price * changePercent) / 100).toFixed(2)),
            changePercent,
            dayHigh: meta.regularMarketDayHigh,
            dayLow: meta.regularMarketDayLow,
            fiftyTwoWeekHigh: meta.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: meta.fiftyTwoWeekLow,
            volume: meta.regularMarketVolume || 0,
            history,
          };
        }
      }
    } catch (err) {
      console.warn('[MarketService] Direct fetch falhou:', err);
    }

    // Default simulation fallback so the UI never breaks
    const basePrice = ticker.includes('MXRF') ? 8.85 : ticker.includes('WEGE') ? 50.30 : ticker.includes('BBAS') ? 28.40 : ticker.includes('VALE') ? 65.90 : 45.05;
    return {
      symbol: ticker.toUpperCase(),
      longName: ticker.toUpperCase() + ' (Estimado)',
      currency: 'BRL',
      price: basePrice,
      change: 0.45,
      changePercent: 1.02,
      dayHigh: basePrice * 1.02,
      dayLow: basePrice * 0.98,
      volume: 15400000,
      history: [
        { date: '2026-10-15', price: basePrice * 0.96, volume: 1200000 },
        { date: '2026-10-22', price: basePrice * 0.98, volume: 1400000 },
        { date: '2026-10-29', price: basePrice * 0.97, volume: 1100000 },
        { date: '2026-11-05', price: basePrice * 1.01, volume: 1600000 },
        { date: '2026-11-09', price: basePrice, volume: 1540000 },
      ],
    };
  },

  async fetchIndicators(): Promise<MarketIndicators> {
    if (window.electronAPI?.fetchMarketIndicators) {
      try {
        const res = await window.electronAPI.fetchMarketIndicators();
        if (res && res.success) {
          return res;
        }
      } catch (err) {
        console.warn('[MarketService] Indicators IPC falhou:', err);
      }
    }

    try {
      const res = await fetch('https://economia.awesomeapi.com.br/last/USD-BRL,BTC-BRL');
      if (res.ok) {
        const data = await res.json();
        return {
          ...FALLBACK_INDICATORS,
          dolar: Number(Number(data?.USDBRL?.bid || 5.51).toFixed(2)),
          dolarChange: Number(Number(data?.USDBRL?.pctChange || 0).toFixed(2)),
          bitcoin: Number(Number(data?.BTCBRL?.bid || 412800).toFixed(0)),
          bitcoinChange: Number(Number(data?.BTCBRL?.pctChange || 0).toFixed(2)),
        };
      }
    } catch {
      // Return fallback
    }

    return FALLBACK_INDICATORS;
  },

  calculateCompoundInterest(
    initialAmount: number,
    monthlyDeposit: number,
    annualRatePercent: number,
    months: number
  ) {
    const monthlyRate = Math.pow(1 + annualRatePercent / 100, 1 / 12) - 1;
    let accumulated = initialAmount;
    let totalInvested = initialAmount;

    const timeline: {
      month: number;
      year: string;
      totalInvested: number;
      interestEarned: number;
      totalAccumulated: number;
    }[] = [];

    for (let m = 1; m <= months; m++) {
      accumulated = accumulated * (1 + monthlyRate) + monthlyDeposit;
      totalInvested += monthlyDeposit;
      const interestEarned = Math.max(0, accumulated - totalInvested);

      if (m % 6 === 0 || m === months || m === 1) {
        const yearFraction = (m / 12).toFixed(1);
        timeline.push({
          month: m,
          year: `${yearFraction} ano(s)`,
          totalInvested: Math.round(totalInvested),
          interestEarned: Math.round(interestEarned),
          totalAccumulated: Math.round(accumulated),
        });
      }
    }

    return {
      finalAccumulated: Math.round(accumulated),
      finalInvested: Math.round(totalInvested),
      totalInterest: Math.round(accumulated - totalInvested),
      monthlyPassiveIncomeEstimate: Math.round((accumulated * monthlyRate)),
      timeline,
    };
  },

  monthsToReachGoal(
    targetAmount: number,
    initialAmount: number,
    monthlyDeposit: number,
    annualRatePercent: number
  ): number {
    if (initialAmount >= targetAmount) return 0;
    if (monthlyDeposit <= 0 && annualRatePercent <= 0) return Infinity;

    const monthlyRate = Math.pow(1 + annualRatePercent / 100, 1 / 12) - 1;
    let balance = initialAmount;
    let months = 0;
    const maxMonths = 1200; // 100 years max loop guard

    while (balance < targetAmount && months < maxMonths) {
      balance = balance * (1 + monthlyRate) + monthlyDeposit;
      months++;
    }

    return months;
  },
};
