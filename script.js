/* ═══════════════════════════════════════════════
   TABS SYSTEM — GSAP PRO
═══════════════════════════════════════════════ */

(function() {
  var section       = document.querySelector('.tabs-section');
  if (!section) return;

  var tabBtns       = section.querySelectorAll('.tab-btn');
  var panels        = section.querySelectorAll('.tab-panel');
  var underline     = section.querySelector('.tabs-underline');
  var mechSegs      = section.querySelectorAll('.mech-seg');
  var counterNum    = section.querySelector('.tab-counter-num');
  var contentWrap   = section.querySelector('.tabs-content-wrap');
  var navEl         = section.querySelector('.tabs-nav');

  var currentIndex  = 0;
  var isAnimating   = false;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile      = window.matchMedia('(max-width: 700px)').matches;

  /* ── Helpers ── */
  function getUnderlineTarget(btn) {
    var nr = navEl.getBoundingClientRect();
    var br = btn.getBoundingClientRect();
    return { x: br.left - nr.left, w: br.width };
  }

  function setUnderlineInstant(btn) {
    var t = getUnderlineTarget(btn);
    gsap.set(underline, { x: t.x, width: t.w });
  }

  /* ── Counter animation ── */
  function animateCounter(idx) {
    var label = String(idx + 1).padStart(2, '0');
    if (reducedMotion) { counterNum.textContent = label; return; }
    gsap.to(counterNum, {
      opacity: 0, y: -6, duration: 0.14, ease: 'power2.in',
      onComplete: function() {
        counterNum.textContent = label;
        gsap.fromTo(counterNum, { opacity: 0, y: 8 }, { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out' });
      }
    });
  }

  /* ── Mechanism bar ── */
  function setMechActive(idx) {
    mechSegs.forEach(function(seg, i) {
      if (reducedMotion) {
        seg.classList.toggle('active', i === idx);
        return;
      }
      if (i === idx) {
        seg.classList.add('active');
        gsap.fromTo(seg, { opacity: 0.4 }, { opacity: 1, scale: 1.05, duration: 0.25, ease: 'power2.out',
          onComplete: function() { gsap.set(seg, { scale: 1 }); }
        });
      } else {
        gsap.to(seg, { opacity: 0.4, duration: 0.2 });
        seg.classList.remove('active');
      }
    });
  }

  /* ── Switch tab ── */
  function switchTab(newIdx) {
    if (newIdx === currentIndex || isAnimating) return;
    isAnimating = true;

    var oldIdx  = currentIndex;
    var oldPanel = panels[oldIdx];
    var newPanel = panels[newIdx];
    var newBtn   = tabBtns[newIdx];

    // Update aria / active classes
    tabBtns.forEach(function(b, i) {
      b.classList.toggle('active', i === newIdx);
      b.setAttribute('aria-selected', i === newIdx ? 'true' : 'false');
    });

    currentIndex = newIdx;
    animateCounter(newIdx);
    setMechActive(newIdx);

    if (reducedMotion) {
      oldPanel.classList.remove('active');
      oldPanel.style.display = 'none';
      newPanel.style.display = 'block';
      newPanel.classList.add('active');
      gsap.set(newPanel, { opacity: 1, y: 0 });
      setUnderlineInstant(newBtn);
      isAnimating = false;
      return;
    }

    /* Underline morph */
    var target = getUnderlineTarget(newBtn);
    // 2-step: overshoot width then settle
    gsap.to(underline, {
      x: target.x, width: target.w * 1.04,
      duration: 0.22, ease: 'power3.out',
      onComplete: function() {
        gsap.to(underline, { width: target.w, duration: 0.18, ease: 'power2.out' });
      }
    });

    /* Active tab pulse */
    gsap.fromTo(newBtn, { scale: 0.98 }, { scale: 1, duration: 0.18, ease: 'power2.out' });

    /* Old panel out */
    gsap.to(oldPanel, {
      opacity: 0, y: -6, duration: 0.18, ease: 'power2.in',
      onComplete: function() {
        oldPanel.classList.remove('active');
        oldPanel.style.display = 'none';
        gsap.set(oldPanel, { opacity: 0, y: 0 });

        /* New panel in */
        newPanel.style.display = 'block';
        newPanel.classList.add('active');
        gsap.fromTo(newPanel,
          { opacity: 0, y: 10 },
          { opacity: 1, y: 0, duration: 0.32, ease: 'power3.out',
            onComplete: function() { isAnimating = false; }
          }
        );
      }
    });
  }

  /* ── Tab button click ── */
  tabBtns.forEach(function(btn, i) {
    btn.id = 'tab-btn-' + i;
    btn.addEventListener('click', function() { switchTab(i); });
  });

  /* ── Keyboard navigation ── */
  navEl.addEventListener('keydown', function(e) {
    var total = tabBtns.length;
    if (e.key === 'ArrowRight') { e.preventDefault(); switchTab((currentIndex + 1) % total); tabBtns[(currentIndex) % total].focus(); }
    if (e.key === 'ArrowLeft')  { e.preventDefault(); switchTab((currentIndex - 1 + total) % total); tabBtns[currentIndex].focus(); }
    if (e.key === 'Home')       { e.preventDefault(); switchTab(0); tabBtns[0].focus(); }
    if (e.key === 'End')        { e.preventDefault(); switchTab(total - 1); tabBtns[total - 1].focus(); }
  });

  /* ── Magnetic hover (desktop, reduced-motion off) ── */
  if (!isMobile && !reducedMotion && typeof gsap !== 'undefined') {
    tabBtns.forEach(function(btn) {
      var qx = gsap.quickTo(btn, 'x', { duration: 0.3, ease: 'power2.out' });
      var qy = gsap.quickTo(btn, 'y', { duration: 0.3, ease: 'power2.out' });

      btn.addEventListener('mousemove', function(e) {
        var r = btn.getBoundingClientRect();
        var cx = r.left + r.width / 2;
        var cy = r.top  + r.height / 2;
        qx((e.clientX - cx) * 0.25);
        qy((e.clientY - cy) * 0.35);
      });

      btn.addEventListener('mouseleave', function() { qx(0); qy(0); });
    });
  }

  /* ── Entrance ScrollTrigger ── */
  function runEntrance() {
    if (reducedMotion) {
      // Show everything immediately
      gsap.set([
        section.querySelector('.tabs-entrance-label'),
        section.querySelector('.tabs-entrance-title'),
        section.querySelector('.tabs-entrance-sub')
      ], { opacity: 1, y: 0 });
      gsap.set(Array.from(tabBtns), { opacity: 1, y: 0 });
      gsap.set(contentWrap, { opacity: 1, y: 0 });
      // Position underline
      setUnderlineInstant(tabBtns[0]);
      return;
    }

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 75%',
        once: true
      }
    });

    tl.to(section.querySelector('.tabs-entrance-label'),
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' })
      .to(section.querySelector('.tabs-entrance-title'),
        { opacity: 1, y: 0, duration: 0.5, ease: 'power3.out' }, '-=0.38')
      .to(section.querySelector('.tabs-entrance-sub'),
        { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, '-=0.32')
      .to(Array.from(tabBtns),
        { opacity: 1, y: 0, duration: 0.35, stagger: 0.07, ease: 'power3.out' }, '-=0.28')
      .to(contentWrap,
        { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' }, '-=0.2')
      .call(function() {
        // Set underline to first tab after entrance
        setUnderlineInstant(tabBtns[0]);
      });
  }

  /* ── Init ── */
  // Set first panel visible
  panels[0].style.display = 'block';
  gsap.set(panels[0], { opacity: 1 });

  // Init mechanism
  setMechActive(0);

  // Counter
  counterNum.textContent = '01';

  // Run entrance
  if (typeof ScrollTrigger !== 'undefined') {
    runEntrance();
  } else {
    // Fallback: show immediately
    gsap.set([
      section.querySelector('.tabs-entrance-label'),
      section.querySelector('.tabs-entrance-title'),
      section.querySelector('.tabs-entrance-sub')
    ], { opacity: 1, y: 0 });
    gsap.set(Array.from(tabBtns), { opacity: 1, y: 0 });
    gsap.set(contentWrap, { opacity: 1, y: 0 });
    setUnderlineInstant(tabBtns[0]);
  }

  // Recalculate underline on resize
  var resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      isMobile = window.matchMedia('(max-width: 700px)').matches;
      setUnderlineInstant(tabBtns[currentIndex]);
    }, 120);
  });

})();


