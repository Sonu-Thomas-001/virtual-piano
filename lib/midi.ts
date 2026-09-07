export type MidiStatus = 'unsupported' | 'disconnected' | 'connected' | 'requesting';

export interface MidiHandler {
  onNoteOn: (midi: number, velocity: number) => void;
  onNoteOff: (midi: number) => void;
  onPedalChange?: (pedal: 'sustain' | 'sostenuto' | 'soft', active: boolean, value: number) => void;
  onStatusChange: (status: MidiStatus, deviceName?: string) => void;
  onPanicRelease?: () => void;
}

interface LocalMIDIMessageEvent {
  data: Uint8Array | number[];
}

interface LocalMIDIInput {
  name?: string;
  state: string;
  onmidimessage: ((event: LocalMIDIMessageEvent) => void) | null;
}

interface LocalMIDIAccess {
  inputs: Map<string, LocalMIDIInput>;
  onstatechange: (() => void) | null;
}

export class MidiController {
  private midiAccess: LocalMIDIAccess | null = null;
  private handlers: MidiHandler | null = null;
  private currentStatus: MidiStatus = 'disconnected';
  private connectedDeviceName: string = '';

  constructor() {}

  public isSupported(): boolean {
    return typeof window !== 'undefined' && 'requestMIDIAccess' in navigator;
  }

  public async init(handlers: MidiHandler): Promise<MidiStatus> {
    this.handlers = handlers;

    if (!this.isSupported()) {
      this.currentStatus = 'unsupported';
      handlers.onStatusChange('unsupported');
      return 'unsupported';
    }

    try {
      this.currentStatus = 'requesting';
      handlers.onStatusChange('requesting');

      const nav = navigator as unknown as {
        requestMIDIAccess: (opts: { sysex: boolean }) => Promise<LocalMIDIAccess>;
      };
      const access = await nav.requestMIDIAccess({ sysex: false });
      this.midiAccess = access;

      this.setupInputs();

      access.onstatechange = () => {
        this.setupInputs();
      };

      return this.currentStatus;
    } catch (err) {
      console.warn('Web MIDI permission denied or unavailable:', err);
      this.currentStatus = 'disconnected';
      handlers.onStatusChange('disconnected');
      return 'disconnected';
    }
  }

  private setupInputs(): void {
    if (!this.midiAccess) return;

    let foundConnected = false;
    let deviceName = '';

    this.midiAccess.inputs.forEach((input) => {
      if (input.state === 'connected') {
        foundConnected = true;
        deviceName = input.name || 'MIDI Device';
        input.onmidimessage = (event: LocalMIDIMessageEvent) => this.handleMidiMessage(event);
      }
    });

    if (foundConnected) {
      this.currentStatus = 'connected';
      this.connectedDeviceName = deviceName;
      this.handlers?.onStatusChange('connected', deviceName);
    } else {
      this.currentStatus = 'disconnected';
      this.connectedDeviceName = '';
      this.handlers?.onStatusChange('disconnected');
    }
  }

  private handleMidiMessage(event: LocalMIDIMessageEvent): void {
    if (!this.handlers || !event.data) return;

    const data = Array.from(event.data);
    const [statusByte, data1, data2] = data;
    const command = statusByte >> 4;

    // Command 9: Note On (0x9)
    if (command === 9) {
      const velocity = data2 / 127;
      if (data2 > 0) {
        this.handlers.onNoteOn(data1, velocity);
      } else {
        // Velocity 0 is note off per MIDI spec
        this.handlers.onNoteOff(data1);
      }
    }
    // Command 8: Note Off (0x8)
    else if (command === 8) {
      this.handlers.onNoteOff(data1);
    }
    // Command 11: Control Change (0xB)
    else if (command === 11) {
      const controllerNumber = data1;
      const controllerValue = data2;

      // CC64: Sustain / Damper Pedal
      if (controllerNumber === 64) {
        const isDown = controllerValue >= 64;
        this.handlers.onPedalChange?.('sustain', isDown, controllerValue);
      }
      // CC66: Sostenuto Pedal
      else if (controllerNumber === 66) {
        const isDown = controllerValue >= 64;
        this.handlers.onPedalChange?.('sostenuto', isDown, controllerValue);
      }
      // CC67: Soft Pedal (Una Corda)
      else if (controllerNumber === 67) {
        const isDown = controllerValue >= 64;
        this.handlers.onPedalChange?.('soft', isDown, controllerValue);
      }
      // CC120 / CC123: All Sound Off / All Notes Off (Panic)
      else if (controllerNumber === 120 || controllerNumber === 123) {
        this.handlers.onPanicRelease?.();
      }
    }
  }

  public disconnect(): void {
    if (this.midiAccess) {
      this.midiAccess.inputs.forEach((input) => {
        input.onmidimessage = null;
      });
      this.midiAccess.onstatechange = null;
      this.midiAccess = null;
    }
    this.currentStatus = 'disconnected';
  }

  public getStatus(): { status: MidiStatus; deviceName: string } {
    return {
      status: this.currentStatus,
      deviceName: this.connectedDeviceName,
    };
  }
}
