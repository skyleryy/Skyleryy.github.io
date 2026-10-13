'use strict';

window.scrollToTop = () => window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' });
window.switchNightMode = () => {
  const dark = document.documentElement.dataset.theme !== 'dark';
  (dark ? window.activateDarkMode : window.activateLightMode)();
  try { saveToLocal.set('theme', dark ? 'dark' : 'light', 365); } catch (_) {}
  document.getElementById('nightmode-button')?.setAttribute('aria-pressed', String(dark));
  document.getElementById('modeicon')?.setAttribute('xlink:href', dark ? '#icon-sun' : '#icon-moon');
};
window.toggleWinbox = () => {
  const panel = document.getElementById('appearance-dialog');
  if (panel.open) panel.close(); else panel.showModal();
};

(() => {
  const panel = document.createElement('dialog');
  panel.id = 'appearance-dialog';
  panel.setAttribute('aria-labelledby', 'appearance-title');
  panel.innerHTML = `<form method="dialog"><div class="appearance-heading"><h2 id="appearance-title">美化设置</h2><button aria-label="关闭外观设置" class="appearance-close">×</button></div><div class="appearance-body">
    <button type="button" id="reset-appearance">⟳ 恢复默认设置</button>
    <h3>🌸 一、显示偏好</h3><section class="appearance-section"><div class="appearance-row"><label for="appearance-opacity">卡片不透明度</label><output id="appearance-opacity-value">96%</output></div><p>实时预览，只调整卡片底色，文字保持清晰。</p><input type="range" id="appearance-opacity" min="40" max="100" step="1" value="96"><div class="range-caption"><span>40% · 通透</span><span>100% · 不透明</span></div></section>
    <section class="appearance-section"><fieldset><legend>文字大小</legend><div class="size-options"><button type="button" data-size="15">标准</button><button type="button" data-size="16">舒适</button><button type="button" data-size="18">大字</button></div></fieldset><fieldset><legend>正文字体</legend><div class="size-options"><button type="button" data-font="LXGWScreen">霞鹜文楷</button><button type="button" data-font="system-ui">系统字体</button></div></fieldset></section>
    <h3>🎨 二、主题颜色</h3><section class="appearance-section"><div class="color-options">
    ${[['#39c5bb','薄荷绿'],['#66ccff','晴空蓝'],['#ef5a5a','朱红'],['#e49542','橙色'],['#c2cd5a','浅黄'],['#cd5ac3','紫红'],['#935acd','浅紫'],['#5acd82','青草绿'],['#ed709b','樱花粉'],['#61649f','靛蓝'],['#425aef','宝蓝'],['#969696','灰色']].map(([c,n])=>`<button type="button" data-color="${c}" style="--swatch:${c}" aria-label="${n}" title="${n}"></button>`).join('')}
    </div></section><h3>🌌 三、背景图片</h3><section class="appearance-section"><div class="wallpaper-options"><button type="button" data-wallpaper="auto" style="background-image:url('/assets/skyler/daily.webp')"><span>随昼夜切换</span></button><button type="button" data-wallpaper="day" style="background-image:url('/assets/skyler/daily.webp')"><span>日间背景</span></button><button type="button" data-wallpaper="night" style="background-image:url('/assets/skyler/night.webp')"><span>夜间背景</span></button></div></section>
    <p class="appearance-footnote">外观设置只保存在这台设备上。</p></div></form>`;
  document.body.append(panel);
  const read = () => { try { return JSON.parse(localStorage.getItem('skyler-appearance') || '{}'); } catch (_) { return {}; } };
  const select = p => {
    panel.querySelectorAll('[data-color]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.color === (p.color || '#39c5bb'))));
    panel.querySelectorAll('[data-size]').forEach(b => b.setAttribute('aria-pressed', String(+b.dataset.size === (p.size || 15))));
    panel.querySelectorAll('[data-font]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.font === (p.font || 'LXGWScreen'))));
    panel.querySelectorAll('[data-wallpaper]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.wallpaper === (p.wallpaper || 'auto'))));
    panel.querySelector('#appearance-opacity').value = p.opacity || 96;
    panel.querySelector('#appearance-opacity-value').textContent = (p.opacity || 96) + '%';
  };
  const apply = p => {
    const root = document.documentElement.style;
    root.setProperty('--theme-color', p.color || '#39c5bb');
    root.setProperty('--skyler-font-size', (p.size || 15.5) + 'px');
    root.setProperty('--global-font', p.font === 'system-ui' ? 'system-ui' : 'LXGWScreen');
    const alpha = (p.opacity || 96) / 100;
    root.setProperty('--trans-light', `rgba(250,250,250,${alpha})`);
    root.setProperty('--trans-dark', `rgba(28,28,28,${alpha})`);
    for (const key of ['--default-bg','--darkmode-bg','--mobileday-bg','--mobilenight-bg']) root.removeProperty(key);
    if (p.wallpaper === 'day' || p.wallpaper === 'night') {
      const image = `url('/assets/skyler/${p.wallpaper === 'night' ? 'night' : 'daily'}.webp')`;
      for (const key of ['--default-bg','--darkmode-bg','--mobileday-bg','--mobilenight-bg']) root.setProperty(key, image);
    }
    try { localStorage.setItem('skyler-appearance', JSON.stringify(p)); } catch (_) {}
    select(p);
    document.dispatchEvent(new Event("skyler:appearancechange"));
  };
  select(read());
  panel.addEventListener('click', e => {
    if (e.target === panel) { const r = panel.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) panel.close(); }
    const b = e.target.closest('button'); if (!b) return;
    let p = read();
    if (b.dataset.color) p.color = b.dataset.color;
    else if (b.dataset.size) p.size = +b.dataset.size;
    else if (b.dataset.font) p.font = b.dataset.font;
    else if (b.dataset.wallpaper) p.wallpaper = b.dataset.wallpaper;
    else if (b.id === 'reset-appearance') p = {};
    else return;
    apply(p);
  });
  panel.querySelector('#appearance-opacity').addEventListener('input', e => apply({...read(), opacity:+e.target.value}));
  document.querySelectorAll('#nav .site-page.group').forEach(trigger => {
    trigger.setAttribute('aria-haspopup', 'true');
    trigger.addEventListener('keydown', event => {
      if (event.key === ' ' || event.key === 'ArrowDown') {
        event.preventDefault();
        trigger.nextElementSibling?.querySelector('a')?.focus();
      }
    });
  });
  const title = document.getElementById('page-name');
  if (title) title.textContent = document.title.split(' | ')[0];
  const navTitle = () => document.getElementById('nav')?.classList.toggle('skyler-scrolled', scrollY > 60);
  addEventListener('scroll', navTitle, {passive:true}); navTitle();
  for (const id of ['meihua-button', 'nightmode-button']) document.getElementById(id)?.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); e.currentTarget.click(); } });
  document.getElementById('nightmode-button')?.setAttribute('aria-pressed', String(document.documentElement.dataset.theme === 'dark'));
  // Native image loading avoids a separate lazy-load library and placeholder flashes.
  document.querySelectorAll('#article-container img, .recent-post-item img, .article-sort img').forEach(img => { img.loading = 'lazy'; img.decoding = 'async'; });
})();

window.share = async () => { try { await navigator.clipboard.writeText(document.title + '\n' + location.href); const b=document.querySelector('#rightside button.share'); if(b){b.title='链接已复制';setTimeout(()=>b.title='分享链接',1800);} } catch (_) { window.prompt('复制文章链接', location.href); } };
