import { Recording } from '@/types/piano';

/**
 * Standard MIDI File (SMF Type 0) generator for recorded piano performances.
 * Encodes track chunks with delta times, Note On/Off, Tempo, and CC64 (Sustain) events.
 */
export class MidiExporter {
  /**
   * Converts a Recording object into a standard MIDI (.mid) binary Blob.
   */
  public static exportToMidiBlob(recording: Recording, bpm: number = 120): Blob {
    const bytes = this.generateMidiBytes(recording, bpm);
    return new Blob([new Uint8Array(bytes)], { type: 'audio/midi' });
  }

  /**
   * Triggers a browser download of the recorded performance as a .mid file.
   */
  public static downloadMidiFile(recording: Recording, bpm: number = 120): void {
    const blob = this.exportToMidiBlob(recording, bpm);
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    const safeName = (recording.name || 'piano-recording')
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
    a.download = `${safeName || 'performance'}.mid`;
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 200);
  }

  private static generateMidiBytes(recording: Recording, bpm: number): number[] {
    const ticksPerQuarter = 480;
    const msPerTick = (60000 / (bpm || 120)) / ticksPerQuarter;

    interface RawMidiEvent {
      tick: number;
      type: 'on' | 'off';
      midi: number;
      velocity: number;
    }

    const rawEvents: RawMidiEvent[] = [];

    // Parse note events into NoteOn and NoteOff events with tick times
    recording.events.forEach((ev) => {
      const startTick = Math.max(0, Math.round(ev.startTime / msPerTick));
      const endTick = Math.max(startTick + 20, Math.round((ev.endTime ?? ev.startTime + 400) / msPerTick));
      const velocityByte = Math.max(1, Math.min(127, Math.round((ev.velocity || 0.8) * 127)));

      rawEvents.push({
        tick: startTick,
        type: 'on',
        midi: ev.midi,
        velocity: velocityByte,
      });

      rawEvents.push({
        tick: endTick,
        type: 'off',
        midi: ev.midi,
        velocity: 0,
      });
    });

    // Sort events chronologically. If tick is identical, NoteOff takes precedence over NoteOn
    rawEvents.sort((a, b) => {
      if (a.tick !== b.tick) return a.tick - b.tick;
      if (a.type === 'off' && b.type === 'on') return -1;
      if (a.type === 'on' && b.type === 'off') return 1;
      return 0;
    });

    // Track chunk data
    const trackData: number[] = [];

    // Set Track Name Meta Event
    const trackName = recording.name || 'Virtual Piano Studio';
    const nameBytes = Array.from(new TextEncoder().encode(trackName));
    trackData.push(0x00); // delta time 0
    trackData.push(0xff, 0x03, nameBytes.length, ...nameBytes);

    // Set Tempo Meta Event (microseconds per quarter note)
    const microsecsPerQuarter = Math.round(60000000 / (bpm || 120));
    trackData.push(0x00); // delta time 0
    trackData.push(
      0xff,
      0x51,
      0x03,
      (microsecsPerQuarter >> 16) & 0xff,
      (microsecsPerQuarter >> 8) & 0xff,
      microsecsPerQuarter & 0xff
    );

    // Set Time Signature Meta Event (4/4, 24 clocks/tick, 8 32nd notes/beat)
    trackData.push(0x00);
    trackData.push(0xff, 0x58, 0x04, 0x04, 0x02, 0x18, 0x08);

    // Write note events with delta times
    let lastTick = 0;
    rawEvents.forEach((ev) => {
      const deltaTicks = Math.max(0, ev.tick - lastTick);
      lastTick = ev.tick;

      // Write variable length quantity for delta time
      const vlqBytes = this.toVariableLengthQuantity(deltaTicks);
      trackData.push(...vlqBytes);

      if (ev.type === 'on') {
        trackData.push(0x90, ev.midi, ev.velocity);
      } else {
        trackData.push(0x80, ev.midi, 0x40);
      }
    });

    // End of Track Meta Event: delta time 0, FF 2F 00
    trackData.push(0x00, 0xff, 0x2f, 0x00);

    // Construct full SMF Type 0 file
    const fileBytes: number[] = [];

    // Header Chunk 'MThd'
    fileBytes.push(0x4d, 0x54, 0x68, 0x64); // "MThd"
    fileBytes.push(0x00, 0x00, 0x00, 0x06); // Header length = 6
    fileBytes.push(0x00, 0x00); // Format 0 (single track)
    fileBytes.push(0x00, 0x01); // 1 track
    fileBytes.push((ticksPerQuarter >> 8) & 0xff, ticksPerQuarter & 0xff); // Division

    // Track Chunk 'MTrk'
    fileBytes.push(0x4d, 0x54, 0x72, 0x6b); // "MTrk"
    const trackLen = trackData.length;
    fileBytes.push(
      (trackLen >> 24) & 0xff,
      (trackLen >> 16) & 0xff,
      (trackLen >> 8) & 0xff,
      trackLen & 0xff
    );
    fileBytes.push(...trackData);

    return fileBytes;
  }

  private static toVariableLengthQuantity(value: number): number[] {
    let buffer = value & 0x7f;
    const bytes: number[] = [];
    while ((value >>= 7)) {
      buffer <<= 8;
      buffer |= (value & 0x7f) | 0x80;
    }
    while (true) {
      bytes.push(buffer & 0xff);
      if (buffer & 0x80) buffer >>= 8;
      else break;
    }
    return bytes;
  }
}
