/* JJ Keys — curriculum: 8 stages from zero to pro */
'use strict';
// song string: "E4:1:3 D4:.5:2 C4+E4+G4:4:1+3+5 R:1"  (note : beats : finger)
function song(str) {
  return str.trim().split(/\s+/).map(tok => {
    const [n, d, f] = tok.split(':');
    if (n === 'R') return { n: [], d: +d };
    return { n: n.split('+'), d: +d, f: f ? f.split('+') : [] };
  });
}
const notesOf = (lo, hi, pred) => allIn(lo, hi, pred).map(m => midiToStr(m));
const HANDS_SVG = (() => {
  const hand = (ox, mirror) => {
    const f = [[0, 46, 16, 34], [18, 10, 15, 60], [35, 0, 15, 68], [52, 8, 15, 60], [69, 24, 13, 44]]; // thumb..pinky (right hand)
    let s = `<rect x="${ox + 14}" y="62" width="74" height="70" rx="22" fill="#f3c9a0" stroke="#8a5a32" stroke-width="2"/>`;
    f.forEach((r, i) => {
      let [x, y, w, h] = r; if (i === 0) { x = -2; y = 70; }
      const X = mirror ? ox + 100 - x - w : ox + x + 14;
      const rot = i === 0 ? (mirror ? 'rotate(35 ' + (X + w / 2) + ' ' + (y + h / 2) + ')' : 'rotate(-35 ' + (X + w / 2) + ' ' + (y + h / 2) + ')') : '';
      s += `<rect x="${X}" y="${y}" width="${w}" height="${h}" rx="${w / 2}" fill="#f6d3b0" stroke="#8a5a32" stroke-width="2" transform="${rot}"/>`;
      const cx = X + w / 2, cy = i === 0 ? y + h / 2 : y + 12;
      s += `<circle cx="${cx}" cy="${cy}" r="9" fill="#2a1d00"/><text x="${cx}" y="${cy + 4.5}" font-size="13" font-weight="900" text-anchor="middle" fill="#ffd77a" transform="${rot}">${i + 1}</text>`;
    });
    return s;
  };
  return `<svg class="hands" viewBox="-10 -6 250 160"><g>${hand(0, true)}</g><g>${hand(126, false)}</g><text x="52" y="152" text-anchor="middle" font-size="13" fill="#ccc">LEFT hand</text><text x="178" y="152" text-anchor="middle" font-size="13" fill="#ccc">RIGHT hand</text></svg>`;
})();
const CIRCLE_SVG = (() => {
  const keys = ['C', 'G', 'D', 'A', 'E', 'B', 'F♯/G♭', 'D♭', 'A♭', 'E♭', 'B♭', 'F'], sig = ['0', '1♯', '2♯', '3♯', '4♯', '5♯', '6♯/6♭', '5♭', '4♭', '3♭', '2♭', '1♭'];
  let s = '<svg class="hands" viewBox="-110 -110 220 220"><circle r="98" fill="none" stroke="#3a4170" stroke-width="2"/><circle r="56" fill="none" stroke="#3a4170"/>';
  keys.forEach((k, i) => { const a = (i * 30 - 90) * Math.PI / 180; s += `<text x="${Math.cos(a) * 78}" y="${Math.sin(a) * 78 + 5}" text-anchor="middle" font-size="${k.length > 2 ? 10 : 15}" font-weight="800" fill="${i ? '#eef0fb' : '#f5b942'}">${k}</text><text x="${Math.cos(a) * 42}" y="${Math.sin(a) * 42 + 4}" text-anchor="middle" font-size="9" fill="#9aa1c7">${sig[i]}</text>`; });
  return s + '<text y="-4" text-anchor="middle" font-size="9" fill="#9aa1c7">clockwise:</text><text y="8" text-anchor="middle" font-size="9" fill="#9aa1c7">up a 5th</text></svg>';
})();

