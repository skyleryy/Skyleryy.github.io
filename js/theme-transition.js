/* Fomalhaut's standard sunset/sunrise stage, adapted from its public shell.js.
 * Shared by the top bar and context menu; no network requests or persistent animation. */
'use strict';
(() => {
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let active = null;
  const clear = () => {
    if (!active) return;
    active.timers.forEach(clearTimeout);
    active.node.remove();
    active = null;
  };
  window.skylerThemeTransition = (toDark, event) => {
    // Repeated activation should switch immediately, never stack fullscreen stages.
    if (active) { clear(); return; }
    if (reducedMotion.matches || document.hidden) return;
    const node = document.createElement('div');
    node.className = 'dm-stage';
    node.dataset.to = toDark ? 'dark' : 'light';
    node.dataset.tier = 'standard';
    node.setAttribute('aria-hidden', 'true');
    node.innerHTML = '<div class="dm-sky"></div><div class="dm-dusk"></div><div class="dm-stars"></div><div class="dm-sun"></div><div class="dm-moon"></div><div class="dm-horizon"></div><div class="dm-glow"></div><div class="dm-meteor"></div>';
    const rect = document.getElementById('nightmode-button')?.getBoundingClientRect();
    const pointed = event && event.detail > 0 && Number.isFinite(event.clientX) && Number.isFinite(event.clientY);
    const x = pointed ? event.clientX : rect ? rect.left + rect.width / 2 : innerWidth - 48;
    const y = pointed ? event.clientY : rect ? rect.top + rect.height / 2 : 48;
    node.style.setProperty('--dm-x', Math.round(Math.max(0, Math.min(innerWidth, x))) + 'px');
    node.style.setProperty('--dm-y', Math.round(Math.max(0, Math.min(innerHeight, y))) + 'px');
    const count = innerWidth <= 600 ? 20 : 40;
    const first = Math.round(count * .2);
    const stars = node.querySelector('.dm-stars');
    for (let i = 0; i < count; i++) {
      const star = document.createElement('span');
      star.className = 'dm-star';
      const delay = i < first ? 480 + 20 * i : 880 + 12 * (i - first);
      star.style.cssText = `--dm-sx:${(Math.random()*98+1).toFixed(2)}%;--dm-sy:${(Math.random()*56+2).toFixed(2)}%;--dm-ss:${Math.random()<.25?2.6:1.8}px;--dm-sd:${delay}ms;--dm-so:${(.6+Math.random()*.4).toFixed(2)};`;
      stars.append(star);
    }
    document.body.append(node);
    const entry = {node, timers: []};
    active = entry;
    const speed = toDark ? 1 : .8;
    entry.timers.push(setTimeout(() => {
      if (active === entry) node.classList.add('is-reveal');
    }, 1150 * speed));
    entry.timers.push(setTimeout(() => {
      if (active === entry) clear();
    }, 1500 * speed));
  };
  reducedMotion.addEventListener('change', clear);
  document.addEventListener('visibilitychange', () => { if (document.hidden) clear(); });
  addEventListener('pagehide', clear);
})();
