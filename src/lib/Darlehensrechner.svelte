<script>
  import {
    Calculator,
    Calendar,
    Euro,
    Percent,
    CircleAlert,
    Clock,
    TrendingDown,
  } from "@lucide/svelte";

  // --- STATE ---
  let calcMode = $state("years"); // 'years' = Wunschlaufzeit (Dynamische Rate), 'rate' = Feste Monatsrate
  let loanAmount = $state(188000);
  let interestRate = $state(0.9);
  let targetYears = $state(10); // Jahre bis zur Volltilgung (wie im Beleg standardmäßig 10)
  let monthlyRate = $state(1640.3); // Manuelle Rate (falls Modus 'rate')
  let specialPaymentPercent = $state(5.0); // 5% Sondertilgung
  let specialPaymentMonth = $state(6);
  let startYear = $state(2026);
  let startMonth = $state(1);

  // --- HILFSFUNKTIONEN ---
  /** @param {number | undefined} [value] */
  const formatCurrency = (value = 0) => {
    if (value === undefined || value === null) return "0,00 €";
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: "EUR",
    }).format(value);
  };

  /** @param {number} monthIndex */
  const getMonthName = (monthIndex) => {
    const months = [
      "Januar",
      "Februar",
      "März",
      "April",
      "Mai",
      "Juni",
      "Juli",
      "August",
      "September",
      "Oktober",
      "November",
      "Dezember",
    ];
    return months[monthIndex - 1];
  };

  // --- FORMEL FÜR DIE ANNUITÄTENRATE (PMT) ---
  /**
   * @param {number} principal
   * @param {number} annualRate
   * @param {number} remainingMonths
   */
  const calculateAnnuityRate = (principal, annualRate, remainingMonths) => {
    if (remainingMonths <= 0 || principal <= 0) return 0;
    if (annualRate === 0) return principal / remainingMonths;

    const r = annualRate / 12;
    const rateFactor = Math.pow(1 + r, remainingMonths);
    return (principal * (r * rateFactor)) / (rateFactor - 1);
  };

  // --- GENERIERUNG DES TILGUNGSPLANS ---
  let resultData = $derived.by(() => {
    let balance = loanAmount;
    const rate = interestRate / 100;
    const targetMonths = targetYears * 12;
    const specialPaymentAmt = (loanAmount * specialPaymentPercent) / 100;

    let currentMonth = startMonth;
    let currentYear = startYear;

    let result = [];
    let yearlySums = { zins: 0, tilgung: 0, sondertilgung: 0, gesamt: 0 };
    let monthCounter = 0;
    const MAX_MONTHS = 1200; // Schutz vor Endlosschleife

    // Merken der initial berechneten Rate für die Anzeige in der Statistik
    const initialCalculatedRate = calculateAnnuityRate(
      loanAmount,
      rate,
      targetMonths,
    );

    while (balance > 0.001 && monthCounter < MAX_MONTHS) {
      monthCounter++;

      // Dynamische Neuberechnung der Rate basierend auf der aktuellen Restschuld!
      let activeRate = 0;
      if (calcMode === "years") {
        // Restlaufzeit in Monaten für diesen Berechnungsschritt
        const remainingMonths = targetMonths - monthCounter + 1;
        // Dynamische Neuberechnung der Rate basierend auf der aktuellen Restschuld!
        activeRate = calculateAnnuityRate(balance, rate, remainingMonths);
      } else {
        activeRate = monthlyRate;
      }

      // Plausibilitätsprüfung
      let interest = (balance * rate) / 12;
      if (activeRate <= interest && specialPaymentAmt === 0) {
        return {
          error:
            "Die monatliche Rate ist zu gering, um die Zinsen zu decken. Das Darlehen würde nie getilgt werden.",
        };
      }

      // 2. Sondertilgung prüfen (erst nach Ablauf des ersten Jahres = nach 12 Monaten)
      let isSpecialMonth =
        currentMonth === specialPaymentMonth && monthCounter > 12;
      let currentSpecialPayment = isSpecialMonth ? specialPaymentAmt : 0;

      // Rate anpassen, falls die Restschuld inkl. Zinsen kleiner als die geplante Zahlung ist
      let totalPlannedPayment = activeRate + currentSpecialPayment;
      let actualPayment = 0;
      let actualInterest = interest;
      let actualPrincipal = 0;
      let actualSpecialPayment = 0;

      if (balance + interest <= totalPlannedPayment) {
        // Letzter Monat: Vollständige Tilgung der Restschuld
        actualPayment = balance + interest;
        actualInterest = interest;
        actualPrincipal = balance;

        if (balance + interest <= activeRate) {
          actualSpecialPayment = 0;
        } else {
          actualSpecialPayment = balance + interest - activeRate;
        }
        balance = 0;
      } else {
        // Regulärer Monat
        actualPayment = activeRate + currentSpecialPayment;
        actualPrincipal = activeRate - interest;
        actualSpecialPayment = currentSpecialPayment;
        balance = balance - actualPrincipal - actualSpecialPayment;
      }

      result.push({
        type: "month",
        month: currentMonth,
        year: currentYear,
        dateStr: `${String(currentMonth).padStart(2, "0")}.${currentYear}`,
        payment: actualPayment,
        interest: actualInterest,
        principal: actualPrincipal,
        specialPayment: actualSpecialPayment,
        balance: Math.max(0, balance),
        monthsElapsed: monthCounter,
        calculatedRate: activeRate, // Speichern für die tabellarische Verfolgung der Ratenreduktion
      });

      // Summen für das laufende Jahr addieren
      yearlySums.zins += actualInterest;
      yearlySums.tilgung += actualPrincipal;
      yearlySums.sondertilgung += actualSpecialPayment;
      yearlySums.gesamt += actualPayment;

      // Jahreswechsel oder Volltilgung -> Zwischensumme einfügen
      if (currentMonth === 12 || balance <= 0) {
        result.push({
          type: "year-summary",
          year: currentYear,
          interest: yearlySums.zins,
          principal: yearlySums.tilgung,
          specialPayment: yearlySums.sondertilgung,
          total: yearlySums.gesamt,
        });

        yearlySums = { zins: 0, tilgung: 0, sondertilgung: 0, gesamt: 0 };
      }

      currentMonth++;
      if (currentMonth > 12) {
        currentMonth = 1;
        currentYear++;
      }
    }

    if (monthCounter >= MAX_MONTHS) {
      return {
        error:
          "Berechnung abgebrochen. Laufzeit überschreitet 100 Jahre. Bitte Parameter anpassen.",
      };
    }

    // Statistiken berechnen
    const totals = result.reduce(
      (acc, row) => {
        if (row.type === "month") {
          acc.interest += row.interest;
          acc.special += row.specialPayment;
        }
        return acc;
      },
      { interest: 0, special: 0 },
    );

    return {
      schedule: result,
      monthsTotal: monthCounter,
      totalInterest: totals.interest,
      totalSpecialPayments: totals.special,
      initialRate: calcMode === "years" ? initialCalculatedRate : monthlyRate,
      finalRate: result[result.length - 2]?.calculatedRate || 0, // Letzter regulärer Monat vor der Schlussrate
    };
  });
