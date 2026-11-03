import { TransactionType } from '../types/finance';

export interface ParsedStatementTransaction {
  id: string; // generated temp id
  externalId: string; // FITID from bank
  date: string; // YYYY-MM-DD
  description: string;
  amount: number; // positive value
  type: TransactionType;
  suggestedCategory: string;
}

export interface StatementParseResult {
  bankName?: string;
  accountNumber?: string;
  transactions: ParsedStatementTransaction[];
}

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  'Alimentação': [
    'ifood', 'supermercado', 'mercado', 'restaurante', 'lanchonete', 'padaria',
    'pao de acucar', 'assai', 'atacadao', 'carrefour', 'mcdonald', 'burger',
    'subway', 'bar', 'churrascaria', 'acougue', 'hortifruti', 'delivery'
  ],
  'Transporte & Combustível': [
    'uber', '99app', 'posto', 'combustivel', 'gasolina', 'etanol', 'shell',
    'ipiranga', 'br distribuidora', 'estacionamento', 'pedagio', 'sem parar',
    'conectcar', 'veloe', 'mecanica', 'oficina', 'lavarapido'
  ],
  'Habitação & Moradia': [
    'enel', 'cemig', 'copel', 'cpfl', 'sabesp', 'sanepar', 'aguas', 'energia',
    'luz', 'aluguel', 'condominio', 'gas', 'iptu', 'claro', 'vivo', 'oi', 'tim',
    'internet', 'fibra'
  ],
  'Saúde & Cuidados': [
    'farmacia', 'drogaria', 'drogasil', 'raia', 'pague menos', 'hospital',
    'clinica', 'medico', 'dentista', 'odonto', 'laboratorio', 'exame',
    'unimed', 'bradesco saude', 'sulamerica', 'otica'
  ],
  'Lazer & Entretenimento': [
    'netflix', 'spotify', 'amazon prime', 'disney', 'hbo', 'globo', 'cinema',
    'cinemark', 'steam', 'playstation', 'xbox', 'nintendo', 'ingresso', 'sympla',
    'show', 'teatro', 'viagem', 'hotel', 'airbnb', 'decolar'
  ],
  'Salário / Renda': [
    'salario', 'remuneracao', 'folha', 'pro-labore', 'rendimento', 'ted recebida',
    'pix recebido', 'ted c/c', 'honorarios'
  ],
  'Casa & Reforma': [
    'leroy merlin', 'telhanorte', 'c&c', 'madeira madeira', 'marcenaria',
    'tintas', 'suvinil', 'coral', 'deposito', 'construcao', 'moveis', 'reforma'
  ],
  'Evolução de Obra': [
    'taxa de obra', 'evolucao de obra', 'caixa economica', 'medicao obra', 'construtora'
  ],
  'Educação': [
    'faculdade', 'escola', 'colegio', 'universidade', 'curso', 'udemy',
    'alura', 'livraria', 'livros'
  ]
};

export function guessCategory(description: string, availableCategories: string[]): string {
  const normalized = description.toLowerCase();

  for (const [catName, keywords] of Object.entries(CATEGORY_KEYWORDS)) {
    const matched = keywords.some((kw) => normalized.includes(kw));
    if (matched) {
      const existing = availableCategories.find(
        (c) => c.toLowerCase() === catName.toLowerCase()
      );
      if (existing) return existing;
    }
  }

  // Fallback to "Outros" or first available category
  const outros = availableCategories.find((c) => c.toLowerCase() === 'outros');
  return outros || availableCategories[0] || 'Geral';
}

function parseOfxDate(rawDate: string): string {
  // Format is usually YYYYMMDDHHMMSS or YYYYMMDD
  if (!rawDate || rawDate.length < 8) {
    return new Date().toISOString().slice(0, 10);
  }
  const clean = rawDate.replace(/\D/g, '');
  const y = clean.slice(0, 4);
  const m = clean.slice(4, 6);
  const d = clean.slice(6, 8);
  return `${y}-${m}-${d}`;
}

