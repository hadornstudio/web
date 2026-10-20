// Wipes away the first-load splash from index.html once the page has really loaded: window load, fonts ready,
// and at least MIN_MS on screen so the mark gets to finish assembling. A hard cap keeps a stalled asset from
// trapping visitors. (index.html marks the home logo intro as seen, because the splash replaces it for this visit.)
const MIN_MS = 2000;
const MAX_MS = 7000;

export function dismissSplash() {
  const splash = document.getElementById('splash');
  if (!splash) return;

  const loaded = new Promise((resolve) => {
    if (document.readyState === 'complete') resolve();
    else window.addEventListener('load', resolve, { once: true });
  });
  const fonts = document.fonts?.ready ?? Promise.resolve();
  const minimum = new Promise((resolve) => setTimeout(resolve, Math.max(0, MIN_MS - performance.now())));
  const cap = new Promise((resolve) => setTimeout(resolve, Math.max(0, MAX_MS - performance.now())));

  Promise.race([Promise.all([loaded, fonts, minimum]), cap]).then(() => {
    splash.classList.add('is-leaving');
    splash.setAttribute('aria-hidden', 'true');
    setTimeout(() => splash.remove(), 1100);
  });
}
