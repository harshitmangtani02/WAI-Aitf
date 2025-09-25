import { useState, useCallback, useRef, useEffect } from 'react';

interface UseVoiceInputProps {
  onResult: (transcript: string) => void;
  language: 'en' | 'ja';
}

interface UseVoiceInputReturn {
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  transcript: string;
  startListening: () => void;
  stopListening: () => void;
}

export function useVoiceInput({
  onResult,
  language
}: UseVoiceInputProps): UseVoiceInputReturn {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [transcript, setTranscript] = useState('');

  const recognitionRef = useRef<any>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Check if SpeechRecognition is supported
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;

    console.log('Speech Recognition supported:', !!SpeechRecognition);

    if (SpeechRecognition) {
      setIsSupported(true);

      const recognition = new SpeechRecognition();
      const isAndroid = /Android/i.test(navigator.userAgent);
      
      // Configure for better Android experience
      recognition.continuous = true;  // Keep continuous for all platforms
      recognition.interimResults = true;  // Get interim results for real-time feedback
      recognition.lang = language === 'en' ? 'en-US' : 'ja-JP';
      recognition.maxAlternatives = 1;

      console.log('Setting up speech recognition for language:', recognition.lang);

      recognition.onstart = () => {
        console.log('Speech recognition started');
        setIsListening(true);
        setError(null);
        setTranscript('');
      };

      recognition.onresult = (event: any) => {
        console.log('Speech recognition result received');
        let finalTranscript = '';
        let interimTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; i++) {
          const result = event.results[i];
          if (result.isFinal) {
            finalTranscript += result[0].transcript;
          } else {
            interimTranscript += result[0].transcript;
          }
        }

        const currentTranscript = finalTranscript || interimTranscript;
        console.log('Transcript:', currentTranscript);
        setTranscript(currentTranscript);

        // Clear any existing silence timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }

        // If we have a final result, process it immediately
        if (finalTranscript.trim()) {
          console.log('Final transcript received:', finalTranscript);
          onResult(finalTranscript.trim());
          recognition.stop();
        } else if (currentTranscript.trim()) {
          // For interim results, set a timeout to wait for more speech
          // Longer timeout on Android to account for processing delays
          const timeoutDuration = isAndroid ? 3000 : 2000;
          
          silenceTimeoutRef.current = setTimeout(() => {
            if (currentTranscript.trim()) {
              console.log('Timeout reached, using interim transcript:', currentTranscript);
              onResult(currentTranscript.trim());
              recognition.stop();
            }
          }, timeoutDuration);
        }
      };

      recognition.onerror = (event: any) => {
        console.error('Speech recognition error:', event.error);
        const errorMessage = language === 'en'
          ? `Speech recognition error: ${event.error}`
          : `音声認識エラー: ${event.error}`;
        setError(errorMessage);
        setIsListening(false);
      };

      recognition.onend = () => {
        console.log('Speech recognition ended');
        
        // Clear any pending silence timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        
        // If we have a transcript that hasn't been processed yet, use it
        if (transcript.trim() && transcript.trim().length > 2) {
          console.log('Using final transcript from onend:', transcript);
          onResult(transcript.trim());
        }
        
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    } else {
      setIsSupported(false);
      const errorMessage = language === 'en'
        ? 'Voice recognition is not supported in this browser'
        : 'お使いのブラウザは音声認識に対応していません';
      setError(errorMessage);
    }

    return () => {
      if (silenceTimeoutRef.current) {
        clearTimeout(silenceTimeoutRef.current);
      }
      if (recognitionRef.current) {
        recognitionRef.current.abort();
      }
    };
  }, [language, onResult]);

  const startListening = useCallback(async () => {
    console.log('Attempting to start speech recognition...');

    // Check microphone permissions first
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone permission granted');
      // Stop the stream immediately as we only need permission
      stream.getTracks().forEach(track => track.stop());
    } catch (permissionError) {
      console.error('Microphone permission denied:', permissionError);
      const errorMessage = language === 'en'
        ? 'Microphone permission is required for voice input. Please allow microphone access and try again.'
        : 'マイクへのアクセス許可が必要です。マイクへのアクセスを許可して再度お試しください。';
      setError(errorMessage);
      return;
    }

    if (recognitionRef.current && !isListening) {
      try {
        // Reset any previous errors and state
        setError(null);
        setTranscript('');
        
        // Clear any existing timeout
        if (silenceTimeoutRef.current) {
          clearTimeout(silenceTimeoutRef.current);
          silenceTimeoutRef.current = null;
        }
        
        recognitionRef.current.start();
        console.log('Speech recognition start() called successfully');
      } catch (err) {
        console.error('Failed to start speech recognition:', err);
        const errorMessage = language === 'en'
          ? `Could not start voice recognition: ${err}`
          : `音声認識を開始できませんでした: ${err}`;
        setError(errorMessage);
        setIsListening(false);
      }
    } else if (!recognitionRef.current) {
      const errorMessage = language === 'en'
        ? 'Speech recognition not initialized'
        : '音声認識が初期化されていません';
      setError(errorMessage);
    } else if (isListening) {
      console.log('Speech recognition is already listening');
    }
  }, [isListening, language]);

  const stopListening = useCallback(() => {
    if (silenceTimeoutRef.current) {
      clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = null;
    }
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
    }
  }, [isListening]);

  return {
    isListening,
    isSupported,
    error,
    transcript,
    startListening,
    stopListening,
  };
}

declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}