/**
 * SIMULADOR HIPOTECARI - CONTROLADOR PRINCIPAL
 * Gestió de diners propis en valor absolut (€), quota obligada vs desitjada i reactivitat
 */

import { CONFIG } from './config.js';
import { MortgageCalculator } from './mortgage-calc.js';
import { ViabilityChecker } from './viability.js';
import { MortgageCharts } from './charts.js';
import { TableRenderer } from './table-renderer.js';
import { Exporter } from './export.js';

class MortgageApp {
  constructor() {
    this.charts = new MortgageCharts();
    this.voluntaryAmortizations = {};
    this.customQuotas = {};

    this.state = {
      propertyPrice: CONFIG.DEFAULT_PROPERTY_PRICE,
      userFunds: CONFIG.DEFAULT_DOWN_PAYMENT_FUNDS, // Valor absolut en €
      interestRate: CONFIG.DEFAULT_INTEREST_RATE,
      years: CONFIG.DEFAULT_YEARS,
      taxTypeId: 'itp_general',
      netSalary: 0
    };

    this.init();
  }

  init() {
    this.bindDomElements();
    this.initTheme();
    this.bindEvents();
    this.recalculate();
  }

  bindDomElements() {
    // Inputs & Sliders
    this.priceInput = document.getElementById('inputPrice');
    this.priceSlider = document.getElementById('sliderPrice');

    this.fundsInput = document.getElementById('inputFunds');
    this.fundsSlider = document.getElementById('sliderFunds');
    this.fundsPctDisplay = document.getElementById('fundsPctDisplay');

    this.interestInput = document.getElementById('inputInterest');
    this.interestSlider = document.getElementById('sliderInterest');

    this.yearsInput = document.getElementById('inputYears');
    this.yearsSlider = document.getElementById('sliderYears');

    this.salaryInput = document.getElementById('inputSalary');

    // Selectors d'impostos
    this.taxCards = document.querySelectorAll('.tax-card-option');

    // Despeses detallades
    this.expensesToggle = document.getElementById('btnToggleExpenses');
    this.expensesBox = document.getElementById('expensesBreakdownBox');

    // Elements de Despeses
    this.taxNameLabel = document.getElementById('expTaxName');
    this.taxAmountVal = document.getElementById('expTaxAmount');
    this.notaryVal = document.getElementById('expNotary');
    this.registryVal = document.getElementById('expRegistry');
    this.gestoriaVal = document.getElementById('expGestoria');
    this.appraisalVal = document.getElementById('expAppraisal');
    this.totalExpensesVal = document.getElementById('expTotal');

    // Indicadors de Viabilitat
    this.viabilityBanner = document.getElementById('viabilityBanner');
    this.viabilityTitle = document.getElementById('viabilityTitle');
    this.viabilityBody = document.getElementById('viabilityBody');
    this.meterDstiVal = document.getElementById('meterDstiVal');
    this.meterDstiFill = document.getElementById('meterDstiFill');
    this.meterFundsVal = document.getElementById('meterFundsVal');
    this.meterFundsFill = document.getElementById('meterFundsFill');

    // Targetes KPI
    this.kpiMonthlyQuota = document.getElementById('kpiMonthlyQuota');
    this.kpiObligatoryQuota = document.getElementById('kpiObligatoryQuota');
    this.kpiLoanAmount = document.getElementById('kpiLoanAmount');
    this.kpiTotalInterest = document.getElementById('kpiTotalInterest');
    this.kpiTotalCost = document.getElementById('kpiTotalCost');
    this.kpiFundsNeeded = document.getElementById('kpiFundsNeeded');
    this.kpiFundsNeededPct = document.getElementById('kpiFundsNeededPct');
    this.kpiDstiRatio = document.getElementById('kpiDstiRatio');

    // Botons d'acció
    this.themeToggleBtn = document.getElementById('btnThemeToggle');
    this.exportCsvBtn = document.getElementById('btnExportCsv');
    this.printBtn = document.getElementById('btnPrint');
    this.clearAmortizationsBtn = document.getElementById('btnClearAmortizations');
    this.batchAmortizationBtn = document.getElementById('btnBatchAmortization');
    this.keepInitialQuotaBtn = document.getElementById('btnKeepInitialQuota');

    // Modal d'amortització massiva
    this.batchModal = document.getElementById('batchModal');
    this.closeModalBtn = document.getElementById('btnCloseModal');
    this.cancelModalBtn = document.getElementById('btnCancelModal');
    this.applyBatchAmortBtn = document.getElementById('btnApplyBatchAmort');
    this.batchAmountInput = document.getElementById('batchAmountInput');
    this.batchStartYearInput = document.getElementById('batchStartYearInput');
    this.batchEndYearInput = document.getElementById('batchEndYearInput');
  }

