<header class="app-header">
  <div>
    <h1>Darlehensrechner</h1>
    <p>Simuliere, wie Sondertilgungen deine Monatsrate oder Laufzeit verändern.</p>
  </div>
  <a href="https://orange-goose.com" target="_blank" rel="noopener noreferrer">
    <img src="/orange_goose_logo.png" alt="Orange Goose" width="40" height="40" />
  </a>
</header>

<style>
  .app-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1rem;
    margin-bottom: 1.5rem;
  }

  h1 {
    margin: 0 0 0.25rem;
    font-size: clamp(1.4rem, 5vw, 2.25rem);
    overflow-wrap: anywhere;
  }

  p {
    margin: 0;
    color: var(--loan-muted);
  }

  a {
    display: grid;
    flex: none;
    place-items: center;
    min-width: 44px;
    min-height: 44px;
    border-radius: 0.5rem;
  }

  img {
    object-fit: contain;
  }
</style>
