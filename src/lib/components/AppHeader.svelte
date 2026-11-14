<script>
  import { Calculator, TrendingDown } from "@lucide/svelte";
</script>

<!-- HEADER -->
<div style="position: relative;">
  <a
    href="https://orange-goose.com"
    target="_blank"
    rel="noopener noreferrer"
    aria-label="Orange Goose"
    style="
      position: absolute;
      top: 0;
      right: 0;
      display: inline-flex;
      align-items: center;
    "
  >
    <img
      src="/orange_goose_logo.png"
      alt="Orange Goose"
      class="orange-goose-logo"
    />
  </a>

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
</div>

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

<style>
  .orange-goose-logo {
    height: 2rem;
    width: auto;
    object-fit: contain;
    opacity: 0.8;
    transition: opacity 0.2s;
  }

  .orange-goose-logo:hover {
    opacity: 1;
  }
</style>
