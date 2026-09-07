import { InstrumentId, ReverbPreset } from '@/types/piano';
import { midiToFrequency, noteNameToMidi } from '@/lib/notes';

interface ActiveVoice {
  midi: number;
  transposedMidi: number;
  oscillators: OscillatorNode[];
  gainNodes: GainNode[];
  filterNode?: BiquadFilterNode;
  noiseSource?: AudioBufferSourceNode;
  envelopeGain: GainNode;
  startedAt: number;
  isKeyHeld: boolean;
  isSustained: boolean;
}

export class AudioEngine {
  private static instance: AudioEngine | null = null;
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private compressor: DynamicsCompressorNode | null = null;
  private hammerNoiseBuffer: AudioBuffer | null = null;

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

  // State
  private currentInstrument: InstrumentId = 'acoustic-grand';
  private volume: number = 0.8;
  private isMuted: boolean = false;
  private sustainPedal: boolean = false;
  private isInitialized: boolean = false;
  private transposeSemitones: number = 0;

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
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtxClass) {
        console.error('Web Audio API is not supported in this browser.');
        return false;
      }

      this.ctx = new AudioCtxClass({
        latencyHint: 'interactive',
      });

      // Master Compressor to prevent clipping when multiple keys/chords are played
      this.compressor = this.ctx.createDynamicsCompressor();
      this.compressor.threshold.setValueAtTime(-14, this.ctx.currentTime);
      this.compressor.knee.setValueAtTime(8, this.ctx.currentTime);
      this.compressor.ratio.setValueAtTime(6, this.ctx.currentTime);
      this.compressor.attack.setValueAtTime(0.003, this.ctx.currentTime);
      this.compressor.release.setValueAtTime(0.15, this.ctx.currentTime);

      // Reverb Bus
      this.convolver = this.ctx.createConvolver();
      this.reverbWetGain = this.ctx.createGain();
      this.reverbDryGain = this.ctx.createGain();

      this.updateReverbImpulse(this.currentReverb);

      // Master Gain
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.volume, this.ctx.currentTime);

      // Analyser for real-time waveform / visualizer
      this.analyser = this.ctx.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;
      this.analyserDataArray = new Uint8Array(this.analyser.frequencyBinCount);

      // Signal Chain:
      // Voice -> Compressor
      // Compressor -> DryGain -> MasterGain
      // Compressor -> Convolver -> WetGain -> MasterGain
      // MasterGain -> Analyser -> Destination
      this.compressor.connect(this.reverbDryGain);
      this.reverbDryGain.connect(this.masterGain);

      this.compressor.connect(this.convolver);
      this.convolver.connect(this.reverbWetGain);
      this.reverbWetGain.connect(this.masterGain);

      this.masterGain.connect(this.analyser);
      this.analyser.connect(this.ctx.destination);

      // Generate realistic felt hammer noise buffer
      this.hammerNoiseBuffer = this.createHammerNoiseBuffer(this.ctx);
    }

    if (this.ctx.state === 'suspended') {
      try {
        await this.ctx.resume();
      } catch (err) {
        console.warn('Could not resume AudioContext yet:', err);
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

      case 'room': {
        const buf = this.createImpulseResponse(1.2, 3.5);
        if (buf) this.convolver.buffer = buf;
        this.reverbWetGain.gain.setTargetAtTime(0.22, now, 0.02);
        this.reverbDryGain.gain.setTargetAtTime(0.95, now, 0.02);
        break;
      }

      case 'cathedral': {
        const buf = this.createImpulseResponse(4.2, 1.8);
        if (buf) this.convolver.buffer = buf;
        this.reverbWetGain.gain.setTargetAtTime(0.55, now, 0.02);
        this.reverbDryGain.gain.setTargetAtTime(0.85, now, 0.02);
        break;
      }

      case 'hall':
      default: {
        const buf = this.createImpulseResponse(2.5, 2.2);
        if (buf) this.convolver.buffer = buf;
        this.reverbWetGain.gain.setTargetAtTime(0.35, now, 0.02);
        this.reverbDryGain.gain.setTargetAtTime(0.90, now, 0.02);
        break;
      }
    }
  }

  public setTranspose(semitones: number): void {
    this.transposeSemitones = Math.max(-12, Math.min(12, semitones));
  }

  public getTranspose(): number {
    return this.transposeSemitones;
  }

  public getAudioActivityLevel(): number {
    if (!this.analyser || !this.analyserDataArray) return 0;
    // Cast to satisfy TS 5.7+ ArrayBuffer vs ArrayBufferLike DOM signature
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
    this.currentInstrument = inst;
  }

  public setSustain(enabled: boolean): void {
    this.sustainPedal = enabled;

    // If sustain is lifted, release any notes that were already un-pressed by keys
    if (!enabled && this.ctx) {
      const now = this.ctx.currentTime;
      this.activeVoices.forEach((voices, midi) => {
        const remaining: ActiveVoice[] = [];
        voices.forEach((voice) => {
          if (!voice.isKeyHeld) {
            // Apply damper release
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
   * Plays a note (either MIDI number or note string like "C4")
   */
  public playNote(noteOrMidi: number | string, velocity: number = 0.8): void {
    const originalMidi = typeof noteOrMidi === 'number' ? noteOrMidi : noteNameToMidi(noteOrMidi);
    const transposedMidi = Math.max(21, Math.min(108, originalMidi + this.transposeSemitones));
    const freq = midiToFrequency(transposedMidi);

    // Auto init if needed
    if (!this.ctx || this.ctx.state !== 'running') {
      this.initAudio().then(() => this.startVoice(originalMidi, transposedMidi, freq, velocity));
      return;
    }

    this.startVoice(originalMidi, transposedMidi, freq, velocity);
  }

  private startVoice(originalMidi: number, transposedMidi: number, freq: number, velocity: number): void {
    if (!this.ctx || !this.compressor) return;

    const now = this.ctx.currentTime;
    const clampedVel = Math.max(0.1, Math.min(1, velocity));

    // Master envelope gain for this individual voice
    const envelopeGain = this.ctx.createGain();
    envelopeGain.gain.setValueAtTime(0.0001, now);

    const oscillators: OscillatorNode[] = [];
    const gainNodes: GainNode[] = [];
    let filterNode: BiquadFilterNode | undefined;

    switch (this.currentInstrument) {
      case 'bright-piano':
        this.createBrightPianoVoice(freq, clampedVel, now, envelopeGain, oscillators, gainNodes);
        break;

      case 'upright-piano':
        filterNode = this.createUprightPianoVoice(transposedMidi, freq, clampedVel, now, envelopeGain, oscillators, gainNodes);
        break;

      case 'soft-piano':
        filterNode = this.createSoftPianoVoice(transposedMidi, freq, clampedVel, now, envelopeGain, oscillators, gainNodes);
        break;

      case 'electric-piano':
        this.createElectricPianoVoice(freq, clampedVel, now, envelopeGain, oscillators, gainNodes);
        break;

      case 'wurlitzer':
        this.createWurlitzerVoice(freq, clampedVel, now, envelopeGain, oscillators, gainNodes);
        break;

      case 'pipe-organ':
        this.createOrganVoice(freq, clampedVel, now, envelopeGain, oscillators, gainNodes);
        break;

      case 'jazz-organ':
        this.createJazzOrganVoice(freq, clampedVel, now, envelopeGain, oscillators, gainNodes);
        break;

      case 'strings-pad':
        this.createStringsVoice(freq, clampedVel, now, envelopeGain, oscillators, gainNodes);
        break;

      case 'analog-synth':
        this.createAnalogSynthVoice(freq, clampedVel, now, envelopeGain, oscillators, gainNodes);
        break;

      case 'acoustic-grand':
      default:
        filterNode = this.createAcousticGrandVoice(transposedMidi, freq, clampedVel, now, envelopeGain, oscillators, gainNodes);
        break;
    }

    // Connect voice output
    envelopeGain.connect(this.compressor);

    // Track active voice keyed by original MIDI
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
    };

    const existing = this.activeVoices.get(originalMidi) || [];
    existing.push(voice);
    this.activeVoices.set(originalMidi, existing);
  }

  /**
   * Acoustic Grand Piano Voice
   */
  private createAcousticGrandVoice(
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
    const startCutoff = Math.min(14000, freq * (3.5 + velocity * 4));
    filter.frequency.setValueAtTime(startCutoff, now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(400, freq * 1.5), now + 2.5);

    const normalizedOctave = Math.max(0, Math.min(8, midi / 12 - 1));
    const decayDuration = Math.max(1.2, 4.8 - normalizedOctave * 0.42);

    envelopeGain.gain.setValueAtTime(0.0001, now);
    envelopeGain.gain.linearRampToValueAtTime(velocity * 0.9, now + 0.004);
    envelopeGain.gain.exponentialRampToValueAtTime(velocity * 0.45, now + 0.12);
    envelopeGain.gain.exponentialRampToValueAtTime(0.0001, now + decayDuration);

    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);

    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0.7, now);
    osc1.connect(gain1);
    gain1.connect(filter);
    oscillators.push(osc1);
    gainNodes.push(gain1);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 2.0015, now);

    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.35, now);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + decayDuration * 0.7);
    osc2.connect(gain2);
    gain2.connect(filter);
    oscillators.push(osc2);
    gainNodes.push(gain2);

    const osc3 = ctx.createOscillator();
    osc3.type = 'sine';
    osc3.frequency.setValueAtTime(freq * 3.004, now);

    const gain3 = ctx.createGain();
    gain3.gain.setValueAtTime(0.18, now);
    gain3.gain.exponentialRampToValueAtTime(0.0001, now + decayDuration * 0.45);
    osc3.connect(gain3);
    gain3.connect(filter);
    oscillators.push(osc3);
    gainNodes.push(gain3);

    if (this.hammerNoiseBuffer) {
      const noise = ctx.createBufferSource();
      noise.buffer = this.hammerNoiseBuffer;
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(velocity * 0.18, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.02);

      const noiseFilter = ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(Math.min(3000, freq * 2.2), now);
      noiseFilter.Q.setValueAtTime(3.0, now);

      noise.connect(noiseFilter);
      noiseFilter.connect(noiseGain);
      noiseGain.connect(envelopeGain);

      noise.start(now);
      noise.stop(now + 0.03);
    }

    filter.connect(envelopeGain);

    oscillators.forEach((osc) => {
      osc.start(now);
      osc.stop(now + decayDuration + 0.1);
    });

    return filter;
  }

  /**
   * Vintage Upright Piano Voice
   */
  private createUprightPianoVoice(
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
    filter.frequency.setValueAtTime(Math.min(9000, freq * (2.8 + velocity * 3)), now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(300, freq * 1.3), now + 1.8);

    const decayDuration = 2.8;
    envelopeGain.gain.setValueAtTime(0.0001, now);
    envelopeGain.gain.linearRampToValueAtTime(velocity * 0.88, now + 0.005);
    envelopeGain.gain.exponentialRampToValueAtTime(0.0001, now + decayDuration);

    // Warm body harmonic pair
    const osc1 = ctx.createOscillator();
    osc1.type = 'triangle';
    osc1.frequency.setValueAtTime(freq, now);

    const osc2 = ctx.createOscillator();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(freq * 1.998, now); // Slight detuned upright wood cabinet

    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0.65, now);
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.35, now);

    osc1.connect(gain1);
    osc2.connect(gain2);
    gain1.connect(filter);
    gain2.connect(filter);
    filter.connect(envelopeGain);

    oscillators.push(osc1, osc2);
    gainNodes.push(gain1, gain2);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + decayDuration + 0.1);
    osc2.stop(now + decayDuration + 0.1);

    return filter;
  }

  /**
   * Soft Felt Piano Voice
   */
  private createSoftPianoVoice(
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
    // Heavily damped top frequencies (felt cloth between hammers and strings)
    filter.frequency.setValueAtTime(Math.min(2600, freq * 2.2), now);

    const decayDuration = 3.2;
    envelopeGain.gain.setValueAtTime(0.0001, now);
    envelopeGain.gain.linearRampToValueAtTime(velocity * 0.75, now + 0.015); // gentle felt attack
    envelopeGain.gain.exponentialRampToValueAtTime(0.0001, now + decayDuration);

    const osc = ctx.createOscillator();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    const oscSub = ctx.createOscillator();
    oscSub.type = 'triangle';
    oscSub.frequency.setValueAtTime(freq, now);

    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0.65, now);
    const gain2 = ctx.createGain();
    gain2.gain.setValueAtTime(0.3, now);

    osc.connect(gain1);
    oscSub.connect(gain2);
    gain1.connect(filter);
    gain2.connect(filter);
    filter.connect(envelopeGain);

    oscillators.push(osc, oscSub);
    gainNodes.push(gain1, gain2);
    osc.start(now);
    oscSub.start(now);
    osc.stop(now + decayDuration + 0.1);
    oscSub.stop(now + decayDuration + 0.1);

    return filter;
  }

  /**
   * Wurlitzer Electric Reed Piano
   */
  private createWurlitzerVoice(
    freq: number,
    velocity: number,
    now: number,
    envelopeGain: GainNode,
    oscillators: OscillatorNode[],
    gainNodes: GainNode[]
  ): void {
    const ctx = this.ctx!;
    envelopeGain.gain.setValueAtTime(0.0001, now);
    envelopeGain.gain.linearRampToValueAtTime(velocity * 0.82, now + 0.004);
    envelopeGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);

    // Square + Saw reed blend
    const osc1 = ctx.createOscillator();
    osc1.type = 'square';
    osc1.frequency.setValueAtTime(freq, now);

    const osc2 = ctx.createOscillator();
    osc2.type = 'triangle';
    osc2.frequency.setValueAtTime(freq * 2, now);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(6000, freq * 4), now);
    filter.Q.setValueAtTime(2.0, now);

    const g1 = ctx.createGain();
    g1.gain.setValueAtTime(0.4, now);
    const g2 = ctx.createGain();
    g2.gain.setValueAtTime(0.3, now);

    osc1.connect(g1);
    osc2.connect(g2);
    g1.connect(filter);
    g2.connect(filter);
    filter.connect(envelopeGain);

    oscillators.push(osc1, osc2);
    gainNodes.push(g1, g2);
    osc1.start(now);
    osc2.start(now);
    osc1.stop(now + 3.2);
    osc2.stop(now + 3.2);
  }

  /**
   * Jazz B3 Drawbar Organ
   */
  private createJazzOrganVoice(
    freq: number,
    velocity: number,
    now: number,
    envelopeGain: GainNode,
    oscillators: OscillatorNode[],
    gainNodes: GainNode[]
  ): void {
    const ctx = this.ctx!;
    envelopeGain.gain.setValueAtTime(0.0001, now);
    envelopeGain.gain.linearRampToValueAtTime(velocity * 0.72, now + 0.008);

    // Standard Jazz B3 drawbars: Sub-octave (16'), Fundamental (8'), 5th (2 2/3'), Octave (4')
    const drawbars = [
      { ratio: 0.5, amp: 0.4 },
      { ratio: 1.0, amp: 0.5 },
      { ratio: 2.0, amp: 0.3 },
      { ratio: 3.0, amp: 0.15 },
    ];

    drawbars.forEach(({ ratio, amp }) => {
      const osc = ctx.createOscillator();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq * ratio, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(amp, now);

      osc.connect(gain);
      gain.connect(envelopeGain);

      oscillators.push(osc);
      gainNodes.push(gain);
      osc.start(now);
    });

    // Percussive key-click
    const clickOsc = ctx.createOscillator();
    clickOsc.type = 'triangle';
    clickOsc.frequency.setValueAtTime(freq * 3, now);
    const clickGain = ctx.createGain();
    clickGain.gain.setValueAtTime(velocity * 0.35, now);
    clickGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.035);
    clickOsc.connect(clickGain);
    clickGain.connect(envelopeGain);
    oscillators.push(clickOsc);
    gainNodes.push(clickGain);
    clickOsc.start(now);
    clickOsc.stop(now + 0.05);
  }

  /**
   * Analog PolySynth
   */
  private createAnalogSynthVoice(
    freq: number,
    velocity: number,
    now: number,
    envelopeGain: GainNode,
    oscillators: OscillatorNode[],
    gainNodes: GainNode[]
  ): void {
    const ctx = this.ctx!;
    envelopeGain.gain.setValueAtTime(0.0001, now);
    envelopeGain.gain.linearRampToValueAtTime(velocity * 0.65, now + 0.04); // subtle pad attack
    envelopeGain.gain.exponentialRampToValueAtTime(velocity * 0.45, now + 0.3);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(8000, freq * 5), now);
    filter.frequency.exponentialRampToValueAtTime(Math.max(350, freq * 1.8), now + 1.5);
    filter.Q.setValueAtTime(4.0, now);

    // 2 detuned sawtooth oscillators
    [-6, 6].forEach((detune) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime(detune, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.4, now);

      osc.connect(gain);
      gain.connect(filter);

      oscillators.push(osc);
      gainNodes.push(gain);
      osc.start(now);
    });

    filter.connect(envelopeGain);
  }

  /**
   * Bright Piano Voice:
   * Crisp, cutting modern studio piano tone.
   */
  private createBrightPianoVoice(
    freq: number,
    velocity: number,
    now: number,
    envelopeGain: GainNode,
    oscillators: OscillatorNode[],
    gainNodes: GainNode[]
  ): void {
    const ctx = this.ctx!;
    envelopeGain.gain.setValueAtTime(0.0001, now);
    envelopeGain.gain.linearRampToValueAtTime(velocity * 0.85, now + 0.003);
    envelopeGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.0);

    const osc1 = ctx.createOscillator();
    osc1.type = 'sawtooth';
    osc1.frequency.setValueAtTime(freq, now);

    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(Math.min(16000, freq * 7), now);
    filter.frequency.exponentialRampToValueAtTime(freq * 2, now + 2.0);

    const gain1 = ctx.createGain();
    gain1.gain.setValueAtTime(0.5, now);

    osc1.connect(filter);
    filter.connect(gain1);
    gain1.connect(envelopeGain);

    oscillators.push(osc1);
    gainNodes.push(gain1);

    osc1.start(now);
    osc1.stop(now + 3.1);
  }

  /**
   * Electric Piano (Rhodes) Voice:
   * Warm FM bell-like tone with soft sine body.
   */
  private createElectricPianoVoice(
    freq: number,
    velocity: number,
    now: number,
    envelopeGain: GainNode,
    oscillators: OscillatorNode[],
    gainNodes: GainNode[]
  ): void {
    const ctx = this.ctx!;
    envelopeGain.gain.setValueAtTime(0.0001, now);
    envelopeGain.gain.linearRampToValueAtTime(velocity * 0.8, now + 0.006);
    envelopeGain.gain.exponentialRampToValueAtTime(0.0001, now + 3.5);

    // Carrier
    const carrier = ctx.createOscillator();
    carrier.type = 'sine';
    carrier.frequency.setValueAtTime(freq, now);

    // Modulator (FM tines)
    const modulator = ctx.createOscillator();
    modulator.type = 'sine';
    modulator.frequency.setValueAtTime(freq * 14, now); // Sharp tine harmonic

    const modGain = ctx.createGain();
    modGain.gain.setValueAtTime(freq * 1.8 * velocity, now);
    modGain.gain.exponentialRampToValueAtTime(0.1, now + 0.4);

    modulator.connect(modGain);
    modGain.connect(carrier.frequency);

    const carrierGain = ctx.createGain();
    carrierGain.gain.setValueAtTime(0.6, now);

    carrier.connect(carrierGain);
    carrierGain.connect(envelopeGain);

    oscillators.push(carrier, modulator);
    gainNodes.push(carrierGain, modGain);

    carrier.start(now);
    modulator.start(now);
    carrier.stop(now + 3.6);
    modulator.stop(now + 3.6);
  }

  /**
   * Pipe Organ Voice:
   * Continuous church organ drawbars (8', 4', 2').
   */
  private createOrganVoice(
    freq: number,
    velocity: number,
    now: number,
    envelopeGain: GainNode,
    oscillators: OscillatorNode[],
    gainNodes: GainNode[]
  ): void {
    const ctx = this.ctx!;
    envelopeGain.gain.setValueAtTime(0.0001, now);
    envelopeGain.gain.linearRampToValueAtTime(velocity * 0.7, now + 0.02);

    const ratios = [1, 2, 4];
    const amplitudes = [0.5, 0.35, 0.2];

    ratios.forEach((ratio, idx) => {
      const osc = ctx.createOscillator();
      osc.type = idx === 0 ? 'triangle' : 'sine';
      osc.frequency.setValueAtTime(freq * ratio, now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(amplitudes[idx], now);

      osc.connect(gain);
      gain.connect(envelopeGain);

      oscillators.push(osc);
      gainNodes.push(gain);
      osc.start(now);
    });
  }

  /**
   * Strings Pad Voice:
   * Lush orchestral pad with soft swell.
   */
  private createStringsVoice(
    freq: number,
    velocity: number,
    now: number,
    envelopeGain: GainNode,
    oscillators: OscillatorNode[],
    gainNodes: GainNode[]
  ): void {
    const ctx = this.ctx!;
    envelopeGain.gain.setValueAtTime(0.0001, now);
    envelopeGain.gain.linearRampToValueAtTime(velocity * 0.65, now + 0.22); // Slow soft attack

    [-4, 4].forEach((detune) => {
      const osc = ctx.createOscillator();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, now);
      osc.detune.setValueAtTime(detune, now);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(Math.min(5000, freq * 3.2), now);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.3, now);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(envelopeGain);

      oscillators.push(osc);
      gainNodes.push(gain);
      osc.start(now);
    });
  }

  /**
   * Releases a note (key up).
   * If sustain pedal is currently active, the voice continues sounding until sustain is released.
   */
  public releaseNote(noteOrMidi: number | string): void {
    if (!this.ctx) return;
    const midi = typeof noteOrMidi === 'number' ? noteOrMidi : noteNameToMidi(noteOrMidi);
    const voices = this.activeVoices.get(midi);
    if (!voices || voices.length === 0) return;

    const now = this.ctx.currentTime;

    if (this.sustainPedal) {
      // Mark key as released, but keep voice sustained
      voices.forEach((v) => {
        v.isKeyHeld = false;
        v.isSustained = true;
      });
    } else {
      // Release immediately with acoustic damper release
      voices.forEach((v) => {
        v.isKeyHeld = false;
        this.applyDamperRelease(v, now);
      });
      this.activeVoices.delete(midi);
    }
  }

  /**
   * Applies damper release to a voice (acoustic felt damper stopping the strings).
   */
  private applyDamperRelease(voice: ActiveVoice, now: number): void {
    const isOrgan = this.currentInstrument === 'pipe-organ' || this.currentInstrument === 'jazz-organ';
    const isPad = this.currentInstrument === 'strings-pad' || this.currentInstrument === 'analog-synth';
    const releaseTime = isOrgan ? 0.06 : isPad ? 0.45 : 0.22;

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
   * Immediately stops all notes (e.g. panic or stop playback).
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

  // ================= TAP TEMPO ENGINE =================

  public tapTempo(): number {
    const now = performance.now();
    // Clear taps older than 3 seconds
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

    // Trigger initial beat
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
