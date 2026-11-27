/* JJ Keys — app: screens & lesson engine */
'use strict';
const kb = new Keyboard();
let P = Object.assign({ done: {}, xp: 0, best: {} }, store.get('progress', {}));
const saveP = () => store.set('progress', P);

/* ---------- screens ---------- */
const stack = [];
function show(id, push = true) {
  const cur = document.querySelector('.screen.active');
  if (cur && cur.id === 'scr-' + id) return;
  Player.stop();
  if (cur) { cur.classList.remove('active'); if (push) stack.push(cur.id.slice(4)); if (leaveHooks[cur.id.slice(4)]) leaveHooks[cur.id.slice(4)](); }
  $('#scr-' + id).classList.add('active');
  if (enterHooks[id]) enterHooks[id]();
}
function back() {
  if ($('#modal').classList.contains('show')) { closeModal(); return true; }
  if (!stack.length) return false;
  show(stack.pop(), false); return true;
}
window.appBack = back;
document.addEventListener('click', e => {
  const b = e.target.closest('[data-back]'); if (b) back();
  const g = e.target.closest('[data-go]'); if (g) show(g.dataset.go);
});
document.addEventListener('pointerdown', () => AU.init(), { once: false, passive: true });
const enterHooks = {}, leaveHooks = {};

function toast(msg) { const t = $('#toast'); t.textContent = msg; t.classList.add('show'); clearTimeout(t._t); t._t = setTimeout(() => t.classList.remove('show'), 1600); }
function modal(html) { $('#mbox').innerHTML = html; $('#modal').classList.add('show'); }
function closeModal() { $('#modal').classList.remove('show'); }
$('#modal').addEventListener('click', e => { if (e.target.id === 'modal') closeModal(); });
const btn = (label, fn, cls = '') => { const b = document.createElement('button'); b.className = 'btn ' + cls; b.innerHTML = label; b.onclick = fn; return b; };

/* ---------- progress ---------- */
const LEVELS = [[0, 'Beginner'], [150, 'Novice'], [400, 'Learner'], [700, 'Intermediate'], [1000, 'Advanced'], [1250, 'Pro']];
const levelName = xp => LEVELS.filter(l => xp >= l[0]).pop()[1];
const isUnlocked = i => S.unlockAll || i === 0 || ALL_LESSONS[i - 1].id in P.done;
function nextLessonIdx() { const i = ALL_LESSONS.findIndex(l => !(l.id in P.done)); return i < 0 ? ALL_LESSONS.length - 1 : i; }
enterHooks.home = () => {
  const done = Object.keys(P.done).length, total = ALL_LESSONS.length, pct = Math.round(done / total * 100);
  $('#hPct').textContent = pct + '%'; $('#hRingFg').style.strokeDashoffset = 119.4 * (1 - pct / 100);
  $('#hLevel').textContent = levelName(P.xp); $('#hXp').textContent = `${P.xp} XP · ${done} of ${total} lessons done`;
  const i = nextLessonIdx(), l = ALL_LESSONS[i];
  $('#hNextT').textContent = l.title; $('#hNextS').textContent = `Stage ${STAGES.indexOf(l.stage) + 1}: ${l.stage.title}`;
  $('#hStart').textContent = done === total ? '↺ Review' : done ? '▶ Continue' : '▶ Start from zero';
};
$('#hStart').onclick = () => openLesson(nextLessonIdx());

enterHooks.stages = () => {
  const host = $('#stageList'); host.innerHTML = '';
  let gi = 0; const nx = nextLessonIdx();
  STAGES.forEach((s, si) => {
    const d = document.createElement('div'); d.className = 'stage';
    const doneN = s.lessons.filter(l => l.id in P.done).length;
    const firstIdx = gi; if (!isUnlocked(firstIdx)) d.classList.add('locked');
    d.innerHTML = `<div class="sh"><i>${s.icon}</i><div><b>Stage ${si + 1} · ${s.title}</b><small>${s.desc}</small></div><span class="cnt">${doneN}/${s.lessons.length}</span></div><div class="lessons"></div>`;
    const wrap = d.querySelector('.lessons');
    s.lessons.forEach(l => {
      const idx = gi++; const c = document.createElement('button');
      const st = P.done[l.id]; const un = isUnlocked(idx);
      c.className = 'lchip' + (st ? ' done' : '') + (idx === nx && !st ? ' next' : '') + (un ? '' : ' locked');
      c.innerHTML = `<span>${un ? '' : '🔒 '}${l.id} ${l.title}</span><span class="st">${st ? '★'.repeat(st) + '☆'.repeat(3 - st) : un ? 'start ›' : ''}</span>`;
      c.onclick = () => un ? openLesson(idx) : toast('Finish the lesson before this one first 🔒');
      wrap.appendChild(c);
    });
    host.appendChild(d);
  });
  const nxEl = host.querySelector('.lchip.next'); if (nxEl) setTimeout(() => nxEl.scrollIntoView({ block: 'center' }), 50);
};

