import { Recording } from '@/types/piano';

/**
 * Encodes an integer as a Variable-Length Quantity (VLQ) for Standard MIDI files.
 */
function toVariableLength(value: number): number[] {
  let buffer = value & 0x7f;
  const bytes: number[] = [];

  while ((value >>= 7) > 0) {
    buffer <<= 8;
    buffer |= 0x80;
    buffer += value & 0x7f;
  }

  while (true) {
    bytes.push(buffer & 0xff);
    if (buffer & 0x80) {
      buffer >>= 8;
    } else {
      break;
    }
  }

  return bytes;
}

/**
 * Exports a Recording to a Standard MIDI File (SMF Type 0) Blob.
 */
export function exportRecordingToMidiBlob(recording: Recording, bpm: number = 120): Blob {
  const TICKS_PER_BEAT = 480;
  const MS_PER_BEAT = (60 / bpm) * 1000;
  const MS_PER_TICK = MS_PER_BEAT / TICKS_PER_BEAT;

  interface MidiEventItem {
    tick: number;
    type: 'on' | 'off';
    midi: number;
    velocity: number;
  }

  const events: MidiEventItem[] = [];

  recording.events.forEach((e) => {
    const startTick = Math.max(0, Math.round(e.startTime / MS_PER_TICK));
    const endMs = e.endTime ?? (e.startTime + 400);
    const endTick = Math.max(startTick + 1, Math.round(endMs / MS_PER_TICK));
    const vel = Math.max(1, Math.min(127, Math.round((e.velocity || 0.8) * 127)));

    events.push({
      tick: startTick,
      type: 'on',
      midi: e.midi,
      velocity: vel,
    });

    events.push({
      tick: endTick,
      type: 'off',
      midi: e.midi,
      velocity: 0,
    });
  });

  // Sort events by tick time (stable sort, note-off before note-on at same tick)
  events.sort((a, b) => {
    if (a.tick !== b.tick) return a.tick - b.tick;
    if (a.type === 'off' && b.type === 'on') return -1;
    if (a.type === 'on' && b.type === 'off') return 1;
    return 0;
  });

  // Build track bytes
  const trackBytes: number[] = [];

  // Track name meta event (0xFF 0x03)
  const trackName = recording.name || 'Virtual Piano Studio';
  const nameBytes = Array.from(new TextEncoder().encode(trackName));
  trackBytes.push(0x00, 0xff, 0x03, nameBytes.length, ...nameBytes);

  // Set Tempo meta event (0xFF 0x51 0x03) -> microseconds per quarter note
  const usPerQuarter = Math.round(60000000 / bpm);
  trackBytes.push(
    0x00,
    0xff,
    0x51,
    0x03,
    (usPerQuarter >> 16) & 0xff,
    (usPerQuarter >> 8) & 0xff,
    usPerQuarter & 0xff
  );

  let lastTick = 0;

  for (const ev of events) {
    const deltaTick = ev.tick - lastTick;
    lastTick = ev.tick;

    const deltaBytes = toVariableLength(deltaTick);
    trackBytes.push(...deltaBytes);

    if (ev.type === 'on') {
      trackBytes.push(0x90, ev.midi, ev.velocity);
    } else {
      trackBytes.push(0x80, ev.midi, 0);
    }
  }

  // End of Track meta event (0xFF 0x2F 0x00)
  trackBytes.push(0x00, 0xff, 0x2f, 0x00);

  // Track header: 'MTrk' + 4-byte length
  const trackLength = trackBytes.length;
  const trackHeader = [
    0x4d, 0x54, 0x72, 0x6b, // 'MTrk'
    (trackLength >> 24) & 0xff,
    (trackLength >> 16) & 0xff,
    (trackLength >> 8) & 0xff,
    trackLength & 0xff,
  ];

  // Header chunk: 'MThd' + length 6 + format 0 (1 track) + 1 track + division
  const fileHeader = [
    0x4d, 0x54, 0x68, 0x64, // 'MThd'
    0x00, 0x00, 0x00, 0x06, // length 6
    0x00, 0x00,             // format 0
    0x00, 0x01,             // 1 track
    (TICKS_PER_BEAT >> 8) & 0xff,
    TICKS_PER_BEAT & 0xff,
  ];

  const fullBytes = new Uint8Array([...fileHeader, ...trackHeader, ...trackBytes]);
  return new Blob([fullBytes], { type: 'audio/midi' });
}

/**
 * Prompts download of a Recording as a .mid file.
 */
export function downloadMidiFile(recording: Recording, bpm: number = 120): void {
  if (typeof window === 'undefined') return;
  const blob = exportRecordingToMidiBlob(recording, bpm);
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  const safeName = recording.name.toLowerCase().replace(/[^a-z0-9_-]/gi, '_');
  a.download = `${safeName || 'piano_recording'}.mid`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