const SONGS = {
  cUpDown: 'C4:1:1 D4:1:2 E4:1:3 F4:1:4 G4:1:5 F4:1:4 E4:1:3 D4:1:2 C4:4:1',
  mary: 'E4:1:3 D4:1:2 C4:1:1 D4:1:2 E4:1:3 E4:1:3 E4:2:3 D4:1:2 D4:1:2 D4:2:2 E4:1:3 G4:1:5 G4:2:5 E4:1:3 D4:1:2 C4:1:1 D4:1:2 E4:1:3 E4:1:3 E4:1:3 E4:1:3 D4:1:2 D4:1:2 E4:1:3 D4:1:2 C4:4:1',
  hotCross: 'E4:1:3 D4:1:2 C4:2:1 E4:1:3 D4:1:2 C4:2:1 C4:.5:1 C4:.5:1 C4:.5:1 C4:.5:1 D4:.5:2 D4:.5:2 D4:.5:2 D4:.5:2 E4:1:3 D4:1:2 C4:2:1',
  ode: 'E4:1:3 E4:1:3 F4:1:4 G4:1:5 G4:1:5 F4:1:4 E4:1:3 D4:1:2 C4:1:1 C4:1:1 D4:1:2 E4:1:3 E4:1.5:3 D4:.5:2 D4:2:2 E4:1:3 E4:1:3 F4:1:4 G4:1:5 G4:1:5 F4:1:4 E4:1:3 D4:1:2 C4:1:1 C4:1:1 D4:1:2 E4:1:3 D4:1.5:2 C4:.5:1 C4:2:1',
  jingle: 'E4:1:3 E4:1:3 E4:2:3 E4:1:3 E4:1:3 E4:2:3 E4:1:3 G4:1:5 C4:1.5:1 D4:.5:2 E4:4:3 F4:1:4 F4:1:4 F4:1.5:4 F4:.5:4 F4:1:4 E4:1:3 E4:1:3 E4:.5:3 E4:.5:3 E4:1:3 D4:1:2 D4:1:2 E4:1:3 D4:2:2 G4:2:5 E4:1:3 E4:1:3 E4:2:3 E4:1:3 E4:1:3 E4:2:3 E4:1:3 G4:1:5 C4:1.5:1 D4:.5:2 E4:4:3 F4:1:4 F4:1:4 F4:1:4 F4:1:4 F4:1:4 E4:1:3 E4:1:3 E4:.5:3 E4:.5:3 G4:1:5 G4:1:5 F4:1:4 D4:1:2 C4:4:1',
  lhUpDown: 'C3:1:5 D3:1:4 E3:1:3 F3:1:2 G3:1:1 F3:1:2 E3:1:3 D3:1:4 C3:4:5',
  maryLH: 'E3:1:3 D3:1:4 C3:1:5 D3:1:4 E3:1:3 E3:1:3 E3:2:3 D3:1:4 D3:1:4 D3:2:4 E3:1:3 G3:1:1 G3:2:1 E3:1:3 D3:1:4 C3:1:5 D3:1:4 E3:1:3 E3:1:3 E3:1:3 E3:1:3 D3:1:4 D3:1:4 E3:1:3 D3:1:4 C3:4:5',
  twinkle: 'C4:1:1 C4:1:1 G4:1:4 G4:1:4 A4:1:5 A4:1:5 G4:2:4 F4:1:3 F4:1:3 E4:1:2 E4:1:2 D4:1:1 D4:1:1 C4:2:1 G4:1:4 G4:1:4 F4:1:3 F4:1:3 E4:1:2 E4:1:2 D4:2:1 G4:1:4 G4:1:4 F4:1:3 F4:1:3 E4:1:2 E4:1:2 D4:2:1 C4:1:1 C4:1:1 G4:1:4 G4:1:4 A4:1:5 A4:1:5 G4:2:4 F4:1:3 F4:1:3 E4:1:2 E4:1:2 D4:1:1 D4:1:1 C4:2:1',
  clair: 'C4:1 C4:1 C4:1 D4:1 E4:2 D4:2 C4:1 E4:1 D4:1 D4:1 C4:4 C4:1 C4:1 C4:1 D4:1 E4:2 D4:2 C4:1 E4:1 D4:1 D4:1 C4:4',
  lightly: 'G4:1 E4:1 E4:2 F4:1 D4:1 D4:2 C4:1 D4:1 E4:1 F4:1 G4:1 G4:1 G4:2 G4:1 E4:1 E4:2 F4:1 D4:1 D4:2 C4:1 E4:1 G4:1 G4:1 C4:4',
  cScale: 'C4:1:1 D4:1:2 E4:1:3 F4:1:1 G4:1:2 A4:1:3 B4:1:4 C5:1:5 B4:1:4 A4:1:3 G4:1:2 F4:1:1 E4:1:3 D4:1:2 C4:2:1',
  cScaleLH: 'C3:1:5 D3:1:4 E3:1:3 F3:1:2 G3:1:1 A3:1:3 B3:1:2 C4:1:1 B3:1:2 A3:1:3 G3:1:1 F3:1:2 E3:1:3 D3:1:4 C3:2:5',
  gScale: 'G4:1:1 A4:1:2 B4:1:3 C5:1:1 D5:1:2 E5:1:3 F#5:1:4 G5:1:5 F#5:1:4 E5:1:3 D5:1:2 C5:1:1 B4:1:3 A4:1:2 G4:2:1',
  fScale: 'F4:1:1 G4:1:2 A4:1:3 Bb4:1:4 C5:1:1 D5:1:2 E5:1:3 F5:1:4 E5:1:3 D5:1:2 C5:1:1 Bb4:1:4 A4:1:3 G4:1:2 F4:2:1',
  aMinor: 'A4:1:1 B4:1:2 C5:1:3 D5:1:1 E5:1:2 F5:1:3 G5:1:4 A5:1:5 G5:1:4 F5:1:3 E5:1:2 D5:1:1 C5:1:3 B4:1:2 A4:2:1',
  primary: 'C4+E4+G4:2:1+3+5 C4+F4+A4:2:1+2+4 B3+D4+G4:2:1+2+5 C4+E4+G4:2:1+3+5 C4+F4+A4:2:1+2+4 C4+E4+G4:2:1+3+5 B3+D4+G4:2:1+2+5 C4+E4+G4:2:1+3+5',
  popRH: 'C4+E4+G4:4:1+3+5 B3+D4+G4:4:1+2+5 C4+E4+A4:4:1+2+5 C4+F4+A4:4:1+3+5 C4+E4+G4:4:1+3+5 B3+D4+G4:4:1+2+5 C4+E4+A4:4:1+2+5 C4+F4+A4:4:1+3+5',
  popBoth: 'C3+C4+E4+G4:4:5+1+3+5 G2+B3+D4+G4:4:5+1+2+5 A2+C4+E4+A4:4:5+1+2+5 F2+C4+F4+A4:4:5+1+3+5 C3+C4+E4+G4:4:5+1+3+5',
  odeBoth: 'E4+C3:1:3+5 E4:1:3 F4:1:4 G4:1:5 G4+G3:1:5+1 F4:1:4 E4:1:3 D4:1:2 C4+C3:1:1+5 C4:1:1 D4:1:2 E4:1:3 E4+C3:1.5:3+5 D4:.5:2 D4+G3:2:2+1 E4+C3:1:3+5 E4:1:3 F4:1:4 G4:1:5 G4+G3:1:5+1 F4:1:4 E4:1:3 D4:1:2 C4+C3:1:1+5 C4:1:1 D4:1:2 E4:1:3 D4+G3:1.5:2+1 C4:.5:1 C4+C3:2:1+5',
  arpeggio: 'C4:.5:1 E4:.5:2 G4:.5:3 C5:.5:1 E5:.5:2 G5:.5:3 C6:1:5 G5:.5:3 E5:.5:2 C5:.5:1 G4:.5:3 E4:.5:2 C4:1:1',
  alberti: 'C3:.5:5 G3:.5:1 E3:.5:3 G3:.5:1 C3:.5:5 G3:.5:1 E3:.5:3 G3:.5:1 B2:.5:5 G3:.5:1 D3:.5:3 G3:.5:1 B2:.5:5 G3:.5:1 D3:.5:3 G3:.5:1 C3:.5:5 G3:.5:1 E3:.5:3 G3:.5:1 B2:.5:5 G3:.5:1 D3:.5:3 G3:.5:1 C3:2:5',
  elise: 'E5:.5:5 D#5:.5:4 E5:.5:5 D#5:.5:4 E5:.5:5 B4:.5:2 D5:.5:4 C5:.5:3 A4:1.5:1 C4:.5:1 E4:.5:2 A4:.5:3 B4:1.5:4 E4:.5:2 G#4:.5:3 B4:.5:4 C5:1.5:5 E4:.5:1 E5:.5:5 D#5:.5:4 E5:.5:5 D#5:.5:4 E5:.5:5 B4:.5:2 D5:.5:4 C5:.5:3 A4:1.5:1 C4:.5:1 E4:.5:2 A4:.5:3 B4:1.5:4 E4:.5:2 C5:.5:4 B4:.5:3 A4:1.5:2'
};

const TREBLE_LINES = ['E4', 'G4', 'B4', 'D5', 'F5'], TREBLE_SPACES = ['F4', 'A4', 'C5', 'E5'];
const BASS_LINES = ['G2', 'B2', 'D3', 'F3', 'A3'], BASS_SPACES = ['A2', 'C3', 'E3', 'G3'];
const whiteRange = (lo, hi) => notesOf(lo, hi, pc => PCL.includes(pc));

