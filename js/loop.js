// Frame loop that is cheap on battery: capped frame rate, pauses when the page is hidden,
// and stops entirely when stopped. Callers can also skip drawing when nothing changed.
export function createLoop(fn, getFps = () => 30) {
  let raf = 0;
  let last = 0;
  let running = false;

  function tick(t) {
    if (!running) return;
    raf = requestAnimationFrame(tick);
    const interval = 1000 / getFps();
    const dt = t - last;
    if (dt < interval - 2) return;
    last = t;
    fn(Math.min(dt, 100) / 1000, t);
  }
  function onVis() {
    if (document.hidden) {
      cancelAnimationFrame(raf);
      raf = 0;
    } else if (running && !raf) {
      last = performance.now();
      raf = requestAnimationFrame(tick);
    }
  }
  document.addEventListener('visibilitychange', onVis);
  return {
    start() {
      if (running) return;
      running = true;
      last = performance.now();
      if (!document.hidden) raf = requestAnimationFrame(tick);
    },
    stop() {
      running = false;
      cancelAnimationFrame(raf);
      raf = 0;
    },
    get running() {
      return running;
    },
    destroy() {
      running = false;
      cancelAnimationFrame(raf);
      document.removeEventListener('visibilitychange', onVis);
    },
  };
}

export function dprFor(settings) {
  const cap = settings.saver ? 1.5 : 2;
  return Math.min(window.devicePixelRatio || 1, cap);
}
export const fpsFor = (settings) => (settings.saver ? 30 : 60);
