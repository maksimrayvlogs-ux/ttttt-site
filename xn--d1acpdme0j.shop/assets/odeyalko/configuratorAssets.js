/* одеялко — единый манифест визуальных состояний двух конструкторов.
 * Все пути постоянные, локальные. Кадры: мастер-сет владельца (B01–B06, P01–P09, 900×900 из брифа)
 * + 3 производных цветовых кадра (G_*), построенных от мастеров с тем же ракурсом/светом.
 * Никаких путей к изображениям внутри компонентов — только через этот модуль. */
(function () {
  'use strict';

  var BASE = '/assets/odeyalko/frames/';

  var FRAMES = {
    /* Конструктор B: постельное бельё. Атрибуты: d=цвет пододеяльника, p=цвет наволочек, s=цвет простыни, st=тип простыни */
    B01: { src: BASE + 'B01.jpg', d: 'pink',  p: 'green', s: 'pink',  st: 'fitted', ps: 'p50' },
    B02: { src: BASE + 'B02.jpg', d: 'cream', p: 'blue',  s: 'blue',  st: 'flat',   ps: 'p70' },
    B03: { src: BASE + 'B03.jpg', d: 'olive', p: 'olive', s: 'cream', st: 'flat'   }, /* мастер для G_mint */
    B04: { src: BASE + 'B04.jpg', d: 'pink',  p: 'pink',  s: 'blue',  st: 'fitted', ps: 'p50' },
    B05: { src: BASE + 'B05.jpg', d: 'coffee',p: 'coffee',s: 'cream', st: 'fitted', ps: 'p70' },
    B06: { src: BASE + 'B06.jpg', family: true, ps: 'both' },
    G_blue: { src: BASE + 'G_blue.jpg', d: 'blue',  p: 'blue',  s: 'cream', st: 'flat', ps: 'p70' },
    G_grey: { src: BASE + 'G_grey.jpg', d: 'white', p: 'white', s: 'cream', st: 'flat', ps: 'p70' },
    G_mint: { src: BASE + 'G_mint.jpg', d: 'green', p: 'green', s: 'cream', st: 'flat', ps: 'p50' },

    /* Конструктор P: подушки и одеяла. Атрибуты: p50/p70 = количество подушек, duvet = ключ размера */
    P01: { src: BASE + 'P01.jpg', p50: 2, p70: 2, duvet: '220x240' },
    P02: { src: BASE + 'P02.jpg', p50: 1, p70: 0, duvet: '145x200' },
    P03: { src: BASE + 'P03.jpg', p50: 2, p70: 0, duvet: '145x200' },
    P04: { src: BASE + 'P04.jpg', p50: 0, p70: 1, duvet: '200x200' },
    P05: { src: BASE + 'P05.jpg', p50: 0, p70: 2, duvet: '200x200' },
    P06: { src: BASE + 'P06.jpg', p50: 1, p70: 1, duvet: '220x240' },
    P07: { src: BASE + 'P07.jpg', p50: 2, p70: 1, duvet: '220x240' },
    P08: { src: BASE + 'P08.jpg', p50: 1, p70: 2, duvet: '220x240' },
    P09: { src: BASE + 'P09.jpg', p50: 2, p70: 2, duvet: 'family' }
  };

  /* Палитра «одеялко» — оттенки сняты пипеткой с мастер-кадров.
   * Внутренние ключи совпадают со SKU-цветами каталога (green=мятный и т.д.) — SKU не ломаем. */
  var PALETTE = [
    { key: 'pink',  label: 'розовый',      hex: '#D9A8A6' },
    { key: 'green', label: 'мятный',       hex: '#AFC5AE' },
    { key: 'coffee',label: 'тауповый',     hex: '#9C8F87' },
    { key: 'blue',  label: 'голубой',      hex: '#A5B3C4' },
    { key: 'cream', label: 'молочный',     hex: '#E3D9CB' },
    { key: 'white', label: 'светло-серый', hex: '#DCD6CD' }
  ];

  /* ---------- Детерминированный маппинг: подушки и одеяла ---------- */
  var P_EXACT = { '1-0': 'P02', '2-0': 'P03', '0-1': 'P04', '0-2': 'P05',
                  '1-1': 'P06', '2-1': 'P07', '1-2': 'P08', '2-2': 'P01' };

  function sleepfillFrame(st) {
    /* st: {p50, p70, duvetQty, duvetSize}
     * Приоритет честности: число подушек на фото всегда равно выбранному.
     * P09 (два одеяла) существует только в каноничном семейном составе 2+2. */
    if (st.duvetQty > 0 && st.duvetSize === 'family' && st.p50 === 2 && st.p70 === 2) return 'P09';
    var key = st.p50 + '-' + st.p70;
    if (P_EXACT[key]) return P_EXACT[key];
    /* 0-0: ближайшее состояние по типу одеяла (правило спеки: детерминированно ближайшее) */
    if (st.duvetQty > 0) {
      return { '145x200': 'P02', '200x200': 'P04', '220x240': 'P06', 'family': 'P09' }[st.duvetSize] || 'P02';
    }
    return 'P02';
  }

  /* ---------- Детерминированный маппинг: постельное бельё ---------- */
  function beddingFrame(view) {
    /* Централизованная таблица соответствий комплектаций: ps=p50|p70|both у кадров.
     * Новые фото вариантов добавляются в FRAMES с атрибутами — mapping подхватит автоматически. */
    if (view.family) return 'B06';
    var setup = (view.p50On && view.p70On) ? 'both' : (view.p70On ? 'p70' : 'p50');
    if (setup === 'both') return 'B06';
    var pillowColor = setup === 'p70' ? view.p70Color : view.p50Color;
    var pillowOn = view.p50On || view.p70On;
    var ids = ['B01', 'B02', 'B04', 'B05', 'G_blue', 'G_grey', 'G_mint'];
    var best = null, bestScore = -1;
    for (var i = 0; i < ids.length; i++) {
      var f = FRAMES[ids[i]], score = 0;
      if (f.ps === setup) score += 6;
      if (view.duvetOn && f.d === view.duvetColor) score += 8;
      if (pillowOn && f.p === pillowColor) score += (view.duvetOn ? 4 : 8);
      if (view.sheetOn && f.st === view.sheetType) score += 3;
      if (view.sheetOn && f.s === view.sheetColor) score += 1;
      if (score > bestScore) { bestScore = score; best = ids[i]; }
    }
    return best || 'B01';
  }


  /* ---------- Кроссфейд без CLS и белой вспышки ---------- */
  function Fader(container, altText) {
    var rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var imgs = [mk(), mk()], active = 0;
    function mk() {
      var im = document.createElement('img');
      im.alt = altText || '';
      im.decoding = 'async';
      im.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;object-fit:cover;object-position:center;opacity:0;' +
        (rm ? '' : 'transition:opacity .16s ease;');
      container.appendChild(im);
      return im;
    }
    this.show = function (frameId) {
      var src = FRAMES[frameId] && FRAMES[frameId].src;
      if (!src) return;
      var cur = imgs[active];
      if (cur.getAttribute('src') === src && cur.style.opacity === '1') return;
      var next = imgs[1 - active];
      var apply = function () {
        next.style.opacity = '1';
        cur.style.opacity = '0';
        active = 1 - active;
      };
      if (next.getAttribute('src') === src && next.complete) { apply(); return; }
      next.onload = function () { requestAnimationFrame(apply); next.onload = null; };
      next.src = src;
      if (next.complete) { requestAnimationFrame(apply); next.onload = null; }
    };
  }

  var preloaded = {};
  function preload(frameIds) {
    (frameIds || Object.keys(FRAMES)).forEach(function (id) {
      if (preloaded[id] || !FRAMES[id]) return;
      var im = new Image(); im.decoding = 'async'; im.src = FRAMES[id].src;
      preloaded[id] = true;
    });
  }

  window.ODEYALKO_ASSETS = {
    FRAMES: FRAMES,
    PALETTE: PALETTE,
    sleepfillFrame: sleepfillFrame,
    beddingFrame: beddingFrame,
    Fader: Fader,
    preload: preload
  };
})();
