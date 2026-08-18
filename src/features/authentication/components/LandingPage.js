export function renderLanding(root, { onOpenAuth }) {
  root.innerHTML = `
    <main class="landing-shell">
      <nav class="nav"><a class="brand" href="#">chameleon<span>.</span></a><button class="button button-quiet" id="sign-in">Sign in</button></nav>
      <section class="hero">
        <p class="eyebrow">LIVE WEATHER + AIR QUALITY</p>
        <h1>Weather that changes<br />with your world.</h1>
        <p class="hero-copy">Your calm, colourful command centre for the forecast, air quality and the places you care about.</p>
        <div class="hero-actions"><button class="button button-primary" id="get-started">Create your dashboard <span>→</span></button><a href="#features" class="text-link">See what it does</a></div>
        <div class="hero-preview" aria-label="Weather dashboard preview"><div><span>NOW IN BENGALURU</span><strong>25°</strong><small>Scattered clouds · Feels like 26°</small></div><div class="preview-sun">☀</div><div class="preview-pill">Air quality <b>Fair</b></div></div>
      </section>
      <section id="features" class="feature-strip"><div><b>✦</b><span>Live conditions</span></div><div><b>◌</b><span>Air quality insights</span></div><div><b>⌁</b><span>Made for your routine</span></div></section>
    </main>`;
  root.querySelector("#sign-in").addEventListener("click", () => onOpenAuth("signin"));
  root.querySelector("#get-started").addEventListener("click", () => onOpenAuth("signup"));
}
