<script>
  import { Euro, Percent, Clock, Calendar } from "@lucide/svelte";
  import { formatCurrency, getMonthName } from "../utils/loanCalculations.js";

  let {
    calcMode,
    loanAmount = $bindable(),
    interestRate = $bindable(),
    targetYears = $bindable(),
    monthlyRate = $bindable(),
    specialPaymentPercent = $bindable(),
    specialPaymentMonth = $bindable(),
    startYear = $bindable(),
    startMonth = $bindable(),
  } = $props();
</script>

<article class="card" style="margin-bottom: 2rem;">
  <div class="row">

    <!-- Kreditbetrag -->
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

    <!-- Sollzinssatz -->
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

    <!-- Wunschlaufzeit (years mode) or Feste Monatsrate (rate mode) -->
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

    <!-- Sondertilgung -->
    <div class="col-12 col-md-6 col-lg-4" style="margin-bottom: 1rem;">
      <label for="special-payment-percent">Sondertilgung (% vom Kredit)</label>
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
      <small class="c-muted" style="display: block; margin-top: 0.25rem;">
        Entspricht {formatCurrency((loanAmount * specialPaymentPercent) / 100)} jährlich.
      </small>
    </div>

    <!-- Monat der Sondertilgung -->
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

    <!-- Startdatum -->
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
