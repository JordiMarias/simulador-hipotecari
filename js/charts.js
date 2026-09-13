/**
 * SIMULADOR HIPOTECARI - VISUALITZACIÓ I GRÀFICS INTERACTIUS
 * Integració amb Chart.js i estil corporatiu Digital Banking
 */

export class MortgageCharts {
  constructor() {
    this.donutChart = null;
    this.evolutionChart = null;
  }

  getThemeColors() {
    return {
      textColor: '#0f172a',
      mutedText: '#64748b',
      gridColor: '#edf2f7',
      cardBg: '#ffffff',
      navy: '#002b49',
      primary: '#007ea8',
      primaryBg: 'rgba(0, 126, 168, 0.12)',
      success: '#059669',
      successBg: 'rgba(5, 150, 105, 0.12)',
      warning: '#d97706',
      danger: '#dc2626'
    };
  }

  updateDonutChart(canvasId, { loanAmount, totalInterest, totalExpenses }) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === 'undefined') return;

    const colors = this.getThemeColors();

    const data = {
      labels: ['Capital Prestat', 'Interessos al Banc', 'Impostos i Despeses'],
      datasets: [{
        data: [loanAmount, totalInterest, totalExpenses],
        backgroundColor: [colors.primary, colors.danger, colors.warning],
        borderColor: '#ffffff',
        borderWidth: 3,
        hoverOffset: 6
      }]
    };

    if (this.donutChart) {
      this.donutChart.data = data;
      this.donutChart.options.plugins.legend.labels.color = colors.textColor;
      this.donutChart.update();
      return;
    }

    const ctx = canvas.getContext('2d');
    this.donutChart = new Chart(ctx, {
      type: 'doughnut',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        cutout: '68%',
        plugins: {
          legend: {
            position: 'bottom',
            labels: {
              color: colors.textColor,
              font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' },
              padding: 12,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                const val = context.parsed;
                const total = context.dataset.data.reduce((a, b) => a + b, 0);
                const pct = Math.round((val / total) * 1000) / 10;
                return ` ${context.label}: ${val.toLocaleString('ca-ES')} € (${pct}%)`;
              }
            }
          }
        }
      }
    });
  }

  updateEvolutionChart(canvasId, schedule) {
    const canvas = document.getElementById(canvasId);
    if (!canvas || typeof Chart === 'undefined') return;

    const colors = this.getThemeColors();

    const labels = schedule.map(row => `Any ${row.year}`);
    const remainingDebt = schedule.map(row => row.remainingBalance);
    const accumulatedWealth = schedule.map(row => row.cumulativeWealth);
    const accumulatedInterest = schedule.map(row => row.cumulativeInterest);

    const data = {
      labels,
      datasets: [
        {
          label: 'Patrimoni Acumulat (€)',
          data: accumulatedWealth,
          borderColor: colors.success,
          backgroundColor: colors.successBg,
          fill: true,
          tension: 0.3,
          borderWidth: 2.5,
          pointRadius: schedule.length > 25 ? 0 : 3,
          pointHoverRadius: 6
        },
        {
          label: 'Deute Restant (€)',
          data: remainingDebt,
          borderColor: colors.primary,
          backgroundColor: colors.primaryBg,
          fill: false,
          tension: 0.3,
          borderWidth: 2.5,
          pointRadius: schedule.length > 25 ? 0 : 3,
          pointHoverRadius: 6
        },
        {
          label: 'Interessos Acumulats (€)',
          data: colors.danger,
          borderColor: colors.danger,
          backgroundColor: 'transparent',
          borderDash: [5, 5],
          fill: false,
          tension: 0.3,
          borderWidth: 2,
          pointRadius: 0,
          pointHoverRadius: 5
        }
      ]
    };

    if (this.evolutionChart) {
      this.evolutionChart.data = data;
      this.evolutionChart.options.scales.x.ticks.color = colors.mutedText;
      this.evolutionChart.options.scales.x.grid.color = colors.gridColor;
      this.evolutionChart.options.scales.y.ticks.color = colors.mutedText;
      this.evolutionChart.options.scales.y.grid.color = colors.gridColor;
      this.evolutionChart.options.plugins.legend.labels.color = colors.textColor;
      this.evolutionChart.update();
      return;
    }

    const ctx = canvas.getContext('2d');
    this.evolutionChart = new Chart(ctx, {
      type: 'line',
      data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: 'index',
          intersect: false
        },
        scales: {
          x: {
            grid: { color: colors.gridColor },
            ticks: {
              color: colors.mutedText,
              font: { family: 'Plus Jakarta Sans', size: 11 },
              maxTicksLimit: 10
            }
          },
          y: {
            grid: { color: colors.gridColor },
            ticks: {
              color: colors.mutedText,
              font: { family: 'Plus Jakarta Sans', size: 11 },
              callback: val => (val >= 1000 ? `${(val / 1000).toFixed(0)}k €` : `${val} €`)
            }
          }
        },
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: colors.textColor,
              font: { family: 'Plus Jakarta Sans', size: 11, weight: '600' },
              padding: 10,
              usePointStyle: true,
              pointStyle: 'circle'
            }
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return ` ${context.dataset.label}: ${context.parsed.y.toLocaleString('ca-ES')} €`;
              }
            }
          }
        }
      }
    });
  }

  refreshThemes() {
    if (this.donutChart) {
      this.donutChart.destroy();
      this.donutChart = null;
    }
    if (this.evolutionChart) {
      this.evolutionChart.destroy();
      this.evolutionChart = null;
    }
  }
}
