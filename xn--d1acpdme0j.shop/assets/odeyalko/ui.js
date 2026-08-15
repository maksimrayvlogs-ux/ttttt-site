/* одеялко — UI-слой: навигация, футер, кнопка вопроса, checkout.
 * Никаких секретов здесь нет и быть не должно. Отправка заказов — только через /api/order.php. */
(function () {
  'use strict';

  var PHONE_DISPLAY = '+7 (915) 811-93-70';
  var PHONE_TEL = '+79158119370';
  var HOURS = 'Ежедневно, 10:00–20:00';
  var PROMO = { code: 'ODEYALKO10', percent: 10 }; /* действующая промо-механика сайта */

  var LINKS = [
    { label: 'каталог', href: '/catalog' },
    { label: 'собрать одеялко', href: '/#constructor', anchor: 'constructor' },
    { label: 'о бренде', href: '/about' },
    { label: 'контакты', href: '/#contacts', anchor: 'contacts' }
  ];

  function currentPath() { return location.pathname.replace(/\/+$/, '') || '/'; }
  function fmtRub(n) { return new Intl.NumberFormat('ru-RU').format(Math.round(n)) + ' ₽'; }

  /* ---------- навигационная капсула ---------- */
  function buildNav() {
    if (document.querySelector('.odk-nav')) return;
    var nav = document.createElement('nav');
    nav.className = 'odk-nav';
    nav.setAttribute('aria-label', 'Основная навигация');
    var inner = document.createElement('div');
    inner.className = 'odk-nav__inner';
    LINKS.forEach(function (l) {
      var a = document.createElement('a');
      a.className = 'odk-nav__link';
      a.textContent = l.label;
      a.href = l.href;
      var path = currentPath();
      if ((l.href === '/catalog' && path === '/catalog') || (l.href === '/about' && path === '/about')) {
        a.classList.add('is-active');
        a.setAttribute('aria-current', 'page');
      }
      if (l.anchor) {
        a.addEventListener('click', function (e) {
          if (currentPath() !== '/') return;
          var t = document.querySelector('a[name="' + l.anchor + '"]');
          if (!t) return;
          e.preventDefault();
          var y = t.getBoundingClientRect().top + window.pageYOffset - 96;
          var rm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
          window.scrollTo({ top: y, behavior: rm ? 'auto' : 'smooth' });
        });
      }
      inner.appendChild(a);
    });
    nav.appendChild(inner);
    document.body.appendChild(nav);
  }

  /* ---------- футер: подтверждённые контакты ---------- */
  function fixFooter() {
    document.querySelectorAll('.odk-footer__meta a[href^="tel:"]').forEach(function (a) {
      a.href = 'tel:' + PHONE_TEL;
      a.textContent = PHONE_DISPLAY;
    });
    document.querySelectorAll('.odk-footer__meta dd').forEach(function (dd) {
      if (/10:00/.test(dd.textContent)) dd.textContent = HOURS;
    });
  }

  /* ---------- нейтрализация чужих ссылок + кнопка вопроса ---------- */
  function isForeign(href) {
    return /selfles|wa\.me\/79160162928|goldapple|fromscratch|lamoda/i.test(href || '');
  }
  function fixForeignLinks() {
    document.querySelectorAll('a[href]').forEach(function (a) {
      if (!isForeign(a.getAttribute('href'))) return;
      if (a.classList.contains('t-bgimg')) { makeAskButton(a); return; } /* плавающая кнопка */
      a.setAttribute('href', '#');
      a.setAttribute('aria-disabled', 'true');
      a.addEventListener('click', function (e) { e.preventDefault(); });
    });
  }

  function makeAskButton(a) {
    a.setAttribute('href', '#');
    a.setAttribute('aria-label', 'Задать вопрос');
    a.setAttribute('role', 'button');
    a.classList.add('odk-ask-btn');
    a.addEventListener('click', function (e) {
      e.preventDefault();
      e.stopPropagation();
      var own = (window.ODEYALKO_SOCIAL || {}).telegram;
      if (own) { window.open(own, '_blank', 'noopener'); return; }
      openAsk();
    }, true);
  }

  var askEl = null, askPrevFocus = null;
  function openAsk() {
    askPrevFocus = document.activeElement;
    if (!askEl) {
      askEl = document.createElement('div');
      askEl.className = 'odk-modal';
      askEl.innerHTML =
        '<div class="odk-modal__backdrop" data-close="1"></div>' +
        '<div class="odk-modal__box" role="dialog" aria-modal="true" aria-label="Задать вопрос">' +
        '<button class="odk-modal__close" type="button" aria-label="Закрыть" data-close="1">×</button>' +
        '<h3 class="odk-modal__title">Задать вопрос</h3>' +
        '<p class="odk-modal__sub">Телефон: <a href="tel:' + PHONE_TEL + '">' + PHONE_DISPLAY + '</a><br>' + HOURS + '</p>' +
        '<a class="odk-btn odk-btn--ghost" href="tel:' + PHONE_TEL + '">Позвонить</a>' +
        '<div class="odk-field"><label for="odkAskName">Ваше имя</label><input id="odkAskName" type="text" autocomplete="name"><div class="odk-err" hidden></div></div>' +
        '<div class="odk-field"><label for="odkAskContact">Контакт для ответа</label><input id="odkAskContact" type="text" placeholder="телефон или @username"><div class="odk-err" hidden></div></div>' +
        '<div class="odk-field"><label for="odkAskMsg">Вопрос</label><textarea id="odkAskMsg" rows="3"></textarea><div class="odk-err" hidden></div></div>' +
        '<input type="text" name="website" class="odk-hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
        '<button class="odk-btn" type="button" id="odkAskSend">Отправить вопрос</button>' +
        '<div class="odk-form-note" id="odkAskNote" hidden></div>' +
        '</div>';
      document.body.appendChild(askEl);
      askEl.addEventListener('click', function (e) { if (e.target.getAttribute && e.target.getAttribute('data-close')) closeAsk(); });
      document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && askEl && askEl.classList.contains('is-open')) closeAsk(); });
      askEl.querySelector('#odkAskSend').addEventListener('click', sendAsk);
    }
    askEl.classList.add('is-open');
    var f = askEl.querySelector('#odkAskName');
    if (f) setTimeout(function () { f.focus(); }, 60);
  }
  function closeAsk() {
    if (askEl) askEl.classList.remove('is-open');
    if (askPrevFocus && askPrevFocus.focus) askPrevFocus.focus();
  }
  function sendAsk() {
    var name = askEl.querySelector('#odkAskName');
    var contact = askEl.querySelector('#odkAskContact');
    var msg = askEl.querySelector('#odkAskMsg');
    var note = askEl.querySelector('#odkAskNote');
    var btn = askEl.querySelector('#odkAskSend');
    var ok = true;
    [[name, 'Укажите имя'], [contact, 'Укажите контакт'], [msg, 'Напишите вопрос']].forEach(function (p) {
      var err = p[0].parentNode.querySelector('.odk-err');
      if (!p[0].value.trim()) { err.textContent = p[1]; err.hidden = false; ok = false; }
      else err.hidden = true;
    });
    if (!ok) return;
    btn.disabled = true; btn.textContent = 'Отправляем…';
    note.hidden = true;
    fetch('/api/order.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        type: 'question',
        name: name.value.trim(),
        contact: contact.value.trim(),
        message: msg.value.trim(),
        website: askEl.querySelector('.odk-hp').value,
        page: location.href,
        idempotency: 'q-' + Date.now() + '-' + Math.random().toString(36).slice(2, 8)
      })
    }).then(function (r) { return r.json().catch(function () { return { ok: false }; }); })
      .then(function (d) {
        btn.disabled = false; btn.textContent = 'Отправить вопрос';
        if (d && d.ok) {
          note.textContent = 'Спасибо! Вопрос отправлен — ответим ' + HOURS.toLowerCase() + '.';
          note.className = 'odk-form-note odk-form-note--ok'; note.hidden = false;
          msg.value = '';
        } else {
          note.textContent = 'Не получилось отправить. Позвоните нам: ' + PHONE_DISPLAY + ' (' + HOURS + ').';
          note.className = 'odk-form-note odk-form-note--err'; note.hidden = false;
        }
      }).catch(function () {
        btn.disabled = false; btn.textContent = 'Отправить вопрос';
        note.textContent = 'Не получилось отправить. Позвоните нам: ' + PHONE_DISPLAY + ' (' + HOURS + ').';
        note.className = 'odk-form-note odk-form-note--err'; note.hidden = false;
      });
  }

  /* ---------- скрытие артикулов в корзине ---------- */
  function hideCartSkus() {
    document.querySelectorAll('.t706__product-title, .t706__product-name').forEach(function (el) {
      el.childNodes.forEach(function (n) {
        var t = (n.textContent || '').trim();
        if (n.nodeType === 1 && /^[A-ZА-Я0-9][A-ZА-Я0-9x×\-]{5,}$/.test(t) && !/\s[а-яё]/i.test(t)) n.style.display = 'none';
      });
    });
  }

  /* ---------- телефонная маска ---------- */
  function maskPhone(input) {
    input.addEventListener('input', function () {
      var d = input.value.replace(/\D/g, '');
      if (d.startsWith('8')) d = '7' + d.slice(1);
      if (!d.startsWith('7')) d = '7' + d;
      d = d.slice(0, 11);
      var out = '+7';
      if (d.length > 1) out += ' (' + d.slice(1, 4);
      if (d.length >= 4) out += ') ' + d.slice(4, 7);
      if (d.length >= 7) out += '-' + d.slice(7, 9);
      if (d.length >= 9) out += '-' + d.slice(9, 11);
      input.value = out;
    });
  }
  function normPhone(v) {
    var d = (v || '').replace(/\D/g, '');
    if (d.startsWith('8')) d = '7' + d.slice(1);
    return d.length === 11 && d.startsWith('7') ? '+' + d : null;
  }

  /* ---------- checkout ---------- */
  var checkoutBuilt = false;
  function buildCheckout(cartPage) {
    if (checkoutBuilt || !cartPage) return;
    var form = cartPage.querySelector('form.t-form, .t-form');
    if (!form) return;
    checkoutBuilt = true;
    form.style.display = 'none';

    var box = document.createElement('div');
    box.className = 'odk-checkout';
    box.innerHTML =
      '<div class="odk-field"><label for="odkName">Как вас зовут</label><input id="odkName" type="text" autocomplete="name"><div class="odk-err" hidden></div></div>' +

      '<div class="odk-contact-head">Как с вами удобно связаться</div>' +
      '<div class="odk-contact-sub">Выберите один способ — мы свяжемся с вами для подтверждения заказа.</div>' +
      '<div class="odk-radio-row" role="radiogroup" aria-label="Способ связи">' +
      '<label class="odk-radio"><input type="radio" name="odkContactMethod" value="phone" checked><span>Позвонить по телефону</span></label>' +
      '<label class="odk-radio"><input type="radio" name="odkContactMethod" value="messenger"><span>Написать в мессенджер</span></label>' +
      '</div>' +
      '<div class="odk-field" id="odkPhoneField"><label for="odkPhone">Номер телефона</label><input id="odkPhone" type="tel" inputmode="tel" placeholder="+7 (000) 000-00-00" autocomplete="tel"><div class="odk-err" hidden></div></div>' +
      '<div class="odk-field" id="odkMsgrField" hidden><label for="odkMsgr">Контакт в мессенджере</label><input id="odkMsgr" type="text" placeholder="@username"><div class="odk-help">Укажите имя пользователя или номер, по которому вас можно найти.</div><div class="odk-err" hidden></div></div>' +

      '<div class="odk-contact-head">Доставка</div>' +
      '<div class="odk-field"><label for="odkAddr">Адрес доставки</label><textarea id="odkAddr" rows="2"></textarea><div class="odk-help">Укажите конкретный адрес. Для уточнения заказа мы свяжемся с вами выбранным способом.</div><div class="odk-err" hidden></div></div>' +

      '<div class="odk-field odk-promo"><label for="odkPromo">Промокод</label><div class="odk-promo-row"><input id="odkPromo" type="text" autocomplete="off"><button type="button" class="odk-btn odk-btn--ghost" id="odkPromoApply">Применить</button></div><div class="odk-err" hidden></div><div class="odk-form-note odk-form-note--ok" id="odkPromoOk" hidden></div></div>' +

      '<div class="odk-summary" id="odkSummary"></div>' +
      '<input type="text" name="website" class="odk-hp" tabindex="-1" autocomplete="off" aria-hidden="true">' +
      '<button type="button" class="odk-btn odk-btn--order" id="odkOrderBtn">Заказать</button>' +
      '<div class="odk-form-note" id="odkOrderNote" hidden></div>';
    form.parentNode.insertBefore(box, form);

    maskPhone(box.querySelector('#odkPhone'));

    var applied = false;
    function discount() {
      var sub = (window.tcart && window.tcart.prodamount) || 0;
      return applied ? Math.round(sub * PROMO.percent / 100) : 0;
    }
    function renderSummary() {
      var el = box.querySelector('#odkSummary');
      if (!el) { clearInterval(box._sumTimer); return; }
      var sub = (window.tcart && window.tcart.prodamount) || 0;
      var d = discount();
      el.innerHTML = '<div><span>Товары</span><b>' + fmtRub(sub) + '</b></div>' +
        (d ? '<div><span>Скидка ' + PROMO.percent + '%</span><b>−' + fmtRub(d) + '</b></div>' : '') +
        '<div class="odk-summary__total"><span>Итого</span><b>' + fmtRub(sub - d) + '</b></div>';
    }
    renderSummary();
    box._sumTimer = setInterval(renderSummary, 800);

    box.querySelector('#odkPromoApply').addEventListener('click', function () {
      var inp = box.querySelector('#odkPromo');
      var err = inp.closest('.odk-field').querySelector('.odk-err');
      var okn = box.querySelector('#odkPromoOk');
      if (inp.value.trim().toUpperCase() === PROMO.code) {
        applied = true; err.hidden = true;
        okn.textContent = 'Промокод применён: скидка ' + PROMO.percent + '%'; okn.hidden = false;
      } else {
        applied = false; okn.hidden = true;
        err.textContent = 'Промокод не найден'; err.hidden = false;
      }
      renderSummary();
    });

    box.querySelectorAll('input[name="odkContactMethod"]').forEach(function (r) {
      r.addEventListener('change', function () {
        var phone = r.value === 'phone';
        box.querySelector('#odkPhoneField').hidden = !phone;
        box.querySelector('#odkMsgrField').hidden = phone;
        box.querySelectorAll('.odk-err').forEach(function (e2) { e2.hidden = true; });
      });
    });

    var idem = null;
    box.querySelector('#odkOrderBtn').addEventListener('click', function () {
      var btn = this;
      var note = box.querySelector('#odkOrderNote');
      note.hidden = true;
      var products = (window.tcart && window.tcart.products) || [];
      if (!products.length) {
        note.textContent = 'Корзина пуста — добавьте товары, чтобы оформить заказ.';
        note.className = 'odk-form-note odk-form-note--err'; note.hidden = false;
        return;
      }
      function fieldErr(sel, msg) {
        var f = box.querySelector(sel);
        var err = f.closest('.odk-field').querySelector('.odk-err');
        if (msg) { err.textContent = msg; err.hidden = false; return f; }
        err.hidden = true; return null;
      }
      var firstBad = null;
      var name = box.querySelector('#odkName').value.trim();
      if (!name) firstBad = firstBad || fieldErr('#odkName', 'Укажите имя'); else fieldErr('#odkName');
      var method = box.querySelector('input[name="odkContactMethod"]:checked').value;
      var contact = null;
      if (method === 'phone') {
        contact = normPhone(box.querySelector('#odkPhone').value);
        if (!contact) firstBad = firstBad || fieldErr('#odkPhone', 'Укажите номер в формате +7 (000) 000-00-00'); else fieldErr('#odkPhone');
      } else {
        contact = box.querySelector('#odkMsgr').value.trim();
        if (!contact) firstBad = firstBad || fieldErr('#odkMsgr', 'Укажите контакт в мессенджере'); else fieldErr('#odkMsgr');
      }
      var addr = box.querySelector('#odkAddr').value.trim();
      if (!addr) firstBad = firstBad || fieldErr('#odkAddr', 'Укажите адрес доставки'); else fieldErr('#odkAddr');
      if (firstBad) { firstBad.scrollIntoView({ block: 'center', behavior: 'smooth' }); firstBad.focus(); return; }

      var sub = window.tcart.prodamount || 0;
      var d = discount();
      if (!idem) idem = 'o-' + Date.now() + '-' + Math.random().toString(36).slice(2, 10);
      var payload = {
        type: 'order',
        idempotency: idem,
        name: name,
        contactMethod: method === 'phone' ? 'телефон' : 'мессенджер',
        contact: contact,
        address: addr,
        promocode: applied ? PROMO.code : '',
        discount: d,
        subtotal: sub,
        total: sub - d,
        items: products.map(function (p) {
          return { name: p.name, sku: p.sku || '', qty: Number(p.quantity) || 1, price: Number(p.price) || 0, sum: (Number(p.price) || 0) * (Number(p.quantity) || 1) };
        }),
        page: location.href,
        website: box.querySelector('.odk-hp').value
      };
      btn.disabled = true;
      var oldTxt = btn.textContent;
      btn.textContent = 'Отправляем заказ…';
      fetch('/api/order.php', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(function (r) { return r.json().catch(function () { return { ok: false, error: 'bad_response' }; }); })
        .then(function (resp) {
          if (resp && resp.ok) {
            /* очистка корзины ТОЛЬКО после подтверждённой отправки */
            try {
              window.tcart.products = [];
              window.tcart.prodamount = 0; window.tcart.amount = 0; window.tcart.total = 0;
              localStorage.removeItem('tcart');
              if (typeof window.tcart__reDrawCartIcon === 'function') window.tcart__reDrawCartIcon();
            } catch (e) {}
            cartPage.querySelectorAll('.t706__cartpage-products, .t706__sidebar, .t706__cartpage-top, .t706__cartpage-totals').forEach(function (x) { x.style.display = 'none'; });
            box.innerHTML = '<div class="odk-success"><div class="odk-success__mark">✓</div>' +
              '<h3>Спасибо за заказ!</h3>' +
              '<p>Заказ №' + (resp.order || '—') + ' принят. Мы свяжемся с вами выбранным способом.</p>' +
              '<a class="odk-btn odk-btn--ghost" href="/">Вернуться на главную</a></div>';
            box.scrollIntoView({ block: 'center' });
          } else {
            btn.disabled = false; btn.textContent = oldTxt;
            idem = null;
            var note2 = box.querySelector('#odkOrderNote');
            note2.textContent = 'Не удалось отправить заказ. Корзина сохранена — попробуйте ещё раз или позвоните: ' + PHONE_DISPLAY + '.';
            note2.className = 'odk-form-note odk-form-note--err'; note2.hidden = false;
          }
        })
        .catch(function () {
          btn.disabled = false; btn.textContent = oldTxt;
          idem = null;
          var note3 = box.querySelector('#odkOrderNote');
          note3.textContent = 'Ошибка соединения. Корзина сохранена — попробуйте ещё раз или позвоните: ' + PHONE_DISPLAY + '.';
          note3.className = 'odk-form-note odk-form-note--err'; note3.hidden = false;
        });
    });
  }

  function watchCart() {
    var mo = new MutationObserver(function () {
      var cp = document.querySelector('.t706__cartpage');
      if (cp && cp.querySelector('.t-form')) buildCheckout(cp);
      hideCartSkus();
    });
    mo.observe(document.body, { childList: true, subtree: true });
    var cp = document.querySelector('.t706__cartpage');
    if (cp && cp.querySelector('.t-form')) buildCheckout(cp);
  }

  function init() {
    buildNav();
    fixFooter();
    fixForeignLinks();
    watchCart();
  }
  if (document.readyState !== 'loading') init();
  else document.addEventListener('DOMContentLoaded', init);
})();
