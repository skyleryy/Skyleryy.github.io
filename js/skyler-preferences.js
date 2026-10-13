/* Apply saved appearance before the page paints. No network or continuous effects. */
(() => {
  try {
    const p = JSON.parse(localStorage.getItem('skyler-appearance') || '{}');
    if (/^#[0-9a-f]{6}$/i.test(p.color || '')) document.documentElement.style.setProperty('--theme-color', p.color);
    if ([15, 16, 18].includes(p.size)) document.documentElement.style.setProperty('--skyler-font-size', p.size + 'px');
    if (p.font === 'system-ui') document.documentElement.style.setProperty('--global-font', 'system-ui');
    if (Number.isInteger(p.opacity) && p.opacity >= 40 && p.opacity <= 100) {
      document.documentElement.style.setProperty('--trans-light', `rgba(250,250,250,${p.opacity/100})`);
      document.documentElement.style.setProperty('--trans-dark', `rgba(28,28,28,${p.opacity/100})`);
    }
    if (p.wallpaper === 'day' || p.wallpaper === 'night') {
      const image = `url('/assets/skyler/${p.wallpaper === 'night' ? 'night' : 'daily'}.webp')`;
      for (const key of ['--default-bg','--darkmode-bg','--mobileday-bg','--mobilenight-bg']) document.documentElement.style.setProperty(key, image);
    }
  } catch (_) { /* A blocked storage API should never prevent rendering. */ }
})();