/* ═══════════════════════════════════════════════
   ДИАГНОСТИКА
═══════════════════════════════════════════════ */
console.log("GSAP:", typeof gsap);
console.log("ScrollTrigger:", typeof ScrollTrigger !== 'undefined' && typeof ScrollTrigger.version !== 'undefined');
console.log("caseModal:", !!document.getElementById('caseModal'));
console.log("case-image-card count:", document.querySelectorAll('.case-image-card').length);
console.log("anim-fade-up count:", document.querySelectorAll('.anim-fade-up').length);

/* ═══════════════════════════════════════════════
   КАЛЬКУЛЯТОР
═══════════════════════════════════════════════ */

function parseNum(str) {
  return parseFloat(String(str).replace(/\s/g, '').replace(',', '.')) || 0;
}
function formatNum(n) {
  return Math.round(n).toLocaleString('ru-RU');
}
function formatCTR(n) {
  return n.toFixed(1).replace('.', ',') + '%';
}

function selectOpt(el) {
  document.querySelectorAll('.calc-opt').forEach(b => b.classList.remove('active'));
  el.classList.add('active');
  calculate();
}

// Анимация числа: плавный счётчик от текущего к целевому
var calcClicksRaf = null;
var calcClicksCurrent = 0;

function animateCalcNumber(target) {
  // Если prefers-reduced-motion — сразу ставим значение
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.getElementById('calcClicks').textContent = '+ ' + formatNum(target);
    return;
  }

  var el = document.getElementById('calcClicks');
  var start = calcClicksCurrent;
  var duration = 500; // ms
  var startTime = null;

  // Подсвечиваем блок при изменении
  el.classList.add('updating');

  if (calcClicksRaf) cancelAnimationFrame(calcClicksRaf);

  function step(ts) {
    if (!startTime) startTime = ts;
    var progress = Math.min((ts - startTime) / duration, 1);
    // easeOutQuart
    var ease = 1 - Math.pow(1 - progress, 4);
    var current = Math.round(start + (target - start) * ease);
    el.textContent = '+ ' + formatNum(current);
    if (progress < 1) {
      calcClicksRaf = requestAnimationFrame(step);
    } else {
      calcClicksCurrent = target;
      el.classList.remove('updating');
    }
  }

  calcClicksRaf = requestAnimationFrame(step);
}

