export type KeyType = 'white' | 'black';

export type KeyStatus = 'idle' | 'pressed' | 'sustained';

export interface PianoNote {
  midi: number;
  name: string; // e.g. "C4"
  noteName: string; // e.g. "C"
  octave: number; // e.g. 4
  frequency: number; // e.g. 261.63
  type: KeyType;
  whiteKeyIndex: number; // Index among white keys (for geometric positioning)
  defaultShortcut?: string; // Default computer keyboard key (e.g. "A")
}

export type InstrumentCategory =
  | 'Grand Pianos'
  | 'Upright Pianos'
  | 'Electric Pianos'
  | 'Keys'
  | 'Organ'
  | 'Strings'
  | 'Pads'
  | 'Hybrid';

export type InstrumentId =
  // Grand Pianos
  | 'concert-grand'
  | 'studio-grand'
  | 'bright-grand'
  | 'warm-grand'
  | 'soft-grand'
  | 'cinematic-grand'
  | 'classical-grand'
  | 'vintage-grand'
  // Upright Pianos
  | 'classic-upright'
  | 'warm-upright'
  | 'vintage-upright'
  | 'felt-upright'
  | 'dark-upright'
  // Electric Pianos
  | 'electric-piano'
  | 'rhodes'
  | 'wurlitzer'
  | 'fm-electric-piano'
  | 'suitcase-ep'
  // Keys
  | 'clavinet'
  | 'soft-keys'
  | 'vintage-keys'
  // Organ
  | 'jazz-organ'
  | 'church-organ'
  | 'rock-organ'
  | 'soft-organ'
  // Strings
  | 'solo-strings'
  | 'string-ensemble'
  | 'warm-strings'
  | 'cinematic-strings'
  // Pads
  | 'warm-pad'
  | 'ambient-pad'
  | 'cinematic-pad'
  | 'synth-pad'
  // Hybrid
  | 'piano-strings'
  | 'piano-pad'
  | 'piano-choir'
  | 'piano-synth'
  // Backward compatibility legacy aliases
  | 'acoustic-grand'
  | 'bright-piano'
  | 'upright-piano'
  | 'soft-piano'
  | 'pipe-organ'
  | 'strings-pad'
  | 'analog-synth';

export interface InstrumentInfo {
  id: InstrumentId;
  name: string;
  category: InstrumentCategory;
  description: string;
  icon?: string;
  sampleMap?: Record<string, string>;
  volume?: number;
  attack?: number;
  release?: number;
  brightness?: number;
  reverb?: ReverbPreset;
}

export interface NoteEvent {
  midi: number;
  note: string;
  velocity: number;
  startTime: number; // in milliseconds from recording start
  endTime?: number;
}

export interface Recording {
  id: string;
  name: string;
  createdAt: number;
  duration: number; // in milliseconds
  events: NoteEvent[];
  tempo?: number;
  instrument?: string;
}

export type KeyLabelDisplay = 'both' | 'notes' | 'shortcuts' | 'none';

export type ReverbPreset = 'off' | 'studio' | 'room' | 'hall' | 'cathedral';

export interface PianoSettings {
  volume: number; // 0 to 1
  isMuted: boolean;
  instrument: InstrumentId;
  baseOctave: number; // Center octave, typically 3 or 4
  visibleOctaves: number; // 1, 2, 3, 4, 5, or 7 (88-key)
  keyLabels: KeyLabelDisplay;
  // Three-Pedal System
  sustainEnabled: boolean;
  sostenutoEnabled?: boolean;
  softPedalEnabled?: boolean;
  // Tone & Expressiveness
  brightness?: number; // 0 to 100% (default: 50%)
  dynamics?: number; // 0 to 100% (default: 75%)
  tuningHz?: number; // 430 to 450 Hz (default: 440 Hz)
  stereoWidth?: number; // 0 to 100% (default: 70%)
  // 3-Band EQ (dB -12 to +12)
  eqLow?: number;
  eqMid?: number;
  eqHigh?: number;
  damperResonance?: number; // 0 to 100%
  // Metronome
  metronomeBpm: number;
  metronomeEnabled: boolean;
  metronomeTimeSignature: number; // 2, 3, 4, or 6
  countInBars: number; // 0 (off), 1, 2
  latencyPreference: 'low' | 'balanced';
  transpose: number; // -12 to +12 semitones
  reverb: ReverbPreset;
  activeScale: string; // 'none' | 'c-major' | etc.
  practiceMode: boolean;
  practiceScale: string;
  // Sound library curation
  favoriteSounds?: InstrumentId[];
  recentSounds?: InstrumentId[];
  // View Modes
  performanceMode?: boolean;
  immersiveMode?: boolean;
}

export interface ActiveNoteState {
  midi: number;
  note: string;
  velocity: number;
  source: 'mouse' | 'touch' | 'keyboard' | 'midi' | 'playback';
}
