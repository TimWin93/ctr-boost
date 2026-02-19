/* ═══════════════════════════════════════════════
   TABS SYSTEM — safe animation (js-anim pattern)
════════════════════════════════════════════════ */

/* Add js-anim class immediately so CSS can hide elements for animation.
   If anything fails, we remove it so content stays visible. */
document.documentElement.classList.add('js-anim');
// Move to body once body exists (script runs at end of body)
document.body.classList.add('js-anim');
document.documentElement.classList.remove('js-anim');

(function() {
  /* Safety: remove js-anim if this block throws */
  function disableAnim(reason) {
    document.body.classList.remove('js-anim');
  }

  try {
    var section = document.querySelector('.tabs-section');
    if (!section) { disableAnim('no section'); return; }

    var tabBtns     = Array.from(section.querySelectorAll('.tab-btn'));
    var panels      = Array.from(section.querySelectorAll('.tab-panel'));
    var blob        = section.querySelector('.tabs-blob');
    var counterNum  = section.querySelector('.tab-counter-num');
    var contentWrap = section.querySelector('.tabs-content-wrap');
    var navEl       = section.querySelector('.tabs-nav');
    var words       = Array.from(section.querySelectorAll('.sys-word'));
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

    /* If GSAP is not available, show everything and bail */
    if (typeof gsap === 'undefined') {
      disableAnim('no gsap');
      initTabsNoAnim();
      return;
    }

    /* ════════════════════════════
       BLOB helpers
    ════════════════════════════ */
    function getBlobTarget(btn) {
      var nr = navEl.getBoundingClientRect();
      var br = btn.getBoundingClientRect();
      return { x: br.left - nr.left - 6, w: br.width };
    }

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
       SVG WIRES
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
      if (wireH) {
        gsap.fromTo(wireH,
          { attr: { 'stroke-dashoffset': 800 } },
          { attr: { 'stroke-dashoffset': 0 }, duration: 0.7, ease: 'power2.inOut' }
        );
      }
      gsap.fromTo(wires,
        { attr: { 'stroke-dashoffset': 60 }, opacity: 0 },
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
      tl.to(flowItems,
        { opacity: 0.35, duration: 0.25, stagger: 0.06, ease: 'power2.out' }
      );
      flowItems.forEach(function(item, i) {
        tl.to(item,
          { opacity: 1, color: '#F59E0B', duration: 0.28, ease: 'power2.out' },
          0.3 + i * 0.28
        );
      });
      tl.to(flowResult,
        { opacity: 1, y: 0, duration: 0.38, ease: 'power3.out' },
        '+=0.1'
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
       showAll — instant fallback
    ════════════════════════════ */
    function showAll() {
      document.body.classList.remove('js-anim');
      gsap.set(words, { opacity: 1, y: 0, clearProps: 'transform' });
      gsap.set(tabBtns, { opacity: 1, y: 0, clearProps: 'transform' });
      gsap.set(contentWrap, { opacity: 1, y: 0 });
      gsap.set(flowFinale, { opacity: 1, y: 0 });
      gsap.set(flowResult, { opacity: 1, y: 0 });
      if (wireH) gsap.set(wireH, { attr: { 'stroke-dashoffset': 0 }, opacity: 0.6 });
      wires.forEach(function(w) { gsap.set(w, { attr: { 'stroke-dashoffset': 0 }, opacity: 0.35 }); });
      requestAnimationFrame(function() {
        setBlobInstant(tabBtns[0]);
        setWireActive(0);
      });
      gsap.set(flowItems, { opacity: 1, color: '#F59E0B' });
      gsap.set(flowResult, { opacity: 1, y: 0, clearProps: 'transform' });
      flowDone = true;
    }

    /* ════════════════════════════
       ENTRANCE — ScrollTrigger
    ════════════════════════════ */
    function runEntrance() {
      if (reducedMotion) { showAll(); return; }

      if (typeof ScrollTrigger === 'undefined') {
        showAll();
        return;
      }

      var tl = gsap.timeline({
        scrollTrigger: {
          trigger: section,
          start: 'top 74%',
          once: true,
          onEnter: function() {
            /* When animation starts, remove js-anim so elements animate FROM hidden state.
               The timeline handles making them visible. */
          }
        },
        onComplete: function() {
          /* Ensure body.js-anim is removed after animation completes */
          document.body.classList.remove('js-anim');
        }
      });

      tl
        .to(words,
          { opacity: 1, y: 0, duration: 0.52, stagger: 0.08, ease: 'power4.out' }
        )
        .add(function() { drawWires(); }, '-=0.25')
        .to(tabBtns,
          { opacity: 1, y: 0, duration: 0.32, stagger: 0.06, ease: 'power3.out' },
          '-=0.2'
        )
        .to(contentWrap,
          { opacity: 1, y: 0, duration: 0.4, ease: 'power3.out' },
          '-=0.18'
        )
        .to(flowFinale,
          { opacity: 1, y: 0, duration: 0.35, ease: 'power3.out' },
          '-=0.1'
        )
        .call(function() {
          requestAnimationFrame(function() {
            setBlobInstant(tabBtns[0]);
            setWireActive(0);
          });
          runSweep(false);
          gsap.delayedCall(0.5, runFlowFinale);
          document.body.classList.remove('js-anim');
        });

      /* Safety: if ScrollTrigger never fires (element not in viewport for 5s), show all */
      setTimeout(function() {
        if (document.body.classList.contains('js-anim')) {
          showAll();
        }
      }, 5000);
    }

    /* ════════════════════════════
       INIT
    ════════════════════════════ */
    /* Ensure only first panel is visible, others hidden */
    panels.forEach(function(p, i) {
      if (i === 0) {
        p.style.display = 'block';
        p.classList.add('active');
        gsap.set(p, { opacity: 1 });
      } else {
        p.style.display = 'none';
        p.classList.remove('active');
      }
    });
    counterNum.textContent = '01';

    runEntrance();

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

  } catch(e) {
    /* On any error: remove js-anim so content is visible */
    document.body.classList.remove('js-anim');
    initTabsNoAnim();
  }

  /* Basic tab switching without GSAP */
  function initTabsNoAnim() {
    try {
      var section2 = document.querySelector('.tabs-section');
      if (!section2) return;
      var btns2   = Array.from(section2.querySelectorAll('.tab-btn'));
      var panels2 = Array.from(section2.querySelectorAll('.tab-panel'));
      var cur2 = 0;

      panels2.forEach(function(p, i) {
        p.style.display = i === 0 ? 'block' : 'none';
        p.classList.toggle('active', i === 0);
      });

      btns2.forEach(function(btn, i) {
        btn.id = 'tab-btn-' + i;
        btn.addEventListener('click', function() {
          if (i === cur2) return;
          panels2[cur2].style.display = 'none';
          panels2[cur2].classList.remove('active');
          btns2[cur2].classList.remove('active');
          btns2[cur2].setAttribute('aria-selected', 'false');
          cur2 = i;
          panels2[i].style.display = 'block';
          panels2[i].classList.add('active');
          btn.classList.add('active');
          btn.setAttribute('aria-selected', 'true');
        });
      });

      var navEl2 = section2.querySelector('.tabs-nav');
      if (navEl2) {
        navEl2.addEventListener('keydown', function(e) {
          var total = btns2.length;
          if (e.key === 'ArrowRight') {
            e.preventDefault();
            var next = (cur2 + 1) % total;
            btns2[next].click(); btns2[next].focus();
          }
          if (e.key === 'ArrowLeft') {
            e.preventDefault();
            var prev = (cur2 - 1 + total) % total;
            btns2[prev].click(); btns2[prev].focus();
          }
        });
      }
    } catch(e2) { /* silent */ }
  }
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
