import { describe, it, expect } from 'vitest';
import { guessCategory, parseOFX, parseCSV } from '../src/utils/statementParser';

const mockCategories = [
  'Alimentação',
  'Transporte & Combustível',
  'Habitação & Moradia',
  'Saúde & Cuidados',
  'Lazer & Entretenimento',
  'Salário / Renda',
  'Casa & Reforma',
  'Evolução de Obra',
  'Outros'
];

describe('statementParser', () => {
  describe('guessCategory', () => {
    it('accurately detects food keywords (iFood, Mercado)', () => {
      expect(guessCategory('PAGAMENTO IFOOD BRASIL', mockCategories)).toBe('Alimentação');
      expect(guessCategory('SUPERMERCADO DIA', mockCategories)).toBe('Alimentação');
    });

    it('accurately detects fuel and transport (Uber, Posto Shell)', () => {
      expect(guessCategory('UBER TRIP HELP.UBER.COM', mockCategories)).toBe('Transporte & Combustível');
      expect(guessCategory('POSTO SHELL AUTO POSTO', mockCategories)).toBe('Transporte & Combustível');
    });

    it('accurately detects utilities and house bills', () => {
      expect(guessCategory('ENEL SP DISTRIBUICAO', mockCategories)).toBe('Habitação & Moradia');
      expect(guessCategory('SABESP 2VIA AGUA', mockCategories)).toBe('Habitação & Moradia');
    });

    it('accurately detects income / salary', () => {
      expect(guessCategory('SALARIO EMPRESA XYZ', mockCategories)).toBe('Salário / Renda');
      expect(guessCategory('PIX RECEBIDO JOAO', mockCategories)).toBe('Salário / Renda');
    });

    it('falls back to Outros when no keyword matches', () => {
      expect(guessCategory('COMPRA LOJA DESCONHECIDA 1234', mockCategories)).toBe('Outros');
    });
  });

  describe('parseOFX', () => {
    it('correctly parses an OFX statement with deposits and debits', () => {
      const sampleOfx = `
OFXHEADER:100
DATA:OFXSGML
VERSION:102
<OFX>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <STMTRS>
        <BANKACCTFROM>
          <BANKID>260
          <ACCTID>12345-6
        </BANKACCTFROM>
        <BANKTRANLIST>
          <STMTTRN>
            <TRNTYPE>DEBIT
            <DTPOSTED>20261102120000[-03:EST]
            <TRNAMT>-45.50
            <FITID>TX1001
            <MEMO>IFOOD *RESTAURANTE
          </STMTTRN>
          <STMTTRN>
            <TRNTYPE>CREDIT
            <DTPOSTED>20261103120000[-03:EST]
            <TRNAMT>3500.00
            <FITID>TX1002
            <MEMO>SALARIO MENSAL
          </STMTTRN>
        </BANKTRANLIST>
      </STMTRS>
    </STMTTRNRS>
  </BANKMSGSRSV1>
</OFX>`;

      const result = parseOFX(sampleOfx, mockCategories);
      expect(result.accountNumber).toBe('12345-6');
      expect(result.transactions).toHaveLength(2);

      const debit = result.transactions[0];
      expect(debit.externalId).toBe('TX1001');
      expect(debit.amount).toBe(45.5);
      expect(debit.type).toBe('saida');
      expect(debit.date).toBe('2026-11-02');
      expect(debit.suggestedCategory).toBe('Alimentação');

      const credit = result.transactions[1];
      expect(credit.externalId).toBe('TX1002');
      expect(credit.amount).toBe(3500);
      expect(credit.type).toBe('entrada');
      expect(credit.date).toBe('2026-11-03');
      expect(credit.suggestedCategory).toBe('Salário / Renda');
    });
  });

  describe('parseCSV', () => {
    it('parses Nubank/Inter style CSV with Date, Description and Amount', () => {
      const sampleCsv = `Data,Descricao,Valor
01/11/2026,Uber Trip,-28.90
02/11/2026,PIX RECEBIDO,500.00
`;
      const result = parseCSV(sampleCsv, mockCategories);
      expect(result.transactions).toHaveLength(2);

      expect(result.transactions[0].date).toBe('2026-11-01');
      expect(result.transactions[0].amount).toBe(28.9);
      expect(result.transactions[0].type).toBe('saida');
      expect(result.transactions[0].suggestedCategory).toBe('Transporte & Combustível');

      expect(result.transactions[1].date).toBe('2026-11-02');
      expect(result.transactions[1].amount).toBe(500);
      expect(result.transactions[1].type).toBe('entrada');
      expect(result.transactions[1].suggestedCategory).toBe('Salário / Renda');
    });
  });
});
