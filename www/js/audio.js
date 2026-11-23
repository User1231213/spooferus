let context = null;
let enabled = true;

export function setSoundEnabled(on) {
  enabled = on;
}

function ensureContext() {
  if (!context) {
    const Ctor = window.AudioContext || window.webkitAudioContext;
    if (!Ctor) return null;
    context = new Ctor();
  }
  if (context.state === "suspended") context.resume();
  return context;
}

function tone(freq, duration, { type = "triangle", volume = 0.12, delay = 0, slideTo = null } = {}) {
  if (!enabled) return;
  const ctx = ensureContext();
  if (!ctx) return;
  const start = ctx.currentTime + delay;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = type;
  osc.frequency.setValueAtTime(freq, start);
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, start + duration);
  gain.gain.setValueAtTime(volume, start);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  osc.connect(gain).connect(ctx.destination);
  osc.start(start);
  osc.stop(start + duration + 0.02);
}

export const sfx = {
  tap() {
    tone(620 + Math.random() * 120, 0.09, { slideTo: 880 });
  },
  buy() {
    tone(523, 0.12, { type: "square", volume: 0.06 });
    tone(784, 0.16, { type: "square", volume: 0.06, delay: 0.08 });
  },
  upgrade() {
    [523, 659, 784, 1046].forEach((f, i) => tone(f, 0.22, { delay: i * 0.09, volume: 0.1 }));
  },
  achievement() {
    [784, 988, 1175].forEach((f, i) => tone(f, 0.3, { type: "sine", delay: i * 0.12, volume: 0.1 }));
  },
  chapter() {
    [392, 523, 659, 784, 1046].forEach((f, i) => tone(f, 0.35, { type: "sine", delay: i * 0.12, volume: 0.12 }));
  },
  error() {
    tone(180, 0.16, { type: "sawtooth", volume: 0.05 });
  },
};
