import { PianoNote } from '@/types/piano';

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

/**
 * Standard 88-key piano:
 * Starts at A0 (MIDI 21) and ends at C8 (MIDI 108).
 */
export const MIN_MIDI = 21; // A0
export const MAX_MIDI = 108; // C8

/**
 * Calculates note frequency in Hertz using standard concert pitch A4 = 440Hz.
 */
export function midiToFrequency(midi: number): number {
  return +(440 * Math.pow(2, (midi - 69) / 12)).toFixed(2);
}

/**
 * Converts MIDI note number to note name and octave (e.g. 60 -> "C4")
 */
export function midiToNoteName(midi: number): { noteName: string; octave: number; fullName: string } {
  const noteIndex = (midi % 12 + 12) % 12;
  const octave = Math.floor(midi / 12) - 1;
  const noteName = NOTE_NAMES[noteIndex];
  return {
    noteName,
    octave,
    fullName: `${noteName}${octave}`,
  };
}

/**
 * Converts a note string (e.g. "C4", "F#5") to its MIDI note number.
 */
export function noteNameToMidi(note: string): number {
  const match = note.match(/^([A-G]#?)(-?\d+)$/i);
  if (!match) return 60;
  const name = match[1].toUpperCase();
  const octave = parseInt(match[2], 10);
  const noteIndex = NOTE_NAMES.indexOf(name);
  if (noteIndex === -1) return 60;
  return (octave + 1) * 12 + noteIndex;
}

/**
 * Generates all 88 keys of a standard grand piano.
 */
export function generate88Keys(): PianoNote[] {
  const keys: PianoNote[] = [];
  let whiteKeyCounter = 0;

  for (let midi = MIN_MIDI; midi <= MAX_MIDI; midi++) {
    const { noteName, octave, fullName } = midiToNoteName(midi);
    const isBlack = noteName.includes('#');

    keys.push({
      midi,
      name: fullName,
      noteName,
      octave,
      frequency: midiToFrequency(midi),
      type: isBlack ? 'black' : 'white',
      whiteKeyIndex: isBlack ? whiteKeyCounter - 1 : whiteKeyCounter++,
    });
  }

  return keys;
}

export const ALL_88_KEYS: PianoNote[] = generate88Keys();

/**
 * Default computer keyboard mapping for 2 octaves.
 * Lower octave:
 * White: A, S, D, F, G, H, J
 * Black: W, E,    T, Y, U
 * Upper octave:
 * White: K, L, ;, '
 * Black: O, P
 */
export const KEYBOARD_LAYOUT_KEYS = [
  // Lower octave (C to B)
  { key: 'a', noteOffset: 0, type: 'white' }, // C
  { key: 'w', noteOffset: 1, type: 'black' }, // C#
  { key: 's', noteOffset: 2, type: 'white' }, // D
  { key: 'e', noteOffset: 3, type: 'black' }, // D#
  { key: 'd', noteOffset: 4, type: 'white' }, // E
  { key: 'f', noteOffset: 5, type: 'white' }, // F
  { key: 't', noteOffset: 6, type: 'black' }, // F#
  { key: 'g', noteOffset: 7, type: 'white' }, // G
  { key: 'y', noteOffset: 8, type: 'black' }, // G#
  { key: 'h', noteOffset: 9, type: 'white' }, // A
  { key: 'u', noteOffset: 10, type: 'black' }, // A#
  { key: 'j', noteOffset: 11, type: 'white' }, // B
  // Upper octave (C+1 to E+1)
  { key: 'k', noteOffset: 12, type: 'white' }, // C (next octave)
  { key: 'o', noteOffset: 13, type: 'black' }, // C#
  { key: 'l', noteOffset: 14, type: 'white' }, // D
  { key: 'p', noteOffset: 15, type: 'black' }, // D#
  { key: ';', noteOffset: 16, type: 'white' }, // E
  { key: "'", noteOffset: 17, type: 'white' }, // F
];

/**
 * Assigns keyboard shortcuts to visible keys based on current base octave.
 */
export function assignKeyboardShortcuts(
  keys: PianoNote[],
  baseOctave: number
): Map<string, string> {
  // Returns map of keyboardKey -> noteName (e.g. "a" -> "C4")
  const mapping = new Map<string, string>();
  const baseMidi = (baseOctave + 1) * 12; // MIDI for C of baseOctave

  KEYBOARD_LAYOUT_KEYS.forEach(({ key, noteOffset }) => {
    const targetMidi = baseMidi + noteOffset;
    if (targetMidi >= MIN_MIDI && targetMidi <= MAX_MIDI) {
      const { fullName } = midiToNoteName(targetMidi);
      mapping.set(key.toLowerCase(), fullName);
    }
  });

  return mapping;
}

/**
 * Chord recognition utility: given a list of active MIDI notes,
 * identifies basic chords (Major, Minor, 7th, Sus, Diminished).
 */
export function detectChord(activeMidis: number[]): string | null {
  if (activeMidis.length < 2) return null;

  // Deduplicate pitch classes (0-11)
  const pitchClasses = Array.from(
    new Set(activeMidis.map((m) => (m % 12 + 12) % 12))
  ).sort((a, b) => a - b);

  if (pitchClasses.length < 2) return null;

  const rootMidi = Math.min(...activeMidis);
  const rootIndex = (rootMidi % 12 + 12) % 12;
  const rootName = NOTE_NAMES[rootIndex];

  // Calculate intervals relative to root
  const intervals = pitchClasses
    .map((p) => (p - rootIndex + 12) % 12)
    .sort((a, b) => a - b);

  const intervalStr = intervals.join(',');

  if (intervalStr === '0,4,7') return `${rootName} Major`;
  if (intervalStr === '0,3,7') return `${rootName} Minor`;
  if (intervalStr === '0,4,7,10') return `${rootName} 7`;
  if (intervalStr === '0,4,7,11') return `${rootName} Maj7`;
  if (intervalStr === '0,3,7,10') return `${rootName} m7`;
  if (intervalStr === '0,3,6') return `${rootName} Dim`;
  if (intervalStr === '0,4,8') return `${rootName} Aug`;
  if (intervalStr === '0,5,7') return `${rootName} Sus4`;
  if (intervalStr === '0,2,7') return `${rootName} Sus2`;
  if (intervalStr === '0,7') return `${rootName} 5th (Power)`;

  // Return note names joined if not standard chord
  return null;
}

/**
 * Returns set of note pitch class names (e.g. Set(['C', 'D', 'E', ...])) for a given scale ID.
 */
export function getScalePitchClasses(scaleId: string): Set<string> {
  const scaleMap: Record<string, string[]> = {
    'none': ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'],
    'c-major': ['C', 'D', 'E', 'F', 'G', 'A', 'B'],
    'g-major': ['G', 'A', 'B', 'C', 'D', 'E', 'F#'],
    'd-major': ['D', 'E', 'F#', 'G', 'A', 'B', 'C#'],
    'f-major': ['F', 'G', 'A', 'A#', 'C', 'D', 'E'],
    'a-minor': ['A', 'B', 'C', 'D', 'E', 'F', 'G'],
    'e-minor': ['E', 'F#', 'G', 'A', 'B', 'C', 'D'],
    'pentatonic-major': ['C', 'D', 'E', 'G', 'A'],
    'blues-c': ['C', 'D#', 'F', 'F#', 'G', 'A#'],
  };

  const list = scaleMap[scaleId] || scaleMap['c-major'];
  return new Set(list);
}

export interface PracticeStep {
  midi: number;
  name: string;
  index: number;
}

/**
 * Generates an ascending scale practice target sequence for a given scale and octave.
 */
export function getScalePracticeSequence(scaleId: string, baseOctave: number): PracticeStep[] {
  const pitchClasses = Array.from(getScalePitchClasses(scaleId === 'none' ? 'c-major' : scaleId));
  const octave = Math.max(2, Math.min(5, baseOctave));

  // Build notes ascending starting from root pitch
  const steps: PracticeStep[] = [];
  const rootName = pitchClasses[0];

  // Find root MIDI in current octave
  const startMidi = noteNameToMidi(`${rootName}${octave}`);
  
  // Collect 8-10 sequence steps
  let currentMidi = startMidi;
  let targetOctave = octave;

  pitchClasses.forEach((pName, idx) => {
    const midi = noteNameToMidi(`${pName}${targetOctave}`);
    const actualMidi = midi < startMidi ? midi + 12 : midi;
    steps.push({
      midi: actualMidi,
      name: midiToNoteName(actualMidi).fullName,
      index: idx,
    });
  });

  // Add the final root octave resolution (e.g. C5 if started at C4)
  const topOctaveMidi = startMidi + 12;
  steps.push({
    midi: topOctaveMidi,
    name: midiToNoteName(topOctaveMidi).fullName,
    index: steps.length,
  });

  // Sort ascending by MIDI
  steps.sort((a, b) => a.midi - b.midi);
  steps.forEach((s, idx) => (s.index = idx));

  return steps;
}

