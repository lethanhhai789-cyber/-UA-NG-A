/**
 * Procedural Web Audio API Sound Synthesizer
 * 100% synthetic, zero external file dependencies or 404s.
 */

class SoundEffectsService {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;
  private gallopTimer: number | null = null;

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    if (muted && this.ctx) {
      this.stopGallopSound();
    }
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Traditional Kentucky Derby "Call to the Post" bugle fanfare
   * Notes: C4, G4, C5, E5, G5, etc.
   */
  public playCallToThePost() {
    const ctx = this.getContext();
    if (!ctx) return;

    // Classic bugle notes and durations
    const notes: [number, number, number][] = [
      // [freq, startTimeOffset, duration]
      [261.63, 0.0, 0.18],  // C4
      [329.63, 0.22, 0.18], // E4
      [392.00, 0.44, 0.18], // G4
      [523.25, 0.66, 0.45], // C5
      
      [392.00, 1.15, 0.15], // G4
      [523.25, 1.33, 0.45], // C5

      [329.63, 1.82, 0.18], // E4
      [392.00, 2.03, 0.18], // G4
      [523.25, 2.24, 0.18], // C5
      [659.25, 2.45, 0.65], // E5
      
      [523.25, 3.15, 0.18], // C5
      [659.25, 3.35, 0.18], // E5
      [783.99, 3.55, 0.75], // G5
    ];

    const now = ctx.currentTime;
    notes.forEach(([freq, offset, dur]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      // Brass-like timbre
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now + offset);

      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(1400, now + offset);
      filter.frequency.exponentialRampToValueAtTime(800, now + offset + dur);

      gain.gain.setValueAtTime(0.001, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.25, now + offset + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + dur);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + dur + 0.05);
    });
  }

  /**
   * Sound of horse hooves galloping on turf/sand
   */
  public playHoofClick() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    // Rhythmic double-beat (clip-clop)
    [0, 0.08].forEach((offset) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      const filter = ctx.createBiquadFilter();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(offset === 0 ? 110 : 85, now + offset);
      osc.frequency.exponentialRampToValueAtTime(40, now + offset + 0.05);

      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(320, now + offset);
      filter.Q.setValueAtTime(3, now + offset);

      gain.gain.setValueAtTime(0.2, now + offset);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + 0.06);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + offset);
      osc.stop(now + offset + 0.07);
    });
  }

  /**
   * Continuous gallop sound during active race
   */
  public startGallopSound(bpm: number = 180) {
    if (this.gallopTimer) return;
    const intervalMs = (60 / bpm) * 1000;
    this.gallopTimer = window.setInterval(() => {
      this.playHoofClick();
    }, intervalMs);
  }

  public stopGallopSound() {
    if (this.gallopTimer) {
      clearInterval(this.gallopTimer);
      this.gallopTimer = null;
    }
  }

  /**
   * Hurdle jump sound: sweeping whoosh and heroic acoustic leap
   */
  public playHurdleJumpSound() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;

    // Upward swoosh
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(150, now);
    osc.frequency.exponentialRampToValueAtTime(700, now + 0.4);
    osc.frequency.exponentialRampToValueAtTime(220, now + 0.8);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 0.35);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.85);

    // Chime sweep (triumph)
    [523.25, 659.25, 783.99, 1046.5].forEach((freq, idx) => {
      const cOsc = ctx.createOscillator();
      const cGain = ctx.createGain();
      cOsc.type = 'triangle';
      cOsc.frequency.setValueAtTime(freq, now + 0.2 + idx * 0.06);

      cGain.gain.setValueAtTime(0.001, now + 0.2 + idx * 0.06);
      cGain.gain.linearRampToValueAtTime(0.18, now + 0.22 + idx * 0.06);
      cGain.gain.exponentialRampToValueAtTime(0.001, now + 0.7 + idx * 0.06);

      cOsc.connect(cGain);
      cGain.connect(ctx.destination);
      cOsc.start(now + 0.2 + idx * 0.06);
      cOsc.stop(now + 0.75 + idx * 0.06);
    });
  }

  /**
   * Sound for correct answer: triumphant crystal bell chime
   */
  public playCorrectSound() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const notes = [587.33, 880.0, 1174.66]; // D5, A5, D6
    notes.forEach((freq, idx) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.08);

      gain.gain.setValueAtTime(0.001, now + idx * 0.08);
      gain.gain.linearRampToValueAtTime(0.25, now + idx * 0.08 + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.08 + 0.45);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + idx * 0.08);
      osc.stop(now + idx * 0.08 + 0.5);
    });
  }

  /**
   * Sound for wrong answer: low soft buzz
   */
  public playWrongSound() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(140, now);
    osc.frequency.linearRampToValueAtTime(95, now + 0.25);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(now);
    osc.stop(now + 0.32);
  }

  /**
   * Victory melody for finish line / podium
   */
  public playVictoryMelody() {
    const ctx = this.getContext();
    if (!ctx) return;

    const now = ctx.currentTime;
    const melody: [number, number, number][] = [
      [523.25, 0.0, 0.2],   // C5
      [523.25, 0.22, 0.2],  // C5
      [523.25, 0.44, 0.2],  // C5
      [659.25, 0.68, 0.45], // E5
      [587.33, 1.15, 0.2],  // D5
      [659.25, 1.38, 0.2],  // E5
      [783.99, 1.62, 0.7],  // G5
    ];

    melody.forEach(([freq, offset, dur]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + offset);

      gain.gain.setValueAtTime(0.001, now + offset);
      gain.gain.linearRampToValueAtTime(0.28, now + offset + 0.03);
      gain.gain.exponentialRampToValueAtTime(0.001, now + offset + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start(now + offset);
      osc.stop(now + offset + dur + 0.05);
    });
  }
}

export const sound = new SoundEffectsService();