function calculate() {
  var imp = parseNum(document.getElementById('calcImpressions').value);
  var ctr = parseNum(document.getElementById('calcCTR').value);
  var activeBtn = document.querySelector('.calc-opt.active');
  var mult = parseFloat(activeBtn.dataset.mult);

  var newCTR = ctr * mult;
  var oldClicks = imp * (ctr / 100);
  var newClicks = imp * (newCTR / 100);
  var diff = newClicks - oldClicks;

  // Подписи внутри кнопок
  document.getElementById('opt30').textContent = formatCTR(ctr) + ' → ' + formatCTR(ctr * 1.3);
  document.getElementById('opt60').textContent = formatCTR(ctr) + ' → ' + formatCTR(ctr * 1.6);
  document.getElementById('optX2').textContent = formatCTR(ctr) + ' → ' + formatCTR(ctr * 2);

  // Анимируем главное число
  animateCalcNumber(diff);

  // CTR подписи
  document.getElementById('calcNewCTR').textContent = formatCTR(newCTR);
  document.getElementById('calcOldCTR').textContent = formatCTR(ctr);

  // Бары
  var maxCTR = Math.max(newCTR, 15);
  document.getElementById('barOld').style.width = (ctr / maxCTR * 100) + '%';
  document.getElementById('barNew').style.width = (newCTR / maxCTR * 100) + '%';
  document.getElementById('barLabelOld').textContent = formatCTR(ctr);
  document.getElementById('barLabelNew').textContent = formatCTR(newCTR);
}

