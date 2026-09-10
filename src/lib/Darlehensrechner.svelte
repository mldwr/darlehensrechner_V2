<script>
  import { buildAmortizationSchedule } from "./utils/loanCalculations.js";
  import AppHeader from "./components/AppHeader.svelte";
  import ModeToggle from "./components/ModeToggle.svelte";
  import InputPanel from "./components/InputPanel.svelte";
  import StatCards from "./components/StatCards.svelte";
  import AmortizationTable from "./components/AmortizationTable.svelte";

  // --- STATE ---
  /** @type {'years' | 'rate'} */
  let calcMode = $state("years"); // 'years' = Wunschlaufzeit, 'rate' = Feste Monatsrate
  let loanAmount = $state(188000);
  let interestRate = $state(0.9);
  let targetYears = $state(10);
  let monthlyRate = $state(1640.3);
  let specialPaymentPercent = $state(5.0);
  let specialPaymentMonth = $state(6);
  let startYear = $state(2018);
  let startMonth = $state(1);

  // --- DERIVED: amortization schedule ---
  let resultData = $derived.by(() =>
    buildAmortizationSchedule({
      loanAmount,
      interestRate,
      calcMode,
      targetYears,
      monthlyRate,
      specialPaymentPercent,
      specialPaymentMonth,
      startYear,
      startMonth,
    }),
  );
</script>

<div class="container" style="padding-top: 2rem; padding-bottom: 2rem;">

  <AppHeader />

  <ModeToggle bind:calcMode />

  {#if !resultData.error && resultData.schedule}
    <StatCards
      initialRate={resultData.initialRate}
      finalRate={resultData.finalRate}
      totalInterest={resultData.totalInterest}
      totalSpecialPayments={resultData.totalSpecialPayments}
      {calcMode}
    />
  {/if}

  <InputPanel
    {calcMode}
    bind:loanAmount
    bind:interestRate
    bind:targetYears
    bind:monthlyRate
    bind:specialPaymentPercent
    bind:specialPaymentMonth
    bind:startYear
    bind:startMonth
  />

  <AmortizationTable {resultData} {specialPaymentMonth} />

</div>
