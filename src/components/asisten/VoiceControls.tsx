"use client";

import { Mic, MicOff, Volume2, VolumeX, RotateCcw } from "lucide-react";

interface VoiceControlsProps {
  isListening: boolean;
  isSpeaking: boolean;
  isMuted: boolean;
  voiceSupported: boolean;
  onToggleListen: () => void;
  onToggleMute: () => void;
  onReset: () => void;
}

export default function VoiceControls({
  isListening,
  isSpeaking,
  isMuted,
  voiceSupported,
  onToggleListen,
  onToggleMute,
  onReset,
}: VoiceControlsProps) {
  return (
    <div className="flex items-center gap-3">
      {/* Mic button */}
      <button
        onClick={onToggleListen}
        disabled={!voiceSupported}
        className={`relative flex items-center justify-center w-12 h-12 rounded-full transition-all duration-300 ${
          isListening
            ? "bg-red-500 text-white shadow-lg shadow-red-500/30 scale-110"
            : voiceSupported
            ? "bg-emerald-600 text-white hover:bg-emerald-700 shadow-md"
            : "bg-gray-200 text-gray-400 cursor-not-allowed"
        }`}
        title={voiceSupported ? "Klik untuk berbicara" : "Browser tidak mendukung voice"}
      >
        {isListening && (
          <span className="absolute inset-0 rounded-full bg-red-500 animate-ping opacity-30" />
        )}
        {isListening ? (
          <MicOff className="w-5 h-5 relative z-10" />
        ) : (
          <Mic className="w-5 h-5 relative z-10" />
        )}
      </button>

      {/* Speaker toggle */}
      <button
        onClick={onToggleMute}
        className={`flex items-center justify-center w-10 h-10 rounded-full transition-all ${
          isMuted
            ? "bg-gray-200 text-gray-500 hover:bg-gray-300"
            : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
        }`}
        title={isMuted ? "Suara aktif" : "Bisukan"}
      >
        {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
      </button>

      {/* Reset */}
      <button
        onClick={onReset}
        className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100 text-gray-600 hover:bg-gray-200 transition-all"
        title="Reset percakapan"
      >
        <RotateCcw className="w-4 h-4" />
      </button>

      {/* Status indicators */}
      <div className="flex-1 text-right">
        {!voiceSupported && (
          <span className="text-xs text-amber-600">
            Mikrofon tidak tersedia — gunakan teks
          </span>
        )}
        {voiceSupported && !isListening && !isSpeaking && (
          <span className="text-xs text-gray-400">
            Klik mikrofon — browser akan minta izin sekali
          </span>
        )}
      </div>
    </div>
  );
}
