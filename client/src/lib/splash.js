// Fades out the first-load splash from index.html once the page has really loaded: window load, fonts ready,
// and at least MIN_MS on screen so it never just flashes. A hard cap keeps a stalled asset from trapping visitors.
const MIN_MS = 1100;
const MAX_MS = 6000;

export function dismissSplash() {
  const splash = document.getElementById('splash');
  if (!splash) return;

  const loaded = new Promise((resolve) => {
    if (document.readyState === 'complete') resolve();
    else window.addEventListener('load', resolve, { once: true });
  });
  const fonts = document.fonts?.ready ?? Promise.resolve();
  const minimum = new Promise((resolve) => setTimeout(resolve, Math.max(0, MIN_MS - performance.now())));
  const cap = new Promise((resolve) => setTimeout(resolve, MAX_MS - performance.now()));

  Promise.race([Promise.all([loaded, fonts, minimum]), cap]).then(() => {
    splash.classList.add('is-hidden');
    splash.setAttribute('aria-hidden', 'true');
    setTimeout(() => splash.remove(), 700);
  });
}
