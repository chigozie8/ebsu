/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Plays a WhatsApp-style notification chime using the Web Audio API.
 * Uses a single shared AudioContext that is resumed on first user gesture
 * to satisfy browser autoplay policies.
 *
 * soundType:
 *  "message"  — short double-pop (new chat message)
 *  "notify"   — three-note ascending chime (system notification)
 *  "ai-done"  — soft two-note completion tone (AI finished)
 */
export type SoundType = "message" | "notify" | "ai-done";

// Singleton AudioContext — reused across all calls
let _ctx: AudioContext | null = null;

const getContext = (): AudioContext | null => {
  try {
    if (!_ctx) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      if (!Ctx) return null;
      _ctx = new Ctx();
    }
    return _ctx;
  } catch {
    return null;
  }
};

// Resume the AudioContext on any user gesture (click, keydown, touchstart)
// This satisfies browser autoplay policies
const unlockAudio = () => {
  const ctx = getContext();
  if (ctx && ctx.state === "suspended") {
    ctx.resume();
  }
};

if (typeof window !== "undefined") {
  window.addEventListener("click", unlockAudio, { once: false });
  window.addEventListener("keydown", unlockAudio, { once: false });
  window.addEventListener("touchstart", unlockAudio, { once: false });
}

const playTone = (
  ctx: AudioContext,
  freq: number,
  startTime: number,
  duration: number,
  gain: number,
  type: OscillatorType = "sine"
) => {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  osc.connect(gainNode);
  gainNode.connect(ctx.destination);
  osc.type = type;
  osc.frequency.setValueAtTime(freq, startTime);
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.01);
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + duration);
  osc.start(startTime);
  osc.stop(startTime + duration + 0.05);
};

// Play a soft, pleasant pluck/bell tone with subtle reverb using convolver
const playSoftPop = (ctx: AudioContext, freq: number, startTime: number, gain: number) => {
  const osc = ctx.createOscillator();
  const gainNode = ctx.createGain();
  const filter = ctx.createBiquadFilter();
  
  // Soft bell-like tone
  osc.type = "sine";
  osc.frequency.setValueAtTime(freq, startTime);
  
  // Low-pass filter for softer sound
  filter.type = "lowpass";
  filter.frequency.setValueAtTime(2000, startTime);
  filter.Q.setValueAtTime(0.5, startTime);
  
  // Envelope for pleasant attack and decay
  gainNode.gain.setValueAtTime(0, startTime);
  gainNode.gain.linearRampToValueAtTime(gain, startTime + 0.008); // Quick attack
  gainNode.gain.exponentialRampToValueAtTime(gain * 0.6, startTime + 0.08); // Slight decay
  gainNode.gain.exponentialRampToValueAtTime(0.001, startTime + 0.5); // Gentle release
  
  osc.connect(filter);
  filter.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  osc.start(startTime);
  osc.stop(startTime + 0.6);
};

export const playSound = (type: SoundType = "notify") => {
  const ctx = getContext();
  if (!ctx) return;

  const doPlay = () => {
    const now = ctx.currentTime;
    if (type === "message") {
      // Modern WhatsApp-style soft "pop" - single pleasant digital pluck
      // Using a D6 note (1175Hz) with soft overtone for richness
      playSoftPop(ctx, 1175, now, 0.25);
      playSoftPop(ctx, 1760, now + 0.002, 0.08); // Subtle harmonic
      if ("vibrate" in navigator) navigator.vibrate(50);
    } else if (type === "notify") {
      // Clean, minimal notification ding - friendly and non-intrusive
      // Two-note "ding" like modern messaging apps
      playSoftPop(ctx, 988, now, 0.22); // B5
      playSoftPop(ctx, 1318, now + 0.12, 0.18); // E6 - pleasant major third up
      if ("vibrate" in navigator) navigator.vibrate(80);
    } else if (type === "ai-done") {
      // Soft completion chime - satisfying two-note resolution
      playSoftPop(ctx, 1047, now, 0.2); // C6
      playSoftPop(ctx, 1397, now + 0.15, 0.16); // F6
    }
  };

  if (ctx.state === "suspended") {
    ctx.resume().then(doPlay).catch(() => {});
  } else {
    doPlay();
  }
};
