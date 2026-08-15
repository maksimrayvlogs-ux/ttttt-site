/* одеялко — навигационная капсула (без гамбургера) + мелкие UX-доводки. */
(function () {
  'use strict';

  var LINKS = [
    { label: 'каталог', href: '/catalog' },
    { label: 'собрать одеялко', href: '/#constructor', anchor: 'constructor' },
    { label: 'о бренде', href: '/about' },
    { label: 'контакты', href: '/#contacts', anchor: 'contacts' }
  ];

  function currentPath() { return location.pathname.replace(/\/+$/, '') || '/'; }

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
      if ((l.href === '/catalog' && path === '/catalog') ||
          (l.href === '/about' && path === '/about')) {
        a.classList.add('is-active');
        a.setAttribute('aria-current', 'page');
      }
      if (l.anchor) {
        a.addEventListener('click', function (e) {
          if (currentPath() !== '/') return; /* обычный переход на главную с якорем */
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

  if (document.readyState !== 'loading') buildNav();
  else document.addEventListener('DOMContentLoaded', buildNav);
})();