  initTheme() {
    const savedTheme = localStorage.getItem('sh_theme') || 'dark';
    document.documentElement.setAttribute('data-theme', savedTheme);
    this.updateThemeIcon(savedTheme);
  }

  updateThemeIcon(theme) {
    if (!this.themeToggleBtn) return;
    this.themeToggleBtn.innerHTML = theme === 'light' 
      ? `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"></path></svg>`
      : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"></circle><line x1="12" y1="1" x2="12" y2="3"></line><line x1="12" y1="21" x2="12" y2="23"></line><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"></line><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"></line><line x1="1" y1="12" x2="3" y2="12"></line><line x1="21" y1="12" x2="23" y2="12"></line><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"></line><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"></line></svg>`;
  }

  toggleTheme() {
    const currentTheme = document.documentElement.getAttribute('data-theme') || 'dark';
    const nextTheme = currentTheme === 'dark' ? 'light' : 'dark';
    document.documentElement.setAttribute('data-theme', nextTheme);
    localStorage.setItem('sh_theme', nextTheme);
    this.updateThemeIcon(nextTheme);
    this.charts.refreshThemes();
    this.recalculate();
  }

  bindEvents() {
    // 1. Sincronització de Preu
    this.priceInput.addEventListener('input', e => {
      const raw = parseFloat(e.target.value);
      if (!isNaN(raw) && raw >= 0) {
        this.state.propertyPrice = raw;
        this.priceSlider.value = Math.min(1000000, Math.max(50000, raw));
        this.updateFundsSliderMax();
        this.recalculate();
      }
    });
    this.priceInput.addEventListener('blur', e => {
      let val = parseFloat(e.target.value) || 20000;
      val = Math.max(10000, Math.min(5000000, val));
      this.state.propertyPrice = val;
      this.priceInput.value = val;
      this.priceSlider.value = Math.min(1000000, Math.max(50000, val));
      this.updateFundsSliderMax();
      this.recalculate();
    });
    this.priceSlider.addEventListener('input', e => {
      const val = parseFloat(e.target.value);
      this.state.propertyPrice = val;
      this.priceInput.value = val;
      this.updateFundsSliderMax();
      this.recalculate();
    });

    // 2. Sincronització de Diners Propis (Valor Absolut en €)
    this.fundsInput.addEventListener('input', e => {
      const raw = parseFloat(e.target.value);
      if (!isNaN(raw) && raw >= 0) {
        this.state.userFunds = raw;
        this.fundsSlider.value = Math.min(parseFloat(this.fundsSlider.max), raw);
        this.recalculate();
      }
    });
    this.fundsInput.addEventListener('blur', e => {
      let val = parseFloat(e.target.value);
      if (isNaN(val) || val < 0) val = 0;
      this.state.userFunds = val;
      this.fundsInput.value = val;
      this.fundsSlider.value = Math.min(parseFloat(this.fundsSlider.max), val);
      this.recalculate();
    });
    this.fundsSlider.addEventListener('input', e => {
      const val = parseFloat(e.target.value);
      this.state.userFunds = val;
      this.fundsInput.value = val;
      this.recalculate();
    });

    // 3. Sincronització d'Interès TAE / TIN
    this.interestInput.addEventListener('input', e => {
      const raw = parseFloat(e.target.value);
      if (!isNaN(raw) && raw >= 0) {
        this.state.interestRate = raw;
        this.interestSlider.value = Math.min(8.0, Math.max(0.5, raw));
        this.recalculate();
      }
    });
    this.interestInput.addEventListener('blur', e => {
      let val = parseFloat(e.target.value);
      if (isNaN(val) || val < 0) val = 0;
      val = Math.min(20, val);
      this.state.interestRate = val;
      this.interestInput.value = val;
      this.interestSlider.value = Math.min(8.0, Math.max(0.5, val));
      this.recalculate();
    });
    this.interestSlider.addEventListener('input', e => {
      const val = parseFloat(e.target.value);
      this.state.interestRate = val;
      this.interestInput.value = val;
      this.recalculate();
    });

    // 4. Sincronització d'Anys
    this.yearsInput.addEventListener('input', e => {
      const raw = parseInt(e.target.value, 10);
      if (!isNaN(raw) && raw >= 1) {
        this.state.years = Math.min(CONFIG.MAX_YEARS, raw);
        this.yearsSlider.value = this.state.years;
        this.recalculate();
      }
    });
    this.yearsInput.addEventListener('blur', e => {
      let val = parseInt(e.target.value, 10) || 1;
      val = Math.max(1, Math.min(CONFIG.MAX_YEARS, val));
      this.state.years = val;
      this.yearsInput.value = val;
      this.yearsSlider.value = val;
      this.recalculate();
    });
    this.yearsSlider.addEventListener('input', e => {
      const val = parseInt(e.target.value, 10);
      this.state.years = val;
      this.yearsInput.value = val;
      this.recalculate();
    });

    // 5. Salari Net Mensual
    this.salaryInput.addEventListener('input', e => {
      this.state.netSalary = parseFloat(e.target.value) || 0;
      this.recalculate();
    });

    // 6. Selector d'impostos
    this.taxCards.forEach(card => {
      card.addEventListener('click', () => {
        this.taxCards.forEach(c => c.classList.remove('active'));
        card.classList.add('active');
        this.state.taxTypeId = card.dataset.taxType;
        this.recalculate();
      });
    });

    // 7. Desplegable de despeses
    this.expensesToggle.addEventListener('click', () => {
      const isHidden = this.expensesBox.style.display === 'none';
      this.expensesBox.style.display = isHidden ? 'flex' : 'none';
      this.expensesToggle.querySelector('.toggle-icon').textContent = isHidden ? '▲' : '▼';
    });

    // 8. Botons d'acció
    if (this.themeToggleBtn) {
      this.themeToggleBtn.addEventListener('click', () => this.toggleTheme());
    }
    if (this.exportCsvBtn) {
      this.exportCsvBtn.addEventListener('click', () => this.handleExportCsv());
    }
    if (this.printBtn) {
      this.printBtn.addEventListener('click', () => Exporter.printSchedule());
    }

    if (this.clearAmortizationsBtn) {
      this.clearAmortizationsBtn.addEventListener('click', () => {
        this.voluntaryAmortizations = {};
        this.customQuotas = {};
        this.recalculate();
      });
    }

    if (this.keepInitialQuotaBtn) {
      this.keepInitialQuotaBtn.addEventListener('click', () => {
        this.applyInitialQuotaToAllYears();
      });
    }

    // Modal d'amortització recurrent
    if (this.batchAmortizationBtn) {
      this.batchAmortizationBtn.addEventListener('click', () => this.openBatchModal());
    }
    if (this.closeModalBtn) {
      this.closeModalBtn.addEventListener('click', () => this.closeBatchModal());
    }
    if (this.cancelModalBtn) {
      this.cancelModalBtn.addEventListener('click', () => this.closeBatchModal());
    }
    if (this.applyBatchAmortBtn) {
      this.applyBatchAmortBtn.addEventListener('click', () => this.applyBatchAmortization());
    }

    window.addEventListener('click', (e) => {
      if (e.target === this.batchModal) this.closeBatchModal();
    });
  }

