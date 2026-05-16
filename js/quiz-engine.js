/* ================================================================
 * QUIZ ENGINE
 * - Renders lesson swipe decks for module pages
 * - Renders quizzes (MC / numeric / text)
 * - Handles results + saving best score + confetti on first 90%+
 * - Renders simple interactive widgets used inside lesson cards
 * ================================================================ */
(function () {

  /* ---------- Lesson deck ---------- */
  function renderLesson(moduleId, containerEl, onStartQuiz) {
    const cards = (window.LESSONS || {})[moduleId] || [];
    if (cards.length === 0) {
      containerEl.innerHTML = '<p>Lesson coming soon.</p>';
      return;
    }
    containerEl.innerHTML = `
      <div class="deck" id="deck">
        <div class="deck-track" id="deck-track"></div>
      </div>
      <div class="deck-nav">
        <button class="deck-arrow" id="prev-card" aria-label="Previous">‹</button>
        <div class="dots" id="dots"></div>
        <button class="deck-arrow" id="next-card" aria-label="Next">›</button>
      </div>
      <div class="cta-wrap" id="start-quiz-wrap" style="display:none">
        <button class="btn" id="start-quiz-btn">Start Practice Quiz →</button>
      </div>
    `;

    const track = containerEl.querySelector('#deck-track');
    const dots = containerEl.querySelector('#dots');

    cards.forEach((c, i) => {
      const div = document.createElement('div');
      div.className = 'lesson-card';
      div.innerHTML = `
        <div class="step">Card ${i+1} of ${cards.length}</div>
        <h2>${c.title}</h2>
        <p>${(c.body || '').replace(/\n/g, '<br>')}</p>
        ${c.example ? `<div class="example"><span class="ex-label">Example</span>${c.example.replace(/\n/g, '<br>')}</div>` : ''}
        <div class="widget" data-widget="${c.widget || ''}"></div>
      `;
      track.appendChild(div);
      const dot = document.createElement('span');
      dot.className = 'dot';
      dots.appendChild(dot);
    });

    // Mount widgets
    track.querySelectorAll('.widget[data-widget]').forEach(w => {
      const id = w.getAttribute('data-widget');
      if (id) mountWidget(id, w);
    });

    let idx = 0;
    const dotEls = dots.children;
    const totalW = () => containerEl.querySelector('#deck').clientWidth;
    function go(i) {
      idx = Math.max(0, Math.min(cards.length - 1, i));
      const offset = -idx * totalW();
      track.style.transform = `translateX(${offset}px)`;
      for (let k = 0; k < dotEls.length; k++) dotEls[k].classList.toggle('active', k === idx);
      containerEl.querySelector('#prev-card').disabled = idx === 0;
      containerEl.querySelector('#next-card').disabled = idx === cards.length - 1;
      containerEl.querySelector('#start-quiz-wrap').style.display = idx === cards.length - 1 ? '' : 'none';
    }
    containerEl.querySelector('#prev-card').addEventListener('click', () => go(idx - 1));
    containerEl.querySelector('#next-card').addEventListener('click', () => go(idx + 1));
    containerEl.querySelector('#start-quiz-btn').addEventListener('click', () => {
      onStartQuiz && onStartQuiz();
    });

    // Swipe gestures
    let startX = 0; let dx = 0; let swiping = false;
    track.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX; swiping = true; track.style.transition = 'none';
    }, { passive: true });
    track.addEventListener('touchmove', (e) => {
      if (!swiping) return;
      dx = e.touches[0].clientX - startX;
      const offset = -idx * totalW() + dx;
      track.style.transform = `translateX(${offset}px)`;
    }, { passive: true });
    track.addEventListener('touchend', () => {
      swiping = false; track.style.transition = '';
      if (Math.abs(dx) > totalW() * 0.18) {
        if (dx < 0) go(idx + 1); else go(idx - 1);
      } else {
        go(idx);
      }
      dx = 0;
    });

    window.addEventListener('resize', () => go(idx));
    go(0);
  }

  /* ---------- Interactive widgets used inside lesson cards ---------- */
  function mountWidget(id, el) {
    if (id === 'en-bond-tool') return mountEnBondTool(el);
    if (id === 'solubility-curve') return mountSolubilityCurve(el);
    if (id === 'halflife-slider') return mountHalflifeSlider(el);
    if (id === 'heating-curve') return mountHeatingCurve(el);
  }

  function mountEnBondTool(el) {
    const EN = window.EN_TABLE || {};
    const elements = ['H','C','N','O','F','Na','Mg','Al','Si','P','S','Cl','K','Ca','Br','I'];
    el.innerHTML = `
      <div class="widget-card">
        <h4>EN difference → bond type</h4>
        <div>
          <select id="el-a"></select>
          <select id="el-b"></select>
        </div>
        <div class="out" id="en-out">Pick two elements.</div>
      </div>
    `;
    const a = el.querySelector('#el-a'); const b = el.querySelector('#el-b');
    elements.forEach(e => {
      a.insertAdjacentHTML('beforeend', `<option value="${e}">${e} (${EN[e]?.toFixed(2) ?? '?'})</option>`);
      b.insertAdjacentHTML('beforeend', `<option value="${e}">${e} (${EN[e]?.toFixed(2) ?? '?'})</option>`);
    });
    a.value = 'Na'; b.value = 'Cl';
    function update() {
      const va = a.value, vb = b.value;
      const diff = Math.abs((EN[va] || 0) - (EN[vb] || 0));
      let kind = 'nonpolar covalent';
      if (diff >= 1.7) kind = 'ionic';
      else if (diff >= 0.4) kind = 'polar covalent';
      const note = (va === 'H' && vb === 'F') || (va === 'F' && vb === 'H') ? ' (but HF is the classic exception — actually polar covalent!)' : '';
      el.querySelector('#en-out').textContent = `ΔEN = ${diff.toFixed(2)} → ${kind}${note}`;
    }
    a.addEventListener('change', update); b.addEventListener('change', update);
    update();
  }

  function mountSolubilityCurve(el) {
    // Approximate solubility values (g / 100g water) at given temps
    const data = {
      'KNO₃':  { 0: 13, 20: 32, 40: 64, 60: 110, 80: 169, 100: 245 },
      'NaNO₃': { 0: 73, 20: 88, 40: 105, 60: 124, 80: 148, 100: 180 },
      'NH₄Cl': { 0: 29, 20: 37, 40: 46, 60: 55, 80: 66, 100: 77 },
      'KCl':   { 0: 28, 20: 34, 40: 40, 60: 46, 80: 51, 100: 56 },
      'NaCl':  { 0: 36, 20: 36, 40: 37, 60: 38, 80: 39, 100: 40 },
      'KClO₃': { 0: 3,  20: 7,  40: 14, 60: 24, 80: 38, 100: 57 },
    };
    el.innerHTML = `
      <div class="widget-card">
        <h4>Solubility curve</h4>
        <label style="font-size:13px; color: var(--text-dim)">Temperature:
          <input type="range" id="sol-temp" min="0" max="100" step="10" value="40">
          <span id="sol-tempval">40 °C</span>
        </label>
        <div class="out" id="sol-out"></div>
      </div>
    `;
    const range = el.querySelector('#sol-temp');
    function update() {
      const t = +range.value;
      el.querySelector('#sol-tempval').textContent = `${t} °C`;
      const rows = Object.entries(data).map(([k, vals]) => `<div>${k}: <strong>${vals[t]} g</strong> per 100 g H₂O</div>`).join('');
      el.querySelector('#sol-out').innerHTML = rows;
    }
    range.addEventListener('input', update);
    update();
  }

  function mountHalflifeSlider(el) {
    el.innerHTML = `
      <div class="widget-card">
        <h4>Half-life decay</h4>
        <label style="font-size:13px; color: var(--text-dim)">Half-lives passed:
          <input type="range" id="hl-n" min="0" max="6" step="1" value="2">
          <span id="hl-nval">2</span>
        </label>
        <div class="out" id="hl-out"></div>
        <div class="atoms-row" id="hl-atoms"></div>
      </div>
    `;
    const range = el.querySelector('#hl-n');
    function update() {
      const n = +range.value;
      el.querySelector('#hl-nval').textContent = n;
      const remaining = Math.round(100 * Math.pow(0.5, n) * 10) / 10;
      el.querySelector('#hl-out').textContent = `Starting from 100 g → ${remaining} g remains (1/2^${n}).`;
      const count = Math.max(1, Math.round(remaining / 5));
      el.querySelector('#hl-atoms').textContent = '⚛️'.repeat(count);
    }
    range.addEventListener('input', update);
    update();
  }

  function mountHeatingCurve(el) {
    el.innerHTML = `
      <div class="widget-card">
        <h4>Heating curve</h4>
        <button class="btn secondary" id="hc-play" style="width:auto; padding: 8px 14px; min-height: 36px">▶ Play</button>
        <div class="out" id="hc-out">Tap play to walk through solid → liquid → gas.</div>
        <div class="atoms-row" id="hc-atoms">🧊🧊🧊🧊</div>
      </div>
    `;
    const stages = [
      { label: 'Solid (heating)',           t:'−10 → 0 °C',  atoms: '🧊🧊🧊🧊' },
      { label: 'Melting (FLAT at 0 °C)',     t:'0 °C plateau', atoms: '🧊💧🧊💧' },
      { label: 'Liquid (heating)',          t:'0 → 100 °C',   atoms: '💧💧💧💧' },
      { label: 'Boiling (FLAT at 100 °C)',   t:'100 °C plateau', atoms: '💧♨️💧♨️' },
      { label: 'Gas (heating)',             t:'100+ °C',      atoms: '♨️♨️♨️♨️' },
    ];
    let i = 0; let timer = null;
    function step() {
      const s = stages[i];
      el.querySelector('#hc-out').textContent = `${s.label} — ${s.t}`;
      el.querySelector('#hc-atoms').textContent = s.atoms;
      i = (i + 1) % stages.length;
    }
    el.querySelector('#hc-play').addEventListener('click', () => {
      if (timer) { clearInterval(timer); timer = null; el.querySelector('#hc-play').textContent = '▶ Play'; return; }
      step();
      timer = setInterval(step, 1400);
      el.querySelector('#hc-play').textContent = '⏸ Pause';
    });
  }

  /* ---------- Quiz runner ---------- */
  function pickQuestions(moduleId, count) {
    const bank = (window.QUESTIONS || {})[moduleId] || [];
    if (bank.length === 0) return [];
    const out = [];
    // Sample without replacement until we exceed count or exhaust bank, then start replacing.
    const order = [];
    for (let i = 0; i < bank.length; i++) order.push(i);
    // Fisher-Yates
    for (let i = order.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [order[i], order[j]] = [order[j], order[i]];
    }
    for (let i = 0; i < count; i++) {
      const idx = order[i % order.length];
      out.push(bank[idx]()); // call generator
    }
    return out;
  }

  /* options: { onComplete: (result) => void }
   * Returns nothing; manages its own UI inside containerEl. */
  function startQuiz(moduleId, count, containerEl, options) {
    options = options || {};
    const questions = pickQuestions(moduleId, count);
    let i = 0; let correct = 0;
    const started = Date.now();

    const wrap = document.createElement('div');
    wrap.className = 'quiz';
    containerEl.innerHTML = '';
    containerEl.appendChild(wrap);

    function render() {
      if (i >= questions.length) return finish();
      const q = questions[i];
      const pct = Math.round((i / questions.length) * 100);
      wrap.innerHTML = `
        <div class="quiz-header">
          <span>Question ${i+1} / ${questions.length}</span>
          <span id="score-so-far">${correct} correct</span>
        </div>
        <div class="quiz-progress"><span style="width:${pct}%"></span></div>
        <div class="question-card" id="qcard">
          <p class="question-prompt">${q.prompt}</p>
          <div id="answer-area"></div>
          <div id="feedback-area"></div>
        </div>
        <div class="action-bar">
          <button class="btn secondary" id="skip-btn">Skip</button>
          <button class="btn" id="submit-btn" disabled>Submit</button>
        </div>
      `;
      const ans = wrap.querySelector('#answer-area');
      const submit = wrap.querySelector('#submit-btn');
      const skip = wrap.querySelector('#skip-btn');

      let userValue = null;

      if (q.type === 'mc') {
        q.options.forEach((opt, idx) => {
          const b = document.createElement('button');
          b.className = 'opt';
          b.type = 'button';
          b.textContent = opt;
          b.addEventListener('click', () => {
            ans.querySelectorAll('.opt').forEach(x => x.style.outline = '');
            b.style.outline = '2px solid var(--accent)';
            userValue = idx;
            submit.disabled = false;
          });
          ans.appendChild(b);
        });
      } else if (q.type === 'numeric') {
        const div = document.createElement('div');
        div.className = 'num-input';
        div.innerHTML = `<input type="number" inputmode="decimal" step="any" id="num-input" placeholder="Your answer">
                         ${q.units ? `<span class="units">${q.units}</span>` : ''}`;
        ans.appendChild(div);
        const inp = div.querySelector('input');
        inp.addEventListener('input', () => {
          userValue = inp.value;
          submit.disabled = userValue === '' || isNaN(parseFloat(userValue));
        });
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !submit.disabled) submit.click(); });
        setTimeout(() => inp.focus(), 100);
      } else if (q.type === 'text') {
        const div = document.createElement('div');
        div.className = 'text-input';
        div.innerHTML = `<input type="text" id="text-input" placeholder="Your answer" autocapitalize="off" autocorrect="off" autocomplete="off">`;
        ans.appendChild(div);
        const inp = div.querySelector('input');
        inp.addEventListener('input', () => {
          userValue = inp.value;
          submit.disabled = !userValue.trim();
        });
        inp.addEventListener('keydown', (e) => { if (e.key === 'Enter' && !submit.disabled) submit.click(); });
        setTimeout(() => inp.focus(), 100);
      }

      submit.addEventListener('click', () => evaluate(q, userValue, ans, submit, skip));
      skip.addEventListener('click', () => evaluate(q, null, ans, submit, skip, true));
    }

    function evaluate(q, value, ansEl, submitBtn, skipBtn, isSkip) {
      let isCorrect = false;
      if (!isSkip) {
        if (q.type === 'mc') {
          isCorrect = (value === q.correctIndex);
          // highlight all
          ansEl.querySelectorAll('.opt').forEach((el, idx) => {
            el.style.outline = '';
            el.classList.add('disabled');
            if (idx === q.correctIndex) el.classList.add('correct');
            else if (idx === value) el.classList.add('wrong');
          });
        } else if (q.type === 'numeric') {
          const num = parseFloat(value);
          isCorrect = !isNaN(num) && Math.abs(num - q.answer) <= (q.tolerance || 0);
          const inp = ansEl.querySelector('input');
          if (inp) inp.disabled = true;
        } else if (q.type === 'text') {
          const norm = (value || '').toLowerCase().trim().replace(/\s+/g, ' ');
          isCorrect = (q.accept || []).some(a => norm === a.toLowerCase().trim());
          const inp = ansEl.querySelector('input');
          if (inp) inp.disabled = true;
        }
      }

      if (isCorrect) {
        correct++;
        const card = wrap.querySelector('#qcard');
        card.classList.add('flash');
      } else {
        const card = wrap.querySelector('#qcard');
        card.classList.add('shake');
      }

      // Feedback panel
      const fb = wrap.querySelector('#feedback-area');
      fb.className = 'feedback ' + (isCorrect ? 'correct' : 'wrong');
      let header;
      if (isSkip) header = '⏭️ Skipped';
      else if (isCorrect) header = '✅ Correct!';
      else header = '❌ Not quite';
      let detail = '';
      if (!isCorrect && !isSkip) {
        if (q.type === 'mc') detail = `<br><em>Correct answer:</em> ${q.options[q.correctIndex]}`;
        else if (q.type === 'numeric') detail = `<br><em>Correct answer:</em> ${q.answer}${q.units ? ' ' + q.units : ''}`;
        else if (q.type === 'text') detail = `<br><em>Correct answer:</em> ${(q.accept && q.accept[0]) ? q.accept[0].toUpperCase() : ''}`;
      }
      fb.innerHTML = `<strong>${header}</strong>${q.explanation || ''}${detail}`;

      submitBtn.textContent = i === questions.length - 1 ? 'See Results →' : 'Next →';
      submitBtn.disabled = false;
      skipBtn.disabled = true;

      // swap submit to "next"
      const newSubmit = submitBtn.cloneNode(true);
      submitBtn.parentNode.replaceChild(newSubmit, submitBtn);
      newSubmit.addEventListener('click', () => { i++; render(); });

      // update inline score
      const ssf = wrap.querySelector('#score-so-far');
      if (ssf) ssf.textContent = `${correct} correct`;
    }

    function finish() {
      const total = questions.length;
      const pct = Math.round((correct / total) * 100);
      const seconds = Math.round((Date.now() - started) / 1000);
      const result = window.AppKit.reportQuizResult(moduleId, pct);
      if (result.crossedMastery) {
        window.AppKit.celebrate();
      } else if (pct === 100) {
        window.AppKit.celebrate();
      }
      wrap.innerHTML = `
        <div class="score-hero">
          <div class="big">${pct}%</div>
          <div class="sub">${correct} of ${total} correct · ${seconds}s</div>
        </div>
        <div class="plan-card">
          <h3>${pct >= 90 ? '🔬 Mastered!' : pct >= 70 ? '🚀 Solid — keep going' : '📚 Worth another pass'}</h3>
          <p class="why">${pct >= 90
            ? 'You scored 90%+. The cumulative exam should feel comfortable here.'
            : pct >= 70
              ? 'Strong work. One more try and you’ll lock in mastery.'
              : 'Re-read the lesson cards and run the quiz again — the numbers will be different.'}</p>
        </div>
        <div class="action-bar">
          <a class="btn secondary" href="../index.html">Dashboard</a>
          <button class="btn" id="retake-btn">Retake →</button>
        </div>
      `;
      wrap.querySelector('#retake-btn').addEventListener('click', () => startQuiz(moduleId, count, containerEl, options));
      options.onComplete && options.onComplete({ pct, correct, total, seconds, result });
    }

    render();
  }

  /* ---------- Module page boot ---------- */
  function bootModulePage() {
    const moduleId = document.body.getAttribute('data-module');
    if (!moduleId) return;
    const mod = window.AppKit.getModule(moduleId);
    const titleEl = document.getElementById('module-title');
    if (titleEl && mod) titleEl.textContent = `${mod.emoji} ${mod.title}`;

    const lessonContainer = document.getElementById('lesson-container');
    const quizContainer   = document.getElementById('quiz-container');

    if (lessonContainer && quizContainer) {
      renderLesson(moduleId, lessonContainer, () => {
        lessonContainer.classList.add('hidden');
        quizContainer.classList.remove('hidden');
        startQuiz(moduleId, 8, quizContainer, {});
        quizContainer.scrollIntoView({ behavior: 'smooth', block: 'start' });
      });
    }
  }

  window.QuizEngine = { startQuiz, renderLesson, bootModulePage, pickQuestions };

  // Auto-boot if this is a module page
  if (document.body && document.body.getAttribute('data-module')) {
    document.addEventListener('DOMContentLoaded', bootModulePage);
    if (document.readyState !== 'loading') bootModulePage();
  }
})();