/* ---------- lesson engine ---------- */
const L = { lesson: null, idx: 0, step: null, mistakes: 0, token: 0, practice: false };
const lText = $('#lText'), lStaff = $('#lStaff'), lCtl = $('#lCtl'), lFb = $('#lFb'), lNext = $('#lNext');
function setText(h) { lText.innerHTML = h; lText.scrollTop = 0; }
function fb(msg, cls = '') { lFb.textContent = msg; lFb.className = 'fb ' + cls; }
function ctl(btns) { lCtl.innerHTML = ''; btns.filter(Boolean).forEach(b => lCtl.appendChild(b)); }
function showStaff(opts, scrollX) {
  if (!opts) { lStaff.classList.remove('show', 'pic'); lStaff.innerHTML = ''; return null; }
  lStaff.classList.remove('pic'); lStaff.classList.add('show');
  const items = (opts.items || []).map(it => Object.assign({}, it));
  const r = renderStaff(Object.assign({}, opts, { items }));
  return putStaff(lStaff, r, scrollX);
}
function showPic(svg) { lStaff.classList.add('show', 'pic'); lStaff.innerHTML = svg; }
function ready(msg) { lNext.disabled = false; lNext.classList.add('pulse'); if (msg) fb(msg, 'good'); }
function mistake() { L.mistakes++; }
function markKeys(list, fingers, cls) { const m = {}; (list || []).forEach((k, i) => m[midi(k)] = fingers ? fingers[i] : ''); kb.mark(m, cls); kb.ensure(Object.keys(m).map(Number)); }

function openLesson(i, practiceLesson) {
  AU.init();
  L.lesson = practiceLesson || ALL_LESSONS[i]; L.gIdx = i; L.practice = !!practiceLesson; L.idx = 0; L.mistakes = 0;
  show('lesson');
  $('#lTitle').textContent = (L.practice ? '' : L.lesson.id + ' · ') + L.lesson.title;
  kb.glide = false;
  kb.mount($('#kbLesson'), ...(L.lesson.range || ['C4', 'B5']));
  runStep();
}
function runStep() {
  Player.stop();
  const s = L.lesson.steps[L.idx]; L.step = s; L.token++;
  const n = L.lesson.steps.length;
  $('#lSub').textContent = L.practice ? 'Practice' : `Step ${L.idx + 1} of ${n} · ${L.lesson.stage.title}`;
  $('#lProg').style.width = (L.idx / n * 100) + '%';
  lNext.disabled = true; lNext.classList.remove('pulse'); lNext.textContent = L.idx === n - 1 ? 'Finish ✓' : 'Next ›';
  fb(''); ctl([]); kb.mark({}); showStaff(null);
  if (s.range) kb.setRange(...s.range); else kb.setRange(...(L.lesson.range || ['C4', 'B5']));
  kb.onNote = (m, on) => { if (on && H[s.t].on) H[s.t].on(m); if (!on && H[s.t].off) H[s.t].off(m); };
  H[s.t].start(s);
}
lNext.onclick = () => {
  Player.stop();
  if (L.idx < L.lesson.steps.length - 1) { L.idx++; runStep(); }
  else finishLesson();
};
$('#lLabels').onclick = () => { S.labels = !S.labels; saveS(); kb.labels(); $('#lLabels').classList.toggle('on', S.labels); toast(S.labels ? 'Note names ON' : 'Note names OFF'); };
leaveHooks.lesson = () => { kb.onNote = null; kb.release(); };

function finishLesson() {
  $('#lProg').style.width = '100%';
  const stars = L.mistakes <= 2 ? 3 : L.mistakes <= 7 ? 2 : 1;
  if (L.practice) {
    modal(`<h2>Practice complete! 🎯</h2><div class="stars">${'★'.repeat(stars)}${'☆'.repeat(3 - stars)}</div><p>Mistakes: ${L.mistakes}</p><div class="row"></div>`);
    const row = $('#mbox .row');
    row.appendChild(btn('↺ Again', () => { closeModal(); L.lesson.regen && L.lesson.regen(); openLesson(null, L.lesson); }, 'gold'));
    row.appendChild(btn('Practice menu', () => { closeModal(); back(); }));
    return;
  }
  const id = L.lesson.id, prev = P.done[id] || 0;
  const gained = Math.max(0, stars - prev) * 10 + (prev ? 0 : 10);
  P.done[id] = Math.max(prev, stars); P.xp += gained; saveP();
  const hasNext = L.gIdx < ALL_LESSONS.length - 1;
  const msgs = ['Nice work!', 'Great job!', 'Excellent!', 'Amazing!'];
  modal(`<h2>${stars === 3 ? msgs[3] : msgs[stars]} 🎉</h2><div class="stars">${'<span class="gold">★</span>'.repeat(stars)}${'☆'.repeat(3 - stars)}</div><p>${L.lesson.title} complete${gained ? ` · +${gained} XP` : ''}<br>${L.mistakes ? L.mistakes + ' mistake' + (L.mistakes > 1 ? 's' : '') + ' — replay to earn more stars.' : 'Perfect — no mistakes!'}</p><div class="row"></div>`);
  const row = $('#mbox .row');
  row.appendChild(btn('↺ Replay', () => { closeModal(); openLesson(L.gIdx); }));
  row.appendChild(btn('Lessons', () => { closeModal(); show('stages', false); stack.length = 0; stack.push('home'); }));
  if (hasNext) row.appendChild(btn('Next lesson ›', () => { closeModal(); openLesson(L.gIdx + 1); }, 'gold'));
}

/* ---------- step handlers ---------- */
const H = {};
H.info = {
  start(s) {
    setText(s.html);
    if (s.pic) showPic(s.pic); else if (s.staff) showStaff(s.staff);
    if (s.keys) markKeys(s.keys, s.fingers);
    ctl([s.demo && btn('▶ Listen', () => demo(s.demo, s.demoBpm || 100, s.staff ? null : s.demo))]);
    ready();
  }
};
function demo(events, bpm, staffItems) {
  if (Player.playing) { Player.stop(); return; }
  const ev = events.map(e => ({ n: e.n.map(midi), d: e.d, f: e.f }));
  const tok = L.token;
  const clef = staffItems ? autoClef(staffItems.flatMap(e => e.n).length ? staffItems.flatMap(e => e.n) : ['C4']) : null;
  Player.play(ev, bpm, i => {
    if (tok !== L.token) return;
    const m = {}; ev[i].n.forEach((x, j) => m[x] = ev[i].f ? ev[i].f[j] || '' : ''); kb.mark(m, 'dim'); kb.ensure(ev[i].n);
    if (staffItems) { const svg = showStaff({ clef, items: staffItems, cur: i }); }
  }, () => { if (tok === L.token) { const s = L.step; if (s && s.keys) markKeys(s.keys, s.fingers); else if (H[s.t].mark) H[s.t].mark(); else kb.mark({}); } });
}

