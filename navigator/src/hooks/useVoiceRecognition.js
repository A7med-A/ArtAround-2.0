// ═══════════════════════════════════════════════════════════════
// useVoiceRecognition — comandi vocali via Web Speech API.
//
// L'API è disponibile solo su alcuni browser (Chrome, Edge, Safari
// recenti) e richiede il permesso del microfono. Quando manca, l'hook
// riporta `supported: false` e l'interfaccia mostra la stessa lista di
// comandi in forma toccabile: le funzioni restano tutte raggiungibili.
// ═══════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from "react";
import { SPEECH_LANG } from "@/constants/config";
import { matchCommand } from "@/constants/voiceCommands";

function getRecognitionClass() {
  if (typeof window === "undefined") return null;
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

/**
 * @param {(command: object, transcript: string) => void} onCommand
 *        invocato quando una frase riconosciuta corrisponde a un comando
 */
export default function useVoiceRecognition({ onCommand } = {}) {
  const RecognitionClass = getRecognitionClass();
  const supported = Boolean(RecognitionClass);

  const [listening, setListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [error, setError] = useState(null);

  const recognitionRef = useRef(null);
  const onCommandRef = useRef(onCommand);
  onCommandRef.current = onCommand;

  const stop = useCallback(() => {
    setListening(false);
    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.onresult = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {
        /* già ferma */
      }
      recognitionRef.current = null;
    }
  }, []);

  const start = useCallback(() => {
    if (!supported) {
      setError("Il riconoscimento vocale non è disponibile su questo browser");
      return;
    }
    stop();
    setError(null);
    setTranscript("");

    const recognition = new RecognitionClass();
    recognition.lang = SPEECH_LANG;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 3;

    recognition.onresult = (event) => {
      let heard = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        heard += event.results[i][0].transcript;
      }
      setTranscript(heard.trim());

      // Reagisce solo alle frasi definitive: gli interim cambiano troppo
      // e farebbero scattare comandi su parole ancora incomplete.
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (!event.results[i].isFinal) continue;
        const phrase = event.results[i][0].transcript;
        const command = matchCommand(phrase);
        if (command) {
          onCommandRef.current?.(command, phrase);
          return;
        }
      }
    };

    recognition.onerror = (event) => {
      if (event.error === "not-allowed" || event.error === "service-not-allowed") {
        setError("Permesso microfono negato. Usa i comandi qui sotto.");
      } else if (event.error === "no-speech") {
        setError("Non ho sentito nulla. Riprova o tocca un comando.");
      } else if (event.error !== "aborted") {
        setError("Riconoscimento vocale non disponibile in questo momento.");
      }
      setListening(false);
    };

    recognition.onend = () => setListening(false);

    recognitionRef.current = recognition;
    try {
      recognition.start();
      setListening(true);
    } catch {
      setError("Impossibile avviare il microfono");
      setListening(false);
    }
  }, [supported, RecognitionClass, stop]);

  useEffect(() => stop, [stop]);

  return { supported, listening, transcript, error, start, stop };
}
