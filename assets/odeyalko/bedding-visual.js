/* одеялко — визуальный адаптер конструктора постельного белья.
 * Читает состояние из DOM первого конструктора (не вмешиваясь в его state-механизм),
 * выбирает мастер-кадр через центральный манифест и показывает его с кроссфейдом.
 * Также показывает баннер комплектной скидки. */
(function () {
  'use strict';

  function init() {
    var A = window.ODEYALKO_ASSETS;
    var root = document.getElementById('setConstructor');
    var wrap = document.getElementById('bFrameWrap');
    if (!A || !root || !wrap) { setTimeout(init, 120); return; }

    var fader = new A.Fader(wrap, 'Комплект постельного белья — выбранная комплектация');
    A.preload(['B01', 'B02', 'B04', 'B05', 'B06', 'G_blue', 'G_grey', 'G_mint']);

    function groupState(key) {
      var item = root.querySelector('.item[data-item="' + key + '"]');
      if (!item) return { on: false };
      var qty = parseInt((item.querySelector('.js-qty') || {}).value || '0', 10) || 0;
      var sw = item.querySelector('.swatch[aria-selected="true"]');
      var sel = item.querySelector('select');
      return {
        on: qty > 0,
        qty: qty,
        color: sw ? sw.getAttribute('data-color') : '',
        size: sel ? sel.value : ''
      };
    }

    function view() {
      var pc = groupState('pillowcase');
      var dv = groupState('duvet');
      var sh = groupState('sheet');
      var fitted = sh.size === '160' || sh.size === '180';
      return {
        family: dv.on && dv.size === 'FAM',
        duvetOn: dv.on, duvetColor: dv.color,
        pillowOn: pc.on, pillowColor: pc.color,
        sheetOn: sh.on, sheetColor: sh.color,
        sheetType: fitted ? 'fitted' : 'flat',
        bundle: pc.on && pc.qty >= 1 && dv.on && dv.qty >= 1 && sh.on && sh.qty >= 1
      };
    }

    /* Баннер комплектной скидки (механика сайта: промокод ODEYALKO10, −10%) */
    var banner = document.createElement('div');
    banner.className = 'bset-note';
    banner.id = 'bundleNote';
    banner.hidden = true;
    var totalWrap = root.querySelector('.total');
    if (totalWrap) totalWrap.parentNode.insertBefore(banner, totalWrap.nextSibling);

    var fmt = new Intl.NumberFormat('ru-RU');

    function update() {
      var v = view();
      fader.show(A.beddingFrame(v));
      if (banner) {
        if (v.bundle) {
          var sumEl = document.getElementById('totalSum');
          var raw = sumEl ? parseInt((sumEl.textContent || '').replace(/[^\d]/g, ''), 10) : 0;
          var disc = Math.round(raw * 0.9);
          banner.innerHTML = 'Вы собрали комплект — применена скидка 10%: <strong>' +
            fmt.format(disc) + ' ₽</strong> с промокодом <strong>ODEYALKO10</strong> в корзине';
          banner.hidden = false;
        } else {
          banner.hidden = true;
        }
      }
    }

    /* Единый хук: recalcTotal первого конструктора всегда пишет в #totalSum */
    var sumEl = document.getElementById('totalSum');
    if (sumEl && 'MutationObserver' in window) {
      new MutationObserver(update).observe(sumEl, { childList: true, characterData: true, subtree: true });
    }
    root.addEventListener('click', function () { requestAnimationFrame(update); });
    root.addEventListener('change', function () { requestAnimationFrame(update); });

    update();
  }

  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
