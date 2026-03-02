"use client";

import { useState, useCallback, useEffect } from "react";

interface VoiceInputProps {
  value: string;
  onChange: (value: string) => void;
  language?: string;
  placeholder?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const SpeechRecognition =
  typeof window !== "undefined"
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

export default function VoiceInput({
  value,
  onChange,
  language = "en-IN",
  placeholder = "Speak or type...",
}: VoiceInputProps) {
  const [listening, setListening] = useState(false);
  const [recognition, setRecognition] = useState<{ start: () => void; stop: () => void } | null>(null);

  useEffect(() => {
    if (!SpeechRecognition) return;
    const rec = new SpeechRecognition();
    rec.continuous = true;
    rec.interimResults = true;
    rec.lang = language;
    rec.onresult = (event: { results: { length: number }; resultIndex: number }) => {
      let final = "";
      let interim = "";
      const res = event.results as unknown as Array<{ 0: { transcript: string }; isFinal: boolean }>;
      for (let i = event.resultIndex; i < res.length; i++) {
        const transcript = res[i][0].transcript;
        if (res[i].isFinal) {
          final += transcript;
        } else {
          interim += transcript;
        }
      }
      if (final) {
        onChange(value ? `${value} ${final}` : final);
      } else if (interim) {
        onChange(value ? `${value} ${interim}` : interim);
      }
    };
    rec.onend = () => setListening(false);
    setRecognition(rec);
    return () => { try { (rec as { abort?: () => void }).abort?.(); } catch {} };
  }, [language]);

  const toggleListening = useCallback(() => {
    if (!recognition) return;
    if (listening) {
      recognition.stop();
      setListening(false);
    } else {
      recognition.start();
      setListening(true);
    }
  }, [recognition, listening]);

  return (
    <div className="space-y-2">
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full px-4 py-3 border border-slate-300 rounded-lg min-h-[120px] focus:ring-2 focus:ring-blue-500"
        rows={4}
      />
      {SpeechRecognition && (
        <button
          type="button"
          onClick={toggleListening}
          className={`px-4 py-2 rounded-lg font-medium ${
            listening
              ? "bg-red-500 text-white"
              : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {listening ? "Stop" : "Voice Input (en-IN)"}
        </button>
      )}
    </div>
  );
}
