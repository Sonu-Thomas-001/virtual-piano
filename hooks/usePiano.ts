'use client';

import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import {
  PianoNote,
  ActiveNoteState,
  PianoSettings,
  Recording,
  NoteEvent,
} from '@/types/piano';
import {
  ALL_88_KEYS,
  assignKeyboardShortcuts,
  detectChord,
  midiToNoteName,
  getScalePracticeSequence,
  PracticeStep,
} from '@/lib/notes';
import { SCALES_LIST } from '@/lib/constants';
import { AudioEngine } from '@/lib/audio/AudioEngine';
import { MidiController, MidiStatus } from '@/lib/midi';
import { PlaybackEngine } from '@/lib/recording/PlaybackEngine';
import { loadSettings, saveSettings, loadRecordings, saveRecordings, DEFAULT_SETTINGS } from '@/lib/storage';

export function usePiano() {
  // Use consistent defaults for initial render so SSR matches client hydration
  const [settings, setSettings] = useState<PianoSettings>(DEFAULT_SETTINGS);
  const [isAudioReady, setIsAudioReady] = useState(false);
  const [audioStatusText, setAudioStatusText] = useState<'initializing' | 'ready' | 'waiting'>('waiting');

  // Active notes currently pressed/sounding: Map of midi -> ActiveNoteState
  const [activeNotes, setActiveNotes] = useState<Map<number, ActiveNoteState>>(new Map());

  // Practice Mode state
  const [practiceCurrentStepIndex, setPracticeCurrentStepIndex] = useState<number>(0);
  const [practiceCompleted, setPracticeCompleted] = useState<boolean>(false);

  // Sustain state
  const [sustain, setSustain] = useState<boolean>(false);

  // Metronome state
  const [metronomeBeat, setMetronomeBeat] = useState<number>(0);

  // Recording state
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const isRecordingRef = useRef<boolean>(false);
  const [recordingDuration, setRecordingDuration] = useState<number>(0);
  const recordingStartTimeRef = useRef<number>(0);
  const recordedEventsRef = useRef<NoteEvent[]>([]);
  const recordingTimerRef = useRef<number | null>(null);
  const [recordings, setRecordings] = useState<Recording[]>([]);

  // Keep isRecordingRef in sync
  useEffect(() => {
    isRecordingRef.current = isRecording;
  }, [isRecording]);

  // Playback state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [activePlaybackId, setActivePlaybackId] = useState<string | null>(null);
  const [playbackProgressMs, setPlaybackProgressMs] = useState<number>(0);
  const [playbackDurationMs, setPlaybackDurationMs] = useState<number>(0);

  // MIDI state
  const [midiStatus, setMidiStatus] = useState<MidiStatus>('disconnected');
  const [midiDeviceName, setMidiDeviceName] = useState<string>('');

  // Mouse drag tracking (for glissando)
  const isMouseDownRef = useRef(false);

  // Engines
  const audioEngineRef = useRef<AudioEngine | null>(null);
  const playbackEngineRef = useRef<PlaybackEngine | null>(null);
  const midiControllerRef = useRef<MidiController | null>(null);

  // Keys currently held down on physical computer keyboard (to prevent OS key repeat)
  const physicalKeysHeldRef = useRef<Set<string>>(new Set());

  // Practice steps computed for the current practice scale
  const practiceSteps = useMemo<PracticeStep[]>(() => {
    return getScalePracticeSequence(settings.practiceScale || 'c-major', settings.baseOctave);
  }, [settings.practiceScale, settings.baseOctave]);

  // Keep practice step in bounds
  const currentPracticeTarget = useMemo<PracticeStep | null>(() => {
    if (!settings.practiceMode || practiceSteps.length === 0) return null;
    return practiceSteps[Math.min(practiceCurrentStepIndex, practiceSteps.length - 1)] || null;
  }, [settings.practiceMode, practiceSteps, practiceCurrentStepIndex]);

  // Unlock audio on first user gesture
  const ensureAudioUnlocked = useCallback(async () => {
    if (!audioEngineRef.current) return;
    if (!audioEngineRef.current.isReady()) {
      setAudioStatusText('initializing');
      const ready = await audioEngineRef.current.initAudio();
      setIsAudioReady(ready);
      setAudioStatusText(ready ? 'ready' : 'waiting');
    }
  }, []);

  // Play Note Event Handler
  const handleNoteStart = useCallback(
    (midi: number, velocity = 0.8, source: 'mouse' | 'touch' | 'keyboard' | 'midi' | 'playback' = 'mouse') => {
      ensureAudioUnlocked();
      audioEngineRef.current?.playNote(midi, velocity);

      const noteInfo = midiToNoteName(midi);

      setActiveNotes((prev) => {
        const next = new Map(prev);
        next.set(midi, {
          midi,
          note: noteInfo.fullName,
          velocity,
          source,
        });
        return next;
      });

      // Advance Practice Mode if active note matches target
      if (settings.practiceMode && !practiceCompleted && practiceSteps.length > 0) {
        const target = practiceSteps[practiceCurrentStepIndex];
        if (target && target.midi === midi) {
          if (practiceCurrentStepIndex + 1 < practiceSteps.length) {
            setPracticeCurrentStepIndex((idx) => idx + 1);
          } else {
            setPracticeCompleted(true);
          }
        }
      }

      // Capture recording event if recording
      if (isRecordingRef.current) {
        const now = performance.now();
        const eventStart = Math.max(0, now - recordingStartTimeRef.current);
        recordedEventsRef.current.push({
          midi,
          note: noteInfo.fullName,
          velocity,
          startTime: Math.round(eventStart),
        });
      }
    },
    [ensureAudioUnlocked, settings.practiceMode, practiceCompleted, practiceSteps, practiceCurrentStepIndex]
  );

  // Release Note Event Handler
  const handleNoteStop = useCallback(
    (midi: number, source?: 'mouse' | 'touch' | 'keyboard' | 'midi' | 'playback') => {
      audioEngineRef.current?.releaseNote(midi);

      setActiveNotes((prev) => {
        if (!prev.has(midi)) return prev;
        const current = prev.get(midi);
        if (source && current && current.source !== source) {
          // If pressed by another source, keep it
          return prev;
        }
        const next = new Map(prev);
        next.delete(midi);
        return next;
      });

      // Close recording event if recording
      if (isRecordingRef.current) {
        const now = performance.now();
        const eventEnd = Math.max(0, now - recordingStartTimeRef.current);
        const openEvent = [...recordedEventsRef.current]
          .reverse()
          .find((e) => e.midi === midi && e.endTime === undefined);
        if (openEvent) {
          openEvent.endTime = Math.round(eventEnd);
        }
      }
    },
    []
  );

  // Stable references for external callbacks
  const handleNoteStartRef = useRef(handleNoteStart);
  const handleNoteStopRef = useRef(handleNoteStop);

  useEffect(() => {
    handleNoteStartRef.current = handleNoteStart;
    handleNoteStopRef.current = handleNoteStop;
  }, [handleNoteStart, handleNoteStop]);

  // Initialize Engines and saved data on client mount
  useEffect(() => {
    audioEngineRef.current = AudioEngine.getInstance();
    playbackEngineRef.current = new PlaybackEngine();
    midiControllerRef.current = new MidiController();

    // Restore persisted settings & recordings without causing SSR hydration mismatch
    queueMicrotask(() => {
      try {
        const savedSettings = loadSettings();
        setSettings(savedSettings);
        setSustain(savedSettings.sustainEnabled);
        audioEngineRef.current?.setVolume(savedSettings.volume);
        audioEngineRef.current?.setMute(savedSettings.isMuted);
        audioEngineRef.current?.setInstrument(savedSettings.instrument);
        audioEngineRef.current?.setSustain(savedSettings.sustainEnabled);
        audioEngineRef.current?.setTranspose(savedSettings.transpose ?? 0);
        audioEngineRef.current?.setReverb(savedSettings.reverb ?? 'hall');

        const savedRecs = loadRecordings();
        setRecordings(savedRecs);
      } catch (err) {
        console.warn('Failed to restore saved piano data:', err);
      }
    });

    // Set up Playback Engine callbacks
    playbackEngineRef.current.setCallbacks({
      onNotePlay: (midi, note) => {
        setActiveNotes((prev) => {
          const next = new Map(prev);
          next.set(midi, { midi, note, velocity: 0.8, source: 'playback' });
          return next;
        });
      },
      onNoteRelease: (midi) => {
        setActiveNotes((prev) => {
          const next = new Map(prev);
          if (next.get(midi)?.source === 'playback') {
            next.delete(midi);
          }
          return next;
        });
      },
      onProgress: (currentMs, totalMs) => {
        setPlaybackProgressMs(currentMs);
        setPlaybackDurationMs(totalMs);
      },
      onFinished: () => {
        setIsPlaying(false);
        setIsPaused(false);
        setActivePlaybackId(null);
      },
    });

    // Auto-listen for MIDI devices if available
    midiControllerRef.current.init({
      onNoteOn: (midi, velocity) => {
        handleNoteStartRef.current(midi, velocity, 'midi');
      },
      onNoteOff: (midi) => {
        handleNoteStopRef.current(midi, 'midi');
      },
      onStatusChange: (status, deviceName) => {
        setMidiStatus(status);
        if (deviceName) setMidiDeviceName(deviceName);
      },
    });

    // Global mouseup to prevent stuck keys when mouse released outside the keyboard
    const handleGlobalMouseUp = () => {
      if (isMouseDownRef.current) {
        isMouseDownRef.current = false;
        setActiveNotes((prev) => {
          let hasMouse = false;
          prev.forEach((val) => {
            if (val.source === 'mouse') {
              hasMouse = true;
              audioEngineRef.current?.releaseNote(val.midi);
            }
          });
          if (!hasMouse) return prev;
          const next = new Map(prev);
          next.forEach((val, key) => {
            if (val.source === 'mouse') next.delete(key);
          });
          return next;
        });
      }
    };

    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      audioEngineRef.current?.stopAllNotes();
      audioEngineRef.current?.stopMetronome();
      playbackEngineRef.current?.stop();
      midiControllerRef.current?.disconnect();
    };
  }, []);

  // Sync settings changes to storage & audio engine
  const updateSettings = useCallback((updater: Partial<PianoSettings> | ((prev: PianoSettings) => PianoSettings)) => {
    setSettings((prev) => {
      const next = typeof updater === 'function' ? updater(prev) : { ...prev, ...updater };
      saveSettings(next);

      if (audioEngineRef.current) {
        if (next.volume !== prev.volume || next.isMuted !== prev.isMuted) {
          audioEngineRef.current.setVolume(next.isMuted ? 0 : next.volume);
        }
        if (next.instrument !== prev.instrument) {
          audioEngineRef.current.setInstrument(next.instrument);
        }
        if (next.sustainEnabled !== prev.sustainEnabled) {
          audioEngineRef.current.setSustain(next.sustainEnabled);
          setSustain(next.sustainEnabled);
        }
        if (next.metronomeBpm !== prev.metronomeBpm) {
          audioEngineRef.current.updateMetronomeBpm(next.metronomeBpm);
        }
        if (next.transpose !== prev.transpose) {
          audioEngineRef.current.setTranspose(next.transpose);
        }
        if (next.reverb !== prev.reverb) {
          audioEngineRef.current.setReverb(next.reverb);
        }
      }
      return next;
    });
  }, []);

  // Practice Mode helpers
  const resetPractice = useCallback(() => {
    setPracticeCurrentStepIndex(0);
    setPracticeCompleted(false);
  }, []);

  const nextPracticeScale = useCallback(() => {
    const validScales = SCALES_LIST.filter((s) => s.id !== 'none');
    setSettings((prev) => {
      const currentIndex = validScales.findIndex((s) => s.id === prev.practiceScale);
      const nextScale = validScales[(currentIndex + 1) % validScales.length];
      const next = { ...prev, practiceScale: nextScale.id };
      saveSettings(next);
      return next;
    });
    setPracticeCurrentStepIndex(0);
    setPracticeCompleted(false);
  }, []);

  const tapTempo = useCallback(() => {
    if (audioEngineRef.current) {
      const newBpm = audioEngineRef.current.tapTempo();
      updateSettings({ metronomeBpm: newBpm });
      return newBpm;
    }
    return settings.metronomeBpm;
  }, [settings.metronomeBpm, updateSettings]);

  const panOctave = useCallback((targetOctave: number) => {
    updateSettings({ baseOctave: Math.max(1, Math.min(6, targetOctave)) });
  }, [updateSettings]);

  // Sustain Pedal toggle
  const toggleSustain = useCallback(() => {
    setSustain((prev) => {
      const next = !prev;
      audioEngineRef.current?.setSustain(next);
      updateSettings({ sustainEnabled: next });
      return next;
    });
  }, [updateSettings]);

  // Metronome toggle
  const toggleMetronome = useCallback(() => {
    setSettings((prev) => {
      const nextEnabled = !prev.metronomeEnabled;
      if (nextEnabled) {
        audioEngineRef.current?.startMetronome(
          prev.metronomeBpm,
          prev.metronomeTimeSignature,
          (beat) => setMetronomeBeat(beat)
        );
      } else {
        audioEngineRef.current?.stopMetronome();
        setMetronomeBeat(0);
      }
      const updated = { ...prev, metronomeEnabled: nextEnabled };
      saveSettings(updated);
      return updated;
    });
  }, []);

  const changeMetronomeBpm = useCallback((delta: number) => {
    setSettings((prev) => {
      const newBpm = Math.max(40, Math.min(240, prev.metronomeBpm + delta));
      if (prev.metronomeEnabled) {
        audioEngineRef.current?.updateMetronomeBpm(newBpm);
      }
      const updated = { ...prev, metronomeBpm: newBpm };
      saveSettings(updated);
      return updated;
    });
  }, []);

  // Octave shifting
  const shiftOctave = useCallback(
    (direction: -1 | 1) => {
      updateSettings((prev) => {
        const nextOctave = Math.max(1, Math.min(6, prev.baseOctave + direction));
        return { ...prev, baseOctave: nextOctave };
      });
    },
    [updateSettings]
  );

  // Recording controls
  const startRecording = useCallback(() => {
    ensureAudioUnlocked();
    if (isPlaying) {
      playbackEngineRef.current?.stop();
      setIsPlaying(false);
    }
    recordedEventsRef.current = [];
    recordingStartTimeRef.current = performance.now();
    setIsRecording(true);
    setRecordingDuration(0);

    if (recordingTimerRef.current !== null) {
      clearInterval(recordingTimerRef.current);
    }

    recordingTimerRef.current = window.setInterval(() => {
      setRecordingDuration(Math.round(performance.now() - recordingStartTimeRef.current));
    }, 100);
  }, [ensureAudioUnlocked, isPlaying]);

  const stopRecording = useCallback(() => {
    if (!isRecordingRef.current) return;
    setIsRecording(false);
    if (recordingTimerRef.current !== null) {
      clearInterval(recordingTimerRef.current);
      recordingTimerRef.current = null;
    }

    const duration = Math.max(500, Math.round(performance.now() - recordingStartTimeRef.current));

    // Close any unclosed note events
    recordedEventsRef.current.forEach((e) => {
      if (e.endTime === undefined) {
        e.endTime = duration;
      }
    });

    if (recordedEventsRef.current.length > 0) {
      const newRec: Recording = {
        id: `rec_${Date.now()}`,
        name: `Piano Recording ${recordings.length + 1}`,
        createdAt: Date.now(),
        duration,
        events: [...recordedEventsRef.current],
      };

      setRecordings((prev) => {
        const updated = [newRec, ...prev];
        saveRecordings(updated);
        return updated;
      });
    }
  }, [recordings.length]);

  const deleteRecording = useCallback((id: string) => {
    if (activePlaybackId === id) {
      playbackEngineRef.current?.stop();
      setIsPlaying(false);
      setActivePlaybackId(null);
    }
    setRecordings((prev) => {
      const updated = prev.filter((r) => r.id !== id);
      saveRecordings(updated);
      return updated;
    });
  }, [activePlaybackId]);

  const playRecording = useCallback((recording: Recording) => {
    ensureAudioUnlocked();
    if (isRecordingRef.current) {
      stopRecording();
    }
    setActivePlaybackId(recording.id);
    setIsPlaying(true);
    setIsPaused(false);
    playbackEngineRef.current?.play(recording);
  }, [ensureAudioUnlocked, stopRecording]);

  const pausePlayback = useCallback(() => {
    playbackEngineRef.current?.pause();
    setIsPaused(true);
  }, []);

  const resumePlayback = useCallback(() => {
    playbackEngineRef.current?.resume();
    setIsPaused(false);
  }, []);

  const stopPlayback = useCallback(() => {
    playbackEngineRef.current?.stop();
    setIsPlaying(false);
    setIsPaused(false);
    setActivePlaybackId(null);
    setPlaybackProgressMs(0);
  }, []);

  // Filter visible keys based on baseOctave and visibleOctaves
  const visibleKeys = useMemo<PianoNote[]>(() => {
    const { baseOctave, visibleOctaves } = settings;

    if (visibleOctaves >= 7) {
      return ALL_88_KEYS;
    }

    const startMidi = Math.max(21, (baseOctave + 1) * 12);
    const endMidi = Math.min(108, startMidi + visibleOctaves * 12);

    return ALL_88_KEYS.filter((k) => k.midi >= startMidi && k.midi <= endMidi);
  }, [settings]);

  // Keyboard shortcut mapping based on current baseOctave
  const keyboardMapping = useMemo<Map<string, string>>(() => {
    return assignKeyboardShortcuts(ALL_88_KEYS, settings.baseOctave);
  }, [settings.baseOctave]);

  // Currently sounding note strings and chord name
  const activeNoteNames = useMemo(() => {
    return Array.from(activeNotes.values()).map((n) => n.note);
  }, [activeNotes]);

  const activeChordName = useMemo(() => {
    const midis = Array.from(activeNotes.keys());
    return detectChord(midis);
  }, [activeNotes]);

  // Computer keyboard global event listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        return;
      }

      const key = e.key.toLowerCase();

      // Spacebar: Sustain toggle
      if (e.code === 'Space') {
        e.preventDefault();
        toggleSustain();
        return;
      }

      // Octave Shift: Z / X
      if (key === 'z') {
        e.preventDefault();
        shiftOctave(-1);
        return;
      }
      if (key === 'x') {
        e.preventDefault();
        shiftOctave(1);
        return;
      }

      // Record toggle: R
      if (key === 'r') {
        e.preventDefault();
        if (isRecordingRef.current) stopRecording();
        else startRecording();
        return;
      }

      // Metronome toggle: M
      if (key === 'm') {
        e.preventDefault();
        toggleMetronome();
        return;
      }

      // Prevent key repeat when key is held down
      if (physicalKeysHeldRef.current.has(key)) return;

      // Note keys
      const noteName = keyboardMapping.get(key);
      if (noteName) {
        e.preventDefault();
        physicalKeysHeldRef.current.add(key);
        const noteObj = ALL_88_KEYS.find((k) => k.name === noteName);
        if (noteObj) {
          handleNoteStart(noteObj.midi, 0.85, 'keyboard');
        }
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase();
      if (physicalKeysHeldRef.current.has(key)) {
        physicalKeysHeldRef.current.delete(key);
        const noteName = keyboardMapping.get(key);
        if (noteName) {
          const noteObj = ALL_88_KEYS.find((k) => k.name === noteName);
          if (noteObj) {
            handleNoteStop(noteObj.midi, 'keyboard');
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [
    keyboardMapping,
    toggleSustain,
    shiftOctave,
    startRecording,
    stopRecording,
    toggleMetronome,
    handleNoteStart,
    handleNoteStop,
  ]);

  return {
    settings,
    updateSettings,
    isAudioReady,
    audioStatusText,
    ensureAudioUnlocked,
    activeNotes,
    activeNoteNames,
    activeChordName,
    visibleKeys,
    keyboardMapping,
    sustain,
    toggleSustain,
    metronomeBeat,
    toggleMetronome,
    changeMetronomeBpm,
    shiftOctave,
    // Recording
    isRecording,
    recordingDuration,
    recordings,
    startRecording,
    stopRecording,
    deleteRecording,
    // Playback
    isPlaying,
    isPaused,
    activePlaybackId,
    playbackProgressMs,
    playbackDurationMs,
    playRecording,
    pausePlayback,
    resumePlayback,
    stopPlayback,
    // MIDI
    midiStatus,
    midiDeviceName,
    // Note triggers
    handleNoteStart,
    handleNoteStop,
    isMouseDownRef,
    // Practice Mode
    practiceSteps,
    practiceCurrentStepIndex,
    currentPracticeTarget,
    practiceCompleted,
    resetPractice,
    nextPracticeScale,
    // Tools & FX
    tapTempo,
    panOctave,
    audioEngineRef,
  };
}
