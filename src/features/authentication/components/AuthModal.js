export function renderAuthModal(root, { mode: initialMode, onSubmit, onClose }) {
  let mode = initialMode;
  const render = () => {
    const signup = mode === "signup";
    root.innerHTML = `<main class="auth-shell"><button class="brand brand-button" id="home">chameleon<span>.</span></button><section class="auth-card"><button class="close" id="close" aria-label="Close">×</button><p class="eyebrow">${signup ? "START YOUR JOURNEY" : "WELCOME BACK"}</p><h1>${signup ? "Make it yours." : "Good to see you."}</h1><p>${signup ? "Create a local demo account to save your weather preferences." : "Sign in to return to your personal weather space."}</p><form id="auth-form" novalidate>${signup ? `<label>Full name<input name="fullName" autocomplete="name" placeholder="Your name" required /></label>` : ""}<label>Email address<input name="email" type="email" autocomplete="email" placeholder="you@example.com" required /></label><label>Password<input name="password" type="password" autocomplete="current-password" placeholder="At least 8 characters" required /></label>${signup ? `<label>Confirm password<input name="confirmPassword" type="password" autocomplete="new-password" placeholder="Repeat your password" required /></label>` : ""}<p class="form-error" id="error" aria-live="polite"></p><button class="button button-primary full" type="submit">${signup ? "Create account" : "Sign in"} <span>→</span></button></form><p class="switch-copy">${signup ? "Already have an account?" : "New here?"} <button class="text-button" id="switch">${signup ? "Sign in" : "Create an account"}</button></p></section></main>`;
    root.querySelector("#close").addEventListener("click", onClose); root.querySelector("#home").addEventListener("click", onClose);
    root.querySelector("#switch").addEventListener("click", () => { mode = signup ? "signin" : "signup"; render(); });
    root.querySelector("#auth-form").addEventListener("submit", async (event) => { event.preventDefault(); const result = await onSubmit(mode, Object.fromEntries(new FormData(event.currentTarget))); if (!result.ok) root.querySelector("#error").textContent = result.message; });
  };
  render();
}
