'use client';

import { useState, useCallback, useRef, useEffect } from 'react';

interface UseSpeechRecognitionReturn {
  transcript: string;
  isListening: boolean;
  isSupported: boolean;
  startListening: () => void;
  stopListening: () => void;
  resetTranscript: () => void;
}

export function useSpeechRecognition(): UseSpeechRecognitionReturn {
  const [transcript, setTranscript] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // The permanent committed text (only grows, never shrinks mid-session)
  const finalTextRef = useRef('');
  // The most recent interim text — saved here so we can rescue it if the session
  // auto-stops before Chrome had a chance to mark it as final
  const interimTextRef = useRef('');
  // Whether we WANT to be listening (distinct from browser state)
  const isListeningRef = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionAPI =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    setIsSupported(!!SpeechRecognitionAPI);
    if (!SpeechRecognitionAPI) return;

    const recognition = new SpeechRecognitionAPI();
    recognition.continuous = true;     // keep running across silences
    recognition.interimResults = true; // show live text
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let interimText = '';

      // Only process new results starting at resultIndex — never re-read old ones
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        const text = result[0].transcript;

        if (result.isFinal) {
          // Commit to permanent buffer
          finalTextRef.current += text + ' ';
          interimTextRef.current = ''; // clear interim once finalized
        } else {
          // Save interim so onend can rescue it if Chrome stops abruptly
          interimText += text;
          interimTextRef.current = interimText;
        }
      }

      setTranscript((finalTextRef.current + interimText).trimStart());
    };

    recognition.onerror = (event) => {
      const ignoredErrors = ['no-speech', 'aborted', 'network'];
      if (!ignoredErrors.includes(event.error)) {
        console.error('Speech recognition error:', event.error);
        if (event.error === 'not-allowed') {
          alert('Microphone access denied or no microphone found. Please allow microphone permissions or connect a microphone to continue the voice interview.');
        }
        isListeningRef.current = false;
        setIsListening(false);
      }
    };

    recognition.onend = () => {
      if (!isListeningRef.current) {
        // We intentionally stopped — done
        setIsListening(false);
        return;
      }

      // ── Chrome stopped us mid-sentence ──────────────────────────────────────
      // Rescue whatever interim text was being spoken when Chrome cut us off.
      // Without this, the last few words of a long answer are silently lost.
      if (interimTextRef.current.trim()) {
        finalTextRef.current += interimTextRef.current.trim() + ' ';
        interimTextRef.current = '';
        // Update state so the rescued text is visible
        setTranscript(finalTextRef.current.trimStart());
      }

      // Restart recognition to keep listening
      try {
        recognition.start();
      } catch {
        // If start() throws (recognition is still in flight), wait briefly
        setTimeout(() => {
          if (isListeningRef.current) {
            try { recognition.start(); } catch {
              isListeningRef.current = false;
              setIsListening(false);
            }
          }
        }, 200);
      }
    };

    recognitionRef.current = recognition;

    return () => {
      isListeningRef.current = false;
      try { recognition.stop(); } catch { /* ignore */ }
    };
  }, []);

  const startListening = useCallback(() => {
    if (!recognitionRef.current || isListeningRef.current) return;

    // Full reset before each new question
    finalTextRef.current = '';
    interimTextRef.current = '';
    setTranscript('');

    try {
      recognitionRef.current.start();
      isListeningRef.current = true;
      setIsListening(true);
    } catch (e) {
      console.error('Failed to start recognition:', e);
    }
  }, []);

  const stopListening = useCallback(() => {
    isListeningRef.current = false; // set this FIRST so onend doesn't restart
    interimTextRef.current = '';
    if (recognitionRef.current) {
      try { recognitionRef.current.stop(); } catch { /* ignore */ }
      setIsListening(false);
    }
  }, []);

  const resetTranscript = useCallback(() => {
    finalTextRef.current = '';
    interimTextRef.current = '';
    setTranscript('');
  }, []);

  return { transcript, isListening, isSupported, startListening, stopListening, resetTranscript };
}
