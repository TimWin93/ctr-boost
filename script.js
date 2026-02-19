/* ═══════════════════════════════════════════════
   TABS SYSTEM — GSAP PRO v3 (pill/blob + glow sweep + word stagger + chips)
═══════════════════════════════════════════════ */

(function() {
  var section      = document.querySelector('.tabs-section');
  if (!section) return;

  var tabBtns      = Array.from(section.querySelectorAll('.tab-btn'));
  var panels       = Array.from(section.querySelectorAll('.tab-panel'));
  var blob         = section.querySelector('.tabs-blob');
  var counterNum   = section.querySelector('.tab-counter-num');
  var contentWrap  = section.querySelector('.tabs-content-wrap');
  var navEl        = section.querySelector('.tabs-nav');
  var words        = Array.from(section.querySelectorAll('.tabs-entrance-title .word'));
  var chips        = Array.from(section.querySelectorAll('.mech-chip'));
  var sweepEl      = contentWrap; /* ::before sweep driven via custom CSS var trick — see below */

  var currentIndex  = 0;
  var isAnimating   = false;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile      = window.matchMedia('(max-width: 700px)').matches;

  /* ══════════════════════════════
     BLOB helpers
  ══════════════════════════════ */
  function getBlobTarget(btn) {
    var nr = navEl.getBoundingClientRect();
    var br = btn.getBoundingClientRect();
    return { x: br.left - nr.left - 5, w: br.width };
  }

  function setBlobInstant(btn) {
    var t = getBlobTarget(btn);
    gsap.set(blob, { x: t.x, width: t.w });
  }

  /* ══════════════════════════════
     COUNTER
  ══════════════════════════════ */
  function animateCounter(idx) {
    var label = String(idx + 1).padStart(2, '0');
    if (reducedMotion) { counterNum.textContent = label; return; }
    gsap.to(counterNum, {
      opacity: 0, y: -6, duration: 0.14, ease: 'power2.in',
      onComplete: function() {
        counterNum.textContent = label;
        gsap.fromTo(counterNum,
          { opacity: 0, y: 8 },
          { opacity: 1, y: 0, duration: 0.22, ease: 'power2.out' }
        );
      }
    });
  }

  /* ══════════════════════════════
     MECHANISM CHIPS
  ══════════════════════════════ */
  function setChipActive(idx) {
    chips.forEach(function(chip, i) {
      chip.classList.toggle('active', i === idx);
      if (reducedMotion) return;
      if (i === idx) {
        gsap.fromTo(chip,
          { scale: 1, opacity: 0.45 },
          { scale: 1.04, opacity: 1, duration: 0.25, ease: 'power2.out',
            onComplete: function() { gsap.to(chip, { scale: 1, duration: 0.15 }); }
          }
        );
      } else {
        gsap.to(chip, { opacity: 0.45, duration: 0.2 });
      }
    });
  }

  /* ══════════════════════════════
     GLOW SWEEP (::before via pseudo-wrapper)
     We animate a real div overlay instead of ::before
     for full GSAP control
  ══════════════════════════════ */
  var sweepDiv = document.createElement('div');
  sweepDiv.className = 'tabs-sweep';
  contentWrap.insertBefore(sweepDiv, contentWrap.firstChild);

  function runSweep() {
    if (reducedMotion) return;
    gsap.fromTo(sweepDiv,
      { x: '-100%', opacity: 1 },
      { x: '160%', opacity: 1, duration: 0.9, ease: 'power2.inOut',
        onComplete: function() { gsap.set(sweepDiv, { opacity: 0 }); }
      }
    );
  }

  /* subtle hover sweep */
  if (!isMobile && !reducedMotion) {
    contentWrap.addEventListener('mouseenter', function() {
      gsap.fromTo(sweepDiv,
        { x: '-60%', opacity: 0.7 },
        { x: '160%', opacity: 0.7, duration: 1.1, ease: 'power1.inOut',
          onComplete: function() { gsap.set(sweepDiv, { opacity: 0 }); }
        }
      );
    });
  }

  /* ══════════════════════════════
     SWITCH TAB
  ══════════════════════════════ */
  function switchTab(newIdx) {
    if (newIdx === currentIndex || isAnimating) return;
    isAnimating = true;

    var oldPanel = panels[currentIndex];
    var newPanel = panels[newIdx];
    var newBtn   = tabBtns[newIdx];

    tabBtns.forEach(function(b, i) {
      b.classList.toggle('active', i === newIdx);
      b.setAttribute('aria-selected', i === newIdx ? 'true' : 'false');
    });

    currentIndex = newIdx;
    animateCounter(newIdx);
    setChipActive(newIdx);

    /* ── Reduced motion ── */
    if (reducedMotion) {
      oldPanel.classList.remove('active');
      oldPanel.style.display = 'none';
      newPanel.style.display = 'block';
      newPanel.classList.add('active');
      gsap.set(newPanel, { opacity: 1, y: 0, clearProps: 'filter' });
      setBlobInstant(newBtn);
      isAnimating = false;
      return;
    }

    /* Blob morph */
    var t = getBlobTarget(newBtn);
    gsap.to(blob, {
      x: t.x, width: t.w * 1.06, duration: 0.3, ease: 'power3.out',
      onComplete: function() {
        gsap.to(blob, { width: t.w, duration: 0.2, ease: 'power2.out' });
      }
    });

    /* Active tab pulse */
    gsap.fromTo(newBtn, { scale: 0.97 }, { scale: 1, duration: 0.2, ease: 'power2.out' });

    /* Old panel out */
    gsap.to(oldPanel, {
      opacity: 0, y: -6, filter: 'blur(3px)',
      duration: 0.18, ease: 'power2.in',
      onComplete: function() {
        oldPanel.classList.remove('active');
        oldPanel.style.display = 'none';
        gsap.set(oldPanel, { opacity: 0, y: 0, clearProps: 'filter' });

        /* New panel in */
        newPanel.style.display = 'block';
        newPanel.classList.add('active');
        gsap.fromTo(newPanel,
          { opacity: 0, y: 10, filter: 'blur(6px)' },
          { opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 0.32, ease: 'power3.out',
            onComplete: function() {
              gsap.set(newPanel, { clearProps: 'filter' });
              isAnimating = false;
            }
          }
        );

        /* mini sweep on each switch */
        gsap.fromTo(sweepDiv,
          { x: '-100%', opacity: 0.8 },
          { x: '160%', opacity: 0.8, duration: 0.7, ease: 'power2.out',
            onComplete: function() { gsap.set(sweepDiv, { opacity: 0 }); }
          }
        );
      }
    });
  }

  /* ══════════════════════════════
     CLICK + KEYBOARD
  ══════════════════════════════ */
  tabBtns.forEach(function(btn, i) {
    btn.id = 'tab-btn-' + i;
    btn.addEventListener('click', function() { switchTab(i); });
  });

  navEl.addEventListener('keydown', function(e) {
    var total = tabBtns.length;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      var next = (currentIndex + 1) % total;
      switchTab(next); tabBtns[next].focus();
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      var prev = (currentIndex - 1 + total) % total;
      switchTab(prev); tabBtns[prev].focus();
    }
    if (e.key === 'Home') { e.preventDefault(); switchTab(0); tabBtns[0].focus(); }
    if (e.key === 'End')  { e.preventDefault(); switchTab(total - 1); tabBtns[total - 1].focus(); }
  });

  /* ══════════════════════════════
     MAGNETIC HOVER (desktop only)
  ══════════════════════════════ */
  if (!isMobile && !reducedMotion) {
    tabBtns.forEach(function(btn) {
      var qx = gsap.quickTo(btn, 'x', { duration: 0.28, ease: 'power2.out' });
      var qy = gsap.quickTo(btn, 'y', { duration: 0.28, ease: 'power2.out' });
      btn.addEventListener('mousemove', function(e) {
        var r = btn.getBoundingClientRect();
        qx((e.clientX - r.left - r.width  / 2) * 0.2);
        qy((e.clientY - r.top  - r.height / 2) * 0.28);
      });
      btn.addEventListener('mouseleave', function() { qx(0); qy(0); });
    });
  }

  /* ══════════════════════════════
     ENTRANCE — showAll (instant)
  ══════════════════════════════ */
  function showAll() {
    gsap.set(section.querySelector('.tabs-entrance-label'), { opacity: 1, y: 0 });
    gsap.set(words, { opacity: 1, y: 0 });
    gsap.set(section.querySelector('.tabs-entrance-sub'), { opacity: 1, y: 0 });
    gsap.set(tabBtns, { opacity: 1, y: 0 });
    gsap.set(contentWrap, { opacity: 1, y: 0 });
    setBlobInstant(tabBtns[0]);
    setChipActive(0);
  }

  /* ══════════════════════════════
     ENTRANCE — animated
  ══════════════════════════════ */
  function runEntrance() {
    if (reducedMotion) { showAll(); return; }

    var tl = gsap.timeline({
      scrollTrigger: { trigger: section, start: 'top 75%', once: true }
    });

    tl.to(section.querySelector('.tabs-entrance-label'),
        { opacity: 1, y: 0, duration: 0.45, ease: 'power3.out' })

      /* word stagger */
      .to(words,
        { opacity: 1, y: 0, duration: 0.38, stagger: 0.07, ease: 'power3.out' }, '-=0.28')

      .to(section.querySelector('.tabs-entrance-sub'),
        { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, '-=0.2')

      /* pill nav stagger */
      .to(tabBtns,
        { opacity: 1, y: 0, duration: 0.3, stagger: 0.06, ease: 'power3.out' }, '-=0.22')

      /* content panel */
      .to(contentWrap,
        { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' }, '-=0.15')

      /* after all visible: position blob + sweep */
      .call(function() {
        setBlobInstant(tabBtns[0]);
        setChipActive(0);
        runSweep();
      });
  }

  /* ══════════════════════════════
     INIT
  ══════════════════════════════ */
  panels[0].style.display = 'block';
  gsap.set(panels[0], { opacity: 1 });
  gsap.set(sweepDiv, { opacity: 0 });
  counterNum.textContent = '01';

  if (typeof ScrollTrigger !== 'undefined') {
    runEntrance();
  } else {
    showAll();
  }

  /* resize → recalculate blob */
  var resizeTimer;
  window.addEventListener('resize', function() {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(function() {
      isMobile = window.matchMedia('(max-width: 700px)').matches;
      setBlobInstant(tabBtns[currentIndex]);
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
