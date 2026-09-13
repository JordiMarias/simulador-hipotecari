/**
 * SIMULADOR HIPOTECARI - RENDERITZADOR DE LA TAULA INTERACTIVA
 * Suport per a columna 'Quota' (personalitzable) i 'Quota Obligada' (bancària)
 */

export class TableRenderer {
  /**
   * Renderitza o actualitza in-situ la taula d'amortització completa
   * @param {string} containerId - ID de l'element contenidor de la taula
   * @param {Object} calcResult - Resultat de MortgageCalculator.generateSchedule
   * @param {Object} voluntaryAmortizations - Mapa d'amortitzacions extraordinàries { [any]: import }
   * @param {Object} customQuotas - Mapa de quotes mensuals desitjades { [any]: quota }
   * @param {Function} onQuotaChange - Callback en canviar una quota mensual
   * @param {Function} onAmortizationChange - Callback en canviar una amortització extraordinària
   */
  static render(
    containerId, 
    calcResult, 
    voluntaryAmortizations, 
    customQuotas, 
    onQuotaChange, 
    onAmortizationChange
  ) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const { 
      schedule, 
      interestSaved, 
      yearsSaved, 
      totalPrincipalPaid, 
      totalInterestPaid, 
      totalVoluntaryPaid, 
      finalWealth 
    } = calcResult;

    // 1. Caixa de resum d'estalvi
    const hasCustomSavings = interestSaved > 0 || yearsSaved > 0;
    let summaryBox = container.querySelector('.savings-summary-box');
    if (hasCustomSavings) {
      const summaryHtml = `
        <div>
          <span style="font-size: 0.85rem; color: var(--text-secondary); display: block;">Estalvi Total en Interessos</span>
          <span class="highlight-val">${interestSaved.toLocaleString('ca-ES')} €</span>
        </div>
        <div>
          <span style="font-size: 0.85rem; color: var(--text-secondary); display: block;">Temps Estalviat de la Hipoteca</span>
          <span class="highlight-val">${yearsSaved} ${yearsSaved === 1 ? 'any' : 'anys'}</span>
        </div>
        <div>
          <span style="font-size: 0.85rem; color: var(--text-secondary); display: block;">Total Amortitzat Extraordinari</span>
          <span style="font-size: 1.15rem; font-weight: 700; color: var(--primary);">${totalVoluntaryPaid.toLocaleString('ca-ES')} €</span>
        </div>
      `;
      if (!summaryBox) {
        summaryBox = document.createElement('div');
        summaryBox.className = 'savings-summary-box';
        container.insertBefore(summaryBox, container.firstChild);
      }
      summaryBox.innerHTML = summaryHtml;
      summaryBox.style.display = 'flex';
    } else if (summaryBox) {
      summaryBox.style.display = 'none';
    }

    const tbody = container.querySelector('.amortization-table tbody');
    const tfoot = container.querySelector('.amortization-table tfoot');

