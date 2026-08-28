import { qs } from "../utils.js";

const EMAIL = "hello@melanieberberette.com";

export function initContact() {
  const button = qs("#copy-email");
  const state = qs("#copy-state");
  if (!button || !state) return;

  let timer = 0;

  button.addEventListener("click", async () => {
    try {
      await navigator.clipboard.writeText(EMAIL);
      state.textContent = "Copied";
      button.classList.add("is-copied");
      clearTimeout(timer);
      timer = window.setTimeout(() => {
        state.textContent = "Copy";
        button.classList.remove("is-copied");
      }, 2200);
    } catch {
      window.location.href = `mailto:${EMAIL}`;
    }
  });
}
