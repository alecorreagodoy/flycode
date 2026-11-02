/*!
 * FlyCode · From Idea to Reality (fc-idea) v1.0.0
 * Componente visual del hero: una idea se convierte, en cinco fases, en una web terminada.
 * HTML + CSS 3D + JavaScript vanilla. Sin dependencias ni recursos externos.
 *
 *   <div class="fci fci--hero" data-fc-idea></div>
 *   <link rel="stylesheet" href="/assets/fc-idea/fc-idea.css">
 *   <script src="/assets/fc-idea/fc-idea.js" defer></script>
 *
 *   API: const v = FlyCodeIdea.mount(el, opciones)
 *        v.play()  v.pause()  v.goTo(n)  v.setOptions({...})  v.refreshColors()  v.destroy()
 */
(function (root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.FlyCodeIdea = factory();
})(typeof self !== 'undefined' ? self : this, function () {
  'use strict';

  var DEFAULTS = {
    labels: ['01 Idea', '02 Estructura', '03 Diseño', '04 Código', '05 Lanzamiento'],
    durations: [2200, 2600, 3000, 3000, 4200], // ms por fase (la última es la pausa final)
    speed: 1,          // multiplicador de velocidad del relato (0.5 = más lento)
    loop: true,        // false: se reproduce una vez y se queda en «Lanzamiento»
    pointer: true,     // inclinación sutil con el cursor (solo ratón/trackpad)
    tilt: 1,           // 0–2 · intensidad de la inclinación
    scroll: true,      // al hacer scroll el tablero se eleva, se aplana y se desvanece un poco
    steps: true,       // muestra la línea de fases
    align: 'center',   // 'center' | 'left' | 'right' · alineación del lienzo dentro del contenedor
    title: 'Tu idea,\nen producción.', // texto de la web simulada
    brand: 'Tu marca',
    button: 'Empezar',
    status: 'EN PRODUCCIÓN',
    motion: 'auto'     // 'auto' respeta prefers-reduced-motion · 'reduced' · 'full'
  };

  var W = 640, H = 560; // lienzo interno de diseño

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  function template(o) {
    var t = esc(o.title).replace(/\n/g, '<br>');
    var code = [
      '<b>&lt;section</b> class="hero"<b>&gt;</b>',
      '  <b>&lt;h1&gt;</b>' + esc(o.title.replace(/\n/g, ' ')) + '<b>&lt;/h1&gt;</b>',
      '  <b>&lt;a</b> class="btn"<b>&gt;</b>' + esc(o.button) + '<b>&lt;/a&gt;</b>',
      '<b>&lt;/section&gt;</b>',
      '<b>&lt;ul</b> class="grid"<b>&gt;</b>',
      '  <b>&lt;li&gt;</b>…<b>&lt;/li&gt;</b>',
      '<b>&lt;/ul&gt;</b>'
    ].map(function (l, i) { return '<span style="--d:' + i + '">' + l + '</span>'; }).join('');
    var steps = o.labels.map(function (l, i) { return '<div data-i="' + i + '">' + esc(l) + '</div>'; }).join('');
    return '' +
      '<div class="fci-scene">' +
        '<div class="fci-halo"></div><div class="fci-floor"></div>' +
        '<div class="fci-board">' +
          '<div class="fci-plane fci-code">' + code + '</div>' +
          '<div class="fci-plane fci-frame"><i></i><i></i></div>' +
          '<div class="fci-plane fci-page">' +
            '<div class="fci-guides"></div>' +
            '<div class="fci-blk fci-b-nav" style="--d:0"><span class="fci-t fci-logo">' + esc(o.brand) + '</span><span class="fci-links"></span></div>' +
            '<div class="fci-blk fci-b-hero" style="--d:1"><span class="fci-t fci-title" style="--d:2">' + t + '</span><span class="fci-sub"></span></div>' +
            '<div class="fci-blk fci-b-img" style="--d:2"><div class="fci-img"></div></div>' +
            '<div class="fci-blk fci-b-c1" style="--d:3"><i class="fci-line" style="top:18px;width:56%;--d:4"></i><i class="fci-line" style="top:35px;width:78%;--d:5"></i></div>' +
            '<div class="fci-blk fci-b-c2" style="--d:4"><i class="fci-line" style="top:18px;width:44%;--d:5"></i><i class="fci-line" style="top:35px;width:78%;--d:6"></i></div>' +
            '<div class="fci-blk fci-b-c3" style="--d:5"><i class="fci-line" style="top:18px;width:62%;--d:6"></i><i class="fci-line" style="top:35px;width:78%;--d:7"></i></div>' +
            '<div class="fci-idea"></div><div class="fci-crease"></div>' +
            '<div class="fci-sheen"></div>' +
          '</div>' +
          '<div class="fci-plane fci-comp">' +
            '<span class="fci-btn">' + esc(o.button) + ' <span aria-hidden="true">↗</span></span>' +
            '<span class="fci-live-chip">' + esc(o.status) + '</span>' +
          '</div>' +
          '<div class="fci-plane fci-tokens">' +
            '<i style="background:var(--fci-midnight)"></i><i style="background:var(--fci-brand)"></i>' +
            '<i style="background:var(--fci-paper)"></i><i style="background:var(--fci-signal)"></i><b>Aa</b>' +
          '</div>' +
        '</div>' +
      '</div>' +
      (o.steps ? '<div class="fci-steps">' + steps + '</div>' : '');
  }

  function parseRGB(str) {
    var c = document.createElement('canvas').getContext('2d');
    c.fillStyle = '#000'; c.fillStyle = (str || '').trim() || '#120e1c';
    var v = c.fillStyle;
    if (v.charAt(0) === '#') return [parseInt(v.substr(1, 2), 16), parseInt(v.substr(3, 2), 16), parseInt(v.substr(5, 2), 16)];
    var m = v.match(/[\d.]+/g) || [0, 0, 0]; return [+m[0], +m[1], +m[2]];
  }

  function readData(el) {
    var d = el.dataset, o = {};
    if (d.speed) o.speed = parseFloat(d.speed);
    if (d.tilt) o.tilt = parseFloat(d.tilt);
    ['loop', 'pointer', 'scroll', 'steps'].forEach(function (k) { if (d[k] != null) o[k] = d[k] !== 'false'; });
    ['align', 'motion', 'title', 'brand', 'button', 'status'].forEach(function (k) { if (d[k]) o[k] = d[k].replace(/\\n/g, '\n'); });
    if (d.labels) o.labels = d.labels.split('|');
    return o;
  }

  /* ------------------------------------------------------------------ */
  function Idea(el, options) {
    this.el = el;
    this.opt = Object.assign({}, DEFAULTS, readData(el), options || {});
    this.phase = 0;
    this.t = 0;            // tiempo dentro de la fase (ms)
    this.clock = 0;        // tiempo total (s) para el balanceo
    this.cam = { x: 0, y: 0, tx: 0, ty: 0 };
    this.scrollP = 0; this.scrollS = 0;
    this.running = false; this.visible = true; this._paused = false;
    this._b = {};
    this._init();
  }

  Idea.prototype._init = function () {
    var self = this, el = this.el, o = this.opt;
    el.classList.add('fci');
    el.setAttribute('aria-hidden', 'true');
    if (navigator.connection && navigator.connection.saveData) { el.classList.add('is-static'); return; } // ahorro de datos: solo póster

    this.live = document.createElement('div');
    this.live.className = 'fci__live';
    this.live.innerHTML = template(o);
    el.appendChild(this.live);
    this.board = this.live.querySelector('.fci-board');
    this.stepEls = this.live.querySelectorAll('.fci-steps div');

    this.mqReduce = window.matchMedia ? matchMedia('(prefers-reduced-motion: reduce)') : null;
    this.mqFine = window.matchMedia ? matchMedia('(hover: hover) and (pointer: fine)') : null;
    this.mqSmall = window.matchMedia ? matchMedia('(max-width: 767px)') : null;

    this.refreshColors();

    this._b.resize = function () { self._fit(); };
    this._b.move = function (e) { self._onPointer(e); };
    this._b.leave = function () { self.cam.tx = 0; self.cam.ty = 0; };
    this._b.scroll = function () { self._onScroll(); };
    this._b.vis = function () { self._sync(); };
    this._b.motion = function () { self._applyMotionPref(); };
    this._b.frame = function (now) { self._frame(now); };

    if ('ResizeObserver' in window) { this.ro = new ResizeObserver(this._b.resize); this.ro.observe(el); }
    else window.addEventListener('resize', this._b.resize);
    if ('IntersectionObserver' in window) {
      this.io = new IntersectionObserver(function (en) { self.visible = en[0].isIntersecting; self._sync(); }, { threshold: 0.01 });
      this.io.observe(el);
    }
    window.addEventListener('pointermove', this._b.move, { passive: true });
    document.documentElement.addEventListener('pointerleave', this._b.leave);
    window.addEventListener('scroll', this._b.scroll, { passive: true });
    document.addEventListener('visibilitychange', this._b.vis);
    if (this.mqReduce) (this.mqReduce.addEventListener ? this.mqReduce.addEventListener('change', this._b.motion) : this.mqReduce.addListener(this._b.motion));

    this._fit();
    this._onScroll();
    this._applyMotionPref();
    requestAnimationFrame(function () { el.classList.add('is-live'); });
  };

  Idea.prototype._reduced = function () {
    if (this.opt.motion === 'reduced') return true;
    if (this.opt.motion === 'full') return false;
    return !!(this.mqReduce && this.mqReduce.matches);
  };

  Idea.prototype._applyMotionPref = function () {
    if (this._reduced()) {
      // Alternativa estática: la web terminada, compuesta y sin movimiento
      this.el.classList.add('fci--still');
      this._setPhase(4, true);
      this.cam.x = this.cam.y = this.cam.tx = this.cam.ty = 0;
      this._pose();
    } else {
      this.el.classList.remove('fci--still');
      if (this._stillShown || this.el.dataset.phase == null) { this._stillShown = false; this._setPhase(0, true); }
    }
    this._sync();
  };

  Idea.prototype._sync = function () {
    var should = !this._paused && this.visible && !document.hidden && !this._reduced();
    if (should && !this.running) { this.running = true; this._last = 0; this._raf = requestAnimationFrame(this._b.frame); }
    else if (!should && this.running) { this.running = false; cancelAnimationFrame(this._raf); }
  };

  Idea.prototype.refreshColors = function () {
    var bg = parseRGB(getComputedStyle(this.el).getPropertyValue('--fci-bg'));
    var lum = (0.2126 * bg[0] + 0.7152 * bg[1] + 0.0722 * bg[2]) / 255;
    this.el.classList.toggle('fci--on-light', lum > 0.5);
  };

  // Escala el lienzo de 640×560 para que quepa en el contenedor (sin deformar)
  Idea.prototype._fit = function () {
    if (!this.live) return;
    var r = this.el.getBoundingClientRect();
    var s = Math.min(r.width / W, r.height / H);
    if (!isFinite(s) || s <= 0) s = 1;
    var x = (r.width - W * s) / 2, y = (r.height - H * s) / 2;
    if (this.opt.align === 'left') x = 0;
    if (this.opt.align === 'right') x = r.width - W * s;
    this.live.style.setProperty('--fci-scale', s.toFixed(4));
    this.live.style.setProperty('--fci-x', x.toFixed(1) + 'px');
    this.live.style.setProperty('--fci-y', y.toFixed(1) + 'px');
    var compact = !!(this.mqSmall && this.mqSmall.matches);
    this.el.classList.toggle('fci--compact', compact);
  };

  Idea.prototype._onPointer = function (e) {
    if (!this.opt.pointer || !this.mqFine || !this.mqFine.matches || this._reduced()) return;
    // relativo al contenedor del hero (o a la ventana si no hay padre)
    var host = this.el.parentElement || document.documentElement;
    var r = host.getBoundingClientRect();
    if (e.clientY < r.top || e.clientY > r.bottom) { this.cam.tx = 0; this.cam.ty = 0; return; }
    var nx = clamp((e.clientX - r.left) / r.width, 0, 1) - 0.5;
    var ny = clamp((e.clientY - r.top) / r.height, 0, 1) - 0.5;
    this.cam.tx = nx * 12 * this.opt.tilt;   // grados de giro Y
    this.cam.ty = ny * 8 * this.opt.tilt;    // grados de giro X
  };

  Idea.prototype._onScroll = function () {
    if (!this.opt.scroll) { this.scrollP = 0; return; }
    var r = this.el.getBoundingClientRect();
    this.scrollP = clamp(-r.top / Math.max(1, r.height), 0, 1);
    if (!this.running) { this.scrollS = this.scrollP; this._pose(); }
  };

  Idea.prototype._setPhase = function (n, instant) {
    var el = this.el;
    this.phase = n; this.t = 0;
    if (instant) el.classList.add('fci--still');
    el.dataset.phase = n;
    for (var i = 1; i <= 4; i++) el.classList.toggle('fci--s' + i, n >= i);
    el.classList.remove('fci--out', 'fci--sheen');
    if (n === 4) { clearTimeout(this._sheenT); this._sheenT = setTimeout(function () { el.classList.add('fci--sheen'); }, instant ? 0 : 900); }
    for (var k = 0; k < this.stepEls.length; k++) {
      var s = this.stepEls[k];
      s.classList.toggle('is-done', k < n);
      s.classList.toggle('is-now', k === n);
      s.style.setProperty('--p', k === n ? (n === 4 ? 1 : 0) : 0);
    }
    if (n === 4 && instant) this._stillShown = true;
    if (instant && !this._reduced()) { var e2 = el; requestAnimationFrame(function () { requestAnimationFrame(function () { e2.classList.remove('fci--still'); }); }); }
  };

  Idea.prototype._frame = function (now) {
    if (!this.running) return;
    this._raf = requestAnimationFrame(this._b.frame);
    var dt = this._last ? Math.min(64, now - this._last) : 16;
    this._last = now;
    this.clock += dt / 1000;

    // Relato
    var dur = this.opt.durations[this.phase] / Math.max(0.1, this.opt.speed);
    this.t += dt;
    var p = clamp(this.t / dur, 0, 1);
    var cur = this.stepEls[this.phase];
    if (cur && this.phase < 4) cur.style.setProperty('--p', p.toFixed(3));
    if (cur && this.phase === 4) cur.style.setProperty('--p', clamp(this.t / 800, 0, 1).toFixed(3));
    if (this.t >= dur) {
      if (this.phase < 4) this._setPhase(this.phase + 1);
      else if (this.opt.loop) this._restart();
      else this.t = dur; // se queda en «Lanzamiento»
    }

    // Cámara: cursor + balanceo lento + scroll (todo suavizado)
    var k = 1 - Math.pow(0.02, dt / 1000);
    this.cam.x = lerp(this.cam.x, this.cam.tx, k);
    this.cam.y = lerp(this.cam.y, this.cam.ty, k);
    this.scrollS = lerp(this.scrollS, this.scrollP, 1 - Math.pow(0.004, dt / 1000));
    this._pose();
  };

  Idea.prototype._restart = function () {
    var self = this;
    if (this._restarting) return;
    this._restarting = true;
    this.el.classList.add('fci--out');
    clearTimeout(this._outT);
    this._outT = setTimeout(function () { self._restarting = false; self._setPhase(0); }, 900);
  };

  Idea.prototype._pose = function () {
    if (!this.board) return;
    var still = this._reduced();
    var sway = still ? 0 : 1;
    var ry = -24 + this.cam.x + Math.sin(this.clock * 0.4) * 2.2 * sway;
    var rx = 16 - this.cam.y + Math.sin(this.clock * 0.31) * 1.2 * sway - this.scrollS * 8;
    var lift = -this.scrollS * 40 + Math.sin(this.clock * 0.6) * 4 * sway;
    var st = this.board.style;
    st.setProperty('--fci-ry', ry.toFixed(2) + 'deg');
    st.setProperty('--fci-rx', rx.toFixed(2) + 'deg');
    st.setProperty('--fci-lift', lift.toFixed(1) + 'px');
    this.live.style.opacity = this.el.classList.contains('is-live') ? (1 - this.scrollS * 0.5).toFixed(3) : '';
  };

  /* ---- API ---- */
  Idea.prototype.play = function () { this._paused = false; this._sync(); return this; };
  Idea.prototype.pause = function () { this._paused = true; this._sync(); return this; };
  Idea.prototype.goTo = function (n) { this._setPhase(clamp(n | 0, 0, 4)); return this; };
  Idea.prototype.setOptions = function (next) {
    var rebuild = next && ('labels' in next || 'title' in next || 'brand' in next || 'button' in next || 'status' in next || 'steps' in next);
    this.opt = Object.assign({}, this.opt, next || {});
    if (rebuild && this.live) {
      this.live.innerHTML = template(this.opt);
      this.board = this.live.querySelector('.fci-board');
      this.stepEls = this.live.querySelectorAll('.fci-steps div');
      this._setPhase(this.phase, true);
    }
    if (next && 'motion' in next) this._applyMotionPref();
    this._fit(); this._sync();
    return this;
  };
  Idea.prototype.destroy = function () {
    this.running = false; cancelAnimationFrame(this._raf);
    clearTimeout(this._outT); clearTimeout(this._sheenT);
    if (this.ro) this.ro.disconnect(); else if (this._b.resize) window.removeEventListener('resize', this._b.resize);
    if (this.io) this.io.disconnect();
    if (this._b.move) window.removeEventListener('pointermove', this._b.move);
    if (this._b.leave) document.documentElement.removeEventListener('pointerleave', this._b.leave);
    if (this._b.scroll) window.removeEventListener('scroll', this._b.scroll);
    if (this._b.vis) document.removeEventListener('visibilitychange', this._b.vis);
    if (this.mqReduce && this._b.motion) (this.mqReduce.removeEventListener ? this.mqReduce.removeEventListener('change', this._b.motion) : this.mqReduce.removeListener(this._b.motion));
    if (this.live && this.live.parentNode) this.live.parentNode.removeChild(this.live);
    var el = this.el;
    el.classList.remove('is-live', 'fci--s1', 'fci--s2', 'fci--s3', 'fci--s4', 'fci--out', 'fci--sheen', 'fci--still', 'fci--compact', 'fci--on-light');
    delete el.dataset.phase;
    delete el.__fcIdea;
  };

  function mount(el, options) {
    if (typeof el === 'string') el = document.querySelector(el);
    if (!el) return null;
    if (el.__fcIdea) return el.__fcIdea;
    var v = new Idea(el, options);
    el.__fcIdea = v;
    return v;
  }
  function autoMount() {
    var n = document.querySelectorAll('[data-fc-idea]');
    for (var i = 0; i < n.length; i++) mount(n[i]);
  }
  if (typeof document !== 'undefined') {
    if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', autoMount);
    else autoMount();
  }
  return { mount: mount, autoMount: autoMount, defaults: DEFAULTS, version: '1.0.0' };
});
