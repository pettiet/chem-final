/* ================================================================
 * AppKit — shared state, dashboard rendering, progress / streaks / badges.
 * Single global namespace so every page can call AppKit.x(...).
 * ================================================================ */
(function () {
  const STORAGE_KEY = 'chemFinal.progress';

  const MODULES = [
    { id: 'bonding',         title: 'Bonding & Polarity',     desc: 'Ionic vs covalent, polarity & EN',           emoji: '🔗' },
    { id: 'lewis-geometry',  title: 'Lewis & Geometry',       desc: 'Dot structures, VSEPR shapes',               emoji: '📐' },
    { id: 'imf',             title: 'IMFs',                   desc: 'Dispersion, dipole, H-bonding',              emoji: '🧲' },
    { id: 'nomenclature',    title: 'Nomenclature',           desc: 'Naming ionic & covalent compounds',          emoji: '🏷️' },
    { id: 'solutions',       title: 'Solutions',              desc: 'Molarity, dilution, Beer’s law',        emoji: '💧' },
    { id: 'reactions',       title: 'Reactions',              desc: 'Balancing, types, predicting products',      emoji: '⚗️' },
    { id: 'stoichiometry',   title: 'Stoichiometry',          desc: 'Mole math, limiting reactant, % yield',      emoji: '⚖️' },
    { id: 'thermochem',      title: 'Thermochem',             desc: 'q=mcΔT, exo/endo, heating curves',           emoji: '🔥' },
    { id: 'nuclear',         title: 'Nuclear',                desc: 'Decay types, half-life, equations',          emoji: '☢️' },
  ];

  const BADGES = {
    'first-lab':         { icon: '🧪', name: 'First Lab',        desc: 'Completed your first quiz' },
    'sharp-shooter':     { icon: '🎯', name: 'Sharp Shooter',    desc: 'Perfect score on a quiz' },
    'hot-streak':        { icon: '🔥', name: 'Hot Streak',       desc: '3-day streak' },
    'atom-smasher':      { icon: '⚛️', name: 'Atom Smasher',     desc: 'Tried all 9 modules' },
    'final-boss':        { icon: '🏆', name: 'Final Boss',       desc: '90%+ on the cumulative exam' },
  };
  // Per-module mastery badges generated dynamically.

  /* -------------------- Storage helpers -------------------- */
  function defaultState() {
    return {
      bestScores: {},
      examHistory: [],
      badges: [],
      streak: { count: 0, lastActiveDate: null },
      totalQuizzes: 0,
      attemptedModules: {}, // moduleId -> true
    };
  }

  function load() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return defaultState();
      const parsed = JSON.parse(raw);
      return Object.assign(defaultState(), parsed);
    } catch (e) {
      return defaultState();
    }
  }

  function save(state) {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
    catch (e) { /* quota / private mode — silently ignore */ }
  }

  /* -------------------- Date / streak -------------------- */
  function todayStr() {
    const d = new Date();
    const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2,'0'); const day = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }
  function yesterdayStr() {
    const d = new Date(); d.setDate(d.getDate() - 1);
    const y = d.getFullYear(); const m = String(d.getMonth() + 1).padStart(2,'0'); const day = String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${day}`;
  }

  function touchStreak(state) {
    const today = todayStr();
    if (state.streak.lastActiveDate === today) return; // already counted
    if (state.streak.lastActiveDate === yesterdayStr()) {
      state.streak.count += 1;
    } else {
      state.streak.count = 1;
    }
    state.streak.lastActiveDate = today;
  }

  /* -------------------- Badges -------------------- */
  function awardBadge(state, id) {
    if (!state.badges.includes(id)) {
      state.badges.push(id);
      return true;
    }
    return false;
  }

  function evaluateBadges(state) {
    const newly = [];
    if (state.totalQuizzes >= 1 && awardBadge(state, 'first-lab')) newly.push('first-lab');
    // module mastery
    MODULES.forEach(m => {
      if ((state.bestScores[m.id] || 0) >= 90) {
        const bid = `mastery-${m.id}`;
        if (!BADGES[bid]) BADGES[bid] = { icon: '🔬', name: `${m.title} Mastery`, desc: '90%+ on this module' };
        if (awardBadge(state, bid)) newly.push(bid);
      }
    });
    if (state.streak.count >= 3 && awardBadge(state, 'hot-streak')) newly.push('hot-streak');
    const attemptedCount = Object.keys(state.attemptedModules).length;
    if (attemptedCount >= MODULES.length && awardBadge(state, 'atom-smasher')) newly.push('atom-smasher');
    if (state.examHistory.some(h => h.score >= 90) && awardBadge(state, 'final-boss')) newly.push('final-boss');
    return newly;
  }

  /* -------------------- Public: quiz result reporting -------------------- */
  function reportQuizResult(moduleId, scorePct, opts) {
    opts = opts || {};
    const state = load();
    state.totalQuizzes += 1;
    state.attemptedModules[moduleId] = true;
    const prevBest = state.bestScores[moduleId] || 0;
    const newBest = scorePct > prevBest;
    if (newBest) state.bestScores[moduleId] = scorePct;
    touchStreak(state);
    const sharpShot = (scorePct === 100) && awardBadge(state, 'sharp-shooter');
    const newlyAwarded = evaluateBadges(state);
    if (sharpShot) newlyAwarded.push('sharp-shooter');
    save(state);
    return {
      prevBest, newBest, scorePct,
      crossedMastery: prevBest < 90 && scorePct >= 90,
      newBadges: newlyAwarded,
    };
  }

  function reportExamResult(scorePct, perModule) {
    const state = load();
    state.examHistory.unshift({ date: todayStr(), score: scorePct, perModule: perModule || {} });
    state.examHistory = state.examHistory.slice(0, 5);
    state.totalQuizzes += 1;
    touchStreak(state);
    const newlyAwarded = evaluateBadges(state);
    save(state);
    return { newBadges: newlyAwarded };
  }

  function resetProgress() {
    localStorage.removeItem(STORAGE_KEY);
  }

  /* -------------------- Ring renderer -------------------- */
  function setRing(svgEl, pct) {
    const arc = svgEl.querySelector('.arc');
    if (!arc) return;
    const r = parseFloat(arc.getAttribute('r'));
    const C = 2 * Math.PI * r;
    arc.setAttribute('stroke-dasharray', C.toFixed(3));
    const clamped = Math.max(0, Math.min(100, pct));
    const offset = C * (1 - clamped / 100);
    // small delay so transition animates from initial 0
    requestAnimationFrame(() => arc.setAttribute('stroke-dashoffset', offset.toFixed(3)));
    if (clamped >= 90) arc.classList.add('success'); else arc.classList.remove('success');
    const txt = svgEl.querySelector('text');
    if (txt) txt.textContent = `${Math.round(clamped)}%`;
  }

  /* -------------------- Dashboard renderer -------------------- */
  function initDashboard() {
    const state = load();

    // Streak pill
    const sp = document.getElementById('streak-pill');
    if (sp) sp.textContent = `🔥 ${state.streak.count} day streak`;

    // Readiness — average of best scores across all modules (0 if none yet)
    const scores = MODULES.map(m => state.bestScores[m.id] || 0);
    const avg = Math.round(scores.reduce((a,b)=>a+b, 0) / MODULES.length);
    const ring = document.getElementById('readiness-ring');
    if (ring) setRing(ring, avg);
    const rv = document.getElementById('readiness-value');
    if (rv) rv.textContent = `${avg}%`;
    const rh = document.getElementById('readiness-hint');
    if (rh) rh.textContent = avg === 0 ? 'Take a quiz to start tracking' : 'Average of your best scores';

    // Module grid
    const grid = document.getElementById('module-grid');
    if (grid) {
      grid.innerHTML = '';
      MODULES.forEach((m, idx) => {
        const best = state.bestScores[m.id] || 0;
        const mastered = best >= 90;
        const a = document.createElement('a');
        a.className = 'module-card';
        a.href = `modules/${m.id}.html`;
        a.style.animationDelay = `${idx * 40}ms`;
        a.innerHTML = `
          ${mastered ? `<span class="badge" title="Mastered">🔬</span>` : ``}
          <div class="mc-ring">
            <svg class="ring" width="56" height="56" viewBox="0 0 56 56" aria-hidden="true">
              <circle class="track" cx="28" cy="28" r="24" fill="none" stroke-width="6"/>
              <circle class="arc" cx="28" cy="28" r="24" fill="none" stroke-width="6"
                      transform="rotate(-90 28 28)" stroke-dasharray="150.796" stroke-dashoffset="150.796"/>
              <text x="28" y="29" font-size="13">${best}%</text>
            </svg>
          </div>
          <div class="mc-body">
            <p class="mc-title">${m.emoji} ${m.title}</p>
            <p class="mc-desc">${m.desc}</p>
            <span class="pill">Lesson + Quiz →</span>
          </div>`;
        grid.appendChild(a);
        // animate the mini-ring
        const svg = a.querySelector('.ring');
        if (svg) setRing(svg, best);
      });
    }

    // Badges row
    const bRow = document.getElementById('badges');
    if (bRow) {
      const earned = state.badges.slice();
      if (earned.length === 0) {
        // keep placeholder
      } else {
        bRow.innerHTML = '';
        earned.forEach(id => {
          const b = BADGES[id];
          if (!b) return;
          const span = document.createElement('span');
          span.title = `${b.name} — ${b.desc}`;
          span.textContent = b.icon;
          span.style.fontSize = '28px';
          bRow.appendChild(span);
        });
      }
    }

    // Reset button with confirm + long-press shortcut
    const reset = document.getElementById('reset-btn');
    if (reset) {
      let pressTimer = null;
      const doReset = () => {
        if (confirm('Reset all progress? This cannot be undone.')) {
          resetProgress();
          location.reload();
        }
      };
      reset.addEventListener('click', doReset);
      reset.addEventListener('touchstart', () => {
        pressTimer = setTimeout(() => {
          resetProgress();
          location.reload();
        }, 1200);
      }, { passive: true });
      ['touchend','touchcancel','touchmove'].forEach(evt =>
        reset.addEventListener(evt, () => { if (pressTimer) { clearTimeout(pressTimer); pressTimer = null; } }, { passive: true })
      );
    }
  }

  /* -------------------- Confetti loader -------------------- */
  let confettiPromise = null;
  function loadConfetti() {
    if (window.confetti) return Promise.resolve(window.confetti);
    if (confettiPromise) return confettiPromise;
    confettiPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/canvas-confetti@1.9.3/dist/confetti.browser.min.js';
      s.async = true;
      s.onload = () => resolve(window.confetti);
      s.onerror = reject;
      document.head.appendChild(s);
    });
    return confettiPromise;
  }

  function celebrate() {
    loadConfetti().then(c => {
      if (!c) return;
      const burst = (x) => c({
        particleCount: 80, spread: 70, startVelocity: 45, origin: { x, y: 0.6 },
        colors: ['#38bdf8', '#22c55e', '#f59e0b', '#a78bfa']
      });
      burst(0.25); setTimeout(() => burst(0.75), 200); setTimeout(() => burst(0.5), 400);
    }).catch(()=>{});
  }

  /* -------------------- Module page header helper -------------------- */
  function getModule(id) { return MODULES.find(m => m.id === id); }

  /* -------------------- Export -------------------- */
  window.AppKit = {
    MODULES, BADGES,
    load, save, resetProgress,
    initDashboard,
    reportQuizResult, reportExamResult,
    setRing, celebrate, getModule,
    todayStr,
  };
})();
