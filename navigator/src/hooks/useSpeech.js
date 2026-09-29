// ═══════════════════════════════════════════════════════════════
// useSpeech — audioguida basata su SpeechSynthesis.
//
// Il server fornisce i testi, non file audio: l'audioguida è la sintesi
// vocale del browser che legge il testo dell'opera al livello scelto.
//
// Dove SpeechSynthesis non è disponibile (o le voci italiane mancano),
// l'hook resta utilizzabile in modalità simulata: la barra avanza sulla
// durata stimata del testo, così i comandi e l'interfaccia restano coerenti.
// ═══════════════════════════════════════════════════════════════

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { SPEECH_LANG } from "@/constants/config";
import { estimateSeconds } from "@/lib/content";

const TICK_MS = 200;

function getSynth() {
  return typeof window !== "undefined" ? window.speechSynthesis : null;
}

/** Voce italiana disponibile, con preferenza per quelle locali al dispositivo. */
function pickItalianVoice(synth) {
  const voices = synth?.getVoices?.() || [];
  const italian = voices.filter((v) => v.lang?.toLowerCase().startsWith("it"));
  if (italian.length === 0) return null;
  return italian.find((v) => v.localService) || italian[0];
}

export default function useSpeech({ text, rate = 1, onEnd } = {}) {
  const synth = getSynth();
  const supported = Boolean(synth) && typeof window.SpeechSynthesisUtterance === "function";

  const [playing, setPlaying] = useState(false);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [charProgress, setCharProgress] = useState(null);
  const [voiceReady, setVoiceReady] = useState(false);

  const utteranceRef = useRef(null);
  const tickRef = useRef(null);
  const onEndRef = useRef(onEnd);
  onEndRef.current = onEnd;

  /** Durata stimata alla velocità corrente. */
  const duration = useMemo(
    () => Math.max(1, estimateSeconds(text) / (rate || 1)),
    [text, rate],
  );

  const progress = useMemo(() => {
    if (charProgress != null) return Math.min(1, charProgress);
    return Math.min(1, elapsed / duration);
  }, [charProgress, elapsed, duration]);

  // Le voci arrivano in modo asincrono su Chrome.
  useEffect(() => {
    if (!supported) return undefined;
    const check = () => setVoiceReady(true);
    if (synth.getVoices().length > 0) setVoiceReady(true);
    synth.addEventListener?.("voiceschanged", check);
    return () => synth.removeEventListener?.("voiceschanged", check);
  }, [supported, synth]);

  // ── Cronometro ──────────────────────────────────────────────────

  const startTicking = useCallback(() => {
    clearInterval(tickRef.current);
    tickRef.current = setInterval(() => {
      setElapsed((e) => e + TICK_MS / 1000);
    }, TICK_MS);
  }, []);

  const stopTicking = useCallback(() => {
    clearInterval(tickRef.current);
    tickRef.current = null;
  }, []);

  // ── Controlli ───────────────────────────────────────────────────

  const stop = useCallback(() => {
    stopTicking();
    if (supported) synth.cancel();
    utteranceRef.current = null;
    setPlaying(false);
    setPaused(false);
    setElapsed(0);
    setCharProgress(null);
  }, [supported, synth, stopTicking]);

  const play = useCallback(() => {
    if (!text) return;
    setElapsed(0);
    setCharProgress(null);
    setPaused(false);
    setPlaying(true);
    startTicking();

    if (!supported) return; // modalità simulata: avanza solo il cronometro

    synth.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = SPEECH_LANG;
    utterance.rate = rate;
    const voice = pickItalianVoice(synth);
    if (voice) utterance.voice = voice;

    utterance.onboundary = (event) => {
      if (event.charIndex != null && text.length > 0) {
        setCharProgress(event.charIndex / text.length);
      }
    };
    utterance.onend = () => {
      stopTicking();
      setPlaying(false);
      setPaused(false);
      setCharProgress(1);
      onEndRef.current?.();
    };
    utterance.onerror = () => {
      stopTicking();
      setPlaying(false);
      setPaused(false);
    };

    utteranceRef.current = utterance;
    synth.speak(utterance);
  }, [text, rate, supported, synth, startTicking, stopTicking]);

  const pause = useCallback(() => {
    stopTicking();
    setPaused(true);
    setPlaying(false);
    if (supported) synth.pause();
  }, [supported, synth, stopTicking]);

  const resume = useCallback(() => {
    setPaused(false);
    setPlaying(true);
    startTicking();
    if (supported) synth.resume();
  }, [supported, synth, startTicking]);

  const toggle = useCallback(() => {
    if (playing) pause();
    else if (paused) resume();
    else play();
  }, [playing, paused, pause, resume, play]);

  // In modalità simulata nessun evento segnala la fine: la deduciamo dal tempo.
  useEffect(() => {
    if (supported || !playing) return;
    if (elapsed >= duration) {
      stopTicking();
      setPlaying(false);
      setCharProgress(1);
      onEndRef.current?.();
    }
  }, [supported, playing, elapsed, duration, stopTicking]);

  // Cambiare testo (nuova opera o nuovo livello) azzera la riproduzione.
  useEffect(() => {
    stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text]);

  // La sintesi vocale è globale: va fermata all'uscita dalla schermata.
  useEffect(() => () => {
    clearInterval(tickRef.current);
    getSynth()?.cancel();
  }, []);

  return {
    supported: supported && voiceReady,
    simulated: !supported,
    playing,
    paused,
    progress,
    elapsed: Math.min(elapsed, duration),
    duration,
    play,
    pause,
    resume,
    toggle,
    stop,
  };
}
