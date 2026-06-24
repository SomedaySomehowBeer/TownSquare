/**
 * Someday Somehow day/night cycle.
 *
 * Drives the scene sky + ground glow and the light/dark theme from the
 * visitor local clock, independent of their OS colour-scheme. The sky wash
 * runs black (midnight) -> light cream (midday) on a smooth cosine curve; the
 * ground wash uses the scene-items ink. widget.css paints the elliptical
 * horizon glow from the `--ss-sky-rgb` / `--ss-ground-rgb` triples set here,
 * gated on the `data-ss-daynight` marker. The theme flips light at 06:00 and
 * dark at 18:00 local.
 */

const SKY_NIGHT = [0, 0, 0];
const SKY_DAY = [241, 234, 214];
const GROUND_INK_LIGHT = [42, 41, 38];
const GROUND_INK_DARK = [236, 231, 221];
const LIGHT_FROM = 6;
const LIGHT_UNTIL = 18;
const REFRESH_MS = 5 * 60 * 1000;

/** 1 at local noon, 0 at midnight, smooth. */
function dayFactor(hours) {
  return (Math.cos(((hours - 12) / 12) * Math.PI) + 1) / 2;
}

function mixRgb(a, b, t) {
  return [
    Math.round(a[0] + (b[0] - a[0]) * t),
    Math.round(a[1] + (b[1] - a[1]) * t),
    Math.round(a[2] + (b[2] - a[2]) * t),
  ];
}

/**
 * @param {HTMLElement} root
 * @param {Date} now
 */
function apply(root, now) {
  const hours = now.getHours() + now.getMinutes() / 60;
  const sky = mixRgb(SKY_NIGHT, SKY_DAY, dayFactor(hours));
  const light = hours >= LIGHT_FROM && hours < LIGHT_UNTIL;
  const ground = light ? GROUND_INK_LIGHT : GROUND_INK_DARK;
  root.style.setProperty("--ss-sky-rgb", sky.join(", "));
  root.style.setProperty("--ss-ground-rgb", ground.join(", "));
  root.dataset.townsquareTheme = light ? "light" : "dark";
  root.dataset.ssDaynight = "on";
}

/**
 * Start the local-time day/night cycle on a mount root.
 *
 * @param {HTMLElement} root
 * @returns {() => void} stop
 */
export function startDayNight(root) {
  apply(root, new Date());
  const timer = setInterval(() => apply(root, new Date()), REFRESH_MS);
  return () => {
    clearInterval(timer);
    delete root.dataset.ssDaynight;
  };
}
