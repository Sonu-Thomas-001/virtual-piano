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

export type InstrumentId = 
  | 'acoustic-grand'
  | 'bright-piano'
  | 'upright-piano'
  | 'soft-piano'
  | 'electric-piano'
  | 'wurlitzer'
  | 'pipe-organ'
  | 'jazz-organ'
  | 'strings-pad'
  | 'analog-synth';

export interface InstrumentInfo {
  id: InstrumentId;
  name: string;
  category: 'Acoustic' | 'Electric' | 'Organ' | 'Ensemble & Synth';
  description: string;
  icon: string;
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
}

export type KeyLabelDisplay = 'both' | 'notes' | 'shortcuts' | 'none';

export type ReverbPreset = 'off' | 'room' | 'hall' | 'cathedral';

export interface PianoSettings {
  volume: number; // 0 to 1
  isMuted: boolean;
  instrument: InstrumentId;
  baseOctave: number; // Center octave, typically 3 or 4 (default: 3, showing C3-B4 for 2 octaves)
  visibleOctaves: number; // 2, 3, 4, 5, or 7 (88-key)
  keyLabels: KeyLabelDisplay;
  sustainEnabled: boolean;
  metronomeBpm: number;
  metronomeEnabled: boolean;
  metronomeTimeSignature: number; // e.g. 4 for 4/4
  latencyPreference: 'low' | 'balanced';
  transpose: number; // -12 to +12 semitones
  reverb: ReverbPreset;
  activeScale: string; // 'none' | 'c-major' | etc.
  practiceMode: boolean;
  practiceScale: string;
}

export interface ActiveNoteState {
  midi: number;
  note: string;
  velocity: number;
  source: 'mouse' | 'touch' | 'keyboard' | 'midi' | 'playback';
}