H.tap = {
  start(s) {
    this.s = s; this.done = false;
    let t = typeof s.targets === 'function' ? s.targets() : s.targets.map(midi);
    this.list = t; this.left = [...t];
    setText(s.html + `<p class="mini" id="tapLeft"></p>`);
    if (s.staff) showStaff(s.staff);
    this.mark(); this.upd();
  },
  mark() {
    const s = this.s, m = {};
    if (s.hint !== false) (s.order ? this.left.slice(0, 1) : this.left).forEach(x => m[x] = '');
    else if (s.keys) s.keys.forEach(k => m[midi(k)] = '');
    kb.mark(m, s.hint !== false ? 'hint' : 'dim');
    if (s.hint !== false) kb.ensure(Object.keys(m).map(Number));
  },
  upd() { const e = $('#tapLeft'); if (e) e.textContent = this.left.length ? `${this.list.length - this.left.length} of ${this.list.length} found` : ''; },
  on(m) {
    if (this.done) return;
    const s = this.s;
    const match = x => s.pc ? pcOf(x) === pcOf(m) : x === m;
    let ok;
    if (s.order) ok = match(this.left[0]); else ok = this.left.some(match);
    if (ok) {
      kb.flash(m, 'good');
      const i = s.order ? 0 : this.left.findIndex(match); this.left.splice(i, 1);
      if (!this.left.length) { this.done = true; ready('✓ Well done!'); kb.mark({}); }
      else { fb('✓ ' + nameOf(m), 'good'); this.mark(); }
    } else {
      const already = this.list.includes(m) && !this.left.includes(m);
      kb.flash(m, 'bad');
      if (!already) { mistake(); fb(`That's ${nameBoth(m)} — try again`, 'bad'); } else fb('Already found — find the others!', '');
    }
    this.upd();
  }
};

H.song = {
  start(s) {
    this.s = s; this.ev = song(s.notes).map(e => Object.assign(e, { m: e.n.map(midi) }));
    this.clef = s.clef || autoClef(this.ev.flatMap(e => e.n));
    this.hint = s.hint !== false;
    setText(s.html + `<p class="mini">${this.hint ? 'Press the <b class="gold">glowing</b> key — the number is the finger to use.' : 'Read the <b class="gold">highlighted</b> note on the staff and play it.'} The song waits for you.</p><p class="mini" id="songPos"></p>`);
    ctl([btn('▶ Listen', () => this.listen()), btn('↺ Restart', () => this.reset()), !this.hint && btn('💡 Hint', () => { if (this.done) return; this.peek = true; mistake(); this.mark(); })]);
    this.reset();
  },
  reset() { Player.stop(); this.i = 0; this.done = false; this.peek = false; this.pressed = new Set(); this.ev.forEach(e => { e.cls = ''; e.wrong = false; }); this.skip(); this.draw(); fb(''); },
  skip() { while (this.i < this.ev.length && !this.ev[this.i].n.length) { this.ev[this.i].cls = 'ok'; this.i++; } },
  draw() {
    const svg = showStaff({ clef: this.clef, items: this.ev, ts: this.s.ts || [4, 4], pickup: this.s.pickup, cur: this.done ? -1 : this.i, fingers: false, final: true, names: S.labels && this.hint });
    const r = svg._r; const x = r.xs[Math.min(this.i, r.xs.length - 1)].cx;
    const k = svg._k; lStaff.scrollTo({ left: Math.max(0, (x + 6) * k - lStaff.clientWidth * .35), behavior: 'smooth' });
    const p = $('#songPos'); if (p) p.textContent = this.done ? '' : `Note ${this.i + 1} of ${this.ev.length}`;
    this.mark();
  },
  mark() {
    const e = this.ev[this.i];
    if (!e || this.done) { kb.mark({}); return; }
    const m = {}; if (this.hint || this.peek) e.m.forEach((x, j) => m[x] = e.f[j] || '');
    kb.mark(m); kb.ensure(e.m);
  },
  on(m) {
    if (this.done || Player.playing) return;
    const e = this.ev[this.i]; if (!e) return;
    if (e.m.includes(m)) {
      this.pressed.add(m); kb.flash(m, 'good');
      if (e.m.every(x => this.pressed.has(x) || kb.held.has(x))) {
        e.cls = e.wrong ? 'bad' : 'ok'; this.i++; this.pressed.clear(); this.peek = false; this.skip();
        if (this.i >= this.ev.length) { this.done = true; this.draw(); ready('🎉 You played the whole song!'); }
        else this.draw();
        fb(this.done ? '🎉 You played the whole song!' : '', this.done ? 'good' : '');
      }
    } else {
      kb.flash(m, 'bad'); mistake(); e.wrong = true;
      fb(`That's ${nameBoth(m)}. Look for ${e.n.map(strName).join(' + ')}${e.f[0] ? ' (finger ' + e.f.join('+') + ')' : ''}`, 'bad');
    }
  },
  listen() {
    if (Player.playing) { Player.stop(); return; }
    const tok = L.token;
    Player.play(this.ev.map(e => ({ n: e.m, d: e.d })), this.s.bpm || 100, i => {
      if (tok !== L.token) return;
      const svg = showStaff({ clef: this.clef, items: this.ev.map(e => Object.assign({}, e, { cls: '' })), ts: this.s.ts || [4, 4], pickup: this.s.pickup, cur: i, final: true });
      const x = svg._r.xs[i].cx; lStaff.scrollLeft = Math.max(0, (x + 6) * svg._k - lStaff.clientWidth * .35);
      const m = {}; this.ev[i].m.forEach((x, j) => m[x] = this.ev[i].f[j] || ''); kb.mark(m, 'dim'); kb.ensure(this.ev[i].m);
    }, () => { if (tok === L.token) this.draw(); });
  }
};

