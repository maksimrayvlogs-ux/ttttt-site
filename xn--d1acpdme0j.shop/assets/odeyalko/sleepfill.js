/* одеялко — конструктор «Подушки и одеяла» v2.
 * Визуал: мастер-кадры владельца через центральный манифест (window.ODEYALKO_ASSETS).
 * Деньги в копейках. Никакой бизнес-логики в разметке. */
(function () {
  'use strict';

  var CONFIG = {
    storageKey: 'odeyalko-sleepfill',
    version: 2,
    products: {
      p50: { uid: '900000001001', sku: 'P5070-SAT1025', name: 'Подушка 50 × 70',
             unitPriceMinor: 99900, maxQuantity: 2, defaultQuantity: 2, available: true, /* матрица: 999 ₽ */
             img: '/assets/odeyalko/frames/P03.jpg' },
      p70: { uid: '900000001002', sku: 'P7070-SAT1025', name: 'Подушка 70 × 70',
             unitPriceMinor: 119900, maxQuantity: 2, defaultQuantity: 2, available: true, /* матрица: 1 199 ₽ */
             img: '/assets/odeyalko/frames/P05.jpg' },
      pillowsTotalMax: 4,
      duvet: {
        maxQuantity: 2, defaultQuantity: 1, defaultSize: '220x240',
        img: '/assets/odeyalko/frames/P01.jpg',
        sizes: [ /* TODO(бизнес): демо-цены, подтвердить */
          { key: '145x200', label: '145 × 200', uid: '900000002101', sku: 'OD145200-SAT1025', unitPriceMinor: 199900, available: true }, /* матрица: 1,5-сп 1 999 ₽ */
          { key: '200x200', label: '200 × 200', uid: '900000002102', sku: 'OD200200-SAT1025', unitPriceMinor: 229900, available: true }, /* матрица: 2,0-сп 2 299 ₽ */
          { key: '220x240', label: '220 × 240', uid: '900000002103', sku: 'OD220240-SAT1025', unitPriceMinor: 249900, available: true }, /* матрица: евро 2 499 ₽ */
          { key: 'family',  label: 'семейный (2 × 140 × 205)', uid: '900000002104', sku: 'OD2X140205-SAT1025', unitPriceMinor: 399800, available: true, pieces: 2 } /* производная: 2 × 1 999 ₽, в матрице нет — см. отчёт */
        ]
      },
      protector: {
        maxQuantity: 1, defaultQuantity: 0, defaultSize: '160x200x30',
        sizes: [ /* цены наматрасника отсутствуют в бизнес-данных: unitPriceMinor:null -> «цена уточняется», не суммируется, не попадает в корзину. TODO(бизнес). */
          { key: '160x200x30', label: '160 × 200, борт 30 см', uid: null, sku: 'PR160200D30-TODO', unitPriceMinor: null, available: true },
          { key: '180x200x30', label: '180 × 200, борт 30 см', uid: null, sku: 'PR180200D30-TODO', unitPriceMinor: null, available: true }
        ]
      }
    }
  };

  var A = window.ODEYALKO_ASSETS;
  var fmt = new Intl.NumberFormat('ru-RU');
  var state = {
    p50: CONFIG.products.p50.defaultQuantity,
    p70: CONFIG.products.p70.defaultQuantity,
    duvetQty: CONFIG.products.duvet.defaultQuantity,
    duvetSize: CONFIG.products.duvet.defaultSize,
    protQty: CONFIG.products.protector.defaultQuantity,
    protSize: CONFIG.products.protector.defaultSize
  };

  function clampInt(v, min, max, fb) { v = parseInt(v, 10); return isNaN(v) ? fb : Math.max(min, Math.min(max, v)); }
  function sizeOf(group, key) {
    var list = CONFIG.products[group].sizes;
    for (var i = 0; i < list.length; i++) if (list[i].key === key) return list[i];
    return list[0];
  }
  function loadState() {
    try {
      var s = JSON.parse(localStorage.getItem(CONFIG.storageKey) || 'null');
      if (!s || s.v !== CONFIG.version) return;
      state.p50 = clampInt(s.p50, 0, 2, state.p50);
      state.p70 = clampInt(s.p70, 0, 2, state.p70);
      state.duvetQty = clampInt(s.duvetQty, 0, CONFIG.products.duvet.maxQuantity, state.duvetQty);
      state.protQty = clampInt(s.protQty, 0, CONFIG.products.protector.maxQuantity, state.protQty);
      if (CONFIG.products.duvet.sizes.some(function (x) { return x.key === s.duvetSize; })) state.duvetSize = s.duvetSize;
      if (CONFIG.products.protector.sizes.some(function (x) { return x.key === s.protSize; })) state.protSize = s.protSize;
    } catch (e) { /* повреждённый state -> дефолты */ }
  }
  function saveState() {
    try { localStorage.setItem(CONFIG.storageKey, JSON.stringify({ v: CONFIG.version, p50: state.p50, p70: state.p70, duvetQty: state.duvetQty, duvetSize: state.duvetSize, protQty: state.protQty, protSize: state.protSize })); } catch (e) {}
  }

  /* Единственный источник расчётов: из state выводится всё. */
  function lineItems() {
    var items = [];
    if (state.p50 > 0) items.push({ group: 'p50', v: CONFIG.products.p50, qty: state.p50 });
    if (state.p70 > 0) items.push({ group: 'p70', v: CONFIG.products.p70, qty: state.p70 });
    if (state.duvetQty > 0) items.push({ group: 'duvet', v: sizeOf('duvet', state.duvetSize), qty: state.duvetQty, name: 'Одеяло ' + sizeOf('duvet', state.duvetSize).label, img: CONFIG.products.duvet.img });
    if (state.protQty > 0) items.push({ group: 'protector', v: sizeOf('protector', state.protSize), qty: state.protQty, name: 'Наматрасник ' + sizeOf('protector', state.protSize).label });
    return items;
  }
  function totalMinor() {
    return lineItems().reduce(function (sum, it) {
      return it.v.unitPriceMinor == null ? sum : sum + it.v.unitPriceMinor * it.qty;
    }, 0);
  }
  function hasUnpriced() {
    return lineItems().some(function (it) { return it.v.unitPriceMinor == null; });
  }
  function fmtRub(minor) { return fmt.format(Math.round(minor / 100)) + ' ₽'; }

  var root, fader, totalEl, ctaBtn, ctaNote, sticky, stickySum, stickyAdd, priceNote;

  function frameId() {
    return A.sleepfillFrame({ p50: state.p50, p70: state.p70, duvetQty: state.duvetQty, duvetSize: state.duvetSize });
  }

  function syncGroup(key, qty, max, totalCapReached) {
    var item = root.querySelector('.item[data-sf="' + key + '"]');
    if (!item) return;
    var input = item.querySelector('.js-sf-qty'), dec = item.querySelector('.js-sf-dec'),
        inc = item.querySelector('.js-sf-inc'), toggle = item.querySelector('.js-sf-toggle');
    input.value = qty;
    dec.disabled = qty <= 0;
    inc.disabled = qty >= max || !!totalCapReached;
    dec.setAttribute('aria-disabled', String(dec.disabled));
    inc.setAttribute('aria-disabled', String(inc.disabled));
    toggle.textContent = qty === 0 ? 'добавить' : 'убрать';
  }

  function render() {
    var capReached = (state.p50 + state.p70) >= CONFIG.products.pillowsTotalMax;
    syncGroup('p50', state.p50, CONFIG.products.p50.maxQuantity, capReached);
    syncGroup('p70', state.p70, CONFIG.products.p70.maxQuantity, capReached);
    syncGroup('duvet', state.duvetQty, CONFIG.products.duvet.maxQuantity);
    syncGroup('protector', state.protQty, CONFIG.products.protector.maxQuantity);

    var t = totalMinor();
    totalEl.textContent = fmtRub(t);
    if (stickySum) stickySum.textContent = fmtRub(t);
    priceNote.hidden = !hasUnpriced();
    var empty = lineItems().length === 0;
    var payable = t > 0;
    ctaBtn.disabled = !payable;
    ctaBtn.setAttribute('aria-disabled', String(!payable));
    if (stickyAdd) { stickyAdd.disabled = !payable; stickyAdd.setAttribute('aria-disabled', String(!payable)); }
    ctaNote.hidden = payable;
    ctaNote.textContent = empty ? 'добавьте хотя бы один товар, чтобы продолжить'
      : 'добавьте товар с известной ценой, чтобы продолжить';

    fader.show(frameId());
    saveState();
  }

  function setQty(key, val) {
    if (key === 'duvet') state.duvetQty = clampInt(val, 0, CONFIG.products.duvet.maxQuantity, state.duvetQty);
    else if (key === 'protector') state.protQty = clampInt(val, 0, CONFIG.products.protector.maxQuantity, state.protQty);
    else {
      var other = key === 'p50' ? state.p70 : state.p50;
      var cap = Math.min(CONFIG.products[key].maxQuantity, CONFIG.products.pillowsTotalMax - other);
      state[key] = clampInt(val, 0, cap, state[key]);
    }
    render();
  }

  function addToCart() {
    if (typeof window.tcart__addProduct !== 'function') { console.warn('tcart__addProduct не найдена'); return; }
    /* immutable snapshot: корзина получает ровно то, что на экране */
    lineItems().forEach(function (it) {
      if (it.v.unitPriceMinor == null) return; /* неоцененный SKU не продаётся */
      window.tcart__addProduct({
        uid: it.v.uid, name: it.name || it.v.name, sku: it.v.sku,
        price: it.v.unitPriceMinor / 100, quantity: it.qty,
        img: it.img || it.v.img || (A.FRAMES[frameId()] || {}).src
      });
    });
  }

  function initAccordions() {
    root.querySelectorAll('.desk-info .acc-head').forEach(function (head) {
      var body = document.getElementById(head.getAttribute('aria-controls'));
      if (body) body.hidden = head.getAttribute('aria-expanded') !== 'true';
      head.addEventListener('click', function () {
        var ex = head.getAttribute('aria-expanded') === 'true';
        head.setAttribute('aria-expanded', String(!ex));
        if (body) body.hidden = ex;
        var sec = head.closest('.acc');
        if (sec) { sec.classList.toggle('acc-open', !ex); sec.classList.toggle('acc-closed', ex); }
      });
    });
  }

  function initSticky() {
    if (!sticky || !('IntersectionObserver' in window)) return;
    new IntersectionObserver(function (en) {
      sticky.classList.toggle('sf-on', en[0].isIntersecting);
      sticky.setAttribute('aria-hidden', String(!en[0].isIntersecting));
    }, { threshold: 0.05 }).observe(root);
  }

  function fillSelect(sel, group, current) {
    sel.innerHTML = '';
    CONFIG.products[group].sizes.forEach(function (s) {
      if (!s.available) return;
      var o = document.createElement('option');
      o.value = s.key; o.textContent = s.label;
      sel.appendChild(o);
    });
    sel.value = current;
  }

  function init() {
    root = document.getElementById('sleepConstructor');
    if (!root || !A) return;
    totalEl = document.getElementById('sfTotalSum');
    ctaBtn = document.getElementById('sfAddToCart');
    ctaNote = document.getElementById('sfCtaNote');
    priceNote = document.getElementById('sfPriceNote');
    sticky = document.getElementById('sfSticky');
    stickySum = document.getElementById('sfStickySum');
    stickyAdd = document.getElementById('sfStickyAdd');
    fader = new A.Fader(document.getElementById('sfFrameWrap'), 'Подушки и одеяло на кровати — выбранная комплектация');

    loadState();
    var dsel = root.querySelector('.js-sf-duvet-size');
    fillSelect(dsel, 'duvet', state.duvetSize);
    dsel.addEventListener('change', function () {
      state.duvetSize = dsel.value;
      if (state.duvetQty === 0) state.duvetQty = 1;
      render();
    });
    var psel = root.querySelector('.js-sf-prot-size');
    fillSelect(psel, 'protector', state.protSize);
    psel.addEventListener('change', function () {
      state.protSize = psel.value;
      if (state.protQty === 0) state.protQty = 1;
      render();
    });

    root.addEventListener('click', function (e) {
      var btn = e.target.closest('button');
      if (!btn) return;
      var key = btn.getAttribute('data-sf-target');
      if (!key) return;
      var cur = key === 'duvet' ? state.duvetQty : key === 'protector' ? state.protQty : state[key];
      if (btn.classList.contains('js-sf-inc')) setQty(key, cur + 1);
      else if (btn.classList.contains('js-sf-dec')) setQty(key, cur - 1);
      else if (btn.classList.contains('js-sf-toggle')) {
        var def = key === 'duvet' ? CONFIG.products.duvet.defaultQuantity || 1
                : key === 'protector' ? 1
                : CONFIG.products[key].defaultQuantity;
        setQty(key, cur === 0 ? def : 0);
      }
    });
    root.querySelectorAll('.js-sf-qty').forEach(function (input) {
      input.addEventListener('change', function () { setQty(input.getAttribute('data-sf-target'), input.value); });
    });
    ctaBtn.addEventListener('click', addToCart);
    if (stickyAdd) stickyAdd.addEventListener('click', addToCart);

    initAccordions();
    initSticky();
    A.preload(['P01','P02','P03','P04','P05','P06','P07','P08','P09']);
    render();
  }

  window.ODEYALKO_SLEEPFILL = {
    config: CONFIG,
    getState: function () { return JSON.parse(JSON.stringify(state)); },
    totalMinor: totalMinor,
    frameId: function () { return frameId(); }
  };

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
