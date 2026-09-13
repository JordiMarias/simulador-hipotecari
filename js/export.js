/**
 * SIMULADOR HIPOTECARI - EXPORTACIÓ A CSV I IMPRESSIÓ
 */

export class Exporter {
  /**
   * Exporta el quadre d'amortització a format CSV compatible amb Excel / LibreOffice
   * @param {Object} calcResult - Resultats del càlcul
   * @param {Object} params - Paràmetres principals de la simulació
   */
  static exportToCSV(calcResult, params) {
    const { schedule, totalPrincipalPaid, totalInterestPaid, totalVoluntaryPaid, finalWealth } = calcResult;

    const separator = ';'; // Separador estàndard europeu
    const rows = [];

    // Metadades de la simulació
    rows.push(['SIMULADOR HIPOTECARI - QUADRE D\'AMORTITZACIÓ'].join(separator));
    rows.push([
      `Preu Vivenda: ${params.propertyPrice} €`, 
      `Diners Propis Aportats: ${params.userFunds} €`,
      `Capital Prestat: ${params.loanAmount} €`, 
      `Termini: ${params.years} anys`, 
      `Interès TAE / TIN: ${params.interestRate} %`
    ].join(separator));
    rows.push([]);

    // Capçaleres
    rows.push([
      'Any',
      'Quota Mensual (€)',
      'Quota Obligada (€)',
      'Total Anual (€)',
      'Interessos Pagats (€)',
      'Deute Pagat (€)',
      'Amortització Voluntària (€)',
      'Deute Restant (€)',
      'Quotes Pendents (Mesos)',
      'Patrimoni Acumulat (€)'
    ].join(separator));

    // Files
    schedule.forEach(r => {
      rows.push([
        r.year,
        r.actualMonthlyPayment.toFixed(2).replace('.', ','),
        r.obligatoryMonthlyPayment.toFixed(2).replace('.', ','),
        r.annualTotal.toFixed(2).replace('.', ','),
        r.interestPaid.toFixed(2).replace('.', ','),
        r.principalPaid.toFixed(2).replace('.', ','),
        r.voluntaryAmortization.toFixed(2).replace('.', ','),
        r.remainingBalance.toFixed(2).replace('.', ','),
        r.remainingMonths,
        r.cumulativeWealth.toFixed(2).replace('.', ',')
      ].join(separator));
    });

    // Fila de totals
    rows.push([
      'TOTAL',
      '',
      '',
      (totalPrincipalPaid + totalInterestPaid).toFixed(2).replace('.', ','),
      totalInterestPaid.toFixed(2).replace('.', ','),
      totalPrincipalPaid.toFixed(2).replace('.', ','),
      totalVoluntaryPaid.toFixed(2).replace('.', ','),
      '0,00',
      '',
      finalWealth.toFixed(2).replace('.', ',')
    ].join(separator));

    const csvContent = '\uFEFF' + rows.join('\r\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `simulacio_hipoteca_${params.propertyPrice}eur_${params.years}anys.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Obre el diàleg del navegador per imprimir o desar en PDF
   */
  static printSchedule() {
    window.print();
  }
}
