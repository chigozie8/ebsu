/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Plays a WhatsApp-style notification chime using the Web Audio API.
 * No external audio file required — works everywhere.
 *
 * soundType:
 *  "message"  — short double-pop (new chat message)
 *  "notify"   — three-note ascending chime (system notification)
 *  "ai-done"  — soft two-note completion tone (AI finished)
 */
export type SoundType = "message" | "notify" | "ai-done";

const createContext = (): AudioContext | null => {
  try {
    const Ctx = window.AudioContext || (window as any).webkitAudioContext;
    return Ctx ? new Ctx() : null;
  } catch {
    return null;
  }
};

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

export const playSound = (type: SoundType = "notify") => {
  const ctx = createContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  if (type === "message") {
    // WhatsApp-style soft double pop
    playTone(ctx, 1046, now,        0.12, 0.35, "sine");
    playTone(ctx, 1318, now + 0.13, 0.14, 0.30, "sine");
    if ("vibrate" in navigator) navigator.vibrate([80, 60, 80]);
  } else if (type === "notify") {
    // Three-note ascending chime (notification bell)
    playTone(ctx, 880,  now,        0.18, 0.40, "sine");
    playTone(ctx, 1100, now + 0.14, 0.18, 0.35, "sine");
    playTone(ctx, 1320, now + 0.28, 0.28, 0.30, "sine");
    if ("vibrate" in navigator) navigator.vibrate(200);
  } else if (type === "ai-done") {
    // Soft two-note completion chime
    playTone(ctx, 1174, now,        0.20, 0.28, "sine");
    playTone(ctx, 1568, now + 0.18, 0.30, 0.22, "sine");
  }
};
