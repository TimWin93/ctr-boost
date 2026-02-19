/* ═══════════════════════════════════════════════
   SYSTEM TABS 2.0
   - No GSAP dependency for visibility
   - Pure CSS shows content by default
   - GSAP used only as enhancement for panel transition
════════════════════════════════════════════════ */

(function() {
  var section = document.querySelector('#system');
  if (!section) return;

  var tabs   = Array.from(section.querySelectorAll('.system__tab'));
  var panels = Array.from(section.querySelectorAll('.system__panel'));
  var activeTab   = 0;
  var isAnimating = false;
  var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var gsapAvailable = (typeof gsap !== 'undefined') && !reducedMotion;

  /* Ensure correct init state (HTML already has first tab/panel active) */
  tabs.forEach(function(btn, i) {
    btn.setAttribute('aria-selected', i === 0 ? 'true' : 'false');
  });
  panels.forEach(function(p, i) {
    if (i !== 0) {
      p.classList.remove('active');
    }
  });

  /* ── Switch ── */
  function switchTo(idx) {
    if (idx === activeTab || isAnimating) return;

    var oldPanel = panels[activeTab];
    var newPanel = panels[idx];

    /* Update buttons */
    tabs.forEach(function(btn, i) {
      btn.classList.toggle('active', i === idx);
      btn.setAttribute('aria-selected', i === idx ? 'true' : 'false');
    });

    activeTab = idx;

    /* Panel transition */
    if (gsapAvailable) {
      isAnimating = true;
      oldPanel.classList.remove('active');
      newPanel.classList.add('active');
      gsap.fromTo(newPanel,
        { opacity: 0, y: 10 },
        {
          opacity: 1, y: 0, duration: 0.28, ease: 'power2.out',
          onComplete: function() { isAnimating = false; }
        }
      );
    } else {
      /* No GSAP: instant switch */
      oldPanel.classList.remove('active');
      newPanel.classList.add('active');
    }
  }

  /* ── Click handlers ── */
  tabs.forEach(function(btn, i) {
    btn.addEventListener('click', function() { switchTo(i); });
  });

  /* ── Keyboard navigation ── */
  section.addEventListener('keydown', function(e) {
    var total = tabs.length;
    if (e.key === 'ArrowRight') {
      e.preventDefault();
      var next = (activeTab + 1) % total;
      switchTo(next); tabs[next].focus();
    }
    if (e.key === 'ArrowLeft') {
      e.preventDefault();
      var prev = (activeTab - 1 + total) % total;
      switchTo(prev); tabs[prev].focus();
    }
    if (e.key === 'Home') { e.preventDefault(); switchTo(0); tabs[0].focus(); }
    if (e.key === 'End')  { e.preventDefault(); switchTo(total - 1); tabs[total - 1].focus(); }
  });
})();


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

var calcClicksRaf = null;
var calcClicksCurrent = 0;

function animateCalcNumber(target) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    document.getElementById('calcClicks').textContent = '+ ' + formatNum(target);
    return;
  }

  var el = document.getElementById('calcClicks');
  var start = calcClicksCurrent;
  var duration = 500;
  var startTime = null;

  el.classList.add('updating');

  if (calcClicksRaf) cancelAnimationFrame(calcClicksRaf);

  function step(ts) {
    if (!startTime) startTime = ts;
    var progress = Math.min((ts - startTime) / duration, 1);
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

  document.getElementById('opt30').textContent = formatCTR(ctr) + ' → ' + formatCTR(ctr * 1.3);
  document.getElementById('opt60').textContent = formatCTR(ctr) + ' → ' + formatCTR(ctr * 1.6);
  document.getElementById('optX2').textContent = formatCTR(ctr) + ' → ' + formatCTR(ctr * 2);

  animateCalcNumber(diff);

  document.getElementById('calcNewCTR').textContent = formatCTR(newCTR);
  document.getElementById('calcOldCTR').textContent = formatCTR(ctr);

  var maxCTR = Math.max(newCTR, 15);
  document.getElementById('barOld').style.width = (ctr / maxCTR * 100) + '%';
  document.getElementById('barNew').style.width = (newCTR / maxCTR * 100) + '%';
  document.getElementById('barLabelOld').textContent = formatCTR(ctr);
  document.getElementById('barLabelNew').textContent = formatCTR(newCTR);
}

document.getElementById('calcImpressions').addEventListener('input', function() {
  var raw = this.value.replace(/\s/g, '').replace(/\D/g, '');
  this.value = raw ? parseInt(raw).toLocaleString('ru-RU') : '';
  calculate();
});

document.getElementById('calcCTR').addEventListener('input', calculate);

calculate();


/* ═══════════════════════════════════════════════
   SCROLL-АНИМАЦИИ (IntersectionObserver)
═══════════════════════════════════════════════ */

(function() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  var animEls = document.querySelectorAll('.anim-fade-up, .anim-fade-in');
  if (!animEls.length || !('IntersectionObserver' in window)) {
    /* No observer support: remove js-anim so elements are visible */
    document.body.classList.remove('js-anim');
    return;
  }

  var observer = new IntersectionObserver(function(entries) {
    entries.forEach(function(entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
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
  var modal        = document.getElementById('caseModal');
  var modalImg     = document.getElementById('modalImg');
  var modalClose   = document.getElementById('modalClose');
  var modalPrev    = document.getElementById('modalPrev');
  var modalNext    = document.getElementById('modalNext');
  var modalCounter = document.getElementById('modalCounter');

  if (!modal) return;

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

  document.querySelectorAll('.case-image-card').forEach(function(card, i) {
    card.setAttribute('tabindex', '0');
    card.addEventListener('click', function() { openModal(i); });
    card.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); openModal(i); }
    });
  });

  modalClose.addEventListener('click', closeModal);
  modalPrev.addEventListener('click', showPrev);
  modalNext.addEventListener('click', showNext);

  modal.addEventListener('click', function(e) {
    if (e.target === modal) closeModal();
  });

  document.addEventListener('keydown', function(e) {
    if (!modal.classList.contains('is-open')) return;
    if (e.key === 'Escape')      closeModal();
    if (e.key === 'ArrowLeft')   showPrev();
    if (e.key === 'ArrowRight')  showNext();
  });
})();