H.quiz = {
  start(s) { this.s = s; this.n = 0; this.ok = 0; this.prev = null; this.done = false; ctl([]); this.next(); },
  next() {
    const s = this.s;
    if (this.n >= s.count) { this.done = true; kb.mark({}); setText(`<h3>Done! ✓</h3><p class="bigname">${this.ok}/${s.count}</p><p>${this.ok === s.count ? 'Perfect score! 🌟' : this.ok >= s.count * .7 ? 'Great reading!' : 'Good effort — replay to get faster.'}</p>`); if (s.mode !== 'name') showStaff(null); ready(); return; }
    let q, tries = 0; do { q = pick(s.pool); } while ((q === this.prev) && tries++ < 10); this.prev = q;
    this.q = q; this.m = midi(q); this.wrong = false; this.n++;
    kb.mark({});
    if (s.mode === 'name') {
      setText(`<h3>${s.title || 'Find the key'}</h3><div class="bigname">${strName(q)}</div><p>Press any <b>${strName(q)}</b> on the keyboard.</p><p class="mini">Question ${this.n} of ${s.count} · Score ${this.ok}</p>`);
      showStaff(null);
    } else {
      setText(`<h3>${s.title || 'Read the note'}</h3><p>Which key is this note? Press it on the keyboard.</p><p class="mini">Question ${this.n} of ${s.count} · Score ${this.ok}</p>`);
      showStaff({ clef: s.clef || autoClef([q]), items: [{ n: [q], d: 4 }], minW: 150 });
    }
  },
  on(m) {
    if (this.done || this.busy) return;
    const exact = this.s.mode !== 'name' && this.s.exact !== false;
    const ok = exact ? m === this.m : pcOf(m) === pcOf(this.m);
    if (ok) {
      kb.flash(m, 'good'); if (!this.wrong) this.ok++;
      fb(`✓ ${nameBoth(this.m)}`, 'good');
      this.busy = true; const tok = L.token; setTimeout(() => { this.busy = false; if (tok === L.token) this.next(); }, 450);
    } else {
      kb.flash(m, 'bad'); mistake(); this.wrong = true;
      const sameName = pcOf(m) === pcOf(this.m);
      fb(sameName ? `Right name, wrong octave — the glowing ${strName(this.q)} is the one` : `That's ${nameBoth(m)}. This note is ${strName(this.q)} — press the glowing key`, 'bad');
      kb.mark({ [this.m]: '' }); kb.ensure([this.m]);
      if (this.s.mode !== 'name') showStaff({ clef: this.s.clef || autoClef([this.q]), items: [{ n: [this.q], d: 4 }], names: true, minW: 150 });
    }
  }
};

H.choice = {
  start(s) { this.s = s; this.i = 0; if (s.pic) showPic(s.pic); this.show(); },
  show() {
    const it = this.s.items[this.i];
    if (!it) { setText('<h3>All answered! ✓</h3>'); ready(); return; }
    setText(`<h3>${it.q}</h3><p class="mini">Question ${this.i + 1} of ${this.s.items.length}</p><div class="opts"></div><p class="mini" id="why"></p>`);
    if (it.staff) showStaff(Object.assign({ minW: 150 }, it.staff)); else if (this.s.pic) showPic(this.s.pic); else showStaff(null);
    const box = lText.querySelector('.opts'); this.locked = false;
    it.opts.forEach((o, j) => {
      const b = document.createElement('button'); b.className = 'opt'; b.textContent = o;
      b.onclick = () => {
        if (this.locked) return;
        if (j === it.a) { b.classList.add('good'); this.locked = true; fb('✓ Correct!', 'good'); const tok = L.token; setTimeout(() => { if (tok === L.token) { this.i++; fb(''); this.show(); } }, 750); }
        else { b.classList.add('bad'); mistake(); fb('Not quite — try again', 'bad'); if (it.why) $('#why').textContent = '💡 ' + it.why; }
      };
      box.appendChild(b);
    });
  }
};