  updateFundsSliderMax() {
    const maxFunds = Math.max(200000, this.state.propertyPrice * 1.15);
    this.fundsSlider.max = Math.round(maxFunds);
  }

  applyInitialQuotaToAllYears() {
    const expenses = CONFIG.calculateExpenses(this.state.propertyPrice, this.state.taxTypeId);
    const netDownPayment = Math.max(0, this.state.userFunds - expenses.totalExpensesWithTax);
    const loanAmount = Math.max(0, this.state.propertyPrice - netDownPayment);
    const initialQuota = MortgageCalculator.calculateMonthlyPayment(loanAmount, this.state.interestRate, this.state.years * 12);

    for (let y = 1; y <= this.state.years; y++) {
      this.customQuotas[y] = initialQuota;
    }
    this.recalculate();
  }

  openBatchModal() {
    this.batchStartYearInput.value = 1;
    this.batchEndYearInput.value = this.state.years;
    this.batchModal.classList.add('active');
  }

  closeBatchModal() {
    this.batchModal.classList.remove('active');
  }

  applyBatchAmortization() {
    const amount = parseFloat(this.batchAmountInput.value) || 0;
    const start = Math.max(1, parseInt(this.batchStartYearInput.value, 10) || 1);
    const end = Math.min(this.state.years, parseInt(this.batchEndYearInput.value, 10) || this.state.years);

    if (amount > 0 && start <= end) {
      for (let y = start; y <= end; y++) {
        this.voluntaryAmortizations[y] = amount;
      }
      this.closeBatchModal();
      this.recalculate();
    }
  }

