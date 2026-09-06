import { PianoSettings, Recording } from '@/types/piano';

const SETTINGS_KEY = 'virtual_piano_settings_v1';
const RECORDINGS_KEY = 'virtual_piano_recordings_v1';

export const DEFAULT_SETTINGS: PianoSettings = {
  volume: 0.8,
  isMuted: false,
  instrument: 'acoustic-grand',
  baseOctave: 3, // C3-B4 visible range by default for 2-3 octaves
  visibleOctaves: 3,
  keyLabels: 'both',
  sustainEnabled: false,
  metronomeBpm: 100,
  metronomeEnabled: false,
  metronomeTimeSignature: 4,
  latencyPreference: 'low',
};

export function loadSettings(): PianoSettings {
  if (typeof window === 'undefined') return DEFAULT_SETTINGS;
  try {
    const raw = localStorage.getItem(SETTINGS_KEY);
    if (!raw) return DEFAULT_SETTINGS;
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
  } catch (err) {
    console.warn('Could not load piano settings from localStorage:', err);
    return DEFAULT_SETTINGS;
  }
}

export function saveSettings(settings: PianoSettings): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  } catch (err) {
    console.warn('Could not save piano settings to localStorage:', err);
  }
}

export function loadRecordings(): Recording[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(RECORDINGS_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.warn('Could not load recordings from localStorage:', err);
    return [];
  }
}

export function saveRecordings(recordings: Recording[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(RECORDINGS_KEY, JSON.stringify(recordings));
  } catch (err) {
    console.warn('Could not save recordings to localStorage:', err);
  }
}
