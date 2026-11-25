<script>
  import { formatCurrency } from "../utils/loanCalculations.js";

  let { schedule, specialPaymentMonth, hasSpecialPayment } = $props();

  let years = $derived.by(() => {
    const grouped = new Map();

    for (const row of schedule) {
      if (row.type === "year-summary") continue;

      if (!grouped.has(row.year)) {
        grouped.set(row.year, {
          year: row.year, months: [], payment: 0, interest: 0, principal: 0, specialPayment: 0, balance: 0,
        });
      }

      const year = grouped.get(row.year);
      year.months.push(row);
      year.payment += row.payment;
      year.interest += row.interest;
      year.principal += row.principal;
      year.specialPayment += row.specialPayment;
      year.balance = row.balance;
    }

    return [...grouped.values()];
  });
</script>

<section class="loan-panel schedule" aria-labelledby="schedule-title">
  <h2 id="schedule-title">Tilgungsplan</h2>
  <p class="intro">Wähle ein Jahr, um die Monatszahlungen zu sehen.</p>

  <div class="years">
    {#each years as year (year.year)}
      <details>
        <summary>
          <span class="year-label">{year.year}</span>
          <span class="metric">Zahlungen <strong class="money">{formatCurrency(year.payment)}</strong></span>
          <span class="metric">Zinsen <strong class="money">{formatCurrency(year.interest)}</strong></span>
          <span class="metric">Restschuld <strong class="money">{formatCurrency(year.balance)}</strong></span>
        </summary>
        <p class="scroll-hint" id={`scroll-${year.year}`}>
          Falls Spalten abgeschnitten sind, wische seitlich oder nutze die Pfeiltasten im fokussierten Tabellenbereich.
        </p>
        <!-- svelte-ignore a11y_no_noninteractive_tabindex (The scroll container needs a tab stop for keyboard scrolling.) -->
        <div class="table-scroll" role="region" aria-label={`Monatszahlungen ${year.year}`}
          aria-describedby={`scroll-${year.year}`} tabindex="0">
          <table>
            <thead>
              <tr>
                <th scope="col">Monat</th>
                <th scope="col">Reguläre Rate</th>
                <th scope="col">Zinsen</th>
                <th scope="col">Tilgung</th>
                <th scope="col">Sondertilgung</th>
                <th scope="col">Gesamtzahlung</th>
                <th scope="col">Restschuld</th>
              </tr>
            </thead>
            <tbody>
              {#each year.months as row (row.month)}
                <tr>
                  <th scope="row">{row.dateStr}</th>
                  <td>{formatCurrency(row.calculatedRate)}</td>
                  <td>{formatCurrency(row.interest)}</td>
                  <td>{formatCurrency(row.principal)}</td>
                  <td class:special={row.specialPayment > 0}>
                    {#if row.specialPayment > 0}
                      {formatCurrency(row.specialPayment)}
                    {:else if hasSpecialPayment && row.monthsElapsed <= 12 && row.month === specialPaymentMonth}
                      <span class="unavailable">Noch nicht möglich</span>
                    {:else}
                      –
                    {/if}
                  </td>
                  <td>{formatCurrency(row.payment)}</td>
                  <td>{formatCurrency(row.balance)}</td>
                </tr>
              {/each}
            </tbody>
            <tfoot>
              <tr>
                <th scope="row">Jahressumme</th>
                <td>–</td>
                <td>{formatCurrency(year.interest)}</td>
                <td>{formatCurrency(year.principal)}</td>
                <td>{formatCurrency(year.specialPayment)}</td>
                <td>{formatCurrency(year.payment)}</td>
                <td>{formatCurrency(year.balance)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </details>
    {/each}
  </div>
</section>

<style>
  .intro, .scroll-hint {
    color: var(--loan-muted);
    font-size: 0.875rem;
  }

  .intro {
    margin: 0.3rem 0 1rem;
  }

  .years {
    border-top: 1px solid var(--loan-border);
  }

  details {
    margin: 0;
    border-bottom: 1px solid var(--loan-border);
  }

  summary {
    display: grid;
    grid-template-columns: minmax(4.5rem, 0.6fr) repeat(3, minmax(0, 1fr));
    align-items: center;
    gap: 0.45rem 0.75rem;
    min-block-size: 44px;
    margin: 0;
    padding: 0.65rem 0.5rem;
    color: var(--loan-ink);
    cursor: pointer;
  }

  summary:hover, details[open] > summary {
    background: var(--loan-tint);
  }

  details > summary::after {
    display: none;
  }

  .year-label {
    display: flex;
    align-items: center;
    gap: 0.45rem;
    color: var(--loan-accent);
    font-weight: 700;
  }

  .year-label::before {
    content: "";
    inline-size: 0.4em;
    block-size: 0.4em;
    border: solid currentColor;
    border-width: 0 2px 2px 0;
    transform: rotate(-45deg);
  }

  details[open] .year-label::before {
    transform: rotate(45deg);
  }

  .metric {
    display: grid;
    font-size: 0.8rem;
    color: var(--loan-muted);
    overflow-wrap: anywhere;
  }

  .metric strong {
    font-size: 0.875rem;
    color: var(--loan-ink);
  }

  .scroll-hint {
    margin: 0.65rem 0 0.35rem;
  }

  .table-scroll {
    max-inline-size: 100%;
    overflow-x: auto;
    margin-bottom: 0.65rem;
  }

  table {
    margin: 0;
    font-size: 0.85rem;
    font-variant-numeric: tabular-nums;
  }

  th, td {
    padding: 0.6rem;
    border-color: var(--loan-border);
    background: var(--loan-panel);
    color: var(--loan-ink);
    text-align: right;
    white-space: nowrap;
  }

  thead th, tfoot :is(th, td) {
    background: var(--loan-tint);
    font-weight: 650;
  }

  th:first-child {
    text-align: left;
  }

  .special {
    color: var(--loan-accent);
    font-weight: 700;
  }

  .unavailable {
    font-size: 0.8rem;
    color: var(--loan-muted);
  }

  @media (max-width: 34rem) {
    summary {
      grid-template-columns: repeat(2, minmax(0, 1fr));
    }
  }
</style>
