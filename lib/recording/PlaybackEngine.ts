import { NoteEvent, Recording } from '@/types/piano';
import { AudioEngine } from '@/lib/audio/AudioEngine';

export class PlaybackEngine {
  private isPlaying: boolean = false;
  private isPaused: boolean = false;
  private currentRecording: Recording | null = null;
  private playbackStartTime: number = 0;
  private pausedAtTime: number = 0;
  private activeTimeouts: number[] = [];
  private animationFrameId: number | null = null;

  // Callbacks
  private onNotePlay?: (midi: number, note: string) => void;
  private onNoteRelease?: (midi: number, note: string) => void;
  private onProgress?: (currentTimeMs: number, durationMs: number) => void;
  private onFinished?: () => void;

  constructor() {}

  public setCallbacks(callbacks: {
    onNotePlay?: (midi: number, note: string) => void;
    onNoteRelease?: (midi: number, note: string) => void;
    onProgress?: (currentTimeMs: number, durationMs: number) => void;
    onFinished?: () => void;
  }): void {
    this.onNotePlay = callbacks.onNotePlay;
    this.onNoteRelease = callbacks.onNoteRelease;
    this.onProgress = callbacks.onProgress;
    this.onFinished = callbacks.onFinished;
  }

  public play(recording: Recording, startFromMs: number = 0): void {
    this.stop();

    if (!recording.events || recording.events.length === 0) {
      this.onFinished?.();
      return;
    }

    this.currentRecording = recording;
    this.isPlaying = true;
    this.isPaused = false;
    this.playbackStartTime = performance.now() - startFromMs;
    const audioEngine = AudioEngine.getInstance();

    // Schedule all note events
    recording.events.forEach((event) => {
      const startDelay = event.startTime - startFromMs;
      const duration = (event.endTime ? event.endTime - event.startTime : 500);
      const endDelay = startDelay + Math.max(100, duration);

      if (startDelay >= 0) {
        // Schedule Note On
        const onId = window.setTimeout(() => {
          if (!this.isPlaying) return;
          audioEngine.playNote(event.midi, event.velocity || 0.8);
          this.onNotePlay?.(event.midi, event.note);
        }, startDelay);
        this.activeTimeouts.push(onId);
      }

      if (endDelay >= 0) {
        // Schedule Note Off
        const offId = window.setTimeout(() => {
          if (!this.isPlaying) return;
          audioEngine.releaseNote(event.midi);
          this.onNoteRelease?.(event.midi, event.note);
        }, endDelay);
        this.activeTimeouts.push(offId);
      }
    });

    // Schedule completion
    const finishDelay = Math.max(1000, recording.duration - startFromMs + 200);
    const finishId = window.setTimeout(() => {
      this.stop();
      this.onFinished?.();
    }, finishDelay);
    this.activeTimeouts.push(finishId);

    this.startProgressTicker();
  }

  public pause(): void {
    if (!this.isPlaying || this.isPaused) return;
    this.isPaused = true;
    this.pausedAtTime = performance.now() - this.playbackStartTime;
    this.clearTimeouts();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    // Release any lingering playback notes
    AudioEngine.getInstance().stopAllNotes();
  }

  public resume(): void {
    if (!this.currentRecording || !this.isPaused) return;
    this.play(this.currentRecording, this.pausedAtTime);
  }

  public stop(): void {
    this.isPlaying = false;
    this.isPaused = false;
    this.clearTimeouts();
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
    // Stop lingering notes
    AudioEngine.getInstance().stopAllNotes();
    if (this.currentRecording) {
      this.onProgress?.(0, this.currentRecording.duration);
    }
  }

  public getIsPlaying(): boolean {
    return this.isPlaying && !this.isPaused;
  }

  public getIsPaused(): boolean {
    return this.isPaused;
  }

  private clearTimeouts(): void {
    this.activeTimeouts.forEach((id) => clearTimeout(id));
    this.activeTimeouts = [];
  }

  private startProgressTicker(): void {
    const tick = () => {
      if (!this.isPlaying || this.isPaused || !this.currentRecording) return;
      const currentMs = Math.min(
        this.currentRecording.duration,
        performance.now() - this.playbackStartTime
      );
      this.onProgress?.(currentMs, this.currentRecording.duration);

      if (currentMs < this.currentRecording.duration) {
        this.animationFrameId = requestAnimationFrame(tick);
      }
    };
    this.animationFrameId = requestAnimationFrame(tick);
  }
}
