/* JJ Keys — engine: notes, audio, keyboard, staff, composer */
'use strict';
const $ = s => document.querySelector(s);
const LET = 'CDEFGAB', PCL = [0, 2, 4, 5, 7, 9, 11];

/* ---------- storage ---------- */
const store = {
  get(k, d) { try { const v = localStorage.getItem('jjkeys.' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('jjkeys.' + k, JSON.stringify(v)); } catch (e) {} }
};
const S = Object.assign({ labels: true, solfege: false, sound: 'piano', vol: 0.8, unlockAll: false, flats: false }, store.get('settings', {}));
const saveS = () => store.set('settings', S);

/* ---------- notes ---------- */
function parseN(s) {
  const m = /^([A-G])(#|b|n)?(-?\d)$/.exec(s);
  if (!m) throw new Error('bad note ' + s);
  const L = LET.indexOf(m[1]), acc = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0, o = +m[3];
  return { L, acc, o, midi: (o + 1) * 12 + PCL[L] + acc, step: o * 7 + L, accS: m[2] || '' };
}
const midi = s => typeof s === 'number' ? s : parseN(s).midi;
const SH = ['C', 'C♯', 'D', 'D♯', 'E', 'F', 'F♯', 'G', 'G♯', 'A', 'A♯', 'B'];
const FL = ['C', 'D♭', 'D', 'E♭', 'E', 'F', 'G♭', 'G', 'A♭', 'A', 'B♭', 'B'];
const SOL = { C: 'Do', D: 'Re', E: 'Mi', F: 'Fa', G: 'Sol', A: 'La', B: 'Ti' };
const pcOf = m => ((m % 12) + 12) % 12;
const isBlack = m => [1, 3, 6, 8, 10].includes(pcOf(m));
function nameOf(m, flat) {
  let n = (flat ? FL : SH)[pcOf(m)];
  if (S.solfege) n = SOL[n[0]] + n.slice(1);
  return n;
}
function nameBoth(m) { return isBlack(m) ? nameOf(m) + ' / ' + nameOf(m, true) : nameOf(m); }
function strName(s) { const p = parseN(s); return nameOf(p.midi, p.acc < 0); }
function midiToStr(m, flat) {
  const n = (flat ? ['C', 'Db', 'D', 'Eb', 'E', 'F', 'Gb', 'G', 'Ab', 'A', 'Bb', 'B'] : ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'])[pcOf(m)];
  return n + (Math.floor(m / 12) - 1);
}
function allIn(lo, hi, pred) { const out = []; for (let m = midi(lo); m <= midi(hi); m++) if (pred(pcOf(m), m)) out.push(m); return out; }
const pick = a => a[Math.floor(Math.random() * a.length)];

/* ---------- chord naming ---------- */
const CH = [
  ['', [0, 4, 7]], ['m', [0, 3, 7]], ['dim', [0, 3, 6]], ['aug', [0, 4, 8]], ['sus2', [0, 2, 7]], ['sus4', [0, 5, 7]],
  ['7', [0, 4, 7, 10]], ['maj7', [0, 4, 7, 11]], ['m7', [0, 3, 7, 10]], ['dim7', [0, 3, 6, 9]], ['m7♭5', [0, 3, 6, 10]],
  ['6', [0, 4, 7, 9]], ['m6', [0, 3, 7, 9]], ['add9', [0, 2, 4, 7]], ['5 (power)', [0, 7]], ['7', [0, 4, 10]], ['maj7', [0, 4, 11]]
];
function chordName(ms) {
  if (ms.length < 2) return '';
  const sorted = [...ms].sort((a, b) => a - b), bass = pcOf(sorted[0]);
  const pcs = [...new Set(sorted.map(pcOf))];
  if (pcs.length < 2) return '';
  for (const root of [bass, ...pcs.filter(p => p !== bass)]) {
    const iv = pcs.map(p => (p - root + 12) % 12).sort((a, b) => a - b);
    for (const [suf, tpl] of CH) {
      if (tpl.length === iv.length && tpl.every((x, i) => x === iv[i])) {
        let n = nameOf(root, [1, 3, 8, 10].includes(root)) + (suf === '5 (power)' ? '5' : suf);
        if (root !== bass) n += ' / ' + nameOf(bass, [1, 3, 8, 10].includes(bass));
        return n;
      }
    }
  }
  if (pcs.length === 2) {
    const d = (pcs[1] - pcs[0] + 12) % 12;
    return ['', 'minor 2nd', 'major 2nd', 'minor 3rd', 'major 3rd', 'perfect 4th', 'tritone', 'perfect 5th', 'minor 6th', 'major 6th', 'minor 7th', 'major 7th'][Math.abs((pcOf(sorted[1]) - bass + 12) % 12)] || '';
  }
  return '';
}

/* ---------- audio ---------- */
const AU = {
  ctx: null, v: new Map(), waves: {},
  init() {
    if (this.ctx) { if (this.ctx.state !== 'running') this.ctx.resume(); return; }
    const C = window.AudioContext || window.webkitAudioContext;
    this.ctx = new C({ latencyHint: 'interactive' });
    this.comp = this.ctx.createDynamicsCompressor();
    this.comp.threshold.value = -16; this.comp.ratio.value = 4;
    this.master = this.ctx.createGain(); this.master.gain.value = S.vol;
    this.master.connect(this.comp); this.comp.connect(this.ctx.destination);
  },
  setVol(v) { if (this.master) this.master.gain.value = v; },
  wave(type) {
    if (this.waves[type]) return this.waves[type];
    const H = { piano: [0, 1, .5, .3, .16, .1, .05, .04, .02], organ: [0, 1, .9, .1, .6, 0, .35, 0, .3, 0, 0, 0, .2], epiano: [0, 1, .1, .04, .02, 0, 0, 0, 0, 0, 0, 0, 0, 0, .07] }[type] || [0, 1];
    this.waves[type] = this.ctx.createPeriodicWave(new Float32Array(H.length), new Float32Array(H));
    return this.waves[type];
  },
  on(m, vel = .9) {
    this.init();
    const c = this.ctx, t = c.currentTime;
    this.off(m);
    const f = 440 * Math.pow(2, (m - 69) / 12), type = S.sound;
    const o = c.createOscillator(); o.setPeriodicWave(this.wave(type)); o.frequency.value = f;
    const g = c.createGain(), lp = c.createBiquadFilter(); lp.type = 'lowpass';
    const peak = .3 * vel * (m < 52 ? 1.15 : 1);
    g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(peak, t + .006);
    if (type === 'organ') { g.gain.setTargetAtTime(peak * .75, t + .01, .08); lp.frequency.value = 5200; }
    else {
      const tau = type === 'epiano' ? 1.3 : Math.max(.3, 1.5 - (m - 48) * .022);
      g.gain.setTargetAtTime(0, t + .012, tau);
      lp.frequency.setValueAtTime(Math.min(9000, f * 9), t);
      lp.frequency.setTargetAtTime(Math.min(4500, f * 4), t + .01, .35);
    }
    o.connect(lp); lp.connect(g); g.connect(this.master); o.start(t);
    this.v.set(m, { o, g });
  },
  off(m) {
    const vo = this.v.get(m); if (!vo) return; this.v.delete(m);
    const t = this.ctx.currentTime;
    try { if (vo.g.gain.cancelAndHoldAtTime) vo.g.gain.cancelAndHoldAtTime(t); else { vo.g.gain.cancelScheduledValues(t); vo.g.gain.setValueAtTime(vo.g.gain.value, t); } } catch (e) {}
    vo.g.gain.setTargetAtTime(0, t, .07);
    vo.o.stop(t + .6);
  },
  allOff() { for (const m of [...this.v.keys()]) this.off(m); },
  click(accent) {
    this.init();
    const c = this.ctx, t = c.currentTime, o = c.createOscillator(), g = c.createGain();
    o.type = 'square'; o.frequency.value = accent ? 1760 : 1100;
    g.gain.setValueAtTime(.18, t); g.gain.exponentialRampToValueAtTime(.001, t + .05);
    o.connect(g); g.connect(this.master); o.start(t); o.stop(t + .06);
  }
};

/* ---------- player (timed sequences with highlighting) ---------- */
const Player = {
  timers: [], playing: false,
  stop() { this.timers.forEach(clearTimeout); this.timers = []; this.playing = false; AU.allOff(); if (this.onStop) { const f = this.onStop; this.onStop = null; f(); } },
  // events: [{n:[midi], d:beats}] ; cb(i) called at each event start, done at end
  play(events, bpm, cb, done) {
    this.stop(); AU.init(); this.playing = true;
    const beat = 60000 / bpm; let t = 120;
    events.forEach((e, i) => {
      const dur = e.d * beat;
      this.timers.push(setTimeout(() => { (e.n || []).forEach(m => AU.on(m, .8)); cb && cb(i); }, t));
      this.timers.push(setTimeout(() => (e.n || []).forEach(m => AU.off(m)), t + dur * .92));
      t += dur;
    });
    this.timers.push(setTimeout(() => { this.playing = false; this.timers = []; this.onStop = null; done && done(); }, t + 50));
    this.onStop = done;
  }
};

/* ---------- keyboard ---------- */
class Keyboard {
  constructor() {
    this.el = document.createElement('div'); this.el.className = 'kbwrap';
    this.inner = document.createElement('div'); this.inner.className = 'kb';
    this.el.appendChild(this.inner);
    this.navL = document.createElement('button'); this.navL.className = 'kbnav l'; this.navL.textContent = '◀';
    this.navR = document.createElement('button'); this.navR.className = 'kbnav r'; this.navR.textContent = '▶';
    this.navL.onclick = () => this.shift(-1); this.navR.onclick = () => this.shift(1);
    this.keys = new Map(); this.held = new Set(); this.ptr = new Map(); this.onNote = null; this.glide = false;
    this.lo = 60; this.hi = 84; this.offset = 0; this.marks = {};
    const keyAt = (x, y) => { const e = document.elementFromPoint(x, y); const k = e && e.closest && e.closest('.key'); return k && this.inner.contains(k) ? +k.dataset.m : null; };
    this.el.addEventListener('pointerdown', e => {
      const k = e.target.closest('.key'); if (!k) return; e.preventDefault();
      const m = +k.dataset.m; this.ptr.set(e.pointerId, m); this.press(m, true);
      try { this.el.setPointerCapture(e.pointerId); } catch (_) {}
    });
    this.el.addEventListener('pointermove', e => {
      if (!this.glide || !this.ptr.has(e.pointerId)) return;
      const m = keyAt(e.clientX, e.clientY), cur = this.ptr.get(e.pointerId);
      if (m != null && m !== cur) { this.ptr.set(e.pointerId, m); this.press(cur, false); this.press(m, true); }
    });
    const up = e => { if (!this.ptr.has(e.pointerId)) return; const m = this.ptr.get(e.pointerId); this.ptr.delete(e.pointerId); if (![...this.ptr.values()].includes(m)) this.press(m, false); };
    this.el.addEventListener('pointerup', up); this.el.addEventListener('pointercancel', up);
    this.el.addEventListener('contextmenu', e => e.preventDefault());
    window.addEventListener('resize', () => this.layout());
  }
  mount(host, lo, hi) {
    host.appendChild(this.el); host.appendChild(this.navL); host.appendChild(this.navR);
    this.release(); this.setRange(lo, hi);
  }
  release() { for (const m of [...this.held]) this.press(m, false); this.ptr.clear(); }
  press(m, on) {
    const k = this.keys.get(m);
    if (on) { this.held.add(m); AU.on(m); k && k.classList.add('down'); }
    else { this.held.delete(m); AU.off(m); k && k.classList.remove('down'); }
    this.onNote && this.onNote(m, on);
  }
  setRange(lo, hi) {
    lo = midi(lo); hi = midi(hi); if (isBlack(lo)) lo--; if (isBlack(hi)) hi++;
    if (lo === this.lo && hi === this.hi && this.keys.size) { this.layout(); this.mark(this.marks); return; }
    this.lo = lo; this.hi = hi; this.inner.innerHTML = ''; this.keys.clear(); this.offset = 0;
    for (let m = lo; m <= hi; m++) {
      const k = document.createElement('div'); k.className = 'key ' + (isBlack(m) ? 'black' : 'white'); k.dataset.m = m;
      k.innerHTML = '<span class="fing"></span><span class="lab"></span>';
      this.inner.appendChild(k); this.keys.set(m, k);
    }
    this.labels(); this.layout();
  }
  labels() {
    for (const [m, k] of this.keys) {
      const lab = k.querySelector('.lab'); const isC = pcOf(m) === 0;
      lab.className = 'lab' + (isC ? ' c' : '');
      if (S.labels) lab.textContent = isC ? nameOf(m) + (Math.floor(m / 12) - 1) : (isBlack(m) ? '' : nameOf(m));
      else lab.textContent = isC && !S.solfege ? '' : '';
    }
  }
  layout() {
    const W = this.el.clientWidth || window.innerWidth; if (!this.keys.size) return;
    const whites = [...this.keys.keys()].filter(m => !isBlack(m));
    const minW = W < 500 ? 30 : 36;
    this.kw = Math.max(W / whites.length, minW);
    const total = this.kw * whites.length; this.inner.style.width = total + 'px';
    let wi = 0;
    for (const [m, k] of this.keys) {
      if (!isBlack(m)) { k.style.left = (wi * this.kw) + 'px'; k.style.width = this.kw + 'px'; wi++; }
      else { const bw = this.kw * .62; k.style.left = (wi * this.kw - bw / 2) + 'px'; k.style.width = bw + 'px'; }
    }
    this.maxOff = Math.max(0, total - W);
    this.navL.classList.toggle('show', this.maxOff > 2); this.navR.classList.toggle('show', this.maxOff > 2);
    this.scrollTo(this.offset);
  }
  scrollTo(x) { this.offset = Math.max(0, Math.min(this.maxOff || 0, x)); this.inner.style.transform = `translateX(${-this.offset}px)`; }
  shift(dir) { this.scrollTo(this.offset + dir * this.kw * 7); }
  ensure(ms) {
    if (!ms || !ms.length || !this.maxOff) return;
    const xs = ms.map(m => this.keys.get(m)).filter(Boolean).map(k => [parseFloat(k.style.left), parseFloat(k.style.left) + parseFloat(k.style.width)]);
    if (!xs.length) return;
    const a = Math.min(...xs.map(x => x[0])), b = Math.max(...xs.map(x => x[1])), W = this.el.clientWidth;
    if (a < this.offset + 10 || b > this.offset + W - 10) this.scrollTo((a + b) / 2 - W / 2);
  }
  // marks: {midi: finger|''} ; cls 'hint' or 'dim'
  mark(marks, cls = 'hint') {
    this.marks = marks || {};
    for (const [m, k] of this.keys) {
      k.classList.remove('hint', 'dim');
      const f = k.querySelector('.fing'); f.textContent = ''; f.classList.remove('has');
      if (m in this.marks) { k.classList.add(cls); const v = this.marks[m]; if (v !== '' && v != null) { f.textContent = v; f.classList.add('has'); } }
    }
  }
  flash(m, cls) { const k = this.keys.get(m); if (!k) return; k.classList.remove('good', 'bad'); void k.offsetWidth; k.classList.add(cls); clearTimeout(k._t); k._t = setTimeout(() => k.classList.remove(cls), 380); }
}

/* ---------- staff renderer ---------- */
const INK = '#1d1d26', CUR = '#d68a00', OK = '#2a9d68', BAD = '#d23a4a', SEL = '#2f6fd6';
const TREBLE_PATH = 'M15.5,-17 C23,-9 21,3 9,13 C1,20 -1,31 6,38 C12,44 23,40 23,32 C23,24 15,21 10.5,24.5 C6.5,28 8.5,33.5 13,33.5 M15.5,-17 C11.5,-14 9.5,-6 10.5,4 L14.5,49 C15.5,57 7,59 5.5,53';
const BASS_PATH = 'M4,10 C4,1 13,-2 19,2 C27,7 25,19 16,27 C11,31 6,34 1,36';
function staffGeom(clef) {
  if (clef === 'grand') return { staves: [{ base: 30, y0: 40, clef: 'treble' }, { base: 18, y0: 120, clef: 'bass' }], h: 205 };
  if (clef === 'bass') return { staves: [{ base: 18, y0: 38, clef: 'bass' }], h: 128 };
  return { staves: [{ base: 30, y0: 38, clef: 'treble' }], h: 128 };
}
function autoClef(strs) {
  const st = strs.map(s => parseN(s).step);
  const lo = Math.min(...st), hi = Math.max(...st);
  if (lo < 25 && hi > 29) return 'grand';
  if (hi <= 28 && lo < 26) return 'bass';
  return 'treble';
}
function noteGlyph(d, x, y, color, filled, stemDir) { // small single-note icon helper for buttons
  return '';
}
/* opts: {clef, items:[{n:['C4'], d, cls, lab, st}], ts:[4,4], pickup, cur, sel, names, fingers, caret} */
function renderStaff(opts) {
  const clef = opts.clef || 'treble', g = staffGeom(clef), items = opts.items || [];
  const ts = opts.ts || null, mLen = ts ? ts[0] * 4 / ts[1] : 0;
  const parts = []; const xs = [];
  let x = 46; const tsX = x; if (ts) x += 26; x += 14;
  const yOf = (st, step) => st.y0 + 40 - (step - st.base) * 5;
  let beats = ts && opts.pickup ? mLen - opts.pickup : 0;
  const bars = [];
  const colorOf = (it, i) => i === opts.sel ? SEL : i === opts.cur ? CUR : it.cls === 'ok' ? OK : it.cls === 'bad' ? BAD : it.cls === 'cur' ? CUR : INK;
  items.forEach((it, i) => {
    const notes = (it.n || []).map(s => ({ s, p: parseN(s) }));
    const hasAcc = notes.some(n => n.p.accS);
    if (hasAcc) x += 10;
    const w = 24 + 17 * Math.sqrt(it.d);
    const cx = x + 8, col = colorOf(it, i);
    xs.push({ x0: x - (hasAcc ? 10 : 0) - 4, x1: x + w - 4, cx });
    if (i === opts.cur || i === opts.sel) parts.push(`<rect x="${cx - 13}" y="4" width="26" height="${g.h - 8}" rx="8" fill="${i === opts.sel ? 'rgba(47,111,214,.12)' : 'rgba(245,185,66,.18)'}"/>`);
    if (!notes.length) parts.push(drawRest(cx, g.staves[0].y0, it.d, col));
    else {
      // group by staff
      const groups = g.staves.map(() => []);
      notes.forEach(n => {
        let si = 0;
        if (g.staves.length > 1) si = it.st != null ? it.st : (n.p.step >= 28 ? 0 : 1);
        groups[si].push(n);
      });
      groups.forEach((grp, si) => {
        if (!grp.length) return;
        const st = g.staves[si];
        const steps = grp.map(n => n.p.step);
        const mid = st.base + 4, avg = steps.reduce((a, b) => a + b, 0) / steps.length;
        const up = avg < mid;
        // ledger lines
        for (const s of steps) {
          for (let l = st.base - 2; l >= s; l -= 2) parts.push(`<line x1="${cx - 10}" x2="${cx + 10}" y1="${yOf(st, l)}" y2="${yOf(st, l)}" stroke="${INK}" stroke-width="1.3"/>`);
          for (let l = st.base + 10; l <= s; l += 2) parts.push(`<line x1="${cx - 10}" x2="${cx + 10}" y1="${yOf(st, l)}" y2="${yOf(st, l)}" stroke="${INK}" stroke-width="1.3"/>`);
        }
        const sortedSteps = [...steps].sort((a, b) => a - b);
        grp.forEach(n => {
          const y = yOf(st, n.p.step);
          // seconds in chords: offset head
          let hx = cx; const idx = sortedSteps.indexOf(n.p.step);
          if (idx > 0 && sortedSteps[idx] - sortedSteps[idx - 1] === 1 && idx % 2 === 1) hx = up ? cx + 11 : cx - 11;
          const filled = it.d < 2, whole = it.d >= 4 && !(it.d === 6 && false);
          if (whole) parts.push(`<ellipse cx="${hx}" cy="${y}" rx="7.4" ry="4.8" fill="none" stroke="${col}" stroke-width="2.6" transform="rotate(-25 ${hx} ${y})"/>`);
          else parts.push(`<ellipse cx="${hx}" cy="${y}" rx="6.3" ry="4.5" fill="${filled ? col : 'none'}" stroke="${col}" stroke-width="${filled ? 1 : 1.8}" transform="rotate(-22 ${hx} ${y})"/>`);
          if (n.p.accS) { const sym = n.p.accS === '#' ? '♯' : n.p.accS === 'b' ? '♭' : '♮'; parts.push(`<text x="${cx - 13}" y="${y + 5}" font-size="16" text-anchor="middle" fill="${col}" font-family="serif">${sym}</text>`); }
          if (isDotted(it.d)) parts.push(`<circle cx="${hx + 11}" cy="${n.p.step % 2 === st.base % 2 ? y - 3 : y}" r="1.9" fill="${col}"/>`);
        });
        if (opts.fingers && it.f) parts.push(`<text x="${cx}" y="13" font-size="11" text-anchor="middle" fill="#7a5a00" font-weight="800">${it.f.filter(v => v !== '').join(' ')}</text>`);
        // stem
        if (it.d < 4) {
          const ys = steps.map(s => yOf(st, s)), top = Math.min(...ys), bot = Math.max(...ys);
          if (up) {
            const sx = cx + 5.8, ey = top - 33;
            parts.push(`<line x1="${sx}" x2="${sx}" y1="${bot - 1}" y2="${ey}" stroke="${col}" stroke-width="1.5"/>`);
            if (baseDur(it.d) <= .5) parts.push(flag(sx, ey, 1, col, baseDur(it.d)));
          } else {
            const sx = cx - 5.8, ey = bot + 33;
            parts.push(`<line x1="${sx}" x2="${sx}" y1="${top + 1}" y2="${ey}" stroke="${col}" stroke-width="1.5"/>`);
            if (baseDur(it.d) <= .5) parts.push(flag(sx, ey, -1, col, baseDur(it.d)));
          }
        }
      });
    }
    if (opts.names && notes.length) parts.push(`<text x="${cx}" y="${g.h - 6}" font-size="${notes.length > 1 ? 9 : 11}" text-anchor="middle" fill="${col}" font-weight="700">${[...notes].sort((a, b) => a.p.midi - b.p.midi).map(n => strName(n.s)).join(notes.length > 1 ? '·' : '')}</text>`);
    x += w;
    if (ts) {
      beats += it.d;
      if (beats >= mLen - 1e-6) {
        const over = beats > mLen + 1e-6;
        beats = beats % mLen; if (Math.abs(beats - mLen) < 1e-6 || beats < 1e-6) beats = 0;
        bars.push({ x: x - 6, over }); x += 8;
      }
    }
  });
  if (opts.caret) { parts.push(`<line x1="${x + 6}" x2="${x + 6}" y1="${g.staves[0].y0 - 6}" y2="${g.staves[g.staves.length - 1].y0 + 46}" stroke="${SEL}" stroke-width="2" stroke-dasharray="4 3"/>`); x += 20; }
  const W = Math.max(opts.minW || 0, x + 16);
  const head = [];
  g.staves.forEach(st => {
    for (let l = 0; l < 5; l++) head.push(`<line x1="6" x2="${W - 4}" y1="${st.y0 + l * 10}" y2="${st.y0 + l * 10}" stroke="${INK}" stroke-width="1.1"/>`);
    if (st.clef === 'treble') head.push(`<path d="${TREBLE_PATH}" transform="translate(12 ${st.y0})" fill="none" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/><circle cx="18.5" cy="${st.y0 + 52}" r="3.4" fill="${INK}"/>`);
    else head.push(`<path d="${BASS_PATH}" transform="translate(12 ${st.y0})" fill="none" stroke="${INK}" stroke-width="3" stroke-linecap="round"/><circle cx="17" cy="${st.y0 + 10}" r="3.8" fill="${INK}"/><circle cx="41" cy="${st.y0 + 5}" r="2" fill="${INK}"/><circle cx="41" cy="${st.y0 + 15}" r="2" fill="${INK}"/>`);
    if (ts) head.push(`<text x="${tsX + 14}" y="${st.y0 + 18}" font-size="21" font-weight="900" text-anchor="middle" fill="${INK}" font-family="Georgia,serif">${ts[0]}</text><text x="${tsX + 14}" y="${st.y0 + 38}" font-size="21" font-weight="900" text-anchor="middle" fill="${INK}" font-family="Georgia,serif">${ts[1]}</text>`);
  });
  const yT = g.staves[0].y0, yB = g.staves[g.staves.length - 1].y0 + 40;
  head.push(`<line x1="6" x2="6" y1="${yT}" y2="${yB}" stroke="${INK}" stroke-width="1.4"/>`);
  if (g.staves.length > 1) head.push(`<path d="M3,${yT} C-4,${yT + 20} 4,${(yT + yB) / 2 - 10} -2,${(yT + yB) / 2} C4,${(yT + yB) / 2 + 10} -4,${yB - 20} 3,${yB}" fill="none" stroke="${INK}" stroke-width="2.4"/>`);
  bars.forEach(b => head.push(`<line x1="${b.x}" x2="${b.x}" y1="${yT}" y2="${yB}" stroke="${b.over ? BAD : INK}" stroke-width="1.3"/>`));
  if (opts.final && items.length) head.push(`<line x1="${W - 12}" x2="${W - 12}" y1="${yT}" y2="${yB}" stroke="${INK}" stroke-width="1.2"/><line x1="${W - 7}" x2="${W - 7}" y1="${yT}" y2="${yB}" stroke="${INK}" stroke-width="4"/>`);
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-6 0 ${W + 6} ${g.h}" data-w="${W + 6}" data-h="${g.h}">${head.join('')}${parts.join('')}</svg>`;
  return { svg, xs, W: W + 6, h: g.h, geom: g };
}
const isDotted = d => [3, 1.5, .75, 6].includes(d);
const baseDur = d => isDotted(d) ? d / 1.5 : d;
function flag(sx, ey, dir, col, bd) {
  let s = `<path d="M${sx},${ey} c0,${8 * dir} ${10},${9 * dir} ${8},${20 * dir}" fill="none" stroke="${col}" stroke-width="2"/>`;
  if (bd <= .25) s += `<path d="M${sx},${ey + 7 * dir} c0,${8 * dir} ${10},${9 * dir} ${8},${20 * dir}" fill="none" stroke="${col}" stroke-width="2"/>`;
  return s;
}
function drawRest(cx, y0, d, col) {
  const b = baseDur(d); let s = '';
  if (b >= 4) s = `<rect x="${cx - 7}" y="${y0 + 10}" width="14" height="5" fill="${col}"/>`;
  else if (b >= 2) s = `<rect x="${cx - 7}" y="${y0 + 15}" width="14" height="5" fill="${col}"/>`;
  else if (b >= 1) s = `<path d="M${cx - 3},${y0 + 6} L${cx + 4},${y0 + 14} L${cx - 2},${y0 + 21} L${cx + 4},${y0 + 28} C${cx - 4},${y0 + 25} ${cx - 5},${y0 + 32} ${cx},${y0 + 35}" fill="none" stroke="${col}" stroke-width="3" stroke-linejoin="round"/>`;
  else s = `<circle cx="${cx - 3}" cy="${y0 + 16}" r="2.8" fill="${col}"/><path d="M${cx - 3},${y0 + 18} C${cx},${y0 + 19} ${cx + 3},${y0 + 17} ${cx + 4},${y0 + 15} L${cx - 1},${y0 + 32}" fill="none" stroke="${col}" stroke-width="1.8"/>`;
  if (isDotted(d)) s += `<circle cx="${cx + 10}" cy="${y0 + 15}" r="1.9" fill="${col}"/>`;
  return s;
}
// put a rendered staff into a container, scaled to its height
function putStaff(el, r, scrollToX) {
  const H = Math.max(60, el.clientHeight - 8);
  const k = H / r.h;
  el.innerHTML = r.svg;
  const svg = el.firstChild; svg.setAttribute('width', r.W * k); svg.setAttribute('height', r.h * k);
  svg._k = k; svg._r = r;
  if (scrollToX != null) { const target = (scrollToX + 6) * k - el.clientWidth * .35; el.scrollTo({ left: Math.max(0, target), behavior: 'smooth' }); }
  return svg;
}
// small icon of a note value for buttons
function durIcon(d, rest) {
  const r = renderStaffIcon(d, rest); return r;
}
function renderStaffIcon(d, rest) {
  const col = 'currentColor';
  if (rest) {
    const y0 = 2; let inner = drawRest(14, y0, d, col).replace(/fill="currentColor"/g, 'fill="currentColor"');
    return `<svg viewBox="0 0 28 42" width="20" height="30">${inner}</svg>`;
  }
  const b = baseDur(d); let s = '';
  if (b >= 4) s = `<ellipse cx="12" cy="30" rx="7" ry="4.6" fill="none" stroke="${col}" stroke-width="2.4" transform="rotate(-25 12 30)"/>`;
  else {
    s = `<ellipse cx="11" cy="32" rx="6.2" ry="4.4" fill="${b < 2 ? col : 'none'}" stroke="${col}" stroke-width="1.8" transform="rotate(-22 11 32)"/><line x1="16.8" x2="16.8" y1="31" y2="4" stroke="${col}" stroke-width="1.6"/>`;
    if (b <= .5) s += `<path d="M16.8,4 c0,8 10,9 8,20" fill="none" stroke="${col}" stroke-width="2"/>`;
  }
  if (isDotted(d)) s += `<circle cx="24" cy="32" r="2" fill="${col}"/>`;
  return `<svg viewBox="0 0 28 42" width="20" height="30">${s}</svg>`;
}

/* ---------- composer ---------- */
class Composer {
  constructor(staffEl, toolsEl, opts = {}) {
    this.staffEl = staffEl; this.toolsEl = toolsEl; this.o = opts;
    this.items = opts.items ? JSON.parse(JSON.stringify(opts.items)) : [];
    this.clef = opts.clef || 'treble'; this.ts = opts.ts || [4, 4]; this.bpm = opts.bpm || 90;
    this.sel = -1; this.dur = 1; this.dot = false; this.restMode = false; this.stack = false; this.hist = []; this.playIdx = -1;
    this.lastAddT = 0;
    this.buildTools(); this.render();
    this.staffEl.onclick = e => this.staffTap(e);
  }
  d() { return this.dur * (this.dot ? 1.5 : 1); }
  snap() { this.hist.push(JSON.stringify(this.items)); if (this.hist.length > 80) this.hist.shift(); }
  buildTools() {
    const T = this.toolsEl; T.innerHTML = '';
    const mk = (html, fn, title) => { const b = document.createElement('button'); b.className = 'dbtn'; b.innerHTML = html; b.title = title || ''; b.onclick = fn; T.appendChild(b); return b; };
    const sep = () => { const s = document.createElement('span'); s.className = 'sep'; T.appendChild(s); };
    this.durBtns = [4, 2, 1, .5, .25].map(d => { const b = mk(renderStaffIcon(d), () => this.setDur(d), ['', 'Whole', 'Half', 'Quarter', 'Eighth', '16th'][[0, 4, 2, 1, .5, .25].indexOf(d)]); b.dataset.d = d; return b; });
    this.dotBtn = mk('•&nbsp;dot', () => { this.dot = !this.dot; this.applySel(); this.syncTools(); }, 'Dotted (adds half the value)');
    this.restBtn = mk(renderStaffIcon(1, true) + 'rest', () => this.addRest(), 'Add a rest');
    sep();
    if (!this.o.compact) {
      mk('♯', () => this.accSel(1), 'Sharp'); mk('♭', () => this.accSel(-1), 'Flat'); mk('♮', () => this.accSel(0), 'Natural');
      this.stackBtn = mk('＋chord', () => { this.stack = !this.stack; this.syncTools(); }, 'Tap staff to stack notes into a chord');
      sep();
      mk('◀', () => this.move(-1)); mk('▶', () => this.move(1));
    }
    mk('⌫', () => this.del(), 'Delete'); mk('↶', () => this.undo(), 'Undo');
    if (!this.o.compact) mk('🗑', () => { if (this.items.length && confirm('Clear all notes?')) { this.snap(); this.items = []; this.sel = -1; this.render(); } }, 'Clear');
    sep();
    this.playBtn = mk('▶ Play', () => this.togglePlay());
    this.info = document.createElement('span'); this.info.className = 'info'; T.appendChild(this.info);
    this.syncTools();
  }
  syncTools() {
    this.durBtns.forEach(b => b.classList.toggle('on', +b.dataset.d === this.dur));
    this.dotBtn.classList.toggle('on', this.dot);
    if (this.stackBtn) this.stackBtn.classList.toggle('on', this.stack);
    this.playBtn.innerHTML = Player.playing && this.playing ? '■ Stop' : '▶ Play';
  }
  setDur(d) { this.dur = d; this.applySel(); this.syncTools(); }
  applySel() { if (this.sel >= 0) { this.snap(); this.items[this.sel].d = this.d(); this.render(); } }
  accSel(a) {
    const it = this.items[this.sel >= 0 ? this.sel : this.items.length - 1]; if (!it || !it.n.length) return;
    this.snap();
    it.n = it.n.map(s => { const p = parseN(s); return LET[p.L] + (a === 1 ? '#' : a === -1 ? 'b' : '') + p.o; });
    it.n.forEach(s => { const m = midi(s); AU.on(m, .7); setTimeout(() => AU.off(m), 300); });
    this.render();
  }
  move(dir) { if (!this.items.length) return; let s = this.sel < 0 ? (dir < 0 ? this.items.length - 1 : 0) : this.sel + dir; if (s >= this.items.length) s = -1; this.sel = Math.max(-1, s); this.render(); }
  del() { if (!this.items.length) return; this.snap(); const i = this.sel >= 0 ? this.sel : this.items.length - 1; this.items.splice(i, 1); if (this.sel >= this.items.length) this.sel = -1; this.render(); }
  undo() { if (!this.hist.length) return; this.items = JSON.parse(this.hist.pop()); this.sel = -1; this.render(); }
  addRest() {
    this.snap();
    if (this.sel >= 0) { this.items[this.sel].n = []; this.items[this.sel].d = this.d(); }
    else this.items.push({ n: [], d: this.d() });
    this.render();
  }
  // from keyboard
  key(m, heldCount) {
    const s = midiToStr(m, S.flats); const now = Date.now();
    if (this.sel >= 0) {
      this.snap(); const it = this.items[this.sel];
      if (heldCount > 1 && now - this.lastAddT < 1500) { if (!it.n.includes(s)) it.n.push(s); }
      else { it.n = [s]; it.d = it.d || this.d(); }
      this.lastAddT = now; this.render(); return;
    }
    const last = this.items[this.items.length - 1];
    this.snap();
    if (heldCount > 1 && last && last.n.length && now - this.lastAddT < 1500) { if (!last.n.includes(s)) last.n.push(s); }
    else this.items.push({ n: [s], d: this.d() });
    this.lastAddT = now; this.render();
  }
  staffTap(e) {
    const svg = this.staffEl.querySelector('svg'); if (!svg || !svg._r) return;
    const rect = svg.getBoundingClientRect(), k = svg._k, r = svg._r;
    const x = (e.clientX - rect.left) / k - 6, y = (e.clientY - rect.top) / k;
    // hit existing note?
    const hit = r.xs.findIndex(o => x >= o.x0 && x <= o.x1);
    if (hit >= 0 && !this.stack) { this.sel = this.sel === hit ? -1 : hit; const it = this.items[hit]; if (it && this.sel >= 0) { this.dur = isDotted(it.d) ? it.d / 1.5 : it.d; this.dot = isDotted(it.d); this.syncTools(); it.n.forEach(s => { const m = midi(s); AU.on(m, .7); setTimeout(() => AU.off(m), 350); }); } this.render(); return; }
    // which staff
    let st = r.geom.staves[0];
    if (r.geom.staves.length > 1) st = Math.abs(y - (r.geom.staves[0].y0 + 20)) < Math.abs(y - (r.geom.staves[1].y0 + 20)) ? r.geom.staves[0] : r.geom.staves[1];
    const step = Math.round((st.y0 + 40 - y) / 5) + st.base;
    if (step < st.base - 8 || step > st.base + 18) return;
    const o = Math.floor(step / 7), L = ((step % 7) + 7) % 7, s = LET[L] + o, m = midi(s);
    AU.on(m, .8); setTimeout(() => AU.off(m), 350);
    this.snap();
    const tgt = this.stack ? (this.sel >= 0 ? this.items[this.sel] : this.items[this.items.length - 1]) : null;
    if (tgt && tgt.n.length) { if (!tgt.n.includes(s)) tgt.n.push(s); }
    else if (hit >= 0 && this.stack) this.items[hit].n.push(s);
    else this.items.push({ n: [s], d: this.d() });
    this.render();
  }
  totalBeats() { return this.items.reduce((a, b) => a + b.d, 0); }
  render() {
    const r = renderStaff({ clef: this.clef, items: this.items, ts: this.ts, sel: this.sel, cur: this.playIdx, caret: this.sel < 0 && !this.o.noCaret, minW: 300, final: false });
    const cx = this.playIdx >= 0 ? r.xs[this.playIdx].cx : this.sel >= 0 ? r.xs[this.sel].cx : r.W;
    putStaff(this.staffEl, r, cx);
    const mLen = this.ts[0] * 4 / this.ts[1], tb = this.totalBeats();
    const meas = Math.floor(tb / mLen + 1e-6) + 1, inM = +(tb - (meas - 1) * mLen).toFixed(2);
    if (this.info) this.info.textContent = this.sel >= 0 ? `Editing note ${this.sel + 1} — press a key to change it` : `${this.items.length} notes · measure ${meas}: ${inM}/${mLen} beats`;
    this.onChange && this.onChange();
  }
  togglePlay() {
    if (Player.playing) { Player.stop(); return; }
    if (!this.items.length) return;
    this.playing = true;
    const ev = this.items.map(it => ({ n: it.n.map(midi), d: it.d }));
    const start = this.sel >= 0 ? this.sel : 0;
    Player.play(ev.slice(start), this.bpm, i => { this.playIdx = i + start; this.render(); this.o.onPlayNote && this.o.onPlayNote(ev[i + start].n); }, () => { this.playing = false; this.playIdx = -1; this.render(); this.syncTools(); this.o.onPlayNote && this.o.onPlayNote([]); });
    this.syncTools();
  }
}
