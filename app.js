(() => {
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const $ = (s, r = document) => r.querySelector(s);
  const wait = ms => new Promise(r => setTimeout(r, reduce ? 0 : ms));
  const fmt = n => Math.round(n).toLocaleString('en-GB');
  const running = {};

  // Animate a number from a to b; calls fn(value) each frame.
  function tween(a, b, ms, fn) {
    if (reduce) { fn(b); return Promise.resolve(); }
    return new Promise(done => {
      const t0 = performance.now();
      const step = t => {
        const k = Math.max(0, Math.min(1, (t - t0) / ms));
        fn(a + (b - a) * k);
        k < 1 ? requestAnimationFrame(step) : done();
      };
      requestAnimationFrame(step);
    });
  }
  const say = (el, html) => { const p = document.createElement('p'); p.innerHTML = html; el.appendChild(p); };

  const scenes = {
    async arrive() {
      const s = $('#stage-arrive');
      s.classList.remove('go'); void s.offsetWidth; s.classList.add('go');
    },

    async session() {
      const s = $('#stage-session');
      const A = $('.sess.old', s), B = $('.sess.new', s), t = $('.t', s);
      const ta = $('.turns', A), tb = $('.turns', B);
      ta.innerHTML = tb.innerHTML = ''; t.textContent = '0';
      A.className = 'sess old live'; B.className = 'sess new';
      const turn = (box, txt) => { const d = document.createElement('span'); d.className = 'turn'; d.textContent = txt; box.appendChild(d); };
      turn(ta, 'turn 1'); await wait(700);
      turn(ta, 'turn 2'); await wait(700);
      turn(ta, 'turn 3'); await wait(600);
      await tween(0, 46, 2200, v => t.textContent = Math.floor(v));
      turn(tb, 'new message');
      A.className = 'sess old retired'; $('.label', A).textContent = 'session A · not resumed after more than 45 min idle';
      await wait(900);
      B.className = 'sess new live';
      turn(tb, 'up to 30 recent messages'); t.textContent = '0';
    },

    async fill() {
      const s = $('#stage-fill'), g = $('.gauge', s), w = $('.seg.work', s), n = $('.n', s), v = $('.verdict', s);
      g.classList.remove('lost'); v.innerHTML = ''; w.style.transition = 'none';
      const width = tokens => Math.max(0, tokens / 1e6 * 100 - 6);
      await tween(60000, 966713, 4500, x => { n.textContent = fmt(x); w.style.width = width(x) + '%'; });
      say(v, 'Chaos: no window known, so no limit. It waits.');
      await wait(1200);
      say(v, '<strong>Claude Code compacts on its own, silently.</strong>');
      w.style.transition = ''; g.classList.add('lost'); w.style.width = '1%';
      n.textContent = 'a short summary';
      await wait(900);
      say(v, 'The identity went with the rest of the history. No one was told.');
    },

    async after() {
      const s = $('#stage-after'), g = $('.gauge', s), w = $('.seg.work', s), n = $('.n', s), v = $('.verdict', s);
      const id = $('.seg.identity', s);
      g.classList.remove('lost'); v.innerHTML = ''; w.style.transition = 'none'; id.textContent = 'soul · narrative · wake';
      const width = tokens => Math.max(0, tokens / 1e6 * 100 - 6);
      const show = x => { n.textContent = fmt(x); w.style.width = width(x) + '%'; };
      say(v, 'First reply from the model: <strong>window = 1,000,000</strong>. Chaos keeps it.');
      await tween(60000, 360000, 2500, show);
      say(v, '<span class="warnflash">Warning: compaction is coming.</span> The resident writes down what it is in the middle of.');
      await tween(360000, 400000, 900, show);
      say(v, 'Limit reached. The resident asks to finish one step first.');
      await tween(400000, 455000, 1200, show);
      say(v, 'Step done before the 500k ceiling. <strong>Compaction.</strong>');
      w.style.transition = ''; g.classList.add('lost'); w.style.width = '1%'; n.textContent = 'a summary';
      await wait(1200);
      g.classList.remove('lost');       say(v, 'Soul and self-narrative come back <strong>word for word</strong> from the session-start snapshot, as they will after every compaction.');
    },

    async cross() {
      const s = $('#stage-cross'), right = $('.side.right', s);
      right.querySelectorAll('.paper').forEach(p => p.remove());
      s.classList.remove('go'); void s.offsetWidth; s.classList.add('go');
      await wait(1100);
      $('.side.left', s).querySelectorAll('.paper').forEach((p, i) => {
        const c = p.cloneNode(true); c.style.animation = 'pop .6s ease ' + (i * 0.4) + 's both'; right.appendChild(c);
      });
    },

    async container() {
      const s = $('#stage-container'), b = $('.boxes', s), st = $('.status', s);
      b.innerHTML = ''; st.textContent = '';
      const names = Array.from({ length: 18 }, (_, i) => i === 13 ? 'busy one' : 'resident ' + (i + 1));
      const boxes = names.map(nm => { const d = document.createElement('div'); d.className = 'box'; d.textContent = nm; b.appendChild(d); return d; });
      boxes[13].classList.add('busy');
      for (let i = 0; i < boxes.length; i++) {
        if (i === 13) continue;
        boxes[i].classList.add('now'); st.textContent = 'Rebuilding ' + names[i] + ' (idle)';
        await wait(260);
        boxes[i].classList.remove('now'); boxes[i].classList.add('done');
      }
      boxes[13].textContent = 'busy · old image';
      st.textContent = 'Still busy after the wait, so skipped: 17 of 18 rebuilt, the busy one stays on the old image until a later rebuild.';
    }
  };

  document.querySelectorAll('.play').forEach(btn => {
    btn.addEventListener('click', async () => {
      const k = btn.dataset.scene;
      if (running[k]) return;
      running[k] = true; btn.disabled = true;
      try { await scenes[k](); } finally { running[k] = false; btn.disabled = false; }
    });
  });

  // Play each scene once when it first scrolls into view.
  const seen = new Set();
  const io = new IntersectionObserver(es => es.forEach(e => {
    if (!e.isIntersecting || seen.has(e.target.id)) return;
    seen.add(e.target.id);
    const btn = e.target.querySelector('.play'); if (btn) btn.click();
  }), { threshold: 0.5 });
  document.querySelectorAll('.chapter').forEach(c => io.observe(c));
})();
