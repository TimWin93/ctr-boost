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

function calculate() {
  const imp = parseNum(document.getElementById('calcImpressions').value);
  const ctr = parseNum(document.getElementById('calcCTR').value);
  const activeBtn = document.querySelector('.calc-opt.active');
  const mult = parseFloat(activeBtn.dataset.mult);
  
  const newCTR = ctr * mult;
  const oldClicks = imp * (ctr / 100);
  const newClicks = imp * (newCTR / 100);
  const diff = newClicks - oldClicks;
  
  // Update option details
  document.getElementById('opt30').textContent = formatCTR(ctr) + ' → ' + formatCTR(ctr * 1.3);
  document.getElementById('opt60').textContent = formatCTR(ctr) + ' → ' + formatCTR(ctr * 1.6);
  document.getElementById('optX2').textContent = formatCTR(ctr) + ' → ' + formatCTR(ctr * 2);
  
  // Update result
  document.getElementById('calcClicks').textContent = '+ ' + formatNum(diff);
  document.getElementById('calcNewCTR').textContent = formatCTR(newCTR);
  document.getElementById('calcOldCTR').textContent = formatCTR(ctr);
  
  // Update bars (max 15% as reference)
  const maxCTR = Math.max(newCTR, 15);
  document.getElementById('barOld').style.width = (ctr / maxCTR * 100) + '%';
  document.getElementById('barNew').style.width = (newCTR / maxCTR * 100) + '%';
  document.getElementById('barLabelOld').textContent = formatCTR(ctr);
  document.getElementById('barLabelNew').textContent = formatCTR(newCTR);
}

// Auto-format impressions with spaces
document.getElementById('calcImpressions').addEventListener('input', function() {
  let raw = this.value.replace(/\s/g, '').replace(/\D/g, '');
  this.value = raw ? parseInt(raw).toLocaleString('ru-RU') : '';
  calculate();
});

document.getElementById('calcCTR').addEventListener('input', calculate);

// Initial calc
calculate();
