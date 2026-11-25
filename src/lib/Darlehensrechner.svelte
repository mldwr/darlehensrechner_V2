<script>
  import { buildAmortizationSchedule } from "./utils/loanCalculations.js";
  import AppHeader from "./components/AppHeader.svelte";
  import InputPanel from "./components/InputPanel.svelte";
  import StatCards from "./components/StatCards.svelte";
  import AmortizationTable from "./components/AmortizationTable.svelte";

  /** @type {'years' | 'rate'} */
  let calcMode = $state("years");
  let values = $state({
    loanAmount: 500000,
    interestRate: 2.3,
    targetYears: 25,
    monthlyRate: 2000,
    specialPaymentPercent: 1.8,
    specialPaymentMonth: 6,
    startYear: 2026,
    startMonth: 1,
  });

  let errors = $derived.by(() => {
    const {
      loanAmount, interestRate, targetYears, monthlyRate, specialPaymentPercent, startYear,
    } = values;

    return {
      loanAmount: Number.isFinite(loanAmount) && loanAmount >= 0.01
        ? "" : "Gib einen Darlehensbetrag von mindestens 0,01 € ein.",
      interestRate: Number.isFinite(interestRate) && interestRate >= 0
        ? "" : "Gib einen Sollzins ab 0 % ein.",
      targetYears: calcMode !== "years" || (Number.isInteger(targetYears) && targetYears >= 1 && targetYears <= 60)
        ? "" : "Gib eine Laufzeit von 1 bis 60 ganzen Jahren ein.",
      monthlyRate: calcMode !== "rate" || (Number.isFinite(monthlyRate) && monthlyRate >= 0.01)
        ? "" : "Gib eine Monatsrate von mindestens 0,01 € ein.",
      specialPaymentPercent: Number.isFinite(specialPaymentPercent) && specialPaymentPercent >= 0
        ? "" : "Gib einen Prozentsatz ab 0 ein. 0 % steht für keine Sondertilgung.",
      startYear: Number.isInteger(startYear) && startYear >= 1
        ? "" : "Gib ein gültiges Startjahr ein.",
    };
  });

  let hasFieldError = $derived(Object.values(errors).some(Boolean));
  let resultData = $derived(
    hasFieldError ? null : buildAmortizationSchedule({ ...values, calcMode }),
  );
  let resultMessage = $derived.by(() => {
    if (values.loanAmount == null) {
      return "Gib einen Darlehensbetrag ein, um das Ergebnis zu sehen.";
    }
    if (hasFieldError) {
      return "Prüfe die markierten Eingaben.";
    }
    if (resultData && "error" in resultData) {
      return resultData.error;
    }
  });
</script>

<div class="loan-app">
  <AppHeader />

  <div class="calculator">
    <InputPanel bind:calcMode bind:values {errors} />
    <StatCards {calcMode} {resultData} message={resultMessage} />
  </div>

  {#if resultData && "schedule" in resultData}
    <AmortizationTable schedule={resultData.schedule} specialPaymentMonth={values.specialPaymentMonth}
      hasSpecialPayment={values.specialPaymentPercent > 0} />
  {/if}
</div>

<style>
  .calculator {
    display: grid;
    gap: 1rem;
    margin-bottom: 1rem;
  }

  @media (min-width: 58rem) {
    .calculator {
      grid-template-columns: minmax(0, 1.35fr) minmax(0, 1fr);
      gap: 1.25rem;
      margin-bottom: 1.25rem;
    }
  }
</style>