</script>

<div class="container" style="padding-top: 2rem; padding-bottom: 2rem;">
  <!-- HEADER -->
  <header style="text-align: center; margin-bottom: 2rem;">
    <h1
      style="display: flex; align-items: center; justify-content: center; gap: 0.75rem;"
    >
      <Calculator class="c-primary" size={32} />
      Kreditrechner mit dynamischer Ratenreduktion
    </h1>
    <p>
      Simuliere Ratenreduzierungen nach Sondertilgungen bei gleichbleibender
      Laufzeit.
    </p>
  </header>

  <!-- INFOBOX -->
  <article
    class="card bg-info"
    style="display: flex; gap: 1rem; align-items: flex-start; margin-bottom: 2rem;"
  >
    <TrendingDown size={24} style="flex-shrink: 0; margin-top: 0.2rem;" />
    <div>
      <strong>Dynamische Ratenreduktion aktiv (Standard):</strong>
      <p style="margin-bottom: 0; font-size: 0.875em;">
        Nach jeder Sondertilgung sinkt deine Restschuld. Die Applikation
        berechnet die monatliche Rate am Folgemonat automatisch neu auf Basis
        der Restlaufzeit.
        <br /><strong
          >Ergebnis: Deine monatliche Belastung sinkt nach jeder Sondertilgung
          spürbar!</strong
        >
      </p>
    </div>
  </article>

  <!-- MODUS-SCHALTER -->
  <div style="text-align: center; margin-bottom: 2rem;">
    <div role="group" style="display: inline-flex;">
      <button
        class={calcMode === "years" ? "button" : "button outline"}
        onclick={() => (calcMode = "years")}
      >
        Dynamische Rate (Wunschlaufzeit)
      </button>
      <button
        class={calcMode === "rate" ? "button" : "button outline"}
        onclick={() => (calcMode = "rate")}
      >
        Konstante Rate (Laufzeitverkürzung)
      </button>
    </div>
  </div>

  <!-- STATISTIK-INFOKARTEN -->
  {#if !resultData.error && resultData.schedule}
    <div class="row" style="margin-bottom: 2rem; row-gap: 1rem;">
      <div class="col-12 col-md-6 col-lg-3">
        <article
          class="card"
          style="height: 100%; display: flex; flex-direction: column; justify-content: space-between;"
        >
          <small class="c-primary">Anfängliche Monatsrate</small>
          <div style="font-size: 1.5rem; font-weight: bold;">
            {formatCurrency(resultData.initialRate)}
          </div>
          <small style="opacity: 0.7;">Regulärer Startwert</small>
        </article>
      </div>
      <div class="col-12 col-md-6 col-lg-3">
        <article
          class="card"
          style="height: 100%; display: flex; flex-direction: column; justify-content: space-between;"
        >
          <small class="c-accent">Letzte Monatsrate (ca.)</small>
          <div style="font-size: 1.5rem; font-weight: bold;">
            {calcMode === "years"
              ? formatCurrency(resultData.finalRate)
              : formatCurrency(resultData.initialRate)}
          </div>
          <small style="opacity: 0.7;">Dank Ratenreduktion gesunken</small>
        </article>
      </div>
      <div class="col-12 col-md-6 col-lg-3">
        <article
          class="card"
          style="height: 100%; display: flex; flex-direction: column; justify-content: space-between;"
        >
          <small class="c-error">Gezahlte Zinsen gesamt</small>
          <div style="font-size: 1.5rem; font-weight: bold;">
            {formatCurrency(resultData.totalInterest)}
          </div>
          <small style="opacity: 0.7;">Zinskosten über die Gesamtlaufzeit</small
          >
        </article>
      </div>
      <div class="col-12 col-md-6 col-lg-3">
        <article
          class="card"
          style="height: 100%; display: flex; flex-direction: column; justify-content: space-between;"
        >
          <small class="c-success">Summe Sondertilgungen</small>
          <div style="font-size: 1.5rem; font-weight: bold;">
            {formatCurrency(resultData.totalSpecialPayments)}
          </div>
          <small style="opacity: 0.7;">Eingezahlte Sonderzahlungen</small>
        </article>
      </div>
    </div>
  {/if}

  <!-- INPUTS PANEL -->
  <article class="card" style="margin-bottom: 2rem;">
    <div class="row">
      <div class="col-12 col-md-6 col-lg-4" style="margin-bottom: 1rem;">
        <label for="loan-amount">Kreditbetrag (€)</label>
        <div style="position: relative; display: flex; align-items: center;">
          <Euro
            size={20}
            style="position: absolute; left: 0.75rem; pointer-events: none; color: var(--pico-muted-color);"
          />
          <input
            id="loan-amount"
            type="number"
            bind:value={loanAmount}
            style="padding-left: 2.5rem; width: 100%; margin-bottom: 0;"
          />
        </div>
      </div>

      <div class="col-12 col-md-6 col-lg-4" style="margin-bottom: 1rem;">
        <label for="interest-rate">Sollzinssatz p.a. (%)</label>
        <div style="position: relative; display: flex; align-items: center;">
          <Percent
            size={20}
            style="position: absolute; left: 0.75rem; pointer-events: none; color: var(--pico-muted-color);"
          />
          <input
            id="interest-rate"
            type="number"
            step="0.01"
            bind:value={interestRate}
            style="padding-left: 2.5rem; width: 100%; margin-bottom: 0;"
          />
        </div>
      </div>

      {#if calcMode === "years"}
        <div class="col-12 col-md-6 col-lg-4" style="margin-bottom: 1rem;">
          <label for="target-years">Wunschlaufzeit (Jahre)</label>
          <div style="position: relative; display: flex; align-items: center;">
            <Clock
              size={20}
              style="position: absolute; left: 0.75rem; pointer-events: none; color: var(--pico-muted-color);"
            />
            <input
              id="target-years"
              type="number"
              min="1"
              max="60"
              bind:value={targetYears}
              style="padding-left: 2.5rem; width: 100%; margin-bottom: 0;"
            />
          </div>
        </div>
      {:else}
        <div class="col-12 col-md-6 col-lg-4" style="margin-bottom: 1rem;">
          <label for="monthly-rate">Monatliche Rate (€)</label>
          <div style="position: relative; display: flex; align-items: center;">
            <Euro
              size={20}
              style="position: absolute; left: 0.75rem; pointer-events: none; color: var(--pico-muted-color);"
            />
            <input
              id="monthly-rate"
              type="number"
              bind:value={monthlyRate}
              style="padding-left: 2.5rem; width: 100%; margin-bottom: 0;"
            />
          </div>
        </div>
      {/if}

      <div class="col-12 col-md-6 col-lg-4" style="margin-bottom: 1rem;">
        <label for="special-payment-percent">Sondertilgung (% vom Kredit)</label
        >
        <div style="position: relative; display: flex; align-items: center;">
          <Percent
            size={20}
            style="position: absolute; left: 0.75rem; pointer-events: none; color: var(--pico-muted-color);"
          />
          <input
            id="special-payment-percent"
            type="number"
            step="0.1"
            bind:value={specialPaymentPercent}
            style="padding-left: 2.5rem; width: 100%; margin-bottom: 0;"
          />
        </div>
        <small class="c-muted" style="display: block; margin-top: 0.25rem;"
          >Entspricht {formatCurrency(
            (loanAmount * specialPaymentPercent) / 100,
          )} jährlich.</small
        >
      </div>

      <div class="col-12 col-md-6 col-lg-4" style="margin-bottom: 1rem;">
        <label for="special-payment-month">Monat der Sondertilgung</label>
        <div style="position: relative; display: flex; align-items: center;">
          <Calendar
            size={20}
            style="position: absolute; left: 0.75rem; pointer-events: none; color: var(--pico-muted-color);"
          />
          <select
            id="special-payment-month"
            bind:value={specialPaymentMonth}
            style="padding-left: 2.5rem; width: 100%; margin-bottom: 0;"
          >
            {#each Array(12) as _, i}
              <option value={i + 1}>{getMonthName(i + 1)}</option>
            {/each}
          </select>
        </div>
      </div>

      <div class="col-12 col-md-6 col-lg-4" style="margin-bottom: 1rem;">
        <div class="row">
          <div class="col-6">
            <label for="start-month">Startmonat</label>
            <input
              id="start-month"
              type="number"
              min="1"
              max="12"
              bind:value={startMonth}
              style="width: 100%; margin-bottom: 0;"
            />
          </div>
          <div class="col-6">
            <label for="start-year">Startjahr</label>
            <input
              id="start-year"
              type="number"
              bind:value={startYear}
              style="width: 100%; margin-bottom: 0;"
            />
          </div>
        </div>
      </div>
    </div>
  </article>

  <!-- FEHLERMELDUNG -->
  {#if resultData.error}
    <article
      class="card bg-error"
      style="display: flex; gap: 1rem; align-items: flex-start;"
    >
      <CircleAlert size={24} style="flex-shrink: 0; margin-top: 0.2rem;" />
      <p style="margin-bottom: 0;">{resultData.error}</p>
    </article>
  {/if}

  <!-- TILGUNGSPLAN TABELLE -->
  {#if !resultData.error && resultData.schedule}
    <article class="card" style="padding: 0; overflow: hidden;">
      <header
        style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; background: var(--pico-card-sectioning-background-color);"
      >
        <h2 style="margin: 0; font-size: 1.25rem;">
          Detaillierter Tilgungsplan
        </h2>
        <span class="badge">
          Laufzeit: {Math.floor(resultData.monthsTotal / 12)} Jahre, {resultData.monthsTotal %
            12} Monate
        </span>
      </header>

      <div style="overflow-x: auto; max-height: 600px; overflow-y: auto;">
        <table class="striped" style="margin-bottom: 0;">
          <thead
            style="position: sticky; top: 0; z-index: 10; background: var(--pico-background-color,#ffffff);"
          >
            <tr>
              <th scope="col">Datum</th>
              <th scope="col" style="text-align: right;"
                >Monatliche Rate (Basis)</th
              >
              <th scope="col" style="text-align: right;">Zinsen</th>
              <th scope="col" style="text-align: right;">Tilgung</th>
              <th scope="col" style="text-align: right;" class="c-primary"
                >Sondertilgung</th
              >
              <th scope="col" style="text-align: right;">Zahlung Gesamt</th>
              <th scope="col" style="text-align: right;">Restkapital</th>
            </tr>
          </thead>
          <tbody>
            {#each resultData.schedule as row, index}
              {#if row.type === "year-summary"}
                <tr class="bg-primary" style="font-weight: bold;">
                  <td>Summe {row.year}</td>
                  <td></td>
                  <td style="text-align: right;"
                    >{formatCurrency(row.interest)}</td
                  >
                  <td style="text-align: right;"
                    >{formatCurrency(row.principal)}</td
                  >
                  <td style="text-align: right;"
                    >{formatCurrency(row.specialPayment)}</td
                  >
                  <td style="text-align: right;">{formatCurrency(row.total)}</td
                  >
                  <td></td>
                </tr>
              {:else}
                <tr class={row.specialPayment > 0 ? "bg-success" : ""}>
                  <td>
                    {row.dateStr}
                    {#if (row.monthsElapsed ?? 0) <= 12 && row.month === specialPaymentMonth}
                      <span
                        class="badge bg-warning"
                        style="margin-left: 0.5rem;"
                        title="Gesperrt im 1. Jahr"
                      >
                        Sperre
                      </span>
                    {/if}
                  </td>
                  <td style="text-align: right; opacity: 0.8;">
                    {formatCurrency(row.calculatedRate)}
                  </td>
                  <td
                    style="text-align: right;"
                    class={row.specialPayment > 0 ? "" : "c-error"}
                  >
                    {formatCurrency(row.interest)}
                  </td>
                  <td
                    style="text-align: right;"
                    class={row.specialPayment > 0 ? "" : "c-success"}
                  >
                    {formatCurrency(row.principal)}
                  </td>
                  <td
                    style="text-align: right; font-weight: bold;"
                    class={row.specialPayment > 0 ? "" : "c-primary"}
                  >
                    {row.specialPayment > 0
                      ? formatCurrency(row.specialPayment)
                      : "-"}
                  </td>
                  <td style="text-align: right; font-weight: bold;">
                    {formatCurrency(row.payment)}
                  </td>
                  <td style="text-align: right; font-weight: bold;">
                    {formatCurrency(row.balance)}
                  </td>
                </tr>
              {/if}
            {/each}
          </tbody>
        </table>
      </div>
    </article>
  {/if}
</div>
