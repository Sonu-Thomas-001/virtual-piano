import { InstrumentId, ReverbPreset } from '@/types/piano';
import { midiToFrequency, noteNameToMidi } from '@/lib/notes';
import { resolveInstrument } from '@/lib/constants';

interface ActiveVoice {
  midi: number;
  transposedMidi: number;
  oscillators: OscillatorNode[];
  gainNodes: GainNode[];
  filterNode?: BiquadFilterNode;
  envelopeGain: GainNode;
  startedAt: number;
  isKeyHeld: boolean;
  isSustained: boolean;
  isSostenutoSustained?: boolean;
}

export class AudioEngine {
  private static instance: AudioEngine | null = null;
  private ctx: AudioContext | null = null;

  // Master Gain and EQ / Filter chain
  private masterGain: GainNode | null = null;
  private preMasterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private brightnessFilter: BiquadFilterNode | null = null;
  private eqLowNode: BiquadFilterNode | null = null;
  private eqMidNode: BiquadFilterNode | null = null;
  private eqHighNode: BiquadFilterNode | null = null;
  private stereoPanner: StereoPannerNode | null = null;

  // Acoustic noise buffers
  private hammerNoiseBuffer: AudioBuffer | null = null;
  private damperResonanceBuffer: AudioBuffer | null = null;

  // Reverb chain
  private convolver: ConvolverNode | null = null;
  private reverbWetGain: GainNode | null = null;
  private reverbDryGain: GainNode | null = null;
  private currentReverb: ReverbPreset = 'hall';

  // Analyser node for visualizer & activity meter
  private analyser: AnalyserNode | null = null;
  private analyserDataArray: Uint8Array | null = null;

  // Active voices keyed by original MIDI number
  private activeVoices = new Map<number, ActiveVoice[]>();
  private readonly MAX_POLYPHONY = 48;

  // State parameters
  private currentInstrument: InstrumentId = 'concert-grand';
  private volume: number = 0.8;
  private isMuted: boolean = false;
  private isInitialized: boolean = false;
  private transposeSemitones: number = 0;

  // Three-Pedal System
  private sustainPedal: boolean = false;
  private sostenutoPedal: boolean = false;
  private softPedal: boolean = false;

  // Tone & Expressiveness
  private brightness: number = 55; // 0..100%
  private dynamics: number = 75; // 0..100%
  private tuningHz: number = 440; // 430..450 Hz
  private stereoWidth: number = 70; // 0..100%
  private eqLow: number = 0; // -12..+12 dB
  private eqMid: number = 0; // -12..+12 dB
  private eqHigh: number = 0; // -12..+12 dB
  private damperResonanceAmount: number = 40; // 0..100%

  // Metronome timer state
  private metronomeTimerId: number | null = null;
  private metronomeBpm: number = 100;
  private metronomeTimeSignature: number = 4;
  private metronomeCurrentBeat: number = 0;
  private onMetronomeBeatCallback?: (beat: number) => void;

  // Tap Tempo history
  private tapTimestamps: number[] = [];

  private constructor() {
    // Lazy initialized on first user gesture
  }

  public static getInstance(): AudioEngine {
    if (!AudioEngine.instance) {
      AudioEngine.instance = new AudioEngine();
    }
    return AudioEngine.instance;
  }

  /**
   * Initializes or unlocks the AudioContext.
   */
  public async initAudio(): Promise<boolean> {
    if (typeof window === 'undefined') return false;

    if (!this.ctx) {
      const AudioCtxClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) {
        console.error('Web Audio API is not supported in this browser.');
        return false;
      }

      this.ctx = new AudioCtxClass({
        latencyHint: 'interactive',
      });

      // 1. Pre-Master Bus
      this.preMasterGain = this.ctx.createGain();

      // 2. 3-Band Equalizer
      this.eqLowNode = this.ctx.createBiquadFilter();
      this.eqLowNode.type = 'lowshelf';
      this.eqLowNode.frequency.setValueAtTime(250, this.ctx.currentTime);
      this.eqLowNode.gain.setValueAtTime(this.eqLow, this.ctx.currentTime);

      this.eqMidNode = this.ctx.createBiquadFilter();
      this.eqMidNode.type = 'peaking';
      this.eqMidNode.frequency.setValueAtTime(1000, this.ctx.currentTime);
      this.eqMidNode.Q.setValueAtTime(1.0, this.ctx.currentTime);
      this.eqMidNode.gain.setValueAtTime(this.eqMid, this.ctx.currentTime);

      this.eqHighNode = this.ctx.createBiquadFilter();
      this.eqHighNode.type = 'highshelf';
      this.eqHighNode.frequency.setValueAtTime(4000, this.ctx.currentTime);
      this.eqHighNode.gain.setValueAtTime(this.eqHigh, this.ctx.currentTime);

      // 3. Global Tone Brightness Filter (with Soft Pedal mod)
      this.brightnessFilter = this.ctx.createBiquadFilter();
      this.brightnessFilter.type = 'lowpass';
      this.updateBrightnessCutoff();

      // 4. Dynamics Compressor / Limiter
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(8, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(5, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime);

      // 5. Stereo Panner
      if ('createStereoPanner' in this.ctx) {
        this.stereoPanner = this.ctx.createStereoPanner();
        this.stereoPanner.pan.setValueAtTime(0, this.ctx.currentTime);
      }

      // 6. Reverb Bus
      this.convolver = this.ctx.createConvolver();
      this.reverbWetGain = this.ctx.createGain();
      this.reverbDryGain = this.ctx.createGain();
      this.updateReverbImpulse(this.currentReverb);

      // 7. Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);

      // 8. Analyser for spectral activity visualization
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;
      this.analyserDataArray = new Uint8Array(this.analyser.frequencyBinCount);

      // Connect Signal Chain:
      // Voice -> preMasterGain -> eqLow -> eqMid -> eqHigh -> brightnessFilter -> compressor
      this.preMasterGain.connect(this.eqLowNode);
      this.eqLowNode.connect(this.eqMidNode);
      this.eqMidNode.connect(this.eqHighNode);
      this.eqHighNode.connect(this.brightnessFilter);
      this.brightnessFilter.connect(this.compressor);

      // Compressor -> Dry & Wet paths
      this.compressor.connect(this.reverbDryGain);
      this.compressor.connect(this.convolver);
      this.convolver.connect(this.reverbWetGain);

      const postReverbGain = this.ctx.createGain();
      this.reverbDryGain.connect(postReverbGain);
      this.reverbWetGain.connect(postReverbGain);

      if (this.stereoPanner) {
        postReverbGain.connect(this.stereoPanner);
        this.stereoPanner.connect(this.masterGain);
      } else {
        postReverbGain.connect(this.masterGain);
      }

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      // Generate acoustic noise buffers
      this.hammerNoiseBuffer = this.createHammerNoiseBuffer(this.ctx);
      this.damperResonanceBuffer = this.createResonanceBuffer(this.ctx);
    }

    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (err) {
        console.warn('Could not resume AudioContext:', err);
      }
    }

