/**
 * SIMULADOR HIPOTECARI - MOTOR DE CÀLCUL MATEMÀTIC
 * Sistema francès amb quota obligada, quota personalitzada superior i amortitzacions extraordinàries
 */

export class MortgageCalculator {
  /**
   * Calcula la quota mensual obligada segons el sistema francès
   * @param {number} principal - Capital pendent (€)
   * @param {number} annualRatePct - Tipus d'interès nominal anual (%)
   * @param {number} totalMonths - Mesos restants del préstec
   * @returns {number} Quota mensual (€)
   */
  static calculateMonthlyPayment(principal, annualRatePct, totalMonths) {
    if (principal <= 0 || totalMonths <= 0) return 0;
    
    const monthlyRate = (annualRatePct / 100) / 12;
    if (monthlyRate === 0) {
      return principal / totalMonths;
    }

    const factor = Math.pow(1 + monthlyRate, totalMonths);
    const payment = principal * ((monthlyRate * factor) / (factor - 1));
    return Math.round(payment * 100) / 100;
  }

  /**
   * Genera el quadre complet d'amortització any a any
   * 
   * @param {number} principal - Capital prestat inicial (€)
   * @param {number} annualRatePct - Tipus d'interès anual TAE / TIN (%)
   * @param {number} totalYears - Termini en anys (màx 40)
   * @param {number} downPayment - Diners propis d'entrada (€)
   * @param {Object} voluntaryAmortizations - Mapa de { [any]: quantitat_extra }
   * @param {Object} customQuotas - Mapa de { [any]: quota_mensual_volguda }
   * @returns {Object} Resultat complet del quadre d'amortització
   */
  static generateSchedule(
    principal, 
    annualRatePct, 
    totalYears, 
    downPayment = 0, 
    voluntaryAmortizations = {},
    customQuotas = {}
  ) {
    const monthlyRate = (annualRatePct / 100) / 12;
    let remainingPrincipal = principal;
    const totalMonths = totalYears * 12;
    
    const schedule = [];
    let totalInterestPaid = 0;
    let totalPrincipalPaid = 0;
    let totalVoluntaryPaid = 0;
    let cumulativeWealth = downPayment;
    let isFullyPaid = false;
    let actualPayoffYear = totalYears;
    let actualPayoffMonth = totalMonths;

    for (let year = 1; year <= totalYears; year++) {
      if (remainingPrincipal <= 0.01) {
        // La hipoteca ja ha estat liquidada abans
        schedule.push({
          year,
          obligatoryMonthlyPayment: 0,
          customMonthlyPayment: 0,
          actualMonthlyPayment: 0,
          annualTotal: 0,
          interestPaid: 0,
          principalPaid: 0,
          voluntaryAmortization: 0,
          remainingBalance: 0,
          remainingMonths: 0,
          cumulativeWealth: downPayment + principal,
          cumulativeInterest: totalInterestPaid,
          isPaidOff: true,
          isPayoffEvent: false
        });
        continue;
      }

      // Mesos restants a l'inici d'aquest any
      const monthsLeftAtYearStart = (totalYears - year + 1) * 12;
      
      // Quota mensual OBLIGADA pel banc segons la fórmula francesa
      const obligatoryMonthlyPayment = this.calculateMonthlyPayment(remainingPrincipal, annualRatePct, monthsLeftAtYearStart);

      // Quota que l'usuari vol pagar (si és superior a l'obligada, accelera l'amortització)
      let customQuota = parseFloat(customQuotas[year]);
      if (isNaN(customQuota) || customQuota <= 0) {
        customQuota = obligatoryMonthlyPayment;
      }

      // La quota real no pot ser inferior a l'obligada
      const actualMonthlyPayment = Math.max(customQuota, obligatoryMonthlyPayment);

      let yearInterest = 0;
      let yearPrincipal = 0;
      let monthsActiveInYear = 0;

      // Càlcul detallat mes a mes per a l'any actual
      for (let m = 1; m <= 12; m++) {
        if (remainingPrincipal <= 0.01) break;

        monthsActiveInYear++;
        const monthInterest = remainingPrincipal * monthlyRate;
        let monthPrincipal = actualMonthlyPayment - monthInterest;

        if (monthPrincipal > remainingPrincipal) {
          monthPrincipal = remainingPrincipal;
        }

        yearInterest += monthInterest;
        yearPrincipal += monthPrincipal;
        remainingPrincipal -= monthPrincipal;

        if (remainingPrincipal <= 0.01) {
          remainingPrincipal = 0;
          if (!isFullyPaid) {
            isFullyPaid = true;
            actualPayoffYear = year;
            actualPayoffMonth = (year - 1) * 12 + m;
          }
        }
      }

      // Amortització voluntària extraordinària a final d'any
      let voluntary = parseFloat(voluntaryAmortizations[year]) || 0;
      if (voluntary < 0) voluntary = 0;

      let isPayoffThisYear = false;

      if (remainingPrincipal > 0 && voluntary > 0) {
        if (voluntary >= remainingPrincipal) {
          voluntary = remainingPrincipal;
          remainingPrincipal = 0;
          isPayoffThisYear = true;
          if (!isFullyPaid) {
            isFullyPaid = true;
            actualPayoffYear = year;
            actualPayoffMonth = year * 12;
          }
        } else {
          remainingPrincipal -= voluntary;
        }
      }

      if (remainingPrincipal <= 0.01) {
        remainingPrincipal = 0;
        isPayoffThisYear = true;
      }

      totalInterestPaid += yearInterest;
      totalPrincipalPaid += yearPrincipal;
      totalVoluntaryPaid += voluntary;
      cumulativeWealth += yearPrincipal + voluntary;

      const remainingMonths = remainingPrincipal > 0 ? (totalYears - year) * 12 : 0;

      schedule.push({
        year,
        obligatoryMonthlyPayment: Math.round(obligatoryMonthlyPayment * 100) / 100,
        customMonthlyPayment: Math.round(customQuota * 100) / 100,
        actualMonthlyPayment: Math.round(actualMonthlyPayment * 100) / 100,
        annualTotal: Math.round((yearInterest + yearPrincipal) * 100) / 100,
        interestPaid: Math.round(yearInterest * 100) / 100,
        principalPaid: Math.round(yearPrincipal * 100) / 100,
        voluntaryAmortization: Math.round(voluntary * 100) / 100,
        remainingBalance: Math.round(remainingPrincipal * 100) / 100,
        remainingMonths,
        cumulativeWealth: Math.round(cumulativeWealth * 100) / 100,
        cumulativeInterest: Math.round(totalInterestPaid * 100) / 100,
        isPaidOff: remainingPrincipal <= 0,
        isPayoffEvent: isPayoffThisYear
      });
    }

    // Càlcul de l'escenari base (sense sobrequotes ni amortitzacions extres)
    const baseSchedule = this.generateBaselineSchedule(principal, annualRatePct, totalYears);

    const interestSaved = Math.max(0, baseSchedule.totalInterest - totalInterestPaid);
    const yearsSaved = Math.max(0, totalYears - actualPayoffYear);

    return {
      schedule,
      initialObligatoryPayment: schedule[0]?.obligatoryMonthlyPayment || 0,
      initialMonthlyPayment: schedule[0]?.actualMonthlyPayment || 0,
      totalInterestPaid: Math.round(totalInterestPaid * 100) / 100,
      totalPrincipalPaid: Math.round(totalPrincipalPaid * 100) / 100,
      totalVoluntaryPaid: Math.round(totalVoluntaryPaid * 100) / 100,
      totalPaidToBank: Math.round((totalPrincipalPaid + totalInterestPaid + totalVoluntaryPaid) * 100) / 100,
      finalWealth: Math.round(cumulativeWealth * 100) / 100,
      actualPayoffYear,
      actualPayoffMonth,
      interestSaved: Math.round(interestSaved * 100) / 100,
      yearsSaved,
      baseTotalInterest: baseSchedule.totalInterest
    };
  }

  /**
   * Escenari base purament obligatori sense amortitzacions addicionals
   */
  static generateBaselineSchedule(principal, annualRatePct, totalYears) {
    const monthlyRate = (annualRatePct / 100) / 12;
    const totalMonths = totalYears * 12;
    const monthlyPayment = this.calculateMonthlyPayment(principal, annualRatePct, totalMonths);
    
    let balance = principal;
    let totalInterest = 0;

    for (let m = 1; m <= totalMonths; m++) {
      const interest = balance * monthlyRate;
      const amort = monthlyPayment - interest;
      totalInterest += interest;
      balance -= amort;
    }

    return {
      monthlyPayment,
      totalInterest: Math.round(totalInterest * 100) / 100,
      totalCost: Math.round((principal + totalInterest) * 100) / 100
    };
  }
}
