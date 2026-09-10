<script>
  import { formatCurrency } from "../utils/loanCalculations.js";

  let { initialRate, finalRate, totalInterest, totalSpecialPayments, calcMode } = $props();
</script>

<div class="row" style="margin-bottom: 2rem; row-gap: 1rem;">

  <!-- Anfängliche Monatsrate -->
  <div class="col-12 col-md-6 col-lg-3">
    <article
      class="card"
      style="height: 100%; display: flex; flex-direction: column; justify-content: space-between;"
    >
      <small class="c-primary">Anfängliche Monatsrate</small>
      <div style="font-size: 1.5rem; font-weight: bold;">
        {formatCurrency(initialRate)}
      </div>
      <small style="opacity: 0.7;">Regulärer Startwert</small>
    </article>
  </div>

  <!-- Letzte Monatsrate -->
  <div class="col-12 col-md-6 col-lg-3">
    <article
      class="card"
      style="height: 100%; display: flex; flex-direction: column; justify-content: space-between;"
    >
      <small class="c-accent">Letzte Monatsrate (ca.)</small>
      <div style="font-size: 1.5rem; font-weight: bold;">
        {calcMode === "years"
          ? formatCurrency(finalRate)
          : formatCurrency(initialRate)}
      </div>
      <small style="opacity: 0.7;">Dank Ratenreduktion gesunken</small>
    </article>
  </div>

  <!-- Gezahlte Zinsen gesamt -->
  <div class="col-12 col-md-6 col-lg-3">
    <article
      class="card"
      style="height: 100%; display: flex; flex-direction: column; justify-content: space-between;"
    >
      <small class="c-error">Gezahlte Zinsen gesamt</small>
      <div style="font-size: 1.5rem; font-weight: bold;">
        {formatCurrency(totalInterest)}
      </div>
      <small style="opacity: 0.7;">Zinskosten über die Gesamtlaufzeit</small>
    </article>
  </div>

  <!-- Summe Sondertilgungen -->
  <div class="col-12 col-md-6 col-lg-3">
    <article
      class="card"
      style="height: 100%; display: flex; flex-direction: column; justify-content: space-between;"
    >
      <small class="c-success">Summe Sondertilgungen</small>
      <div style="font-size: 1.5rem; font-weight: bold;">
        {formatCurrency(totalSpecialPayments)}
      </div>
      <small style="opacity: 0.7;">Eingezahlte Sonderzahlungen</small>
    </article>
  </div>

</div>
