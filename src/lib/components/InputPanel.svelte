<script lang="ts">
  import ModeToggle from "./ModeToggle.svelte";
  import { formatCurrency, getMonthName } from "../utils/loanCalculations.js";

  let { calcMode = $bindable(), values = $bindable(), errors } = $props();

  let annualPayment = $derived((values.loanAmount * values.specialPaymentPercent) / 100);
</script>

{#snippet numberField(
  key: string,
  id: string,
  label: string,
  min: number,
  max: number | undefined = undefined,
  step: number | "any" = "any",
  hint = "",
)}
  <div>
    <label for={id}>{label}</label>
    <input
      {id}
      type="number"
      {min}
      {max}
      {step}
      bind:value={values[key]}
      aria-invalid={errors[key] ? "true" : undefined}
      aria-describedby={errors[key] ? `${id}-error` : hint ? `${id}-hint` : undefined}
    />
    {#if errors[key]}
      <p class="error" id={`${id}-error`}>{errors[key]}</p>
    {:else if hint}
      <p class="hint" id={`${id}-hint`}>{hint}</p>
    {/if}
  </div>
{/snippet}

{#snippet monthOptions()}
  {#each Array(12) as _, i (i)}
    <option value={i + 1}>{getMonthName(i + 1)}</option>
  {/each}
{/snippet}

<section class="loan-panel inputs" aria-labelledby="input-title">
  <h2 id="input-title">Eingaben</h2>
  <ModeToggle bind:calcMode />

  <div class="fields">
    {@render numberField("loanAmount", "loan-amount", "Darlehensbetrag (€)", 0.01)}
    {@render numberField("interestRate", "interest-rate", "Sollzins pro Jahr (%)", 0, undefined, 0.1)}
    {#if calcMode === "years"}
      {@render numberField("targetYears", "target-years", "Wunschlaufzeit (Jahre)", 1, 60, 1)}
    {:else}
      {@render numberField("monthlyRate", "monthly-rate", "Monatsrate (€)", 0.01)}
    {/if}
    <div class="start-date">
      <div>
        <label for="start-month">Startmonat</label>
        <select id="start-month" bind:value={values.startMonth}>
          {@render monthOptions()}
        </select>
      </div>
      {@render numberField("startYear", "start-year", "Startjahr", 1, undefined, 1)}
    </div>
  </div>

  <fieldset class="special-payment" aria-describedby="special-payment-rule">
    <legend>Sondertilgung</legend>
    <div class="fields">
      {@render numberField(
        "specialPaymentPercent",
        "special-payment-percent",
        "Anteil am Darlehensbetrag (%)",
        0,
        undefined,
        0.1,
        !errors.loanAmount && Number.isFinite(annualPayment)
          ? `${formatCurrency(annualPayment)} pro Jahr geplant.`
          : "",
      )}
      <div>
        <label for="special-payment-month">Monat der Sondertilgung</label>
        <select id="special-payment-month" bind:value={values.specialPaymentMonth}
          disabled={values.specialPaymentPercent === 0}>
          {@render monthOptions()}
        </select>
      </div>
    </div>
    <p class="hint" id="special-payment-rule">
      Sondertilgungen sind ab dem 13. Monat möglich. Mit 0 % rechnest du ohne Sondertilgung.
    </p>
  </fieldset>
</section>

<style>
  .inputs {
    display: grid;
    gap: 1rem;
  }

  .fields {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.8rem;
  }

  .start-date {
    display: grid;
    grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
    gap: 0.5rem;
  }

  label {
    display: block;
    margin-bottom: 0.25rem;
    font-size: 0.875rem;
    font-weight: 600;
  }

  .fields :is(input, select) {
    inline-size: 100%;
    block-size: 2.65rem;
    min-block-size: 44px;
    margin: 0;
    padding: 0.45rem 0.65rem;
    background-color: var(--loan-panel);
    border: 1px solid var(--loan-control-border);
    color: var(--loan-ink);
  }

  .fields input[aria-invalid="true"] {
    border-color: var(--loan-error);
  }

  .special-payment {
    min-inline-size: 0;
    margin: 0;
  }

  legend {
    margin-bottom: 0.5rem;
    color: var(--loan-ink);
    font-weight: 650;
  }

  .hint, .error {
    margin: 0.35rem 0 0;
    font-size: 0.875rem;
    color: var(--loan-muted);
  }

  .error {
    color: var(--loan-error);
  }

  @media (max-width: 34rem) {
    .fields {
      grid-template-columns: 1fr;
    }
  }
</style>