  handleExportCsv() {
    const expenses = CONFIG.calculateExpenses(this.state.propertyPrice, this.state.taxTypeId);
    const netDownPayment = Math.max(0, this.state.userFunds - expenses.totalExpensesWithTax);
    const loanAmount = Math.max(0, this.state.propertyPrice - netDownPayment);

    const calcResult = MortgageCalculator.generateSchedule(
      loanAmount,
      this.state.interestRate,
      this.state.years,
      netDownPayment,
      this.voluntaryAmortizations,
      this.customQuotas
    );

    Exporter.exportToCSV(calcResult, {
      propertyPrice: this.state.propertyPrice,
      userFunds: this.state.userFunds,
      loanAmount,
      years: this.state.years,
      interestRate: this.state.interestRate
    });
  }

  recalculate() {
    const { propertyPrice, userFunds, interestRate, years, taxTypeId, netSalary } = this.state;

    // 1. Càlcul de despeses i impostos
    const expenses = CONFIG.calculateExpenses(propertyPrice, taxTypeId);

    // 2. Avaluació de Viabilitat inicial
    const baseViability = ViabilityChecker.evaluate({
      propertyPrice,
      userFunds,
      expenses,
      monthlyPayment: 0,
      netSalary,
      years,
      interestRate
    });

    const loanAmount = baseViability.loanAmount;
    const netDownPayment = baseViability.netDownPayment;

    // 3. Percentatge de diners propis respecte al pis
    const fundsPct = propertyPrice > 0 ? Math.round((userFunds / propertyPrice) * 1000) / 10 : 0;
    if (this.fundsPctDisplay) {
      this.fundsPctDisplay.textContent = `${fundsPct}% del pis (${baseViability.effectiveDownPaymentPct}% net entrada)`;
      this.fundsPctDisplay.style.color = baseViability.hasEnoughFunds ? 'var(--primary)' : 'var(--danger)';
    }

    // Actualitzar despeses a la UI
    this.taxNameLabel.textContent = expenses.taxName;
    this.taxAmountVal.textContent = `${expenses.taxAmount.toLocaleString('ca-ES')} €`;
    this.notaryVal.textContent = `${expenses.notary.toLocaleString('ca-ES')} €`;
    this.registryVal.textContent = `${expenses.registry.toLocaleString('ca-ES')} €`;
    this.gestoriaVal.textContent = `${expenses.gestoria.toLocaleString('ca-ES')} €`;
    this.appraisalVal.textContent = `${expenses.appraisal.toLocaleString('ca-ES')} €`;
    this.totalExpensesVal.textContent = `${expenses.totalExpensesWithTax.toLocaleString('ca-ES')} €`;

    // 4. Càlcul del quadre d'amortització francès
    const calcResult = MortgageCalculator.generateSchedule(
      loanAmount,
      interestRate,
      years,
      netDownPayment,
      this.voluntaryAmortizations,
      this.customQuotas
    );

    const actualMonthlyPayment = calcResult.initialMonthlyPayment;
    const obligatoryMonthlyPayment = calcResult.initialObligatoryPayment;

    // 5. Avaluació completa de Viabilitat amb la quota real
    const viability = ViabilityChecker.evaluate({
      propertyPrice,
      userFunds,
      expenses,
      monthlyPayment: actualMonthlyPayment,
      netSalary,
      years,
      interestRate
    });

    // Actualitzar panell de viabilitat
    this.updateViabilityUI(viability);

    // Actualitzar targetes KPI
    this.kpiMonthlyQuota.textContent = `${actualMonthlyPayment.toLocaleString('ca-ES', { minimumFractionDigits: 2 })} €`;
    if (this.kpiObligatoryQuota) {
      this.kpiObligatoryQuota.textContent = `Obligada: ${obligatoryMonthlyPayment.toLocaleString('ca-ES', { minimumFractionDigits: 2 })} €`;
    }
    this.kpiLoanAmount.textContent = `${loanAmount.toLocaleString('ca-ES')} €`;
    this.kpiTotalInterest.textContent = `${calcResult.totalInterestPaid.toLocaleString('ca-ES')} €`;
    this.kpiTotalCost.textContent = `${(loanAmount + calcResult.totalInterestPaid + expenses.totalExpensesWithTax).toLocaleString('ca-ES')} €`;
    this.kpiFundsNeeded.textContent = `${viability.minRequiredFunds.toLocaleString('ca-ES')} €`;
    
    const minPct = propertyPrice > 0 ? Math.round((viability.minRequiredFunds / propertyPrice) * 1000) / 10 : 0;
    this.kpiFundsNeededPct.textContent = `Mín. ${minPct}% del pis`;

    if (viability.dsti !== null) {
      this.kpiDstiRatio.textContent = `${viability.dsti}%`;
      this.kpiDstiRatio.style.color = viability.dsti > 35 ? 'var(--danger)' : (viability.dsti > 30 ? 'var(--warning)' : 'var(--success)');
    } else {
      this.kpiDstiRatio.textContent = '—';
      this.kpiDstiRatio.style.color = 'var(--text-primary)';
    }

    // Renderitzar taula interactiva d'amortització
    TableRenderer.render(
      'tableContainer',
      calcResult,
      this.voluntaryAmortizations,
      this.customQuotas,
      (year, newQuota) => {
        if (newQuota > 0) {
          this.customQuotas[year] = newQuota;
        } else {
          delete this.customQuotas[year];
        }
        this.recalculate();
      },
      (year, newAmort) => {
        if (newAmort > 0) {
          this.voluntaryAmortizations[year] = newAmort;
        } else {
          delete this.voluntaryAmortizations[year];
        }
        this.recalculate();
      }
    );

    // Actualitzar gràfics
    this.charts.updateDonutChart('donutChartCanvas', {
      loanAmount,
      totalInterest: calcResult.totalInterestPaid,
      totalExpenses: expenses.totalExpensesWithTax
    });

    this.charts.updateEvolutionChart('evolutionChartCanvas', calcResult.schedule);
  }

