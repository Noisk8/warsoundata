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

  // Ambient Landscape
  private droneOsc!: Tone.FMSynth;
  private reverb!: Tone.Reverb;
  private delay!: Tone.FeedbackDelay;

  async initialize() {
    if (this.isInitialized) return;

    await Tone.start();

    // Setup FX Chain
    this.reverb = new Tone.Reverb({ decay: 4, preDelay: 0.1, wet: 0.4 }).toDestination();
    this.delay = new Tone.FeedbackDelay("8n", 0.5).connect(this.reverb);

    // --- AMBIENT DRONE ---
    this.droneOsc = new Tone.FMSynth({
      harmonicity: 0.5,
      modulationIndex: 2,
      oscillator: { type: 'sine' },
      envelope: { attack: 2, decay: 0, sustain: 1, release: 2 },
      modulation: { type: 'triangle' },
      volume: -20
    }).connect(this.reverb);

    // Start continuous dark drone on 65Hz (C2)
    this.droneOsc.triggerAttack("C2");

    // --- TR-808 KICK (USA Launches) ---
    this.kick808 = new Tone.MembraneSynth({
      pitchDecay: 0.05,
      octaves: 4,
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.5, sustain: 0, release: 1 },
      volume: 5
    }).toDestination();

    // --- TR-808 SNARE (IRN Launches) ---
    // Snare is usually a mix of a tonal hit and noise. We'll use NoiseSynth for the snappy part.
    this.snare808 = new Tone.NoiseSynth({
      noise: { type: 'white' },
      envelope: { attack: 0.001, decay: 0.2, sustain: 0, release: 0.2 },
      volume: 2
    }).toDestination();

    // --- TR-808 HI-HAT/CRASH (Impacts) ---
    this.hihat808 = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
      volume: -10
    }).connect(this.delay);

    this.isInitialized = true;
  }

  playLaunch(attacker: 'USA' | 'IRN', intensity: number) {
    if (!this.isInitialized) return;

    if (attacker === 'USA') {
      // 808 Kick
      this.kick808.triggerAttackRelease("C1", "8n");
    } else {
      // 808 Snare snappy hit
      this.snare808.triggerAttackRelease("16n");
    }

    // Slightly modulate the drone frequency based on intensity to add tension
    const baseFreq = 65;
    this.droneOsc.frequency.rampTo(baseFreq + (intensity * 10), 0.5);
    setTimeout(() => {
      if (this.isInitialized) this.droneOsc.frequency.rampTo(baseFreq, 2);
    }, 1000);
  }

  playImpact() {
    if (!this.isInitialized) return;

    // Trigger metallic crash for impact
    this.hihat808.triggerAttackRelease("C4", "32n");
  }
}
