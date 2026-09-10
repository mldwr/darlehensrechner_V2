<script>
  import { Calculator, TrendingDown } from "@lucide/svelte";
</script>

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
