import { InstrumentInfo } from '@/types/piano';

export const AVAILABLE_INSTRUMENTS: InstrumentInfo[] = [
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
    description: 'Punchy studio upright piano with sharp hammer attack and vibrant upper partials.',
    icon: 'Music',
  },
  {
    id: 'electric-piano',
    name: 'Electric Piano (Rhodes)',
    category: 'Electric',
    description: 'Classic 1970s tine-based electric piano with warm FM bell attack and mellow chime.',
    icon: 'Sparkles',
  },
  {
    id: 'pipe-organ',
    name: 'Cathedral Pipe Organ',
    category: 'Organ',
    description: 'Grand liturgical organ with stacked octave drawbars and sustaining majesty.',
    icon: 'Church',
  },
  {
    id: 'strings-pad',
    name: 'Symphonic Strings Pad',
    category: 'Ensemble',
    description: 'Lush bowing string section with slow expressive swell and stereo detuning.',
    icon: 'Disc',
  },
];
