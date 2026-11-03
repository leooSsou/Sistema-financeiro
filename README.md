# Sistema Desktop Financeiro & Obra - Gabi

Sistema desktop completo, portável para **Linux** e **Windows**, desenvolvido com **Electron + React + Tailwind CSS + Lucide Icons + Recharts**.

Todos os dados são salvos e processados **100% localmente no computador** em formato JSON seguro, com backup automático, garantindo total privacidade e funcionamento sem internet.

---

## 🎯 Atendimento aos Requisitos dos Áudios

### 1. Extrato de Movimentações (Entradas e Saídas)
* Lançamento de todas as receitas e despesas com descrição, valor, data, categoria, forma de pagamento e status (Pago/Pendente).
* **Resumo Financeiro Automático em Destaque:**
  * **Soma automática de todas as entradas.**
  * **Soma automática de todas as saídas.**
  * **Cálculo automático do saldo líquido (Entradas − Saídas).**
* Alternador rápido com 1 clique de status (de *Pendente* para *Pago* e vice-versa).
* Filtros por mês, categoria, tipo (entrada/saída) e busca em tempo real.

### 2. Módulo de Evolução de Obra
* Acompanhamento específico das taxas de medição e juros de obra da Caixa Econômica / Construtora.
* Histórico com mês de referência, taxa cobrada (R$), percentual de obra concluído (%) e vencimento.
* **Resumo Automático da Obra:**
  * Total já pago de taxas de obra.
  * Média mensal desembolsada.
  * Último percentual de medição e gráfico visual da evolução da obra mês a mês.

### 3. Financiamentos e Compras da Casa
* Gestão de contratos e parcelamentos (móveis planejados, acabamentos, pisos, eletrodomésticos, reforma, etc.).
* **Controle Automático de Parcelas:**
  * Quantas parcelas foram contratadas.
  * Quantas parcelas já foram pagas.
  * **Quantas parcelas faltam pagar.**
  * **Saldo restante a pagar (saldo devedor).**
  * Barra de progresso visual de quitação (%) de cada item.
* **Ação Rápida de 1 Clique:** Botão *"Pagar Próxima Parcela (+1)"*, que abate a parcela automaticamente e oferece a opção de já lançar a despesa correspondente no extrato de movimentações.

### 4. Segurança, Backup e Exportação
* **Exportação para Planilha Excel (.xlsx):** Gera em 1 clique o arquivo Excel com 3 abas separadas e formatadas (*Movimentações*, *Evolução de Obra* e *Parcelamentos da Casa*).
* **Backup e Restauração (.json):** Exportação e importação de arquivo de backup para trocar de computador ou guardar no pendrive/drive.
* **Pasta de Dados:** Botão que abre a pasta local onde o arquivo JSON do banco de dados fica guardado no computador.

---

## 🚀 Como Executar no Windows (Portável)

1. Envie o arquivo gerado em `distrib/SistemaFinanceiro-Gabi-Windows-Portavel.zip` para o computador dela.
2. Descompacte o arquivo `.zip` em qualquer pasta (ex: Documentos ou Área de Trabalho).
3. Dê um duplo clique no executável:
   ```text
   Sistema Financeiro & Obra.exe
   ```
4. **Pronto!** O programa abre instantaneamente sem necessidade de instalação nem internet.

---

## 🐧 Como Executar no Linux

### Opção 1: Executável Pronto
Basta executar o script de inicialização:
```bash
./iniciar-linux.sh
```
Ou rodar diretamente o executável na pasta:
```bash
./release/linux-unpacked/sistema-financeiro-gabi
```

### Opção 2: Modo de Desenvolvimento
```bash
npm install
npm run dev
```

---

## 📁 Estrutura do Projeto

* `electron/` - Código do processo principal do Electron, persistência local e diálogos nativos de arquivo.
* `src/components/` - Telas do sistema:
  * `Dashboard.tsx`: Resumo consolidado, gráficos de receitas/despesas e despesas por categoria.
  * `Movimentacoes.tsx`: Tabela de lançamentos com cálculo e filtros automáticos.
  * `EvolucaoObra.tsx`: Controle de medições da obra e taxa de juros da Caixa.
  * `CasaParcelamentos.tsx`: Gestão de compras e parcelamentos com abates automáticos.
  * `Configuracoes.tsx`: Backup, restauração, Excel e personalização de categorias.
* `distrib/` - Pacotes portáveis prontos para distribuição (Windows `.zip` e Linux `.tar.gz`).
* `audios/` - Áudios originais enviados pela Gabi.