H.chord = {
  start(s) { this.s = s; this.i = 0; this.done = false; this.times = {}; this.hint = s.hint !== false; ctl([btn('▶ Hear it', () => this.hear()), !this.hint && btn('💡 Hint', () => { this.peek = true; mistake(); this.mark(); })]); this.show(); },
  cur() { return this.s.items[this.i]; },
  show() {
    const it = this.cur(); this.peek = false; this.times = {};
    if (!it) { this.done = true; kb.mark({}); setText(this.s.html + '<p class="bigname">✓</p><p>All chords played!</p>'); ready('✓ Great chords!'); return; }
    setText(`${this.s.html}<div class="chordname" style="font-size:44px">${it.name}</div><p class="mini">Chord ${this.i + 1} of ${this.s.items.length} — press all ${it.n.length} keys together${it.f ? ' (fingers ' + it.f.join('-') + ')' : ''}.</p>`);
    showStaff({ clef: autoClef(it.n), items: [{ n: it.n, d: 4 }], names: S.labels && this.hint, minW: 150 });
    this.mark();
  },
  mark() { const it = this.cur(); if (!it) return; if (this.hint || this.peek) markKeys(it.n, it.f); else { kb.mark({}); kb.ensure(it.n.map(midi)); } },
  hear() { const it = this.cur(); if (!it) return; const ms = it.n.map(midi); ms.forEach(m => AU.on(m, .8)); setTimeout(() => ms.forEach(m => AU.off(m)), 1400); },
  on(m) {
    if (this.done) return; const it = this.cur(); if (!it) return;
    const ms = it.n.map(midi), now = Date.now();
    if (!ms.includes(m)) { kb.flash(m, 'bad'); mistake(); fb(`${nameBoth(m)} is not in ${it.name}`, 'bad'); return; }
    this.times[m] = now;
    if (ms.every(x => kb.held.has(x) || (this.times[x] && now - this.times[x] < 1200))) {
      ms.forEach(x => kb.flash(x, 'good')); fb(`✓ ${it.name}!`, 'good'); this.i++;
      const tok = L.token; this.done = true; setTimeout(() => { if (tok === L.token) { this.done = false; this.show(); } }, 800);
    }
  }
};

H.improv = {
  start(s) { this.s = s; this.c = 0; this.done = false; setText(s.html + '<p class="bigname" id="impC">0</p>'); kb.setRange(s.lo, s.hi); markKeys(notesOf(s.lo, s.hi, pc => s.pcs.includes(pc)).map(x => x)); kb.ensure([midi(s.lo)]); },
  on(m) {
    if (this.done) return;
    if (this.s.pcs.includes(pcOf(m))) { this.c++; $('#impC').textContent = this.c + ' / ' + this.s.count; if (this.c >= this.s.count) { this.done = true; ready('🎨 Beautiful! You improvised!'); } }
    else { kb.flash(m, 'bad'); fb('Stay on the glowing keys (C D E G A)', 'bad'); }
  }
};

H.rhythm = {
  start(s) {
    this.s = s; this.done = false; this.running = false; this.ts = s.ts || [4, 4];
    this.items = s.pattern.map(d => d < 0 ? { n: [], d: -d } : { n: ['B4'], d });
    setText(s.html + `<p class="mini">Count-in: ${this.ts[0]} clicks, then tap on every note. Tempo ${s.bpm} BPM.</p><p class="mini" id="rhRes"></p>`);
    this.draw(-1);
    ctl([btn('▶ Listen', () => this.listen()), btn('● Start', () => this.go(), 'gold')]);
    kb.mark({});
  },
  draw(cur) { showStaff({ clef: 'treble', items: this.items, ts: this.ts, cur, final: true, minW: 200 }); },
  times() { let t = 0; const out = []; this.items.forEach(it => { if (it.n.length) out.push(t); t += it.d; }); return { onsets: out, total: t }; },
  listen() {
    if (this.running) return; const beat = 60000 / this.s.bpm; const tok = L.token;
    Player.stop(); Player.playing = true; let t = 100;
    this.items.forEach((it, i) => {
      Player.timers.push(setTimeout(() => { if (tok !== L.token) return; this.draw(i); if (it.n.length) { AU.on(72, .7); setTimeout(() => AU.off(72), Math.min(250, it.d * beat * .8)); } }, t));
      t += it.d * beat;
    });
    // steady beat clicks
    const { total } = this.times(); for (let b = 0; b < total; b++) Player.timers.push(setTimeout(() => AU.click(b % this.ts[0] === 0), 100 + b * beat));
    Player.timers.push(setTimeout(() => { Player.playing = false; if (tok === L.token) this.draw(-1); }, t + 100));
  },
  go() {
    if (this.running) return; Player.stop(); AU.init();
    const beat = 60000 / this.s.bpm, { onsets, total } = this.times(), count = this.ts[0], tok = L.token;
    this.running = true; this.taps = []; this.items.forEach(it => it.cls = ''); this.draw(-1);
    fb('Get ready… listen to the count-in', '');
    const t0 = performance.now() + 150;
    for (let b = 0; b < count; b++) setTimeout(() => { if (tok === L.token) { AU.click(b === 0); fb(`${b + 1}…`, ''); } }, 150 + b * beat);
    const start = t0 + count * beat; this.start = start; this.beat = beat;
    for (let b = 0; b < total; b++) setTimeout(() => { if (tok === L.token) { AU.click(b % count === 0); if (b === 0) fb('Tap now! 👏', 'good'); } }, 150 + (count + b) * beat);
    setTimeout(() => { if (tok === L.token) this.judge(onsets); }, 150 + (count + total + .6) * beat);
    // show a big tap pad over the keyboard
    const pad = document.createElement('button'); pad.className = 'tap'; pad.textContent = 'TAP';
    pad.style.cssText = 'position:absolute;inset:6px;z-index:9;width:auto;height:auto';
    pad.addEventListener('pointerdown', e => { e.preventDefault(); this.tap(); pad.classList.add('hit'); setTimeout(() => pad.classList.remove('hit'), 90); });
    $('#kbLesson').appendChild(pad); this.pad = pad;
  },
  tap() { if (!this.running) return; AU.on(72, .6); setTimeout(() => AU.off(72), 120); this.taps.push(performance.now() - this.start); },
  on() { this.tap(); },
  judge(onsets) {
    this.running = false; if (this.pad) { this.pad.remove(); this.pad = null; }
    const tol = Math.max(110, this.beat * .22), used = new Set(); let hits = 0;
    const res = onsets.map(o => { const tt = o * this.beat; let bi = -1, bd = 1e9; this.taps.forEach((t, i) => { if (!used.has(i) && Math.abs(t - tt) < bd) { bd = Math.abs(t - tt); bi = i; } }); if (bi >= 0 && bd <= tol) { used.add(bi); hits++; return true; } return false; });
    const extra = this.taps.length - used.size;
    let k = 0; this.items.forEach(it => { if (it.n.length) it.cls = res[k++] ? 'ok' : 'bad'; });
    this.draw(-1);
    const pct = Math.round(hits / onsets.length * 100);
    const pass = pct >= 75 && extra <= 2;
    $('#rhRes').innerHTML = `<b class="${pass ? 'gold' : ''}">${hits}/${onsets.length} on time</b>${extra ? ` · ${extra} extra tap${extra > 1 ? 's' : ''}` : ''}`;
    if (pass) { this.done = true; ready(pct === 100 && !extra ? '🥁 Perfect timing!' : '✓ Good rhythm!'); }
    else { mistake(); fb('Almost! Listen again and try once more (green = on time).', 'bad'); }
  }
};