const STAGES = [
/* ================= STAGE 1 ================= */
{ id: 's1', icon: '🎹', title: 'Meet the Keyboard', desc: 'Black & white keys, the musical alphabet, finger numbers.', lessons: [
  { id: '1-1', title: 'Black & White Keys', range: ['C4', 'B5'], steps: [
    { t: 'info', html: `<h3>Welcome! 👋</h3><p>A keyboard has <b>white keys</b> and <b>black keys</b>. Look closely: the black keys come in <b>groups of 2</b> and <b>groups of 3</b>, again and again.</p><p>These groups are your <b>map</b> — they help you find every note without looking at labels.</p><p class="mini">Try pressing any keys now. Then tap <b>Next</b>.</p>` },
    { t: 'info', html: `<h3>Groups of 2 and 3</h3><p>The glowing keys are a <b>group of 2</b> (gold) and a <b>group of 3</b>. Notice the pattern repeats all the way across the keyboard.</p>`, keys: ['C#4', 'D#4', 'F#4', 'G#4', 'A#4'] },
    { t: 'tap', html: '<h3>Find the groups of 2</h3><p>Tap <b>every</b> black key that belongs to a <b>group of 2</b>.</p>', targets: () => allIn('C4', 'B5', pc => pc === 1 || pc === 3), hint: false },
    { t: 'tap', html: '<h3>Find the groups of 3</h3><p>Now tap every black key that belongs to a <b>group of 3</b>.</p>', targets: () => allIn('C4', 'B5', pc => [6, 8, 10].includes(pc)), hint: false }
  ] },
  { id: '1-2', title: 'Finding C, D and E', range: ['C4', 'B5'], steps: [
    { t: 'info', html: `<h3>Meet C</h3><p><b>C</b> is the white key just to the <b>LEFT of a group of 2</b> black keys.</p><p>C is the most important landmark on the keyboard. Every lesson starts from it!</p>`, keys: ['C4', 'C5'] },
    { t: 'tap', html: '<h3>Tap every C</h3><p>Find all the C keys (left of the 2 black keys).</p>', targets: () => allIn('C4', 'B5', pc => pc === 0), hint: false },
    { t: 'info', html: `<h3>D and E</h3><p><b>D</b> sits <b>between</b> the 2 black keys.<br><b>E</b> is just to the <b>right</b> of the 2 black keys.</p><p>So around every group of 2 you have: <b>C – D – E</b>.</p>`, keys: ['C4', 'D4', 'E4'] },
    { t: 'tap', html: '<h3>Tap every D</h3><p>D is in the middle of the 2 black keys.</p>', targets: () => allIn('C4', 'B5', pc => pc === 2), hint: false },
    { t: 'tap', html: '<h3>Tap every E</h3><p>E is to the right of the 2 black keys.</p>', targets: () => allIn('C4', 'B5', pc => pc === 4), hint: false },
    { t: 'tap', html: '<h3>Play C – D – E</h3><p>Play them in order: C, then D, then E.</p>', targets: ['C4', 'D4', 'E4'], order: true }
  ] },
  { id: '1-3', title: 'The Musical Alphabet', range: ['C4', 'B5'], steps: [
    { t: 'info', html: `<h3>Only 7 letters!</h3><p>Music uses just <b>A B C D E F G</b>. After G, it starts again at A.</p><p>Around the <b>group of 3</b> black keys you find <b>F – G – A – B</b>. F is the white key just left of the 3 black keys.</p>`, keys: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'] },
    { t: 'tap', html: '<h3>Tap every F</h3><p>F is left of the group of 3.</p>', targets: () => allIn('C4', 'B5', pc => pc === 5), hint: false },
    { t: 'tap', html: '<h3>Tap every G</h3>', targets: () => allIn('C4', 'B5', pc => pc === 7), hint: false },
    { t: 'tap', html: '<h3>Tap every A</h3>', targets: () => allIn('C4', 'B5', pc => pc === 9), hint: false },
    { t: 'tap', html: '<h3>Tap every B</h3><p>B is right of the group of 3 (just before the next C).</p>', targets: () => allIn('C4', 'B5', pc => pc === 11), hint: false },
    { t: 'tap', html: '<h3>The whole alphabet</h3><p>Play C D E F G A B in order, going right.</p>', targets: ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4'], order: true },
    { t: 'quiz', mode: 'name', title: 'Name → Key', pool: whiteRange('C4', 'B4'), count: 8 }
  ] },
  { id: '1-4', title: 'High, Low & Middle C', range: ['C3', 'C6'], steps: [
    { t: 'info', html: `<h3>Low and high</h3><p>Keys to the <b>left</b> sound <b>lower</b>. Keys to the <b>right</b> sound <b>higher</b>.</p><p>Tap <b>▶ Listen</b> to hear a low C and a high C.</p>`, demo: song('C3:2 C6:2'), keys: ['C3', 'C6'] },
    { t: 'info', html: `<h3>Octaves</h3><p>From one C to the next C is called an <b>octave</b> (8 white keys). Both are named C because they sound alike — one is just higher.</p><p class="mini">In this app, C keys show a number: C3, C4, C5… The number is the octave.</p>`, keys: ['C3', 'C4', 'C5', 'C6'], demo: song('C3:1 C4:1 C5:1 C6:2') },
    { t: 'tap', html: '<h3>Climb the octaves</h3><p>Play C3, C4, C5, C6 — from low to high.</p>', targets: ['C3', 'C4', 'C5', 'C6'], order: true },
    { t: 'info', html: `<h3>Middle C (C4)</h3><p><b>Middle C</b> is the C closest to the middle of a full piano. In music it is called <b>C4</b>.</p><p>Sit so that Middle C is in front of your belly button. Most beginner songs start here!</p>`, keys: ['C4'] },
    { t: 'tap', html: '<h3>Find Middle C</h3><p>Tap Middle C (C4).</p>', targets: ['C4'], hint: false },
    { t: 'choice', items: [
      { q: 'Which sounds higher?', opts: ['C3', 'C5'], a: 1, why: 'Further right = higher. C5 is to the right of C3.' },
      { q: 'How many different letter names does music use?', opts: ['5', '7', '12'], a: 1, why: 'A B C D E F G — seven letters that repeat.' },
      { q: 'Where is C?', opts: ['Left of the 2 black keys', 'Right of the 3 black keys', 'Between the 2 black keys'], a: 0 }
    ] }
  ] },
  { id: '1-5', title: 'Finger Numbers & Posture', range: ['C4', 'B5'], steps: [
    { t: 'info', html: `<h3>Your fingers have numbers</h3><p>On <b>both hands</b>: thumb = <b>1</b>, pointer = <b>2</b>, middle = <b>3</b>, ring = <b>4</b>, pinky = <b>5</b>.</p><p>In lessons, the number on a glowing key tells you which finger to use.</p>`, pic: HANDS_SVG },
    { t: 'choice', pic: HANDS_SVG, items: [
      { q: 'Which finger is number 1?', opts: ['Thumb', 'Pointer', 'Pinky'], a: 0 },
      { q: 'Which finger is number 5?', opts: ['Middle', 'Pinky', 'Ring'], a: 1 },
      { q: 'Which finger is number 3?', opts: ['Ring', 'Pointer', 'Middle'], a: 2 },
      { q: 'Do both hands use the same numbers?', opts: ['Yes — thumbs are 1 on both hands', 'No'], a: 0 }
    ] },
    { t: 'info', html: `<h3>Good posture</h3><ul><li>Sit tall, centered on <b>Middle C</b>, elbows a little in front of your body.</li><li>Curve your fingers like you're holding a small <b>ball</b> 🟠.</li><li>Play with the <b>fingertips</b>, keep the wrist relaxed and level.</li><li>Short daily practice (10–15 min) beats one long session.</li></ul><p class="mini">On a phone or tablet: use the pad of your fingertip and press firmly in the middle of the key.</p>` }
  ] }
] },

/* ================= STAGE 2 ================= */
{ id: 's2', icon: '🎵', title: 'First Melodies', desc: 'C position with the right and left hand. Your first songs!', lessons: [
  { id: '2-1', title: 'Right Hand C Position', range: ['C4', 'C5'], steps: [
    { t: 'info', html: `<h3>C position (right hand)</h3><p>Put your <b>right thumb (1) on Middle C</b>. Each finger gets its own key:</p><p><b>C=1 · D=2 · E=3 · F=4 · G=5</b></p><p>Keep your hand still — the fingers do the moving.</p>`, keys: ['C4', 'D4', 'E4', 'F4', 'G4'], fingers: [1, 2, 3, 4, 5], demo: song(SONGS.cUpDown) },
    { t: 'song', title: 'Up and down', html: '<h3>Five-finger warm-up</h3><p>Play up and back down. Use the finger number shown on each key.</p>', notes: SONGS.cUpDown, bpm: 90 },
    { t: 'song', title: 'Mary Had a Little Lamb', html: '<h3>🐑 Mary Had a Little Lamb</h3><p>Your first song! It uses only C, D, E and G.</p>', notes: SONGS.mary, bpm: 100 }
  ] },
  { id: '2-2', title: 'Hot Cross Buns', range: ['C4', 'C5'], steps: [
    { t: 'info', html: `<h3>Faster notes</h3><p>Some notes are <b>quicker</b> than others. In this song, the four C's and four D's are twice as fast. Tap <b>▶ Listen</b> to hear the rhythm.</p>`, demo: song(SONGS.hotCross), demoBpm: 100 },
    { t: 'song', title: 'Hot Cross Buns', html: '<h3>🥯 Hot Cross Buns</h3>', notes: SONGS.hotCross, bpm: 100 }
  ] },
  { id: '2-3', title: 'Ode to Joy', range: ['C4', 'C5'], steps: [
    { t: 'info', html: `<h3>Beethoven's Ode to Joy</h3><p>A famous melody written by Beethoven — and it fits perfectly in C position! Listen first.</p>`, demo: song(SONGS.ode), demoBpm: 110 },
    { t: 'song', title: 'Ode to Joy', html: '<h3>🎼 Ode to Joy</h3>', notes: SONGS.ode, bpm: 110 }
  ] },
  { id: '2-4', title: 'Jingle Bells 🎄', range: ['C4', 'C5'], steps: [
    { t: 'info', html: `<h3>Jingle Bells</h3><p>Perfect for the Christmas season! Same C position: C=1 D=2 E=3 F=4 G=5.</p><p class="mini">Tip: for repeated notes, lift and press the same finger again.</p>`, demo: song(SONGS.jingle), demoBpm: 120 },
    { t: 'song', title: 'Jingle Bells', html: '<h3>🔔 Jingle Bells</h3>', notes: SONGS.jingle, bpm: 120 }
  ] },
  { id: '2-5', title: 'Left Hand C Position', range: ['C3', 'C5'], steps: [
    { t: 'info', html: `<h3>Now the left hand</h3><p>Put your <b>left pinky (5) on the C below Middle C (C3)</b>.</p><p><b>C=5 · D=4 · E=3 · F=2 · G=1</b> — the numbers go backwards, because the thumb is on the right side of your left hand.</p>`, keys: ['C3', 'D3', 'E3', 'F3', 'G3'], fingers: [5, 4, 3, 2, 1] },
    { t: 'song', title: 'Left hand warm-up', html: '<h3>Left-hand warm-up</h3>', notes: SONGS.lhUpDown, bpm: 90 },
    { t: 'song', title: 'Mary (left hand)', html: '<h3>🐑 Mary — left hand</h3><p>Same song, one octave lower, with the left hand.</p>', notes: SONGS.maryLH, bpm: 100 }
  ] },
  { id: '2-6', title: 'Twinkle Twinkle', range: ['C4', 'C5'], steps: [
    { t: 'info', html: `<h3>Stretching to A</h3><p>Twinkle Twinkle reaches up to <b>A</b>. Play C with 1, then stretch: G with 4 and A with 5.</p><p class="mini">Follow the finger numbers — they show where the hand moves.</p>`, keys: ['C4', 'G4', 'A4'], fingers: [1, 4, 5], demo: song(SONGS.twinkle), demoBpm: 110 },
    { t: 'song', title: 'Twinkle Twinkle Little Star', html: '<h3>⭐ Twinkle Twinkle</h3>', notes: SONGS.twinkle, bpm: 110 }
  ] }
] },

/* ================= STAGE 3 ================= */
{ id: 's3', icon: '📖', title: 'Reading Notes: Treble Clef', desc: 'The staff, line notes, space notes — and sight-reading.', lessons: [
  { id: '3-1', title: 'The Staff', range: ['C4', 'C6'], steps: [
    { t: 'info', html: `<h3>The staff</h3><p>Music is written on a <b>staff</b>: <b>5 lines</b> and the <b>4 spaces</b> between them.</p><p>Notes higher on the staff sound <b>higher</b>. Each line and space is the next letter: line, space, line, space…</p>`, staff: { clef: 'treble', items: song('E4:1 F4:1 G4:1 A4:1 B4:1 C5:1 D5:1 E5:1 F5:1'), names: true }, demo: song('E4:1 F4:1 G4:1 A4:1 B4:1 C5:1 D5:1 E5:1 F5:2') },
    { t: 'info', html: `<h3>The treble clef 𝄞</h3><p>This symbol is the <b>treble clef</b> (also called the <b>G clef</b>). Its curl wraps around the <b>2nd line</b> — that line is <b>G</b> (the G above Middle C).</p><p>The treble clef is usually for the <b>right hand</b>.</p>`, staff: { clef: 'treble', items: song('G4:4'), names: true }, keys: ['G4'] },
    { t: 'tap', html: '<h3>Play the G</h3><p>Press the G shown on the staff.</p>', targets: ['G4'], staff: { clef: 'treble', items: song('G4:4') } },
    { t: 'choice', items: [
      { q: 'Is this note on a LINE or in a SPACE?', staff: { clef: 'treble', items: song('B4:4') }, opts: ['Line', 'Space'], a: 0 },
      { q: 'Is this note on a LINE or in a SPACE?', staff: { clef: 'treble', items: song('A4:4') }, opts: ['Line', 'Space'], a: 1 },
      { q: 'Is this note on a LINE or in a SPACE?', staff: { clef: 'treble', items: song('E5:4') }, opts: ['Line', 'Space'], a: 1 },
      { q: 'How many lines does a staff have?', opts: ['4', '5', '6'], a: 1 }
    ] }
  ] },
  { id: '3-2', title: 'Line Notes: E G B D F', range: ['C4', 'C6'], steps: [
    { t: 'info', html: `<h3>Every Good Boy Does Fine</h3><p>The 5 lines of the treble staff, from bottom to top, are:</p><p class="bigname" style="font-size:34px">E · G · B · D · F</p><p>Remember: <b>E</b>very <b>G</b>ood <b>B</b>oy <b>D</b>oes <b>F</b>ine.</p>`, staff: { clef: 'treble', items: song('E4:2 G4:2 B4:2 D5:2 F5:2'), names: true }, keys: TREBLE_LINES, demo: song('E4:1 G4:1 B4:1 D5:1 F5:2') },
    { t: 'quiz', mode: 'read', clef: 'treble', pool: TREBLE_LINES, count: 10 }
  ] },
  { id: '3-3', title: 'Space Notes: F A C E', range: ['C4', 'C6'], steps: [
    { t: 'info', html: `<h3>The spaces spell FACE</h3><p>The 4 spaces, from bottom to top:</p><p class="bigname" style="font-size:34px">F · A · C · E</p><p>Easy — it spells the word <b>FACE</b> 🙂</p>`, staff: { clef: 'treble', items: song('F4:2 A4:2 C5:2 E5:2'), names: true }, keys: TREBLE_SPACES, demo: song('F4:1 A4:1 C5:1 E5:2') },
    { t: 'quiz', mode: 'read', clef: 'treble', pool: TREBLE_SPACES, count: 8 },
    { t: 'quiz', mode: 'read', clef: 'treble', title: 'Lines + spaces mixed', pool: [...TREBLE_LINES, ...TREBLE_SPACES], count: 10 }
  ] },
  { id: '3-4', title: 'Middle C & Ledger Lines', range: ['C4', 'C6'], steps: [
    { t: 'info', html: `<h3>Below the staff</h3><p>Notes can go below or above the staff using short extra lines called <b>ledger lines</b>.</p><p><b>Middle C</b> sits on one ledger line <b>below</b> the treble staff. <b>D</b> hangs just under the bottom line. And <b>G5</b> sits just on top.</p>`, staff: { clef: 'treble', items: song('C4:2 D4:2 E4:2 G5:2 A5:2'), names: true }, keys: ['C4', 'D4', 'A5'] },
    { t: 'quiz', mode: 'read', clef: 'treble', title: 'Read C4 to A5', pool: whiteRange('C4', 'A5'), count: 12 }
  ] },
  { id: '3-5', title: 'Sight-Reading', range: ['C4', 'C5'], steps: [
    { t: 'info', html: `<h3>Read, don't look!</h3><p>Now the keyboard <b>won't glow</b>. Read each note on the staff and find it yourself.</p><p class="mini">Stuck? Tap 💡 Hint (it costs a star point).</p>` },
    { t: 'song', title: 'Au Clair de la Lune', html: '<h3>🌙 Au Clair de la Lune</h3><p>A French folk song. Read the notes!</p>', notes: SONGS.clair, bpm: 100, hint: false },
    { t: 'song', title: 'Lightly Row', html: '<h3>🚣 Lightly Row</h3><p>Starts on G (top of your C position).</p>', notes: SONGS.lightly, bpm: 100, hint: false },
    { t: 'song', title: 'Ode to Joy (reading)', html: '<h3>🎼 Ode to Joy — read it</h3>', notes: SONGS.ode, bpm: 110, hint: false }
  ] }
] },

/* ================= STAGE 4 ================= */
{ id: 's4', icon: '🎼', title: 'Bass Clef & Grand Staff', desc: 'Reading low notes for the left hand, then both staves together.', lessons: [
  { id: '4-1', title: 'Bass Clef Lines', range: ['F2', 'C4'], steps: [
    { t: 'info', html: `<h3>The bass clef</h3><p>The <b>bass clef</b> (F clef) is for <b>low notes</b> — usually the <b>left hand</b>. Its two dots surround the <b>4th line</b>, which is <b>F</b> (F3).</p>`, staff: { clef: 'bass', items: song('F3:4'), names: true }, keys: ['F3'] },
    { t: 'info', html: `<h3>Good Boys Do Fine Always</h3><p>The 5 bass lines, bottom to top:</p><p class="bigname" style="font-size:34px">G · B · D · F · A</p><p><b>G</b>ood <b>B</b>oys <b>D</b>o <b>F</b>ine <b>A</b>lways.</p>`, staff: { clef: 'bass', items: song('G2:2 B2:2 D3:2 F3:2 A3:2'), names: true }, keys: BASS_LINES, demo: song('G2:1 B2:1 D3:1 F3:1 A3:2') },
    { t: 'quiz', mode: 'read', clef: 'bass', pool: BASS_LINES, count: 10 }
  ] },
  { id: '4-2', title: 'Bass Clef Spaces', range: ['F2', 'C4'], steps: [
    { t: 'info', html: `<h3>All Cows Eat Grass</h3><p>The 4 bass spaces, bottom to top:</p><p class="bigname" style="font-size:34px">A · C · E · G</p><p><b>A</b>ll <b>C</b>ows <b>E</b>at <b>G</b>rass 🐄</p>`, staff: { clef: 'bass', items: song('A2:2 C3:2 E3:2 G3:2'), names: true }, keys: BASS_SPACES, demo: song('A2:1 C3:1 E3:1 G3:2') },
    { t: 'quiz', mode: 'read', clef: 'bass', pool: BASS_SPACES, count: 8 },
    { t: 'quiz', mode: 'read', clef: 'bass', title: 'Bass notes mixed', pool: whiteRange('G2', 'C4'), count: 12 }
  ] },
  { id: '4-3', title: 'The Grand Staff', range: ['C3', 'C5'], steps: [
    { t: 'info', html: `<h3>The grand staff</h3><p>Piano music uses <b>both</b> staves joined by a brace: treble on top (right hand), bass below (left hand).</p><p><b>Middle C</b> sits right between them — on a ledger line under the treble staff or above the bass staff. Same key!</p>`, staff: { clef: 'grand', items: [{ n: ['C4'], d: 4, st: 0 }, { n: ['C4'], d: 4, st: 1 }, { n: ['G4', 'C3'], d: 4 }], names: true }, keys: ['C4'] },
    { t: 'quiz', mode: 'read', clef: 'grand', title: 'Read the grand staff', pool: whiteRange('C3', 'C5'), count: 14 },
    { t: 'song', title: 'Mary (left hand, reading)', html: '<h3>🐑 Read the bass clef</h3><p>Left hand C position. No glowing keys!</p>', notes: SONGS.maryLH, bpm: 100, hint: false, clef: 'bass' }
  ] }
] },

/* ================= STAGE 5 ================= */
{ id: 's5', icon: '🥁', title: 'Rhythm & Writing Music', desc: 'Beats, note values, rests, time signatures — then write your first music.', lessons: [
  { id: '5-1', title: 'Beat & Note Values', range: ['C4', 'C5'], steps: [
    { t: 'info', html: `<h3>The beat</h3><p>The <b>beat</b> is the steady pulse of music — like a heartbeat or a clock ticking. Note shapes tell you how many beats to hold each note:</p><ul><li><b>Whole note</b> (hollow, no stem) = <b>4</b> beats</li><li><b>Half note</b> (hollow + stem) = <b>2</b> beats</li><li><b>Quarter note</b> (filled + stem) = <b>1</b> beat</li><li><b>Eighth note</b> (filled + flag) = <b>½</b> beat</li></ul>`, staff: { clef: 'treble', items: song('B4:4 B4:2 B4:1 B4:.5') }, demo: song('C5:4 C5:2 C5:1 C5:.5 C5:.5'), demoBpm: 80 },
    { t: 'choice', items: [
      { q: 'How many beats?', staff: { clef: 'treble', items: song('B4:2') }, opts: ['1', '2', '4'], a: 1 },
      { q: 'How many beats?', staff: { clef: 'treble', items: song('B4:1') }, opts: ['1', '2', '½'], a: 0 },
      { q: 'How many beats?', staff: { clef: 'treble', items: song('B4:4') }, opts: ['2', '3', '4'], a: 2 },
      { q: 'How many beats?', staff: { clef: 'treble', items: song('B4:.5') }, opts: ['½', '1', '2'], a: 0 },
      { q: 'Two eighth notes equal…', opts: ['a quarter note', 'a half note', 'a whole note'], a: 0 }
    ] },
    { t: 'rhythm', html: '<h3>Tap the quarter notes</h3><p>Tap <b>▶ Listen</b>, then <b>Start</b>. After 4 count-in clicks, tap the big pad (or any key) on each note.</p>', pattern: [1, 1, 1, 1, 1, 1, 1, 1], bpm: 80 }
  ] },
  { id: '5-2', title: 'Halves & Wholes', range: ['C4', 'C5'], steps: [
    { t: 'info', html: `<h3>Holding notes</h3><p>A half note lasts <b>2 beats</b>: tap once, then keep counting “1-2”. A whole note lasts <b>4 beats</b>: “1-2-3-4”.</p><p class="mini">Count out loud — it really helps!</p>` },
    { t: 'rhythm', html: '<h3>Quarters & halves</h3>', pattern: [1, 1, 2, 1, 1, 2], bpm: 80 },
    { t: 'rhythm', html: '<h3>Wholes, halves & quarters</h3>', pattern: [4, 2, 2, 1, 1, 2], bpm: 84 }
  ] },
  { id: '5-3', title: 'Rests', range: ['C4', 'C5'], steps: [
    { t: 'info', html: `<h3>Rests = silence</h3><p>A <b>rest</b> means “don't play” for a number of beats. Each note value has a matching rest: whole rest (4), half rest (2), quarter rest (1), eighth rest (½).</p><p class="mini">Silence is part of music too!</p>`, staff: { clef: 'treble', items: song('R:4 R:2 R:1 R:.5') } },
    { t: 'choice', items: [
      { q: 'What does a rest mean?', opts: ['Play loudly', 'Be silent', 'Hold the note'], a: 1 },
      { q: 'How many beats is this rest?', staff: { clef: 'treble', items: song('R:1') }, opts: ['1', '2', '4'], a: 0 },
      { q: 'Which rest hangs DOWN from a line?', staff: { clef: 'treble', items: song('R:4 R:2') }, opts: ['The first one (whole rest)', 'The second one (half rest)'], a: 0, why: 'Whole rest hangs like a hole; half rest sits like a hat.' }
    ] },
    { t: 'rhythm', html: '<h3>Notes and rests</h3><p>Don’t tap on the rests!</p>', pattern: [1, -1, 1, -1, 1, 1, 2], bpm: 80 }
  ] },
  { id: '5-4', title: 'Time Signatures & Measures', range: ['C4', 'C5'], steps: [
    { t: 'info', html: `<h3>Time signature</h3><p>The two numbers at the start are the <b>time signature</b>.</p><ul><li><b>Top</b> number = beats in each measure</li><li><b>Bottom 4</b> = the quarter note gets 1 beat</li></ul><p><b>Bar lines</b> split music into <b>measures</b>. In 4/4 every measure has 4 beats; in 3/4 (waltz) it has 3.</p>`, staff: { clef: 'treble', ts: [3, 4], items: song('C5:2 B4:1 A4:1 G4:1 F4:1 E4:3') } },
    { t: 'choice', items: [
      { q: 'How many beats in each measure of 3/4?', opts: ['2', '3', '4'], a: 1 },
      { q: 'How many quarter notes fit in one measure of 4/4?', opts: ['3', '4', '8'], a: 1 },
      { q: 'What separates measures?', opts: ['Bar lines', 'Ledger lines', 'Clefs'], a: 0 }
    ] },
    { t: 'rhythm', html: '<h3>A waltz in 3/4</h3><p>Feel “ONE two three”.</p>', pattern: [2, 1, 1, 1, 1, 3], ts: [3, 4], bpm: 90 }
  ] },
  { id: '5-5', title: 'Eighths, Dots & Ties', range: ['C4', 'C5'], steps: [
    { t: 'info', html: `<h3>Eighth notes</h3><p>Two eighth notes fit in one beat. Count “<b>1-and 2-and</b>”.</p><h3>Dotted notes</h3><p>A <b>dot</b> adds half the note's value: dotted half = 3 beats, dotted quarter = 1½ beats.</p><h3>Ties</h3><p>A curved <b>tie</b> joins two notes of the same pitch — play once and hold for both.</p>`, staff: { clef: 'treble', items: song('B4:.5 B4:.5 B4:1 B4:3 B4:1.5 B4:.5') } },
    { t: 'rhythm', html: '<h3>Eighth notes</h3>', pattern: [.5, .5, 1, .5, .5, 1, 1, 1, 2], bpm: 76 },
    { t: 'rhythm', html: '<h3>Dotted quarter + eighth</h3><p>Like the “Ode to Joy” rhythm.</p>', pattern: [1.5, .5, 1, 1, 1.5, .5, 2], bpm: 76 }
  ] },
  { id: '5-6', title: 'Write Your First Music ✍️', range: ['C4', 'C5'], steps: [
    { t: 'info', html: `<h3>Note Studio basics</h3><p>Now <b>you</b> write the notes!</p><ol><li>Pick a note length from the toolbar (whole, half, quarter, eighth).</li><li>Press a key — the note appears on the staff.</li><li>Made a mistake? Tap <b>⌫</b> or <b>↶</b> undo.</li><li>Tap <b>▶ Play</b> to hear what you wrote.</li></ol>` },
    { t: 'compose', html: '<h3>Write C D E F G</h3><p>Write <b>C D E F G</b> as <b>quarter notes</b>, starting on Middle C. Then tap <b>Check</b>.</p>', goal: 'seq', want: ['C4', 'D4', 'E4', 'F4', 'G4'], d: 1 },
    { t: 'compose', html: '<h3>Fill one measure</h3><p>Fill <b>one measure of 4/4</b> — exactly <b>4 beats</b> — using any notes and lengths you like (try a half note + two quarters!). Then <b>Check</b>.</p>', goal: 'beats', beats: 4, minItems: 2 }
  ] }
] },

/* ================= STAGE 6 ================= */
{ id: 's6', icon: '♯', title: 'Sharps, Flats & Scales', desc: 'Half steps, black-key names, major and minor scales, key signatures.', lessons: [
  { id: '6-1', title: 'Half Steps & Whole Steps', range: ['C4', 'C6'], steps: [
    { t: 'info', html: `<h3>Half step</h3><p>A <b>half step</b> is the distance to the very <b>next key</b> — black or white — with nothing in between. E→F and B→C are half steps with no black key between them.</p><h3>Whole step</h3><p>A <b>whole step</b> = two half steps (skip one key). C→D is a whole step.</p>`, keys: ['E4', 'F4', 'B4', 'C5'] },
    { t: 'tap', html: '<h3>Half step up from E</h3><p>Play the key a half step above E4.</p>', targets: ['F4'], hint: false, keys: ['E4'] },
    { t: 'tap', html: '<h3>Half step up from C</h3><p>Play the key a half step above C4 (it’s a black key!).</p>', targets: ['C#4'], hint: false, keys: ['C4'] },
    { t: 'tap', html: '<h3>Whole step up from F</h3><p>Play the key a whole step above F4.</p>', targets: ['G4'], hint: false, keys: ['F4'] },
    { t: 'choice', items: [
      { q: 'E to F is a…', opts: ['Half step', 'Whole step'], a: 0 },
      { q: 'D to E is a…', opts: ['Half step', 'Whole step'], a: 1 },
      { q: 'How many half steps make a whole step?', opts: ['1', '2', '3'], a: 1 }
    ] }
  ] },
  { id: '6-2', title: 'Sharps & Flats', range: ['C4', 'C6'], steps: [
    { t: 'info', html: `<h3>♯ Sharp and ♭ Flat</h3><p>A <b>sharp ♯</b> raises a note a half step (to the right). A <b>flat ♭</b> lowers it a half step (to the left). A <b>natural ♮</b> cancels them.</p><p>So each black key has <b>two names</b>: the key between C and D is <b>C♯</b> or <b>D♭</b>.</p>`, staff: { clef: 'treble', items: song('C#4:2 Db4:2 F#4:2 Bb4:2'), names: true }, keys: ['C#4', 'F#4', 'A#4'] },
    { t: 'tap', html: '<h3>Find the black keys</h3><p>Play <b>F♯</b>, then <b>B♭</b>, then <b>C♯</b>, then <b>E♭</b> (around the middle).</p>', targets: ['F#4', 'Bb4', 'C#5', 'Eb5'], order: true, hint: false, pc: true },
    { t: 'quiz', mode: 'read', clef: 'treble', title: 'Read sharps & flats', pool: ['F#4', 'Bb4', 'C#5', 'Eb4', 'G#4', 'Ab4', 'Db5', 'F#5'], count: 10 }
  ] },
  { id: '6-3', title: 'The C Major Scale', range: ['C3', 'C5'], steps: [
    { t: 'info', html: `<h3>Major scale formula</h3><p>A <b>major scale</b> is 8 notes following this pattern of steps:</p><p class="bigname" style="font-size:28px">W W H W W W H</p><p>C major uses <b>only white keys</b>: C D E F G A B C.</p><p><b>Thumb-under:</b> play C-D-E with 1-2-3, then tuck your <b>thumb under</b> to play F, and continue 2-3-4-5.</p>`, keys: whiteRange('C4', 'C5'), fingers: [1, 2, 3, 1, 2, 3, 4, 5], demo: song(SONGS.cScale) },
    { t: 'song', title: 'C major — right hand', html: '<h3>C major scale (RH)</h3><p>Watch the thumb-under on F!</p>', notes: SONGS.cScale, bpm: 100 },
    { t: 'song', title: 'C major — left hand', html: '<h3>C major scale (LH)</h3><p>Left hand: 5-4-3-2-1, then finger 3 crosses <b>over</b> the thumb to A.</p>', notes: SONGS.cScaleLH, bpm: 100 }
  ] },
  { id: '6-4', title: 'G Major & F Major', range: ['C4', 'C6'], steps: [
    { t: 'info', html: `<h3>G major has one sharp</h3><p>Start the formula on G: G A B C D E <b>F♯</b> G. To keep the W-W-H pattern we need <b>F♯</b>.</p>`, staff: { clef: 'treble', items: song('G4:1 A4:1 B4:1 C5:1 D5:1 E5:1 F#5:1 G5:1'), names: true }, demo: song(SONGS.gScale) },
    { t: 'song', title: 'G major scale', html: '<h3>G major (RH)</h3>', notes: SONGS.gScale, bpm: 100 },
    { t: 'info', html: `<h3>F major has one flat</h3><p>Start on F: F G A <b>B♭</b> C D E F. Fingering is different: 1-2-3-<b>4</b> on B♭, then thumb under to C.</p>`, staff: { clef: 'treble', items: song('F4:1 G4:1 A4:1 Bb4:1 C5:1 D5:1 E5:1 F5:1'), names: true }, demo: song(SONGS.fScale) },
    { t: 'song', title: 'F major scale', html: '<h3>F major (RH)</h3>', notes: SONGS.fScale, bpm: 100 }
  ] },
  { id: '6-5', title: 'Key Signatures', range: ['C4', 'C6'], steps: [
    { t: 'info', html: `<h3>Key signatures</h3><p>Instead of writing ♯ or ♭ on every note, music puts them once at the start of each line — the <b>key signature</b>.</p><ul><li>No sharps or flats → <b>C major</b></li><li>1 sharp (F♯) → <b>G major</b></li><li>1 flat (B♭) → <b>F major</b></li><li>2 sharps (F♯ C♯) → <b>D major</b></li></ul><p class="mini">Rule: with a key signature of F♯, <b>every</b> F is played as F♯.</p>` },
    { t: 'choice', items: [
      { q: 'A key signature with one sharp (F♯) is…', opts: ['C major', 'G major', 'F major'], a: 1 },
      { q: 'A key signature with one flat (B♭) is…', opts: ['F major', 'D major', 'G major'], a: 0 },
      { q: 'C major has…', opts: ['1 sharp', 'No sharps or flats', '1 flat'], a: 1 },
      { q: 'In G major, every F is played as…', opts: ['F', 'F♯', 'F♭'], a: 1 }
    ] }
  ] },
  { id: '6-6', title: 'The Minor Scale', range: ['C4', 'C6'], steps: [
    { t: 'info', html: `<h3>A minor — the sad sister</h3><p>Play the white keys from <b>A to A</b> and you get the <b>A natural minor</b> scale. It uses the same keys as C major, so A minor is C major's <b>relative minor</b>.</p><p>Minor scales often sound <b>sad or serious</b>; major scales sound <b>happy or bright</b>. Listen!</p>`, demo: song('C4:.5 D4:.5 E4:.5 F4:.5 G4:.5 A4:.5 B4:.5 C5:1 R:1 A4:.5 B4:.5 C5:.5 D5:.5 E5:.5 F5:.5 G5:.5 A5:1'), demoBpm: 90 },
    { t: 'song', title: 'A minor scale', html: '<h3>A natural minor (RH)</h3>', notes: SONGS.aMinor, bpm: 100 }
  ] },
  { id: '6-7', title: 'Write a Scale ✍️', range: ['C4', 'C6'], steps: [
    { t: 'compose', html: '<h3>Write the G major scale</h3><p>Write 8 quarter notes from <b>G4 up to G5</b>. Don’t forget the <b>F♯</b> (press the black key)!</p>', goal: 'seq', want: ['G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F#5', 'G5'], d: 1 }
  ] }
] },

/* ================= STAGE 7 ================= */
{ id: 's7', icon: '🎶', title: 'Chords', desc: 'Triads, major vs minor, I–IV–V, inversions, the pop progression, 7ths.', lessons: [
  { id: '7-1', title: 'What is a Chord?', range: ['C4', 'C6'], steps: [
    { t: 'info', html: `<h3>Triads</h3><p>A <b>chord</b> is 3 or more notes played together. The basic chord is a <b>triad</b>: the <b>root</b>, the <b>3rd</b>, and the <b>5th</b>.</p><p>Easy trick: play a white key, <b>skip one</b>, play the next, <b>skip one</b>, play the next. C–E–G = <b>C major</b>. Use fingers <b>1-3-5</b>.</p>`, keys: ['C4', 'E4', 'G4'], fingers: [1, 3, 5], staff: { clef: 'treble', items: song('C4+E4+G4:4'), names: true }, demo: [{ n: ['C4', 'E4', 'G4'], d: 3 }] },
    { t: 'chord', html: '<h3>Play the chords</h3><p>Press <b>all the glowing keys together</b>.</p>', items: [{ name: 'C', n: ['C4', 'E4', 'G4'], f: [1, 3, 5] }, { name: 'F', n: ['F4', 'A4', 'C5'], f: [1, 3, 5] }, { name: 'G', n: ['G4', 'B4', 'D5'], f: [1, 3, 5] }, { name: 'C', n: ['C4', 'E4', 'G4'], f: [1, 3, 5] }] }
  ] },
  { id: '7-2', title: 'Major vs Minor', range: ['C4', 'C6'], steps: [
    { t: 'info', html: `<h3>Major 😊 vs minor 😢</h3><p>To turn a major chord into a <b>minor</b> chord, lower the <b>middle note (the 3rd)</b> by a half step.</p><p>C major = C E G → <b>C minor = C E♭ G</b>. Listen to the difference!</p>`, keys: ['C4', 'Eb4', 'G4'], demo: [{ n: ['C4', 'E4', 'G4'], d: 2 }, { n: [], d: .5 }, { n: ['C4', 'Eb4', 'G4'], d: 2 }], demoBpm: 70 },
    { t: 'chord', html: '<h3>Major and minor chords</h3><p>Hear how each one feels.</p>', items: [{ name: 'C', n: ['C4', 'E4', 'G4'], f: [1, 3, 5] }, { name: 'Cm', n: ['C4', 'Eb4', 'G4'], f: [1, 3, 5] }, { name: 'Am', n: ['A4', 'C5', 'E5'], f: [1, 3, 5] }, { name: 'Dm', n: ['D4', 'F4', 'A4'], f: [1, 3, 5] }, { name: 'Em', n: ['E4', 'G4', 'B4'], f: [1, 3, 5] }, { name: 'D', n: ['D4', 'F#4', 'A4'], f: [1, 3, 5] }] },
    { t: 'choice', items: [
      { q: 'To make a minor chord from a major chord, you lower…', opts: ['the root', 'the 3rd', 'the 5th'], a: 1 },
      { q: 'Which notes make C major?', opts: ['C E G', 'C D E', 'C F A'], a: 0 },
      { q: 'A – C – E is…', opts: ['A major', 'A minor'], a: 1 }
    ] }
  ] },
  { id: '7-3', title: 'Primary Chords: I – IV – V', range: ['A3', 'C5'], steps: [
    { t: 'info', html: `<h3>The 3 most important chords</h3><p>In C major, the chords built on the 1st, 4th and 5th notes are <b>C (I)</b>, <b>F (IV)</b> and <b>G (V)</b>. Thousands of songs use only these three!</p><p>Pro trick: instead of jumping, move as little as possible. F becomes <b>C-F-A</b> and G becomes <b>B-D-G</b> (inversions).</p>`, demo: song(SONGS.primary), demoBpm: 90 },
    { t: 'song', title: 'I – IV – V – I', html: '<h3>I – IV – V – I in C</h3><p>Press each chord together. Smooth hand movement!</p>', notes: SONGS.primary, bpm: 90 }
  ] },
  { id: '7-4', title: 'Inversions', range: ['C4', 'C6'], steps: [
    { t: 'info', html: `<h3>Same chord, different order</h3><p>An <b>inversion</b> uses the same notes with a different note on the bottom.</p><ul><li><b>Root position:</b> C-E-G</li><li><b>1st inversion:</b> E-G-C</li><li><b>2nd inversion:</b> G-C-E</li></ul><p>All three are still a C chord!</p>`, staff: { clef: 'treble', items: song('C4+E4+G4:2 E4+G4+C5:2 G4+C5+E5:2'), names: false } },
    { t: 'chord', html: '<h3>Play the inversions</h3>', items: [{ name: 'C (root)', n: ['C4', 'E4', 'G4'], f: [1, 3, 5] }, { name: 'C/E (1st inv.)', n: ['E4', 'G4', 'C5'], f: [1, 2, 5] }, { name: 'C/G (2nd inv.)', n: ['G4', 'C5', 'E5'], f: [1, 3, 5] }, { name: 'C (octave up)', n: ['C5', 'E5', 'G5'], f: [1, 3, 5] }] }
  ] },
  { id: '7-5', title: 'The Pop Progression', range: ['F2', 'C5'], steps: [
    { t: 'info', html: `<h3>C – G – Am – F</h3><p>These four chords (<b>I – V – vi – IV</b>) are in a huge number of pop and worship songs. Learn them and you can accompany countless songs!</p>`, demo: song(SONGS.popRH), demoBpm: 90 },
    { t: 'song', title: 'Pop progression — right hand', html: '<h3>Right-hand chords</h3>', notes: SONGS.popRH, bpm: 90 },
    { t: 'song', title: 'Pop progression — both hands', html: '<h3>Add the bass!</h3><p>Left pinky plays the <b>root</b> of each chord low (C, G, A, F) while the right hand plays the chord. Press all together.</p>', notes: SONGS.popBoth, bpm: 80 }
  ] },
  { id: '7-6', title: 'Seventh Chords', range: ['G3', 'C6'], steps: [
    { t: 'info', html: `<h3>Add a 4th note</h3><p>Stack one more “skip” on a triad and you get a <b>7th chord</b> — richer, jazzier.</p><ul><li><b>G7</b> = G B D F (wants to go home to C)</li><li><b>Cmaj7</b> = C E G B (dreamy)</li><li><b>Am7</b> = A C E G (soft)</li></ul>`, demo: [{ n: ['G3', 'B3', 'D4', 'F4'], d: 2 }, { n: ['C4', 'E4', 'G4', 'B4'], d: 2 }, { n: ['A3', 'C4', 'E4', 'G4'], d: 2 }], demoBpm: 70 },
    { t: 'chord', html: '<h3>Play 7th chords</h3>', items: [{ name: 'G7', n: ['G3', 'B3', 'D4', 'F4'], f: [1, 2, 3, 5] }, { name: 'Cmaj7', n: ['C4', 'E4', 'G4', 'B4'], f: [1, 2, 3, 5] }, { name: 'Am7', n: ['A3', 'C4', 'E4', 'G4'], f: [1, 2, 3, 5] }, { name: 'Dm7', n: ['D4', 'F4', 'A4', 'C5'], f: [1, 2, 3, 5] }] }
  ] },
  { id: '7-7', title: 'Write a Chord ✍️', range: ['C4', 'C6'], steps: [
    { t: 'compose', html: '<h3>Write a C major chord</h3><p>Choose the <b>whole note</b>, then press <b>C, E and G together</b> to write them as one chord. Then <b>Check</b>.</p>', goal: 'chord', pcs: [0, 4, 7], d: 4 },
    { t: 'compose', html: '<h3>Write C – F – G – C</h3><p>Write four <b>whole-note chords</b>: C, F, G, C (any inversion). Press each chord’s keys together.</p>', goal: 'chords', want: [[0, 4, 7], [5, 9, 0], [7, 11, 2], [0, 4, 7]] }
  ] }
] },

/* ================= STAGE 8 ================= */
{ id: 's8', icon: '🏆', title: 'Both Hands & Going Pro', desc: 'Hands together, arpeggios, accompaniment, improvising, Für Elise.', lessons: [
  { id: '8-1', title: 'Hands Together', range: ['C3', 'C5'], steps: [
    { t: 'info', html: `<h3>Two hands, one brain</h3><p>Right hand plays the melody, left hand adds bass notes. Practice tips:</p><ul><li>Learn each hand alone first.</li><li>Go <b>slow</b> — the song waits for you.</li><li>Where both hands play together, press them at the same time.</li></ul>`, demo: song(SONGS.odeBoth), demoBpm: 100 },
    { t: 'song', title: 'Ode to Joy — hands together', html: '<h3>🎼 Ode to Joy with left hand</h3><p>LH: C3 (finger 5) and G3 (finger 1).</p>', notes: SONGS.odeBoth, bpm: 100 }
  ] },
  { id: '8-2', title: 'Arpeggios', range: ['C4', 'C6'], steps: [
    { t: 'info', html: `<h3>Broken chords</h3><p>An <b>arpeggio</b> plays the notes of a chord one after another — like a harp. Two octaves of C: 1-2-3, <b>thumb under</b>, 1-2-3-5.</p>`, demo: song(SONGS.arpeggio), demoBpm: 90 },
    { t: 'song', title: 'C arpeggio, 2 octaves', html: '<h3>C major arpeggio</h3>', notes: SONGS.arpeggio, bpm: 90 }
  ] },
  { id: '8-3', title: 'Alberti Bass', range: ['A2', 'C4'], steps: [
    { t: 'info', html: `<h3>A classic accompaniment</h3><p>The <b>Alberti bass</b> plays a chord as <b>low – high – middle – high</b>. Mozart used it all the time!</p><p>C chord: C-G-E-G. G chord: B-G-D-G.</p>`, demo: song(SONGS.alberti), demoBpm: 100 },
    { t: 'song', title: 'Alberti bass (LH)', html: '<h3>Alberti bass — left hand</h3>', notes: SONGS.alberti, bpm: 100 }
  ] },
  { id: '8-4', title: 'Improvise!', range: ['C4', 'C6'], steps: [
    { t: 'info', html: `<h3>No wrong notes</h3><p>The <b>C pentatonic scale</b> has only 5 notes: <b>C D E G A</b>. Any order sounds good — that’s why it's perfect for improvising.</p><p>Make up your own melody: repeat ideas, go up and down, end on C.</p>`, keys: notesOf('C4', 'C6', pc => [0, 2, 4, 7, 9].includes(pc)) },
    { t: 'improv', html: '<h3>Your turn — improvise!</h3><p>Play <b>40 notes</b> using only the glowing keys. Be creative! 🎨</p>', pcs: [0, 2, 4, 7, 9], count: 40, lo: 'C4', hi: 'C6' }
  ] },
  { id: '8-5', title: 'Circle of Fifths', range: ['C4', 'C6'], steps: [
    { t: 'info', html: `<h3>The map of all keys</h3><p>Going <b>clockwise</b>, each key is a 5th higher and adds <b>one sharp</b>: C (0) → G (1♯) → D (2♯) → A (3♯)…</p><p>Going <b>counter-clockwise</b> adds <b>one flat</b>: F (1♭) → B♭ (2♭) → E♭ (3♭)…</p><p>Pros use it to find chords, key signatures and progressions fast.</p>`, pic: CIRCLE_SVG },
    { t: 'choice', pic: CIRCLE_SVG, items: [
      { q: 'How many sharps does D major have?', opts: ['1', '2', '3'], a: 1 },
      { q: 'Which key has 2 flats?', opts: ['B♭ major', 'E♭ major', 'F major'], a: 0 },
      { q: 'Clockwise on the circle, each key goes up a…', opts: ['3rd', '4th', '5th'], a: 2 },
      { q: 'In the key of G, the I, IV and V chords are…', opts: ['G, C, D', 'G, A, B', 'C, F, G'], a: 0 }
    ] }
  ] },
  { id: '8-6', title: 'Für Elise — Pro Challenge', range: ['C4', 'G5'], steps: [
    { t: 'info', html: `<h3>🏆 Für Elise (Beethoven)</h3><p>One of the most famous piano pieces ever. This is the right-hand melody of the opening, in <b>3/8 time</b> (3 eighth notes per measure).</p><p>Watch the <b>D♯</b> — a black key — and the quick back-and-forth with fingers 5 and 4.</p>`, demo: song(SONGS.elise), demoBpm: 70 },
    { t: 'song', title: 'Für Elise (opening)', html: '<h3>Für Elise — with hints</h3>', notes: SONGS.elise, bpm: 70, ts: [3, 8], pickup: 1 },
    { t: 'song', title: 'Für Elise (reading)', html: '<h3>Für Elise — read it like a pro</h3><p>No glowing keys this time.</p>', notes: SONGS.elise, bpm: 70, ts: [3, 8], pickup: 1, hint: false }
  ] },
  { id: '8-7', title: 'Final: Compose Your Song ✍️', range: ['C3', 'C6'], steps: [
    { t: 'compose', html: '<h3>Compose a 4-measure melody</h3><p>Write <b>4 measures of 4/4</b> (16 beats). Use different note lengths, maybe a rest or a chord — and <b>end on a C</b> so it sounds finished. Then <b>Check</b>.</p>', goal: 'final', beats: 16 },
    { t: 'info', html: `<h3>🎓 Congratulations!</h3><p>You went from <b>zero</b> to reading both clefs, playing scales, chords, hands together and composing your own music.</p><p><b>Keep going like a pro:</b></p><ul><li>Daily: 5 min scales + 5 min reading drills (Practice tab).</li><li>Learn songs you love using the chord progressions you know.</li><li>Write a new piece in <b>Note Studio</b> every week.</li></ul>` }
  ] }
] }
];
const ALL_LESSONS = STAGES.flatMap(s => s.lessons.map(l => Object.assign(l, { stage: s })));
