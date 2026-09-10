<script>
  import { CircleAlert } from "@lucide/svelte";
  import { formatCurrency } from "../utils/loanCalculations.js";

  /** @type {{ error?: string, schedule?: object[], monthsTotal?: number }} */
  let { resultData, specialPaymentMonth } = $props();
</script>

<!-- FEHLERMELDUNG -->
{#if resultData.error}
  <article
    class="card bg-error"
    style="display: flex; gap: 1rem; align-items: flex-start;"
  >
    <CircleAlert size={24} style="flex-shrink: 0; margin-top: 0.2rem;" />
    <p style="margin-bottom: 0;">{resultData.error}</p>
  </article>
{/if}

<!-- TILGUNGSPLAN TABELLE -->
{#if !resultData.error && resultData.schedule}
  <article class="card" style="padding: 0; overflow: hidden;">
    <header
      style="display: flex; justify-content: space-between; align-items: center; padding: 1rem 1.5rem; background: var(--pico-card-sectioning-background-color);"
    >
      <h2 style="margin: 0; font-size: 1.25rem;">Detaillierter Tilgungsplan</h2>
      <span class="badge">
        Laufzeit: {Math.floor(resultData.monthsTotal / 12)} Jahre, {resultData.monthsTotal %
          12} Monate
      </span>
    </header>

    <div style="overflow-x: auto; max-height: 600px; overflow-y: auto;">
      <table class="striped" style="margin-bottom: 0;">
        <thead
          style="position: sticky; top: 0; z-index: 10; background: var(--pico-background-color, #ffffff);"
        >
          <tr>
            <th scope="col">Datum</th>
            <th scope="col" style="text-align: right;">Monatliche Rate (Basis)</th>
            <th scope="col" style="text-align: right;">Zinsen</th>
            <th scope="col" style="text-align: right;">Tilgung</th>
            <th scope="col" style="text-align: right;" class="c-primary">Sondertilgung</th>
            <th scope="col" style="text-align: right;">Zahlung Gesamt</th>
            <th scope="col" style="text-align: right;">Restkapital</th>
          </tr>
        </thead>
        <tbody>
          {#each resultData.schedule as row}
            {#if row.type === "year-summary"}
              <tr class="bg-primary" style="font-weight: bold;">
                <td>Summe {row.year}</td>
                <td></td>
                <td style="text-align: right;">{formatCurrency(row.interest)}</td>
                <td style="text-align: right;">{formatCurrency(row.principal)}</td>
                <td style="text-align: right;">{formatCurrency(row.specialPayment)}</td>
                <td style="text-align: right;">{formatCurrency(row.total)}</td>
                <td></td>
              </tr>
            {:else}
              <tr class={row.specialPayment > 0 ? "bg-success" : ""}>
                <td>
                  {row.dateStr}
                  {#if (row.monthsElapsed ?? 0) <= 12 && row.month === specialPaymentMonth}
                    <span
                      class="badge bg-warning"
                      style="margin-left: 0.5rem;"
                      title="Gesperrt im 1. Jahr"
                    >
                      Sperre
                    </span>
                  {/if}
                </td>
                <td style="text-align: right; opacity: 0.8;">
                  {formatCurrency(row.calculatedRate)}
                </td>
                <td
                  style="text-align: right;"
                  class={row.specialPayment > 0 ? "" : "c-error"}
                >
                  {formatCurrency(row.interest)}
                </td>
                <td
                  style="text-align: right;"
                  class={row.specialPayment > 0 ? "" : "c-success"}
                >
                  {formatCurrency(row.principal)}
                </td>
                <td
                  style="text-align: right; font-weight: bold;"
                  class={row.specialPayment > 0 ? "" : "c-primary"}
                >
                  {row.specialPayment > 0 ? formatCurrency(row.specialPayment) : "-"}
                </td>
                <td style="text-align: right; font-weight: bold;">
                  {formatCurrency(row.payment)}
                </td>
                <td style="text-align: right; font-weight: bold;">
                  {formatCurrency(row.balance)}
                </td>
              </tr>
            {/if}
          {/each}
        </tbody>
      </table>
    </div>
  </article>
{/if}
