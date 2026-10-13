/* Fomalhaut v1.0.3 Cursor class, adapted to local appearance preferences. Apache-2.0. */
(() => {
if (!matchMedia("(pointer: fine)").matches) return;
var CURSOR;

Math.lerp = (a, b, n) => (1 - n) * a + n * b;

const getStyle2 = (el, attr) => {
  try {
    return window.getComputedStyle
      ? window.getComputedStyle(el)[attr]
      : el.currentStyle[attr];
  } catch (e) { }
  return "";
};

// 为了屏蔽异步加载导致无法读取颜色值，这里统一用哈希表预处理
const map = new Map();
map.set('red', "rgb(239, 90, 90)");
map.set('orange', "rgb(228, 149, 66)");
map.set('yellow', "rgb(194, 205, 90)")
map.set('purple', "rgb(205, 90, 195)");
map.set('purepurple', "rgb(147, 90, 205)");
map.set('blue', "rgb(102, 204, 255)");
map.set('puregreen', "rgb(90, 205, 130)");
map.set('green', "rgb(57, 197, 187)");
map.set('pink', "rgb(237, 112, 155)");
map.set('black', "rgb(45, 45, 45)");
map.set('darkblue', "rgb(97, 100, 159)");
map.set('heoblue', "rgb(66, 90, 239)");
map.set('gray', "rgb(150, 150, 150)");
class Cursor {
  constructor() {
    this.pos = { curr: null, prev: null };
    this.pointerCache = new WeakMap();
    this.controlCache = new WeakMap();
    this.ancestorPointerCache = new WeakMap();
    this.__raf = null;
    this.__hoverDirty = false;
    this.create();
    this.init();
  }

  move(left, top) {
    const value = 'translate3d(' + left + 'px, ' + top + 'px, 0)';
    if (this.__transform !== value) {
      this.layer.style.transform = value;
      this.__transform = value;
    }
  }

  create() {
    if (!this.cursor) {
      // 位移与 #cursor.hover/active 的 scale 分层：保留原来的 16px 尺寸与 0.2s 缩放。
      this.layer = document.createElement('div');
      this.layer.id = 'cursor-position';
      Object.assign(this.layer.style, { position: 'fixed', left: '0px', top: '0px',
        width: '16px', height: '16px', pointerEvents: 'none', zIndex: '2147483647' });
      this.cursor = document.createElement('div');
      this.cursor.id = 'cursor';
      this.cursor.classList.add('hidden');
      this.cursor.style.left = '0px';
      this.cursor.style.top = '0px';
      this.layer.appendChild(this.cursor);
    }
    if (!this.layer.isConnected) document.body.appendChild(this.layer);
    if (!this.scr) this.scr = document.createElement('style');
    // 原地改样式，不移除；任何时候都不能露出文字区域的系统 I 形光标。
    if (!this.scr.isConnected) document.body.appendChild(this.scr);
    const color = getComputedStyle(document.documentElement).getPropertyValue('--theme-color').trim() || map.get('green');
    if (this.color !== color) {
      const svg = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 8 8" width="8px" height="8px"><circle cx="4" cy="4" r="4" fill="' + color + '"/></svg>';
      this.scr.textContent = '@media(pointer:fine){html *,html *::before,html *::after{cursor:url("data:image/svg+xml,' + encodeURIComponent(svg) + '") 4 4,auto!important}}';
      this.color = color;
    }
  }

  setClass(name, enabled) {
    if (this.cursor.classList.contains(name) !== enabled) this.cursor.classList.toggle(name, enabled);
  }

  isPointer(target) {
    if (target && target.nodeType !== 1) target = target.parentElement;
    if (!target || !target.isConnected) return false;
    // 控件身份与 CSS 结果分开缓存：子元素往返不再重复 closest / 祖先样式查询。
    let control = this.controlCache.get(target);
    if (control === undefined) {
      control = target.closest('a[href], button, summary, label, input[type="button"], input[type="submit"], input[type="reset"], [onclick], [role="button"], [role="link"], .wb-control > span');
      this.controlCache.set(target, control);
    }
    // WinBox 的标题栏按钮本来就是 cursor:pointer；标题和缩放边缘不走此快路径。
    // disabled 读当前值，不能把已禁用按钮的旧结果复用。
    if (control) return !control.disabled;
    if (this.pointerCache.has(target)) return this.pointerCache.get(target);
    let pointer = false;
    const path = [];
    for (let el = target; el; el = el.parentElement) {
      if (this.ancestorPointerCache.has(el)) {
        pointer = this.ancestorPointerCache.get(el);
        break;
      }
      path.push(el);
      if (getStyle2(el, 'cursor') === 'pointer') { pointer = true; break; }
    }
    // 保留原来的“任意祖先 pointer”语义；只在同一 hover / 样式版本共享祖先链。
    for (const el of path) this.ancestorPointerCache.set(el, pointer);
    this.pointerCache.set(target, pointer);
    return pointer;
  }

  invalidatePointer(hitTest, clearCache = true) {
    // 观察器可能在一帧内多次投递：这里只标脏，统一在 render 重建一次。
    this.__pointerInvalid = this.__pointerInvalid || clearCache;
    this.__hoverDirty = true;
    this.__hitTest = this.__hitTest || !!hitTest;
    if (this.pos.curr) this.start();
  }

  fpsOutputNode(node) {
    if (node.nodeType === 3) return true;
    if (node.nodeType !== 1 || node.tagName !== 'SPAN' || !node.getAttributeNames) return false;
    const attrs = node.getAttributeNames();
    return attrs.length === 1 && attrs[0] === 'style' &&
      /^\s*color\s*:\s*(?:#bd0000|red|orange|#9338e6|#08b7e4|#39c5bb)\s*;?\s*$/i.test(node.getAttribute('style')) &&
      [...node.childNodes].every(child => child.nodeType === 3);
  }

  pointerMutation(record) {
    const target = record.target;
    if (target === this.scr || this.scr.contains(target) ||
      target === this.layer || this.layer.contains(target)) return 0;
    // 精确排除已知纯装饰数据；不能泛化为忽略所有 class / style / 文本变化。
    if (record.type === 'attributes' && record.attributeName === 'data-msg' &&
      target.nodeType === 1 && target.classList.contains('neko')) return 0;
    const element = target.nodeType === 1 ? target : target.parentElement;
    const fps = element && element.closest('#fps');
    if (fps) {
      if (record.type === 'attributes' && record.attributeName === 'title' && target === fps) return 0;
      // 只豁免计数器已知的纯文字 / 着色 span 输出，未知控件或重排仍全失效。
      // 输出宽度变化可能改变命中元素，因此仍需重查位置。
      if (record.type === 'childList' && target === fps && record.addedNodes && record.removedNodes &&
        [...record.addedNodes, ...record.removedNodes].every(node => this.fpsOutputNode(node))) return 1;
      if (record.type === 'characterData' && (element === fps ||
        (element.parentElement === fps && this.fpsOutputNode(element)))) return 1;
    }
    return 2;
  }

  refresh() {
    this.create();
    this.setClass('active', false);
    this.invalidatePointer(true);
    // 不重绑事件、不重置位置、不创建第二条动画链；样式节点始终留在 DOM。
  }

  init() {
    if (this.__bound) return;
    this.__bound = true;
    const trackTarget = e => {
      if (this.target !== e.target) {
        this.target = e.target;
        this.__styleInvalid = true;
        this.__hoverDirty = true;
      }
    };
    document.addEventListener('mousemove', e => {
      trackTarget(e);
      this.pos.curr = { x: e.clientX - 8, y: e.clientY - 8 };
      this.setClass('hidden', false);
      this.start();
    }, { passive: true });
    document.addEventListener('mouseover', e => {
      trackTarget(e);
      // :hover / 兄弟选择器可能改变非语义区域的 cursor，下一帧更新 CSS 版本；
      // 控件身份缓存不受纯 hover 切换影响。
      this.__styleInvalid = true;
      this.__hoverDirty = true;
      if (this.pos.curr) this.start();
    }, { passive: true });
    document.addEventListener('mouseout', e => {
      this.target = e.relatedTarget;
      this.__styleInvalid = true;
      this.__hoverDirty = true;
      if (this.pos.curr) this.start();
    }, { passive: true });
    document.addEventListener('mouseenter', () => { if (this.pos.curr) this.setClass('hidden', false); });
    document.addEventListener('mouseleave', () => this.pause());
    window.addEventListener('blur', () => this.pause());
    document.addEventListener('mousedown', () => this.setClass('active', true));
    document.addEventListener('mouseup', () => this.setClass('active', false));
    document.addEventListener('visibilitychange', () => { if (document.hidden) this.pause(); });
    window.addEventListener('scroll', () => this.invalidatePointer(true), { passive: true });
    window.addEventListener('resize', () => this.invalidatePointer(true), { passive: true });
    document.addEventListener('pjax:complete', () => this.refresh());
    document.addEventListener('load', e => {
      if (e.target && e.target.tagName === 'LINK') this.invalidatePointer(true);
    }, true);
    if (typeof MutationObserver !== 'undefined') {
      this.observer = new MutationObserver(records => {
        let change = 0;
        for (const record of records) {
          change = Math.max(change, this.pointerMutation(record));
          if (change === 2) break;
        }
        if (change) this.invalidatePointer(true, change === 2);
      });
      this.observer.observe(document.documentElement, { subtree: true, childList: true, attributes: true, characterData: true });
    }
  }

  pause() {
    if (this.__raf !== null) cancelAnimationFrame(this.__raf);
    this.__raf = null;
    this.setClass('hidden', true);
    this.setClass('active', false);
    this.setClass('hover', false);
    this.target = null;
  }

  start() {
    if (this.__raf !== null || document.hidden || !this.pos.curr || this.cursor.classList.contains('hidden')) return;
    this.__raf = requestAnimationFrame(() => { this.__raf = null; this.render(); });
  }

  render() {
    const curr = this.pos.curr;
    if (!curr || document.hidden) return;
    // 样式读取必须在 transform / class 写入之前完成，且每帧只处理最后一个目标。
    if (this.__hoverDirty) {
      if (this.__hitTest) {
        const target = document.elementFromPoint(curr.x + 8, curr.y + 8);
        if (target !== this.target) this.__styleInvalid = true;
        this.target = target;
      }
      if (this.__pointerInvalid) this.controlCache = new WeakMap();
      if (this.__pointerInvalid || this.__styleInvalid) {
        this.pointerCache = new WeakMap();
        this.ancestorPointerCache = new WeakMap();
      }
      this.__pointerInvalid = this.__styleInvalid = false;
      const hover = this.isPointer(this.target);
      this.__hoverDirty = false;
      this.__hitTest = false;
      this.setClass('hover', hover);
    }
    if (!this.pos.prev) this.pos.prev = { x: curr.x, y: curr.y };
    const dx = curr.x - this.pos.prev.x, dy = curr.y - this.pos.prev.y;
    const moving = Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1;
    this.pos.prev.x = moving ? Math.lerp(this.pos.prev.x, curr.x, 0.15) : curr.x;
    this.pos.prev.y = moving ? Math.lerp(this.pos.prev.y, curr.y, 0.15) : curr.y;
    this.move(this.pos.prev.x, this.pos.prev.y);
    if (moving) this.start();
  }
}

(() => {
  CURSOR = new Cursor();
  window.CURSOR = CURSOR;
  document.addEventListener('skyler:appearancechange', () => CURSOR.refresh());
  document.addEventListener('mouseover', e => { if (e.target.tagName === 'IFRAME') CURSOR.pause(); });
})();

/* 听话鼠标 end */

})();