H.compose = {
  start(s) {
    this.s = s; this.done = false;
    setText(s.html + '<p class="mini" id="cmpMsg"></p>');
    lStaff.classList.add('show'); lStaff.classList.remove('pic');
    lCtl.innerHTML = '';
    const tools = document.createElement('div'); tools.className = 'ctools'; tools.style.padding = '0'; lCtl.appendChild(tools);
    lCtl.style.maxWidth = '72%';
    this.c = new Composer(lStaff, tools, { compact: true, clef: s.goal === 'chords' || s.goal === 'chord' ? 'treble' : (s.clef || 'treble'), ts: [4, 4], bpm: 90 });
    if (s.d) this.c.setDur(s.d);
    const chk = btn('Check ✓', () => this.check(), 'gold'); lCtl.appendChild(chk);
  },
  on(m) { this.c.key(m, kb.held.size); },
  check() {
    const s = this.s, it = this.c.items, msg = $('#cmpMsg'); let ok = false, why = '';
    const pcsOf = x => [...new Set(x.n.map(n => pcOf(midi(n))))].sort((a, b) => a - b);
    const sameSet = (a, b) => { const B = [...new Set(b)].sort((x, y) => x - y); return a.length === B.length && a.every((v, i) => v === B[i]); };
    if (s.goal === 'seq') {
      const got = it.filter(x => x.n.length).map(x => midi(x.n[0]));
      ok = got.length === s.want.length && got.every((m, i) => m === midi(s.want[i])) && it.every(x => !s.d || x.d === s.d);
      why = ok ? '' : got.length !== s.want.length ? `You wrote ${got.length} notes — need ${s.want.length}.` : !it.every(x => !s.d || x.d === s.d) ? 'Use quarter notes for all of them.' : 'Some notes are different — check the letters and octave.';
    } else if (s.goal === 'beats') {
      const b = this.c.totalBeats(); ok = Math.abs(b - s.beats) < 1e-6 && it.length >= (s.minItems || 1);
      why = ok ? '' : b < s.beats ? `You have ${b} beats — need exactly ${s.beats}. Add more!` : b > s.beats ? `You have ${b} beats — that's too many. Remove or shorten a note.` : 'Use at least 2 notes.';
    } else if (s.goal === 'chord') {
      ok = it.length === 1 && sameSet(pcsOf(it[0]), s.pcs) && it[0].d === 4;
      why = ok ? '' : it.length !== 1 ? 'Write just one chord (press C, E and G at the same time).' : it[0].d !== 4 ? 'Make it a whole note (choose the whole note first).' : 'The chord needs C, E and G.';
    } else if (s.goal === 'chords') {
      ok = it.length === s.want.length && it.every((x, i) => sameSet(pcsOf(x), s.want[i]) && x.d === 4);
      why = ok ? '' : it.length !== s.want.length ? `Write ${s.want.length} whole-note chords (you have ${it.length}).` : 'Check each chord: C(C E G) F(F A C) G(G B D) C — whole notes.';
    } else if (s.goal === 'final') {
      const b = this.c.totalBeats(); const last = [...it].reverse().find(x => x.n.length);
      ok = Math.abs(b - s.beats) < 1e-6 && last && last.n.some(n => pcOf(midi(n)) === 0) && it.length >= 6;
      why = ok ? '' : Math.abs(b - s.beats) > 1e-6 ? `You have ${b} beats — need exactly ${s.beats} (4 measures).` : it.length < 6 ? 'Use at least 6 notes.' : 'End on a C so it sounds finished.';
      if (ok) { const songs = store.get('songs', []); songs.unshift({ title: 'My First Composition', clef: 'treble', ts: [4, 4], bpm: 90, items: it, t: Date.now() }); store.set('songs', songs); }
    }
    if (ok) { this.done = true; msg.textContent = s.goal === 'final' ? 'Saved to Note Studio as “My First Composition”.' : ''; ready('✓ Perfect! You wrote it!'); this.c.togglePlay(); }
    else { mistake(); fb(why, 'bad'); }
  }
};
leaveHooks.lesson = () => { kb.onNote = null; kb.release(); lCtl.style.maxWidth = ''; const p = document.querySelector('.tap'); if (p) p.remove(); };
const _run = runStep;