// Авто-форматирование показов
document.getElementById('calcImpressions').addEventListener('input', function() {
  var raw = this.value.replace(/\s/g, '').replace(/\D/g, '');
  this.value = raw ? parseInt(raw).toLocaleString('ru-RU') : '';
  calculate();
});

document.getElementById('calcCTR').addEventListener('input', calculate);

// Первый расчёт
calculate();


/* ═══════════════════════════════════════════════
   SCROLL-АНИМАЦИИ (IntersectionObserver)
═══════════════════════════════════════════════ */

(function() {
  // Не запускаем при prefers-reduced-motion
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var animEls = document.querySelectorAll('.anim-fade-up, .anim-fade-in');
  if (!animEls.length || !('IntersectionObserver' in window)) return;

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target); // Срабатывает только один раз
      }
    });
  }, {
    threshold: 0.15,
    rootMargin: '0px 0px -40px 0px'
  });

  animEls.forEach(function(el) {
    observer.observe(el);
  });
})();


/* ═══════════════════════════════════════════════
   МОДАЛКА КЕЙСОВ
═══════════════════════════════════════════════ */

(function() {
  var modal       = document.getElementById('caseModal');
  var modalImg    = document.getElementById('modalImg');
  var modalClose  = document.getElementById('modalClose');
  var modalPrev   = document.getElementById('modalPrev');
  var modalNext   = document.getElementById('modalNext');
  var modalCounter = document.getElementById('modalCounter');

  if (!modal) return;

  // Собираем все изображения кейсов
  var caseImgs = Array.from(document.querySelectorAll('.case-image-wrap img'));
  var currentIndex = 0;

  function openModal(index) {
    currentIndex = index;
    var img = caseImgs[index];
    modalImg.src = img.src;
    modalImg.alt = img.alt;
    modalCounter.textContent = (index + 1) + ' / ' + caseImgs.length;
    modal.classList.add('is-open');
    document.body.style.overflow = 'hidden';
    modalClose.focus();
  }

  function closeModal() {
    modal.classList.remove('is-open');
    document.body.style.overflow = '';
    // Возвращаем фокус на карточку
    var card = caseImgs[currentIndex].closest('.case-image-card');
    if (card) card.focus();
  }

  function showPrev() {
    currentIndex = (currentIndex - 1 + caseImgs.length) % caseImgs.length;
    openModal(currentIndex);
  }

  function showNext() {
    currentIndex = (currentIndex + 1) % caseImgs.length;
    openModal(currentIndex);
  }

  // Клик по карточке
  document.querySelectorAll('.case-image-card').forEach(function(card, i) {
    card.setAttribute('tabindex', '0');
    card.addEventListener('click', function() { openModal(i); });
    card.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(i); }
    });
  });

  // Кнопки
  modalClose.addEventListener('click', closeModal);
  modalPrev.addEventListener('click', showPrev);
  modalNext.addEventListener('click', showNext);

  // Клик на фон — закрыть
  modal.addEventListener('click', function(e) {
    if (e.target === modal) closeModal();
  });

  // Клавиатура
  document.addEventListener('keydown', function(e) {
    if (!modal.classList.contains('is-open')) return;
    if (e.key === 'Escape')      closeModal();
    if (e.key === 'ArrowLeft')   showPrev();
    if (e.key === 'ArrowRight')  showNext();
  });
})();
