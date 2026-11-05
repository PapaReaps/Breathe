import { isNativeApp } from "./platform";

/*
 * Optional sounds and vibration when a button is tapped (App options). Both start "Off".
 *
 * The sounds are made here, from a few lines of code, with the browser's own Web Audio:
 * there are no sound files and nothing is fetched. They play at the phone's media volume.
 * Vibration uses the phone's own vibration (Capacitor Haptics in the Android app, or the
 * browser's vibration where it has one). iPhones and computers don't allow it on websites.
 */

export const CLICK_SOUNDS = [
  "off", "tap", "click", "wood", "pebble", "bubble", "drop", "pop", "marimba", "chime", "breath", "tick", "heartbeat",
] as const;
export type ClickSound = (typeof CLICK_SOUNDS)[number];

export const VIBRATIONS = ["off", "gentle", "medium", "firm"] as const;
export type Vibration = (typeof VIBRATIONS)[number];

const VOLUME = 0.6;
let audio: AudioContext | null = null;

function context(): AudioContext | null {
  try {
    if (audio === null) {
      const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (!Ctor) return null;
      audio = new Ctor();
    }
    if (audio.state === "suspended") void audio.resume();
    return audio;
  } catch {
    return null;
  }
}

interface ToneOptions {
  type?: OscillatorType;
  from: number;
  to?: number;
  time?: number;
  gain?: number;
  delay?: number;
}

function tone(a: AudioContext, { type = "sine", from, to = from, time = 0.08, gain = 0.3, delay = 0 }: ToneOptions): void {
  const t = a.currentTime + delay;
  const o = a.createOscillator();
  const g = a.createGain();
  o.type = type;
  o.frequency.setValueAtTime(from, t);
  if (to !== from) o.frequency.exponentialRampToValueAtTime(to, t + time);
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain * VOLUME, t + 0.004);
  g.gain.exponentialRampToValueAtTime(0.0001, t + time);
  o.connect(g).connect(a.destination);
  o.start(t);
  o.stop(t + time + 0.02);
}

interface NoiseOptions {
  time?: number;
  gain?: number;
  filter?: BiquadFilterType;
  freq?: number;
  q?: number;
  swell?: boolean;
}

function noise(a: AudioContext, { time = 0.03, gain = 0.2, filter = "lowpass", freq = 1500, q = 0.8, swell = false }: NoiseOptions): void {
  const t = a.currentTime;
  const length = Math.ceil(a.sampleRate * (time + 0.02));
  const buffer = a.createBuffer(1, length, a.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < length; i++) data[i] = Math.random() * 2 - 1;
  const source = a.createBufferSource();
  source.buffer = buffer;
  const f = a.createBiquadFilter();
  f.type = filter;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = a.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(gain * VOLUME, t + (swell ? time * 0.45 : 0.002));
  g.gain.exponentialRampToValueAtTime(0.0001, t + time);
  source.connect(f).connect(g).connect(a.destination);
  source.start(t);
  source.stop(t + time + 0.02);
}

/** How each sound is made. */
export const SOUND_RECIPES: Record<Exclude<ClickSound, "off">, (a: AudioContext) => void> = {
  tap: (a) => { tone(a, { from: 620, to: 420, time: 0.05, gain: 0.35 }); noise(a, { time: 0.012, gain: 0.05, freq: 3000 }); },
  click: (a) => noise(a, { time: 0.018, gain: 0.35, filter: "highpass", freq: 2200 }),
  wood: (a) => { tone(a, { type: "triangle", from: 900, to: 700, time: 0.07, gain: 0.35 }); noise(a, { time: 0.02, gain: 0.12, filter: "bandpass", freq: 1800, q: 3 }); },
  pebble: (a) => { noise(a, { time: 0.035, gain: 0.3, filter: "bandpass", freq: 1100, q: 1.5 }); tone(a, { from: 260, to: 200, time: 0.04, gain: 0.15 }); },
  bubble: (a) => tone(a, { from: 300, to: 950, time: 0.08, gain: 0.3 }),
  drop: (a) => { tone(a, { from: 1300, to: 480, time: 0.11, gain: 0.28 }); tone(a, { from: 900, to: 420, time: 0.08, gain: 0.08, delay: 0.035 }); },
  pop: (a) => tone(a, { from: 190, to: 70, time: 0.07, gain: 0.5 }),
  marimba: (a) => { tone(a, { from: 523, time: 0.28, gain: 0.3 }); tone(a, { from: 2093, time: 0.06, gain: 0.08 }); },
  chime: (a) => { tone(a, { from: 880, time: 0.45, gain: 0.16 }); tone(a, { from: 1320, time: 0.35, gain: 0.1, delay: 0.05 }); },
  breath: (a) => noise(a, { time: 0.16, gain: 0.22, filter: "bandpass", freq: 900, q: 0.7, swell: true }),
  tick: (a) => { noise(a, { time: 0.008, gain: 0.3, filter: "highpass", freq: 4000 }); tone(a, { type: "square", from: 1800, time: 0.012, gain: 0.04 }); },
  heartbeat: (a) => { tone(a, { from: 95, to: 60, time: 0.09, gain: 0.55 }); tone(a, { from: 85, to: 55, time: 0.08, gain: 0.4, delay: 0.14 }); },
};

export function playSound(sound: ClickSound): void {
  if (sound === "off") return;
  const a = context();
  if (a === null) return;
  try {
    SOUND_RECIPES[sound](a);
  } catch {
    // Sound isn't available here: carry on quietly.
  }
}

/** Can this phone or browser vibrate? */
export function canVibrate(): boolean {
  if (isNativeApp()) return true;
  // Desktop browsers often have the button but no motor: only offer it on touch phones.
  try {
    return typeof navigator.vibrate === "function" && window.matchMedia("(pointer: coarse)").matches;
  } catch {
    return false;
  }
}

const WEB_MS: Record<Exclude<Vibration, "off">, number> = { gentle: 10, medium: 20, firm: 35 };

export function vibrate(strength: Vibration): void {
  if (strength === "off") return;
  if (isNativeApp()) {
    void import("@capacitor/haptics")
      .then(({ Haptics, ImpactStyle }) =>
        Haptics.impact({ style: strength === "gentle" ? ImpactStyle.Light : strength === "medium" ? ImpactStyle.Medium : ImpactStyle.Heavy }),
      )
      .catch(() => undefined);
    return;
  }
  try {
    navigator.vibrate?.(WEB_MS[strength]);
  } catch {
    // Not available: nothing to do.
  }
}

/** Things that count as "tapping a button": buttons, links, ticks and choices, but not typing. */
const TAPPABLE = 'button, a[href], input[type="checkbox"], input[type="radio"], select, summary';

let current: { sound: ClickSound; vibration: Vibration } = { sound: "off", vibration: "off" };
let listening = false;

/** Keeps the chosen sound and vibration, and listens for taps once. */
export function setTapFeedback(sound: ClickSound, vibration: Vibration): void {
  current = { sound, vibration };
  if (listening || typeof document === "undefined") return;
  listening = true;
  document.addEventListener(
    "click",
    (event) => {
      if (current.sound === "off" && current.vibration === "off") return;
      const target = event.target instanceof Element ? event.target.closest(TAPPABLE) : null;
      if (target === null) return;
      // The choices in App options play their own preview, so they don't double up here.
      if (target instanceof HTMLElement && target.dataset.feedbackPreview !== undefined) return;
      playSound(current.sound);
      vibrate(current.vibration);
    },
    { capture: true, passive: true },
  );
}