    // 2. Si la taula ja existeix amb el mateix nombre de files, actualitzar les cel·les in-situ
    if (tbody && tbody.children.length === schedule.length) {
      schedule.forEach((row, idx) => {
        const tr = tbody.children[idx];
        const isPaidOff = row.isPaidOff && row.remainingBalance <= 0 && row.annualTotal === 0 && row.voluntaryAmortization === 0;
        const isPayoffEvent = row.isPayoffEvent;

        tr.className = isPaidOff ? 'row-paid-off' : (isPayoffEvent ? 'row-payoff-event' : '');

        tr.querySelector('.col-year').innerHTML = `
          ${row.year}
          ${isPayoffEvent ? '<span class="badge badge-success" style="margin-left: 4px; font-size: 0.65rem;">🎉 Liquidada!</span>' : ''}
        `;

        // Quota editable (Quota que es paga)
        const quotaInput = tr.querySelector('.table-input-quota');
        if (quotaInput && document.activeElement !== quotaInput) {
          const customVal = customQuotas[row.year] || '';
          quotaInput.value = customVal || (row.actualMonthlyPayment > 0 ? row.actualMonthlyPayment.toFixed(2) : '');
          quotaInput.classList.toggle('has-value', Boolean(customVal && customVal > row.obligatoryMonthlyPayment));
          quotaInput.disabled = isPaidOff;
        }

        // Quota Obligada
        tr.querySelector('.col-obligatory').textContent = row.obligatoryMonthlyPayment > 0 
          ? `${row.obligatoryMonthlyPayment.toLocaleString('ca-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` 
          : '—';

        // Total Anual
        tr.querySelector('.col-annual').textContent = row.annualTotal > 0 
          ? `${row.annualTotal.toLocaleString('ca-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` 
          : '0,00 €';

        // Interessos i Deute pagat
        tr.querySelector('.col-interest').textContent = row.interestPaid > 0 
          ? `${row.interestPaid.toLocaleString('ca-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` 
          : '0,00 €';
        tr.querySelector('.col-principal').textContent = row.principalPaid > 0 
          ? `${row.principalPaid.toLocaleString('ca-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` 
          : '0,00 €';

        // Amortització voluntària extraordinària
        const amortInput = tr.querySelector('.table-input-amort');
        if (amortInput && document.activeElement !== amortInput) {
          const curAmort = voluntaryAmortizations[row.year] || '';
          amortInput.value = curAmort;
          amortInput.classList.toggle('has-value', Boolean(curAmort));
          amortInput.disabled = isPaidOff;
        }

        // Deute restant, quotes pendents i patrimoni
        tr.querySelector('.col-balance').textContent = `${row.remainingBalance.toLocaleString('ca-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
        tr.querySelector('.col-months').textContent = row.remainingMonths;
        tr.querySelector('.col-wealth').textContent = `${row.cumulativeWealth.toLocaleString('ca-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €`;
      });

      // Actualitzar tfoot
      if (tfoot) {
        const totalAnnualPaid = Math.round((totalPrincipalPaid + totalInterestPaid) * 100) / 100;
        tfoot.querySelector('.foot-annual').textContent = `${totalAnnualPaid.toLocaleString('ca-ES', { minimumFractionDigits: 2 })} €`;
        tfoot.querySelector('.foot-interest').textContent = `${totalInterestPaid.toLocaleString('ca-ES', { minimumFractionDigits: 2 })} €`;
        tfoot.querySelector('.foot-principal').textContent = `${totalPrincipalPaid.toLocaleString('ca-ES', { minimumFractionDigits: 2 })} €`;
        tfoot.querySelector('.foot-voluntary').textContent = `${totalVoluntaryPaid > 0 ? totalVoluntaryPaid.toLocaleString('ca-ES', { minimumFractionDigits: 2 }) : '0,00'} €`;
        tfoot.querySelector('.foot-wealth').textContent = `${finalWealth.toLocaleString('ca-ES', { minimumFractionDigits: 2 })} €`;
      }
      return;
    }

    // 3. Crear l'estructura completa de la taula
    let rowsHtml = '';

    schedule.forEach(row => {
      const isPaidOff = row.isPaidOff && row.remainingBalance <= 0 && row.annualTotal === 0 && row.voluntaryAmortization === 0;
      const isPayoffEvent = row.isPayoffEvent;

      let rowClass = '';
      if (isPaidOff) rowClass = 'row-paid-off';
      if (isPayoffEvent) rowClass = 'row-payoff-event';

      const currentQuotaVal = customQuotas[row.year] || '';
      const hasCustomQuotaClass = (currentQuotaVal && currentQuotaVal > row.obligatoryMonthlyPayment) ? 'has-value' : '';
      const displayQuotaVal = currentQuotaVal || (row.actualMonthlyPayment > 0 ? row.actualMonthlyPayment.toFixed(2) : '');

      const currentAmortVal = voluntaryAmortizations[row.year] || '';
      const hasAmortValueClass = currentAmortVal ? 'has-value' : '';

      rowsHtml += `
        <tr class="${rowClass}">
          <td class="text-center font-bold col-year">
            ${row.year}
            ${isPayoffEvent ? '<span class="badge badge-success" style="margin-left: 4px; font-size: 0.65rem;">🎉 Liquidada!</span>' : ''}
          </td>

          <!-- Columna Quota (Modificable per l'usuari) -->
          <td class="col-quota">
            <div class="table-input-wrapper">
              <input 
                type="number" 
                min="0" 
                step="25" 
                placeholder="${row.obligatoryMonthlyPayment.toFixed(2)} €"
                class="table-input table-input-quota ${hasCustomQuotaClass}"
                data-year="${row.year}"
                value="${displayQuotaVal}"
                ${isPaidOff ? 'disabled' : ''}
                title="Pots posar una quota superior a l'obligada per accelerar el pagament"
              />
            </div>
          </td>

          <!-- Columna Quota mensual obligada -->
          <td class="col-obligatory" style="color: var(--text-secondary); font-size: 0.85rem;">
            ${row.obligatoryMonthlyPayment > 0 ? `${row.obligatoryMonthlyPayment.toLocaleString('ca-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : '—'}
          </td>

          <!-- Total Anual -->
          <td class="col-annual" style="font-weight: 600;">
            ${row.annualTotal > 0 ? `${row.annualTotal.toLocaleString('ca-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : '0,00 €'}
          </td>

          <!-- Interessos pagats -->
          <td class="col-interest" style="color: var(--danger);">
            ${row.interestPaid > 0 ? `${row.interestPaid.toLocaleString('ca-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : '0,00 €'}
          </td>

          <!-- Deute pagat (amortitzat) -->
          <td class="col-principal" style="color: var(--success);">
            ${row.principalPaid > 0 ? `${row.principalPaid.toLocaleString('ca-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €` : '0,00 €'}
          </td>

          <!-- Amortització voluntària extraordinària -->
          <td class="text-center col-amort">
            <div class="table-input-wrapper">
              <input 
                type="number" 
                min="0" 
                step="500" 
                placeholder="0 €"
                class="table-input table-input-amort ${hasAmortValueClass}"
                data-year="${row.year}"
                value="${currentAmortVal}"
                ${isPaidOff ? 'disabled' : ''}
                title="Aportació puntual a final d'any"
              />
            </div>
          </td>

          <!-- Deute pendent restant -->
          <td class="col-balance" style="font-weight: 700; color: var(--text-primary);">
            ${row.remainingBalance.toLocaleString('ca-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </td>

          <!-- Quotes pendents (mesos) -->
          <td class="text-center col-months" style="color: var(--text-secondary);">
            ${row.remainingMonths}
          </td>

          <!-- Patrimoni acumulat -->
          <td class="col-wealth" style="font-weight: 700; color: #10b981;">
            ${row.cumulativeWealth.toLocaleString('ca-ES', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} €
          </td>
        </tr>
      `;
    });

    const totalAnnualPaid = Math.round((totalPrincipalPaid + totalInterestPaid) * 100) / 100;

    let existingContainer = container.querySelector('.table-responsive-container');
    if (!existingContainer) {
      existingContainer = document.createElement('div');
      existingContainer.className = 'table-responsive-container';
      container.appendChild(existingContainer);
    }

    existingContainer.innerHTML = `
      <table class="amortization-table">
        <thead>
          <tr>
            <th class="text-center">Any</th>
            <th>Quota (€/mes)</th>
            <th>Quota Obligada</th>
            <th>Total Anual</th>
            <th>Interessos Pagats</th>
            <th>Deute Pagat</th>
            <th class="text-center">Amortització Voluntària</th>
            <th>Deute Pendent</th>
            <th class="text-center">Quotes Pendents</th>
            <th>Patrimoni Acumulat</th>
          </tr>
        </thead>
        <tbody>
          ${rowsHtml}
        </tbody>
        <tfoot>
          <tr>
            <td class="text-center">TOTAL</td>
            <td>—</td>
            <td>—</td>
            <td class="foot-annual">${totalAnnualPaid.toLocaleString('ca-ES', { minimumFractionDigits: 2 })} €</td>
            <td class="foot-interest" style="color: var(--danger);">${totalInterestPaid.toLocaleString('ca-ES', { minimumFractionDigits: 2 })} €</td>
            <td class="foot-principal" style="color: var(--success);">${totalPrincipalPaid.toLocaleString('ca-ES', { minimumFractionDigits: 2 })} €</td>
            <td class="text-center foot-voluntary" style="color: var(--primary);">${totalVoluntaryPaid > 0 ? `${totalVoluntaryPaid.toLocaleString('ca-ES', { minimumFractionDigits: 2 })} €` : '0,00 €'}</td>
            <td>0,00 €</td>
            <td class="text-center">—</td>
            <td class="foot-wealth" style="color: var(--success);">${finalWealth.toLocaleString('ca-ES', { minimumFractionDigits: 2 })} €</td>
          </tr>
        </tfoot>
      </table>
    `;

    // Vincular esdeveniments dels inputs de Quota
    const quotaInputs = existingContainer.querySelectorAll('.table-input-quota');
    quotaInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const year = parseInt(e.target.dataset.year, 10);
        const raw = e.target.value;
        const val = raw === '' ? 0 : (parseFloat(raw) || 0);
        onQuotaChange(year, val);
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') e.target.blur();
      });
    });

    // Vincular esdeveniments dels inputs d'Amortització Extraordinària
    const amortInputs = existingContainer.querySelectorAll('.table-input-amort');
    amortInputs.forEach(input => {
      input.addEventListener('input', (e) => {
        const year = parseInt(e.target.dataset.year, 10);
        const raw = e.target.value;
        const val = raw === '' ? 0 : (parseFloat(raw) || 0);
        e.target.classList.toggle('has-value', val > 0);
        onAmortizationChange(year, val);
      });
      input.addEventListener('keydown', (e) => {
        if (e.key === 'Enter') e.target.blur();
      });
    });
  }
}
