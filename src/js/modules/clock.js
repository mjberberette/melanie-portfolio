import { qsa } from "../utils.js";

const formatter = new Intl.DateTimeFormat("en-US", {
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hour12: false,
  timeZone: "America/Denver",
});

export function initClock() {
  const nodes = qsa("[data-local-time]");
  if (!nodes.length) return;

  const tick = () => {
    const value = `${formatter.format(new Date())} MT`;
    nodes.forEach((node) => {
      node.textContent = value;
    });
  };

  tick();
  setInterval(tick, 1000);

  const year = document.getElementById("year");
  if (year) year.textContent = String(new Date().getFullYear());
}
