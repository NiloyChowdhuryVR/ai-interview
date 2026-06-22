'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSpeechSynthesisReturn {
  speak: (text: string) => Promise<void>;
  cancel: () => void;
  isSpeaking: boolean;
  isSupported: boolean;
}

export function useSpeechSynthesis(): UseSpeechSynthesisReturn {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const resolveRef = useRef<(() => void) | null>(null);
  const resumeIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsSupported('speechSynthesis' in window);
    }
  }, []);

  // Chrome bug: speechSynthesis pauses/stops on long utterances without
  // firing onend. Periodically calling resume() keeps it alive.
  const startResumeWorkaround = useCallback(() => {
    stopResumeWorkaround();
    resumeIntervalRef.current = setInterval(() => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        if (window.speechSynthesis.speaking) {
          window.speechSynthesis.pause();
          window.speechSynthesis.resume();
        }
      }
    }, 5000);
  }, []);

  const stopResumeWorkaround = useCallback(() => {
    if (resumeIntervalRef.current) {
      clearInterval(resumeIntervalRef.current);
      resumeIntervalRef.current = null;
    }
  }, []);

  const cleanup = useCallback(() => {
    setIsSpeaking(false);
    stopResumeWorkaround();
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (resolveRef.current) {
      resolveRef.current();
      resolveRef.current = null;
    }
  }, [stopResumeWorkaround]);

  const speak = useCallback((text: string): Promise<void> => {
    return new Promise((resolve, reject) => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Instead of using the shared cleanup for this utterance's events,
      // we use local variables to ensure old events don't resolve this new promise.
      let isSettled = false;
      const localResolve = () => {
        if (!isSettled) {
          isSettled = true;
          resolve();
        }
      };

      // Cancel any ongoing speech - this might fire async events for old utterances
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      utterance.lang = 'en-US';

      // Try to pick a consistently male English voice across OS/Browsers
      const voices = window.speechSynthesis.getVoices();
      
      const preferredVoice = voices.find(
        (v) => v.lang.startsWith('en') && (v.name.includes('Male') || v.name.includes('David') || v.name.includes('Daniel') || v.name.includes('Arthur') || v.name.includes('James'))
      ) || voices.find(
        (v) => v.lang.startsWith('en-US') && !v.name.includes('Female') && !v.name.includes('Zira') && !v.name.includes('Samantha')
      ) || voices.find(
        (v) => v.lang.startsWith('en')
      );

      if (preferredVoice) {
        utterance.voice = preferredVoice;
      }

      // We still update the global ref so `cancel()` can resolve it if needed
      resolveRef.current = localResolve;

      utterance.onstart = () => {
        setIsSpeaking(true);
      };

      utterance.onend = () => {
        cleanup();
        localResolve();
      };

      utterance.onerror = (event) => {
        cleanup();
        localResolve();
        // Don't reject for cancel/interrupt — those are normal
        if (event.error !== 'canceled' && event.error !== 'interrupted') {
          console.warn('Speech synthesis error:', event.error);
        }
      };

      window.speechSynthesis.speak(utterance);
      startResumeWorkaround();

      // Safety timeout: if onend never fires (Chrome bug), force-resolve
      // after a generous estimate based on text length.
      // ~150 words per minute at rate 1.0 → ~400ms per word
      const wordCount = text.split(/\s+/).length;
      const estimatedMs = Math.max(3000, wordCount * 400 + 2000);
      timeoutRef.current = setTimeout(() => {
        console.warn('Speech synthesis timeout — forcing resolve after', estimatedMs, 'ms');
        window.speechSynthesis.cancel();
        cleanup();
        localResolve();
      }, estimatedMs);
    });
  }, [cleanup, startResumeWorkaround]);

  const cancel = useCallback(() => {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    cleanup();
  }, [cleanup]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopResumeWorkaround();
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, [stopResumeWorkaround]);

  return {
    speak,
    cancel,
    isSpeaking,
    isSupported,
  };
}
