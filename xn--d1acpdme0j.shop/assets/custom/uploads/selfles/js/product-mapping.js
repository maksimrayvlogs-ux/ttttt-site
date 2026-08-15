/**
 * Пресеты наборов постельного белья
 * Поддержка разных ID блоков через глобальную конфигурацию
 * 
 * Использование:
 * <script>
 *   window.ODEYALKO_CONFIG = window.ODEYALKO_CONFIG || {};
 *   window.ODEYALKO_CONFIG.BLOCK_IDS = { CATALOG: 'rec1653024161' };
 * </script>
 * <script src="js/product-mapping.js"></script>
 */

(function(){
  'use strict';
  
  // Используем глобальную конфигурацию или дефолтные значения
  const CONFIG = window.ODEYALKO_CONFIG || {};
  const BLOCK_IDS = CONFIG.BLOCK_IDS || {
    CATALOG: 'rec1653024161' // Дефолтный ID блока каталога
  };
  
  // ——— ЖДЁМ КОРЗИНУ TILDA ———
  function whenCartReady(cb){
    if (typeof window.tcart__addProduct === 'function') return cb();
    let tries = 0;
    const t = setInterval(()=>{
      if (typeof window.tcart__addProduct === 'function' || tries > 80){
        clearInterval(t);
        if (typeof window.tcart__addProduct === 'function') cb();
        else console.warn('[sets] Корзина Tilda не найдена (добавьте блок ST100/101).');
      }
      tries++;
    }, 200);
  }
  
  // ——— ДАННЫЕ (цены/картинки/коды цветов) ———
  const PRICE = { pillowcase:5200, duvet:12900, sheet:8900 };
  const IMG = {
    pillowcase:{
      white:'/assets/gdrive/1MwOCa3SLeNBm4iwHQsdTd-A1_01ay4iI.png',
      pink:'/assets/gdrive/1_RvXnbYLLyDPPVUy6674UDfGH-fOxkb_.png',
      green:'/assets/gdrive/1OHlIoTQqmadmDbA2uRBy0lfrniAnqyjc.png',
      coffee:'/assets/gdrive/1TfFhO8v6miywPd4YaT3RnPvF6ubPEaAw.png',
      blue:'/assets/gdrive/1vVcou-ec2h-2wfOeK_TecW8YtzvgRVak.png'
    },
    duvet:{
      white:'/assets/gdrive/1gYL6wfWXJbqDrmN0d7lb5gPOpjfWn-Lg.png',
      pink:'/assets/gdrive/13ALUgqdIEC-KvCEptppJMB8pF4sbFtBh.png',
      green:'/assets/gdrive/1YATxIWq5jb-7-b7ez_dgZLJVktJsGovt.png',
      coffee:'/assets/gdrive/1v4MgkpEExW_095prvo8VYE9Bq4x2AP1e.png',
      blue:'/assets/gdrive/1xdLUPzqPZt8cfqBqTfZkbwGcSa3IsM1i.png'
    },
    sheet:{
      white:'/assets/gdrive/1GXGw02fySSgdP7eA0Ag-vbgss50BjDAb.png',
      pink:'/assets/gdrive/1M36qLG5Isva9rYyKtWdcHP7x_GT9RyZP.png',
      green:'/assets/gdrive/1bD_I4YIfNtdrkstGEJbHZgKyueGq9AE3.png',
      coffee:'/assets/gdrive/15InMSgBKmbzTJ6210ZVzY29H4ccZ2OS6.png',
      blue:'/assets/gdrive/1HnPnJV6UXsb09oT3ggngIaj7IoruL-tW.png'
    }
  };
  const CC = { white:'W', pink:'P', green:'G', coffee:'C', blue:'B' };
  
  // Полный маппинг UID и данных из каталога для всех вариантов товаров
  // Обновлено по выгрузке от 2025-12-04
  const PRODUCT_CATALOG_MAP = {
    pillowcase: {
      white: {uid: '508414995872', name: 'Наволочки (2 шт.) - белый', price: 5200, sku: 'NW-BAM1025', img: '/assets/tild/stor6265-3466-4463-b364-393233313665/805ee3acbecac09dde40f89f99f3cb8c.png'},
      pink: {uid: '640059779802', name: 'Наволочки (2 шт.) - розовый', price: 5200, sku: 'NP-BAM1025', img: '/assets/tild/stor3130-3737-4631-b134-363464333665/c0f492d6970b0943258ea62a8dd99020.png'},
      green: {uid: '209393555332', name: 'Наволочки (2 шт.) - зелёный', price: 5200, sku: 'NG-BAM1025', img: '/assets/tild/stor3561-6536-4062-a337-343836316261/85edd559e891a176dfc42e36c3d2c31a.png'},
      coffee: {uid: '852169982362', name: 'Наволочки (2 шт.) - кофейный', price: 5200, sku: 'NC-BAM1025', img: '/assets/tild/stor3930-3932-4536-a132-366362376665/666d65f4c61a91aaaf8eb2f9307fc2e7.png'},
      blue: {uid: '643317527602', name: 'Наволочки (2 шт.) - голубой', price: 5200, sku: 'NB-BAM1025', img: '/assets/tild/stor6265-6362-4332-b465-646166623736/95f43dbf369f7481c6cd322119df5a22.png'}
    },
    duvet: {
      white: {uid: '771433661342', name: 'Пододеяльник - белый', price: 12900, sku: 'PPW-BAM1025', img: '/assets/tild/stor3739-3439-4562-b464-306662663235/38f0a53d0a4bb2f439facad4850db932.png'},
      pink: {uid: '871624649412', name: 'Пододеяльник - розовый', price: 12900, sku: 'PPP-BAM1025', img: '/assets/tild/stor6562-6232-4136-b635-316164373738/3bbb73d4bf4660f73ba3a5734e545a20.png'},
      green: {uid: '111952488682', name: 'Пододеяльник - зелёный', price: 12900, sku: 'PPG-BAM1025', img: '/assets/tild/stor3362-3464-4337-a438-313261633261/dd546c59623adf3a1fa57cc46f63e26b.png'},
      coffee: {uid: '707657257962', name: 'Пододеяльник - кофейный', price: 12900, sku: 'PPC-BAM1025', img: '/assets/tild/stor6138-3561-4235-a163-373836346336/257e949943efd8e88dbe62f3257d1384.png'},
      blue: {uid: '597802333482', name: 'Пододеяльник - голубой', price: 12900, sku: 'PPB-BAM1025', img: '/assets/tild/stor6365-3561-4433-a332-663432363432/31d1bd78f4321c3cf3b846004045870a.png'}
    },
    sheet: {
      '160': {
        pink: {uid: '859206498232', name: 'Простыня - розовый', price: 8900, sku: 'P160P-BAM1025', img: '/assets/tild/stor6566-3566-4236-b236-343032383134/961481be3dc2a06bb8e1b98d33350d21.png'},
        green: {uid: '111418831422', name: 'Простыня - зелёный', price: 8900, sku: 'P160G-BAM1025', img: '/assets/tild/stor6536-6537-4863-b339-653339313163/aa6865cc45fc27e63dd0bf245349836a.png'},
        coffee: {uid: '857578161462', name: 'Простыня - кофейный', price: 8900, sku: 'P160C-BAM1025', img: '/assets/tild/stor3732-3636-4137-b066-353933643836/fc50ff9e86f8acd9fd806c2491b32a79.png'},
        blue: {uid: '541232550662', name: 'Простыня - голубой', price: 8900, sku: 'P160B-BAM1025', img: '/assets/tild/stor6565-6237-4437-b830-306136616565/01f30f06b29e7bbec1ba472768a8c8c8.png'}
      },
      '180': {
        pink: {uid: '666639617022', name: 'Простыня - розовый', price: 8900, sku: 'P180P-BAM1025', img: '/assets/tild/stor6566-3566-4236-b236-343032383134/961481be3dc2a06bb8e1b98d33350d21.png'},
        coffee: {uid: '620445245932', name: 'Простыня - кофейный', price: 8900, sku: 'P180C-BAM1025', img: '/assets/tild/stor3732-3636-4137-b066-353933643836/fc50ff9e86f8acd9fd806c2491b32a79.png'}
      },
      'KS': {
        pink: {uid: '789458312142', name: 'Простыня - розовый', price: 8900, sku: 'PKSP-BAM1025', img: '/assets/tild/stor6566-3566-4236-b236-343032383134/961481be3dc2a06bb8e1b98d33350d21.png'},
        green: {uid: '357468650042', name: 'Простыня - зелёный', price: 8900, sku: 'PKSG-BAM1025', img: '/assets/tild/stor6536-6537-4863-b339-653339313163/aa6865cc45fc27e63dd0bf245349836a.png'},
        coffee: {uid: '714613908682', name: 'Простыня - кофейный', price: 8900, sku: 'PKSC-BAM1025', img: '/assets/tild/stor3732-3636-4137-b066-353933643836/fc50ff9e86f8acd9fd806c2491b32a79.png'},
        blue: {uid: '638398223432', name: 'Простыня - голубой', price: 8900, sku: 'PKSB-BAM1025', img: '/assets/tild/stor6565-6237-4437-b830-306136616565/01f30f06b29e7bbec1ba472768a8c8c8.png'}
      },
      'EUR': {
        white: {uid: '133157577522', name: 'Простыня - белый', price: 8900, sku: 'PEURW-BAM1025', img: '/assets/tild/stor3131-3337-4936-b934-336562383739/87af3a1eeba8e2160d9fb1a85e4b1f4b.png'}
      }
    }
  };
  
  // Функция для определения типа товара и цвета по названию/SKU
  function getProductInfo(product){
    const name = (product.name || '').toLowerCase();
    const sku = (product.sku || '').toUpperCase();
    
    let productType = null;
    let color = null;
    
    if(name.includes('наволочк') || sku.startsWith('N')){
      productType = 'pillowcase';
    } else if(name.includes('пододеяльник') || sku.startsWith('PP')){
      productType = 'duvet';
    } else if(name.includes('простыня') || sku.startsWith('P')){
      productType = 'sheet';
    }
    
    if(name.includes('бел') || sku.includes('W')) color = 'white';
    else if(name.includes('розов') || sku.includes('P') && !sku.startsWith('PP')) color = 'pink';
    else if(name.includes('зел') || sku.includes('G')) color = 'green';
    else if(name.includes('кофейн') || sku.includes('C')) color = 'coffee';
    else if(name.includes('голуб') || sku.includes('B')) color = 'blue';
    
    return {productType, color};
  }
  
  // Функция для добавления товара через tcart__addProduct с UID из каталога
  function add(p){
    if(typeof window.tcart__addProduct !== 'function'){
      console.warn('tcart__addProduct не найдена');
      return;
    }
    
    const {productType, color} = getProductInfo(p);
    if(!productType || !color){
      console.warn(`Не удалось определить тип или цвет товара: ${p.name}`);
      return;
    }
    
    const catalogData = productType === 'sheet' 
      ? (PRODUCT_CATALOG_MAP.sheet['160'] && PRODUCT_CATALOG_MAP.sheet['160'][color])
      : (PRODUCT_CATALOG_MAP[productType] && PRODUCT_CATALOG_MAP[productType][color]);
    
    if(!catalogData){
      console.warn(`Данные не найдены для товара: ${productType}, цвет: ${color}`);
      return;
    }
    
    const productData = {
      uid: catalogData.uid,
      name: catalogData.name,
      price: catalogData.price,
      sku: catalogData.sku,
      img: catalogData.img,
      quantity: p.quantity || 1
    };
    
    window.tcart__addProduct(productData);
  }
  
  // ——— ТОСТЫ ———
  (function setupToast(){
    if (document.getElementById('ucToast')) return;
    const wrap = document.createElement('div');
    wrap.id = 'ucToast';
    wrap.setAttribute('role','status');
    wrap.setAttribute('aria-live','polite');
    document.body.appendChild(wrap);
  })();
  
  function showToast({title='Готово!', text='Товары успешно добавлены в корзину', timeout=3200}={}){
    const wrap = document.getElementById('ucToast');
    if(!wrap) return;
  
    const el = document.createElement('div');
    el.className = 'uc-toast';
    el.innerHTML = `
      <div class="uc-toast__inner">
        <svg class="uc-toast__icon" viewBox="0 0 24 24" aria-hidden="true">
          <path fill="#000000" d="M9 16.2l-3.5-3.5L4 14.2l5 5 11-11-1.4-1.4z"/>
        </svg>
        <div>
          <div class="uc-toast__title">${title}</div>
          <div class="uc-toast__text">
           Товары успешно добавлены <a href="#tcart" class="uc-toast__link">в корзину</a>
          </div>
        </div>
        <button class="uc-toast__close" aria-label="Закрыть">×</button>
      </div>
      <div class="uc-toast__bar"></div>
    `;
    wrap.appendChild(el);
  
    requestAnimationFrame(()=> el.classList.add('uc-toast--show'));
  
    const bar = el.querySelector('.uc-toast__bar');
    requestAnimationFrame(()=>{
      bar.style.transitionDuration = `${timeout}ms`;
      bar.style.transform = 'scaleX(0)';
    });
  
    const close = ()=> {
      el.classList.remove('uc-toast--show');
      setTimeout(()=> el.remove(), 250);
    };
    const t = setTimeout(close, timeout);
    el.querySelector('.uc-toast__close').addEventListener('click', ()=>{
      clearTimeout(t); close();
    });
    el.addEventListener('click', (e)=>{
      if (e.target.closest('.uc-toast__inner')) { clearTimeout(t); close(); }
    });
  }
  
  // ——— ПРЕСЕТЫ ———
  function addSet1(){
    add({name:'Наволочки, розовые', price:PRICE.pillowcase, sku:'NP-BAM1025', quantity:1, img:IMG.pillowcase.pink});
    add({name:'Пододеяльник, розовый', price:PRICE.duvet, sku:`PPP-BAM1025`, quantity:1, img:IMG.duvet.pink});
    add({name:'Простыня, розовая • 160 × 200, на резинке', price:PRICE.sheet, sku:`P160P-BAM1025`, quantity:1, img:IMG.sheet.pink});
    showToast({ text:'Розовый комплект: наволочки, пододеяльник, простыня' });
  }
  function addSet2(){
    add({name:'Наволочки, розовые', price:PRICE.pillowcase, sku:'NP-BAM1025', quantity:1, img:IMG.pillowcase.pink});
    add({name:'Пододеяльник, зелёный', price:PRICE.duvet, sku:`PPG-BAM1025`, quantity:1, img:IMG.duvet.green});
    add({name:'Простыня, зелёная • 160 × 200, на резинке', price:PRICE.sheet, sku:`P160G-BAM1025`, quantity:1, img:IMG.sheet.green});
    showToast({ text:'Розовые наволочки, зелёные пододеяльник и простыня' });
  }
  function addSet3(){
    add({name:'Наволочки, белые', price:PRICE.pillowcase, sku:'NW-BAM1025', quantity:1, img:IMG.pillowcase.white});
    add({name:'Пододеяльник, кофейный', price:PRICE.duvet, sku:`PPC-BAM1025`, quantity:1, img:IMG.duvet.coffee});
    add({name:'Простыня, зелёная • 160 × 200, на резинке', price:PRICE.sheet, sku:`P160G-BAM1025`, quantity:1, img:IMG.sheet.green});
    showToast({ text:'Белые наволочки, кофейный пододеяльник, зелёная простыня' });
  }
  function addSet4(){
    add({name:'Наволочки, кофейные', price:PRICE.pillowcase, sku:'NC-BAM1025', quantity:1, img:IMG.pillowcase.coffee});
    add({name:'Пододеяльник, голубой', price:PRICE.duvet, sku:`PPB-BAM1025`, quantity:1, img:IMG.duvet.blue});
    add({name:'Простыня, голубая • 160 × 200, на резинке', price:PRICE.sheet, sku:`P160B-BAM1025`, quantity:1, img:IMG.sheet.blue});
    showToast({ text:'Кофейные наволочки, голубые пододеяльник и простыня' });
  }
  
  // ——— ГЛОБАЛЬНЫЙ ДЕЛЕГАТОР (работает и в Zero popup) ———
  const CLASS_TO_SET = {
    'js-set1': addSet1,
    'js-set2': addSet2,
    'js-set3': addSet3,
    'js-set4': addSet4
  };
  
  function findSetHandler(start){
    let node = start, hops = 0;
    while (node && hops < 6){
      if (node.classList){
        for (const cls in CLASS_TO_SET){
          if (node.classList.contains(cls)) return CLASS_TO_SET[cls];
        }
      }
      node = node.parentNode; hops++;
    }
    return null;
  }
  
  document.addEventListener('click', function(e){
    const handler = findSetHandler(e.target);
    if (!handler) return;
    e.preventDefault();
    whenCartReady(handler);
  }, true);
})();

