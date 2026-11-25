<script>
  /** @type {{ calcMode: 'years' | 'rate' }} */
  let { calcMode = $bindable() } = $props();
</script>

<fieldset aria-describedby="mode-hint">
  <legend>Berechnungsmodus</legend>
  <div class="options">
    <label>
      <input type="radio" name="calc-mode" value="years" bind:group={calcMode} />
      Dynamische Rate
    </label>
    <label>
      <input type="radio" name="calc-mode" value="rate" bind:group={calcMode} />
      Konstante Rate
    </label>
  </div>
  <p id="mode-hint">
    {calcMode === "years"
      ? "Nach einer Sondertilgung wird die Monatsrate anhand der verbleibenden Wunschlaufzeit neu berechnet."
      : "Die regelmäßige Monatsrate bleibt konstant. Sondertilgungen können das Darlehen früher ablösen."}
  </p>
</fieldset>

<style>
  fieldset {
    margin: 0;
    min-inline-size: 0;
  }

  legend {
    margin-bottom: 0.5rem;
    color: var(--loan-ink);
    font-weight: 650;
  }

  .options {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.5rem;
  }

  .options label {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    min-block-size: 44px;
    margin: 0;
    padding: 0.5rem 0.65rem;
    border: 1px solid var(--loan-control-border);
    border-radius: 0.45rem;
    cursor: pointer;
    line-height: 1.3;
  }

  .options label:has(:checked) {
    border-color: var(--loan-accent);
    background: var(--loan-tint);
    font-weight: 650;
  }

  input[type="radio"] {
    flex: none;
    appearance: auto;
    margin: 0;
    accent-color: var(--loan-accent);
  }

  p {
    margin: 0.55rem 0 0;
    color: var(--loan-muted);
    font-size: 0.875rem;
  }

  @media (max-width: 34rem) {
    .options {
      grid-template-columns: 1fr;
    }
  }
</style>