export function parseOFX(content: string, availableCategories: string[]): StatementParseResult {
  const transactions: ParsedStatementTransaction[] = [];
  let bankName: string | undefined;
  let accountNumber: string | undefined;

  // Extract Bank / Org info if present
  const orgMatch = content.match(/<ORG>(.*?)(?:<\/ORG>|\r?\n)/i);
  if (orgMatch) bankName = orgMatch[1].trim();

  const acctMatch = content.match(/<ACCTID>(.*?)(?:<\/ACCTID>|\r?\n)/i);
  if (acctMatch) accountNumber = acctMatch[1].trim();

  // Find all <STMTTRN> blocks
  // Regex to match between <STMTTRN> and </STMTTRN> (or before the next <STMTTRN>)
  const trnRegex = /<STMTTRN>([\s\S]*?)(?:<\/STMTTRN>|(?=<STMTTRN>)|$)/gi;
  let match;

  while ((match = trnRegex.exec(content)) !== null) {
    const block = match[1];

    const getTag = (tag: string): string => {
      const reg = new RegExp(`<${tag}>(.*?)(?:<\/${tag}>|\\r?\\n)`, 'i');
      const m = block.match(reg);
      return m ? m[1].trim() : '';
    };

    const trnType = getTag('TRNTYPE').toUpperCase();
    const dtPosted = getTag('DTPOSTED');
    const trnAmtRaw = getTag('TRNAMT');
    const fitId = getTag('FITID') || `ofx-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
    const memo = getTag('MEMO');
    const name = getTag('NAME');

    const desc = name || memo || 'Lançamento Bancário';
    const numAmt = parseFloat(trnAmtRaw.replace(',', '.'));

    if (isNaN(numAmt) || numAmt === 0) continue;

    // In OFX: negative amount = debit (saída), positive amount = credit (entrada)
    const type: TransactionType = numAmt < 0 || trnType === 'DEBIT' ? 'saida' : 'entrada';
    const absAmount = Math.abs(numAmt);
    const date = parseOfxDate(dtPosted);

    transactions.push({
      id: `temp-${Date.now()}-${transactions.length}`,
      externalId: fitId,
      date,
      description: desc,
      amount: absAmount,
      type,
      suggestedCategory: guessCategory(desc, availableCategories),
    });
  }

  return {
    bankName,
    accountNumber,
    transactions,
  };
}

export function parseCSV(content: string, availableCategories: string[]): StatementParseResult {
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const transactions: ParsedStatementTransaction[] = [];

  if (lines.length < 2) {
    return { transactions: [] };
  }

  // Detect delimiter: comma or semicolon
  const headerLine = lines[0];
  const delimiter = headerLine.includes(';') ? ';' : ',';

  const headers = headerLine.split(delimiter).map((h) => h.trim().toLowerCase().replace(/["']/g, ''));

  // Detect column indexes
  let dateIdx = headers.findIndex((h) => h.includes('data') || h.includes('date'));
  let descIdx = headers.findIndex((h) => h.includes('desc') || h.includes('historico') || h.includes('memo') || h.includes('identificador') || h.includes('estabelecimento'));
  let amountIdx = headers.findIndex((h) => h.includes('valor') || h.includes('amount') || h.includes('quantia'));

  // Fallbacks if not detected by keywords
  if (dateIdx === -1) dateIdx = 0;
  if (descIdx === -1) descIdx = 1;
  if (amountIdx === -1) amountIdx = 2;

  for (let i = 1; i < lines.length; i++) {
    const rawLine = lines[i].trim();
    if (!rawLine) continue;

    // Split CSV respecting quoted values
    const cols = rawLine.split(delimiter).map((c) => c.trim().replace(/^["']|["']$/g, ''));
    if (cols.length < 2) continue;

    const rawDate = cols[dateIdx] || '';
    const rawDesc = cols[descIdx] || 'Lançamento CSV';
    const rawAmount = cols[amountIdx] || '0';

    // Parse date (supports DD/MM/YYYY or YYYY-MM-DD)
    let formattedDate = new Date().toISOString().slice(0, 10);
    if (rawDate.includes('/')) {
      const parts = rawDate.split('/');
      if (parts.length === 3) {
        const d = parts[0].padStart(2, '0');
        const m = parts[1].padStart(2, '0');
        let y = parts[2];
        if (y.length === 2) y = `20${y}`;
        formattedDate = `${y}-${m}-${d}`;
      }
    } else if (rawDate.includes('-')) {
      const parts = rawDate.split('-');
      if (parts.length === 3) {
        if (parts[0].length === 4) {
          formattedDate = rawDate.slice(0, 10);
        } else {
          // DD-MM-YYYY
          formattedDate = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
        }
      }
    }

    // Parse Amount (Brazilian R$ 1.250,50 vs 1250.50)
    let cleanAmtStr = rawAmount.replace(/[R$\s]/g, '');
    if (cleanAmtStr.includes(',') && cleanAmtStr.includes('.')) {
      cleanAmtStr = cleanAmtStr.replace(/\./g, '').replace(',', '.');
    } else if (cleanAmtStr.includes(',')) {
      cleanAmtStr = cleanAmtStr.replace(',', '.');
    }

    const numAmt = parseFloat(cleanAmtStr);
    if (isNaN(numAmt) || numAmt === 0) continue;

    const type: TransactionType = numAmt < 0 ? 'saida' : 'entrada';
    const absAmount = Math.abs(numAmt);

    const fitId = `csv-${formattedDate}-${absAmount}-${rawDesc.slice(0, 15).replace(/\s/g, '')}`;

    transactions.push({
      id: `temp-${Date.now()}-${transactions.length}`,
      externalId: fitId,
      date: formattedDate,
      description: rawDesc,
      amount: absAmount,
      type,
      suggestedCategory: guessCategory(rawDesc, availableCategories),
    });
  }

  return { transactions };
}