  updateViabilityUI(viability) {
    this.viabilityBanner.className = `viability-banner ${viability.status}`;
    this.viabilityTitle.textContent = viability.title;

    let bodyHtml = '';
    if (viability.alerts.length > 0) {
      bodyHtml += `<ul style="padding-left: 1.25rem; margin-bottom: 0.4rem; color: var(--danger); font-weight: 500;">`;
      viability.alerts.forEach(a => {
        bodyHtml += `<li>${a}</li>`;
      });
      bodyHtml += `</ul>`;
    }

    if (viability.summary) {
      bodyHtml += `<p style="margin-bottom: 0.4rem;">${viability.summary}</p>`;
    }

    if (viability.recommendations.length > 0) {
      bodyHtml += `<ul style="padding-left: 1.25rem; font-size: 0.8rem; color: var(--text-secondary);">`;
      viability.recommendations.forEach(r => {
        bodyHtml += `<li>${r}</li>`;
      });
      bodyHtml += `</ul>`;
    }

    this.viabilityBody.innerHTML = bodyHtml;

    // Barra DSTI
    if (viability.dsti !== null) {
      this.meterDstiVal.textContent = `${viability.dsti}% (Màx 35%)`;
      const fillPct = Math.min(100, (viability.dsti / 40) * 100);
      this.meterDstiFill.style.width = `${fillPct}%`;
      this.meterDstiFill.style.backgroundColor = viability.dsti > 35 ? 'var(--danger)' : (viability.dsti > 30 ? 'var(--warning)' : 'var(--success)');
    } else {
      this.meterDstiVal.textContent = 'Introdueix sou net';
      this.meterDstiFill.style.width = '0%';
    }

    // Barra Diners Propis vs Mínim
    const fundsPct = Math.min(100, (this.state.userFunds / viability.minRequiredFunds) * 100);
    this.meterFundsVal.textContent = `${this.state.userFunds.toLocaleString('ca-ES')} € / ${viability.minRequiredFunds.toLocaleString('ca-ES')} € requerits`;
    this.meterFundsFill.style.width = `${fundsPct}%`;
    this.meterFundsFill.style.backgroundColor = viability.hasEnoughFunds ? 'var(--success)' : 'var(--danger)';
  }
}

// Inicialització quan el DOM està a punt
document.addEventListener('DOMContentLoaded', () => {
  window.app = new MortgageApp();
});
