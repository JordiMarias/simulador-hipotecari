/**
 * SIMULADOR HIPOTECARI - CONFIGURACIÓ I CONSTANTS
 * Normativa fiscal i de despeses a Catalunya
 */

export const CONFIG = {
  // Paràmetres per defecte
  DEFAULT_PROPERTY_PRICE: 200000,
  DEFAULT_DOWN_PAYMENT_FUNDS: 65000, // Valor absolut en € per defecte (cobreix 20% entrada + despeses)
  DEFAULT_INTEREST_RATE: 3.0, // TAE / TIN %
  DEFAULT_YEARS: 30,
  DEFAULT_NET_SALARY: 2200,

  // Límits legals i recomanacions
  MAX_YEARS: 40,
  MIN_YEARS: 1,
  MIN_DOWN_PAYMENT_PCT: 20, // 20% mínim d'entrada per a l'immoble
  MAX_FINANCING_PCT: 80,    // Màxim 80% LTV habitual
  MAX_DSTI_RECOMMENDED: 35, // 35% màxim salari dedicat a quota
  OPTIMAL_DSTI: 30,         // <30% esforç financer saludable

  // Tipus d'impostos a Catalunya
  TAX_TYPES: {
    ITP_GENERAL: {
      id: 'itp_general',
      name: 'ITP General (Catalunya)',
      rate: 0.10, // 10%
      desc: 'Habitatge de segona mà estàndard'
    },
    ITP_REDUCED: {
      id: 'itp_reduced',
      name: 'ITP Reduït 5% (Catalunya)',
      rate: 0.05, // 5%
      desc: 'Menors de 32/35 anys, família nombrosa, monoparental o discapacitat (segons barems Generalitat)'
    },
    NEW_HOME: {
      id: 'new_home',
      name: 'Obra Nova (IVA + AJD)',
      rate: 0.115, // 10% IVA + 1.5% AJD Catalunya
      desc: 'Habitatge d’obra nova: 10% IVA + 1,5% Actes Jurídics Documentats'
    }
  },

  // Càlcul estimat de despeses notarials, registrals i de gestoria
  calculateExpenses(price, taxTypeId) {
    const taxConfig = Object.values(this.TAX_TYPES).find(t => t.id === taxTypeId) || this.TAX_TYPES.ITP_GENERAL;
    
    // Impost corresponent
    const taxAmount = price * taxConfig.rate;

    // Notaria (aranzel regulat basat en escala)
    let notary = 400 + (price * 0.0018);
    notary = Math.max(600, Math.min(1300, notary));

    // Registre de la Propietat (aranzel)
    let registry = 250 + (price * 0.0010);
    registry = Math.max(380, Math.min(800, registry));

    // Gestoria de compravenda (tarifa de mercat)
    const gestoria = 400;

    // Taxació homologada oficial
    let appraisal = 320 + (price > 300000 ? 100 : 0);

    const totalExpensesWithoutTax = notary + registry + gestoria + appraisal;
    const totalExpensesWithTax = taxAmount + totalExpensesWithoutTax;

    return {
      taxRate: taxConfig.rate,
      taxName: taxConfig.name,
      taxAmount: Math.round(taxAmount * 100) / 100,
      notary: Math.round(notary * 100) / 100,
      registry: Math.round(registry * 100) / 100,
      gestoria: Math.round(gestoria * 100) / 100,
      appraisal: Math.round(appraisal * 100) / 100,
      totalExpensesWithoutTax: Math.round(totalExpensesWithoutTax * 100) / 100,
      totalExpensesWithTax: Math.round(totalExpensesWithTax * 100) / 100
    };
  }
};
