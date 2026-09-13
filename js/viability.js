/**
 * SIMULADOR HIPOTECARI - MÒDUL D'AVALUACIÓ DE VIABILITAT
 * Validació de diners propis mínims en valor absolut (€) i ràtio d'endeutament (DSTI 35%)
 */

import { CONFIG } from './config.js';

export class ViabilityChecker {
  /**
   * Avalua la viabilitat financera global de l'operació
   * @param {Object} params - Paràmetres de l'operació
   * @returns {Object} Informe complet de viabilitat
   */
  static evaluate({
    propertyPrice,
    userFunds,
    expenses,
    monthlyPayment,
    netSalary = 0,
    years = 30,
    interestRate = 3.0
  }) {
    // 1. Càlculs de fons i despeses
    const totalExpenses = expenses.totalExpensesWithTax;
    const minDownPaymentForProperty = propertyPrice * (CONFIG.MIN_DOWN_PAYMENT_PCT / 100); // 20% mínim
    const minRequiredFunds = minDownPaymentForProperty + totalExpenses; // 20% + despeses
    
    // Entrada neta disponible per pagar el pis després de restar despeses
    const netDownPayment = Math.max(0, userFunds - totalExpenses);
    const effectiveDownPaymentPct = Math.round((netDownPayment / propertyPrice) * 1000) / 10;
    const loanAmount = Math.max(0, propertyPrice - netDownPayment);
    const ltvRatio = propertyPrice > 0 ? Math.round((loanAmount / propertyPrice) * 1000) / 10 : 0;

    // 2. Ràtio d'endeutament (DSTI)
    let dsti = null;
    let maxAffordableQuota = null;
    if (netSalary > 0) {
      dsti = Math.round((monthlyPayment / netSalary) * 1000) / 10;
      maxAffordableQuota = Math.round(netSalary * (CONFIG.MAX_DSTI_RECOMMENDED / 100) * 100) / 100;
    }

    // 3. Diferencial de diners propis
    const fundsDiff = Math.round((userFunds - minRequiredFunds) * 100) / 100;
    const hasEnoughFunds = userFunds >= minRequiredFunds;

    // 4. Determinació de l'estat de viabilitat
    let status = 'viable'; // 'viable' | 'warning' | 'unviable'
    let title = 'Hipoteca Viable';
    let summary = '';
    const alerts = [];
    const recommendations = [];

    // Validació de límit legal d'anys (> 40 anys)
    if (years > CONFIG.MAX_YEARS) {
      status = 'unviable';
      alerts.push(`El termini de ${years} anys supera el límit màxim habitual del mercat (40 anys).`);
    }

    // Validació estricta de Diners Propis suficients (Entrada 20% + Despeses)
    if (!hasEnoughFunds) {
      status = 'unviable';
      title = 'Hipoteca Inviable (Diners Propis Insuficients)';
      const missing = Math.abs(fundsDiff).toLocaleString('ca-ES');
      alerts.push(
        `Per a una vivenda de ${propertyPrice.toLocaleString('ca-ES')} €, necessites un mínim de **${minRequiredFunds.toLocaleString('ca-ES')} €** ` +
        `(${CONFIG.MIN_DOWN_PAYMENT_PCT}% d'entrada = ${minDownPaymentForProperty.toLocaleString('ca-ES')} € + ${totalExpenses.toLocaleString('ca-ES')} € de despeses i impostos). ` +
        `Et falten **${missing} €** de diners propis.`
      );
    } else {
      recommendations.push(
        `Aportant ${userFunds.toLocaleString('ca-ES')} €, cobreixes els ${totalExpenses.toLocaleString('ca-ES')} € de despeses i destines ` +
        `**${netDownPayment.toLocaleString('ca-ES')} € (${effectiveDownPaymentPct}%)** directament a l'entrada de l'immoble.`
      );
    }

    // Validació de la Ràtio d'Endeutament (Regla del 35%)
    if (netSalary > 0) {
      if (dsti > CONFIG.MAX_DSTI_RECOMMENDED) {
        status = 'unviable';
        if (hasEnoughFunds) {
          title = 'Hipoteca Inviable (Sobreendeutament > 35%)';
        }
        alerts.push(`La quota mensual (${monthlyPayment.toLocaleString('ca-ES')} €) representa el **${dsti}%** del teu sou net mensual, superant el màxim prudencial del 35%.`);
        
        const neededSalary = Math.round((monthlyPayment / 0.35) * 100) / 100;
        recommendations.push(`Caldria un sou net conjunt de com a mínim **${neededSalary.toLocaleString('ca-ES')} €/mes** per no superar el 35%.`);

        if (years < CONFIG.MAX_YEARS) {
          recommendations.push(`Pots provar d'ampliar el termini a més anys per reduir la quota mensual.`);
        }
        recommendations.push(`Aportar més diners propis reduirà el capital demanat i la quota.`);
      } else if (dsti > CONFIG.OPTIMAL_DSTI) {
        if (status !== 'unviable') {
          status = 'warning';
          title = 'Hipoteca al Límit Recomanat';
        }
        alerts.push(`La ràtio d'esforç (${dsti}%) està entre el 30% i el 35%. Els bancs podrien demanar avals o garanties addicionals.`);
      } else {
        summary = `Ràtio d'endeutament excel·lent (${dsti}%). La quota és perfectament assumible amb el teu salari net.`;
      }
    } else {
      if (hasEnoughFunds) {
        summary = `Disposes de diners suficients per a l'entrada mínima i despeses. Pots introduir el teu sou net per calcular la ràtio del 35%.`;
      }
    }

    if (status === 'viable' && !summary) {
      title = 'Hipoteca Viable i Saludable';
      summary = `L'operació compleix amb tots els criteris financers i bancaris a Catalunya.`;
    }

    return {
      status,
      title,
      summary,
      alerts,
      recommendations,
      dsti,
      maxAffordableQuota,
      minRequiredFunds: Math.round(minRequiredFunds * 100) / 100,
      minDownPaymentForProperty: Math.round(minDownPaymentForProperty * 100) / 100,
      netDownPayment: Math.round(netDownPayment * 100) / 100,
      effectiveDownPaymentPct,
      fundsDiff,
      hasEnoughFunds,
      loanAmount: Math.round(loanAmount * 100) / 100,
      ltvRatio
    };
  }
}
