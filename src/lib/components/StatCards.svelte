<script>
  import { formatCurrency } from "../utils/loanCalculations.js";

  let { resultData, calcMode, message } = $props();

  let duration = $derived.by(() => {
    const months = resultData?.monthsTotal ?? 0;
    const years = Math.floor(months / 12);
    const remainder = months % 12;
    return [
      years && (years === 1 ? "1 Jahr" : `${years} Jahre`),
      remainder && (remainder === 1 ? "1 Monat" : `${remainder} Monate`),
    ].filter(Boolean).join(", ");
  });
</script>

<section class="loan-panel results" aria-labelledby="result-title">
  <h2 id="result-title">Ergebnis</h2>
  <div role="status">
    {#if message}
      <p class="message">{message}</p>
    {/if}
  </div>

  {#if resultData && "schedule" in resultData}
    <dl class="primary">
      <div>
        <dt>{calcMode === "years" ? "Anfängliche Monatsrate" : "Regelmäßige Monatsrate"}</dt>
        <dd class="money">{formatCurrency(resultData.initialRate)}</dd>
      </div>
      <div>
        <dt>Berechnete Laufzeit</dt>
        <dd>{duration}</dd>
      </div>
    </dl>

    <dl class="secondary">
      {#if calcMode === "years"}
        <div>
          <dt>Reguläre Monatsrate am Ende</dt>
          <dd class="money">{formatCurrency(resultData.finalRate)}</dd>
        </div>
      {/if}
      <div>
        <dt>Zinskosten gesamt</dt>
        <dd class="money">{formatCurrency(resultData.totalInterest)}</dd>
      </div>
      <div>
        <dt>Sondertilgungen gesamt</dt>
        <dd class="money">{formatCurrency(resultData.totalSpecialPayments)}</dd>
      </div>
    </dl>
  {/if}
</section>

<style>
  .results {
    background: var(--loan-tint);
    align-self: start;
  }

  dl {
    margin: 1rem 0 0;
  }

  dt {
    color: var(--loan-muted);
    font-size: 0.875rem;
  }

  dd {
    margin: 0;
    color: var(--loan-ink);
    font-weight: 700;
  }

  .primary {
    display: grid;
    gap: 0.8rem;
  }

  .primary dd {
    font-size: clamp(1.35rem, 3vw, 2rem);
    line-height: 1.22;
    overflow-wrap: anywhere;
  }

  .secondary {
    display: grid;
    gap: 0.5rem;
    border-top: 1px solid var(--loan-border);
    padding-top: 0.8rem;
  }

  .secondary div {
    display: flex;
    flex-wrap: wrap;
    align-items: baseline;
    justify-content: space-between;
    gap: 0.15rem 0.8rem;
  }

  .message {
    margin: 0.75rem 0 0;
    color: var(--loan-error);
  }
</style>
