/* ═══════════════════════════════════════════════
   TABS SYSTEM — GSAP PRO v4.1 (fixed)
════════════════════════════════════════════════ */

(function() {
  var section     = document.querySelector('.tabs-section');
  if (!section) return;

  var tabBtns     = Array.from(section.querySelectorAll('.tab-btn'));
  var panels      = Array.from(section.querySelectorAll('.tab-panel'));
  var blob        = section.querySelector('.tabs-blob');
  var counterNum  = section.querySelector('.tab-counter-num');
  var contentWrap = section.querySelector('.tabs-content-wrap');
  var navEl       = section.querySelector('.tabs-nav');
  /* exclude .sys-word-break from stagger — it's an invisible line-break */
  var words       = Array.from(section.querySelectorAll('.sys-word:not(.sys-word-break)'));
  var wires       = Array.from(section.querySelectorAll('.sys-wire'));
  var wireH       = section.querySelector('.sys-wire-h');
  var flowItems   = Array.from(section.querySelectorAll('.sys-flow-item'));
  var flowResult  = section.querySelector('.sys-flow-result');
  var flowFinale  = section.querySelector('.sys-flow-finale');

  var currentIndex  = 0;
  var isAnimating   = false;
  var flowDone      = false;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var isMobile      = window.matchMedia('(max-width: 700px)').matches;

  /* ════════════════════════════
     BLOB helpers
  ════════════════════════════ */
  function getBlobTarget(btn) {
    var nr = navEl.getBoundingClientRect();
    var br = btn.getBoundingClientRect();
    return { x: br.left - nr.left - 6, w: br.width };
  }

  /* Defer to next frame so layout is complete */
  function setBlobInstant(btn) {
    requestAnimationFrame(function() {
      var t = getBlobTarget(btn);
      gsap.set(blob, { x: t.x, width: t.w });
    });
  }

  /* ════════════════════════════
     COUNTER
  ════════════════════════════ */
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

  /* ════════════════════════════
     SVG WIRES — use attr:{} for SVG properties
  ════════════════════════════ */
  function setWireActive(idx) {
    wires.forEach(function(w, i) {
      if (i === idx) {
        w.classList.add('active-wire');
        gsap.to(w, { opacity: 1, duration: 0.4, ease: 'power2.out' });
      } else {
        w.classList.remove('active-wire');
        gsap.to(w, { opacity: 0.35, duration: 0.3 });
      }
    });
  }

  function drawWires() {
    /* horizontal line */
    if (wireH) {
      gsap.fromTo(wireH,
        { attr: { 'stroke-dashoffset': 680 } },
        { attr: { 'stroke-dashoffset': 0 }, duration: 0.7, ease: 'power2.inOut' }
      );
    }
    /* vertical lines staggered */
    gsap.fromTo(wires,
      { attr: { 'stroke-dashoffset': 82 }, opacity: 0 },
      { attr: { 'stroke-dashoffset': 0 }, opacity: 0.35,
        duration: 0.45, stagger: 0.07, ease: 'power2.out', delay: 0.15 }
    );
  }

  /* ════════════════════════════
     SWEEP DIV
  ════════════════════════════ */
  var sweepDiv = document.createElement('div');
  sweepDiv.className = 'tabs-sweep';
  contentWrap.insertBefore(sweepDiv, contentWrap.firstChild);
  gsap.set(sweepDiv, { opacity: 0, x: '-100%' });

  function runSweep(fast) {
    if (reducedMotion) return;
    var dur = fast ? 0.55 : 0.85;
    var op  = fast ? 0.65 : 0.9;
    gsap.killTweensOf(sweepDiv);
    gsap.fromTo(sweepDiv,
      { x: '-100%', opacity: op },
      { x: '160%',  opacity: op, duration: dur, ease: 'power2.inOut',
        onComplete: function() { gsap.set(sweepDiv, { opacity: 0 }); }
      }
    );
  }

  if (!isMobile && !reducedMotion) {
    contentWrap.addEventListener('mouseenter', function() { runSweep(true); });
  }

  /* ════════════════════════════
     FLOW FINALE (one-shot)
  ════════════════════════════ */
  function runFlowFinale() {
    if (reducedMotion || flowDone) return;
    flowDone = true;
    var tl = gsap.timeline();
    flowItems.forEach(function(item, i) {
      tl.to(item,
        { opacity: 1, color: '#F59E0B', duration: 0.22, ease: 'power2.out' },
        i * 0.3
      );
    });
    tl.to(flowResult,
      { opacity: 1, y: 0, duration: 0.38, ease: 'power3.out' },
      '+=0.12'
    );
  }

  /* ════════════════════════════
     SWITCH TAB
  ════════════════════════════ */
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
    setWireActive(newIdx);

    /* icon wiggle on active tab */
    if (!reducedMotion) {
      var icon = newBtn.querySelector('.tab-icon');
      if (icon) {
        gsap.killTweensOf(icon);
        gsap.fromTo(icon,
          { rotation: -6 },
          { rotation: 0, duration: 0.38, ease: 'elastic.out(1, 0.5)' }
        );
      }
    }

    /* ── reduced motion instant switch ── */
    if (reducedMotion) {
      oldPanel.classList.remove('active'); oldPanel.style.display = 'none';
      newPanel.style.display = 'block';   newPanel.classList.add('active');
      gsap.set(newPanel, { opacity: 1, y: 0, clearProps: 'filter' });
      setBlobInstant(newBtn);
      isAnimating = false;
      return;
    }

    /* blob morph */
    requestAnimationFrame(function() {
      var t = getBlobTarget(newBtn);
      gsap.to(blob, {
        x: t.x, width: t.w * 1.05,
        duration: 0.3, ease: 'power3.out',
        onComplete: function() {
          gsap.to(blob, { width: t.w, duration: 0.18, ease: 'power2.out' });
        }
      });
    });

    /* pulse active button */
    gsap.fromTo(newBtn, { scale: 0.96 }, { scale: 1, duration: 0.22, ease: 'power2.out' });

    /* old panel out */
    gsap.to(oldPanel, {
      opacity: 0, y: -6, filter: 'blur(3px)',
      duration: 0.17, ease: 'power2.in',
      onComplete: function() {
        oldPanel.classList.remove('active');
        oldPanel.style.display = 'none';
        gsap.set(oldPanel, { opacity: 0, y: 0, clearProps: 'filter' });

        /* new panel in */
        newPanel.style.display = 'block';
        newPanel.classList.add('active');
        gsap.fromTo(newPanel,
          { opacity: 0, y: 10, filter: 'blur(5px)' },
          {
            opacity: 1, y: 0, filter: 'blur(0px)',
            duration: 0.3, ease: 'power3.out',
            onComplete: function() {
              gsap.set(newPanel, { clearProps: 'filter' });
              isAnimating = false;
            }
          }
        );
        runSweep(true);
      }
    });
  }

  /* ════════════════════════════
     CLICK + KEYBOARD
  ════════════════════════════ */
  tabBtns.forEach(function(btn, i) {
    btn.id = 'tab-btn-' + i;
    btn.addEventListener('click', function() { switchTab(i); });
  });

  navEl.addEventListener('keydown', function(e) {
    var total = tabBtns.length;
    var next, prev;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      next = (currentIndex + 1) % total;
      switchTab(next); tabBtns[next].focus();
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      prev = (currentIndex - 1 + total) % total;
      switchTab(prev); tabBtns[prev].focus();
    }
    if (e.key === 'Home') { e.preventDefault(); switchTab(0); tabBtns[0].focus(); }
    if (e.key === 'End')  { e.preventDefault(); switchTab(total - 1); tabBtns[total - 1].focus(); }
  });

  /* ════════════════════════════
     MAGNETIC HOVER (desktop only)
  ════════════════════════════ */
  if (!isMobile && !reducedMotion) {
    tabBtns.forEach(function(btn) {
      var qx = gsap.quickTo(btn, 'x', { duration: 0.3, ease: 'power2.out' });
      var qy = gsap.quickTo(btn, 'y', { duration: 0.3, ease: 'power2.out' });
      btn.addEventListener('mousemove', function(e) {
        var r = btn.getBoundingClientRect();
        qx((e.clientX - r.left - r.width  / 2) * 0.18);
        qy((e.clientY - r.top  - r.height / 2) * 0.22);
      });
      btn.addEventListener('mouseleave', function() { qx(0); qy(0); });
    });
  }

  /* ════════════════════════════
     showAll — instant (fallback / reduced-motion)
  ════════════════════════════ */
  function showAll() {
    gsap.set(words, { opacity: 1, y: 0, clearProps: 'transform' });
    gsap.set(tabBtns, { opacity: 1, y: 0, clearProps: 'transform' });
    gsap.set(contentWrap, { opacity: 1, y: 0 });
    gsap.set(flowFinale, { opacity: 1, y: 0 });
    gsap.set(flowResult, { opacity: 1, y: 0 });
    if (wireH) gsap.set(wireH, { attr: { 'stroke-dashoffset': 0 } });
    wires.forEach(function(w) { gsap.set(w, { attr: { 'stroke-dashoffset': 0 }, opacity: 0.35 }); });
    /* blob after layout */
    requestAnimationFrame(function() {
      setBlobInstant(tabBtns[0]);
      setWireActive(0);
    });
    /* show flow finale items immediately */
    gsap.set(flowItems, { opacity: 1, color: '#F59E0B' });
    gsap.set(flowResult, { opacity: 1, y: 0 });
    flowDone = true;
  }

  /* ════════════════════════════
     ENTRANCE — ScrollTrigger
  ════════════════════════════ */
  function runEntrance() {
    if (reducedMotion) { showAll(); return; }

    var tl = gsap.timeline({
      scrollTrigger: {
        trigger: section,
        start: 'top 74%',
        once: true
      }
    });

    tl
      /* words stagger */
      .to(words,
        { opacity: 1, y: 0, duration: 0.52, stagger: 0.08, ease: 'power4.out' }
      )
      /* draw wires inline via GSAP — correct attr syntax */
      .add(function() { drawWires(); }, '-=0.25')

      /* tab pills stagger */
      .to(tabBtns,
        { opacity: 1, y: 0, duration: 0.32, stagger: 0.06, ease: 'power3.out' },
        '-=0.2'
      )
      /* content wrap */
      .to(contentWrap,
        { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' },
        '-=0.18'
      )
      /* flow finale box */
      .to(flowFinale,
        { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' },
        '-=0.1'
      )
      .call(function() {
        /* blob after all elements are laid out */
        requestAnimationFrame(function() {
          setBlobInstant(tabBtns[0]);
          setWireActive(0);
        });
        runSweep(false);
        /* flow finale sequential lights */
        gsap.delayedCall(0.5, runFlowFinale);
      });
  }

  /* ════════════════════════════
     INIT
  ════════════════════════════ */
  panels[0].style.display = 'block';
  gsap.set(panels[0], { opacity: 1 });
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
      requestAnimationFrame(function() {
        setBlobInstant(tabBtns[currentIndex]);
      });
    }, 150);
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