/* ---------- free play ---------- */
let metroT = null;
enterHooks.free = () => {
  kb.glide = true; kb.mount($('#kbFree'), 'C3', 'C6'); kb.mark({});
  kb.scrollTo(kb.kw * 7);
  $('#fLabels').classList.toggle('on', S.labels);
  const upd = () => {
    const ms = [...kb.held].sort((a, b) => a - b);
    $('#fNote').textContent = ms.length ? ms.map(m => nameOf(m)).join(' ') : '—';
    $('#fChord').textContent = chordName(ms) || '—';
    const items = ms.length ? [{ n: ms.map(m => midiToStr(m, S.flats)), d: 4 }] : [];
    putStaff($('#fStaff'), renderStaff({ clef: 'grand', items, names: S.labels, minW: 160 }));
  };
  kb.onNote = () => upd(); upd();
};
leaveHooks.free = () => { kb.onNote = null; kb.release(); kb.glide = false; stopMetro(); };
$('#fOctDn').onclick = () => kb.shift(-1); $('#fOctUp').onclick = () => kb.shift(1);
$('#fLabels').onclick = () => { S.labels = !S.labels; saveS(); kb.labels(); $('#fLabels').classList.toggle('on', S.labels); };
function stopMetro() { clearInterval(metroT); metroT = null; $('#fMetro').classList.remove('on'); }
$('#fMetro').onclick = () => { if (metroT) return stopMetro(); let b = 0; const bpm = Math.max(30, Math.min(220, +$('#fBpm').value || 80)); AU.click(true); metroT = setInterval(() => AU.click(++b % 4 === 0), 60000 / bpm); $('#fMetro').classList.add('on'); };
$('#fBpm').onchange = () => { if (metroT) { stopMetro(); $('#fMetro').click(); } };

/* ---------- studio ---------- */
let studio = null, studioId = null;
enterHooks.studio = () => {
  kb.glide = false; kb.mount($('#kbStudio'), 'C3', 'C6'); kb.scrollTo(kb.kw * 7); kb.mark({});
  if (!studio) newSong();
  else studio.render();
  kb.onNote = (m, on) => { if (on && !Player.playing) studio.key(m, kb.held.size); };
};
leaveHooks.studio = () => { kb.onNote = null; kb.release(); };
function newSong(data) {
  data = data || { title: 'My Song', clef: 'treble', ts: [4, 4], bpm: 90, items: [] };
  studioId = data.t || null;
  $('#sTitle').value = data.title; $('#sClef').value = data.clef; $('#sTs').value = data.ts.join('/'); $('#sBpm').value = data.bpm;
  studio = new Composer($('#sStaff'), $('#sTools'), { clef: data.clef, ts: data.ts, bpm: data.bpm, items: data.items, onPlayNote: ms => { const m = {}; ms.forEach(x => m[x] = ''); kb.mark(m, 'dim'); kb.ensure(ms); } });
}
$('#sClef').onchange = e => { studio.clef = e.target.value; studio.render(); };
$('#sTs').onchange = e => { studio.ts = e.target.value.split('/').map(Number); studio.render(); };
$('#sBpm').onchange = e => { studio.bpm = Math.max(30, Math.min(220, +e.target.value || 90)); };
$('#sNew').onclick = () => { if (!studio.items.length || confirm('Start a new song? Unsaved changes will be lost.')) newSong(); };
$('#sSave').onclick = () => {
  const songs = store.get('songs', []);
  const d = { title: $('#sTitle').value.trim() || 'Untitled', clef: studio.clef, ts: studio.ts, bpm: studio.bpm, items: studio.items, t: studioId || Date.now() };
  const i = songs.findIndex(s => s.t === d.t); if (i >= 0) songs[i] = d; else songs.unshift(d);
  studioId = d.t; store.set('songs', songs); toast('Saved “' + d.title + '” ✓');
};
$('#sOpen').onclick = () => {
  const songs = store.get('songs', []);
  modal(`<h2>My songs</h2><div class="list">${songs.length ? songs.map((s, i) => `<div class="li"><b>${s.title.replace(/</g, '&lt;')}</b><small>${s.items.length} notes</small><button class="btn" data-open="${i}">Open</button><button class="btn" data-del="${i}">🗑</button></div>`).join('') : '<p>No saved songs yet. Write something and tap Save!</p>'}</div><div class="row"><button class="btn" onclick="closeModal()">Close</button></div>`);
  $('#mbox').onclick = e => {
    const o = e.target.dataset.open, d = e.target.dataset.del;
    if (o != null) { newSong(songs[+o]); closeModal(); }
    if (d != null && confirm('Delete “' + songs[+d].title + '”?')) { songs.splice(+d, 1); store.set('songs', songs); closeModal(); $('#sOpen').click(); }
  };
};

