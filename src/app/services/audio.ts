import { Injectable } from '@angular/core';
import * as Tone from 'tone';

@Injectable({
  providedIn: 'root',
})
export class Audio {
  private isInitialized = false;

  // TR-808 Instruments
  private kick808!: Tone.MembraneSynth;
  private snare808!: Tone.NoiseSynth;
  private hihat808!: Tone.MetalSynth;
  private cowbell808!: Tone.MetalSynth;
  private conga808!: Tone.MembraneSynth;
  private clave808!: Tone.Synth;
  private crash808!: Tone.MetalSynth;

  // Ambient Landscape
  private droneOsc!: Tone.FMSynth;
  private reverb!: Tone.Reverb;
  private delay!: Tone.FeedbackDelay;

  async initialize() {
    if (this.isInitialized) return;

    console.warn('[AUDIO] Initializing Tone.js engine...');

    try {
      await Tone.start();
      console.warn('[AUDIO] Tone.js Context started:', Tone.context.state);

      // Force resume to be sure
      if (Tone.context.state !== 'running') {
        console.warn('[AUDIO] Attempting force resume...');
        await Tone.context.resume();
      }

      // Explicitly set master volume to a safe level (0dB)
      Tone.getDestination().volume.value = 0;

      // Setup FX Chain - Simplified for stability
      // Using JCReverb/Freeverb instead of the heavy Reverb class for now
      this.reverb = new Tone.Reverb({ decay: 1.5, wet: 0.3 }).toDestination();
      // We still await if possible, but let's try not to block everything if it fails
      try {
        await this.reverb.ready;
        console.warn('[AUDIO] Reverb buffer generated.');
      } catch (e) {
        console.error('[AUDIO] Reverb failed to initialize, continuing without it.', e);
      }

      this.delay = new Tone.FeedbackDelay("8n", 0.4).connect(this.reverb);

      // --- AMBIENT DRONE ---
      this.droneOsc = new Tone.FMSynth({
        harmonicity: 0.5,
        modulationIndex: 2,
        oscillator: { type: 'sine' },
        envelope: { attack: 2, decay: 0, sustain: 1, release: 2 },
        modulation: { type: 'triangle' },
        volume: -25
      }).connect(this.reverb);

      // Start continuous dark drone
      this.droneOsc.triggerAttack("C2");
      console.warn('[AUDIO] Drone started.');

      // --- TR-808 KICK ---
      this.kick808 = new Tone.MembraneSynth({
        pitchDecay: 0.05, octaves: 4, oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 1 },
        volume: 2
      }).toDestination();

      // --- TR-808 SNARE ---
      this.snare808 = new Tone.NoiseSynth({
        noise: { type: 'white' },
        envelope: { attack: 0.001, decay: 0.15, sustain: 0, release: 0.1 },
        volume: -5
      }).toDestination();

      // --- TR-808 HI-HAT ---
      this.hihat808 = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
        harmonicity: 5.1, modulationIndex: 32, resonance: 4000, octaves: 1.5,
        volume: -15
      }).connect(this.delay);

      // --- TR-808 COWBELL ---
      this.cowbell808 = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 0.3, release: 0.1 },
        harmonicity: 1.2, modulationIndex: 20, resonance: 800, octaves: 0.5,
        volume: -12
      }).toDestination();
      this.cowbell808.frequency.value = 400;

      // --- TR-808 CONGA/TOM ---
      this.conga808 = new Tone.MembraneSynth({
        pitchDecay: 0.1, octaves: 2, oscillator: { type: 'triangle' },
        envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.2 },
        volume: -5
      }).toDestination();

      // --- TR-808 CLAVE ---
      this.clave808 = new Tone.Synth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.04, sustain: 0, release: 0.01 },
        volume: -10
      }).toDestination();

      // --- TR-808 CRASH ---
      this.crash808 = new Tone.MetalSynth({
        envelope: { attack: 0.001, decay: 1.5, release: 1 },
        harmonicity: 5.1, modulationIndex: 64, resonance: 4000, octaves: 2.5,
        volume: -18
      }).connect(this.reverb);
      this.crash808.frequency.value = 200;

      // TEST BEEP to verify audio path
      const osc = new Tone.Oscillator(440, "sine").toDestination();
      osc.start().stop("+0.1");
      console.warn('[AUDIO] Sent test beep.');

      this.isInitialized = true;
      console.warn('[AUDIO] Engine fully ready.');
    } catch (error) {
      console.error('[AUDIO] Critical initialization failure:', error);
    }
  }

  playLaunch(attacker: 'USA' | 'IRN', intensity: number, velocity: number, payload: number, type: string) {
    if (!this.isInitialized) return;

    // Sanitize inputs to prevent NaN
    const sIntensity = Number(intensity) || 0;
    const sVelocity = Number(velocity) || 5;
    const sPayload = Number(payload) || 0;

    const velocityPitchOffset = (sVelocity - 5) * 2;
    const now = Tone.now() + 0.1; // Add 100ms lookahead

    try {
      if (type === 'CYBER ATTACK') {
        this.snare808.triggerAttackRelease("32n", now);
        this.clave808.triggerAttackRelease("C6", "32n", now);
        this.snare808.triggerAttackRelease("64n", now + 0.05);
        this.clave808.triggerAttackRelease("E6", "64n", now + 0.1);
      }
      else if (type === 'DRONE SWARM') {
        const freqC5 = Tone.Frequency("C5").toFrequency() as number;
        const freqG4 = Tone.Frequency("G4").toFrequency() as number;

        this.cowbell808.frequency.setValueAtTime(freqC5, now);
        this.cowbell808.triggerAttackRelease("32n", now);

        this.hihat808.frequency.setValueAtTime(freqC5, now + 0.1);
        this.hihat808.triggerAttackRelease("16n", now + 0.1);

        this.cowbell808.frequency.setValueAtTime(freqG4, now + 0.2);
        this.cowbell808.triggerAttackRelease("32n", now + 0.2);
      }
      else if (type === 'ARTILLERY') {
        this.conga808.triggerAttackRelease("G2", "8n", now);
        this.conga808.triggerAttackRelease("E2", "8n", now + 0.15);
        this.conga808.triggerAttackRelease("C2", "8n", now + 0.3);
      }
      else {
        if (attacker === 'USA') {
          const pitch = Tone.Frequency("C1").transpose(velocityPitchOffset).toNote();
          this.kick808.triggerAttackRelease(pitch, "8n", now);
        } else {
          this.kick808.triggerAttackRelease("G1", "8n", now);
          this.snare808.triggerAttackRelease("16n", now + 0.1);
        }
      }

      // Drone tension
      const threatLevel = sIntensity + (sPayload / 2200);
      const baseFreq = 65;
      this.droneOsc.frequency.rampTo(baseFreq + (threatLevel * 15), 0.5);

      setTimeout(() => {
        if (this.isInitialized) {
          this.droneOsc.frequency.rampTo(baseFreq, 3);
        }
      }, 1500);
    } catch (e) {
      console.error('[AUDIO] Error in playLaunch:', e);
    }
  }

  playImpact(payload: number) {
    if (!this.isInitialized) return;

    // Sanitize input
    const sPayload = Number(payload) || 0;
    const now = Tone.now() + 0.1;
    const payloadFactor = Math.min(Math.max(sPayload / 2200, 0), 1);

    try {
      this.reverb.decay = Number(2 + (payloadFactor * 4)) || 2;
      this.hihat808.volume.rampTo(-15 + (payloadFactor * 5), 0.1);
      this.crash808.volume.rampTo(-20 + (payloadFactor * 10), 0.1);

      const impactFreq = Tone.Frequency("C4").transpose(-(payloadFactor * 12)).toFrequency() as number;
      this.hihat808.frequency.setValueAtTime(impactFreq, now);
      this.hihat808.triggerAttackRelease("32n", now);

      if (sPayload > 1000) {
        const crashFreq = Tone.Frequency("C3").toFrequency() as number;
        this.crash808.frequency.setValueAtTime(crashFreq, now);
        this.crash808.triggerAttackRelease("8n", now);
        this.kick808.triggerAttackRelease("C0", "2n", now);
      }
    } catch (e) {
      console.error('[AUDIO] Error in playImpact:', e);
    }
  }
}
