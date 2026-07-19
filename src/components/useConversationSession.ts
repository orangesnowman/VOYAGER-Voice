import { useState, useEffect, useRef, useCallback } from 'react';
import { AudioCapture, AudioPlayback, VoiceActivityDetector } from '../domain/AudioSystem';
import { ConversationModePolicy } from '../domain/ConversationModePolicy';

interface UseConversationSessionConfig {
  selectedLang: 'EN' | 'ES';
  isBilingualMode: boolean;
  isTranslateMode: boolean;
  isListenOnly: boolean;
  isSpanishOnlyMode: boolean;
  isEnglishOnlyMode: boolean;
  onUserTranscription: (text: string) => void;
  onTextResponse: (text: string, showForm: boolean) => void;
  onOpen: () => void;
  onMessageReceived: (msg: any) => void;
  onError: (error: string) => void;
  onClose: () => void;
  onAutoPause?: () => void;
}

export function useConversationSession(config: UseConversationSessionConfig) {
  const {
    selectedLang,
    isBilingualMode,
    isTranslateMode,
    isListenOnly,
    isSpanishOnlyMode,
    isEnglishOnlyMode,
    onUserTranscription,
    onTextResponse,
    onOpen,
    onMessageReceived,
    onError,
    onClose,
    onAutoPause,
  } = config;

  const [isConnected, setIsConnected] = useState(false);
  const [statusText, setStatusText] = useState('Disconnected');
  const [error, setError] = useState<string | null>(null);
  const [isPaused, setIsPaused] = useState(false);
  const [secondsElapsed, setSecondsElapsed] = useState(0);
  const [volume, setVolume] = useState(0);

  // Modular Audio Subsystems & Domain objects
  const captureRef = useRef<AudioCapture | null>(null);
  const playbackRef = useRef<AudioPlayback | null>(null);
  const vadRef = useRef<VoiceActivityDetector>(new VoiceActivityDetector());
  const wsRef = useRef<WebSocket | null>(null);

  const isPausedRef = useRef(isPaused);
  const isListenOnlyRef = useRef(isListenOnly);

  // Keep references updated to avoid closure stale-state issues
  useEffect(() => {
    isPausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    isListenOnlyRef.current = isListenOnly;
  }, [isListenOnly]);

  const recordInteraction = useCallback(() => {
    vadRef.current.recordActivity();
  }, []);

  const ensureAudioContexts = useCallback(() => {
    if (!captureRef.current) {
      captureRef.current = new AudioCapture();
    }
    if (!playbackRef.current) {
      playbackRef.current = new AudioPlayback();
    }
    playbackRef.current.init();
  }, []);

  // Update volume hook using clean domain-level properties
  useEffect(() => {
    let animationFrameId: number;
    const updateVolume = () => {
      let captureVol = 0;
      let playbackVol = 0;

      if (isConnected) {
        if (captureRef.current) {
          captureVol = captureRef.current.getVolume();
        }
        if (playbackRef.current) {
          playbackVol = playbackRef.current.getVolume();
        }
      }
      
      const combinedVol = Math.max(captureVol, playbackVol);
      setVolume(combinedVol);
      animationFrameId = requestAnimationFrame(updateVolume);
    };
    updateVolume();
    return () => cancelAnimationFrame(animationFrameId);
  }, [isConnected]);

  // Session timer
  useEffect(() => {
    if (!isConnected) {
      setSecondsElapsed(0);
      return;
    }
    const interval = setInterval(() => {
      setSecondsElapsed(prev => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [isConnected]);

  // Clean WebSocket and media resources using domain abstractions
  const disconnect = useCallback(() => {
    setIsConnected(false);
    setStatusText('Disconnected');
    setVolume(0);
    setIsPaused(false);
    isPausedRef.current = false;

    if (wsRef.current) {
      const ws = wsRef.current;
      wsRef.current = null;
      ws.onopen = null;
      ws.onmessage = null;
      ws.onerror = null;
      ws.onclose = null;

      if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
        try {
          ws.close();
        } catch (e) {
          console.error('Error closing WebSocket:', e);
        }
      }
    }

    if (captureRef.current) {
      captureRef.current.stop();
      captureRef.current = null;
    }

    if (playbackRef.current) {
      playbackRef.current.stop();
      playbackRef.current = null;
    }

    onClose();
  }, [onClose]);

  // Connect to the Live API session proxy on server.ts
  const connect = useCallback(async (initialPrompt?: string, isVoiceConnection: boolean = false, langOverride?: 'EN' | 'ES') => {
    setError(null);
    setIsPaused(false);
    isPausedRef.current = false;
    vadRef.current.reset();
    ensureAudioContexts();

    try {
      setStatusText('Connecting...');
      
      if (!captureRef.current) {
        captureRef.current = new AudioCapture();
      }

      const activeLang = langOverride || selectedLang;
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/api/live?lang=${activeLang}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        setIsConnected(true);
        setStatusText('Connected');
        console.log('WebSocket connection to server established');
        
        onOpen();

        try {
          // Delegate voice capture initialization to AudioCapture
          await captureRef.current?.start((base64Data) => {
            if (ws.readyState !== WebSocket.OPEN) return;
            if (isPausedRef.current) return;
            
            vadRef.current.recordActivity();
            ws.send(JSON.stringify({ audio: base64Data }));
          });
        } catch (captureErr) {
          console.error('Audio capture failed to start:', captureErr);
          onError('Microphone access or initialization failed.');
        }
      };

      ws.onmessage = async (event) => {
        try {
          vadRef.current.recordActivity();
          const msg = JSON.parse(event.data);
          
          // Relay all specific custom server payloads up
          onMessageReceived(msg);

          if (msg.status === 'connected') {
            console.log('Gemini session active on backend. Mapping mode instructions via ConversationModePolicy.');
            
            // Map state variables back to a typed Mode for ConversationModePolicy
            const currentMode = isBilingualMode ? 'BILINGUAL'
                              : isTranslateMode ? 'LIVE_TRANSLATOR'
                              : isListenOnly ? 'LISTEN_ONLY'
                              : isSpanishOnlyMode ? 'SPANISH'
                              : isEnglishOnlyMode ? 'AMERICAN_ENGLISH'
                              : 'BILINGUAL';

            const greetingPrompt = ConversationModePolicy.getSystemInstructionsForMode(currentMode, {
              initialPrompt,
              selectedLang
            });
            
            if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
              wsRef.current.send(JSON.stringify({ text: greetingPrompt }));
            }
            return;
          }
          
          if (msg.error) {
             console.error('Server reported error:', msg.error);
             setError(msg.error);
             disconnect();
             return;
          }

          if (msg.userTranscription) {
            onUserTranscription(msg.userTranscription);
          }

          if (msg.text) {
            onTextResponse(msg.text, !!msg.showForm);
          }

          if (msg.audio && !isListenOnlyRef.current && !isPausedRef.current) {
            // Delegate audio queue and timing-based playback to AudioPlayback module
            playbackRef.current?.playRawPCM(msg.audio);
          }
        } catch (e) {
          console.error('Error reading message:', e);
        }
      };

      ws.onclose = () => {
         console.log('WebSocket connection closed');
         disconnect();
      };

      ws.onerror = (err) => {
         console.error('WebSocket error:', err);
         setError('Server connection error');
         disconnect();
      };

    } catch (err: any) {
        console.error('Connection Failed', err);
        setError(err.message || 'Error connecting or accessing microphone. Please ensure microphone permissions are granted.');
        setStatusText('Disconnected');
    }
  }, [
    selectedLang,
    isBilingualMode,
    isTranslateMode,
    isListenOnly,
    isSpanishOnlyMode,
    isEnglishOnlyMode,
    ensureAudioContexts,
    onUserTranscription,
    onTextResponse,
    onMessageReceived,
    onOpen,
    onError,
    disconnect
  ]);

  const sendText = useCallback((text: string) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ text }));
      vadRef.current.recordActivity();
    }
  }, []);

  const pause = useCallback(() => {
    setIsPaused(true);
    isPausedRef.current = true;
    setVolume(0);
  }, []);

  const resume = useCallback(() => {
    setIsPaused(false);
    isPausedRef.current = false;
    vadRef.current.recordActivity();
  }, []);

  // Inactivity auto-pause
  useEffect(() => {
    if (!isConnected || isPaused) return;
    const interval = setInterval(() => {
      const inactiveMs = vadRef.current.getInactiveMs();
      if (inactiveMs > 60000) {
        console.log('Auto-pausing session due to 60s inactivity tracked by VoiceActivityDetector');
        pause();
        if (onAutoPause) onAutoPause();
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [isConnected, isPaused, pause, onAutoPause]);

  return {
    isConnected,
    statusText,
    error,
    isPaused,
    secondsElapsed,
    volume,
    connect,
    disconnect,
    sendText,
    pause,
    resume,
    recordInteraction,
    wsRef
  };
}

export default useConversationSession;