/* ---------- practice ---------- */
const DRILLS = [
  { icon: '🎼', title: 'Treble Reading', sub: 'Read notes C4–A5', make: () => ({ title: 'Treble Reading', range: ['C4', 'C6'], steps: [{ t: 'quiz', mode: 'read', clef: 'treble', pool: whiteRange('C4', 'A5'), count: 15 }] }) },
  { icon: '🎼', title: 'Bass Reading', sub: 'Read notes E2–C4', make: () => ({ title: 'Bass Reading', range: ['C2', 'C4'], steps: [{ t: 'quiz', mode: 'read', clef: 'bass', pool: whiteRange('E2', 'C4'), count: 15 }] }) },
  { icon: '🎹', title: 'Grand Staff', sub: 'Both clefs mixed', make: () => ({ title: 'Grand Staff Reading', range: ['C3', 'C5'], steps: [{ t: 'quiz', mode: 'read', clef: 'grand', pool: whiteRange('C3', 'C5'), count: 15 }] }) },
  { icon: '♯', title: 'Sharps & Flats', sub: 'Read accidentals', make: () => ({ title: 'Sharps & Flats', range: ['C4', 'C6'], steps: [{ t: 'quiz', mode: 'read', clef: 'treble', pool: ['C#4', 'Db4', 'D#4', 'Eb4', 'F#4', 'Gb4', 'G#4', 'Ab4', 'A#4', 'Bb4', 'C#5', 'Eb5', 'F#5', 'Bb5'], count: 12 }] }) },
  { icon: '🔤', title: 'Key Finder', sub: 'Name → key, fast', make: () => ({ title: 'Key Finder', range: ['C4', 'B5'], steps: [{ t: 'quiz', mode: 'name', pool: notesOf('C4', 'B4', () => true).map(s => s.replace('#', '#')), count: 20 }] }) },
  { icon: '🎶', title: 'Chord Builder', sub: 'Major & minor triads, no hints', make: () => {
    const roots = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'Bb4', 'Eb4'];
    const items = Array.from({ length: 8 }, () => { const r = pick(roots), m = midi(r), minor = Math.random() < .5; const flat = r.includes('b'); const n = [m, m + (minor ? 3 : 4), m + 7].map(x => midiToStr(x, flat || [3, 5, 10].includes(pcOf(m)))); return { name: strName(r) + (minor ? 'm' : ''), n, f: [1, 3, 5] }; });
    return { title: 'Chord Builder', range: ['C4', 'C6'], steps: [{ t: 'chord', html: '<h3>Build the chord</h3>', items, hint: false }] };
  } },
  { icon: '🥁', title: 'Rhythm Tapping', sub: 'Random 2-bar rhythms', make: () => {
    const cells = [[1, 1], [2], [.5, .5, 1], [1, -1], [1.5, .5], [.5, .5, .5, .5]];
    const mk = () => { let p = []; while (p.reduce((a, b) => a + Math.abs(b), 0) < 8) { const c = pick(cells); if (p.reduce((a, b) => a + Math.abs(b), 0) + c.reduce((a, b) => a + Math.abs(b), 0) <= 8) p = p.concat(c); } return p; };
    return { title: 'Rhythm Tapping', range: ['C4', 'C5'], steps: [1, 2, 3].map(i => ({ t: 'rhythm', html: `<h3>Rhythm ${i} of 3</h3>`, pattern: mk(), bpm: 80 })) };
  } },
  { icon: '🪜', title: 'Scales', sub: 'C, G, F major & A minor', make: () => ({ title: 'Scales', range: ['C3', 'C6'], steps: [
    { t: 'song', html: '<h3>C major (RH)</h3>', notes: SONGS.cScale, bpm: 110 }, { t: 'song', html: '<h3>G major (RH)</h3>', notes: SONGS.gScale, bpm: 110 },
    { t: 'song', html: '<h3>F major (RH)</h3>', notes: SONGS.fScale, bpm: 110 }, { t: 'song', html: '<h3>A minor (RH)</h3>', notes: SONGS.aMinor, bpm: 110 }, { t: 'song', html: '<h3>C major (LH)</h3>', notes: SONGS.cScaleLH, bpm: 110 }] }) }
];
enterHooks.practice = () => {
  const host = $('#drillList'); host.innerHTML = '';
  DRILLS.forEach(d => {
    const b = document.createElement('button'); b.className = 'tile';
    b.innerHTML = `<i>${d.icon}</i><b>${d.title}</b><small>${d.sub}</small>`;
    b.onclick = () => { const l = d.make(); l.stage = { title: 'Practice' }; l.regen = () => Object.assign(l, d.make()); openLesson(null, l); };
    host.appendChild(b);
  });
};

/* ---------- settings ---------- */
enterHooks.settings = () => {
  const host = $('#setList');
  const rows = [
    ['labels', 'Note names on keys', 'Show C D E… on the keyboard (turn off when you are ready)'],
    ['solfege', 'Use Do–Re–Mi', 'Show solfège names (Do Re Mi Fa Sol La Ti) instead of letters'],
    ['flats', 'Write black keys as flats', 'In Note Studio & Free Play, write D♭ instead of C♯'],
    ['unlockAll', 'Unlock all lessons', 'Skip ahead if you already know some basics']
  ];
  host.innerHTML = rows.map(r => `<div class="srow"><div><b>${r[1]}</b><small>${r[2]}</small></div><button class="tg ${S[r[0]] ? 'on' : ''}" data-k="${r[0]}"></button></div>`).join('') +
    `<div class="srow"><div><b>Sound</b><small>Instrument voice</small></div><select class="sel" id="setSound"><option value="piano">Piano</option><option value="epiano">Electric piano</option><option value="organ">Organ</option></select></div>
     <div class="srow"><div><b>Volume</b></div><input type="range" id="setVol" min="0" max="1" step=".05" value="${S.vol}"></div>
     <div class="srow"><div><b>Reset progress</b><small>Clears stars and XP (your saved songs stay)</small></div><button class="btn" id="setReset">Reset</button></div>
     <p class="mini" style="text-align:center;color:var(--mute);margin-top:14px">JJ Keys v1.0 · Developed by John Joseph Torio</p>`;
  host.querySelectorAll('.tg').forEach(t => t.onclick = () => { const k = t.dataset.k; S[k] = !S[k]; saveS(); t.classList.toggle('on', S[k]); kb.labels(); });
  $('#setSound').value = S.sound; $('#setSound').onchange = e => { S.sound = e.target.value; saveS(); AU.on(60); setTimeout(() => AU.off(60), 500); };
  $('#setVol').oninput = e => { S.vol = +e.target.value; saveS(); AU.setVol(S.vol); };
  $('#setReset').onclick = () => { if (confirm('Reset all lesson progress?')) { P = { done: {}, xp: 0, best: {} }; saveP(); toast('Progress reset'); } };
};

/* ---------- boot ---------- */
$('#lLabels').classList.toggle('on', S.labels);
enterHooks.home();
