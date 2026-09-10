<script>
  /** @type {{ calcMode: 'years' | 'rate' }} */
  let { calcMode = $bindable() } = $props();
</script>

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
