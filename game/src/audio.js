// Original sounds, synthesised live with WebAudio: no audio files, no network.
// Every sound is a few oscillators shaped by a gain envelope. The context is created
// on the first player gesture (browsers block audio before one) and stays silent
// while muted or while the page has no context yet.
export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (context) return context;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return null;
      context = new AudioContext();
    } catch {
      context = null;
    }
    return context;
  }

  function tone({ frequency = 440, end = null, duration = 0.12, type = 'sine', volume = 0.16, when = 0 }) {
    if (muted) return;
    const ctx = ensure();
    if (!ctx) return;
    if (ctx.state === 'suspended') void ctx.resume();
    const start = ctx.currentTime + when;
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, start);
    if (end !== null) oscillator.frequency.exponentialRampToValueAtTime(Math.max(30, end), start + duration);
    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(volume, start + 0.012);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);
    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(start);
    oscillator.stop(start + duration + 0.05);
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() {
      return muted;
    },
    /** A short rising chirp when the turkey leaves the ground. */
    jump() {
      tone({ frequency: 420, end: 760, duration: 0.14, type: 'triangle', volume: 0.14 });
    },
    /** A soft thud when the turkey lands. */
    land() {
      tone({ frequency: 140, end: 70, duration: 0.09, type: 'sine', volume: 0.12 });
    },
    /** A bright pluck for a corn cob. */
    corn() {
      tone({ frequency: 880, duration: 0.08, type: 'square', volume: 0.07 });
      tone({ frequency: 1318, duration: 0.1, type: 'square', volume: 0.06, when: 0.05 });
    },
    /** A sparkling arpeggio for the golden feather. */
    feather() {
      [523, 659, 784, 1046].forEach((frequency, index) => {
        tone({ frequency, duration: 0.12, type: 'triangle', volume: 0.1, when: index * 0.06 });
      });
    },
    /** A low thud plus a squawk when the turkey is hit. */
    hit() {
      tone({ frequency: 220, end: 60, duration: 0.22, type: 'sawtooth', volume: 0.16 });
      tone({ frequency: 900, end: 300, duration: 0.16, type: 'square', volume: 0.08, when: 0.02 });
    },
    /** A rising fanfare when the turkey reaches the woods. */
    win() {
      [523, 659, 784, 1046, 1318].forEach((frequency, index) => {
        tone({ frequency, duration: 0.22, type: 'triangle', volume: 0.12, when: index * 0.11 });
      });
    },
    /** A falling line when the farmer makes the catch. */
    lose() {
      [392, 330, 262, 196].forEach((frequency, index) => {
        tone({ frequency, duration: 0.24, type: 'sawtooth', volume: 0.09, when: index * 0.14 });
      });
    },
    /** A short blip when the level rises. */
    level() {
      tone({ frequency: 660, end: 990, duration: 0.12, type: 'triangle', volume: 0.1 });
    },
  };
}
