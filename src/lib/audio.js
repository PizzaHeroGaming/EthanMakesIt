// Web Audio synthesis for SFX. All effects are oscillator + noise based — no external samples.

let _audioCtx = null;
let sfxMuted = false;

function _ctx() {
  if (!_audioCtx) _audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  if (_audioCtx.state === 'suspended') _audioCtx.resume();
  return _audioCtx;
}

function _tone(freq, type = 'sine', dur = 0.15, vol = 0.25, delay = 0) {
  if (sfxMuted) return;
  try {
    const ctx = _ctx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain); gain.connect(ctx.destination);
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + delay);
    gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + dur);
    osc.start(ctx.currentTime + delay);
    osc.stop(ctx.currentTime + delay + dur + 0.05);
  } catch (e) {}
}

function _noise(dur = 0.08, vol = 0.08, delay = 0) {
  if (sfxMuted) return;
  try {
    const ctx = _ctx();
    const buf = ctx.createBuffer(1, ctx.sampleRate * dur, ctx.sampleRate);
    const data = buf.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    const src = ctx.createBufferSource();
    src.buffer = buf;
    const gain = ctx.createGain();
    src.connect(gain); gain.connect(ctx.destination);
    gain.gain.setValueAtTime(vol, ctx.currentTime + delay);
    gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + delay + dur);
    src.start(ctx.currentTime + delay);
  } catch (e) {}
}

// Per-effect throttle so spam-fire SFX (cook/film/complete from many auto-loops)
// don't pile up into a wall of noise. Each entry: { gap, last }.
const _throttle = {
  complete: { gap: 350, last: 0 },
  cook:     { gap: 350, last: 0 },
  film:     { gap: 350, last: 0 },
  serve:    { gap: 200, last: 0 },
  miss:     { gap: 300, last: 0 },
};
function _throttled(name, fn) {
  const t = _throttle[name];
  if (!t) return fn();
  const now = Date.now();
  if (now - t.last < t.gap) return;
  t.last = now;
  fn();
}

export const SFX = {
  complete() { _throttled('complete', () => { _tone(523, 'sine', 0.13, 0.18); _tone(784, 'sine', 0.10, 0.13, 0.07); }); },
  cook() { _throttled('cook', () => { _noise(0.06, 0.12); _tone(220, 'sine', 0.12, 0.12, 0.02); _tone(330, 'triangle', 0.08, 0.1, 0.06); }); },
  film() { _throttled('film', () => { _noise(0.04, 0.18); _tone(1200, 'sine', 0.04, 0.08, 0.02); }); },
  serve() { _throttled('serve', () => { _tone(1047, 'square', 0.06, 0.12); _tone(1319, 'square', 0.05, 0.10, 0.05); _tone(1568, 'sine', 0.12, 0.18, 0.09); }); },
  miss() { _throttled('miss', () => { _tone(330, 'sine', 0.10, 0.12); _tone(220, 'sine', 0.12, 0.10, 0.08); _tone(165, 'sine', 0.10, 0.08, 0.16); }); },
  levelUp() { [523, 659, 784, 1047].forEach((f, i) => _tone(f, 'sine', 0.20, 0.28, i * 0.10)); _tone(1047, 'triangle', 0.30, 0.20, 0.42); },
  unlock() { _tone(880, 'sine', 0.10, 0.18); _tone(1100, 'sine', 0.14, 0.22, 0.07); _tone(1320, 'sine', 0.10, 0.16, 0.14); },
  milestone() { [523, 659, 784, 1047, 1319].forEach((f, i) => _tone(f, 'triangle', 0.22, 0.28, i * 0.08)); },
  upgrade() { _tone(600, 'sine', 0.08, 0.20); _tone(900, 'sine', 0.10, 0.22, 0.06); _tone(1200, 'sine', 0.08, 0.18, 0.13); },
  manager() { [440, 554, 659, 880].forEach((f, i) => _tone(f, 'sine', 0.16, 0.26, i * 0.07)); },
  viral() { [262, 330, 392, 523, 659, 784, 1047, 1319].forEach((f, i) => _tone(f, 'sine', 0.35, 0.30, i * 0.07)); [262, 330, 392, 523].forEach((f, i) => _tone(f, 'triangle', 0.40, 0.15, 0.60 + i * 0.07)); },
};

try { sfxMuted = localStorage.getItem('ethanMuted') === '1'; } catch (e) {}

export function toggleMute() {
  sfxMuted = !sfxMuted;
  try { localStorage.setItem('ethanMuted', sfxMuted ? '1' : '0'); } catch (e) {}
  const btn = document.getElementById('mute-btn');
  if (btn) btn.textContent = sfxMuted ? '🔇 Sounds Off' : '🔊 Sounds On';
}

export function isMuted() { return sfxMuted; }