    this.isInitialized = this.ctx.state === 'running';
    return this.isInitialized;
  }

  private createHammerNoiseBuffer(ctx: AudioContext): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * 0.025); // 25ms percussive thud
    const buffer = ctx.createBuffer(1, length, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < length; i++) {
      const decay = Math.exp(-i / (ctx.sampleRate * 0.005));
      data[i] = (Math.random() * 2 - 1) * decay;
    }
    return buffer;
  }

  private createResonanceBuffer(ctx: AudioContext): AudioBuffer {
    const length = Math.floor(ctx.sampleRate * 0.4); // 400ms sympathetic air wash
    const buffer = ctx.createBuffer(2, length, ctx.sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);
    for (let i = 0; i < length; i++) {
      const decay = Math.exp(-i / (ctx.sampleRate * 0.1));
      left[i] = (Math.random() * 2 - 1) * decay * 0.08;
      right[i] = (Math.random() * 2 - 1) * decay * 0.08;
    }
    return buffer;
  }

  private createImpulseResponse(seconds: number, decayRate: number): AudioBuffer | null {
    if (!this.ctx) return null;
    const rate = this.ctx.sampleRate;
    const length = Math.floor(rate * seconds);
    const impulse = this.ctx.createBuffer(2, length, rate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = length - i;
      const decay = Math.pow(n / length, decayRate);
      left[i] = (Math.random() * 2 - 1) * decay;
      right[i] = (Math.random() * 2 - 1) * decay;
    }
    return impulse;
  }

  // ================= REVERB & EFFECTS =================

  public setReverb(preset: ReverbPreset): void {
    this.currentReverb = preset;
    if (!this.ctx) return;
    this.updateReverbImpulse(preset);
  }

  private updateReverbImpulse(preset: ReverbPreset): void {
    if (!this.ctx || !this.convolver || !this.reverbWetGain || !this.reverbDryGain) return;
    const now = this.ctx.currentTime;

    switch (preset) {
      case 'off':
        this.reverbWetGain.gain.setTargetAtTime(0, now, 0.02);
        this.reverbDryGain.gain.setTargetAtTime(1.0, now, 0.02);
        break;

      case 'studio': {
        const buf = this.createImpulseResponse(0.8, 4.2);
        if (buf) this.convolver.buffer = buf;
        this.reverbWetGain.gain.setTargetAtTime(0.15, now, 0.02);
        this.reverbDryGain.gain.setTargetAtTime(0.98, now, 0.02);
        break;
      }

      case 'room': {
        const buf = this.createImpulseResponse(1.4, 3.5);
        if (buf) this.convolver.buffer = buf;
        this.reverbWetGain.gain.setTargetAtTime(0.24, now, 0.02);
        this.reverbDryGain.gain.setTargetAtTime(0.94, now, 0.02);
        break;
      }

      case 'cathedral': {
        const buf = this.createImpulseResponse(4.8, 1.7);
        if (buf) this.convolver.buffer = buf;
        this.reverbWetGain.gain.setTargetAtTime(0.55, now, 0.02);
        this.reverbDryGain.gain.setTargetAtTime(0.82, now, 0.02);
        break;
      }

      case 'hall':
      default: {
        const buf = this.createImpulseResponse(2.6, 2.2);
        if (buf) this.convolver.buffer = buf;
        this.reverbWetGain.gain.setTargetAtTime(0.36, now, 0.02);
        this.reverbDryGain.gain.setTargetAtTime(0.90, now, 0.02);
        break;
      }
    }
  }

  // ================= TONE, EQ & EXPRESSIVENESS =================

  public setBrightness(percent: number): void {
    this.brightness = Math.max(0, Math.min(100, percent));
    this.updateBrightnessCutoff();
  }

  private updateBrightnessCutoff(): void {
    if (!this.brightnessFilter || !this.ctx) return;
    const now = this.ctx.currentTime;
    // Map 0..100% to 2200Hz .. 18000Hz exponentially
    const baseFreq = 2200 * Math.pow(18000 / 2200, this.brightness / 100);
    // Soft pedal attenuates cutoff by 0.72 for intimacy
    const finalFreq = this.softPedal ? baseFreq * 0.72 : baseFreq;
    this.brightnessFilter.frequency.setTargetAtTime(finalFreq, now, 0.02);
  }

  public setDynamics(percent: number): void {
    this.dynamics = Math.max(0, Math.min(100, percent));
  }

  public setTuningHz(hz: number): void {
    this.tuningHz = Math.max(430, Math.min(450, hz));
  }

  public setStereoWidth(percent: number): void {
    this.stereoWidth = Math.max(0, Math.min(100, percent));
  }

  public setEQ(low: number, mid: number, high: number): void {
    this.eqLow = Math.max(-12, Math.min(12, low));
    this.eqMid = Math.max(-12, Math.min(12, mid));
    this.eqHigh = Math.max(-12, Math.min(12, high));

    if (this.ctx) {
      const now = this.ctx.currentTime;
      this.eqLowNode?.gain.setTargetAtTime(this.eqLow, now, 0.02);
      this.eqMidNode?.gain.setTargetAtTime(this.eqMid, now, 0.02);
      this.eqHighNode?.gain.setTargetAtTime(this.eqHigh, now, 0.02);
    }
  }

  public setDamperResonance(amount: number): void {
    this.damperResonanceAmount = Math.max(0, Math.min(100, amount));
  }

  public setTranspose(semitones: number): void {
    this.transposeSemitones = Math.max(-12, Math.min(12, semitones));
  }

  public getTranspose(): number {
    return this.transposeSemitones;
  }

  public setVolume(val: number): void {
    this.volume = Math.max(0, Math.min(1, val));
    if (this.masterGain && this.ctx) {
      const target = this.isMuted ? 0 : this.volume;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.015);
    }
  }

  public setMute(muted: boolean): void {
    this.isMuted = muted;
    if (this.masterGain && this.ctx) {
      const target = this.isMuted ? 0 : this.volume;
      this.masterGain.gain.setTargetAtTime(target, this.ctx.currentTime, 0.015);
    }
  }

  public setInstrument(inst: InstrumentId): void {
    const resolved = resolveInstrument(inst);
    this.currentInstrument = resolved.id;
  }

  public getInstrument(): InstrumentId {
    return this.currentInstrument;
  }

  // ================= THREE-PEDAL SYSTEM =================

  /**
   * Sustain / Damper Pedal (CC64, Spacebar).
   * Holds notes ringing until pedal is released.
   */
  public setSustain(enabled: boolean): void {
    this.sustainPedal = enabled;

    // Trigger subtle physical damper resonance wash
    if (enabled && this.ctx && this.preMasterGain && this.damperResonanceBuffer && this.damperResonanceAmount > 0) {
      try {
        const now = this.ctx.currentTime;
        const resSource = this.ctx.createBufferSource();
        const resGain = this.ctx.createGain();
        resGain.gain.setValueAtTime((this.damperResonanceAmount / 100) * 0.12, now);
        resSource.buffer = this.damperResonanceBuffer;
        resSource.connect(resGain);
        resGain.connect(this.preMasterGain);
        resSource.start(now);
      } catch {
        // Safe fallback
      }
    }

    // When sustain is released, stop any notes that are not held by keyboard/finger or sostenuto
    if (!enabled && this.ctx) {
      const now = this.ctx.currentTime;
      this.activeVoices.forEach((voices, midi) => {
        const remaining: ActiveVoice[] = [];
        voices.forEach((voice) => {
          if (!voice.isKeyHeld && !voice.isSostenutoSustained) {
            this.applyDamperRelease(voice, now);
          } else {
            voice.isSustained = false;
            remaining.push(voice);
          }
        });
        if (remaining.length === 0) {
          this.activeVoices.delete(midi);
        } else {
          this.activeVoices.set(midi, remaining);
        }
      });
    }
  }

  public isSustainActive(): boolean {
    return this.sustainPedal;
  }

  /**
   * Sostenuto Pedal (CC66).
   * Sustains only notes currently held down at the moment the pedal is engaged.
   */
  public setSostenuto(enabled: boolean): void {
    this.sostenutoPedal = enabled;

    if (enabled) {
      // Latch all currently held voices
      this.activeVoices.forEach((voices) => {
        voices.forEach((voice) => {
          if (voice.isKeyHeld) {
            voice.isSostenutoSustained = true;
          }
        });
      });
    } else if (this.ctx) {
      // Release sostenuto latch
      const now = this.ctx.currentTime;
      this.activeVoices.forEach((voices, midi) => {
        const remaining: ActiveVoice[] = [];
        voices.forEach((voice) => {
          voice.isSostenutoSustained = false;
          if (!voice.isKeyHeld && !this.sustainPedal) {
            this.applyDamperRelease(voice, now);
          } else {
            remaining.push(voice);
          }
        });
        if (remaining.length === 0) {
          this.activeVoices.delete(midi);
        } else {
          this.activeVoices.set(midi, remaining);
        }
      });
    }
  }

  public isSostenutoActive(): boolean {
    return this.sostenutoPedal;
  }

  /**
   * Soft Pedal / Una Corda (CC67).
   * Mellows the timbre, lowers attack brightness, and slightly softens the volume.
   */
  public setSoftPedal(enabled: boolean): void {
    this.softPedal = enabled;
    this.updateBrightnessCutoff();
  }

  public isSoftPedalActive(): boolean {
    return this.softPedal;
  }

  // ================= VOICE LIFECYCLE =================

  /**
   * Plays a note (either MIDI number or note string like "C4")
   */
  public playNote(noteOrMidi: number | string, rawVelocity: number = 0.8): void {
    const originalMidi = typeof noteOrMidi === 'number' ? noteOrMidi : noteNameToMidi(noteOrMidi);
    const transposedMidi = Math.max(21, Math.min(108, originalMidi + this.transposeSemitones));
    const freq = midiToFrequency(transposedMidi, this.tuningHz);

    // Apply dynamics curve: low dynamics = compressed, high dynamics = expressive
    const dynFactor = this.dynamics / 100;
    const curvedVelocity = Math.pow(Math.max(0.05, Math.min(1, rawVelocity)), 0.6 + (1 - dynFactor) * 0.8);
    const finalVelocity = this.softPedal ? curvedVelocity * 0.82 : curvedVelocity;

    if (!this.ctx || this.ctx.state !== 'running') {
      this.initAudio().then(() => this.startVoice(originalMidi, transposedMidi, freq, finalVelocity));
      return;
    }

    this.startVoice(originalMidi, transposedMidi, freq, finalVelocity);
  }

  private startVoice(
    originalMidi: number,
    transposedMidi: number,
    freq: number,
    velocity: number
  ): void {
    if (!this.ctx || !this.preMasterGain) return;

    // Enforce polyphony limit with voice stealing
    this.enforcePolyphonyLimit();

    const now = this.ctx.currentTime;
    const clampedVel = Math.max(0.08, Math.min(1, velocity));

    // Master envelope gain for this individual voice
    const envelopeGain = this.ctx.createGain();
    envelopeGain.gain.setValueAtTime(0.0001, now);

    const oscillators: OscillatorNode[] = [];
    const gainNodes: GainNode[] = [];
    let filterNode: BiquadFilterNode | undefined;

    const resolved = resolveInstrument(this.currentInstrument).id;

    // Dispatch to dedicated sound synthesis models
    if (resolved.includes('grand')) {
      filterNode = this.createGrandPianoVoice(resolved, transposedMidi, freq, clampedVel, now, envelopeGain, oscillators, gainNodes);
    } else if (resolved.includes('upright')) {
      filterNode = this.createUprightPianoVoice(resolved, transposedMidi, freq, clampedVel, now, envelopeGain, oscillators, gainNodes);
    } else if (resolved === 'rhodes' || resolved === 'electric-piano' || resolved === 'suitcase-ep' || resolved === 'fm-electric-piano' || resolved === 'wurlitzer') {
      this.createElectricPianoFamilyVoice(resolved, freq, clampedVel, now, envelopeGain, oscillators, gainNodes);
    } else if (resolved === 'clavinet' || resolved === 'soft-keys' || resolved === 'vintage-keys') {
      this.createKeysVoice(resolved, freq, clampedVel, now, envelopeGain, oscillators, gainNodes);
    } else if (resolved.includes('organ')) {
      this.createOrganFamilyVoice(resolved, freq, clampedVel, now, envelopeGain, oscillators, gainNodes);
    } else if (resolved.includes('strings')) {
      this.createStringsFamilyVoice(resolved, freq, clampedVel, now, envelopeGain, oscillators, gainNodes);
    } else if (resolved.includes('pad')) {
      this.createPadFamilyVoice(resolved, freq, clampedVel, now, envelopeGain, oscillators, gainNodes);
    } else if (resolved.startsWith('piano-')) {
      filterNode = this.createHybridVoice(resolved, transposedMidi, freq, clampedVel, now, envelopeGain, oscillators, gainNodes);
    } else {
      filterNode = this.createGrandPianoVoice('concert-grand', transposedMidi, freq, clampedVel, now, envelopeGain, oscillators, gainNodes);
    }

    // Connect voice output to the preMasterBus
    envelopeGain.connect(this.preMasterGain);

    const voice: ActiveVoice = {
      midi: originalMidi,
      transposedMidi,
      oscillators,
      gainNodes,
      filterNode,
      envelopeGain,
      startedAt: now,
      isKeyHeld: true,
      isSustained: this.sustainPedal,
      isSostenutoSustained: false,
    };

    const existing = this.activeVoices.get(originalMidi) || [];
    existing.push(voice);
    this.activeVoices.set(originalMidi, existing);
  }

  private enforcePolyphonyLimit(): void {
    let totalVoices = 0;
    let oldestStartedAt = Infinity;
    let oldestVoiceObj: ActiveVoice | null = null;

    for (const [, voices] of this.activeVoices.entries()) {
      totalVoices += voices.length;
      for (const v of voices) {
        if (v.startedAt < oldestStartedAt) {
          oldestStartedAt = v.startedAt;
          oldestVoiceObj = v;
        }
      }
    }

    if (totalVoices >= this.MAX_POLYPHONY && oldestVoiceObj && this.ctx) {
      const now = this.ctx.currentTime;
      try {
        oldestVoiceObj.envelopeGain.gain.cancelScheduledValues(now);
        oldestVoiceObj.envelopeGain.gain.setTargetAtTime(0.0001, now, 0.01);
      } catch {
        // Safe fallback
      }
    }
  }

  // ================= SOUND SYNTHESIS ARCHITECTURE =================

  /**
   * Category 1: Grand Pianos
   */
  private createGrandPianoVoice(
    subType: string,
    midi: number,
    freq: number,
    velocity: number,
    now: number,
    envelopeGain: GainNode,
    oscillators: OscillatorNode[],
    gainNodes: GainNode[]
  ): BiquadFilterNode {
    const ctx = this.ctx!;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';

    const brightnessMult = subType === 'bright-grand' ? 4.5 : subType === 'warm-grand' || subType === 'soft-grand' ? 2.5 : 3.4;
    const startCutoff = Math.min(16000, freq * (brightnessMult + velocity * 4));
    filter.frequency.setValueAtTime(startCutoff, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(350, freq * 1.4), now + (subType === 'cinematic-grand' ? 4.0 : 2.5));

    const normalizedOctave = Math.max(0, Math.min(8, midi / 12 - 1));
    const decayDuration = subType === 'cinematic-grand' ? Math.max(2.5, 7.0 - normalizedOctave * 0.4) : Math.max(1.2, 5.0 - normalizedOctave * 0.42);

    envelopeGain.gain.setValueAtTime(0.0001, now);
    envelopeGain.gain.linearRampToValueAtTime(velocity * (subType === 'soft-grand' ? 0.7 : 0.92), now + (subType === 'soft-grand' ? 0.008 : 0.003));
    envelopeGain.gain.exponentialRampToValueAtTime(velocity * 0.45, now + 0.12);
    envelopeGain.gain.exponentialRampToValueAtTime(0.0001, now + decayDuration);

    // Fundamental partial (triangle for warm body)
    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);

    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0.72, now);
    osc1.connect(gain1);
    gain1.connect(filter);
    oscillators.push(osc1);
    gainNodes.push(gain1);

    // 2nd partial (sine with slight inharmonicity stretch)
    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.0016, now);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(subType === 'bright-grand' ? 0.45 : 0.32, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + decayDuration * 0.7);
    osc2.connect(gain2);
    gain2.connect(filter);
    oscillators.push(osc2);
    gainNodes.push(gain2);

    // 3rd partial
    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 3.004, now);

    const gain3 = ctx.createGain();
    gain3.gain.setValueAtTime(subType === 'bright-grand' ? 0.25 : 0.16, now);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + decayDuration * 0.45);
    osc3.connect(gain3);
    gain3.connect(filter);
    oscillators.push(osc3);
    gainNodes.push(gain3);

    // Hammer felt attack transient
    if (this.hammerNoiseBuffer && subType !== 'soft-grand') {
      const noise = ctx.createBufferSource();
      noise.buffer = this.hammerNoiseBuffer;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(velocity * 0.22, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.025);
      noise.connect(noiseGain);
      noiseGain.connect(filter);
      noise.start(now);
    }

    filter.connect(envelopeGain);
    oscillators.forEach((o) => {
      o.start(now);
      o.stop(now + decayDuration + 0.1);
    });

    return filter;
  }

  /**
   * Category 2: Upright Pianos
   */
  private createUprightPianoVoice(
    subType: string,
    midi: number,
    freq: number,
    velocity: number,
    now: number,
    envelopeGain: GainNode,
    oscillators: OscillatorNode[],
    gainNodes: GainNode[]
  ): BiquadFilterNode {
    const ctx = this.ctx!;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';

    const isFelt = subType === 'felt-upright';
    const isDark = subType === 'dark-upright';
    const isVintage = subType === 'vintage-upright';

    const startCutoff = isFelt ? Math.min(3800, freq * 2.2) : isDark ? Math.min(3000, freq * 1.8) : isVintage ? Math.min(14000, freq * 4.5) : Math.min(9000, freq * 3.2);

    filter.frequency.setValueAtTime(startCutoff, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(260, freq * 1.1), now + 1.8);

    const decayDuration = Math.max(1.0, 3.8 - (midi / 12) * 0.35);

    envelopeGain.gain.setValueAtTime(0.0001, now);
    envelopeGain.gain.linearRampToValueAtTime(velocity * (isFelt ? 0.65 : 0.88), now + (isFelt ? 0.008 : 0.003));
    envelopeGain.gain.exponentialRampToValueAtTime(velocity * 0.4, now + 0.1);
    envelopeGain.gain.exponentialRampToValueAtTime(0.0001, now + decayDuration);

    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);

    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0.8, now);
    osc1.connect(gain1);
    gain1.connect(filter);
    oscillators.push(osc1);
    gainNodes.push(gain1);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    // Vintage upright has nostalgic chorused detune
    osc2.frequency.setValueAtTime(freq * 2.002, now);
    if (isVintage) {
      osc2.detune.setValueAtTime(5, now);
    }

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(isFelt ? 0.15 : 0.38, now);
    osc2.connect(gain2);
    gain2.connect(filter);
    oscillators.push(osc2);
    gainNodes.push(gain2);

    filter.connect(envelopeGain);
    oscillators.forEach((o) => {
      o.start(now);
      o.stop(now + decayDuration + 0.1);
    });

    return filter;
  }

  /**
   * Category 3: Electric Pianos (Rhodes, Wurlitzer, FM, Suitcase)
   */
  private createElectricPianoFamilyVoice(
    subType: string,
    freq: number,
    velocity: number,
    now: number,
    envelopeGain: GainNode,
    oscillators: OscillatorNode[],
    gainNodes: GainNode[]
  ): void {
    const ctx = this.ctx!;
    const isWurli = subType === 'wurlitzer';
    const isFM = subType === 'fm-electric-piano';
    const isSuitcase = subType === 'suitcase-ep';

    envelopeGain.gain.setValueAtTime(0.0001, now);
    envelopeGain.gain.linearRampToValueAtTime(velocity * 0.85, now + 0.002);
    envelopeGain.gain.exponentialRampToValueAtTime(velocity * 0.42, now + 0.15);
    envelopeGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.8);

    // Carrier Oscillator
    const carrier = ctx.createOscillator();
    carrier.type = isWurli ? 'triangle' : isFM ? 'sine' : 'sine';
    carrier.frequency.setValueAtTime(freq, now);

    // Modulator for FM chime
    const modulator = ctx.createOscillator();
    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(freq * (isFM ? 14 : isWurli ? 3 : 4), now);

    const modGain = ctx.createGain();
    const modDepth = freq * (isFM ? 3.5 : isWurli ? 2.2 : 1.8) * velocity;
    modGain.gain.setValueAtTime(modDepth, now);
    modGain.gain.exponentialRampToValueAtTime(0.01, now + (isFM ? 0.6 : 0.22));

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    const carrierGain = ctx.createGain();
    carrierGain.gain.setValueAtTime(0.7, now);
    carrier.connect(carrierGain);

    if (isSuitcase) {
      // Add stereo tremolo lfo
      const lfo = ctx.createOscillator();
      lfo.frequency.setValueAtTime(4.8, now); // 4.8 Hz classic stereo vibrato
      const lfoGain = ctx.createGain();
      lfoGain.gain.setValueAtTime(0.18, now);
      lfo.connect(lfoGain);
      lfoGain.connect(carrierGain.gain);
      lfo.start(now);
      oscillators.push(lfo);
    }

    carrierGain.connect(envelopeGain);

    oscillators.push(carrier, modulator);
    gainNodes.push(carrierGain, modGain);

    carrier.start(now);
    modulator.start(now);
    carrier.stop(now + 4.0);
    modulator.stop(now + 4.0);
  }

  /**
   * Category 4: Keys (Clavinet, Soft Keys, Vintage Keys)
   */
  private createKeysVoice(
    subType: string,
    freq: number,
    velocity: number,
    now: number,
    envelopeGain: GainNode,
    oscillators: OscillatorNode[],
    gainNodes: GainNode[]
  ): void {
    const ctx = this.ctx!;
    const isClav = subType === 'clavinet';

    envelopeGain.gain.setValueAtTime(0.0001, now);
    envelopeGain.gain.linearRampToValueAtTime(velocity * 0.9, now + 0.001);
    envelopeGain.gain.exponentialRampToValueAtTime(0.0001, now + (isClav ? 1.5 : 2.5));

    const osc = ctx.createOscillator();
    osc.type = isClav ? 'sawtooth' : 'triangle';
    osc.frequency.setValueAtTime(freq, now);

    const filter = ctx.createBiquadFilter();
    filter.type = isClav ? 'bandpass' : 'lowpass';
    filter.frequency.setValueAtTime(isClav ? freq * 3.5 : 2200, now);
    if (isClav) {
      filter.Q.setValueAtTime(4.0, now); // Twangy Q peak
    }

    osc.connect(filter);
    filter.connect(envelopeGain);
    oscillators.push(osc);

    osc.start(now);
    osc.stop(now + 3.0);
  }

  /**
   * Category 5: Organs (Jazz, Church, Rock, Soft Flute)
   */
  private createOrganFamilyVoice(
    subType: string,
    freq: number,
    velocity: number,
    now: number,
    envelopeGain: GainNode,
    oscillators: OscillatorNode[],
    gainNodes: GainNode[]
  ): void {
    const ctx = this.ctx!;
    const isChurch = subType === 'church-organ';
    const isRock = subType === 'rock-organ';
    const isSoft = subType === 'soft-organ';

    envelopeGain.gain.setValueAtTime(0.0001, now);
    envelopeGain.gain.linearRampToValueAtTime(velocity * 0.75, now + (isChurch ? 0.025 : 0.004));

    // Harmonic drawbar pipe ranks
    const ranks = isChurch ? [0.5, 1, 2, 4] : isSoft ? [1, 2] : [1, 2, 3, 4, 6];
    const amps = isChurch ? [0.6, 0.5, 0.35, 0.2] : isSoft ? [0.7, 0.25] : [0.5, 0.4, 0.3, 0.2, 0.15];

    ranks.forEach((multiplier, i) => {
      const osc = ctx.createOscillator();
      osc.type = isRock ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq * multiplier, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(amps[i] || 0.2, now);
      osc.connect(gain);
      gain.connect(envelopeGain);

      oscillators.push(osc);
      gainNodes.push(gain);
      osc.start(now);
    });
  }

  /**
   * Category 6: Strings (Solo, Ensemble, Warm, Cinematic)
   */
  private createStringsFamilyVoice(
    subType: string,
    freq: number,
    velocity: number,
    now: number,
    envelopeGain: GainNode,
    oscillators: OscillatorNode[],
    gainNodes: GainNode[]
  ): void {
    const ctx = this.ctx!;
    const isSolo = subType === 'solo-strings';
    const isWarm = subType === 'warm-strings';
    const isCinematic = subType === 'cinematic-strings';

    const attackTime = isSolo ? 0.08 : isCinematic ? 0.16 : 0.12;

    envelopeGain.gain.setValueAtTime(0.0001, now);
    envelopeGain.gain.linearRampToValueAtTime(velocity * 0.7, now + attackTime);

    const detunes = isSolo ? [-2, 2] : [-7, 0, 7];

    detunes.forEach((detune) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime(detune, now);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(isWarm ? Math.min(3200, freq * 2.5) : Math.min(6500, freq * 3.8), now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.32, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(envelopeGain);

      oscillators.push(osc);
      gainNodes.push(gain);
      osc.start(now);
    });
  }

  /**
   * Category 7: Pads (Warm, Ambient, Cinematic, Synth)
   */
  private createPadFamilyVoice(
    subType: string,
    freq: number,
    velocity: number,
    now: number,
    envelopeGain: GainNode,
    oscillators: OscillatorNode[],
    gainNodes: GainNode[]
  ): void {
    const ctx = this.ctx!;
    const attackTime = subType === 'ambient-pad' ? 0.28 : 0.18;

    envelopeGain.gain.setValueAtTime(0.0001, now);
    envelopeGain.gain.linearRampToValueAtTime(velocity * 0.65, now + attackTime);

    [-5, 5].forEach((detune) => {
      const osc = ctx.createOscillator();
      osc.type = subType === 'warm-pad' ? 'triangle' : 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime(detune, now);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.min(4200, freq * 2.8), now);
      filter.frequency.exponentialRampToValueAtTime(Math.min(6000, freq * 3.5), now + 1.5);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.35, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(envelopeGain);

      oscillators.push(osc);
      gainNodes.push(gain);
      osc.start(now);
    });
  }

  /**
   * Category 8: Hybrid (Piano + Strings, Piano + Pad, Piano + Choir, Piano + Synth)
   */
  private createHybridVoice(
    subType: string,
    midi: number,
    freq: number,
    velocity: number,
    now: number,
    envelopeGain: GainNode,
    oscillators: OscillatorNode[],
    gainNodes: GainNode[]
  ): BiquadFilterNode {
    // 1. Acoustic Piano Core
    const filter = this.createGrandPianoVoice('concert-grand', midi, freq, velocity, now, envelopeGain, oscillators, gainNodes);

    // 2. Layered Secondary Texture
    const ctx = this.ctx!;
    const padGain = ctx.createGain();
    padGain.gain.setValueAtTime(0.0001, now);
    padGain.gain.linearRampToValueAtTime(velocity * 0.35, now + 0.15);

    [-4, 4].forEach((detune) => {
      const osc = ctx.createOscillator();
      osc.type = subType === 'piano-synth' ? 'sawtooth' : subType === 'piano-choir' ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime(detune, now);

      osc.connect(padGain);
      oscillators.push(osc);
      osc.start(now);
      osc.stop(now + 4.5);
    });

    padGain.connect(envelopeGain);
    gainNodes.push(padGain);

    return filter;
  }

  // ================= RELEASE & DAMPERS =================

  /**
   * Releases a note (key up).
   * Sustains if sustain pedal or sostenuto pedal holds it.
   */
  public releaseNote(noteOrMidi: number | string): void {
    if (!this.ctx) return;
    const midi = typeof noteOrMidi === 'number' ? noteOrMidi : noteNameToMidi(noteOrMidi);
    const voices = this.activeVoices.get(midi);
    if (!voices || voices.length === 0) return;

    const now = this.ctx.currentTime;

    if (this.sustainPedal) {
      voices.forEach((v) => {
        v.isKeyHeld = false;
        v.isSustained = true;
      });
    } else if (this.sostenutoPedal && voices.some((v) => v.isSostenutoSustained)) {
      voices.forEach((v) => {
        v.isKeyHeld = false;
      });
    } else {
      voices.forEach((v) => {
        v.isKeyHeld = false;
        this.applyDamperRelease(v, now);
      });
      this.activeVoices.delete(midi);
    }
  }

  /**
   * Applies damper felt release to stop vibrating strings.
   */
  private applyDamperRelease(voice: ActiveVoice, now: number): void {
    const isOrgan = this.currentInstrument.includes('organ');
    const isPad = this.currentInstrument.includes('pad') || this.currentInstrument.includes('strings');
    const releaseTime = isOrgan ? 0.06 : isPad ? 0.45 : 0.24;

    try {
      voice.envelopeGain.gain.cancelScheduledValues(now);
      const currentGain = Math.max(0.0001, voice.envelopeGain.gain.value);
      voice.envelopeGain.gain.setValueAtTime(currentGain, now);
      voice.envelopeGain.gain.exponentialRampToValueAtTime(0.0001, now + releaseTime);

      setTimeout(() => {
        voice.oscillators.forEach((osc) => {
          try {
            osc.stop();
            osc.disconnect();
          } catch {
            // Already stopped
          }
        });
        voice.envelopeGain.disconnect();
      }, releaseTime * 1000 + 50);
    } catch {
      // Safe fallback
    }
  }

  /**
   * Hard requirement: immediately stops all sounding notes with zero stuck keys.
   */
  public stopAllNotes(): void {
    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    this.activeVoices.forEach((voices) => {
      voices.forEach((v) => {
        try {
          v.envelopeGain.gain.cancelScheduledValues(now);
          v.envelopeGain.gain.setValueAtTime(0.0001, now);
          v.oscillators.forEach((osc) => {
            try {
              osc.stop();
            } catch {
              // Ignore
            }
          });
        } catch {
          // Ignore
        }
      });
    });
    this.activeVoices.clear();
  }

  public releaseAllNotes(): void {
    this.stopAllNotes();
  }

  // ================= PREVIEW CHORD AUDITION =================

  /**
   * Plays a quick musical C-major 9th arpeggio to audition sounds in the Sound Browser.
   */
  public playPreviewPhrase(instrumentId: InstrumentId): void {
    const origInst = this.currentInstrument;
    this.setInstrument(instrumentId);

    const notes = [60, 64, 67, 71, 74]; // C4, E4, G4, B4, D5
    notes.forEach((midi, idx) => {
      setTimeout(() => {
        this.playNote(midi, 0.85);
        setTimeout(() => {
          this.releaseNote(midi);
        }, 1200);
      }, idx * 160);
    });

    setTimeout(() => {
      this.setInstrument(origInst);
    }, 1800);
  }

  // ================= SPECTRAL ANALYSER =================

  public getAudioActivityLevel(): number {
    if (!this.analyser || !this.analyserDataArray) return 0;
    this.analyser.getByteFrequencyData(this.analyserDataArray as any);
    let sum = 0;
    for (let i = 0; i < this.analyserDataArray.length; i++) {
      sum += this.analyserDataArray[i];
    }
    return sum / (this.analyserDataArray.length * 255);
  }

  public getContext(): AudioContext | null {
    return this.ctx;
  }

  public isReady(): boolean {
    return !!this.ctx && this.ctx.state === 'running';
  }

  public getLatency(): number {
    return this.ctx ? +(this.ctx.baseLatency || 0.008).toFixed(3) : 0;
  }

  // ================= TAP TEMPO ENGINE =================

  public tapTempo(): number {
    const now = performance.now();
    this.tapTimestamps = this.tapTimestamps.filter((t) => now - t < 3000);
    this.tapTimestamps.push(now);

    if (this.tapTimestamps.length >= 2) {
      let intervalSum = 0;
      for (let i = 1; i < this.tapTimestamps.length; i++) {
        intervalSum += this.tapTimestamps[i] - this.tapTimestamps[i - 1];
      }
      const avgInterval = intervalSum / (this.tapTimestamps.length - 1);
      const calculatedBpm = Math.round(60000 / avgInterval);
      const clampedBpm = Math.max(40, Math.min(240, calculatedBpm));
      return clampedBpm;
    }
    return this.metronomeBpm;
  }

  // ================= METRONOME ENGINE =================

  public startMetronome(
    bpm: number,
    timeSignature: number = 4,
    onBeat?: (beat: number) => void
  ): void {
    this.stopMetronome();
    this.metronomeBpm = bpm;
    this.metronomeTimeSignature = timeSignature;
    this.onMetronomeBeatCallback = onBeat;
    this.metronomeCurrentBeat = 0;

    const intervalMs = (60 / this.metronomeBpm) * 1000;

    this.playMetronomeTick(this.metronomeCurrentBeat);
    if (this.onMetronomeBeatCallback) {
      this.onMetronomeBeatCallback(this.metronomeCurrentBeat);
    }

    this.metronomeTimerId = window.setInterval(() => {
      this.metronomeCurrentBeat = (this.metronomeCurrentBeat + 1) % this.metronomeTimeSignature;
      this.playMetronomeTick(this.metronomeCurrentBeat);
      if (this.onMetronomeBeatCallback) {
        this.onMetronomeBeatCallback(this.metronomeCurrentBeat);
      }
    }, intervalMs);
  }

  public updateMetronomeBpm(bpm: number): void {
    this.metronomeBpm = bpm;
    if (this.metronomeTimerId !== null) {
      this.startMetronome(bpm, this.metronomeTimeSignature, this.onMetronomeBeatCallback);
    }
  }

  public stopMetronome(): void {
    if (this.metronomeTimerId !== null) {
      clearInterval(this.metronomeTimerId);
      this.metronomeTimerId = null;
    }
  }

  private playMetronomeTick(beat: number): void {
    if (!this.ctx || this.isMuted) return;
    const now = this.ctx.currentTime;
    const isDownbeat = beat === 0;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = isDownbeat ? 'triangle' : 'sine';
    osc.frequency.setValueAtTime(isDownbeat ? 1760 : 880, now);

    gain.gain.setValueAtTime(0.0001, now);
    gain.gain.linearRampToValueAtTime(isDownbeat ? 0.35 : 0.2, now + 0.002);
    gain.gain.exponentialRampToValueAtTime(0.0001, now + (isDownbeat ? 0.045 : 0.03));

    osc.connect(gain);
    gain.connect(this.masterGain || this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.06);
  }
}
