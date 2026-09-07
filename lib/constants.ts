import { InstrumentInfo, ReverbPreset } from '@/types/piano';

export const AVAILABLE_REVERBS: { id: ReverbPreset; name: string; description: string }[] = [
  { id: 'off', name: 'Dry / Off', description: 'Zero reverberation, direct intimate sound' },
  { id: 'room', name: 'Studio Room', description: 'Subtle warm room reflections (1.4s decay)' },
  { id: 'hall', name: 'Concert Hall', description: 'Lush symphonic auditorium acoustics (2.8s decay)' },
  { id: 'cathedral', name: 'Cathedral', description: 'Expansive stone sanctuary reverb (5.0s decay)' },
];

export const AVAILABLE_INSTRUMENTS: InstrumentInfo[] = [
  // Acoustic Pianos
  {
    id: 'acoustic-grand',
    name: 'Acoustic Grand Piano',
    category: 'Acoustic',
    description: 'Concert grand with hammer felt transient, soundboard body resonance and harmonic overtone decay.',
    icon: 'Piano',
  },
  {
    id: 'bright-piano',
    name: 'Studio Bright Piano',
    category: 'Acoustic',
    description: 'Punchy modern studio grand with sharp hammer attack and vibrant upper partials.',
    icon: 'Music',
  },
  {
    id: 'upright-piano',
    name: 'Vintage Upright Piano',
    category: 'Acoustic',
    description: 'Warm, intimate acoustic parlor upright with close-mic presence and subtle wooden cabinet resonance.',
    icon: 'Music2',
  },
  {
    id: 'soft-piano',
    name: 'Soft Felt Piano',
    category: 'Acoustic',
    description: 'Quiet, cinematic felt-damped tone with attenuated high frequencies and rich fundamental warmth.',
    icon: 'Volume1',
  },
  // Electric Pianos
  {
    id: 'electric-piano',
    name: 'Electric Piano (Rhodes)',
    category: 'Electric',
    description: 'Classic 1970s tine-based electric piano with warm FM bell attack and mellow chime.',
    icon: 'Sparkles',
  },
  {
    id: 'wurlitzer',
    name: 'Vintage Electric Reed',
    category: 'Electric',
    description: 'Gritty 1960s reed-based electric piano with subtle harmonic bite and dynamic bark.',
    icon: 'Zap',
  },
  // Organs
  {
    id: 'pipe-organ',
    name: 'Cathedral Pipe Organ',
    category: 'Organ',
    description: 'Grand liturgical pipe organ with stacked octave drawbars and sustaining majesty.',
    icon: 'Church',
  },
  {
    id: 'jazz-organ',
    name: 'Jazz B3 Drawbar',
    category: 'Organ',
    description: 'Soulful tonewheel drawbar organ with fast percussive key-click and rich harmonic overtone mix.',
    icon: 'Sliders',
  },
  // Ensemble & Synths
  {
    id: 'strings-pad',
    name: 'Symphonic Strings Pad',
    category: 'Ensemble & Synth',
    description: 'Lush bowing string section with slow expressive swell and stereo detuning.',
    icon: 'Disc',
  },
  {
    id: 'analog-synth',
    name: 'Warm Analog PolySynth',
    category: 'Ensemble & Synth',
    description: 'Rich dual-oscillator analog sawtooth synthesizer with resonant low-pass filter envelope.',
    icon: 'Activity',
  },
];

export interface ScaleDefinition {
  id: string;
  name: string;
  root: string;
  type: string;
  description: string;
  notes: string[]; // Note names e.g. ['C', 'D', 'E', 'F', 'G', 'A', 'B']
}

export const SCALES_LIST: ScaleDefinition[] = [
  {
    id: 'none',
    name: 'No Scale (Chromatic)',
    root: 'C',
    type: 'chromatic',
    description: 'All 12 chromatic pitches available without filtering',
    notes: ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
  },
  {
    id: 'c-major',
    name: 'C Major (Natural)',
    root: 'C',
    type: 'major',
    description: 'The foundation scale with all white keys: C, D, E, F, G, A, B',
    notes: ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
  },
  {
    id: 'g-major',
    name: 'G Major (1 Sharp: F#)',
    root: 'G',
    type: 'major',
    description: 'Bright and resonant standard key: G, A, B, C, D, E, F#',
    notes: ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
  },
  {
    id: 'd-major',
    name: 'D Major (2 Sharps: F#, C#)',
    root: 'D',
    type: 'major',
    description: 'Triumphant key: D, E, F#, G, A, B, C#',
    notes: ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
  },
  {
    id: 'f-major',
    name: 'F Major (1 Flat: Bb/A#)',
    root: 'F',
    type: 'major',
    description: 'Pastoral warm key: F, G, A, A#, C, D, E',
    notes: ['F', 'G', 'A', 'A#', 'C', 'D', 'E'],
  },
  {
    id: 'a-minor',
    name: 'A Natural Minor',
    root: 'A',
    type: 'minor',
    description: 'Relative minor of C Major with all natural white keys: A, B, C, D, E, F, G',
    notes: ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
  },
  {
    id: 'e-minor',
    name: 'E Natural Minor (1 Sharp)',
    root: 'E',
    type: 'minor',
    description: 'Melancholic guitar/piano favorite: E, F#, G, A, B, C, D',
    notes: ['E', 'F#', 'G', 'A', 'B', 'C', 'D'],
  },
  {
    id: 'pentatonic-major',
    name: 'C Major Pentatonic',
    root: 'C',
    type: 'pentatonic',
    description: 'Pure 5-note melodic scale: C, D, E, G, A (no dissonant semitones)',
    notes: ['C', 'D', 'E', 'G', 'A'],
  },
  {
    id: 'blues-c',
    name: 'C Blues Scale',
    root: 'C',
    type: 'blues',
    description: 'Expressive 6-note blues scale with blue note: C, D#, F, F#, G, A#',
    notes: ['C', 'D#', 'F', 'F#', 'G', 'A#'],
  },
];

