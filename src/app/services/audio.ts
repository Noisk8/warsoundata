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

    // --- TR-808 HI-HAT ---
    this.hihat808 = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.1, release: 0.01 },
      harmonicity: 5.1,
      modulationIndex: 32,
      resonance: 4000,
      octaves: 1.5,
      volume: -10
    }).connect(this.delay);

    // --- TR-808 COWBELL ---
    this.cowbell808 = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 0.4, release: 0.1 },
      harmonicity: 1.2,
      modulationIndex: 20,
      resonance: 800,
      octaves: 0.5,
      volume: -8
    }).toDestination();
    this.cowbell808.frequency.value = 400;

    // --- TR-808 CONGA/TOM ---
    this.conga808 = new Tone.MembraneSynth({
      pitchDecay: 0.1,
      octaves: 2,
      oscillator: { type: 'triangle' },
      envelope: { attack: 0.001, decay: 0.3, sustain: 0, release: 0.2 },
      volume: 0
    }).toDestination();

    // --- TR-808 CLAVE ---
    this.clave808 = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.05, sustain: 0, release: 0.01 },
      volume: -5
    }).toDestination();

    // --- TR-808 CRASH CYMBAL ---
    this.crash808 = new Tone.MetalSynth({
      envelope: { attack: 0.001, decay: 2, release: 1 },
      harmonicity: 5.1,
      modulationIndex: 64,
      resonance: 4000,
      octaves: 2.5,
      volume: -15
    }).connect(this.reverb);
    this.crash808.frequency.value = 200;

    this.isInitialized = true;
  }

  playLaunch(attacker: 'USA' | 'IRN', intensity: number, velocity: number, payload: number, type: string) {
    if (!this.isInitialized) return;

    // Pitch bends up for fast weapons, down for slow ones
    const velocityPitchOffset = (velocity - 5) * 2;

    if (type === 'CYBER ATTACK') {
      // Cyber attacks sound like rapid glitchy bursts (Hi-hats and Claves)
      this.snare808.triggerAttackRelease("32n");
      this.clave808.triggerAttackRelease("C6", "32n");
      setTimeout(() => this.snare808.triggerAttackRelease("64n"), 50);
      setTimeout(() => this.clave808.triggerAttackRelease("E6", "64n"), 100);
    }
    else if (type === 'DRONE SWARM') {
      // Swarms are represented by rhythmic Cowbells and high hats
      this.cowbell808.triggerAttackRelease("C5", "32n");
      setTimeout(() => this.hihat808.triggerAttackRelease("C5", "16n"), 100);
      setTimeout(() => this.cowbell808.triggerAttackRelease("G4", "32n"), 200);
    }
    else if (type === 'ARTILLERY') {
      // Artillery uses the Congas/Toms
      this.conga808.triggerAttackRelease("G2", "8n");
      setTimeout(() => this.conga808.triggerAttackRelease("E2", "8n"), 150);
      setTimeout(() => this.conga808.triggerAttackRelease("C2", "8n"), 300);
    }
    else {
      // Heavy Ballistics / Cruise Missiles
      if (attacker === 'USA') {
        const pitch = Tone.Frequency("C1").transpose(velocityPitchOffset).toNote();
        this.kick808.triggerAttackRelease(pitch, "8n");
      } else {
        this.kick808.triggerAttackRelease("G1", "8n");
        this.snare808.triggerAttackRelease("16n", "+0.1");
      }
    }

    // Drone tension scales with Payload and Intensity combined
    const threatLevel = intensity + (payload / 2200);
    const baseFreq = 65;
    this.droneOsc.frequency.rampTo(baseFreq + (threatLevel * 15), 0.5);
    setTimeout(() => {
      if (this.isInitialized) this.droneOsc.frequency.rampTo(baseFreq, 3);
    }, 1500);
  }

  playImpact(payload: number) {
    if (!this.isInitialized) return;

    // Heavy payloads get much longer reverb decay (up to 8s) and more volume
    const payloadFactor = payload / 2200; // 0.0 to 1.0 approx

    this.reverb.decay = 2 + (payloadFactor * 6);
    this.hihat808.volume.value = -10 + (payloadFactor * 5);
    this.crash808.volume.value = -15 + (payloadFactor * 10);

    // Trigger metallic crash for impact (lower pitch for heavier payload)
    const impactPitch = Tone.Frequency("C4").transpose(-(payloadFactor * 12)).toNote();
    this.hihat808.triggerAttackRelease(impactPitch, "32n");

    // If it's a huge payload, trigger the 808 Crash cymbal
    if (payload > 1000) {
      this.crash808.triggerAttackRelease("C4", "8n");
      this.kick808.triggerAttackRelease("C0", "2n"); // Huge sub-bass explosion
    }
  }
}
